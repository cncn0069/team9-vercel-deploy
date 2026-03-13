import { supabase } from '@/lib/supabase';
import { keysToCamel } from '@/lib/api-utils';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  props: { params: Promise<{ teamId: string; meetingId: string }> }
) {
  const params = await props.params;
  const { searchParams } = new URL(req.url);
  const size = parseInt(searchParams.get('size') || '10');

  const { data: meeting } = await supabase
    .from('meetings')
    .select('id')
    .eq('id', params.meetingId)
    .eq('team_id', params.teamId)
    .single();

  if (!meeting)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '모임을 찾을 수 없습니다.' },
      { status: 404 }
    );

  const { data, error } = await supabase
    .from('participants')
    .select('id, team_id, meeting_id, user_id, joined_at, user:profiles(id, name, image)')
    .eq('meeting_id', params.meetingId)
    .eq('team_id', params.teamId)
    .limit(size);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });

  return NextResponse.json(
    keysToCamel({
      data: data || [],
      nextCursor: (data?.length ?? 0) >= size ? String((data?.at(-1) as any)?.id ?? '') : null,
      hasMore: (data?.length ?? 0) >= size,
    })
  );
}
