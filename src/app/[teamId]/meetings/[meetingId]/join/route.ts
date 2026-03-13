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

  const { data: meeting, error: me } = await supabase
    .from('meetings')
    .select('host_id, canceled_at, registration_end, capacity, date_time')
    .eq('id', params.meetingId)
    .eq('team_id', params.teamId)
    .single();

  if (me || !meeting)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '모임을 찾을 수 없습니다.' },
      { status: 404 }
    );
  if (meeting.canceled_at)
    return NextResponse.json(
      { code: 'CANCELED', message: '취소된 모임에는 참여할 수 없습니다.' },
      { status: 400 }
    );
  if (meeting.registration_end && new Date(meeting.registration_end) < new Date())
    return NextResponse.json(
      { code: 'REGISTRATION_CLOSED', message: '모집이 마감되었습니다.' },
      { status: 400 }
    );
  if (meeting.host_id === user.id)
    return NextResponse.json(
      { code: 'ALREADY_JOINED', message: '호스트는 이미 참여 중입니다.' },
      { status: 409 }
    );

  const { count } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('meeting_id', params.meetingId);
  if (count !== null && count >= meeting.capacity)
    return NextResponse.json(
      { code: 'CAPACITY_FULL', message: '정원이 초과되었습니다.' },
      { status: 400 }
    );

  const { error } = await supabase.from('participants').insert({
    team_id: params.teamId,
    meeting_id: params.meetingId,
    user_id: user.id,
  });

  if (error)
    return NextResponse.json(
      { code: 'ALREADY_JOINED', message: '이미 참여 중입니다.' },
      { status: 409 }
    );

  return NextResponse.json({ message: '참여 성공' });
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

  const { data: meeting } = await supabase
    .from('meetings')
    .select('host_id, canceled_at, date_time')
    .eq('id', params.meetingId)
    .eq('team_id', params.teamId)
    .single();

  if (!meeting)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '모임을 찾을 수 없습니다.' },
      { status: 404 }
    );
  if (meeting.host_id === user.id)
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '호스트는 참여 취소할 수 없습니다.' },
      { status: 400 }
    );
  if (meeting.canceled_at)
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '취소된 모임입니다.' },
      { status: 400 }
    );
  if (meeting.date_time && new Date(meeting.date_time) <= new Date())
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '이미 시작된 모임입니다.' },
      { status: 400 }
    );

  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('team_id', params.teamId)
    .eq('meeting_id', params.meetingId)
    .eq('user_id', user.id);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  return NextResponse.json({ message: '취소 성공' });
}
