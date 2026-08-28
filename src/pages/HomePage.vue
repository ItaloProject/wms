<template>
  <div class="home-page">
        <!-- Fundo: vídeo (quando existir) com fallback em slideshow de fotos -->
        <video
          class="home-bg-video"
          autoplay loop muted playsinline
          poster="/bg-home.jpg"
          @error="bgVideoError = true"
          v-show="!bgVideoError"
        >
          <source src="/bg-home.mp4" type="video/mp4" />
        </video>
        <template v-if="bgVideoError">
          <div
            v-for="(img, i) in bgImages"
            :key="img"
            class="home-bg-img"
            :class="{ 'home-bg-img--active': i === activeBgIndex }"
            :style="{ backgroundImage: `url(${img})`, animationDelay: `${i * -9}s` }"
          />
        </template>
        <div class="home-bg-overlay" />

        <header class="home-header">
          <div class="brand row items-center no-wrap">
            <div class="brand-badge flex flex-center">
              <img v-if="logoExists" src="/logo.png" alt="WMS" class="brand-logo" />
              <q-icon v-else name="inventory_2" size="22px" color="white" />
            </div>
            <div class="brand-text q-ml-sm">
              <div class="brand-title">
                <span v-for="(char, i) in 'WMS'" :key="i" class="brand-char" :style="{ '--i': i }">{{ char }}</span>
              </div>
              <div class="brand-subtitle">
                <span v-for="(char, i) in 'Consultoria'" :key="i" class="sub-char" :style="{ '--i': i }">{{ char }}</span>
              </div>
            </div>
          </div>
          <q-space />
          <div class="info-bar row items-center no-wrap">

            <div class="info-segment">
              <div class="info-label">Data</div>
              <div class="info-value">
                <q-icon name="calendar_today" size="13px" class="q-mr-xs info-icon" />
                <span style="text-transform: capitalize">{{ today }}</span>
              </div>
            </div>

            <div class="info-sep" />

            <div class="info-segment">
              <div class="info-label">Horário</div>
              <div class="info-value">
                <q-icon name="schedule" size="13px" class="q-mr-xs info-icon" />
                <span class="info-mono">{{ time }}</span>
              </div>
            </div>

            <div class="info-sep" />

            <div class="info-segment info-segment--weather">
              <div class="info-label"><q-icon name="place" size="10px" class="q-mr-xs" />São Luís · MA</div>
              <div class="info-value">
                <q-icon :name="weatherIcon" size="15px" class="q-mr-xs info-icon--weather" />
                <span class="info-temp" v-if="temp !== null">{{ temp }}°C</span>
                <span class="info-temp" v-else>—</span>
              </div>
            </div>

          </div>
        </header>

        <div class="home-content">
          <div class="text-center home-hero-head">
            <p class="home-eyebrow">Portal interno</p>
            <h1 class="home-title">Bem-vindo ao <span class="highlight">WMS</span></h1>
            <p class="home-caption">Selecione o setor para acessar o sistema</p>
          </div>

          <div class="cards-grid">
            <q-card
              v-for="(sector, i) in sectors"
              :key="sector.slug"
              v-ripple="!sector.locked"
              flat
              class="sector-card"
              :class="sector.locked ? 'sector-card--locked' : 'cursor-pointer'"
              :style="{ '--card-color': sector.color, '--delay': `${i * 80}ms` }"
              tabindex="0"
              role="button"
              :aria-label="`Acessar ${sector.label}`"
              @click="handleCard(sector)"
              @keyup.enter="handleCard(sector)"
            >
              <div class="card-glow" />

              <!-- cadeado para módulos em andamento -->
              <div v-if="sector.locked" class="lock-badge flex flex-center">
                <q-icon name="lock" size="14px" color="white" />
              </div>

              <q-card-section class="column q-gutter-sm">
                <div class="sector-icon flex flex-center">
                  <q-icon :name="sector.icon" size="30px" color="white" />
                </div>
                <div class="sector-label">{{ sector.label }}</div>
                <div class="sector-description">{{ sector.description }}</div>
              </q-card-section>

              <q-card-section class="card-footer row items-center q-pt-none">
                <template v-if="sector.locked">
                  <q-icon name="build" size="15px" class="q-mr-xs" />
                  <span>Em andamento</span>
                </template>
                <template v-else>
                  <span>Acessar</span>
                  <q-icon name="arrow_forward" size="18px" class="q-ml-xs arrow" />
                </template>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <footer class="home-footer row items-center justify-between q-py-md">
          <span>© {{ new Date().getFullYear() }} WMS Consultoria · Todos os direitos reservados</span>
          <span>Acesso restrito a colaboradores</span>
        </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { sectors } from '../sectors'

