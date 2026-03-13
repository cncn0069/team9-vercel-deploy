import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const { count, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('team_id', params.teamId)
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  const { count: updatedCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', params.teamId)
    .eq('user_id', user.id)
    .eq('is_read', false);

  const { data: updated } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('team_id', params.teamId)
    .eq('user_id', user.id)
    .eq('is_read', false)
    .select('id');

  return NextResponse.json({ count: updated?.length ?? 0 });
}
