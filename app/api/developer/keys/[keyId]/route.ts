import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { keyId } = await params;
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("api_keys")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
    })
    .eq("id", keyId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });

  return NextResponse.json({ success: true });
}
