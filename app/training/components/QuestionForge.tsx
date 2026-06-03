"use client";

import { motion } from "framer-motion";
import { CheckCircle, HelpCircle } from "lucide-react";

interface QuestionForgeProps {
  scenarioId: string;
  answers: { what: string; how: string; why: string };
  onUpdateAnswer: (field: "what" | "how" | "why", value: string) => void;
  isValid: (field: "what" | "how" | "why", value: string) => boolean;
  wordCount: (field: "what" | "how" | "why", value: string) => number;
}

export function QuestionForge({
  scenarioId,
  answers,
  onUpdateAnswer,
  isValid,
  wordCount,
}: QuestionForgeProps) {
  const fields = [
    { id: "what", label: "What", icon: <HelpCircle className="h-4 w-4" />, placeholder: "e.g., What is the primary valuation method suitable for this stage?" },
    { id: "how", label: "How", icon: <HelpCircle className="h-4 w-4" />, placeholder: "e.g., How does the ESOP pool creation affect founder dilution?" },
    { id: "why", label: "Why", icon: <HelpCircle className="h-4 w-4" />, placeholder: "e.g., Why would a revenue-based financing deal be better than equity?" },
  ] as const;

  return (
    <div className="space-y-6 mt-8">
      {fields.map((field) => {
        const value = answers[field.id] || "";
        const ready = isValid(field.id, value);
        const count = wordCount(field.id, value);

        return (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="group"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-gray-950 uppercase tracking-tight">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${ready ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                  {ready ? <CheckCircle className="h-3.5 w-3.5" /> : field.icon}
                </span>
                {field.label} Question
              </span>
              <span className={`text-[10px] font-bold uppercase ${value && !ready ? "text-red-500" : "text-gray-400"}`}>
                {count}/26 Words
              </span>
            </div>

            <div className="relative">
              <div className={`absolute inset-y-0 left-0 w-1 rounded-full transition-colors ${ready ? "bg-emerald-500" : "bg-gray-200 group-focus-within:bg-gray-400"}`} />
              <input
                type="text"
                className="w-full bg-white border-none py-4 px-6 text-lg font-medium text-gray-950 placeholder:text-gray-300 focus:ring-0"
                placeholder={field.placeholder}
                value={value}
                onChange={(e) => onUpdateAnswer(field.id, e.target.value)}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
