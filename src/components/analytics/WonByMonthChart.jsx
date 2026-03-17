import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function WonByMonthChart({ tenders }) {
  const data = useMemo(() => {
    const won = tenders.filter((t) => t.status === "won");
    const map = {};
    won.forEach((t) => {
      const d = t.submission_date || t.date || t.created_date;
      if (!d) return;
      const dt = new Date(d);
      const label = `${MONTHS[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}`;
      if (!map[label]) map[label] = { label, count: 0, value: 0 };
      map[label].count++;
      map[label].value += t.estimated_value || 0;
    });
    return Object.values(map).slice(-12);
  }, [tenders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-800 mb-1">{label}</p>
        <p className="text-[#00A3E0]">Tenders Won: <span className="font-bold">{payload[0]?.value}</span></p>
        <p className="text-emerald-600">Value: <span className="font-bold">₹{(payload[1]?.value || 0).toLocaleString("en-IN")}</span></p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Tenders Won by Month</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No won tenders yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis yAxisId="right" orientation="right" hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="left" dataKey="count" name="Won" radius={[6,6,0,0]} fill="#00A3E0" />
            <Bar yAxisId="right" dataKey="value" name="Value" radius={[6,6,0,0]} fill="#10b981" opacity={0.3} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}