import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  props: { params: Promise<{ teamId: string; userId: string }> }
) {
  const params = await props.params;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, team_id, email, name, company_name, image')
    .eq('team_id', params.teamId)
    .eq('id', params.userId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '유저를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: data.id,
    teamId: data.team_id,
    email: data.email,
    name: data.name,
    companyName: data.company_name,
    image: data.image,
  });
}
