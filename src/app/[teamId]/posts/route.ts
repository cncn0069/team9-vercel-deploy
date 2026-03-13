import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles(id, name, image)')
    .eq('team_id', params.teamId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data, nextCursor: null, hasMore: false });
}

export async function POST(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const user = verifyToken(req.headers.get('Authorization')?.split(' ')[1] || '');
  if (!user) return NextResponse.json({ message: '인증 필요' }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from('posts')
    .insert({ ...body, team_id: params.teamId, author_id: user.id })
    .select('*, author:profiles(id, name, image)')
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
