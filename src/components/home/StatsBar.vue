<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface StatItem {
  value: number
  suffix: string
  label: string
}

const stats: StatItem[] = [
  { value: 50, suffix: '+', label: 'Brand Collaborations' },
  { value: 10, suffix: '+', label: 'Years Experience' },
  { value: 90, suffix: '+', label: 'Projects Completed' },
  { value: 20, suffix: '+', label: 'Industries Served' },
]

/* ── Counting animation ── */
const displayed = ref<number[]>(stats.map(() => 0))
const sectionRef = ref<HTMLElement | null>(null)
let animated = false

function animateCounters() {
  if (animated) return
  animated = true
  const duration = 1600 // ms
  const fps = 60
  const totalFrames = Math.round(duration / (1000 / fps))

  stats.forEach((stat, i) => {
    let frame = 0
    const step = () => {
      frame++
      const progress = frame / totalFrames
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      displayed.value[i] = Math.round(eased * stat.value)
      if (frame < totalFrames) {
        requestAnimationFrame(step)
      } else {
        displayed.value[i] = stat.value
      }
    }
    requestAnimationFrame(step)
  })
}

onMounted(() => {
  if (!sectionRef.value) return
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        animateCounters()
        observer.disconnect()
      }
    },
    { threshold: 0.3 },
  )
  observer.observe(sectionRef.value)
})
</script>

<template>
  <section ref="sectionRef" class="stats-bar">
    <div class="stats-inner">
      <div v-for="(stat, idx) in stats" :key="idx" class="stat-item">
        <span class="stat-value">{{ displayed[idx] }}{{ stat.suffix }}</span>
        <span class="stat-label">{{ stat.label }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ===== Section ===== */
.stats-bar {
  position: relative;
  background: linear-gradient(
    180deg,
    #c41230 01%,
    #990011 20%,
    #6b000c 80%
  );
  padding: 5rem 2rem;
  border-bottom: none;
  overflow: hidden;
}

/* Film grain / noise texture overlay */
.stats-bar::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: 1;
}

/* Subtle vignette */
.stats-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.3) 100%);
  pointer-events: none;
  z-index: 1;
}

/* ===== Grid ===== */
.stats-inner {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ===== Each stat ===== */
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

/* ===== Number ===== */
.stat-value {
  font-family: var(--font-blueprint);
  font-size: clamp(40px, 5vw, 64px);
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* ===== Label ===== */
.stat-label {
  font-family: var(--font-blueprint);
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 0.5px;
  text-transform: capitalize;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .stats-bar {
    padding: 3rem 1.5rem;
  }

  .stats-inner {
    flex-wrap: wrap;
    gap: 2.5rem 0;
  }

  .stat-item {
    flex: 0 0 50%;
  }

  .stat-value {
    font-size: 36px;
  }
}
</style>
