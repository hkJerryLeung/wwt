-- ============================================
-- 3-Tier Skill Categories Schema
-- ============================================

-- ============================================
-- Skill Main Categories (e.g., Logic, Code, Motion)
-- ============================================
CREATE TABLE skill_main_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default main categories
INSERT INTO skill_main_categories (title_zh, title_en, slug, sort_order) VALUES
  ('邏輯 (Logic)', 'Logic', 'logic', 1),
  ('程式碼 (Code)', 'Code', 'code', 2),
  ('動態 (Motion)', 'Motion', 'motion', 3);

-- ============================================
-- Skill Sub Categories (e.g., Gemini, ChatGPT)
-- ============================================
CREATE TABLE skill_sub_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  main_id UUID REFERENCES skill_main_categories(id) ON DELETE CASCADE,
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Skill Topics (e.g., Fundamentals, Advanced)
-- ============================================
CREATE TABLE skill_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_id UUID REFERENCES skill_sub_categories(id) ON DELETE CASCADE,
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Update Posts Table
-- ============================================
ALTER TABLE posts ADD COLUMN skill_topic_id UUID REFERENCES skill_topics(id) ON DELETE SET NULL;
CREATE INDEX idx_posts_skill_topic ON posts(skill_topic_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE skill_main_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_topics ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read skill main categories" ON skill_main_categories FOR SELECT USING (true);
CREATE POLICY "Public can read skill sub categories" ON skill_sub_categories FOR SELECT USING (true);
CREATE POLICY "Public can read skill topics" ON skill_topics FOR SELECT USING (true);

-- Authenticated users full access
CREATE POLICY "Auth users full access to skill main categories" ON skill_main_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users full access to skill sub categories" ON skill_sub_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users full access to skill topics" ON skill_topics FOR ALL TO authenticated USING (true) WITH CHECK (true);
