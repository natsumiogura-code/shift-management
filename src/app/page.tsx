"use client";
import { useEffect, useState } from "react";

interface StaffMember {
  id: number;
  name: string;
}

interface ShiftType {
  id: number;
  name: string;
  color: string;
}

export default function Dashboard() {
  const [staffCount, setStaffCount] = useState(0);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [submittedStaff, setSubmittedStaff] = useState<string[]>([]);
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    fetch("/api/staff")
      .then((r) => r.json())
      .then((data) => {
        setStaffCount(data.length);
        setAllStaff(data);
      });
    fetch("/api/shift-types")
      .then((r) => r.json())
      .then(setShiftTypes);
    fetch(`/api/shift-requests?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        setRequestCount(data.length);
        const staffNames = [...new Set(data.map((d: { staff_name: string }) => d.staff_name))] as string[];
        setSubmittedStaff(staffNames);
      });
    fetch(`/api/shift-assignments?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) => setAssignmentCount(data.length));
  }, [year, month]);

  const notSubmitted = allStaff.filter(
    (s) => !submittedStaff.includes(s.name)
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        ダッシュボード — {year}年{month}月
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">登録スタッフ数</div>
          <div className="text-3xl font-bold text-blue-600">{staffCount}人</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">シフト区分</div>
          <div className="text-3xl font-bold text-green-600">
            {shiftTypes.length}種類
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">シフト希望提出数</div>
          <div className="text-3xl font-bold text-orange-600">
            {requestCount}件
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">割り当て済みシフト</div>
          <div className="text-3xl font-bold text-purple-600">
            {assignmentCount}件
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            提出状況
          </h2>
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>
                提出済み: {submittedStaff.length}/{staffCount}人
              </span>
              <span>
                {staffCount > 0
                  ? Math.round((submittedStaff.length / staffCount) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{
                  width: `${staffCount > 0 ? (submittedStaff.length / staffCount) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
          {submittedStaff.length > 0 && (
            <div className="mb-3">
              <div className="text-sm text-green-600 font-medium mb-1">
                提出済み:
              </div>
              <div className="flex flex-wrap gap-1">
                {submittedStaff.map((name) => (
                  <span
                    key={name}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {notSubmitted.length > 0 && (
            <div>
              <div className="text-sm text-red-600 font-medium mb-1">
                未提出:
              </div>
              <div className="flex flex-wrap gap-1">
                {notSubmitted.map((s) => (
                  <span
                    key={s.id}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            シフト区分
          </h2>
          <div className="space-y-2">
            {shiftTypes.map((st) => (
              <div
                key={st.id}
                className="flex items-center gap-3 p-2 rounded"
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: st.color }}
                ></div>
                <span className="font-medium">{st.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
