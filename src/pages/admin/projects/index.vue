<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/plugins/supabase'
import { slugify } from '@/composables/slugify'
import TiptapEditor from '@/components/editor/TiptapEditor.vue'
import type { Project, ProductPageContent } from '@/types'

const projectsStore = useProjectsStore()
const { t } = useI18n()
const isEditing = ref(false)
const isSaving = ref(false)
const saveMsg = ref('')
const editorMode = ref<'app' | 'doc'>('app')

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

/* ── Product Page visual editor ── */
const ppTab = ref<'hero' | 'value' | 'features' | 'testimonials' | 'license' | 'faq' | 'underlings' | 'specs' | 'json'>('hero')

const emptyPP = (): ProductPageContent => ({
  hero: { title: '', subtitle: '', price: '', buyUrl: '', whatsNewUrl: '', learnMoreUrl: '', docsUrl: '', downloadUrl: '', mediaUrl: '', mediaType: 'image' },
  valueProposition: { main: '', sub: null as any, emotion: '' },
  features: [],
  whatsNew: [],
  testimonials: [],
  pricing: { title: '', subtitle: '', body: null as any, licenseNote: '', price: '', buyUrl: '', roadmapUrl: '', highlights: [] },
  faq: [],
  underlings: [],
  specs: [],
})

const pp = ref<ProductPageContent>(emptyPP())
const ppJsonRaw = ref('')

function ppToJson(): string {
  try { return JSON.stringify(pp.value, null, 2) } catch { return '{}' }
}

function syncPpFromJson() {
  try {
    const parsed = JSON.parse(ppJsonRaw.value)
    pp.value = { ...emptyPP(), ...parsed }
  } catch { /* keep current */ }
}

function addFeature() {
  if (!pp.value.features) pp.value.features = []
  pp.value.features.push({ title: '', description: '', bullets: [] })
}
function removeFeature(i: number) { pp.value.features?.splice(i, 1) }

function addTestimonial() {
  if (!pp.value.testimonials) pp.value.testimonials = []
  pp.value.testimonials.push({ name: '', url: '', role: '', quote: '' })
}
function removeTestimonial(i: number) { pp.value.testimonials?.splice(i, 1) }

function addFaq() {
  if (!pp.value.faq) pp.value.faq = []
  pp.value.faq.push({ category: 'Creative', question: '', answer: '' })
}
function removeFaq(i: number) { pp.value.faq?.splice(i, 1) }

function addUnderling() {
  if (!pp.value.underlings) pp.value.underlings = []
  pp.value.underlings.push({ name: '', description: '', learnMoreUrl: '' })
}
function removeUnderling(i: number) { pp.value.underlings?.splice(i, 1) }

function addHighlight() {
  if (!pp.value.pricing) pp.value.pricing = {}
  if (!pp.value.pricing.highlights) pp.value.pricing.highlights = []
  pp.value.pricing.highlights.push({ text: '' })
}
function removeHighlight(i: number) { pp.value.pricing?.highlights?.splice(i, 1) }

const specEntries = ref<Array<{ label: string; value: string; visible?: boolean }>>([])
function addSpec() { specEntries.value.push({ label: '', value: '' }) }
function removeSpec(i: number) { specEntries.value.splice(i, 1) }

function specsToArray(): Array<{ label?: string; value?: string }> {
  return specEntries.value.filter(e => e.label.trim()).map(e => ({ label: e.label.trim(), value: e.value, visible: e.visible }))
}

function loadSpecEntries(specs?: unknown) {
  if (!specs) { specEntries.value = []; return }
  // Convert old Record<string, string> format to array
  if (Array.isArray(specs)) {
    specEntries.value = specs.map((s: any) => ({ label: s.label ?? '', value: s.value ?? '', visible: s.visible }))
  } else if (typeof specs === 'object') {
    specEntries.value = Object.entries(specs as Record<string, string>).map(([label, value]) => ({ label, value }))
  } else {
    specEntries.value = []
  }
}

/* Keep JSON tab in sync */
watch(ppTab, (newTab) => {
  if (newTab === 'json') { ppJsonRaw.value = ppToJson() }
  if (newTab === 'specs') { loadSpecEntries(pp.value.specs) }
})

onMounted(() => { projectsStore.fetchProjects() })

/* ── Docs editor state ── */
type DocStep = { id?: string; title?: string; content?: string | Record<string, unknown> }
type DocPage = { id?: string; title?: string; visible?: boolean; steps?: DocStep[] }
type DocCategory = { id?: string; title?: string; visible?: boolean; pages?: DocPage[] }

const docCategories = ref<DocCategory[]>([])
const expandedDocCat = ref<number | null>(null)
const expandedDocPage = ref<string | null>(null) // 'catIdx-pageIdx'
const expandedDocStep = ref<string | null>(null) // 'catIdx-pageIdx-stepIdx'

