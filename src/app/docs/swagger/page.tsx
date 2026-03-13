'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(
  () => import('swagger-ui-react').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">API 문서 로딩 중...</p>
      </div>
    ),
  }
);

export default function SwaggerPage() {
  const [spec, setSpec] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/openapi')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setSpec)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center text-red-600">
          <p className="font-medium">문서를 불러올 수 없습니다.</p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }
  if (!spec) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">API 문서 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SwaggerUI spec={spec} />
    </div>
  );
}
