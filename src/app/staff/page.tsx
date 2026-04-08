"use client";
import { useEffect, useState } from "react";

interface Staff {
  id: number;
  name: string;
  role: string;
  created_at: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("正社員");
  const [loading, setLoading] = useState(false);

  const fetchStaff = () => {
    fetch("/api/staff")
      .then((r) => r.json())
      .then(setStaff);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const addStaff = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role }),
    });
    setName("");
    setRole("正社員");
    fetchStaff();
    setLoading(false);
  };

  const deleteStaff = async (id: number, staffName: string) => {
    if (!confirm(`${staffName}さんを削除しますか？`)) return;
    await fetch("/api/staff", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchStaff();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">スタッフ管理</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">新規スタッフ追加</h2>
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名前
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="山田 太郎"
              onKeyDown={(e) => e.key === "Enter" && addStaff()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              雇用形態
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="正社員">正社員</option>
              <option value="パート">パート</option>
              <option value="派遣">派遣</option>
            </select>
          </div>
          <button
            onClick={addStaff}
            disabled={loading || !name.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            追加
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                ID
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                名前
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                雇用形態
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                登録日
              </th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm">{s.id}</td>
                <td className="px-6 py-3 text-sm font-medium">{s.name}</td>
                <td className="px-6 py-3 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      s.role === "正社員"
                        ? "bg-blue-100 text-blue-700"
                        : s.role === "パート"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {s.role}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-gray-500">
                  {s.created_at}
                </td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => deleteStaff(s.id, s.name)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  スタッフが登録されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
