<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useLocale } from '@/composables/useLocale'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useAppearanceStore } from '@/stores/appearance'
import { useProjectsStore } from '@/stores/projects'
import LanguageSwitch from '@/components/common/LanguageSwitch.vue'
import type { FrontendNavItem } from '@/stores/frontendNav'

const route = useRoute()
const { t, localizedPath, currentLocale } = useLocale()
const navStore = useFrontendNavStore()
const appearanceStore = useAppearanceStore()
const projectsStore = useProjectsStore()
const { appsWithSlug, isLoading: projectsLoading } = storeToRefs(projectsStore)
const isMobileMenuOpen = ref(false)
const dropdownOpen = ref<string | null>(null)
let dropdownLeaveTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  projectsStore.fetchProjects()
})

function navLabel(item: { labelKey: string; customLabel?: string; customLabelZh?: string; customLabelEn?: string }) {
  const zh = item.customLabelZh?.trim() ?? item.customLabel?.trim()
  const en = item.customLabelEn?.trim() ?? item.customLabel?.trim()
  if (currentLocale.value === 'zh-TW') return zh || t(item.labelKey)
  return en || t(item.labelKey)
}

function appSlug(name: string, slug?: string | null) {
  if (slug) return slug
  return name?.toLowerCase().replace(/\s+/g, '-') ?? ''
}

const currentAppSlug = computed(() => (route.params.slug as string) ?? '')

/** 是否正在某個 app 產品頁（/apps/:slug），自家程式父選單此時顯示紅色 */
const isOnAppPage = computed(() => /\/apps\/[^/]+/.test(route.path))

function isCurrentApp(app: { name?: string | null; slug?: string | null }) {
  return currentAppSlug.value === appSlug(app.name ?? '', app.slug)
}

function isParentMenu(item: FrontendNavItem) {
  return !!item.isParentMenu
}

function dropdownEnter(itemId: string, _item: FrontendNavItem) {
  if (dropdownLeaveTimer) {
    clearTimeout(dropdownLeaveTimer)
    dropdownLeaveTimer = null
  }
  dropdownOpen.value = itemId
  if (appsWithSlug.value.length === 0 && !projectsLoading.value) {
    projectsStore.fetchProjects()
  }
}

function dropdownLeave() {
  dropdownLeaveTimer = setTimeout(() => {
    dropdownOpen.value = null
    dropdownLeaveTimer = null
  }, 150)
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bp-line-bottom bg-bp-primary/90 backdrop-blur-md">
    <div class="mx-auto max-w-[1200px] px-4 sm:px-6">
      <div class="flex h-16 items-center justify-between">
        <!-- Logo（可由外觀設定覆寫） -->
        <router-link
          :to="localizedPath('/')"
          class="flex items-center gap-2"
          @click="closeMobileMenu"
        >
          <img
            :src="appearanceStore.effectiveLogoUrl()"
            :alt="appearanceStore.effectiveSiteName()"
            class="h-8 w-auto max-w-[180px] object-contain sm:h-9"
          />
        </router-link>

        <!-- Desktop Nav -->
        <div class="hidden items-center gap-1 md:flex">
          <template v-for="item in navStore.visibleItems" :key="item.id">
            <!-- 父選單：hover 顯示下拉，無連結 -->
            <div
              v-if="isParentMenu(item)"
              class="relative"
              @mouseenter="dropdownEnter(item.id, item)"
              @mouseleave="dropdownLeave"
            >
              <span
                class="flex cursor-default items-center gap-0.5 px-3 py-2 text-sm"
                :class="isOnAppPage ? 'text-bp-accent' : 'text-bp-subtle'"
                role="button"
                tabindex="0"
                aria-haspopup="true"
                :aria-expanded="dropdownOpen === item.id"
              >
                {{ navLabel(item) }}
                <svg class="ml-0.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <Transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
              >
                <div
                  v-show="dropdownOpen === item.id"
                  class="absolute left-0 top-full z-10 mt-1 min-w-[180px] origin-top-left rounded border border-bp-border bg-bp-deep py-1 shadow-lg"
                >
                  <!-- 父選單一律顯示 App 列表（自家程式） -->
                  <router-link
                    v-for="app in appsWithSlug"
                    :key="app.id"
                    :to="localizedPath(`/apps/${appSlug(app.name ?? '', app.slug)}`)"
                    class="block px-4 py-2 text-sm"
                    :class="isCurrentApp(app) ? 'text-bp-accent' : 'text-bp-subtle'"
                  >
                    {{ app.name || app.id || 'App' }}
                  </router-link>
                  <p
                    v-if="appsWithSlug.length === 0"
                    class="px-4 py-2 text-xs text-bp-muted"
                  >
                    {{ t('common.no_results') }}
                  </p>
                </div>
              </Transition>
            </div>
            <router-link
              v-else
              :to="localizedPath(item.path)"
              class="px-3 py-2 text-sm text-bp-subtle transition-colors hover:text-bp-white"
              exact-active-class="!text-bp-accent"
            >
              {{ navLabel(item) }}
            </router-link>
          </template>
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-3">
          <LanguageSwitch />

          <!-- Mobile menu button -->
          <button
            class="flex h-10 w-10 items-center justify-center text-bp-subtle md:hidden"
            :aria-label="isMobileMenuOpen ? 'Close menu' : 'Open menu'"
            @click="toggleMobileMenu"
          >
            <svg
              v-if="!isMobileMenuOpen"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg
              v-else
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="isMobileMenuOpen"
        class="border-b border-bp-border bg-bp-primary/95 backdrop-blur-md md:hidden"
      >
        <div class="space-y-1 px-4 py-4">
          <template v-for="item in navStore.visibleItems" :key="item.id">
            <template v-if="isParentMenu(item)">
              <p class="px-3 py-2 text-xs uppercase tracking-wider text-bp-muted">
                {{ navLabel(item) }}
              </p>
              <router-link
                v-for="app in appsWithSlug"
                :key="app.id"
                :to="localizedPath(`/apps/${appSlug(app.name ?? '', app.slug)}`)"
                class="block px-3 py-2.5 pl-5 text-sm"
                :class="isCurrentApp(app) ? 'text-bp-accent' : 'text-bp-subtle'"
                @click="closeMobileMenu"
              >
                {{ app.name || app.id || 'App' }}
              </router-link>
            </template>
            <router-link
              v-else
              :to="localizedPath(item.path)"
              class="block px-3 py-2.5 text-sm text-bp-subtle transition-colors hover:text-bp-white"
              exact-active-class="!text-bp-accent"
              @click="closeMobileMenu"
            >
              {{ navLabel(item) }}
            </router-link>
          </template>
        </div>
      </div>
    </Transition>
  </nav>
</template>
