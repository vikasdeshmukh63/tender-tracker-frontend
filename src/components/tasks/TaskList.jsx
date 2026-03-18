import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Pagination from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import { Calendar, Users, MoreVertical, Pencil, Trash2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import TaskDetailPanel from "./TaskDetailPanel";

const statusConfig = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200" },
  on_hold: { label: "On Hold", className: "bg-gray-50 text-gray-600 border-gray-200" },
};
const priorityConfig = {
  low: { label: "Low", dot: "bg-gray-400" },
  medium: { label: "Medium", dot: "bg-blue-400" },
  high: { label: "High", dot: "bg-orange-400" },
  critical: { label: "Critical", dot: "bg-red-500" },
};

const TASK_PAGE_SIZE = 10;

export default function TaskList({ tasks, onEdit, onDelete, showTenderName = false, tenders = [], userData }) {
  const [detailTask, setDetailTask] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TASK_PAGE_SIZE);

  // Reset to first page when the task list changes (e.g. filter applied)
  useEffect(() => { setPage(1); }, [tasks?.length]);

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
        <p className="text-gray-400">No tasks found</p>
      </div>
    );
  }

  const paginatedTasks = tasks.slice((page - 1) * pageSize, page * pageSize);
  const getTenderName = (tenderId) => tenders.find((t) => t.id === tenderId)?.tender_name || "Unknown Tender";

  return (
    <>
      <div className="space-y-3">
        <AnimatePresence>
          {paginatedTasks.map((task) => {
            const assignees = task.assignees?.length ? task.assignees : (task.assigned_to ? [task.assigned_to] : []);
            const isAssignee =
              !!userData?.email &&
              (assignees.includes(userData.email) || task.assigned_to === userData.email);
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3
                        className="font-semibold text-gray-900 cursor-pointer hover:text-[#00A3E0] transition-colors"
                        onClick={() => setDetailTask(task)}
                      >
                        {task.title}
                      </h3>
                      <Badge variant="outline" className={`${statusConfig[task.status]?.className} text-xs`}>
                        {statusConfig[task.status]?.label}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${priorityConfig[task.priority]?.dot}`} />
                        <span className="text-xs text-gray-500">{priorityConfig[task.priority]?.label}</span>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                      {assignees.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>
                            {assignees.slice(0, 2).join(", ")}
                            {assignees.length > 2 && ` +${assignees.length - 2} more`}
                          </span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{format(new Date(task.due_date), "MMM dd, yyyy")}</span>
                        </div>
                      )}
                      {showTenderName && (
                        <span className="text-gray-400"><span className="font-medium">Tender:</span> {getTenderName(task.tender_id)}</span>
                      )}
                      <button
                        onClick={() => setDetailTask(task)}
                        className="flex items-center gap-1 text-[#00A3E0] hover:underline"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Comments
                      </button>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetailTask(task)}>
                        <MessageSquare className="w-4 h-4 mr-2" /> View & Comment
                      </DropdownMenuItem>
                      {/* Only team leads/admins can edit/delete, per requirements */}
                      {(userData?.role === "team_lead" || userData?.role === "admin") && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(task)}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTaskId(task.id)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {tasks.length > pageSize && (
        <div className="bg-white rounded-xl border border-gray-100 mt-1">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={tasks.length}
            onPage={setPage}
            onPageSize={(s) => { setPageSize(s); setPage(1); }}
          />
        </div>
      )}

      <TaskDetailPanel
        open={!!detailTask}
        onClose={() => setDetailTask(null)}
        task={detailTask}
        userData={userData}
      />

      <ConfirmDeleteDialog
        open={deleteTaskId !== null}
        title="Delete task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={() => { onDelete(deleteTaskId); setDeleteTaskId(null); }}
        onCancel={() => setDeleteTaskId(null)}
      />
    </>
  );
}