import React from "react";
import { motion } from "framer-motion";

const statVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function StatsRow({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          custom={i}
          initial="hidden"
          animate="visible"
          variants={statVariants}
          className="bg-white rounded-2xl border border-gray-100 p-5 relative overflow-hidden"
        >
          <div className={`absolute top-0 right-0 w-20 h-20 rounded-full ${stat.bgColor} opacity-10 -translate-y-6 translate-x-6`} />
          <div className="relative z-10">
            <div className={`w-10 h-10 rounded-xl ${stat.bgColor} bg-opacity-15 flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}