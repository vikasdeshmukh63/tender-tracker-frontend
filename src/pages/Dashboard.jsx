import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart2,
  Clock,
  Download,
  FileText,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
  Users
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

import api from "@/api/client";
import * as XLSX from "xlsx";
import DashboardAnalytics from "../components/dashboard/DashboardAnalytics";
import ImportExcelDialog from "../components/dashboard/ImportExcelDialog";
import StatsRow from "../components/dashboard/StatsRow";
import StatusChart from "../components/dashboard/StatusChart";
import TenderCalendar from "../components/dashboard/TenderCalendar";
import TenderFormDialog from "../components/dashboard/TenderFormDialog";
import TenderTable from "../components/dashboard/TenderTable";
import ValueChart from "../components/dashboard/ValueChart";
import { sendTenderDeadlineEmail, sendTenderSubmittedEmail } from "../components/lib/emailAlerts";
import NotificationBell from "../components/notifications/NotificationBell";
import { useNotificationChecker } from "../components/notifications/useNotificationChecker";

export default function Dashboard() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const team = urlParams.get("team") || "sales";

  // Check authentication
  const userDataStr = localStorage.getItem("esds_user");
  const userData = userDataStr ? JSON.parse(userDataStr) : null;

  React.useEffect(() => {
    if (!userData) {
      navigate(createPageUrl(`Auth?team=${team}`));
      return;
    }

    // Enforce team-based access: a user registered for one team
    // cannot access dashboards of the other team.
    if (userData.team && userData.team !== team) {
      navigate(createPageUrl(`Auth?team=${userData.team}`), { replace: true });
    }
  }, [userData, navigate, team]);

  const [showForm, setShowForm] = useState(false);
  const [editTender, setEditTender] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [employeeNumberFilter, setEmployeeNumberFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [activeTab, setActiveTab] = useState("tenders");

  const queryClient = useQueryClient();

  const { data: tenders = [], isLoading } = useQuery({
    queryKey: ["tenders", team],
    queryFn: async () => {
      const res = await api.get("/tenders", { params: { team } });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/tenders", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenders", team] });
      setShowForm(false);
      setEditTender(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/tenders/${id}`, data).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenders", team] });
      setShowForm(false);
      setEditTender(null);
      // Send email alert when status moves to 'submitted'
      if (variables.data?.status === "submitted") {
        const tender = tenders.find((t) => t.id === variables.id);
        if (tender) sendTenderSubmittedEmail({ ...tender, ...variables.data });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tenders/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenders", team] }),
  });

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const statusChangeMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/tenders/${id}`, { status }).then((r) => r.data),
    onMutate: ({ id }) => {
      setStatusUpdatingId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenders", team] });
    },
    onSettled: () => {
      setStatusUpdatingId(null);
    },
  });

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    statusChangeMutation.isPending;

  const handleSave = (formData) => {
    if (editTender) {
      updateMutation.mutate({ id: editTender.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filtered = useMemo(() => {
    return tenders.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.tender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.pot_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sales_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.regional_sales_manager?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesEmployeeNumber =
        !employeeNumberFilter || t.solution_architect_assigned?.includes(employeeNumberFilter);

      const d = t.submission_date || t.date || t.created_date;
      const dt = d ? new Date(d) : null;
      const monthName = dt ? dt.toLocaleString("en-US", { month: "long" }) : "";
      const yearStr = dt ? String(dt.getFullYear()) : "";
      const matchesMonth = !monthFilter || monthName === monthFilter;
      const matchesYear = !yearFilter || yearStr === yearFilter;

      return matchesSearch && matchesStatus && matchesEmployeeNumber && matchesMonth && matchesYear;
    });
  }, [tenders, searchQuery, statusFilter, employeeNumberFilter, monthFilter, yearFilter]);

  const stats = useMemo(() => {
    const total = tenders.length;
    const active = tenders.filter((t) => t.status === "in_progress").length;
    const won = tenders.filter((t) => t.status === "won").length;
    const totalValue = tenders
      .filter((t) => t.status === "won")
      .reduce((s, t) => s + (t.estimated_value || 0), 0);

    return [
      { label: "Total Tenders", value: total, icon: FileText, bgColor: "bg-blue-500", iconColor: "text-blue-600" },
      { label: "In Progress", value: active, icon: Clock, bgColor: "bg-amber-500", iconColor: "text-amber-600" },
      { label: "Won", value: won, icon: Trophy, bgColor: "bg-emerald-500", iconColor: "text-emerald-600" },
      {
        label: "Won Value",
        value: `₹${totalValue.toLocaleString("en-IN")}`,
        icon: TrendingUp,
        bgColor: "bg-purple-500",
        iconColor: "text-purple-600",
      },
    ];
  }, [tenders]);

  const teamLabel = team === "sales" ? "Sales Team" : "Presales Team";
  const accentColor = team === "sales" ? "#00A3E0" : "#10b981";

  const handleLogout = () => {
    localStorage.removeItem("esds_user");
    navigate(createPageUrl("Home"));
  };

  const handleExportExcel = () => {
    const filteredData = filtered;
    const wb = XLSX.utils.book_new();
    const ws = {};

    const darkBorder = {
      top:    { style: "medium", color: { rgb: "1E3A8A" } },
      bottom: { style: "medium", color: { rgb: "1E3A8A" } },
      left:   { style: "medium", color: { rgb: "1E3A8A" } },
      right:  { style: "medium", color: { rgb: "1E3A8A" } },
    };
    const thinBorder = {
      top:    { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left:   { style: "medium", color: { rgb: "000000" } },
      right:  { style: "medium", color: { rgb: "000000" } },
    };

    const numCols = 17;

    // ── Row 1: Watermark / title ──
    ws["A1"] = {
      v: "Tender Tracker  -  Presales & Sales Pipeline Management",
      t: "s",
      s: {
        font: { bold: true, italic: true, sz: 9, color: { rgb: "94A3B8" } },
        alignment: { horizontal: "left", vertical: "center" },
        fill: { fgColor: { rgb: "F8FAFC" } },
      },
    };
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }];

    // ── Row 2: Exported by info ──
    ws["A2"] = {
      v: `Exported by: ${userData.fullName || "—"}`,
      t: "s",
      s: { font: { bold: true, sz: 10, color: { rgb: "1E3A8A" } }, alignment: { horizontal: "left", vertical: "center" }, fill: { fgColor: { rgb: "EFF6FF" } } },
    };
    ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } });

    ws["G2"] = {
      v: `Employee No: ${userData.employeeNumber || "—"}`,
      t: "s",
      s: { font: { bold: true, sz: 10, color: { rgb: "1E3A8A" } }, alignment: { horizontal: "left", vertical: "center" }, fill: { fgColor: { rgb: "EFF6FF" } } },
    };
    ws["!merges"].push({ s: { r: 1, c: 6 }, e: { r: 1, c: 11 } });

    ws["M2"] = {
      v: `Email: ${userData.email || "—"}`,
      t: "s",
      s: { font: { bold: true, sz: 10, color: { rgb: "1E3A8A" } }, alignment: { horizontal: "left", vertical: "center" }, fill: { fgColor: { rgb: "EFF6FF" } } },
    };
    ws["!merges"].push({ s: { r: 1, c: 12 }, e: { r: 1, c: numCols - 1 } });

    // ── Row 3: Export date ──
    ws["A3"] = {
      v: `Exported on: ${new Date().toLocaleString("en-IN")}  |  Team: ${teamLabel}`,
      t: "s",
      s: { font: { italic: true, sz: 9, color: { rgb: "64748B" } }, alignment: { horizontal: "left", vertical: "center" }, fill: { fgColor: { rgb: "F8FAFC" } } },
    };
    ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } });

    // ── Row 4: Column headers ──
    const headers = [
      "Sr No.", "POT ID", "Tender Name", "Client Name", "Status", "Priority",
      "OPP Type", "Date",
      "Regional Sales Manager", "Sales Person",
      "Senior Solution Architect", "Solution Architect Assigned", "Employee Number",
      "Prebid Date", "Presentation Date", "Meeting Date",
    ];

    headers.forEach((h, ci) => {
      const cellAddr = XLSX.utils.encode_cell({ r: 3, c: ci });
      ws[cellAddr] = {
        v: h,
        t: "s",
        s: {
          font: { bold: true, sz: 10, color: { rgb: "FFFFFF" }, name: "Calibri" },
          fill: { patternType: "solid", fgColor: { rgb: "1E3A8A" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: false },
          border: {
            top:    { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left:   { style: "medium", color: { rgb: "000000" } },
            right:  { style: "medium", color: { rgb: "000000" } },
          },
        },
      };
    });

    // ── Rows 5+: Data ──
    filteredData.forEach((t, ri) => {
      const isEven = ri % 2 === 0;
      const rowFill = isEven ? "EFF6FF" : "FFFFFF";
      const rowIndex = ri + 4; // 0-based row index (rows 1-3 used above)

      const values = [
        ri + 1,
        t.pot_id || "",
        t.tender_name || "",
        t.client_name || "",
        (t.status || "").replace(/_/g, " "),
        t.priority || "",
        (t.opp_type || "").replace(/_/g, " "),
        t.date || "",
        t.regional_sales_manager || "",
        t.sales_person || "",
        t.senior_solution_architect || "",
        t.solution_architect_assigned || "",
        t.solution_architect_employee_number || "",
        t.prebid_date || "",
        t.presentation_date || "",
        t.meeting_date || "",
      ];

      values.forEach((val, ci) => {
        const cellAddr = XLSX.utils.encode_cell({ r: rowIndex, c: ci });
        const isNum = typeof val === "number";
        ws[cellAddr] = {
          v: val,
          t: isNum ? "n" : "s",
          s: {
            font: { sz: 9, color: { rgb: "1E293B" } },
            fill: { fgColor: { rgb: rowFill } },
            alignment: { horizontal: ci === 0 ? "center" : "left", vertical: "center", wrapText: false },
            border: thinBorder,
          },
        };
      });
    });

    // ── Sheet ref & column widths ──
    const totalRows = 4 + filteredData.length;
    ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRows - 1, c: numCols - 1 } });

    ws["!cols"] = [
      { wch: 6 },  // Sr No.
      { wch: 12 }, // POT ID
      { wch: 26 }, // Tender Name
      { wch: 20 }, // Client Name
      { wch: 13 }, // Status
      { wch: 10 }, // Priority
      { wch: 14 }, // OPP Type
      { wch: 12 }, // Date
      { wch: 22 }, // Regional Sales Manager
      { wch: 18 }, // Sales Person
      { wch: 26 }, // Senior Solution Architect
      { wch: 26 }, // Solution Architect Assigned
      { wch: 14 }, // Employee Number
      { wch: 14 }, // Prebid Date
      { wch: 16 }, // Presentation Date
      { wch: 14 }, // Meeting Date
      { wch: 16 }, // Work Status
    ];

    ws["!rows"] = [
      { hpt: 16 }, // row 1 watermark
      { hpt: 18 }, // row 2 user info
      { hpt: 14 }, // row 3 date
      { hpt: 22 }, // row 4 header
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Tenders");

    const fileName = `${team}_tenders_${new Date().toISOString().split("T")[0]}.xlsx`;

    XLSX.writeFile(wb, fileName, { cellStyles: true, bookSST: false });
  };

  const handleImportExcel = async (tendersToImport) => {
    try {
      const tendersWithTeam = tendersToImport.map((t) => ({ ...t, team }));
      await Promise.all(tendersWithTeam.map((tender) => api.post("/tenders", tender)));
      queryClient.invalidateQueries({ queryKey: ["tenders", team] });
      setShowImportDialog(false);
    } catch (error) {
      console.error("Error importing tenders:", error);
    }
  };

  const isAdmin = userData?.role === "admin";
  const isTeamLeadOrAdmin = userData?.role === "team_lead" || userData?.role === "admin";

  // Fetch tasks for notification checker
  const { data: allTasks = [] } = useQuery({
    queryKey: ["all-tasks-notif"],
    queryFn: async () => {
      const res = await api.get("/tasks", { params: { limit: 500 } });
      return res.data;
    },
    enabled: !!userData,
  });

  useNotificationChecker(userData, tenders, allTasks);

  // 24h & 48h deadline email alerts across all date fields — deduped daily via localStorage
  React.useEffect(() => {
    if (!tenders.length || !userData) return;

    const now = new Date();
    const DATE_FIELDS = ["prebid_date", "presentation_date", "meeting_date"];
    const THRESHOLDS = [24, 48]; // hours

    tenders.forEach((t) => {
      if (["won", "lost", "submitted"].includes(t.status)) return;
      DATE_FIELDS.forEach((field) => {
        if (!t[field]) return;
        const d = new Date(t[field]);
        const hoursLeft = (d - now) / (1000 * 60 * 60);
        THRESHOLDS.forEach((threshold) => {
          if (hoursLeft >= 0 && hoursLeft <= threshold) {
            sendTenderDeadlineEmail(t, threshold, field);
          }
        });
      });
    });
  }, [tenders, userData]);

  if (!userData) {
    return null; // Will redirect via useEffect
  }

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
              <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                {teamLabel}
              </h1>
              <p className="text-gray-500 text-xs mt-0.5">
                {userData.fullName} • <span className="capitalize">{userData.role.replace("_", " ")}</span>
                {userData.employeeNumber && ` • Emp #${userData.employeeNumber}`}
                {userData.designation && ` • ${userData.designation}`}
                {" • "}{tenders.length} tender{tenders.length !== 1 ? "s" : ""} in pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto">
            {isAdmin && (
              <Link to={createPageUrl("Analytics")}>
                <Button variant="outline" className="rounded-lg gap-1.5 h-8 text-xs px-3">
                  <BarChart2 className="w-3.5 h-3.5" /> Analytics
                </Button>
              </Link>
            )}

            {isTeamLeadOrAdmin && (
              <Link to={createPageUrl("WorkloadView")}>
                <Button variant="outline" className="rounded-lg gap-1.5 h-8 text-xs px-3">
                  <Users className="w-3.5 h-3.5" /> Workload
                </Button>
              </Link>
            )}



            <NotificationBell userData={userData} />

            <Button
              onClick={handleLogout}
              className="rounded-lg h-8 text-xs px-3 bg-red-800 hover:bg-red-900 text-white border-0"
            >
              Logout
            </Button>

            {team === "presales" && (
              <Button
                className="rounded-lg gap-1.5 h-8 text-xs px-3 bg-[#1e3a8a] hover:bg-[#1e40af] text-white border-0 shadow-md shadow-blue-900/30"
                onClick={() => window.open("https://presales.esdsconnect.com/", "_blank")}
              >
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
                Presales Agentic AI
              </Button>
            )}

            <Button
              onClick={() => {
                setEditTender(null);
                setShowForm(true);
              }}
              disabled={isMutating}
              className="text-white gap-1.5 rounded-lg h-8 text-xs px-3"
              style={{ backgroundColor: accentColor }}
            >
              <Plus className="w-3.5 h-3.5" /> New Tender
            </Button>
          </div>
        </motion.div>

        {/* Stats - Admin Only */}
        {isAdmin && (
          <div className="mb-4">
            <StatsRow stats={stats} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
          {[
            { key: "tenders", label: "Tenders" },
            { key: "calendar", label: "Calendar" },
            { key: "analytics", label: "Analytics" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "tenders" && (
          <>
            {/* Charts - Admin Only */}
            {isAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <StatusChart tenders={tenders} />
                <ValueChart tenders={tenders} />
              </div>
            )}

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-2 mb-6 py-5 px-4 items-start sm:items-center justify-between bg-white rounded-lg"
            >
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    placeholder="Search tenders, clients, people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-lg border-gray-200 bg-white h-8 text-xs"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 rounded-lg bg-white h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>

                {isTeamLeadOrAdmin && (
                  <Select value={employeeNumberFilter} onValueChange={setEmployeeNumberFilter}>
                    <SelectTrigger className="w-32 rounded-lg bg-white h-8 text-xs">
                      <SelectValue placeholder="Employee No" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>All Employees</SelectItem>
                      {[...new Set(tenders.map(t => t.solution_architect_assigned).filter(Boolean))].map(empNo => (
                        <SelectItem key={empNo} value={empNo}>{empNo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-28 rounded-lg bg-white h-8 text-xs">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Months</SelectItem>
                    <SelectItem value="January">January</SelectItem>
                    <SelectItem value="February">February</SelectItem>
                    <SelectItem value="March">March</SelectItem>
                    <SelectItem value="April">April</SelectItem>
                    <SelectItem value="May">May</SelectItem>
                    <SelectItem value="June">June</SelectItem>
                    <SelectItem value="July">July</SelectItem>
                    <SelectItem value="August">August</SelectItem>
                    <SelectItem value="September">September</SelectItem>
                    <SelectItem value="October">October</SelectItem>
                    <SelectItem value="November">November</SelectItem>
                    <SelectItem value="December">December</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-24 rounded-lg bg-white h-8 text-xs">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Years</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleExportExcel}
                disabled={isLoading || isMutating}
                className="rounded-lg gap-1.5 h-8 text-xs px-3 whitespace-nowrap bg-green-100 text-green-700 hover:bg-green-200 border-0"
              >
                <Download className="w-3.5 h-3.5" /> Export Excel
              </Button>

            </motion.div>

            {/* Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[#00A3E0] rounded-full animate-spin" />
              </div>
            ) : (
              <TenderTable
                 tenders={filtered}
                 onDelete={(id) => {
                   if (deleteMutation.isPending) return;
                   deleteMutation.mutate(id);
                 }}
                 team={team}
                 onEmployeeNumberChange={(id, empNo) => {
                   if (updateMutation.isPending) return;
                   updateMutation.mutate({ id, data: { solution_architect_employee_number: empNo } });
                 }}
                 onStatusChange={(id, status) => {
                   if (statusChangeMutation.isPending) return;
                   statusChangeMutation.mutate({ id, status });
                 }}
                 isBusy={isMutating}
                 statusUpdatingId={statusUpdatingId}
                 userData={userData}
               />
            )}
          </>
        )}

        {activeTab === "calendar" && (
          <TenderCalendar tenders={tenders} team={team} />
        )}

        {activeTab === "analytics" && (
          <DashboardAnalytics tenders={tenders} />
        )}

        {/* Form Dialog */}
        <TenderFormDialog
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditTender(null);
          }}
          onSave={handleSave}
          loading={createMutation.isPending || updateMutation.isPending}
          tender={editTender}
          team={team}
          userData={userData}
        />

        {/* Import Dialog */}
        <ImportExcelDialog
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={handleImportExcel}
        />
      </div>
    </div>
  );
}