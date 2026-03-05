<template>
  <div class="logo-animation" aria-label="Loading animation">
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      class="logo-svg"
    >
      <rect class="sq sq-left"   x="10" y="37" width="24" height="24" rx="4" fill="#990011" />
      <rect class="sq sq-center" x="38" y="37" width="24" height="24" rx="4" fill="#990011" />
      <rect class="sq sq-right"  x="66" y="37" width="24" height="24" rx="4" fill="#990011" />
    </svg>
  </div>
</template>

<style scoped>
.logo-animation {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  width: 48px;
}

.logo-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* Left: ML → TL → TC → MC → ML  (clockwise loop) */
.sq-left {
  transform-origin: 22px 49px;
  animation: wanderL 10s ease-in-out infinite;
}

@keyframes wanderL {
  0%        { transform: translate(0, 0)        rotate(0deg); }
  /* ① up to TL */
  8%        { transform: translate(0, -28px)    rotate(90deg); }
  24%       { transform: translate(0, -28px)    rotate(90deg); }
  /* ④ right to TC */
  32%       { transform: translate(28px, -28px) rotate(180deg); }
  48%       { transform: translate(28px, -28px) rotate(180deg); }
  /* ⑦ down to MC */
  56%       { transform: translate(28px, 0)     rotate(270deg); }
  72%       { transform: translate(28px, 0)     rotate(270deg); }
  /* ⑩ left to ML */
  80%       { transform: translate(0, 0)        rotate(360deg); }
  100%      { transform: translate(0, 0)        rotate(360deg); }
}

/* Center: MC → ML → BL → BC → MC  (counter-clockwise loop) */
.sq-center {
  transform-origin: 50px 49px;
  animation: wanderC 10s ease-in-out infinite;
}

@keyframes wanderC {
  0%, 8%    { transform: translate(0, 0)        rotate(0deg); }
  /* ② left to ML */
  16%       { transform: translate(-28px, 0)    rotate(-90deg); }
  32%       { transform: translate(-28px, 0)    rotate(-90deg); }
  /* ⑤ down to BL */
  40%       { transform: translate(-28px, 28px) rotate(-180deg); }
  56%       { transform: translate(-28px, 28px) rotate(-180deg); }
  /* ⑧ right to BC */
  64%       { transform: translate(0, 28px)     rotate(-270deg); }
  80%       { transform: translate(0, 28px)     rotate(-270deg); }
  /* ⑪ up to MC */
  88%       { transform: translate(0, 0)        rotate(-360deg); }
  100%      { transform: translate(0, 0)        rotate(-360deg); }
}

/* Right: MR → MC → MR → TR → MR  (zigzag) */
.sq-right {
  transform-origin: 78px 49px;
  animation: wanderR 10s ease-in-out infinite;
}

@keyframes wanderR {
  0%, 16%   { transform: translate(0, 0)       rotate(0deg); }
  /* ③ left to MC */
  24%       { transform: translate(-28px, 0)   rotate(-90deg); }
  40%       { transform: translate(-28px, 0)   rotate(-90deg); }
  /* ⑥ right to MR */
  48%       { transform: translate(0, 0)       rotate(0deg); }
  64%       { transform: translate(0, 0)       rotate(0deg); }
  /* ⑨ up to TR */
  72%       { transform: translate(0, -28px)   rotate(90deg); }
  88%       { transform: translate(0, -28px)   rotate(90deg); }
  /* ⑫ down to MR */
  96%       { transform: translate(0, 0)       rotate(0deg); }
  100%      { transform: translate(0, 0)       rotate(0deg); }
}

@media (prefers-reduced-motion: reduce) {
  .sq-left, .sq-right, .sq-center {
    animation: none;
  }
}
</style>
