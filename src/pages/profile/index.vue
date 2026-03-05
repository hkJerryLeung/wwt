<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLocale } from '@/composables/useLocale'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import { useStripe } from '@/composables/useStripe'
import { useAppearanceStore } from '@/stores/appearance'

const router = useRouter()
const { t, localizedPath } = useLocale()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const appearanceStore = useAppearanceStore()
const { getUserPurchases } = useStripe()

const activeSection = ref<'licenses' | 'account'>('licenses')
const purchases = ref<any[]>([])
const isLoadingPurchases = ref(false)

// Format a date string to readable format
function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// Check if a date is expired
function isExpired(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d.getTime() < Date.now()
}

const formattedEndDate = computed(() => formatDate(authStore.subscriptionEndDate))
const subscriptionExpired = computed(() => isExpired(authStore.subscriptionEndDate))

// App purchases only: must match a real project in the store
// (Premium subscription payments are excluded because their product_id won't match any project)
const appPurchases = computed(() =>
  purchases.value.filter((p) => {
    // Explicitly exclude subscription types
    if (p.type === 'subscription' || p.product_type === 'subscription' || p.mode === 'subscription') return false
    // Only show if product_id matches a known project
    return projectsStore.projects.some((proj) => proj.id === p.product_id)
  })
)

// Get project name by product_id
function getProductName(productId: string): string {
  const project = projectsStore.projects.find((p) => p.id === productId)
  return project?.name ?? productId
}

