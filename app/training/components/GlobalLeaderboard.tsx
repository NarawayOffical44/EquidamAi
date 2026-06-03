"use client";

import { motion } from "framer-motion";
import { Trophy, Star } from "lucide-react";

interface GlobalLeaderboardProps {
  entries: Array<{ rank: string; name: string; metric: string; note: string }>;
}

export function GlobalLeaderboard({ entries }: GlobalLeaderboardProps) {
  return (
    <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-950">Quest Leaderboard</h2>
          <p className="text-sm text-gray-500">Live rankings of the top scenario analysts</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
          <Trophy className="h-6 w-6" />
        </div>
      </div>

      <div className="space-y-4">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm ${
                i === 0 ? "bg-amber-100 text-amber-700" :
                i === 1 ? "bg-gray-100 text-gray-700" :
                "bg-blue-50 text-blue-700"
              }`}>
                {entry.rank}
              </span>
              <div>
                <p className="text-sm font-bold text-gray-950">{entry.name}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{entry.note}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-100 shadow-sm">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-gray-700">{entry.metric}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
