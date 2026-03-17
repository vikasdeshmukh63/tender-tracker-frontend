import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChartFilter, { getDateRangeFromFilter } from "@/components/charts/ChartFilter";

export default function ValueChart({ tenders }) {
  const [filter, setFilter] = useState("All Time");

  const data = React.useMemo(() => {
    const startDate = getDateRangeFromFilter(filter);
    const monthlyData = {};
    
    tenders.forEach((t) => {
      if (startDate && t.created_date) {
        const createdDate = new Date(t.created_date);
        if (createdDate < startDate) return;
      }
      if (t.month && t.year) {
        const key = `${t.month} ${t.year}`;
        if (!monthlyData[key]) {
          monthlyData[key] = { month: key, total: 0, won: 0 };
        }
        monthlyData[key].total += t.estimated_value || 0;
        if (t.status === "won") {
          monthlyData[key].won += t.estimated_value || 0;
        }
      }
    });

    return Object.values(monthlyData)
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(" ");
        const [bMonth, bYear] = b.month.split(" ");
        return aYear.localeCompare(bYear) || aMonth.localeCompare(bMonth);
      })
      .slice(-6);
  }, [tenders, filter]);

  const formatValue = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold">Monthly Value Trend</CardTitle>
        <ChartFilter onFilterChange={setFilter} />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatValue} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
            <Legend />
            <Bar dataKey="total" fill="#3b82f6" name="Total Value" radius={[8, 8, 0, 0]} />
            <Bar dataKey="won" fill="#10b981" name="Won Value" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}