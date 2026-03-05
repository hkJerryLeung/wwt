<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

/* Demo data – will swap to Supabase later */
const demoWorks = [
  { id: '1', title: '品牌影片製作', desc: '為品牌打造具影響力的視覺故事，從策略到上線一站式服務。', image: '/demo/motion1.png', link: '#' },
  { id: '2', title: '商業廣告拍攝', desc: '專業廣告拍攝，將產品以最吸引的方式呈現給目標客群。', image: '/demo/motion2.png', link: '#' },
  { id: '3', title: '活動紀錄影片', desc: '記錄每個精彩瞬間，活動現場的沉浸式影像體驗。', image: '/demo/motion3.png', link: '#' },
  { id: '4', title: '後期特效製作', desc: '從動態圖像到 VFX 合成，為影片注入獨特視覺衝擊。', image: '/demo/motion4.png', link: '#' },
]

/* ===== Parallax lines ===== */
interface ParallaxLine {
  id: number
  x: number        // % from left
  y: number        // initial top offset in px
  length: number   // height in px
  width: number    // thickness in px
  opacity: number  // base opacity
  zLayer: number   // 0 = far, 1 = mid, 2 = near
  speed: number    // parallax speed multiplier
  animDelay: number  // animation delay in s
  animDuration: number // animation duration in s
  bobAmount: number // how many px to bob vertically
}

// Speed multipliers per z-layer (far moves slow, near moves fast)
const LAYER_SPEEDS = [0.15, 0.35, 0.6]
const LINE_COUNT = 40

// Distribute lines: left (0-30%), right (70-100%), center flanks avoiding text
function randomX(zone: 'left' | 'right' | 'center-left' | 'center-right'): number {
  if (zone === 'left') return Math.random() * 30
  if (zone === 'right') return 70 + Math.random() * 30
  if (zone === 'center-left') return 30 + Math.random() * 12   // 30–42%
  return 58 + Math.random() * 12   // center-right: 58–70%
}

function generateLines(): ParallaxLine[] {
  const lines: ParallaxLine[] = []
  // 14 left, 14 right, 8 center-left, 4 center-right
  const zones: Array<'left' | 'right' | 'center-left' | 'center-right'> = []
  for (let i = 0; i < 14; i++) zones.push('left')
  for (let i = 0; i < 14; i++) zones.push('right')
  for (let i = 0; i < 8; i++) zones.push('center-left')
  for (let i = 0; i < 4; i++) zones.push('center-right')

  for (let i = 0; i < LINE_COUNT; i++) {
    const zLayer = Math.floor(Math.random() * 3)
    lines.push({
      id: i,
      x: randomX(zones[i]!),
      y: Math.random() * 2200 - 200,
      length: 80 + Math.random() * 320,
      width: 2 + Math.random() * 3,   // 2px–5px (roughly 3x the old 1px)
      opacity: 0.10 + Math.random() * 0.55,  // up to ~0.65
      zLayer,
      speed: LAYER_SPEEDS[zLayer],
      animDelay: Math.random() * -10,
      animDuration: 3 + Math.random() * 4,
      bobAmount: 20 + Math.random() * 40,
    })
  }
  return lines
}

const lines = ref<ParallaxLine[]>(generateLines())
const sectionRef = ref<HTMLElement | null>(null)
const lineOffsets = ref<number[]>(new Array(LINE_COUNT).fill(0))
let rafId = 0

function onScroll() {
  if (!sectionRef.value) return
  const rect = sectionRef.value.getBoundingClientRect()
  // How far the section top is from viewport center
  const scrollProgress = -rect.top
  lineOffsets.value = lines.value.map(l => scrollProgress * l.speed)
}

function tick() {
  onScroll()
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  rafId = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
})
</script>

