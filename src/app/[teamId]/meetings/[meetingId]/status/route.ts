import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function PATCH(
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

  const { status } = await req.json();
  if (!['CONFIRMED', 'CANCELED'].includes(status))
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'status는 CONFIRMED 또는 CANCELED여야 합니다.' },
      { status: 400 }
    );

  const { data: meeting, error: fe } = await supabase
    .from('meetings')
    .select('host_id, canceled_at')
    .eq('id', params.meetingId)
    .eq('team_id', params.teamId)
    .single();

  if (fe || !meeting)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '모임을 찾을 수 없습니다.' },
      { status: 404 }
    );
  if (meeting.host_id !== user.id)
    return NextResponse.json(
      { code: 'FORBIDDEN', message: '주최자만 가능합니다.' },
      { status: 403 }
    );
  if (meeting.canceled_at && status === 'CONFIRMED')
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '이미 취소된 모임입니다.' },
      { status: 400 }
    );

  const update =
    status === 'CANCELED'
      ? { canceled_at: new Date().toISOString() }
      : { confirmed_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from('meetings')
    .update(update)
    .eq('id', params.meetingId)
    .eq('team_id', params.teamId)
    .select('*, host:profiles!host_id(id, name, image)')
    .single();

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  return NextResponse.json(data);
}
