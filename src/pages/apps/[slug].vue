<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useLocale } from '@/composables/useLocale'
import type { ProductPageContent } from '@/types'

const route = useRoute()
const projectsStore = useProjectsStore()
const { t, localizedPath } = useLocale()
const slug = computed(() => (route.params.slug as string) ?? '')

/** 依目前 route slug 反應式取得對應專案，切換 app 時會自動更新 */
const project = computed(() => projectsStore.getBySlug(slug.value))

onMounted(() => {
  projectsStore.fetchProjects()
})

const content = computed((): ProductPageContent => {
  const p = project.value
  const name = p?.name ?? 'App'
  const pp = p?.product_page
  return {
    hero: {
      title: pp?.hero?.title ?? name,
      subtitle: pp?.hero?.subtitle ?? '',
      price: pp?.hero?.price ?? '$75.00 USD',
      buyUrl: pp?.hero?.buyUrl ?? '#',
      renewUrl: pp?.hero?.renewUrl ?? '#',
      whatsNewUrl: pp?.hero?.whatsNewUrl ?? '#new',
      learnMoreUrl: pp?.hero?.learnMoreUrl ?? '#features',
      docsUrl: pp?.hero?.docsUrl ?? '#',
      downloadUrl: pp?.hero?.downloadUrl ?? '#',
      mediaUrl: pp?.hero?.mediaUrl ?? project.value?.screenshot ?? undefined,
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
      renewUrl: '#',
    },
    faq: pp?.faq ?? [],
    underlings: pp?.underlings ?? [],
    specs: pp?.specs ?? {},
  }
})

const openedFaqIndex = ref<number | null>(null)
function toggleFaq(i: number) {
  openedFaqIndex.value = openedFaqIndex.value === i ? null : i
}

const testimonialIndex = ref(0)
const testimonialCount = computed(() => content.value.testimonials?.length ?? 0)
function nextTestimonial() {
  if (testimonialCount.value === 0) return
  testimonialIndex.value = (testimonialIndex.value + 1) % testimonialCount.value
}
function prevTestimonial() {
  if (testimonialCount.value === 0) return
  testimonialIndex.value = (testimonialIndex.value - 1 + testimonialCount.value) % testimonialCount.value
}

const defaultFeatures = [
  { title: 'Photoshop layers', description: 'Transfer layer stacks without reimporting. Create adjustment layers, masks, text, gradients.', bullets: ['Adjustment layers', 'Masks', 'Text layers', 'Gradients'] },
  { title: 'Figma layers', description: 'Build Ae layers from Figma. Frames match design, pixel density on the fly.', bullets: ['Frames to Ae', 'Rasterize groups', 'Essential Graphics'] },
  { title: 'Editable text', description: 'PS / Ai / Figma text become Ae text layers. Kerning, color, font supported.', bullets: ['Kerning', 'Color', 'Font/weight/style'] },
  { title: 'Illustrator Gradients', description: 'Linear and radial gradients convert correctly to Ae shapes.', bullets: ['Linear', 'Radial', 'Rasterize mesh if needed'] },
  { title: 'Bonus actions', description: 'Precomp/Decomp, parametric shapes, align artboard & comp, clipping masks.', bullets: ['Precomp/Decomp', 'Parametric shapes', 'Clipping masks'] },
]

const defaultFaq = [
  { category: 'Creative' as const, question: 'Is my art private?', answer: 'Yes. Your files stay on your machine.' },
  { category: 'Technical' as const, question: 'Is an internet connection required?', answer: 'No. You can unlock offline with a mobile device.' },
  { category: 'License' as const, question: 'Can I use it on 2 computers?', answer: 'Each license allows 2 machines for a single user.' },
]

const featuresToShow = computed(() => {
  const f = content.value.features
  if (f?.length) return f
  return defaultFeatures
})

const faqToShow = computed(() => {
  const f = content.value.faq
  if (f?.length) return f
  return defaultFaq
})
</script>

