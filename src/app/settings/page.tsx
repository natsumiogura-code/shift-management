"use client";
import { useEffect, useState } from "react";

interface ShiftType {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
}

interface ShiftRequirement {
  id: number;
  shift_type_id: number;
  required_count: number;
  shift_name: string;
}

export default function SettingsPage() {
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [requirements, setRequirements] = useState<ShiftRequirement[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/shift-types")
      .then((r) => r.json())
      .then(setShiftTypes);
    fetch("/api/shift-requirements")
      .then((r) => r.json())
      .then(setRequirements);
  }, []);

  const updateShiftType = (id: number, field: string, value: string) => {
    setShiftTypes((prev) =>
      prev.map((st) => (st.id === id ? { ...st, [field]: value } : st))
    );
  };

  const updateRequirement = (id: number, count: number) => {
    setRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, required_count: count } : r))
    );
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    for (const st of shiftTypes) {
      await fetch("/api/shift-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(st),
      });
    }
    for (const req of requirements) {
      await fetch("/api/shift-requirements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: req.id, required_count: req.required_count }),
      });
    }
    setSaving(false);
    setMessage("保存しました");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">設定</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">シフト区分設定</h2>
        <div className="space-y-3">
          {shiftTypes.map((st) => (
            <div key={st.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="color"
                value={st.color}
                onChange={(e) => updateShiftType(st.id, "color", e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">名称</label>
                  <input
                    type="text"
                    value={st.name}
                    onChange={(e) => updateShiftType(st.id, "name", e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">開始時間</label>
                  <input
                    type="time"
                    value={st.start_time}
                    onChange={(e) => updateShiftType(st.id, "start_time", e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">終了時間</label>
                  <input
                    type="time"
                    value={st.end_time}
                    onChange={(e) => updateShiftType(st.id, "end_time", e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">時間帯ごとの必要人数</h2>
        <div className="space-y-3">
          {requirements.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
            >
              <span className="font-medium w-20">{req.shift_name}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateRequirement(req.id, Math.max(0, req.required_count - 1))
                  }
                  className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                >
                  -
                </button>
                <span className="w-10 text-center text-lg font-bold">
                  {req.required_count}
                </span>
                <button
                  onClick={() =>
                    updateRequirement(req.id, req.required_count + 1)
                  }
                  className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                >
                  +
                </button>
                <span className="text-sm text-gray-500 ml-2">人</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {saving ? "保存中..." : "設定を保存"}
        </button>
        {message && (
          <span className="text-green-600 font-medium">{message}</span>
        )}
      </div>
    </div>
  );
}
