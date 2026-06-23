import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Soroban Contract Explorer",
  description:
    "Interact with any deployed Soroban smart contract on Stellar without writing code.",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "Soroban Contract Explorer",
    description:
      "Interact with any deployed Soroban smart contract on Stellar without writing code.",
    type: "website",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Soroban Contract Explorer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Soroban Contract Explorer",
    description:
      "Interact with any deployed Soroban smart contract on Stellar without writing code.",
    images: ["/opengraph-image"],
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
