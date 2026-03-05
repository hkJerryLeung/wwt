<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useHomepageSettingsStore } from '@/stores/homepageSettings'
import { useAppearanceStore } from '@/stores/appearance'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const { t, localizedPath } = useLocale()
const navStore = useFrontendNavStore()
const homepage = useHomepageSettingsStore()
const appearanceStore = useAppearanceStore()

function heroText(
  key: 'heroGreeting' | 'heroName' | 'heroTagline' | 'heroDescription',
  i18nKey: string,
): string {
  const v = homepage.effective(key)
  return v || t(i18nKey)
}

const marqueeText = "WHAT'S THAT · WORKSHOP · LAB · SHOWCASE · PREMIUM · "

const heroRef = ref<HTMLElement | null>(null)
const flyingLogoRef = ref<HTMLImageElement | null>(null)
let ctx: gsap.Context | null = null
let flyingLogoTween: gsap.core.Tween | null = null
let flyingLogoST: ScrollTrigger | null = null
let resizeRafId: number | null = null
let initRafId: number | null = null

onMounted(() => {
  // Reset hero-scroll-progress so the navbar logo starts hidden
  window.dispatchEvent(
    new CustomEvent('hero-scroll-progress', { detail: { progress: 0 } }),
  )

  if (!heroRef.value) return

  // ── Immediately hide all entrance elements ──
  // This prevents a "flash of content" while we wait for scroll to reach 0.
  // The user sees only the dark hero background until the animation begins.
  const heroEl = heroRef.value
  heroEl.querySelectorAll<HTMLElement>('.ch-hero-logo').forEach(el => { el.style.opacity = '0'; el.style.transform = 'scale(0.7)' })
  heroEl.querySelectorAll<HTMLElement>('.ch-headline').forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(40px)' })
  heroEl.querySelectorAll<HTMLElement>('.ch-desc').forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(20px)' })
  heroEl.querySelectorAll<HTMLElement>('.ch-cta-group').forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(20px)' })
  heroEl.querySelectorAll<HTMLElement>('.layer-back .ch-obj, .layer-mid .ch-obj, .layer-front .ch-obj').forEach(el => { el.style.opacity = '0'; el.style.transform = 'scale(0)' })

  // Poll until the browser has actually scrolled to 0, then init GSAP.
  function waitForScrollZero() {
    window.scrollTo(0, 0)
    if (window.scrollY > 0) {
      initRafId = requestAnimationFrame(waitForScrollZero)
    } else {
      initRafId = null
      if (!heroRef.value) return
      initGsapAnimations()
    }
  }
  initRafId = requestAnimationFrame(waitForScrollZero)
})