function scrollTo(section: 'licenses' | 'account') {
  activeSection.value = section
  const el = document.getElementById(`section-${section}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handleSignOut() {
  authStore.signOut()
  router.push('/')
}

onMounted(async () => {
  // Redirect to login if not authenticated
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }
  if (!authStore.isAuthenticated) {
    router.push('/auth/login')
    return
  }

  // Fetch data
  isLoadingPurchases.value = true
  try {
    await projectsStore.fetchProjects()
    purchases.value = await getUserPurchases()
  } finally {
    isLoadingPurchases.value = false
  }
})
</script>

<template>
  <div class="licenses-page">
    <!-- Left Sidebar -->
    <aside class="licenses-sidebar">
      <div class="sidebar-inner">
        <!-- Site branding -->
        <router-link :to="localizedPath('/')" class="sidebar-brand">
          {{ appearanceStore.effectiveSiteName() }}
        </router-link>

        <!-- Navigation -->
        <nav class="sidebar-nav">
          <button
            class="sidebar-nav-item"
            :class="{ active: activeSection === 'licenses' }"
            @click="scrollTo('licenses')"
          >
            {{ t('profile.nav_item') }}
          </button>
          <button
            class="sidebar-nav-item"
            :class="{ active: activeSection === 'account' }"
            @click="scrollTo('account')"
          >
            {{ t('profile.account_management') }}
          </button>
        </nav>

        <!-- User info -->
        <div class="sidebar-user">
          <p class="sidebar-user-email">{{ authStore.user?.email }}</p>
          <button class="sidebar-logout" @click="handleSignOut">
            {{ t('admin.logout') }}
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="licenses-main">
      <!-- Licenses Section -->
      <section id="section-licenses" class="licenses-section">
        <h1 class="licenses-title">{{ t('profile.title') }}</h1>

        <!-- Loading -->
        <div v-if="isLoadingPurchases" class="licenses-loading">
          <svg class="animate-spin h-6 w-6 text-bp-muted" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{{ t('common.loading') }}</span>
        </div>

        <template v-else>
          <!-- Premium Subscription Card -->
          <div v-if="authStore.isPremium" class="license-card">
            <div class="license-card-header">
              <h2 class="license-card-name">{{ t('profile.premium_subscription') }}</h2>
              <span class="license-card-badge premium">Premium</span>
            </div>

            <div class="license-card-meta">
              <div v-if="formattedEndDate" class="license-card-dates">
                <div>
                  <span class="license-date-label">{{ t('profile.valid_until') }}</span>
                  <span class="license-date-value">
                    {{ formattedEndDate }}
                    <span v-if="subscriptionExpired" class="license-expired">{{ t('profile.expired') }}</span>
                    <span v-else class="license-active">{{ t('profile.active') }}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Renew button for Premium -->
            <router-link
              :to="localizedPath('/premium')"
              class="license-renew-btn"
            >
              {{ t('profile.renew_license') }}
            </router-link>
          </div>

          <!-- App Purchase Cards -->
          <div v-for="purchase in appPurchases" :key="purchase.id" class="license-card">
            <div class="license-card-header">
              <h2 class="license-card-name">{{ getProductName(purchase.product_id) }}</h2>
              <span class="license-card-badge app">App</span>
            </div>

            <div class="license-card-meta">
              <div v-if="purchase.created_at" class="license-card-dates">
                <div>
                  <span class="license-date-label">{{ t('profile.purchased_on') }}</span>
                  <span class="license-date-value">{{ formatDate(purchase.created_at) }}</span>
                </div>
              </div>
            </div>

            <!-- No renew button for apps -->
          </div>

          <!-- No purchases message -->
          <div
            v-if="!authStore.isPremium && appPurchases.length === 0"
            class="licenses-empty"
          >
            <p>{{ t('profile.no_purchases') }}</p>
          </div>
        </template>
      </section>

      <!-- Account Management Section -->
      <section id="section-account" class="account-section">
        <h2 class="account-title">{{ t('profile.account_management') }}</h2>
        <p class="account-desc">{{ t('profile.email_linked') }}</p>
        <div class="account-email-box">
          {{ authStore.user?.email }}
        </div>
        <button class="account-change-btn">
          {{ t('profile.change_email') }}
        </button>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ───── Page Layout ───── */
.licenses-page {
  display: flex;
  min-height: 100vh;
  max-width: 1200px;
  margin: 2rem auto;
}

/* ───── Sidebar ───── */
.licenses-sidebar {
  position: sticky;
  top: 98px;
  width: 240px;
  height: calc(100vh - 98px);
  flex-shrink: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-brand {
  font-family: 'Inter', 'SF Pro', system-ui, sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  margin-bottom: 1.5rem;
  transition: color 0.2s;
}

.sidebar-brand:hover {
  color: rgba(255, 255, 255, 0.8);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin-bottom: auto;
}

.sidebar-nav-item {
  text-align: left;
  padding: 0.375rem 0.75rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  background: none;
  border: none;
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.sidebar-nav-item:hover {
  color: rgba(255, 255, 255, 0.8);
}

.sidebar-nav-item.active {
  color: #fff;
  border-left-color: var(--bp-accent, #e34234);
}

.sidebar-user {
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-user-email {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.5rem;
  word-break: break-all;
}

.sidebar-logout {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.35);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}

.sidebar-logout:hover {
  color: rgba(255, 255, 255, 0.7);
}

/* ───── Main Content ───── */
.licenses-main {
  flex: 1;
  max-width: 700px;
  padding: 3rem 3rem 6rem;
}

/* ───── Licenses Section ───── */
.licenses-section {
  margin-bottom: 5rem;
}

.licenses-title {
  font-family: 'Playfair Display', 'Georgia', serif;
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #fff;
  margin-bottom: 2rem;
}

.licenses-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 0;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
}

/* ───── License Card ───── */
.license-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  padding: 1.75rem;
  margin-bottom: 1.5rem;
  transition: border-color 0.2s;
}

.license-card:hover {
  border-color: rgba(255, 255, 255, 0.18);
}

.license-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.license-card-name {
  font-family: 'Playfair Display', 'Georgia', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

.license-card-badge {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  border: 1px solid;
}

.license-card-badge.premium {
  color: var(--bp-accent, #e34234);
  border-color: var(--bp-accent, #e34234);
}

.license-card-badge.app {
  color: rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.2);
}

.license-card-meta {
  margin-bottom: 1.25rem;
}

.license-card-dates {
  display: flex;
  gap: 2rem;
  font-size: 0.8rem;
}

.license-date-label {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.7rem;
  text-transform: lowercase;
  display: block;
  margin-bottom: 0.25rem;
}

.license-date-value {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
}

.license-expired {
  color: #e34234;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.license-active {
  color: #22c55e;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.license-renew-btn {
  display: block;
  width: 100%;
  text-align: center;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.license-renew-btn:hover {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.05);
}

/* ───── Empty State ───── */
.licenses-empty {
  padding: 3rem 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.9rem;
}

/* ───── Account Section ───── */
.account-section {
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.account-title {
  font-family: 'Playfair Display', 'Georgia', serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.75rem;
}

.account-desc {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 1rem;
}

.account-email-box {
  display: inline-block;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.25rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.account-change-btn {
  display: block;
  padding: 0.65rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}

.account-change-btn:hover {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.05);
}

/* ───── Mobile Responsive ───── */
@media (max-width: 768px) {
  .licenses-page {
    flex-direction: column;
  }

  .licenses-sidebar {
    position: relative;
    top: 0;
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1.5rem 1rem;
  }

  .sidebar-nav {
    flex-direction: row;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .sidebar-nav-item {
    border-left: none;
    border-bottom: 2px solid transparent;
    padding: 0.375rem 0.5rem;
    font-size: 0.8rem;
  }

  .sidebar-nav-item.active {
    border-bottom-color: var(--bp-accent, #e34234);
    border-left-color: transparent;
  }

  .sidebar-user {
    display: flex;
    align-items: center;
    gap: 1rem;
    border-top: none;
    padding-top: 0;
  }

  .sidebar-user-email {
    margin-bottom: 0;
  }

  .licenses-main {
    padding: 1.5rem 1rem 4rem;
  }

  .licenses-title {
    font-size: 1.75rem;
  }
}
</style>
