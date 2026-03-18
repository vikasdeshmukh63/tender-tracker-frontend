import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import AssigneeInput from "./AssigneeInput";

const defaultTask = {
  title: "",
  description: "",
  assignees: [],
  due_date: "",
  status: "pending",
  priority: "medium",
};

export default function TaskFormDialog({ open, onClose, onSave, task, tenderId, loading = false }) {
  const [formData, setFormData] = useState(task
    ? { ...task, assignees: task.assignees || (task.assigned_to ? [task.assigned_to] : []) }
    : { ...defaultTask, tender_id: tenderId }
  );

  useEffect(() => {
    if (task) {
      setFormData({ ...task, assignees: task.assignees || (task.assigned_to ? [task.assigned_to] : []) });
    } else {
      setFormData({ ...defaultTask, tender_id: tenderId });
    }
  }, [task, tenderId, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    onSave({ ...formData, assigned_to: formData.assignees?.[0] || "" });
  };

  const set = (key, val) => setFormData((p) => ({ ...p, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <Label>Task Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          {/* Assignees */}
          <div>
            <Label>Assigned To (multiple)</Label>
            <AssigneeInput
              assignees={formData.assignees || []}
              onChange={(v) => set("assignees", v)}
            />
            <p className="text-xs text-gray-400 mt-1">Type an email and press Enter to add. Multiple assignees supported.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => set("due_date", e.target.value)}
              />
            </div>

            {/* Status */}
            <div>
              <Label>Status *</Label>
              <Select value={formData.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="col-span-2">
              <Label>Priority *</Label>
              <Select value={formData.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1e3a8a] hover:bg-[#1e40af] min-w-[120px]" disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{task ? "Updating..." : "Creating..."}</>
              ) : (
                task ? "Update Task" : "Create Task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}