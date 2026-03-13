import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const region = searchParams.get('region');
  const date = searchParams.get('date');
  const id = searchParams.get('id');
  const createdBy = searchParams.get('createdBy');
  const sortBy = searchParams.get('sortBy') || 'dateTime';
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const cursor = searchParams.get('cursor');
  const size = parseInt(searchParams.get('size') || '10');

  let query = supabase
    .from('meetings')
    .select('*, host:profiles!host_id(id, name, image)', { count: 'exact' })
    .eq('team_id', params.teamId)
    .is('canceled_at', null);

  if (id) query = query.eq('id', id);
  if (type) query = query.eq('type', type);
  if (region) query = query.eq('region', region);
  if (date) query = query.gte('date_time', date).lt('date_time', `${date}T23:59:59.999Z`);
  if (createdBy) query = query.eq('created_by', createdBy);

  query = query.order(sortBy === 'dateTime' ? 'date_time' : sortBy, {
    ascending: sortOrder === 'asc',
  });
  const { data, error } = await query.range(0, size - 1);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });

  return NextResponse.json({
    data: data || [],
    nextCursor: (data?.length ?? 0) >= size ? String((data?.at(-1) as any)?.id ?? '') : null,
    hasMore: (data?.length ?? 0) >= size,
  });
}

export async function POST(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const decoded = token ? verifyToken(token) : null;
  if (!decoded)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const body = await req.json();
  const insert = {
    team_id: params.teamId,
    host_id: decoded.id,
    created_by: decoded.id,
    name: body.name,
    type: body.type,
    region: body.region,
    address: body.address ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    date_time: body.dateTime ?? body.date_time ?? null,
    registration_end: body.registrationEnd ?? body.registration_end ?? null,
    capacity: body.capacity ?? 10,
    image: body.image ?? null,
    description: body.description ?? null,
  };

  const { data, error } = await supabase
    .from('meetings')
    .insert(insert)
    .select('*, host:profiles!host_id(id, name, image)')
    .single();

  if (error)
    return NextResponse.json({ code: 'BAD_REQUEST', message: error.message }, { status: 400 });

  await supabase
    .from('participants')
    .insert({ team_id: params.teamId, meeting_id: data.id, user_id: decoded.id });

  return NextResponse.json(data, { status: 201 });
}