const router = useRouter()
const $q = useQuasar()

const logoExists   = ref(true)
const bgVideoError = ref(false)

const bgImages     = ['/bg-home.jpg', '/bg-home-2.jpg', '/bg-home-3.jpg']
const activeBgIndex = ref(0)
let bgSlideTimer = null

const today = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long'
}).format(new Date())

const time = ref('')
const temp = ref(null)
const weatherIcon = ref('wb_sunny')

function updateTime() {
  time.value = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date())
}

async function fetchWeather() {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-2.5297&longitude=-44.3028&current_weather=true&temperature_unit=celsius&timezone=America%2FFortaleza'
    )
    const data = await res.json()
    temp.value = Math.round(data.current_weather.temperature)
    const code = data.current_weather.weathercode
    // WMO weather code → ícone Material Icons clássico (evita Material Symbols ausentes)
    if (code === 0) weatherIcon.value = 'wb_sunny'
    else if (code <= 3) weatherIcon.value = 'wb_cloudy'
    else if (code <= 48) weatherIcon.value = 'cloud'
    else if (code <= 67) weatherIcon.value = 'grain'
    else if (code <= 77) weatherIcon.value = 'ac_unit'
    else weatherIcon.value = 'thunderstorm'
  } catch {
    temp.value = null
  }
}

// Confirma que /bg-home.mp4 é mesmo um vídeo antes de tentar tocá-lo.
// Necessário porque o fallback de SPA (Vite dev e alguns hosts) responde 200
// com HTML no lugar de um arquivo inexistente, e o <video> nem sempre dispara
// o evento "error" nesse caso — então o HEAD manual evita ficar preso a um
// vídeo "fantasma" que nunca chega a carregar.
async function checkBgVideo() {
  try {
    const res = await fetch('/bg-home.mp4', { method: 'HEAD' })
    const ct = res.headers.get('content-type') || ''
    if (!res.ok || !ct.startsWith('video')) bgVideoError.value = true
  } catch {
    bgVideoError.value = true
  }
}

let ticker = null
onMounted(() => {
  updateTime()
  ticker = setInterval(updateTime, 1000)
  fetchWeather()
  // atualiza temperatura a cada 10 min
  setInterval(fetchWeather, 600_000)

  checkBgVideo()

  // Slideshow do fundo: alterna a cada 8s (crossfade via CSS)
  bgSlideTimer = setInterval(() => {
    activeBgIndex.value = (activeBgIndex.value + 1) % bgImages.length
  }, 8000)
})
onUnmounted(() => {
  clearInterval(ticker)
  clearInterval(bgSlideTimer)
})

function handleCard(sector) {
  if (sector.locked) {
    $q.notify({
      icon: 'construction',
      color: 'blue-9',
      textColor: 'white',
      message: `<b>${sector.label}</b> está em desenvolvimento`,
      caption: 'Este módulo estará disponível em breve.',
      html: true,
      position: 'top',
      timeout: 3000,
      actions: [{ icon: 'close', color: 'white', flat: true }]
    })
    return
  }
  router.push({ name: 'login', params: { sector: sector.slug } })
}
</script>

<style scoped>
.home-page {
  --lime: oklch(0.83 0.23 128);
  height: 100vh;
  height: 100dvh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #091644;
  font-family: 'Epilogue', ui-sans-serif, system-ui, sans-serif;
}

/* ── Vídeo de fundo ── */
.home-bg-video {
  position: fixed;
  inset: -20px;
  width: calc(100% + 40px);
  height: calc(100% + 40px);
  object-fit: cover;
  object-position: center;
  z-index: 0;
  pointer-events: none;
  animation: bg-kenburns 26s ease-in-out infinite alternate, bg-reveal 1.4s ease both;
  will-change: transform;
}

/* ── Slideshow de fotos (fallback quando não há vídeo) ── */
.home-bg-img {
  position: fixed;
  inset: -20px;
  width: calc(100% + 40px);
  height: calc(100% + 40px);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
  opacity: 0;
  pointer-events: none;
  animation: bg-kenburns 32s ease-in-out infinite alternate;
  transition: opacity 2s ease;
  will-change: transform, opacity;
}
.home-bg-img--active {
  opacity: 1;
}

