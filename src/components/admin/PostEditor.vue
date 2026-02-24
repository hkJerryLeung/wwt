<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { usePostsStore } from '@/stores/posts'
import { useI18n } from 'vue-i18n'
import TiptapEditor from '@/components/editor/TiptapEditor.vue'
import { supabase } from '@/plugins/supabase'
import type { SkillMainCategory, SkillSubCategory, SkillTopic } from '@/types'

const props = defineProps<{
  /** If null, creates a new post */
  postId: string | null
  /** Used to pre-fill the topic if creating a new post */
  topicId: string | null
}>()

const emit = defineEmits<{
  (e: 'saved', id: string): void
  (e: 'cancel'): void
}>()

const postsStore = usePostsStore()
const { t } = useI18n()

const isNew = computed(() => !props.postId)
const isSaving = ref(false)

const skillMains = ref<SkillMainCategory[]>([])
const skillSubs = ref<SkillSubCategory[]>([])
const skillTopics = ref<SkillTopic[]>([])

const selectedMain = ref<string>('')
const selectedSub = ref<string>('')

const form = ref({
  id: '',
  title_zh: '',
  title_en: '',
  slug: '',
  excerpt_zh: '',
  excerpt_en: '',
  content_zh: null as Record<string, unknown> | null,
  content_en: null as Record<string, unknown> | null,
  skill_topic_id: null as string | null,
  tags: [] as string[],
  featured_image: '',
  status: 'draft' as 'draft' | 'published' | 'scheduled',
  is_premium: false,
  is_recommended: false,
})

const tagsInput = ref('')

onMounted(async () => {
  const [mains, subs, topics] = await Promise.all([
    supabase.from('skill_main_categories').select('*').order('sort_order'),
    supabase.from('skill_sub_categories').select('*').order('sort_order'),
    supabase.from('skill_topics').select('*').order('sort_order')
  ])
  if (mains.data) skillMains.value = mains.data
  if (subs.data) skillSubs.value = subs.data
  if (topics.data) skillTopics.value = topics.data

  if (!isNew.value && props.postId) {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('id', props.postId)
      .single()

    if (data) {
      if (data.skill_topic_id) {
        const topic = skillTopics.value.find(t => t.id === data.skill_topic_id)
        if (topic) {
          selectedSub.value = topic.sub_id
          const sub = skillSubs.value.find(s => s.id === topic.sub_id)
          if (sub) {
            selectedMain.value = sub.main_id
          }
        }
      }

      form.value = {
        id: data.id,
        title_zh: data.title_zh,
        title_en: data.title_en,
        slug: data.slug,
        excerpt_zh: data.excerpt_zh || '',
        excerpt_en: data.excerpt_en || '',
        content_zh: data.content_zh,
        content_en: data.content_en,
        skill_topic_id: data.skill_topic_id,
        tags: data.tags || [],
        featured_image: data.featured_image || '',
        status: data.status,
        is_premium: data.is_premium,
        is_recommended: data.is_recommended ?? false,
      }
      tagsInput.value = form.value.tags.join(', ')
    }
  } else if (props.topicId) {
     form.value.skill_topic_id = props.topicId
     const topic = skillTopics.value.find(t => t.id === props.topicId)
     if (topic) {
       selectedSub.value = topic.sub_id
       const sub = skillSubs.value.find(s => s.id === topic.sub_id)
       if (sub) {
         selectedMain.value = sub.main_id
       }
     }
  }
})

const filteredSubs = computed(() => skillSubs.value.filter(s => s.main_id === selectedMain.value))
const filteredTopics = computed(() => skillTopics.value.filter(t => t.sub_id === selectedSub.value))

function handleMainChange() {
  selectedSub.value = ''
  form.value.skill_topic_id = null
}

function handleSubChange() {
  form.value.skill_topic_id = null
}

function generateSlug(title: string): string {
  if (!title) return `post-${Date.now()}`
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '')
    || `post-${Date.now()}`
}

watch(() => form.value.title_en, (newVal) => {
  if (isNew.value && newVal && !form.value.slug) {
    form.value.slug = generateSlug(newVal)
  }
})

