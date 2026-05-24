import type { Metadata } from "next";
import { Bodoni_Moda, Jost, Caveat } from "next/font/google";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CustomCursor from "@/components/layout/CustomCursor";
import JsonLD from "@/components/seo/JsonLD";
import "./globals.css";

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://artisanal-henna.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'Artisanal Henna | Tradition Crafted by Hand',
    template: '%s | Artisanal Henna',
  },
  description:
    'Shop premium handmade natural henna products — organic cones, powders, bridal kits, and accessories rooted in ritual and cultural authenticity.',
  keywords: [
    'artisanal henna',
    'natural henna cones',
    'organic henna powder',
    'bridal henna kit',
    'mehndi products',
    'handmade henna india',
    'henna accessories',
  ],

  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'Artisanal Henna',
    title: 'Artisanal Henna | Tradition Crafted by Hand',
    description:
      'Shop premium handmade natural henna products — organic cones, powders, bridal kits, and accessories.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Artisanal Henna — Premium Natural Henna Products',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Artisanal Henna | Tradition Crafted by Hand',
    description:
      'Shop premium handmade natural henna products — organic cones, powders, bridal kits, and accessories.',
    images: ['/og-image.jpg'],
  },

  alternates: {
    canonical: SITE_URL,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Artisanal Henna",
  "url": "https://artisanal-henna.com",
  "logo": "https://artisanal-henna.com/logo.png",
  "description": "Premium handmade natural henna products.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodoniModa.variable} ${jost.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-warm-cream text-henna-deep selection:bg-terracotta selection:text-warm-cream">
        <JsonLD data={organizationJsonLd} />
        <SmoothScrollProvider>
          <CustomCursor />
          <Navbar />
          <main className="flex-grow pt-24">
            {children}
          </main>
          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
