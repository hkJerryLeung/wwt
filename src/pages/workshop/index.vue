<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/plugins/supabase'
import { useLocale } from '@/composables/useLocale'
import { useAutoTranslate } from '@/composables/useAutoTranslate'
import ArticleActions from '@/components/common/ArticleActions.vue'
import { usePageHeading } from '@/composables/usePageHeading'
import type { SkillMainCategory, SkillSubCategory, SkillTopic, Post } from '@/types'

const route = useRoute()
const router = useRouter()
const { t, localizedField, currentLocale } = useLocale()
const { translatedContent, isTranslating, translate, isTiptapEmpty } = useAutoTranslate()
const { title: pageTitle, subtitle: pageSubtitle } = usePageHeading('workshop')

// ── Lazy-loaded tiptap extensions (only loaded when rendering a post) ──
let _extensions: any[] | null = null
let _generateHTML: typeof import('@tiptap/html').generateHTML | null = null
async function getTiptap() {
  if (_extensions && _generateHTML) return { extensions: _extensions, generateHTML: _generateHTML }
  const [tiptapHtml, starterKit, image, link, codeBlockLowlight, youtube, lowlightMod] = await Promise.all([
    import('@tiptap/html'),
    import('@tiptap/starter-kit'),
    import('@tiptap/extension-image'),
    import('@tiptap/extension-link'),
    import('@tiptap/extension-code-block-lowlight'),
    import('@tiptap/extension-youtube'),
    import('lowlight'),
  ])
  const lowlight = lowlightMod.createLowlight(lowlightMod.common)
  _extensions = [
    starterKit.default.configure({ codeBlock: false, link: false }),
    image.default,
    link.default.configure({ openOnClick: true }),
    codeBlockLowlight.default.configure({ lowlight }),
    youtube.default,
  ]
  _generateHTML = tiptapHtml.generateHTML
  return { extensions: _extensions, generateHTML: _generateHTML }
}

// ── Listing-only columns (no content_zh / content_en) ──
const POST_LIST_COLUMNS = 'id,title_zh,title_en,slug,excerpt_zh,excerpt_en,skill_topic_id,tags,featured_image,status,is_premium,is_recommended,published_at'

// Data
const mains = ref<SkillMainCategory[]>([])
const subs = ref<SkillSubCategory[]>([])
const topics = ref<SkillTopic[]>([])
const posts = ref<Post[]>([])
const isLoading = ref(true)
const isContentLoading = ref(false)

// State
const activeMainId = ref<string | null>(null)
const activeSubId = ref<string | null>(null)
const expandedTopicId = ref<string | null>(null)
const activePost = ref<Post | null>(null)

// Load data
onMounted(async () => {
  const [resMains, resSubs, resTopics, resPosts] = await Promise.all([
    supabase.from('skill_main_categories').select('*').order('sort_order'),
    supabase.from('skill_sub_categories').select('*').order('sort_order'),
    supabase.from('skill_topics').select('*').order('sort_order'),
    supabase.from('posts').select(POST_LIST_COLUMNS).eq('status', 'published').order('published_at', { ascending: false })
  ])
  
  if (resMains.data) mains.value = resMains.data
  if (resSubs.data) subs.value = resSubs.data
  if (resTopics.data) topics.value = resTopics.data
  if (resPosts.data) posts.value = resPosts.data as Post[]
  
  // URL routing priority
  const articleSlug = route.query.article as string | undefined
  if (articleSlug) {
    const targetPost = posts.value.find(p => p.slug === articleSlug)
    if (targetPost) {
      activePost.value = targetPost
      loadPostContent(targetPost)
      expandedTopicId.value = targetPost.skill_topic_id || null
      const topic = topics.value.find(t => t.id === targetPost?.skill_topic_id)
      if (topic) {
        activeSubId.value = topic.sub_id
        const sub = subs.value.find(s => s.id === topic.sub_id)
        if (sub) {
          activeMainId.value = sub.main_id
        }
      }
    }
  }

  // Fallback defaults if no URL
  const firstMain = mains.value[0]
  if (!activePost.value && firstMain) {
    const firstMainId = firstMain.id
    activeMainId.value = firstMainId
    const defaultSub = subs.value.find(s => s.main_id === firstMainId)
    if (defaultSub) activeSubId.value = defaultSub.id
    // Auto-open recommended post for default main category
    await autoOpenRecommended(firstMainId)
  }
  
  isLoading.value = false
})

// Current display logic
const currentSubs = computed(() => {
  if (!activeMainId.value) return []
  return subs.value.filter(s => s.main_id === activeMainId.value)
})

