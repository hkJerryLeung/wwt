<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useLocale } from '@/composables/useLocale'
import { useI18n } from 'vue-i18n'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useAppearanceStore } from '@/stores/appearance'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import LanguageSwitch from '@/components/common/LanguageSwitch.vue'
import LogoAnimation from '@/components/common/LogoAnimation.vue'
import type { FrontendNavItem } from '@/stores/frontendNav'

const route = useRoute()
const router = useRouter()
const { t, localizedPath, currentLocale } = useLocale()
const { t: i18nT } = useI18n()
const navStore = useFrontendNavStore()
const appearanceStore = useAppearanceStore()
const projectsStore = useProjectsStore()
const authStore = useAuthStore()
const { appsWithSlug, isLoading: projectsLoading } = storeToRefs(projectsStore)
const isMobileMenuOpen = ref(false)

/** True when a custom logo URL has been uploaded (not empty / not the default fallback) */
const hasCustomLogo = computed(() => {
  const url = appearanceStore.logoUrl?.trim()
  return !!url
})
const userMenuOpen = ref(false)

const userInitials = computed(() => {
  const name = authStore.user?.user_metadata?.full_name as string | undefined
  if (name) return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const email = authStore.user?.email ?? ''
  return email.slice(0, 2).toUpperCase()
})

/** 頭像外圈顏色：依會員等級區分 */
const avatarRingClass = computed(() => {
  switch (authStore.membershipRole) {
    case 'admin': return 'ring-[3.5px] ring-bp-accent'
    case 'premium': return 'ring-2 ring-bp-accent'
    default: return 'ring-1 ring-bp-border'
  }
})

function handleSignOut() {
  authStore.signOut()
  userMenuOpen.value = false
  router.push('/')
}
const dropdownOpen = ref<string | null>(null)
let dropdownLeaveTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  projectsStore.fetchProjects()
  window.addEventListener('hero-scroll-progress', handleHeroScroll as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('hero-scroll-progress', handleHeroScroll as EventListener)
})

/** Navbar logo visibility: hidden on homepage (flying logo handles it), visible elsewhere */
const heroScrollProgress = ref(0)
const isHomepage = computed(() => route.path === '/' || route.path === '/zh-TW' || route.path === '/en')
const navbarLogoOpacity = computed(() => {
  if (!isHomepage.value) return 1
  // On homepage without custom logo, animation handles display — keep it visible
  if (!hasCustomLogo.value) return 1
  return 0 // Flying logo from CohesionHero covers this on homepage
})

function handleHeroScroll(e: CustomEvent<{ progress: number }>) {
  heroScrollProgress.value = e.detail.progress
}

