<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '@/plugins/supabase'
import type { SkillMainCategory, SkillSubCategory, SkillTopic, Post } from '@/types'
import { useI18n } from 'vue-i18n'
import PostEditor from '@/components/admin/PostEditor.vue'

const { t } = useI18n()

// Data state
const mainCategories = ref<SkillMainCategory[]>([])
const subCategories = ref<SkillSubCategory[]>([])
const topics = ref<SkillTopic[]>([])
const posts = ref<Post[]>([])

// Selection state
const selectedMainId = ref<string | null>(null)
const selectedSubId = ref<string | null>(null)
const selectedTopicId = ref<string | null>(null)

// Post Editor State
const activePostId = ref<string | 'new' | null>(null)

// Compute filtered lists
const filteredSubs = computed(() => {
  if (!selectedMainId.value) return []
  return subCategories.value.filter(s => s.main_id === selectedMainId.value)
})

const filteredTopics = computed(() => {
  if (!selectedSubId.value) return []
  return topics.value.filter(t => t.sub_id === selectedSubId.value)
})

const filteredPosts = computed(() => {
  if (!selectedTopicId.value) return []
  return posts.value.filter(p => p.skill_topic_id === selectedTopicId.value)
})

const isLoading = ref(true)

async function loadData() {
  isLoading.value = true
  const [resMain, resSub, resTopic, resPost] = await Promise.all([
    supabase.from('skill_main_categories').select('*').order('sort_order'),
    supabase.from('skill_sub_categories').select('*').order('sort_order'),
    supabase.from('skill_topics').select('*').order('sort_order'),
    supabase.from('posts').select('*').order('created_at', { ascending: false }),
  ])
  if (resMain.data) mainCategories.value = resMain.data
  if (resSub.data) subCategories.value = resSub.data
  if (resTopic.data) topics.value = resTopic.data
  if (resPost.data) posts.value = resPost.data as Post[]
  isLoading.value = false
}

onMounted(() => {
  loadData()
})

// Modals state for editing
const isEditing = ref(false)
const editType = ref<'main' | 'sub' | 'topic'>('main')
const isSaving = ref(false)

const form = ref<any>({
  id: '',
  title_zh: '',
  title_en: '',
  slug: '',
  sort_order: 0,
})

function openNew(type: 'main' | 'sub' | 'topic') {
  editType.value = type
  form.value = { id: '', title_zh: '', title_en: '', slug: '', sort_order: 0 }
  if (type === 'sub') form.value.main_id = selectedMainId.value
  if (type === 'topic') form.value.sub_id = selectedSubId.value
  isEditing.value = true
}

function openEdit(type: 'main' | 'sub' | 'topic', item: any) {
  editType.value = type
  form.value = { ...item }
  isEditing.value = true
}

function closeEditor() {
  isEditing.value = false
}

