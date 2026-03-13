import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { keysToCamel } from '@/lib/api-utils';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  props: { params: Promise<{ teamId: string; meetingId: string }> }
) {
  const params = await props.params;
  const { data, error } = await supabase
    .from('meetings')
    .select('*, host:profiles!host_id(id, name, image)')
    .eq('team_id', params.teamId)
    .eq('id', params.meetingId)
    .single();

  if (error || !data)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '모임을 찾을 수 없습니다.' },
      { status: 404 }
    );

  return NextResponse.json(keysToCamel(data));
}

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

  const { data: meeting, error: fetchErr } = await supabase
    .from('meetings')
    .select('host_id, canceled_at')
    .eq('id', params.meetingId)
    .eq('team_id', params.teamId)
    .single();

  if (fetchErr || !meeting)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '모임을 찾을 수 없습니다.' },
      { status: 404 }
    );
  if (meeting.canceled_at)
    return NextResponse.json(
      { code: 'CANCELED', message: '취소된 모임은 수정할 수 없습니다.' },
      { status: 400 }
    );
  if (meeting.host_id !== user.id)
    return NextResponse.json(
      { code: 'FORBIDDEN', message: '호스트만 수정할 수 있습니다.' },
      { status: 403 }
    );

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.type !== undefined) updates.type = body.type;
  if (body.region !== undefined) updates.region = body.region;
  if (body.address !== undefined) updates.address = body.address;
  if (body.latitude !== undefined) updates.latitude = body.latitude;
  if (body.longitude !== undefined) updates.longitude = body.longitude;
  if (body.dateTime !== undefined) updates.date_time = body.dateTime;
  if (body.registrationEnd !== undefined) updates.registration_end = body.registrationEnd;
  if (body.capacity !== undefined) updates.capacity = body.capacity;
  if (body.image !== undefined) updates.image = body.image;
  if (body.description !== undefined) updates.description = body.description;

  if (Object.keys(updates).length === 0)
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '수정할 필드가 없습니다.' },
      { status: 400 }
    );

  const { data, error } = await supabase
    .from('meetings')
    .update(updates)
    .eq('id', params.meetingId)
    .eq('team_id', params.teamId)
    .select('*, host:profiles!host_id(id, name, image)')
    .single();

  if (error)
    return NextResponse.json({ code: 'BAD_REQUEST', message: error.message }, { status: 400 });
  return NextResponse.json(keysToCamel(data));
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
    .select('host_id')
    .eq('id', params.meetingId)
    .eq('team_id', params.teamId)
    .single();

  if (!meeting)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '모임을 찾을 수 없습니다.' },
      { status: 404 }
    );
  if (meeting.host_id !== user.id)
    return NextResponse.json(
      { code: 'FORBIDDEN', message: '주최자만 삭제할 수 있습니다.' },
      { status: 403 }
    );

  await supabase.from('participants').delete().eq('meeting_id', params.meetingId);
  await supabase.from('reviews').delete().eq('meeting_id', params.meetingId);
  const { error: favErr } = await supabase
    .from('favorites')
    .delete()
    .eq('meeting_id', params.meetingId);
  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', params.meetingId)
    .eq('team_id', params.teamId);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  return NextResponse.json({ message: '삭제 성공' });
}
