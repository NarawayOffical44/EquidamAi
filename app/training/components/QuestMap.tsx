"use client";

import { motion } from "framer-motion";
import { CheckCircle, Circle } from "lucide-react";

interface QuestMapProps {
  currentRound: number;
  totalRounds: number;
  isUnlocked: boolean;
}

export function QuestMap({ currentRound, totalRounds, isUnlocked }: QuestMapProps) {
  return (
    <div className="relative mb-12 py-8">
      {/* Connector Line */}
      <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-gray-200">
        <motion.div
          className="h-full bg-emerald-500"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentRound / totalRounds) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Round Nodes */}
      <div className="relative flex justify-between">
        {Array.from({ length: totalRounds }).map((_, i) => {
          const stepNumber = i + 1;
          const isCompleted = currentRound > i;
          const isActive = currentRound === i;

          return (
            <div key={i} className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.2 : 1,
                  backgroundColor: isCompleted ? "#10b981" : isActive ? "#ffffff" : "#f3f4f6",
                  borderColor: isCompleted ? "#10b981" : isActive ? "#111827" : "#d1d5db",
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-300 z-10`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6 text-white" />
                ) : (
                  <span className={`text-sm font-bold ${isActive ? "text-gray-950" : "text-gray-400"}`}>
                    {stepNumber}
                  </span>
                )}
              </motion.div>
              <p className={`mt-3 text-xs font-bold uppercase tracking-wider ${isActive ? "text-gray-950" : "text-gray-400"}`}>
                Round {stepNumber}
              </p>
            </div>
          );
        })}

        {/* Certificate Node */}
        <div className="flex flex-col items-center">
          <motion.div
            animate={{
              scale: isUnlocked ? 1.2 : 1,
              backgroundColor: isUnlocked ? "#111827" : "#f3f4f6",
              borderColor: isUnlocked ? "#111827" : "#d1d5db",
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 z-10"
          >
            <Circle className={`h-5 w-5 ${isUnlocked ? "text-white fill-white" : "text-gray-300"}`} />
          </motion.div>
          <p className={`mt-3 text-xs font-bold uppercase tracking-wider ${isUnlocked ? "text-gray-950" : "text-gray-400"}`}>
            Reward
          </p>
        </div>
      </div>
    </div>
  );
}
