# WWT

AI-Powered Creative Workshop. A bilingual (Chinese/English) website for sharing AI Coding, AI video production tips, and professional filmmaking experience.

## Tech Stack

- **Frontend:** Vue 3 + TypeScript + Vite + Tailwind CSS v4
- **UI:** Element Plus + Headless UI
- **State:** Pinia
- **Router:** Vue Router 4 (i18n `/:locale` prefix)
- **i18n:** vue-i18n 11
- **Editor:** TipTap (Notion-like block editor)
- **Animation:** GSAP + ScrollReveal
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Auth:** Supabase Auth (Email/password + Google OAuth)
- **SEO:** @unhead/vue
- **Utilities:** @vueuse/core, marked
- **Testing:** Vitest + @vue/test-utils + happy-dom + @vitest/coverage-v8
- **Deploy:** Vercel

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

### 3. Set up database

Run the SQL migrations in order in your Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql          # posts, categories, works, projects, media + RLS
supabase/migrations/002_storage_media.sql            # Storage bucket
supabase/migrations/003_skills_categories.sql        # 3-tier skill categories
supabase/migrations/004_site_config.sql              # site_config key-value table
supabase/migrations/005_projects_slug_product_page.sql  # projects slug + product_page
```

Also create a storage bucket named `media` with public access in Supabase Dashboard.

### 4. Start development server

```bash
npm run dev
```

### 5. Run tests

```bash
npm test
```

### 6. Build for production

```bash
npm run build
```

## Project Structure

```
src/
  components/
    admin/        # PostEditor
    common/       # ArticleActions, LanguageSwitch
    editor/       # TipTap editor (TiptapEditor, SlashCommandMenu, ResizableImageView)
    home/         # CohesionHero, CategoryCards, FeaturedPosts, MotionWorks,
                  # ExclusivePrograms, StatsBar, CtaSection, HeroSection
    layout/       # TheNavbar, TheFooter
  composables/    # useLocale, useSeo, useAutoTranslate, usePageHeading,
                  # useScrollReveal, useStripe
  i18n/           # Translation files (zh-TW, en)
  layouts/        # Default + Admin layouts
  pages/
    admin/        # CMS — dashboard, appearance, homepage, menu, skills,
                  #        works, projects, media, settings, login
    apps/         # App product page ([slug].vue) + redirect
    auth/         # login, register, callback (Google OAuth)
    workshop/     # Article list + detail ([slug].vue)
    lab/          # Projects showcase
    showcase/     # Video works portfolio
    premium/      # Premium membership
  plugins/        # Supabase, i18n setup
  router/         # Vue Router config (dynamic nav routes, auth guard)
  stores/         # Pinia stores — auth, posts, works, projects,
                  #   appearance, frontendNav, homepageSettings, siteSettings
  styles/         # Tailwind + Blueprint theme
  types/          # TypeScript interfaces
```

## Admin CMS

Access the admin panel at `/admin/login`. Features:

- Notion-like TipTap editor with slash commands
- Bilingual content editing (Chinese + English side by side)
- Image upload to Supabase Storage
- Post, Works, and Project CRUD management
- Media library management
- Navigation menu management (drag-to-sort, parent menu support)
- Appearance theming (accent color, logo, grid style)
- Homepage content editor (Hero, Categories, CTA)
- Site settings (title, description)
- 3-tier skill category management

## Authentication

- Email + password registration and login
- Google OAuth login
- Admin role via `profiles.is_admin`
- Route guard protecting `/admin` routes

## Design

Blueprint S35 style — technical, architectural aesthetic with:
- Dark blueprint-blue backgrounds
- White line decorations and grid patterns
- Sharp geometric edges (no border radius)
- Architects Daughter font for headings
- GSAP drawing/writing path animations
- ScrollReveal entrance effects
