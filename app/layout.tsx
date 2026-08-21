import type { Metadata, Viewport } from "next";
import { Inter_Tight, Playfair_Display } from "next/font/google";
import "./globals.css";

const sans = Inter_Tight({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Playfair_Display({
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nadzhealthcare.com"),
  title: "Dr. Nadia Choudhry - Physician, Founder",
  description:
    "Physician and founder of NADZ Healthcare. Preventive medicine, longevity and personalized care, delivered continuously rather than in appointments.",
  openGraph: {
    title: "Dr. Nadia Choudhry - Physician, Founder",
    description:
      "Preventive medicine, longevity and personalized care across Abu Dhabi and Dubai.",
    images: ["/assets/hero_nadia2.webp"],
    type: "profile",
  },
};

export const viewport: Viewport = {
  themeColor: "#141416",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
