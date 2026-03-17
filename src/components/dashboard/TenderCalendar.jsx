import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay,
  isToday, addMonths, subMonths, parseISO,
} from "date-fns";

const EVENT_TYPES = {
  prebid:       { label: "Pre-bid",      dot: "bg-[#3b82f6]", pill: "bg-blue-500/10 text-blue-700 border-l-2 border-blue-500",       icon: "🗓" },
  presentation: { label: "Presentation", dot: "bg-[#8b5cf6]", pill: "bg-purple-500/10 text-purple-700 border-l-2 border-purple-500", icon: "📊" },
  meeting:      { label: "Meeting",      dot: "bg-[#10b981]", pill: "bg-emerald-500/10 text-emerald-700 border-l-2 border-emerald-500",icon: "🤝" },
};

const STATUS_SKIP = ["won", "lost"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildEvents(tenders) {
  const events = [];
  tenders.filter((t) => !STATUS_SKIP.includes(t.status)).forEach((t) => {
    if (t.prebid_date)       events.push({ date: t.prebid_date,       type: "prebid",       tender: t });
    if (t.presentation_date) events.push({ date: t.presentation_date, type: "presentation", tender: t });
    if (t.meeting_date)      events.push({ date: t.meeting_date,      type: "meeting",      tender: t });
  });
  return events;
}

const statusConfig = {
  new:         { label: "New",         cls: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  submitted:   { label: "Submitted",   cls: "bg-purple-50 text-purple-700 border-purple-200" },
  won:         { label: "Won",         cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  lost:        { label: "Lost",        cls: "bg-red-50 text-red-700 border-red-200" },
  on_hold:     { label: "On Hold",     cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

export default function TenderCalendar({ tenders = [], team }) {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTender, setSelectedTender] = useState(null);

  const events = useMemo(() => buildEvents(tenders), [tenders]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end   = endOfWeek(endOfMonth(currentMonth),     { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getEventsForDay = (day) => events.filter((e) => isSameDay(parseISO(e.date), day));
  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const totalThisMonth = useMemo(() =>
    events.filter((e) => isSameMonth(parseISO(e.date), currentMonth)).length,
  [events, currentMonth]);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Gradient Header ── */}
      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <CalendarDays className="w-4 h-4 text-blue-200" />
              <span className="text-blue-200 text-xs font-medium uppercase tracking-widest">Tender Calendar</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            {totalThisMonth > 0 && (
              <p className="text-blue-300 text-xs mt-0.5">{totalThisMonth} milestone{totalThisMonth !== 1 ? "s" : ""} this month</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="h-8 px-3 rounded-xl text-xs font-semibold text-blue-100 hover:text-white hover:bg-white/10 transition-all"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4">
          {Object.entries(EVENT_TYPES).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${val.dot}`} />
              <span className="text-blue-200 text-xs">{val.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Day-of-week row ── */}
      <div className="grid grid-cols-7 bg-gray-50/80 border-b border-gray-200">
        {DAY_LABELS.map((d, i) => (
          <div key={d} className={`py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider ${i < 6 ? "border-r border-gray-200" : ""}`}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ── */}
      <div className="grid grid-cols-7 border-l border-gray-200">
        {days.map((day, i) => {
          const dayEvents     = getEventsForDay(day);
          const isCurrentMo   = isSameMonth(day, currentMonth);
          const isSelected    = selectedDay && isSameDay(day, selectedDay);
          const isTodayDay    = isToday(day);
          const hasEvents     = dayEvents.length > 0;

          return (
            <div
              key={i}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`
                min-h-[84px] p-2 border-b border-r border-gray-200 cursor-pointer transition-all group relative
                ${isCurrentMo ? "bg-white hover:bg-blue-50/40" : "bg-gray-50/60"}
                ${isSelected  ? "bg-blue-50/60 ring-2 ring-inset ring-[#1e3a8a]/30" : ""}
                ${hasEvents && !isSelected ? "hover:bg-indigo-50/30" : ""}
              `}
            >
              {/* Date number */}
              <div className={`
                w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold mb-1.5 transition-all
                ${isTodayDay
                  ? "bg-gradient-to-br from-[#1e3a8a] to-[#00A3E0] text-white shadow-md shadow-blue-300/40"
                  : isCurrentMo
                  ? "text-gray-700 group-hover:bg-gray-100"
                  : "text-gray-300"}
              `}>
                {format(day, "d")}
              </div>

              {/* Event pills */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map((ev, j) => (
                    <div
                      key={j}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTender(ev.tender);
                      }}
                      className={`text-[10px] truncate px-1.5 py-0.5 rounded-md font-medium leading-4 cursor-pointer hover:shadow-md transition-all ${EVENT_TYPES[ev.type].pill}`}
                      title={`${EVENT_TYPES[ev.type].label}: ${ev.tender.tender_name}`}
                    >
                      {ev.tender.client_name
                        ? `${ev.tender.client_name}`
                        : ev.tender.tender_name}
                    </div>
                  ))}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] text-gray-400 font-medium px-1">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Selected day detail panel ── */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {format(selectedDay, "EEEE")}
                  </p>
                  <h3 className="text-base font-bold text-gray-800 mt-0.5">
                    {format(selectedDay, "dd MMMM yyyy")}
                  </h3>
                </div>
                {selectedEvents.length > 0 && (
                  <span className="text-xs bg-[#1e3a8a] text-white rounded-full px-2.5 py-1 font-semibold">
                    {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {selectedEvents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No milestones on this day</p>
              ) : (
                <div className="space-y-2.5">
                  {selectedEvents.map((ev, i) => {
                    const st = statusConfig[ev.tender.status] || { label: ev.tender.status, cls: "bg-gray-50 text-gray-600 border-gray-200" };
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => navigate(createPageUrl(`TenderDetail?id=${ev.tender.id}&team=${team}`))}
                        className="group/card flex items-center gap-4 p-3.5 rounded-2xl bg-white border border-gray-100 hover:border-[#1e3a8a]/30 hover:shadow-md hover:shadow-blue-100/50 cursor-pointer transition-all"
                      >
                        {/* Icon bubble */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                          ev.type === "prebid" ? "bg-blue-100" :
                          ev.type === "presentation" ? "bg-purple-100" : "bg-emerald-100"
                        }`}>
                          {EVENT_TYPES[ev.type].icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate group-hover/card:text-[#1e3a8a] transition-colors">
                            {ev.tender.tender_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${EVENT_TYPES[ev.type].dot}`} />
                            <p className="text-xs text-gray-400">
                              {EVENT_TYPES[ev.type].label}
                              {ev.tender.client_name ? ` · ${ev.tender.client_name}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-xs ${st.cls}`}>
                            {st.label}
                          </Badge>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover/card:text-[#1e3a8a] transition-colors" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tender Detail Popover */}
      <AnimatePresence>
        {selectedTender && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTender(null)}
              className="fixed inset-0 bg-black/30 z-40"
            />
            {/* Popover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] px-6 py-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg leading-tight">{selectedTender.tender_name}</h3>
                  <p className="text-blue-200 text-sm mt-1">{selectedTender.client_name}</p>
                </div>
                <button
                  onClick={() => setSelectedTender(null)}
                  className="text-blue-200 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase w-28">Status</span>
                  <Badge className={statusConfig[selectedTender.status]?.cls || "bg-gray-50 text-gray-600 border-gray-200"}>
                    {statusConfig[selectedTender.status]?.label || selectedTender.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase w-28">Priority</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    selectedTender.priority === "critical" ? "bg-red-100 text-red-700" :
                    selectedTender.priority === "high" ? "bg-orange-100 text-orange-700" :
                    selectedTender.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {selectedTender.priority?.charAt(0).toUpperCase() + selectedTender.priority?.slice(1)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase w-28">Type</span>
                  <span className="text-sm text-gray-700 capitalize">{selectedTender.opp_type?.replace(/_/g, " ")}</span>
                </div>

                {selectedTender.estimated_value && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase w-28">Value</span>
                    <span className="text-sm font-semibold text-gray-900">₹ {selectedTender.estimated_value.toLocaleString()}</span>
                  </div>
                )}

                {selectedTender.sales_person && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase w-28">Sales</span>
                    <span className="text-sm text-gray-700">{selectedTender.sales_person}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => {
                    navigate(createPageUrl(`TenderDetail?id=${selectedTender.id}&team=${team}`));
                    setSelectedTender(null);
                  }}
                  className="w-full px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  View Details
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}