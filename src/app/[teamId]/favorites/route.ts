import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { keysToCamel } from '@/lib/api-utils';
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
  const type = searchParams.get('type');
  const region = searchParams.get('region');
  const date = searchParams.get('date');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const size = Math.min(100, parseInt(searchParams.get('size') || '10') || 10);

  let meetingIds: number[] | null = null;
  if (type || region || date) {
    let meetQ = supabase
      .from('meetings')
      .select('id')
      .eq('team_id', params.teamId)
      .is('canceled_at', null);
    if (type) meetQ = meetQ.eq('type', type);
    if (region) meetQ = meetQ.eq('region', region);
    if (date) meetQ = meetQ.gte('date_time', date).lte('date_time', `${date}T23:59:59.999Z`);
    const { data: meetings } = await meetQ;
    meetingIds = (meetings || []).map((m) => m.id);
    if (meetingIds.length === 0)
      return NextResponse.json({ data: [], nextCursor: null, hasMore: false });
  }

  let q = supabase
    .from('favorites')
    .select('*, meeting:meetings(*, host:profiles!host_id(id, name, image))')
    .eq('team_id', params.teamId)
    .eq('user_id', user.id);

  if (meetingIds) q = q.in('meeting_id', meetingIds);

  const sortCol =
    sortBy === 'dateTime'
      ? 'meeting.date_time'
      : sortBy === 'registrationEnd'
        ? 'meeting.registration_end'
        : sortBy === 'participantCount'
          ? 'meeting.participant_count'
          : 'created_at';

  const { data, error } = await q
    .order(sortBy === 'dateTime' || sortBy === 'participantCount' || sortBy === 'registrationEnd' ? 'meeting_id' : 'created_at', {
      ascending: sortOrder === 'asc',
    })
    .limit(size);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });

  let result = data || [];
  if (sortBy === 'dateTime' || sortBy === 'participantCount' || sortBy === 'registrationEnd') {
    const key =
      sortBy === 'dateTime'
        ? 'date_time'
        : sortBy === 'participantCount'
          ? 'participant_count'
          : 'registration_end';
    result = [...result].sort((a: any, b: any) => {
      const ma = a.meeting?.[key];
      const mb = b.meeting?.[key];
      const cmp = ma == null && mb == null ? 0 : ma == null ? 1 : mb == null ? -1 : ma < mb ? -1 : ma > mb ? 1 : 0;
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }

  return NextResponse.json(
    keysToCamel({
      data: result,
      nextCursor: null,
      hasMore: (result?.length ?? 0) >= size,
    })
  );
}
