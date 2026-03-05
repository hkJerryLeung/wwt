<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useHomepageSettingsStore } from '@/stores/homepageSettings'

const { t, localizedPath } = useLocale()
const navStore = useFrontendNavStore()
const homepage = useHomepageSettingsStore()

const categories = computed(() => [
  {
    key: 'ai_coding',
    titleKey: 'catAiCoding' as const,
    descKey: 'catAiCodingDesc' as const,
    i18nTitle: 'home.cat_ai_coding',
    i18nDesc: 'home.cat_ai_coding_desc',
    image: '/images/categories/ai-coding.png',
    path: navStore.getPathByKey('workshop'),
  },
  {
    key: 'ai_video',
    titleKey: 'catAiVideo' as const,
    descKey: 'catAiVideoDesc' as const,
    i18nTitle: 'home.cat_ai_video',
    i18nDesc: 'home.cat_ai_video_desc',
    image: '/images/categories/ai-video.png',
    path: navStore.getPathByKey('workshop'),
  },
  {
    key: 'tools',
    titleKey: 'catTools' as const,
    descKey: 'catToolsDesc' as const,
    i18nTitle: 'home.cat_tools',
    i18nDesc: 'home.cat_tools_desc',
    image: '/images/categories/tools.png',
    path: navStore.getPathByKey('lab'),
  },
  {
    key: 'works',
    titleKey: 'catWorks' as const,
    descKey: 'catWorksDesc' as const,
    i18nTitle: 'home.cat_works',
    i18nDesc: 'home.cat_works_desc',
    image: '/images/categories/showcase.png',
    path: navStore.getPathByKey('showcase'),
  },
])

function categoriesTitleText(): string {
  const v = homepage.effective('categoriesTitle')
  return v || t('home.categories_title')
}

function categoriesSubtitleText(): string {
  const v = homepage.effective('categoriesSubtitle')
  return v || t('home.categories_subtitle')
}

function catTitle(cat: (typeof categories.value)[0]): string {
  const v = homepage.effective(cat.titleKey)
  return v || t(cat.i18nTitle)
}

function catDesc(cat: (typeof categories.value)[0]): string {
  const v = homepage.effective(cat.descKey)
  return v || t(cat.i18nDesc)
}
</script>

<template>
  <section class="cat-section">
    <!-- Section header — matches sympos "LINEUP" header layout -->
    <div class="cat-header">
      <span class="cat-label">EXPLORE</span>
      <h2 class="cat-heading">
        {{ categoriesTitleText() }}
      </h2>
      <p class="cat-subheading">{{ categoriesSubtitleText() }}</p>
    </div>

    <!-- Marquee — full bleed, edge-to-edge -->
    <div class="cat-marquee">
      <div class="cat-marquee-track">
        <!-- Render 4 copies to guarantee no gap on any viewport -->
        <template v-for="n in 4" :key="'set-' + n">
          <router-link
            v-for="cat in categories"
            :key="cat.key + '-' + n"
            :to="localizedPath(cat.path)"
            class="cat-card"
          >
            <div class="cat-card-img">
              <img :src="cat.image" :alt="catTitle(cat)" loading="lazy" />
            </div>
            <h3 class="cat-card-title">{{ catTitle(cat) }}</h3>
            <p class="cat-card-desc">{{ catDesc(cat) }}</p>
          </router-link>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ===== Section ===== */
.cat-section {
  padding: 6rem 0 7rem;
}

/* ===== Header (sympos centered style) ===== */
.cat-header {
  max-width: 1800px;
  margin: 0 auto 4rem;
  padding: 0 2rem;
  text-align: center;
}

.cat-label {
  display: inline-block;
  font-family: var(--font-blueprint);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
  background: var(--color-bp-accent, #990011);
  border: none;
  padding: 0.4rem 1.2rem;
  border-radius: 24px;
}

.cat-heading {
  font-family: var(--font-blueprint);
  font-size: clamp(2.4rem, 5vw, 4rem);
  font-weight: 900;
  line-height: 1.2;
  color: var(--color-bp-white);
  letter-spacing: -0.01em;
}

.cat-subheading {
  margin-top: 1.25rem;
  font-size: 20px;
  line-height: 1.6;
  color: var(--color-bp-muted);
}

/* ===== Marquee container ===== */
.cat-marquee {
  width: 100%;
  overflow: hidden;
}

/* ===== Track (auto-scroll) ===== */
.cat-marquee-track {
  display: flex;
  gap: 24px;
  width: max-content;
  animation: catScroll 40s linear infinite;
}

.cat-marquee:hover .cat-marquee-track {
  animation-play-state: paused;
}

/* ===== Card — 400px wide to match sympos ===== */
.cat-card {
  flex-shrink: 0;
  width: 400px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s ease;
}

.cat-card:hover {
  transform: translateY(-4px);
}

/* ===== Image — aspect ratio ~0.87 (400×460) ===== */
.cat-card-img {
  width: 100%;
  aspect-ratio: 400 / 460;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 0.85rem;
}

.cat-card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.cat-card:hover .cat-card-img img {
  transform: scale(1.04);
}

/* ===== Typography — matching sympos ===== */
.cat-card-title {
  font-family: var(--font-blueprint);
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--color-bp-white);
  margin-bottom: 0.75rem;
}

.cat-card-desc {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--color-bp-muted);
}

/* ===== Keyframes ===== */
@keyframes catScroll {
  0% {
    transform: translateX(0);
  }
  100% {
    /* Move exactly 25% since we have 4 copies */
    transform: translateX(-25%);
  }
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .cat-section {
    padding: 4rem 0 5rem;
  }

  .cat-header {
    padding: 0 1.25rem;
    margin-bottom: 2.5rem;
  }

  .cat-heading {
    font-size: 28px;
  }

  .cat-card {
    width: 280px;
  }

  .cat-marquee-track {
    gap: 16px;
    animation-duration: 28s;
  }

  .cat-card-title {
    font-size: 20px;
  }

  .cat-card-desc {
    font-size: 15px;
  }
}
</style>
