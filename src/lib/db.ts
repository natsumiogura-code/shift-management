import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./data/local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let initialized = false;

export async function getDb() {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
  return client;
}

async function initDb() {
  await client.batch([
    `CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '正社員',
      created_at TEXT NOT NULL DEFAULT (date('now','localtime'))
    )`,
    `CREATE TABLE IF NOT EXISTS shift_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3B82F6'
    )`,
    `CREATE TABLE IF NOT EXISTS shift_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_type_id INTEGER NOT NULL,
      required_count INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (shift_type_id) REFERENCES shift_types(id)
    )`,
    `CREATE TABLE IF NOT EXISTS shift_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      shift_type_id INTEGER NOT NULL,
      priority INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (staff_id) REFERENCES staff(id),
      FOREIGN KEY (shift_type_id) REFERENCES shift_types(id)
    )`,
    `CREATE TABLE IF NOT EXISTS shift_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      shift_type_id INTEGER NOT NULL,
      is_auto_assigned INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (staff_id) REFERENCES staff(id),
      FOREIGN KEY (shift_type_id) REFERENCES shift_types(id)
    )`,
  ]);

  // 初期データ挿入
  const result = await client.execute("SELECT COUNT(*) as cnt FROM shift_types");
  const count = result.rows[0].cnt as number;
  if (count === 0) {
    await client.batch([
      "INSERT INTO shift_types (name, start_time, end_time, color) VALUES ('早番', '07:00', '16:00', '#22C55E')",
      "INSERT INTO shift_types (name, start_time, end_time, color) VALUES ('日勤', '09:00', '18:00', '#3B82F6')",
      "INSERT INTO shift_types (name, start_time, end_time, color) VALUES ('遅番', '11:00', '20:00', '#F59E0B')",
      "INSERT INTO shift_types (name, start_time, end_time, color) VALUES ('夜勤', '16:00', '09:00', '#8B5CF6')",
      "INSERT INTO shift_requirements (shift_type_id, required_count) VALUES (1, 2)",
      "INSERT INTO shift_requirements (shift_type_id, required_count) VALUES (2, 3)",
      "INSERT INTO shift_requirements (shift_type_id, required_count) VALUES (3, 2)",
      "INSERT INTO shift_requirements (shift_type_id, required_count) VALUES (4, 1)",
    ]);
  }
}
