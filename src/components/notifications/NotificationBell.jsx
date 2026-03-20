import React, { useState } from "react";
import api from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Settings, Calendar, RefreshCw, ClipboardList, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import NotificationRulesDialog from "./NotificationRulesDialog";

const TYPE_ICONS = {
  due_date: Calendar,
  status_change: RefreshCw,
  task_due: ClipboardList,
  task_assigned: UserCheck,
};

const TYPE_COLORS = {
  due_date: "text-orange-500",
  status_change: "text-blue-500",
  task_due: "text-purple-500",
  task_assigned: "text-emerald-500",
};

export default function NotificationBell({ userData }) {
  const [open, setOpen] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userData?.email],
    queryFn: () =>
      api
        .get("/notifications", { params: { user_email: userData.email, limit: 50 } })
        .then((r) => r.data),
    enabled: !!userData?.email,
    refetchInterval: 30_000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}`, { is_read: true }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications", userData?.email] }),
  });

  // Single request to mark ALL unread as read
  const markAllReadMutation = useMutation({
    mutationFn: () =>
      api.put("/notifications/mark-all-read", { user_email: userData.email }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications", userData?.email] }),
  });

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-xl relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0 shadow-xl" align="end">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  {markAllReadMutation.isPending ? "..." : "All read"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => { setOpen(false); setShowRules(true); }}
                title="Notification Settings"
              >
                <Settings className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-72">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400 gap-2">
                <Bell className="w-8 h-8 opacity-20" />
                <p className="text-sm">No notifications yet</p>
                <button
                  className="text-xs text-[#00A3E0] hover:underline"
                  onClick={() => { setOpen(false); setShowRules(true); }}
                >
                  Set up alert rules →
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif) => {
                  const Icon = TYPE_ICONS[notif.type] || Bell;
                  const ts = notif.created_at || notif.createdAt || notif.created_date;
                  return (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.is_read ? "bg-blue-50/60" : ""}`}
                      onClick={() => !notif.is_read && markReadMutation.mutate(notif.id)}
                    >
                      <div className="flex items-start gap-2.5">
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${TYPE_COLORS[notif.type] || "text-gray-400"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${!notif.is_read ? "font-medium text-gray-900" : "text-gray-600"}`}>
                            {notif.message || notif.title || notif.body || "Notification"}
                          </p>
                          {ts && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDistanceToNow(new Date(ts), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <NotificationRulesDialog
        open={showRules}
        onClose={() => setShowRules(false)}
        userData={userData}
      />
    </>
  );
}
