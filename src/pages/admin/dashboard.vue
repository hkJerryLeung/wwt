<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/plugins/supabase'

const { t } = useI18n()

const stats = ref({
  posts: 0,
  published: 0,
  works: 0,
  projects: 0,
})

onMounted(async () => {
  const [postsRes, publishedRes, worksRes, projectsRes] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('works').select('id', { count: 'exact', head: true }),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
  ])
  stats.value = {
    posts: postsRes.count ?? 0,
    published: publishedRes.count ?? 0,
    works: worksRes.count ?? 0,
    projects: projectsRes.count ?? 0,
  }
})

const statCards = [
  { key: 'posts', label: 'admin.posts', color: 'text-bp-accent' },
  { key: 'published', label: 'Published', color: 'text-bp-success' },
  { key: 'works', label: 'admin.works', color: 'text-bp-warning' },
  { key: 'projects', label: 'admin.projects', color: 'text-bp-error' },
]
</script>

<template>
  <div>
    <h1 class="mb-8 font-blueprint text-2xl tracking-wide text-bp-white">
      {{ t('admin.dashboard') }}
    </h1>

    <!-- Stats grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="bp-card relative p-6"
      >
        <div class="bp-corner-marks absolute inset-0" />
        <span class="block text-xs uppercase tracking-wider text-bp-muted">
          {{ card.label.startsWith('admin.') ? t(card.label) : card.label }}
        </span>
        <span class="mt-2 block font-blueprint text-3xl" :class="card.color">
          {{ stats[card.key as keyof typeof stats] }}
        </span>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="mt-10">
      <h2 class="mb-4 text-sm uppercase tracking-wider text-bp-muted">Quick Actions</h2>
      <div class="flex flex-wrap gap-3">
        <router-link to="/admin/posts/new" class="bp-btn-accent">
          + {{ t('admin.new_post') }}
        </router-link>
        <router-link to="/admin/works" class="bp-btn-primary">
          {{ t('admin.works') }}
        </router-link>
        <router-link to="/admin/projects" class="bp-btn-primary">
          {{ t('admin.projects') }}
        </router-link>
        <router-link to="/admin/media" class="bp-btn-primary">
          {{ t('admin.media') }}
        </router-link>
      </div>
    </div>
  </div>
</template>
