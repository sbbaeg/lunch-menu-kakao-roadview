// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/AppShell";
import Providers from './providers'; // <--- 1. 이 줄을 추가합니다.
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
}); 

const roboto_mono = localFont({
  src: '../../public/fonts/RobotoMono-Regular.ttf',
  variable: '--font-roboto-mono',
}); 


export const metadata: Metadata = {
  title: "오늘 뭐 먹지? - 식사 메뉴 추천",
  description: "사용자 위치 기반 음식점 추천 및 랜덤 추첨앱",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "오늘 뭐 먹지? - 식사 메뉴 추천",
    description: "내 주변 맛집, 검색과 룰렛으로 결정하세요!",
    images: [
      {
        url: "https://lunch-menu-kakao.vercel.app/icon.png",
        width: 256,
        height: 256,
        alt: "오늘 뭐 먹지? 로고",
      },
    ],
    type: "website",
    url: "https://lunch-menu-kakao.vercel.app",
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
}; 

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${roboto_mono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}