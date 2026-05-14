import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Training Research",
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
