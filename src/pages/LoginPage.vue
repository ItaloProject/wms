<template>
  <div class="login-root">

    <!-- ── Painel esquerdo: branding ── -->
    <div class="brand-panel">
      <div class="blob b1" /><div class="blob b2" /><div class="blob b3" />

      <q-btn flat dense round icon="arrow_back" color="white" class="back-btn"
        @click="router.push({ name: 'home' })" />

      <div class="brand-content">
        <img src="/logo.png" alt="WMS" class="brand-logo" />
        <div class="brand-name">WMS</div>
        <div class="brand-tag">Consultoria Integrada</div>

        <div class="brand-divider" />

        <div class="sector-pill row items-center no-wrap justify-center">
          <q-icon :name="sector.icon" size="16px" class="q-mr-xs" />
          {{ sector.label }}
        </div>

        <p class="brand-desc">
          Acesso seguro ao módulo de<br />
          <strong>{{ sector.label }}</strong> da plataforma WMS.
        </p>

        <div class="feature-list">
          <div v-for="f in features" :key="f" class="feature-item">
            <q-icon name="check_circle" size="15px" style="color:#5ab82e" class="q-mr-sm" />
            {{ f }}
          </div>
        </div>
      </div>

      <div class="brand-footer">© {{ year }} WMS Consultoria</div>
    </div>

    <!-- ── Painel direito: formulário ── -->
    <div class="form-panel">
      <div class="form-box">

        <div class="form-header">
          <div class="form-eyebrow">Bem-vindo de volta</div>
          <h1 class="form-title">Faça seu login</h1>
          <p class="form-caption">Entre com suas credenciais para acessar o sistema</p>
        </div>

        <q-form class="form-fields" @submit.prevent="onSubmit">

          <div class="field-group">
            <label class="field-label">Usuário ou E-mail</label>
            <div class="custom-input-wrap">
              <q-icon name="person_outline" size="18px" class="field-icon" color="white" />
              <input
                v-model="user"
                type="text"
                placeholder="seu@email.com.br"
                autocomplete="username"
                class="custom-input"
                required
              />
            </div>
          </div>

          <div class="field-group">
            <div class="row items-center justify-between">
              <label class="field-label">Senha</label>
              <button type="button" class="forgot-btn">Esqueci a senha</button>
            </div>
            <div class="custom-input-wrap">
              <q-icon name="lock_outline" size="18px" class="field-icon" color="white" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••••"
                autocomplete="current-password"
                class="custom-input"
                required
              />
              <button type="button" class="eye-btn" @click="showPassword = !showPassword">
                <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" size="18px" color="grey-5" />
              </button>
            </div>
          </div>

          <label class="remember-row">
            <input v-model="remember" type="checkbox" class="remember-check" />
            <span class="remember-label">Lembrar neste dispositivo</span>
          </label>

          <button type="submit" class="login-btn" :disabled="loading">
            <span v-if="!loading" class="row items-center justify-center no-wrap" style="gap:8px">
              <q-icon name="login" size="20px" />
              Entrar no sistema
            </span>
            <q-spinner v-else size="22px" color="white" />
          </button>

        </q-form>

        <div class="secure-note">
          <q-icon name="shield" size="13px" style="color:#5ab82e" class="q-mr-xs" />
          Conexão segura · Dados criptografados
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { findSector } from '../sectors'
import { supabase } from '../lib/supabase'

const route  = useRoute()
const router = useRouter()
const $q     = useQuasar()

const sector   = computed(() => findSector(route.params.sector))
const year     = new Date().getFullYear()

const user         = ref('')
const password     = ref('')
const remember     = ref(false)
const showPassword = ref(false)
const loading      = ref(false)

const features = [
  'Gestão de processos contábeis',
  'Controle de documentos e prazos',
  'Relatórios e indicadores gerenciais',
]

