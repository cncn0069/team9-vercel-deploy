import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // turbopack 비활성 - swagger-ui-react가 Vercel 빌드에서 이슈 있을 수 있음
  // turbopack: {},
  // webpack 모드 사용 시 프로젝트 node_modules 우선 (--webpack 플래그)
  webpack: (config) => {
    const projectRoot = path.resolve(process.cwd());
    config.resolve = config.resolve || {};
    config.resolve.modules = [
      path.join(projectRoot, 'node_modules'),
      ...(config.resolve.modules || []),
    ];
    return config;
  },
};

export default nextConfig;
