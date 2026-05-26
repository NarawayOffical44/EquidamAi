"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function AuthBackButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-primary ${className}`}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back
    </button>
  );
}
