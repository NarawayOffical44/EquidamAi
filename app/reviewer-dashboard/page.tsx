import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReviewerProfile } from "@/lib/auth/reviewer-checks";
import { ReviewQueue } from "@/app/admin/ReviewQueue";

export const metadata = {
  title: "Professional Review Dashboard",
  description: "Internal professional review dashboard for Evaldam AI valuation review queues.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ReviewerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify reviewer status
  const reviewer = await getReviewerProfile(user.id);
  if (!reviewer) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Professional Review Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome, {user.email} ({reviewer.specialty || "General Reviewer"})
          </p>
        </div>

        {/* Review Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm font-medium text-gray-600">Your Role</p>
            <p className="text-2xl font-bold capitalize">{reviewer.role}</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm font-medium text-gray-600">Status</p>
            <p className="text-2xl font-bold capitalize text-green-600">{reviewer.status}</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm font-medium text-gray-600">Specialty</p>
            <p className="text-2xl font-bold capitalize">
              {reviewer.specialty || "General"}
            </p>
          </div>
        </div>

        {/* Review Queue */}
        <div className="bg-white rounded-lg border p-6">
          <ReviewQueue />
        </div>
      </div>
    </div>
  );
}
