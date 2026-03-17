import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, TrendingUp, Clock, Target, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import KpiCard from "../components/analytics/KpiCard";
import WonByMonthChart from "../components/analytics/WonByMonthChart";
import ConversionBySourceChart from "../components/analytics/ConversionBySourceChart";
import AvgTimeToWinChart from "../components/analytics/AvgTimeToWinChart";
import ProfitabilityChart from "../components/analytics/ProfitabilityChart";
import SalesFunnelChart from "../components/analytics/SalesFunnelChart";
import SuccessRateChart from "../components/analytics/SuccessRateChart";
import PipelineByMonthChart from "../components/analytics/PipelineByMonthChart";
import TeamPerformanceChart from "../components/analytics/TeamPerformanceChart";
import { differenceInDays } from "date-fns";

export default function Analytics() {
  const navigate = useNavigate();
  const userData = (() => { try { return JSON.parse(localStorage.getItem("esds_user") || "{}"); } catch { return {}; } })();

  useEffect(() => {
    if (!userData?.role) navigate(createPageUrl("Home"));
  }, []);

  const [teamFilter, setTeamFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const { data: allTenders = [], isLoading } = useQuery({
    queryKey: ["analytics-tenders"],
    queryFn: () => base44.entities.Tender.list("-created_date", 500),
  });

  const tenders = useMemo(() => {
    return allTenders.filter((t) => {
      const matchTeam = teamFilter === "all" || t.team === teamFilter;
      const d = t.submission_date || t.date || t.created_date;
      const dt = d ? new Date(d) : null;
      const yearStr = dt ? String(dt.getFullYear()) : "";
      const matchYear = yearFilter === "all" || yearStr === yearFilter;
      return matchTeam && matchYear;
    });
  }, [allTenders, teamFilter, yearFilter]);

  const kpis = useMemo(() => {
    const total = tenders.length;
    const won = tenders.filter((t) => t.status === "won");
    const conversionRate = total > 0 ? Math.round((won.length / total) * 100) : 0;
    const wonValue = won.reduce((s, t) => s + (t.estimated_value || 0), 0);

    const wonWithDates = won.filter((t) => t.date && t.updated_date);
    const avgDays = wonWithDates.length > 0
      ? Math.round(wonWithDates.reduce((s, t) => {
          const d = differenceInDays(new Date(t.updated_date), new Date(t.date));
          return s + Math.max(0, d);
        }, 0) / wonWithDates.length)
      : 0;

    const formatValue = (v) => {
      if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
      if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
      return `₹${(v / 1000).toFixed(0)}K`;
    };

    return [
      { label: "Total Tenders", value: total, sub: "in selected period", icon: BarChart2, color: "bg-[#00A3E0]", delay: 0 },
      { label: "Won Tenders", value: won.length, sub: `${conversionRate}% conversion rate`, icon: Trophy, color: "bg-emerald-500", delay: 0.05 },
      { label: "Won Pipeline Value", value: formatValue(wonValue), sub: "total closed value", icon: TrendingUp, color: "bg-[#1e3a8a]", delay: 0.1 },
      { label: "Avg Days to Close", value: `${avgDays}d`, sub: "new → won average", icon: Clock, color: "bg-amber-500", delay: 0.15 },
    ];
  }, [tenders]);

  const years = useMemo(() => {
    const ys = [
      ...new Set(
        allTenders
          .map((t) => {
            const d = t.submission_date || t.date || t.created_date;
            const dt = d ? new Date(d) : null;
            return dt ? String(dt.getFullYear()) : null;
          })
          .filter(Boolean)
      ),
    ].sort();
    return ys;
  }, [allTenders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-5">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3"
        >
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Home")}>
              <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Target className="w-5 h-5 text-[#00A3E0]" /> Analytics
              </h1>
              <p className="text-gray-400 text-xs mt-0.5">Management intelligence — trends, conversion & profitability</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-32 rounded-lg bg-white h-8 text-xs">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="presales">Presales</SelectItem>
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-24 rounded-lg bg-white h-8 text-xs">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#00A3E0] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
            </div>

            {/* Row 1: Won by Month + Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <WonByMonthChart tenders={tenders} />
              <SalesFunnelChart tenders={tenders} />
            </div>

            {/* Row 2: Conversion by Manager + Avg Time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <ConversionBySourceChart tenders={tenders} />
              <AvgTimeToWinChart tenders={tenders} />
            </div>

            {/* Row 3: Profitability full width */}
            <div className="mb-4">
              <ProfitabilityChart tenders={tenders} />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Performance Insights</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Row 4: Success Rate (full width) */}
            <div className="mb-4">
              <SuccessRateChart tenders={tenders} />
            </div>

            {/* Row 5: Pipeline by Month + Team Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <PipelineByMonthChart tenders={tenders} />
              <TeamPerformanceChart tenders={tenders} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}