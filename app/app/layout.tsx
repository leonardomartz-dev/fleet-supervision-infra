import type { Metadata } from "next";
import { CacheReset } from "./cache-reset";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fleet Supervision Demo",
  description: "Simulated fleet visibility and property allocation demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <CacheReset />
        {children}
      </body>
    </html>
  );
}
