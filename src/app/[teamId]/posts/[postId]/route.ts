import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  props: { params: Promise<{ teamId: string; postId: string }> }
) {
  const params = await props.params;
  const { data: post, error } = await supabase
    .from('posts')
    .select(
      '*, author:profiles(id, name, image, email), comments(*, author:profiles(id, name, image))'
    )
    .eq('team_id', params.teamId)
    .eq('id', params.postId)
    .single();

  if (error || !post)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' },
      { status: 404 }
    );

  await supabase
    .from('posts')
    .update({ view_count: (post.view_count ?? 0) + 1 })
    .eq('id', params.postId);

  let isLiked = false;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  if (token) {
    const user = verifyToken(token);
    if (user) {
      const { data: like } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', params.postId)
        .eq('user_id', user.id)
        .maybeSingle();
      isLiked = !!like;
    }
  }

  return NextResponse.json({ ...post, isLiked });
}

export async function PATCH(
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
    .select('author_id')
    .eq('id', params.postId)
    .eq('team_id', params.teamId)
    .single();

  if (!post)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' },
      { status: 404 }
    );
  if (post.author_id !== user.id)
    return NextResponse.json(
      { code: 'FORBIDDEN', message: '작성자만 수정할 수 있습니다.' },
      { status: 403 }
    );

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;
  if (body.image !== undefined) updates.image = body.image;

  if (Object.keys(updates).length === 0)
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '수정할 필드가 없습니다.' },
      { status: 400 }
    );

  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', params.postId)
    .eq('team_id', params.teamId)
    .select('*, author:profiles(id, name, image)')
    .single();

  if (error)
    return NextResponse.json({ code: 'BAD_REQUEST', message: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
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
    .select('author_id')
    .eq('id', params.postId)
    .eq('team_id', params.teamId)
    .single();

  if (!post)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' },
      { status: 404 }
    );
  if (post.author_id !== user.id)
    return NextResponse.json(
      { code: 'FORBIDDEN', message: '작성자만 삭제할 수 있습니다.' },
      { status: 403 }
    );

  await supabase.from('comments').delete().eq('post_id', params.postId);
  await supabase.from('post_likes').delete().eq('post_id', params.postId);
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', params.postId)
    .eq('team_id', params.teamId);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  return NextResponse.json({ message: '삭제 성공' });
}
