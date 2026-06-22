<template>
  <div class="reset-root">
    <div class="reset-box">
      <img src="/logo.png" alt="WMS" class="reset-logo" />
      <div class="reset-title">Nova senha</div>
      <p class="reset-desc">Digite sua nova senha abaixo.</p>

      <q-form class="reset-form" @submit.prevent="salvar">
        <div class="field-group">
          <label class="field-label">Nova senha</label>
          <div class="custom-input-wrap">
            <q-icon name="lock_outline" size="18px" class="field-icon" color="white" />
            <input
              v-model="novaSenha"
              :type="show1 ? 'text' : 'password'"
              placeholder="Mínimo 6 caracteres"
              class="custom-input"
              required
            />
            <button type="button" class="eye-btn" @click="show1 = !show1">
              <q-icon :name="show1 ? 'visibility_off' : 'visibility'" size="18px" color="grey-5" />
            </button>
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">Confirmar senha</label>
          <div class="custom-input-wrap">
            <q-icon name="lock_outline" size="18px" class="field-icon" color="white" />
            <input
              v-model="confirmar"
              :type="show2 ? 'text' : 'password'"
              placeholder="Repita a senha"
              class="custom-input"
              required
            />
            <button type="button" class="eye-btn" @click="show2 = !show2">
              <q-icon :name="show2 ? 'visibility_off' : 'visibility'" size="18px" color="grey-5" />
            </button>
          </div>
        </div>

        <button type="submit" class="reset-btn" :disabled="loading">
          <q-spinner v-if="loading" size="20px" color="white" />
          <span v-else>Salvar nova senha</span>
        </button>
      </q-form>

      <div v-if="erro" class="reset-erro">{{ erro }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from '../lib/supabase'

const router = useRouter()
const $q     = useQuasar()

const novaSenha = ref('')
const confirmar = ref('')
const show1     = ref(false)
const show2     = ref(false)
const loading   = ref(false)
const erro      = ref('')

onMounted(() => {
  // Supabase redireciona com #access_token ou ?code= — apenas aguarda o evento
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      // sessão de recuperação ativa — formulário já está visível
    }
  })
})

async function salvar() {
  erro.value = ''
  if (novaSenha.value.length < 6) { erro.value = 'A senha deve ter pelo menos 6 caracteres.'; return }
  if (novaSenha.value !== confirmar.value) { erro.value = 'As senhas não coincidem.'; return }

  loading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: novaSenha.value })
    if (error) throw error
    $q.notify({ icon: 'check_circle', color: 'positive', message: 'Senha alterada com sucesso!', position: 'top', timeout: 3000 })
    await supabase.auth.signOut()
    router.push({ name: 'login', params: { sector: 'gerenciamento' } })
  } catch (err) {
    erro.value = err.message || 'Erro ao salvar senha.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #0a1628 0%, #0d1f3c 60%, #0f2550 100%);
  padding: 24px;
}
.reset-box {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}
.reset-logo { width: 72px; height: 72px; object-fit: contain; margin-bottom: 16px; }
.reset-title { color: #fff; font-size: 1.6rem; font-weight: 900; margin-bottom: 6px; }
.reset-desc  { color: rgba(255,255,255,0.45); font-size: 0.88rem; margin: 0 0 24px; text-align: center; }

.reset-form { width: 100%; display: flex; flex-direction: column; gap: 18px; }
.field-group { display: flex; flex-direction: column; gap: 7px; }
.field-label { color: rgba(255,255,255,0.75); font-size: 0.82rem; font-weight: 600; }
.custom-input-wrap {
  position: relative; display: flex; align-items: center;
  background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.12);
  border-radius: 12px; height: 52px; padding: 0 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.custom-input-wrap:focus-within {
  border-color: #1a3fa0;
  box-shadow: 0 0 0 3px rgba(26,63,160,0.2);
}
.field-icon { flex-shrink: 0; margin-right: 10px; opacity: 0.55; }
.custom-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 0.92rem; font-weight: 500; color: #fff; font-family: inherit; min-width: 0;
}
.custom-input::placeholder { color: rgba(255,255,255,0.3); }
.eye-btn {
  background: none; border: none; cursor: pointer; padding: 0;
  display: flex; align-items: center; flex-shrink: 0; margin-left: 8px; opacity: 0.6;
}
.eye-btn:hover { opacity: 1; }

.reset-btn {
  width: 100%; height: 52px; border: none; border-radius: 14px;
  background: linear-gradient(135deg, #1a3fa0, #2563eb);
  color: #fff; font-size: 1rem; font-weight: 700; font-family: inherit;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 20px rgba(26,63,160,0.35);
  transition: box-shadow 0.25s, transform 0.18s; margin-top: 4px;
}
.reset-btn:hover:not(:disabled) { box-shadow: 0 10px 28px rgba(26,63,160,0.5); transform: translateY(-1px); }
.reset-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.reset-erro { color: #f87171; font-size: 0.82rem; margin-top: 10px; text-align: center; }
</style>
