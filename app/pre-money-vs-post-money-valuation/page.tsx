import { getPillarPageMetadata, PillarLandingPage } from "@/lib/seo/pillar-pages";

export const metadata = getPillarPageMetadata("pre-money-vs-post-money-valuation");

export default function PreMoneyVsPostMoneyValuationPage() {
  return <PillarLandingPage slug="pre-money-vs-post-money-valuation" />;
}
