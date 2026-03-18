import React, { useState } from "react";
import api from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import { Plus, Trash2, Bell, Mail, Loader2 } from "lucide-react";

const TYPE_LABELS = { due_date: "Due Date Alert", status_change: "Status Change Alert", task_due: "Task Due Alert" };
const STATUS_OPTIONS = ["new", "in_progress", "submitted", "won", "lost", "on_hold"];
const DATE_FIELD_OPTIONS = [
  { value: "prebid_date", label: "Prebid Date" },
  { value: "presentation_date", label: "Presentation Date" },
  { value: "meeting_date", label: "Meeting Date" },
];
const DEFAULT_RULE = {
  type: "due_date",
  date_fields: ["prebid_date", "presentation_date", "meeting_date"],
  threshold_days: 3,
  watch_statuses: ["won", "lost"],
  send_email: false,
  is_active: true,
};

export default function NotificationRulesDialog({ open, onClose, userData }) {
  const [adding, setAdding] = useState(false);
  const [newRule, setNewRule] = useState(DEFAULT_RULE);
  const [deleteRuleId, setDeleteRuleId] = useState(null);
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ["notification-rules", userData?.email],
    queryFn: () =>
      api
        .get("/notification-rules", { params: { user_email: userData.email } })
        .then((r) => r.data),
    enabled: !!userData?.email && open,
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      api.post("/notification-rules", { ...data, user_email: userData.email }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-rules", userData?.email] });
      setAdding(false);
      setNewRule(DEFAULT_RULE);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) =>
      api.put(`/notification-rules/${id}`, data).then((r) => r.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notification-rules", userData?.email] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/notification-rules/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-rules", userData?.email] });
      setDeleteRuleId(null);
    },
    onError: () => setDeleteRuleId(null),
  });

  const toggleDateField = (f) =>
    setNewRule((p) => ({
      ...p,
      date_fields: p.date_fields?.includes(f) ? p.date_fields.filter((x) => x !== f) : [...(p.date_fields || []), f],
    }));

  const toggleStatus = (s) =>
    setNewRule((p) => ({
      ...p,
      watch_statuses: p.watch_statuses?.includes(s)
        ? p.watch_statuses.filter((x) => x !== s)
        : [...(p.watch_statuses || []), s],
    }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#00A3E0]" /> Notification Rules
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{TYPE_LABELS[rule.type]}</p>
                  {(rule.type === "due_date" || rule.type === "task_due") && (
                    <p className="text-xs text-gray-500 mt-0.5">{rule.threshold_days} day{rule.threshold_days !== 1 ? "s" : ""} before</p>
                  )}
                  {rule.type === "status_change" && rule.watch_statuses?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1">
                      {rule.watch_statuses.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs capitalize">{s.replace("_", " ")}</Badge>
                      ))}
                    </div>
                  )}
                  {rule.send_email && (
                    <p className="text-xs text-blue-500 flex items-center gap-1 mt-1"><Mail className="w-3 h-3" /> Email enabled</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(v) => updateMutation.mutate({ id: rule.id, data: { is_active: v } })}
                  />
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600"
                    onClick={() => setDeleteRuleId(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {rules.length === 0 && !adding && (
            <div className="text-center py-8 text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No rules yet. Add one to get started.</p>
            </div>
          )}

          {adding && (
            <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 space-y-4 bg-blue-50/30">
              <div className="space-y-1.5">
                <Label>Alert Type</Label>
                <Select value={newRule.type} onValueChange={(v) => setNewRule((p) => ({ ...p, type: v }))}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="due_date">Due Date Alert</SelectItem>
                    <SelectItem value="status_change">Status Change Alert</SelectItem>
                    <SelectItem value="task_due">Task Due Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(newRule.type === "due_date" || newRule.type === "task_due") && (
                <div className="space-y-1.5">
                  <Label>Alert me (days before)</Label>
                  <Input
                    type="number" min={1} max={30}
                    value={newRule.threshold_days}
                    onChange={(e) => setNewRule((p) => ({ ...p, threshold_days: Number(e.target.value) }))}
                    className="bg-white w-24"
                  />
                </div>
              )}

              {newRule.type === "due_date" && (
                <div className="space-y-1.5">
                  <Label>Date Fields to Watch</Label>
                  <div className="flex flex-wrap gap-2">
                    {DATE_FIELD_OPTIONS.map((opt) => (
                      <button
                        key={opt.value} type="button" onClick={() => toggleDateField(opt.value)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          newRule.date_fields?.includes(opt.value)
                            ? "bg-[#00A3E0] text-white border-[#00A3E0]"
                            : "bg-white text-gray-600 border-gray-300 hover:border-[#00A3E0]"
                        }`}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {newRule.type === "status_change" && (
                <div className="space-y-1.5">
                  <Label>Watch Statuses</Label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s} type="button" onClick={() => toggleStatus(s)}
                        className={`text-xs px-3 py-1 rounded-full border capitalize transition-colors ${
                          newRule.watch_statuses?.includes(s)
                            ? "bg-[#00A3E0] text-white border-[#00A3E0]"
                            : "bg-white text-gray-600 border-gray-300 hover:border-[#00A3E0]"
                        }`}
                      >{s.replace("_", " ")}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  id="send_email" checked={newRule.send_email}
                  onCheckedChange={(v) => setNewRule((p) => ({ ...p, send_email: v }))}
                />
                <Label htmlFor="send_email" className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <Mail className="w-4 h-4 text-gray-400" /> Also send email notification
                </Label>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => createMutation.mutate(newRule)}
                  className="bg-[#00A3E0] hover:bg-[#008bbf] text-white min-w-[90px]"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving...</>
                  ) : (
                    "Save Rule"
                  )}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setAdding(false); setNewRule(DEFAULT_RULE); }} disabled={createMutation.isPending}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!adding && (
            <Button variant="outline" className="w-full gap-2" onClick={() => setAdding(true)}>
              <Plus className="w-4 h-4" /> Add Notification Rule
            </Button>
          )}
        </div>
      </DialogContent>

      <ConfirmDeleteDialog
        open={deleteRuleId !== null}
        title="Delete notification rule"
        description="Are you sure you want to delete this notification rule? You will stop receiving alerts from it."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteRuleId)}
        onCancel={() => setDeleteRuleId(null)}
      />
    </Dialog>
  );
}