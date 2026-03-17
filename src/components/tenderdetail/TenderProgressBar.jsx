import React, { useMemo, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TenderProgressBar({ tender, auditLogs = [], onStatusChange }) {
  const statusSequence = ["new", "in_progress", "submitted", "won"];
  const [hoverStatus, setHoverStatus] = useState(null);

  const statusLabels = {
    new: "New",
    in_progress: "In Progress",
    submitted: "Submitted",
    won: "Won",
    lost: "Lost",
  };

  const statusColors = {
    new: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    submitted: "bg-purple-100 text-purple-700",
    won: "bg-emerald-100 text-emerald-700",
    lost: "bg-red-100 text-red-700",
  };

  // Determine which statuses have been reached based on audit logs
  const reachedStatuses = useMemo(() => {
    const statusChanges = auditLogs
      .filter((log) => log.action === "status_changed")
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    const reached = new Set(["new"]); // Always started as new
    statusChanges.forEach((log) => {
      if (log.new_value) reached.add(log.new_value);
    });
    return reached;
  }, [auditLogs]);

  const currentStatus = tender?.status || "new";
  const isLost = currentStatus === "lost";
  const isWon = currentStatus === "won";

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Tender Journey
        </h3>
      </div>

      <div className="flex items-center justify-between gap-2">
         {statusSequence.map((status, idx) => {
           const isReached = reachedStatuses.has(status);
           const isCurrent = currentStatus === status;

           return (
             <React.Fragment key={status}>
               <button
                 onClick={() => onStatusChange?.(status)}
                 onMouseEnter={() => setHoverStatus(status)}
                 onMouseLeave={() => setHoverStatus(null)}
                 className="flex flex-col items-center flex-1 cursor-pointer transition-all"
               >
                 <div className="relative mb-2">
                   {isReached ? (
                     <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                   ) : isCurrent ? (
                     <Circle className="w-8 h-8 text-blue-500 border-2 border-blue-500" />
                   ) : (
                     <Circle className="w-8 h-8 text-gray-300" />
                   )}
                 </div>
                 <span
                   className={`text-xs font-medium text-center ${
                     isReached || isCurrent
                       ? "text-gray-700"
                       : "text-gray-400"
                   }`}
                 >
                   {statusLabels[status]}
                 </span>
               </button>

               {idx < statusSequence.length - 1 && (
                 <div
                   className={`h-1 flex-1 rounded-full mb-6 ${
                     isReached ? "bg-emerald-500" : "bg-gray-200"
                   }`}
                 />
               )}
             </React.Fragment>
           );
         })}

         {/* Lost Status - Always Visible & Clickable */}
         <button
           onClick={() => onStatusChange?.("lost")}
           onMouseEnter={() => setHoverStatus("lost")}
           onMouseLeave={() => setHoverStatus(null)}
           className="flex flex-col items-center flex-1 cursor-pointer transition-all"
         >
           <div className="relative mb-2">
             <Circle
               className={`w-8 h-8 transition-all ${
                 isLost
                   ? "text-red-500 border-2 border-red-500"
                   : "text-red-300 hover:text-red-400"
               }`}
             />
           </div>
           <span
             className={`text-xs font-medium text-center transition-colors ${
               isLost ? "text-red-700" : "text-red-500"
             }`}
           >
             Lost
           </span>
         </button>
       </div>

      {isLost && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-xs text-red-700 font-medium">
            This tender has been marked as lost.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs text-red-600 hover:bg-red-100"
            onClick={() => onStatusChange?.("new")}
          >
            Reopen
          </Button>
        </div>
      )}

      {isWon && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-xs text-emerald-700 font-medium">
            ✓ Tender successfully won!
          </p>
        </div>
      )}
    </div>
  );
}