<template>
  <div v-if="!project" class="py-24 text-center">
    <p class="text-bp-muted">App not found.</p>
    <router-link :to="localizedPath('/apps')" class="mt-4 inline-block text-bp-accent hover:underline">
      ← {{ t('apps.all') }}
    </router-link>
  </div>

  <div v-else class="overflow-x-hidden">
    <!-- Hero -->
    <section class="border-b border-bp-border py-16 sm:py-24">
      <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
        <div class="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 class="font-blueprint text-4xl tracking-wide text-bp-white sm:text-5xl lg:text-6xl">
              {{ content.hero?.title }}
            </h1>
            <p v-if="content.hero?.subtitle" class="mt-4 text-lg text-bp-subtle">
              {{ content.hero.subtitle }}
            </p>
            <div class="mt-8 flex flex-wrap items-center gap-4">
              <a
                v-if="content.hero?.buyUrl"
                :href="content.hero.buyUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="bp-btn-accent font-blueprint text-sm"
              >
                {{ content.hero.price }} — Buy now
              </a>
              <a
                v-if="content.hero?.renewUrl"
                :href="content.hero.renewUrl"
                class="text-sm text-bp-subtle underline hover:text-bp-white"
              >
                Renew license →
              </a>
              <a
                v-if="content.hero?.whatsNewUrl"
                :href="content.hero.whatsNewUrl"
                class="text-sm text-bp-subtle underline hover:text-bp-white"
              >
                What's new?
              </a>
              <a
                v-if="content.hero?.learnMoreUrl"
                :href="content.hero.learnMoreUrl"
                class="text-sm text-bp-subtle underline hover:text-bp-white"
              >
                Learn more
              </a>
            </div>
            <div class="mt-6 flex gap-6 text-xs text-bp-muted">
              <a v-if="content.hero?.docsUrl" :href="content.hero.docsUrl" class="hover:text-bp-accent">Docs</a>
              <a v-if="content.hero?.downloadUrl" :href="content.hero.downloadUrl" class="hover:text-bp-accent">Download</a>
            </div>
          </div>
          <div class="flex items-center justify-center rounded border border-bp-border bg-bp-surface">
            <img
              v-if="content.hero?.mediaUrl && content.hero?.mediaType !== 'video'"
              :src="content.hero.mediaUrl"
              :alt="content.hero?.title"
              class="max-h-80 w-full object-contain"
            />
            <video
              v-else-if="content.hero?.mediaUrl && content.hero?.mediaType === 'video'"
              :src="content.hero.mediaUrl"
              controls
              class="max-h-80 w-full"
            />
            <div v-else class="flex h-64 w-full items-center justify-center bp-grid-bg-dense">
              <span class="text-6xl text-bp-border">&lt;/&gt;</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Value proposition -->
    <section class="border-b border-bp-border py-16 sm:py-20">
      <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
        <h2 class="font-blueprint text-3xl tracking-wide text-bp-white sm:text-4xl">
          {{ content.valueProposition?.main }}
        </h2>
        <p v-if="content.valueProposition?.sub" class="mt-4 max-w-2xl text-bp-subtle">
          {{ content.valueProposition.sub }}
        </p>
        <p v-if="content.valueProposition?.emotion" class="mt-2 text-bp-muted">
          {{ content.valueProposition.emotion }}
        </p>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="border-b border-bp-border py-16 sm:py-20">
      <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
        <h2 class="mb-12 font-blueprint text-3xl tracking-wide text-bp-white sm:text-4xl">
          That's impossible
        </h2>
        <p class="mb-12 text-bp-subtle">
          Unlock a new world from your art files.
        </p>
        <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(feat, i) in featuresToShow"
            :key="i"
            class="rounded border border-bp-border bg-bp-surface/50 p-6"
          >
            <h3 class="font-blueprint text-lg text-bp-white">
              {{ feat.title }}
            </h3>
            <p class="mt-2 text-sm text-bp-subtle">
              {{ feat.description }}
            </p>
            <ul v-if="feat.bullets?.length" class="mt-3 list-inside list-disc text-xs text-bp-muted">
              <li v-for="(b, j) in feat.bullets" :key="j">{{ b }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- What's new -->
    <section v-if="content.whatsNew?.length" id="new" class="border-b border-bp-border py-16 sm:py-20">
      <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
        <h2 class="mb-12 font-blueprint text-3xl tracking-wide text-bp-white sm:text-4xl">
          What's new?
        </h2>
        <div class="space-y-10">
          <div
            v-for="(item, i) in content.whatsNew"
            :key="i"
            class="rounded border border-bp-border p-6"
          >
            <h3 class="font-blueprint text-lg text-bp-white">{{ item.title }}</h3>
            <p class="mt-2 text-bp-subtle">{{ item.description }}</p>
            <a
              v-if="item.ctaUrl"
              :href="item.ctaUrl"
              class="mt-3 inline-block text-sm text-bp-accent hover:underline"
            >
              {{ item.ctaText ?? 'Learn more' }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section v-if="content.testimonials?.length || testimonialCount > 0" id="reviews" class="border-b border-bp-border py-16 sm:py-20">
      <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
        <h2 class="mb-12 font-blueprint text-3xl tracking-wide text-bp-white sm:text-4xl">
          Voices of the elders
        </h2>
        <div class="relative min-h-[200px]">
          <div
            v-for="(tst, i) in content.testimonials"
            v-show="i === testimonialIndex"
            :key="i"
            class="rounded border border-bp-border bg-bp-surface/30 p-6"
          >
            <p class="text-bp-subtle">{{ tst.quote }}</p>
            <p class="mt-4 font-blueprint text-sm text-bp-white">{{ tst.name }}</p>
            <a
              v-if="tst.url"
              :href="tst.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-bp-accent hover:underline"
            >
              {{ tst.url }}
            </a>
            <p v-if="tst.role" class="text-xs text-bp-muted">{{ tst.role }}</p>
          </div>
        </div>
        <div v-if="testimonialCount > 1" class="mt-4 flex justify-center gap-4">
          <button
            type="button"
            class="rounded border border-bp-border px-4 py-2 text-sm text-bp-subtle hover:text-bp-white"
            @click="prevTestimonial"
          >
            ←
          </button>
          <button
            type="button"
            class="rounded border border-bp-border px-4 py-2 text-sm text-bp-subtle hover:text-bp-white"
            @click="nextTestimonial"
          >
            →
          </button>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="border-b border-bp-border py-16 sm:py-20">
      <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
        <h2 class="font-blueprint text-3xl tracking-wide text-bp-white sm:text-4xl">
          {{ content.pricing?.title }}
        </h2>
        <p class="mt-2 text-xl text-bp-accent">
          {{ content.pricing?.subtitle }}
        </p>
        <p v-if="content.pricing?.body" class="mt-6 max-w-2xl text-bp-subtle">
          {{ content.pricing.body }}
        </p>
        <p v-if="content.pricing?.licenseNote" class="mt-4 text-sm text-bp-muted">
          {{ content.pricing.licenseNote }}
        </p>
        <div class="mt-8 flex flex-wrap gap-4">
          <a
            v-if="content.pricing?.buyUrl"
            :href="content.pricing.buyUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="bp-btn-accent"
          >
            {{ content.pricing.price }} — Buy
          </a>
          <a
            v-if="content.pricing?.renewUrl"
            :href="content.pricing.renewUrl"
            class="text-bp-subtle underline hover:text-bp-white"
          >
            Renew license
          </a>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="border-b border-bp-border py-16 sm:py-20">
      <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
        <h2 class="mb-12 font-blueprint text-3xl tracking-wide text-bp-white sm:text-4xl">
          Common questions
        </h2>
        <div class="space-y-2">
          <template v-for="(item, i) in faqToShow" :key="i">
            <div class="rounded border border-bp-border bg-bp-surface/30">
              <button
                type="button"
                class="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-bp-white"
                @click="toggleFaq(i)"
              >
                <span class="font-medium">{{ item.question }}</span>
                <span class="text-bp-muted">{{ openedFaqIndex === i ? '↑' : '↓' }}</span>
              </button>
              <div v-show="openedFaqIndex === i" class="border-t border-bp-border px-4 py-3 text-sm text-bp-subtle">
                {{ item.answer }}
              </div>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- Underlings -->
    <section v-if="content.underlings?.length" class="border-b border-bp-border py-16 sm:py-20">
      <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
        <h2 class="mb-12 font-blueprint text-3xl tracking-wide text-bp-white sm:text-4xl">
          Together with
        </h2>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(u, i) in content.underlings"
            :key="i"
            class="rounded border border-bp-border p-6"
          >
            <h3 class="font-blueprint text-lg text-bp-white">{{ u.name }}</h3>
            <p class="mt-2 text-sm text-bp-subtle">{{ u.description }}</p>
            <a
              v-if="u.learnMoreUrl"
              :href="u.learnMoreUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-3 inline-block text-sm text-bp-accent hover:underline"
            >
              Learn more →
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Specs -->
    <section v-if="Object.keys(content.specs ?? {}).length" class="border-b border-bp-border py-16 sm:py-20">
      <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
        <h2 class="mb-12 font-blueprint text-3xl tracking-wide text-bp-white sm:text-4xl">
          Specs
        </h2>
        <dl class="space-y-4">
          <div v-for="(value, key) in content.specs" :key="key" class="flex gap-4">
            <dt class="w-40 shrink-0 text-sm text-bp-muted">{{ key }}</dt>
            <dd class="text-sm text-bp-subtle" v-html="value" />
          </div>
        </dl>
      </div>
    </section>

    <!-- Back to apps -->
    <section class="py-12">
      <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
        <router-link
          :to="localizedPath('/apps')"
          class="text-bp-accent hover:underline"
        >
          ← {{ t('apps.all') }}
        </router-link>
      </div>
    </section>
  </div>
</template>
