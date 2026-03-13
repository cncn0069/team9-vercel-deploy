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

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // joined | created
  const completed = searchParams.get('completed');
  const reviewed = searchParams.get('reviewed');
  const sortBy = searchParams.get('sortBy') || 'dateTime';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const size = parseInt(searchParams.get('size') || '10');
  const cursor = searchParams.get('cursor');

  if (type === 'created') {
    const sortCol =
      sortBy === 'participantCount'
        ? 'participant_count'
        : sortBy === 'registrationEnd'
          ? 'registration_end'
          : 'date_time';
    const { data, error } = await supabase
      .from('meetings')
      .select('*, host:profiles!host_id(id, name, image)')
      .eq('team_id', params.teamId)
      .eq('host_id', user.id)
      .is('canceled_at', null)
      .order(sortCol, { ascending: sortOrder === 'asc' })
      .limit(size + 1);

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    const hasMore = data.length > size;
    const items = hasMore ? data.slice(0, size) : data;
    const nextCursor = hasMore ? String(items[items.length - 1]?.id) : null;

    const formatted = items.map((m: any) => ({
      id: m.id,
      name: m.name,
      dateTime: m.date_time,
      region: m.region,
      participantCount: m.participant_count,
      capacity: m.capacity,
      isReviewed: false,
      role: 'host' as const,
    }));
    return NextResponse.json({
      data: formatted,
      nextCursor,
      hasMore,
    });
  }

  // joined
  const { data: participants, error: pErr } = await supabase
    .from('participants')
    .select('meeting_id')
    .eq('team_id', params.teamId)
    .eq('user_id', user.id);

  if (pErr || !participants?.length)
    return NextResponse.json({ data: [], nextCursor: null, hasMore: false });

  const meetingIds = participants.map((p: any) => p.meeting_id);
  let query = supabase
    .from('meetings')
    .select('*, host:profiles!host_id(id, name, image)')
    .eq('team_id', params.teamId)
    .in('id', meetingIds)
    .is('canceled_at', null);

  if (completed === 'true') query = query.lt('date_time', new Date().toISOString());
  else if (completed === 'false') query = query.gte('date_time', new Date().toISOString());

  const sortCol =
    sortBy === 'participantCount'
      ? 'participant_count'
      : sortBy === 'registrationEnd'
        ? 'registration_end'
        : 'date_time';
  const { data: meetings, error } = await query
    .order(sortCol, { ascending: sortOrder === 'asc' })
    .limit(size + 1);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  const hasMore = (meetings?.length || 0) > size;
  const items = hasMore ? meetings!.slice(0, size) : meetings || [];
  const nextCursor = hasMore ? String(items[items.length - 1]?.id) : null;

  const { data: reviews } = await supabase
    .from('reviews')
    .select('meeting_id')
    .eq('team_id', params.teamId)
    .eq('user_id', user.id)
    .in('meeting_id', items.map((m: any) => m.id));
  const reviewedMeetingIds = new Set((reviews || []).map((r: any) => r.meeting_id));

  const formatted = items.map((m: any) => ({
    id: m.id,
    name: m.name,
    dateTime: m.date_time,
    region: m.region,
    participantCount: m.participant_count,
    capacity: m.capacity,
    isReviewed: reviewedMeetingIds.has(m.id),
    role: m.host_id === user.id ? 'host' : 'participant',
  }));
  return NextResponse.json({ data: formatted, nextCursor, hasMore });
}
