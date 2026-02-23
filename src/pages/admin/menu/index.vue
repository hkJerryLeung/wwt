<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useFrontendNavStore } from '@/stores/frontendNav'
import type { FrontendNavItem } from '@/stores/frontendNav'

const navStore = useFrontendNavStore()
const { t } = useI18n()

function confirmReset() {
  if (!window.confirm(t('admin.menu_reset') + '?')) return
  navStore.resetToDefaults()
}

function handleAdd() {
  navStore.add({
    key: `custom-${Date.now()}`,
    path: '/',
    customLabel: '',
  })
}

function displayPlaceholderZh(item: FrontendNavItem) {
  return item.labelKey ? t(item.labelKey) : t('admin.menu_name_zh')
}
function displayPlaceholderEn(item: FrontendNavItem) {
  return item.labelKey ? t(item.labelKey) : t('admin.menu_name_en')
}
function confirmDelete(message: string, onConfirm: () => void) {
  const win = globalThis as unknown as Window
  if (typeof win.confirm === 'function' && win.confirm(message)) {
    onConfirm()
  }
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
            v-for="(item, index) in navStore.items"
            :key="item.id"
            class="border-b border-bp-border transition-colors hover:bg-bp-surface/50 last:border-b-0"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="rounded border border-bp-border p-1.5 text-bp-muted transition-colors hover:border-bp-border-strong hover:text-bp-white disabled:opacity-40"
                  :disabled="index === 0"
                  :aria-label="'上移'"
                  @click="navStore.moveUp(item.id)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  class="rounded border border-bp-border p-1.5 text-bp-muted transition-colors hover:border-bp-border-strong hover:text-bp-white disabled:opacity-40"
                  :disabled="index === navStore.items.length - 1"
                  :aria-label="'下移'"
                  @click="navStore.moveDown(item.id)"
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
                @input="(e) => navStore.updateLabelZh(item.id, (e.target as HTMLInputElement).value)"
              />
            </td>
            <td class="px-4 py-3">
              <input
                :value="item.customLabelEn ?? ''"
                type="text"
                class="w-full max-w-[140px] rounded border border-bp-border bg-bp-deep px-3 py-1.5 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
                :placeholder="displayPlaceholderEn(item)"
                @input="(e) => navStore.updateLabelEn(item.id, (e.target as HTMLInputElement).value)"
              />
            </td>
            <td class="px-4 py-3">
              <input
                :value="item.customSubtitleZh ?? ''"
                type="text"
                class="w-full max-w-[180px] rounded border border-bp-border bg-bp-deep px-3 py-1.5 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
                :placeholder="item.subtitleKey ? t(item.subtitleKey) : ''"
                @input="(e) => navStore.updateSubtitleZh(item.id, (e.target as HTMLInputElement).value)"
              />
            </td>
            <td class="px-4 py-3">
              <input
                :value="item.customSubtitleEn ?? ''"
                type="text"
                class="w-full max-w-[180px] rounded border border-bp-border bg-bp-deep px-3 py-1.5 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
                :placeholder="item.subtitleKey ? t(item.subtitleKey) : ''"
                @input="(e) => navStore.updateSubtitleEn(item.id, (e.target as HTMLInputElement).value)"
              />
            </td>
            <td class="px-4 py-3">
              <input
                :value="item.path"
                type="text"
                class="w-full max-w-[140px] rounded border border-bp-border bg-bp-deep px-3 py-1.5 font-mono text-xs text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
                placeholder="/path"
                @input="(e) => navStore.updatePath(item.id, (e.target as HTMLInputElement).value)"
              />
            </td>
            <td class="px-4 py-3" :title="t('admin.menu_is_parent_hint')">
              <label class="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  :checked="!!item.isParentMenu"
                  class="rounded border-bp-border bg-bp-deep text-bp-accent focus:ring-bp-accent"
                  @change="(e) => navStore.updateIsParentMenu(item.id, (e.target as HTMLInputElement).checked)"
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
                @click="navStore.setHidden(item.id, !item.hidden)"
              >
                {{ item.hidden ? t('admin.menu_hidden') : t('admin.menu_visible') }}
              </button>
            </td>
            <td class="px-4 py-3">
              <button
                type="button"
                class="text-sm text-bp-muted transition-colors hover:text-bp-error"
                @click="confirmDelete(t('admin.delete') + '?', () => navStore.remove(item.id))"
              >
                {{ t('admin.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
