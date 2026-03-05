<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePostsStore } from '@/stores/posts'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useLocale } from '@/composables/useLocale'

const postsStore = usePostsStore()
const navStore = useFrontendNavStore()
const { t, localizedPath, localizedField } = useLocale()
const workshopPath = () => navStore.getPathByKey('workshop')

onMounted(() => {
  postsStore.fetchPosts()
})

const displayPosts = computed(() => postsStore.posts.slice(0, 6))

const fallbackImages = [
  '/images/post-obsidian-skills.png',
  '/images/post-portfolio-design.png',
  '/images/post-tofu-dishes.png',
  '/images/post-premium-content.png',
]

const imageOverrides: Record<string, string> = {
  'obsidian-skills': '/images/post-obsidian-skills.png',
  'jackie-zhang-portfolio': '/images/post-portfolio-design.png',
  'sss': '/images/post-tofu-dishes.png',
  'asdasdasda': '/images/post-premium-content.png',
}

function postImage(post: any, idx: number): string {
  if (post.slug && imageOverrides[post.slug]) return imageOverrides[post.slug]!
  return post.featured_image || fallbackImages[idx % fallbackImages.length]
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const month = d.toLocaleDateString('en', { month: 'short' }).toUpperCase()
  const day = d.getDate()
  return `${month} ${day}`
}

function postLink(post: any): string {
  try {
    const wp = workshopPath() || '/workshop'
    const slug = post?.slug || ''
    return localizedPath(`${wp}/${slug}`.replace(/\/+/g, '/'))
  } catch {
    return '/'
  }
}

/* Extract plain text from TipTap JSON content */
function extractTipTapText(node: any): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (node.text) return node.text
  if (Array.isArray(node.content)) {
    return node.content.map((n: any) => extractTipTapText(n)).join(' ')
  }
  if (Array.isArray(node)) {
    return node.map((n: any) => extractTipTapText(n)).join(' ')
  }
  return ''
}

function postDesc(post: any): string {
  try {
    const excerpt = localizedField(post?.excerpt_zh, post?.excerpt_en)
    if (excerpt) return excerpt
    const content = localizedField(post?.content_zh, post?.content_en)
    if (!content) return ''
    let plain = ''
    if (typeof content === 'object') {
      // TipTap JSON format
      plain = extractTipTapText(content).replace(/\s+/g, ' ').trim()
    } else {
      // HTML string format
      plain = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    }
    return plain.length > 200 ? plain.slice(0, 200) + '…' : plain
  } catch {
    return ''
  }
}
</script>

<template>
  <div class="fp-bg-wrapper">
  <section class="fp-section">
    <!-- Section header — sympos RUNDOWN style -->
    <div class="fp-header">
      <div class="fp-header-left">
        <span class="fp-label">FEATURED</span>
        <h2 class="fp-heading">{{ t('home.featured_title') }}</h2>
      </div>
      <div class="fp-header-right">
        <p class="fp-header-desc">{{ t('home.featured_subtitle') }}</p>
        <router-link :to="localizedPath(workshopPath())" class="fp-header-btn">
          {{ t('workshop.read_more') }}
          <svg class="fp-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </router-link>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="postsStore.isLoading" class="fp-empty">
      <span>{{ t('common.loading') }}</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="displayPosts.length === 0" class="fp-empty">
      <p>{{ t('common.no_results') }}</p>
    </div>

    <!-- Alternating 2-column grid — sympos RUNDOWN style -->
    <div v-else class="fp-grid">
      <router-link
        v-for="(post, idx) in displayPosts"
        :key="post.id"
        :to="postLink(post)"
        class="fp-row"
      >
        <!-- Text cell -->
        <div
          class="fp-text-cell"
          :class="idx % 2 === 0 ? 'fp-cell-order-1' : 'fp-cell-order-2'"
        >
          <div class="fp-text-top">
            <span class="fp-date">{{ formatDate(post.published_at || post.created_at) }}</span>
            <span class="fp-seq">{{ String(idx + 1).padStart(2, '0') }}</span>
          </div>
          <div class="fp-text-bottom">
            <span v-if="post.is_premium" class="fp-premium-badge">
              {{ t('workshop.premium_badge') }}
            </span>
            <h3 class="fp-title">
              {{ localizedField(post.title_zh, post.title_en) }}
            </h3>
            <p class="fp-desc">{{ postDesc(post) }}</p>
            <div v-if="post.tags && post.tags.length" class="fp-tags">
              <span v-for="tag in post.tags.slice(0, 3)" :key="tag">#{{ tag }}</span>
            </div>
          </div>
        </div>

        <!-- Image cell -->
        <div
          class="fp-img-cell"
          :class="idx % 2 === 0 ? 'fp-cell-order-2' : 'fp-cell-order-1'"
        >
          <img
            :src="postImage(post, idx)"
            :alt="localizedField(post.title_zh, post.title_en)"
            loading="lazy"
          />
        </div>
      </router-link>
    </div>
  </section>
  </div>