/* Zoom/pan lento e contínuo — efeito "Ken Burns" cinematográfico */
@keyframes bg-kenburns {
  0%   { transform: scale(1.04) translate(0, 0); }
  50%  { transform: scale(1.12) translate(-1.2%, -0.8%); }
  100% { transform: scale(1.07) translate(1%, 0.4%); }
}
@keyframes bg-reveal {
  from { opacity: 0; filter: saturate(0.85) brightness(0.9); }
  to   { opacity: 1; filter: saturate(1) brightness(1); }
}

/* Overlay em múltiplas camadas: contraste nas bordas, veste a foto na paleta da marca */
.home-bg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(120% 90% at 50% 8%, rgba(9,22,68,0.05), transparent 55%),
    linear-gradient(120deg, rgba(6,12,26,0.88) 0%, rgba(6,12,26,0.32) 32%, rgba(6,12,26,0.28) 62%, rgba(6,12,26,0.9) 100%),
    linear-gradient(to bottom, rgba(6,12,26,0.62) 0%, rgba(6,12,26,0.12) 26%, rgba(6,12,26,0.22) 68%, rgba(6,12,26,0.85) 100%),
    linear-gradient(160deg, rgba(26,63,160,0.12), rgba(90,184,46,0.06) 60%, transparent 100%);
}
/* Vinheta sutil para foco central e granulado leve (textura "cinema") */
.home-bg-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(140% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%);
  mix-blend-mode: multiply;
}

/* garante que o conteúdo fique acima do overlay */
.home-page > *:not(.home-bg-video):not(.home-bg-img):not(.home-bg-overlay) {
  position: relative;
  z-index: 2;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(28px) scale(1.05); }
}

/* Header */
.home-header {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: clamp(8px, 1.5vh, 14px) clamp(16px, 3vw, 24px);
  flex-shrink: 0;
}
.brand {
  cursor: default;
}
.brand-badge {
  width: clamp(44px, 6vh, 64px);
  height: clamp(44px, 6vh, 64px);
}
.brand-logo {
  width: clamp(44px, 6vh, 64px);
  height: clamp(44px, 6vh, 64px);
  object-fit: contain;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.4));
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease;
  transform-origin: center;
}
.brand:hover .brand-logo {
  transform: rotate(15deg) scale(1.12);
  filter: drop-shadow(0 4px 18px color-mix(in oklab, var(--lime) 60%, transparent));
}

.brand-title {
  color: white;
  font-family: 'Urbanist', ui-sans-serif, system-ui, sans-serif;
  font-weight: 800;
  font-size: 1.5rem;
  line-height: 1.1;
  letter-spacing: 0.15em;
  display: flex;
}
.brand-subtitle {
  color: var(--lime);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  display: flex;
}

/* Letras individuais — WMS */
.brand-char {
  display: inline-block;
  transition: transform 0.3s ease, color 0.3s ease, text-shadow 0.3s ease;
  transition-delay: calc(var(--i) * 60ms);
}
.brand:hover .brand-char {
  transform: translateY(-5px) scale(1.1);
  color: var(--lime);
  text-shadow: 0 0 14px color-mix(in oklab, var(--lime) 80%, transparent);
  transition-delay: calc(var(--i) * 60ms);
}

/* Letras individuais — Consultoria */
.sub-char {
  display: inline-block;
  transition: transform 0.3s ease, color 0.3s ease, opacity 0.3s ease;
  transition-delay: calc(var(--i) * 40ms);
}
.brand:hover .sub-char {
  transform: translateY(-3px);
  color: #d9f99d;
  transition-delay: calc(var(--i) * 40ms);
}

@keyframes pulse-glow {
  0%, 100% { filter: drop-shadow(0 4px 18px color-mix(in oklab, var(--lime) 50%, transparent)); }
  50%       { filter: drop-shadow(0 4px 28px color-mix(in oklab, var(--lime) 90%, transparent)); }
}
.brand:hover .brand-logo {
  animation: pulse-glow 1.4s ease-in-out infinite;
}
.info-bar {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  overflow: hidden;
  color: white;
}

.info-segment {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 20px;
  gap: 2px;
  transition: background 0.2s;
}
.info-segment:hover {
  background: rgba(255, 255, 255, 0.07);
}

