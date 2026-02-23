<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useLocale } from '@/composables/useLocale'
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

const renderedContent = computed(() => {
  if (!post.value) return ''
  const content = currentLocale.value === 'zh-TW'
    ? post.value.content_zh
    : post.value.content_en
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

        <!-- Content -->
        <div
          class="prose prose-invert max-w-none prose-headings:font-blueprint prose-headings:tracking-wide prose-a:text-bp-accent prose-code:font-mono prose-pre:border prose-pre:border-bp-border prose-pre:bg-bp-deep"
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
