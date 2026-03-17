import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function TeamCard({ team, icon: Icon, description, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={createPageUrl(`Auth?team=${team}`)}>
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative group cursor-pointer rounded-2xl border border-gray-100 bg-white p-8 md:p-10 shadow-sm hover:shadow-2xl transition-shadow duration-500 overflow-hidden"
        >
          {/* Accent gradient */}
          <div
            className={`absolute top-0 left-0 w-full h-1.5 ${color}`}
          />

          {/* Floating orb */}
          <div
            className={`absolute -top-16 -right-16 w-48 h-48 rounded-full ${color} opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-700`}
          />

          <div className="relative z-10">
            <div
              className={`w-16 h-16 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center mb-6`}
            >
              <Icon className="w-8 h-8 text-[#00A3E0]" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
              {team === "sales" ? "Sales Team" : "Presales Team"}
            </h3>

            <p className="text-gray-500 text-base leading-relaxed mb-6">
              {description}
            </p>

            <div className="flex items-center gap-2 text-[#00A3E0] font-semibold text-sm group-hover:gap-3 transition-all duration-300">
              <span>Open Dashboard</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}