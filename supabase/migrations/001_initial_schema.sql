-- ============================================
-- WWT Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Categories table
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default categories
INSERT INTO categories (name_zh, name_en, slug, sort_order) VALUES
  ('AI Coding', 'AI Coding', 'ai-coding', 1),
  ('AI 影片製作', 'AI Video Production', 'ai-video', 2),
  ('工具推薦', 'Tool Picks', 'tools', 3),
  ('影視作品', 'Film & Video', 'film-video', 4);

-- ============================================
-- Posts table
-- ============================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_zh TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  slug TEXT UNIQUE NOT NULL,
  content_zh JSONB,
  content_en JSONB,
  excerpt_zh TEXT DEFAULT '',
  excerpt_en TEXT DEFAULT '',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  featured_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  is_premium BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_published ON posts(published_at DESC);

-- ============================================
-- Works table
-- ============================================
CREATE TABLE works (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_zh TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  description_zh TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('ad', 'brand', 'event', 'other')),
  video_url TEXT,
  thumbnail TEXT,
  client TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Projects table
-- ============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT '',
  description_zh TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  url TEXT,
  screenshot TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Media table
-- ============================================
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  type TEXT DEFAULT '',
  size INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Public read access for published posts
CREATE POLICY "Public can read published posts"
  ON posts FOR SELECT
  USING (status = 'published');

-- Authenticated users can do everything with posts
CREATE POLICY "Auth users full access to posts"
  ON posts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public read access for categories
CREATE POLICY "Public can read categories"
  ON categories FOR SELECT
  USING (true);

-- Authenticated users can manage categories
CREATE POLICY "Auth users full access to categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public read access for works
CREATE POLICY "Public can read works"
  ON works FOR SELECT
  USING (true);

-- Authenticated users can manage works
CREATE POLICY "Auth users full access to works"
  ON works FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public read access for projects
CREATE POLICY "Public can read projects"
  ON projects FOR SELECT
  USING (true);

-- Authenticated users can manage projects
CREATE POLICY "Auth users full access to projects"
  ON projects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can access media
CREATE POLICY "Auth users full access to media"
  ON media FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Storage bucket for media uploads
-- ============================================
-- Run this in Supabase dashboard or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
-- 
-- Storage policy for public read:
-- CREATE POLICY "Public read media" ON storage.objects
--   FOR SELECT USING (bucket_id = 'media');
--
-- Storage policy for authenticated upload:
-- CREATE POLICY "Auth upload media" ON storage.objects
--   FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
--
-- Storage policy for authenticated delete:
-- CREATE POLICY "Auth delete media" ON storage.objects
--   FOR DELETE TO authenticated USING (bucket_id = 'media');
