import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function PUT(
  req: Request,
  props: { params: Promise<{ teamId: string; notificationId: string }> }
) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', params.notificationId)
    .eq('team_id', params.teamId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  if (!data)
    return NextResponse.json(
      { code: 'NOT_FOUND', message: '알림을 찾을 수 없습니다.' },
      { status: 404 }
    );

  return NextResponse.json(data);
}
