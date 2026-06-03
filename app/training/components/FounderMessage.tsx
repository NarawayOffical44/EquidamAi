"use client";

import { motion } from "framer-motion";
import { Mail, Send } from "lucide-react";

interface FounderMessageProps {
  scenario: {
    title: string;
    content: string;
    category: string;
  };
}

export function FounderMessage({ scenario }: FounderMessageProps) {
  const founderName = scenario.title.split(" ")[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">New Message from</p>
            <p className="text-sm font-bold text-gray-950">{founderName} (Startup Founder)</p>
          </div>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase text-amber-700 tracking-wider">
          {scenario.category} Priority
        </span>
      </div>

      <div className="p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4">{scenario.title}</h2>
        <div className="relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-500/10 rounded-full" />
          <p className="text-base leading-relaxed text-gray-700 italic">
            "{scenario.content}"
          </p>
        </div>
      </div>

      <div className="border-t border-gray-50 bg-gray-50/50 px-6 py-3 flex justify-end">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <Send className="h-3 w-3" />
          Awaiting your analysis
        </div>
      </div>
    </motion.div>
  );
}
