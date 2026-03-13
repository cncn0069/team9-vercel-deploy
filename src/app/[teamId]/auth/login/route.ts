import { supabase } from '@/lib/supabase';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { keysToCamel } from '@/lib/api-utils';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const { email, password } = await req.json();

  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('team_id', params.teamId)
    .eq('email', email)
    .single();

  if (error || !user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 틀렸습니다.' },
      { status: 401 }
    );
  }

  const payload = { id: user.id, teamId: user.team_id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const { password: _, ...userProfile } = user;
  return NextResponse.json({
    user: keysToCamel(userProfile),
    accessToken,
    refreshToken,
  });
}
