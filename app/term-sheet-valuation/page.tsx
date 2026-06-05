import { getPillarPageMetadata, PillarLandingPage } from "@/lib/seo/pillar-pages";

export const metadata = getPillarPageMetadata("term-sheet-valuation");

export default function TermSheetValuationPage() {
  return <PillarLandingPage slug="term-sheet-valuation" />;
}
