import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, File, Trash2, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TenderFileUpload({ tenderId, userData }) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedType, setSelectedType] = useState("other");
  const queryClient = useQueryClient();

  const { data: attachments = [] } = useQuery({
    queryKey: ["tender-attachments", tenderId],
    queryFn: () => base44.entities.TenderAttachment.filter({ tender_id: tenderId }, "-created_date"),
    enabled: !!tenderId,
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId) => base44.entities.TenderAttachment.delete(attachmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tender-attachments", tenderId] }),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedFile = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.TenderAttachment.create({
        tender_id: tenderId,
        file_url: uploadedFile.file_url,
        file_name: file.name,
        file_size: file.size,
        document_type: selectedType,
        uploaded_by: userData?.email,
      });

      queryClient.invalidateQueries({ queryKey: ["tender-attachments", tenderId] });
      setSelectedType("other");
      e.target.value = "";
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const documentTypeLabels = {
    rfp: "RFP",
    proposal: "Proposal",
    quote: "Quote",
    technical: "Technical",
    commercial: "Commercial",
    contract: "Contract",
    other: "Other",
  };

  const documentTypeColors = {
    rfp: "bg-blue-50 text-blue-700",
    proposal: "bg-purple-50 text-purple-700",
    quote: "bg-amber-50 text-amber-700",
    technical: "bg-green-50 text-green-700",
    commercial: "bg-pink-50 text-pink-700",
    contract: "bg-indigo-50 text-indigo-700",
    other: "bg-gray-50 text-gray-700",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Documents
      </h3>

      {/* Upload Section */}
      <div className="mb-4 p-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
        <div className="flex items-center gap-3">
          <label className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">
                {isUploading ? "Uploading..." : "Click to upload document"}
              </span>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              />
            </div>
          </label>

          <Select value={selectedType} onValueChange={setSelectedType} disabled={isUploading}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rfp">RFP</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="quote">Quote</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 ? (
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
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      documentTypeColors[attachment.document_type]
                    }`}
                  >
                    {documentTypeLabels[attachment.document_type]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatFileSize(attachment.file_size)}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-gray-500 hover:text-gray-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-red-500 hover:text-red-700"
                  onClick={() => deleteMutation.mutate(attachment.id)}
                  disabled={deleteMutation.isPending}
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
    </div>
  );
}