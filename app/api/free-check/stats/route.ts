import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const adminClient = createAdminClient();

    // Count distinct companies in leads table
    const { count, error } = await adminClient
      .from("leads")
      .select("company_name", { count: "exact", head: true });

    if (error) {
      console.error("Failed to fetch leads count:", error);
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ count: 0 });
  }
}
