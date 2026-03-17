import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LabelList,
} from "recharts";

export default function TeamPerformanceChart({ tenders }) {
  const { byPerson, teamSummary } = useMemo(() => {
    const personMap = {};
    const teamMap = { sales: { team: "Sales", submitted: 0, won: 0, total: 0 }, presales: { team: "Presales", submitted: 0, won: 0, total: 0 } };

    tenders.forEach((t) => {
      const person = t.sales_person || "Unknown";
      if (!personMap[person]) personMap[person] = { name: person, submitted: 0, won: 0, lost: 0, total: 0 };
      personMap[person].total++;
      if (t.status === "submitted" || t.status === "won") personMap[person].submitted++;
      if (t.status === "won") personMap[person].won++;
      if (t.status === "lost") personMap[person].lost++;

      const team = t.team === "presales" ? "presales" : "sales";
      teamMap[team].total++;
      if (t.status === "submitted" || t.status === "won") teamMap[team].submitted++;
      if (t.status === "won") teamMap[team].won++;
    });

    const byPerson = Object.values(personMap)
      .filter((d) => d.total >= 1)
      .map((d) => ({
        ...d,
        winRate: d.total > 0 ? Math.round((d.won / d.total) * 100) : 0,
      }))
      .sort((a, b) => b.won - a.won)
      .slice(0, 10);

    const teamSummary = Object.values(teamMap).map((d) => ({
      ...d,
      winRate: d.total > 0 ? Math.round((d.won / d.total) * 100) : 0,
    }));

    return { byPerson, teamSummary };
  }, [tenders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-800 mb-1 truncate max-w-[200px]">{label}</p>
        <p className="text-purple-600">Submitted: <span className="font-bold">{d?.submitted}</span></p>
        <p className="text-emerald-600">Won: <span className="font-bold">{d?.won}</span></p>
        <p className="text-red-400">Lost: <span className="font-bold">{d?.lost ?? "—"}</span></p>
        <p className="text-gray-500 text-xs mt-1">Win Rate: {d?.winRate}%</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Team Performance: Submitted vs Won
      </h3>
      <p className="text-xs text-gray-400 mb-5">Top sales persons ranked by tenders won</p>

      {/* Team-level summary badges */}
      <div className="flex gap-4 mb-5">
        {teamSummary.map((t) => (
          <div key={t.team} className="flex-1 rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t.team} Team</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{t.won}<span className="text-sm text-gray-400 font-normal">/{t.total}</span></p>
            <p className="text-xs text-emerald-600 font-semibold">{t.winRate}% win rate</p>
            <p className="text-xs text-purple-500 mt-0.5">{t.submitted} submitted</p>
          </div>
        ))}
      </div>

      {byPerson.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-300 text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byPerson} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "#374151" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="submitted" name="Submitted" radius={[0,4,4,0]} fill="#a78bfa" stackId="a" />
            <Bar dataKey="won" name="Won" radius={[0,4,4,0]} fill="#10b981" stackId="b">
              <LabelList dataKey="won" position="right" style={{ fontSize: 11, fill: "#6b7280" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}