<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useLocale } from '@/composables/useLocale'
import { gsap } from 'gsap'
import TiptapRenderer from '@/components/editor/TiptapRenderer.vue'

const route = useRoute()
const projectsStore = useProjectsStore()
const { localizedPath } = useLocale()

const slug = computed(() => (route.params.slug as string) ?? '')
const project = computed(() => projectsStore.getBySlug(slug.value))
const hasFetched = ref(false)
const pageRef = ref<HTMLElement | null>(null)
let gsapCtx: gsap.Context | null = null

onMounted(async () => {
  await projectsStore.fetchProjects()
  hasFetched.value = true
  nextTick(() => initGsapAnimations())
})

/* ── Docs data ── */
const docsData = computed(() => project.value?.product_page?.docs)

const categories = computed(() =>
  (docsData.value?.categories ?? []).filter(c => c.visible !== false)
)

/* Active category & page */
const activeCategoryIndex = ref(0)
const activePageIndex = ref(0)

const activeCategory = computed(() => categories.value[activeCategoryIndex.value])
const visiblePages = computed(() =>
  (activeCategory.value?.pages ?? []).filter(p => p.visible !== false)
)
const activePage = computed(() => visiblePages.value[activePageIndex.value])
const steps = computed(() => activePage.value?.steps ?? [])

function selectCategory(catIdx: number) {
  activeCategoryIndex.value = catIdx
  activePageIndex.value = 0
  activeStepId.value = steps.value[0]?.id ?? ''
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    animateContentChange()
  })
}

function selectPage(pageIdx: number) {
  activePageIndex.value = pageIdx
  activeStepId.value = steps.value[0]?.id ?? ''
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    animateContentChange()
  })
}

/* ── "On This Page" — scroll spy ── */
const activeStepId = ref('')

function onScroll() {
  const ids = steps.value.map(s => s.id).filter(Boolean) as string[]
  for (const id of [...ids].reverse()) {
    const el = document.getElementById(`step-${id}`)
    if (el && el.getBoundingClientRect().top <= 120) {
      activeStepId.value = id
      return
    }
  }
  if (ids.length) activeStepId.value = ids[0]
}

