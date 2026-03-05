<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFrontendNavStore } from '@/stores/frontendNav'
import type { FrontendNavItem } from '@/stores/frontendNav'

const navStore = useFrontendNavStore()
const { t } = useI18n()

// ── Local draft state (changes only apply on Save) ──
const draft = ref<FrontendNavItem[]>([])

function syncFromStore() {
  draft.value = navStore.items.map((i) => ({ ...i }))
}

onMounted(() => {
  syncFromStore()
})

// ── Local mutations (draft only, no persist) ──
function moveUp(index: number) {
  if (index <= 0) return
  const items = draft.value
  const prev = items[index - 1]
  const curr = items[index]
  if (!prev || !curr) return
  ;[prev.order, curr.order] = [curr.order, prev.order]
  draft.value = [...items].sort((a, b) => a.order - b.order)
}

function moveDown(index: number) {
  if (index >= draft.value.length - 1) return
  const items = draft.value
  const curr = items[index]
  const next = items[index + 1]
  if (!curr || !next) return
  ;[curr.order, next.order] = [next.order, curr.order]
  draft.value = [...items].sort((a, b) => a.order - b.order)
}

function toggleHidden(id: string) {
  const item = draft.value.find((i) => i.id === id)
  if (item) item.hidden = !item.hidden
}

function updateField(id: string, field: keyof FrontendNavItem, value: string | boolean) {
  const item = draft.value.find((i) => i.id === id)
  if (item) (item as Record<string, unknown>)[field] = value
}

function handleAdd() {
  const maxOrder = Math.max(-1, ...draft.value.map((i) => i.order))
  const id = `custom-${Date.now()}`
  draft.value.push({
    id,
    key: id,
    path: '/',
    labelKey: '',
    customLabel: '',
    isParentMenu: false,
    order: maxOrder + 1,
    hidden: false,
  })
}

function handleRemove(id: string) {
  if (!window.confirm(t('admin.delete') + '?')) return
  draft.value = draft.value.filter((i) => i.id !== id)
}

function confirmReset() {
  if (!window.confirm(t('admin.menu_reset') + '?')) return
  navStore.resetToDefaults()
  syncFromStore()
}

// ── Save: push draft → store → Supabase ──
function handleSave() {
  // Replace store items with draft
  draft.value.forEach((d) => {
    const storeItem = navStore.items.find((s) => s.id === d.id)
    if (storeItem) {
      // Update existing
      navStore.updateLabelZh(d.id, d.customLabelZh)
      navStore.updateLabelEn(d.id, d.customLabelEn)
      navStore.updateSubtitleZh(d.id, d.customSubtitleZh)
      navStore.updateSubtitleEn(d.id, d.customSubtitleEn)
      navStore.updatePath(d.id, d.path)
      navStore.updateIsParentMenu(d.id, !!d.isParentMenu)
      navStore.setHidden(d.id, d.hidden)
    } else {
      // New item
      navStore.add({
        key: d.key,
        path: d.path,
        customLabel: d.customLabel,
        customLabelZh: d.customLabelZh,
        customLabelEn: d.customLabelEn,
        customSubtitleZh: d.customSubtitleZh,
        customSubtitleEn: d.customSubtitleEn,
      })
    }
  })
  // Remove deleted items
  navStore.items.forEach((s) => {
    if (!draft.value.find((d) => d.id === s.id)) {
      navStore.remove(s.id)
    }
  })
  // Re-sync to pick up any store-side normalization
  syncFromStore()
}

