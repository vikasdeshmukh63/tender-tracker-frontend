import React, { useState, useRef } from "react";
import api from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import { openFile } from "@/lib/presignedUrl";

const DOCUMENT_TYPE_LABELS = {
  rfp: "RFP",
  proposal: "Proposal",
  quote: "Quote",
  technical: "Technical",
  commercial: "Commercial",
  contract: "Contract",
  other: "Other",
};

const DOCUMENT_TYPE_COLORS = {
  rfp: "bg-blue-50 text-blue-700",
  proposal: "bg-purple-50 text-purple-700",
  quote: "bg-amber-50 text-amber-700",
  technical: "bg-green-50 text-green-700",
  commercial: "bg-pink-50 text-pink-700",
  contract: "bg-indigo-50 text-indigo-700",
  other: "bg-gray-50 text-gray-700",
};

function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

export default function TenderFileUpload({ tenderId, userData }) {
  const [selectedType, setSelectedType] = useState("other");
  const [deleteAttachmentId, setDeleteAttachmentId] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [openingId, setOpeningId] = useState(null); // tracks which attachment is being opened
  const fileInputRef = useRef();
  const queryClient = useQueryClient();

  const handleOpenFile = async (attachment) => {
    setOpeningId(attachment.id);
    try {
      await openFile(attachment.file_object_name, attachment.file_url);
    } finally {
      setOpeningId(null);
    }
  };

  // Fetch attachments from the real backend
  const { data: attachments = [], isLoading: loadingAttachments } = useQuery({
    queryKey: ["tender-attachments", tenderId],
    queryFn: () => api.get(`/attachments/${tenderId}`).then((r) => r.data),
    enabled: !!tenderId,
  });

  // Upload mutation — sends multipart/form-data so multer receives the file
  const uploadMutation = useMutation({
    mutationFn: ({ file, document_type }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", document_type);
      return api.post(`/attachments/${tenderId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-attachments", tenderId] });
      setSelectedType("other");
      setUploadError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err) => {
      setUploadError(
        err?.response?.data?.message || "Upload failed. Please try again."
      );
    },
  });

  // Delete mutation — deletes from MinIO and DB
  const deleteMutation = useMutation({
    mutationFn: (attachmentId) => api.delete(`/attachments/file/${attachmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-attachments", tenderId] });
      setDeleteAttachmentId(null);
    },
    onError: () => setDeleteAttachmentId(null),
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    uploadMutation.mutate({ file, document_type: selectedType });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Documents
      </h3>

      {/* Upload area */}
      <div
        className={`mb-4 p-3 border-2 border-dashed rounded-lg transition-colors ${
          uploadMutation.isPending
            ? "border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed"
            : "border-gray-200 hover:border-[#00A3E0] cursor-pointer"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Clicking the label is blocked while uploading via pointer-events-none */}
          <label
            className={`flex-1 ${
              uploadMutation.isPending ? "pointer-events-none cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-2">
              {uploadMutation.isPending ? (
                <Loader2 className="w-4 h-4 text-[#00A3E0] animate-spin" />
              ) : (
                <Upload className="w-4 h-4 text-gray-500" />
              )}
              <span className={`text-xs font-medium ${uploadMutation.isPending ? "text-gray-400" : "text-gray-600"}`}>
                {uploadMutation.isPending ? "Uploading… please wait" : "Click to upload document"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                disabled={uploadMutation.isPending}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
              />
            </div>
          </label>

          <Select
            value={selectedType}
            onValueChange={setSelectedType}
            disabled={uploadMutation.isPending}
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {uploadError && (
          <p className="text-xs text-red-500 mt-2">{uploadError}</p>
        )}
      </div>

      {/* Attachment list */}
      {loadingAttachments ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
        </div>
      ) : attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {attachment.file_name}
                  </p>
                  {attachment.document_type && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        DOCUMENT_TYPE_COLORS[attachment.document_type] ||
                        DOCUMENT_TYPE_COLORS.other
                      }`}
                    >
                      {DOCUMENT_TYPE_LABELS[attachment.document_type] || attachment.document_type}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatFileSize(attachment.file_size)}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-gray-500 hover:text-gray-700"
                  title="Download / View"
                  disabled={openingId === attachment.id}
                  onClick={() => handleOpenFile(attachment)}
                >
                  {openingId === attachment.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-red-500 hover:text-red-700"
                  onClick={() => setDeleteAttachmentId(attachment.id)}
                  disabled={deleteMutation.isPending}
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 py-2">No documents attached yet.</p>
      )}

      <ConfirmDeleteDialog
        open={deleteAttachmentId !== null}
        title="Delete document"
        description="Are you sure you want to delete this document? It will be permanently removed from storage."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteAttachmentId)}
        onCancel={() => setDeleteAttachmentId(null)}
      />
    </div>
  );
}
