<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useLocale } from '@/composables/useLocale'
import { useAutoTranslate } from '@/composables/useAutoTranslate'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Youtube from '@tiptap/extension-youtube'
import { common, createLowlight } from 'lowlight'

const route = useRoute()
const postsStore = usePostsStore()
const navStore = useFrontendNavStore()
const { t, localizedPath, localizedField, currentLocale } = useLocale()
const { translatedContent, isTranslating, translate, isTiptapEmpty } = useAutoTranslate()
const workshopPath = () => navStore.getPathByKey('workshop')

const lowlight = createLowlight(common)
const extensions = [
  StarterKit.configure({ codeBlock: false, link: false }),
  Image,
  Link.configure({ openOnClick: true }),
  CodeBlockLowlight.configure({ lowlight }),
  Youtube,
]

onMounted(() => {
  const slug = route.params.slug as string
  postsStore.fetchPostBySlug(slug)
})

const post = computed(() => postsStore.currentPost)

// Auto-translate when English content is empty
const isAutoTranslated = computed(() => {
  if (!post.value || currentLocale.value === 'zh-TW') return false
  return isTiptapEmpty(post.value.content_en)
})

watch(
  () => [post.value?.id, currentLocale.value],
  () => {
    if (post.value && currentLocale.value !== 'zh-TW' && isTiptapEmpty(post.value.content_en)) {
      translate(post.value.id, post.value.content_zh)
    }
  },
  { immediate: true }
)

const renderedContent = computed(() => {
  if (!post.value) return ''

  let content: Record<string, unknown> | null = null
  if (currentLocale.value === 'zh-TW') {
    content = post.value.content_zh
  } else if (!isTiptapEmpty(post.value.content_en)) {
    content = post.value.content_en
  } else if (translatedContent.value) {
    content = translatedContent.value
  } else {
    // Fallback: show Chinese while translating
    content = post.value.content_zh
  }

  if (!content) return '<p>No content available.</p>'
  try {
    return generateHTML(content as Parameters<typeof generateHTML>[0], extensions)
  } catch {
    return '<p>Content rendering error.</p>'
  }
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="py-24 sm:py-32">
    <div class="mx-auto max-w-[800px] px-4 sm:px-6">
      <!-- Loading -->
      <div v-if="postsStore.isLoading" class="py-16 text-center">
        <span class="font-blueprint text-sm text-bp-muted">{{ t('common.loading') }}</span>
      </div>

      <!-- Article -->
      <article v-else-if="post">
        <!-- Back -->
        <router-link
          :to="localizedPath(workshopPath())"
          class="mb-8 inline-flex items-center gap-2 text-sm text-bp-muted transition-colors hover:text-bp-accent"
        >
          ← {{ t('workshop.back') }}
        </router-link>

        <!-- Header -->
        <header class="mb-10">
          <div class="mb-4 flex items-center gap-3">
            <span
              v-if="post.is_premium"
              class="border border-bp-warning px-2 py-0.5 font-blueprint text-xs text-bp-warning"
            >
              {{ t('workshop.premium_badge') }}
            </span>
            <span class="text-sm text-bp-muted">
              {{ t('workshop.published') }} {{ formatDate(post.published_at) }}
            </span>
          </div>

          <h1 class="font-blueprint text-3xl leading-tight tracking-wide text-bp-white sm:text-4xl">
            {{ localizedField(post.title_zh, post.title_en) }}
          </h1>

          <div v-if="post.tags?.length" class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="border border-bp-border px-2 py-0.5 text-xs text-bp-muted"
            >
              {{ tag }}
            </span>
          </div>
        </header>

        <!-- Featured image -->
        <div
          v-if="post.featured_image"
          class="mb-10 aspect-video overflow-hidden border border-bp-border"
        >
          <img
            :src="post.featured_image"
            :alt="localizedField(post.title_zh, post.title_en)"
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

        <!-- Content -->
        <div
          class="article-content"
          v-html="renderedContent"
        />

        <!-- Divider -->
        <div class="mt-16 bp-dashed-top pt-8">
          <router-link
            :to="localizedPath(workshopPath())"
            class="bp-btn-primary"
          >
            ← {{ t('workshop.back') }}
          </router-link>
        </div>
      </article>

      <!-- Not found -->
      <div v-else class="py-16 text-center">
        <p class="font-blueprint text-sm text-bp-muted">{{ t('common.no_results') }}</p>
      </div>
    </div>
  </div>
</template>