function initGsapAnimations() {
  // Safety: ensure scroll is still at 0
  window.scrollTo(0, 0)

  ctx = gsap.context(() => {

    // ─── ENTRANCE ANIMATION ───
    // Elements are already hidden from onMounted; GSAP takes over from here.
    gsap.set('.ch-hero-logo', { opacity: 0, scale: 0.7 })
    gsap.set('.ch-headline', { opacity: 0, y: 40 })
    gsap.set('.ch-desc', { opacity: 0, y: 20 })
    gsap.set('.ch-cta-group', { opacity: 0, y: 20 })
    gsap.set('.layer-back .ch-obj', { opacity: 0, scale: 0 })
    gsap.set('.layer-mid .ch-obj', { opacity: 0, scale: 0 })
    gsap.set('.layer-front .ch-obj', { opacity: 0, scale: 0 })

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        // Remove skip-on-scroll listener
        window.removeEventListener('scroll', skipEntrance)
        // After entrance, lift the logo to fixed position
        setupFlyingLogo()
        window.addEventListener('resize', handleResize)
        ScrollTrigger.refresh()
      },
    })

    // If user scrolls during entrance, skip to end immediately
    const skipEntrance = () => { tl.progress(1) }
    // Delay attaching the skip-on-scroll listener by one frame
    requestAnimationFrame(() => {
      if (tl.progress() < 1) {
        window.addEventListener('scroll', skipEntrance, { once: true })
      }
    })

    tl.to('.ch-hero-logo', { scale: 1, opacity: 1, duration: 1.4, ease: 'power2.out' }, 0.1)
      .to('.ch-headline', { y: 0, opacity: 1, duration: 0.8 }, 0.5)
      .to('.ch-desc', { y: 0, opacity: 1, duration: 0.6 }, 0.7)
      .to('.ch-cta-group', { y: 0, opacity: 1, duration: 0.5 }, 0.85)
      // Back layer objects appear first (they're "far away")
      .to('.layer-back .ch-obj', {
        scale: 1, opacity: 1, duration: 1.2,
        ease: 'back.out(1.5)',
        stagger: { each: 0.15, from: 'random' },
      }, 0.15)
      // Mid layer objects
      .to('.layer-mid .ch-obj', {
        scale: 1, opacity: 1, duration: 1,
        ease: 'back.out(1.8)',
        stagger: { each: 0.12, from: 'random' },
      }, 0.3)
      // Front layer objects appear last (closest to viewer)
      .to('.layer-front .ch-obj', {
        scale: 1, opacity: 1, duration: 0.8,
        ease: 'back.out(2)',
        stagger: { each: 0.1, from: 'random' },
      }, 0.45)

    // ═══════════════════════════════════════
    //  MULTI-LAYER SCROLL PARALLAX
    //  Each layer scrolls at a dramatically
    //  different speed to create depth
    // ═══════════════════════════════════════

    const scrollConfig = {
      trigger: heroRef.value,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    }

    // LAYER: Background marquee — barely moves (0.15x)
    gsap.to('.layer-marquee', {
      y: -80,
      scrollTrigger: { ...scrollConfig, scrub: 1.5 },
    })

    // LAYER: Back objects — slow movement (0.4x)
    gsap.to('.layer-back', {
      y: -200,
      scrollTrigger: { ...scrollConfig, scrub: 1.2 },
    })

    // LAYER: Center content — stays visible, just drifts up slightly
    gsap.to('.layer-center', {
      y: -60,
      scrollTrigger: {
        trigger: heroRef.value,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
      },
    })

    // LAYER: Mid objects — faster (1.6x)
    gsap.to('.layer-mid', {
      y: -500,
      scrollTrigger: { ...scrollConfig, scrub: 0.8 },
    })

    // LAYER: Front objects — fastest (2.5x)
    gsap.to('.layer-front', {
      y: -800,
      scrollTrigger: { ...scrollConfig, scrub: 0.5 },
    })

    // ═══════════════════════════════════════
    //  PER-OBJECT ROTATION + DRIFT on scroll
    // ═══════════════════════════════════════

    const objectDrift = [
      { sel: '.obj-pyramid',   rotation: 15, x: 30  },
      { sel: '.obj-star',      rotation: -12, x: -25 },
      { sel: '.obj-sphere',    rotation: 20, x: -40  },
      { sel: '.obj-blob',      rotation: -10, x: 20  },
      { sel: '.obj-cylinder',  rotation: -18, x: 50  },
      { sel: '.obj-cube',      rotation: 14, x: -35  },
      { sel: '.obj-star2',     rotation: 18, x: 35  },
      { sel: '.obj-blob2',     rotation: -15, x: -30 },
      { sel: '.obj-pyramid2',  rotation: -20, x: 45  },
      { sel: '.obj-sphere2',   rotation: 12, x: -20  },
      { sel: '.obj-inner1',    rotation: -8, x: 15   },
      { sel: '.obj-inner2',    rotation: 10, x: -18  },
      { sel: '.obj-inner3',    rotation: -14, x: 22  },
      { sel: '.obj-inner4',    rotation: 7, x: -12   },
      { sel: '.obj-inner5',    rotation: -11, x: 28  },
      { sel: '.obj-inner6',    rotation: 16, x: -24  },
    ]

    objectDrift.forEach(({ sel, rotation, x }) => {
      gsap.to(sel, {
        rotation,
        x,
        ease: 'none',
        scrollTrigger: { ...scrollConfig, scrub: 1 },
      })
    })

    // Marquee text scroll acceleration
    gsap.to('.ch-marquee-track', {
      x: '-=400',
      ease: 'none',
      scrollTrigger: { ...scrollConfig, scrub: 0.5 },
    })

  }, heroRef.value!)
}

