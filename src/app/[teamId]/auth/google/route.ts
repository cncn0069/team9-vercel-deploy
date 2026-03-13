import { NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/google/callback`
  : 'http://localhost:3000/auth/google/callback';

export async function GET(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { code: 'CONFIG_ERROR', message: 'Google OAuth가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', teamId);
  return NextResponse.redirect(url.toString());
}
