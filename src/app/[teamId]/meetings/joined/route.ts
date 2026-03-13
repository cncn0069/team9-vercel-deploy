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
  const completed = searchParams.get('completed');
  const reviewed = searchParams.get('reviewed');
  const sortBy = searchParams.get('sortBy') || 'dateTime';
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const size = parseInt(searchParams.get('size') || '10');
  const cursor = searchParams.get('cursor');

  const { data: parts, error: pe } = await supabase
    .from('participants')
    .select('meeting_id, joined_at')
    .eq('team_id', params.teamId)
    .eq('user_id', user.id);

  if (pe || !parts?.length)
    return NextResponse.json({ data: [], nextCursor: null, hasMore: false });

  const meetingIds = parts.map((p) => p.meeting_id);
  let q = supabase
    .from('meetings')
    .select('*, host:profiles!host_id(id, name, image)')
    .in('id', meetingIds)
    .order(sortBy === 'dateTime' ? 'date_time' : sortBy, { ascending: sortOrder === 'asc' });

  if (completed === 'true') q = q.lte('date_time', new Date().toISOString());
  else if (completed === 'false') q = q.gt('date_time', new Date().toISOString());

  const { data: meetings, error } = await q.limit(size);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });

  const partMap = Object.fromEntries(parts.map((p) => [p.meeting_id, p]));
  const { data: myReviews } = await supabase
    .from('reviews')
    .select('meeting_id')
    .eq('user_id', user.id)
    .in('meeting_id', meetingIds);

  const reviewSet = new Set((myReviews || []).map((r) => r.meeting_id));
  const now = new Date().toISOString();

  const items = (meetings || []).map((m) => ({
    ...m,
    joinedAt: (partMap[m.id] as any)?.joined_at ?? null,
    isReviewed: reviewSet.has(m.id),
    isCompleted: m.date_time ? new Date(m.date_time) <= new Date(now) : false,
  }));

  if (reviewed === 'true') {
    const filtered = items.filter((i) => i.isReviewed);
    return NextResponse.json(keysToCamel({ data: filtered, nextCursor: null, hasMore: false }));
  }
  if (reviewed === 'false') {
    const filtered = items.filter((i) => !i.isReviewed);
    return NextResponse.json(keysToCamel({ data: filtered, nextCursor: null, hasMore: false }));
  }

  return NextResponse.json(
    keysToCamel({
      data: items,
      nextCursor: items.length >= size ? String(items.at(-1)?.id ?? '') : null,
      hasMore: items.length >= size,
    })
  );
}
