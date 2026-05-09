import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Role-based access control: only admin or professional_reviewer
  const { data: userProfile } = await supabase
    .from("users")
    .select("role, reviewer_status")
    .eq("id", user.id)
    .single();

  const isAdmin = userProfile?.role === "admin";
  const isActiveReviewer = userProfile?.role === "professional_reviewer" && userProfile?.reviewer_status === "active";

  if (!isAdmin && !isActiveReviewer) {
    redirect("/login");
  }

  // Fetch all leads from database
  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching leads:", error);
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-blue-100">Free Valuation Leads Management</p>
          <p className="text-xs text-blue-200 mt-2">Logged in as: {user?.email}</p>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto p-6">
        <AdminDashboardClient initialLeads={leads || []} />
      </div>
    </div>
  );
}
