import React, { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function SuccessRateChart({ tenders }) {
  const data = useMemo(() => {
    const map = {};
    tenders.forEach((t) => {
      const key = t.month
        ? `${t.month.slice(0, 3)} ${(t.year || "").slice(2)}`
        : t.date
        ? `${MONTHS[new Date(t.date).getMonth()]} ${String(new Date(t.date).getFullYear()).slice(2)}`
        : null;
      if (!key) return;
      if (!map[key]) map[key] = { label: key, total: 0, won: 0, lost: 0, submitted: 0 };
      map[key].total++;
      if (t.status === "won") map[key].won++;
      if (t.status === "lost") map[key].lost++;
      if (t.status === "submitted") map[key].submitted++;
    });
    return Object.values(map)
      .map((d) => ({
        ...d,
        successRate: d.total > 0 ? Math.round((d.won / d.total) * 100) : 0,
        lossRate: d.total > 0 ? Math.round((d.lost / d.total) * 100) : 0,
      }))
      .slice(-12);
  }, [tenders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-800 mb-1">{label}</p>
        <p className="text-emerald-600">Success Rate: <span className="font-bold">{d?.successRate}%</span></p>
        <p className="text-red-400">Loss Rate: <span className="font-bold">{d?.lossRate}%</span></p>
        <p className="text-gray-400 mt-1 text-xs">Total: {d?.total} | Won: {d?.won} | Lost: {d?.lost}</p>
      </div>
    );
  };

  const avgSuccess =
    data.length > 0
      ? Math.round(data.reduce((s, d) => s + d.successRate, 0) / data.length)
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Tender Success Rate Over Time
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Monthly win % vs loss % — avg success rate:{" "}
        <span className="font-semibold text-gray-700">{avgSuccess}%</span>
      </p>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine
              y={avgSuccess}
              stroke="#10b981"
              strokeDasharray="4 4"
              label={{ value: `Avg ${avgSuccess}%`, fill: "#10b981", fontSize: 10, position: "insideTopRight" }}
            />
            <Line
              type="monotone"
              dataKey="successRate"
              name="Success Rate %"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#10b981" }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="lossRate"
              name="Loss Rate %"
              stroke="#f87171"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: "#f87171" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}