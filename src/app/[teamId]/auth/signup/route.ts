import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const body = await req.json();
  const { email, password, name, companyName } = body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('profiles')
    .insert([
      { team_id: params.teamId, email, password: hashedPassword, name, company_name: companyName },
    ])
    .select()
    .single();

  if (error)
    return NextResponse.json(
      { code: 'CONFLICT', message: '이미 존재하는 이메일입니다.' },
      { status: 409 }
    );

  const { password: _, ...userWithoutPassword } = data;
  return NextResponse.json(userWithoutPassword, { status: 201 });
}
