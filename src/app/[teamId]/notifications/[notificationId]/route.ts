import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function DELETE(
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

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', params.notificationId)
    .eq('team_id', params.teamId)
    .eq('user_id', user.id);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });

  return NextResponse.json({ message: '삭제 성공' });
}
