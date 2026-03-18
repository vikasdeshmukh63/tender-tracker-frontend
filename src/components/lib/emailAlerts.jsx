/**
 * Frontend email alert helpers.
 *
 * NOTE: All actual email delivery is handled server-side via emailService.js
 * (Nodemailer). These frontend wrappers are kept as no-ops so existing call
 * sites don't need to be changed, and to document which events trigger emails.
 *
 * - Tender submitted       → taskController / tenderController fires the email
 * - Task assigned/updated  → taskController fires the email
 * - Task due reminder      → useNotificationChecker (below) – no-op here
 * - Tender deadline        → Dashboard.jsx – no-op here
 */

/** No-op: backend sends this email when tender status changes to 'submitted'. */
export async function sendTenderSubmittedEmail(_tender) {
  // Email is sent by the backend; nothing to do here.
}

/** No-op: backend sends task assignment emails via taskController. */
export async function sendTaskAssignedEmail(_task, _tenderName) {
  // Email is sent by the backend; nothing to do here.
}

/** No-op: retained for call-site compatibility. */
export async function sendTenderDeadlineEmail(_tender, _hoursLeft, _dateField) {
  // Email is sent by the backend; nothing to do here.
}

/** No-op: retained for call-site compatibility. */
export async function sendTaskDueEmail(_task, _daysLeft) {
  // Email is sent by the backend; nothing to do here.
}