function scrollToStep(id: string) {
  const el = document.getElementById(`step-${id}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeStepId.value = id
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  gsapCtx?.revert()
})

/* Sync active step when steps change */
watch(steps, (s) => {
  if (s.length && !activeStepId.value) {
    activeStepId.value = s[0]?.id ?? ''
  }
})

/* ── GSAP Animations ── */
function initGsapAnimations() {
  if (!pageRef.value) return
  gsapCtx?.revert()

  gsapCtx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    // Sidebar slides in from left
    tl.fromTo('.docs-sidebar',
      { x: -40, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.7 }, 0)

    // Main content fades up
    tl.fromTo('.docs-main',
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.8 }, 0.15)

    // Page title
    tl.fromTo('.docs-page-title',
      { y: 20, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6 }, 0.3)

    // Steps stagger in
    tl.fromTo('.docs-step',
      { y: 25, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1 }, 0.4)

    // TOC slides in from right
    tl.fromTo('.docs-toc',
      { x: 30, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.6 }, 0.3)

  }, pageRef.value)
}

function animateContentChange() {
  // Animate content when switching categories/pages
  gsap.fromTo('.docs-page-title',
    { y: 15, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out' })

  gsap.fromTo('.docs-step',
    { y: 20, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' })

  gsap.fromTo('.docs-toc-link',
    { x: 10, autoAlpha: 0 },
    { x: 0, autoAlpha: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out', delay: 0.1 })
}
</script>

<template>
  <!-- Loading -->
  <div v-if="!hasFetched" class="docs-loading" />

  <!-- Not found -->
  <div v-else-if="!project" class="docs-not-found">
    <p>App not found.</p>
    <router-link :to="localizedPath('/apps')" class="docs-back-link">← Back to Apps</router-link>
  </div>

  <!-- No docs -->
  <div v-else-if="!categories.length" class="docs-not-found">
    <p>No documentation available yet.</p>
    <router-link :to="localizedPath(`/apps/${slug}`)" class="docs-back-link">← Back to {{ project.name }}</router-link>
  </div>

  <!-- Docs layout -->
  <div v-else ref="pageRef" class="docs-page">
    <!-- ===== LEFT SIDEBAR ===== -->
    <aside class="docs-sidebar">
      <div class="docs-sidebar-inner">
        <!-- App name / back link -->
        <router-link :to="localizedPath(`/apps/${slug}`)" class="docs-sidebar-title">
          &lt; {{ project.name }}
        </router-link>

        <!-- Category list -->
        <nav class="docs-sidebar-nav">
          <template v-for="(cat, ci) in categories" :key="cat.id ?? ci">
            <button
              :class="['docs-sidebar-link', { active: activeCategoryIndex === ci }]"
              @click="selectCategory(ci)"
            >
              {{ cat.title }}
            </button>

            <!-- Show pages under active category -->
            <div v-if="activeCategoryIndex === ci && visiblePages.length > 1" class="docs-sidebar-pages">
              <button
                v-for="(page, pi) in visiblePages"
                :key="page.id ?? pi"
                :class="['docs-sidebar-page-link', { active: activePageIndex === pi }]"
                @click="selectPage(pi)"
              >
                {{ page.title }}
              </button>
            </div>
          </template>
        </nav>

        <!-- Buy button -->
        <div class="docs-sidebar-buy">
          <a
            v-if="project.product_page?.pricing?.buyUrl"
            :href="project.product_page.pricing.buyUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="docs-buy-btn"
          >
            BUY {{ project.name?.toUpperCase() }}
          </a>
        </div>
      </div>
    </aside>

    <!-- ===== MAIN CONTENT ===== -->
    <main class="docs-main">
      <div class="docs-content">
        <!-- Page title -->
        <h1 v-if="activePage?.title" class="docs-page-title">{{ activePage.title }}</h1>

        <!-- Steps -->
        <div v-for="(step, si) in steps" :key="step.id ?? si" :id="`step-${step.id}`" class="docs-step">
          <!-- Step number circle + title -->
          <div class="docs-step-header">
            <div class="docs-step-number">
              <span>{{ si + 1 }}</span>
            </div>
            <h2 class="docs-step-title">{{ step.title }}</h2>
          </div>

          <!-- Step content -->
          <div class="docs-step-body">
            <TiptapRenderer v-if="step.content" :content="step.content" tag="div" class="docs-step-content" />
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!steps.length" class="docs-empty">
          <p>This section has no content yet.</p>
        </div>
      </div>
    </main>

    <!-- ===== RIGHT TOC ===== -->
    <aside v-if="steps.length" class="docs-toc">
      <div class="docs-toc-inner">
        <h4 class="docs-toc-title">ON THIS PAGE</h4>
        <nav class="docs-toc-nav">
          <button
            v-for="(step, si) in steps"
            :key="step.id ?? si"
            :class="['docs-toc-link', { active: activeStepId === step.id }]"
            @click="scrollToStep(step.id!)"
          >
            {{ step.title }}
          </button>
        </nav>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* ============================================
   DOCS PAGE — LOADING / NOT FOUND
   ============================================ */
.docs-loading {
  min-height: 100vh;
  background: #000;
}

.docs-not-found {
  min-height: 100vh;
  background: #000;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-family: var(--font-sans);
}

.docs-back-link {
  color: #e63946;
  text-decoration: none;
  font-size: 0.875rem;
  transition: opacity 0.2s;
}
.docs-back-link:hover {
  opacity: 0.8;
}

/* ============================================
   DOCS PAGE — 3-COLUMN LAYOUT
   ============================================ */
.docs-page {
  display: flex;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 4rem;
  color: #e0e0e0;
  font-family: var(--font-sans);
}

/* ============================================
   LEFT SIDEBAR
   ============================================ */
.docs-sidebar {
  width: 260px;
  min-width: 260px;
  min-height: 100vh;
  visibility: hidden;
}

.docs-sidebar-inner {
  position: sticky;
  top: 0;
  padding: 2rem 1.5rem;
  max-height: 100vh;
  overflow-y: auto;
}

.docs-sidebar-title {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  margin-bottom: 2rem;
  transition: color 0.2s;
}
.docs-sidebar-title:hover {
  color: #fff;
}

.docs-sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.docs-sidebar-link {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.6rem 0.75rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.65);
  background: none;
  border: none;
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-sans);
}
.docs-sidebar-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.03);
}
.docs-sidebar-link.active {
  color: #e63946;
  border-left-color: #e63946;
  background: rgba(153, 0, 17, 0.08);
}

/* Sub-pages */
.docs-sidebar-pages {
  display: flex;
  flex-direction: column;
  padding-left: 1rem;
  margin-bottom: 0.25rem;
}

.docs-sidebar-page-link {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.45);
  background: none;
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-sans);
}
.docs-sidebar-page-link:hover {
  color: rgba(255, 255, 255, 0.8);
}
.docs-sidebar-page-link.active {
  color: #e63946;
  border-left-color: #e63946;
}

/* Buy button */
.docs-sidebar-buy {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.docs-buy-btn {
  display: block;
  width: 100%;
  text-align: center;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: none;
  text-decoration: none;
  transition: all 0.25s;
  font-family: var(--font-sans);
}
.docs-buy-btn:hover {
  border-color: #e63946;
  color: #fff;
  background: rgba(153, 0, 17, 0.15);
}

/* ============================================
   MAIN CONTENT
   ============================================ */
.docs-main {
  flex: 1;
  min-width: 0;
  padding: 3rem 3rem 6rem;
  visibility: hidden;
}

.docs-content {
  max-width: 750px;
  margin: 0 auto;
}

.docs-page-title {
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #fff;
  margin-bottom: 3rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

/* ============================================
   STEP LAYOUT
   ============================================ */
.docs-step {
  margin-bottom: 4rem;
  scroll-margin-top: 2rem;
}

.docs-step-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.docs-step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  font-size: 1.25rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  transition: border-color 0.3s;
}

.docs-step:hover .docs-step-number {
  border-color: rgba(255, 255, 255, 0.4);
}

.docs-step-title {
  font-size: 1.25rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #fff;
  margin: 0;
}

.docs-step-body {
  padding-left: calc(48px + 1.25rem);
}

.docs-step-content {
  font-size: 0.95rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.7);
}

/* TiptapRenderer content styling */
.docs-step-content :deep(p) {
  margin: 0.5rem 0;
}

.docs-step-content :deep(h1),
.docs-step-content :deep(h2),
.docs-step-content :deep(h3) {
  color: #fff;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.docs-step-content :deep(ul),
.docs-step-content :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.75rem 0;
}

.docs-step-content :deep(li) {
  margin: 0.25rem 0;
}

.docs-step-content :deep(code) {
  background: rgba(255, 255, 255, 0.08);
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.88em;
  color: #e63946;
}

.docs-step-content :deep(pre) {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
}

.docs-step-content :deep(blockquote) {
  border-left: 3px solid #e63946;
  padding-left: 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  margin: 1rem 0;
}

.docs-step-content :deep(a) {
  color: #e63946;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.docs-step-content :deep(img) {
  max-width: 100%;
  border-radius: 6px;
  margin: 1rem 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.docs-step-content :deep(hr) {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin: 1.5rem 0;
}

/* ============================================
   RIGHT TOC (On This Page)
   ============================================ */
.docs-toc {
  width: 200px;
  min-width: 200px;
  visibility: hidden;
}

.docs-toc-inner {
  position: sticky;
  top: 3rem;
  padding: 3rem 1rem 2rem 0;
}

.docs-toc-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.35);
  margin: 0 0 1rem 0;
  font-weight: 500;
}

.docs-toc-nav {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.docs-toc-link {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.4rem 0 0.4rem 0.75rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  background: none;
  border: none;
  border-left: 2px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-sans);
}
.docs-toc-link:hover {
  color: rgba(255, 255, 255, 0.7);
}
.docs-toc-link.active {
  color: #fff;
  border-left-color: rgba(255, 255, 255, 0.6);
}

/* Empty state */
.docs-empty {
  text-align: center;
  padding: 4rem 0;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.9rem;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 1024px) {
  .docs-toc {
    display: none;
  }
}

@media (max-width: 768px) {
  .docs-page {
    flex-direction: column;
  }

  .docs-sidebar {
    width: 100%;
    min-width: unset;
    min-height: auto;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .docs-sidebar-inner {
    position: static;
    max-height: none;
    padding: 1.5rem;
  }

  .docs-sidebar-nav {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .docs-sidebar-link {
    border-left: none;
    border-bottom: 2px solid transparent;
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
  }
  .docs-sidebar-link.active {
    border-bottom-color: #e63946;
    border-left-color: transparent;
  }

  .docs-sidebar-pages {
    flex-direction: row;
    padding-left: 0;
  }
  .docs-sidebar-page-link {
    border-left: none;
    border-bottom: 1px solid transparent;
  }
  .docs-sidebar-page-link.active {
    border-bottom-color: #e63946;
  }

  .docs-main {
    padding: 2rem 1.5rem 4rem;
  }

  .docs-step-body {
    padding-left: 0;
    margin-top: 1rem;
  }
}
</style>
