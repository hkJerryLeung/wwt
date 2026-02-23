-- Add slug and product_page (Overlord-style product page content) to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS product_page JSONB;

CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

COMMENT ON COLUMN projects.slug IS 'URL slug for /apps/:slug product page (e.g. super-sort)';
COMMENT ON COLUMN projects.product_page IS 'Overlord-style product page content: hero, valueProposition, features, testimonials, faq, pricing, underlings, specs';
