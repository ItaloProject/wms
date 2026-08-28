<template>
  <q-layout view="hHh lpR fFf" class="ps-app">

    <!-- ── Topo ── -->
    <q-header class="ps-header">
      <div class="ps-header-inner">
        <div class="ps-header-left">
          <button class="ps-home-btn" @click="router.push('/')" title="Início">
            <q-icon name="home" size="18px" />
          </button>
          <div class="ps-logo-wrap">
            <img v-if="logoOk" src="/logo.png" alt="WMS" class="ps-logo" @error="logoOk = false" />
            <q-icon v-else name="groups" size="22px" style="color:#0d9488" />
          </div>
          <div class="ps-brand">
            <span class="ps-brand-name">WMS</span>
            <span class="ps-brand-sep">/</span>
            <span class="ps-brand-sector">Pessoal</span>
          </div>
        </div>
        <div class="ps-header-right">
          <button class="ps-logout-btn" @click="fazerLogout" title="Sair">
            <q-icon name="logout" size="16px" />
            Sair
          </button>
        </div>
      </div>
    </q-header>

    <!-- ── Conteúdo ── -->
    <q-page-container>
      <q-page class="ps-page">

        <!-- Nav lateral -->
        <aside class="ps-sidebar">
          <nav class="ps-nav">
            <button
              v-for="item in navItems"
              :key="item.key"
              class="ps-nav-item"
              :class="{ 'ps-nav-item--active': activeNav === item.key }"
              @click="activeNav = item.key"
            >
              <q-icon :name="item.icon" size="18px" />
              <span>{{ item.label }}</span>
            </button>
          </nav>
        </aside>

        <!-- Área principal -->
        <main class="ps-main">

          <!-- ══ COLABORADORES ══ -->
          <div v-if="activeNav === 'colaboradores'" class="ps-view">
            <div class="ps-view-header">
              <div>
                <div class="ps-eyebrow">
                  <q-icon name="groups" size="14px" style="color:#0d9488" /> Pessoal
                </div>
                <h1 class="ps-title">Colaboradores</h1>
              </div>
            </div>
            <div class="ps-empty-state">
              <q-icon name="groups" size="56px" style="color:rgba(13,148,136,0.2)" />
              <p>Nenhum colaborador cadastrado ainda.</p>
              <button class="ps-btn-primary">
                <q-icon name="add" size="16px" /> Cadastrar colaborador
              </button>
            </div>
          </div>

          <!-- ══ PONTO ══ -->
          <div v-else-if="activeNav === 'ponto'" class="ps-view">
            <div class="ps-view-header">
              <div>
                <div class="ps-eyebrow">
                  <q-icon name="schedule" size="14px" style="color:#0d9488" /> Pessoal
                </div>
                <h1 class="ps-title">Ponto</h1>
              </div>
            </div>
            <div class="ps-empty-state">
              <q-icon name="fingerprint" size="56px" style="color:rgba(13,148,136,0.2)" />
              <p>Controle de ponto em breve.</p>
            </div>
          </div>

          <!-- ══ EQUIPES ══ -->
          <div v-else-if="activeNav === 'equipes'" class="ps-view">
            <div class="ps-view-header">
              <div>
                <div class="ps-eyebrow">
                  <q-icon name="people" size="14px" style="color:#0d9488" /> Pessoal
                </div>
                <h1 class="ps-title">Equipes</h1>
              </div>
            </div>
            <div class="ps-empty-state">
              <q-icon name="corporate_fare" size="56px" style="color:rgba(13,148,136,0.2)" />
              <p>Gestão de equipes em breve.</p>
            </div>
          </div>

        </main>

      </q-page>
    </q-page-container>

  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase.js'

const router  = useRouter()
const logoOk  = ref(true)
const activeNav = ref('colaboradores')

const navItems = [
  { key: 'colaboradores', label: 'Colaboradores', icon: 'badge' },
  { key: 'ponto',         label: 'Ponto',         icon: 'fingerprint' },
  { key: 'equipes',       label: 'Equipes',        icon: 'people' },
]

async function fazerLogout() {
  await supabase.auth.signOut()
  router.push('/')
}
</script>

<style scoped>
.ps-app { background: #060f1e; min-height: 100vh; }

/* ── Header ── */
.ps-header {
  background: rgba(6,15,30,0.95) !important;
  border-bottom: 1px solid rgba(13,148,136,0.15);
  backdrop-filter: blur(12px);
}
.ps-header-inner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; height: 54px;
}
.ps-header-left { display: flex; align-items: center; gap: 12px; }
.ps-home-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.15s;
}
.ps-home-btn:hover { background: rgba(13,148,136,0.15); color: #0d9488; border-color: rgba(13,148,136,0.3); }
.ps-logo-wrap { display: flex; align-items: center; }
.ps-logo { height: 28px; object-fit: contain; }
.ps-brand { display: flex; align-items: center; gap: 6px; }
.ps-brand-name { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.85); }
.ps-brand-sep { color: rgba(255,255,255,0.2); }
.ps-brand-sector { font-size: 0.9rem; color: #0d9488; font-weight: 600; }
.ps-logout-btn {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.4); border-radius: 8px;
  padding: 6px 14px; font-size: 0.8rem; cursor: pointer; transition: all 0.15s;
}
.ps-logout-btn:hover { background: rgba(239,68,68,0.08); color: rgba(239,68,68,0.7); border-color: rgba(239,68,68,0.2); }

/* ── Layout ── */
.ps-page { display: flex; min-height: calc(100vh - 54px); }

/* ── Sidebar ── */
.ps-sidebar {
  width: 200px; flex-shrink: 0;
  background: rgba(255,255,255,0.02);
  border-right: 1px solid rgba(255,255,255,0.05);
  padding: 20px 10px;
}
.ps-nav { display: flex; flex-direction: column; gap: 4px; }
.ps-nav-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 12px; border-radius: 10px;
  background: transparent; border: none; cursor: pointer;
  color: rgba(255,255,255,0.45); font-size: 0.85rem;
  transition: all 0.15s; text-align: left;
}
.ps-nav-item:hover { background: rgba(13,148,136,0.08); color: rgba(255,255,255,0.75); }
.ps-nav-item--active {
  background: rgba(13,148,136,0.15) !important;
  color: #5eead4 !important;
  font-weight: 600;
}

/* ── Main ── */
.ps-main { flex: 1; padding: 28px 32px; min-width: 0; }
.ps-view-header { margin-bottom: 28px; }
.ps-eyebrow { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: rgba(255,255,255,0.35); margin-bottom: 4px; }
.ps-title { font-size: 1.6rem; font-weight: 700; color: rgba(255,255,255,0.9); margin: 0; }

/* ── Empty state ── */
.ps-empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 80px 0; text-align: center;
  color: rgba(255,255,255,0.25); font-size: 0.9rem;
}
.ps-btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(13,148,136,0.15); border: 1px solid rgba(13,148,136,0.3);
  color: #5eead4; border-radius: 10px;
  padding: 10px 20px; font-size: 0.88rem; cursor: pointer; transition: all 0.15s;
}
.ps-btn-primary:hover { background: rgba(13,148,136,0.25); }
</style>