async function onSubmit() {
  if (!user.value || !password.value) return
  loading.value = true
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email:    user.value.trim(),
      password: password.value,
    })
    if (error) throw error
    router.push({ name: 'gerenciamento' })
  } catch (err) {
    $q.notify({
      type:     'negative',
      message:  err.message === 'Invalid login credentials'
                  ? 'E-mail ou senha incorretos.'
                  : (err.message || 'Erro ao fazer login.'),
      position: 'top',
      timeout:  4000,
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── Root ── */
.login-root {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* ── Painel esquerdo ── */
.brand-panel {
  position: relative;
  width: 420px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(160deg, #091644 0%, #0d1f5c 50%, #1a3fa0 100%);
}
@media (max-width: 860px) { .brand-panel { display: none; } }

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.28;
  pointer-events: none;
}
.b1 { width:360px; height:360px; background:#1a3fa0; top:-140px; right:-100px; animation: fl 13s ease-in-out infinite; }
.b2 { width:280px; height:280px; background:#5ab82e; bottom:-100px; left:-80px; animation: fl 16s ease-in-out infinite reverse; }
.b3 { width:180px; height:180px; background:#2563eb; top:50%; left:40%; animation: fl 9s ease-in-out infinite 1s; }
@keyframes fl {
  0%,100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(22px) scale(1.06); }
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.18);
  backdrop-filter: blur(6px);
}

.brand-content {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 0 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.brand-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 4px 20px rgba(0,0,0,0.5));
  margin-bottom: 14px;
}
.brand-name {
  color: white;
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: 0.22em;
  line-height: 1;
}
.brand-tag {
  color: #5ab82e;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-top: 5px;
}
.brand-divider {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, #1a3fa0, #5ab82e);
  border-radius: 2px;
  margin: 18px 0;
}
.sector-pill {
  background: rgba(90,184,46,0.13);
  border: 1px solid rgba(90,184,46,0.3);
  color: #a3e635;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 30px;
  padding: 5px 16px;
  margin-bottom: 14px;
}
.brand-desc {
  color: rgba(255,255,255,0.55);
  font-size: 0.85rem;
  line-height: 1.65;
  margin: 0 0 18px;
}
.feature-list { text-align: left; width: 100%; }
.feature-item {
  display: flex;
  align-items: center;
  color: rgba(255,255,255,0.65);
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.brand-footer {
  position: absolute;
  bottom: 20px;
  color: rgba(255,255,255,0.28);
  font-size: 0.7rem;
  z-index: 2;
  letter-spacing: 0.06em;
}

/* ── Painel direito ── */
.form-panel {
  flex: 1;
  background: linear-gradient(160deg, #0a1628 0%, #0d1f3c 60%, #0f2550 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  position: relative;
}

.form-box {
  width: 100%;
  max-width: 420px;
}

.form-header {
  margin-bottom: 32px;
}
.form-eyebrow {
  color: #5ab82e;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.form-title {
  color: #ffffff;
  font-size: 2rem;
  font-weight: 900;
  margin: 0 0 8px;
  line-height: 1.1;
}
.form-caption {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.88rem;
  margin: 0;
  line-height: 1.5;
}

/* ── Formulário ── */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.field-label {
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.82rem;
  font-weight: 600;
}

/* Input customizado sem Quasar */
.custom-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  height: 52px;
  padding: 0 14px;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.custom-input-wrap:focus-within {
  border-color: #1a3fa0;
  background: rgba(26, 63, 160, 0.12);
  box-shadow: 0 0 0 3px rgba(26, 63, 160, 0.2);
}
.field-icon {
  flex-shrink: 0;
  margin-right: 10px;
  opacity: 0.55;
}
.custom-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.92rem;
  font-weight: 500;
  color: #ffffff;
  font-family: inherit;
  min-width: 0;
}
.custom-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-weight: 400;
}
.custom-input:-webkit-autofill,
.custom-input:-webkit-autofill:hover,
.custom-input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 100px #0d1f3c inset;
  -webkit-text-fill-color: #ffffff;
  caret-color: white;
}
.eye-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 8px;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.eye-btn:hover { opacity: 1; }

.forgot-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #5ab82e;
  font-size: 0.78rem;
  font-weight: 600;
  font-family: inherit;
  padding: 0;
  transition: color 0.2s;
}
.forgot-btn:hover { color: #a3e635; }

/* Checkbox */
.remember-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.remember-check {
  width: 16px;
  height: 16px;
  accent-color: #5ab82e;
  cursor: pointer;
}
.remember-label {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.83rem;
}

/* Botão */
.login-btn {
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #1a3fa0, #2563eb);
  color: white;
  font-size: 1rem;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(26,63,160,0.35);
  transition: box-shadow 0.25s, transform 0.18s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
}
.login-btn:hover:not(:disabled) {
  box-shadow: 0 10px 28px rgba(26,63,160,0.5);
  transform: translateY(-1px);
}
.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Nota */
.secure-note {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.74rem;
  margin-top: 20px;
}
</style>
