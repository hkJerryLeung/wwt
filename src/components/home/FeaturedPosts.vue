<script setup lang="ts">
import { onMounted } from 'vue'
import { usePostsStore } from '@/stores/posts'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useLocale } from '@/composables/useLocale'

const postsStore = usePostsStore()
const navStore = useFrontendNavStore()
const { t, localizedPath, localizedField } = useLocale()
const workshopPath = () => navStore.getPathByKey('workshop')

onMounted(() => {
  postsStore.fetchPosts()
})
</script>

<template>
  <section class="py-20 sm:py-28">
    <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
      <!-- Section header -->
      <div class="mb-12">
        <span class="bp-section-number mb-3 block">02.</span>
        <h2 class="font-blueprint text-3xl tracking-wide text-bp-white sm:text-4xl">
          {{ t('home.featured_title') }}
        </h2>
        <p class="mt-3 text-bp-subtle">{{ t('home.featured_subtitle') }}</p>
      </div>

      <!-- Loading state -->
      <div v-if="postsStore.isLoading" class="flex items-center justify-center py-16">
        <span class="font-blueprint text-sm text-bp-muted">{{ t('common.loading') }}</span>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="postsStore.posts.length === 0"
        class="border border-dashed border-bp-border p-12 text-center"
      >
        <p class="font-blueprint text-sm text-bp-muted">{{ t('common.no_results') }}</p>
        <p class="mt-2 text-xs text-bp-muted">Content will appear here once published via the CMS.</p>
      </div>

      <!-- Posts grid -->
      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <router-link
          v-for="post in postsStore.posts.slice(0, 6)"
          :key="post.id"
          :to="localizedPath(`${workshopPath()}/${post.slug}`.replace(/\/+/g, '/'))"
          class="bp-card group overflow-hidden"
        >
          <!-- Featured image -->
          <div
            v-if="post.featured_image"
            class="aspect-video w-full overflow-hidden bg-bp-surface"
          >
            <img
              :src="post.featured_image"
              :alt="localizedField(post.title_zh, post.title_en)"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div v-else class="aspect-video w-full bg-bp-surface bp-grid-bg-dense" />

          <!-- Content -->
          <div class="p-5">
            <!-- Premium badge -->
            <span
              v-if="post.is_premium"
              class="mb-2 inline-block border border-bp-warning px-2 py-0.5 font-blueprint text-[10px] text-bp-warning"
            >
              {{ t('workshop.premium_badge') }}
            </span>

            <!-- Tags -->
            <div v-if="post.tags?.length" class="mb-2 flex flex-wrap gap-1">
              <span
                v-for="tag in post.tags.slice(0, 3)"
                :key="tag"
                class="text-[10px] text-bp-muted"
              >
                #{{ tag }}
              </span>
            </div>

            <h3 class="mb-2 text-sm font-medium text-bp-white line-clamp-2">
              {{ localizedField(post.title_zh, post.title_en) }}
            </h3>

            <p class="text-xs leading-relaxed text-bp-muted line-clamp-2">
              {{ localizedField(post.excerpt_zh, post.excerpt_en) }}
            </p>
          </div>
        </router-link>
      </div>

      <!-- View all link -->
      <div class="mt-10 text-center">
        <router-link :to="localizedPath(workshopPath())" class="bp-btn-primary">
          {{ t('workshop.read_more') }}
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </router-link>
      </div>
    </div>
  </section>
</template>