function slugify(text: string): string {
  if (!text?.trim()) return ''
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

// Auto-generate slug for new items based on title_en or title_zh
watch(() => [form.value.title_en, form.value.title_zh], ([en, zh]) => {
  if (isEditing.value && !form.value.id && (en || zh)) {
    const base = slugify((en as string) || (zh as string))
    if (base && (!form.value.slug || form.value.slug === slugify((en as string)?.slice(0, -1) ?? ''))) {
      form.value.slug = base
    }
  }
}, { deep: true })

/** 確保 slug 在該表中唯一，若重複則自動加上數字後綴 (e.g. design → design-2) */
async function ensureUniqueSlug(table: string, baseSlug: string): Promise<string> {
  const slug = baseSlug || 'item'
  const { data: exact } = await supabase.from(table).select('slug').eq('slug', slug)
  const { data: prefix } = await supabase.from(table).select('slug').like('slug', `${slug}-%`)
  const used = new Set([
    ...(exact ?? []).map((r: { slug: string }) => r.slug),
    ...(prefix ?? []).map((r: { slug: string }) => r.slug),
  ])
  if (!used.size) return slug
  let candidate = slug
  let n = 2
  while (used.has(candidate)) {
    candidate = `${slug}-${n}`
    n += 1
  }
  return candidate
}

async function handleSave() {
  isSaving.value = true
  try {
    const table = editType.value === 'main' ? 'skill_main_categories' :
                  editType.value === 'sub' ? 'skill_sub_categories' : 'skill_topics'
                  
    const payload = { ...form.value }
    if (!payload.id) {
      delete payload.id
      const baseSlug = (payload.slug && String(payload.slug).trim()) || slugify(payload.title_en || payload.title_zh) || 'item'
      payload.slug = await ensureUniqueSlug(table, baseSlug)
      const { error } = await supabase.from(table).insert([payload])
      if (error) throw error
    } else {
      const { error } = await supabase.from(table).update(payload).eq('id', payload.id)
      if (error) throw error
    }
    
    await loadData()
    closeEditor()
  } catch (err: any) {
    alert(`Save failed: ${err.message || 'Unknown error'}`)
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(type: 'main' | 'sub' | 'topic', id: string) {
  if (!window.confirm('Are you sure you want to delete this item?')) return
  const table = type === 'main' ? 'skill_main_categories' :
                type === 'sub' ? 'skill_sub_categories' : 'skill_topics'
                
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) {
    alert(`Delete failed: ${error.message}`)
  } else {
    // If we delete the currently selected item, unselect it
    if (type === 'main' && selectedMainId.value === id) {
      selectedMainId.value = null
      selectedSubId.value = null
      selectedTopicId.value = null
    } else if (type === 'sub' && selectedSubId.value === id) {
      selectedSubId.value = null
      selectedTopicId.value = null
    } else if (type === 'topic' && selectedTopicId.value === id) {
      selectedTopicId.value = null
    }
    await loadData()
  }
}

function selectMain(id: string) {
  selectedMainId.value = id
  selectedSubId.value = null // reset sub selection
  selectedTopicId.value = null
}

function selectSub(id: string) {
  selectedSubId.value = id
  selectedTopicId.value = null
}

function selectTopic(id: string) {
  selectedTopicId.value = id
}

function createNewPost() {
  activePostId.value = 'new'
}

function selectPost(post: Post) {
  activePostId.value = post.id
}

async function handlePostSaved(savedId: string) {
  activePostId.value = savedId
  await loadData()
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <h1 class="font-blueprint text-2xl tracking-wide text-bp-white">AI Skills</h1>
    </div>

    <!-- Edit modal -->
    <div
      v-if="isEditing"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-bp-primary/80 p-4 pt-20"
    >
      <div class="w-full max-w-xl border border-bp-border bg-bp-deep p-6 shadow-xl">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="font-blueprint text-lg text-bp-white">
            {{ form.id ? 'Edit' : 'New' }} {{ editType }}
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
              <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Slug</label>
              <input v-model="form.slug" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm font-mono text-bp-accent outline-none focus:border-bp-accent" :placeholder="form.id ? '' : 'Auto-generated'" />
            </div>
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wider text-bp-muted">Sort Order</label>
              <input v-model.number="form.sort_order" type="number" class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent" />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button class="bp-btn-primary" @click="closeEditor">{{ t('admin.cancel') }}</button>
            <button class="bp-btn-accent" :disabled="isSaving" @click="handleSave">
              {{ isSaving ? t('common.loading') : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 4-Column Layout -->
    <div v-if="isLoading" class="py-10 text-center">
      <span class="font-blueprint text-sm text-bp-muted">{{ t('common.loading') }}</span>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- Main Categories Box -->
      <div class="flex flex-col border border-bp-border bg-bp-deep p-4 rounded min-h-[500px]">
        <div class="flex items-center justify-between mb-4 border-b border-bp-border pb-2 shrink-0">
          <h2 class="font-blueprint text-bp-white tracking-widest text-sm uppercase">Main</h2>
          <button @click="openNew('main')" class="text-xs text-bp-accent hover:underline">+ Add</button>
        </div>
        <div class="space-y-2 flex-1 overflow-y-auto pr-1">
          <div
            v-for="item in mainCategories"
            :key="item.id"
            @click="selectMain(item.id)"
            class="group cursor-pointer p-3 rounded border transition-colors relative"
            :class="selectedMainId === item.id ? 'border-bp-accent bg-bp-surface' : 'border-transparent hover:border-bp-border'"
          >
            <div class="text-sm font-medium text-bp-white">{{ item.title_zh }} <span class="text-bp-muted ml-1">[{{ item.slug }}]</span></div>
            <div class="text-xs text-bp-subtle mt-1">{{ item.title_en }}</div>
            <!-- Actions visible on hover/select -->
            <div class="absolute right-2 top-2 hidden group-hover:flex gap-2">
              <button @click.stop="openEdit('main', item)" class="text-xs text-bp-muted hover:text-bp-accent bg-bp-deep px-1 rounded">Edit</button>
              <button @click.stop="handleDelete('main', item.id)" class="text-xs text-bp-muted hover:text-bp-error bg-bp-deep px-1 rounded">Del</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sub Categories Box -->
      <div class="flex flex-col border border-bp-border bg-bp-deep p-4 rounded min-h-[500px]">
        <div class="flex items-center justify-between mb-4 border-b border-bp-border pb-2 shrink-0">
          <h2 class="font-blueprint text-bp-white tracking-widest text-sm uppercase">Sub (Groups)</h2>
          <button v-if="selectedMainId" @click="openNew('sub')" class="text-xs text-bp-accent hover:underline">+ Add</button>
        </div>
        <div class="space-y-2 flex-1 overflow-y-auto pr-1">
          <div v-if="!selectedMainId" class="text-xs text-bp-muted text-center pt-10">Select a Main Category first</div>
          <div v-else-if="filteredSubs.length === 0" class="text-xs text-bp-muted text-center pt-10">No sub-categories found</div>
          
          <div
            v-for="item in filteredSubs"
            :key="item.id"
            @click="selectSub(item.id)"
            class="group cursor-pointer p-3 rounded border transition-colors relative"
            :class="selectedSubId === item.id ? 'border-bp-accent bg-bp-surface' : 'border-transparent hover:border-bp-border'"
          >
            <div class="text-sm font-medium text-bp-white">{{ item.title_zh }} <span class="text-bp-muted ml-1">[{{ item.slug }}]</span></div>
            <div class="text-xs text-bp-subtle mt-1">{{ item.title_en }}</div>
            <div class="absolute right-2 top-2 hidden group-hover:flex gap-2">
              <button @click.stop="openEdit('sub', item)" class="text-xs text-bp-muted hover:text-bp-accent bg-bp-deep px-1 rounded">Edit</button>
              <button @click.stop="handleDelete('sub', item.id)" class="text-xs text-bp-muted hover:text-bp-error bg-bp-deep px-1 rounded">Del</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Topics Box -->
      <div class="flex flex-col border border-bp-border bg-bp-deep p-4 rounded min-h-[500px]">
        <div class="flex items-center justify-between mb-4 border-b border-bp-border pb-2 shrink-0">
          <h2 class="font-blueprint text-bp-white tracking-widest text-sm uppercase">Topics</h2>
          <button v-if="selectedSubId" @click="openNew('topic')" class="text-xs text-bp-accent hover:underline">+ Add</button>
        </div>
        <div class="space-y-2 flex-1 overflow-y-auto pr-1">
          <div v-if="!selectedSubId" class="text-xs text-bp-muted text-center pt-10">Select a Sub Category first</div>
          <div v-else-if="filteredTopics.length === 0" class="text-xs text-bp-muted text-center pt-10">No topics found</div>
          
          <div
            v-for="item in filteredTopics"
            :key="item.id"
            @click="selectTopic(item.id)"
            class="group cursor-pointer p-3 rounded border transition-colors relative"
            :class="selectedTopicId === item.id ? 'border-bp-accent bg-bp-surface' : 'border-transparent hover:border-bp-border'"
          >
            <div class="text-sm font-medium text-bp-white">{{ item.title_zh }} <span class="text-bp-muted ml-1">[{{ item.slug }}]</span></div>
            <div class="text-xs text-bp-subtle mt-1">{{ item.title_en }}</div>
            <div class="absolute right-2 top-2 hidden group-hover:flex gap-2">
              <button @click.stop="openEdit('topic', item)" class="text-xs text-bp-muted hover:text-bp-accent bg-bp-deep px-1 rounded">Edit</button>
              <button @click.stop="handleDelete('topic', item.id)" class="text-xs text-bp-muted hover:text-bp-error bg-bp-deep px-1 rounded">Del</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Articles Box -->
      <div class="flex flex-col border border-bp-border bg-bp-deep p-4 rounded min-h-[500px]">
        <div class="flex items-center justify-between mb-4 border-b border-bp-border pb-2 shrink-0">
          <h2 class="font-blueprint text-bp-white tracking-widest text-sm uppercase">Articles</h2>
          <button v-if="selectedTopicId" @click="createNewPost" class="text-xs text-bp-accent hover:underline">+ Add</button>
        </div>
        <div class="space-y-2 flex-1 overflow-y-auto pr-1">
          <div v-if="!selectedTopicId" class="text-xs text-bp-muted text-center pt-10">Select a Topic first</div>
          <div v-else-if="filteredPosts.length === 0" class="text-xs text-bp-muted text-center pt-10">No articles found</div>
          
          <div
            v-for="post in filteredPosts"
            :key="post.id"
            @click="selectPost(post)"
            class="group cursor-pointer p-3 rounded border transition-colors relative"
            :class="activePostId === post.id ? 'border-bp-accent bg-bp-surface' : 'border-transparent hover:border-bp-border bg-bp-primary/50'"
          >
            <div class="text-sm font-medium text-bp-white line-clamp-1">{{ post.title_zh || post.title_en || 'Untitled' }}</div>
            <div class="text-xs text-bp-subtle mt-1 flex items-center gap-2">
              <span class="text-bp-accent">{{ post.status }}</span>
              <span v-if="post.is_recommended" class="text-[10px] text-[#FFD700] px-1 border border-[#FFD700]/50 rounded-sm">Recommend</span>
              <span v-if="post.is_premium" class="text-[10px] text-bp-warning px-1 border border-bp-warning/50 rounded-sm">Premium</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Embedded Post Editor -->
    <PostEditor
      v-if="activePostId !== null"
      :key="activePostId"
      :postId="activePostId === 'new' ? null : activePostId"
      :topicId="selectedTopicId"
      @saved="handlePostSaved"
      @cancel="activePostId = null"
      class="pb-16"
    />
  </div>
</template>

<style scoped>
/* Scrollbar styling for these columns to be neat */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}
</style>
