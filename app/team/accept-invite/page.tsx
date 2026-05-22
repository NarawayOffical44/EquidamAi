export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import AcceptTeamInviteClient from "./AcceptTeamInviteClient";

export const metadata: Metadata = {
  title: "Accept Team Invitation",
  description: "Accept an Evaldam AI team workspace invitation.",
  robots: {
    index: false,
    follow: false,
  },
};

type AcceptInvitePageProps = {
  searchParams: Promise<{ code?: string | string[] }>;
};

export default async function Page({ searchParams }: AcceptInvitePageProps) {
  const params = await searchParams;
  const rawCode = Array.isArray(params.code) ? params.code[0] : params.code;

  return <AcceptTeamInviteClient initialCode={rawCode || ""} />;
}
