import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const FOLDERS = ['meetings', 'users', 'posts'] as const;

export async function POST(req: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  const user = token ? verifyToken(token) : null;
  if (!user)
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      { status: 401 }
    );

  const body = await req.json();
  const { fileName, contentType, folder = 'meetings' } = body;

  if (!fileName || typeof fileName !== 'string')
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'fileName은 필수입니다.' },
      { status: 400 }
    );
  if (!ALLOWED_TYPES.includes(contentType))
    return NextResponse.json(
      { code: 'INVALID_FILE_TYPE', message: '지원하지 않는 파일 형식입니다.' },
      { status: 400 }
    );
  if (!FOLDERS.includes(folder))
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'folder는 meetings, users, posts 중 하나여야 합니다.' },
      { status: 400 }
    );

  const ext = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
  const path = `${params.teamId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const bucket = supabase.storage.from('images');
  const { data: signed, error } = await bucket.createSignedUploadUrl(path);

  if (error)
    return NextResponse.json({ code: 'INTERNAL', message: error.message }, { status: 500 });

  const { data: urlData } = bucket.getPublicUrl(path);
  return NextResponse.json({
    presignedUrl: signed?.signedUrl ?? urlData.publicUrl,
    publicUrl: urlData.publicUrl,
  });
}
