import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from "recharts";
import ChartFilter, { getDateRangeFromFilter } from "@/components/charts/ChartFilter";

const STATUS_COLORS = {
  new: "#6366f1",
  in_progress: "#f59e0b",
  submitted: "#3b82f6",
  won: "#10b981",
  lost: "#ef4444",
  on_hold: "#6b7280",
};

const OPP_COLORS = ["#00A3E0", "#10b981", "#f59e0b", "#6366f1"];

const MONTHS_ORDER = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function DashboardAnalytics({ tenders }) {
  const [barFilter, setBarFilter] = useState("All Time");
  const [winRateFilter, setWinRateFilter] = useState("All Time");
  const [statusFilter, setStatusFilter] = useState("All Time");
  const [oppFilter, setOppFilter] = useState("All Time");

  // Value won/lost per month (based on submission_date/date/created_date)
  const monthlyData = useMemo(() => {
    const startDate = getDateRangeFromFilter(barFilter);
    const map = {};
    tenders.forEach((t) => {
      const d = t.submission_date || t.date || t.created_date;
      if (!d) return;
      const dt = new Date(d);
      if (startDate && dt < startDate) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { label: key, won: 0, lost: 0, total: 0 };
      map[key].total += t.estimated_value || 0;
      if (t.status === "won") map[key].won += t.estimated_value || 0;
      if (t.status === "lost") map[key].lost += t.estimated_value || 0;
    });
    return Object.values(map)
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-8);
  }, [tenders, barFilter]);

  // Conversion rates by status
  const statusData = useMemo(() => {
    const startDate = getDateRangeFromFilter(statusFilter);
    const map = {};
    tenders.forEach((t) => {
      if (startDate && t.created_date) {
        const createdDate = new Date(t.created_date);
        if (createdDate < startDate) return;
      }
      const s = t.status || "new";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({
      name: status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
      value: count,
      color: STATUS_COLORS[status] || "#6b7280",
    }));
  }, [tenders, statusFilter]);

  // Opp type distribution
  const oppTypeData = useMemo(() => {
    const startDate = getDateRangeFromFilter(oppFilter);
    const map = {};
    tenders.forEach((t) => {
      if (startDate && t.created_date) {
        const createdDate = new Date(t.created_date);
        if (createdDate < startDate) return;
      }
      const k = t.opp_type || "other";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([type, count], i) => ({
      name: type.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
      value: count,
      color: OPP_COLORS[i % OPP_COLORS.length],
    }));
  }, [tenders, oppFilter]);

  // Win rate trend per month
  const winRateTrend = useMemo(() => {
    const startDate = getDateRangeFromFilter(winRateFilter);
    const map = {};
    tenders.forEach((t) => {
      const d = t.submission_date || t.date || t.created_date;
      if (!d) return;
      const dt = new Date(d);
      if (startDate && dt < startDate) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { label: key, total: 0, won: 0 };
      map[key].total += 1;
      if (t.status === "won") map[key].won += 1;
    });
    return Object.values(map)
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-8)
      .map((d) => ({
      ...d,
      winRate: d.total ? Math.round((d.won / d.total) * 100) : 0,
    }));
  }, [tenders, winRateFilter]);

  const fmt = (v) => {
    if (v >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`;
    if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
    return `₹${v.toLocaleString("en-IN")}`;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Row 1: Monthly Value + Win Rate */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Won vs Lost Value per Month */}
         <div className="bg-white rounded-2xl border border-gray-100 p-5">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-semibold text-gray-700">Won vs Lost Value by Month (₹)</h3>
             <ChartFilter onFilterChange={setBarFilter} />
           </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickFormatter={(v) => v.split(" ")[0].slice(0, 3) + " " + v.split(" ")[1]} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} width={55} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="won" name="Won" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lost" name="Lost" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win Rate Trend */}
         <div className="bg-white rounded-2xl border border-gray-100 p-5">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-semibold text-gray-700">Win Rate Trend (%)</h3>
             <ChartFilter onFilterChange={setWinRateFilter} />
           </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={winRateTrend} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickFormatter={(v) => v.split(" ")[0].slice(0, 3) + " " + v.split(" ")[1]} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="winRate" name="Win Rate" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Status Distribution + Opp Type Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Status pie */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Conversion by Status</h3>
            <ChartFilter onFilterChange={setStatusFilter} />
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={renderCustomLabel}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 flex-1">
              {statusData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-600 flex-1">{d.name}</span>
                  <span className="font-semibold text-gray-800">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Opp type pie */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Opportunity Type Distribution</h3>
            <ChartFilter onFilterChange={setOppFilter} />
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={oppTypeData} dataKey="value" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={renderCustomLabel}>
                  {oppTypeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 flex-1">
              {oppTypeData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-600 flex-1">{d.name}</span>
                  <span className="font-semibold text-gray-800">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}