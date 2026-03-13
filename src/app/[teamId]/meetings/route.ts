import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { keysToCamel } from '@/lib/api-utils';
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
  const size = Math.min(100, parseInt(searchParams.get('size') || '10') || 10);

  const sortCol =
    sortBy === 'participantCount'
      ? 'participant_count'
      : sortBy === 'registrationEnd'
        ? 'registration_end'
        : 'date_time';

  let query = supabase
    .from('meetings')
    .select('*, host:profiles!host_id(id, name, image)')
    .eq('team_id', params.teamId)
    .is('canceled_at', null);

  if (id) query = query.eq('id', id);
  if (type) query = query.eq('type', type);
  if (region) query = query.eq('region', region);
  if (date) query = query.gte('date_time', date).lte('date_time', `${date}T23:59:59.999Z`);
  if (createdBy) query = query.eq('created_by', createdBy);

  query = query.order(sortCol, { ascending: sortOrder === 'asc' });
  if (cursor) query = sortOrder === 'asc' ? query.gt('id', cursor) : query.lt('id', cursor);
  const { data, error } = await query.limit(size + 1);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });

  const items = (data || []).slice(0, size);
  const hasMore = (data?.length ?? 0) > size;
  const nextCursor = hasMore && items.length ? String(items[items.length - 1]?.id) : null;

  return NextResponse.json(
    keysToCamel({
      data: items,
      nextCursor,
      hasMore,
    })
  );
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

  return NextResponse.json(keysToCamel(data), { status: 201 });
}
