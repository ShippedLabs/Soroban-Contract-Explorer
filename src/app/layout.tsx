import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soroban Contract Explorer",
  description:
    "Inspect and call any Soroban smart contract on Stellar — no code required. Paste a contract ID to view its functions and submit transactions directly from the browser.",
  openGraph: {
    title: "Soroban Contract Explorer",
    description:
      "Inspect and call any Soroban smart contract on Stellar — no code required.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Soroban Contract Explorer",
    description:
      "Inspect and call any Soroban smart contract on Stellar — no code required.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
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
