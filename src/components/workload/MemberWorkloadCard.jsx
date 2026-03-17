import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock, FileText, Zap } from "lucide-react";
import { differenceInDays } from "date-fns";

const ACTIVE_TASK_CAP = 10; // tasks considered "full capacity"
const TENDER_CAP = 8;

function CapacityBar({ value, cap, colorClass }) {
  const pct = Math.min(100, Math.round((value / cap) * 100));
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className={`h-2 rounded-full ${colorClass}`}
      />
    </div>
  );
}

function capacityMeta(activeTasks, tenders) {
  const score = (activeTasks / ACTIVE_TASK_CAP) * 0.6 + (tenders / TENDER_CAP) * 0.4;
  if (score >= 0.85) return { label: "Overloaded", badgeClass: "bg-red-100 text-red-700", barColor: "bg-red-500" };
  if (score >= 0.6)  return { label: "High Load",  badgeClass: "bg-orange-100 text-orange-700", barColor: "bg-orange-400" };
  if (score >= 0.3)  return { label: "Moderate",   badgeClass: "bg-amber-100 text-amber-700", barColor: "bg-amber-400" };
  return               { label: "Available",  badgeClass: "bg-emerald-100 text-emerald-700", barColor: "bg-emerald-500" };
}

export default function MemberWorkloadCard({ member, index }) {
  const { name, activeTasks, completedTasks, overdueCount, upcomingCount, tenderCount, activeTenderNames } = member;
  const totalTasks = activeTasks + completedTasks;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const cap = capacityMeta(activeTasks, tenderCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#00A3E0] flex items-center justify-center text-white font-bold text-sm shrink-0">
            {name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">{name}</p>
            <p className="text-xs text-gray-400">{activeTasks} active tasks · {tenderCount} tenders</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cap.badgeClass}`}>
          {cap.label}
        </span>
      </div>

      {/* Capacity Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Overall Capacity</span>
          <span>{Math.min(100, Math.round(((activeTasks / ACTIVE_TASK_CAP) * 0.6 + (tenderCount / TENDER_CAP) * 0.4) * 100))}%</span>
        </div>
        <CapacityBar
          value={(activeTasks / ACTIVE_TASK_CAP) * 0.6 + (tenderCount / TENDER_CAP) * 0.4}
          cap={1}
          colorClass={cap.barColor}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-blue-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-blue-600 font-medium">Active Tasks</span>
          </div>
          <p className="text-xl font-bold text-blue-700">{activeTasks}</p>
          <CapacityBar value={activeTasks} cap={ACTIVE_TASK_CAP} colorClass="bg-blue-400 mt-1" />
        </div>

        <div className="bg-emerald-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">Completed</span>
          </div>
          <p className="text-xl font-bold text-emerald-700">{completedTasks}</p>
          <div className="text-xs text-emerald-500 mt-1">{completionPct}% rate</div>
        </div>

        <div className={`rounded-xl p-3 ${overdueCount > 0 ? "bg-red-50" : "bg-gray-50"}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className={`w-3.5 h-3.5 ${overdueCount > 0 ? "text-red-500" : "text-gray-400"}`} />
            <span className={`text-xs font-medium ${overdueCount > 0 ? "text-red-600" : "text-gray-500"}`}>Overdue</span>
          </div>
          <p className={`text-xl font-bold ${overdueCount > 0 ? "text-red-700" : "text-gray-400"}`}>{overdueCount}</p>
        </div>

        <div className={`rounded-xl p-3 ${upcomingCount > 0 ? "bg-amber-50" : "bg-gray-50"}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className={`w-3.5 h-3.5 ${upcomingCount > 0 ? "text-amber-500" : "text-gray-400"}`} />
            <span className={`text-xs font-medium ${upcomingCount > 0 ? "text-amber-600" : "text-gray-500"}`}>Due in 3d</span>
          </div>
          <p className={`text-xl font-bold ${upcomingCount > 0 ? "text-amber-700" : "text-gray-400"}`}>{upcomingCount}</p>
        </div>
      </div>

      {/* Assigned Tenders */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <FileText className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Assigned Tenders</span>
          <span className="ml-auto text-xs font-bold text-gray-600">{tenderCount}</span>
        </div>
        <CapacityBar value={tenderCount} cap={TENDER_CAP} colorClass="bg-[#1e3a8a]" />
        {activeTenderNames.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {activeTenderNames.slice(0, 3).map((name, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5 truncate max-w-[160px]">{name}</span>
            ))}
            {activeTenderNames.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-500 rounded-md px-2 py-0.5">+{activeTenderNames.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}