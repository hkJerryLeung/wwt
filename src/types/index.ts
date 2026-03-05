export interface Post {
  id: string
  title_zh: string
  title_en: string
  slug: string
  content_zh: Record<string, unknown> | null
  content_en: Record<string, unknown> | null
  excerpt_zh: string
  excerpt_en: string
  skill_topic_id: string | null
  tags: string[]
  featured_image: string | null
  status: 'draft' | 'published' | 'scheduled'
  is_premium: boolean
  is_recommended: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name_zh: string
  name_en: string
  slug: string
  sort_order: number
}

export interface SkillMainCategory {
  id: string
  title_zh: string
  title_en: string
  slug: string
  sort_order: number
}

export interface SkillSubCategory {
  id: string
  main_id: string
  title_zh: string
  title_en: string
  slug: string
  sort_order: number
}

export interface SkillTopic {
  id: string
  sub_id: string
  title_zh: string
  title_en: string
  slug: string
  sort_order: number
}

export interface Work {
  id: string
  title_zh: string
  title_en: string
  description_zh: string
  description_en: string
  category: 'ad' | 'brand' | 'event' | 'other'
  video_url: string | null
  thumbnail: string | null
  client: string
  tags: string[]
  sort_order: number
  created_at: string
}

/** Overlord-style product page content (editable from admin) */
export interface ProductPageContent {
  hero?: {
    title?: string
    subtitle?: string
    price?: string
    buyUrl?: string
    renewUrl?: string
    whatsNewUrl?: string
    learnMoreUrl?: string
    docsUrl?: string
    downloadUrl?: string
    buyLabel?: string
    learnMoreLabel?: string
    docsLabel?: string
    downloadLabel?: string
    mediaUrl?: string
    mediaType?: 'image' | 'video'
  }
  valueProposition?: {
    main?: string
    sub?: string | Record<string, unknown>
    emotion?: string
  }
  features?: Array<{
    title?: string
    description?: string | Record<string, unknown>
    bullets?: string[]
    imageUrl?: string
    visible?: boolean
  }>
  whatsNew?: Array<{
    title?: string
    description?: string
    ctaText?: string
    ctaUrl?: string
    visible?: boolean
  }>
  testimonials?: Array<{
    name?: string
    url?: string
    role?: string
    quote?: string
    visible?: boolean
  }>
  pricing?: {
    title?: string
    subtitle?: string
    body?: string | Record<string, unknown>
    licenseNote?: string
    renewUrl?: string
    roadmapUrl?: string
    price?: string
    buyUrl?: string
    highlights?: Array<{
      text?: string
      visible?: boolean
    }>
  }
  faq?: Array<{
    category?: 'Creative' | 'Technical' | 'License'
    question?: string
    answer?: string | Record<string, unknown>
    visible?: boolean
  }>
  underlings?: Array<{
    name?: string
    description?: string
    learnMoreUrl?: string
    visible?: boolean
  }>
  specs?: Array<{
    label?: string
    value?: string
    visible?: boolean
  }>
  docs?: {
    categories?: Array<{
      id?: string
      title?: string
      visible?: boolean
      pages?: Array<{
        id?: string
        title?: string
        visible?: boolean
        steps?: Array<{
          id?: string
          title?: string
          content?: string | Record<string, unknown>
        }>
      }>
    }>
  }
}

export interface Project {
  id: string
  name: string
  slug?: string | null
  description_zh: string
  description_en: string
  url: string | null
  screenshot: string | null
  tech_stack: string[]
  sort_order: number
  product_page?: ProductPageContent | null
  created_at: string
}

export interface MediaItem {
  id: string
  url: string
  filename: string
  type: string
  size: number
  created_at: string
}

export type Locale = 'zh-TW' | 'en'

export interface NavItem {
  key: string
  path: string
  labelKey: string
}
