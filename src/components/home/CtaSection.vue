<script setup lang="ts">
import { useLocale } from '@/composables/useLocale'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useHomepageSettingsStore } from '@/stores/homepageSettings'

const { t, localizedPath } = useLocale()
const navStore = useFrontendNavStore()
const homepage = useHomepageSettingsStore()

function ctaText(key: 'ctaTitle' | 'ctaDescription' | 'ctaButton', i18nKey: string): string {
  const v = homepage.effective(key)
  return v || t(i18nKey)
}
</script>

<template>
  <section class="cta-hero">
    <!-- Background image -->
    <div class="cta-hero__bg">
      <img
        src="/images/premium-cta-bg.png"
        alt=""
        loading="lazy"
      />
      <div class="cta-hero__overlay" />
    </div>

    <!-- Content -->
    <div class="cta-hero__content">
      <span class="cta-hero__label">PREMIUM</span>

      <h2 class="cta-hero__title">
        {{ ctaText('ctaTitle', 'home.cta_title') }}
      </h2>

      <p class="cta-hero__desc">
        {{ ctaText('ctaDescription', 'home.cta_description') }}
      </p>

      <router-link
        :to="localizedPath(navStore.getPathByKey('premium'))"
        class="cta-hero__btn"
      >
        {{ ctaText('ctaButton', 'home.cta_button') }}
        <svg class="cta-hero__btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17L17 7M17 7H7M17 7v10" />
        </svg>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.cta-hero {
  position: relative;
  width: 100%;
  min-height: 70vh;
  display: flex;
  align-items: flex-start;
  overflow: hidden;
}

/* ── Background ── */
.cta-hero__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.cta-hero__bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.cta-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0.2) 100%
  );
}

/* ── Content ── */
.cta-hero__content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1800px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 0;
  padding: 40px 80px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
}

.cta-hero__label {
  display: inline-block;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 6px 14px;
  text-transform: uppercase;
}

.cta-hero__title {
  font-family: var(--font-blueprint, 'Inter', sans-serif);
  font-size: clamp(2.4rem, 5vw, 4rem);
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: #fff;
  margin: 0;
}

.cta-hero__desc {
  font-size: 1.25rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.75);
  max-width: 480px;
  margin: 0;
}

.cta-hero__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 14px 28px;
  background: #990011;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 0.25s ease, transform 0.2s ease;
}

.cta-hero__btn:hover {
  background: #c60118;
  transform: translateY(-1px);
}

.cta-hero__btn-icon {
  width: 16px;
  height: 16px;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .cta-hero {
    min-height: 60vh;
  }

  .cta-hero__content {
    padding: 80px 28px;
    gap: 16px;
  }

  .cta-hero__overlay {
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.6) 0%,
      rgba(0, 0, 0, 0.5) 100%
    );
  }
}
</style>
