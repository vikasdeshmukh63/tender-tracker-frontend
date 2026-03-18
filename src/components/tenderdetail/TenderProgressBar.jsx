import React, { useMemo } from "react";
import { Check, Circle, Trophy, XCircle, PauseCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const MAIN_STEPS = [
  { key: "new",         label: "New",         color: "blue"   },
  { key: "in_progress", label: "In Progress",  color: "amber"  },
  { key: "submitted",   label: "Submitted",    color: "purple" },
  { key: "won",         label: "Won",          color: "emerald"},
];

const STATUS_ORDER = ["new", "in_progress", "submitted", "won"];

const stepTheme = {
  blue:    { ring: "ring-blue-400",    bg: "bg-blue-500",    text: "text-blue-600",    light: "bg-blue-50",   border: "border-blue-200"   },
  amber:   { ring: "ring-amber-400",   bg: "bg-amber-500",   text: "text-amber-600",   light: "bg-amber-50",  border: "border-amber-200"  },
  purple:  { ring: "ring-purple-400",  bg: "bg-purple-500",  text: "text-purple-600",  light: "bg-purple-50", border: "border-purple-200" },
  emerald: { ring: "ring-emerald-400", bg: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-50",border: "border-emerald-200"},
};

export default function TenderProgressBar({ tender, auditLogs = [] }) {
  const currentStatus = tender?.status || "new";
  const isLost    = currentStatus === "lost";
  const isOnHold  = currentStatus === "on_hold";

  // Map each status key → the date it was first entered (from audit logs)
  const statusDates = useMemo(() => {
    const map = {};
    const sorted = [...auditLogs]
      .filter((l) => l.action === "status_changed" && l.new_value)
      .sort((a, b) => new Date(a.created_at || a.created_date) - new Date(b.created_at || b.created_date));

    sorted.forEach((l) => {
      if (!map[l.new_value]) map[l.new_value] = l.created_at || l.created_date;
    });

    // "new" date = tender creation date if not in logs
    if (!map["new"] && tender?.created_at) map["new"] = tender.created_at;
    return map;
  }, [auditLogs, tender]);

  // Which main-path statuses have been completed (passed through)?
  const completedSet = useMemo(() => {
    const set = new Set();
    const currentIdx = STATUS_ORDER.indexOf(currentStatus);
    STATUS_ORDER.forEach((s, i) => {
      if (i < currentIdx) set.add(s);
      // If lost/on_hold treat the last meaningful status as completed too
      if ((isLost || isOnHold) && statusDates[s]) set.add(s);
    });
    return set;
  }, [currentStatus, isLost, isOnHold, statusDates]);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try { return format(new Date(dateStr), "dd MMM yy"); }
    catch { return null; }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4 shadow-sm">
      {/* Title row */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Tender Journey
        </h3>
        <StatusPill status={currentStatus} />
      </div>

      {/* Timeline */}
      <div className="relative flex items-start justify-between gap-0">
        {MAIN_STEPS.map((step, idx) => {
          const isCompleted = completedSet.has(step.key);
          const isCurrent   = currentStatus === step.key;
          const isFuture    = !isCompleted && !isCurrent;
          const theme       = stepTheme[step.color];
          const dateLabel   = formatDate(statusDates[step.key]);

          return (
            <React.Fragment key={step.key}>
              {/* Step node */}
              <div className="flex flex-col items-center flex-1 relative z-10">
                {/* Circle */}
                <div className="relative mb-2">
                  {isCompleted ? (
                    <div className={`w-10 h-10 rounded-full ${theme.bg} flex items-center justify-center shadow-sm`}>
                      <Check className="w-5 h-5 text-white stroke-[2.5]" />
                    </div>
                  ) : isCurrent ? (
                    <div className={`relative w-10 h-10 rounded-full ${theme.bg} flex items-center justify-center shadow-md ring-4 ${theme.ring} ring-offset-2`}>
                      <div className="w-3 h-3 rounded-full bg-white" />
                      {/* Pulse animation */}
                      <span className={`absolute inset-0 rounded-full ${theme.bg} opacity-30 animate-ping`} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    </div>
                  )}
                </div>

                {/* Label */}
                <span className={`text-xs font-semibold text-center leading-tight ${
                  isCompleted ? "text-gray-700" : isCurrent ? theme.text : "text-gray-400"
                }`}>
                  {step.label}
                </span>

                {/* Date */}
                {dateLabel ? (
                  <span className="text-[10px] text-gray-400 mt-0.5">{dateLabel}</span>
                ) : isCurrent ? (
                  <span className={`text-[10px] font-medium mt-0.5 ${theme.text}`}>Active</span>
                ) : (
                  <span className="text-[10px] text-gray-300 mt-0.5">—</span>
                )}
              </div>

              {/* Connector line between steps */}
              {idx < MAIN_STEPS.length - 1 && (
                <div className="flex-1 flex items-start pt-5 mx-1">
                  <div className="w-full h-1 rounded-full overflow-hidden bg-gray-200">
                    {isCompleted ? (
                      <div className={`h-full w-full ${theme.bg}`} />
                    ) : null}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Terminal state banners */}
      {isLost && (
        <div className="mt-5 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Tender Lost</p>
            {statusDates["lost"] && (
              <p className="text-xs text-red-400 mt-0.5">
                Marked lost on {formatDate(statusDates["lost"])}
              </p>
            )}
          </div>
        </div>
      )}

      {currentStatus === "won" && (
        <div className="mt-5 flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <Trophy className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-700">Tender Won!</p>
            {statusDates["won"] && (
              <p className="text-xs text-emerald-500 mt-0.5">
                Won on {formatDate(statusDates["won"])}
              </p>
            )}
          </div>
        </div>
      )}

      {isOnHold && (
        <div className="mt-5 flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <PauseCircle className="w-5 h-5 text-gray-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-700">On Hold</p>
            <p className="text-xs text-gray-400 mt-0.5">This tender has been paused.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small pill badge showing the current status */
function StatusPill({ status }) {
  const config = {
    new:         { label: "New",         className: "bg-blue-50 text-blue-600 border-blue-200"     },
    in_progress: { label: "In Progress", className: "bg-amber-50 text-amber-600 border-amber-200"   },
    submitted:   { label: "Submitted",   className: "bg-purple-50 text-purple-600 border-purple-200"},
    won:         { label: "Won",         className: "bg-emerald-50 text-emerald-700 border-emerald-200"},
    lost:        { label: "Lost",        className: "bg-red-50 text-red-600 border-red-200"         },
    on_hold:     { label: "On Hold",     className: "bg-gray-50 text-gray-600 border-gray-200"      },
  };
  const c = config[status] || config.new;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.className}`}>
      <Clock className="w-3 h-3" />
      {c.label}
    </span>
  );
}
