import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Velora SafeRoute - Smart Urban Mobility",
  description: "Choose the safest practical route in seconds. AI-powered safety intelligence for urban commuters.",
  keywords: "safety, routing, navigation, urban mobility, commute",
  authors: [{ name: "Velora" }],
  openGraph: {
    title: "Velora SafeRoute",
    description: "Smart route selection powered by safety intelligence",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