function genId() { return Math.random().toString(36).slice(2, 10) }

function addDocCategory() {
  docCategories.value.push({ id: genId(), title: '', visible: true, pages: [] })
  expandedDocCat.value = docCategories.value.length - 1
}
function removeDocCategory(ci: number) {
  docCategories.value.splice(ci, 1)
  expandedDocCat.value = null
}
function addDocPage(ci: number) {
  const cat = docCategories.value[ci]
  if (!cat) return
  if (!cat.pages) cat.pages = []
  cat.pages.push({ id: genId(), title: '', visible: true, steps: [] })
  expandedDocPage.value = `${ci}-${cat.pages.length - 1}`
}
function removeDocPage(ci: number, pi: number) {
  docCategories.value[ci]?.pages?.splice(pi, 1)
  expandedDocPage.value = null
}
function addDocStep(ci: number, pi: number) {
  const cat = docCategories.value[ci]
  if (!cat?.pages?.[pi]) return
  const page = cat.pages[pi]
  if (!page.steps) page.steps = []
  page.steps.push({ id: genId(), title: '', content: '' })
  expandedDocStep.value = `${ci}-${pi}-${page.steps.length - 1}`
}
function removeDocStep(ci: number, pi: number, si: number) {
  docCategories.value[ci]?.pages?.[pi]?.steps?.splice(si, 1)
  expandedDocStep.value = null
}

function loadDocsFromPP(ppData: ProductPageContent) {
  docCategories.value = ppData.docs?.categories
    ? JSON.parse(JSON.stringify(ppData.docs.categories))
    : []
}
function docsToCategories(): DocCategory[] {
  return docCategories.value.filter(c => c.title?.trim())
}

// Auto-generate slug from name for new projects
watch(() => form.value.name, (newName) => {
  if (isEditing.value && !form.value.id && newName) {
    form.value.slug = slugify(newName)
  }
})

function openNew() {
  form.value = emptyProject()
  techInput.value = ''
  pp.value = emptyPP()
  ppTab.value = 'hero'
  specEntries.value = []
  saveMsg.value = ''
  expandedItem.value = null
  editorMode.value = 'app'
  docCategories.value = []
  expandedDocCat.value = null
  expandedDocPage.value = null
  expandedDocStep.value = null
  isEditing.value = true
}

/* ── Drag-and-drop reorder ── */
const dragIdx = ref<number | null>(null)
const dragOverIdx = ref<number | null>(null)

function onDragStart(i: number) { dragIdx.value = i }
function onDragOver(e: DragEvent, i: number) { e.preventDefault(); dragOverIdx.value = i }
function onDragEnd() { dragIdx.value = null; dragOverIdx.value = null }
function onDrop<T>(arr: T[], i: number) {
  if (dragIdx.value === null || dragIdx.value === i) return
  const removed = arr.splice(dragIdx.value, 1)
  if (removed.length) arr.splice(i, 0, removed[0] as T)
  dragIdx.value = null
  dragOverIdx.value = null
}

/* ── Collapsible items ── */
const expandedItem = ref<number | null>(null)
function toggleExpand(i: number) {
  expandedItem.value = expandedItem.value === i ? null : i
}

function openEdit(project: Project) {
  form.value = { ...project }
  techInput.value = project.tech_stack?.join(', ') || ''
  pp.value = project.product_page ? JSON.parse(JSON.stringify(project.product_page)) : emptyPP()
  // Migrate old string[] highlights to new {text, visible}[] format
  if (pp.value.pricing?.highlights?.length) {
    pp.value.pricing.highlights = pp.value.pricing.highlights.map((h: any) =>
      typeof h === 'string' ? { text: h } : h
    )
  }
  loadSpecEntries(pp.value.specs)
  loadDocsFromPP(pp.value)
  ppTab.value = 'hero'
  editorMode.value = 'app'
  saveMsg.value = ''
  expandedDocCat.value = null
  expandedDocPage.value = null
  expandedDocStep.value = null
  isEditing.value = true
}

function closeEditor() {
  isEditing.value = false
  saveMsg.value = ''
}

async function handleSave() {
  isSaving.value = true
  saveMsg.value = ''
  form.value.tech_stack = techInput.value.split(',').map((x) => x.trim()).filter(Boolean)

  pp.value.specs = specsToArray()
  if (ppTab.value === 'json' && ppJsonRaw.value.trim()) { syncPpFromJson() }

  // Save docs data into pp
  const docsCateg = docsToCategories()
  if (docsCateg.length) {
    pp.value.docs = { categories: docsCateg }
  } else {
    pp.value.docs = undefined
  }

  const hasContent = pp.value.hero?.title || pp.value.features?.length || pp.value.faq?.length || docsCateg.length
  form.value.product_page = hasContent ? pp.value : undefined

  try {
    await projectsStore.saveProject(form.value)
    /* Do NOT close editor — stay on edit page */
    saveMsg.value = '✓ Saved successfully'
    projectsStore.fetchProjects()
    /* If it was a new project, update form.id so next save is an update */
    if (!form.value.id) {
      const saved = projectsStore.projects.find(p => p.slug === form.value.slug || p.name === form.value.name)
      if (saved) form.value.id = saved.id
    }
  } catch (err) {
    console.error(err)
    saveMsg.value = '✕ Save failed'
  } finally {
    isSaving.value = false
    setTimeout(() => { saveMsg.value = '' }, 4000)
  }
}

