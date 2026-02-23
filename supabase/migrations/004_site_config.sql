-- ============================================
-- Site config (e.g. frontend nav) for permanent admin settings
-- ============================================

CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can read site config (needed for nav on frontend)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_config' AND policyname = 'Public can read site_config'
  ) THEN
    CREATE POLICY "Public can read site_config"
      ON site_config FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Only authenticated users can update (admin)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_config' AND policyname = 'Auth users can manage site_config'
  ) THEN
    CREATE POLICY "Auth users can manage site_config"
      ON site_config FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

