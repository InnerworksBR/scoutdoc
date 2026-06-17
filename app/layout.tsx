import type { Metadata } from "next";
import { Fredoka, Montserrat } from "next/font/google"; // ScoutDoc 2026 — sticker theme
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ScoutDoc — IA a serviço do escotismo",
  description: "Gere Planos de Unidade Didática e converse com assistentes escoteiros movidos a IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${montserrat.variable}`}>
      <body className="antialiased font-body bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
