<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/plugins/supabase'
import type { MediaItem } from '@/types'

const { t } = useI18n()
const mediaItems = ref<MediaItem[]>([])
const isLoading = ref(false)
const isUploading = ref(false)

onMounted(() => {
  fetchMedia()
})

async function fetchMedia() {
  isLoading.value = true
  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      mediaItems.value = data
    }
  } finally {
    isLoading.value = false
  }
}

async function handleUpload(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (!files) return

  isUploading.value = true
  try {
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { data, error } = await supabase.storage
        .from('media')
        .upload(filename, file)

      if (error) {
        console.error('Upload failed:', error)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(data.path)

      await supabase.from('media').insert({
        url: urlData.publicUrl,
        filename: file.name,
        type: file.type,
        size: file.size,
      })
    }
    await fetchMedia()
  } finally {
    isUploading.value = false
    ;(event.target as HTMLInputElement).value = ''
  }
}

async function handleDelete(item: MediaItem) {
  if (!window.confirm(`Delete ${item.filename}?`)) return

  const pathParts = item.url.split('/media/')
  const filePath = pathParts[pathParts.length - 1] ?? ''

  await supabase.storage.from('media').remove([filePath])
  await supabase.from('media').delete().eq('id', item.id)
  mediaItems.value = mediaItems.value.filter(m => m.id !== item.id)
}

function copyUrl(url: string) {
  navigator.clipboard.writeText(url)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <h1 class="font-blueprint text-2xl tracking-wide text-bp-white">{{ t('admin.media') }}</h1>
      <label class="bp-btn-accent cursor-pointer">
        {{ isUploading ? t('common.loading') : '+ Upload' }}
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          class="hidden"
          :disabled="isUploading"
          @change="handleUpload"
        />
      </label>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="py-10 text-center">
      <span class="font-blueprint text-sm text-bp-muted">{{ t('common.loading') }}</span>
    </div>

    <!-- Empty -->
    <div
      v-else-if="mediaItems.length === 0"
      class="border border-dashed border-bp-border p-12 text-center"
    >
      <p class="text-sm text-bp-muted">No media files yet. Upload some!</p>
    </div>

    <!-- Media grid -->
    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      <div
        v-for="item in mediaItems"
        :key="item.id"
        class="bp-card group overflow-hidden"
      >
        <div class="aspect-square overflow-hidden bg-bp-surface">
          <img
            v-if="item.type?.startsWith('image')"
            :src="item.url"
            :alt="item.filename"
            class="h-full w-full object-cover"
            loading="lazy"
          />
          <div v-else class="flex h-full w-full items-center justify-center bp-grid-bg-dense">
            <span class="font-mono text-xs text-bp-muted">{{ item.type }}</span>
          </div>
        </div>
        <div class="p-2">
          <p class="truncate text-[10px] text-bp-subtle">{{ item.filename }}</p>
          <p class="text-[10px] text-bp-muted">{{ formatSize(item.size) }}</p>
          <div class="mt-1 flex gap-2">
            <button
              class="text-[10px] text-bp-accent hover:text-bp-accent-bright"
              @click="copyUrl(item.url)"
            >
              Copy URL
            </button>
            <button
              class="text-[10px] text-bp-muted hover:text-bp-error"
              @click="handleDelete(item)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
