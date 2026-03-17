import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paperclip, Send, Download, User, Calendar, Loader2, FileText, Image, X } from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200" },
  on_hold: { label: "On Hold", className: "bg-gray-50 text-gray-600 border-gray-200" },
};

const priorityDot = { low: "bg-gray-400", medium: "bg-blue-400", high: "bg-orange-400", critical: "bg-red-500" };

function FileIcon({ name }) {
  const ext = name?.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return <Image className="w-4 h-4 text-blue-500" />;
  return <FileText className="w-4 h-4 text-gray-500" />;
}

export default function TaskDetailPanel({ open, onClose, task, userData }) {
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["task-comments", task?.id],
    queryFn: () => base44.entities.TaskComment.filter({ task_id: task.id }, "created_date"),
    enabled: !!task?.id && open,
  });

  const createComment = useMutation({
    mutationFn: (data) => base44.entities.TaskComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", task?.id] });
      setComment("");
      setFile(null);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() && !file) return;

    setUploading(true);
    let file_url = null;
    let file_name = null;

    if (file) {
      const result = await base44.integrations.Core.UploadFile({ file });
      file_url = result.file_url;
      file_name = file.name;
    }

    await createComment.mutateAsync({
      task_id: task.id,
      author_email: userData?.email || "unknown",
      author_name: userData?.fullName || userData?.email || "Unknown",
      content: comment.trim(),
      file_url,
      file_name,
    });

    setUploading(false);
  };

  if (!task) return null;

  const assignees = task.assignees?.length ? task.assignees : (task.assigned_to ? [task.assigned_to] : []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle className="text-base font-bold text-gray-900 pr-6">{task.title}</DialogTitle>
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            <Badge variant="outline" className={`${statusConfig[task.status]?.className} text-xs`}>
              {statusConfig[task.status]?.label}
            </Badge>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${priorityDot[task.priority]}`} />
              <span className="text-xs text-gray-500 capitalize">{task.priority}</span>
            </div>
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {format(new Date(task.due_date), "dd MMM yyyy")}
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-5">
            {/* Description */}
            {task.description && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{task.description}</p>
              </div>
            )}

            {/* Assignees */}
            {assignees.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Assigned To</p>
                <div className="flex flex-wrap gap-1.5">
                  {assignees.map((email) => (
                    <div key={email} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">
                      <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center">
                        <User className="w-3 h-3 text-blue-700" />
                      </div>
                      <span className="text-xs text-blue-800 font-medium">{email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t" />

            {/* Comments */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Comments & Attachments ({comments.length})
              </p>

              {isLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first to comment.</p>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">{c.author_name}</span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(c.created_date), "dd MMM yyyy, h:mm a")}
                          </span>
                        </div>
                        {c.content && <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{c.content}</p>}
                        {c.file_url && (
                          <a
                            href={c.file_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-[#00A3E0] hover:underline bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1"
                          >
                            <FileIcon name={c.file_name} />
                            {c.file_name || "Attachment"}
                            <Download className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Comment input */}
        <div className="px-6 py-4 border-t bg-gray-50/50 shrink-0">
          <form onSubmit={handleSubmit} className="space-y-2">
            {file && (
              <div className="flex items-center gap-2 bg-white border border-blue-100 rounded-lg px-3 py-1.5 text-xs text-gray-700 w-fit">
                <FileIcon name={file.name} />
                <span className="max-w-[200px] truncate">{file.name}</span>
                <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                rows={2}
                className="resize-none text-sm bg-white"
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit(e); }}
              />
              <div className="flex flex-col gap-1.5">
                <Button
                  type="button" variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => fileRef.current?.click()}
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  type="submit" size="icon" className="h-8 w-8 bg-[#1e3a8a] hover:bg-[#1e40af]"
                  disabled={uploading || (!comment.trim() && !file)}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}