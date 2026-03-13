import { NextResponse } from 'next/server';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/jwt';

export async function POST(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const body = await req.json();
  const { refreshToken } = body;

  if (!refreshToken) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '리프레시 토큰이 필요합니다.' },
      { status: 401 }
    );
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '유효하지 않거나 만료된 토큰입니다.' },
      { status: 401 }
    );
  }

  const payload = { id: decoded.id, teamId: decoded.teamId, email: decoded.email };
  const newAccessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  return NextResponse.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
}
