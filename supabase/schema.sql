-- ============================================================
-- DevBlog — Supabase Schema (Standalone)
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Shared trigger ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── User profiles (auto-created on sign-up) ─────────────────
-- NOTE: table named "profiles" to match lib/db.ts queries
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  display_name    TEXT,
  avatar_url      TEXT,
  bio             TEXT DEFAULT '',
  website         TEXT DEFAULT '',
  github_username TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_profiles_github ON profiles(github_username);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url, github_username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_name', split_part(NEW.email, '@', 1)),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'user_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'user_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Blog posts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id           UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  slug         TEXT    NOT NULL,
  content_md   TEXT    NOT NULL DEFAULT '',
  excerpt      TEXT    DEFAULT '',
  cover_url    TEXT,
  tags         TEXT[]  DEFAULT '{}',
  published    BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  views        INTEGER NOT NULL DEFAULT 0,
  read_time    INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_blog_posts_user      ON blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags      ON blog_posts USING gin(tags);

-- ── Post likes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_post_likes (
  post_id    UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_likes_post ON blog_post_likes(post_id);

-- ── Comments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_blog_comments_updated_at
  BEFORE UPDATE ON blog_comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user ON blog_comments(user_id);

-- ── Bookmarks ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_bookmarks (
  post_id    UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_bookmarks_user ON blog_bookmarks(user_id, created_at DESC);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_bookmarks  ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, owner write
CREATE POLICY "profiles_public_read"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_owner_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_owner_delete" ON profiles FOR DELETE USING (auth.uid() = id);

-- Posts: public read if published OR owner; owner full CRUD
CREATE POLICY "blog_posts_select"       ON blog_posts FOR SELECT
  USING (published = TRUE OR auth.uid() = user_id);
CREATE POLICY "blog_posts_owner_insert" ON blog_posts FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "blog_posts_owner_update" ON blog_posts FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "blog_posts_owner_delete" ON blog_posts FOR DELETE  USING (auth.uid() = user_id);

-- Likes: public read, authenticated owner write
CREATE POLICY "blog_likes_public_read"  ON blog_post_likes FOR SELECT USING (true);
CREATE POLICY "blog_likes_owner_insert" ON blog_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "blog_likes_owner_delete" ON blog_post_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments: readable on public posts (or owner's drafts); owner edits own
CREATE POLICY "blog_comments_select" ON blog_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE id = post_id AND (published = TRUE OR user_id = auth.uid())
    )
  );
CREATE POLICY "blog_comments_owner_insert" ON blog_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "blog_comments_owner_update" ON blog_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "blog_comments_owner_delete" ON blog_comments FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks: owner only
CREATE POLICY "blog_bookmarks_owner" ON blog_bookmarks FOR ALL USING (auth.uid() = user_id);

-- ── Helper functions ─────────────────────────────────────────
-- Increment view counter (safe to call from client — only hits published posts)
CREATE OR REPLACE FUNCTION increment_post_views(p_post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts SET views = views + 1
  WHERE id = p_post_id AND published = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
