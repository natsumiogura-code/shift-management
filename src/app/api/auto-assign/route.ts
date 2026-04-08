import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { year, month } = await req.json();
  const db = await getDb();
  const monthPrefix = `${year}-${String(Number(month)).padStart(2, "0")}`;

  // 既存の割り当てを削除
  await db.execute({
    sql: "DELETE FROM shift_assignments WHERE date LIKE ?",
    args: [monthPrefix + "%"],
  });

  // 必要人数を取得
  const reqResult = await db.execute("SELECT shift_type_id, required_count FROM shift_requirements");
  const requirements = reqResult.rows as unknown as { shift_type_id: number; required_count: number }[];

  // 全リクエストを取得
  const requestResult = await db.execute({
    sql: "SELECT staff_id, date, shift_type_id, priority FROM shift_requests WHERE date LIKE ? ORDER BY priority ASC",
    args: [monthPrefix + "%"],
  });
  const requests = requestResult.rows as unknown as {
    staff_id: number;
    date: string;
    shift_type_id: number;
    priority: number;
  }[];

  // 月の全日付
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(`${monthPrefix}-${String(d).padStart(2, "0")}`);
  }

  // 振り分けロジック
  const assigned: Map<string, Set<number>> = new Map();
  const staffDayAssigned: Map<string, number> = new Map();
  const staffMonthCount: Map<number, number> = new Map();
  let count = 0;

  for (const priority of [1, 2]) {
    const priorityRequests = requests.filter((r) => r.priority === priority);

    for (const date of dates) {
      for (const req of requirements) {
        const key = `${date}-${req.shift_type_id}`;
        if (!assigned.has(key)) assigned.set(key, new Set());
        const current = assigned.get(key)!;

        if (current.size < req.required_count) {
          const candidates = priorityRequests
            .filter(
              (r) =>
                r.date === date &&
                r.shift_type_id === req.shift_type_id &&
                !current.has(r.staff_id) &&
                !staffDayAssigned.has(`${r.staff_id}-${date}`)
            )
            .sort(
              (a, b) =>
                (staffMonthCount.get(a.staff_id) || 0) -
                (staffMonthCount.get(b.staff_id) || 0)
            );

          for (const c of candidates) {
            if (current.size >= req.required_count) break;
            current.add(c.staff_id);
            staffDayAssigned.set(`${c.staff_id}-${date}`, c.shift_type_id);
            staffMonthCount.set(c.staff_id, (staffMonthCount.get(c.staff_id) || 0) + 1);

            await db.execute({
              sql: "INSERT INTO shift_assignments (staff_id, date, shift_type_id, is_auto_assigned) VALUES (?, ?, ?, 1)",
              args: [c.staff_id, c.date, c.shift_type_id],
            });
            count++;
          }
        }
      }
    }
  }

  return NextResponse.json({ success: true, count });
}
