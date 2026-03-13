import { supabase } from '@/lib/supabase';
import { keysToCamel } from '@/lib/api-utils';
import { NextResponse } from 'next/server';

export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const { searchParams } = new URL(req.url);
  const meetingId = searchParams.get('meetingId');
  const userId = searchParams.get('userId');
  const type = searchParams.get('type');
  const region = searchParams.get('region');
  const date = searchParams.get('date');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const size = parseInt(searchParams.get('size') || '10');
  const cursor = searchParams.get('cursor');

  let q = supabase
    .from('reviews')
    .select(
      '*, user:profiles(id, name, image), meeting:meetings(id, name, type, region, image, date_time)'
    )
    .eq('team_id', params.teamId);

  if (meetingId) q = q.eq('meeting_id', meetingId);
  if (userId) q = q.eq('user_id', userId);

  if (type || region || date) {
    let meetingQ = supabase.from('meetings').select('id').eq('team_id', params.teamId);
    if (type) meetingQ = meetingQ.eq('type', type);
    if (region) meetingQ = meetingQ.eq('region', region);
    if (date)
      meetingQ = meetingQ.gte('date_time', `${date}T00:00:00`).lte('date_time', `${date}T23:59:59`);
    const { data: meetings } = await meetingQ;
    const ids = (meetings || []).map((m) => m.id);
    if (ids.length) q = q.in('meeting_id', ids);
    else return NextResponse.json({ data: [], nextCursor: null, hasMore: false });
  }

  if (cursor) q = q.lt('id', cursor);
  const col = sortBy === 'createdAt' ? 'created_at' : sortBy === 'score' ? 'score' : 'created_at';
  const { data, error } = await q.order(col, { ascending: sortOrder === 'asc' }).limit(size + 1);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  const items = (data || []).slice(0, size);
  const hasMore = (data?.length ?? 0) > size;
  const nextCursor = hasMore && items.length ? String(items[items.length - 1]?.id) : null;
  return NextResponse.json(keysToCamel({ data: items, nextCursor, hasMore }));
}
