import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  const result = await db.execute(
    `SELECT sr.id, sr.shift_type_id, sr.required_count, st.name as shift_name
     FROM shift_requirements sr
     JOIN shift_types st ON sr.shift_type_id = st.id
     ORDER BY sr.shift_type_id`
  );
  return NextResponse.json(result.rows);
}

export async function PUT(req: NextRequest) {
  const { id, required_count } = await req.json();
  const db = await getDb();
  await db.execute({
    sql: "UPDATE shift_requirements SET required_count = ? WHERE id = ?",
    args: [required_count, id],
  });
  return NextResponse.json({ success: true });
}
