import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  props: { params: Promise<{ teamId: string; meetingId: string }> }
) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const { data: meeting } = await supabase
    .from('meetings')
    .select('id')
    .eq('id', params.meetingId)
    .eq('team_id', params.teamId)
    .single();

  if (!meeting)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '모임을 찾을 수 없습니다.' },
      { status: 404 }
    );

  const { data, error } = await supabase
    .from('favorites')
    .insert({ team_id: params.teamId, meeting_id: params.meetingId, user_id: user.id })
    .select('*, meeting:meetings(*, host:profiles!host_id(id, name, image))')
    .single();

  if (error)
    return NextResponse.json(
      { code: 'CONFLICT', message: '이미 찜한 모임입니다.' },
      { status: 409 }
    );
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ teamId: string; meetingId: string }> }
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
    .from('favorites')
    .delete()
    .eq('team_id', params.teamId)
    .eq('meeting_id', params.meetingId)
    .eq('user_id', user.id);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  return NextResponse.json({ message: '찜 해제 성공' });
}
