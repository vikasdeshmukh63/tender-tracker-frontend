import { base44 } from "@/api/base44Client";

const TRACKED_FIELDS = {
  status: "Status",
  priority: "Priority",
  estimated_value: "Estimated Value",
  client_name: "Client Name",
  sales_person: "Sales Person",
  regional_sales_manager: "Regional Sales Manager",
  senior_solution_architect: "Senior Solution Architect",
  solution_architect_assigned: "Solution Architect Assigned",
  work_status: "Work Status",
  team: "Team",
  tender_name: "Tender Name",
  prebid_date: "Prebid Date",
  presentation_date: "Presentation Date",
  meeting_date: "Meeting Date",
};

export async function logTenderUpdate(tenderId, oldData, newData, userData) {
  const entries = [];

  for (const [field, label] of Object.entries(TRACKED_FIELDS)) {
    const oldVal = String(oldData[field] ?? "");
    const newVal = String(newData[field] ?? "");
    if (oldVal !== newVal && newVal !== "undefined" && newVal !== "") {
      const action = field === "status" ? "status_changed" : "updated";
      entries.push({
        tender_id: tenderId,
        user_email: userData.email || "",
        user_name: userData.full_name || userData.email || "Unknown",
        action,
        field_changed: label,
        old_value: oldVal || "—",
        new_value: newVal,
      });
    }
  }

  for (const entry of entries) {
    await base44.entities.AuditLog.create(entry);
  }
}

export async function logTenderCreated(tenderId, userData) {
  await base44.entities.AuditLog.create({
    tender_id: tenderId,
    user_email: userData.email || "",
    user_name: userData.full_name || userData.email || "Unknown",
    action: "created",
  });
}