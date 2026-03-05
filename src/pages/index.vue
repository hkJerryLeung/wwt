<script setup lang="ts">
import { ref } from 'vue'
import CohesionHero from '@/components/home/CohesionHero.vue'
import StatsBar from '@/components/home/StatsBar.vue'
import CategoryCards from '@/components/home/CategoryCards.vue'
import FeaturedPosts from '@/components/home/FeaturedPosts.vue'
import MotionWorks from '@/components/home/MotionWorks.vue'
import ExclusivePrograms from '@/components/home/ExclusivePrograms.vue'
import CtaSection from '@/components/home/CtaSection.vue'
import { useScrollReveal } from '@/composables/useScrollReveal'

const pageRef = ref<HTMLElement | null>(null)
useScrollReveal(pageRef)
</script>

<template>
  <div ref="pageRef">
    <CohesionHero />
    <StatsBar />
    <div class="scroll-reveal">
      <CategoryCards />
    </div>
    <div class="scroll-reveal">
      <FeaturedPosts />
    </div>
    <div class="scroll-reveal">
      <MotionWorks />
    </div>
    <div class="scroll-reveal">
      <ExclusivePrograms />
    </div>
    <div class="scroll-reveal">
      <CtaSection />
    </div>
  </div>
</template>
