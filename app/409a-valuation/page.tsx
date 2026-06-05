import { getPillarPageMetadata, PillarLandingPage } from "@/lib/seo/pillar-pages";

export const metadata = getPillarPageMetadata("409a-valuation");

export default function Valuation409APage() {
  return <PillarLandingPage slug="409a-valuation" />;
}
