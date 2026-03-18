import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";

/**
 * Renders a sticky banner at the top of the page when the browser reports
 * being offline, and fires a toast when connectivity changes.
 */
export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back Online", {
        description: "Your internet connection has been restored.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("No Internet Connection", {
        description: "You are offline. Some features may not be available.",
        duration: Infinity, // keep until reconnected
        id: "network-offline", // prevent duplicates
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 shadow-md">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>You are offline — check your internet connection</span>
    </div>
  );
}
