import type { NextConfig } from "next";

/**
 * 이미지는 private 버킷의 signed URL로 내려온다.
 * Supabase 프로젝트 호스트만 열어 둔다 — URL을 하드코딩하지 않으므로 환경변수에서 뽑는다.
 */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/sign/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
