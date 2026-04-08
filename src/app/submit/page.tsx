"use client";
import { useEffect, useState } from "react";

interface Staff {
  id: number;
  name: string;
}

interface ShiftType {
  id: number;
  name: string;
  color: string;
  start_time: string;
  end_time: string;
}

interface RequestEntry {
  date: string;
  shift_type_id: number;
  priority: number;
}

export default function SubmitPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number | "">("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [requests, setRequests] = useState<Map<string, RequestEntry>>(new Map());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/staff").then((r) => r.json()).then(setStaff);
    fetch("/api/shift-types").then((r) => r.json()).then(setShiftTypes);
  }, []);

  // スタッフ選択時に既存リクエストを読み込む
  useEffect(() => {
    if (!selectedStaff) return;
    fetch(`/api/shift-requests?year=${year}&month=${month}&staff_id=${selectedStaff}`)
      .then((r) => r.json())
      .then((data) => {
        const map = new Map<string, RequestEntry>();
        for (const d of data) {
          const key = `${d.date}-${d.priority}`;
          map.set(key, {
            date: d.date,
            shift_type_id: d.shift_type_id,
            priority: d.priority,
          });
        }
        setRequests(map);
      });
  }, [selectedStaff, year, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const dates: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(
      `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  }

  const getDayOfWeek = (dateStr: string) => {
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return days[new Date(dateStr).getDay()];
  };

  const getDayColor = (dateStr: string) => {
    const day = new Date(dateStr).getDay();
    if (day === 0) return "text-red-600";
    if (day === 6) return "text-blue-600";
    return "";
  };

  const setRequest = (date: string, priority: number, shiftTypeId: number | null) => {
    const newRequests = new Map(requests);
    const key = `${date}-${priority}`;
    if (shiftTypeId === null) {
      newRequests.delete(key);
    } else {
      newRequests.set(key, { date, shift_type_id: shiftTypeId, priority });
    }
    setRequests(newRequests);
  };

  const getRequest = (date: string, priority: number): number | "" => {
    const key = `${date}-${priority}`;
    const req = requests.get(key);
    return req ? req.shift_type_id : "";
  };

  const submit = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    setMessage("");
    const requestList = Array.from(requests.values());
    await fetch("/api/shift-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: selectedStaff, requests: requestList }),
    });
    setSaving(false);
    setMessage("シフト希望を提出しました！");
    setTimeout(() => setMessage(""), 3000);
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        シフト希望提出
      </h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              スタッフ選択
            </label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value ? Number(e.target.value) : "")}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-48"
            >
              <option value="">選択してください</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
              &lt;
            </button>
            <span className="font-medium text-lg">
              {year}年{month}月
            </span>
            <button onClick={nextMonth} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
              &gt;
            </button>
          </div>
        </div>
      </div>

      {selectedStaff && (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 text-left w-28">
                    日付
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 text-left">
                    第1希望
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 text-left">
                    第2希望
                  </th>
                </tr>
              </thead>
              <tbody>
                {dates.map((date) => {
                  const day = Number(date.split("-")[2]);
                  const dow = getDayOfWeek(date);
                  return (
                    <tr key={date} className="border-b hover:bg-gray-50">
                      <td className={`px-4 py-2 text-sm font-medium ${getDayColor(date)}`}>
                        {day}日 ({dow})
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={getRequest(date, 1)}
                          onChange={(e) =>
                            setRequest(date, 1, e.target.value ? Number(e.target.value) : null)
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-full max-w-40"
                        >
                          <option value="">休み</option>
                          {shiftTypes.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.start_time}〜{st.end_time})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={getRequest(date, 2)}
                          onChange={(e) =>
                            setRequest(date, 2, e.target.value ? Number(e.target.value) : null)
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-full max-w-40"
                        >
                          <option value="">なし</option>
                          {shiftTypes.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.start_time}〜{st.end_time})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={submit}
              disabled={saving}
              className="bg-green-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {saving ? "提出中..." : "シフト希望を提出"}
            </button>
            {message && (
              <span className="text-green-600 font-medium text-lg">
                {message}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
