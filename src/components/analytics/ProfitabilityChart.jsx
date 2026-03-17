import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ProfitabilityChart({ tenders }) {
  const data = useMemo(() => {
    const map = {};
    tenders.forEach((t) => {
      const key = t.opp_type || "other";
      const labels = { new_business: "New Business", renewal: "Renewal", upsell: "Upsell", cross_sell: "Cross-sell", other: "Other" };
      const name = labels[key] || key;
      if (!map[name]) map[name] = { name, total: 0, won: 0, totalValue: 0, wonValue: 0 };
      map[name].total++;
      map[name].totalValue += t.estimated_value || 0;
      if (t.status === "won") {
        map[name].won++;
        map[name].wonValue += t.estimated_value || 0;
      }
    });
    return Object.values(map);
  }, [tenders]);

  const formatValue = (v) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    return `₹${(v / 1000).toFixed(0)}K`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.fill }}>
            {p.name}: <span className="font-bold">{formatValue(p.value)}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Value by Opportunity Type</h3>
      <p className="text-xs text-gray-400 mb-4">Total pipeline vs won value per category</p>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis tickFormatter={formatValue} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="totalValue" name="Total Pipeline" radius={[4,4,0,0]} fill="#e0e7ff" />
            <Bar dataKey="wonValue" name="Won Value" radius={[4,4,0,0]} fill="#1e3a8a" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}