import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

/**
 * --font-display는 라틴 글자와 숫자만 Figtree로 렌더되고 한글은 Pretendard로 흘러내린다.
 * 컴포넌트에서 폰트 이름을 직접 쓰지 않는다 — DESIGN.md §3
 */
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // 고정 운영 URL. 값은 src/lib/site-url.ts 한 곳에서만 정한다.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} | ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: BRAND.name,
    title: `${BRAND.name} | ${BRAND.tagline}`,
    description: BRAND.description,
    images: [{ url: "/brand/naon-share.png", width: 1200, height: 630, alt: "나온 — 또 다른 나, 세상에 나오다." }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} | ${BRAND.tagline}`,
    description: BRAND.description,
    images: ["/brand/naon-share.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f4ed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${figtree.variable} h-full`}>
      <head>
        {/* Pretendard Variable — 본문 한글 */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
