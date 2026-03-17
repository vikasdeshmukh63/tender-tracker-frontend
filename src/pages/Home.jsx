import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, FileSearch } from "lucide-react";
import TeamCard from "../components/home/TeamCard";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function Home() {
  const navigate = useNavigate();

  // If user is already logged in, do not allow access to Home; redirect to their dashboard
  useEffect(() => {
    const userStr = localStorage.getItem("esds_user");
    if (userStr) {
      const urlParams = new URLSearchParams(window.location.search);
      const team = urlParams.get("team") || "sales";
      navigate(createPageUrl(`Dashboard?team=${team}`), { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-emerald-50/20 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-purple-400/5 to-pink-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      
      {/* Tech grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M0 0h50v50H0zM50 50h50v50H50z' fill='%2300A3E0' fill-opacity='0.4'/%3E%3Cpath d='M50 0h50v50H50zM0 50h50v50H0z' fill='%2310b981' fill-opacity='0.3'/%3E%3C/svg%3E")`,
        backgroundSize: '100px 100px'
      }} />
      
      {/* Cloud shapes */}
      <div className="absolute top-20 left-10 w-32 h-16 bg-white/40 rounded-full blur-xl" />
      <div className="absolute top-32 left-24 w-24 h-12 bg-white/30 rounded-full blur-xl" />
      <div className="absolute bottom-32 right-20 w-40 h-20 bg-white/40 rounded-full blur-xl" />
      <div className="absolute bottom-20 right-32 w-28 h-14 bg-white/30 rounded-full blur-xl" />
      <div className="w-full max-w-4xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="flex justify-center mb-6">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6897af237d7c03e0ef8f6a97/c4e137d83_image.png"
              alt="ESDS Logo"
              className="h-20 md:h-24 object-contain"
            />
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
            <span className="text-[#1e3a8a]">Tender</span>{" "}
            <span className="text-[#00A3E0]">Tracker</span>
          </h1>
          <p className="text-gray-500 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            Presales & Sales Pipeline Management<br />
            <span className="text-sm md:text-base">Track and Manage Deals Efficiently.</span>
          </p>
        </motion.div>

        {/* Team Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <TeamCard
            team="sales"
            icon={TrendingUp}
            description="Track Active Deals, Manage Client Relationships and Monitor Your Sales Pipeline in Real Time."
            color="bg-[#00A3E0]"
            delay={0.2}
          />
          <TeamCard
            team="presales"
            icon={FileSearch}
            description="Manage Technical Evaluations, RFP Responses and Solution Architecture for Incoming Tenders."
            color="bg-emerald-500"
            delay={0.35}
          />
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-gray-400 mt-12"
        >
          ESDS Software Solution Pvt Ltd © {new Date().getFullYear()}
        </motion.p>
      </div>
    </div>
  );
}