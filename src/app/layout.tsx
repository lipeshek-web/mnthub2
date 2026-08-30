import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/platform/theme-provider";
import { PwaRegister } from "@/components/platform/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MentorHub — Plataforma de Mentorias 1:1",
  description:
    "Marketplace de mentorias: encontre especialistas, agende sessões na agenda real dos mentores e participe de reuniões por vídeo dentro da plataforma.",
  keywords: ["mentoria", "mentor", "agendamento", "educação", "carreira", "MentorHub"],
  authors: [{ name: "MentorHub" }],
  manifest: "/manifest.webmanifest",
  applicationName: "MentorHub",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MentorHub",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "MentorHub — Aprenda com quem vive o que ensina",
    description: "Mentores especialistas, agendamento simples e reuniões por vídeo integradas.",
    siteName: "MentorHub",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <PwaRegister />
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
