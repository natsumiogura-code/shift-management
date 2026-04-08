import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  const db = await getDb();
  let sql = `SELECT sa.id, sa.staff_id, sa.date, sa.shift_type_id, sa.is_auto_assigned,
     s.name as staff_name, st.name as shift_name, st.color
     FROM shift_assignments sa
     JOIN staff s ON sa.staff_id = s.id
     JOIN shift_types st ON sa.shift_type_id = st.id
     WHERE 1=1`;
  const args: (string | number)[] = [];

  if (year && month) {
    const monthPrefix = `${year}-${String(Number(month)).padStart(2, "0")}%`;
    sql += " AND sa.date LIKE ?";
    args.push(monthPrefix);
  }
  sql += " ORDER BY sa.date, st.id";

  const result = await db.execute({ sql, args });
  return NextResponse.json(result.rows);
}

export async function DELETE(req: NextRequest) {
  const { year, month } = await req.json();
  const db = await getDb();
  const monthPrefix = `${year}-${String(Number(month)).padStart(2, "0")}%`;
  await db.execute({
    sql: "DELETE FROM shift_assignments WHERE date LIKE ?",
    args: [monthPrefix],
  });
  return NextResponse.json({ success: true });
}
