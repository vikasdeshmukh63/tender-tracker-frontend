import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const formatCurrency = (v) => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
};

export default function PipelineByMonthChart({ tenders }) {
  const data = useMemo(() => {
    const map = {};
    tenders.forEach((t) => {
      const key = t.month
        ? `${t.month.slice(0, 3)} ${(t.year || "").slice(2)}`
        : t.date
        ? `${MONTHS[new Date(t.date).getMonth()]} ${String(new Date(t.date).getFullYear()).slice(2)}`
        : null;
      if (!key) return;
      if (!map[key]) map[key] = { label: key, pipeline: 0, won: 0, lost: 0, count: 0 };
      map[key].pipeline += t.estimated_value || 0;
      map[key].count++;
      if (t.status === "won") map[key].won += t.estimated_value || 0;
      if (t.status === "lost") map[key].lost += t.estimated_value || 0;
    });
    return Object.values(map).slice(-12);
  }, [tenders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        <p className="text-[#1e3a8a]">Total Pipeline: <span className="font-bold">{formatCurrency(d?.pipeline)}</span></p>
        <p className="text-emerald-600">Won Value: <span className="font-bold">{formatCurrency(d?.won)}</span></p>
        <p className="text-red-400">Lost Value: <span className="font-bold">{formatCurrency(d?.lost)}</span></p>
        <p className="text-gray-400 text-xs mt-1">Tenders: {d?.count}</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Total Pipeline Value by Month
      </h3>
      <p className="text-xs text-gray-400 mb-4">Pipeline vs won vs lost value breakdown per month</p>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: "#9ca3af" }} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="pipeline" name="Total Pipeline" radius={[4,4,0,0]} fill="#bfdbfe" />
            <Bar dataKey="won" name="Won Value" radius={[4,4,0,0]} fill="#10b981" />
            <Bar dataKey="lost" name="Lost Value" radius={[4,4,0,0]} fill="#fca5a5" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}