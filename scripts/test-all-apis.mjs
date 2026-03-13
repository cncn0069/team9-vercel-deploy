/**
 * API 전체 테스트 스크립트
 * 실행: node scripts/test-all-apis.mjs
 * 
 * .env.local의 SUPABASE_URL, SUPABASE_ANON_KEY 설정 필요
 * dev 서버 실행 중이어야 함: npm run dev
 */

const BASE = 'http://127.0.0.1:3000/dallaem';
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'password123';
const testName = '테스트유저';

let accessToken = null;
let userId = null;
let meetingId = null;
let postId = null;
let reviewId = null;

function log(name, ok, msg = '') {
  const icon = ok ? '✓' : '✗';
  console.log(`${icon} ${name}` + (msg ? ` - ${msg}` : ''));
  return ok;
}

async function request(method, path, body = null, useAuth = false) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (useAuth && accessToken) opts.headers['Authorization'] = `Bearer ${accessToken}`;
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('\n=== API 테스트 시작 ===\n');

  // 1. Auth - Signup
  let r = await request('POST', '/auth/signup', {
    email: testEmail,
    password: testPassword,
    name: testName,
    companyName: '테스트회사',
  });
  const signupOk = r.status === 201;
  log('POST /auth/signup', signupOk, signupOk ? `user id: ${r.data?.id}` : r.data?.message);
  if (signupOk) userId = r.data?.id;

  // 2. Auth - Login
  r = await request('POST', '/auth/login', { email: testEmail, password: testPassword });
  const loginOk = r.status === 200 && r.data?.accessToken;
  log('POST /auth/login', loginOk, loginOk ? 'token 발급' : r.data?.message);
  if (loginOk) accessToken = r.data.accessToken;

  if (!accessToken) {
    console.log('\n로그인 실패로 인증 필요 테스트 중단. 기존 유저로 재시도...');
    r = await request('POST', '/auth/login', { email: 'test@example.com', password: 'password123' });
    if (r.status === 200 && r.data?.accessToken) {
      accessToken = r.data.accessToken;
      userId = r.data.user?.id;
      console.log('기존 유저 로그인 성공\n');
    } else {
      console.log('테스트 불가. 회원가입 후 로그인 필요.');
      return;
    }
  }

  // 3. Users - me GET
  r = await request('GET', '/users/me', null, true);
  log('GET /users/me', r.status === 200, r.data?.message);

  // 4. Users - me PATCH
  r = await request('PATCH', '/users/me', { name: '수정된이름' }, true);
  log('PATCH /users/me', r.status === 200, r.data?.message);

  // 5. Meeting Types - GET
  r = await request('GET', '/meeting-types');
  log('GET /meeting-types', r.status === 200, Array.isArray(r.data) ? `count: ${r.data.length}` : r.data?.message);

  // 6. Meeting Types - POST
  r = await request('POST', '/meeting-types', { name: '달램핏', description: '운동 모임' }, true);
  const mtOk = r.status === 201;
  log('POST /meeting-types', mtOk, r.data?.message);

  // 7. Meetings - POST (모임 생성)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const regEnd = new Date(futureDate);
  regEnd.setDate(regEnd.getDate() - 1);
  r = await request(
    'POST',
    '/meetings',
    {
      name: '테스트 모임',
      type: '달램핏',
      region: '서울 강남구',
      dateTime: futureDate.toISOString(),
      registrationEnd: regEnd.toISOString(),
      capacity: 10,
      description: 'API 테스트용 모임',
    },
    true
  );
  const meetingCreateOk = r.status === 201;
  log('POST /meetings', meetingCreateOk, r.data?.message);
  if (meetingCreateOk) meetingId = r.data?.id;

  // 8. Meetings - GET (목록)
  r = await request('GET', '/meetings');
  log('GET /meetings', r.status === 200, r.data?.data ? `count: ${r.data.data.length}` : r.data?.message);

  // 9. Meeting Detail - GET
  if (meetingId) {
    r = await request('GET', `/meetings/${meetingId}`);
    log('GET /meetings/{id}', r.status === 200, r.data?.message);
  }

  // 10. Meeting Join - POST (다른 유저 필요, 여기선 호스트라 이미 참여 중 - 스킵 or 409 예상)
  if (meetingId) {
    r = await request('POST', `/meetings/${meetingId}/join`, null, true);
    log('POST /meetings/{id}/join', r.status === 200 || r.status === 409, r.data?.message || r.data?.code);
  }

  // 11. Participants - GET
  if (meetingId) {
    r = await request('GET', `/meetings/${meetingId}/participants`);
    log('GET /meetings/{id}/participants', r.status === 200, r.data?.data ? `count: ${r.data.data.length}` : r.data?.message);
  }

  // 12. Favorites - POST
  if (meetingId) {
    r = await request('POST', `/meetings/${meetingId}/favorites`, null, true);
    log('POST /meetings/{id}/favorites', r.status === 201 || r.status === 409, r.data?.message || r.data?.code);
  }

  // 13. Favorites - GET
  r = await request('GET', '/favorites', null, true);
  log('GET /favorites', r.status === 200, r.data?.data ? `count: ${r.data.data.length}` : r.data?.message);

  // 14. Posts - POST
  r = await request(
    'POST',
    '/posts',
    { title: '테스트 게시글', content: 'API 테스트용 내용입니다.' },
    true
  );
  const postOk = r.status === 201;
  log('POST /posts', postOk, r.data?.message);
  if (postOk) postId = r.data?.id;

  // 15. Posts - GET
  r = await request('GET', '/posts');
  log('GET /posts', r.status === 200, r.data?.data ? `count: ${r.data.data.length}` : r.data?.message);

  // 16. Post Detail - GET
  if (postId) {
    r = await request('GET', `/posts/${postId}`);
    log('GET /posts/{id}', r.status === 200, r.data?.message);
  }

  // 17. Comment - POST
  if (postId) {
    r = await request('POST', `/posts/${postId}/comments`, { content: '테스트 댓글' }, true);
    log('POST /posts/{id}/comments', r.status === 201, r.data?.message);
  }

  // 18. Post Like - POST
  if (postId) {
    r = await request('POST', `/posts/${postId}/like`, null, true);
    log('POST /posts/{id}/like', r.status === 201 || r.status === 409, r.data?.message || r.data?.code);
  }

  // 19. Reviews - 모임 완료 후 작성 가능. date_time이 과거여야 함.
  // 새 모임 생성 (과거 날짜)
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 2);
  const pastRegEnd = new Date(pastDate);
  pastRegEnd.setDate(pastRegEnd.getDate() - 1);
  r = await request(
    'POST',
    '/meetings',
    {
      name: '지난 모임',
      type: '달램핏',
      region: '서울',
      dateTime: pastDate.toISOString(),
      registrationEnd: pastRegEnd.toISOString(),
      capacity: 10,
    },
    true
  );
  let pastMeetingId = r.data?.id;
  if (r.status === 201 && pastMeetingId) {
    r = await request(
      'POST',
      `/meetings/${pastMeetingId}/reviews`,
      { score: 5, comment: '좋았습니다!' },
      true
    );
    log('POST /meetings/{id}/reviews', r.status === 201, r.data?.message);
    if (r.status === 201) reviewId = r.data?.id;
  } else {
    log('POST /meetings (과거)', false, '모임 생성 실패 - 리뷰 테스트 스킵');
  }

  // 20. Reviews - GET
  r = await request('GET', '/reviews');
  log('GET /reviews', r.status === 200, r.data?.data ? `count: ${r.data.data.length}` : r.data?.message);

  // 21. Notifications - GET
  r = await request('GET', '/notifications', null, true);
  log('GET /notifications', r.status === 200, r.data?.data ? `count: ${r.data.data.length}` : r.data?.message);

  // 22. Logout
  r = await request('POST', '/auth/logout', { refreshToken: 'dummy' }, true);
  log('POST /auth/logout', r.status === 204, r.data?.message);

  console.log('\n=== 테스트 완료 ===\n');
}

runTests().catch((e) => {
  console.error('테스트 중 오류:', e.message);
  if (e.message?.includes('fetch')) {
    console.log('\ndev 서버가 실행 중인지 확인하세요: npm run dev');
  }
});
