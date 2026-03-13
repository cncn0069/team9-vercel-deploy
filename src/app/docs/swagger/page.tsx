'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react').then((mod) => mod.default), {
  ssr: false,
});

// spec 직접 전달 → Vercel fetch/MIME 이슈 회피
import openapiSpec from '../../../../public/openapi.json';

export default function SwaggerPage() {
  return (
    <div className="min-h-screen">
      <SwaggerUI spec={openapiSpec} />
    </div>
  );
}