const currentTopics = computed(() => {
  if (!activeSubId.value) return []
  return topics.value.filter(t => t.sub_id === activeSubId.value)
})

function getPostsForTopic(topicId: string) {
  // We want to sort them by date or sort order. Here we rely on published_at descending just as a default
  return posts.value.filter(p => p.skill_topic_id === topicId)
}

async function selectMain(id: string) {
  activeMainId.value = id
  const matchingSubs = subs.value.filter(s => s.main_id === id)
  const firstSub = matchingSubs[0]
  if (firstSub) {
    activeSubId.value = firstSub.id
  } else {
    activeSubId.value = null
  }
  activePost.value = null
  expandedTopicId.value = null
  // Auto-open recommended post for this main category
  await autoOpenRecommended(id)
}

/**
 * Find and auto-open the recommended post for a given main category.
 */
async function autoOpenRecommended(mainId: string) {
  const recommended = posts.value.find(p => {
    if (!p.is_recommended || !p.skill_topic_id) return false
    const topic = topics.value.find(t => t.id === p.skill_topic_id)
    if (!topic) return false
    const sub = subs.value.find(s => s.id === topic.sub_id)
    return sub?.main_id === mainId
  })
  if (recommended) {
    activePost.value = recommended
    await loadPostContent(recommended)
    expandedTopicId.value = recommended.skill_topic_id || null
    // Also set the correct sub category
    const topic = topics.value.find(t => t.id === recommended.skill_topic_id)
    if (topic) {
      activeSubId.value = topic.sub_id
    }
  }
}

function selectSub(id: string) {
  activeSubId.value = id
  activePost.value = null
  expandedTopicId.value = null
}

function toggleTopic(id: string) {
  expandedTopicId.value = expandedTopicId.value === id ? null : id
}

async function selectPost(post: Post) {
  activePost.value = post
  router.push({ query: { ...route.query, article: post.slug } })
  await loadPostContent(post)
}

// ── On-demand content loader ──
async function loadPostContent(post: Post) {
  // Skip if content already loaded
  if (post.content_zh !== undefined && post.content_zh !== null) return
  isContentLoading.value = true
  try {
    const { data } = await supabase
      .from('posts')
      .select('content_zh, content_en')
      .eq('id', post.id)
      .single()
    if (data) {
      post.content_zh = data.content_zh
      post.content_en = data.content_en
    }
  } finally {
    isContentLoading.value = false
  }
}

// Watch URL changes for history navigation (back/forward keys)
watch(() => route.query.article, (newSlug) => {
  if (!newSlug) {
    activePost.value = null
    return
  }
  if (activePost.value?.slug !== newSlug) {
    const targetPost = posts.value.find(p => p.slug === newSlug)
    if (targetPost) {
      activePost.value = targetPost
      loadPostContent(targetPost)
      expandedTopicId.value = targetPost.skill_topic_id || null
      const topic = topics.value.find(t => t.id === targetPost?.skill_topic_id)
      if (topic) {
        activeSubId.value = topic.sub_id
        const sub = subs.value.find(s => s.id === topic.sub_id)
        if (sub) {
          activeMainId.value = sub.main_id
        }
      }
    }
  }
})

// Auto-translate when English content is empty
const isAutoTranslated = computed(() => {
  if (!activePost.value || currentLocale.value === 'zh-TW') return false
  return isTiptapEmpty(activePost.value.content_en)
})

watch(
  () => [activePost.value?.id, currentLocale.value],
  () => {
    if (activePost.value && currentLocale.value !== 'zh-TW' && isTiptapEmpty(activePost.value.content_en)) {
      translate(activePost.value.id, activePost.value.content_zh)
    }
  },
  { immediate: true }
)

// ── Rendered HTML (async because tiptap is lazy-loaded) ──
const renderedHtml = ref('')

watch(
  () => [activePost.value?.id, currentLocale.value, translatedContent.value, isContentLoading.value],
  async () => {
    if (!activePost.value) { renderedHtml.value = ''; return }
    // Wait for content to be loaded
    if (activePost.value.content_zh === undefined || activePost.value.content_zh === null) {
      if (isContentLoading.value) return // still loading
    }

    let content: Record<string, unknown> | null = null
    if (currentLocale.value === 'zh-TW') {
      content = activePost.value.content_zh
    } else if (!isTiptapEmpty(activePost.value.content_en)) {
      content = activePost.value.content_en
    } else if (translatedContent.value) {
      content = translatedContent.value
    } else {
      content = activePost.value.content_zh
    }

    if (!content) { renderedHtml.value = '<p>No content available.</p>'; return }
    try {
      const { generateHTML, extensions } = await getTiptap()
      renderedHtml.value = generateHTML(content as any, extensions)
    } catch {
      renderedHtml.value = '<p>Content rendering error.</p>'
    }
  },
  { immediate: true }
)

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const imageOverrides: Record<string, string> = {
  'obsidian-skills': '/images/post-obsidian-skills.png',
  'jackie-zhang-portfolio': '/images/post-portfolio-design.png',
  'sss': '/images/post-tofu-dishes.png',
  'asdasdasda': '/images/post-premium-content.png',
}

