import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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
  title: "Órbita — Seu universo de aprendizado",
  description:
    "Mentorias 1:1, cursos, trilhas, biblioteca e eventos orbitando o seu crescimento. Encontre especialistas, agende sessões e participe de reuniões por vídeo dentro da plataforma.",
  keywords: ["mentoria", "mentor", "cursos", "trilhas", "educação", "carreira", "Órbita"],
  authors: [{ name: "Órbita" }],
  manifest: "/manifest.webmanifest",
  applicationName: "Órbita",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Órbita",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Órbita — Seu universo de aprendizado",
    description: "Mentorias 1:1, cursos, trilhas e biblioteca — tudo orbitando o seu crescimento.",
    siteName: "Órbita",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
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
      </body>
    </html>
  );
}
