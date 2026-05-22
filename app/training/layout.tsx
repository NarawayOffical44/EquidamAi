import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evaldam Training Research",
  description: "Noindex Evaldam AI training research workflow for creating and answering Indian startup finance questions.",
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
