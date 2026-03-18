import React, { useState, useEffect } from "react";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import Pagination from "@/components/ui/Pagination";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

const statusConfig = {
  new: { label: "New", className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", className: "bg-amber-50 text-amber-700 border-amber-200" },
  submitted: { label: "Submitted", className: "bg-purple-50 text-purple-700 border-purple-200" },
  won: { label: "Won", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  lost: { label: "Lost", className: "bg-red-50 text-red-700 border-red-200" },
  on_hold: { label: "On Hold", className: "bg-gray-50 text-gray-600 border-gray-200" },
};

const priorityConfig = {
  low: { label: "Low", className: "bg-gray-50 text-gray-600" },
  medium: { label: "Medium", className: "bg-blue-50 text-blue-600" },
  high: { label: "High", className: "bg-orange-50 text-orange-600" },
  critical: { label: "Critical", className: "bg-red-50 text-red-600" },
};

const oppTypeConfig = {
  new_business: "New Business",
  renewal: "Renewal",
  upsell: "Upsell",
  cross_sell: "Cross Sell",
};

const DEFAULT_PAGE_SIZE = 10;

export default function TenderTable({ tenders, onDelete, team, onEmployeeNumberChange, onStatusChange, isBusy, statusUpdatingId }) {
   const [editingEmployeeNumber, setEditingEmployeeNumber] = useState(null);
   const [inputValue, setInputValue] = useState("");
   const [deleteTenderId, setDeleteTenderId] = useState(null);
   const [page, setPage] = useState(1);
   const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Reset to first page when the filtered list changes
  useEffect(() => { setPage(1); }, [tenders.length]);

  const totalPages = Math.ceil(tenders.length / pageSize);
  const paginatedTenders = tenders.slice((page - 1) * pageSize, page * pageSize);

  const allEmployeeNumbers = [...new Set(tenders.map(t => t.solution_architect_employee_number).filter(Boolean))];

  const handleEmployeeNumberChange = (tenderId, empNo) => {
    if (onEmployeeNumberChange) {
      onEmployeeNumberChange(tenderId, empNo);
    }
    setEditingEmployeeNumber(null);
    setInputValue("");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">Sr No.</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">OPP Type</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">Status</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">POT ID</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">Tender Name</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">Date</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">Regional Sales Manager</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">Sales Person</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">Senior Solution Architect</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">Solution Architect Assigned</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">Employee Number</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">Prebid Date</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">Presentation Date</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">Meeting Date</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300">Submission Date</TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider border border-gray-300 w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {tenders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={16} className="text-center py-16 text-gray-400 border border-gray-300">
                    No tenders found. Create your first one!
                  </TableCell>
                </TableRow>
              )}
              {paginatedTenders.map((tender, i) => (
                <motion.tr
                  key={tender.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <TableCell className="text-gray-600 border border-gray-300">
                    {(page - 1) * pageSize + i + 1}
                  </TableCell>
                  <TableCell className="text-gray-600 capitalize border border-gray-300">{tender.opp_type?.replace(/_/g, ' ') || "—"}</TableCell>
                  <TableCell className="border border-gray-300">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        {/*
                          While status API is in progress for this row,
                          show a subtle loading state and disable interactions.
                        */}
                        <button
                          disabled={isBusy || statusUpdatingId === tender.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium text-xs transition-colors ${
                            isBusy || statusUpdatingId === tender.id
                              ? "cursor-not-allowed opacity-60"
                              : "cursor-pointer"
                          } ${statusConfig[tender.status]?.className}`}
                        >
                          {statusUpdatingId === tender.id ? "Updating..." : (statusConfig[tender.status]?.label || tender.status)}
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          disabled={isBusy || statusUpdatingId === tender.id}
                          onClick={() => !isBusy && statusUpdatingId == null && onStatusChange?.(tender.id, "new")}
                          className="text-xs"
                        >
                          <span className="text-blue-700">New</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isBusy || statusUpdatingId === tender.id}
                          onClick={() => !isBusy && statusUpdatingId == null && onStatusChange?.(tender.id, "in_progress")}
                          className="text-xs"
                        >
                          <span className="text-amber-700">In Progress</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isBusy || statusUpdatingId === tender.id}
                          onClick={() => !isBusy && statusUpdatingId == null && onStatusChange?.(tender.id, "submitted")}
                          className="text-xs"
                        >
                          <span className="text-purple-700">Submitted</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isBusy || statusUpdatingId === tender.id}
                          onClick={() => !isBusy && statusUpdatingId == null && onStatusChange?.(tender.id, "won")}
                          className="text-xs"
                        >
                          <span className="text-emerald-700">Won</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isBusy || statusUpdatingId === tender.id}
                          onClick={() => !isBusy && statusUpdatingId == null && onStatusChange?.(tender.id, "lost")}
                          className="text-xs"
                        >
                          <span className="text-red-700">Lost</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isBusy || statusUpdatingId === tender.id}
                          onClick={() => !isBusy && statusUpdatingId == null && onStatusChange?.(tender.id, "on_hold")}
                          className="text-xs"
                        >
                          <span className="text-gray-600">On Hold</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-gray-600 border border-gray-300">{tender.pot_id || "—"}</TableCell>
                  <TableCell className="border border-gray-300">
                    <Link
                      to={createPageUrl(`TenderDetail?id=${tender.id}&team=${team}`)}
                      className="font-semibold text-gray-900 hover:text-[#00A3E0] transition-colors"
                    >
                      {tender.tender_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-600 border border-gray-300">
                    {tender.date ? format(new Date(tender.date), "dd MMM yy") : "—"}
                  </TableCell>
                  <TableCell className="text-gray-600 border border-gray-300">{tender.regional_sales_manager || "—"}</TableCell>
                  <TableCell className="text-gray-600 border border-gray-300">{tender.sales_person || "—"}</TableCell>
                  <TableCell className="text-gray-600 border border-gray-300">{tender.senior_solution_architect || "—"}</TableCell>
                  <TableCell className="text-gray-600 font-medium border border-gray-300">{tender.solution_architect_assigned || "—"}</TableCell>
                  <TableCell className="border border-gray-300">
                    {editingEmployeeNumber === tender.id ? (
                      <div className="flex gap-1">
                        <DropdownMenu open={editingEmployeeNumber === tender.id} onOpenChange={(open) => {
                          if (!open) setEditingEmployeeNumber(null);
                        }}>
                          <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-1 w-full">
                              <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Enter/Select"
                                className="h-7 text-xs flex-1 px-2"
                                autoFocus
                              />
                              <ChevronDown className="w-3 h-3 text-gray-400" />
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-32">
                            {allEmployeeNumbers.map((empNo) => (
                              <DropdownMenuItem
                                key={empNo}
                                onClick={() => handleEmployeeNumberChange(tender.id, empNo)}
                              >
                                {empNo}
                              </DropdownMenuItem>
                            ))}
                            {inputValue && !allEmployeeNumbers.includes(inputValue) && (
                              <DropdownMenuItem onClick={() => handleEmployeeNumberChange(tender.id, inputValue)}>
                                Add "{inputValue}"
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => !isBusy && handleEmployeeNumberChange(tender.id, inputValue)}
                          disabled={isBusy}
                        >
                          {isBusy ? "Saving..." : "✓"}
                        </Button>
                      </div>
                    ) : (
                      <button
                        disabled={isBusy}
                        onClick={() => {
                          if (isBusy) return;
                          setEditingEmployeeNumber(tender.id);
                          setInputValue(tender.solution_architect_employee_number || "");
                        }}
                        className="text-gray-600 hover:bg-gray-100 px-2 py-1 rounded w-full text-left text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {tender.solution_architect_employee_number || "— (Click to add)"}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600 border border-gray-300">
                    {tender.prebid_date ? format(new Date(tender.prebid_date), "dd MMM yy") : "—"}
                  </TableCell>
                  <TableCell className="text-gray-600 border border-gray-300">
                    {tender.presentation_date ? format(new Date(tender.presentation_date), "dd MMM yy") : "—"}
                  </TableCell>
                  <TableCell className="text-gray-600 border border-gray-300">
                    {tender.meeting_date ? format(new Date(tender.meeting_date), "dd MMM yy") : "—"}
                  </TableCell>
                  <TableCell className="text-gray-600 border border-gray-300">
                    {tender.submission_date ? format(new Date(tender.submission_date), "dd MMM yy") : "—"}
                  </TableCell>
                  <TableCell className="border border-gray-300">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="" disabled={isBusy}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl(`TenderDetail?id=${tender.id}&team=${team}`)}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          disabled={isBusy}
                          onClick={() => !isBusy && setDeleteTenderId(tender.id)}
                        >
                          {isBusy ? "Working..." : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={tenders.length}
        onPage={setPage}
        onPageSize={(s) => { setPageSize(s); setPage(1); }}
      />

      <ConfirmDeleteDialog
        open={deleteTenderId !== null}
        title="Delete tender"
        description="Are you sure you want to delete this tender? All associated data will be permanently removed."
        onConfirm={() => { onDelete(deleteTenderId); setDeleteTenderId(null); }}
        onCancel={() => setDeleteTenderId(null)}
      />
    </div>
  );
}