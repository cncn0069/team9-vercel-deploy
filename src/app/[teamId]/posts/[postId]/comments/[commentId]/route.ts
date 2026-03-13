import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  props: { params: Promise<{ teamId: string; postId: string; commentId: string }> }
) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const { data: comment } = await supabase
    .from('comments')
    .select('author_id')
    .eq('id', params.commentId)
    .eq('post_id', params.postId)
    .eq('team_id', params.teamId)
    .single();

  if (!comment)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '댓글을 찾을 수 없습니다.' },
      { status: 404 }
    );
  if (comment.author_id !== user.id)
    return NextResponse.json(
      { code: 'FORBIDDEN', message: '작성자만 수정할 수 있습니다.' },
      { status: 403 }
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
    .update({ content })
    .eq('id', params.commentId)
    .select('*, author:profiles(id, name, image)')
    .single();

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ teamId: string; postId: string; commentId: string }> }
) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const { data: comment } = await supabase
    .from('comments')
    .select('author_id')
    .eq('id', params.commentId)
    .eq('post_id', params.postId)
    .eq('team_id', params.teamId)
    .single();

  if (!comment)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '댓글을 찾을 수 없습니다.' },
      { status: 404 }
    );
  if (comment.author_id !== user.id)
    return NextResponse.json(
      { code: 'FORBIDDEN', message: '작성자만 삭제할 수 있습니다.' },
      { status: 403 }
    );

  const { error } = await supabase.from('comments').delete().eq('id', params.commentId);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  return NextResponse.json({ message: '삭제 성공' });
}
