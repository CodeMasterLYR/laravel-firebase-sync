import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Laravel Firebase Sync — Realtime Monitor",
  description: "Real-time client listener for Laravel Firebase RTDB events",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
