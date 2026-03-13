import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  props: { params: Promise<{ teamId: string; postId: string }> }
) {
  const params = await props.params;
  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const size = parseInt(searchParams.get('size') || '10');
  const cursor = searchParams.get('cursor');

  let q = supabase
    .from('comments')
    .select('*, author:profiles(id, name, image)')
    .eq('team_id', params.teamId)
    .eq('post_id', params.postId);

  if (cursor) q = q.lt('id', cursor);
  const col = sortBy === 'createdAt' ? 'created_at' : 'created_at';
  const { data, error } = await q.order(col, { ascending: sortOrder === 'asc' }).limit(size + 1);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });

  const items = (data || []).slice(0, size);
  const hasMore = (data?.length ?? 0) > size;
  const nextCursor = hasMore && items.length ? String(items[items.length - 1]?.id) : null;
  return NextResponse.json({ data: items, nextCursor, hasMore });
}

export async function POST(
  req: Request,
  props: { params: Promise<{ teamId: string; postId: string }> }
) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id')
    .eq('id', params.postId)
    .eq('team_id', params.teamId)
    .single();

  if (!post)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' },
      { status: 404 }
    );

  const body = await req.json();
  const content = body.content?.trim();
  if (!content)
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'content는 필수입니다.' },
      { status: 400 }
    );

  const { data, error } = await supabase
    .from('comments')
    .insert({
      team_id: params.teamId,
      post_id: params.postId,
      author_id: user.id,
      content,
    })
    .select('*, author:profiles(id, name, image)')
    .single();

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });

  if (post.author_id !== user.id) {
    await supabase.from('notifications').insert({
      team_id: params.teamId,
      user_id: post.author_id,
      type: 'COMMENT',
      message: '새 댓글이 달렸습니다.',
      data: { postId: parseInt(params.postId), postTitle: null, commentId: data.id },
    });
  }

  return NextResponse.json(data, { status: 201 });
}