watch(() => form.value.title_zh, (newVal) => {
  if (isNew.value && newVal && !form.value.slug && !form.value.title_en) {
    form.value.slug = generateSlug(newVal)
  }
})

function updateSlug() {
  if (isNew.value && !form.value.slug) {
    form.value.slug = generateSlug(form.value.title_en || form.value.title_zh)
  }
}

function parseTags() {
  form.value.tags = tagsInput.value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
}

async function handleSave(publish = false) {
  isSaving.value = true
  parseTags()

  try {
    // If marking as recommended on publish, check for existing recommended post
    if (publish && form.value.is_recommended && selectedMain.value) {
      const existing = await postsStore.findRecommended(selectedMain.value)
      if (existing && existing.id !== form.value.id) {
        const confirmed = confirm(
          `此分類已有推薦文章：「${existing.title_zh || existing.title_en}」\n是否覆蓋成新的推薦文章？`
        )
        if (!confirmed) {
          isSaving.value = false
          return
        }
        // Clear old recommended
        await postsStore.clearRecommended(selectedMain.value)
      }
    }

    const postData = {
      ...form.value,
      status: publish ? 'published' as const : form.value.status,
      published_at: publish ? new Date().toISOString() : undefined,
      slug: form.value.slug || generateSlug(form.value.title_en || form.value.title_zh),
    }

    if (!isNew.value && form.value.id) {
      postData.id = form.value.id
    }

    const savedId = await postsStore.savePost(postData)
    
    if (isNew.value && !form.value.id) {
      form.value.id = savedId
    }

    emit('saved', savedId)
  } catch (err: unknown) {
    console.error('Save failed:', err)
    const msg = err && typeof err === 'object' && 'message' in err
      ? String((err as { message: string }).message)
      : 'Save failed. Please check the console.'
    alert(`Save failed: ${msg}`)
  } finally {
    isSaving.value = false
  }
}

async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const ext = file.name.split('.').pop()
  const filename = `featured-${Date.now()}.${ext}`
  const { data, error } = await supabase.storage
    .from('media')
    .upload(filename, file)

  if (error) {
    alert(`Upload failed: ${error.message}. Ensure the "media" bucket exists in Supabase Storage and is public for read.`)
    return
  }

  const { data: urlData } = supabase.storage
    .from('media')
    .getPublicUrl(data.path)

  form.value.featured_image = urlData.publicUrl
  target.value = ''
}
</script>

