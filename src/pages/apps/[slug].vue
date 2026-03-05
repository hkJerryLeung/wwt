<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
import { useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useLocale } from '@/composables/useLocale'
import TiptapRenderer from '@/components/editor/TiptapRenderer.vue'
import type { ProductPageContent } from '@/types'

const route = useRoute()
const projectsStore = useProjectsStore()
const { t, localizedPath } = useLocale()
const slug = computed(() => (route.params.slug as string) ?? '')
const project = computed(() => projectsStore.getBySlug(slug.value))

/** True once the store has finished its initial fetch (success or error) */
const hasFetched = ref(false)

const pageRef = ref<HTMLElement | null>(null)
let gsapCtx: gsap.Context | null = null

onMounted(async () => {
  await projectsStore.fetchProjects()
  hasFetched.value = true
})

/** Convert old Record<string,string> specs to new array format */
function normalizeSpecs(raw: unknown): Array<{ label?: string; value?: string }> {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, string>).map(([label, value]) => ({ label, value }))
  }
  return []
}

const content = computed((): ProductPageContent => {
  const p = project.value
  const name = p?.name ?? 'App'
  const pp = p?.product_page
  return {
    hero: {
      title: pp?.hero?.title ?? name,
      subtitle: pp?.hero?.subtitle ?? '',
      price: pp?.pricing?.price ?? pp?.hero?.price ?? '$75.00 USD',
      buyUrl: pp?.pricing?.buyUrl ?? pp?.hero?.buyUrl ?? '#',
      whatsNewUrl: pp?.hero?.whatsNewUrl ?? '#new',
      learnMoreUrl: pp?.hero?.learnMoreUrl || '#features',
      docsUrl: localizedPath(`/apps/${slug.value}/docs`),
      downloadUrl: pp?.hero?.downloadUrl ?? '#',
      mediaUrl: pp?.hero?.mediaUrl ?? project.value?.screenshot ?? '/demo/super-sort/hero.png',
      mediaType: pp?.hero?.mediaType ?? 'image',
    },
    valueProposition: pp?.valueProposition ?? {
      main: 'A mystical portal between the apps you use daily.',
      sub: 'Illustrator, Figma, Photoshop and After Effects talking seamlessly.',
      emotion: 'The shared language of creativity.',
    },
    features: pp?.features ?? [],
    whatsNew: pp?.whatsNew ?? [],
    testimonials: pp?.testimonials ?? [],
    pricing: pp?.pricing ?? {
      title: 'One-time purchase',
      subtitle: 'Because subscriptions are lame.',
      body: 'Buy once and use it. No pressure to renew.',
      price: '$75.00 USD',
      buyUrl: '#',
    },
    faq: pp?.faq ?? [],
    underlings: pp?.underlings ?? [],
    specs: normalizeSpecs(pp?.specs),
  }
})

/* FAQ */
const openedFaqIndex = ref<number | null>(null)
function toggleFaq(i: number) {
  openedFaqIndex.value = openedFaqIndex.value === i ? null : i
}

/* Testimonials */
const testimonialIndex = ref(0)
const testimonialCount = computed(() => content.value.testimonials?.length ?? 0)
// TODO: uncomment when testimonial carousel navigation is wired up
// function nextTestimonial() {
//   if (testimonialCount.value === 0) return
//   testimonialIndex.value = (testimonialIndex.value + 1) % testimonialCount.value
// }
// function prevTestimonial() {
//   if (testimonialCount.value === 0) return
//   testimonialIndex.value = (testimonialIndex.value - 1 + testimonialCount.value) % testimonialCount.value
// }
void testimonialIndex
void testimonialCount

/* Defaults */
const defaultFeatures = [
  { title: 'Photoshop layers', description: 'Transfer layer stacks without reimporting. Create adjustment layers, masks, text, gradients.', bullets: ['Adjustment layers', 'Masks', 'Text layers', 'Gradients'], imageUrl: '/demo/super-sort/feature-01-photoshop.png' },
  { title: 'Figma layers', description: 'Build Ae layers from Figma. Frames match design, pixel density on the fly.', bullets: ['Frames to Ae', 'Rasterize groups', 'Essential Graphics'], imageUrl: '/demo/super-sort/feature-02-figma.png' },
  { title: 'Editable text', description: 'PS / Ai / Figma text become Ae text layers. Kerning, color, font supported.', bullets: ['Kerning', 'Color', 'Font/weight/style'], imageUrl: '/demo/super-sort/feature-03-text.png' },
  { title: 'Illustrator Gradients', description: 'Linear and radial gradients convert correctly to Ae shapes.', bullets: ['Linear', 'Radial', 'Rasterize mesh if needed'], imageUrl: '/demo/super-sort/feature-04-gradient.png' },
  { title: 'Bonus actions', description: 'Precomp/Decomp, parametric shapes, align artboard & comp, clipping masks.', bullets: ['Precomp/Decomp', 'Parametric shapes', 'Clipping masks'], imageUrl: '/demo/super-sort/feature-05-bonus.png' },
]

const defaultFaq = [
  { category: 'Creative' as const, question: 'Is my art private?', answer: 'Yes. Your files stay on your machine.' },
  { category: 'Technical' as const, question: 'Is an internet connection required?', answer: 'No. You can unlock offline with a mobile device.' },
  { category: 'License' as const, question: 'Can I use it on 2 computers?', answer: 'Each license allows 2 machines for a single user.' },
]

const featuresToShow = computed(() => {
  const f = content.value.features
  if (f?.length) {
    return f
      .filter(feat => feat.visible !== false)
      .map((feat, i) => ({
        ...feat,
        imageUrl: feat.imageUrl || defaultFeatures[i]?.imageUrl || undefined
      }))
  }
  return defaultFeatures
})

