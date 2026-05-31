import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}
