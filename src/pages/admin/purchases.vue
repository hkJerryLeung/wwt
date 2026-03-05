<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/plugins/supabase'
import { useProjectsStore } from '@/stores/projects'

const { t } = useI18n()
const projectsStore = useProjectsStore()

interface PurchaseRecord {
  id: string
  user_id: string
  product_id: string | null
  status: string
  amount: number | null
  currency: string | null
  mode: string | null
  created_at: string
  profiles?: { email: string } | null
}

const purchases = ref<PurchaseRecord[]>([])
const isLoading = ref(false)
const activeFilter = ref<string>('all')
const fetchError = ref<string | null>(null)


// Unique product IDs present in purchases (non-premium)
const productFilters = computed(() => {
  const ids = new Set<string>()
  for (const p of purchases.value) {
    if (p.mode === 'subscription' || !p.product_id) continue
    ids.add(p.product_id)
  }
  return Array.from(ids).map((id) => ({
    id,
    label: getProductName(id),
  }))
})

// Filter tabs
const tabs = computed(() => [
  { id: 'all', label: t('admin.purchases_all') },
  { id: 'premium', label: t('admin.purchases_premium') },
  ...productFilters.value.map((pf) => ({ id: pf.id, label: pf.label })),
])

// Filtered records
const filteredPurchases = computed(() => {
  if (activeFilter.value === 'all') return purchases.value
  if (activeFilter.value === 'premium') {
    return purchases.value.filter((p) => p.mode === 'subscription')
  }
  return purchases.value.filter((p) => p.product_id === activeFilter.value)
})

function getProductName(productId: string): string {
  const project = projectsStore.projects.find((p) => p.id === productId)
  return project?.name ?? productId
}

function getStatusLabel(status: string): string {
  if (status === 'completed') return t('admin.purchases_succeeded')
  if (status === 'pending') return t('admin.purchases_pending')
  if (status === 'failed') return t('admin.purchases_failed')
  return status
}

function getStatusClass(status: string): string {
  if (status === 'completed') return 'status-succeeded'
  if (status === 'pending') return 'status-pending'
  if (status === 'failed') return 'status-failed'
  return ''
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAmount(amount: number | null, currency: string | null): string {
  if (amount == null) return '—'
  const cur = (currency || 'HKD').toUpperCase()
  return `${cur} $${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

onMounted(async () => {
  isLoading.value = true
  fetchError.value = null
  try {
    await projectsStore.fetchProjects()

    // Try with profiles join first
    let { data, error } = await supabase
      .from('purchases')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[Purchases] Join query failed, trying without join:', error.message)
      // Fallback: query without profiles join
      const fallback = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false })

      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('[Purchases] Query error:', error)
      fetchError.value = error.message
    } else if (data) {
      console.log('[Purchases] Fetched records:', data.length)
      purchases.value = data as PurchaseRecord[]
    }
  } catch (err: any) {
    console.error('[Purchases] Unexpected error:', err)
    fetchError.value = err.message || 'Unknown error'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="purchases-header">
      <h1 class="font-blueprint text-2xl tracking-wide text-bp-white">{{ t('admin.purchases') }}</h1>
    </div>

    <!-- Filter Tabs -->
    <div class="purchases-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="purchases-tab"
        :class="{ active: activeFilter === tab.id }"
        @click="activeFilter = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="py-10 text-center">
      <span class="font-blueprint text-sm text-bp-muted">{{ t('common.loading') }}</span>
    </div>

    <!-- Error -->
    <div v-else-if="fetchError" class="purchases-error">
      <p class="purchases-error-title">⚠ Query Error</p>
      <p class="purchases-error-msg">{{ fetchError }}</p>
      <p class="purchases-error-hint">請檢查 Supabase 的 <code>purchases</code> 表是否有 RLS policy 允許 admin 讀取所有資料。</p>
    </div>

    <!-- Empty -->
    <div
      v-else-if="filteredPurchases.length === 0"
      class="border border-dashed border-bp-border p-12 text-center"
    >
      <p class="text-sm text-bp-muted">{{ t('admin.purchases_no_records') }}</p>
    </div>

    <!-- Table -->
    <div v-else class="purchases-table-wrap">
      <table class="purchases-table">
        <thead>
          <tr>
            <th>{{ t('admin.purchases_amount') }}</th>
            <th>{{ t('admin.purchases_status') }}</th>
            <th>{{ t('admin.purchases_product') }}</th>
            <th>{{ t('admin.purchases_customer') }}</th>
            <th>{{ t('admin.purchases_date') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in filteredPurchases" :key="record.id">
            <td class="col-amount">{{ formatAmount(record.amount, record.currency) }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(record.status)">
                {{ getStatusLabel(record.status) }}
              </span>
            </td>
            <td class="col-product">
              {{ record.mode === 'subscription' ? 'Premium' : getProductName(record.product_id || '') }}
            </td>
            <td class="col-customer">{{ record.profiles?.email || record.user_id }}</td>
            <td class="col-date">{{ formatDate(record.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* ── Header ── */
.purchases-header {
  margin-bottom: 1.5rem;
}

/* ── Filter Tabs ── */
.purchases-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
}

.purchases-tab {
  padding: 0.6rem 1.25rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.45);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.purchases-tab:hover {
  color: rgba(255, 255, 255, 0.8);
}

.purchases-tab.active {
  color: var(--bp-accent, #e34234);
  border-bottom-color: var(--bp-accent, #e34234);
  background: rgba(227, 66, 52, 0.06);
}

/* ── Table ── */
.purchases-table-wrap {
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.purchases-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.purchases-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
}

.purchases-table td {
  padding: 0.7rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.75);
  vertical-align: middle;
}

.purchases-table tbody tr {
  transition: background 0.15s;
}

.purchases-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.col-amount {
  font-weight: 600;
  white-space: nowrap;
}

.col-product {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-customer {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
}

.col-date {
  white-space: nowrap;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

/* ── Status Badge ── */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.status-succeeded {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.status-succeeded::before {
  content: '✓';
  font-size: 0.65rem;
}

.status-pending {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.status-failed {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* ── Error ── */
.purchases-error {
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.purchases-error-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #ef4444;
  margin-bottom: 0.5rem;
}

.purchases-error-msg {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.75rem;
}

.purchases-error-hint {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.45);
}

.purchases-error-hint code {
  background: rgba(255, 255, 255, 0.08);
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: #f59e0b;
}
</style>