<template>
  <div class="border border-bp-border bg-bp-deep p-6 mt-8">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h2 class="font-blueprint text-2xl tracking-wide text-bp-white">
          {{ isNew ? t('admin.new_post') : t('admin.edit_post') }}
        </h2>
      </div>
      <div class="flex gap-3">
        <button
          class="bp-btn-primary"
          @click="emit('cancel')"
        >
          {{ t('admin.cancel') }}
        </button>
        <button
          class="bp-btn-primary"
          :disabled="isSaving"
          @click="handleSave(false)"
        >
          {{ t('admin.save_draft') }}
        </button>
        <button
          class="bp-btn-accent"
          :disabled="isSaving"
          @click="handleSave(true)"
        >
          {{ t('admin.publish') }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <!-- Main editor area -->
      <div class="xl:col-span-2 space-y-6">
        <!-- Titles (side by side) -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">
              {{ t('admin.title_zh') }}
            </label>
            <input
              v-model="form.title_zh"
              class="w-full border border-bp-border bg-bp-primary px-4 py-2.5 text-sm text-bp-white placeholder-bp-muted outline-none transition-colors focus:border-bp-accent"
              placeholder="中文標題"
              @blur="updateSlug"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">
              {{ t('admin.title_en') }}
            </label>
            <input
              v-model="form.title_en"
              class="w-full border border-bp-border bg-bp-primary px-4 py-2.5 text-sm text-bp-white placeholder-bp-muted outline-none transition-colors focus:border-bp-accent"
              placeholder="English Title"
              @blur="updateSlug"
            />
          </div>
        </div>

        <!-- Slug -->
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">Slug</label>
          <input
            v-model="form.slug"
            class="w-full border border-bp-border bg-bp-primary px-4 py-2.5 font-mono text-sm text-bp-accent placeholder-bp-muted outline-none transition-colors focus:border-bp-accent"
            placeholder="post-slug"
          />
        </div>

        <!-- Chinese content editor -->
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">
            {{ t('admin.content_zh') }}
          </label>
          <div class="bg-bp-primary">
            <TiptapEditor
              v-model="form.content_zh"
              placeholder="輸入 / 開啟指令選單..."
            />
          </div>
        </div>

        <!-- English content editor -->
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">
            {{ t('admin.content_en') }}
          </label>
          <div class="bg-bp-primary">
            <TiptapEditor
              v-model="form.content_en"
              placeholder="Type / for commands..."
            />
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Status -->
        <div class="bp-card p-4">
          <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">Status</label>
          <select
            v-model="form.status"
            class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        <!-- Skills Categories -->
        <div class="bp-card p-4 space-y-4">
          <div>
            <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">Main Category</label>
            <select
              v-model="selectedMain"
              @change="handleMainChange"
              class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent"
            >
              <option value="">-- Select Main --</option>
              <option v-for="cat in skillMains" :key="cat.id" :value="cat.id">
                {{ cat.title_zh }} / {{ cat.title_en }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">Sub Category</label>
            <select
              v-model="selectedSub"
              @change="handleSubChange"
              :disabled="!selectedMain"
              class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent disabled:opacity-50"
            >
              <option value="">-- Select Sub --</option>
              <option v-for="cat in filteredSubs" :key="cat.id" :value="cat.id">
                {{ cat.title_zh }} / {{ cat.title_en }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">Skill Topic</label>
            <select
              v-model="form.skill_topic_id"
              :disabled="!selectedSub"
              class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white outline-none focus:border-bp-accent disabled:opacity-50"
            >
              <option :value="null">-- Select Topic --</option>
              <option v-for="cat in filteredTopics" :key="cat.id" :value="cat.id">
                {{ cat.title_zh }} / {{ cat.title_en }}
              </option>
            </select>
          </div>
        </div>

        <!-- Recommend -->
        <div class="bp-card p-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.is_recommended"
              type="checkbox"
              class="h-4 w-4 accent-[#FFD700]"
            />
            <span class="text-sm text-bp-subtle">Recommend</span>
          </label>
          <p class="mt-1 text-[11px] text-bp-muted">每個 Main Category 只能有一個推薦文章</p>
        </div>

        <!-- Premium -->
        <div class="bp-card p-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.is_premium"
              type="checkbox"
              class="h-4 w-4 accent-[#87CEEB]"
            />
            <span class="text-sm text-bp-subtle">Premium Content</span>
          </label>
        </div>

        <!-- Tags -->
        <div class="bp-card p-4">
          <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">Tags</label>
          <input
            v-model="tagsInput"
            class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder-bp-muted outline-none focus:border-bp-accent"
            placeholder="tag1, tag2, tag3"
            @blur="parseTags"
          />
          <div v-if="form.tags.length" class="mt-2 flex flex-wrap gap-1">
            <span
              v-for="tag in form.tags"
              :key="tag"
              class="border border-bp-border px-1.5 py-0.5 text-[10px] text-bp-accent"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Excerpts -->
        <div class="bp-card p-4 space-y-3">
          <div>
            <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">Excerpt (ZH)</label>
            <textarea
              v-model="form.excerpt_zh"
              rows="2"
              class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder-bp-muted outline-none focus:border-bp-accent"
              placeholder="中文摘要"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">Excerpt (EN)</label>
            <textarea
              v-model="form.excerpt_en"
              rows="2"
              class="w-full border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder-bp-muted outline-none focus:border-bp-accent"
              placeholder="English excerpt"
            />
          </div>
        </div>

        <!-- Featured Image -->
        <div class="bp-card p-4">
          <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">Featured Image</label>
          <div
            v-if="form.featured_image"
            class="mb-2 aspect-video overflow-hidden border border-bp-border"
          >
            <img :src="form.featured_image" class="h-full w-full object-cover" />
          </div>
          <label class="bp-btn-primary cursor-pointer justify-center w-full text-xs">
            Upload Image
            <input
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleImageUpload"
            />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
