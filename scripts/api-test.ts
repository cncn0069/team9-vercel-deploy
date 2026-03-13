/**
 * API 통합 테스트 - Supabase에 시드 데이터 삽입 후 API 호출 검증
 * 사용: npx tsx scripts/api-test.ts  (또는 npm run test:api)
 * .env.local에 SUPABASE_URL, SUPABASE_ANON_KEY 등 설정 필요
 */
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { existsSync,readFileSync } from 'fs';
import { resolve } from 'path';

// .env.local 로드
function loadEnv() {
  const paths = ['.env.local', '.env'];
  for (const p of paths) {
    const full = resolve(process.cwd(), p);
    if (existsSync(full)) {
      const content = readFileSync(full, 'utf-8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const m = trimmed.match(/^([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
      }
      console.log(`Loaded env from ${p}`);
      return;
    }
  }
  console.warn('No .env.local or .env found');
}

loadEnv();

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEAM_ID = process.env.TEST_TEAM_ID || 'team9';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';
if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Supabase 설정 필요. .env.local에 다음 중 하나를 설정하세요:\n' +
      '  NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_URL\n' +
      '  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 또는 SUPABASE_ANON_KEY'
  );
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

type TestResult = { name: string; ok: boolean; detail?: string };
const results: TestResult[] = [];

