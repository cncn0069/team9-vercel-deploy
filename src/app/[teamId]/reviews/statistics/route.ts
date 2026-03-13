import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const { data, error } = await supabase
    .from('reviews')
    .select('score')
    .eq('team_id', params.teamId);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });

  const list = data || [];
  const one = list.filter((r) => r.score === 1).length;
  const two = list.filter((r) => r.score === 2).length;
  const three = list.filter((r) => r.score === 3).length;
  const four = list.filter((r) => r.score === 4).length;
  const five = list.filter((r) => r.score === 5).length;
  const total = list.length;
  const averageScore = total ? (one + two * 2 + three * 3 + four * 4 + five * 5) / total : 0;

  return NextResponse.json({
    averageScore: Math.round(averageScore * 10) / 10,
    totalReviews: total,
    oneStar: one,
    twoStars: two,
    threeStars: three,
    fourStars: four,
    fiveStars: five,
  });
}
