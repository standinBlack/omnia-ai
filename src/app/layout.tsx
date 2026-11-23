import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omnia AI",
  description: "Turn text into whiteboard-style cartoon explainer videos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
