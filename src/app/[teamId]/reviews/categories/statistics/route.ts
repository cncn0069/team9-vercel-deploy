import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const { data: reviews, error: revErr } = await supabase
    .from('reviews')
    .select('meeting_id, score')
    .eq('team_id', params.teamId);

  if (revErr)
    return NextResponse.json({ code: 'INTERNAL', message: revErr.message }, { status: 500 });

  const meetingIds = [...new Set((reviews || []).map((r) => r.meeting_id))];
  if (meetingIds.length === 0) return NextResponse.json([]);

  const { data: meetings, error: meetErr } = await supabase
    .from('meetings')
    .select('id, type')
    .in('id', meetingIds);

  if (meetErr)
    return NextResponse.json({ code: 'INTERNAL', message: meetErr.message }, { status: 500 });

  const typeByMeeting = Object.fromEntries((meetings || []).map((m) => [m.id, m.type]));
  const byType: Record<string, { sum: number; count: number }> = {};

  for (const r of reviews || []) {
    const t = typeByMeeting[r.meeting_id] || 'unknown';
    if (!byType[t]) byType[t] = { sum: 0, count: 0 };
    byType[t].sum += r.score;
    byType[t].count += 1;
  }

  return NextResponse.json(
    Object.entries(byType).map(([type, { sum, count }]) => ({
      type,
      averageScore: Math.round((sum / count) * 10) / 10,
      totalReviews: count,
    }))
  );
}
