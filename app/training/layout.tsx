import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evaldam Question Quest",
  description: "Noindex Evaldam AI certificate game for creating and answering Indian startup finance questions.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrainingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
