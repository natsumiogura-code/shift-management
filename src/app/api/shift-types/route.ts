import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  const result = await db.execute("SELECT id, name, start_time, end_time, color FROM shift_types ORDER BY id");
  return NextResponse.json(result.rows);
}

export async function PUT(req: NextRequest) {
  const { id, name, start_time, end_time, color } = await req.json();
  const db = await getDb();
  await db.execute({
    sql: "UPDATE shift_types SET name = ?, start_time = ?, end_time = ?, color = ? WHERE id = ?",
    args: [name, start_time, end_time, color, id],
  });
  return NextResponse.json({ success: true });
}
