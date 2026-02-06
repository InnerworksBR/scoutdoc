import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google"; // Distinctive fonts
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agent Scout Doc Generator",
  description: "AI-powered scout document generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${plusJakartaSans.variable}`}>
      <body className="antialiased font-body bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
