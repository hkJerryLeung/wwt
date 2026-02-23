<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWorksStore } from '@/stores/works'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/plugins/supabase'
import type { Work } from '@/types'

const worksStore = useWorksStore()
const { t } = useI18n()
const isEditing = ref(false)
const isSaving = ref(false)

const emptyWork = (): Partial<Work> => ({
  title_zh: '',
  title_en: '',
  description_zh: '',
  description_en: '',
  category: 'other',
  video_url: '',
  thumbnail: '',
  client: '',
  tags: [],
  sort_order: 0,
})

const form = ref<Partial<Work>>(emptyWork())
const tagsInput = ref('')

onMounted(() => {
  worksStore.fetchWorks()
})

function openNew() {
  form.value = emptyWork()
  tagsInput.value = ''
  isEditing.value = true
}

function openEdit(work: Work) {
  form.value = { ...work }
  tagsInput.value = work.tags?.join(', ') || ''
  isEditing.value = true
}

function closeEditor() {
  isEditing.value = false
}

async function handleSave() {
  isSaving.value = true
  form.value.tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
  try {
    await worksStore.saveWork(form.value)
    isEditing.value = false
    worksStore.fetchWorks()
  } catch (err) {
    console.error(err)
    alert('Save failed')
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(id: string) {
  if (!window.confirm('Delete this work?')) return
  await worksStore.deleteWork(id)
}

async function handleThumbnailUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const ext = file.name.split('.').pop()
  const { data, error } = await supabase.storage
    .from('media')
    .upload(`works/${Date.now()}.${ext}`, file)
  if (error) return alert('Upload failed')
  const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.path)
  form.value.thumbnail = urlData.publicUrl
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <h1 class="font-blueprint text-2xl tracking-wide text-bp-white">{{ t('admin.works') }}</h1>
      <button class="bp-btn-accent" @click="openNew">+ New Work</button>
    </div>

    <!-- Edit modal -->
    <div
      v-if="isEditing"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-bp-primary/80 p-4 pt-20"
    >
      <div class="w-full max-w-2xl border border-bp-border bg-bp-deep p-6">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="font-blueprint text-lg text-bp-white">
            {{ form.id ? 'Edit Work' : 'New Work' }}
          </h2>
          <button class="text-bp-muted hover:text-bp-white" @click="closeEditor">✕</button>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Title (ZH)</label>
              <input v-model="form.title_zh" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent" />
            </div>
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Title (EN)</label>
              <input v-model="form.title_en" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Description (ZH)</label>
              <textarea v-model="form.description_zh" rows="3" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent" />
            </div>
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Description (EN)</label>
              <textarea v-model="form.description_en" rows="3" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Category</label>
              <select v-model="form.category" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent">
                <option value="ad">Ad</option>
                <option value="brand">Brand</option>
                <option value="event">Event</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Client</label>
              <input v-model="form.client" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent" />
            </div>
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Sort Order</label>
              <input v-model.number="form.sort_order" type="number" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent" />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Video URL (embed)</label>
            <input v-model="form.video_url" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent" placeholder="https://www.youtube.com/embed/..." />
          </div>

          <div>
            <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Tags</label>
            <input v-model="tagsInput" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent" placeholder="tag1, tag2" />
          </div>

          <div>
            <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Thumbnail</label>
            <div v-if="form.thumbnail" class="mb-2 h-24 w-40 overflow-hidden border border-bp-border">
              <img :src="form.thumbnail" class="h-full w-full object-cover" />
            </div>
            <label class="bp-btn-primary cursor-pointer text-xs">
              Upload
              <input type="file" accept="image/*" class="hidden" @change="handleThumbnailUpload" />
            </label>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button class="bp-btn-primary" @click="closeEditor">{{ t('admin.cancel') }}</button>
            <button class="bp-btn-accent" :disabled="isSaving" @click="handleSave">
              {{ isSaving ? t('common.loading') : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Works list -->
    <div v-if="worksStore.isLoading" class="py-10 text-center">
      <span class="font-blueprint text-sm text-bp-muted">{{ t('common.loading') }}</span>
    </div>

    <div v-else-if="worksStore.works.length === 0" class="border border-dashed border-bp-border p-12 text-center">
      <p class="text-sm text-bp-muted">No works yet.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="work in worksStore.works" :key="work.id" class="bp-card overflow-hidden">
        <div class="aspect-video bg-bp-surface">
          <img v-if="work.thumbnail" :src="work.thumbnail" class="h-full w-full object-cover" />
          <div v-else class="h-full w-full bp-grid-bg-dense" />
        </div>
        <div class="p-4">
          <h3 class="text-sm font-medium text-bp-white">{{ work.title_zh || work.title_en }}</h3>
          <span class="text-[11px] text-bp-muted">{{ work.client }} · {{ work.category }}</span>
          <div class="mt-3 flex gap-2">
            <button class="text-xs text-bp-accent hover:text-bp-accent-bright" @click="openEdit(work)">Edit</button>
            <button class="text-xs text-bp-muted hover:text-bp-error" @click="handleDelete(work.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
