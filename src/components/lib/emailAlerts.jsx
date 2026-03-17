import { base44 } from "@/api/base44Client";

/**
 * Send email alert when tender status changes to 'submitted'
 * Recipients: sales_person, regional_sales_manager, senior_solution_architect, solution_architect_assigned
 */
export async function sendTenderSubmittedEmail(tender) {
  const recipients = [
    tender.sales_person,
    tender.regional_sales_manager,
    tender.senior_solution_architect,
    tender.solution_architect_assigned,
  ]
    .filter(Boolean)
    .filter((r) => r.includes("@esds.co.in"));

  const uniqueRecipients = [...new Set(recipients)];
  if (!uniqueRecipients.length) return;

  const subject = `Tender Submitted: ${tender.tender_name}`;
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e3a8a; padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">Tender Submitted</h2>
      </div>
      <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
        <p style="color: #374151; font-size: 16px;">The following tender has been marked as <strong>Submitted</strong>:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #6b7280; width: 40%;">Tender Name</td><td style="padding: 8px; font-weight: bold; color: #111827;">${tender.tender_name}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px; color: #6b7280;">POT ID</td><td style="padding: 8px; color: #111827;">${tender.pot_id || "—"}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Client</td><td style="padding: 8px; color: #111827;">${tender.client_name || "—"}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px; color: #6b7280;">Sales Person</td><td style="padding: 8px; color: #111827;">${tender.sales_person || "—"}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Regional Sales Manager</td><td style="padding: 8px; color: #111827;">${tender.regional_sales_manager || "—"}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px; color: #6b7280;">Estimated Value</td><td style="padding: 8px; color: #111827;">${tender.estimated_value ? `&#8377;${Number(tender.estimated_value).toLocaleString("en-IN")}` : "—"}</td></tr>
        </table>
        <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">Please log in to the ESDS Tender Tracker to view full details.</p>
      </div>
    </div>
  `;

  await Promise.all(
    uniqueRecipients.map((to) =>
      base44.integrations.Core.SendEmail({ to, subject, body, from_name: "ESDS Tender Tracker" })
    )
  );
}

/**
 * Send email alert when a new task is assigned to team members
 */
export async function sendTaskAssignedEmail(task, tenderName) {
  const assignees = [
    ...(task.assignees || []),
    task.assigned_to,
  ]
    .filter(Boolean)
    .filter((a) => a.includes("@"));

  const uniqueAssignees = [...new Set(assignees)];
  if (!uniqueAssignees.length) return;

  const subject = `New Task Assigned: ${task.title}`;
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e3a8a; padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">New Task Assigned to You</h2>
      </div>
      <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
        <p style="color: #374151; font-size: 16px;">You have been assigned a new task on the ESDS Tender Tracker:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #6b7280; width: 40%;">Task</td><td style="padding: 8px; font-weight: bold; color: #111827;">${task.title}</td></tr>
          ${tenderName ? `<tr style="background:#fff;"><td style="padding: 8px; color: #6b7280;">Tender</td><td style="padding: 8px; color: #111827;">${tenderName}</td></tr>` : ""}
          <tr ${tenderName ? "" : 'style="background:#fff;"'}><td style="padding: 8px; color: #6b7280;">Priority</td><td style="padding: 8px; color: #111827; text-transform: capitalize;">${task.priority || "medium"}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px; color: #6b7280;">Due Date</td><td style="padding: 8px; color: #111827;">${task.due_date || "Not set"}</td></tr>
          ${task.description ? `<tr><td style="padding: 8px; color: #6b7280;">Description</td><td style="padding: 8px; color: #111827;">${task.description}</td></tr>` : ""}
        </table>
        <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">Please log in to the ESDS Tender Tracker to view and manage your tasks.</p>
      </div>
    </div>
  `;

  await Promise.all(
    uniqueAssignees.map((to) =>
      base44.integrations.Core.SendEmail({ to, subject, body, from_name: "ESDS Tender Tracker" })
    )
  );
}

/**
 * Send email alert when a tender's key date (prebid/presentation/meeting) is within 24 or 48 hours.
 * Uses localStorage to avoid sending duplicate alerts on the same calendar day.
 * @param {object} tender
 * @param {number} hoursLeft  - approximate hours remaining (e.g. 24 or 48)
 * @param {string} dateField  - which date field triggered this ("prebid_date" | "presentation_date" | "meeting_date")
 */
