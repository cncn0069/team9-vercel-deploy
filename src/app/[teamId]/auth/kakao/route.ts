import { NextResponse } from 'next/server';

const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/kakao/callback`
  : 'http://localhost:3000/auth/kakao/callback';

export async function GET(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  if (!KAKAO_CLIENT_ID) {
    return NextResponse.json(
      { code: 'CONFIG_ERROR', message: '카카오 OAuth가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }
  const url = new URL('https://kauth.kakao.com/oauth/authorize');
  url.searchParams.set('client_id', KAKAO_CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'profile_nickname account_email');
  url.searchParams.set('state', teamId);
  return NextResponse.redirect(url.toString());
}