const faqToShow = computed(() => {
  const f = content.value.faq
  if (f?.length) return f.filter(item => item.visible !== false)
  return defaultFaq
})

/* Active section tracking for side nav */
const activeSection = ref('hero')
let lastScrollY = 0
let marqueeOffset = 0

function onScroll() {
  const sections = ['hero', 'features', 'new', 'reviews', 'pricing', 'faq', 'specs']
  for (const id of sections.reverse()) {
    const el = document.getElementById(id)
    if (el && el.getBoundingClientRect().top <= 200) {
      activeSection.value = id
      break
    }
  }
  if (!activeSection.value) activeSection.value = 'hero'

  // Marquee scroll interaction — shift with page scroll, no snap-back
  const delta = window.scrollY - lastScrollY
  lastScrollY = window.scrollY
  marqueeOffset = Math.max(-250, Math.min(250, marqueeOffset + delta * 0.4))
  const track = document.querySelector('.ol-pricing-marquee-track') as HTMLElement | null
  if (track) track.style.marginTop = `${marqueeOffset}px`
}

/* Highlight the center item in the marquee */
let centerRaf = 0
function updateCenterItem() {
  const mask = document.querySelector('.ol-pricing-marquee-mask') as HTMLElement | null
  if (mask) {
    const maskRect = mask.getBoundingClientRect()
    const centerY = maskRect.top + maskRect.height / 2
    const items = mask.querySelectorAll('.ol-pricing-highlight-item')
    let closest: Element | null = null
    let minDist = Infinity
    items.forEach(item => {
      const r = item.getBoundingClientRect()
      const itemCenter = r.top + r.height / 2
      const dist = Math.abs(itemCenter - centerY)
      if (dist < minDist) { minDist = dist; closest = item }
    })
    items.forEach(item => item.classList.remove('is-center'))
    if (closest) (closest as Element).classList.add('is-center')
  }
  centerRaf = requestAnimationFrame(updateCenterItem)
}

onMounted(() => {
  lastScrollY = window.scrollY
  window.addEventListener('scroll', onScroll, { passive: true })
  centerRaf = requestAnimationFrame(updateCenterItem)
})

// ── GSAP ScrollTrigger Animations ──
// Wait for project data to load so the v-else DOM branch exists
function initGsapAnimations() {
  if (!pageRef.value) return
  // Kill previous context if re-initializing
  gsapCtx?.revert()

  gsapCtx = gsap.context(() => {

    // ─── HERO ENTRANCE (on page load, not scroll-triggered) ───
    // Using fromTo + autoAlpha so elements stay CSS-hidden until GSAP reveals them
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    heroTl
      .fromTo('.ol-hero-tagline', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 }, 0.1)
      .fromTo('.ol-hero-title', { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'power2.out' }, 0.3)
      .fromTo('.ol-hero-col--left', { x: -60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.9 }, 0.5)
      .fromTo('.ol-hero-col--center', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1 }, 0.4)
      .fromTo('.ol-hero-col--right', { x: 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.9 }, 0.5)
      .fromTo('.ol-hero-arrow-connector', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.9)

    // ─── VALUE PROPOSITION ───
    const vpSection = pageRef.value!.querySelector('.ol-value-prop')
    if (vpSection) {
      gsap.from(vpSection.querySelector('.ol-serif-heading'), {
        y: 60, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: vpSection, start: 'top 80%', toggleActions: 'play none none none' },
      })
      gsap.from(vpSection.querySelector('.ol-mono-body'), {
        y: 40, opacity: 0, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: vpSection, start: 'top 75%', toggleActions: 'play none none none' },
      })
      gsap.from(vpSection.querySelector('.ol-red-line'), {
        scaleX: 0, duration: 0.8, ease: 'power2.inOut',
        scrollTrigger: { trigger: vpSection, start: 'top 70%', toggleActions: 'play none none none' },
      })
    }

    // ─── FEATURES ───
    const featSection = pageRef.value!.querySelector('#features')
    if (featSection) {
      gsap.from(featSection.querySelector('.ol-serif-heading'), {
        y: 50, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: featSection, start: 'top 80%', toggleActions: 'play none none none' },
      })
      gsap.utils.toArray<HTMLElement>('.ol-feature-card').forEach((card, i) => {
        gsap.from(card, {
          y: 60, x: i % 2 === 0 ? -30 : 30, opacity: 0,
          duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none none' },
        })
      })
    }

    // ─── WHAT'S NEW ───
    const whatsNewCards = gsap.utils.toArray<HTMLElement>('.ol-whats-new-card')
    if (whatsNewCards.length) {
      gsap.from(whatsNewCards, {
        y: 50, opacity: 0, duration: 0.8, ease: 'power2.out',
        stagger: 0.15,
        scrollTrigger: { trigger: '#new', start: 'top 80%', toggleActions: 'play none none none' },
      })
    }

    // ─── TESTIMONIALS ───
    const testimonialCards = gsap.utils.toArray<HTMLElement>('.ol-testimonial-card')
    if (testimonialCards.length) {
      gsap.from(testimonialCards, {
        y: 40, opacity: 0, duration: 0.7, ease: 'power2.out',
        stagger: 0.12,
        scrollTrigger: { trigger: '#reviews', start: 'top 80%', toggleActions: 'play none none none' },
      })
    }

    // ─── PRICING ───
    const pricingSection = pageRef.value!.querySelector('#pricing')
    if (pricingSection) {
      gsap.from(pricingSection.querySelector('.ol-pricing-left'), {
        x: -80, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: pricingSection, start: 'top 75%', toggleActions: 'play none none none' },
      })
      gsap.from(pricingSection.querySelector('.ol-pricing-right'), {
        x: 80, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: pricingSection, start: 'top 75%', toggleActions: 'play none none none' },
      })
    }

    // ─── FAQ ───
    const faqSection = pageRef.value!.querySelector('#faq')
    if (faqSection) {
      gsap.from(faqSection.querySelector('.ol-serif-heading'), {
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: faqSection, start: 'top 80%', toggleActions: 'play none none none' },
      })
      gsap.from(faqSection.querySelectorAll('.ol-faq-group'), {
        y: 30, opacity: 0, duration: 0.7, ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: { trigger: faqSection, start: 'top 70%', toggleActions: 'play none none none' },
      })
    }

    // ─── UNDERLINGS ───
    const underlingCards = gsap.utils.toArray<HTMLElement>('.ol-underling-card')
    if (underlingCards.length) {
      gsap.from(underlingCards, {
        y: 50, opacity: 0, duration: 0.8, ease: 'power2.out',
        stagger: 0.15,
        scrollTrigger: { trigger: underlingCards[0]?.closest('.ol-section'), start: 'top 80%', toggleActions: 'play none none none' },
      })
    }

    // ─── SPECS ───
    const specsCard = pageRef.value!.querySelector('.ol-specs-card')
    if (specsCard) {
      gsap.from(specsCard, {
        y: 60, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '#specs', start: 'top 80%', toggleActions: 'play none none none' },
      })
    }

    // ─── RED FOOTER ───
    const footer = pageRef.value!.querySelector('.ol-footer-red')
    if (footer) {
      gsap.from(footer.querySelector('.ol-footer-title'), {
        scale: 0.8, opacity: 0, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: footer, start: 'top 85%', toggleActions: 'play none none none' },
      })
      gsap.from(footer.querySelector('.ol-footer-back'), {
        y: 20, opacity: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: footer, start: 'top 80%', toggleActions: 'play none none none' },
      })
    }

    // ─── ALL RED LINES: scaleX reveal ───
    gsap.utils.toArray<HTMLElement>('.ol-red-line').forEach(line => {
      gsap.from(line, {
        scaleX: 0, duration: 0.8, ease: 'power2.inOut',
        scrollTrigger: { trigger: line, start: 'top 85%', toggleActions: 'play none none none' },
      })
    })

  }, pageRef.value)
}

