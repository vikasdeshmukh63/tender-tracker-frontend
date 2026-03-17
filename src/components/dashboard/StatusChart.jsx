import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChartFilter, { getDateRangeFromFilter } from "@/components/charts/ChartFilter";

const COLORS = {
  new: "#3b82f6",
  in_progress: "#f59e0b",
  submitted: "#8b5cf6",
  won: "#10b981",
  lost: "#ef4444",
  on_hold: "#6b7280",
};

export default function StatusChart({ tenders }) {
  const [filter, setFilter] = useState("All Time");

  const data = React.useMemo(() => {
    const startDate = getDateRangeFromFilter(filter);
    const counts = {};
    
    tenders.forEach((t) => {
      if (startDate && t.created_date) {
        const createdDate = new Date(t.created_date);
        if (createdDate < startDate) return;
      }
      const status = t.status || "new";
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value: count,
      color: COLORS[status],
    }));
  }, [tenders, filter]);

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold">Status Distribution</CardTitle>
        <ChartFilter onFilterChange={setFilter} />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}