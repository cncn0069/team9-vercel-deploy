import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Turbopack 기본 사용 (Next.js 16+) - webpack config 제거로 충돌 해결
  turbopack: {},
};

export default nextConfig;