function displayPlaceholderZh(item: FrontendNavItem) {
  return item.labelKey ? t(item.labelKey) : t('admin.menu_name_zh')
}
function displayPlaceholderEn(item: FrontendNavItem) {
  return item.labelKey ? t(item.labelKey) : t('admin.menu_name_en')
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <h1 class="font-blueprint text-2xl tracking-wide text-bp-white">
        {{ t('admin.menu_management') }}
      </h1>
      <div class="flex gap-2">
        <button
          type="button"
          class="bp-btn-accent"
          @click="handleAdd"
        >
          + {{ t('admin.menu_add') }}
        </button>
        <button
          type="button"
          class="bp-btn-primary border border-bp-border"
          @click="confirmReset"
        >
          {{ t('admin.menu_reset') }}
        </button>
      </div>
    </div>

    <p class="mb-6 text-sm text-bp-muted">
      {{ t('admin.menu_description') }}
    </p>

    <div class="border border-bp-border">
      <table class="w-full">
        <thead>
          <tr class="border-b border-bp-border bg-bp-deep text-left">
            <th class="px-4 py-3 text-xs uppercase tracking-wider text-bp-muted">
              {{ t('admin.menu_order') }}
            </th>
            <th class="px-4 py-3 text-xs uppercase tracking-wider text-bp-muted">
              {{ t('admin.menu_name_zh') }}
            </th>
            <th class="px-4 py-3 text-xs uppercase tracking-wider text-bp-muted">
              {{ t('admin.menu_name_en') }}
            </th>
            <th class="px-4 py-3 text-xs uppercase tracking-wider text-bp-muted">
              {{ t('admin.menu_subtitle_zh') }}
            </th>
            <th class="px-4 py-3 text-xs uppercase tracking-wider text-bp-muted">
              {{ t('admin.menu_subtitle_en') }}
            </th>
            <th class="px-4 py-3 text-xs uppercase tracking-wider text-bp-muted">
              {{ t('admin.menu_path') }}
            </th>
            <th class="px-4 py-3 text-xs uppercase tracking-wider text-bp-muted" :title="t('admin.menu_is_parent_hint')">
              {{ t('admin.menu_is_parent') }}
            </th>
            <th class="px-4 py-3 text-xs uppercase tracking-wider text-bp-muted">
              {{ t('admin.menu_visible') }} / {{ t('admin.menu_hidden') }}
            </th>
            <th class="px-4 py-3 text-xs uppercase tracking-wider text-bp-muted">
              {{ t('admin.menu_actions') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in draft"
            :key="item.id"
            class="border-b border-bp-border transition-colors hover:bg-bp-surface/50 last:border-b-0"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="rounded border border-bp-border p-1.5 text-bp-muted transition-colors hover:border-bp-border-strong hover:text-bp-white disabled:opacity-40"
                  :disabled="index === 0"
                  aria-label="上移"
                  @click="moveUp(index)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  class="rounded border border-bp-border p-1.5 text-bp-muted transition-colors hover:border-bp-border-strong hover:text-bp-white disabled:opacity-40"
                  :disabled="index === draft.length - 1"
                  aria-label="下移"
                  @click="moveDown(index)"
                >
                  ↓
                </button>
                <span class="ml-2 text-xs text-bp-muted">{{ index + 1 }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <input
                :value="item.customLabelZh ?? ''"
                type="text"
                class="w-full max-w-[140px] rounded border border-bp-border bg-bp-deep px-3 py-1.5 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
                :placeholder="displayPlaceholderZh(item)"
                @input="(e) => updateField(item.id, 'customLabelZh', (e.target as HTMLInputElement).value)"
              />
            </td>
            <td class="px-4 py-3">
              <input
                :value="item.customLabelEn ?? ''"
                type="text"
                class="w-full max-w-[140px] rounded border border-bp-border bg-bp-deep px-3 py-1.5 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
                :placeholder="displayPlaceholderEn(item)"
                @input="(e) => updateField(item.id, 'customLabelEn', (e.target as HTMLInputElement).value)"
              />
            </td>
            <td class="px-4 py-3">
              <input
                :value="item.customSubtitleZh ?? ''"
                type="text"
                class="w-full max-w-[180px] rounded border border-bp-border bg-bp-deep px-3 py-1.5 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
                :placeholder="item.subtitleKey ? t(item.subtitleKey) : ''"
                @input="(e) => updateField(item.id, 'customSubtitleZh', (e.target as HTMLInputElement).value)"
              />
            </td>
            <td class="px-4 py-3">
              <input
                :value="item.customSubtitleEn ?? ''"
                type="text"
                class="w-full max-w-[180px] rounded border border-bp-border bg-bp-deep px-3 py-1.5 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
                :placeholder="item.subtitleKey ? t(item.subtitleKey) : ''"
                @input="(e) => updateField(item.id, 'customSubtitleEn', (e.target as HTMLInputElement).value)"
              />
            </td>
            <td class="px-4 py-3">
              <input
                :value="item.path"
                type="text"
                class="w-full max-w-[140px] rounded border border-bp-border bg-bp-deep px-3 py-1.5 font-mono text-xs text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
                placeholder="/path"
                @input="(e) => updateField(item.id, 'path', (e.target as HTMLInputElement).value)"
              />
            </td>
            <td class="px-4 py-3" :title="t('admin.menu_is_parent_hint')">
              <label class="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  :checked="!!item.isParentMenu"
                  class="rounded border-bp-border bg-bp-deep text-bp-accent focus:ring-bp-accent"
                  @change="(e) => updateField(item.id, 'isParentMenu', (e.target as HTMLInputElement).checked)"
                />
                <span class="text-xs text-bp-subtle">{{ t('admin.menu_is_parent') }}</span>
              </label>
            </td>
            <td class="px-4 py-3">
              <button
                type="button"
                class="rounded border px-2 py-1 text-xs transition-colors"
                :class="item.hidden
                  ? 'border-bp-muted text-bp-muted hover:border-bp-warning hover:text-bp-warning'
                  : 'border-bp-success/50 text-bp-success hover:border-bp-success'"
                @click="toggleHidden(item.id)"
              >
                {{ item.hidden ? t('admin.menu_hidden') : t('admin.menu_visible') }}
              </button>
            </td>
            <td class="px-4 py-3">
              <button
                type="button"
                class="text-sm text-bp-muted transition-colors hover:text-bp-error"
                @click="handleRemove(item.id)"
              >
                {{ t('admin.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Save / Reset buttons -->
    <div class="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        class="bp-btn-accent"
        @click="handleSave"
      >
        {{ t('admin.appearance_save') }}
      </button>
      <button
        type="button"
        class="bp-btn-primary"
        @click="syncFromStore"
      >
        {{ t('admin.cancel') }}
      </button>
    </div>
  </div>
</template>