function ok(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}`);
}
function fail(name: string, detail?: string) {
  results.push({ name, ok: false, detail });
  console.log(`  ✗ ${name}${detail ? `: ${detail}` : ''}`);
}

async function api(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<Response> {
  const url = `${BASE}/${TEAM_ID}/${path}`.replace(/\/+/g, '/');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  return fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function main() {
  console.log('\n=== API 테스트 (Supabase 시드 + API 검증) ===\n');
  console.log(`BASE: ${BASE}, TEAM_ID: ${TEAM_ID}\n`);

  if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_URL 필요');
    process.exit(1);
  }

  // 1. Supabase 시드 데이터
  console.log('1. Supabase 시드 데이터 삽입...');
  const testEmail = `api-test-${Date.now()}@test.com`;
  const testPassword = 'testpass123';
  const hashed = await bcrypt.hash(testPassword, 10);

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .insert({
      team_id: TEAM_ID,
      email: testEmail,
      password: hashed,
      name: 'API테스트유저',
      company_name: '테스트회사',
    })
    .select('id')
    .single();

  if (profErr || !profile) {
    fail('profiles insert', profErr?.message || 'no data');
  } else {
    ok('profiles insert', `id=${profile.id}`);
  }

  const userId = profile?.id;
  if (!userId) {
    console.error('유저 생성 실패 - 테스트 중단');
    process.exit(1);
  }

  // meeting_types (insert or select existing)
  let mtDb = await supabase
    .from('meeting_types')
    .insert({ team_id: TEAM_ID, name: '테스트모임타입', description: 'API 테스트용' })
    .select('id')
    .single();
  if (mtDb.error?.code === '23505') {
    mtDb = await supabase
      .from('meeting_types')
      .select('id')
      .eq('team_id', TEAM_ID)
      .eq('name', '테스트모임타입')
      .single();
  }
  if (mtDb.error && mtDb.error.code !== '23505') fail('meeting_types', mtDb.error.message);
  else ok('meeting_types');

  // 2. API 테스트 - 로그인
  console.log('\n2. Auth API...');
  const loginRes = await api('POST', 'auth/login', { email: testEmail, password: testPassword });
  const loginJson = await loginRes.json();
  if (!loginRes.ok) {
    fail('POST auth/login', JSON.stringify(loginJson));
  } else if (!loginJson.accessToken) {
    fail('POST auth/login', 'accessToken 없음');
  } else {
    ok('POST auth/login');
  }
  const token = loginJson.accessToken;

  // 3. 회원가입 (이메일 중복)
  const signupRes = await api('POST', 'auth/signup', {
    email: testEmail,
    password: 'otherpass',
    name: 'Dup',
    companyName: 'Dup',
  });
  if (signupRes.status === 409) ok('POST auth/signup (중복 시 409)');
  else if (!signupRes.ok) fail('POST auth/signup', `expected 409 got ${signupRes.status}`);

  // 4. Meeting Types (인증 불필요)
  const mtApiRes = await api('GET', 'meeting-types');
  const mtList = await mtApiRes.json();
  if (!mtApiRes.ok) fail('GET meeting-types', mtApiRes.statusText);
  else if (Array.isArray(mtList)) ok('GET meeting-types');
  else fail('GET meeting-types', 'array 아님');

  // 5. Meetings
  const meetRes = await api('GET', 'meetings?size=5');
  const meetData = await meetRes.json();
  if (!meetRes.ok) fail('GET meetings', meetRes.statusText);
  else if (meetData?.data !== undefined) ok('GET meetings');

  const postMeetRes = await api(
    'POST',
    'meetings',
    {
      name: 'API테스트 모임',
      type: '테스트모임타입',
      region: '서울',
      address: '서울시 테스트',
      dateTime: new Date(Date.now() + 86400000).toISOString(),
      registrationEnd: new Date(Date.now() + 43200000).toISOString(),
      capacity: 10,
      description: '테스트',
    },
    token
  );
  const postMeet = await postMeetRes.json();
  if (!postMeetRes.ok) {
    fail('POST meetings', postMeet?.message || postMeetRes.statusText);
  } else {
    ok('POST meetings', `id=${postMeet?.id || postMeet?.id}`);
  }
  const meetingId = postMeet?.id;

  // 5b. 지난 모임 생성 (리뷰 작성용 - date_time 과거 필수)
  const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1시간 전
  const pastMeetRes = await api(
    'POST',
    'meetings',
    {
      name: 'API테스트 지난모임',
      type: '테스트모임타입',
      region: '서울',
      address: '과거 모임 주소',
      dateTime: pastDate,
      registrationEnd: pastDate,
      capacity: 5,
      description: '리뷰 테스트용',
    },
    token
  );
  const pastMeet = await pastMeetRes.json();
  const pastMeetingId = pastMeetRes.ok ? pastMeet?.id : null;

  // 6. Posts
  const postRes = await api('GET', 'posts?size=5');
  const postList = await postRes.json();
  if (!postRes.ok) fail('GET posts', postRes.statusText);
  else if (postList?.data !== undefined) ok('GET posts');

  const createPostRes = await api(
    'POST',
    'posts',
    { title: 'API 테스트 게시글', content: '테스트 본문입니다.' },
    token
  );
  const createdPost = await createPostRes.json();
  if (!createPostRes.ok) fail('POST posts', createdPost?.message || createPostRes.statusText);
  else ok('POST posts', `id=${createdPost?.id}`);
  const postId = createdPost?.id;

  // 7. Comments (post 있으면)
  if (postId) {
    const comRes = await api('POST', `posts/${postId}/comments`, { content: '테스트 댓글' }, token);
    if (!comRes.ok) {
      const j = await comRes.json();
      fail('POST comments', j?.message || comRes.statusText);
    } else ok('POST comments');
  }

  // 8. Reviews (지난 모임에만 작성 가능)
  if (pastMeetingId) {
    const revRes = await api(
      'POST',
      `meetings/${pastMeetingId}/reviews`,
      { score: 5, comment: '훌륭한 모임이었어요!' },
      token
    );
    if (!revRes.ok) {
      const j = await revRes.json();
      fail('POST reviews', j?.message || revRes.statusText);
    } else ok('POST reviews');
  }

  // 9. Favorites
  if (meetingId) {
    const favRes = await api('POST', `meetings/${meetingId}/favorites`, {}, token);
    if (!favRes.ok) {
      const j = await favRes.json();
      fail('POST favorites', j?.message || favRes.statusText);
    } else ok('POST favorites');
  }

  const favListRes = await api('GET', 'favorites', undefined, token);
  const favList = await favListRes.json();
  if (!favListRes.ok) fail('GET favorites', favListRes.statusText);
  else if (favList?.data !== undefined) ok('GET favorites');

  // 10. Users/me
  const meRes = await api('GET', 'users/me', undefined, token);
  if (!meRes.ok) fail('GET users/me', meRes.statusText);
  else ok('GET users/me');

  // 11. Reviews list
  const revListRes = await api('GET', 'reviews?size=5');
  if (!revListRes.ok) fail('GET reviews', revListRes.statusText);
  else ok('GET reviews');

  // 12. Notifications
  const notifRes = await api('GET', 'notifications', undefined, token);
  if (!notifRes.ok) fail('GET notifications', notifRes.statusText);
  else ok('GET notifications');

  // 13. OpenAPI spec
  const openApiRes = await fetch(`${BASE}/api/openapi`);
  if (!openApiRes.ok) fail('GET /api/openapi', openApiRes.statusText);
  else {
    const spec = await openApiRes.json();
    if (spec?.openapi) ok('GET /api/openapi');
    else fail('GET /api/openapi', 'openapi 필드 없음');
  }

  // 정리
  console.log('\n=== 결과 ===');
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log(`${passed}/${results.length} 통과`);
  if (failed.length) {
    console.log('\n실패한 테스트:');
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail || ''}`));
    process.exit(1);
  }
  console.log('\n모든 API 테스트 통과\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
