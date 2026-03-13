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
  const type = searchParams.get('type');
  const region = searchParams.get('region');
  const date = searchParams.get('date');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const size = Math.min(100, parseInt(searchParams.get('size') || '10') || 10);

  let q = supabase
    .from('favorites')
    .select('*, meeting:meetings(*, host:profiles!host_id(id, name, image))')
    .eq('team_id', params.teamId)
    .eq('user_id', user.id);

  const { data, error } = await q
    .order('created_at', { ascending: sortOrder === 'asc' })
    .limit(size);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });
  return NextResponse.json({
    data: data || [],
    nextCursor: null,
    hasMore: (data?.length ?? 0) >= size,
  });
}
