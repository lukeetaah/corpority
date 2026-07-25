import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Corpority — Career Survival Simulator",
  description: "A satirical board game about surviving corporate life.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
