import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const { data, error } = await supabase
    .from('profiles')
    .select('id, team_id, email, name, company_name, image, created_at, updated_at')
    .eq('team_id', params.teamId)
    .eq('id', user.id)
    .single();

  if (error || !data)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '사용자를 찾을 수 없습니다.' },
      { status: 401 }
    );

  const profile = {
    ...data,
    teamId: data.team_id,
    companyName: data.company_name,
  };
  delete (profile as any).team_id;
  delete (profile as any).company_name;
  return NextResponse.json(profile);
}

export async function PATCH(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.companyName !== undefined) updates.company_name = body.companyName;
  if (body.image !== undefined) updates.image = body.image;

  if (Object.keys(updates).length === 0)
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '수정할 필드가 없습니다.' },
      { status: 400 }
    );

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('team_id', params.teamId)
    .eq('id', user.id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ code: 'BAD_REQUEST', message: error.message }, { status: 400 });

  const { password: _, team_id, company_name, ...rest } = data;
  return NextResponse.json({ ...rest, teamId: team_id, companyName: company_name });
}
