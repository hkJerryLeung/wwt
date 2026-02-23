<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/plugins/supabase'
import type { Project } from '@/types'

const projectsStore = useProjectsStore()
const { t } = useI18n()
const isEditing = ref(false)
const isSaving = ref(false)

const emptyProject = (): Partial<Project> => ({
  name: '',
  slug: '',
  description_zh: '',
  description_en: '',
  url: '',
  screenshot: '',
  tech_stack: [],
  sort_order: 0,
  product_page: undefined,
})

const form = ref<Partial<Project>>(emptyProject())
const techInput = ref('')
const productPageJson = ref('')

onMounted(() => {
  projectsStore.fetchProjects()
})

function openNew() {
  form.value = emptyProject()
  techInput.value = ''
  productPageJson.value = ''
  isEditing.value = true
}

function openEdit(project: Project) {
  form.value = { ...project }
  techInput.value = project.tech_stack?.join(', ') || ''
  try {
    productPageJson.value = project.product_page
      ? JSON.stringify(project.product_page, null, 2)
      : ''
  } catch {
    productPageJson.value = ''
  }
  isEditing.value = true
}

function closeEditor() {
  isEditing.value = false
}

async function handleSave() {
  isSaving.value = true
  form.value.tech_stack = techInput.value.split(',').map((x) => x.trim()).filter(Boolean)
  if (productPageJson.value.trim()) {
    try {
      form.value.product_page = JSON.parse(productPageJson.value) as Project['product_page']
    } catch {
      alert('Product page JSON is invalid')
      isSaving.value = false
      return
    }
  } else {
    form.value.product_page = undefined
  }
  try {
    await projectsStore.saveProject(form.value)
    isEditing.value = false
    projectsStore.fetchProjects()
  } catch (err) {
    console.error(err)
    alert('Save failed')
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(id: string) {
  if (!window.confirm('Delete this project?')) return
  await projectsStore.deleteProject(id)
}

async function handleScreenshotUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const ext = file.name.split('.').pop()
  const { data, error } = await supabase.storage
    .from('media')
    .upload(`projects/${Date.now()}.${ext}`, file)
  if (error) return alert('Upload failed')
  const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.path)
  form.value.screenshot = urlData.publicUrl
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <h1 class="font-blueprint text-2xl tracking-wide text-bp-white">{{ t('admin.projects') }}</h1>
      <button class="bp-btn-accent" @click="openNew">+ New Project</button>
    </div>

    <!-- Edit modal -->
    <div
      v-if="isEditing"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-bp-primary/80 p-4 pt-20"
    >
      <div class="w-full max-w-xl border border-bp-border bg-bp-deep p-6">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="font-blueprint text-lg text-bp-white">
            {{ form.id ? 'Edit Project' : 'New Project' }}
          </h2>
          <button class="text-bp-muted hover:text-bp-white" @click="closeEditor">✕</button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Name</label>
            <input v-model="form.name" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent" />
          </div>

          <div>
            <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Slug (for /apps/xxx product page)</label>
            <input
              v-model="form.slug"
              class="w-full border border-bp-border bg-bp-primary px-3 py-2 font-mono text-sm text-bp-white outline-none focus:border-bp-accent"
              placeholder="e.g. super-sort"
            />
            <p class="mt-1 text-[10px] text-bp-muted">Leave empty to use name (e.g. "Super sort" → super-sort)</p>
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

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">URL</label>
              <input v-model="form.url" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent" placeholder="https://..." />
            </div>
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Sort Order</label>
              <input v-model.number="form.sort_order" type="number" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent" />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Tech Stack</label>
            <input v-model="techInput" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent" placeholder="Vue, TypeScript, Supabase" />
          </div>

          <div>
            <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Screenshot</label>
            <div v-if="form.screenshot" class="mb-2 h-28 w-48 overflow-hidden border border-bp-border">
              <img :src="form.screenshot" class="h-full w-full object-cover" alt="" />
            </div>
            <label class="bp-btn-primary cursor-pointer text-xs">
              Upload
              <input type="file" accept="image/*" class="hidden" @change="handleScreenshotUpload" />
            </label>
          </div>

          <div>
            <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Product page (Overlord-style JSON)</label>
            <textarea
              v-model="productPageJson"
              rows="12"
              class="w-full border border-bp-border bg-bp-primary px-3 py-2 font-mono text-xs text-bp-white outline-none focus:border-bp-accent"
              placeholder='{"hero":{"title":"...","subtitle":"...","price":"$75"}, "valueProposition":{}, "features":[], "testimonials":[], "faq":[], "pricing":{}, "underlings":[], "specs":{}}'
            />
            <p class="mt-1 text-[10px] text-bp-muted">Optional. JSON for hero, valueProposition, features, whatsNew, testimonials, pricing, faq, underlings, specs.</p>
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

    <!-- Projects list -->
    <div v-if="projectsStore.isLoading" class="py-10 text-center">
      <span class="font-blueprint text-sm text-bp-muted">{{ t('common.loading') }}</span>
    </div>

    <div v-else-if="projectsStore.projects.length === 0" class="border border-dashed border-bp-border p-12 text-center">
      <p class="text-sm text-bp-muted">No projects yet.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div v-for="project in projectsStore.projects" :key="project.id" class="bp-card overflow-hidden">
        <div class="aspect-video bg-bp-surface">
          <img v-if="project.screenshot" :src="project.screenshot" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center bp-grid-bg-dense">
            <span class="font-blueprint text-bp-border">{{ project.name }}</span>
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-sm font-medium text-bp-white">{{ project.name }}</h3>
          <div v-if="project.tech_stack?.length" class="mt-1 flex flex-wrap gap-1">
            <span v-for="tech in project.tech_stack" :key="tech" class="text-[10px] text-bp-accent">{{ tech }}</span>
          </div>
          <div class="mt-3 flex gap-2">
            <button class="text-xs text-bp-accent hover:text-bp-accent-bright" @click="openEdit(project)">Edit</button>
            <button class="text-xs text-bp-muted hover:text-bp-error" @click="handleDelete(project.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
