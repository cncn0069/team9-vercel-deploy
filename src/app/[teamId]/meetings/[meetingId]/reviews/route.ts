import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  props: { params: Promise<{ teamId: string; meetingId: string }> }
) {
  const params = await props.params;
  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const size = parseInt(searchParams.get('size') || '10');
  const userId = searchParams.get('userId');

  let q = supabase
    .from('reviews')
    .select(
      '*, user:profiles(id, name, image), meeting:meetings(id, name, type, region, image, date_time)'
    )
    .eq('team_id', params.teamId)
    .eq('meeting_id', params.meetingId);

  if (userId) q = q.eq('user_id', userId);

  const { data, error } = await q
    .order(sortBy === 'createdAt' ? 'created_at' : sortBy, { ascending: sortOrder === 'asc' })
    .limit(size);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });

  return NextResponse.json({
    data: data || [],
    nextCursor: (data?.length ?? 0) >= size ? String((data?.at(-1) as any)?.id ?? '') : null,
    hasMore: (data?.length ?? 0) >= size,
  });
}

export async function POST(
  req: Request,
  props: { params: Promise<{ teamId: string; meetingId: string }> }
) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const { data: meeting } = await supabase
    .from('meetings')
    .select('id, canceled_at, date_time')
    .eq('id', params.meetingId)
    .eq('team_id', params.teamId)
    .single();

  if (!meeting)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '모임을 찾을 수 없습니다.' },
      { status: 404 }
    );
  if (meeting.canceled_at)
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '취소된 모임에는 리뷰를 작성할 수 없습니다.' },
      { status: 400 }
    );
  if (meeting.date_time && new Date(meeting.date_time) > new Date())
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '아직 종료되지 않은 모임입니다.' },
      { status: 400 }
    );

  const { data: participant } = await supabase
    .from('participants')
    .select('id')
    .eq('meeting_id', params.meetingId)
    .eq('user_id', user.id)
    .single();

  if (!participant)
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '참가자만 리뷰를 작성할 수 있습니다.' },
      { status: 400 }
    );

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('meeting_id', params.meetingId)
    .eq('user_id', user.id)
    .single();

  if (existing)
    return NextResponse.json(
      { code: 'CONFLICT', message: '이미 리뷰를 작성했습니다.' },
      { status: 409 }
    );

  const { score, comment } = await req.json();
  if (!score || !comment)
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'score와 comment는 필수입니다.' },
      { status: 400 }
    );
  if (score < 1 || score > 5)
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'score는 1~5 사이여야 합니다.' },
      { status: 400 }
    );

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      team_id: params.teamId,
      meeting_id: params.meetingId,
      user_id: user.id,
      score,
      comment,
    })
    .select(
      '*, user:profiles(id, name, image), meeting:meetings(id, name, type, region, image, date_time)'
    )
    .single();

  if (error)
    return NextResponse.json({ code: 'BAD_REQUEST', message: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
