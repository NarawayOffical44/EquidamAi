import { PageLoader } from "@/components/PageLoader";

export default function Loading() {
  return (
    <PageLoader
      message="Confirming payment"
      detail="Verifying your checkout session before opening your workspace..."
    />
  );
}
