// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"; // [추가]

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "오늘 뭐 먹지? - 식사 메뉴 추천기",
  description: "사용자 위치 기반 식사 메뉴 추천 및 룰렛 앱",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "오늘 뭐 먹지? - 식사 메뉴 추천기",
    description: "내 주변 맛집, 룰렛으로 결정하세요!",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}