import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const { searchParams } = new URL(req.url);
  const listType = searchParams.get('type') || 'all';
  const keyword = searchParams.get('keyword');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const cursor = searchParams.get('cursor');
  const size = Math.min(100, parseInt(searchParams.get('size') || '10') || 10);

  let query = supabase
    .from('posts')
    .select('*, author:profiles(id, name, image)', { count: 'exact' })
    .eq('team_id', params.teamId);

  if (listType === 'best') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query = query.gte('created_at', thirtyDaysAgo.toISOString());
  }

  if (keyword?.trim()) {
    query = query.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);
  }

  const sortCol =
    sortBy === 'viewCount'
      ? 'view_count'
      : sortBy === 'likeCount'
        ? 'like_count'
        : 'created_at';
  query = query.order(sortCol, { ascending: sortOrder === 'asc' });

  if (cursor) query = sortOrder === 'asc' ? query.gt('id', cursor) : query.lt('id', cursor);
  const { data, error } = await query.limit(size + 1);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });

  const items = (data || []).slice(0, size);
  const hasMore = (data?.length ?? 0) > size;
  const nextCursor = hasMore && items.length ? String(items[items.length - 1]?.id) : null;

  const postIds = items.map((p) => p.id);
  const { data: counts } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds);
  const countByPost: Record<number, number> = {};
  for (const c of counts || []) {
    countByPost[c.post_id] = (countByPost[c.post_id] || 0) + 1;
  }

  const dataWithCount = items.map((p) => ({
    ...p,
    _count: { comments: countByPost[p.id] ?? 0 },
  }));

  return NextResponse.json({
    data: dataWithCount,
    nextCursor,
    hasMore,
  });
}

export async function POST(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const user = verifyToken(req.headers.get('Authorization')?.split(' ')[1] || '');
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const body = await req.json();
  const { title, content, image } = body;
  if (!title?.trim() || !content?.trim())
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'title과 content는 필수입니다.' },
      { status: 400 }
    );

  const { data, error } = await supabase
    .from('posts')
    .insert({
      team_id: params.teamId,
      author_id: user.id,
      title: title.trim(),
      content: content.trim(),
      image: image?.trim() || null,
      view_count: 0,
      like_count: 0,
    })
    .select('*, author:profiles(id, name, image)')
    .single();

  if (error)
    return NextResponse.json(
      { code: 'INTERNAL', message: error.message },
      { status: 400 }
    );
  return NextResponse.json(data, { status: 201 });
}
