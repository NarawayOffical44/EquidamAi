import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchAdminLeadData,
  getConfiguredAdminEmail,
  isAllowedAdminEmail,
} from "@/lib/admin/leads";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAllowedAdminEmail(user.email)) {
    redirect("/");
  }

  const adminClient = createAdminClient();
  const leadData = await fetchAdminLeadData(adminClient);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Admin Leads Dashboard</h1>
          <p className="text-blue-100">All captured leads, inquiries, nurture records, and account signups</p>
          <p className="text-xs text-blue-200 mt-2">Logged in as: {user?.email}</p>
          <p className="text-xs text-blue-200 mt-1">Allowed admin email: {getConfiguredAdminEmail()}</p>
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
