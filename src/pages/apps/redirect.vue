<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useLocale } from '@/composables/useLocale'

const router = useRouter()
const projectsStore = useProjectsStore()
const { localizedPath } = useLocale()

function appSlug(name: string, slug?: string | null) {
  if (slug) return slug
  return name?.toLowerCase().replace(/\s+/g, '-') ?? ''
}

onMounted(async () => {
  await projectsStore.fetchProjects()
  const first = projectsStore.appsWithSlug[0]
  if (first) {
    router.replace(localizedPath(`/apps/${appSlug(first.name, first.slug)}`))
  } else {
    router.replace(localizedPath('/'))
  }
})
</script>

<template>
  <div class="flex min-h-[40vh] items-center justify-center">
    <p class="text-sm text-bp-muted">Redirecting…</p>
  </div>
</template>
