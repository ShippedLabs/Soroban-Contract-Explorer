import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soroban Contract Explorer — No-Code Smart Contract Interaction",
  description:
    "Explore and interact with any deployed Soroban smart contract on Stellar without writing code. Invoke functions, read state, and test contracts through a clean UI.",
  generator: "Next.js",
  applicationName: "Soroban Contract Explorer",
  keywords: [
    "Soroban",
    "Stellar",
    "smart contract",
    "blockchain explorer",
    "no-code",
    "Web3",
    "contract interaction",
  ],
  authors: [{ name: "ShippedLabs" }],
  creator: "ShippedLabs",
  openGraph: {
    title: "Soroban Contract Explorer",
    description:
      "No-code UI for interacting with any deployed Soroban smart contract on Stellar.",
    url: "https://soroban-contract-explorer.vercel.app",
    siteName: "Soroban Contract Explorer",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Soroban Contract Explorer — Interact with Soroban contracts without code",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Soroban Contract Explorer",
    description:
      "No-code UI for interacting with any deployed Soroban smart contract on Stellar.",
    images: ["/og-image.png"],
    creator: "@itsgrantfox",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  metadataBase: new URL("https://soroban-contract-explorer.vercel.app"),
  robots: {
    index: true,
    follow: true,
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
