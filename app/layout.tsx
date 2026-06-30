import type { Metadata } from "next";
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Circle | Community Finance, Simplified",
  description: "A modern platform for communities to collect contributions, manage shared funds, and automate payouts with complete transparency.",

  openGraph: {
      title: "Circle | Community Finance, Simplified",
      description:
        "Circle helps communities collect contributions, manage shared funds, automate payment reconciliation, and distribute payouts—all from one transparent platform.",

      url: "https:/getcircle.vercel.app",
      siteName: "Circle",

      images: [
        {
          url: "/opengraph.png",
          width: 1200,
          height: 630,
          alt: "Circle — Community Finance, Simplified",
        },
      ],

      locale: "en_US",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: "Circle | Community Finance, Simplified",
      description:
        "Circle helps communities collect contributions, manage shared funds, automate payment reconciliation, and distribute payouts—all from one transparent platform.",

      images: ["/opengraph.png"],
    },

    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },

    robots: {
      index: true,
      follow: true,
    },

    category: "Business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans", inter.variable, spaceGrotesk.variable)}
    >
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <ClerkProvider>
        <body className="min-h-full flex flex-col">{children}</body>
      </ClerkProvider>
    </html>
  );
}