/** Position the flying logo over the hero logo, then animate it to navbar on scroll */
function setupFlyingLogo() {
  const heroLogo = document.querySelector('.ch-hero-logo') as HTMLElement
  const flyingLogo = flyingLogoRef.value
  if (!heroLogo || !flyingLogo || !heroRef.value) return

  // Ensure we are at scroll=0 so measurements are correct
  window.scrollTo(0, 0)

  // Kill previous tween + ScrollTrigger if re-running (e.g. on resize)
  if (flyingLogoTween) {
    flyingLogoTween.kill()
    flyingLogoTween = null
  }
  if (flyingLogoST) {
    flyingLogoST.kill()
    flyingLogoST = null
  }

  // Clear any stale inline GSAP styles on the flying logo
  gsap.set(flyingLogo, { clearProps: 'all' })

  // Measure hero logo rect live (image is loaded by now)
  heroLogo.style.visibility = 'visible'
  const liveRect = heroLogo.getBoundingClientRect()
  heroLogo.style.visibility = 'hidden'

  // At scroll=0 (guaranteed above), no parallax compensation needed
  const scrollY = window.scrollY
  const heroHeight = heroRef.value!.offsetHeight
  // layer-center parallax: y goes from 0 to -60 over heroHeight of scroll
  const parallaxOffset = heroHeight > 0 ? (60 * scrollY / heroHeight) : 0
  const rect = {
    top: liveRect.top + scrollY + parallaxOffset,
    left: liveRect.left,
    width: liveRect.width,
  }

  // Flying logo initial state
  gsap.set(flyingLogo, {
    position: 'fixed',
    height: 'auto',
    opacity: 1,
    zIndex: 60,
  })

  // Target: the actual navbar logo image (always in DOM for sizing)
  const navbarLogo = document.querySelector('[data-navbar-logo] img') as HTMLElement
  let targetTop: number
  let targetLeft: number
  let targetWidth: number

  if (navbarLogo) {
    const navRect = navbarLogo.getBoundingClientRect()
    targetTop = navRect.top
    targetLeft = navRect.left
    targetWidth = navRect.width
  } else {
    const navbarLogoHeight = 48
    const aspectRatio = rect.width / liveRect.height
    targetWidth = navbarLogoHeight * aspectRatio
    targetTop = (98 - navbarLogoHeight) / 2
    targetLeft = 24
  }

  // Auto-play animation after 5px scroll, reverse when back to top
  flyingLogoTween = gsap.fromTo(flyingLogo,
    { top: rect.top, left: rect.left, width: rect.width },
    {
      top: targetTop,
      left: targetLeft,
      width: targetWidth,
      duration: 0.6,
      ease: 'power2.inOut',
      paused: true,
      onUpdate: function () {
        const progress = this.progress()
        window.dispatchEvent(
          new CustomEvent('hero-scroll-progress', { detail: { progress } }),
        )
      },
      onReverseComplete: () => {
        window.dispatchEvent(
          new CustomEvent('hero-scroll-progress', { detail: { progress: 0 } }),
        )
      },
      onComplete: () => {
        window.dispatchEvent(
          new CustomEvent('hero-scroll-progress', { detail: { progress: 1 } }),
        )
      },
    }
  )

  // Trigger: play forward after 5px scroll, reverse when scrolled back to top
  flyingLogoST = ScrollTrigger.create({
    trigger: heroRef.value,
    start: 'top+=5 top',
    onEnter: () => flyingLogoTween?.play(),
    onLeaveBack: () => flyingLogoTween?.reverse(),
  })

  // Refresh so the trigger evaluates based on current scroll (should be 0)
  ScrollTrigger.refresh()
}

// Instant resize via rAF
function handleResize() {
  if (resizeRafId) cancelAnimationFrame(resizeRafId)
  resizeRafId = requestAnimationFrame(() => {
    setupFlyingLogo()
    resizeRafId = null
  })
}

