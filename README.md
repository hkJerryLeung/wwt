# WWT

AI-Powered Creative Workshop. A bilingual (Chinese/English) website for sharing AI Coding, AI video production tips, and professional filmmaking experience.

## Tech Stack

- **Frontend:** Vue 3 + TypeScript + Vite + Tailwind CSS v4
- **UI:** Element Plus + Headless UI
- **State:** Pinia
- **Router:** Vue Router 4
- **i18n:** vue-i18n 11
- **Editor:** TipTap (Notion-like block editor)
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **SEO:** @unhead/vue

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

Run the SQL migration in your Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
```

Also create a storage bucket named `media` with public access in Supabase Dashboard.

### 4. Start development server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

## Project Structure

```
src/
  components/     # Reusable components
    common/       # Buttons, Cards, Language Switch
    layout/       # Navbar, Footer
    editor/       # TipTap editor components
    home/         # Home page sections
  composables/    # Vue composables (useLocale, useSeo)
  i18n/           # Translation files (zh-TW, en)
  layouts/        # Default + Admin layouts
  pages/          # Route pages
    admin/        # CMS admin pages
    workshop/     # AI Workshop articles
    lab/          # Projects/Apps showcase
    showcase/     # Video works portfolio
    premium/      # Premium membership page
  plugins/        # Supabase, i18n setup
  router/         # Vue Router config
  stores/         # Pinia stores
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

## Design

Blueprint S35 style — technical, architectural aesthetic with:
- Dark blueprint-blue backgrounds
- White line decorations and grid patterns
- Sharp geometric edges (no border radius)
- Architects Daughter font for headings
- Drawing/writing path animations