</template>

<style scoped>
/* ===== Full-width background wrapper ===== */
.fp-bg-wrapper {
  background: #ffffff;
  width: 100%;
}

/* ===== Section ===== */
.fp-section {
  padding: 6rem 0 7rem;
  max-width: 1800px;
  margin: 0 auto;
  padding-left: 2rem;
  padding-right: 2rem;
}

/* ===== Header (sympos RUNDOWN style) ===== */
.fp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 3rem;
  margin-bottom: 3.5rem;
}

.fp-header-left {
  flex: 1;
}

.fp-label {
  display: inline-block;
  font-family: var(--font-blueprint);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 1rem;
  background: var(--color-bp-accent, #990011);
  border: none;
  padding: 0.4rem 1.2rem;
  border-radius: 24px;
}

.fp-heading {
  font-family: var(--font-blueprint);
  font-size: clamp(2.4rem, 5vw, 4rem);
  font-weight: 900;
  line-height: 1.2;
  color: #111111;
  letter-spacing: -0.02em;
}

.fp-header-right {
  flex-shrink: 0;
  max-width: 340px;
  padding-top: 2.5rem;
}

.fp-header-desc {
  font-size: 18px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 1.5rem;
}

.fp-header-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-bp-accent);
  color: var(--color-bp-white);
  font-family: var(--font-blueprint);
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 0.2s ease;
}

.fp-header-btn:hover {
  background: var(--color-bp-accent-bright);
}

.fp-btn-icon {
  width: 16px;
  height: 16px;
}

/* ===== Empty / Loading ===== */
.fp-empty {
  border: 1px dashed var(--color-bp-border);
  padding: 4rem;
  text-align: center;
  font-family: var(--font-blueprint);
  font-size: 18px;
  color: var(--color-bp-muted);
}

/* ===== Grid ===== */
.fp-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ===== Row (each post) ===== */
.fp-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  text-decoration: none;
  color: inherit;
  height: 360px;
}

/* ===== Cell ordering ===== */
.fp-cell-order-1 { order: 1; }
.fp-cell-order-2 { order: 2; }

/* ===== Text cell ===== */
.fp-text-cell {
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: transparent;
  border: 1px solid #111111;
  border-radius: 2px;
  transition: background 0.2s ease;
}

.fp-row:hover .fp-text-cell {
  background: rgba(0, 0, 0, 0.03);
}

.fp-text-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.fp-date {
  font-family: var(--font-blueprint);
  font-size: 40px;
  font-weight: 400;
  color: #111111;
  line-height: 1;
}

.fp-seq {
  font-family: var(--font-blueprint);
  font-size: 32px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1;
}

.fp-text-bottom {
  margin-top: 1.5rem;
}

.fp-premium-badge {
  display: inline-block;
  border: 1px solid #c9801a;
  padding: 0.15rem 0.5rem;
  font-family: var(--font-blueprint);
  font-size: 13px;
  color: #c9801a;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.fp-title {
  font-family: var(--font-blueprint);
  font-size: 26px;
  font-weight: 400;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: #111111;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.fp-desc {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.55);
}

.fp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.fp-tags span {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.4);
}

/* ===== Image cell ===== */
.fp-img-cell {
  overflow: hidden;
  border-radius: 2px;
  background: #000000;
}

.fp-img-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.fp-row:hover .fp-img-cell img {
  transform: scale(1.03);
}

.fp-img-placeholder {
  width: 100%;
  height: 100%;
  background: #000000;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .fp-section {
    padding: 4rem 0 5rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .fp-header {
    flex-direction: column;
    gap: 1.5rem;
  }

  .fp-heading {
    font-size: 36px;
  }

  .fp-header-right {
    max-width: none;
    padding-top: 0;
  }

  .fp-row {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .fp-img-cell {
    order: 1 !important;
    aspect-ratio: 16 / 9;
  }

  .fp-text-cell {
    order: 2 !important;
    padding: 20px;
    min-height: 260px;
  }

  .fp-date {
    font-size: 28px;
  }

  .fp-seq {
    font-size: 24px;
  }

  .fp-title {
    font-size: 20px;
    letter-spacing: 1.8px;
  }
}
</style>
