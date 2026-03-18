import { useEffect, useRef } from "react";
import api from "@/api/client";
import { differenceInDays, parseISO } from "date-fns";
import { sendTaskDueEmail } from "../lib/emailAlerts";

export function useNotificationChecker(userData, tenders, tasks) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!userData?.email || !tenders?.length || hasRun.current) return;

    const lastCheck = sessionStorage.getItem(`notif_check_${userData.email}`);
    if (lastCheck && Date.now() - Number(lastCheck) < 5 * 60 * 1000) return;

    hasRun.current = true;

    const run = async () => {
      try {
        // Fetch active notification rules from the real backend
        const rulesRes = await api.get("/notification-rules", {
          params: { user_email: userData.email },
        });
        const rules = (rulesRes.data || []).filter((r) => r.is_active);
        if (!rules.length) return;

        // Fetch existing notifications to avoid duplicates
        const existingRes = await api.get("/notifications", {
          params: { user_email: userData.email, limit: 500 },
        });
        const existing = existingRes.data || [];
        const dedupKeys = new Set(existing.map((n) => n.dedup_key));

        const today = new Date();

        const createNotif = async (rule, data) => {
          if (dedupKeys.has(data.dedup_key)) return;
          dedupKeys.add(data.dedup_key);
          await api.post("/notifications", {
            ...data,
            user_email: userData.email,
            is_read: false,
          });
        };

        for (const rule of rules) {
          // ── Due Date Alerts ───────────────────────────────────────────
          if (rule.type === "due_date") {
            const fields = rule.date_fields?.length
              ? rule.date_fields
              : ["prebid_date", "presentation_date", "meeting_date"];
            const threshold = rule.threshold_days || 3;

            for (const tender of tenders) {
              for (const field of fields) {
                if (!tender[field]) continue;
                const dueDate = parseISO(tender[field]);
                const daysLeft = differenceInDays(dueDate, today);
                if (daysLeft >= 0 && daysLeft <= threshold) {
                  const label = field
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                  const message =
                    daysLeft === 0
                      ? `${tender.tender_name}: ${label} is TODAY!`
                      : `${tender.tender_name}: ${label} in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`;
                  await createNotif(rule, {
                    tender_id: tender.id,
                    tender_name: tender.tender_name,
                    type: "due_date",
                    message,
                    dedup_key: `due_${tender.id}_${field}_${tender[field]}`,
                  });
                }
              }
            }
          }

          // ── Status Change Alerts ──────────────────────────────────────
          if (rule.type === "status_change" && rule.watch_statuses?.length) {
            for (const tender of tenders) {
              if (rule.watch_statuses.includes(tender.status)) {
                const statusLabel = tender.status
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                await createNotif(rule, {
                  tender_id: tender.id,
                  tender_name: tender.tender_name,
                  type: "status_change",
                  message: `${tender.tender_name} is now: ${statusLabel}`,
                  dedup_key: `status_${tender.id}_${tender.status}`,
                });
              }
            }
          }

          // ── Task Due Alerts ───────────────────────────────────────────
          if (rule.type === "task_due" && tasks?.length) {
            const threshold = rule.threshold_days || 3;
            const userTasks = tasks.filter(
              (t) =>
                t.status !== "completed" &&
                (t.assigned_to === userData.email ||
                  t.assignees?.includes(userData.email))
            );
            for (const task of userTasks) {
              if (!task.due_date) continue;
              const dueDate = parseISO(task.due_date);
              const daysLeft = differenceInDays(dueDate, today);
              if (daysLeft >= 0 && daysLeft <= threshold) {
                const message =
                  daysLeft === 0
                    ? `Task due TODAY: "${task.title}"`
                    : `Task due in ${daysLeft} day${daysLeft > 1 ? "s" : ""}: "${task.title}"`;
                const dedupKey = `task_${task.id}_${task.due_date}`;
                await createNotif(rule, {
                  tender_id: task.tender_id,
                  tender_name: task.title,
                  type: "task_due",
                  message,
                  dedup_key: dedupKey,
                });
                if (!dedupKeys.has(`email_${dedupKey}`)) {
                  dedupKeys.add(`email_${dedupKey}`);
                  sendTaskDueEmail(task, daysLeft);
                }
              }
            }
          }
        }

        sessionStorage.setItem(`notif_check_${userData.email}`, String(Date.now()));
      } catch (err) {
        // Don't bubble up — notification errors should never crash the app.
        console.warn("[useNotificationChecker] Failed to run notification check:", err?.message);
        // Reset so it can retry on the next effect trigger
        hasRun.current = false;
      }
    };

    run();
  }, [userData?.email, tenders?.length]);
}
