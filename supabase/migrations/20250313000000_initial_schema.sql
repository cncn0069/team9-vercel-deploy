-- 같은 달램 API - 초기 스키마
-- Supabase Dashboard > SQL Editor에서 실행하거나, Supabase CLI로: supabase db push

-- 1. profiles (유저)
CREATE TABLE IF NOT EXISTS profiles (
  id BIGSERIAL PRIMARY KEY,
  team_id TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT,
  name TEXT NOT NULL,
  company_name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, email)
);

CREATE INDEX IF NOT EXISTS idx_profiles_team_email ON profiles(team_id, email);

-- 2. meeting_types (모임 종류)
CREATE TABLE IF NOT EXISTS meeting_types (
  id BIGSERIAL PRIMARY KEY,
  team_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, name)
);

-- 3. meetings (모임)
CREATE TABLE IF NOT EXISTS meetings (
  id BIGSERIAL PRIMARY KEY,
  team_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  region TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  date_time TIMESTAMPTZ,
  registration_end TIMESTAMPTZ,
  capacity INTEGER NOT NULL DEFAULT 10,
  participant_count INTEGER DEFAULT 0,
  image TEXT,
  description TEXT,
  canceled_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  host_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_by BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_team ON meetings(team_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date_time);
CREATE INDEX IF NOT EXISTS idx_meetings_canceled ON meetings(canceled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_host ON meetings(host_id);

-- 4. participants (모임 참가자)
CREATE TABLE IF NOT EXISTS participants (
  id BIGSERIAL PRIMARY KEY,
  team_id TEXT NOT NULL,
  meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_meeting ON participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON participants(user_id);

-- participant_count 업데이트 트리거
CREATE OR REPLACE FUNCTION update_meeting_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE meetings SET participant_count = participant_count + 1 WHERE id = NEW.meeting_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE meetings SET participant_count = GREATEST(0, participant_count - 1) WHERE id = OLD.meeting_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_participant_count ON participants;
CREATE TRIGGER trg_participant_count
  AFTER INSERT OR DELETE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_meeting_participant_count();

-- 5. reviews (모임 리뷰)
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  team_id TEXT NOT NULL,
  meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_meeting ON reviews(meeting_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_team ON reviews(team_id);

-- 6. favorites (찜)
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  team_id TEXT NOT NULL,
  meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- 7. posts (게시글)
CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  team_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  author_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_team ON posts(team_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);

-- 8. comments (댓글)
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  team_id TEXT NOT NULL,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);

-- 9. post_likes (좋아요)
CREATE TABLE IF NOT EXISTS post_likes (
  id BIGSERIAL PRIMARY KEY,
  team_id TEXT NOT NULL,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

-- like_count 업데이트 트리거
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_like_count ON post_likes;
CREATE TRIGGER trg_post_like_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- 10. notifications (알림)
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  team_id TEXT NOT NULL,
  user_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- RLS 정책: API가 자체 JWT 인증을 사용하므로 anon 키로 접근 허용
-- 프로덕션에서는 필요에 따라 보다 엄격한 정책으로 교체
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_all" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "meeting_types_all" ON meeting_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "meetings_all" ON meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "participants_all" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "reviews_all" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "favorites_all" ON favorites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "posts_all" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "comments_all" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "post_likes_all" ON post_likes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "notifications_all" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- 11. Storage bucket (이미지 업로드)
-- Supabase Dashboard > Storage에서 'images' 버킷 생성도 가능
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
