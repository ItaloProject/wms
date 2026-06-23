<template>
  <div class="home-page">
        <div class="blob blob-1" />
        <div class="blob blob-2" />
        <div class="blob blob-3" />

        <header class="home-header row items-center q-px-xl q-py-md">
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
              <div class="info-value row items-center no-wrap">
                <q-icon name="calendar_today" size="13px" class="q-mr-xs info-icon" />
                <span style="text-transform: capitalize">{{ today }}</span>
              </div>
            </div>

            <div class="info-sep" />

            <div class="info-segment">
              <div class="info-label">Horário</div>
              <div class="info-value row items-center no-wrap">
                <q-icon name="schedule" size="13px" class="q-mr-xs info-icon" />
                <span class="info-mono">{{ time }}</span>
              </div>
            </div>

            <div class="info-sep" />

            <div class="info-segment info-segment--weather">
              <div class="info-label">São Luís · MA</div>
              <div class="info-value row items-center no-wrap">
                <q-icon :name="weatherIcon" size="15px" class="q-mr-xs info-icon--weather" />
                <span class="info-temp" v-if="temp !== null">{{ temp }}°C</span>
                <span class="info-temp" v-else>—</span>
              </div>
            </div>

          </div>
        </header>

        <div class="home-content column flex-center q-px-md">
          <div class="text-center q-mb-xl">
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
                  <q-icon name="construction" size="15px" class="q-mr-xs" />
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

        <footer class="home-footer text-center q-py-md">
          © {{ new Date().getFullYear() }} WMS Consultoria
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

const logoExists = ref(true)

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
      'https://api.open-meteo.com/v1/forecast?latitude=-2.5297&longitude=-44.3028&current=temperature_2m,weathercode&timezone=America%2FFortaleza'
    )
    const data = await res.json()
    temp.value = Math.round(data.current.temperature_2m)
    const code = data.current.weathercode
    // WMO weather code → ícone Material
    if (code === 0) weatherIcon.value = 'wb_sunny'
    else if (code <= 3) weatherIcon.value = 'partly_cloudy_day'
    else if (code <= 48) weatherIcon.value = 'cloud'
    else if (code <= 67) weatherIcon.value = 'rainy'
    else if (code <= 77) weatherIcon.value = 'ac_unit'
    else weatherIcon.value = 'thunderstorm'
  } catch {
    temp.value = null
  }
}

let ticker = null
onMounted(() => {
  updateTime()
  ticker = setInterval(updateTime, 1000)
  fetchWeather()
  // atualiza temperatura a cada 10 min
  setInterval(fetchWeather, 600_000)
})
onUnmounted(() => clearInterval(ticker))

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
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(900px 500px at 90% -5%, rgba(90, 184, 46, 0.18), transparent 55%),
    radial-gradient(700px 500px at -5% 105%, rgba(26, 63, 160, 0.5), transparent 55%),
    linear-gradient(150deg, #091644 0%, #0d1f5c 40%, #1a3fa0 100%);
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.28;
  pointer-events: none;
}
.blob-1 {
  width: 500px;
  height: 500px;
  background: #1a3fa0;
  top: -200px;
  right: -150px;
  animation: float 13s ease-in-out infinite;
}
.blob-2 {
  width: 380px;
  height: 380px;
  background: #5ab82e;
  bottom: -150px;
  left: -110px;
  animation: float 15s ease-in-out infinite reverse;
}
.blob-3 {
  width: 280px;
  height: 280px;
  background: #2563eb;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: float 10s ease-in-out infinite 2s;
}
@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(28px) scale(1.05); }
}

/* Header */
.home-header {
  position: relative;
  z-index: 2;
}
.brand {
  cursor: default;
}
.brand-badge {
  width: 80px;
  height: 80px;
}
.brand-logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.4));
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease;
  transform-origin: center;
}
.brand:hover .brand-logo {
  transform: rotate(15deg) scale(1.12);
  filter: drop-shadow(0 4px 18px rgba(90, 184, 46, 0.6));
}

.brand-title {
  color: white;
  font-weight: 900;
  font-size: 1.5rem;
  line-height: 1.1;
  letter-spacing: 0.15em;
  display: flex;
}
.brand-subtitle {
  color: #5ab82e;
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
  color: #a3e635;
  text-shadow: 0 0 14px rgba(163, 230, 53, 0.8);
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
  0%, 100% { filter: drop-shadow(0 4px 18px rgba(90, 184, 46, 0.5)); }
  50%       { filter: drop-shadow(0 4px 28px rgba(90, 184, 46, 0.9)); }
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
  background: rgba(90, 184, 46, 0.1);
  border-left: 1px solid rgba(90, 184, 46, 0.2);
}
.info-segment--weather:hover {
  background: rgba(90, 184, 46, 0.17);
}

.info-label {
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1;
}

.info-value {
  font-size: 0.82rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  line-height: 1;
}

.info-icon {
  color: rgba(255, 255, 255, 0.5);
}

.info-icon--weather {
  color: #a3e635;
}

.info-mono {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

.info-temp {
  font-size: 0.95rem;
  font-weight: 700;
  color: #a3e635;
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
  position: relative;
  z-index: 2;
  justify-content: center;
}
.home-title {
  color: white;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 900;
  margin: 0 0 6px;
  line-height: 1.15;
}
.highlight {
  background: linear-gradient(90deg, #5ab82e, #a3e635);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.home-caption {
  color: rgba(255, 255, 255, 0.65);
  font-size: 1.05rem;
  margin: 0;
}

/* Cards */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 340px));
  gap: 28px;
  width: 100%;
  max-width: 760px;
  justify-content: center;
}
@media (max-width: 680px) {
  .cards-grid { grid-template-columns: minmax(260px, 380px); }
}

.sector-card {
  position: relative;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(14px);
  color: white;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  animation: card-in 0.5s ease both;
  animation-delay: var(--delay);
  outline: none;
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.sector-card:hover,
.sector-card:focus-visible {
  transform: translateY(-6px);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.35);
}
.card-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(340px 200px at 15% 0%, color-mix(in srgb, var(--card-color) 40%, transparent), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.sector-card:hover .card-glow,
.sector-card:focus-visible .card-glow { opacity: 1; }

.sector-icon {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--card-color) 75%, transparent 0%);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--card-color) 40%, transparent);
}
.sector-label {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}
.sector-description {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  line-height: 1.4;
  min-height: 2.4em;
}
.card-footer {
  color: #a3e635;
  font-weight: 700;
  font-size: 0.82rem;
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
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Footer */
.home-footer {
  position: relative;
  z-index: 2;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.78rem;
}
</style>
