import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  props: { params: Promise<{ teamId: string; typeId: string }> }
) {
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
  if (body.name !== undefined) updates.name = body.name?.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() ?? null;

  if (Object.keys(updates).length === 0)
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '수정할 필드가 없습니다.' },
      { status: 400 }
    );

  const { data, error } = await supabase
    .from('meeting_types')
    .update(updates)
    .eq('id', params.typeId)
    .eq('team_id', params.teamId)
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return NextResponse.json(
        { code: 'CONFLICT', message: '이미 존재하는 이름입니다.' },
        { status: 409 }
      );
    if (error.code === 'PGRST116')
      return NextResponse.json(
        { code: 'NOT_FOUND', message: '모임 종류를 찾을 수 없습니다.' },
        { status: 404 }
      );
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ teamId: string; typeId: string }> }
) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const { error } = await supabase
    .from('meeting_types')
    .delete()
    .eq('id', params.typeId)
    .eq('team_id', params.teamId);

  if (error) {
    if (error.code === 'PGRST116')
      return NextResponse.json(
        { code: 'NOT_FOUND', message: '모임 종류를 찾을 수 없습니다.' },
        { status: 404 }
      );
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: '삭제 성공' });
}
