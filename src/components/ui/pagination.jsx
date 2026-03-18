import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Reusable pagination bar.
 *
 * Props:
 *   page        number  – current 1-based page
 *   pageSize    number  – rows per page
 *   total       number  – total item count
 *   onPage      fn(n)   – called when page changes
 *   onPageSize  fn(n)   – called when page-size changes (optional)
 */
export default function Pagination({ page, pageSize, total, onPage, onPageSize }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = buildPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-white">
      {/* Left: record count */}
      <p className="text-xs text-gray-500 shrink-0">
        {total === 0
          ? "No results"
          : `Showing ${from}–${to} of ${total}`}
      </p>

      {/* Center: navigation */}
      <div className="flex items-center gap-1">
        {/* First */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPage(1)}
          disabled={page === 1}
          title="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>

        {/* Prev */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          title="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === "…" ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-gray-400 select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`h-7 min-w-[28px] px-2 rounded text-xs font-medium transition-colors ${
                p === page
                  ? "bg-[#1e3a8a] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          title="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>

        {/* Last */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPage(totalPages)}
          disabled={page === totalPages}
          title="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Right: page-size picker */}
      {onPageSize && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              onPageSize(Number(v));
              onPage(1);
            }}
          >
            <SelectTrigger className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

/** Build the list of page numbers to show, with "…" ellipsis. */
function buildPageNumbers(current, total) {
  if (total <= 7) return range(1, total);

  if (current <= 4) return [...range(1, 5), "…", total];
  if (current >= total - 3) return [1, "…", ...range(total - 4, total)];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

function range(from, to) {
  const arr = [];
  for (let i = from; i <= to; i++) arr.push(i);
  return arr;
}
