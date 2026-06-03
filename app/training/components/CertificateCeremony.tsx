"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Award, Share2 } from "lucide-react";
import confetti from "canvas-confetti";

interface CertificateCeremonyProps {
  participantName: string;
  certificateId: string;
  issuedAt: string;
  onDownload: () => void;
}

export function CertificateCeremony({
  participantName,
  certificateId,
  issuedAt,
  onDownload,
}: CertificateCeremonyProps) {
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      void confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      void confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="relative mb-8"
      >
        <div className="absolute -inset-4 rounded-3xl bg-emerald-500/10 blur-xl animate-pulse" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-xl">
          <Award className="h-12 w-12" />
        </div>
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold text-gray-950 text-center mb-2"
      >
        Quest Complete!
      </motion.h2>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-500 text-center mb-10 max-w-md"
      >
        Congratulations, {participantName}. You've demonstrated expert-level analytical skills across {4} startup scenarios.
      </motion.p>

      {/* Certificate Preview Card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-2xl rounded-2xl border-2 border-emerald-100 bg-emerald-50/30 p-8 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Official Award</p>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600/60 mb-6">Evaldam AI Assessment</p>
        <h3 className="text-2xl font-bold text-gray-950 mb-8">Certificate of Participation</h3>

        <div className="border-b-2 border-emerald-100 pb-4 mb-4">
          <p className="text-3xl font-serif italic text-gray-900">{participantName}</p>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-8">
          Recognized for excellence in startup finance analysis and strategic question framing.
        </p>

        <div className="flex justify-between items-end text-left">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Issue Date</p>
            <p className="text-xs font-bold text-gray-700">{new Date(issuedAt).toLocaleDateString("en-IN")}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Certificate ID</p>
            <p className="text-[10px] font-mono font-bold text-gray-700">{certificateId}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-10 flex flex-wrap gap-4 justify-center"
      >
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Download className="h-5 w-5" />
          Download SVG
        </button>
        <button className="flex items-center gap-2 px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors">
          <Share2 className="h-5 w-5" />
          Share Achievement
        </button>
      </motion.div>
    </div>
  );
}
