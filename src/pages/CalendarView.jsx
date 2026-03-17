import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const team = urlParams.get("team") || "sales";
  
  const [viewMode, setViewMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const userData = (() => {
    try {
      return JSON.parse(localStorage.getItem("esds_user") || "{}");
    } catch {
      return {};
    }
  })();

  const { data: tenders = [] } = useQuery({
    queryKey: ["tenders", team],
    queryFn: () => base44.entities.Tender.filter({ team }, "-created_date"),
  });

  const getRelevantDates = (tender) => {
    return [
      tender.prebid_date,
      tender.presentation_date,
      tender.meeting_date,
      tender.date,
    ].filter(Boolean);
  };

  const getTendersForDate = (date) => {
    return tenders.filter((tender) => {
      const dates = getRelevantDates(tender);
      return dates.some((d) => isSameDay(new Date(d), date));
    });
  };

  const getEventTypeForTender = (tender, date) => {
    if (tender.prebid_date && isSameDay(new Date(tender.prebid_date), date))
      return "Prebid";
    if (tender.presentation_date && isSameDay(new Date(tender.presentation_date), date))
      return "Presentation";
    if (tender.meeting_date && isSameDay(new Date(tender.meeting_date), date))
      return "Meeting";
    if (tender.date && isSameDay(new Date(tender.date), date))
      return "Tender";
    return null;
  };

  const statusColors = {
    new: "bg-blue-100 text-blue-700 border-blue-200",
    in_progress: "bg-amber-100 text-amber-700 border-amber-200",
    submitted: "bg-purple-100 text-purple-700 border-purple-200",
    won: "bg-emerald-100 text-emerald-700 border-emerald-200",
    lost: "bg-red-100 text-red-700 border-red-200",
    on_hold: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const eventTypeColors = {
    Prebid: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Presentation: "bg-rose-50 text-rose-700 border-rose-200",
    Meeting: "bg-cyan-50 text-cyan-700 border-cyan-200",
    Tender: "bg-green-50 text-green-700 border-green-200",
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7">
          {DAY_NAMES.map((day) => (
            <div key={day} className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 text-center">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-100">
          {days.map((day, idx) => {
            const dayTenders = getTendersForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`min-h-24 p-2 cursor-pointer transition-colors ${
                  isCurrentMonth ? "bg-white hover:bg-blue-50" : "bg-gray-50"
                } ${selectedDate && isSameDay(day, selectedDate) ? "bg-blue-100" : ""}`}
              >
                <p className={`text-xs font-semibold mb-1 ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}`}>
                  {format(day, "d")}
                </p>
                <div className="space-y-0.5">
                  {dayTenders.slice(0, 3).map((tender, i) => {
                    const eventType = getEventTypeForTender(tender, day);
                    return (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(createPageUrl(`TenderDetail?id=${tender.id}&team=${team}`));
                        }}
                        className={`block w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate border ${eventTypeColors[eventType]} hover:shadow-md transition-shadow`}
                        title={`${tender.tender_name} - ${eventType}`}
                      >
                        {eventType}
                      </button>
                    );
                  })}
                  {dayTenders.length > 3 && (
                    <p className="text-xs text-gray-500 px-1.5">+{dayTenders.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-auto">
        <div className="grid grid-cols-7 gap-px bg-gray-100 min-w-full">
          {days.map((day, idx) => {
            const dayTenders = getTendersForDate(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={idx}
                className={`min-h-96 p-3 ${isToday ? "bg-blue-50" : "bg-white"}`}
              >
                <div className="mb-3 pb-3 border-b">
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    {format(day, "EEE")}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? "text-blue-700" : "text-gray-900"}`}>
                    {format(day, "d")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(day, "MMM")}
                  </p>
                </div>

                <div className="space-y-2">
                  {dayTenders.map((tender, i) => {
                    const eventType = getEventTypeForTender(tender, day);
                    return (
                      <button
                        key={i}
                        onClick={() => navigate(createPageUrl(`TenderDetail?id=${tender.id}&team=${team}`))}
                        className={`w-full text-left p-2 rounded border text-xs ${eventTypeColors[eventType]} hover:shadow-md transition-shadow`}
                      >
                        <p className="font-semibold truncate">{eventType}</p>
                        <p className="text-xs opacity-75 truncate">{tender.tender_name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg h-8 w-8"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                Tender Calendar
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {team === "sales" ? "Sales" : "Presales"} Team
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {["month", "week"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                    viewMode === mode
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {mode} View
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-4 bg-white rounded-lg p-3 border border-gray-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentDate(viewMode === "month" ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {viewMode === "month"
                ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : `Week of ${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}`}
            </h2>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentDate(viewMode === "month" ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar View */}
        <motion.div
          key={viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === "month" ? renderMonthView() : renderWeekView()}
        </motion.div>

        {/* Legend */}
        <div className="mt-4 bg-white rounded-lg p-3 border border-gray-100">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Event Types</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(eventTypeColors).map(([type, colors]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${colors.split(" ")[0]} border ${colors.split(" ")[2]}`} />
                <span className="text-xs text-gray-600">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}