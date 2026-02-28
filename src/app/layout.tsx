import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo_Black, Space_Mono } from "next/font/google";
import "./globals.css";
import "./editor.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** RAW_INPUT display font — used for brand, hero text, watermarks */
const archivoBl = Archivo_Black({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

/** RAW_INPUT monospace body font — used for UI, labels, coords */
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kirukal - Create & Share",
  description: "A vertical-scroll editor combining rich text, drawings, and embeds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivoBl.variable} ${spaceMono.variable} antialiased`}
        style={{ background: "var(--color-bg)", color: "var(--color-fg)" }}
      >
        {children}
      </body>
    </html>
  );
}