onUnmounted(() => {
  // Kill flying-logo animations explicitly (created outside GSAP context)
  if (flyingLogoTween) {
    flyingLogoTween.kill()
    flyingLogoTween = null
  }
  if (flyingLogoST) {
    flyingLogoST.kill()
    flyingLogoST = null
  }

  // Cancel deferred init if component unmounts before GSAP initialized
  if (initRafId) {
    cancelAnimationFrame(initRafId)
    initRafId = null
  }

  ctx?.revert()
  window.removeEventListener('resize', handleResize)
  if (resizeRafId) cancelAnimationFrame(resizeRafId)

  // Reset navbar logo state so it shows correctly on non-homepage
  window.dispatchEvent(
    new CustomEvent('hero-scroll-progress', { detail: { progress: 0 } }),
  )
})
</script>

<template>
  <section ref="heroRef" class="ch-hero">
    <!--
      DEPTH LAYERS (back to front):
      1. layer-marquee  — deepest, barely moves
      2. layer-back     — far objects, slow
      3. layer-center   — card + text, medium
      4. layer-mid      — mid objects, fast
      5. layer-front    — near objects, fastest
    -->

    <!-- ═══ LAYER 1: Marquee (deepest) ═══ -->
    <div class="ch-layer layer-marquee" aria-hidden="true">
      <div class="ch-marquee-track">
        <span v-for="i in 8" :key="i" class="ch-marquee-text">
          {{ marqueeText }}
        </span>
      </div>
    </div>

    <!-- ═══ LAYER 2: Back objects (slow) ═══ -->
    <div class="ch-layer layer-back">
      <span class="ch-obj ch-obj-text obj-star">Midjourney</span>
      <span class="ch-obj ch-obj-text obj-blob">Sora</span>
      <span class="ch-obj ch-obj-text obj-star2">DALL·E</span>
      <span class="ch-obj ch-obj-text obj-blob2">ComfyUI</span>
      <span class="ch-obj ch-obj-text obj-inner1">Copilot</span>
      <span class="ch-obj ch-obj-text obj-inner2">LLaMA</span>
    </div>

    <!-- ═══ LAYER 3: Center content ═══ -->
    <div class="ch-layer layer-center">
      <div class="ch-content-stack">
        <!-- Top: Oversized Company Logo -->
        <img
          :src="appearanceStore.effectiveLogoUrl()"
          alt="WWT Logo"
          class="ch-hero-logo"
          loading="eager"
        />

        <!-- Bottom: Centered text + buttons -->
        <h1 class="ch-headline">
          探索 AI 時代的無限可能<br>一起創造。
        </h1>

        <p class="ch-desc">
          {{ heroText('heroDescription', 'hero.description') }}
        </p>

        <div class="ch-cta-group">
          <router-link
            :to="localizedPath(navStore.getPathByKey('workshop'))"
            class="ch-cta ch-cta--primary"
          >
            {{ t('hero.cta_explore') }}
            <svg class="ch-cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </router-link>
          <router-link
            :to="localizedPath(navStore.getPathByKey('premium'))"
            class="ch-cta ch-cta--secondary"
          >
            {{ t('hero.cta_patreon') }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- Flying Logo: teleported to body to avoid perspective containing block -->
    <Teleport to="body">
      <img
        ref="flyingLogoRef"
        :src="appearanceStore.effectiveLogoUrl()"
        alt="WWT Logo"
        class="ch-flying-logo"
      />
    </Teleport>

    <!-- ═══ LAYER 4: Mid objects (fast) ═══ -->
    <div class="ch-layer layer-mid">
      <span class="ch-obj ch-obj-text obj-pyramid">ChatGPT</span>
      <span class="ch-obj ch-obj-text obj-cube">Gemini</span>
      <span class="ch-obj ch-obj-text obj-pyramid2">Runway</span>
      <span class="ch-obj ch-obj-text obj-inner3">Whisper</span>
      <span class="ch-obj ch-obj-text obj-inner4">Flux</span>
    </div>

    <!-- ═══ LAYER 5: Front objects (fastest) ═══ -->
    <div class="ch-layer layer-front">
      <span class="ch-obj ch-obj-text obj-sphere">Claude</span>
      <span class="ch-obj ch-obj-text obj-cylinder">Stable Diffusion</span>
      <span class="ch-obj ch-obj-text obj-sphere2">Cursor</span>
      <span class="ch-obj ch-obj-text obj-inner5">Kling</span>
      <span class="ch-obj ch-obj-text obj-inner6">CapCut</span>
    </div>
  </section>
</template>

<style scoped>
/* ============================================
   Cohesion Hero – Multi-Layer 3D Parallax
   Bold Typographic Layout
   ============================================ */
.ch-hero {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #000000;
  perspective: 1000px;
}

/* ── Shared layer base ── */
.ch-layer {
  position: absolute;
  inset: 0;
  will-change: transform;
  pointer-events: none;
}

.layer-center {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  z-index: 10;
  padding: 0 clamp(32px, 6vw, 100px);
}

/* ── Content Stack (single column, centered) ── */
.ch-content-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  gap: 0;
}

