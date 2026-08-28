import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "MentorHub — Aprenda com quem vive o que ensina",
    description: "Mentores especialistas, agendamento simples e reuniões por vídeo integradas.",
    siteName: "MentorHub",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
