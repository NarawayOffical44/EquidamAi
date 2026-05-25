import { GoogleAdSenseScript } from "@/components/GoogleAdSenseScript";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GoogleAdSenseScript />
      {children}
    </>
  );
}