/* ── Headline ── */
.ch-headline {
  font-family: "Inter", "PingFang HK", sans-serif;
  font-size: clamp(2.7rem, 4.5vw, 4.5rem);
  font-weight: 800;
  color: #ffffff;
  line-height: 1.25;
  letter-spacing: -0.02em;
  margin: 1.5rem 0 1rem 0;
}

/* ── Description ── */
.ch-desc {
  font-family: "Inter", "PingFang HK", sans-serif;
  font-size: clamp(0.95rem, 1.2vw, 1.15rem);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.8;
  max-width: 540px;
  margin: 0 0 2rem 0;
}

/* ── CTA Buttons ── */
.ch-cta-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: center;
}

.ch-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  font-family: "Inter", "PingFang HK", sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.ch-cta--primary {
  background: #ffffff;
  color: #000000;
  border: 1.5px solid #ffffff;
}

.ch-cta--primary:hover {
  background: transparent;
  color: #ffffff;
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(255, 255, 255, 0.15);
}

.ch-cta--secondary {
  background: transparent;
  color: #ffffff;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
}

.ch-cta--secondary:hover {
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(255, 255, 255, 0.08);
}

.ch-cta-icon {
  width: 16px;
  height: 16px;
}

/* ── LAYER 1: Marquee ── z-index: 1 */
.layer-marquee {
  z-index: 1;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.ch-marquee-track {
  display: flex;
  white-space: nowrap;
  animation: chMarquee 30s linear infinite;
}

.ch-marquee-text {
  font-family: "Inter", "PingFang HK", sans-serif;
  font-size: clamp(8rem, 20vw, 26rem);
  font-weight: 900;
  color: rgba(255, 255, 255, 0.06);
  letter-spacing: -0.03em;
  line-height: 1;
  padding-right: 0.3em;
  flex-shrink: 0;
  text-transform: uppercase;
}

/* ── LAYER 2: Back objects ── z-index: 5 */
.layer-back {
  z-index: 5;
}

/* ── LAYER 4: Mid objects ── z-index: 15 */
.layer-mid {
  z-index: 15;
}

/* ── LAYER 5: Front objects ── z-index: 20 */
.layer-front {
  z-index: 20;
}

/* ── Floating 3D Text Objects ── */
.ch-obj {
  position: absolute;
  pointer-events: none;
  will-change: transform;
}

.ch-obj-text {
  font-family: "Inter", "PingFang HK", sans-serif;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.75);
  text-shadow:
    0 2px 4px rgba(0, 0, 0, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.3);
}

/* --- Arranged in elliptical orbit, varied font sizes --- */

/* ~12 o'clock — ChatGPT (large) */
.obj-pyramid {
  font-size: clamp(2.2rem, 4vw, 4.5rem);
  top: 4%;
  left: 28%;
  transform: rotate(-8deg);
}

/* ~1 o'clock — Midjourney (medium) */
.obj-star {
  font-size: clamp(1.6rem, 3vw, 3.2rem);
  top: 6%;
  left: auto;
  right: 22%;
  transform: rotate(12deg);
}

/* ~2 o'clock — Cursor (small) */
.obj-sphere2 {
  font-size: clamp(1rem, 1.8vw, 2rem);
  top: 20%;
  left: auto;
  right: 10%;
  transform: rotate(-10deg);
}

