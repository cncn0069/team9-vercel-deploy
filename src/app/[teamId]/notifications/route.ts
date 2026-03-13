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
  const isRead = searchParams.get('isRead');
  const cursor = searchParams.get('cursor');
  const size = Math.min(100, parseInt(searchParams.get('size') || '10') || 10);

  let q = supabase
    .from('notifications')
    .select('*')
    .eq('team_id', params.teamId)
    .eq('user_id', user.id);

  if (isRead === 'true') q = q.eq('is_read', true);
  else if (isRead === 'false') q = q.eq('is_read', false);

  if (cursor) q = q.lt('id', cursor);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(size + 1);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  const items = (data || []).slice(0, size);
  const hasMore = (data?.length ?? 0) > size;
  const nextCursor = hasMore && items.length ? String(items[items.length - 1]?.id) : null;
  return NextResponse.json(keysToCamel({ data: items, nextCursor, hasMore }));
}

export async function DELETE(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const { count, error } = await supabase
    .from('notifications')
    .delete({ count: 'exact' })
    .eq('team_id', params.teamId)
    .eq('user_id', user.id);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  return NextResponse.json({ count: count ?? 0 });
}