async function handleDelete(id: string) {
  if (!window.confirm('Delete this project?')) return
  await projectsStore.deleteProject(id)
}

/* Generic media upload: uploads to Supabase and returns the public URL */
const isUploading = ref(false)
async function uploadMedia(event: Event, callback: (url: string) => void) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  isUploading.value = true
  const ext = file.name.split('.').pop()
  const { data, error } = await supabase.storage
    .from('media')
    .upload(`projects/${Date.now()}.${ext}`, file)
  isUploading.value = false
  if (error) return alert('Upload failed')
  const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.path)
  callback(urlData.publicUrl)
  /* Reset the input so same file can be re-selected */
  ;(event.target as HTMLInputElement).value = ''
}
</script>

<template>
  <div>
    <!-- ===== LIST VIEW ===== -->
    <template v-if="!isEditing">
      <div class="mb-8 flex items-center justify-between">
        <h1 class="font-blueprint text-2xl tracking-wide text-bp-white">{{ t('admin.projects') }}</h1>
        <button class="bp-btn-accent" @click="openNew">+ New Project</button>
      </div>

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
    </template>

    <!-- ===== FULL-PAGE EDITOR ===== -->
    <template v-else>
      <!-- Top bar -->
      <div class="mb-6 flex items-center justify-between border-b border-bp-border pb-4">
        <div class="flex items-center gap-3">
          <button class="text-bp-muted hover:text-bp-white text-sm" @click="closeEditor">← Back</button>
          <h2 class="font-blueprint text-lg text-bp-white">
            {{ form.id ? 'Edit Project' : 'New Project' }}
          </h2>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="saveMsg" :class="['text-xs transition-opacity', saveMsg.startsWith('✓') ? 'text-bp-success' : 'text-bp-error']">
            {{ saveMsg }}
          </span>
          <span v-if="isUploading" class="text-xs text-bp-warning">Uploading...</span>
          <button class="bp-btn-accent text-sm" :disabled="isSaving" @click="handleSave">
            {{ isSaving ? t('common.loading') : 'Save' }}
          </button>
        </div>
      </div>

      <!-- ===== TOP-LEVEL PAGE MODE TAB ===== -->
      <div class="mb-6 flex gap-0">
        <button
          :class="[
            'px-5 py-2 text-xs uppercase tracking-widest transition-colors border',
            editorMode === 'app'
              ? 'bg-bp-accent/10 text-bp-accent border-bp-accent'
              : 'text-bp-muted border-bp-border hover:text-bp-white',
          ]"
          @click="editorMode = 'app'"
        >
          App Page
        </button>
        <button
          :class="[
            'px-5 py-2 text-xs uppercase tracking-widest transition-colors border border-l-0',
            editorMode === 'doc'
              ? 'bg-bp-accent/10 text-bp-accent border-bp-accent'
              : 'text-bp-muted border-bp-border hover:text-bp-white',
          ]"
          @click="editorMode = 'doc'"
        >
          Doc Page
        </button>
      </div>

      <!-- ===== APP PAGE EDITOR ===== -->
      <div v-if="editorMode === 'app'" class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- LEFT COLUMN: Basic info -->
        <div class="space-y-4">
          <h3 class="text-xs uppercase tracking-widest text-bp-muted border-b border-bp-border pb-2">Basic Info</h3>

          <div>
            <label class="pp-label">Name</label>
            <input v-model="form.name" class="pp-input" />
          </div>

          <div>
            <label class="pp-label">Slug (for /apps/xxx)</label>
            <input :value="form.slug" readonly class="pp-input font-mono bg-bp-surface cursor-not-allowed" />
            <p class="mt-1 text-[10px] text-bp-muted">由 Name 自動生成</p>
          </div>

          <div>
            <label class="pp-label">Screenshot</label>
            <div v-if="form.screenshot" class="mb-2 h-28 w-full overflow-hidden border border-bp-border rounded">
              <img :src="form.screenshot" class="h-full w-full object-cover" alt="" />
            </div>
            <div class="flex items-center gap-2">
              <label class="pp-upload-btn">
                Upload
                <input type="file" accept="image/*,video/*" class="hidden" @change="uploadMedia($event, url => form.screenshot = url)" />
              </label>
              <input v-model="form.screenshot" class="pp-input flex-1 text-xs" placeholder="or paste URL" />
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Product Page Editor -->
        <div>
          <h3 class="text-xs uppercase tracking-widest text-bp-muted border-b border-bp-border pb-2 mb-4">Product Page (Overlord-style)</h3>

          <!-- Tab bar -->
          <div class="mb-4 flex flex-wrap gap-1">
            <button
              v-for="tab in [
                { id: 'hero', label: 'Hero' },
                { id: 'value', label: 'Value' },
                { id: 'features', label: 'Features' },
                { id: 'testimonials', label: 'Reviews' },
                { id: 'license', label: 'License' },
                { id: 'faq', label: 'FAQ' },
                { id: 'underlings', label: 'Related' },
                { id: 'specs', label: 'Specs' },
                { id: 'json', label: 'JSON' },
              ]"
              :key="tab.id"
              :class="[
                'px-3 py-1.5 text-[11px] uppercase tracking-wider transition-colors',
                ppTab === tab.id
                  ? 'border border-bp-accent bg-bp-accent/10 text-bp-accent'
                  : 'border border-bp-border text-bp-muted hover:text-bp-white',
              ]"
              @click="ppTab = tab.id as typeof ppTab"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- TAB: Hero -->
          <div v-if="ppTab === 'hero'" class="space-y-3">
            <div>
              <label class="pp-label">Emotion / tagline</label>
              <input v-model="pp.valueProposition!.emotion" class="pp-input" />
            </div>
            <div>
              <label class="pp-label">Title</label>
              <input v-model="pp.hero!.title" class="pp-input" placeholder="e.g. Super Sort" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="pp-label">Media Type</label>
                <select v-model="pp.hero!.mediaType" class="pp-input">
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>
            <div>
              <label class="pp-label">Media (Hero image/video)</label>
              <div v-if="pp.hero!.mediaUrl" class="mb-2 h-32 w-full overflow-hidden border border-bp-border rounded">
                <img v-if="pp.hero!.mediaType !== 'video'" :src="pp.hero!.mediaUrl" class="h-full w-full object-cover" />
                <video v-else :src="pp.hero!.mediaUrl" class="h-full w-full object-cover" />
              </div>
              <div class="flex items-center gap-2">
                <label class="pp-upload-btn">
                  Upload
                  <input type="file" accept="image/*,video/*" class="hidden" @change="uploadMedia($event, url => pp.hero!.mediaUrl = url)" />
                </label>
                <input v-model="pp.hero!.mediaUrl" class="pp-input flex-1 text-xs" placeholder="or paste URL" />
              </div>
            </div>

            <!-- Pricing & Links -->
            <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mt-4 mb-2 border-t border-bp-border pt-3">Pricing & Links</h4>
            <div>
              <label class="pp-label">Price</label>
              <input v-model="pp.pricing!.price" class="pp-input" placeholder="$75.00 USD" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="pp-label">Buy URL</label>
                <input v-model="pp.pricing!.buyUrl" class="pp-input" />
              </div>
            </div>

            <!-- Button Labels -->
            <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mt-4 mb-2 border-t border-bp-border pt-3">Button Labels</h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="pp-label">Buy 按鈕文字</label>
                <input v-model="pp.hero!.buyLabel" class="pp-input" placeholder="BUY NOW" />
              </div>
              <div>
                <label class="pp-label">Learn More 文字</label>
                <input v-model="pp.hero!.learnMoreLabel" class="pp-input" placeholder="LEARN MORE" />
              </div>
              <div>
                <label class="pp-label">Docs 按鈕文字</label>
                <input v-model="pp.hero!.docsLabel" class="pp-input" placeholder="DOCS" />
              </div>
              <div>
                <label class="pp-label">Download 按鈕文字</label>
                <input v-model="pp.hero!.downloadLabel" class="pp-input" placeholder="DOWNLOAD" />
              </div>
            </div>

          </div>

          <!-- TAB: Value Proposition -->
          <div v-if="ppTab === 'value'" class="space-y-3">
            <div>
              <label class="pp-label">Main headline</label>
              <input v-model="pp.valueProposition!.main" class="pp-input" />
            </div>
            <div>
              <label class="pp-label">Sub description</label>
              <div class="bg-bp-primary">
                <TiptapEditor v-model="pp.valueProposition!.sub" placeholder="描述文字，支援 Markdown..." />
              </div>
            </div>

          </div>

          <!-- TAB: Features -->
          <div v-if="ppTab === 'features'" class="space-y-1">
            <div
              v-for="(feat, i) in pp.features" :key="i"
              draggable="true"
              :class="['border border-bp-border transition-colors', dragOverIdx === i ? 'border-bp-accent' : '']"
              @dragstart="onDragStart(i)" @dragover="onDragOver($event, i)"
              @drop="onDrop(pp.features!, i)" @dragend="onDragEnd"
            >
              <!-- Collapsed header -->
              <div class="flex items-center gap-2 px-3 py-2 cursor-pointer select-none" @click="toggleExpand(i)">
                <span class="cursor-grab text-bp-muted hover:text-bp-white" @mousedown.stop>⠿</span>
                <span :class="['flex-1 text-sm truncate', feat.visible === false ? 'text-bp-muted line-through' : 'text-bp-white']">{{ feat.title || `Feature ${i + 1}` }}</span>
                <button class="pp-eye-btn" :title="feat.visible === false ? '顯示' : '隱藏'" @click.stop="feat.visible = feat.visible === false ? true : false"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line v-if="feat.visible === false" x1="2" y1="2" x2="22" y2="22"/></svg></button>
                <button class="text-[10px] text-bp-error hover:underline" @click.stop="removeFeature(i)">✕</button>
                <span class="text-[10px] text-bp-muted">{{ expandedItem === i ? '▲' : '▼' }}</span>
              </div>
              <!-- Expanded form -->
              <div v-if="expandedItem === i" class="px-3 pb-3 space-y-2 border-t border-bp-border">
                <input v-model="feat.title" class="pp-input" placeholder="Title" />
                <div>
                  <label class="pp-label">Description</label>
                  <div class="bg-bp-primary">
                    <TiptapEditor v-model="feat.description" placeholder="功能描述，支援 Markdown..." />
                  </div>
                </div>
                <div>
                  <label class="pp-label">Image / Video</label>
                  <div v-if="feat.imageUrl" class="mb-2 aspect-video max-h-32 overflow-hidden border border-bp-border">
                    <img :src="feat.imageUrl" class="h-full w-full object-cover" />
                  </div>
                  <div class="flex items-center gap-2">
                    <label class="pp-upload-btn">
                      Upload
                      <input type="file" accept="image/*,video/*" class="hidden" @change="uploadMedia($event, url => feat.imageUrl = url)" />
                    </label>
                    <input v-model="feat.imageUrl" class="pp-input flex-1 text-xs" placeholder="or paste URL" />
                  </div>
                </div>
              </div>
            </div>
            <button class="text-xs text-bp-accent hover:underline" @click="addFeature">+ Add feature</button>
          </div>

          <!-- TAB: Testimonials -->
          <div v-if="ppTab === 'testimonials'" class="space-y-1">
            <div
              v-for="(tst, i) in pp.testimonials" :key="i"
              draggable="true"
              :class="['border border-bp-border transition-colors', dragOverIdx === i ? 'border-bp-accent' : '']"
              @dragstart="onDragStart(i)" @dragover="onDragOver($event, i)"
              @drop="onDrop(pp.testimonials!, i)" @dragend="onDragEnd"
            >
              <div class="flex items-center gap-2 px-3 py-2 cursor-pointer select-none" @click="toggleExpand(i)">
                <span class="cursor-grab text-bp-muted hover:text-bp-white" @mousedown.stop>⠿</span>
                <span :class="['flex-1 text-sm truncate', tst.visible === false ? 'text-bp-muted line-through' : 'text-bp-white']">{{ tst.name || `Review ${i + 1}` }}</span>
                <button class="pp-eye-btn" :title="tst.visible === false ? '顯示' : '隱藏'" @click.stop="tst.visible = tst.visible === false ? true : false"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line v-if="tst.visible === false" x1="2" y1="2" x2="22" y2="22"/></svg></button>
                <button class="text-[10px] text-bp-error hover:underline" @click.stop="removeTestimonial(i)">✕</button>
                <span class="text-[10px] text-bp-muted">{{ expandedItem === i ? '▲' : '▼' }}</span>
              </div>
              <div v-if="expandedItem === i" class="px-3 pb-3 space-y-2 border-t border-bp-border">
                <div class="grid grid-cols-2 gap-2">
                  <input v-model="tst.name" class="pp-input" placeholder="Name" />
                  <input v-model="tst.role" class="pp-input" placeholder="Role" />
                </div>
                <input v-model="tst.url" class="pp-input" placeholder="Website URL" />
                <textarea v-model="tst.quote" rows="3" class="pp-input" placeholder="Quote" />
              </div>
            </div>
            <button class="text-xs text-bp-accent hover:underline" @click="addTestimonial">+ Add testimonial</button>
          </div>



          <!-- TAB: License -->
          <div v-if="ppTab === 'license'" class="space-y-3">
            <div>
              <label class="pp-label">Title</label>
              <input v-model="pp.pricing!.title" class="pp-input" placeholder="One-time purchase" />
            </div>
            <div>
              <label class="pp-label">Subtitle</label>
              <input v-model="pp.pricing!.subtitle" class="pp-input" placeholder="Because subscriptions are lame." />
            </div>
            <div>
              <label class="pp-label">Body</label>
              <div class="bg-bp-primary">
                <TiptapEditor v-model="pp.pricing!.body" placeholder="授權說明，支援 Markdown..." />
              </div>
            </div>
            <div>
              <label class="pp-label">License Note</label>
              <input v-model="pp.pricing!.licenseNote" class="pp-input" />
            </div>


            <!-- Highlights (right-side feature list) -->
            <div class="mt-4 border-t border-bp-border pt-4">
              <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mb-3">Highlights (right-side feature list)</h4>
              <div class="space-y-1">
                <div
                  v-for="(hl, i) in pp.pricing!.highlights" :key="i"
                  draggable="true"
                  :class="['border border-bp-border transition-colors', dragOverIdx === i ? 'border-bp-accent' : '']"
                  @dragstart="onDragStart(i)" @dragover="onDragOver($event, i)"
                  @drop="onDrop(pp.pricing!.highlights!, i)" @dragend="onDragEnd"
                >
                  <div class="flex items-center gap-2 px-3 py-2">
                    <span class="cursor-grab text-bp-muted hover:text-bp-white" @mousedown.stop>⠿</span>
                    <input v-model="hl.text" class="pp-input flex-1" placeholder="e.g. SAML-based SSO" />
                    <button class="pp-eye-btn" :title="hl.visible === false ? '顯示' : '隱藏'" @click.stop="hl.visible = hl.visible === false ? true : false"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line v-if="hl.visible === false" x1="2" y1="2" x2="22" y2="22"/></svg></button>
                    <button class="text-[10px] text-bp-error hover:underline" @click.stop="removeHighlight(i)">✕</button>
                  </div>
                </div>
              </div>
              <button class="text-xs text-bp-accent hover:underline mt-2" @click="addHighlight">+ Add highlight</button>
            </div>
          </div>

          <!-- TAB: FAQ -->
          <div v-if="ppTab === 'faq'" class="space-y-1">
            <div
              v-for="(item, i) in pp.faq" :key="i"
              draggable="true"
              :class="['border border-bp-border transition-colors', dragOverIdx === i ? 'border-bp-accent' : '']"
              @dragstart="onDragStart(i)" @dragover="onDragOver($event, i)"
              @drop="onDrop(pp.faq!, i)" @dragend="onDragEnd"
            >
              <div class="flex items-center gap-2 px-3 py-2 cursor-pointer select-none" @click="toggleExpand(i)">
                <span class="cursor-grab text-bp-muted hover:text-bp-white" @mousedown.stop>⠿</span>
                <span :class="['flex-1 text-sm truncate', item.visible === false ? 'text-bp-muted line-through' : 'text-bp-white']">{{ item.question || `FAQ ${i + 1}` }}</span>
                <button class="pp-eye-btn" :title="item.visible === false ? '顯示' : '隱藏'" @click.stop="item.visible = item.visible === false ? true : false"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line v-if="item.visible === false" x1="2" y1="2" x2="22" y2="22"/></svg></button>
                <button class="text-[10px] text-bp-error hover:underline" @click.stop="removeFaq(i)">✕</button>
                <span class="text-[10px] text-bp-muted">{{ expandedItem === i ? '▲' : '▼' }}</span>
              </div>
              <div v-if="expandedItem === i" class="px-3 pb-3 space-y-2 border-t border-bp-border">
                <select v-model="item.category" class="pp-input">
                  <option value="Creative">Creative</option>
                  <option value="Technical">Technical</option>
                  <option value="License">License</option>
                </select>
                <input v-model="item.question" class="pp-input" placeholder="Question" />
                <div>
                  <label class="pp-label">Answer</label>
                  <div class="bg-bp-primary">
                    <TiptapEditor v-model="item.answer" placeholder="回答，支援 Markdown..." />
                  </div>
                </div>
              </div>
            </div>
            <button class="text-xs text-bp-accent hover:underline" @click="addFaq">+ Add FAQ</button>
          </div>

          <!-- TAB: Underlings (Related Products) -->
          <div v-if="ppTab === 'underlings'" class="space-y-1">
            <div
              v-for="(u, i) in pp.underlings" :key="i"
              draggable="true"
              :class="['border border-bp-border transition-colors', dragOverIdx === i ? 'border-bp-accent' : '']"
              @dragstart="onDragStart(i)" @dragover="onDragOver($event, i)"
              @drop="onDrop(pp.underlings!, i)" @dragend="onDragEnd"
            >
              <div class="flex items-center gap-2 px-3 py-2 cursor-pointer select-none" @click="toggleExpand(i)">
                <span class="cursor-grab text-bp-muted hover:text-bp-white" @mousedown.stop>⠿</span>
                <span :class="['flex-1 text-sm truncate', u.visible === false ? 'text-bp-muted line-through' : 'text-bp-white']">{{ u.name || `Related ${i + 1}` }}</span>
                <button class="pp-eye-btn" :title="u.visible === false ? '顯示' : '隱藏'" @click.stop="u.visible = u.visible === false ? true : false"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line v-if="u.visible === false" x1="2" y1="2" x2="22" y2="22"/></svg></button>
                <button class="text-[10px] text-bp-error hover:underline" @click.stop="removeUnderling(i)">✕</button>
                <span class="text-[10px] text-bp-muted">{{ expandedItem === i ? '▲' : '▼' }}</span>
              </div>
              <div v-if="expandedItem === i" class="px-3 pb-3 space-y-2 border-t border-bp-border">
                <input v-model="u.name" class="pp-input" placeholder="Name" />
                <textarea v-model="u.description" rows="2" class="pp-input" placeholder="Description" />
                <input v-model="u.learnMoreUrl" class="pp-input" placeholder="Learn more URL" />
              </div>
            </div>
            <button class="text-xs text-bp-accent hover:underline" @click="addUnderling">+ Add related product</button>
          </div>

          <!-- TAB: Specs -->
          <div v-if="ppTab === 'specs'" class="space-y-1">
            <div
              v-for="(entry, i) in specEntries" :key="i"
              draggable="true"
              :class="['border border-bp-border transition-colors', dragOverIdx === i ? 'border-bp-accent' : '']"
              @dragstart="onDragStart(i)" @dragover="onDragOver($event, i)"
              @drop="onDrop(specEntries, i)" @dragend="onDragEnd"
            >
              <div class="flex items-center gap-2 px-3 py-2 cursor-pointer select-none" @click="toggleExpand(i)">
                <span class="cursor-grab text-bp-muted hover:text-bp-white" @mousedown.stop>⠿</span>
                <span :class="['flex-1 text-sm truncate', entry.visible === false ? 'text-bp-muted line-through' : 'text-bp-white']">{{ entry.label || `Spec ${i + 1}` }}</span>
                <button class="pp-eye-btn" :title="entry.visible === false ? '顯示' : '隱藏'" @click.stop="entry.visible = entry.visible === false ? true : false"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line v-if="entry.visible === false" x1="2" y1="2" x2="22" y2="22"/></svg></button>
                <button class="text-[10px] text-bp-error hover:underline" @click.stop="removeSpec(i)">✕</button>
                <span class="text-[10px] text-bp-muted">{{ expandedItem === i ? '▲' : '▼' }}</span>
              </div>
              <div v-if="expandedItem === i" class="px-3 pb-3 space-y-2 border-t border-bp-border">
                <div>
                  <label class="pp-label">Label</label>
                  <input v-model="entry.label" class="pp-input" placeholder="e.g. PRICE, OS SUPPORT" />
                </div>
                <div>
                  <label class="pp-label">Value (supports HTML: &lt;ul&gt;&lt;li&gt;, &lt;a href&gt;, &lt;br&gt;)</label>
                  <textarea v-model="entry.value" rows="3" class="pp-input" placeholder="e.g. $75.00 USD" />
                </div>
              </div>
            </div>
            <button class="text-xs text-bp-accent hover:underline" @click="addSpec">+ Add spec</button>
          </div>

          <!-- TAB: JSON (fallback) -->
          <div v-if="ppTab === 'json'">
            <textarea
              v-model="ppJsonRaw"
              rows="20"
              class="w-full border border-bp-border bg-bp-primary px-3 py-2 font-mono text-xs text-bp-white outline-none focus:border-bp-accent"
            />
            <p class="mt-1 text-[10px] text-bp-muted">Raw JSON — edits here will overwrite visual changes when saving.</p>
          </div>
        </div>
      </div>

      <!-- ===== DOC PAGE EDITOR ===== -->
      <div v-else-if="editorMode === 'doc'" class="space-y-4">
        <h3 class="text-xs uppercase tracking-widest text-bp-muted border-b border-bp-border pb-2">Documentation Categories</h3>

        <!-- Category list -->
        <div
          v-for="(cat, ci) in docCategories" :key="cat.id ?? ci"
          class="border border-bp-border"
        >
          <!-- Category header -->
          <div class="flex items-center gap-2 px-3 py-2 cursor-pointer select-none" @click="expandedDocCat = expandedDocCat === ci ? null : ci">
            <span class="cursor-grab text-bp-muted hover:text-bp-white" @mousedown.stop>⠿</span>
            <span :class="['flex-1 text-sm truncate', cat.visible === false ? 'text-bp-muted line-through' : 'text-bp-white']">{{ cat.title || `Category ${ci + 1}` }}</span>
            <button class="pp-eye-btn" :title="cat.visible === false ? '顯示' : '隱藏'" @click.stop="cat.visible = cat.visible === false ? true : false"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line v-if="cat.visible === false" x1="2" y1="2" x2="22" y2="22"/></svg></button>
            <button class="text-[10px] text-bp-error hover:underline" @click.stop="removeDocCategory(ci)">✕</button>
            <span class="text-[10px] text-bp-muted">{{ expandedDocCat === ci ? '▲' : '▼' }}</span>
          </div>

          <!-- Category expanded -->
          <div v-if="expandedDocCat === ci" class="px-3 pb-3 space-y-3 border-t border-bp-border">
            <div>
              <label class="pp-label">Category Title</label>
              <input v-model="cat.title" class="pp-input" placeholder="e.g. Download + install" />
            </div>

            <!-- Pages list -->
            <div class="mt-3">
              <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mb-2">Pages</h4>
              <div
                v-for="(page, pi) in cat.pages" :key="page.id ?? pi"
                class="border border-bp-border mb-1"
              >
                <!-- Page header -->
                <div class="flex items-center gap-2 px-3 py-2 cursor-pointer select-none" @click="expandedDocPage = expandedDocPage === `${ci}-${pi}` ? null : `${ci}-${pi}`">
                  <span class="cursor-grab text-bp-muted hover:text-bp-white" @mousedown.stop>⠿</span>
                  <span :class="['flex-1 text-sm truncate', page.visible === false ? 'text-bp-muted line-through' : 'text-bp-white']">{{ page.title || `Page ${pi + 1}` }}</span>
                  <button class="pp-eye-btn" :title="page.visible === false ? '顯示' : '隱藏'" @click.stop="page.visible = page.visible === false ? true : false"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line v-if="page.visible === false" x1="2" y1="2" x2="22" y2="22"/></svg></button>
                  <button class="text-[10px] text-bp-error hover:underline" @click.stop="removeDocPage(ci, pi)">✕</button>
                  <span class="text-[10px] text-bp-muted">{{ expandedDocPage === `${ci}-${pi}` ? '▲' : '▼' }}</span>
                </div>

                <!-- Page expanded -->
                <div v-if="expandedDocPage === `${ci}-${pi}`" class="px-3 pb-3 space-y-3 border-t border-bp-border">
                  <div>
                    <label class="pp-label">Page Title</label>
                    <input v-model="page.title" class="pp-input" placeholder="e.g. Quickstart" />
                  </div>

                  <!-- Steps list -->
                  <div class="mt-2">
                    <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mb-2">Steps</h4>
                    <div
                      v-for="(step, si) in page.steps" :key="step.id ?? si"
                      class="border border-bp-border mb-1"
                    >
                      <!-- Step header -->
                      <div class="flex items-center gap-2 px-3 py-2 cursor-pointer select-none" @click="expandedDocStep = expandedDocStep === `${ci}-${pi}-${si}` ? null : `${ci}-${pi}-${si}`">
                        <span class="text-bp-muted text-xs font-mono">{{ si + 1 }}</span>
                        <span class="flex-1 text-sm truncate text-bp-white">{{ step.title || `Step ${si + 1}` }}</span>
                        <button class="text-[10px] text-bp-error hover:underline" @click.stop="removeDocStep(ci, pi, si)">✕</button>
                        <span class="text-[10px] text-bp-muted">{{ expandedDocStep === `${ci}-${pi}-${si}` ? '▲' : '▼' }}</span>
                      </div>

                      <!-- Step expanded -->
                      <div v-if="expandedDocStep === `${ci}-${pi}-${si}`" class="px-3 pb-3 space-y-2 border-t border-bp-border">
                        <div>
                          <label class="pp-label">Step Title</label>
                          <input v-model="step.title" class="pp-input" placeholder="e.g. DOWNLOAD" />
                        </div>
                        <div>
                          <label class="pp-label">Content</label>
                          <div class="bg-bp-primary">
                            <TiptapEditor v-model="step.content" placeholder="步驟內容，支援 Markdown..." />
                          </div>
                        </div>
                      </div>
                    </div>
                    <button class="text-xs text-bp-accent hover:underline" @click="addDocStep(ci, pi)">+ Add step</button>
                  </div>
                </div>
              </div>
              <button class="text-xs text-bp-accent hover:underline" @click="addDocPage(ci)">+ Add page</button>
            </div>
          </div>
        </div>
        <button class="text-xs text-bp-accent hover:underline" @click="addDocCategory">+ Add category</button>
      </div>

    </template>
  </div>
</template>


<style scoped>
.pp-label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.4);
}

.pp-input {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(16, 16, 16, 1);
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
  color: #fff;
  outline: none;
  transition: border-color 0.2s;
}

.pp-input:focus {
  border-color: #990011;
}

.pp-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.pp-upload-btn:hover {
  border-color: #990011;
  color: #fff;
}

.pp-eye-btn {
  display: inline-flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.15s;
  padding: 2px;
}
.pp-eye-btn:hover {
  color: #fff;
}
</style>