<template>
  <section class="mw" ref="sectionRef">
    <!-- Background parallax lines -->
    <div class="mw__lines" aria-hidden="true">
      <div
        v-for="(line, i) in lines"
        :key="line.id"
        class="mw__line"
        :class="`mw__line--z${line.zLayer}`"
        :style="{
          left: line.x + '%',
          top: line.y + 'px',
          height: line.length + 'px',
          width: line.width + 'px',
          opacity: line.opacity,
          transform: `translateY(${lineOffsets[i]}px)`,
          animationDelay: line.animDelay + 's',
          animationDuration: line.animDuration + 's',
          '--bob': line.bobAmount + 'px',
        }"
      />
    </div>

    <!-- Content container with max-width to keep cards close -->
    <div class="mw__container">
      <!-- Sticky center text -->
      <div class="mw__sticky">
        <span class="mw__badge">MOTION WORKS</span>
        <h2 class="mw__title">
          從創意發想到<br>
          <em>完美呈現</em><br>
          我們的影像作品
        </h2>
      </div>

      <!-- Card 1: top-left -->
      <div class="mw__card mw__card--tl">
        <div class="mw__card-img"><img :src="demoWorks[0].image" :alt="demoWorks[0].title" loading="lazy" /></div>
        <div class="mw__card-body">
          <h3>{{ demoWorks[0].title }}</h3>
          <p>{{ demoWorks[0].desc }}</p>
          <a :href="demoWorks[0].link" class="mw__card-link">查看作品 <span>→</span></a>
        </div>
      </div>

      <!-- Card 2: top-right -->
      <div class="mw__card mw__card--tr">
        <div class="mw__card-img"><img :src="demoWorks[1].image" :alt="demoWorks[1].title" loading="lazy" /></div>
        <div class="mw__card-body">
          <h3>{{ demoWorks[1].title }}</h3>
          <p>{{ demoWorks[1].desc }}</p>
          <a :href="demoWorks[1].link" class="mw__card-link">查看作品 <span>→</span></a>
        </div>
      </div>

      <!-- Card 3: bottom-left -->
      <div class="mw__card mw__card--bl">
        <div class="mw__card-img"><img :src="demoWorks[2].image" :alt="demoWorks[2].title" loading="lazy" /></div>
        <div class="mw__card-body">
          <h3>{{ demoWorks[2].title }}</h3>
          <p>{{ demoWorks[2].desc }}</p>
          <a :href="demoWorks[2].link" class="mw__card-link">查看作品 <span>→</span></a>
        </div>
      </div>

      <!-- Card 4: bottom-right -->
      <div class="mw__card mw__card--br">
        <div class="mw__card-img"><img :src="demoWorks[3].image" :alt="demoWorks[3].title" loading="lazy" /></div>
        <div class="mw__card-body">
          <h3>{{ demoWorks[3].title }}</h3>
          <p>{{ demoWorks[3].desc }}</p>
          <a :href="demoWorks[3].link" class="mw__card-link">查看作品 <span>→</span></a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ===== Section ===== */
.mw {
  position: relative;
  background: #000;
  overflow: clip;
}

/* ===== Background: parallax lines ===== */
.mw__lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.mw__line {
  position: absolute;
  will-change: transform;
  background: rgba(255, 255, 255, 1);
  border-radius: 1px;
  animation: mw-bob ease-in-out infinite alternate;
}

@keyframes mw-bob {
  0%   { margin-top: 0; }
  100% { margin-top: var(--bob, 20px); }
}

/* ===== Container: constrains width so cards stay close ===== */
.mw__container {
  position: relative;
  max-width: 1800px;
  margin: 0 auto;
  height: 2200px;
  padding-top: 160px;
}

/* ===== Sticky center text ===== */
.mw__sticky {
  position: sticky;
  top: 50vh;
  transform: translateY(-50%);
  z-index: 1;
  text-align: center;
  pointer-events: none;
  padding: 0 2rem;
}

.mw__badge {
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

.mw__title {
  font-family: var(--font-blueprint);
  font-size: clamp(34px, 4.5vw, 56px);
  font-weight: 700;
  color: var(--color-bp-white, #fff);
  line-height: 1.3;
  letter-spacing: -0.02em;
  max-width: 600px;
  margin: 0 auto;
}

.mw__title em {
  font-style: italic;
  color: var(--color-bp-accent, #990011);
}

/* ===== Cards — absolutely positioned within 1200px container ===== */
.mw__card {
  position: absolute;
  z-index: 2;
  background: #f4f3ea;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.4);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.mw__card:hover {
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.6);
  transform: translateY(-6px) !important;
}

/* Card 1: top-left */
.mw__card--tl {
  width: 520px;
  left: -60px;
  top: 180px;
}

/* Card 2: top-right — largest */
.mw__card--tr {
  width: 600px;
  right: -80px;
  top: 100px;
}

/* Card 3: bottom-left — shifted right */
.mw__card--bl {
  width: 560px;
  left: 20px;
  top: 1200px;
}

/* Card 4: bottom-right */
.mw__card--br {
  width: 520px;
  right: 0;
  top: 900px;
}

/* ===== Card image ===== */
.mw__card-img {
  margin: 10px;
  border-radius: 14px;
  overflow: hidden;
  aspect-ratio: 4 / 3;
}

.mw__card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.mw__card:hover .mw__card-img img {
  transform: scale(1.05);
}

/* ===== Card body ===== */
.mw__card-body {
  padding: 1rem 1.4rem 1.6rem;
}

.mw__card-body h3 {
  font-family: var(--font-blueprint);
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.4rem;
}

.mw__card-body p {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 0.8rem;
}

.mw__card-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-blueprint);
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-decoration: none;
  transition: color 0.2s ease;
}

.mw__card-link:hover {
  color: var(--color-bp-accent, #990011);
}

/* ===== Responsive ===== */
@media (max-width: 1200px) {
  .mw__container {
    max-width: 100%;
    padding-left: 2rem;
    padding-right: 2rem;
  }
  .mw__card--tl { width: 420px; left: 0; }
  .mw__card--tr { width: 480px; right: 0; }
  .mw__card--bl { width: 450px; left: 10px; }
  .mw__card--br { width: 420px; right: 0; }
}

@media (max-width: 900px) {
  .mw__container {
    height: auto;
    padding: 4rem 1.5rem;
  }

  .mw__sticky {
    position: relative;
    top: auto;
    transform: none;
    margin-bottom: 3rem;
  }

  .mw__card {
    position: relative;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    width: 100% !important;
    max-width: 440px;
    margin: 0 auto 2rem;
  }

  .mw__title {
    font-size: 28px;
  }
}
</style>