/* ~3 o'clock — Sora (medium-large) */
.obj-blob {
  font-size: clamp(1.8rem, 3.5vw, 3.8rem);
  top: 42%;
  left: auto;
  right: 5%;
  transform: rotate(-6deg);
}

/* ~4-5 o'clock — Gemini (large) */
.obj-cube {
  font-size: clamp(2rem, 3.8vw, 4.2rem);
  bottom: 14%;
  top: auto;
  left: auto;
  right: 10%;
  transform: rotate(-14deg);
}

/* ~6 o'clock — Runway (small-medium) */
.obj-pyramid2 {
  font-size: clamp(1.2rem, 2.2vw, 2.5rem);
  bottom: 3%;
  top: auto;
  left: auto;
  right: 28%;
  transform: rotate(7deg);
}

/* ~7 o'clock — ComfyUI (small) */
.obj-blob2 {
  font-size: clamp(1rem, 1.6vw, 1.8rem);
  bottom: 5%;
  top: auto;
  left: 25%;
  transform: rotate(-12deg);
}

/* ~8 o'clock — Stable Diffusion (large) */
.obj-cylinder {
  font-size: clamp(2rem, 3.6vw, 4rem);
  bottom: 12%;
  top: auto;
  left: 3%;
  transform: rotate(10deg);
}

/* ~9-10 o'clock — Claude (medium-large) */
.obj-sphere {
  font-size: clamp(1.8rem, 3.2vw, 3.5rem);
  top: 38%;
  left: 3%;
  transform: rotate(5deg);
}

/* ~11 o'clock — DALL·E (small) */
.obj-star2 {
  font-size: clamp(1.1rem, 2vw, 2.2rem);
  top: 14%;
  left: 12%;
  transform: rotate(20deg);
}

/* --- Inner ring: closer to center content --- */

/* Copilot — near upper-left of center */
.obj-inner1 {
  font-size: clamp(1rem, 1.8vw, 2rem);
  top: 22%;
  left: 22%;
  transform: rotate(-5deg);
}

/* LLaMA — near upper-right of center */
.obj-inner2 {
  font-size: clamp(1.2rem, 2vw, 2.4rem);
  top: 18%;
  left: auto;
  right: 28%;
  transform: rotate(8deg);
}

/* Whisper — left of center-mid */
.obj-inner3 {
  font-size: clamp(0.9rem, 1.5vw, 1.7rem);
  top: 50%;
  left: 14%;
  transform: rotate(-10deg);
}

/* Flux — right of center-mid */
.obj-inner4 {
  font-size: clamp(1.3rem, 2.2vw, 2.6rem);
  top: 48%;
  left: auto;
  right: 18%;
  transform: rotate(6deg);
}

/* Kling — below center-left */
.obj-inner5 {
  font-size: clamp(1.1rem, 1.8vw, 2.1rem);
  bottom: 20%;
  top: auto;
  left: 20%;
  transform: rotate(12deg);
}

/* CapCut — below center-right */
.obj-inner6 {
  font-size: clamp(0.95rem, 1.6vw, 1.9rem);
  bottom: 22%;
  top: auto;
  left: auto;
  right: 22%;
  transform: rotate(-8deg);
}

/* Continuous float for ambient life — varied timings */
.obj-pyramid  { animation: chFloat 6s ease-in-out infinite; }
.obj-star     { animation: chFloat 8s ease-in-out infinite -1s; }
.obj-sphere   { animation: chFloat 5.5s ease-in-out infinite -2s; }
.obj-blob     { animation: chFloat 9s ease-in-out infinite -3s; }
.obj-cylinder { animation: chFloat 7s ease-in-out infinite -1.5s; }
.obj-cube     { animation: chFloat 6.5s ease-in-out infinite -4s; }
.obj-star2    { animation: chFloat 7.5s ease-in-out infinite -0.5s; }
.obj-blob2    { animation: chFloat 8.5s ease-in-out infinite -2.5s; }
.obj-pyramid2 { animation: chFloat 6s ease-in-out infinite -3.5s; }
.obj-sphere2  { animation: chFloat 5s ease-in-out infinite -1.2s; }
.obj-inner1   { animation: chFloat 7s ease-in-out infinite -0.8s; }
.obj-inner2   { animation: chFloat 6s ease-in-out infinite -2.2s; }
.obj-inner3   { animation: chFloat 8s ease-in-out infinite -1.6s; }
.obj-inner4   { animation: chFloat 5.5s ease-in-out infinite -3.2s; }
.obj-inner5   { animation: chFloat 7.5s ease-in-out infinite -0.4s; }
.obj-inner6   { animation: chFloat 6.5s ease-in-out infinite -2.8s; }

