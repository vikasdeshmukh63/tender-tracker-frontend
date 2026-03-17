import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";

export default function ImportExcelDialog({ open, onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
        setError("Please select a valid Excel file (.xlsx or .xls)");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            setError("The Excel file is empty");
            setLoading(false);
            return;
          }

          // Map Excel columns to tender fields
          const tenders = jsonData.map((row) => ({
            pot_id: row["POT ID"] || row["pot_id"] || "",
            tender_name: row["Tender Name"] || row["tender_name"] || "",
            client_name: row["Client Name"] || row["client_name"] || "",
            status: row["Status"] || row["status"] || "new",
            priority: row["Priority"] || row["priority"] || "medium",
            opp_type: row["OPP Type"] || row["opp_type"] || "new_business",
            date: row["Date"] || row["date"] || "",
            month: row["Month"] || row["month"] || "",
            year: row["Year"] || row["year"] || "",
            regional_sales_manager: row["Regional Sales Manager"] || row["regional_sales_manager"] || "",
            sales_person: row["Sales Person"] || row["sales_person"] || "",
            senior_solution_architect: row["Senior Solution Architect"] || row["senior_solution_architect"] || "",
            solution_architect_assigned: row["Solution Architect Assigned"] || row["solution_architect_assigned"] || "",
            prebid_date: row["Prebid Date"] || row["prebid_date"] || "",
            presentation_date: row["Presentation Date"] || row["presentation_date"] || "",
            meeting_date: row["Meeting Date"] || row["meeting_date"] || "",
            work_status: row["Work Status"] || row["work_status"] || "work_in_progress",
            estimated_value: row["Estimated Value"] || row["estimated_value"] || 0,
          }));

          onImport(tenders);
          setFile(null);
          setLoading(false);
        } catch (err) {
          setError("Error parsing Excel file: " + err.message);
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Error reading file");
        setLoading(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError("Error importing file: " + err.message);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Tenders from Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="excel-upload"
            />
            <label htmlFor="excel-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                  {file ? (
                    <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                  ) : (
                    <Upload className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {file ? file.name : "Click to upload Excel file"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports .xlsx and .xls files
                  </p>
                </div>
              </div>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Excel file should have columns matching the tender fields (POT ID, Tender Name, Client Name, Status, etc.)
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading ? "Importing..." : "Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}