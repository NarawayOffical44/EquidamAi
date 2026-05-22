import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchAdminLeadData,
  getAdminAccessForUser,
} from "@/lib/admin/leads";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin Leads Dashboard",
  description: "Internal Evaldam AI dashboard for captured leads, inquiries, nurture records, and account signups.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const adminAccess = await getAdminAccessForUser(adminClient, {
    id: user.id,
    email: user.email,
  });

  if (!adminAccess.allowed) {
    redirect("/");
  }

  const leadData = await fetchAdminLeadData(adminClient);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Admin Leads Dashboard</h1>
          <p className="text-blue-100">All captured leads, inquiries, nurture records, and account signups</p>
          <p className="text-xs text-blue-200 mt-2">Logged in as: {user?.email}</p>
          <p className="text-xs text-blue-200 mt-1">
            Access: {adminAccess.method === "role" ? "Admin role" : "Configured admin email"}
          </p>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto p-6">
        <AdminDashboardClient
          initialLeads={leadData.leads}
          initialSourceStatus={leadData.sourceStatus}
          adminEmail={user.email || ""}
        />
      </div>
    </div>
  );
}