const activePostImage = computed(() => {
  if (!activePost.value) return null
  const slug = activePost.value.slug
  if (slug && imageOverrides[slug]) return imageOverrides[slug]
  return activePost.value.featured_image
})

/** Apple-style menu: icon per main category by slug (Logic / Code / Motion) */
const MAIN_ICONS: Record<string, string> = {
  logic: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />',
  code: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />',
  motion: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
}
const DEFAULT_MAIN_ICON = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />'

function getMainIcon(main: SkillMainCategory): string {
  const slug = main.slug?.toLowerCase() ?? ''
  const bySlug = MAIN_ICONS[slug]
  if (bySlug) return bySlug
  const en = (main.title_en ?? '').toLowerCase()
  const zh = main.title_zh ?? ''
  if (slug.includes('logic') || en.includes('logic') || zh.includes('邏輯')) return MAIN_ICONS.logic ?? DEFAULT_MAIN_ICON
  if (slug.includes('code') || en.includes('code') || zh.includes('程式')) return MAIN_ICONS.code ?? DEFAULT_MAIN_ICON
  if (slug.includes('motion') || en.includes('motion') || zh.includes('動態')) return MAIN_ICONS.motion ?? DEFAULT_MAIN_ICON
  return DEFAULT_MAIN_ICON
}
</script>

