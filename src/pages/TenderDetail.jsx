import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  ArrowLeft,
  Pencil,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  IndianRupee,
  Tag,
  Globe,
  FileText,
  MessageSquare,
  ListTodo,
  Plus,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TenderFormDialog from "../components/dashboard/TenderFormDialog";
import { sendTenderSubmittedEmail, sendTaskAssignedEmail } from "../components/lib/emailAlerts";
import TaskFormDialog from "../components/tasks/TaskFormDialog";
import TaskList from "../components/tasks/TaskList";
import TenderAuditLog from "../components/tenderdetail/TenderAuditLog";
import { logTenderUpdate } from "../components/tenderdetail/auditLogger";
import TenderProgressBar from "../components/tenderdetail/TenderProgressBar";
import TenderFileUpload from "../components/tenderdetail/TenderFileUpload";
import api from "@/api/client";

const statusConfig = {
  new: { label: "New", className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", className: "bg-amber-50 text-amber-700 border-amber-200" },
  submitted: { label: "Submitted", className: "bg-purple-50 text-purple-700 border-purple-200" },
  won: { label: "Won", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  lost: { label: "Lost", className: "bg-red-50 text-red-700 border-red-200" },
  on_hold: { label: "On Hold", className: "bg-gray-50 text-gray-600 border-gray-200" },
};

const priorityConfig = {
  low: { label: "Low", dot: "bg-gray-400" },
  medium: { label: "Medium", dot: "bg-blue-400" },
  high: { label: "High", dot: "bg-orange-400" },
  critical: { label: "Critical", dot: "bg-red-500" },
};

function DetailItem({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function TenderDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const team = urlParams.get("team") || "sales";
  const userData = (() => { try { return JSON.parse(localStorage.getItem("esds_user") || "{}"); } catch { return {}; } })();

  const [showEdit, setShowEdit] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const queryClient = useQueryClient();

  const { data: tender, isLoading } = useQuery({
    queryKey: ["tender", id],
    queryFn: async () => {
      const res = await api.get(`/tenders/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const res = await api.get("/tasks", { params: { tender_id: id } });
      return res.data;
    },
    enabled: !!id,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["audit-logs", id],
    queryFn: async () => {
      const res = await api.get("/audit-logs", { params: { tender_id: id } });
      return res.data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/tenders/${id}`, data).then((r) => r.data),
    onSuccess: (_, data) => {
      if (tender) logTenderUpdate(id, tender, data, userData);
      queryClient.invalidateQueries({ queryKey: ["tender", id] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs", id] });
      setShowEdit(false);
      const updatedTender = { ...tender, ...data };
      if (data?.status === "submitted" && tender) {
        sendTenderSubmittedEmail(updatedTender);
      }
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => api.post("/tasks", data).then((r) => r.data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      setShowTaskForm(false);
      setEditTask(null);
      // Notify assignees of new task
      if (data.assignees?.length || data.assigned_to) {
        sendTaskAssignedEmail(data, tender?.tender_name);
      }
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) =>
      api.put(`/tasks/${taskId}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      setShowTaskForm(false);
      setEditTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => api.delete(`/tasks/${taskId}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", id] }),
  });

  const handleSaveTask = (formData) => {
    if (editTask) {
      updateTaskMutation.mutate({ taskId: editTask.id, data: formData });
    } else {
      createTaskMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#00A3E0] rounded-full animate-spin" />
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Tender not found.</p>
      </div>
    );
  }

  const categoryLabels = {
    cloud: "Cloud",
    managed_services: "Managed Services",
    data_center: "Data Center",
    security: "Security",
    networking: "Networking",
    other: "Other",
  };

  const sourceLabels = {
    gem: "GeM Portal",
    direct: "Direct",
    referral: "Referral",
    partner: "Partner",
    website: "Website",
    other: "Other",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-4xl mx-auto px-3 md:px-6 py-3 md:py-5">
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <Link to={createPageUrl(`Dashboard?team=${team}`)}>
            <Button variant="ghost" className="gap-1.5 text-gray-600 rounded-lg h-8 text-xs px-3">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          </Link>
          <Button
            onClick={() => setShowEdit(true)}
            variant="outline"
            className="gap-1.5 rounded-lg h-8 text-xs px-3"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        </motion.div>

        {/* Title area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Badge variant="outline" className={`${statusConfig[tender.status]?.className} font-medium`}>
              {statusConfig[tender.status]?.label}
            </Badge>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${priorityConfig[tender.priority]?.dot}`} />
              <span className="text-sm text-gray-500">
                {priorityConfig[tender.priority]?.label} Priority
              </span>
            </div>
            <Badge className="bg-gray-100 text-gray-600 border-0 font-medium text-xs">
              {team === "sales" ? "Sales" : "Presales"}
            </Badge>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            {tender.title}
          </h1>
        </motion.div>

        {/* Progress Bar */}
        <TenderProgressBar
          tender={tender}
          auditLogs={auditLogs}
          onStatusChange={(newStatus) => updateMutation.mutate({ status: newStatus })}
        />

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
          {[
            { key: "details", label: "Details", icon: FileText },
            { key: "tasks", label: `Tasks (${tasks.length})`, icon: ListTodo },
            { key: "activity", label: "Activity", icon: History },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <>
        {activeTab === "details" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"
        >
          {/* Left column */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-1">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Tender Details
            </h3>
            <DetailItem icon={Building2} label="Client" value={tender.client_name} />
            <DetailItem icon={User} label="Assigned To" value={tender.assigned_to} />
            <DetailItem
              icon={IndianRupee}
              label="Estimated Value"
              value={
                tender.estimated_value
                  ? `₹${Number(tender.estimated_value).toLocaleString("en-IN")}`
                  : null
              }
            />
            <DetailItem
              icon={Calendar}
              label="Submission Deadline"
              value={
                tender.submission_deadline
                  ? format(new Date(tender.submission_deadline), "dd MMMM yyyy")
                  : null
              }
            />
            <DetailItem icon={Tag} label="Category" value={categoryLabels[tender.category]} />
            <DetailItem icon={Globe} label="Source" value={sourceLabels[tender.source]} />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Contact */}
            {(tender.contact_email || tender.contact_phone) && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-1">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Contact
                </h3>
                <DetailItem icon={Mail} label="Email" value={tender.contact_email} />
                <DetailItem icon={Phone} label="Phone" value={tender.contact_phone} />
              </div>
            )}

            {/* Description */}
            {tender.description && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Description
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {tender.description}
                </p>
              </div>
            )}

            {/* Remarks */}
            {tender.remarks && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Remarks
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {tender.remarks}
                </p>
              </div>
            )}
          </div>

          {/* Documents */}
          <TenderFileUpload tenderId={id} userData={userData} />
        </motion.div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-100 p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <ListTodo className="w-3.5 h-3.5" /> Tasks ({tasks.length})
            </h3>
            <Button
              onClick={() => {
                setEditTask(null);
                setShowTaskForm(true);
              }}
              size="sm"
              className="bg-[#1e3a8a] hover:bg-[#1e40af] gap-1.5 h-7 text-xs"
            >
              <Plus className="w-4 h-4" /> Add Task
            </Button>
          </div>

          {loadingTasks ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-4 border-gray-200 border-t-[#00A3E0] rounded-full animate-spin" />
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onEdit={(task) => {
                setEditTask(task);
                setShowTaskForm(true);
              }}
              onDelete={(taskId) => deleteTaskMutation.mutate(taskId)}
              userData={userData}
            />
          )}
        </motion.div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TenderAuditLog tenderId={id} userData={userData} />
        </motion.div>
        )}
        </>

        {/* Edit dialog */}
        <TenderFormDialog
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSave={(data) => updateMutation.mutate(data)}
          tender={tender}
          team={team}
        />

        {/* Task Form Dialog */}
        <TaskFormDialog
          open={showTaskForm}
          onClose={() => {
            setShowTaskForm(false);
            setEditTask(null);
          }}
          onSave={handleSaveTask}
          task={editTask}
          tenderId={id}
        />
      </div>
    </div>
  );
}