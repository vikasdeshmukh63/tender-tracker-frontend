import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { differenceInDays } from "date-fns";

const OPP_LABELS = {
  new_business: "New Business",
  renewal: "Renewal",
  upsell: "Upsell",
  cross_sell: "Cross-sell",
};

export default function AvgTimeToWinChart({ tenders }) {
  const { data, avgDays } = useMemo(() => {
    const wonWithDates = tenders.filter(
      (t) => t.status === "won" && t.date && t.updated_date
    );

    // Group by opp_type
    const map = {};
    let totalDays = 0, totalCount = 0;

    wonWithDates.forEach((t) => {
      const days = differenceInDays(new Date(t.updated_date), new Date(t.date));
      if (days < 0 || days > 1000) return;
      const key = t.opp_type || "other";
      if (!map[key]) map[key] = { name: OPP_LABELS[key] || key, totalDays: 0, count: 0 };
      map[key].totalDays += days;
      map[key].count++;
      totalDays += days;
      totalCount++;
    });

    const data = Object.values(map).map((d) => ({
      name: d.name,
      avgDays: d.count > 0 ? Math.round(d.totalDays / d.count) : 0,
      count: d.count,
    }));

    return { data, avgDays: totalCount > 0 ? Math.round(totalDays / totalCount) : 0 };
  }, [tenders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-800 mb-1">{label}</p>
        <p className="text-amber-600">Avg Days to Win: <span className="font-bold">{payload[0]?.value}</span></p>
        <p className="text-gray-500">Sample size: {payload[0]?.payload?.count}</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Avg Days: New → Won</h3>
      <p className="text-xs text-gray-400 mb-4">
        Overall average: <span className="font-semibold text-gray-700">{avgDays} days</span> across all won tenders
      </p>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-300 text-sm">Not enough data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} unit="d" />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={avgDays} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Avg ${avgDays}d`, fill: "#f59e0b", fontSize: 11 }} />
            <Bar dataKey="avgDays" name="Avg Days" radius={[6,6,0,0]} fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}