// Init GSAP once both: project data is available AND the DOM has rendered (hasFetched = true)
// Watching both handles: fresh load (project changes) AND client-side nav (hasFetched changes)
watch([project, hasFetched], ([p, fetched]) => {
  if (p && fetched) {
    nextTick(() => {
      initGsapAnimations()
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  cancelAnimationFrame(centerRaf)
  gsapCtx?.revert()
})

const pricingBgUrl = computed(() => {
  // Future: could come from DB. For now, use static asset.
  return '/demo/super-sort/pricing-bg.png'
})

/* FAQ category grouping */
const faqCategories = computed(() => {
  const items = faqToShow.value
  const cats: Record<string, any[]> = {}
  for (const item of items) {
    const cat = (item as any).category ?? 'General'
    if (!cats[cat]) cats[cat] = []
    cats[cat]!.push(item)
  }
  return cats
})

/** Get the index of a FAQ item in the flat faqToShow array */
function getFaqIndex(item: any): number {
  return faqToShow.value.findIndex(f => f === item)
}
</script>

<template>
  <!-- Loading: show nothing to prevent flash -->
  <div v-if="!hasFetched" class="ol-page-loading" />

  <!-- Not found (only after data is fetched) -->
  <div v-else-if="!project" class="py-24 text-center">
    <p class="text-bp-muted">App not found.</p>
    <router-link :to="localizedPath('/apps')" class="mt-4 inline-block text-bp-accent hover:underline">
      ← {{ t('apps.all') }}
    </router-link>
  </div>

  <div v-else ref="pageRef" class="ol-page">

    <!-- ==================== STICKY SIDE NAV ==================== -->
    <nav class="ol-side-nav">
      <a
        v-for="item in [
          { id: 'new', label: 'New' },
          { id: 'features', label: 'Features' },
          { id: 'reviews', label: 'Reviews' },
          { id: 'pricing', label: 'Pricing' },
          { id: 'faq', label: 'FAQ' },
          { id: 'specs', label: 'Specs' },
        ]"
        :key="item.id"
        :href="'#' + item.id"
        :class="['ol-side-nav-link', { active: activeSection === item.id }]"
      >
        {{ item.label }}
      </a>
      <div class="ol-side-nav-divider" />
      <router-link
        :to="localizedPath(`/apps/${slug}/docs`)"
        class="ol-side-nav-link"
      >Docs→</router-link>
    </nav>

    <!-- ==================== HERO ==================== -->
    <section id="hero" class="ol-hero">
      <!-- Tagline -->
      <p class="ol-hero-tagline">
        {{ content.valueProposition?.emotion ?? 'the shared language of creativity' }}
      </p>

      <!-- Title -->
      <h1 class="ol-hero-title">{{ content.hero?.title }}</h1>

      <!-- 3-column Overlord-style layout -->
      <div class="ol-hero-grid">

        <!-- LEFT COLUMN: Buy circle + sub-links -->
        <div class="ol-hero-col ol-hero-col--left">
          <a
            v-if="content.hero?.buyUrl"
            :href="content.hero.buyUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="ol-circle-btn ol-circle-btn--solid"
          >
            <span class="ol-circle-btn-price">{{ content.hero.price?.replace(' USD', '') }}</span>
            <span class="ol-circle-btn-divider">—</span>
            <span class="ol-circle-btn-label">{{ content.hero?.buyLabel || 'BUY NOW' }}</span>
          </a>
          <div class="ol-hero-sub-links">

            <a v-if="content.hero?.learnMoreUrl" :href="content.hero.learnMoreUrl" class="ol-link-box">
              {{ content.hero?.learnMoreLabel || 'LEARN MORE' }}
            </a>
          </div>
        </div>

        <!-- CENTER COLUMN: Portrait framed media -->
        <div class="ol-hero-col ol-hero-col--center">
          <div class="ol-hero-media-wrapper">
            <div class="ol-hero-frame ol-hero-frame--1">
              <div class="ol-hero-frame ol-hero-frame--2">
                <div class="ol-hero-frame ol-hero-frame--3">
                  <div class="ol-hero-frame ol-hero-frame--4">
                    <div class="ol-hero-frame ol-hero-frame--5">
                      <img
                        v-if="content.hero?.mediaUrl && content.hero?.mediaType !== 'video'"
                        :src="content.hero.mediaUrl"
                        :alt="content.hero?.title"
                        class="ol-hero-media"
                      />
                      <video
                        v-else-if="content.hero?.mediaUrl && content.hero?.mediaType === 'video'"
                        :src="content.hero.mediaUrl"
                        controls
                        class="ol-hero-media"
                      />
                      <div v-else class="ol-hero-placeholder">
                        <span>&lt;/&gt;</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Docs/Download circle -->
        <div class="ol-hero-col ol-hero-col--right">
          <router-link
            :to="localizedPath(`/apps/${slug}/docs`)"
            class="ol-circle-btn ol-circle-btn--outline"
          >
            <span class="ol-circle-btn-label">{{ content.hero?.docsLabel || 'DOCS' }}</span>
            <span class="ol-circle-btn-divider">—</span>
            <span class="ol-circle-btn-label">{{ content.hero?.downloadLabel || 'DOWNLOAD' }}</span>
          </router-link>
        </div>

      </div>

      <!-- Decorative arrow line -->
      <div class="ol-hero-arrow-connector">
        <svg viewBox="0 0 40 160" fill="none" xmlns="http://www.w3.org/2000/svg" class="ol-hero-arrow-svg">
          <line x1="20" y1="0" x2="20" y2="140" stroke="rgba(255,255,255,0.25)" stroke-width="1" />
          <path d="M12 132 L20 148 L28 132" stroke="rgba(255,255,255,0.25)" stroke-width="1" fill="none" />
        </svg>
      </div>
    </section>

    <!-- ==================== VALUE PROPOSITION ==================== -->
    <section v-if="content.valueProposition?.main || content.valueProposition?.sub" class="ol-section ol-value-prop">
      <div class="ol-container">
        <h2 class="ol-serif-heading ol-serif-heading--xl">
          {{ content.valueProposition?.main }}
        </h2>
        <TiptapRenderer v-if="content.valueProposition?.sub" :content="content.valueProposition.sub" tag="div" class="ol-mono-body mt-6" />
        <div class="ol-red-line mt-8" />
      </div>
    </section>

    <!-- ==================== FEATURES ==================== -->
    <section v-if="featuresToShow.length" id="features" class="ol-section">
      <div class="ol-container">
        <h2 class="ol-serif-heading">THAT'S IMPOSSIBLE</h2>
        <p class="ol-mono-body mt-4 mb-16 opacity-60">
          Unlock a new world from your art files.
        </p>

        <div class="ol-features-grid">
          <div
            v-for="(feat, i) in featuresToShow"
            :key="i"
            :class="['ol-feature-card', { 'ol-feature-card--reverse': i % 2 === 1 }]"
          >
            <!-- Feature image -->
            <div class="ol-feature-image">
              <img
                v-if="feat.imageUrl"
                :src="feat.imageUrl"
                :alt="feat.title"
                class="ol-feature-img"
              />
              <div v-else class="ol-feature-image-inner">
                <span class="ol-feature-image-icon">{{ String(i + 1).padStart(2, '0') }}</span>
              </div>
            </div>
            <!-- Text -->
            <div class="ol-feature-text">
              <h3 class="ol-serif-heading ol-serif-heading--sm">{{ feat.title }}</h3>
              <TiptapRenderer :content="feat.description" tag="div" class="ol-mono-body mt-3" />
              <ul v-if="feat.bullets?.length" class="ol-feature-bullets">
                <li v-for="(b, j) in feat.bullets" :key="j">{{ b }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== WHAT'S NEW ==================== -->
    <section v-if="content.whatsNew?.length" id="new" class="ol-section">
      <div class="ol-container">
        <h2 class="ol-serif-heading">WHAT'S NEW?</h2>
        <div class="ol-whats-new-grid mt-12">
          <div
            v-for="(item, i) in content.whatsNew"
            :key="i"
            class="ol-whats-new-card"
          >
            <h3 class="ol-serif-heading ol-serif-heading--sm">{{ item.title }}</h3>
            <p class="ol-mono-body mt-3">{{ item.description }}</p>
            <a
              v-if="item.ctaUrl"
              :href="item.ctaUrl"
              class="ol-link-accent mt-4"
            >
              {{ item.ctaText ?? 'Learn more' }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== TESTIMONIALS ==================== -->
    <section
      v-if="content.testimonials?.filter(t => t.visible !== false)?.length"
      id="reviews"
      class="ol-section"
    >
      <div class="ol-container">
        <h2 class="ol-serif-heading">VOICES OF THE ELDERS</h2>
        <div class="ol-red-line mt-3" />

        <div class="ol-testimonial-grid mt-12">
          <div
            v-for="(tst, i) in content.testimonials?.filter(t => t.visible !== false)"
            :key="i"
            class="ol-testimonial-card"
          >
            <!-- Card header: avatar + meta -->
            <div class="ol-testimonial-header">
              <div class="ol-testimonial-avatar">
                {{ tst.name?.charAt(0) ?? '?' }}
              </div>
              <div class="ol-testimonial-meta">
                <span class="ol-testimonial-name">{{ tst.name }}</span>
                <a v-if="tst.url" :href="tst.url" target="_blank" rel="noopener noreferrer" class="ol-testimonial-url">
                  {{ tst.url }}
                </a>
                <span v-if="tst.role" class="ol-testimonial-role">{{ tst.role }}</span>
              </div>
            </div>
            <!-- Quote -->
            <blockquote class="ol-testimonial-quote">
              {{ tst.quote }}
            </blockquote>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== PRICING ==================== -->
    <section id="pricing" class="ol-section ol-pricing-section">
      <div class="ol-pricing-wrap">
        <!-- Background artwork (contained, not full-width) -->
        <img :src="pricingBgUrl" alt="" class="ol-pricing-bg-img" />
        <div class="ol-pricing-overlay"></div>

        <!-- LEFT COLUMN: Content -->
        <div class="ol-pricing-left">
          <div class="ol-pricing-badge">
            <span class="ol-serif-heading ol-serif-heading--xs">{{ content.pricing?.title ?? 'ONE-TIME PURCHASE' }}</span>
          </div>
          <p class="ol-pricing-accent mt-1">{{ content.pricing?.subtitle }}</p>
          <TiptapRenderer v-if="content.pricing?.body" :content="content.pricing.body" tag="div" class="ol-pricing-body mt-1" />
          <div v-if="content.pricing?.licenseNote" class="ol-pricing-circle mt-6">
            <span class="ol-pricing-circle-text">{{ content.pricing.licenseNote }}</span>
          </div>
        </div>

        <!-- RIGHT COLUMN: Continuous scrolling highlights -->
        <div v-if="content.pricing?.highlights?.length" class="ol-pricing-right">
          <div class="ol-pricing-marquee-mask">
            <div class="ol-pricing-marquee-track">
              <!-- 4x duplicate for seamless infinite scroll -->
              <div
                v-for="(item, i) in content.pricing.highlights.filter(h => typeof h === 'string' || h.visible !== false)"
                :key="'a-' + i"
                class="ol-pricing-highlight-item"
              >
                {{ typeof item === 'string' ? item : item.text }}
              </div>
              <div
                v-for="(item, i) in content.pricing.highlights.filter(h => typeof h === 'string' || h.visible !== false)"
                :key="'b-' + i"
                class="ol-pricing-highlight-item"
              >
                {{ typeof item === 'string' ? item : item.text }}
              </div>
              <div
                v-for="(item, i) in content.pricing.highlights.filter(h => typeof h === 'string' || h.visible !== false)"
                :key="'c-' + i"
                class="ol-pricing-highlight-item"
              >
                {{ typeof item === 'string' ? item : item.text }}
              </div>
              <div
                v-for="(item, i) in content.pricing.highlights.filter(h => typeof h === 'string' || h.visible !== false)"
                :key="'d-' + i"
                class="ol-pricing-highlight-item"
              >
                {{ typeof item === 'string' ? item : item.text }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== FAQ ==================== -->
    <section v-if="faqToShow.length" id="faq" class="ol-section">
      <div class="ol-container">
        <h2 class="ol-serif-heading">COMMON QUESTIONS</h2>

        <div class="ol-faq-groups mt-12">
          <div v-for="(items, category) in faqCategories" :key="category" class="ol-faq-group">
            <h4 class="ol-faq-category">{{ category }}</h4>
            <div v-for="(item, i) in items" :key="i" class="ol-faq-item">
              <button
                type="button"
                class="ol-faq-question"
                @click="toggleFaq(getFaqIndex(item))"
              >
                <span>{{ item.question }}</span>
                <span class="ol-faq-arrow">{{ openedFaqIndex === getFaqIndex(item) ? '↑' : '↓' }}</span>
              </button>
              <div v-show="openedFaqIndex === getFaqIndex(item)">
                <TiptapRenderer :content="item.answer" tag="div" class="ol-faq-answer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== UNDERLINGS ==================== -->
    <section v-if="content.underlings?.filter(x => x.visible !== false)?.length" class="ol-section">
      <div class="ol-container">
        <h2 class="ol-serif-heading">TOGETHER WITH</h2>
        <p class="ol-mono-body mt-4 mb-12 opacity-60">
          The worlds of creation are joined and it only gets better with collaborators
        </p>
        <div class="ol-underlings-grid">
          <div
            v-for="(u, i) in content.underlings?.filter(x => x.visible !== false)"
            :key="i"
            class="ol-underling-card"
          >
            <h3 class="ol-serif-heading ol-serif-heading--sm">{{ u.name }}</h3>
            <p class="ol-mono-body mt-3">{{ u.description }}</p>
            <a
              v-if="u.learnMoreUrl"
              :href="u.learnMoreUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="ol-link-accent mt-4"
            >
              Learn more →
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== SPECS ==================== -->
    <section v-if="content.specs?.filter(s => s.visible !== false)?.length" id="specs" class="ol-section ol-specs-section">
      <div class="ol-container">
        <h2 class="ol-serif-heading">SPECS</h2>
        <div class="ol-red-line mt-3" />
        <div class="ol-specs-card mt-12">
          <div class="ol-specs-grid">
            <div v-for="(spec, i) in content.specs?.filter(s => s.visible !== false)" :key="i" class="ol-specs-item">
              <h4 class="ol-specs-item-label">{{ spec.label }}</h4>
              <div class="ol-specs-item-value" v-html="spec.value" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== RED FOOTER ==================== -->
    <section class="ol-footer-red">
      <h2 class="ol-footer-title">{{ content.hero?.title }}</h2>
      <router-link
        :to="localizedPath('/apps')"
        class="ol-footer-back"
      >
        ← {{ t('apps.all') }}
      </router-link>
    </section>

  </div>
</template>

<style scoped>
/* GSAP red-line animation origin */
.ol-red-line {
  transform-origin: left;
}
/* Loading placeholder — fills viewport with black to prevent flash */
.ol-page-loading {
  min-height: 100vh;
  background: #000;
}

/* ============================================
   OVERLORD-STYLE — PAGE LAYOUT
   ============================================ */
.ol-page {
  background: #000;
  color: #fff;
  overflow-x: hidden;
  position: relative;
  font-family: var(--font-sans);
}

.ol-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.ol-section {
  padding: 6rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

/* ============================================
   STICKY SIDE NAV
   ============================================ */
.ol-side-nav {
  position: fixed;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.ol-side-nav-link {
  font-family: var(--font-sans);
  font-size: 0.845rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #fff;
  text-decoration: none;
  transition: color 0.3s;
  padding: 0.25rem 0;
}

.ol-side-nav-link:hover,
.ol-side-nav-link.active {
  color: #fff;
}

.ol-side-nav-divider {
  width: 20px;
  height: 1px;
  background: rgba(255,255,255,0.15);
  margin: 0.25rem 0;
}

/* ============================================
   HERO
   ============================================ */
.ol-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 7.5rem 2rem 0;
  position: relative;
  background: radial-gradient(ellipse 60% 50% at 50% 40%, rgba(30,40,80,0.3) 0%, transparent 70%),
              #000;
}

/* Hide hero animated elements until GSAP reveals them — prevents flash on refresh */
.ol-hero-tagline,
.ol-hero-title,
.ol-hero-col--left,
.ol-hero-col--center,
.ol-hero-col--right,
.ol-hero-arrow-connector {
  visibility: hidden;
}

.ol-hero-tagline {
  font-family: var(--font-sans);
  font-size: 0.975rem;
  text-transform: lowercase;
  letter-spacing: 0.2em;
  color: #fff;
  margin-bottom: 1rem;
}

.ol-hero-title {
  font-family: var(--font-blueprint);
  font-size: clamp(4rem, 12vw, 10rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
  line-height: 0.9;
  margin-bottom: -2.5rem;
  position: relative;
  z-index: 2;
}

/* 3-column grid: left circle | center image | right circle */
.ol-hero-grid {
  display: grid;
  grid-template-columns: 240px 1fr 240px;
  align-items: center;
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.ol-hero-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.ol-hero-col--left {
  align-items: center;
  position: relative;
}

.ol-hero-col--right {
  align-items: center;
}

.ol-hero-col--center {
  display: flex;
  justify-content: center;
}

/* Sub-links under left circle — positioned absolutely so they don't affect grid centering */
.ol-hero-sub-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
}

/* Concentric frames */
.ol-hero-media-wrapper {
  width: 100%;
  max-width: 580px;
  margin: 0 auto;
}

.ol-hero-frame {
  border: 1px solid #fff;
}

.ol-hero-frame--1 {
  padding: 8px;
}

.ol-hero-frame--2 {
  padding: 8px;
}

.ol-hero-frame--3 {
  padding: 8px;
}

.ol-hero-frame--4 {
  padding: 8px;
}

.ol-hero-frame--5 {
  overflow: hidden;
}

.ol-hero-media {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  aspect-ratio: 3 / 4;
}

.ol-hero-placeholder {
  width: 100%;
  aspect-ratio: 3 / 4;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 20px 20px;
}

.ol-hero-placeholder span {
  font-size: 4rem;
  color: rgba(255,255,255,0.06);
  font-family: var(--font-sans);
}

/* Decorative arrow connector */
.ol-hero-arrow-connector {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  padding-bottom: 1.5rem;
}

.ol-hero-arrow-svg {
  width: 40px;
  height: 80px;
}

/* Circular CTA buttons — 1.4× size (224px) */
.ol-circle-btn {
  width: 224px;
  height: 224px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  gap: 2px;
}

.ol-circle-btn--solid {
  background: rgba(255,255,255,0.95);
  color: #000;
}

.ol-circle-btn--solid:hover {
  background: #fff;
  transform: scale(1.05);
  box-shadow: 0 0 40px rgba(255,255,255,0.2);
}

.ol-circle-btn--outline {
  background: transparent;
  border: 1px solid #fff;
  color: #fff;
}

.ol-circle-btn--outline:hover {
  border-color: #fff;
  transform: scale(1.05);
}

.ol-circle-btn--sm {
  width: 120px;
  height: 120px;
}

.ol-circle-btn-price {
  font-family: var(--font-sans);
  font-size: 1.17rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.ol-circle-btn-divider {
  font-size: 0.91rem;
  opacity: 0.4;
}

.ol-circle-btn-label {
  font-family: var(--font-sans);
  font-size: 0.91rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

/* Hero sub-links */
.ol-link-subtle {
  font-family: var(--font-sans);
  font-size: 0.975rem;
  color: #fff;
  text-decoration: none;
  border-bottom: 1px dashed rgba(255,255,255,0.2);
  padding-bottom: 2px;
  transition: color 0.3s;
  letter-spacing: 0.05em;
}

.ol-link-subtle:hover {
  color: #fff;
}

.ol-link-box {
  font-family: var(--font-sans);
  font-size: 0.975rem;
  color: #fff;
  text-decoration: none;
  border: 1px solid rgba(255,255,255,0.2);
  padding: 0.5rem 1.5rem;
  letter-spacing: 0.15em;
  transition: all 0.3s;
}

.ol-link-box:hover {
  color: #fff;
  border-color: #fff;
}

.ol-link-accent {
  font-family: var(--font-sans);
  font-size: 1.04rem;
  color: #c60118;
  text-decoration: none;
  display: inline-block;
  transition: color 0.3s;
}

.ol-link-accent:hover {
  color: #ff2040;
}

/* ============================================
   TYPOGRAPHY
   ============================================ */
.ol-serif-heading {
  font-family: var(--font-blueprint);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 2.5rem;
  line-height: 1.1;
  color: #fff;
}

.ol-serif-heading--xl {
  font-size: clamp(2rem, 5vw, 3.5rem);
}

.ol-serif-heading--sm {
  font-size: 1.25rem;
}

.ol-serif-heading--xs {
  font-size: 1.105rem;
  letter-spacing: 0.12em;
}

.ol-mono-body {
  font-family: var(--font-sans);
  font-size: 1.105rem;
  line-height: 1.7;
  color: #fff;
}

.ol-mono-body--sm {
  font-size: 0.975rem;
}

.ol-red-line {
  width: 60px;
  height: 2px;
  background: #c60118;
}

/* ============================================
   VALUE PROPOSITION
   ============================================ */
.ol-value-prop {
  padding: 3rem 0 8rem;
  background: radial-gradient(ellipse 50% 50% at 50% 50%, rgba(30,20,40,0.2) 0%, transparent 70%),
              #000;
}

/* ============================================
   FEATURES
   ============================================ */
.ol-features-grid {
  display: flex;
  flex-direction: column;
  gap: 5rem;
}

.ol-feature-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.ol-feature-card--reverse {
  direction: rtl;
}

.ol-feature-card--reverse > * {
  direction: ltr;
}

.ol-feature-image {
  border: 1px solid rgba(255,255,255,0.08);
  padding: 8px;
  overflow: hidden;
}

.ol-feature-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  min-height: 280px;
}

.ol-feature-image-inner {
  border: 1px solid rgba(255,255,255,0.05);
  background:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 20px 20px;
  padding: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
}

.ol-feature-image-icon {
  font-family: var(--font-blueprint);
  font-size: 3rem;
  color: rgba(255,255,255,0.06);
  font-weight: 700;
}

.ol-feature-text {
  padding: 1rem 0;
}

.ol-feature-bullets {
  margin-top: 1.25rem;
  list-style: none;
  padding: 0;
}

.ol-feature-bullets li {
  font-family: var(--font-sans);
  font-size: 1.04rem;
  color: #fff;
  padding: 0.35rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.ol-feature-bullets li:last-child {
  border-bottom: none;
}

/* ============================================
   WHAT'S NEW
   ============================================ */
.ol-whats-new-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.ol-whats-new-card {
  border: 1px solid rgba(255,255,255,0.08);
  padding: 2rem;
  transition: border-color 0.3s;
}

.ol-whats-new-card:hover {
  border-color: rgba(255,255,255,0.2);
}

/* ============================================
   TESTIMONIALS — Masonry grid (Overlord-style)
   ============================================ */
.ol-testimonial-grid {
  column-count: 3;
  column-gap: 1.25rem;
}

.ol-testimonial-card {
  break-inside: avoid;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 1.75rem;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: border-color 0.3s;
}

.ol-testimonial-card:hover {
  border-color: rgba(255,255,255,0.25);
}

.ol-testimonial-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.ol-testimonial-avatar {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-blueprint);
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.ol-testimonial-meta {
  display: flex;
  flex-direction: column;
  gap: 0;
  line-height: 1.4;
}

.ol-testimonial-name {
  font-family: var(--font-blueprint);
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #fff;
}

.ol-testimonial-url {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: #c60118;
  text-decoration: none;
  transition: color 0.3s;
}

.ol-testimonial-url:hover {
  color: #ff2040;
}

.ol-testimonial-role {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: #fff;
}

.ol-testimonial-quote {
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.7;
  color: #fff;
  margin: 0;
}

/* ============================================
   PRICING — Warp.dev Enterprise-style
   ============================================ */
.ol-pricing-section {
  position: relative;
  overflow: hidden;
  padding: 6rem 2rem !important;
}

.ol-pricing-wrap {
  position: relative;
  display: grid;
  grid-template-columns: 45fr 55fr;
  gap: 0;
  height: 700px;
  border-radius: 18px;
  overflow: hidden;
  margin: 0 auto;
  max-width: 1200px;
  background: #111;
}

/* Contained background artwork */
.ol-pricing-bg-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  z-index: 0;
  pointer-events: none;
  transform: scaleX(-1);
}

/* Dark overlay on top of image */
.ol-pricing-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.10) 0%,
    rgba(0, 0, 0, 0.25) 50%,
    rgba(0, 0, 0, 0.30) 100%
  );
  z-index: 1;
  pointer-events: none;
}

.ol-pricing-left {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 2.5rem 2.5rem;
}

.ol-pricing-title {
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: clamp(1.4rem, 3vw, 2.2rem);
  line-height: 1.15;
  color: #fff;
}

.ol-pricing-badge {
  background: none;
  padding: 0;
  display: block;
  line-height: 1;
  align-self: flex-start;
  margin-bottom: 0rem;
  font-size: 2rem;
}

.ol-pricing-badge .ol-serif-heading--xs {
  font-size: inherit;
  font-weight: 400;
  letter-spacing: normal;
}

.ol-pricing-accent {
  font-family: var(--font-sans);
  font-size: clamp(1.6rem, 3vw, 1.5rem);
  color: #d4a855;
  font-weight: 400;
}

.ol-pricing-body {
  font-family: var(--font-mono, monospace);
  font-size: 0.82rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.4);
}

.ol-pricing-circle {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  border: 2px solid rgba(255, 255, 255, 0.6);
  outline: 2px solid rgba(255, 255, 255, 0.3);
  outline-offset: 6px;
}

.ol-pricing-circle-text {
  font-family: var(--font-sans);
  font-size: 1.1rem;
  font-weight: 500;
  color: #fff;
  text-transform: lowercase;
  letter-spacing: 0.04em;
}

.ol-pricing-ctas {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

/* Right column: continuous scrolling marquee — inner box */
.ol-pricing-right {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  margin: 1.5rem 1.5rem 1.5rem 0;
  padding: 0 2rem;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
}

/* Mask for smooth fade at top and bottom */
.ol-pricing-marquee-mask {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
}

.ol-pricing-marquee-track {
  display: flex;
  flex-direction: column;
  animation: marquee-scroll 20s linear infinite;
}

@keyframes marquee-scroll {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-25%);
  }
}

.ol-pricing-highlight-item {
  font-size: clamp(0.7rem, 1.5vw, 1rem);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.45);
  padding: 0.4em 0;
  letter-spacing: 0.1em;
  line-height: 1.25;
  white-space: nowrap;
  transition: color 0.3s;
}

.ol-pricing-highlight-item.is-center {
  color: #ffffff;
}

/* ============================================
   FAQ
   ============================================ */
.ol-faq-groups {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.ol-faq-category {
  font-family: var(--font-sans);
  font-size: 0.91rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #fff;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 0.5rem;
}

.ol-faq-item {
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.ol-faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-blueprint);
  font-size: 1.3rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.ol-faq-arrow {
  font-size: 1.04rem;
  color: #fff;
  transition: color 0.3s;
}

.ol-faq-question:hover .ol-faq-arrow {
  color: #fff;
}

.ol-faq-answer {
  font-family: var(--font-sans);
  font-size: 1.105rem;
  color: #fff;
  padding: 0 0 1.25rem 0;
  line-height: 1.7;
}

/* ============================================
   UNDERLINGS
   ============================================ */
.ol-underlings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.ol-underling-card {
  border: 1px solid rgba(255,255,255,0.08);
  padding: 2rem;
  background:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 16px 16px;
  transition: border-color 0.3s;
}

.ol-underling-card:hover {
  border-color: rgba(255,255,255,0.2);
}

/* ============================================
   SPECS (battleaxe.co style)
   ============================================ */
.ol-specs-section {
  border-bottom: none;
}

.ol-specs-card {
  background: #0c0c0c;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 3rem;
}

.ol-specs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem 3rem;
}

.ol-specs-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ol-specs-item-label {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(255,255,255,0.45);
  font-weight: 500;
}

.ol-specs-item-value {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  line-height: 1.7;
  color: #fff;
}

.ol-specs-item-value :deep(ul) {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ol-specs-item-value :deep(ul li) {
  padding: 0.15rem 0;
}

.ol-specs-item-value :deep(ul li::before) {
  content: '•';
  margin-right: 0.5rem;
  color: rgba(255,255,255,0.35);
}

.ol-specs-item-value :deep(a) {
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  border-bottom: 1px dotted rgba(255,255,255,0.3);
  transition: color 0.3s;
}

.ol-specs-item-value :deep(a:hover) {
  color: #fff;
}

/* ============================================
   RED FOOTER
   ============================================ */
.ol-footer-red {
  background: linear-gradient(180deg, #c60118, #990011 40%, #6b000c);
  padding: 6rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.ol-footer-title {
  font-family: var(--font-blueprint);
  font-size: clamp(3rem, 10vw, 7rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.15);
  line-height: 1;
}

.ol-footer-back {
  font-family: var(--font-sans);
  font-size: 1.105rem;
  color: #fff;
  text-decoration: none;
  transition: color 0.3s;
}

.ol-footer-back:hover {
  color: #fff;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 1024px) {
  .ol-side-nav {
    display: none;
  }

  .ol-testimonial-grid {
    column-count: 2;
  }
}

@media (max-width: 768px) {
  .ol-hero {
    padding: 4rem 1.5rem 3rem;
  }

  .ol-hero-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .ol-hero-col--left,
  .ol-hero-col--right {
    align-items: center;
  }

  .ol-hero-sub-links {
    align-items: center;
  }

  .ol-feature-card {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .ol-feature-card--reverse {
    direction: ltr;
  }

  .ol-circle-btn {
    width: 130px;
    height: 130px;
  }

  .ol-pricing-wrap {
    grid-template-columns: 1fr;
  }

  .ol-pricing-left {
    padding: 2.5rem 1.5rem;
  }

  .ol-pricing-right {
    padding: 2rem 1.5rem;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    max-height: 300px;
  }

  .ol-testimonial-grid {
    column-count: 1;
  }

  .ol-testimonial-card {
    padding: 1.5rem;
  }

  .ol-section {
    padding: 4rem 0;
  }

  .ol-serif-heading {
    font-size: 1.75rem;
  }

  .ol-specs-grid {
    grid-template-columns: 1fr;
  }

  .ol-specs-card {
    padding: 2rem 1.5rem;
  }
}
</style>
