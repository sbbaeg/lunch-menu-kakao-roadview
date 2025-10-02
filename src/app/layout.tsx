// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Providers from './providers'; // <--- 1. 이 줄을 추가합니다.

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
}); 

const roboto_mono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
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
          {/* 2. 기존 {children}을 <Providers>로 감싸줍니다. */}
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}