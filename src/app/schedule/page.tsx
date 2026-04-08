"use client";
import { useEffect, useState, useCallback } from "react";

interface ShiftType {
  id: number;
  name: string;
  color: string;
}

interface Assignment {
  id: number;
  staff_id: number;
  date: string;
  shift_type_id: number;
  staff_name: string;
  shift_name: string;
  color: string;
}

interface ShiftRequirement {
  shift_type_id: number;
  required_count: number;
  shift_name: string;
}

export default function SchedulePage() {
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [requirements, setRequirements] = useState<ShiftRequirement[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState("");
  const [requestCount, setRequestCount] = useState(0);

  const fetchData = useCallback(() => {
    fetch("/api/shift-types").then((r) => r.json()).then(setShiftTypes);
    fetch("/api/shift-requirements").then((r) => r.json()).then(setRequirements);
    fetch(`/api/shift-assignments?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then(setAssignments);
    fetch(`/api/shift-requests?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) => setRequestCount(data.length));
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    if (day === 0) return "bg-red-50";
    if (day === 6) return "bg-blue-50";
    return "";
  };

  const getAssignments = (date: string, shiftTypeId: number): Assignment[] => {
    return assignments.filter(
      (a) => a.date === date && a.shift_type_id === shiftTypeId
    );
  };

  const getRequiredCount = (shiftTypeId: number): number => {
    const req = requirements.find((r) => r.shift_type_id === shiftTypeId);
    return req ? req.required_count : 0;
  };

  const autoAssign = async () => {
    if (requestCount === 0) {
      setMessage("シフト希望が提出されていません");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (!confirm(`${year}年${month}月のシフトを自動振り分けしますか？\n既存の割り当ては上書きされます。`)) {
      return;
    }
    setAssigning(true);
    setMessage("");
    const res = await fetch("/api/auto-assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month }),
    });
    const data = await res.json();
    setAssigning(false);
    setMessage(`自動振り分け完了: ${data.count}件割り当て`);
    fetchData();
    setTimeout(() => setMessage(""), 5000);
  };

  const clearAssignments = async () => {
    if (!confirm(`${year}年${month}月の割り当てをすべてクリアしますか？`)) return;
    await fetch("/api/shift-assignments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month }),
    });
    fetchData();
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">シフト表</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
              &lt;
            </button>
            <span className="font-medium text-lg min-w-32 text-center">
              {year}年{month}月
            </span>
            <button onClick={nextMonth} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
              &gt;
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              提出済み希望: {requestCount}件 / 割り当て済み: {assignments.length}件
            </span>
            <button
              onClick={autoAssign}
              disabled={assigning}
              className="bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors text-lg"
            >
              {assigning ? "振り分け中..." : "自動振り分け"}
            </button>
            {assignments.length > 0 && (
              <button
                onClick={clearAssignments}
                className="bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm hover:bg-red-200 transition-colors"
              >
                クリア
              </button>
            )}
          </div>
        </div>
        {message && (
          <div className="mt-3 text-green-600 font-medium">{message}</div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-3 py-2 text-sm font-medium text-gray-500 sticky left-0 bg-gray-50 min-w-20">
                日付
              </th>
              {shiftTypes.map((st) => (
                <th
                  key={st.id}
                  className="border px-3 py-2 text-sm font-medium min-w-32"
                  style={{ color: st.color }}
                >
                  {st.name}
                  <div className="text-xs text-gray-400 font-normal">
                    (必要: {getRequiredCount(st.id)}人)
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((date) => {
              const day = Number(date.split("-")[2]);
              const dow = getDayOfWeek(date);
              return (
                <tr key={date} className={getDayColor(date)}>
                  <td className={`border px-3 py-2 text-sm font-medium sticky left-0 ${getDayColor(date) || "bg-white"} ${
                    new Date(date).getDay() === 0 ? "text-red-600" : new Date(date).getDay() === 6 ? "text-blue-600" : ""
                  }`}>
                    {day} ({dow})
                  </td>
                  {shiftTypes.map((st) => {
                    const dayAssignments = getAssignments(date, st.id);
                    const required = getRequiredCount(st.id);
                    const isFilled = dayAssignments.length >= required;
                    return (
                      <td
                        key={st.id}
                        className={`border px-2 py-1 text-sm ${
                          !isFilled && required > 0 && assignments.length > 0
                            ? "bg-red-50"
                            : ""
                        }`}
                      >
                        <div className="flex flex-wrap gap-1">
                          {dayAssignments.map((a) => (
                            <span
                              key={a.id}
                              className="px-2 py-0.5 rounded text-xs text-white"
                              style={{ backgroundColor: a.color }}
                            >
                              {a.staff_name}
                            </span>
                          ))}
                        </div>
                        {!isFilled && required > 0 && assignments.length > 0 && (
                          <div className="text-xs text-red-400 mt-1">
                            あと{required - dayAssignments.length}人
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-3 flex-wrap">
        {shiftTypes.map((st) => (
          <div key={st.id} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: st.color }}
            ></span>
            <span className="text-sm text-gray-600">{st.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
