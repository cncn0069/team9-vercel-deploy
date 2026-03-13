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
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const size = Math.min(50, Math.max(1, parseInt(searchParams.get('size') || '10')));
  const cursor = searchParams.get('cursor');

  let query = supabase
    .from('reviews')
    .select('*, meeting:meetings(id, name, dateTime)')
    .eq('team_id', params.teamId)
    .eq('user_id', user.id)
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .limit(size + 1);

  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
      query = query.lt('id', decoded.id);
    } catch {
      return NextResponse.json(
        { code: 'BAD_REQUEST', message: '잘못된 커서입니다.' },
        { status: 400 }
      );
    }
  }

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ code: 'BAD_REQUEST', message: error.message }, { status: 400 });

  const hasMore = data.length > size;
  const items = hasMore ? data.slice(0, size) : data;
  const nextCursor =
    hasMore && items.length > 0
      ? Buffer.from(JSON.stringify({ id: items[items.length - 1].id })).toString('base64')
      : null;

  return NextResponse.json({
    data: items.map((r) => ({
      id: r.id,
      score: r.score,
      comment: r.comment,
      meetingId: r.meeting_id,
      meeting: r.meeting,
      createdAt: r.created_at,
    })),
    nextCursor,
    hasMore,
  });
}
