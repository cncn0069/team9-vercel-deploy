import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  props: { params: Promise<{ teamId: string; reviewId: string }> }
) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const { data: review } = await supabase
    .from('reviews')
    .select('user_id')
    .eq('id', params.reviewId)
    .eq('team_id', params.teamId)
    .single();

  if (!review)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '리뷰를 찾을 수 없습니다.' },
      { status: 404 }
    );
  if (review.user_id !== user.id)
    return NextResponse.json(
      { code: 'FORBIDDEN', message: '본인 리뷰만 수정할 수 있습니다.' },
      { status: 403 }
    );

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.score !== undefined) {
    if (body.score < 1 || body.score > 5)
      return NextResponse.json(
        { code: 'BAD_REQUEST', message: 'score는 1~5 사이여야 합니다.' },
        { status: 400 }
      );
    updates.score = body.score;
  }
  if (body.comment !== undefined) updates.comment = body.comment;

  if (Object.keys(updates).length === 0)
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '수정할 필드가 없습니다.' },
      { status: 400 }
    );

  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', params.reviewId)
    .eq('team_id', params.teamId)
    .select(
      '*, user:profiles(id, name, image), meeting:meetings(id, name, type, region, image, date_time)'
    )
    .single();

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ teamId: string; reviewId: string }> }
) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const { data: review } = await supabase
    .from('reviews')
    .select('user_id')
    .eq('id', params.reviewId)
    .eq('team_id', params.teamId)
    .single();

  if (!review)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '리뷰를 찾을 수 없습니다.' },
      { status: 404 }
    );
  if (review.user_id !== user.id)
    return NextResponse.json(
      { code: 'FORBIDDEN', message: '본인 리뷰만 삭제할 수 있습니다.' },
      { status: 403 }
    );

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', params.reviewId)
    .eq('team_id', params.teamId);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  return NextResponse.json({ message: '삭제 성공' });
}
