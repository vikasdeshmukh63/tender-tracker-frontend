import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const defaultForm = {
  opp_type: "",
  status: "new",
  pot_id: "",
  tender_name: "",
  date: "",
  month: "",
  year: "",
  regional_sales_manager: "",
  sales_person: "",
  senior_solution_architect: "",
  solution_architect_assigned: "",
  solution_architect_employee_number: "",
  prebid_date: "",
  presentation_date: "",
  meeting_date: "",
  work_status: "",
  priority: "medium",
  estimated_value: "",
  client_name: "",
};

export default function TenderFormDialog({ open, onClose, onSave, tender, team, userData }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (tender) {
      setForm({ ...defaultForm, ...tender });
    } else {
      // Auto-fill employee number from logged-in user
      setForm({ ...defaultForm, solution_architect_employee_number: userData?.employeeNumber || "" });
    }
  }, [tender, open, userData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      team,
      estimated_value: form.estimated_value ? Number(form.estimated_value) : undefined,
    });
  };

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {tender ? "Edit Tender" : "New Tender"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>OPP Type *</Label>
              <Select value={form.opp_type || ""} onValueChange={(v) => set("opp_type", v)} required>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_business">New Business</SelectItem>
                  <SelectItem value="renewal">Renewal</SelectItem>
                  <SelectItem value="upsell">Upsell</SelectItem>
                  <SelectItem value="cross_sell">Cross Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>POT ID *</Label>
              <Input
                value={form.pot_id}
                onChange={(e) => set("pot_id", e.target.value)}
                placeholder="Opportunity ID"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tender Name *</Label>
              <Input
                value={form.tender_name}
                onChange={(e) => set("tender_name", e.target.value)}
                placeholder="Enter tender name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Month *</Label>
              <Input
                value={form.month}
                onChange={(e) => set("month", e.target.value)}
                placeholder="e.g., January"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Year *</Label>
              <Input
                value={form.year}
                onChange={(e) => set("year", e.target.value)}
                placeholder="e.g., 2026"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Regional Sales Manager *</Label>
              <Input
                value={form.regional_sales_manager}
                onChange={(e) => set("regional_sales_manager", e.target.value)}
                placeholder="Manager name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Sales Person *</Label>
              <Input
                value={form.sales_person}
                onChange={(e) => set("sales_person", e.target.value)}
                placeholder="Sales person name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Senior Solution Architect *</Label>
              <Input
                value={form.senior_solution_architect}
                onChange={(e) => set("senior_solution_architect", e.target.value)}
                placeholder="Senior architect name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Solution Architect Assigned *</Label>
              <Input
                value={form.solution_architect_assigned}
                onChange={(e) => set("solution_architect_assigned", e.target.value)}
                placeholder="Assigned architect"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Employee Number</Label>
              <Input
                value={form.solution_architect_employee_number}
                onChange={(e) => set("solution_architect_employee_number", e.target.value)}
                placeholder="Auto-filled from login"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Prebid Date *</Label>
              <Input
                type="date"
                value={form.prebid_date}
                onChange={(e) => set("prebid_date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Presentation Date *</Label>
              <Input
                type="date"
                value={form.presentation_date}
                onChange={(e) => set("presentation_date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Meeting Date *</Label>
              <Input
                type="date"
                value={form.meeting_date}
                onChange={(e) => set("meeting_date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
               <Label>Work Status *</Label>
               <Select value={form.work_status || ""} onValueChange={(v) => set("work_status", v)} required>
                 <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="work_in_progress">Mark as Not Submitted</SelectItem>
                 </SelectContent>
               </Select>
             </div>

            <div className="space-y-1.5">
              <Label>Priority *</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Estimated Value (₹)</Label>
              <Input
                type="number"
                value={form.estimated_value}
                onChange={(e) => set("estimated_value", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input
                value={form.client_name}
                onChange={(e) => set("client_name", e.target.value)}
                placeholder="Organization name"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#00A3E0] hover:bg-[#008bbf] text-white"
            >
              {tender ? "Update Tender" : "Create Tender"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}