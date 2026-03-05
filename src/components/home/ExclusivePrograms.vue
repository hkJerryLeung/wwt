<script setup lang="ts">
/* Demo data – will swap to Supabase later */
const programs = [
  {
    id: '01',
    title: 'Super Sort',
    desc: '智能檔案分類與整理工具，自動識別檔案類型與內容，一鍵將雜亂的檔案歸類到正確位置，大幅提升工作效率。',
    images: [
      '/demo/programs/p1-1.png',
      '/demo/programs/p1-2.png',
      '/demo/programs/p1-3.png',
      '/demo/programs/p1-4.png',
      '/demo/programs/p1-5.png',
      '/demo/programs/p1-6.png',
    ],
    link: '#',
  },
  {
    id: '02',
    title: 'SRT Tools',
    desc: '專業字幕處理工具箱，支援 SRT 字幕的批量編輯、時間軸調整、格式轉換與翻譯，讓字幕製作流程更加順暢高效。',
    images: [
      '/demo/programs/p2-1.png',
      '/demo/programs/p2-2.png',
      '/demo/programs/p2-3.png',
      '/demo/programs/p2-4.png',
      '/demo/programs/p2-5.png',
      '/demo/programs/p2-6.png',
    ],
    link: '#',
  },
]
</script>

<template>
  <section class="ep">
    <!-- Section header -->
    <div class="ep__header">
      <div class="ep__header-left">
        <span class="ep__badge">LAB</span>
        <h2 class="ep__title">獨家程式</h2>
      </div>
      <div class="ep__header-right">
        <h3 class="ep__heading">
          每個程式的起點，都源於解決真實問題的初心，<br>
          精煉意圖，匠心打造。
        </h3>
      </div>
    </div>

    <!-- Program rows -->
    <div class="ep__rows">
      <a
        v-for="program in programs"
        :key="program.id"
        :href="program.link"
        class="ep__row"
      >
        <!-- Left: number + text -->
        <div class="ep__row-info">
          <span class="ep__row-number">{{ program.id }}.</span>
          <div class="ep__row-text">
            <h3 class="ep__row-title">{{ program.title }}</h3>
            <p class="ep__row-desc">{{ program.desc }}</p>
          </div>
        </div>

        <!-- Right: horizontal scroll image gallery -->
        <div class="ep__row-gallery">
          <div class="ep__row-gallery-track">
            <div
              v-for="(img, idx) in program.images"
              :key="idx"
              class="ep__row-img-wrap"
            >
              <img
                :src="img"
                :alt="`${program.title} — ${idx + 1}`"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </a>
    </div>
  </section>
</template>

<style scoped>
/* ===== Section ===== */
.ep {
  background: #fafaf8;
  padding: 8rem 0 6rem;
}

/* ===== Header ===== */
.ep__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 3rem;
  max-width: 1800px;
  margin: 0 auto 4rem;
  padding: 0 4rem;
}

.ep__header-left {
  flex: 1;
}

.ep__header-right {
  flex-shrink: 0;
  max-width: 540px;
  padding-top: 2.5rem;
}

.ep__title {
  font-family: var(--font-blueprint, 'Inter', sans-serif);
  font-size: clamp(2.4rem, 5vw, 4rem);
  font-weight: 900;
  line-height: 1.2;
  color: #1f1f1f;
  letter-spacing: -0.02em;
  margin: 0;
}

.ep__heading {
  font-family: var(--font-blueprint, 'Inter', sans-serif);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.5;
  color: #1f1f1f;
  letter-spacing: -0.01em;
  margin: 0;
}

.ep__badge {
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

/* ===== Rows container ===== */
.ep__rows {
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 4rem;
}

/* ===== Single row ===== */
.ep__row {
  display: flex;
  align-items: flex-start;
  gap: 6rem;
  padding: 2.5rem 0;
  border-top: 1px solid #e0e0dc;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.3s ease;
}

.ep__row:hover {
  opacity: 0.85;
}

/* ===== Left info ===== */
.ep__row-info {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  flex-shrink: 0;
  width: 380px;
  padding-top: 0.25rem;
}

.ep__row-number {
  font-family: var(--font-blueprint, 'Inter', sans-serif);
  font-size: 12px;
  font-weight: 400;
  color: #999;
  letter-spacing: 0.05em;
  flex-shrink: 0;
  padding-top: 4px;
}

.ep__row-text {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.ep__row-title {
  font-family: var(--font-blueprint, 'Inter', sans-serif);
  font-size: 28px;
  font-weight: 600;
  color: #1f1f1f;
  line-height: 1.4;
  margin: 0;
}

.ep__row-desc {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  color: #5e5e5e;
  margin: 0;
  max-width: 320px;
}

/* ===== Right gallery ===== */
.ep__row-gallery {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.ep__row-gallery::-webkit-scrollbar {
  display: none;
}

.ep__row-gallery-track {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.ep__row-img-wrap {
  flex-shrink: 0;
  width: 187px;
  height: 246px;
  border-radius: 0;
  overflow: hidden;
  background: #eee;
}

.ep__row-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.ep__row:hover .ep__row-img-wrap img {
  transform: scale(1.03);
}

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .ep {
    padding: 5rem 0 4rem;
  }

  .ep__header {
    flex-direction: column;
    gap: 1.5rem;
    padding: 0 1.5rem;
    margin-bottom: 3rem;
  }

  .ep__header-right {
    max-width: none;
    padding-top: 0;
  }

  .ep__title {
    font-size: 28px;
  }

  .ep__rows {
    padding: 0 1.5rem;
  }

  .ep__row {
    flex-direction: column;
    gap: 1.5rem;
  }

  .ep__row-info {
    width: 100%;
    gap: 1rem;
  }

  .ep__row-desc {
    max-width: 100%;
  }

  .ep__row-img-wrap {
    width: 140px;
    height: 184px;
  }
}

@media (max-width: 480px) {
  .ep__header {
    padding: 0 1rem;
  }

  .ep__rows {
    padding: 0 1rem;
  }

  .ep__row-img-wrap {
    width: 120px;
    height: 158px;
  }
}
</style>
