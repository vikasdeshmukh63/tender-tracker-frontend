import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
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
      const rules = await base44.entities.NotificationRule.filter({
        user_email: userData.email,
        is_active: true,
      });
      if (!rules?.length) return;

      const existing = await base44.entities.Notification.filter({ user_email: userData.email });
      const dedupKeys = new Set(existing.map((n) => n.dedup_key));

      const today = new Date();

      const createNotif = async (rule, data) => {
        if (dedupKeys.has(data.dedup_key)) return;
        dedupKeys.add(data.dedup_key);
        await base44.entities.Notification.create({
          ...data,
          user_email: userData.email,
          is_read: false,
        });
        if (rule.send_email) {
          await base44.integrations.Core.SendEmail({
            to: userData.email,
            subject: `Tender Alert: ${data.tender_name || "Notification"}`,
            body: `<p>${data.message}</p><p>Please review in the ESDS Tender Tracker.</p>`,
          });
        }
      };

      for (const rule of rules) {
        // Due Date Alerts
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
                const label = field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

        // Status Change Alerts
        if (rule.type === "status_change" && rule.watch_statuses?.length) {
          for (const tender of tenders) {
            if (rule.watch_statuses.includes(tender.status)) {
              const statusLabel = tender.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

        // Task Due Alerts
        if (rule.type === "task_due" && tasks?.length) {
          const threshold = rule.threshold_days || 3;
          // Match both legacy assigned_to and new assignees array
          const userTasks = tasks.filter(
            (t) =>
              t.status !== "completed" &&
              (t.assigned_to === userData.email || t.assignees?.includes(userData.email))
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
              // Always send direct email to ALL assignees (not gated by rule.send_email)
              if (!dedupKeys.has(`email_${dedupKey}`)) {
                dedupKeys.add(`email_${dedupKey}`);
                sendTaskDueEmail(task, daysLeft);
              }
            }
          }
        }
      }

      sessionStorage.setItem(`notif_check_${userData.email}`, String(Date.now()));
    };

    run();
  }, [userData?.email, tenders?.length]);
}