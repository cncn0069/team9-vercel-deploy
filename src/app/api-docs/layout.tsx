import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API 문서 (Swagger)',
  description: '같이 달램 API 문서 - OpenAPI Swagger UI',
};

export default function ApiDocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