.info-segment--weather {
  background: color-mix(in oklab, var(--lime) 10%, transparent);
  border-left: 1px solid color-mix(in oklab, var(--lime) 20%, transparent);
}
.info-segment--weather:hover {
  background: color-mix(in oklab, var(--lime) 17%, transparent);
}

.info-label {
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1;
  display: flex;
  align-items: center;
}

.info-value {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
  font-size: 0.82rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  line-height: 1;
}

.info-icon {
  color: rgba(255, 255, 255, 0.5);
  margin-right: 4px;
  flex-shrink: 0;
}

.info-icon--weather {
  color: var(--lime);
  margin-right: 4px;
  flex-shrink: 0;
}

.info-mono {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

.info-temp {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--lime);
}

.info-sep {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

/* Hero */
.home-content {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(4px, 1vh, 16px) 16px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}
.home-content::-webkit-scrollbar { display: none; }
.home-hero-head {
  margin: 0 0 clamp(10px, 2.5vh, 26px);
  flex-shrink: 0;
}
.home-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
  margin: 0 0 clamp(4px, 1vh, 12px);
}
.home-title {
  color: white;
  font-family: 'Urbanist', ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(1.5rem, 4vmin, 2.6rem);
  font-weight: 800;
  margin: 0 0 6px;
  line-height: 1.15;
  text-shadow: 0 2px 16px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4);
}
.highlight {
  color: var(--lime);
}
.home-caption {
  color: rgba(255, 255, 255, 0.75);
  font-size: clamp(0.85rem, 1.8vmin, 1.05rem);
  margin: 0;
  text-shadow: 0 1px 8px rgba(0,0,0,0.5);
}

/* Cards */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(230px, 340px));
  gap: clamp(12px, 2.2vh, 24px);
  width: 100%;
  max-width: 760px;
  justify-content: center;
  flex-shrink: 1;
  min-height: 0;
}
@media (max-width: 680px) {
  .cards-grid { grid-template-columns: minmax(230px, 380px); }
}

.sector-card {
  position: relative;
  border-radius: 22px;
  background: rgba(10, 16, 32, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(18px) saturate(1.2);
  box-shadow: 0 8px 32px rgba(0,0,0,0.35);
  color: white;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  animation: card-in 0.5s ease both;
  animation-delay: var(--delay);
  outline: none;
}
.sector-card :deep(.q-card__section) {
  padding: clamp(12px, 2vh, 20px) clamp(14px, 2vw, 22px);
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.sector-card:hover,
.sector-card:focus-visible {
  transform: translateY(-6px);
  border-color: color-mix(in oklab, var(--lime) 40%, rgba(255, 255, 255, 0.3));
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.35);
}
.card-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(340px 200px at 15% 0%, color-mix(in oklab, var(--lime) 35%, transparent), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.sector-card:hover .card-glow,
.sector-card:focus-visible .card-glow { opacity: 1; }
.sector-card--locked:hover .card-glow,
.sector-card--locked:focus-visible .card-glow { opacity: 0; }

.sector-icon {
  width: clamp(42px, 6vh, 58px);
  height: clamp(42px, 6vh, 58px);
  border-radius: clamp(12px, 1.6vh, 16px);
  background: color-mix(in srgb, var(--card-color) 75%, transparent 0%);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--card-color) 40%, transparent);
}
.sector-label {
  font-family: 'Urbanist', ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(1rem, 2.1vh, 1.2rem);
  font-weight: 700;
  letter-spacing: 0.02em;
}
.sector-description {
  color: rgba(255, 255, 255, 0.6);
  font-size: clamp(0.76rem, 1.5vh, 0.85rem);
  line-height: 1.4;
  min-height: 2.2em;
}
.card-footer {
  color: var(--lime);
  font-weight: 700;
  font-size: clamp(0.74rem, 1.4vh, 0.82rem);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.card-footer .arrow { transition: transform 0.25s ease; }
.sector-card:hover .arrow { transform: translateX(6px); }

/* Cards travados */
.sector-card--locked {
  opacity: 0.55;
  cursor: not-allowed;
}
.sector-card--locked:hover {
  transform: none;
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: none;
}
.sector-card--locked .card-footer {
  color: rgba(255, 255, 255, 0.45);
}
.lock-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* Footer */
.home-footer {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.76rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 0 24px;
  padding: clamp(8px, 1.5vh, 14px) 0 !important;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