// Reset scroll progress when route changes so that stale values don't persist
watch(() => route.path, () => {
  heroScrollProgress.value = 0
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
    <div class="mx-auto max-w-[1800px] px-4 sm:px-6">
      <div class="grid h-[98px] items-center" style="grid-template-columns: 1fr auto 1fr;">
        <!-- Logo（可由外觀設定覆寫） -->
        <router-link
          :to="localizedPath('/')"
          class="relative flex items-center gap-2 transition-opacity duration-500 justify-self-start"
          :style="{ opacity: navbarLogoOpacity }"
          data-navbar-logo
          @click="closeMobileMenu"
        >
          <!-- Logo image: always rendered for sizing / flying-logo targeting.
               On homepage without custom logo, hidden visually (keeps layout) so animation shows instead. -->
          <img
            :src="appearanceStore.effectiveLogoUrl()"
            :alt="appearanceStore.effectiveSiteName()"
            class="h-10 w-auto max-w-[280px] object-contain sm:h-12"
            :style="{ visibility: (isHomepage && !hasCustomLogo) ? 'hidden' : 'visible' }"
          />
          <!-- SVG animation overlay: homepage only, fades out when flying logo arrives -->
          <LogoAnimation
            v-if="isHomepage && !hasCustomLogo"
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"
            :style="{ opacity: heroScrollProgress > 0.85 ? 0 : 1 }"
          />
        </router-link>

        <!-- Desktop Nav -->
        <div class="hidden items-center gap-2 justify-self-center md:flex">
          <template v-for="item in navStore.visibleItems" :key="item.id">
            <!-- 父選單：hover 顯示下拉，無連結 -->
            <div
              v-if="isParentMenu(item)"
              class="relative"
              @mouseenter="dropdownEnter(item.id, item)"
              @mouseleave="dropdownLeave"
            >
              <span
                class="flex cursor-default items-center gap-0.5 px-5 py-2 text-lg font-black tracking-wide"
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
                    class="block px-4 py-2 text-sm font-bold"
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
              class="px-5 py-2 text-lg font-black tracking-wide text-bp-subtle transition-colors hover:text-bp-white"
              exact-active-class="!text-bp-accent"
            >
              {{ navLabel(item) }}
            </router-link>
          </template>
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-4 justify-self-end min-w-[120px] justify-end">
          <LanguageSwitch />

          <!-- Logged-in: user avatar + dropdown (desktop) -->
          <div v-if="authStore.shouldShowAuthUI" class="relative hidden items-center gap-1.5 md:flex">
            <button
              class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-bp-surface text-sm font-semibold text-bp-white transition-shadow"
              :class="avatarRingClass"
              @click="userMenuOpen = !userMenuOpen"
            >
              <img
                v-if="authStore.user?.user_metadata?.avatar_url"
                :src="(authStore.user.user_metadata.avatar_url as string)"
                class="h-full w-full object-cover"
                alt="avatar"
              />
              <span v-else>{{ userInitials }}</span>
            </button>
            <Transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-show="userMenuOpen"
                class="absolute right-0 top-full z-20 mt-2 min-w-[180px] origin-top-right border border-bp-border bg-bp-deep py-1 shadow-lg"
                @mouseleave="userMenuOpen = false"
              >
                <p class="truncate border-b border-bp-border px-4 py-2 text-xs text-bp-muted">
                  {{ authStore.user?.email }}
                </p>
                <router-link
                  to="/profile"
                  class="flex items-center gap-2 px-4 py-2 text-sm text-bp-subtle transition-colors hover:text-bp-accent"
                  @click="userMenuOpen = false"
                >
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {{ t('profile.nav_item') }}
                </router-link>
                <a
                  v-if="authStore.isAdmin"
                  href="/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 px-4 py-2 text-sm text-bp-subtle transition-colors hover:text-bp-accent"
                  @click="userMenuOpen = false"
                >
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  後台管理
                </a>
                <button
                  class="block w-full px-4 py-2 text-left text-sm text-bp-subtle transition-colors hover:text-bp-error"
                  @click="handleSignOut"
                >
                  {{ t('admin.logout') }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- Guest: Login + Register (desktop) -->
          <template v-else>
            <router-link
              to="/auth/login"
              class="hidden px-3 py-1.5 text-sm text-bp-subtle transition-colors hover:text-bp-white md:inline-block"
            >
              {{ t('auth.login') }}
            </router-link>
            <router-link
              to="/auth/register"
              class="hidden border border-bp-accent px-3 py-1.5 text-sm text-bp-accent transition-colors hover:bg-bp-accent hover:text-bp-primary md:inline-block"
            >
              {{ t('auth.register') }}
            </router-link>
          </template>

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
                class="block px-3 py-2.5 pl-5 text-sm font-light"
                :class="isCurrentApp(app) ? 'text-bp-accent' : 'text-bp-subtle'"
                @click="closeMobileMenu"
              >
                {{ app.name || app.id || 'App' }}
              </router-link>
            </template>
            <router-link
              v-else
              :to="localizedPath(item.path)"
              class="block px-3 py-2.5 text-sm font-light text-bp-subtle transition-colors hover:text-bp-white"
              exact-active-class="!text-bp-accent"
              @click="closeMobileMenu"
            >
              {{ navLabel(item) }}
            </router-link>
          </template>

          <!-- Mobile auth section -->
          <div class="border-t border-bp-border pt-3 mt-1">
            <template v-if="authStore.shouldShowAuthUI">
              <p class="truncate px-3 py-1 text-xs text-bp-muted">{{ authStore.user?.email }}</p>
              <p v-show="authStore.isInitialized" class="flex items-center gap-1.5 px-3 py-1">
                <span
                  class="inline-block h-2 w-2 rounded-full"
                  :class="{
                    'bg-red-500': authStore.membershipRole === 'admin',
                    'bg-bp-accent': authStore.membershipRole === 'premium',
                    'bg-bp-muted': authStore.membershipRole === 'free',
                  }"
                />
                <span class="text-[10px] font-bold uppercase tracking-wider text-bp-muted">
                  {{ i18nT(`premium.membership_${authStore.membershipRole}`) }}
                </span>
              </p>
              <router-link
                to="/profile"
                class="block w-full px-3 py-2.5 text-left text-sm text-bp-subtle transition-colors hover:text-bp-accent"
                @click="closeMobileMenu"
              >
                👤 {{ t('profile.nav_item') }}
              </router-link>
              <button
                class="block w-full px-3 py-2.5 text-left text-sm text-bp-subtle transition-colors hover:text-bp-error"
                @click="handleSignOut(); closeMobileMenu()"
              >
                {{ t('admin.logout') }}
              </button>
            </template>
            <template v-else>
              <router-link
                to="/auth/login"
                class="block px-3 py-2.5 text-sm text-bp-subtle transition-colors hover:text-bp-white"
                @click="closeMobileMenu"
              >
                {{ t('auth.login') }}
              </router-link>
              <router-link
                to="/auth/register"
                class="block px-3 py-2.5 text-sm text-bp-accent transition-colors hover:text-bp-accent-bright"
                @click="closeMobileMenu"
              >
                {{ t('auth.register') }}
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>
