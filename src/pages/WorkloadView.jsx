import React, { useMemo, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { ArrowLeft, Users, AlertTriangle, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { differenceInDays } from "date-fns";
import MemberWorkloadCard from "../components/workload/MemberWorkloadCard";

export default function WorkloadView() {
  const navigate = useNavigate();
  const userData = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("esds_user") || "{}"); } catch { return {}; }
  }, []);

  React.useEffect(() => {
    if (!userData?.role) navigate(createPageUrl("Home"));
  }, []);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("load"); // load | name | overdue | tenders
  const [teamFilter, setTeamFilter] = useState("all");

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["workload-tasks"],
    queryFn: () => base44.entities.Task.list("-created_date", 500),
  });

  const { data: tenders = [], isLoading: loadingTenders } = useQuery({
    queryKey: ["workload-tenders"],
    queryFn: () => base44.entities.Tender.list("-created_date", 500),
  });

  const members = useMemo(() => {
    const now = new Date();
    const map = {};

    const ensure = (email) => {
      if (!email || !email.includes("@")) return;
      if (!map[email]) {
        const name = email.split("@")[0].replace(/[._]/g, " ").split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        map[email] = { email, name, activeTasks: 0, completedTasks: 0, overdueCount: 0, upcomingCount: 0, tenderCount: 0, activeTenderNames: [] };
      }
    };

    // Process tasks
    tasks.forEach((task) => {
      const assignees = task.assignees?.length ? task.assignees : task.assigned_to ? [task.assigned_to] : [];
      assignees.forEach((email) => {
        ensure(email);
        if (!map[email]) return;
        if (task.status === "completed") {
          map[email].completedTasks++;
        } else {
          map[email].activeTasks++;
          if (task.due_date) {
            const daysLeft = differenceInDays(new Date(task.due_date), now);
            if (daysLeft < 0) map[email].overdueCount++;
            else if (daysLeft <= 3) map[email].upcomingCount++;
          }
        }
      });
    });

    // Process tenders — attribute to sales_person and solution_architect_assigned
    tenders.forEach((tender) => {
      if (["won", "lost"].includes(tender.status)) return;
      const people = [tender.sales_person, tender.solution_architect_assigned].filter(Boolean);
      people.forEach((name) => {
        // Try matching by first name fragment from email
        const matchedEmail = Object.keys(map).find((e) => {
          const emailName = e.split("@")[0].toLowerCase().replace(/[._]/g, " ");
          return emailName.includes(name.toLowerCase().split(" ")[0]);
        });
        const key = matchedEmail || name; // fallback to raw name if no email match
        if (!map[key]) {
          map[key] = { email: key, name, activeTasks: 0, completedTasks: 0, overdueCount: 0, upcomingCount: 0, tenderCount: 0, activeTenderNames: [] };
        }
        map[key].tenderCount++;
        if (tender.tender_name) map[key].activeTenderNames.push(tender.tender_name);
      });
    });

    return Object.values(map);
  }, [tasks, tenders]);

  const filtered = useMemo(() => {
    let list = members.filter((m) => {
      const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });

    if (sortBy === "load") {
      list = [...list].sort((a, b) => (b.activeTasks * 0.6 + b.tenderCount * 0.4) - (a.activeTasks * 0.6 + a.tenderCount * 0.4));
    } else if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "overdue") {
      list = [...list].sort((a, b) => b.overdueCount - a.overdueCount);
    } else if (sortBy === "tenders") {
      list = [...list].sort((a, b) => b.tenderCount - a.tenderCount);
    }

    return list;
  }, [members, search, sortBy]);

  const summary = useMemo(() => ({
    total: members.length,
    overloaded: members.filter((m) => {
      const score = (m.activeTasks / 10) * 0.6 + (m.tenderCount / 8) * 0.4;
      return score >= 0.85;
    }).length,
    withOverdue: members.filter((m) => m.overdueCount > 0).length,
    totalActiveTasks: members.reduce((s, m) => s + m.activeTasks, 0),
  }), [members]);

  const isLoading = loadingTasks || loadingTenders;

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
                <Users className="w-5 h-5 text-[#1e3a8a]" /> Team Workload
              </h1>
              <p className="text-gray-400 text-xs mt-0.5">Individual capacity, tasks & tender assignments</p>
            </div>
          </div>
        </motion.div>

        {/* Summary Banners */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Team Members", value: summary.total, color: "bg-[#1e3a8a]", textColor: "text-[#1e3a8a]", bg: "bg-blue-50" },
            { label: "Active Tasks", value: summary.totalActiveTasks, color: "bg-[#00A3E0]", textColor: "text-sky-600", bg: "bg-sky-50" },
            { label: "Overloaded", value: summary.overloaded, color: "bg-red-500", textColor: "text-red-600", bg: "bg-red-50" },
            { label: "With Overdue", value: summary.withOverdue, color: "bg-amber-500", textColor: "text-amber-600", bg: "bg-amber-50" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-xl border border-gray-100 p-3 ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.textColor}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Overload Alert */}
        {summary.overloaded > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-4 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span><strong>{summary.overloaded} member{summary.overloaded > 1 ? "s are" : " is"} overloaded.</strong> Consider redistributing tasks or tenders.</span>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-lg border-gray-200 bg-white h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 rounded-lg bg-white h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="load">Sort: Highest Load</SelectItem>
                <SelectItem value="overdue">Sort: Most Overdue</SelectItem>
                <SelectItem value="tenders">Sort: Most Tenders</SelectItem>
                <SelectItem value="name">Sort: Name A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#00A3E0] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No team members found</p>
            <p className="text-sm mt-1">Add tasks or tenders with assigned members to see workload data</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((member, i) => (
              <MemberWorkloadCard key={member.email} member={member} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}