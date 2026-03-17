import React, { useState, useEffect, useMemo } from "react";
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
import api from "@/api/client";

const defaultForm = {
  opp_type: "",
  status: "new",
  pot_id: "",
  tender_name: "",
  date: "",
  submission_date: "",
  regional_sales_manager: "",
  sales_person: "",
  senior_solution_architect: "",
  solution_architect_assigned: "",
  solution_architect_employee_number: "",
  prebid_date: "",
  presentation_date: "",
  meeting_date: "",
  priority: "medium",
  estimated_value: "",
  client_name: "",
};

export default function TenderFormDialog({ open, onClose, onSave, tender, team, userData }) {
  const [form, setForm] = useState(defaultForm);
  const [salesProfiles, setSalesProfiles] = useState([]);
  const [presalesProfiles, setPresalesProfiles] = useState([]);
  const [salesManagerSearch, setSalesManagerSearch] = useState("");
  const [salesPersonSearch, setSalesPersonSearch] = useState("");
  const [seniorSaSearch, setSeniorSaSearch] = useState("");
  const [assignedSaSearch, setAssignedSaSearch] = useState("");

  useEffect(() => {
    if (tender) {
      setForm({ ...defaultForm, ...tender });
    } else {
      // Auto-fill employee number from logged-in user
      setForm({ ...defaultForm, solution_architect_employee_number: userData?.employeeNumber || "" });
    }
  }, [tender, open, userData]);

  // Load sales & presales profiles when dialog opens
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const [salesRes, presalesRes] = await Promise.all([
          api.get("/user-profiles", { params: { team: "sales" } }),
          api.get("/user-profiles", { params: { team: "presales" } }),
        ]);
        setSalesProfiles(salesRes.data || []);
        setPresalesProfiles(presalesRes.data || []);
      } catch (err) {
        console.error("Failed to load user profiles for tender form", err);
      }
    };
    load();
  }, [open]);

  const filteredSalesForManager = useMemo(() => {
    const q = salesManagerSearch.toLowerCase();
    const current = form.regional_sales_manager || "";
    return salesProfiles.filter((p) => {
      const label = (p.full_name || p.email || "").toString();
      if (label === current) return true;
      if (!q) return true;
      return label.toLowerCase().includes(q);
    });
  }, [salesProfiles, salesManagerSearch, form.regional_sales_manager]);

  const filteredSalesForPerson = useMemo(() => {
    const q = salesPersonSearch.toLowerCase();
    const current = form.sales_person || "";
    return salesProfiles.filter((p) => {
      const label = (p.full_name || p.email || "").toString();
      if (label === current) return true;
      if (!q) return true;
      return label.toLowerCase().includes(q);
    });
  }, [salesProfiles, salesPersonSearch, form.sales_person]);

  const filteredPresalesForSenior = useMemo(() => {
    const q = seniorSaSearch.toLowerCase();
    const current = form.senior_solution_architect || "";
    return presalesProfiles.filter((p) => {
      const label = (p.full_name || p.email || "").toString();
      if (label === current) return true;
      if (!q) return true;
      return label.toLowerCase().includes(q);
    });
  }, [presalesProfiles, seniorSaSearch, form.senior_solution_architect]);

  const filteredPresalesForAssigned = useMemo(() => {
    const q = assignedSaSearch.toLowerCase();
    const current = form.solution_architect_assigned || "";
    return presalesProfiles.filter((p) => {
      const label = (p.full_name || p.email || "").toString();
      if (label === current) return true;
      if (!q) return true;
      return label.toLowerCase().includes(q);
    });
  }, [presalesProfiles, assignedSaSearch, form.solution_architect_assigned]);

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
              <Label>Tender Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Submission Date</Label>
              <Input
                type="date"
                value={form.submission_date || ""}
                onChange={(e) => set("submission_date", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Regional Sales Manager *</Label>
              <Select
                value={form.regional_sales_manager || ""}
                onValueChange={(v) => set("regional_sales_manager", v)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1">
                    <Input
                      placeholder="Search sales..."
                      value={salesManagerSearch}
                      onChange={(e) => setSalesManagerSearch(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  {filteredSalesForManager.map((p) => {
                    const label = p.full_name || p.email;
                    return (
                      <SelectItem key={p.id} value={label}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Sales Person *</Label>
              <Select
                value={form.sales_person || ""}
                onValueChange={(v) => set("sales_person", v)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sales person" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1">
                    <Input
                      placeholder="Search sales..."
                      value={salesPersonSearch}
                      onChange={(e) => setSalesPersonSearch(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  {filteredSalesForPerson.map((p) => {
                    const label = p.full_name || p.email;
                    return (
                      <SelectItem key={p.id} value={label}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Senior Solution Architect *</Label>
              <Select
                value={form.senior_solution_architect || ""}
                onValueChange={(v) => set("senior_solution_architect", v)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select senior architect" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1">
                    <Input
                      placeholder="Search presales..."
                      value={seniorSaSearch}
                      onChange={(e) => setSeniorSaSearch(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  {filteredPresalesForSenior.map((p) => {
                    const label = p.full_name || p.email;
                    return (
                      <SelectItem key={p.id} value={label}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Solution Architect Assigned *</Label>
              <Select
                value={form.solution_architect_assigned || ""}
                onValueChange={(v) => set("solution_architect_assigned", v)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assigned architect" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1">
                    <Input
                      placeholder="Search presales..."
                      value={assignedSaSearch}
                      onChange={(e) => setAssignedSaSearch(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  {filteredPresalesForAssigned.map((p) => {
                    const label = p.full_name || p.email;
                    return (
                      <SelectItem key={p.id} value={label}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
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