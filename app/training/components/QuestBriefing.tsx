"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Star, ShieldCheck } from "lucide-react";

interface QuestBriefingProps {
  onStart: () => void;
}

export function QuestBriefing({ onStart }: QuestBriefingProps) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
          <Star className="h-4 w-4 text-blue-500 fill-blue-500" />
          <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Active Assessment</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-950 mb-6 tracking-tight leading-tight">
          Master the Art of <span className="text-blue-600">Startup Finance</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Step into the role of a strategic analyst. Solve real-world scenarios, frame critical questions, and earn your Evaldam AI Certificate.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <button
            onClick={onStart}
            className="group flex items-center gap-3 px-8 py-5 bg-gray-950 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl shadow-gray-950/20 active:scale-95"
          >
            <Play className="h-5 w-5 fill-white" />
            Begin Round 1
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <ShieldCheck className="h-4 w-4" />
            No invite required
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            title: "Analysis",
            desc: "Review complex scenarios from Indian founders facing critical finance decisions.",
            icon: "01",
          },
          {
            title: "Questioning",
            desc: "Frame one What, one How, and one Why question to demonstrate your depth.",
            icon: "02",
          },
          {
            title: "Certification",
            desc: "Clear 4 rounds to unlock your unique, verifiable participation certificate.",
            icon: "03",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="p-8 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-950 font-bold mb-6">
              {item.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-950 mb-3">{item.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
