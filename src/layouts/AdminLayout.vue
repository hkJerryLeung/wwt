<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/composables/useLocale'
import { useFrontendNavStore } from '@/stores/frontendNav'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()
const { currentLocale } = useLocale()
const navStore = useFrontendNavStore()

const sidebarTop = [
  { key: 'dashboard', path: '/admin' },
  { key: 'menu_management', path: '/admin/menu' },
] as const

/** 後台側欄項目對應前台選單 key，名稱跟從選單管理 */
const sidebarNavKeyMap: Record<string, string> = {
  skills: 'workshop',
  works: 'showcase',
  projects: 'lab',
}

/** 僅當前路徑完全符合時視為選中，避免多個項目同時有框和紅字 */
function isExactActive(path: string): boolean {
  const current = route.path.replace(/\/$/, '') || '/'
  const target = path.replace(/\/$/, '') || '/'
  return current === target
}

const sidebarNav = [
  { key: 'homepage', path: '/admin/homepage' },
  { key: 'skills', path: '/admin/skills' },
  { key: 'works', path: '/admin/works' },
  { key: 'projects', path: '/admin/projects' },
] as const

const sidebarBottom = [
  { key: 'media', path: '/admin/media' },
  { key: 'appearance', path: '/admin/appearance' },
  { key: 'settings', path: '/admin/settings' },
] as const

function getSidebarLabel(key: string): string {
  const navKey = sidebarNavKeyMap[key]
  if (!navKey) return t(`admin.${key}`)
  const item = navStore.getItemByKey(navKey)
  if (!item) return t(`admin.${key}`)
  const zh = item.customLabelZh?.trim() ?? item.customLabel?.trim()
  const en = item.customLabelEn?.trim() ?? item.customLabel?.trim()
  if (currentLocale.value === 'zh-TW') return zh || t(item.labelKey)
  return en || t(item.labelKey)
}

async function handleLogout() {
  await authStore.signOut()
  router.push('/admin/login')
}
</script>

<template>
  <div class="flex min-h-screen bg-bp-primary">
    <!-- Sidebar -->
    <aside class="fixed left-0 top-0 z-40 flex h-full w-56 flex-col border-r border-bp-border bg-bp-deep">
      <!-- Logo -->
      <div class="flex h-14 items-center border-b border-bp-border px-5">
        <router-link to="/admin" class="font-blueprint text-lg tracking-wider text-bp-white">
          WWT Admin
        </router-link>
      </div>

      <!-- Nav: 管理面板 → 選單管理 → 分隔線 → 文章/作品/App → 分隔線 → 媒體庫 → 外觀設定 -->
      <nav class="flex-1 px-3 py-4 space-y-1">
        <router-link
          v-for="item in sidebarTop"
          :key="item.key"
          :to="item.path"
          class="flex items-center gap-3 rounded-none border px-3 py-2 text-sm transition-colors hover:border-bp-border hover:text-bp-white"
          :class="isExactActive(item.path)
            ? '!border-bp-border-strong !text-bp-accent bg-bp-surface'
            : 'border-transparent text-bp-subtle'"
        >
          <span>{{ t(`admin.${item.key}`) }}</span>
        </router-link>
        <div class="my-2 border-t border-bp-border" role="separator" aria-hidden="true" />
        <router-link
          v-for="item in sidebarNav"
          :key="item.key"
          :to="item.path"
          class="flex items-center gap-3 rounded-none border px-3 py-2 text-sm transition-colors hover:border-bp-border hover:text-bp-white"
          :class="isExactActive(item.path)
            ? '!border-bp-border-strong !text-bp-accent bg-bp-surface'
            : 'border-transparent text-bp-subtle'"
        >
          <span>{{ getSidebarLabel(item.key) }}</span>
        </router-link>
        <div class="my-2 border-t border-bp-border" role="separator" aria-hidden="true" />
        <router-link
          v-for="item in sidebarBottom"
          :key="item.key"
          :to="item.path"
          class="flex items-center gap-3 rounded-none border px-3 py-2 text-sm transition-colors hover:border-bp-border hover:text-bp-white"
          :class="isExactActive(item.path)
            ? '!border-bp-border-strong !text-bp-accent bg-bp-surface'
            : 'border-transparent text-bp-subtle'"
        >
          <span>{{ item.key === 'appearance' ? t('admin.appearance') : item.key === 'settings' ? t('admin.settings') : getSidebarLabel(item.key) }}</span>
        </router-link>
      </nav>

      <!-- Footer -->
      <div class="border-t border-bp-border p-3">
        <button
          class="w-full px-3 py-2 text-left text-sm text-bp-muted transition-colors hover:text-bp-error"
          @click="handleLogout"
        >
          {{ t('admin.logout') }}
        </button>
        <router-link
          to="/"
          class="mt-1 block px-3 py-2 text-sm text-bp-muted transition-colors hover:text-bp-accent"
        >
          ← Back to site
        </router-link>
      </div>
    </aside>

    <!-- Main content -->
    <div class="ml-56 flex-1">
      <div class="mx-auto max-w-[1080px] px-6 py-8">
        <slot />
      </div>
    </div>
  </div>
</template>
