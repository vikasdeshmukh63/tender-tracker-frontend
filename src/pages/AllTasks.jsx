import React, { useState, useMemo } from "react";
import api from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { ArrowLeft, Filter, CheckCircle2, Clock, ListTodo, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TaskList from "../components/tasks/TaskList";

export default function AllTasks() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const userData = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("esds_user") || "{}"); } catch { return {}; }
  }, []);

  React.useEffect(() => {
    if (!userData?.role) navigate(createPageUrl("Auth?team=sales"));
  }, []);

  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Backend applies role-based filtering:
  // - admin / team_lead → all tasks
  // - regular user     → only their assigned tasks
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["all-tasks"],
    queryFn: () => api.get("/tasks").then((r) => r.data),
    enabled: !!userData?.role,
  });

  // Tenders list is used by TaskList to display the tender name per task
  const { data: tenders = [] } = useQuery({
    queryKey: ["tenders-for-tasks"],
    queryFn: () => api.get("/tenders").then((r) => r.data),
    enabled: !!userData?.role,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["all-tasks"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }) =>
      api.put(`/tasks/${taskId}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["all-tasks"] }),
  });

  const filteredTasks = useMemo(() =>
    tasks.filter((task) => {
      const statusMatch = statusFilter === "all" || task.status === statusFilter;
      const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
      return statusMatch && priorityMatch;
    }),
    [tasks, statusFilter, priorityFilter]
  );

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter((t) => {
      if (t.status === "completed" || !t.due_date) return false;
      return new Date(t.due_date) < new Date();
    }).length,
  }), [tasks]);

  const isAdminOrLead =
    userData?.role === "admin" || userData?.role === "team_lead";

  if (!userData?.role) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-6xl mx-auto px-3 md:px-6 py-3 md:py-5">

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
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                {isAdminOrLead ? "All Tasks" : "My Tasks"}
              </h1>
              <p className="text-gray-500 text-xs mt-0.5">
                {isAdminOrLead
                  ? "View and manage tasks across all tenders"
                  : "Tasks assigned to you"}
              </p>
            </div>
          </div>

          {/* Tasks can only be created from within a Tender — shown as a hint */}
          {isAdminOrLead && (
            <p className="text-xs text-gray-400 italic">
              To create a task, open a tender and use the Tasks tab.
            </p>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {[
            { label: "Total", value: stats.total, icon: ListTodo, bg: "bg-blue-50", text: "text-blue-700", iconColor: "text-blue-500" },
            { label: "Pending", value: stats.pending, icon: Clock, bg: "bg-yellow-50", text: "text-yellow-700", iconColor: "text-yellow-500" },
            { label: "In Progress", value: stats.inProgress, icon: Clock, bg: "bg-sky-50", text: "text-sky-700", iconColor: "text-sky-500" },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, bg: "bg-green-50", text: "text-green-700", iconColor: "text-green-500" },
            { label: "Overdue", value: stats.overdue, icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", iconColor: "text-red-500" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`${s.bg} rounded-xl border border-gray-100 p-3`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center">
                  <s.icon className={`w-4 h-4 ${s.iconColor}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${s.text}`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-2 mb-4"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 rounded-lg bg-white h-8 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36 rounded-lg bg-white h-8 text-xs">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Task List */}
        {loadingTasks ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#00A3E0] rounded-full animate-spin" />
          </div>
        ) : (
          <TaskList
            tasks={filteredTasks}
            tenders={tenders}
            showTenderName={true}
            userData={userData}
            onEdit={() => {}}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        )}
      </div>
    </div>
  );
}
