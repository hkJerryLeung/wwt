<script setup lang="ts">
import { onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useLocale } from '@/composables/useLocale'
import { usePageHeading } from '@/composables/usePageHeading'

const projectsStore = useProjectsStore()
const { t, localizedField } = useLocale()
const { title, subtitle } = usePageHeading('lab')

onMounted(() => {
  projectsStore.fetchProjects()
})
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

      <!-- Loading -->
      <div v-if="projectsStore.isLoading" class="py-16 text-center">
        <span class="font-blueprint text-sm text-bp-muted">{{ t('common.loading') }}</span>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="projectsStore.projects.length === 0"
        class="border border-dashed border-bp-border p-16 text-center"
      >
        <div class="mx-auto mb-4 h-16 w-16 border border-dashed border-bp-border-strong bp-grid-bg-dense" />
        <p class="font-blueprint text-sm text-bp-muted">{{ t('common.no_results') }}</p>
        <p class="mt-2 text-xs text-bp-muted">Projects will appear here once added via the CMS.</p>
      </div>

      <!-- Projects grid -->
      <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div
          v-for="project in projectsStore.projects"
          :key="project.id"
          class="bp-card group relative overflow-hidden"
        >
          <div class="bp-corner-marks absolute inset-0" />

          <!-- Screenshot -->
          <div class="aspect-video overflow-hidden bg-bp-surface">
            <img
              v-if="project.screenshot"
              :src="project.screenshot"
              :alt="project.name"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div v-else class="flex h-full w-full items-center justify-center bp-grid-bg-dense">
              <svg class="h-12 w-12 text-bp-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
          </div>

          <!-- Info -->
          <div class="p-6">
            <h3 class="mb-2 font-blueprint text-lg tracking-wide text-bp-white">
              {{ project.name }}
            </h3>
            <p class="mb-4 text-sm leading-relaxed text-bp-subtle">
              {{ localizedField(project.description_zh, project.description_en) }}
            </p>

            <!-- Tech stack -->
            <div v-if="project.tech_stack?.length" class="mb-4">
              <span class="mb-2 block text-[10px] uppercase tracking-wider text-bp-muted">
                {{ t('lab.tech_stack') }}
              </span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="tech in project.tech_stack"
                  :key="tech"
                  class="border border-bp-border bg-bp-deep px-2 py-0.5 font-mono text-[10px] text-bp-accent"
                >
                  {{ tech }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <a
                v-if="project.url"
                :href="project.url"
                target="_blank"
                rel="noopener noreferrer"
                class="bp-btn-accent text-xs"
              >
                {{ t('lab.visit') }} →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
