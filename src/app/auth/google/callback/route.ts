import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/google/callback`
  : 'http://localhost:3000/auth/google/callback';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // teamId

  if (!code || !state) {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '인증 코드가 없습니다.' },
      { status: 400 }
    );
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { code: 'CONFIG_ERROR', message: 'Google OAuth가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.json(
      { code: 'OAUTH_FAILED', message: 'Google 인증에 실패했습니다.' },
      { status: 400 }
    );
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const googleUser = await userRes.json();
  const email = googleUser.email;
  const name = googleUser.name || '사용자';
  const image = googleUser.picture || null;

  let { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('team_id', state)
    .eq('email', email)
    .single();

  if (error && error.code === 'PGRST116') {
    const { data: newUser, error: insertError } = await supabase
      .from('profiles')
      .insert([{ team_id: state, email, name, image, password: null }])
      .select()
      .single();
    if (insertError) {
      return NextResponse.json(
        { code: 'SIGNUP_FAILED', message: insertError.message },
        { status: 500 }
      );
    }
    user = newUser;
  } else if (error) {
    return NextResponse.json({ code: 'DB_ERROR', message: error.message }, { status: 500 });
  } else if (user) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ name, image })
      .eq('id', user.id);
    if (!updateError) user = { ...user, name, image };
  }

  const { password: _, ...userProfile } = user;
  const payload = { id: user.id, teamId: state, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const frontUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return NextResponse.redirect(
    `${frontUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}`
  );
}
