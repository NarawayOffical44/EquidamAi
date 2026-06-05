import { getPillarPageMetadata, PillarLandingPage } from "@/lib/seo/pillar-pages";

export const metadata = getPillarPageMetadata("safe-valuation-cap");

export default function SafeValuationCapPage() {
  return <PillarLandingPage slug="safe-valuation-cap" />;
}
