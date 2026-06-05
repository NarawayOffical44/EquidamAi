import { getPillarPageMetadata, PillarLandingPage } from "@/lib/seo/pillar-pages";

export const metadata = getPillarPageMetadata("startup-cap-table-valuation");

export default function StartupCapTableValuationPage() {
  return <PillarLandingPage slug="startup-cap-table-valuation" />;
}
