import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get('sortBy') || 'dateTime';
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const size = parseInt(searchParams.get('size') || '10');

  const { data, error } = await supabase
    .from('meetings')
    .select('*, host:profiles!host_id(id, name, image)')
    .eq('team_id', params.teamId)
    .eq('host_id', user.id)
    .is('canceled_at', null)
    .order(sortBy === 'dateTime' ? 'date_time' : sortBy, { ascending: sortOrder === 'asc' })
    .limit(size);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });

  return NextResponse.json({
    data: data || [],
    nextCursor: (data?.length ?? 0) >= size ? String((data?.at(-1) as any)?.id ?? '') : null,
    hasMore: (data?.length ?? 0) >= size,
  });
}
