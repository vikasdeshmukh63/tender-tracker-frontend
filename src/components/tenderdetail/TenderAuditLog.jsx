import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { History, GitBranch, Pencil, MessageSquare, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const actionConfig = {
  created: { icon: Plus, color: "bg-emerald-100 text-emerald-600", label: "Created" },
  updated: { icon: Pencil, color: "bg-blue-100 text-blue-600", label: "Updated" },
  status_changed: { icon: GitBranch, color: "bg-purple-100 text-purple-600", label: "Status Changed" },
  comment: { icon: MessageSquare, color: "bg-amber-100 text-amber-700", label: "Comment" },
};

const statusLabels = {
  new: "New", in_progress: "In Progress", submitted: "Submitted",
  won: "Won", lost: "Lost", on_hold: "On Hold",
};

function AuditEntry({ entry }) {
  const cfg = actionConfig[entry.action] || actionConfig.updated;
  const Icon = cfg.icon;
  const time = entry.created_date
    ? formatDistanceToNow(new Date(entry.created_date), { addSuffix: true })
    : "";

  return (
    <div className="flex gap-3 group">
      {/* Icon + vertical line */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="w-px flex-1 bg-gray-100 mt-1" />
      </div>

      {/* Content */}
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-1.5 mb-0.5">
          <span className="font-semibold text-sm text-gray-800">
            {entry.user_name || entry.user_email}
          </span>
          <span className="text-xs text-gray-400">{time}</span>
        </div>

        {entry.action === "comment" ? (
          <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2 mt-1 leading-relaxed">
            {entry.comment}
          </p>
        ) : entry.action === "status_changed" ? (
          <p className="text-sm text-gray-600">
            Changed status from{" "}
            <span className="font-medium text-gray-800">{statusLabels[entry.old_value] || entry.old_value}</span>
            {" → "}
            <span className="font-medium text-purple-700">{statusLabels[entry.new_value] || entry.new_value}</span>
          </p>
        ) : entry.action === "created" ? (
          <p className="text-sm text-gray-600">Tender was created.</p>
        ) : (
          <p className="text-sm text-gray-600">
            Updated <span className="font-medium text-gray-800">{entry.field_changed}</span>
            {entry.old_value && entry.new_value && (
              <> from <span className="italic">{entry.old_value}</span> → <span className="italic">{entry.new_value}</span></>
            )}
          </p>
        )}

        <p className="text-xs text-gray-400 mt-1">
          {entry.created_date ? format(new Date(entry.created_date), "dd MMM yyyy, h:mm a") : ""}
        </p>
      </div>
    </div>
  );
}

export default function TenderAuditLog({ tenderId, userData }) {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", tenderId],
    queryFn: () => base44.entities.AuditLog.filter({ tender_id: tenderId }, "-created_date"),
    enabled: !!tenderId,
  });

  const addCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.AuditLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs", tenderId] });
      setComment("");
    },
  });

  const handleAddComment = () => {
    if (!comment.trim()) return;
    addCommentMutation.mutate({
      tender_id: tenderId,
      user_email: userData.email || "",
      user_name: userData.full_name || userData.email || "Unknown",
      action: "comment",
      comment: comment.trim(),
    });
  };

  // Sort chronologically ascending for display (oldest first at top)
  const sorted = [...logs].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-6">
        <History className="w-4 h-4" /> Activity Log ({logs.length})
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-4 border-gray-200 border-t-[#00A3E0] rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">No activity recorded yet.</p>
      ) : (
        <div className="mt-2">
          {sorted.map((entry) => (
            <AuditEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* Add comment */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Add a Comment</p>
        <div className="flex gap-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment or note..."
            className="text-sm resize-none rounded-xl"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment();
            }}
          />
          <Button
            onClick={handleAddComment}
            disabled={!comment.trim() || addCommentMutation.isPending}
            size="icon"
            className="bg-[#1e3a8a] hover:bg-[#1e40af] rounded-xl self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Ctrl+Enter to submit</p>
      </div>
    </div>
  );
}