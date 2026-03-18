import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * A reusable delete-confirmation dialog.
 *
 * Props:
 *  open        boolean  – controls dialog visibility
 *  onConfirm   fn       – called when user clicks "Delete"
 *  onCancel    fn       – called when user dismisses or clicks "Cancel"
 *  title       string   – dialog heading  (optional)
 *  description string   – body text       (optional)
 *  loading     boolean  – shows spinner on confirm button while a mutation is pending
 */
export default function ConfirmDeleteDialog({
  open,
  onConfirm,
  onCancel,
  title = "Delete confirmation",
  description = "Are you sure you want to delete this? This action cannot be undone.",
  loading = false,
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <DialogTitle className="text-base">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-500 leading-relaxed pl-12">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 justify-end mt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="h-8 text-xs px-4"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="h-8 text-xs px-4 bg-red-600 hover:bg-red-700"
          >
            {loading ? "Deleting…" : "Yes, Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
