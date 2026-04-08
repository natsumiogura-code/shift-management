import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const staff_id = searchParams.get("staff_id");

  const db = await getDb();
  let sql = `SELECT sr.id, sr.staff_id, sr.date, sr.shift_type_id, sr.priority,
     s.name as staff_name, st.name as shift_name, st.color
     FROM shift_requests sr
     JOIN staff s ON sr.staff_id = s.id
     JOIN shift_types st ON sr.shift_type_id = st.id
     WHERE 1=1`;
  const args: (string | number)[] = [];

  if (year && month) {
    const monthPrefix = `${year}-${String(Number(month)).padStart(2, "0")}%`;
    sql += " AND sr.date LIKE ?";
    args.push(monthPrefix);
  }
  if (staff_id) {
    sql += " AND sr.staff_id = ?";
    args.push(Number(staff_id));
  }
  sql += " ORDER BY sr.date, sr.priority";

  const result = await db.execute({ sql, args });
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const { staff_id, requests } = await req.json();
  const db = await getDb();

  if (requests.length > 0) {
    const monthPrefix = requests[0].date.substring(0, 7) + "%";
    await db.execute({
      sql: "DELETE FROM shift_requests WHERE staff_id = ? AND date LIKE ?",
      args: [staff_id, monthPrefix],
    });
  }

  for (const r of requests) {
    await db.execute({
      sql: "INSERT INTO shift_requests (staff_id, date, shift_type_id, priority) VALUES (?, ?, ?, ?)",
      args: [staff_id, r.date, r.shift_type_id, r.priority],
    });
  }
  return NextResponse.json({ success: true });
}