<template>
  <div class="py-16 sm:py-24">
    <div class="mx-auto max-w-[1800px] px-4 sm:px-6">
      
      <!-- Top Title（標題與簡介跟隨後台選單管理） -->
      <div class="mb-10 block">
        <h1 class="font-blueprint text-4xl tracking-wide text-bp-white">
          {{ pageTitle }}
        </h1>
        <p v-if="pageSubtitle" class="mt-2 text-sm text-bp-subtle">{{ pageSubtitle }}</p>
      </div>

      <!-- Main Categories (Top Tab Menu) – Apple style: icon on top, text below -->
      <div class="mb-6 border-b border-bp-border pb-1 flex justify-center gap-8 overflow-x-auto">
        <button
          v-for="main in mains"
          :key="main.id"
          type="button"
          @click="selectMain(main.id)"
          class="flex flex-col items-center gap-2 pb-3 pt-1 transition-colors whitespace-nowrap font-blueprint min-w-[4.5rem]"
          :class="activeMainId === main.id ? 'text-bp-accent border-b-2 border-bp-accent' : 'text-bp-muted hover:text-bp-white'"
        >
          <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center [&_svg]:h-6 [&_svg]:w-6" aria-hidden="true">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="getMainIcon(main)" />
          </span>
          <span class="text-sm">{{ localizedField(main.title_zh, main.title_en) }}</span>
        </button>
      </div>

      <!-- Sub Categories (Row below Top Menu) -->
      <div v-if="currentSubs.length > 0" class="mb-8 flex flex-wrap gap-3">
        <button
          v-for="sub in currentSubs"
          :key="sub.id"
          @click="selectSub(sub.id)"
          class="border px-4 py-1.5 text-sm transition-colors rounded-full"
          :class="activeSubId === sub.id
            ? 'border-bp-accent bg-bp-accent/10 text-bp-accent'
            : 'border-bp-border text-bp-muted hover:border-bp-border-strong hover:text-bp-subtle'"
        >
          {{ localizedField(sub.title_zh, sub.title_en) }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="py-16 text-center">
        <span class="font-blueprint text-sm text-bp-muted">{{ t('common.loading') }}</span>
      </div>

      <!-- Main Split View Layout -->
      <div v-else class="flex flex-col lg:flex-row gap-8">
        
        <!-- Left Sidebar: Topics and Article Links -->
        <div class="lg:w-72 lg:flex-shrink-0 border-r-0 lg:border-r border-bp-border pr-0 lg:pr-6 space-y-4">
          <div v-if="currentTopics.length === 0" class="text-xs text-bp-muted">
            {{ t('common.no_results') }}
          </div>
          
          <div v-for="(topic, index) in currentTopics" :key="topic.id" class="bp-card overflow-hidden">
            <button
              @click="toggleTopic(topic.id)"
              class="w-full flex items-center justify-between p-4 bg-bp-surface hover:bg-bp-surface-bright transition-colors text-left"
            >
              <div class="flex items-center gap-3">
                <span class="font-blueprint text-bp-accent">{{ index + 1 }}.</span>
                <span class="font-medium text-sm text-bp-white">{{ localizedField(topic.title_zh, topic.title_en) }}</span>
              </div>
              <span class="text-bp-muted text-xs">
                {{ expandedTopicId === topic.id ? '−' : '＋' }}
              </span>
            </button>
            
            <div v-show="expandedTopicId === topic.id" class="p-2 bg-bp-deep space-y-1">
              <template v-if="getPostsForTopic(topic.id).length > 0">
                <button
                  v-for="post in getPostsForTopic(topic.id)"
                  :key="post.id"
                  @click="selectPost(post)"
                  class="w-full text-left px-4 py-2 text-xs transition-colors border-l-2"
                  :class="activePost?.id === post.id ? 'border-bp-accent text-bp-white bg-bp-primary' : 'border-transparent text-bp-muted hover:text-bp-white hover:bg-bp-primary/50'"
                >
                  <div class="line-clamp-2">{{ localizedField(post.title_zh, post.title_en) }}</div>
                  <div v-if="post.is_premium" class="mt-1 text-[10px] text-bp-warning border border-bp-warning/50 inline-block px-1 rounded-sm">Premium</div>
                </button>
              </template>
              <div v-else class="px-4 py-3 text-xs text-bp-muted italic">
                {{ t('common.no_results') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Right Content Pane -->
        <div class="lg:flex-1 min-h-[500px]">
          <div v-if="!activePost" class="h-full flex items-center justify-center p-16">
            <p class="font-blueprint text-bp-muted text-sm tracking-widest uppercase">
              Select an article to view here
            </p>
          </div>
          
          <article v-else class="p-6 sm:p-10">
            <!-- Header -->
            <header class="relative mb-10">
              <div class="mb-4 flex items-center gap-3">
                <span
                  v-if="activePost.is_premium"
                  class="border border-bp-warning px-2 py-0.5 font-blueprint text-xs text-bp-warning"
                >
                  {{ t('workshop.premium_badge') }}
                </span>
                <span class="text-sm text-bp-muted">
                  {{ t('workshop.published') }} {{ formatDate(activePost.published_at) }}
                </span>
              </div>

              <!-- Article actions (top-right) -->
              <ArticleActions
                :title="localizedField(activePost.title_zh, activePost.title_en)"
                class="absolute right-0 top-0"
              />

              <h1 class="pr-36 font-blueprint text-3xl leading-tight tracking-wide text-bp-white sm:text-4xl">
                {{ localizedField(activePost.title_zh, activePost.title_en) }}
              </h1>

              <div v-if="activePost.tags?.length" class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="tag in activePost.tags"
                  :key="tag"
                  class="border border-bp-border px-2 py-0.5 text-xs text-bp-muted"
                >
                  {{ tag }}
                </span>
              </div>
            </header>

            <!-- Featured image -->
            <div
              v-if="activePostImage"
              class="mb-10 aspect-video overflow-hidden border border-bp-border"
            >
              <img
                :src="activePostImage"
                :alt="localizedField(activePost.title_zh, activePost.title_en)"
                class="h-full w-full object-cover"
              />
            </div>

            <!-- Auto-translate indicator -->
            <div v-if="isTranslating" class="mb-4 flex items-center gap-2 text-xs text-bp-muted">
              <span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-bp-accent border-t-transparent"></span>
              Translating…
            </div>
            <div v-else-if="isAutoTranslated && translatedContent" class="mb-4 text-xs text-bp-muted border border-bp-border/50 inline-block px-2 py-0.5 rounded">
              🌐 Auto-translated
            </div>

            <!-- Content loading -->
            <div v-if="isContentLoading" class="py-10 text-center">
              <span class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-bp-accent border-t-transparent"></span>
              <span class="ml-2 text-sm text-bp-muted">{{ t('common.loading') }}</span>
            </div>

            <!-- Content -->
            <div
              v-else
              class="article-content"
              v-html="renderedHtml"
            />
          </article>
        </div>
        
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar hiding for tabs */
::-webkit-scrollbar {
  height: 4px;
}
::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}
</style>
