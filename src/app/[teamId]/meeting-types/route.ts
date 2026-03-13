import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { keysToCamel } from '@/lib/api-utils';
import { NextResponse } from 'next/server';

export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const { data, error } = await supabase
    .from('meeting_types')
    .select('*')
    .eq('team_id', params.teamId)
    .order('name');

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const body = await req.json();
  const { name, description } = body;
  if (!name?.trim())
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'name은 필수입니다.' },
      { status: 400 }
    );

  const { data, error } = await supabase
    .from('meeting_types')
    .insert({
      team_id: params.teamId,
      name: name.trim(),
      description: description?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return NextResponse.json(
        { code: 'CONFLICT', message: '이미 존재하는 이름입니다.' },
        { status: 409 }
      );
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  }
  return NextResponse.json(keysToCamel(data), { status: 201 });
}
