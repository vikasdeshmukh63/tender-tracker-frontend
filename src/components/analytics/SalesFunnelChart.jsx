import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const STATUS_CONFIG = {
  new:         { label: "New",         color: "#60a5fa" },
  in_progress: { label: "In Progress", color: "#f59e0b" },
  submitted:   { label: "Submitted",   color: "#a78bfa" },
  won:         { label: "Won",         color: "#10b981" },
  lost:        { label: "Lost",        color: "#f87171" },
  on_hold:     { label: "On Hold",     color: "#9ca3af" },
};

export default function SalesFunnelChart({ tenders }) {
  const data = useMemo(() => {
    const map = {};
    tenders.forEach((t) => {
      const key = t.status || "new";
      if (!map[key]) map[key] = { name: STATUS_CONFIG[key]?.label || key, value: 0, color: STATUS_CONFIG[key]?.color || "#ccc" };
      map[key].value++;
    });
    return Object.values(map);
  }, [tenders]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const total = data.reduce((s, d) => s + d.value, 0);
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-800">{payload[0].name}</p>
        <p className="text-gray-600">Count: <span className="font-bold">{payload[0].value}</span></p>
        <p className="text-gray-400">{Math.round((payload[0].value / total) * 100)}% of total</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Sales Funnel Breakdown</h3>
      <p className="text-xs text-gray-400 mb-4">Distribution of tenders across all statuses</p>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" paddingAngle={3}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}