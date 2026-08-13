import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://certiq.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Certiq — Beautiful certificates in minutes",
  description: "Create personalized certificates from one template and a CSV. Private, free, and entirely in your browser.",
  icons: { icon: "/certiq-logo.png" },
  openGraph: {
    title: "Certiq — Beautiful certificates in minutes",
    description: "Create personalized certificates from one template and a CSV. Private, free, and entirely in your browser.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Certiq certificate generator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Certiq — Beautiful certificates in minutes",
    description: "Create personalized certificates from one template and a CSV. Private, free, and entirely in your browser.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
