import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Ella Service Sync",
  description: "Fine-dining service coordination POS"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-bone font-sans">
        {children}
      </body>
    </html>
  );
}
