<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWorksStore } from '@/stores/works'
import { useLocale } from '@/composables/useLocale'
import { usePageHeading } from '@/composables/usePageHeading'

const worksStore = useWorksStore()
const { t, localizedField } = useLocale()
const { title, subtitle } = usePageHeading('showcase')
const activeFilter = ref<string | null>(null)
const selectedWork = ref<string | null>(null)

const filters = [
  { key: 'all', value: null },
  { key: 'ad', value: 'ad' },
  { key: 'brand', value: 'brand' },
  { key: 'event', value: 'event' },
]

onMounted(() => {
  worksStore.fetchWorks()
})

const filteredWorks = computed(() => {
  if (!activeFilter.value) return worksStore.works
  return worksStore.works.filter(w => w.category === activeFilter.value)
})

function setFilter(value: string | null) {
  activeFilter.value = value
}

function openVideo(workId: string) {
  selectedWork.value = selectedWork.value === workId ? null : workId
}

function getFilterLabel(key: string): string {
  if (key === 'all') return t('showcase.filter_all')
  return t(`showcase.filter_${key}`)
}
</script>

<template>
  <div class="py-24 sm:py-32">
    <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
      <!-- Header（標題與簡介跟隨後台選單管理） -->
      <div class="mb-12">
        <h1 class="font-blueprint text-4xl tracking-wide text-bp-white sm:text-5xl">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="mt-3 text-bp-subtle">{{ subtitle }}</p>
      </div>

      <!-- Filters -->
      <div class="mb-10 flex flex-wrap gap-2">
        <button
          v-for="filter in filters"
          :key="filter.key"
          class="border px-4 py-1.5 text-sm transition-colors"
          :class="activeFilter === filter.value
            ? 'border-bp-accent text-bp-accent'
            : 'border-bp-border text-bp-muted hover:border-bp-border-strong hover:text-bp-subtle'"
          @click="setFilter(filter.value)"
        >
          {{ getFilterLabel(filter.key) }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="worksStore.isLoading" class="py-16 text-center">
        <span class="font-blueprint text-sm text-bp-muted">{{ t('common.loading') }}</span>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="filteredWorks.length === 0"
        class="border border-dashed border-bp-border p-16 text-center"
      >
        <p class="font-blueprint text-sm text-bp-muted">{{ t('common.no_results') }}</p>
      </div>

      <!-- Works grid -->
      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="work in filteredWorks"
          :key="work.id"
          class="bp-card group cursor-pointer overflow-hidden"
          @click="openVideo(work.id)"
        >
          <!-- Thumbnail -->
          <div class="relative aspect-video overflow-hidden bg-bp-surface">
            <img
              v-if="work.thumbnail"
              :src="work.thumbnail"
              :alt="localizedField(work.title_zh, work.title_en)"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div v-else class="h-full w-full bp-grid-bg-dense" />

            <!-- Play overlay -->
            <div
              v-if="work.video_url"
              class="absolute inset-0 flex items-center justify-center bg-bp-primary/40 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <div class="flex h-12 w-12 items-center justify-center border border-bp-white">
                <svg class="h-5 w-5 text-bp-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Info -->
          <div class="p-4">
            <h3 class="mb-1 text-sm font-medium text-bp-white line-clamp-2">
              {{ localizedField(work.title_zh, work.title_en) }}
            </h3>
            <div class="flex items-center gap-2 text-[11px] text-bp-muted">
              <span v-if="work.client">{{ t('showcase.client') }}: {{ work.client }}</span>
              <span class="border border-bp-border px-1.5 py-0.5 text-[10px]">
                {{ getFilterLabel(work.category) }}
              </span>
            </div>
          </div>

          <!-- Expanded video -->
          <Transition
            enter-active-class="transition-all duration-300"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-96 opacity-100"
            leave-active-class="transition-all duration-200"
            leave-from-class="max-h-96 opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div
              v-if="selectedWork === work.id && work.video_url"
              class="overflow-hidden border-t border-bp-border"
            >
              <div class="aspect-video">
                <iframe
                  :src="work.video_url"
                  class="h-full w-full"
                  allow="autoplay; fullscreen"
                  allowfullscreen
                />
              </div>
              <p class="p-4 text-xs leading-relaxed text-bp-subtle">
                {{ localizedField(work.description_zh, work.description_en) }}
              </p>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>
