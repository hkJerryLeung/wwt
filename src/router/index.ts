import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const STORAGE_KEY = 'wwt-frontend-nav'

const defaultPathByKey: Record<string, string> = {
  explore: '/',
  workshop: '/workshop',
  lab: '/lab',
  apps: '/apps',
  showcase: '/showcase',
  premium: '/premium',
}

function getStoredNavPaths(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Array<{ id: string; key: string; path: string }>
    if (!Array.isArray(parsed)) return {}
    const out: Record<string, string> = {}
    parsed.forEach((item) => {
      const path = (item.path || '/').trim() || '/'
      const key = item.key || item.id
      if (key && path !== defaultPathByKey[key]) out[key] = path.replace(/^\/+/, '') // 不含前導斜線
    })
    return out
  } catch {
    return {}
  }
}

const routes: RouteRecordRaw[] = [
  {
    name: 'locale',
    path: '/:locale(zh-TW|en)?',
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/pages/index.vue'),
      },
      {
        path: 'workshop',
        name: 'workshop',
        component: () => import('@/pages/workshop/index.vue'),
      },
      {
        path: 'workshop/:slug',
        name: 'workshop-detail',
        component: () => import('@/pages/workshop/[slug].vue'),
      },
      {
        path: 'lab',
        name: 'lab',
        component: () => import('@/pages/lab/index.vue'),
      },
      {
        path: 'showcase',
        name: 'showcase',
        component: () => import('@/pages/showcase/index.vue'),
      },
      {
        path: 'apps',
        name: 'apps-redirect',
        component: () => import('@/pages/apps/redirect.vue'),
      },
      {
        path: 'apps/:slug',
        name: 'app-detail',
        component: () => import('@/pages/apps/[slug].vue'),
      },
      {
        path: 'premium',
        name: 'premium',
        component: () => import('@/pages/premium/index.vue'),
      },
    ],
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/pages/admin/login.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/pages/admin/index.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('@/pages/admin/dashboard.vue'),
      },
      {
        path: 'works',
        name: 'admin-works',
        component: () => import('@/pages/admin/works/index.vue'),
      },
      {
        path: 'projects',
        name: 'admin-projects',
        component: () => import('@/pages/admin/projects/index.vue'),
      },
      {
        path: 'media',
        name: 'admin-media',
        component: () => import('@/pages/admin/media.vue'),
      },
      {
        path: 'menu',
        name: 'admin-menu',
        component: () => import('@/pages/admin/menu/index.vue'),
      },
      {
        path: 'skills',
        name: 'admin-skills',
        component: () => import('@/pages/admin/skills/index.vue'),
      },
      {
        path: 'appearance',
        name: 'admin-appearance',
        component: () => import('@/pages/admin/appearance.vue'),
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('@/pages/admin/settings.vue'),
      },
      {
        path: 'homepage',
        name: 'admin-homepage',
        component: () => import('@/pages/admin/homepage.vue'),
      },
    ],
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

const keyToRouteConfig: Record<
  string,
  { component: () => Promise<unknown>; child?: () => Promise<unknown> }
> = {
  workshop: {
    component: () => import('@/pages/workshop/index.vue'),
    child: () => import('@/pages/workshop/[slug].vue'),
  },
  lab: { component: () => import('@/pages/lab/index.vue') },
  apps: {
    component: () => import('@/pages/apps/redirect.vue'),
    child: () => import('@/pages/apps/[slug].vue'),
  },
  showcase: { component: () => import('@/pages/showcase/index.vue') },
  premium: { component: () => import('@/pages/premium/index.vue') },
}

/** 依後台選單設定的路徑註冊動態路由（例如 /workshop 改為 /Ai 時仍可造訪） */
export function registerDynamicNavRoutes() {
  if (typeof localStorage === 'undefined') return
  const stored = getStoredNavPaths()
  Object.entries(stored).forEach(([key, pathSegment]) => {
    const config = keyToRouteConfig[key]
    if (!config || !pathSegment) return
    if (config.component) {
      router.addRoute('locale', {
        path: pathSegment,
        name: `dynamic-${key}`,
        component: config.component,
      })
    }
    if (config.child) {
      router.addRoute('locale', {
        path: `${pathSegment}/:slug`,
        name: `dynamic-${key}-detail`,
        component: config.child,
      })
    }
  })
}

router.beforeEach((to, _from, next) => {
  if (to.params.locale) {
    const locale = to.params.locale as string
    if (!['zh-TW', 'en'].includes(locale)) {
      return next({ path: `/zh-TW${to.path}` })
    }
  }
  next()
})
