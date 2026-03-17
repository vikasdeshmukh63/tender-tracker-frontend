import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";

const TEAM_LABELS = { sales: "Sales", presales: "Presales" };

export default function ConversionBySourceChart({ tenders }) {
  // Group by sales_person since there's no 'source' field — use regional_sales_manager as channel
  const data = useMemo(() => {
    const map = {};
    tenders.forEach((t) => {
      const key = t.regional_sales_manager || "Unknown";
      if (!map[key]) map[key] = { name: key, total: 0, won: 0 };
      map[key].total++;
      if (t.status === "won") map[key].won++;
    });
    return Object.values(map)
      .map((d) => ({ ...d, rate: d.total > 0 ? Math.round((d.won / d.total) * 100) : 0 }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10);
  }, [tenders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-800 mb-1">{label}</p>
        <p className="text-gray-500">Total: <span className="font-bold text-gray-800">{d?.total}</span></p>
        <p className="text-emerald-600">Won: <span className="font-bold">{d?.won}</span></p>
        <p className="text-[#1e3a8a]">Conversion Rate: <span className="font-bold">{d?.rate}%</span></p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Conversion Rate by Sales Manager</h3>
      <p className="text-xs text-gray-400 mb-4">% of tenders won per regional manager</p>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "#374151" }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="rate" name="Conversion %" radius={[0,6,6,0]} fill="#1e3a8a">
              <LabelList dataKey="rate" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 11, fill: "#6b7280" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}