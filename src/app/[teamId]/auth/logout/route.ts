import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token || !verifyToken(token)) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  // refreshToken 무효화는 클라이언트에서 해당 토큰 폐기 처리
  // 서버에서는 refresh token 블랙리스트 테이블이 있다면 여기서 추가
  return new NextResponse(null, { status: 204 });
}