export async function sendTenderDeadlineEmail(tender, hoursLeft = 48, dateField = "prebid_date") {
  // Dedup: only send once per tender+field+day
  const today = new Date().toISOString().split("T")[0];
  const dedupKey = `deadline_email_${tender.id}_${dateField}_${hoursLeft}h_${today}`;
  if (localStorage.getItem(dedupKey)) return;
  localStorage.setItem(dedupKey, "1");

  const recipients = [
    tender.sales_person,
    tender.regional_sales_manager,
    tender.senior_solution_architect,
    tender.solution_architect_assigned,
  ]
    .filter(Boolean)
    .filter((r) => r.includes("@esds.co.in"));

  const uniqueRecipients = [...new Set(recipients)];
  if (!uniqueRecipients.length) return;

  const fieldLabel = dateField.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const urgency = hoursLeft <= 24 ? "🚨 URGENT" : "⚠️";
  const urgencyColor = hoursLeft <= 24 ? "#b91c1c" : "#dc2626";
  const subject = `${urgency} Tender ${fieldLabel} in ${hoursLeft} Hours: ${tender.tender_name}`;

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${urgencyColor}; padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">${urgency} Tender Deadline Approaching</h2>
      </div>
      <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
        <p style="color: #374151; font-size: 16px;">
          The following tender's <strong>${fieldLabel}</strong> is 
          <strong style="color:${urgencyColor};">within ${hoursLeft} hours</strong>:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #6b7280; width: 40%;">Tender Name</td><td style="padding: 8px; font-weight: bold; color: #111827;">${tender.tender_name}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px; color: #6b7280;">POT ID</td><td style="padding: 8px; color: #111827;">${tender.pot_id || "—"}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Client</td><td style="padding: 8px; color: #111827;">${tender.client_name || "—"}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px; color: ${urgencyColor}; font-weight:bold;">${fieldLabel}</td><td style="padding: 8px; color:${urgencyColor}; font-weight:bold;">${tender[dateField] || "—"}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Sales Person</td><td style="padding: 8px; color: #111827;">${tender.sales_person || "—"}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px; color: #6b7280;">Regional Sales Manager</td><td style="padding: 8px; color: #111827;">${tender.regional_sales_manager || "—"}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Current Status</td><td style="padding: 8px; color: #111827; text-transform: capitalize;">${tender.status?.replace(/_/g, " ") || "—"}</td></tr>
        </table>
        <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">Please take immediate action. Log in to the ESDS Tender Tracker for full details.</p>
      </div>
    </div>
  `;

  await Promise.all(
    uniqueRecipients.map((to) =>
      base44.integrations.Core.SendEmail({ to, subject, body, from_name: "ESDS Tender Tracker" })
    )
  );
}

/**
 * Send email alert when a task deadline is approaching (≤ threshold days)
 */
export async function sendTaskDueEmail(task, daysLeft) {
  const assignees = [
    ...(task.assignees || []),
    task.assigned_to,
  ]
    .filter(Boolean)
    .filter((a) => a.includes("@"));

  const uniqueAssignees = [...new Set(assignees)];
  if (!uniqueAssignees.length) return;

  const dueLine =
    daysLeft === 0
      ? "<strong style='color:#dc2626;'>TODAY</strong>"
      : `in <strong>${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong>`;

  const subject =
    daysLeft === 0
      ? `Task Due Today: ${task.title}`
      : `Task Reminder: "${task.title}" due in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`;

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0369a1; padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">Task Deadline Reminder</h2>
      </div>
      <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
        <p style="color: #374151; font-size: 16px;">You have a task due ${dueLine}:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #6b7280; width: 40%;">Task</td><td style="padding: 8px; font-weight: bold; color: #111827;">${task.title}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px; color: #6b7280;">Due Date</td><td style="padding: 8px; color: #111827;">${task.due_date}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Priority</td><td style="padding: 8px; color: #111827; text-transform: capitalize;">${task.priority || "—"}</td></tr>
          <tr style="background:#fff;"><td style="padding: 8px; color: #6b7280;">Status</td><td style="padding: 8px; color: #111827; text-transform: capitalize;">${task.status?.replace(/_/g, " ") || "—"}</td></tr>
          ${task.description ? `<tr><td style="padding: 8px; color: #6b7280;">Description</td><td style="padding: 8px; color: #111827;">${task.description}</td></tr>` : ""}
        </table>
        <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">Please log in to the ESDS Tender Tracker to complete this task.</p>
      </div>
    </div>
  `;

  await Promise.all(
    uniqueAssignees.map((to) =>
      base44.integrations.Core.SendEmail({ to, subject, body, from_name: "ESDS Tender Tracker" })
    )
  );
}