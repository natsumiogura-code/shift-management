import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  const result = await db.execute("SELECT id, name, role, created_at FROM staff ORDER BY id");
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const { name, role } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
  }
  const db = await getDb();
  const result = await db.execute({
    sql: "INSERT INTO staff (name, role) VALUES (?, ?) RETURNING id, name, role, created_at",
    args: [name, role || "正社員"],
  });
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM shift_requests WHERE staff_id = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM shift_assignments WHERE staff_id = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM staff WHERE id = ?", args: [id] });
  return NextResponse.json({ success: true });
}
