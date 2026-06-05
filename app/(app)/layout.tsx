import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimPendingPaidCheckout } from "@/lib/payments/pending-paid-checkout";
import { logger } from "@/lib/utils/logger";
import { AuthenticatedAnalytics } from "@/components/AuthenticatedAnalytics";

function getSafeInternalPath(value: string | null) {
  const nextPath = value?.trim() || "";
  if (!nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath.includes("\\")) return "";
  if (nextPath.startsWith("/api/")) return "";
  return nextPath;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const headerStore = await headers();
    const nextPath = getSafeInternalPath(headerStore.get("x-evaldam-current-path"));
    const loginPath = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
    redirect(loginPath);
  }

  await claimPendingPaidCheckout(createAdminClient(), user.email, user.id).catch((claimError) => {
    logger.warn("Pending paid checkout claim failed during app load", {
      userId: user.id,
      email: user.email,
      error: String(claimError),
    });
  });

  return (
    <div className="min-h-screen bg-white">
      <AuthenticatedAnalytics />
      {children}
    </div>
  );
}