/* ── Hero Logo (oversized, top of hero) ── */
.ch-hero-logo {
  width: clamp(600px, 90vw, 1600px);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 16px 48px rgba(255, 255, 255, 0.08))
          drop-shadow(0 4px 16px rgba(0, 0, 0, 0.4));
}

/* ============================================
   Keyframes
   ============================================ */

@keyframes chMarquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-12.5%); }
}

@keyframes chFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-18px) rotate(3deg); }
  50% { transform: translateY(-28px) rotate(-2deg); }
  75% { transform: translateY(-12px) rotate(2deg); }
}

/* ============================================
   Responsive
   ============================================ */

@media (max-width: 1024px) {
  .ch-content-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .ch-text-column {
    align-items: center;
  }

  .ch-right-column {
    display: none;
  }

  .ch-desc {
    max-width: 600px;
  }

  .ch-cta-group {
    justify-content: center;
  }

  .obj-pyramid  { font-size: 2rem;   top: 3%;  left: 15%; }
  .obj-star     { font-size: 1.5rem; top: 5%;  right: 15%; left: auto; }
  .obj-sphere   { font-size: 1.6rem; top: 36%; left: 2%; }
  .obj-blob     { font-size: 1.4rem; top: 40%; right: 3%; left: auto; }
  .obj-cylinder { font-size: 1.7rem; bottom: 10%; top: auto; left: 3%; }
  .obj-cube     { font-size: 1.5rem; bottom: 12%; top: auto; right: 6%; left: auto; }
  .obj-star2    { font-size: 1rem;   top: 14%; left: 5%; }
  .obj-blob2    { font-size: 0.9rem; bottom: 4%; top: auto; left: 18%; }
  .obj-pyramid2 { font-size: 1.1rem; bottom: 3%; top: auto; right: 18%; left: auto; }
  .obj-sphere2  { font-size: 0.85rem; top: 18%; right: 5%; left: auto; }
}

@media (max-width: 640px) {
  .ch-headline {
    font-size: clamp(2rem, 8vw, 3rem);
  }

  .ch-desc {
    font-size: 0.95rem;
  }

  .obj-pyramid  { font-size: 1.4rem; top: 3%;  left: 8%; }
  .obj-star     { font-size: 1rem;   top: 4%;  right: 8%; left: auto; }
  .obj-sphere   { font-size: 1.1rem; top: 32%; left: 1%; }
  .obj-blob     { font-size: 0.9rem; top: 35%; right: 2%; left: auto; }
  .obj-cylinder { font-size: 1.2rem; bottom: 8%; top: auto; left: 2%; }
  .obj-cube     { font-size: 1rem;   bottom: 10%; top: auto; right: 3%; left: auto; }
  .obj-star2    { font-size: 0.7rem; top: 12%; left: 3%; }
  .obj-blob2    { font-size: 0.65rem; bottom: 3%; top: auto; left: 12%; }
  .obj-pyramid2 { font-size: 0.75rem; bottom: 3%; top: auto; right: 12%; left: auto; }
  .obj-sphere2  { font-size: 0.6rem; top: 15%; right: 3%; left: auto; }

  .ch-marquee-text { font-size: 5rem; }
}
</style>

<!-- Non-scoped: flying logo is Teleported to body -->
<style>
.ch-flying-logo {
  position: fixed;
  z-index: 60;
  pointer-events: none;
  object-fit: contain;
  opacity: 0;
  will-change: top, left, width;
  filter: drop-shadow(0 8px 24px rgba(255, 255, 255, 0.06))
          drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}
</style>
