import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

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
    .select('id, like_count')
    .eq('id', params.postId)
    .eq('team_id', params.teamId)
    .single();

  if (!post)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' },
      { status: 404 }
    );

  const { data, error } = await supabase
    .from('post_likes')
    .insert({
      team_id: params.teamId,
      post_id: params.postId,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return NextResponse.json(
        { code: 'CONFLICT', message: '이미 좋아요했습니다.' },
        { status: 409 }
      );
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  }

  await supabase
    .from('posts')
    .update({ like_count: (post.like_count ?? 0) + 1 })
    .eq('id', params.postId);

  return NextResponse.json(data, { status: 201 });
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
    .select('id, like_count')
    .eq('id', params.postId)
    .eq('team_id', params.teamId)
    .single();

  if (!post)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' },
      { status: 404 }
    );

  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('team_id', params.teamId)
    .eq('post_id', params.postId)
    .eq('user_id', user.id);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });

  const newCount = Math.max(0, (post.like_count ?? 0) - 1);
  await supabase.from('posts').update({ like_count: newCount }).eq('id', params.postId);

  return NextResponse.json({ message: '좋아요 취소 성공' });
}
