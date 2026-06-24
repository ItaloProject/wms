<template>
  <q-layout view="hHh LpR fFf" :class="{ 'wms-app--light': lightMode }">

    <!-- Top bar -->
    <q-header class="wms-header" elevated>
      <q-toolbar class="q-px-lg">
        <q-btn flat dense round icon="menu" color="white" class="q-mr-md" @click="drawer = !drawer" />
        <div class="brand row items-center no-wrap">
          <img src="/logo.png" alt="WMS" class="header-logo" />
          <div class="q-ml-sm">
            <div class="header-title">WMS</div>
            <div class="header-sub">Consultoria</div>
          </div>
        </div>

        <q-space />

        <div class="status-online q-mr-md">
          <span class="status-online-dot"></span>
          <span class="status-online-txt">Online</span>
        </div>

        <q-btn
          flat dense round
          :icon="notifPermissao === 'granted' ? 'notifications' : 'notifications_off'"
          color="white"
          class="q-mr-sm"
        >
          <q-badge v-if="totalAlertas > 0" color="red" floating>{{ totalAlertas }}</q-badge>
          <q-menu anchor="bottom right" self="top right" :offset="[0, 8]" style="border-radius:14px">
            <div class="notif-panel">
              <div class="notif-panel-head">
                <span class="notif-panel-title">Notificações</span>
                <button
                  v-if="notifPermissao !== 'granted'"
                  class="notif-ativar-btn"
                  @click="solicitarPermissaoNotif"
                >Ativar</button>
              </div>

              <div v-if="totalAlertas === 0" class="notif-empty">
                <q-icon name="check_circle" size="28px" style="color:#5ab82e" />
                <span>Tudo em dia!</span>
              </div>

              <div v-else class="notif-list">
                <div
                  v-for="reg in registros.filter(r => !r.concluido && ((() => { const d = diasRestantes(r); return (r.prazo||'normal')==='urgente' || d < 0 || d <= 3 })())).map(r => ({...r, _dias: diasRestantes(r)}))"
                  :key="reg.id"
                  class="notif-item"
                  :class="{ 'notif-item--urgente': (reg.prazo||'normal')==='urgente' || reg._dias < 0, 'notif-item--aviso': reg._dias >= 0 && reg._dias <= 3 }"
                  @click="activeNav = 'Prazos'"
                >
                  <div class="notif-item-icon">
                    <q-icon
                      :name="(reg.prazo||'normal')==='urgente' || reg._dias < 0 ? 'priority_high' : 'schedule'"
                      size="16px"
                    />
                  </div>
                  <div class="notif-item-body">
                    <div class="notif-item-nome">{{ reg.razaoSocial || 'Sem nome' }}</div>
                    <div class="notif-item-desc">
                      {{ reg._dias < 0
                        ? 'Vencido há ' + Math.abs(reg._dias) + ' dia' + (Math.abs(reg._dias) === 1 ? '' : 's')
                        : reg._dias === 0 ? 'Vence hoje'
                        : 'Vence em ' + reg._dias + ' dia' + (reg._dias === 1 ? '' : 's') }}
                    </div>
                  </div>
                  <div class="notif-item-badge" :class="`prazo-badge--${reg.prazo||'normal'}`">
                    {{ prazoEmoji(reg.prazo) }}
                  </div>
                </div>
              </div>

              <div class="notif-panel-foot">
                <button class="notif-ver-btn" @click="activeNav = 'Prazos'">
                  Ver todos os prazos <q-icon name="chevron_right" size="15px" />
                </button>
              </div>
            </div>
          </q-menu>
        </q-btn>

      </q-toolbar>
    </q-header>

    <!-- Sidebar -->
    <q-drawer v-model="drawer" :width="240" :breakpoint="900" class="wms-drawer">
      <div class="drawer-inner column no-wrap full-height">

        <!-- Nav principal -->
        <div class="drawer-scroll col">
          <div class="nav-section-label q-px-md q-pt-md q-pb-xs">Principal</div>

          <div
            v-for="item in navItems"
            :key="item.label"
            class="nav-item"
            :class="{ 'nav-item--active': activeNav === item.label }"
            @click="activeNav = item.label"
          >
            <div class="nav-indicator" />
            <q-icon :name="item.icon" size="20px" class="nav-icon" />
            <span class="nav-label">{{ item.label }}</span>
            <q-badge
              v-if="item.badge"
              :color="item.badgeColor || 'primary'"
              :label="item.badge"
              class="nav-badge"
            />
          </div>

          <div class="drawer-divider q-my-md" />
          <div class="nav-section-label q-px-md q-pb-xs">Sistema</div>

          <div class="nav-item" :class="{ 'nav-item--active': activeNav === 'Preferências' }" @click="activeNav = 'Preferências'; drawer = false">
            <div class="nav-indicator" />
            <q-icon name="settings" size="20px" class="nav-icon" />
            <span class="nav-label">Preferências</span>
          </div>
          <div class="nav-item nav-item--danger" @click="fazerLogout">
            <div class="nav-indicator" />
            <q-icon name="logout" size="20px" class="nav-icon" />
            <span class="nav-label">Sair</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="drawer-footer">
          <div class="drawer-user row items-center no-wrap">
            <div class="drawer-avatar flex flex-center">
              <q-icon name="person" size="18px" color="white" />
            </div>
            <div class="q-ml-sm" style="min-width:0">
              <div class="drawer-user-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                {{ currentUser?.user_metadata?.nome || currentUser?.email?.split('@')[0] || 'Usuário' }}
              </div>
              <div class="drawer-user-role" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.68rem;opacity:0.6">
                {{ currentUser?.email || 'Gerenciamento' }}
              </div>
            </div>
          </div>
        </div>

      </div>
    </q-drawer>

    <!-- Page content -->
    <q-page-container @click="drawer = false">
      <q-page class="dash-page q-px-lg q-pt-md q-pb-lg">

        <!-- ══ VIEW: RESUMO ══ -->
        <div v-if="activeNav === 'Resumo'" class="resumo-page">

          <!-- Header -->
          <div class="rp-header q-mb-xl">
            <div>
              <div class="rp-eyebrow row items-center no-wrap q-mb-xs">
                <q-icon name="description" size="15px" class="q-mr-xs" style="color:#5ab82e" />
                <span>Abertura de Empresa LTDA Unipessoal</span>
              </div>
              <h2 class="rp-title">Relação de Documentos</h2>
            </div>
            <div class="rp-header-right">
              <button class="rp-btn-novo" @click="limparFormulario">
                <q-icon name="add" size="15px" />
                Novo
              </button>
              <button class="prazos-nav-btn" @click="activeNav = 'Prazos'">
                <div v-if="registrosAtivos.some(r => r.prazo === 'urgente')" class="prazos-nav-dot prazos-nav-dot--urgente" />
                <div v-else-if="registrosAtivos.some(r => r.prazo === 'priorizar')" class="prazos-nav-dot prazos-nav-dot--priorizar" />
                <q-icon name="schedule" size="16px" />
                Prazos
              </button>
              <div class="rp-progress-box">
                <div class="rp-progress-nums">
                  <span class="rp-progress-val">{{ totalPreenchido }}</span>
                  <span class="rp-progress-of">/{{ totalCampos }}</span>
                  <span class="rp-progress-label">campos preenchidos</span>
                </div>
                <div class="rp-progress-track">
                  <div class="rp-progress-fill" :style="{ width: progressPercent + '%' }" />
                </div>
                <div class="rp-progress-pct">{{ progressPercent }}%</div>
              </div>
            </div>
          </div>

          <!-- Seções do resumo (layout único, sem abas) -->
          <div class="rs-layout">

            <!-- Empresa (obrigatório) -->
            <div class="rs-card">
              <div class="rs-card-head">
                <div class="rs-card-icon" style="--rc-color:rgba(26,63,160,0.45)">
                  <q-icon name="business" size="20px" color="white" />
                </div>
                <div class="col">
                  <div class="rs-card-title">Dados da Empresa <span class="rs-obrig">Obrigatório</span></div>
                  <div class="rs-card-sub">Fotos legíveis obrigatórias</div>
                </div>
                <div class="rs-card-count">
                  <span :class="docsEmpresaOk === docsEmpresa.length ? 'rs-count--done' : ''">
                    {{ docsEmpresaOk }}/{{ docsEmpresa.length }}
                  </span>
                </div>
                <button class="sec-copy-btn" @click="copiarSecaoEmpresa">
                  <q-icon name="content_copy" size="14px" />
                  Copiar
                </button>
              </div>
              <div class="rp-fields">
                <div
                  v-for="doc in docsEmpresa"
                  :key="doc.label"
                  class="rp-field"
                  :class="{ 'rp-field--filled': doc.valor, 'rp-field--invalido': doc.valor && !campoValido(doc) }"
                >
                  <label class="rp-field-label">{{ doc.label }}</label>
                  <div class="rp-field-wrap">
                    <input
                      :value="doc.valor"
                      class="rp-field-input"
                      :placeholder="placeholderCampo(doc)"
                      :type="doc.tipo === 'email' ? 'email' : 'text'"
                      :inputmode="inputmodeCampo(doc)"
                      @input="onInputDoc(doc, $event)"
                    />
                    <q-icon v-if="doc.valor && campoValido(doc)"  name="check_circle" size="16px" class="rp-field-ok" />
                    <q-icon v-else-if="doc.valor && !campoValido(doc)" name="error" size="16px" class="rp-field-err" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Sócio (obrigatório) -->
            <div class="rs-card">
              <div class="rs-card-head">
                <div class="rs-card-icon" style="--rc-color:rgba(124,58,237,0.45)">
                  <q-icon name="person" size="20px" color="white" />
                </div>
                <div class="col">
                  <div class="rs-card-title">Dados do Sócio <span class="rs-obrig">Obrigatório</span></div>
                  <div class="rs-card-sub">Documentação pessoal</div>
                </div>
                <div class="rs-card-count">
                  <span :class="docsSocioOk === docsSocio.length ? 'rs-count--done' : ''">
                    {{ docsSocioOk }}/{{ docsSocio.length }}
                  </span>
                </div>
                <button class="sec-copy-btn" @click="copiarSecaoSocio">
                  <q-icon name="content_copy" size="14px" />
                  Copiar
                </button>
              </div>
              <div class="rp-fields">
                <div
                  v-for="doc in docsSocio"
                  :key="doc.label"
                  class="rp-field"
                  :class="{ 'rp-field--filled': doc.valor, 'rp-field--invalido': doc.valor && !campoValido(doc) }"
                >
                  <label class="rp-field-label">{{ doc.label }}</label>
                  <div class="rp-field-wrap">
                    <input
                      :value="doc.valor"
                      class="rp-field-input"
                      :placeholder="placeholderCampo(doc)"
                      :type="doc.tipo === 'email' ? 'email' : 'text'"
                      :inputmode="inputmodeCampo(doc)"
                      @input="onInputDoc(doc, $event)"
                    />
                    <q-icon v-if="doc.valor && campoValido(doc)"  name="check_circle" size="16px" class="rp-field-ok" />
                    <q-icon v-else-if="doc.valor && !campoValido(doc)" name="error" size="16px" class="rp-field-err" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Taxas e Custos (única seção) -->
            <div class="rs-card rs-card--taxas">
              <div class="rs-card-head">
                <div class="rs-card-icon" style="--rc-color:rgba(245,158,11,0.3)">
                  <q-icon name="payments" size="20px" style="color:#f59e0b" />
                </div>
                <div class="col">
                  <div class="rs-card-title">Taxas e Custos</div>
                  <div class="rs-card-sub">Valores estimados</div>
                </div>
              </div>
              <div class="rp-fields">
                <div v-for="taxa in taxas" :key="taxa.label" class="rp-field" :class="{ 'rp-field--filled': taxa.valor }">
                  <label class="rp-field-label">{{ taxa.label }}</label>

                  <!-- Sim / Não -->
                  <div v-if="taxa.tipo === 'simnom'" class="rp-simnom-wrap">
                    <button
                      :class="['rp-simnom-btn', taxa.valor === 'SIM' && 'rp-simnom-btn--sim']"
                      @click="taxa.valor = taxa.valor === 'SIM' ? '' : 'SIM'"
                    >SIM</button>
                    <button
                      :class="['rp-simnom-btn', taxa.valor === 'NÃO' && 'rp-simnom-btn--nom']"
                      @click="taxa.valor = taxa.valor === 'NÃO' ? '' : 'NÃO'"
                    >NÃO</button>
                  </div>

                  <!-- Valor monetário -->
                  <div v-else class="rp-field-wrap rp-field-wrap--taxa">
                    <span class="rp-prefix">R$</span>
                    <input
                      :value="taxa.valor"
                      class="rp-field-input"
                      placeholder="0,00"
                      type="text"
                      inputmode="numeric"
                      @input="onInputDoc(taxa, $event)"
                    />
                    <q-icon v-if="taxa.valor" name="check_circle" size="16px" class="rp-field-ok" />
                  </div>
                </div>
              </div>
            </div>

          </div>


          <!-- Ação final -->
          <div class="rp-nav">
            <button class="rp-btn-concluir" @click="concluir">
              <q-icon name="check_circle" size="20px" />
              Concluir
            </button>
            <button v-if="isAdmin" class="rp-btn-config" @click="dialogConfig = true" title="Configurar API WhatsApp">
              <q-icon name="settings" size="18px" />
            </button>
          </div>

        </div>

        <!-- ══ VIEW: DASHBOARD ══ -->
        <template v-if="activeNav === 'Dashboard'">

          <!-- Faixa de alerta -->
          <div v-if="statsVencidos > 0 || statsUrgentes > 0" class="db-alert-bar q-mb-md">
            <q-icon name="warning" size="16px" style="flex-shrink:0" />
            <span>
              <template v-if="statsVencidos > 0">
                <strong>{{ statsVencidos }} processo{{ statsVencidos > 1 ? 's' : '' }} vencido{{ statsVencidos > 1 ? 's' : '' }}</strong>
              </template>
              <template v-if="statsVencidos > 0 && statsUrgentes > 0"> e </template>
              <template v-if="statsUrgentes > 0">
                <strong>{{ statsUrgentes }} urgente{{ statsUrgentes > 1 ? 's' : '' }}</strong>
              </template>
              {{ statsVencidos + statsUrgentes > 1 ? ' precisam' : ' precisa' }} de atenção imediata.
            </span>
            <button class="db-alert-link" @click="activeNav = 'Prazos'">
              Ver todos <q-icon name="chevron_right" size="14px" />
            </button>
          </div>

          <!-- Cards de estágio -->
          <div class="db-stages q-mb-md">
            <button class="db-stage db-stage--nao" @click="irParaConsultar">
              <div class="db-stage-top">
                <div class="db-stage-icon"><q-icon name="radio_button_unchecked" size="20px" /></div>
                <div class="db-stage-pct">{{ dbTotalEstagios ? Math.round(dbNaoIniciados.length / dbTotalEstagios * 100) : 0 }}%</div>
              </div>
              <div class="db-stage-num">{{ dbNaoIniciados.length }}</div>
              <div class="db-stage-label">Não iniciados</div>
              <div class="db-stage-bar"><div class="db-stage-fill" :style="{ width: dbTotalEstagios ? (dbNaoIniciados.length / dbTotalEstagios * 100) + '%' : '0%' }" /></div>
            </button>

            <button class="db-stage db-stage--and" @click="irParaConsultar">
              <div class="db-stage-top">
                <div class="db-stage-icon"><q-icon name="autorenew" size="20px" /></div>
                <div class="db-stage-pct">média {{ dbProgressoMedio }}%</div>
              </div>
              <div class="db-stage-num">{{ dbEmAndamento.length }}</div>
              <div class="db-stage-label">Em andamento</div>
              <div class="db-stage-bar"><div class="db-stage-fill" :style="{ width: dbTotalEstagios ? (dbEmAndamento.length / dbTotalEstagios * 100) + '%' : '0%' }" /></div>
            </button>

            <button class="db-stage db-stage--ok" @click="irParaConsultar">
              <div class="db-stage-top">
                <div class="db-stage-icon"><q-icon name="check_circle" size="20px" /></div>
                <div class="db-stage-pct">{{ dbTotalEstagios ? Math.round(dbConcluidosCount / dbTotalEstagios * 100) : 0 }}%</div>
              </div>
              <div class="db-stage-num">{{ dbConcluidosCount }}</div>
              <div class="db-stage-label">Concluídos</div>
              <div class="db-stage-bar"><div class="db-stage-fill" :style="{ width: dbTotalEstagios ? (dbConcluidosCount / dbTotalEstagios * 100) + '%' : '0%' }" /></div>
            </button>
          </div>

          <!-- KPI Cards (prazos) -->
          <div class="db-kpis q-mb-md">
            <div class="db-kpi-card">
              <div class="db-kpi-accent" style="background:#60a5fa"></div>
              <div class="db-kpi-body">
                <div class="db-kpi-label">Total de processos</div>
                <div class="db-kpi-val" style="color:#bfdbfe">{{ registros.length }}</div>
                <div class="db-kpi-sub">ativos no momento</div>
              </div>
            </div>
            <div class="db-kpi-card">
              <div class="db-kpi-accent" style="background:#5ab82e"></div>
              <div class="db-kpi-body">
                <div class="db-kpi-label">Aproveitamento</div>
                <div class="db-kpi-val" :style="{ color: dbAproveitamento >= 70 ? '#86efac' : dbAproveitamento >= 50 ? '#fcd34d' : '#fca5a5' }">
                  {{ dbAproveitamento }}%
                </div>
                <div class="db-kpi-sub">{{ dbEmDia }} de {{ registrosAtivos.length }} em dia</div>
              </div>
              <svg width="42" height="42" viewBox="0 0 42 42" class="db-kpi-ring" aria-hidden="true">
                <circle cx="21" cy="21" r="15" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/>
                <circle cx="21" cy="21" r="15" fill="none"
                  :stroke="dbAproveitamento >= 70 ? '#5ab82e' : dbAproveitamento >= 50 ? '#f59e0b' : '#ef4444'"
                  stroke-width="4"
                  :stroke-dasharray="dbRingDash"
                  stroke-dashoffset="0"
                  stroke-linecap="round"
                  transform="rotate(-90 21 21)"/>
              </svg>
            </div>
            <div class="db-kpi-card">
              <div class="db-kpi-accent" style="background:#f59e0b"></div>
              <div class="db-kpi-body">
                <div class="db-kpi-label">Vencendo em 7 dias</div>
                <div class="db-kpi-val" style="color:#fcd34d">{{ dbVencendo7 }}</div>
                <div class="db-kpi-sub">
                  <template v-if="statsVencidos > 0">{{ statsVencidos }} vencido{{ statsVencidos !== 1 ? 's' : '' }} · </template>
                  {{ statsUrgentes + statsPriorizar }} crítico{{ (statsUrgentes + statsPriorizar) !== 1 ? 's' : '' }} monitorado{{ (statsUrgentes + statsPriorizar) !== 1 ? 's' : '' }}
                </div>
              </div>
            </div>
            <div class="db-kpi-card">
              <div class="db-kpi-accent" style="background:#ef4444"></div>
              <div class="db-kpi-body">
                <div class="db-kpi-label">Vencidos</div>
                <div class="db-kpi-val" :style="{ color: statsVencidos > 0 ? '#fca5a5' : '#86efac' }">{{ statsVencidos }}</div>
                <div class="db-kpi-sub">{{ statsVencidos > 0 ? 'requerem ação imediata' : 'nenhum em atraso' }}</div>
              </div>
            </div>
          </div>

          <!-- Grid: coluna principal + lateral -->
          <div class="db-grid">

            <!-- Coluna principal -->
            <div class="db-col-main">

              <!-- Em andamento -->
              <div class="db-panel q-mb-md">
                <div class="db-panel-head">
                  <q-icon name="autorenew" size="17px" style="color:#f59e0b" />
                  <span class="db-panel-title">Em andamento</span>
                  <span v-if="dbEmAndamento.length" class="db-head-count">{{ dbEmAndamento.length }}</span>
                  <q-space />
                  <button class="db-link-btn" @click="irParaConsultar">
                    consultar <q-icon name="chevron_right" size="14px" />
                  </button>
                </div>
                <div v-if="dbEmAndamento.length === 0" class="db-empty">
                  <q-icon name="inbox" size="32px" style="color:rgba(255,255,255,0.15)" />
                  <span>Nenhum processo em andamento</span>
                </div>
                <div v-else class="db-and-list">
                  <div v-for="p in dbEmAndamento.slice(0, 6)" :key="p.id" class="db-and-row" @click="irParaConsultar">
                    <div class="db-and-info">
                      <div class="db-and-nome">{{ p.nome }}</div>
                      <div class="db-and-meta">
                        <template v-if="p.local">{{ p.local }} · </template>vence {{ p.venc }}
                      </div>
                    </div>
                    <div class="db-and-progress">
                      <div class="db-and-bar-bg">
                        <div class="db-and-bar" :style="{ width: p.pct + '%', background: p.pct >= 70 ? '#5ab82e' : p.pct >= 40 ? '#f59e0b' : '#fcd34d' }" />
                      </div>
                      <span class="db-and-pct" :style="{ color: p.pct >= 70 ? '#86efac' : '#fcd34d' }">{{ p.pct }}%</span>
                    </div>
                  </div>
                  <div v-if="dbEmAndamento.length > 6" class="db-pend-more">+{{ dbEmAndamento.length - 6 }} mais</div>
                </div>
              </div>

              <!-- Prazos críticos -->
              <div class="db-panel q-mb-md">
                <div class="db-panel-head">
                  <q-icon name="report_problem" size="17px" style="color:#ef4444" />
                  <span class="db-panel-title">Prazos críticos</span>
                  <q-space />
                  <button class="db-link-btn" @click="activeNav = 'Prazos'">
                    ver todos <q-icon name="chevron_right" size="14px" />
                  </button>
                </div>
                <div v-if="dbProcessosCriticos.length === 0" class="db-empty">
                  <q-icon name="check_circle" size="32px" style="color:#5ab82e" />
                  <span>Todos os processos estão em dia!</span>
                </div>
                <div v-else class="db-criticos-list">
                  <div
                    v-for="reg in dbProcessosCriticos"
                    :key="reg.id"
                    class="db-critico-row"
                    :class="{
                      'db-critico-row--vencido':   reg._dias < 0,
                      'db-critico-row--urgente':   reg._dias >= 0 && reg.prazo === 'urgente',
                      'db-critico-row--priorizar': reg._dias >= 0 && reg.prazo !== 'urgente',
                    }"
                    @click="activeNav = 'Prazos'"
                  >
                    <div class="db-critico-dot"
                      :style="{ background: reg._dias < 0 ? '#ef4444' : reg.prazo === 'urgente' ? '#ef4444' : '#f59e0b' }" />
                    <div class="db-critico-info">
                      <div class="db-critico-nome">{{ reg.razaoSocial || 'Sem razão social' }}</div>
                      <div class="db-critico-meta">Vence {{ reg.dataVencFormatada || '—' }}</div>
                    </div>
                    <span class="db-critico-badge"
                      :class="{
                        'db-cb--vencido':   reg._dias < 0,
                        'db-cb--urgente':   reg._dias >= 0 && reg.prazo === 'urgente',
                        'db-cb--priorizar': reg._dias >= 0 && reg.prazo !== 'urgente',
                      }">
                      {{ reg._dias < 0 ? 'Vencido' : reg.prazo === 'urgente' ? 'Urgente' : 'Priorizar' }}
                    </span>
                    <div class="db-critico-dias"
                      :style="{ color: reg._dias < 0 ? '#fca5a5' : reg._dias <= 3 ? '#fca5a5' : '#fcd34d' }">
                      {{ reg._dias < 0 ? Math.abs(reg._dias) + 'd atraso' : reg._dias === 0 ? 'hoje!' : reg._dias + 'd restantes' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Timeline 14 dias -->
              <div class="db-panel">
                <div class="db-panel-head">
                  <q-icon name="event_note" size="17px" style="color:#60a5fa" />
                  <span class="db-panel-title">Vencimentos — próximos 14 dias</span>
                </div>
                <div v-if="registros.length === 0" class="db-empty">
                  <span>Nenhum processo cadastrado</span>
                </div>
                <div v-else class="db-tl-list">
                  <div v-for="bucket in dbTimeline" :key="bucket.label" class="db-tl-row">
                    <span class="db-tl-label">{{ bucket.label }}</span>
                    <div class="db-tl-bar-bg">
                      <div class="db-tl-bar"
                        :style="{ width: dbTimelineMax ? (bucket.count / dbTimelineMax * 100) + '%' : '0%', background: bucket.cor }" />
                    </div>
                    <span class="db-tl-count" :style="{ color: bucket.count > 0 ? bucket.cor : 'rgba(255,255,255,0.2)' }">
                      {{ bucket.count }}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            <!-- Coluna lateral -->
            <div class="db-col-side">

              <!-- Gauge aproveitamento -->
              <div class="db-panel db-gauge-panel">
                <svg width="140" height="78" viewBox="0 0 140 78" aria-hidden="true">
                  <path d="M12,70 A58,58 0 0,1 128,70" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="9" stroke-linecap="round"/>
                  <path d="M12,70 A58,58 0 0,1 128,70" fill="none"
                    :stroke="dbAproveitamento >= 70 ? '#5ab82e' : dbAproveitamento >= 50 ? '#f59e0b' : '#ef4444'"
                    stroke-width="9"
                    :stroke-dasharray="dbGaugeDash"
                    stroke-linecap="round"/>
                </svg>
                <div class="db-gauge-num"
                  :style="{ color: dbAproveitamento >= 70 ? '#86efac' : dbAproveitamento >= 50 ? '#fcd34d' : '#fca5a5' }">
                  {{ dbAproveitamento }}%
                </div>
                <div class="db-gauge-label">Aproveitamento geral</div>
                <div class="db-gauge-sub">{{ dbEmDia }} de {{ registrosAtivos.length }} processos em dia</div>
              </div>

              <!-- Distribuição -->
              <div class="db-panel">
                <div class="db-panel-head">
                  <q-icon name="bar_chart" size="17px" style="color:#60a5fa" />
                  <span class="db-panel-title">Distribuição</span>
                </div>
                <div class="db-dist-list">
                  <div class="db-dist-row">
                    <span class="db-dist-label" style="color:#86efac">Em dia</span>
                    <div class="db-dist-bar-wrap">
                      <div class="db-dist-bar" :style="{ width: registrosAtivos.length ? (dbEmDia / registrosAtivos.length * 100) + '%' : '0%', background:'#5ab82e' }" />
                    </div>
                    <span class="db-dist-num" style="color:#86efac">{{ dbEmDia }}</span>
                  </div>
                  <div class="db-dist-row">
                    <span class="db-dist-label" style="color:#fcd34d">Priorizar</span>
                    <div class="db-dist-bar-wrap">
                      <div class="db-dist-bar" :style="{ width: registrosAtivos.length ? (statsPriorizar / registrosAtivos.length * 100) + '%' : '0%', background:'#f59e0b' }" />
                    </div>
                    <span class="db-dist-num" style="color:#fcd34d">{{ statsPriorizar }}</span>
                  </div>
                  <div class="db-dist-row">
                    <span class="db-dist-label" style="color:#fca5a5">Urgente</span>
                    <div class="db-dist-bar-wrap">
                      <div class="db-dist-bar" :style="{ width: registrosAtivos.length ? (statsUrgentes / registrosAtivos.length * 100) + '%' : '0%', background:'#ef4444' }" />
                    </div>
                    <span class="db-dist-num" style="color:#fca5a5">{{ statsUrgentes }}</span>
                  </div>
                  <div class="db-dist-row">
                    <span class="db-dist-label" style="color:#f87171">Vencidos</span>
                    <div class="db-dist-bar-wrap">
                      <div class="db-dist-bar" :style="{ width: registrosAtivos.length ? (statsVencidos / registrosAtivos.length * 100) + '%' : '0%', background:'#991b1b' }" />
                    </div>
                    <span class="db-dist-num" style="color:#f87171">{{ statsVencidos }}</span>
                  </div>
                </div>
              </div>

              <!-- Histórico Recente -->
              <div class="db-panel">
                <div class="db-panel-head">
                  <q-icon name="history" size="17px" style="color:#5ab82e" />
                  <span class="db-panel-title">Histórico Recente</span>
                  <q-space />
                  <button class="db-link-btn" @click="activeNav = 'Relatórios'">
                    ver todos <q-icon name="chevron_right" size="14px" />
                  </button>
                </div>
                <div v-if="historico.length === 0" class="db-empty" style="padding:12px 0">
                  <span style="font-size:0.8rem">Nenhum processo concluído</span>
                </div>
                <div v-else class="db-pend-list">
                  <div v-for="h in historico.slice(0, 5)" :key="h.id" class="db-pend-item">
                    <q-icon name="check_circle" size="13px" style="color:#5ab82e;flex-shrink:0" />
                    <div style="flex:1;min-width:0">
                      <div class="db-pend-name">{{ h.empresa || '—' }}</div>
                      <div style="font-size:0.68rem;color:rgba(255,255,255,0.4)">
                        {{ h.localizacao && h.localizacao !== '—' ? h.localizacao + ' · ' : '' }}{{ h.data }}
                      </div>
                    </div>
                    <span class="db-pend-tag" :style="{ color: h.pct === 100 ? '#86efac' : '#fcd34d' }">{{ h.pct }}%</span>
                  </div>
                  <div v-if="historico.length > 5" class="db-pend-more">
                    +{{ historico.length - 5 }} mais
                  </div>
                </div>
              </div>

              <!-- Ações rápidas -->
              <div class="db-panel">
                <div class="db-panel-head">
                  <q-icon name="bolt" size="17px" style="color:#5ab82e" />
                  <span class="db-panel-title">Ações rápidas</span>
                </div>
                <div class="db-actions">
                  <button class="db-action-btn db-action-btn--primary" @click="activeNav = 'Resumo'">
                    <q-icon name="add_circle_outline" size="17px" />
                    Novo Processo
                  </button>
                  <button class="db-action-btn db-action-btn--secondary" @click="activeNav = 'Prazos'">
                    <q-icon name="schedule" size="17px" />
                    Ver Prazos
                  </button>
                </div>
              </div>

            </div>
          </div>

        </template><!-- fim dashboard -->

        <!-- ══ VIEW: CONTROLE ══ -->
        <div v-if="activeNav === 'Controle'" class="controle-page">

          <!-- Seleção de sessão (some quando uma sessão está ativa) -->
          <template v-if="!ctrlSessao1 && !ctrlSessao2 && !ctrlSessao3">

            <div class="ctrl-header q-mb-xl">
              <div class="rp-eyebrow row items-center no-wrap q-mb-xs">
                <q-icon name="inventory_2" size="15px" class="q-mr-xs" style="color:#5ab82e" />
                <span>Selecione o tipo de serviço</span>
              </div>
              <h2 class="rp-title">Controle</h2>
            </div>

            <div class="ctrl-grid">

              <!-- Sessão 1: Constituição -->
              <button class="ctrl-card" @click="abrirNovaConstituicao()">
                <div class="ctrl-card-icon" style="background:rgba(90,184,46,0.12)">
                  <q-icon name="domain_add" size="30px" style="color:#5ab82e" />
                </div>
                <span class="ctrl-card-label">Constituição</span>
                <span class="ctrl-card-desc">Abertura · Alteração · Transformação · Novas Empresas</span>
                <div class="ctrl-card-go">
                  Acessar <q-icon name="arrow_forward" size="15px" />
                </div>
              </button>

              <!-- Sessão 2: Baixa -->
              <button class="ctrl-card ctrl-card--baixa" @click="abrirNovaBaixa()">
                <div class="ctrl-card-icon" style="background:rgba(239,68,68,0.12)">
                  <q-icon name="domain_disabled" size="30px" style="color:#ef4444" />
                </div>
                <span class="ctrl-card-label">Baixa</span>
                <span class="ctrl-card-desc">Encerramento de empresa</span>
                <div class="ctrl-card-go ctrl-card-go--baixa">
                  Acessar <q-icon name="arrow_forward" size="15px" />
                </div>
              </button>

            </div>

            <!-- Consultar -->
            <div class="ctrl-consultar-wrap">
              <button class="ctrl-btn--consultar" @click="ctrlSessao3 = 'Consultar'">
                <q-icon name="manage_search" size="18px" />
                Consultar
              </button>
            </div>

          </template>

          <!-- Guia de etapas: Constituição -->
          <transition name="sec-fade">
            <div v-if="ctrlSessao1 === 'Constituição'" class="et-guia">

              <div class="row items-center no-wrap q-mb-lg" style="gap:16px">
                <button class="rp-btn-back" @click="ctrlSessao1 = null">
                  <q-icon name="arrow_back" size="16px" />
                  Controle
                </button>
                <div style="flex:1">
                  <div class="rp-eyebrow row items-center no-wrap q-mb-xs">
                    <q-icon name="inventory_2" size="15px" class="q-mr-xs" style="color:#5ab82e" />
                    <span>Abertura · Alteração · Transformação · Novas Empresas</span>
                  </div>
                  <h2 class="rp-title">Constituição</h2>
                </div>
                <button class="rp-btn-novo-proc" @click="dialogNovoProcesso = true">
                  <q-icon name="add_circle_outline" size="15px" />
                  Novo Processo
                </button>
              </div>

              <div class="et-guia-head">
                <div>
                  <div class="et-guia-title">Guia de Constituição</div>
                  <div class="et-guia-sub">{{ etapasConcluidas }} de {{ etapas.length }} etapas concluídas</div>
                </div>
                <div class="et-guia-progress">
                  <div class="et-guia-track">
                    <div class="et-guia-fill" :style="{ width: progressoEtapas + '%' }" />
                  </div>
                  <span class="et-guia-pct">{{ progressoEtapas }}%</span>
                </div>
              </div>

              <!-- Caixa fixa com empresa e protocolo -->
              <Teleport to="body">
                <div
                  v-if="etapaValor('empresa') || etapaValor('protocolo')"
                  class="et-info-fixa"
                >
                  <div v-if="etapaValor('empresa')" class="et-info-fixa-item">
                    <q-icon name="business" size="13px" class="et-info-fixa-icon" />
                    <span class="et-info-fixa-label">Empresa</span>
                    <span class="et-info-fixa-valor">{{ etapaValor('empresa') }}</span>
                    <span class="et-info-fixa-copy" @click="copiarInfo('empresa')" title="Copiar">
                      <q-icon :name="copiado === 'empresa' ? 'check' : 'content_copy'" size="14px" :style="{ color: copiado === 'empresa' ? '#5ab82e' : 'rgba(255,255,255,0.6)' }" />
                    </span>
                  </div>
                  <div v-if="etapaValor('protocolo')" class="et-info-fixa-item">
                    <q-icon name="tag" size="13px" class="et-info-fixa-icon" />
                    <span class="et-info-fixa-label">Protocolo</span>
                    <span class="et-info-fixa-valor">{{ etapaValor('protocolo') }}</span>
                    <span class="et-info-fixa-copy" @click="copiarInfo('protocolo')" title="Copiar">
                      <q-icon :name="copiado === 'protocolo' ? 'check' : 'content_copy'" size="14px" :style="{ color: copiado === 'protocolo' ? '#5ab82e' : 'rgba(255,255,255,0.6)' }" />
                    </span>
                  </div>
                </div>
              </Teleport>

              <div class="et-list">
                <div
                  v-for="(etapa, i) in etapas"
                  :key="etapa.key"
                  class="et-card"
                  :class="`et-card--${etapa.status}`"
                >
                  <div class="et-card-top">
                    <div class="et-num" :class="`et-num--${etapa.status}`">
                      <q-icon v-if="etapa.status === 'concluida'" name="check" size="15px" />
                      <q-icon v-else-if="etapa.status === 'nao_concluida'" name="close" size="15px" />
                      <span v-else>{{ i + 1 }}</span>
                    </div>
                    <div class="et-titulo-wrap">
                      <div class="et-titulo">{{ etapa.titulo }}</div>
                      <div v-if="etapa.status === 'concluida' && etapa.concluidaEm" class="et-concluida-em">
                        <q-icon name="check_circle" size="11px" />{{ etapa.concluidaEm }}
                      </div>
                    </div>
                    <div class="et-status-btns">
                      <button
                        class="et-st-btn et-st-btn--ok"
                        :class="{ 'et-st-active': etapa.status === 'concluida' }"
                        @click="setStatusEtapa(etapa, 'concluida')"
                        title="Concluída"
                      ><q-icon name="check" size="14px" /></button>
                      <button
                        class="et-st-btn et-st-btn--nao"
                        :class="{ 'et-st-active': etapa.status === 'nao_concluida' }"
                        @click="setStatusEtapa(etapa, 'nao_concluida')"
                        title="Não Concluída"
                      ><q-icon name="close" size="14px" /></button>
                      <button
                        class="et-st-btn et-st-btn--pend"
                        :class="{ 'et-st-active': etapa.status === 'pendente' }"
                        @click="setStatusEtapa(etapa, 'pendente')"
                        title="Pendente"
                      ><q-icon name="schedule" size="14px" /></button>
                    </div>
                  </div>

                  <!-- Campo da etapa -->
                  <div v-if="etapa.tipo !== 'ok'" class="et-campo">
                    <div v-if="etapa.tipo === 'toggle'" class="et-toggle-btns">
                      <button
                        v-for="op in etapa.opcoes"
                        :key="op"
                        class="et-toggle-btn"
                        :class="{ 'et-toggle-btn--ativo': etapa.valor === op }"
                        @click="etapa.valor = etapa.valor === op ? '' : op; salvarEtapas()"
                      >{{ op }}</button>
                    </div>
                    <select
                      v-else-if="etapa.tipo === 'select'"
                      v-model="etapa.valor"
                      class="et-select"
                      @change="salvarEtapas"
                    >
                      <option value="" disabled>Selecione...</option>
                      <option v-for="op in etapa.opcoes" :key="op" :value="op">{{ op }}</option>
                    </select>
                    <div v-else-if="etapa.tipo === 'texto' && etapa.key === 'empresa'" class="et-autocomplete">
                      <input
                        v-model="etapa.valor"
                        class="et-input"
                        :placeholder="etapa.placeholder"
                        autocomplete="off"
                        @input="filtrarSugestoes(etapa.valor)"
                        @focus="filtrarSugestoes(etapa.valor)"
                        @blur="fecharSugestoes"
                        @change="salvarEtapas"
                      />
                      <div v-if="sugestoesFiltradas.length && mostrarSugestoes" class="et-sugest-list">
                        <button
                          v-for="s in sugestoesFiltradas"
                          :key="s"
                          class="et-sugest-item"
                          @mousedown.prevent="selecionarSugestao(etapa, s)"
                        >
                          <q-icon name="business" size="13px" class="et-sugest-icon" />
                          {{ s }}
                        </button>
                      </div>
                    </div>
                    <div v-else-if="etapa.tipo === 'texto' && etapa.key === 'localizacao'" class="et-autocomplete">
                      <input
                        v-model="etapa.valor"
                        class="et-input"
                        :placeholder="etapa.placeholder"
                        autocomplete="off"
                        @input="filtrarMunicipios(etapa.valor)"
                        @focus="carregarMunicipios(); filtrarMunicipios(etapa.valor)"
                        @blur="fecharMunicipios"
                        @change="salvarEtapas"
                      />
                      <div v-if="municipiosFiltrados.length && mostrarMunicipios" class="et-sugest-list">
                        <button
                          v-for="m in municipiosFiltrados"
                          :key="m"
                          class="et-sugest-item"
                          @mousedown.prevent="selecionarMunicipio(etapa, m, salvarEtapas)"
                        >
                          <q-icon name="location_on" size="13px" class="et-sugest-icon" />
                          {{ m }}
                        </button>
                      </div>
                    </div>
                    <input
                      v-else-if="etapa.tipo === 'texto'"
                      v-model="etapa.valor"
                      class="et-input"
                      :placeholder="etapa.placeholder"
                      @change="salvarEtapas"
                    />
                    <div v-else-if="etapa.tipo === 'carimbo'" class="et-carimbo" :class="{ 'et-carimbo--vazio': !etapa.valor }">
                      <q-icon :name="etapa.valor ? 'verified' : 'pending'" size="16px" />
                      <span>{{ etapa.valor || 'Gerado automaticamente ao concluir' }}</span>
                    </div>
                    <input
                      v-else-if="etapa.tipo === 'senha'"
                      v-model="etapa.valor"
                      type="password"
                      class="et-input"
                      :placeholder="etapa.placeholder"
                      @change="salvarEtapas"
                    />
                    <input
                      v-else-if="etapa.tipo === 'data'"
                      v-model="etapa.valor"
                      type="date"
                      class="et-input"
                      @change="salvarEtapas"
                    />
                    <div v-else-if="etapa.tipo === 'docs'" class="bx-docs-lista">
                      <div v-for="item in etapa.itens" :key="item" class="bx-doc-item">
                        <span class="bx-doc-nome">{{ item }}</span>
                        <div class="bx-doc-btns">
                          <button
                            class="bx-doc-btn bx-doc-btn--ok"
                            :class="{ 'et-st-active': etapa.statusItens[item] === 'ok' }"
                            @click="setStatusItemConst(etapa, item, 'ok')"
                            title="OK"
                          ><q-icon name="check" size="12px" /></button>
                          <button
                            class="bx-doc-btn bx-doc-btn--falta"
                            :class="{ 'et-st-active': etapa.statusItens[item] === 'falta' }"
                            @click="setStatusItemConst(etapa, item, 'falta')"
                            title="Falta"
                          ><q-icon name="close" size="12px" /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Anexos (apenas etapa contrato) -->
                  <div v-if="etapa.key === 'contrato'" class="et-anexos">
                    <div class="et-anx-titulo" @click="anexosExpandido = !anexosExpandido" style="cursor:pointer;user-select:none">
                      <q-icon name="attach_file" size="14px" />
                      Documentos anexados
                      <span class="et-anx-contador" v-if="totalAnexos > 0">({{ totalAnexos }})</span>
                      <q-icon
                        :name="anexosExpandido ? 'expand_less' : 'expand_more'"
                        size="16px"
                        style="margin-left:auto"
                      />
                    </div>
                    <div v-if="anexosExpandido" class="et-anx-cats">
                      <div v-for="cat in categoriasDocs" :key="cat.key" class="et-anx-cat">
                        <div class="et-anx-cat-head">
                          <span class="et-anx-cat-label">{{ cat.label }}</span>
                          <button v-if="cat.key !== 'outros'" class="et-anx-add-btn" @click="abrirAnexo(cat.key)" :title="'Anexar ' + cat.label" :disabled="uploadAndo">
                            <q-spinner v-if="uploadAndo && catAnexoAtiva === cat.key" size="13px" />
                            <q-icon v-else name="add" size="13px" />
                          </button>
                        </div>
                        <div v-if="docsAnexados[cat.key] && docsAnexados[cat.key].length" class="et-anx-files">
                          <div v-for="arq in docsAnexados[cat.key]" :key="arq.id" class="et-anx-file">
                            <q-icon :name="iconeTipoArquivo(arq.tipo)" size="13px" class="et-anx-file-icon" />
                            <span class="et-anx-file-nome" @click="verDoc(arq)" :title="arq.nome" style="cursor:pointer">{{ arq.nome }}</span>
                            <span class="et-anx-file-size">{{ formatarTamanho(arq.tamanho) }}</span>
                            <button class="et-anx-del-btn" @click="removerAnexo(cat.key, arq.id)" title="Remover">
                              <q-icon name="close" size="11px" />
                            </button>
                          </div>
                        </div>
                        <div v-else class="et-anx-empty">Nenhum arquivo</div>

                        <!-- OUTROS: linha para adicionar documentos com nome personalizado -->
                        <div v-if="cat.key === 'outros'" class="et-arquiv-outros-row">
                          <input
                            v-model="outroNomeConstTemp"
                            class="et-arquiv-outros-input"
                            placeholder="Nome do documento (ex: Certidão de Débitos)..."
                            @keyup.enter="outroNomeConstTemp.trim() && abrirAnexo('outros')"
                          />
                          <button
                            class="et-arquiv-upload-btn"
                            :class="{ 'et-arquiv-upload-btn--disabled': !outroNomeConstTemp.trim() || uploadAndo }"
                            :disabled="!outroNomeConstTemp.trim() || uploadAndo"
                            @click="abrirAnexo('outros')"
                          >
                            <q-spinner v-if="uploadAndo && catAnexoAtiva === 'outros'" size="13px" />
                            <q-icon v-else name="upload" size="13px" /> Anexar
                          </button>
                        </div>
                      </div>
                    </div>
                    <input
                      ref="inputAnexoRef"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.xlsx"
                      style="display:none"
                      @change="onAnexoSelecionado"
                    />
                  </div>

                  <!-- Sub-itens: Ativar no Estado -->
                  <div v-if="etapa.key === 'estado' && etapa.valor === 'OK'" class="et-estado-subs">
                    <div class="et-sub-titulo">
                      <q-icon name="folder_open" size="13px" />
                      Documentos do Estado
                    </div>
                    <div v-for="sub in etapa.subItens" :key="sub.key" class="et-sub-item">
                      <div class="et-sub-head">
                        <span class="et-sub-label">{{ sub.label }}</span>
                        <div class="et-sub-acoes">
                          <button
                            class="et-sub-btn et-sub-sim"
                            :class="{ 'et-sub-btn--ativo': (etapa.subStatus[sub.key] || {}).status === 'sim' }"
                            @click="setSubStatus(etapa, sub.key, 'sim')"
                          >SIM</button>
                          <button
                            class="et-sub-btn et-sub-nao"
                            :class="{ 'et-sub-btn--ativo-nao': (etapa.subStatus[sub.key] || {}).status === 'nao' }"
                            @click="setSubStatus(etapa, sub.key, 'nao')"
                          >NÃO</button>
                          <button
                            class="et-sub-btn et-sub-arq"
                            @click="abrirSubAnexo(sub.key)"
                            title="Inserir arquivo"
                          ><q-icon name="attach_file" size="12px" /> Arquivo</button>
                        </div>
                      </div>
                      <!-- Arquivos do sub-item -->
                      <div v-if="subDocs[sub.key] && subDocs[sub.key].length" class="et-sub-files">
                        <div v-for="arq in subDocs[sub.key]" :key="arq.id" class="et-sub-file">
                          <q-icon :name="iconeTipoArquivo(arq.tipo)" size="11px" class="et-anx-file-icon" />
                          <span class="et-sub-file-nome" @click="abrirArquivo(arq)">{{ arq.nome }}</span>
                          <span class="et-anx-file-size">{{ formatarTamanho(arq.tamanho) }}</span>
                          <button class="et-anx-del-btn" @click="removerSubDoc(sub.key, arq.id)"><q-icon name="close" size="11px" /></button>
                        </div>
                      </div>
                      <!-- Campo protocolo (somente CRC) -->
                      <input
                        v-if="sub.temProtocolo"
                        v-model="etapa.subStatus[sub.key].protocolo"
                        class="et-input et-sub-proto"
                        placeholder="Número do protocolo"
                        @change="salvarEtapas"
                      />
                    </div>
                    <input
                      ref="inputSubAnexoRef"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                      style="display:none"
                      @change="onSubAnexoSelecionado"
                    />
                  </div>

                  <div class="et-obs">
                    <q-icon name="edit_note" size="16px" class="et-obs-icon" />
                    <input
                      v-model="etapa.obs"
                      class="et-obs-input"
                      placeholder="Observação..."
                      @change="salvarEtapas"
                    />
                  </div>
                </div>
              </div>

              <!-- Botão Concluir Guia -->
              <div class="et-concluir-wrap">
                <button class="et-concluir-btn--depois" @click="concluirDepois" :disabled="gerandoRelatorio">
                  <q-icon name="schedule" size="18px" />
                  Concluir Depois
                </button>
                <button class="et-concluir-btn" @click="gerarRelatorio" :disabled="gerandoRelatorio">
                  <q-icon :name="gerandoRelatorio ? 'hourglass_empty' : 'download'" size="18px" />
                  {{ gerandoRelatorio ? 'Gerando...' : 'Concluir e Gerar Relatório' }}
                </button>
              </div>

              <!-- Histórico de conclusões -->
              <div v-if="historico.length" class="hist-wrap">
                <div class="hist-header" @click="historicoExpandido = !historicoExpandido">
                  <div class="hist-header-left">
                    <q-icon name="history" size="16px" />
                    <span>Histórico</span>
                    <span class="hist-badge">{{ historico.length }}</span>
                  </div>
                  <q-icon :name="historicoExpandido ? 'expand_less' : 'expand_more'" size="16px" />
                </div>
                <div v-if="historicoExpandido" class="hist-list">
                  <div v-for="h in historico" :key="h.id" class="hist-item">
                    <div class="hist-item-main">
                      <div class="hist-empresa">{{ h.empresa || '—' }}</div>
                      <div class="hist-meta">
                        <span v-if="h.protocolo" class="hist-protocolo">
                          <q-icon name="tag" size="11px" /> {{ h.protocolo }}
                        </span>
                        <span v-if="h.localizacao" class="hist-local">
                          <q-icon name="place" size="11px" /> {{ h.localizacao }}
                        </span>
                      </div>
                    </div>
                    <div class="hist-item-right">
                      <span class="hist-data">{{ h.data }} {{ h.hora }}</span>
                      <button class="hist-del-btn" @click.stop="removerHistorico(h.id)" title="Remover">
                        <q-icon name="close" size="11px" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </transition>

          <!-- Sessão: Baixa -->
          <transition name="sec-fade">
            <div v-if="ctrlSessao2 === 'Baixa'" class="et-guia">

              <div class="row items-center no-wrap q-mb-lg" style="gap:16px">
                <button class="rp-btn-back" @click="ctrlSessao2 = null">
                  <q-icon name="arrow_back" size="16px" />
                  Controle
                </button>
                <div>
                  <div class="rp-eyebrow row items-center no-wrap q-mb-xs">
                    <q-icon name="inventory_2" size="15px" class="q-mr-xs" style="color:#ef4444" />
                    <span>Encerramento de empresa</span>
                  </div>
                  <h2 class="rp-title">Baixa</h2>
                </div>
              </div>

              <!-- Barra de progresso -->
              <div class="et-guia-head">
                <div>
                  <div class="et-guia-title">Guia de Baixa</div>
                  <div class="et-guia-sub">{{ etapasBaixaConcluidas }} de {{ etapasBaixa.length }} etapas concluídas</div>
                </div>
                <div class="et-guia-progress">
                  <div class="et-guia-track">
                    <div class="et-guia-fill et-guia-fill--baixa" :style="{ width: progressoBaixa + '%' }" />
                  </div>
                  <span class="et-guia-pct">{{ progressoBaixa }}%</span>
                </div>
              </div>

              <!-- Lista de etapas -->
              <div class="et-list">
                <div
                  v-for="(etapa, i) in etapasBaixa"
                  :key="etapa.key"
                  class="et-card"
                  :class="`et-card--${etapa.status}`"
                >
                  <div class="et-card-top">
                    <div class="et-num" :class="`et-num--${etapa.status}`">
                      <q-icon v-if="etapa.status === 'concluida'"    name="check" size="15px" />
                      <q-icon v-else-if="etapa.status === 'nao_concluida'" name="close" size="15px" />
                      <span v-else>{{ i + 1 }}</span>
                    </div>
                    <div class="et-titulo-wrap">
                      <div class="et-titulo">{{ etapa.titulo }}</div>
                      <div v-if="etapa.status === 'concluida' && etapa.concluidaEm" class="et-concluida-em">
                        <q-icon name="check_circle" size="11px" />{{ etapa.concluidaEm }}
                      </div>
                    </div>
                    <div class="et-status-btns">
                      <button class="et-st-btn et-st-btn--ok"   :class="{ 'et-st-active': etapa.status === 'concluida' }"    @click="setStatusEtapaBaixa(etapa, 'concluida')"    title="Concluída"><q-icon name="check"    size="14px" /></button>
                      <button class="et-st-btn et-st-btn--nao"  :class="{ 'et-st-active': etapa.status === 'nao_concluida' }" @click="setStatusEtapaBaixa(etapa, 'nao_concluida')" title="Não Concluída"><q-icon name="close"  size="14px" /></button>
                      <button class="et-st-btn et-st-btn--pend" :class="{ 'et-st-active': etapa.status === 'pendente' }"      @click="setStatusEtapaBaixa(etapa, 'pendente')"       title="Pendente"><q-icon name="schedule" size="14px" /></button>
                    </div>
                  </div>

                  <!-- Campo da etapa -->
                  <div v-if="etapa.tipo !== 'ok'" class="et-campo">

                    <!-- Toggle (CONC/NÃO, GOV/Cert) -->
                    <div v-if="etapa.tipo === 'toggle'" class="et-toggle-btns">
                      <button
                        v-for="op in etapa.opcoes" :key="op"
                        class="et-toggle-btn"
                        :class="{ 'et-toggle-btn--ativo': etapa.valor === op }"
                        @click="etapa.valor = etapa.valor === op ? '' : op; salvarEtapasBaixa()"
                      >{{ op }}</button>
                    </div>

                    <!-- Select -->
                    <select v-else-if="etapa.tipo === 'select'" v-model="etapa.valor" class="et-select" @change="salvarEtapasBaixa">
                      <option value="" disabled>Selecione...</option>
                      <option v-for="op in etapa.opcoes" :key="op" :value="op">{{ op }}</option>
                    </select>

                    <!-- Texto (empresa com autocomplete) -->
                    <div v-else-if="etapa.tipo === 'texto' && etapa.key === 'empresa'" class="et-autocomplete">
                      <input
                        v-model="etapa.valor"
                        class="et-input"
                        :placeholder="etapa.placeholder"
                        autocomplete="off"
                        @input="filtrarSugestoes(etapa.valor)"
                        @focus="filtrarSugestoes(etapa.valor)"
                        @blur="fecharSugestoes"
                        @change="salvarEtapasBaixa"
                      />
                      <div v-if="sugestoesFiltradas.length && mostrarSugestoes" class="et-sugest-list">
                        <button
                          v-for="s in sugestoesFiltradas"
                          :key="s"
                          class="et-sugest-item"
                          @mousedown.prevent="selecionarSugestao(etapa, s); salvarEtapasBaixa()"
                        >
                          <q-icon name="business" size="13px" class="et-sugest-icon" />
                          {{ s }}
                        </button>
                      </div>
                    </div>

                    <!-- Texto (localização com autocomplete de municípios) -->
                    <div v-else-if="etapa.tipo === 'texto' && etapa.key === 'localizacao'" class="et-autocomplete">
                      <input
                        v-model="etapa.valor"
                        class="et-input"
                        :placeholder="etapa.placeholder"
                        autocomplete="off"
                        @input="filtrarMunicipios(etapa.valor)"
                        @focus="carregarMunicipios(); filtrarMunicipios(etapa.valor)"
                        @blur="fecharMunicipios"
                        @change="salvarEtapasBaixa"
                      />
                      <div v-if="municipiosFiltrados.length && mostrarMunicipios" class="et-sugest-list">
                        <button
                          v-for="m in municipiosFiltrados"
                          :key="m"
                          class="et-sugest-item"
                          @mousedown.prevent="selecionarMunicipio(etapa, m, salvarEtapasBaixa)"
                        >
                          <q-icon name="location_on" size="13px" class="et-sugest-icon" />
                          {{ m }}
                        </button>
                      </div>
                    </div>

                    <!-- Texto simples -->
                    <input
                      v-else-if="etapa.tipo === 'texto'"
                      v-model="etapa.valor"
                      class="et-input"
                      :placeholder="etapa.placeholder"
                      @change="salvarEtapasBaixa"
                    />

                    <!-- Data -->
                    <input
                      v-else-if="etapa.tipo === 'data'"
                      v-model="etapa.valor"
                      type="date"
                      class="et-input"
                      @change="salvarEtapasBaixa"
                    />

                    <!-- Arquivamento de Informações — dropdown com upload por item -->
                    <div v-else-if="etapa.tipo === 'checklist'" class="et-arquiv">
                      <!-- Cabeçalho colapsável da lista -->
                      <button class="et-arquiv-lista-toggle" @click="arquivListaExpandida = !arquivListaExpandida">
                        <q-icon name="folder_open" size="14px" />
                        <span>Documentos para arquivar</span>
                        <span v-if="Object.values(docsArquivamentoBaixa).some(a => a?.length)" class="et-arquiv-badge" style="margin-left:4px">
                          {{ Object.values(docsArquivamentoBaixa).reduce((s,a)=>s+(a?.length||0),0) }}
                        </span>
                        <q-icon :name="arquivListaExpandida ? 'expand_less' : 'expand_more'" size="14px" style="margin-left:auto" />
                      </button>

                      <!-- Lista de itens — só visível quando expandida -->
                      <template v-if="arquivListaExpandida">
                      <div v-for="item in etapa.itens" :key="item" class="et-arquiv-item" :class="{ 'et-arquiv-item--hasfiles': docsArquivamentoBaixa[item]?.length }">
                        <div class="et-arquiv-head">
                          <div class="et-arquiv-dot" :class="{ 'et-arquiv-dot--done': docsArquivamentoBaixa[item]?.length }"></div>
                          <span class="et-arquiv-label">{{ item }}</span>
                          <span v-if="docsArquivamentoBaixa[item]?.length" class="et-arquiv-badge">{{ docsArquivamentoBaixa[item].length }}</span>
                          <button class="et-arquiv-toggle-btn" :class="{ 'et-arquiv-toggle-btn--open': arquivAberto[item] }" @click="toggleArquiv(item)">
                            Arquivos <q-icon :name="arquivAberto[item] ? 'expand_less' : 'expand_more'" size="13px" />
                          </button>
                        </div>
                        <div v-if="arquivAberto[item]" class="et-arquiv-body">
                          <!-- Lista de arquivos já anexados -->
                          <div v-if="docsArquivamentoBaixa[item]?.length" class="et-anx-files">
                            <div v-for="arq in docsArquivamentoBaixa[item]" :key="arq.id" class="et-anx-file">
                              <q-icon :name="iconeTipoArquivo(arq.tipo)" size="13px" class="et-anx-file-icon" />
                              <span class="et-anx-file-nome" @click="abrirArquivo(arq)" :title="arq.nome">{{ arq.nomeCustom || arq.nome }}</span>
                              <span class="et-anx-file-size">{{ formatarTamanho(arq.tamanho) }}</span>
                              <button class="et-anx-del-btn" @click="removerArquivamento(item, arq.id)"><q-icon name="close" size="11px" /></button>
                            </div>
                          </div>
                          <div v-else class="et-anx-empty">Nenhum arquivo anexado</div>

                          <!-- Campo de nome personalizado (somente OUTROS) -->
                          <div v-if="item === 'OUTROS'" class="et-arquiv-outros-row">
                            <input
                              v-model="outroNomeTemp"
                              class="et-arquiv-outros-input"
                              placeholder="Nome do documento (ex: Certidão de Débitos)..."
                            />
                            <button
                              class="et-arquiv-upload-btn"
                              :class="{ 'et-arquiv-upload-btn--disabled': !outroNomeTemp.trim() }"
                              :disabled="!outroNomeTemp.trim()"
                              @click="abrirArquivamento(item)"
                            >
                              <q-icon name="upload" size="13px" /> Anexar
                            </button>
                          </div>
                          <button v-else class="et-arquiv-upload-btn" @click="abrirArquivamento(item)">
                            <q-icon name="upload" size="13px" /> Anexar arquivo
                          </button>
                        </div>
                      </div>
                      </template><!-- fim v-if arquivListaExpandida -->

                      <input
                        ref="inputArquivRef"
                        type="file" multiple
                        accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.xlsx"
                        style="display:none"
                        @change="onArquivamentoSelecionado"
                      />
                    </div>

                  </div>

                  <!-- Bloco especial: e-mails de envio -->
                  <div v-if="etapa.key === 'envio_email'" class="et-emails">
                    <div v-for="dest in emailsBaixa" :key="dest.email" class="et-email-item">
                      <q-icon name="mail" size="13px" class="et-email-icon" />
                      <div class="et-email-info">
                        <span class="et-email-nome">{{ dest.nome }}</span>
                        <span class="et-email-addr">{{ dest.email }}</span>
                      </div>
                      <button class="et-email-copy" @click="copiarTexto(dest.email, dest.nome)" title="Copiar e-mail">
                        <q-icon name="content_copy" size="12px" />
                      </button>
                    </div>
                  </div>

                  <!-- Anexos (etapa contrato da Baixa) -->
                  <div v-if="etapa.key === 'contrato'" class="et-anexos">
                    <div class="et-anx-titulo" @click="anexosBaixaExpandido = !anexosBaixaExpandido" style="cursor:pointer;user-select:none">
                      <q-icon name="attach_file" size="14px" />
                      Documentos anexados
                      <span class="et-anx-contador" v-if="totalAnexosBaixa > 0">({{ totalAnexosBaixa }})</span>
                      <q-icon :name="anexosBaixaExpandido ? 'expand_less' : 'expand_more'" size="16px" style="margin-left:auto" />
                    </div>
                    <div v-if="anexosBaixaExpandido" class="et-anx-cats">
                      <div v-for="cat in categoriasBaixaDocs" :key="cat.key" class="et-anx-cat">
                        <div class="et-anx-cat-head">
                          <span class="et-anx-cat-label">{{ cat.label }}</span>
                          <button class="et-anx-add-btn" @click="abrirAnexoBaixa(cat.key)">
                            <q-icon name="add" size="13px" />
                          </button>
                        </div>
                        <div v-if="docsAnexadosBaixa[cat.key] && docsAnexadosBaixa[cat.key].length" class="et-anx-files">
                          <div v-for="arq in docsAnexadosBaixa[cat.key]" :key="arq.id" class="et-anx-file">
                            <q-icon :name="iconeTipoArquivo(arq.tipo)" size="13px" class="et-anx-file-icon" />
                            <span class="et-anx-file-nome" @click="abrirArquivo(arq)" :title="arq.nome">{{ arq.nome }}</span>
                            <span class="et-anx-file-size">{{ formatarTamanho(arq.tamanho) }}</span>
                            <button class="et-anx-del-btn" @click="removerAnexoBaixa(cat.key, arq.id)"><q-icon name="close" size="11px" /></button>
                          </div>
                        </div>
                        <div v-else class="et-anx-empty">Nenhum arquivo</div>
                      </div>
                    </div>
                    <input
                      ref="inputAnexoBaixaRef"
                      type="file" multiple
                      accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.xlsx"
                      style="display:none"
                      @change="onAnexoBaixaSelecionado"
                    />
                  </div>

                  <!-- Observação -->
                  <div class="et-obs">
                    <q-icon name="edit_note" size="16px" class="et-obs-icon" />
                    <input v-model="etapa.obs" class="et-obs-input" placeholder="Observação..." @change="salvarEtapasBaixa" />
                  </div>
                </div>
              </div>

              <!-- Botão Concluir -->
              <div class="et-concluir-wrap">
                <button class="et-concluir-btn--depois" @click="concluirDepois" :disabled="gerandoRelatorioBaixa">
                  <q-icon name="schedule" size="18px" />
                  Concluir Depois
                </button>
                <button class="et-concluir-btn" @click="gerarRelatorioBaixa" :disabled="gerandoRelatorioBaixa">
                  <q-icon :name="gerandoRelatorioBaixa ? 'hourglass_empty' : 'download'" size="18px" />
                  {{ gerandoRelatorioBaixa ? 'Gerando...' : 'Concluir e Gerar Relatório' }}
                </button>
              </div>

            </div>
          </transition>

          <!-- Sessão: Consultar -->
          <transition name="sec-fade">
            <div v-if="ctrlSessao3 === 'Consultar'" class="cons-page">

              <div class="row items-center no-wrap q-mb-lg" style="gap:16px">
                <button class="rp-btn-back" @click="ctrlSessao3 = null">
                  <q-icon name="arrow_back" size="16px" />
                  Controle
                </button>
                <div>
                  <div class="rp-eyebrow row items-center no-wrap q-mb-xs">
                    <q-icon name="manage_search" size="15px" class="q-mr-xs" style="color:#3b82f6" />
                    <span>Verificação de processos</span>
                  </div>
                  <h2 class="rp-title">Consultar</h2>
                </div>
              </div>

              <div class="cons-search-wrap q-mb-lg">
                <q-icon name="search" size="18px" class="cons-search-icon" />
                <input
                  v-model="consultarBusca"
                  class="cons-search-input"
                  placeholder="Buscar por empresa, protocolo ou localização..."
                />
                <button v-if="consultarBusca" class="cons-search-clear" @click="consultarBusca = ''">
                  <q-icon name="close" size="16px" />
                </button>
              </div>

              <div v-if="processosConsultar.length" class="cons-list">
                <div
                  v-for="p in processosConsultar"
                  :key="p.id"
                  class="cons-card"
                  :class="[`cons-card--${p.status}`, 'cons-card--clicavel']"
                  @click="continuarProcesso(p)"
                >
                  <div class="cons-card-left">
                    <div class="cons-status-dot" :class="`cons-dot--${p.status}`"></div>
                    <div class="cons-info">
                      <div class="cons-empresa">
                        {{ p.empresa }}
                        <span v-if="p.protocolo && p.protocolo !== '—'" class="cons-empresa-proto"># {{ p.protocolo }}</span>
                        <button
                          v-if="p.empresa || (p.protocolo && p.protocolo !== '—')"
                          class="cons-copiar-btn"
                          @click.stop="copiarInfoProcesso(p)"
                          title="Copiar nome e protocolo"
                        ><q-icon name="content_copy" size="12px" /></button>
                      </div>
                      <div class="cons-meta">
                        <span class="cons-meta-item" v-if="p.protocolo !== '—'">
                          <q-icon name="tag" size="12px" /> {{ p.protocolo }}
                        </span>
                        <span class="cons-meta-item" v-if="p.localizacao !== '—'">
                          <q-icon name="place" size="12px" /> {{ p.localizacao }}
                        </span>
                        <span class="cons-meta-item cons-data">
                          <q-icon name="schedule" size="12px" /> {{ p.data }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="cons-card-right">
                    <div class="cons-pct-wrap">
                      <svg class="cons-ring" viewBox="0 0 36 36">
                        <circle class="cons-ring-bg" cx="18" cy="18" r="15.9" />
                        <circle
                          class="cons-ring-fill"
                          :class="`cons-ring--${p.status}`"
                          cx="18" cy="18" r="15.9"
                          :stroke-dasharray="`${p.pct} ${100 - p.pct}`"
                          stroke-dashoffset="25"
                        />
                      </svg>
                      <span class="cons-pct-num">{{ p.pct }}%</span>
                    </div>
                    <div class="cons-badge-wrap">
                      <div class="cons-badge" :class="`cons-badge--${p.status}`">
                        {{ p.status === 'concluido' ? 'Concluído' : p.status === 'andamento' ? 'Em andamento' : 'Não iniciado' }}
                      </div>
                      <div v-if="p.status === 'concluido' && p.concluidoPor" class="cons-carimbo">
                        <div class="cons-carimbo-nome">
                          <q-icon name="verified" size="11px" />
                          {{ p.concluidoPor }}
                        </div>
                        <div class="cons-carimbo-data">{{ p.data }}</div>
                      </div>
                    </div>
                    <button class="cons-docs-btn" @click.stop="abrirDialogDocs(p, $event)" title="Ver documentos anexados">
                      <q-icon name="folder_open" size="14px" />
                      Documentos
                    </button>
                    <button class="cons-email-btn" :class="{ 'cons-email-btn--agendado': temEmailAgendado(p) }" @click.stop="abrirDialogEmail(p)" title="Enviar e-mail">
                      <q-icon name="email" size="14px" />
                      E-mail
                      <span v-if="temEmailAgendado(p)" class="cons-email-badge"></span>
                    </button>
                    <div class="cons-continuar-btn" :class="{ 'cons-continuar-btn--ver': p.status === 'concluido' }">
                      <q-icon :name="p.status === 'concluido' ? 'visibility' : 'play_arrow'" size="14px" />
                      {{ p.status === 'concluido' ? 'Visualizar' : 'Continuar' }}
                    </div>
                    <button class="cons-excluir-btn" @click.stop="excluirProcessoConsultar(p)" title="Excluir processo">
                      <q-icon name="delete_outline" size="15px" />
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="cons-empty">
                <q-icon name="inbox" size="40px" style="color:rgba(255,255,255,0.15)" />
                <span>Nenhum processo encontrado</span>
              </div>

            </div>
          </transition>

        </div>

        <!-- ══ VIEW: PRAZOS ══ -->
        <div v-if="activeNav === 'Prazos'" class="prazos-page">

          <!-- Cabeçalho -->
          <div class="row items-center no-wrap q-mb-lg" style="gap:16px">
            <button class="rp-btn-back" @click="activeNav = 'Resumo'">
              <q-icon name="arrow_back" size="16px" />
              Resumo
            </button>
            <div>
              <div class="rp-eyebrow row items-center no-wrap q-mb-xs">
                <q-icon name="schedule" size="15px" class="q-mr-xs" style="color:#5ab82e" />
                <span>Abertura de CNPJ · prazo de 10 dias</span>
              </div>
              <h2 class="rp-title">Gestão de Prazos</h2>
            </div>
          </div>

          <!-- Tabs Ativos / Concluídos -->
          <div class="pz-tabs q-mb-lg">
            <button :class="['pz-tab', abaPrazos === 'ativos' && 'pz-tab--active']" @click="abaPrazos = 'ativos'">
              <q-icon name="pending_actions" size="15px" /> Ativos
              <span class="pz-tab-count">{{ registrosAtivos.length }}</span>
            </button>
            <button :class="['pz-tab', abaPrazos === 'concluidos' && 'pz-tab--active']" @click="abaPrazos = 'concluidos'">
              <q-icon name="check_circle" size="15px" /> Concluídos
              <span class="pz-tab-count pz-tab-count--green">{{ registrosConcluidos.length }}</span>
            </button>
          </div>

          <!-- Filtros (só para ativos) -->
          <div v-if="abaPrazos === 'ativos'" class="pz-filters q-mb-lg">
            <div class="pz-filter-group">
              <span class="pz-filter-label">Urgência</span>
              <div class="pz-filter-btns">
                <button
                  v-for="u in [{v:'todos',l:'Todos'},{v:'normal',l:'🟢 Normal'},{v:'priorizar',l:'🟡 Priorizar'},{v:'urgente',l:'🔴 Urgente'}]"
                  :key="u.v"
                  class="pz-filter-btn"
                  :class="[`pz-filter-btn--${u.v}`, { 'pz-filter-btn--active': filtroUrgencia === u.v }]"
                  @click="filtroUrgencia = u.v"
                >{{ u.l }}</button>
              </div>
            </div>
            <div class="pz-filter-group">
              <span class="pz-filter-label">Vencimento</span>
              <div class="pz-filter-btns">
                <button
                  v-for="t in [{v:'todos',l:'Todos'},{v:'hoje',l:'Hoje'},{v:'proximos3',l:'Próx. 3 dias'},{v:'proximos7',l:'Próx. 7 dias'},{v:'vencidos',l:'Vencidos'}]"
                  :key="t.v"
                  class="pz-filter-btn"
                  :class="{ 'pz-filter-btn--active': filtroTempo === t.v }"
                  @click="filtroTempo = t.v"
                >{{ t.l }}</button>
              </div>
            </div>
          </div>

          <!-- ABA: ATIVOS -->
          <template v-if="abaPrazos === 'ativos'">
            <div v-if="registrosAtivos.length === 0" class="prazos-empty">
              <q-icon name="schedule" size="48px" style="color:rgba(255,255,255,0.12)" />
              <p>Nenhum processo ativo.</p>
              <button class="rp-btn-back" @click="activeNav = 'Resumo'">
                <q-icon name="add" size="16px" /> Ir para Resumo
              </button>
            </div>
            <div v-else-if="registrosFiltrados.length === 0" class="prazos-empty">
              <q-icon name="filter_list" size="40px" style="color:rgba(255,255,255,0.12)" />
              <p>Nenhum registro para este filtro.</p>
            </div>
            <div v-else class="prazos-list">
            <div
              v-for="reg in registrosFiltrados"
              :key="reg.id"
              class="prazo-card"
              :class="`prazo-card--${reg.prazo || 'normal'}`"
            >
              <div class="prazo-card-bar" />

              <!-- Nome + datas + barra de tempo -->
              <div class="prazo-card-body">
                <div class="prazo-card-razao">{{ reg.razaoSocial || 'Sem razão social' }}</div>
                <div class="prazo-card-meta">
                  Cadastrado {{ reg.dataFormatada }} · Vence {{ reg.dataVencFormatada || '—' }}
                </div>
                <div class="prazo-time-bar">
                  <div class="prazo-time-fill" :style="{ width: progressoDias(reg) + '%', background: corTempo(reg._dias) }" />
                </div>
              </div>

              <!-- Dias restantes -->
              <div class="prazo-dias" :style="{ color: corTempo(reg._dias) }">
                <div class="prazo-dias-num">{{ reg._dias < 0 ? Math.abs(reg._dias) : reg._dias }}</div>
                <div class="prazo-dias-label">
                  {{ reg._dias < 0 ? 'dias vencido' : reg._dias === 0 ? 'vence hoje' : 'dias restantes' }}
                </div>
              </div>

              <!-- Badge de urgência + botões de alteração -->
              <div class="prazo-card-right">
                <div class="prazo-badge" :class="`prazo-badge--${reg.prazo || 'normal'}`">
                  {{ prazoEmoji(reg.prazo) }} {{ prazoLabel(reg.prazo) }}
                </div>
                <div class="prazo-dots">
                  <button class="pd-btn pd-btn--normal"    :class="{'pd-active': (reg.prazo||'normal')==='normal'}"    @click="alterarPrazo(reg.id,'normal')"    title="Normal" />
                  <button class="pd-btn pd-btn--priorizar" :class="{'pd-active': reg.prazo==='priorizar'}" @click="alterarPrazo(reg.id,'priorizar')" title="Priorizar" />
                  <button class="pd-btn pd-btn--urgente"   :class="{'pd-active': reg.prazo==='urgente'}"   @click="alterarPrazo(reg.id,'urgente')"   title="Urgente" />
                </div>
                <button class="prazo-concluir-btn" title="Marcar como concluído" @click.stop="marcarConcluido(reg)">
                  <q-icon name="check_circle_outline" size="16px" />
                </button>
                <button class="prazo-excluir-btn" title="Excluir processo" @click.stop="confirmarExcluir(reg)">
                  <q-icon name="delete_outline" size="16px" />
                </button>
              </div>
            </div>
          </div><!-- fim prazos-list ativos -->
          </template><!-- fim aba ativos -->

          <!-- ABA: CONCLUÍDOS -->
          <template v-if="abaPrazos === 'concluidos'">
            <div v-if="registrosConcluidos.length === 0" class="prazos-empty">
              <q-icon name="check_circle" size="48px" style="color:rgba(255,255,255,0.12)" />
              <p>Nenhum processo concluído ainda.</p>
            </div>
            <div v-else class="prazos-list">
              <div
                v-for="reg in registrosConcluidos"
                :key="reg.id"
                class="prazo-card prazo-card--concluido-item"
              >
                <div class="prazo-card-bar" style="background:#22c55e" />
                <div class="prazo-card-body">
                  <div class="prazo-card-razao">{{ reg.razaoSocial || 'Sem razão social' }}</div>
                  <div class="prazo-card-meta">
                    Cadastrado {{ reg.dataFormatada }} · Concluído em {{ reg.dataVencFormatada || '—' }}
                  </div>
                </div>
                <div class="prazo-dias" style="color:#22c55e">
                  <q-icon name="check_circle" size="28px" />
                </div>
                <div class="prazo-card-right">
                  <div class="prazo-badge prazo-badge--concluido-item">
                    <q-icon name="verified" size="13px" /> Concluído
                  </div>
                  <button class="prazo-excluir-btn" title="Excluir" @click.stop="confirmarExcluir(reg)">
                    <q-icon name="delete_outline" size="16px" />
                  </button>
                </div>
              </div>
            </div>
          </template><!-- fim aba concluídos -->

        </div>

        <!-- ══ VIEW: RELATÓRIOS ══ -->
        <div v-if="activeNav === 'Relatórios'" class="rl-page">

          <!-- Header -->
          <div class="rl-header q-mb-lg">
            <div>
              <div class="rp-eyebrow row items-center no-wrap q-mb-xs">
                <q-icon name="bar_chart" size="15px" class="q-mr-xs" style="color:#5ab82e" />
                <span>Relatório Mensal de Intensas</span>
              </div>
              <h2 class="rl-title">CONC / PEN / AND</h2>
              <p class="rl-subtitle">Não iniciados · SUSPENSOS</p>
            </div>
            <div class="rl-controls">
              <select v-model="rlMes" class="rl-select">
                <option v-for="(m, i) in rlMeses" :key="i" :value="i + 1">{{ m }}</option>
              </select>
              <select v-model="rlAno" class="rl-select">
                <option v-for="a in rlAnos" :key="a" :value="a">{{ a }}</option>
              </select>
              <button class="rl-export-btn rl-export-btn--pdf" @click="exportarPDF">
                <q-icon name="picture_as_pdf" size="16px" /> PDF
              </button>
              <button class="rl-export-btn rl-export-btn--excel" @click="exportarExcel">
                <q-icon name="table_view" size="16px" /> Excel
              </button>
            </div>
          </div>

          <!-- Stats -->
          <div class="rl-stats q-mb-lg">
            <div
              v-for="st in rlStats"
              :key="st.key"
              class="rl-stat-card"
              :style="{ '--st-cor': st.cor }"
            >
              <div class="rl-stat-num">{{ st.count }}</div>
              <div class="rl-stat-abbr">{{ st.abbr }}</div>
              <div class="rl-stat-label">{{ st.label }}</div>
            </div>
          </div>

          <!-- Grupos -->
          <div v-for="grupo in rlGrupos" :key="grupo.key" class="rl-section q-mb-md">
            <div class="rl-section-head">
              <div class="rl-section-dot" :style="{ background: grupo.cor }"></div>
              <span class="rl-section-title">{{ grupo.abbr }}</span>
              <span class="rl-section-label-full">{{ grupo.label }}</span>
              <span class="rl-section-count">{{ grupo.items.length }}</span>
            </div>

            <div v-if="grupo.items.length === 0" class="rl-empty">
              <q-icon name="inbox" size="20px" />
              Nenhum processo nesta categoria para {{ rlMeses[rlMes - 1] }}/{{ rlAno }}
            </div>

            <div v-else class="rl-rows">
              <div class="rl-row" v-for="p in grupo.items" :key="p.id">
                <div class="rl-row-left">
                  <div class="rl-row-nome">{{ p.empresa || p.razaoSocial || '—' }}</div>
                  <div class="rl-row-meta">
                    <span v-if="p.protocolo && p.protocolo !== '—'" class="rl-row-proto">
                      <q-icon name="tag" size="11px" /> {{ p.protocolo }}
                    </span>
                    <span v-else class="rl-row-sem-proto">sem protocolo</span>
                    <span class="rl-row-data">{{ p.dataStr }}</span>
                  </div>
                </div>
                <div class="rl-row-right">
                  <div class="rl-row-badge" :style="{ background: grupo.corBg, color: grupo.cor }">
                    {{ grupo.abbr }}
                  </div>
                  <button class="rl-del-btn" @click.stop="excluirProcessoConsultar(p)" title="Excluir processo">
                    <q-icon name="delete_outline" size="15px" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- ══ VIEW: PREFERÊNCIAS ══ -->
        <div v-if="activeNav === 'Preferências'" class="pref-page">

          <div class="page-title q-mb-xs">Preferências</div>
          <div class="page-subtitle q-mb-xl">Personalize o sistema conforme sua necessidade</div>

          <div class="pref-grid">

            <!-- Aparência -->
            <div class="pref-section">
              <div class="pref-section-label">Aparência</div>

              <div class="pref-card">
                <!-- Tema -->
                <div class="pref-row">
                  <div class="pref-row-left">
                    <div class="pref-row-icon-wrap" style="background:rgba(99,102,241,0.15)">
                      <q-icon name="palette" size="18px" style="color:#a5b4fc" />
                    </div>
                    <div>
                      <div class="pref-row-label">Tema de cores</div>
                      <div class="pref-row-desc">Alterne entre modo escuro e claro</div>
                    </div>
                  </div>
                  <div class="pref-theme-toggle">
                    <button
                      class="pref-theme-btn"
                      :class="{ 'pref-theme-btn--active': !lightMode }"
                      @click="lightMode = false"
                    >
                      <q-icon name="dark_mode" size="15px" />
                      Escuro
                    </button>
                    <button
                      class="pref-theme-btn"
                      :class="{ 'pref-theme-btn--active pref-theme-btn--light': lightMode }"
                      @click="lightMode = true"
                    >
                      <q-icon name="light_mode" size="15px" />
                      Claro
                    </button>
                  </div>
                </div>

                <div class="pref-divider" />

                <!-- Preview mini -->
                <div class="pref-preview-wrap">
                  <div class="pref-preview" :class="{ 'pref-preview--light': lightMode }">
                    <div class="pref-preview-sidebar">
                      <div class="pref-preview-brand" />
                      <div class="pref-preview-nav" v-for="i in 4" :key="i" :style="{ opacity: i === 1 ? 1 : 0.35 }" />
                    </div>
                    <div class="pref-preview-main">
                      <div class="pref-preview-topbar" />
                      <div class="pref-preview-cards">
                        <div class="pref-preview-card" v-for="c in 3" :key="c" />
                      </div>
                      <div class="pref-preview-panel" />
                    </div>
                  </div>
                  <div class="pref-preview-label">{{ lightMode ? 'Modo claro ativo' : 'Modo escuro ativo' }}</div>
                </div>
              </div>
            </div>

            <!-- Alertas automáticos WhatsApp — visível apenas para admin -->
            <div v-if="isAdmin" class="pref-section">
              <div class="pref-section-label">Alertas Automáticos</div>
              <div class="pref-card">
                <div class="pref-card-head q-mb-md">
                  <div class="pref-row-icon-wrap" style="background:rgba(37,211,102,0.15)">
                    <q-icon name="whatsapp" size="18px" style="color:#25d366" />
                  </div>
                  <div>
                    <div class="pref-row-label">Alertas de Prazo via WhatsApp</div>
                    <div class="pref-row-desc">Notificação automática ao abrir o sistema e a cada hora</div>
                  </div>
                </div>
                <div class="pref-divider" />
                <div v-for="(num, i) in NUMEROS_ALERTA" :key="num" class="pref-alerta-row">
                  <q-icon name="phone" size="14px" style="color:#25d366;flex-shrink:0" />
                  <span class="pref-alerta-num">{{ num }}</span>
                  <span class="pref-alerta-badge">Ativo</span>
                </div>
                <div class="pref-divider q-mt-sm" />
                <div class="row justify-between items-center q-mt-sm">
                  <button class="pref-alerta-cfg-btn" @click="dialogConfig = true">
                    <q-icon name="settings" size="13px" /> Configurar API
                  </button>
                  <button class="pref-alerta-test-btn" @click="testarAlertasAgora">
                    <q-icon name="send" size="14px" /> Testar alertas agora
                  </button>
                </div>
                <div class="pref-row-desc q-mt-xs" style="font-size:0.68rem">
                  Processos urgentes, priorizar ou vencidos nos próximos 3 dias. Cada processo é alertado apenas uma vez por dia.
                </div>
              </div>
            </div>



          </div>
        </div>

      </q-page>
    </q-page-container>

    <!-- Dialog: Selecionar Prazo -->
    <q-dialog v-model="dialogPrazo" persistent>
      <div class="prazo-dialog">
        <div class="prazo-dialog-header">
          <q-icon name="schedule" size="24px" style="color:#5ab82e" />
          <div>
            <div class="prazo-dialog-title">Selecionar Prazo</div>
            <div class="prazo-dialog-sub">Defina a urgência deste processo</div>
          </div>
        </div>

        <div class="prazo-opts">
          <button class="prazo-opt prazo-opt--normal" @click="selecionarPrazo('normal')">
            <div class="prazo-opt-indicator" />
            <div>
              <div class="prazo-opt-label">Normal</div>
              <div class="prazo-opt-desc">Sem urgência — fluxo padrão</div>
            </div>
            <q-icon name="arrow_forward_ios" size="14px" class="prazo-opt-arrow" />
          </button>
          <button class="prazo-opt prazo-opt--priorizar" @click="selecionarPrazo('priorizar')">
            <div class="prazo-opt-indicator" />
            <div>
              <div class="prazo-opt-label">Priorizar</div>
              <div class="prazo-opt-desc">Atenção em breve necessária</div>
            </div>
            <q-icon name="arrow_forward_ios" size="14px" class="prazo-opt-arrow" />
          </button>
          <button class="prazo-opt prazo-opt--urgente" @click="selecionarPrazo('urgente')">
            <div class="prazo-opt-indicator" />
            <div>
              <div class="prazo-opt-label">Urgente</div>
              <div class="prazo-opt-desc">Ação imediata necessária</div>
            </div>
            <q-icon name="arrow_forward_ios" size="14px" class="prazo-opt-arrow" />
          </button>
        </div>

        <button class="prazo-cancel" @click="dialogPrazo = false">Cancelar</button>
      </div>
    </q-dialog>

    <!-- Dialog: Configuração API WhatsApp -->
    <q-dialog v-model="dialogConfig">
      <div class="cfg-dialog">
        <div class="cfg-dialog-head">
          <q-icon name="settings" size="22px" style="color:#5ab82e" />
          <div>
            <div class="cfg-dialog-title">API WhatsApp</div>
            <div class="cfg-dialog-sub">Configuração de envio automático</div>
          </div>
        </div>

        <div class="cfg-fields">
          <!-- Responsável -->
          <div class="cfg-section-label">
            <q-icon name="person" size="14px" /> Responsável
          </div>
          <div class="cfg-field">
            <label class="cfg-label">Nome do responsável</label>
            <input v-model="configAPI.responsavel" class="cfg-input" placeholder="Ex: Ítalo Fontes" />
            <span class="cfg-hint">Aparece como assinatura nos processos concluídos</span>
          </div>

          <!-- Seletor de provedor -->
          <div class="cfg-section-label" style="margin-top:10px">
            <q-icon name="chat" size="14px" /> Provedor WhatsApp
          </div>
          <div class="cfg-provider-row">
            <button
              :class="['cfg-provider-btn', configAPI.provider === 'zapi' && 'cfg-provider-btn--active']"
              @click="configAPI.provider = 'zapi'"
            >
              <span class="cfg-provider-dot" style="background:#25d366"></span>
              Z-API <span class="cfg-provider-tag">Recomendado</span>
            </button>
            <button
              :class="['cfg-provider-btn', configAPI.provider === 'evolution' && 'cfg-provider-btn--active']"
              @click="configAPI.provider = 'evolution'"
            >
              <span class="cfg-provider-dot" style="background:#3b82f6"></span>
              Evolution API
            </button>
          </div>

          <!-- Z-API fields -->
          <template v-if="configAPI.provider === 'zapi'">
            <div class="cfg-field">
              <label class="cfg-label">Instance ID</label>
              <input v-model="configAPI.zInstanceId" class="cfg-input" placeholder="Ex: 3D995BCDE46A36D5" />
              <span class="cfg-hint">Encontrado no painel Z-API → sua instância → "Instance ID"</span>
            </div>
            <div class="cfg-field">
              <label class="cfg-label">Token</label>
              <input v-model="configAPI.zToken" class="cfg-input" placeholder="Ex: AB12CD34EF56GH78" type="password" />
              <span class="cfg-hint">Token da instância (não o Client-Token)</span>
            </div>
            <div class="cfg-field">
              <label class="cfg-label">Client-Token (segurança)</label>
              <input v-model="configAPI.zClientToken" class="cfg-input" placeholder="Ex: F6cbxxxx..." type="password" />
              <span class="cfg-hint">Painel Z-API → Segurança → Client-Token</span>
            </div>
          </template>

          <!-- Evolution API fields -->
          <template v-else>
            <div class="cfg-field">
              <label class="cfg-label">URL da API</label>
              <input v-model="configAPI.url" class="cfg-input" placeholder="https://xxx.up.railway.app" />
              <span class="cfg-hint">URL do servidor Evolution API no Railway</span>
            </div>
            <div class="cfg-field">
              <label class="cfg-label">API Key</label>
              <input v-model="configAPI.token" class="cfg-input" placeholder="wms2024secret" type="password" />
              <span class="cfg-hint">Valor de AUTHENTICATION_API_KEY definido no Railway</span>
            </div>
            <div class="cfg-field">
              <label class="cfg-label">Nome da instância</label>
              <input v-model="configAPI.evolutionInstance" class="cfg-input" placeholder="wms" />
              <span class="cfg-hint">Nome que você deu ao criar a instância (ex: wms)</span>
            </div>
          </template>

          <!-- Número compartilhado -->
          <div class="cfg-field" style="margin-top:4px">
            <label class="cfg-label">Número de destino (envio manual)</label>
            <input v-model="configAPI.telefone" class="cfg-input" placeholder="5598999999999" />
            <span class="cfg-hint">DDI + DDD + número, sem espaços ou traços</span>
          </div>

          <div class="cfg-section-label" style="margin-top:10px">
            <q-icon name="mail" size="14px" /> E-mail (envio automático)
          </div>
          <div class="cfg-field">
            <div class="cfg-info-box">
              <q-icon name="check_circle" size="16px" color="positive" />
              <span>O envio de e-mail é feito pelo servidor (Vercel) de forma segura.
              As credenciais ficam protegidas nas variáveis de ambiente
              <code>GMAIL_USER</code> e <code>GMAIL_APP_PASSWORD</code> — não precisam ser
              preenchidas aqui.</span>
            </div>
          </div>
        </div>

        <button class="rp-btn-concluir" style="width:100%; margin-top:8px" @click="salvarConfig">
          <q-icon name="save" size="18px" /> Salvar configuração
        </button>
        <button class="prazo-cancel" style="margin-top:8px" @click="dialogConfig = false">Cancelar</button>
      </div>
    </q-dialog>

    <!-- Dialog: Complementar Relatório -->
    <q-dialog v-model="dialogComplementar" @hide="_valoresPendentes = null">
      <div class="compl-dialog">
        <div class="compl-dialog-header">
          <q-icon name="edit_note" size="24px" style="color:#5ab82e" />
          <div>
            <div class="compl-dialog-title">Completar Relatório</div>
            <div class="compl-dialog-sub">Preencha as informações em falta para gerar em 100%</div>
          </div>
          <q-btn flat round dense icon="close" style="margin-left:auto;color:#aaa" @click="dialogComplementar = false; _valoresPendentes.value = null" />
        </div>

        <div class="compl-fields">
          <div v-for="campo in camposComplementar" :key="campo.token" class="compl-field">
            <label class="compl-label">{{ campo.label }}</label>
            <input
              v-model="campo.valor"
              class="compl-input"
              :placeholder="`Digite ${campo.label.toLowerCase()}…`"
            />
          </div>
        </div>

        <div class="compl-actions">
          <button class="prazo-cancel" @click="confirmarComplementar">Pular e gerar assim</button>
          <button class="rp-btn-concluir" @click="confirmarComplementar">
            <q-icon name="download" size="16px" /> Gerar Relatório
          </button>
        </div>
      </div>
    </q-dialog>

    <!-- Dialog: Confirmar Novo Processo -->
    <q-dialog v-model="dialogNovoProcesso">
      <div class="compl-dialog" style="max-width:420px">
        <div class="compl-dialog-header">
          <q-icon name="warning_amber" size="24px" style="color:#f59e0b" />
          <div>
            <div class="compl-dialog-title">Iniciar Novo Processo?</div>
            <div class="compl-dialog-sub">Todos os dados do formulário atual serão apagados.</div>
          </div>
        </div>
        <div class="compl-actions" style="margin-top:24px">
          <button class="prazo-cancel" @click="dialogNovoProcesso = false">Cancelar</button>
          <button class="rp-btn-concluir" style="background:#e53e3e" @click="novoProcesso">
            <q-icon name="restart_alt" size="16px" /> Limpar e iniciar novo
          </button>
        </div>
      </div>
    </q-dialog>

    <!-- Dialog: E-mail do processo -->
    <q-dialog v-model="dialogEmail" persistent>
      <div class="email-dialog">
        <div class="email-dialog-header">
          <q-icon name="email" size="17px" style="color:#60a5fa" />
          <span class="email-dialog-title">Enviar E-mail</span>
          <span v-if="emailDialogEmpresa" class="email-dialog-sub">— {{ emailDialogEmpresa }}</span>
          <q-btn flat round dense icon="close" style="margin-left:auto;color:#aaa" @click="dialogEmail = false" />
        </div>

        <!-- Abas: Enviar agora / Agendar -->
        <div class="email-tabs">
          <button class="email-tab" :class="{ 'email-tab--active': emailModo === 'agora' }" @click="emailModo = 'agora'">
            <q-icon name="send" size="14px" /> Enviar agora
          </button>
          <button class="email-tab" :class="{ 'email-tab--active': emailModo === 'agendar' }" @click="emailModo = 'agendar'">
            <q-icon name="schedule_send" size="14px" /> Agendar
          </button>
        </div>

        <div class="email-form">
          <div class="email-field">
            <label class="email-label">Para</label>
            <div class="email-destinatarios">
              <span v-for="d in EMAIL_DESTINATARIOS" :key="d.email" class="email-dest-chip" :title="d.email">
                {{ d.nome }}
              </span>
            </div>
          </div>
          <div class="email-field">
            <label class="email-label">Assunto</label>
            <input v-model="emailAssunto" class="email-input" type="text" placeholder="Assunto do e-mail" />
          </div>
          <div class="email-field">
            <label class="email-label">Mensagem</label>
            <textarea v-model="emailMensagem" class="email-textarea" rows="5" placeholder="Digite a mensagem..." />
          </div>

          <!-- Agendamento -->
          <div v-if="emailModo === 'agendar'" class="email-schedule-row">
            <div class="email-field email-field--half">
              <label class="email-label">Data</label>
              <input v-model="emailData" class="email-input" type="date" :min="emailHoje" />
            </div>
            <div class="email-field email-field--half">
              <label class="email-label">Horário</label>
              <input v-model="emailHora" class="email-input" type="time" />
            </div>
          </div>

          <!-- Agendamentos pendentes deste processo -->
          <div v-if="emailsAgendadosDoProcesso.length" class="email-agendados">
            <div class="email-agendados-title">Agendados</div>
            <div v-for="ag in emailsAgendadosDoProcesso" :key="ag.id" class="email-ag-item">
              <div class="email-ag-info">
                <span class="email-ag-para">{{ ag.para }}</span>
                <span class="email-ag-data">{{ ag.dataHoraFormatada }}</span>
              </div>
              <button class="email-ag-del" @click="cancelarAgendamento(ag.id)" title="Cancelar">
                <q-icon name="close" size="13px" />
              </button>
            </div>
          </div>
        </div>

        <div class="email-dialog-footer">
          <button class="email-cancel-btn" @click="dialogEmail = false">Cancelar</button>
          <button class="email-send-btn" :disabled="emailEnviando" @click="confirmarEmail">
            <q-spinner v-if="emailEnviando" size="14px" color="white" />
            <q-icon v-else :name="emailModo === 'agora' ? 'send' : 'schedule_send'" size="14px" />
            {{ emailModo === 'agora' ? 'Enviar' : 'Agendar' }}
          </button>
        </div>
      </div>
    </q-dialog>

    <!-- Dialog: Documentos do processo -->
    <q-dialog v-model="dialogDocs">
      <div class="docs-dialog">
        <div class="docs-dialog-header">
          <q-icon name="folder_open" size="22px" style="color:#5ab82e" />
          <div class="docs-dialog-titulo">
            <div class="docs-dialog-empresa">{{ docsDialogEmpresa }}</div>
            <div class="docs-dialog-sub">
              <template v-if="docsDialogLoading">Carregando...</template>
              <template v-else>{{ docsDialogTotal }} documento{{ docsDialogTotal !== 1 ? 's' : '' }} anexado{{ docsDialogTotal !== 1 ? 's' : '' }}</template>
            </div>
          </div>
          <q-btn flat round dense icon="close" style="margin-left:auto;color:#aaa" @click="dialogDocs = false" />
        </div>

        <div v-if="docsDialogLoading" class="docs-empty">
          <q-spinner size="32px" color="green-4" />
          <p>Buscando documentos...</p>
        </div>

        <div v-else-if="!docsDialogProcessoId" class="docs-empty">
          <q-icon name="link_off" size="40px" style="color:rgba(255,255,255,0.15)" />
          <p>Processo não vinculado a um registro de prazos.</p>
        </div>

        <div v-else-if="docsDialogTotal === 0" class="docs-empty">
          <q-icon name="folder_off" size="40px" style="color:rgba(255,255,255,0.15)" />
          <p>Nenhum documento foi anexado a este processo.</p>
        </div>

        <div v-else class="docs-cats">
          <template v-for="cat in categoriasDocs" :key="cat.key">
            <div v-if="docsDialogLista[cat.key] && docsDialogLista[cat.key].length" class="docs-cat">
              <div class="docs-cat-label">{{ cat.label }}</div>
              <div class="docs-cat-files">
                <div v-for="arq in docsDialogLista[cat.key]" :key="arq.id" class="docs-file">
                  <q-icon :name="arq.tipo?.startsWith('image/') ? 'image' : arq.tipo === 'application/pdf' ? 'picture_as_pdf' : 'insert_drive_file'" size="20px" class="docs-file-icon" />
                  <div class="docs-file-info">
                    <div class="docs-file-nome">{{ arq.nome }}</div>
                    <div class="docs-file-tamanho">{{ (arq.tamanho / 1024).toFixed(1) }} KB</div>
                  </div>
                  <div class="docs-file-acoes">
                    <button class="docs-btn-ver" @click="verDoc(arq)" title="Visualizar">
                      <q-icon name="visibility" size="15px" />
                    </button>
                    <button class="docs-btn-baixar" @click="baixarDoc(arq)" title="Baixar">
                      <q-icon name="download" size="15px" />
                    </button>
                    <button class="docs-btn-del" @click="removerDocDialog(arq)" title="Excluir">
                      <q-icon name="delete_outline" size="15px" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </q-dialog>

    <!-- Modal: Confirmação de Envio Baixa -->
    <transition name="modal-fade">
      <div v-if="mostrarModalEnvio" class="env-overlay" @click.self="mostrarModalEnvio = false">
        <div class="env-modal">

          <!-- Header -->
          <div class="env-modal-head">
            <div class="env-check-icon">
              <q-icon name="check_circle" size="28px" color="white" />
            </div>
            <div class="col">
              <div class="env-modal-title">Processo concluído!</div>
              <div class="env-modal-sub">{{ empresaBaixaEnvio }} · {{ processoBaixaEnvio }}</div>
            </div>
            <button class="env-close-btn" @click="mostrarModalEnvio = false">
              <q-icon name="close" size="18px" />
            </button>
          </div>

          <!-- Status de cada ação -->
          <div class="env-status-list">
            <!-- Relatório baixado -->
            <div class="env-status-item env-status-item--ok">
              <div class="env-status-icon env-si--ok">
                <q-icon name="download_done" size="16px" />
              </div>
              <span class="env-status-label">Relatório baixado</span>
              <q-icon name="check_circle" size="20px" class="env-si-check" />
            </div>

            <!-- WhatsApp -->
            <div class="env-status-item" :class="{
              'env-status-item--ok':      statusWhats === 'ok',
              'env-status-item--error':   statusWhats === 'error',
              'env-status-item--sending': statusWhats === 'sending',
              'env-status-item--skip':    statusWhats === 'skip',
            }">
              <div class="env-status-icon" :class="{
                'env-si--ok':      statusWhats === 'ok',
                'env-si--error':   statusWhats === 'error',
                'env-si--sending': statusWhats === 'sending',
                'env-si--idle':    statusWhats === 'idle' || statusWhats === 'skip',
              }">
                <q-icon name="chat" size="16px" />
              </div>
              <span class="env-status-label">
                WhatsApp
                <span v-if="statusWhats === 'skip'" class="env-status-hint">— não configurado</span>
              </span>
              <q-icon v-if="statusWhats === 'ok'"      name="check_circle" size="20px" class="env-si-check" />
              <q-icon v-else-if="statusWhats === 'error'"   name="cancel"       size="20px" class="env-si-x" />
              <q-spinner v-else-if="statusWhats === 'sending'" size="20px" color="green-4" />
            </div>
          </div>

          <button class="env-fechar-btn" @click="mostrarModalEnvio = false">Fechar</button>

        </div>
      </div>
    </transition>

  </q-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import JSZip from 'jszip'
import { useQuasar } from 'quasar'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { supabase, processoToDb, processoFromDb, historicoToDb, historicoFromDb, configToDb, configFromDb } from '../lib/supabase.js'
import { r2Upload, r2Delete, r2ViewUrl, r2DownloadUrl } from '../lib/r2.js'

const $q     = useQuasar()
const router = useRouter()

const currentUser = ref(null)
supabase.auth.getSession().then(({ data: { session } }) => {
  currentUser.value = session?.user ?? null
})
supabase.auth.onAuthStateChange((_event, session) => {
  currentUser.value = session?.user ?? null
})
const isAdmin          = computed(() => currentUser.value?.user_metadata?.admin === true)

const copiado = ref('')
function copiarInfo(key) {
  const valor = etapaValor(key)
  if (!valor) return
  navigator.clipboard.writeText(valor).then(() => {
    copiado.value = key
    setTimeout(() => { copiado.value = '' }, 2000)
  })
}
const nomeUsuarioLogado = computed(() =>
  currentUser.value?.user_metadata?.nome
  || currentUser.value?.email?.split('@')[0]
  || ''
)
const drawer = ref(true)
const _navSalvo = JSON.parse(localStorage.getItem('wms_nav_state') || 'null')
const activeNav  = ref(_navSalvo?.activeNav  || 'Dashboard')

const lightMode = ref(JSON.parse(localStorage.getItem('wms_light_mode') || 'false'))
watch(lightMode, v => localStorage.setItem('wms_light_mode', JSON.stringify(v)))

const activeStep = ref(0)
const regAberto = ref(_navSalvo?.regAberto || null)
const dialogPrazo  = ref(false)
const ctrlSessao1  = ref(_navSalvo?.ctrlSessao1 || null)
const ctrlSessao2  = ref(_navSalvo?.ctrlSessao2 || null)
const ctrlSessao3  = ref(_navSalvo?.ctrlSessao3 || null)

function salvarNavState() {
  localStorage.setItem('wms_nav_state', JSON.stringify({
    activeNav:   activeNav.value,
    regAberto:   regAberto.value,
    ctrlSessao1: ctrlSessao1.value,
    ctrlSessao2: ctrlSessao2.value,
    ctrlSessao3: ctrlSessao3.value,
  }))
}
watch([activeNav, regAberto, ctrlSessao1, ctrlSessao2, ctrlSessao3], salvarNavState)
const mostrarSugestoes   = ref(false)
const sugestoesFiltradas = ref([])

// ── Municípios do Brasil (IBGE, lazy-load) ──
const municipiosBrasil   = ref([])
const municipiosFiltrados = ref([])
const mostrarMunicipios  = ref(false)
let   _municipiosCarregados = false

async function carregarMunicipios() {
  if (_municipiosCarregados) return
  try {
    const res  = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
    const data = await res.json()
    municipiosBrasil.value = data.map(m => {
      const uf = m.microrregiao?.mesorregiao?.UF?.sigla || ''
      return uf ? `${m.nome} - ${uf}` : m.nome
    })
    _municipiosCarregados = true
  } catch { /* usa campo livre se a API falhar */ }
}

async function filtrarMunicipios(val) {
  mostrarMunicipios.value = true
  const q = (val || '').trim().toLowerCase()
  if (!q || q.length < 2) { municipiosFiltrados.value = []; return }
  await carregarMunicipios()
  municipiosFiltrados.value = municipiosBrasil.value
    .filter(m => m.toLowerCase().includes(q))
    .slice(0, 10)
}

function fecharMunicipios() {
  setTimeout(() => { mostrarMunicipios.value = false }, 150)
}

function selecionarMunicipio(etapa, nome, saveFn) {
  etapa.valor = nome
  mostrarMunicipios.value = false
  saveFn()
}
const inputAnexoRef      = ref(null)
const catAnexoAtiva      = ref('')
const anexosExpandido    = ref(false)
const uploadAndo         = ref(false)
const docsAnexados       = ref({})
const outroNomeConstTemp = ref('')   // nome personalizado para documentos da categoria OUTROS
watch(regAberto, (id) => carregarDocsAnexados(id), { immediate: true })

const totalAnexos = computed(() =>
  Object.values(docsAnexados.value).reduce((acc, arr) => acc + (arr?.length || 0), 0)
)

async function carregarDocsAnexados(processoId) {
  if (!processoId) { docsAnexados.value = {}; return }
  const { data } = await supabase.from('documentos').select('*').eq('processo_id', processoId).order('created_at')
  const grouped = {}
  for (const d of data || []) {
    if (!grouped[d.categoria]) grouped[d.categoria] = []
    grouped[d.categoria].push({ id: d.id, nome: d.nome, tamanho: d.tamanho, tipo: d.tipo, r2_key: d.r2_key })
  }
  docsAnexados.value = grouped
}

const categoriasDocs = [
  { key: 'relatorio',       label: 'RELATÓRIO GERAL' },
  { key: 'contrato_social', label: 'CONTRATO SOCIAL AUTENTICADO' },
  { key: 'cnpj',            label: 'CNPJ' },
  { key: 'qsa',             label: 'QSA' },
  { key: 'sintegra',        label: 'SINTEGRA' },
  { key: 'outros',          label: 'OUTROS' },
]

// ══ ETAPAS DA CONSTITUIÇÃO ══
const etapasPadrao = [
  { key: 'empresa',    titulo: 'Empresa',                     tipo: 'texto',  placeholder: 'Nome da empresa' },
  { key: 'processo',   titulo: 'Processo',                    tipo: 'select', opcoes: ['Saiu', 'Baixa', 'Nova empresa', 'Abertura', 'Alteração', 'Transformação'] },
  { key: 'localizacao',titulo: 'Localização',                 tipo: 'texto',  placeholder: 'Município' },
  { key: 'assinatura', titulo: 'Tipo de Assinatura',          tipo: 'select', opcoes: ['GOV', 'Certificado'] },
  { key: 'protocolo',  titulo: 'Protocolo',                   tipo: 'texto',  placeholder: 'Número do protocolo' },
  { key: 'redesim',    titulo: 'REDE SIM',                    tipo: 'ok' },
  { key: 'dbe',        titulo: 'DBE',                         tipo: 'ok' },
  { key: 'fcn',        titulo: 'FCN',                         tipo: 'ok' },
  { key: 'taxa',       titulo: 'Taxa',                        tipo: 'ok' },
  { key: 'contrato',   titulo: 'Data do Contrato Autenticado',tipo: 'data' },
  { key: 'semfaz',     titulo: 'Senha SEMFAZ e Alvará',       tipo: 'texto',  placeholder: 'Senha SEMFAZ' },
  { key: 'estado',     titulo: 'Ativar no Estado',            tipo: 'toggle', opcoes: ['OK', 'NA'],
    subItens: [
      { key: 'alvara',  label: 'Alvará',              temProtocolo: false },
      { key: 'extrato', label: 'Extrato Bancário',     temProtocolo: false },
      { key: 'aluguel', label: 'Contrato de Aluguel',  temProtocolo: false },
      { key: 'crc',     label: 'Certidão de CRC',      temProtocolo: true  },
    ]
  },
  { key: 'sefaznet',   titulo: 'Senha SEFAZ NET',             tipo: 'texto',  placeholder: 'Senha SEFAZ NET' },
  { key: 'regime',     titulo: 'Regime',                      tipo: 'select', opcoes: ['Simples Nacional', 'Lucro Presumido', 'Lucro Real'] },
  { key: 'vigilancia', titulo: 'Vigilância Sanitária',        tipo: 'toggle', opcoes: ['OK', 'NA'] },
  { key: 'dominio',    titulo: 'Cadastro Domínio',            tipo: 'toggle', opcoes: ['OK', 'Falta'] },
  { key: 'veri',       titulo: 'Cadastro Veri',               tipo: 'toggle', opcoes: ['OK', 'Falta'] },
  { key: 'alv_bombeiro', titulo: 'Alvará Bombeiro',                        tipo: 'ok' },
  { key: 'alv_prefeit',  titulo: 'Alvará Prefeitura',                      tipo: 'ok' },
  { key: 'alv_vigilanc', titulo: 'Alvará da Vigilância Sanitária',         tipo: 'ok' },
  { key: 'alv_ambiente', titulo: 'Alvará do Meio Ambiente',                tipo: 'ok' },
  { key: 'proc_fisica',  titulo: 'Procuração Pessoa Física',               tipo: 'ok' },
  { key: 'proc_juridica',titulo: 'Procuração Pessoa Jurídica',             tipo: 'ok' },
  { key: 'sintegra_up',  titulo: 'Atualizar SINTEGRA',                     tipo: 'ok' },
  { key: 'regime_trib',  titulo: 'Atualizar Regime Tributário Município',  tipo: 'ok' },
  { key: 'contabilista', titulo: 'Verificar Contabilista',                 tipo: 'ok' },
]

const etapas = ref(carregarEtapas(_navSalvo?.regAberto || null, true))

// processoId=null → usa chave legada 'wms_constituicao'
// usarFallbackLegado=true → ao trocar de processo, não herda etapas de outro processo
function carregarEtapas(processoId, usarFallbackLegado = false) {
  let salvas = null
  if (processoId) {
    salvas = JSON.parse(localStorage.getItem(`wms_etapas_${processoId}`) || 'null')
    if (!salvas && usarFallbackLegado) {
      salvas = JSON.parse(localStorage.getItem('wms_constituicao') || 'null')
    }
  } else {
    salvas = JSON.parse(localStorage.getItem('wms_constituicao') || 'null')
  }
  return etapasPadrao.map(e => {
    const s = salvas?.find(x => x.key === e.key)
    const subStatus = { ...(s?.subStatus || {}) }
    if (e.subItens) {
      e.subItens.forEach(si => {
        if (!subStatus[si.key]) subStatus[si.key] = { status: '', protocolo: '' }
      })
    }
    return { ...e, status: s?.status || '', obs: s?.obs || '', valor: s?.valor || '', concluidaEm: s?.concluidaEm || '', statusItens: s?.statusItens || {}, subStatus }
  })
}

// ── BAIXA ──
const etapasBaixaPadrao = [
  { key: 'empresa',           titulo: 'Empresa',                       tipo: 'texto',     placeholder: 'Nome da empresa' },
  { key: 'processo',          titulo: 'Processo',                      tipo: 'select',    opcoes: ['Saiu', 'Baixa', 'Nova empresa', 'Abertura', 'Alteração', 'Transformação'] },
  { key: 'localizacao',       titulo: 'Localização',                   tipo: 'texto',     placeholder: 'Município' },
  { key: 'assinatura',        titulo: 'Tipo de Assinatura',            tipo: 'select',    opcoes: ['GOV', 'Certificado'] },
  { key: 'arquivamento',      titulo: 'Arquivamento de Informações',   tipo: 'checklist', itens: [
    'CNPJ', 'QSA', 'SINTEGRA', 'RELATÓRIO FISCAL',
    'FICHA CADASTRAL DO MUNICÍPIO', 'FICHA CADASTRAL DO ESTADO',
    'EXTRATO DE DEB MUNICÍPIO', 'EXTRATO DE DEB ESTADO', 'OUTROS'
  ]},
  { key: 'exclusao_contador', titulo: 'Exclusão do Contador',         tipo: 'ok' },
  { key: 'cancelamento_proc', titulo: 'Cancelamento da Procuração',   tipo: 'ok' },
  { key: 'exclusao_veri',     titulo: 'Exclusão do Veri',             tipo: 'ok' },
  { key: 'protocolo',         titulo: 'Protocolo',                    tipo: 'texto',     placeholder: 'Número do protocolo' },
  { key: 'redesim',           titulo: 'REDE SIM',                     tipo: 'ok' },
  { key: 'fcn',               titulo: 'FCN',                          tipo: 'ok' },
  { key: 'taxa',              titulo: 'Taxa',                         tipo: 'ok' },
  { key: 'contrato',          titulo: 'Data do Contrato Autenticado', tipo: 'data' },
]

function carregarEtapasBaixa() {
  const salvas = JSON.parse(localStorage.getItem('wms_baixa') || 'null')
  return etapasBaixaPadrao.map(e => {
    const s = salvas?.find(x => x.key === e.key)
    const statusItens = { ...(s?.statusItens || {}) }
    if (e.itens) e.itens.forEach(item => { if (!statusItens[item]) statusItens[item] = '' })
    return { ...e, status: s?.status || '', obs: s?.obs || '', valor: s?.valor || '', concluidaEm: s?.concluidaEm || '', statusItens }
  })
}

const etapasBaixa = ref(carregarEtapasBaixa())

function salvarEtapasBaixa() {
  localStorage.setItem('wms_baixa', JSON.stringify(
    etapasBaixa.value.map(e => ({ key: e.key, status: e.status, obs: e.obs, valor: e.valor, concluidaEm: e.concluidaEm || '', statusItens: e.statusItens }))
  ))
}
function setStatusEtapaBaixa(etapa, status) {
  const novoStatus = etapa.status === status ? '' : status
  etapa.status = novoStatus
  etapa.concluidaEm = novoStatus === 'concluida'
    ? new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''
  salvarEtapasBaixa()
}
function toggleCheckItemBaixa(etapa, item) {
  etapa.statusItens[item] = etapa.statusItens[item] === 'ok' ? '' : 'ok'
  salvarEtapasBaixa()
}

const etapasBaixaConcluidas = computed(() => etapasBaixa.value.filter(e => e.status === 'concluida').length)
const progressoBaixa = computed(() => {
  const total = etapasBaixa.value.length
  return total ? Math.round((etapasBaixaConcluidas.value / total) * 100) : 0
})

// Anexos da Baixa
const docsAnexadosBaixa    = ref(JSON.parse(localStorage.getItem('wms_docs_baixa') || '{}'))
const catAnexoBaixaAtiva   = ref('')
const anexosBaixaExpandido = ref(false)
const inputAnexoBaixaRef   = ref(null)

const categoriasBaixaDocs = [
  { key: 'contrato_social', label: 'CONTRATO SOCIAL AUTENTICADO' },
  { key: 'cnpj',            label: 'CNPJ' },
  { key: 'qsa',             label: 'QSA' },
  { key: 'sintegra',        label: 'SINTEGRA' },
  { key: 'doc_socio',       label: 'DOCUMENTO DO SÓCIO' },
  { key: 'relatorio_indiv', label: 'RELATÓRIO INDIV' },
]

const totalAnexosBaixa = computed(() =>
  Object.values(docsAnexadosBaixa.value).reduce((acc, arr) => acc + (arr?.length || 0), 0)
)

function abrirAnexoBaixa(catKey) {
  catAnexoBaixaAtiva.value = catKey
  const el = Array.isArray(inputAnexoBaixaRef.value) ? inputAnexoBaixaRef.value[0] : inputAnexoBaixaRef.value
  el?.click()
}

function onAnexoBaixaSelecionado(e) {
  const files = Array.from(e.target.files)
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (!docsAnexadosBaixa.value[catAnexoBaixaAtiva.value]) docsAnexadosBaixa.value[catAnexoBaixaAtiva.value] = []
      docsAnexadosBaixa.value[catAnexoBaixaAtiva.value].push({
        id: Date.now() + Math.random(), nome: file.name,
        tipo: file.type, tamanho: file.size, data64: ev.target.result,
      })
      localStorage.setItem('wms_docs_baixa', JSON.stringify(docsAnexadosBaixa.value))
    }
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}

function removerAnexoBaixa(catKey, id) {
  docsAnexadosBaixa.value[catKey] = docsAnexadosBaixa.value[catKey].filter(a => a.id !== id)
  localStorage.setItem('wms_docs_baixa', JSON.stringify(docsAnexadosBaixa.value))
}

const emailsBaixa = [
  { nome: 'WMS GERENCIA',                          email: 'gerencia@wmsconsultoria.com.br' },
  { nome: 'WMS CONSULTORIA CONTABIL - FISCAL',     email: 'fiscal@wmsconsultoria.com.br' },
  { nome: 'WMS CONSULTORIA CONTABIL - CONTABIL',   email: 'contabil@wmsconsultoria.com.br' },
  { nome: 'WMS CONSULTORIA CONTABIL - DP',         email: 'pessoal@wmsconsultoria.com.br' },
]

const mostrarModalEnvio  = ref(false)
const empresaBaixaEnvio  = ref('')
const processoBaixaEnvio = ref('')
const protocoloEnvio     = ref('')
const senhaSemfazEnvio   = ref('')
const senhaSefazEnvio    = ref('')
const _docsAnexadosSnap  = ref([])

const todosAnexosBaixa = computed(() => {
  const lista = []
  Object.entries(docsAnexadosBaixa.value || {}).forEach(([cat, files]) => {
    ;(files || []).forEach(f => lista.push({ ...f, categoria: cat }))
  })
  Object.entries(docsArquivamentoBaixa.value || {}).forEach(([cat, files]) => {
    ;(files || []).forEach(f => lista.push({ ...f, categoria: cat }))
  })
  return lista
})

// ── Envio automático ──
// 'idle' | 'sending' | 'ok' | 'error'
const statusWhats = ref('idle')
const statusEmail = ref('idle')

function dataUrlParaBase64(dataUrl) {
  return String(dataUrl || '').split(',').pop()
}

function anexosParaEnvio() {
  const lista = []
  if (ultimoRelatorio.value) {
    lista.push({ nome: ultimoRelatorio.value.nome, base64: ultimoRelatorio.value.base64 })
  }
  todosAnexosBaixa.value.forEach(f => {
    lista.push({ nome: f.nomeCustom || f.nome, base64: dataUrlParaBase64(f.data64) })
  })
  return lista
}

const _MIMES = {
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc:  'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
}

function _mimeDoNome(nomeArquivo) {
  const ext = (nomeArquivo.split('.').pop() || '').toLowerCase()
  return _MIMES[ext] || 'application/octet-stream'
}

function _base64ComMime(base64, nomeArquivo) {
  if (base64.startsWith('data:')) return base64
  return `data:${_mimeDoNome(nomeArquivo)};base64,${base64}`
}

function _base64Puro(base64) {
  // remove o prefixo "data:...;base64," caso exista
  return base64.startsWith('data:') ? base64.split(',').pop() : base64
}

// Envia um documento via WhatsApp
async function enviarWhatsAppDocumento(nomeArquivo, base64, legenda = '') {
  const cfg = configAPI.value
  if (cfg.provider === 'zapi') {
    const ext      = (nomeArquivo.split('.').pop() || 'pdf').toLowerCase()
    const document = _base64ComMime(base64, nomeArquivo)
    const res = await fetch(
      `https://api.z-api.io/instances/${cfg.zInstanceId}/token/${cfg.zToken}/send-document/${ext}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Client-Token': cfg.zClientToken || '' },
        body: JSON.stringify({ phone: cfg.telefone, document, fileName: nomeArquivo }),
      }
    )
    if (!res.ok) {
      const msg = await res.text().catch(() => res.status)
      throw new Error(`Z-API ${res.status}: ${msg}`)
    }
  } else {
    const { url, token, telefone, evolutionInstance } = cfg
    const instance = evolutionInstance || 'wms'
    const res = await fetch(`${url.replace(/\/$/, '')}/message/sendMedia/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': token },
      body: JSON.stringify({
        number:    telefone,
        mediatype: 'document',
        mimetype:  _mimeDoNome(nomeArquivo),
        fileName:  nomeArquivo,
        media:     _base64Puro(base64),
        caption:   legenda,
      }),
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => res.status)
      throw new Error(`Evolution ${res.status}: ${msg}`)
    }
  }
}

async function enviarRelatorioWhatsApp() {
  const cfg = configAPI.value
  const pronto = cfg.provider === 'zapi'
    ? (cfg.zInstanceId && cfg.zToken && cfg.telefone)
    : (cfg.url && cfg.token && cfg.telefone)
  if (!pronto) {
    statusWhats.value = 'skip'
    return
  }
  statusWhats.value = 'sending'
  try {
    const linhasSenhas = [
      senhaSemfazEnvio.value  ? `🔑 *Senha SEMFAZ/Alvará:* ${senhaSemfazEnvio.value}`  : '',
      senhaSefazEnvio.value   ? `🔑 *Senha SEFAZ NET:* ${senhaSefazEnvio.value}`        : '',
    ].filter(Boolean).join('\n')

    const msgTexto = [
      `*${processoBaixaEnvio.value || 'Processo'}*`,
      `🏢 Empresa: *${empresaBaixaEnvio.value}*`,
      protocoloEnvio.value ? `📋 Protocolo: *${protocoloEnvio.value}*` : '',
      linhasSenhas,
      '',
      '📎 Enviando relatório e documentos...',
      '',
      '_WMS Consultoria_',
    ].filter(l => l !== null && l !== undefined).join('\n').replace(/\n{3,}/g, '\n\n')

    const ok = await enviarWhatsApp(msgTexto)
    if (!ok) throw new Error('Falha no envio da mensagem de texto')
    for (const anexo of anexosParaEnvio()) {
      await enviarWhatsAppDocumento(anexo.nome, anexo.base64)
    }
    statusWhats.value = 'ok'
  } catch (err) {
    console.error('[WhatsApp] Falha no envio:', err?.message || err)
    statusWhats.value = 'error'
  }
}

async function baixarDocsR2ParaEnvio() {
  const lista = []
  for (const arq of _docsAnexadosSnap.value) {
    if (!arq.r2_key || arq.categoria === 'relatorio') continue
    try {
      const url  = await r2ViewUrl(arq.r2_key)
      const resp = await fetch(url)
      const blob = await resp.blob()
      lista.push({ nome: arq.nome, base64: await blobParaBase64(blob) })
    } catch { /* ignora arquivo que falhou no download */ }
  }
  return lista
}

// Envio via função serverless do Vercel (Gmail SMTP). As credenciais ficam
// em variáveis de ambiente do servidor — nunca expostas no navegador.
async function enviarRelatorioEmail() {
  // As funções serverless só existem em produção (Vercel); em dev (vite) não há /api.
  if (import.meta.env.DEV) {
    statusEmail.value = 'skip'
    return
  }
  statusEmail.value = 'sending'
  try {
    const r2Docs      = await baixarDocsR2ParaEnvio()
    const tipo        = processoBaixaEnvio.value || 'Processo'
    const empresa     = empresaBaixaEnvio.value  || ''
    const todosAnexos = [...anexosParaEnvio(), ...r2Docs]
    const res = await fetch('/api/enviar-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to:          emailsBaixa.map(e => e.email),
        subject:     `${tipo} – ${empresa}`,
        text:        `${tipo}\nEmpresa: ${empresa}\n\nSegue o relatório e documentos em anexo.\n\nAtenciosamente,\nWMS Consultoria`,
        attachments: todosAnexos.map(a => ({ filename: a.nome, content: a.base64 })),
      }),
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => res.status)
      throw new Error(`Email ${res.status}: ${msg}`)
    }
    const info = await res.json().catch(() => ({}))
    console.log('[Email] Resposta do servidor:', info)
    statusEmail.value = 'ok'
  } catch (err) {
    console.error('[Email] Falha no envio:', err?.message || err)
    statusEmail.value = 'error'
  }
}

watch(mostrarModalEnvio, (val) => {
  if (!val) return
  statusEmail.value = 'idle'
  statusWhats.value = 'idle'
  enviarRelatorioEmail()
  enviarRelatorioWhatsApp()
})

function baixarAnexoBaixa(file) {
  const a = document.createElement('a')
  a.href = file.data64
  a.download = file.nomeCustom || file.nome
  a.click()
}

const gerandoRelatorioBaixa = ref(false)

// ── Relatório Geral: preenchimento do template oficial (formulário WMS) ──
function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function xmlValorRelatorio(s) {
  // quebras de linha viram <w:br/> dentro do mesmo run
  return xmlEscape(s).replace(/\n/g, '</w:t><w:br/><w:t xml:space="preserve">')
}

const ultimoRelatorio = ref(null) // { nome, base64 } — guardado para envio automático

function blobParaBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(String(reader.result).split(',').pop())
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function preencherRelatorioGeral(valores, nomeArquivo) {
  await gerarRelatorioPDF(valores, nomeArquivo)
}

function quadroSocietarioTexto(soc) {
  return [
    soc('CPF')                          ? `CPF: ${soc('CPF')}`                            : '',
    soc('RG ou CNH')                    ? `RG / CNH: ${soc('RG ou CNH')}`                 : '',
    soc('Telefone')                     ? `TELEFONE: ${soc('Telefone')}`                  : '',
    soc('E-Mail')                       ? `E-MAIL: ${soc('E-Mail')}`                      : '',
    soc('Endereço pessoa física')       ? `ENDEREÇO: ${soc('Endereço pessoa física')}`   : '',
  ].filter(Boolean).join('\n')
}

async function gerarRelatorioBaixa() {
  gerandoRelatorioBaixa.value = true
  try {
    const bv  = key => etapasBaixa.value.find(e => e.key === key)?.valor  || ''
    const bs  = key => etapasBaixa.value.find(e => e.key === key)?.status || ''

    const empresa     = bv('empresa')
    const localizacao = bv('localizacao')
    const processo    = bv('processo')
    const assinatura  = bv('assinatura')
    const protocolo   = bv('protocolo')
    const contrato    = bv('contrato')

    // Dados do Resumo
    const emp = label => docsEmpresa.value.find(d => d.label === label)?.valor || ''
    const soc = label => docsSocio.value.find(d => d.label === label)?.valor   || ''
    const tax = label => taxas.value.find(t => t.label === label)?.valor       || ''

    const statusLabel = key => {
      const s = bs(key)
      return s === 'concluida' ? 'CONCLUÍDO' : s === 'nao_concluida' ? 'NÃO CONCLUÍDO' : s === 'pendente' ? 'PENDENTE' : '—'
    }

    const processosTexto = [
      `BAIXA${processo ? ' – ' + processo.toUpperCase() : ''}`,
      protocolo                  ? `PROTOCOLO: ${protocolo}`                            : '',
      contrato                   ? `DATA DO CONTRATO: ${contrato}`                      : '',
      `EXCLUSÃO DO CONTADOR: ${statusLabel('exclusao_contador')}`,
      `CANCELAMENTO DA PROCURAÇÃO: ${statusLabel('cancelamento_proc')}`,
      `EXCLUSÃO DO VERI: ${statusLabel('exclusao_veri')}`,
      `REDE SIM: ${statusLabel('redesim')}`,
      `FCN: ${statusLabel('fcn')}`,
      `TAXA: ${statusLabel('taxa')}`,
      tax('Jucema')              ? `JUCEMA: R$ ${tax('Jucema')}`                        : '',
      tax('Certificado digital da empresa') ? `CERT. DIGITAL: ${tax('Certificado digital da empresa')}` : '',
      tax('Alvará da prefeitura') ? `ALVARÁ PREFEITURA: R$ ${tax('Alvará da prefeitura')}` : '',
    ].filter(Boolean).join('\n')

    await preencherRelatorioGeral({
      RAZAO:       empresa,
      CNPJ:        '',
      ABERTURA:    '',
      CAPITAL:     emp('Capital Social'),
      MUN_EST:     localizacao,
      DONO:        '',
      INSC_EST:    '',
      INSC_MUN:    '',
      SOCIO:       '',
      CPF:         soc('CPF'),
      NIRE:        '',
      SEN_EST:     '',
      SEN_MUN:     '',
      CERTIFICADO: assinatura === 'Certificado' ? 'SIM' : 'NÃO',
      NFSE1:       '',
      NFSE2:       '',
      SEGMENTO:    '',
      CUIDADOR:    '',
      REGIME:      '',
      DOMINIO:     '',
      PROCURACAO:  bs('cancelamento_proc') === 'concluida' ? 'CANCELADA' : '',
      VERI:        bs('exclusao_veri') === 'concluida' ? 'EXCLUÍDO' : '',
      GOVBR:       soc('Senha do Gov.Br (Nível Ouro)'),
      QUADRO:      quadroSocietarioTexto(soc),
      PROCESSOS:   processosTexto,
    }, `Relatorio_Baixa_${empresa || 'Processo'}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.docx`)

    historico.value.unshift({
      id:           Date.now(),
      empresa,
      protocolo,
      localizacao,
      pct:          progressoBaixa.value,
      tipo:         'baixa',
      data:         new Date().toLocaleDateString('pt-BR'),
      hora:         new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      concluidoPor: nomeUsuarioLogado.value,
    })
    localStorage.setItem('wms_historico_constituicao', JSON.stringify(historico.value))

    _docsAnexadosSnap.value  = Object.values(docsAnexados.value).flat()
    empresaBaixaEnvio.value  = empresa
    processoBaixaEnvio.value = processo
    mostrarModalEnvio.value  = true
  } finally {
    gerandoRelatorioBaixa.value = false
  }
}

// Arquivamento de Informações — upload por item
const docsArquivamentoBaixa  = ref(JSON.parse(localStorage.getItem('wms_arq_baixa') || '{}'))
const catArquivAtiva         = ref('')
const inputArquivRef         = ref(null)
const arquivAberto           = ref({})
const outroNomeTemp          = ref('')
const arquivListaExpandida   = ref(false)

function toggleArquiv(item) {
  arquivAberto.value = { ...arquivAberto.value, [item]: !arquivAberto.value[item] }
}
function abrirArquivamento(item) {
  catArquivAtiva.value = item
  const el = Array.isArray(inputArquivRef.value) ? inputArquivRef.value[0] : inputArquivRef.value
  el?.click()
}
function onArquivamentoSelecionado(e) {
  const files = Array.from(e.target.files)
  const isOutros = catArquivAtiva.value === 'OUTROS'
  const nomeCustom = isOutros ? outroNomeTemp.value.trim() : ''
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (!docsArquivamentoBaixa.value[catArquivAtiva.value]) docsArquivamentoBaixa.value[catArquivAtiva.value] = []
      docsArquivamentoBaixa.value[catArquivAtiva.value].push({
        id: Date.now() + Math.random(), nome: file.name,
        nomeCustom: nomeCustom || '',
        tipo: file.type, tamanho: file.size, data64: ev.target.result,
      })
      localStorage.setItem('wms_arq_baixa', JSON.stringify(docsArquivamentoBaixa.value))
    }
    reader.readAsDataURL(file)
  })
  if (isOutros) outroNomeTemp.value = ''
  e.target.value = ''
}
function removerArquivamento(item, id) {
  docsArquivamentoBaixa.value[item] = docsArquivamentoBaixa.value[item].filter(a => a.id !== id)
  localStorage.setItem('wms_arq_baixa', JSON.stringify(docsArquivamentoBaixa.value))
}

const consultarBusca = ref('')

// ── Relatórios ──
const rlMes  = ref(new Date().getMonth() + 1)
const rlAno  = ref(new Date().getFullYear())
const rlMeses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const rlAnos  = computed(() => {
  const a = new Date().getFullYear()
  return [a - 1, a, a + 1]
})

const rlGrupos = computed(() => {
  const mes = rlMes.value
  const ano = rlAno.value

  const matchDMY = (str) => {
    if (!str) return false
    const p = str.split('/')
    return p.length >= 3 && parseInt(p[1]) === mes && parseInt(p[2]) === ano
  }
  const matchISO = (iso) => {
    if (!iso) return false
    const d = new Date(iso)
    return d.getMonth() + 1 === mes && d.getFullYear() === ano
  }

  // CONC — concluídos (pct 100)
  const conc = historico.value
    .filter(h => h.pct === 100 && matchDMY(h.data))
    .map(h => ({ id: h.id, processoId: h.processoId, empresa: h.empresa, protocolo: h.protocolo || '—', dataStr: h.data }))

  // AND — em andamento (pct entre 1 e 99)
  const and = historico.value
    .filter(h => (h.pct ?? 0) > 0 && (h.pct ?? 0) < 100 && matchDMY(h.data))
    .map(h => ({ id: h.id, processoId: h.processoId, empresa: h.empresa, protocolo: h.protocolo || '—', dataStr: h.data }))

  // PEN — pendentes: processos urgentes/priorizar ou vencidos no mês
  const pen = registros.value
    .filter(r => matchISO(r.dataISO) && (r.prazo === 'urgente' || r.prazo === 'priorizar' || diasRestantes(r) < 0))
    .map(r => ({ id: r.id, processoId: r.id, empresa: r.razaoSocial, protocolo: '—', dataStr: r.dataFormatada }))

  // Não iniciados — sem protocolo (pct 0 ou protocolo ausente)
  const naoIniciados = [
    ...historico.value
      .filter(h => (!h.pct || h.pct === 0) && matchDMY(h.data))
      .map(h => ({ id: h.id, processoId: h.processoId, empresa: h.empresa, protocolo: '—', dataStr: h.data })),
    ...registros.value
      .filter(r => matchISO(r.dataISO) && r.prazo === 'normal' && diasRestantes(r) >= 0)
      .map(r => ({ id: r.id, processoId: r.id, empresa: r.razaoSocial, protocolo: '—', dataStr: r.dataFormatada }))
  ]

  // SUSPENSOS — placeholder (sem campo de status suspenso ainda)
  const suspensos = []

  return [
    { key: 'conc', abbr: 'CONC', label: 'Concluídos',     cor: '#22c55e', corBg: 'rgba(34,197,94,0.12)',   items: conc },
    { key: 'and',  abbr: 'AND',  label: 'Em Andamento',   cor: '#3b82f6', corBg: 'rgba(59,130,246,0.12)',  items: and  },
    { key: 'pen',  abbr: 'PEN',  label: 'Pendentes',       cor: '#f59e0b', corBg: 'rgba(245,158,11,0.12)', items: pen  },
    { key: 'nao',  abbr: 'N/I',  label: 'Não Iniciados',   cor: '#94a3b8', corBg: 'rgba(148,163,184,0.1)', items: naoIniciados },
    { key: 'sus',  abbr: 'SUS',  label: 'Suspensos',       cor: '#ef4444', corBg: 'rgba(239,68,68,0.12)',  items: suspensos },
  ]
})

const rlStats = computed(() => rlGrupos.value.map(g => ({
  key: g.key, abbr: g.abbr, label: g.label, count: g.items.length, cor: g.cor
})))

// Carrega logo como base64 para embed nos relatórios
async function rlLogoBase64() {
  return imgBase64('/logo.png')
}
async function imgBase64(path) {
  try {
    const res = await fetch(path)
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

// Endpoint de conversão DOCX → PDF (proxy no Cloudflare Worker → Gotenberg/LibreOffice)
const CONVERSOR_URL = import.meta.env.VITE_CONVERSOR_URL
  || 'https://wms-alertas.cgbconsultoria.workers.dev/converter'

// ── Relatório de Informações Cadastrais — preenche o modelo Word e converte em PDF ──
async function gerarRelatorioPDF(valores, nomeArquivo) {
  const baseNome = nomeArquivo.replace(/\.(docx|pdf)$/i, '')

  // 1. Preencher o modelo Word (layout 100% preservado)
  const resp = await fetch('/relatorio_template.docx')
  const buf  = await resp.arrayBuffer()
  const zip  = await JSZip.loadAsync(buf)
  let docXml = await zip.file('word/document.xml').async('string')
  Object.entries(valores).forEach(([token, v]) => {
    docXml = docXml.split(`{${token}}`).join(xmlValorRelatorio(v || ''))
  })
  zip.file('word/document.xml', docXml)
  const docxBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })

  // 2. Converter para PDF via serviço; se falhar, cai para o .docx
  let blob = docxBlob
  let ext  = 'docx'
  try {
    const fd = new FormData()
    fd.append('files', docxBlob, `${baseNome}.docx`)
    const res = await fetch(CONVERSOR_URL, { method: 'POST', body: fd })
    if (!res.ok) throw new Error(`Conversor respondeu ${res.status}`)
    blob = await res.blob()
    ext  = 'pdf'
  } catch (err) {
    $q.notify({
      icon: 'warning', color: 'warning', position: 'top', timeout: 6000,
      message: 'Não consegui converter para PDF (serviço indisponível). Baixando em Word.',
    })
  }

  const nomeFinal = `${baseNome}.${ext}`
  ultimoRelatorio.value = { nome: nomeFinal, base64: await blobParaBase64(blob) }

  // 3. Salvar — seletor de pasta nativo ou download direto
  if (window.showSaveFilePicker) {
    const accept = ext === 'pdf'
      ? { 'application/pdf': ['.pdf'] }
      : { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: nomeFinal,
        types: [{ description: ext.toUpperCase(), accept }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
    } catch (err) {
      if (err.name === 'AbortError') return
    }
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = nomeFinal; a.click()
    URL.revokeObjectURL(url)
  }

  // 4. Anexar ao processo automaticamente (R2 + Supabase)
  if (regAberto.value) {
    try {
      const tipo    = ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      const safeName = nomeFinal.replace(/[^a-zA-Z0-9._-]/g, '_')
      const r2Key  = `processos/${regAberto.value}/relatorio/${Date.now()}_${safeName}`
      await r2Upload(r2Key, blob)
      const { data, error } = await supabase.from('documentos').insert({
        processo_id:     regAberto.value,
        empresa:         etapaValor('empresa') || '',
        categoria:       'relatorio',
        categoria_label: 'RELATÓRIO GERAL',
        nome:            nomeFinal,
        tamanho:         blob.size,
        tipo,
        r2_key: r2Key,
      }).select().single()
      if (!error && data) {
        if (!docsAnexados.value.relatorio) docsAnexados.value.relatorio = []
        docsAnexados.value.relatorio.push({ id: data.id, nome: nomeFinal, tamanho: blob.size, tipo, r2_key: r2Key })
      }
    } catch { /* upload falhou silenciosamente — o arquivo local já foi salvo */ }
  }
}

// ── Exportar PDF ──
async function exportarPDF() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const mesLabel = rlMeses[rlMes.value - 1]
  const titulo   = `Relatório Mensal de Intensas — ${mesLabel}/${rlAno.value}`

  // Logo — quadro escuro arredondado para destacar a marca
  const logoData = await rlLogoBase64()
  if (logoData) {
    doc.setFillColor(9, 22, 68)
    doc.roundedRect(12, 7, 32, 27, 3, 3, 'F')
    // logo proporcional (1141x927) centralizada no quadro
    doc.addImage(logoData, 'PNG', 15.5, 9.5, 25, 20.3)
  }

  // Cabeçalho empresa
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 62)
  doc.text('WMS CONSULTORIA CONTÁBIL', logoData ? 50 : 14, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 100, 140)
  doc.text(titulo, logoData ? 50 : 14, 25)

  // Linha separadora
  doc.setDrawColor(90, 184, 46)
  doc.setLineWidth(0.8)
  doc.line(12, 38, W - 12, 38)

  // Resumo de contagens
  const corMap = { CONC: [34,197,94], AND: [59,130,246], PEN: [245,158,11], 'N/I': [148,163,184], SUS: [239,68,68] }
  const stats  = rlStats.value
  const bw     = (W - 24) / stats.length
  stats.forEach((st, i) => {
    const x = 12 + i * bw
    const [r, g, b] = corMap[st.abbr] || [100,100,100]
    doc.setFillColor(r, g, b)
    doc.roundedRect(x + 1, 42, bw - 2, 18, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(255, 255, 255)
    doc.text(String(st.count), x + bw / 2, 51, { align: 'center' })
    doc.setFontSize(7)
    doc.text(st.abbr, x + bw / 2, 56, { align: 'center' })
  })

  // Tabelas por grupo
  let y = 66
  for (const grupo of rlGrupos.value) {
    const [r, g, b] = corMap[grupo.abbr] || [100,100,100]
    autoTable(doc, {
      startY: y,
      head: [[`${grupo.abbr} — ${grupo.label}`, 'Protocolo', 'Data']],
      body: grupo.items.length
        ? grupo.items.map(p => [
            p.empresa || p.razaoSocial || '—',
            p.protocolo && p.protocolo !== '—' ? p.protocolo : 'Sem protocolo',
            p.dataStr || '—'
          ])
        : [['Nenhum processo nesta categoria', '', '']],
      headStyles: { fillColor: [r, g, b], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [30, 40, 60] },
      alternateRowStyles: { fillColor: [245, 247, 252] },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 40 }, 2: { cellWidth: 32 } },
      margin: { left: 12, right: 12 },
      tableLineColor: [220, 225, 235],
      tableLineWidth: 0.2,
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // Rodapé
  doc.setFontSize(7)
  doc.setTextColor(160, 170, 190)
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} · WMS Consultoria Contábil`, W / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })

  doc.save(`Relatorio_${mesLabel}_${rlAno.value}.pdf`)
}

// ── Exportar Excel ──
function exportarExcel() {
  const mesLabel = rlMeses[rlMes.value - 1]
  const wb = XLSX.utils.book_new()

  // Planilha Resumo
  const resumoData = [
    ['WMS CONSULTORIA CONTÁBIL'],
    [`Relatório Mensal de Intensas — ${mesLabel}/${rlAno.value}`],
    [],
    ['Categoria', 'Descrição', 'Quantidade'],
    ...rlGrupos.value.map(g => [g.abbr, g.label, g.items.length]),
    [],
    ['Total', '', rlGrupos.value.reduce((s, g) => s + g.items.length, 0)],
  ]
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData)
  wsResumo['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')

  // Planilha Detalhado
  const detalheRows = [
    ['WMS CONSULTORIA CONTÁBIL'],
    [`Relatório Detalhado — ${mesLabel}/${rlAno.value}`],
    [],
    ['Status', 'Empresa / Razão Social', 'Protocolo', 'Data'],
  ]
  for (const grupo of rlGrupos.value) {
    if (grupo.items.length === 0) continue
    for (const p of grupo.items) {
      detalheRows.push([
        grupo.abbr,
        p.empresa || p.razaoSocial || '—',
        p.protocolo && p.protocolo !== '—' ? p.protocolo : 'Sem protocolo',
        p.dataStr || '—',
      ])
    }
  }
  const wsDetalhe = XLSX.utils.aoa_to_sheet(detalheRows)
  wsDetalhe['!cols'] = [{ wch: 10 }, { wch: 36 }, { wch: 20 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsDetalhe, 'Detalhado')

  XLSX.writeFile(wb, `Relatorio_${mesLabel}_${rlAno.value}.xlsx`)
}

// Progresso real do registro — mesma fonte/prioridade que continuarProcesso usa
// (localStorage > reg.etapas). Garante que o badge na lista bata com a guia aberta,
// em vez de depender do snapshot congelado do histórico (h.pct).
function progressoDoRegistro(r) {
  // Processo aberto: usa o estado vivo das etapas em edição
  if (r.id === regAberto.value) {
    const total = etapas.value.length
    const ok    = etapas.value.filter(e => e.status === 'concluida').length
    return total ? Math.round((ok / total) * 100) : 0
  }
  let ets = null
  const local = JSON.parse(localStorage.getItem(`wms_etapas_${r.id}`) || 'null')
  if (local && local.some(e => e.status || e.valor || e.obs)) ets = local
  else if (r.etapas && r.etapas.length) ets = r.etapas
  if (!ets) return null
  const ok = ets.filter(e => e.status === 'concluida').length
  return Math.round((ok / etapasPadrao.length) * 100)
}

const processosConsultar = computed(() => {
  // Mapeia processoId → entrada mais recente do histórico (já vem order by id desc)
  const latestByProcesso = {}
  for (const h of historico.value) {
    if (h.processoId && !latestByProcesso[h.processoId]) {
      latestByProcesso[h.processoId] = h
    }
  }

  // Processos ativos (não concluídos) — um por registro
  const ativos = registros.value
    .filter(r => !r.concluido)
    .map(r => {
      const h = latestByProcesso[r.id]
      // Prioriza o progresso real das etapas; histórico é só fallback.
      // Limita a 99: processo só vira "concluído" via histórico (relatório gerado),
      // evitando que um registro com todas as etapas marcadas suma da lista de ativos.
      const pe  = progressoDoRegistro(r)
      const pct = Math.min(pe != null ? pe : (h?.pct ?? 0), 99)
      const nome = r.razaoSocial
        || r.empresa?.find?.(d => d.label === 'Razão social')?.valor
        || '—'
      const proto = h?.protocolo
        || (r.id === regAberto.value ? etapaValor('protocolo') : '')
        || '—'
      const local = h?.localizacao
        || (r.id === regAberto.value ? etapaValor('localizacao') : '')
        || '—'
      const data  = h ? `${h.data} ${h.hora}` : (r.dataFormatada ? `Aberto ${r.dataFormatada}` : '—')
      return {
        id:          r.id,
        processoId:  r.id,
        empresa:     nome,
        protocolo:   proto,
        localizacao: local,
        data,
        pct,
        status:      pct === 100 ? 'concluido' : pct > 0 ? 'andamento' : 'nao_iniciado',
      }
    })
    .filter(p => p.pct < 100) // 100% já aparece em concluidos via historico

  // Processos concluídos — do histórico (pct = 100)
  const concluidos = historico.value
    .filter(h => (h.pct ?? 0) === 100)
    .map(h => ({
      id:           h.id,
      processoId:   h.processoId || null,
      empresa:      h.empresa || '—',
      protocolo:    h.protocolo || '—',
      localizacao:  h.localizacao || '—',
      data:         h.data + ' ' + h.hora,
      pct:          100,
      status:       'concluido',
      concluidoPor: h.concluidoPor || '',
    }))

  const todos = [...ativos, ...concluidos]
  const q = consultarBusca.value.trim().toLowerCase()
  if (!q) return todos
  return todos.filter(p =>
    p.empresa.toLowerCase().includes(q) ||
    p.protocolo.toLowerCase().includes(q) ||
    p.localizacao.toLowerCase().includes(q)
  )
})

function excluirProcessoConsultar(p) {
  $q.dialog({
    title: 'Excluir processo?',
    message: `"${p.empresa || 'Sem nome'}" será removido permanentemente.`,
    cancel: { label: 'Cancelar', flat: true, color: 'white' },
    ok:     { label: 'Excluir',  flat: true, color: 'negative' },
    persistent: true,
    dark: true,
  }).onOk(async () => {
    const pid = p.processoId ?? p.id
    // Converte para string para evitar mismatch number vs string (bigint do Supabase)
    const pidStr = String(pid)

    if (p.processoId != null) {
      historico.value = historico.value.filter(h => String(h.processoId) !== pidStr)
      await supabase.from('historico').delete().eq('processo_id', pid)
    } else {
      // sem processoId: remove apenas esta entrada do histórico pelo id direto
      historico.value = historico.value.filter(h => String(h.id) !== pidStr)
      await supabase.from('historico').delete().eq('id', pid)
    }

    registros.value = registros.value.filter(r => String(r.id) !== pidStr)
    await supabase.from('processos').delete().eq('id', pid)
    if (String(regAberto.value) === pidStr) regAberto.value = null
    $q.notify({ icon: 'delete', color: 'negative', message: 'Processo excluído.', position: 'top', timeout: 2500 })
  })
}

function continuarProcesso(p) {
  ctrlSessao3.value = null
  ctrlSessao1.value = 'Constituição'
  if (!p.processoId || p.processoId === regAberto.value) return

  // Persiste etapas do processo atual antes de trocar
  if (regAberto.value) {
    const dataAtual = JSON.stringify(
      etapas.value.map(e => ({ key: e.key, status: e.status, obs: e.obs, valor: e.valor, concluidaEm: e.concluidaEm || '' }))
    )
    localStorage.setItem(`wms_etapas_${regAberto.value}`, dataAtual)
  }

  const reg = registros.value.find(r => r.id === p.processoId)
  if (!reg) return

  regAberto.value = reg.id

  // Limpa Resumo e carrega dados do processo selecionado
  docsEmpresa.value.forEach(d => { d.valor = '' })
  docsSocio.value.forEach(d => { d.valor = '' })
  taxas.value.forEach(t => { t.valor = '' })
  reg.empresa?.forEach((s, i) => { if (docsEmpresa.value[i] && s.valor) docsEmpresa.value[i].valor = s.valor })
  reg.socio?.forEach((s, i)   => { if (docsSocio.value[i]   && s.valor) docsSocio.value[i].valor   = s.valor })
  reg.taxas?.forEach((s, i)   => { if (taxas.value[i]       && s.valor) taxas.value[i].valor         = s.valor })
  salvarResumo()

  // Carrega etapas: localStorage primeiro, fallback para etapas salvas no banco
  const etapasLocal = carregarEtapas(reg.id, false)
  const temDadosLocal = etapasLocal.some(e => e.status || e.valor || e.obs)
  if (temDadosLocal) {
    etapas.value = etapasLocal
  } else if (reg.etapas && reg.etapas.length) {
    etapas.value = etapasPadrao.map(e => {
      const salva = reg.etapas.find(s => s.key === e.key)
      return salva ? { ...e, ...salva } : { ...e, status: '', obs: '', valor: '', concluidaEm: '', statusItens: {}, subStatus: e.subItens ? Object.fromEntries(e.subItens.map(si => [si.key, { status: '', protocolo: '' }])) : {} }
    })
  } else {
    etapas.value = etapasLocal
  }
}

function abrirAnexo(catKey) {
  catAnexoAtiva.value = catKey
  const el = Array.isArray(inputAnexoRef.value) ? inputAnexoRef.value[0] : inputAnexoRef.value
  el?.click()
}
async function onAnexoSelecionado(e) {
  const files = Array.from(e.target.files)
  if (!files.length) return

  // Se não houver processo aberto, tenta encontrar pelo nome da empresa
  if (!regAberto.value) {
    const empAtual = etapaValor('empresa')
    const encontrado = empAtual
      ? registros.value.find(r => r.razaoSocial === empAtual)
      : null
    if (encontrado) {
      regAberto.value = encontrado.id
    } else {
      $q.notify({ icon: 'warning', color: 'warning', message: 'Crie o processo no Gestão de Prazos antes de anexar documentos.', position: 'top', timeout: 4000 })
      e.target.value = ''
      return
    }
  }

  uploadAndo.value = true
  const cat        = catAnexoAtiva.value
  const catLabel   = categoriasDocs.find(c => c.key === cat)?.label || cat
  const isOutros   = cat === 'outros'
  const customBase = isOutros ? outroNomeConstTemp.value.trim() : ''
  for (const file of files) {
    // OUTROS: usa o nome digitado pelo usuário, preservando a extensão do arquivo
    let nomeFinal = file.name
    if (isOutros && customBase) {
      const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : ''
      nomeFinal = customBase.toLowerCase().endsWith(ext.toLowerCase()) ? customBase : customBase + ext
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `processos/${regAberto.value}/${cat}/${Date.now()}_${safeName}`
    try {
      await r2Upload(key, file)
      const { data, error } = await supabase.from('documentos').insert({
        processo_id:     regAberto.value,
        empresa:         etapaValor('empresa') || '',
        categoria:       cat,
        categoria_label: catLabel,
        nome:            nomeFinal,
        tamanho:         file.size,
        tipo:            file.type || 'application/octet-stream',
        r2_key:          key,
      }).select().single()
      if (error) throw error
      if (!docsAnexados.value[cat]) docsAnexados.value[cat] = []
      docsAnexados.value[cat].push({ id: data.id, nome: nomeFinal, tamanho: file.size, tipo: file.type, r2_key: key })
    } catch (err) {
      $q.notify({ icon: 'error', color: 'negative', message: `Erro ao enviar ${file.name}: ${err.message}`, position: 'top', timeout: 5000 })
    }
  }
  if (isOutros) outroNomeConstTemp.value = ''
  uploadAndo.value = false
  e.target.value = ''
}
async function removerAnexo(catKey, id) {
  const arq = docsAnexados.value[catKey]?.find(a => a.id === id)
  if (arq?.r2_key) await r2Delete(arq.r2_key)
  await supabase.from('documentos').delete().eq('id', id)
  docsAnexados.value[catKey] = (docsAnexados.value[catKey] || []).filter(a => a.id !== id)
}

// ── SUB-DOCS (Ativar no Estado) ──
const inputSubAnexoRef = ref(null)
const subKeyAtivo      = ref('')
const subDocs          = ref(JSON.parse(localStorage.getItem('wms_estado_subdocs') || '{}'))

function abrirSubAnexo(subKey) {
  subKeyAtivo.value = subKey
  const el = Array.isArray(inputSubAnexoRef.value) ? inputSubAnexoRef.value[0] : inputSubAnexoRef.value
  el?.click()
}
function onSubAnexoSelecionado(e) {
  const files = Array.from(e.target.files)
  if (!files.length) return
  const key = subKeyAtivo.value
  if (!subDocs.value[key]) subDocs.value[key] = []
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = ev => {
      subDocs.value[key].push({ id: Date.now() + Math.random(), nome: file.name, tamanho: file.size, tipo: file.type, dataUrl: ev.target.result })
      localStorage.setItem('wms_estado_subdocs', JSON.stringify(subDocs.value))
    }
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}
function removerSubDoc(subKey, id) {
  subDocs.value[subKey] = (subDocs.value[subKey] || []).filter(a => a.id !== id)
  localStorage.setItem('wms_estado_subdocs', JSON.stringify(subDocs.value))
}
function setSubStatus(etapa, subKey, status) {
  if (!etapa.subStatus[subKey]) etapa.subStatus[subKey] = { status: '', protocolo: '' }
  etapa.subStatus[subKey].status = etapa.subStatus[subKey].status === status ? '' : status
  salvarEtapas()
}
function abrirArquivo(arq) {
  const a = document.createElement('a')
  a.href = arq.dataUrl
  a.download = arq.nome
  a.click()
}
function formatarTamanho(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}
function iconeTipoArquivo(tipo) {
  if (!tipo) return 'insert_drive_file'
  if (tipo.includes('pdf')) return 'picture_as_pdf'
  if (tipo.includes('image')) return 'image'
  if (tipo.includes('word') || tipo.includes('document')) return 'description'
  if (tipo.includes('sheet') || tipo.includes('excel')) return 'table_chart'
  return 'insert_drive_file'
}

function filtrarSugestoes(val) {
  mostrarSugestoes.value = true
  const q = (val || '').trim().toLowerCase()
  const nomes = registros.value
    .map(r => r.razaoSocial)
    .filter(n => n && (!q || n.toLowerCase().includes(q)))
  sugestoesFiltradas.value = [...new Set(nomes)].slice(0, 8)
}
function fecharSugestoes() {
  setTimeout(() => { mostrarSugestoes.value = false }, 150)
}
function selecionarSugestao(etapa, nome) {
  etapa.valor = nome
  mostrarSugestoes.value = false
  salvarEtapas()
}

let _syncEtapasTimer = null
function salvarEtapas() {
  const etapasData = etapas.value.map(e => ({
    key: e.key, status: e.status, obs: e.obs, valor: e.valor, concluidaEm: e.concluidaEm || '',
    statusItens: e.statusItens || {}, subStatus: e.subStatus || {},
  }))
  const data = JSON.stringify(etapasData)
  if (regAberto.value) localStorage.setItem(`wms_etapas_${regAberto.value}`, data)
  localStorage.setItem('wms_constituicao', data)

  // Sincroniza com Supabase após 1,5s de inatividade
  if (regAberto.value) {
    clearTimeout(_syncEtapasTimer)
    _syncEtapasTimer = setTimeout(() => {
      const reg = registros.value.find(r => r.id === regAberto.value)
      if (reg) {
        reg.etapas = etapasData
        supabase.from('processos').update({ etapas: etapasData }).eq('id', regAberto.value)
      }
    }, 1500)
  }
}

function setStatusEtapa(etapa, status) {
  const novoStatus = etapa.status === status ? '' : status
  etapa.status = novoStatus
  etapa.concluidaEm = novoStatus === 'concluida'
    ? new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''
  salvarEtapas()
}
function setStatusItemConst(etapa, item, status) {
  etapa.statusItens = { ...etapa.statusItens, [item]: etapa.statusItens[item] === status ? '' : status }
  salvarEtapas()
}

const etapasConcluidas = computed(() => etapas.value.filter(e => e.status === 'concluida').length)
const progressoEtapas  = computed(() => Math.round((etapasConcluidas.value / etapas.value.length) * 100))
const dialogConfig = ref(false)
const configAPI = ref({
  provider: 'zapi',
  zInstanceId: '', zToken: '', zClientToken: '',
  url: '', token: '', evolutionInstance: 'wms', telefone: '',
  emailUrl: '', emailKey: '', emailFrom: '',
  responsavel: '',
})
const filtroUrgencia = ref('todos')
const filtroTempo    = ref('todos')

const ordemPrazo = { urgente: 0, priorizar: 1, normal: 2 }

const registrosAtivos    = computed(() => registros.value.filter(r => !r.concluido))
const registrosConcluidos = computed(() => registros.value.filter(r => r.concluido))
const abaPrazos = ref('ativos') // 'ativos' | 'concluidos'

const registrosFiltrados = computed(() => {
  let lista = registrosAtivos.value.map(r => ({ ...r, _dias: diasRestantes(r) }))

  if (filtroUrgencia.value !== 'todos')
    lista = lista.filter(r => (r.prazo || 'normal') === filtroUrgencia.value)

  if (filtroTempo.value === 'vencidos')
    lista = lista.filter(r => r._dias < 0)
  else if (filtroTempo.value === 'hoje')
    lista = lista.filter(r => r._dias === 0)
  else if (filtroTempo.value === 'proximos3')
    lista = lista.filter(r => r._dias >= 0 && r._dias <= 3)
  else if (filtroTempo.value === 'proximos7')
    lista = lista.filter(r => r._dias >= 0 && r._dias <= 7)

  lista.sort((a, b) => {
    const pA = ordemPrazo[a.prazo || 'normal']
    const pB = ordemPrazo[b.prazo || 'normal']
    return pA !== pB ? pA - pB : a._dias - b._dias
  })
  return lista
})

const statsVencidos   = computed(() => registrosAtivos.value.filter(r => diasRestantes(r) < 0).length)
const statsUrgentes   = computed(() => registrosAtivos.value.filter(r => (r.prazo || 'normal') === 'urgente').length)
const statsProximos3  = computed(() => registrosAtivos.value.filter(r => { const d = diasRestantes(r); return d >= 0 && d <= 3 }).length)
const statsNormal     = computed(() => registrosAtivos.value.filter(r => (r.prazo || 'normal') === 'normal').length)
const statsPriorizar  = computed(() => registrosAtivos.value.filter(r => r.prazo === 'priorizar').length)
const registrosRecentes = computed(() => registros.value.slice(0, 5).map(r => ({ ...r, _dias: diasRestantes(r) })))

// ── Dashboard ──
const dbEmDia = computed(() => registrosAtivos.value.filter(r => diasRestantes(r) >= 0).length)
const dbAproveitamento = computed(() =>
  registrosAtivos.value.length ? Math.round(dbEmDia.value / registrosAtivos.value.length * 100) : 100
)
const dbVencendo7 = computed(() =>
  registrosAtivos.value.filter(r => { const d = diasRestantes(r); return d >= 0 && d <= 7 }).length
)
// SVG ring: circumference 2π×15 ≈ 94.25
const dbRingDash = computed(() => {
  const filled = (dbAproveitamento.value / 100) * 94.25
  return `${filled} 94.25`
})
// SVG semicircle gauge: π×58 ≈ 182.2
const dbGaugeDash = computed(() => {
  const filled = (dbAproveitamento.value / 100) * 182.2
  return `${filled} 182.2`
})
const dbProcessosCriticos = computed(() => {
  const lista = registrosAtivos.value
    .map(r => ({ ...r, _dias: diasRestantes(r) }))
    .filter(r => r._dias < 0 || r.prazo === 'urgente' || r.prazo === 'priorizar')
  lista.sort((a, b) => {
    if (a._dias < 0 && b._dias >= 0) return -1
    if (a._dias >= 0 && b._dias < 0) return 1
    if (a._dias < 0 && b._dias < 0) return a._dias - b._dias
    const nivelA = a.prazo === 'urgente' ? 0 : 1
    const nivelB = b.prazo === 'urgente' ? 0 : 1
    if (nivelA !== nivelB) return nivelA - nivelB
    return a._dias - b._dias
  })
  return lista
})
const dbTimeline = computed(() => {
  const buckets = [
    { label: 'Hoje',   min: 0,  max: 0,  cor: '#ef4444', count: 0 },
    { label: 'Amanhã', min: 1,  max: 1,  cor: '#ef4444', count: 0 },
    { label: 'Em 3d',  min: 2,  max: 3,  cor: '#f59e0b', count: 0 },
    { label: 'Em 5d',  min: 4,  max: 5,  cor: '#f59e0b', count: 0 },
    { label: 'Em 7d',  min: 6,  max: 7,  cor: '#fcd34d', count: 0 },
    { label: 'Em 10d', min: 8,  max: 10, cor: '#5ab82e', count: 0 },
    { label: 'Em 14d', min: 11, max: 14, cor: '#5ab82e', count: 0 },
  ]
  registrosAtivos.value.forEach(r => {
    const d = diasRestantes(r)
    for (const b of buckets) {
      if (d >= b.min && d <= b.max) { b.count++; break }
    }
  })
  return buckets
})
const dbTimelineMax = computed(() => Math.max(1, ...dbTimeline.value.map(b => b.count)))
const dbPendencias  = computed(() => registros.value.filter(r => !r.razaoSocial))

// ── Dashboard: classificação por estágio (não iniciado / andamento / concluído) ──
const dbProcessos = computed(() => {
  const latestByProcesso = {}
  for (const h of historico.value) {
    if (h.processoId && !latestByProcesso[h.processoId]) latestByProcesso[h.processoId] = h
  }
  return registros.value
    .filter(r => !r.concluido)
    .map(r => {
      const h = latestByProcesso[r.id]
      let pct = h?.pct ?? 0
      if (!h && r.id === regAberto.value) {
        const total = etapas.value.length
        const ok    = etapas.value.filter(e => e.status === 'concluida').length
        pct = total ? Math.round((ok / total) * 100) : 0
      }
      const nome = r.razaoSocial
        || r.empresa?.find?.(d => d.label === 'Razão social')?.valor
        || 'Sem razão social'
      return {
        id:    r.id,
        nome,
        pct,
        status: pct >= 100 ? 'concluido' : pct > 0 ? 'andamento' : 'nao_iniciado',
        dias:  diasRestantes(r),
        venc:  r.dataVencFormatada || '—',
        prazo: r.prazo || 'normal',
        local: (r.id === regAberto.value ? etapaValor('localizacao') : '') || h?.localizacao || '',
      }
    })
})
const dbNaoIniciados = computed(() => dbProcessos.value.filter(p => p.status === 'nao_iniciado'))
const dbEmAndamento  = computed(() =>
  dbProcessos.value.filter(p => p.status === 'andamento').sort((a, b) => b.pct - a.pct)
)
const dbConcluidosCount = computed(() =>
  registros.value.filter(r => r.concluido).length +
  dbProcessos.value.filter(p => p.status === 'concluido').length
)
const dbProgressoMedio = computed(() => {
  const arr = dbEmAndamento.value
  if (!arr.length) return 0
  return Math.round(arr.reduce((s, p) => s + p.pct, 0) / arr.length)
})
const dbTotalEstagios = computed(() =>
  dbNaoIniciados.value.length + dbEmAndamento.value.length + dbConcluidosCount.value
)
function irParaConsultar() {
  activeNav.value = 'Controle'
  ctrlSessao1.value = null
  ctrlSessao2.value = null
  ctrlSessao3.value = 'Consultar'
}

const steps = [
  { key: 'empresa', label: 'Empresa', icon: 'business' },
  { key: 'socio',   label: 'Sócio',   icon: 'person'   },
]

const docsEmpresaOk  = computed(() => docsEmpresa.value.filter(d => d.valor).length)
const docsSocioOk    = computed(() => docsSocio.value.filter(d => d.valor).length)

function mascarar(v, tipo) {
  if (!v) return ''
  switch (tipo) {
    case 'cnpj': {
      const d = v.replace(/\D/g, '').slice(0, 14)
      return d
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    case 'cpf': {
      const d = v.replace(/\D/g, '').slice(0, 11)
      return d
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    case 'telefone': {
      const d = v.replace(/\D/g, '').slice(0, 11)
      if (d.length <= 10)
        return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2')
      return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2')
    }
    case 'numero':
      return v.replace(/\D/g, '')
    case 'moeda': {
      const raw = v.replace(/[^\d,]/g, '')
      const parts = raw.split(',')
      const inteiro = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      return parts.length > 1 ? inteiro + ',' + parts[1].slice(0, 2) : inteiro
    }
    case 'rg':
      return v.replace(/[^\dA-Za-z-]/g, '').toUpperCase()
    default:
      return v
  }
}

function campoValido(doc) {
  const v = doc.valor
  if (!v) return false
  switch (doc.tipo) {
    case 'cnpj':     return v.replace(/\D/g, '').length === 14
    case 'cpf':      return v.replace(/\D/g, '').length === 11
    case 'telefone': return v.replace(/\D/g, '').length >= 10
    case 'email':    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    default:         return true
  }
}

const PLACEHOLDER_CAMPO = {
  cnpj:     '00.000.000/0000-00',
  cpf:      '000.000.000-00',
  telefone: '(00) 00000-0000',
  email:    'nome@email.com',
  moeda:    '1.500,00',
  numero:   'Apenas números',
  rg:       'Ex: 0000000',
}
function placeholderCampo(doc) {
  return PLACEHOLDER_CAMPO[doc.tipo] || 'Digite aqui...'
}
function inputmodeCampo(doc) {
  return ['cnpj','cpf','telefone','numero','moeda','rg'].includes(doc.tipo) ? 'numeric' : 'text'
}

function onInputDoc(doc, event) {
  const masked = mascarar(event.target.value, doc.tipo)
  doc.valor = masked
  // Keeps cursor-position stable (prevents DOM drift on masked fields)
  if (event.target.value !== masked) event.target.value = masked
}

const totalCampos = computed(() =>
  docsEmpresa.value.length + docsSocio.value.length + taxas.value.length
)
const totalPreenchido = computed(() =>
  [...docsEmpresa.value, ...docsSocio.value, ...taxas.value].filter(d => d.valor).length
)
const progressPercent = computed(() =>
  totalCampos.value ? Math.round((totalPreenchido.value / totalCampos.value) * 100) : 0
)

const registros = ref([])

// ── Resumo ──
const docsEmpresa = ref([
  { label: 'Razão social',        valor: '', tipo: 'texto'   },
  { label: 'CNPJ',                valor: '', tipo: 'cnpj'    },
  { label: 'Nome Fantasia',       valor: '', tipo: 'texto'   },
  { label: 'Capital Social',      valor: '', tipo: 'moeda'   },
  { label: 'Inscrição Estadual',  valor: '', tipo: 'numero'  },
  { label: 'Inscrição Municipal', valor: '', tipo: 'numero'  },
  { label: 'NIRE',                valor: '', tipo: 'numero'  },
  { label: 'Endereço',            valor: '', tipo: 'texto'   },
  { label: 'Telefone',            valor: '', tipo: 'telefone'},
  { label: 'E-Mail',              valor: '', tipo: 'email'   },
])

const docsSocio = ref([
  { label: 'Nome do Sócio',                        valor: '', tipo: 'texto'   },
  { label: 'CPF',                                   valor: '', tipo: 'cpf'    },
  { label: 'RG ou CNH',                             valor: '', tipo: 'rg'     },
  { label: 'Comprovante de Residência do Titular',  valor: '', tipo: 'texto'  },
  { label: 'Senha do Gov.Br (Nível Ouro)',          valor: '', tipo: 'texto'  },
  { label: 'Telefone',                              valor: '', tipo: 'telefone'},
  { label: 'E-Mail',                                valor: '', tipo: 'email'  },
  { label: 'Endereço pessoa física',                valor: '', tipo: 'texto'  },
])

function copiarTexto(texto, caption = '') {
  navigator.clipboard.writeText(texto).then(() => {
    $q.notify({
      icon: 'check_circle',
      color: 'positive',
      message: 'Copiado!',
      caption: caption || texto,
      position: 'top',
      timeout: 1800,
    })
  }).catch(() => {
    $q.notify({ type: 'negative', message: 'Não foi possível copiar.', position: 'top' })
  })
}

function copiarSecaoEmpresa() {
  const linhas = docsEmpresa.value
    .map(d => `▲ ${d.label}${d.valor ? ': ' + d.valor : ''}`)
    .join('\n')
  const texto = `🏢 *EMPRESA* — Fotos legíveis obrigatórias\n${linhas}`
  copiarTexto(texto, 'Seção Empresa')
}

function copiarSecaoSocio() {
  const linhas = docsSocio.value
    .map(d => `▲ ${d.label}${d.valor ? ': ' + d.valor : ''}`)
    .join('\n')
  const texto = `👤 *SÓCIO*\n${linhas}`
  copiarTexto(texto, 'Seção Sócio')
}

function copiarTaxa(taxa) {
  const texto = `◆ ${taxa.label}: R$ ${taxa.valor || 'A definir'}`
  copiarTexto(texto, taxa.label)
}

function montarMensagem(prazo = 'normal') {
  const linhaEmpresa = docsEmpresa.value
    .map(d => `▲ ${d.label}${d.valor ? ': ' + d.valor : ''}`)
    .join('\n')
  const linhaSocio = docsSocio.value
    .map(d => `▲ ${d.label}${d.valor ? ': ' + d.valor : ''}`)
    .join('\n')
  const linhaTaxas = taxas.value
    .map(t => `◆ ${t.label}: R$ ${t.valor || 'A definir'}`)
    .join('\n')
  const emoji = prazoEmoji(prazo)
  const label = prazoLabel(prazo).toUpperCase()
  return `${emoji} *PRAZO: ${label}*\n\n📋 *RESUMO GERAL*\n*RELAÇÃO DE DOCUMENTOS PARA ABERTURA DA EMPRESA LTDA UNIPESSOAL*\n\n🏢 *EMPRESA* — _Fotos legíveis obrigatórias_\n${linhaEmpresa}\n\n👤 *SÓCIO*\n${linhaSocio}\n\n💰 *TAXAS*\n${linhaTaxas}\n\n_Enviado via WMS Consultoria_`
}

// Números fixos que recebem alertas automáticos de prazo
const NUMEROS_ALERTA = ['5599984491810', '559882624491', '559888435550', '559885928114']

// Envia para um número específico (sem depender do configAPI.telefone)
async function enviarWhatsAppPara(numero, texto) {
  const cfg = configAPI.value
  if (!numero) return false
  try {
    if (cfg.provider === 'zapi') {
      if (!cfg.zInstanceId || !cfg.zToken) return false
      const res = await fetch(
        `https://api.z-api.io/instances/${cfg.zInstanceId}/token/${cfg.zToken}/send-text`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Client-Token': cfg.zClientToken || '' },
          body: JSON.stringify({ phone: numero, message: texto }),
        }
      )
      return res.ok
    } else {
      const { url, token, evolutionInstance } = cfg
      if (!url || !token) return false
      const instance = evolutionInstance || 'wms'
      const res = await fetch(`${url.replace(/\/$/, '')}/message/sendText/${instance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': token },
        body: JSON.stringify({ number: numero, text: texto }),
      })
      return res.ok
    }
  } catch { return false }
}

async function enviarWhatsApp(texto) {
  const cfg = configAPI.value
  const pronto = cfg.provider === 'zapi'
    ? (cfg.zInstanceId && cfg.zToken && cfg.telefone)
    : (cfg.url && cfg.token && cfg.telefone)
  if (!pronto) { dialogConfig.value = true; return false }
  return enviarWhatsAppPara(cfg.telefone, texto)
}

// ── Alertas automáticos de prazo ──
const HORARIOS_ALERTA = [{ h: 7, m: 50 }]
let alertaInterval = null

function agendarProximoAlerta() {
  const agora = new Date()
  const hoje  = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  let menorDiff = null
  let proximoSlot = HORARIOS_ALERTA[0]
  for (const slot of HORARIOS_ALERTA) {
    const alvo = new Date(hoje.getTime() + slot.h * 3600000 + slot.m * 60000)
    const diff = alvo - agora
    if (diff > 0 && (menorDiff === null || diff < menorDiff)) {
      menorDiff   = diff
      proximoSlot = slot
    }
  }
  // Se já passou de todos os horários de hoje, agenda para o primeiro de amanhã
  if (menorDiff === null) {
    const amanha = new Date(hoje.getTime() + 86400000)
    proximoSlot = HORARIOS_ALERTA[0]
    menorDiff   = new Date(amanha.getTime() + proximoSlot.h * 3600000 + proximoSlot.m * 60000) - agora
  }
  alertaInterval = setTimeout(async () => {
    await alertarPrazosWhatsApp(proximoSlot)
    agendarProximoAlerta()
  }, menorDiff)
}

function montarMensagemConsolidada(processos, hist = []) {
  const hoje = new Date()
  const hojeStr = hoje.toLocaleDateString('pt-BR')
  const vencidos  = processos.filter(r => diasRestantes(r) < 0)
  const urgentes  = processos.filter(r => { const d = diasRestantes(r); return d >= 0 && ((r.prazo || 'normal') === 'urgente' || d === 0) })
  const priorizar = processos.filter(r => { const d = diasRestantes(r); return d > 0 && r.prazo !== 'urgente' && (r.prazo === 'priorizar' || d <= 3) })

  // Concluídos nos últimos 7 dias
  const seteAtras = new Date(hoje)
  seteAtras.setDate(seteAtras.getDate() - 7)
  const recentes = hist.filter(h => {
    if (!h.data) return false
    const [d, m, y] = h.data.split('/').map(Number)
    return new Date(y, m - 1, d) >= seteAtras
  })

  let msg = `⚠️ *WMS Consultoria — Resumo de Prazos*\n📅 ${hojeStr}\n`

  if (vencidos.length) {
    msg += `\n🔴 *VENCIDOS (${vencidos.length})*\n`
    vencidos.forEach(r => {
      const d = Math.abs(diasRestantes(r))
      msg += `• *${r.razaoSocial || 'Sem nome'}*`
      if (r.dataVencFormatada) msg += ` — prazo encerrou em ${r.dataVencFormatada}`
      msg += ` (${d} dia${d !== 1 ? 's' : ''} atrás)\n`
    })
  }

  if (urgentes.length) {
    msg += `\n🚨 *URGENTE (${urgentes.length})*\n`
    urgentes.forEach(r => {
      const d = diasRestantes(r)
      msg += `• *${r.razaoSocial || 'Sem nome'}*`
      if (r.dataVencFormatada) msg += ` — vence em ${r.dataVencFormatada}`
      msg += ` (${d === 0 ? 'hoje' : `${d} dia${d !== 1 ? 's' : ''}`})\n`
    })
  }

  if (priorizar.length) {
    msg += `\n🟡 *PRIORIZAR (${priorizar.length})*\n`
    priorizar.forEach(r => {
      const d = diasRestantes(r)
      msg += `• *${r.razaoSocial || 'Sem nome'}*`
      if (r.dataVencFormatada) msg += ` — vence em ${r.dataVencFormatada}`
      msg += ` (${d} dia${d !== 1 ? 's' : ''})\n`
    })
  }

  if (recentes.length) {
    msg += `\n✅ *CONCLUÍDOS RECENTES*\n`
    recentes.forEach(h => {
      msg += `• *${h.empresa || '—'}*`
      if (h.protocolo && h.protocolo !== '—') msg += ` · Protocolo: ${h.protocolo}`
      if (h.localizacao && h.localizacao !== '—') msg += ` · ${h.localizacao}`
      if (h.pct != null) msg += ` (${h.pct}%)`
      msg += ` — ${h.data}\n`
    })
  }

  msg += `\n_WMS Consultoria Contábil_`
  return msg
}

async function alertarPrazosWhatsApp(slot = HORARIOS_ALERTA[0]) {
  const cfg = configAPI.value
  const pronto = cfg.provider === 'zapi' ? (cfg.zInstanceId && cfg.zToken) : (cfg.url && cfg.token)
  if (!pronto) return

  const hoje  = new Date().toDateString()
  const slotId = `${String(slot.h).padStart(2,'0')}h${String(slot.m).padStart(2,'0')}`

  // Lock por slot/dia — impede envio duplicado de múltiplas abas ou retries
  const lockKey = `wms_alerta_lock_${hoje}_${slotId}`
  if (localStorage.getItem(lockKey)) return
  localStorage.setItem(lockKey, '1')

  const chave = `wms_alertas_${hoje}_${slotId}`
  const jaAlertados = new Set(JSON.parse(localStorage.getItem(chave) || '[]'))

  const novos = registrosAtivos.value.filter(r => {
    if (jaAlertados.has(String(r.id))) return false
    const d = diasRestantes(r)
    return d < 0 || d <= 3 || (r.prazo || 'normal') === 'urgente'
  })

  if (!novos.length) return

  const msg = montarMensagemConsolidada(novos, historico.value)
  await Promise.all(NUMEROS_ALERTA.map(num => enviarWhatsAppPara(num, msg)))
  novos.forEach(r => jaAlertados.add(String(r.id)))
  localStorage.setItem(chave, JSON.stringify([...jaAlertados]))
}

async function testarAlertasAgora() {
  const cfg = configAPI.value
  const pronto = cfg.provider === 'zapi' ? (cfg.zInstanceId && cfg.zToken) : (cfg.url && cfg.token)
  if (!pronto) {
    dialogConfig.value = true
    $q.notify({ icon: 'warning', color: 'warning', message: 'Configure a API antes de testar.', position: 'top', timeout: 3000 })
    return
  }

  const processos = registrosAtivos.value.filter(r => {
    const d = diasRestantes(r)
    return d < 0 || d <= 3 || (r.prazo || 'normal') === 'urgente'
  })

  if (!processos.length) {
    $q.notify({ icon: 'info', color: 'info', message: 'Nenhum processo urgente ou vencido encontrado.', position: 'top', timeout: 3500 })
    return
  }

  $q.notify({ icon: 'hourglass_empty', color: 'primary', message: 'Enviando resumo...', position: 'top', timeout: 2000 })

  // Sincroniza dados com o servidor antes de testar
  await sincronizarServidor()

  const msg = montarMensagemConsolidada(processos, historico.value)
  const results = await Promise.all(NUMEROS_ALERTA.map(num => enviarWhatsAppPara(num, msg)))

  if (results.some(ok => ok)) {
    $q.notify({ icon: 'check_circle', color: 'positive', message: `Resumo enviado para ${NUMEROS_ALERTA.length} número(s)!`, position: 'top', timeout: 4000 })
  } else {
    $q.notify({ icon: 'error', color: 'negative', message: 'Falha ao enviar. Verifique as credenciais da API.', position: 'top', timeout: 4000 })
  }
}

async function sincronizarServidor() {
  if (import.meta.env.DEV) return
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registros: registros.value, config: configAPI.value }),
    })
  } catch { /* silencioso */ }
}

async function salvarConfig() {
  await supabase.from('configuracoes').upsert(configToDb(configAPI.value))
  dialogConfig.value = false
  $q.notify({ icon: 'check', color: 'positive', message: 'Configuração salva!', position: 'top', timeout: 2000 })
}

async function salvarRegistro(prazo = 'normal') {
  const agora = new Date()
  const vencimento = new Date(agora)
  vencimento.setDate(vencimento.getDate() + 10)

  const reg = {
    id: Date.now(),
    prazo,
    dataISO: agora.toISOString(),
    dataVencimento: vencimento.toISOString(),
    dataFormatada: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(agora),
    dataVencFormatada: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(vencimento),
    razaoSocial: docsEmpresa.value.find(d => d.label === 'Razão social')?.valor || '',
    empresa: docsEmpresa.value.map(d => ({ label: d.label, valor: d.valor })),
    socio:   docsSocio.value.map(d => ({ label: d.label, valor: d.valor })),
    taxas:   taxas.value.map(t => ({ label: t.label, valor: t.valor })),
  }
  registros.value.unshift(reg)
  regAberto.value = reg.id

  const { error } = await supabase.from('processos').insert(processoToDb(reg))
  if (error) {
    $q.notify({
      icon: 'error',
      color: 'negative',
      message: 'Erro ao salvar no banco: ' + error.message,
      position: 'top',
      timeout: 6000,
    })
  }
}

function diasRestantes(reg) {
  if (!reg.dataVencimento) return 10
  const venc = new Date(reg.dataVencimento)
  const hoje = new Date()
  venc.setHours(0,0,0,0); hoje.setHours(0,0,0,0)
  return Math.round((venc - hoje) / 86400000)
}

function progressoDias(reg) {
  const dias = diasRestantes(reg)
  return Math.max(0, Math.min(100, ((10 - dias) / 10) * 100))
}

function corTempo(dias) {
  if (dias < 0)  return '#ef4444'
  if (dias <= 3) return '#ef4444'
  if (dias <= 7) return '#f59e0b'
  return '#22c55e'
}

// ══ NOTIFICAÇÕES ══
const notifPermissao = ref(typeof Notification !== 'undefined' ? Notification.permission : 'default')
let swReg = null
let notifInterval = null

const totalAlertas = computed(() =>
  registros.value.filter(r => {
    const d = diasRestantes(r)
    return (r.prazo || 'normal') === 'urgente' || d < 0 || d <= 3
  }).length
)

async function registrarSW() {
  if (!('serviceWorker' in navigator)) return
  try {
    swReg = await navigator.serviceWorker.register('/sw.js')
  } catch {}
}

async function solicitarPermissaoNotif() {
  if (!('Notification' in window)) return
  const perm = await Notification.requestPermission()
  notifPermissao.value = perm
  if (perm === 'granted') dispararNotificacoes()
}

function dispararNotificacoes() {
  if (notifPermissao.value !== 'granted' || !swReg?.active) return
  swReg.active.postMessage({ type: 'CHECK_PRAZOS', registros: JSON.parse(JSON.stringify(registros.value)) })
}

// ── GERADOR DE RELATÓRIO ──
const gerandoRelatorio   = ref(false)
const historico          = ref([])
const historicoExpandido = ref(false)
const dialogComplementar  = ref(false)
const dialogNovoProcesso  = ref(false)
const dialogDocs           = ref(false)
const docsDialogEmpresa    = ref('')

// ── E-mail ──
const EMAIL_DESTINATARIOS = [
  { nome: 'WMS GERENCIA',                       email: 'gerencia@wmsconsultoria.com.br' },
  { nome: 'WMS CONSULTORIA CONTABIL - FISCAL',  email: 'fiscal@wmsconsultoria.com.br'   },
  { nome: 'WMS CONSULTORIA CONTABIL - CONTABIL',email: 'contabil@wmsconsultoria.com.br' },
  { nome: 'WMS CONSULTORIA CONTABIL - DP',      email: 'pessoal@wmsconsultoria.com.br'  },
]
const dialogEmail        = ref(false)
const emailDialogEmpresa = ref('')
const emailDialogProcessoId = ref(null)
const emailModo          = ref('agora')      // 'agora' | 'agendar'
const emailPara          = ref('')
const emailAssunto       = ref('')
const emailMensagem      = ref('')
const emailData          = ref('')
const emailHora          = ref('')
const emailEnviando      = ref(false)
const emailsAgendados    = ref(JSON.parse(localStorage.getItem('wms_emails_agendados') || '[]'))
const emailHoje          = computed(() => new Date().toISOString().slice(0, 10))

const emailsAgendadosDoProcesso = computed(() =>
  emailsAgendados.value
    .filter(ag => ag.processoId === emailDialogProcessoId.value)
    .map(ag => ({
      ...ag,
      dataHoraFormatada: new Date(ag.dataHoraISO).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
    }))
)

function copiarInfoProcesso(p) {
  const partes = [p.empresa, p.protocolo && p.protocolo !== '—' ? `#${p.protocolo}` : ''].filter(Boolean)
  navigator.clipboard.writeText(partes.join(' - '))
  $q.notify({ icon: 'content_copy', color: 'positive', message: 'Copiado!', position: 'top', timeout: 1500 })
}

function temEmailAgendado(p) {
  const pid = p.processoId || p.id || null
  return emailsAgendados.value.some(ag => ag.processoId === pid)
}

function abrirDialogEmail(p) {
  const pid = p.processoId || p.id || null
  const reg = pid ? registros.value.find(r => r.id === pid) : null
  const tipoProcesso = reg?.etapas?.find(e => e.key === 'processo')?.valor || ''
  const cnpj         = reg?.empresa?.find(e => e.label === 'CNPJ')?.valor || ''
  const nomeEmpresa  = p.empresa || ''
  emailDialogEmpresa.value    = nomeEmpresa
  emailDialogProcessoId.value = pid
  emailModo.value    = 'agora'
  emailPara.value    = ''
  emailAssunto.value = [tipoProcesso, nomeEmpresa, cnpj].filter(Boolean).join(' - ')
  emailMensagem.value = ''
  emailData.value    = emailHoje.value
  emailHora.value    = ''
  dialogEmail.value  = true
}

async function confirmarEmail() {
  if (!emailAssunto.value.trim()) {
    $q.notify({ type: 'warning', message: 'Preencha o Assunto.', position: 'top' })
    return
  }

  const toList = EMAIL_DESTINATARIOS.map(d => `"${d.nome}" <${d.email}>`)

  if (emailModo.value === 'agora') {
    emailEnviando.value = true
    try {
      const res = await fetch('/api/enviar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: toList, subject: emailAssunto.value.trim(), text: emailMensagem.value.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao enviar')
      $q.notify({ icon: 'mark_email_read', color: 'positive', message: 'E-mail enviado com sucesso!', position: 'top', timeout: 3500 })
      dialogEmail.value = false
    } catch (err) {
      $q.notify({ type: 'negative', message: err.message, position: 'top', timeout: 5000 })
    } finally {
      emailEnviando.value = false
    }
  } else {
    if (!emailData.value || !emailHora.value) {
      $q.notify({ type: 'warning', message: 'Selecione data e horário.', position: 'top' })
      return
    }
    const dataHoraISO = new Date(`${emailData.value}T${emailHora.value}`).toISOString()
    if (new Date(dataHoraISO) <= new Date()) {
      $q.notify({ type: 'warning', message: 'A data/hora deve ser no futuro.', position: 'top' })
      return
    }
    const ag = {
      id: Date.now().toString(),
      processoId: emailDialogProcessoId.value,
      para: toList.join(', '),
      assunto: emailAssunto.value.trim(),
      mensagem: emailMensagem.value.trim(),
      dataHoraISO,
    }
    emailsAgendados.value.push(ag)
    localStorage.setItem('wms_emails_agendados', JSON.stringify(emailsAgendados.value))
    $q.notify({ icon: 'schedule_send', color: 'positive', message: 'E-mail agendado!', position: 'top', timeout: 3500 })
    dialogEmail.value = false
  }
}

function cancelarAgendamento(id) {
  emailsAgendados.value = emailsAgendados.value.filter(ag => ag.id !== id)
  localStorage.setItem('wms_emails_agendados', JSON.stringify(emailsAgendados.value))
  $q.notify({ icon: 'event_busy', color: 'info', message: 'Agendamento cancelado.', position: 'top', timeout: 2000 })
}

let _emailCheckInterval = null
function iniciarVerificadorEmails() {
  if (_emailCheckInterval) return
  _emailCheckInterval = setInterval(async () => {
    const agora = new Date()
    const pendentes = emailsAgendados.value.filter(ag => new Date(ag.dataHoraISO) <= agora)
    if (!pendentes.length) return
    for (const ag of pendentes) {
      try {
        await fetch('/api/enviar-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: ag.para, subject: ag.assunto, text: ag.mensagem }),
        })
      } catch {}
    }
    const enviadosIds = new Set(pendentes.map(ag => ag.id))
    emailsAgendados.value = emailsAgendados.value.filter(ag => !enviadosIds.has(ag.id))
    localStorage.setItem('wms_emails_agendados', JSON.stringify(emailsAgendados.value))
    if (pendentes.length) {
      $q.notify({ icon: 'mark_email_read', color: 'positive', message: `${pendentes.length} e-mail(s) agendado(s) enviado(s).`, position: 'top', timeout: 4000 })
    }
  }, 30000) // verifica a cada 30 segundos
}
const docsDialogProcessoId = ref(null)
const docsDialogDocs       = ref([])
const docsDialogLoading    = ref(false)

const docsDialogLista = computed(() => {
  const grouped = {}
  for (const d of docsDialogDocs.value) {
    if (!grouped[d.categoria]) grouped[d.categoria] = []
    grouped[d.categoria].push(d)
  }
  return grouped
})
const docsDialogTotal = computed(() => docsDialogDocs.value.length)

async function abrirDialogDocs(p, e) {
  e?.stopPropagation()
  docsDialogEmpresa.value    = p.empresa
  docsDialogProcessoId.value = p.processoId
  docsDialogDocs.value       = []
  docsDialogLoading.value    = true
  dialogDocs.value           = true
  if (p.processoId) {
    const { data } = await supabase.from('documentos').select('*').eq('processo_id', p.processoId).order('created_at')
    docsDialogDocs.value = data || []
  }
  docsDialogLoading.value = false
}

async function removerDocDialog(arq) {
  $q.dialog({
    title: 'Excluir documento',
    message: `Deseja excluir "${arq.nome}"?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Excluir', color: 'negative' },
    dark: true,
  }).onOk(async () => {
    if (arq.r2_key) await r2Delete(arq.r2_key)
    await supabase.from('documentos').delete().eq('id', arq.id)
    docsDialogDocs.value = docsDialogDocs.value.filter(d => d.id !== arq.id)
    // Sincroniza docsAnexados se for o processo aberto
    if (arq.categoria && docsAnexados.value[arq.categoria]) {
      docsAnexados.value[arq.categoria] = docsAnexados.value[arq.categoria].filter(d => d.id !== arq.id)
    }
  })
}

async function verDoc(arq) {
  const url = await r2ViewUrl(arq.r2_key)
  window.open(url, '_blank')
}

async function baixarDoc(arq) {
  const url = await r2DownloadUrl(arq.r2_key, arq.nome)
  if (url) {
    const a = document.createElement('a')
    a.href = url; a.download = arq.nome; a.click()
  } else {
    const viewUrl = await r2ViewUrl(arq.r2_key)
    const resp = await fetch(viewUrl)
    const blob = await resp.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = arq.nome; a.click()
    URL.revokeObjectURL(a.href)
  }
}
const camposComplementar = ref([])
const _valoresPendentes  = ref(null)
const _nomePendente      = ref('')

const LABEL_CAMPO = {
  RAZAO:    'Razão Social',
  CNPJ:     'CNPJ',
  ABERTURA: 'Data de Abertura',
  CAPITAL:  'Capital Social',
  MUN_EST:  'Município / Estado',
  DONO:     'Responsável / Dono',
  INSC_EST: 'Inscrição Estadual',
  INSC_MUN: 'Inscrição Municipal',
  SOCIO:    'Sócio Administrador',
  CPF:      'CPF do Sócio',
  NIRE:     'NIRE',
  SEN_EST:  'Senha SEFAZ NET',
  SEN_MUN:  'Senha SEMFAZ',
  NFSE1:    'NFS-e (Usuário)',
  NFSE2:    'NFS-e (Senha)',
  SEGMENTO: 'Segmento',
  CUIDADOR: 'Cuidador',
  REGIME:   'Regime Tributário',
  DOMINIO:  'Domínio',
  VERI:     'VERI',
  GOVBR:    'Senha Gov.Br',
}

async function salvarHistorico(empresa, protocolo, localizacao) {
  const h = {
    id:           Date.now(),
    processoId:   regAberto.value || null,
    empresa,
    protocolo,
    localizacao,
    pct:          progressoEtapas.value,
    data:         new Date().toLocaleDateString('pt-BR'),
    hora:         new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    concluidoPor: nomeUsuarioLogado.value,
  }
  historico.value.unshift(h)
  localStorage.setItem('wms_historico', JSON.stringify(historico.value))

  const { error } = await supabase.from('historico').insert(historicoToDb(h))
  if (error) {
    $q.notify({
      icon: 'error',
      color: 'negative',
      message: 'Erro ao salvar histórico: ' + error.message,
      position: 'top',
      timeout: 6000,
    })
  }

  if (regAberto.value) {
    const proxPasso = etapas.value.find(e => e.status !== 'concluida' && e.titulo)?.titulo || ''
    await supabase.from('processos').update({ proximo_passo: proxPasso }).eq('id', regAberto.value)

    // Se atingiu 100%, marca o processo como concluído no banco
    if (h.pct === 100) {
      const original = registros.value.find(r => r.id === regAberto.value)
      if (original) original.concluido = true
      await supabase.from('processos').update({ concluido: true }).eq('id', regAberto.value)
    }
  }
}
function removerHistorico(id) {
  historico.value = historico.value.filter(h => h.id !== id)
  supabase.from('historico').delete().eq('id', id)
}

function etapaValor(key) {
  return etapas.value.find(e => e.key === key)?.valor || ''
}
function etapaStatus(key) {
  return etapas.value.find(e => e.key === key)?.status || ''
}

function _coletarValoresRelatorio() {
  const municipioEstado = etapaValor('localizacao')
  const dataAbertura    = etapaValor('contrato')
  const regimeVal       = etapaValor('regime')
  const dominioVal      = etapaValor('dominio')
  const veriVal         = etapaValor('veri')
  const assinaturaVal   = etapaValor('assinatura')
  const processoVal     = etapaValor('processo')
  const semfazVal       = etapaValor('semfaz')
  const sefaznetVal     = etapaValor('sefaznet')
  const procStatus      = etapaStatus('proc_fisica') === 'concluida' || etapaStatus('proc_juridica') === 'concluida' ? 'SIM' : ''

  const emp = label => docsEmpresa.value.find(d => d.label === label)?.valor || ''
  // RAZAO: prefere o campo "Razão social" do Resumo; fallback no campo rápido da etapa
  const razaoSocial  = emp('Razão social') || etapaValor('empresa')
  const cnpj         = emp('CNPJ')
  const capitalSocial = emp('Capital Social')
  const inscEst      = emp('Inscrição Estadual')
  const inscMun      = emp('Inscrição Municipal')
  const nire         = emp('NIRE')

  const soc = label => docsSocio.value.find(d => d.label === label)?.valor || ''
  const nomeSocio      = soc('Nome do Sócio')
  const cpf            = soc('CPF')
  const rg             = soc('RG ou CNH')
  const compResidencia = soc('Comprovante de Residência do Titular')
  const senhaGov       = soc('Senha do Gov.Br (Nível Ouro)')
  const telefoneSocio  = soc('Telefone')
  const emailSocio     = soc('E-Mail')
  const enderecoSocio  = soc('Endereço pessoa física')

  const quadroTexto = [
    nomeSocio      ? nomeSocio                                           : '',
    cpf            ? `CPF: ${cpf}`                                       : '',
    rg             ? `RG / CNH: ${rg}`                                   : '',
    compResidencia ? `COMPROV. RESIDÊNCIA: ${compResidencia}`            : '',
    telefoneSocio  ? `TELEFONE: ${telefoneSocio}`                        : '',
    emailSocio     ? `E-MAIL: ${emailSocio}`                             : '',
    enderecoSocio  ? `ENDEREÇO: ${enderecoSocio}`                        : '',
  ].filter(Boolean).join('\n')

  const processosTexto = processoVal ? processoVal.toUpperCase() : 'CONSTITUIÇÃO'

  return {
    valores: {
      RAZAO:       razaoSocial,
      CNPJ:        cnpj,
      ABERTURA:    dataAbertura,
      CAPITAL:     capitalSocial,
      MUN_EST:     municipioEstado,
      DONO:        '',
      INSC_EST:    inscEst,
      INSC_MUN:    inscMun,
      SOCIO:       nomeSocio,
      CPF:         cpf,
      NIRE:        nire,
      SEN_EST:     sefaznetVal,
      SEN_MUN:     semfazVal,
      CERTIFICADO: assinaturaVal === 'Certificado' ? 'SIM' : 'NÃO',
      NFSE1:       '',
      NFSE2:       '',
      SEGMENTO:    '',
      CUIDADOR:    '',
      REGIME:      regimeVal,
      DOMINIO:     dominioVal,
      PROCURACAO:  procStatus,
      VERI:        veriVal,
      GOVBR:       senhaGov,
      QUADRO:      quadroTexto,
      PROCESSOS:   processosTexto,
    },
    nomeArquivo: `Relatorio_${razaoSocial || 'Constituicao'}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.docx`,
    razaoSocial,
    municipioEstado,
  }
}

async function gerarRelatorio() {
  // Se o Resumo está vazio, tenta carregar do processo salvo antes de montar os valores
  if (!docsEmpresa.value.some(d => d.valor)) {
    const nomeAtual = etapaValor('empresa')
    const reg = registros.value.find(r => r.id === regAberto.value)
      || (nomeAtual ? registros.value.find(r => r.razaoSocial === nomeAtual && r.empresa?.length) : null)
    if (reg) {
      reg.empresa?.forEach((s, i) => { if (docsEmpresa.value[i] && s.valor) docsEmpresa.value[i].valor = s.valor })
      reg.socio?.forEach((s, i)   => { if (docsSocio.value[i]   && s.valor) docsSocio.value[i].valor   = s.valor })
      reg.taxas?.forEach((s, i)   => { if (taxas.value[i]       && s.valor) taxas.value[i].valor         = s.valor })
    }
  }

  const { valores, nomeArquivo, razaoSocial, municipioEstado } = _coletarValoresRelatorio()

  // Campos que o usuário pode complementar (excluindo campos computados)
  const COMPLEMENTAVEIS = ['RAZAO','CNPJ','ABERTURA','CAPITAL','MUN_EST','DONO',
    'INSC_EST','INSC_MUN','SOCIO','CPF','NIRE','SEN_EST','SEN_MUN',
    'NFSE1','NFSE2','SEGMENTO','CUIDADOR','REGIME','DOMINIO','VERI','GOVBR']

  const vazios = COMPLEMENTAVEIS.filter(k => !valores[k])

  if (vazios.length > 0) {
    camposComplementar.value = vazios.map(k => ({ token: k, label: LABEL_CAMPO[k] || k, valor: '' }))
    _valoresPendentes.value  = { valores, nomeArquivo, razaoSocial, municipioEstado }
    _nomePendente.value      = nomeArquivo
    dialogComplementar.value = true
    return
  }

  gerandoRelatorio.value = true
  try {
    await preencherRelatorioGeral(valores, nomeArquivo)
    await salvarHistorico(razaoSocial, etapaValor('protocolo'), municipioEstado)
    _docsAnexadosSnap.value  = Object.values(docsAnexados.value).flat()
    empresaBaixaEnvio.value  = razaoSocial
    processoBaixaEnvio.value = etapaValor('processo') || 'Constituição'
    protocoloEnvio.value     = etapaValor('protocolo')
    senhaSemfazEnvio.value   = etapaValor('semfaz')
    senhaSefazEnvio.value    = etapaValor('sefaznet')
    mostrarModalEnvio.value  = true
    resetarFormConstituicao()
  } finally {
    gerandoRelatorio.value = false
  }
}

async function concluirDepois() {
  salvarEtapas()
  const empresa     = etapaValor('empresa')     || etapaValor('empresa_baixa') || ''
  const protocolo   = etapaValor('protocolo')   || ''
  const localizacao = etapaValor('localizacao') || ''
  await salvarHistorico(empresa, protocolo, localizacao)
  $q.notify({ icon: 'schedule', color: 'primary', message: 'Progresso salvo. Você pode continuar depois.', position: 'top', timeout: 2500 })
  ctrlSessao3.value = 'Consultar'
  ctrlSessao1.value = null
}

async function confirmarComplementar() {
  if (!_valoresPendentes.value) return
  dialogComplementar.value = false

  const { valores, nomeArquivo, razaoSocial, municipioEstado } = _valoresPendentes.value

  // Mapeamento token → campo do Resumo para persistência
  const TOKEN_EMPRESA = { RAZAO: 'Razão social', CNPJ: 'CNPJ', CAPITAL: 'Capital Social', INSC_EST: 'Inscrição Estadual', INSC_MUN: 'Inscrição Municipal', NIRE: 'NIRE' }
  const TOKEN_SOCIO   = { SOCIO: 'Nome do Sócio', CPF: 'CPF', GOVBR: 'Senha do Gov.Br (Nível Ouro)' }

  camposComplementar.value.forEach(c => {
    if (!c.valor) return
    valores[c.token] = c.valor
    const labelEmp = TOKEN_EMPRESA[c.token]
    const labelSoc = TOKEN_SOCIO[c.token]
    if (labelEmp) { const d = docsEmpresa.value.find(x => x.label === labelEmp); if (d) d.valor = c.valor }
    if (labelSoc) { const d = docsSocio.value.find(x => x.label === labelSoc);   if (d) d.valor = c.valor }
  })
  salvarResumo()
  sincronizarResumoNoBanco()

  gerandoRelatorio.value = true
  try {
    await preencherRelatorioGeral(valores, nomeArquivo)
    await salvarHistorico(razaoSocial, etapaValor('protocolo'), municipioEstado)
    _docsAnexadosSnap.value  = Object.values(docsAnexados.value).flat()
    empresaBaixaEnvio.value  = razaoSocial
    processoBaixaEnvio.value = etapaValor('processo') || 'Constituição'
    protocoloEnvio.value     = etapaValor('protocolo')
    senhaSemfazEnvio.value   = etapaValor('semfaz')
    senhaSefazEnvio.value    = etapaValor('sefaznet')
    mostrarModalEnvio.value  = true
    resetarFormConstituicao()
  } finally {
    gerandoRelatorio.value = false
    _valoresPendentes.value = null
  }
}

function resetarFormConstituicao() {
  // Se o processo não está 100% concluído, só navega de volta sem apagar os dados
  if (progressoEtapas.value < 100) {
    ctrlSessao1.value = null
    $q.notify({
      icon: 'download',
      color: 'positive',
      message: 'Relatório gerado! Conclua as etapas restantes quando quiser.',
      position: 'top',
      timeout: 4000,
    })
    return
  }
  // Processo 100% concluído: salva etapas, marca concluído e limpa formulário
  if (regAberto.value) {
    const reg = registros.value.find(r => r.id === regAberto.value)
    if (reg) {
      const etapasSnapshot = etapas.value.map(e => ({
        key: e.key, status: e.status, obs: e.obs, valor: e.valor, concluidaEm: e.concluidaEm || '',
        statusItens: e.statusItens || {}, subStatus: e.subStatus || {},
      }))
      reg.concluido = true
      reg.etapas = etapasSnapshot
      supabase.from('processos').update({ concluido: true, etapas: etapasSnapshot }).eq('id', regAberto.value)
    }
  }
  _limparFormulario()
  ctrlSessao1.value = null
  $q.notify({
    icon: 'check_circle',
    color: 'positive',
    message: 'Processo concluído! Formulário reiniciado.',
    position: 'top',
    timeout: 3000,
  })
}

function _limparFormulario() {
  // Mantém wms_etapas_${id} para permitir visualizar o processo depois de concluído
  localStorage.removeItem('wms_constituicao')
  localStorage.removeItem('wms_resumo')
  regAberto.value = null
  etapas.value = etapasPadrao.map(e => ({
    ...e, status: '', obs: '', valor: '', concluidaEm: '', statusItens: {},
    subStatus: e.subItens ? Object.fromEntries(e.subItens.map(si => [si.key, { status: '', protocolo: '' }])) : {},
  }))
  docsEmpresa.value.forEach(d => { d.valor = '' })
  docsSocio.value.forEach(d => { d.valor = '' })
  taxas.value.forEach(t => { t.valor = '' })
}

function novoProcesso() {
  dialogNovoProcesso.value = false
  _limparFormulario()
  $q.notify({ icon: 'add_circle', color: 'positive', message: 'Formulário limpo. Preencha os dados do novo processo.', position: 'top', timeout: 3000 })
}

function abrirNovaConstituicao() {
  _limparFormulario()
  ctrlSessao1.value = 'Constituição'
}

function abrirNovaBaixa() {
  localStorage.removeItem('wms_baixa')
  etapasBaixa.value = carregarEtapasBaixa()
  ctrlSessao2.value = 'Baixa'
}

onMounted(async () => {
  await registrarSW()

  // Carrega dados do Supabase
  const [{ data: procs }, { data: hist }, { data: cfg }] = await Promise.all([
    supabase.from('processos').select('*').order('created_at', { ascending: false }),
    supabase.from('historico').select('*').order('id', { ascending: false }),
    supabase.from('configuracoes').select('*').eq('id', 1).single(),
  ])

  if (procs && procs.length > 0) {
    registros.value = procs.map(processoFromDb)

    // Reconcilia regAberto com o ID real do Supabase (pode diferir do ID gerado no frontend)
    const nomeAtual = etapaValor('empresa')
    const reg = registros.value.find(r => r.id === regAberto.value)
      || (nomeAtual ? registros.value.find(r => r.razaoSocial === nomeAtual) : null)
    if (reg) {
      if (reg.id !== regAberto.value) regAberto.value = reg.id
      // Restaura Resumo do banco se o local estiver vazio
      if (!docsEmpresa.value.some(d => d.valor)) {
        reg.empresa?.forEach((s, i) => { if (docsEmpresa.value[i] && s.valor) docsEmpresa.value[i].valor = s.valor })
        reg.socio?.forEach((s, i)   => { if (docsSocio.value[i]   && s.valor) docsSocio.value[i].valor   = s.valor })
        reg.taxas?.forEach((s, i)   => { if (taxas.value[i]       && s.valor) taxas.value[i].valor         = s.valor })
        salvarResumo()
      }
    }
  } else {
    // Migra dados existentes do localStorage para Supabase (primeira vez)
    const local = JSON.parse(localStorage.getItem('wms_registros') || '[]')
    if (local.length > 0) {
      registros.value = local
      supabase.from('processos').insert(local.map(processoToDb)).then(() => {
        localStorage.removeItem('wms_registros')
      })
    }
  }

  if (hist && hist.length > 0) {
    historico.value = hist.map(historicoFromDb)
  } else {
    // Tenta recuperar do localStorage (chave nova ou chave legada)
    const localHist = JSON.parse(
      localStorage.getItem('wms_historico') ||
      localStorage.getItem('wms_historico_constituicao') ||
      '[]'
    )
    if (localHist.length > 0) {
      historico.value = localHist
      supabase.from('historico').insert(localHist.map(historicoToDb)).then(({ error }) => {
        if (!error) {
          localStorage.removeItem('wms_historico')
          localStorage.removeItem('wms_historico_constituicao')
        }
      })
    }
  }

  if (cfg) Object.assign(configAPI.value, configFromDb(cfg))

  if (Notification.permission === 'granted') {
    notifPermissao.value = 'granted'
    dispararNotificacoes()
  }
  notifInterval = setInterval(dispararNotificacoes, 30 * 60 * 1000)
  agendarProximoAlerta()
  iniciarVerificadorEmails()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') dispararNotificacoes()
  })
})

onUnmounted(() => {
  clearInterval(notifInterval)
  clearTimeout(alertaInterval)
  clearInterval(_emailCheckInterval)
  clearTimeout(_syncEtapasTimer)
})

function limparFormulario() {
  localStorage.removeItem('wms_resumo')
  regAberto.value = null
  docsEmpresa.value.forEach(d => d.valor = '')
  docsSocio.value.forEach(d => d.valor = '')
  taxas.value.forEach(t => t.valor = '')
  activeStep.value = 0
}

function concluir() {
  dialogPrazo.value = true
}

async function fazerLogout() {
  await supabase.auth.signOut()
  router.push({ name: 'login', params: { sector: 'gerenciamento' } })
}

async function selecionarPrazo(nivel) {
  dialogPrazo.value = false
  await salvarRegistro(nivel)
  _limparFormulario()
  $q.notify({
    icon: 'check_circle',
    color: 'positive',
    message: 'Processo salvo! Formulário pronto para novo processo.',
    position: 'top',
    timeout: 2500,
  })
}

function prazoLabel(prazo) {
  return { normal: 'Normal', priorizar: 'Priorizar', urgente: 'Urgente' }[prazo] || 'Normal'
}

function prazoEmoji(prazo) {
  return { normal: '🟢', priorizar: '🟡', urgente: '🔴' }[prazo] || '🟢'
}

function alterarPrazo(id, nivel) {
  const reg = registros.value.find(r => r.id === id)
  if (reg) {
    reg.prazo = nivel
    supabase.from('processos').update({ prazo: nivel }).eq('id', id)
  }
}

function reeniviarWhatsApp(reg) {
  const linhaEmpresa = reg.empresa.map(d => `▲ ${d.label}${d.valor ? ': ' + d.valor : ''}`).join('\n')
  const linhaSocio   = reg.socio.map(d => `▲ ${d.label}${d.valor ? ': ' + d.valor : ''}`).join('\n')
  const linhaTaxas   = reg.taxas.map(t => `◆ ${t.label}: R$ ${t.valor || 'A definir'}`).join('\n')
  const texto = `📋 *RESUMO GERAL*\n*RELAÇÃO DE DOCUMENTOS PARA ABERTURA DA EMPRESA LTDA UNIPESSOAL*\n\n🏢 *EMPRESA* — _Fotos legíveis obrigatórias_\n${linhaEmpresa}\n\n👤 *SÓCIO*\n${linhaSocio}\n\n💰 *TAXAS*\n${linhaTaxas}\n\n_Enviado via WMS Consultoria_`
  abrirWhatsApp(texto)
}

function excluirRegistro(id) {
  registros.value = registros.value.filter(r => r.id !== id)
  supabase.from('processos').delete().eq('id', id)
  if (regAberto.value === id) regAberto.value = null
}

function marcarConcluido(reg) {
  $q.dialog({
    title: 'Marcar como concluído?',
    message: `"${reg.razaoSocial || 'Sem nome'}" será movido para a aba Concluídos.`,
    cancel: { label: 'Cancelar', flat: true, color: 'white' },
    ok:     { label: 'Concluir', flat: true, color: 'positive' },
    persistent: true,
    dark: true,
  }).onOk(async () => {
    const { error } = await supabase.from('processos').update({ concluido: true }).eq('id', reg.id)
    if (error) {
      $q.notify({ type: 'negative', message: 'Erro ao salvar: ' + error.message, position: 'top', timeout: 5000 })
      return
    }
    const original = registros.value.find(r => r.id === reg.id)
    if (original) original.concluido = true
    $q.notify({ icon: 'check_circle', color: 'positive', message: 'Processo marcado como concluído.', position: 'top', timeout: 2500 })
  })
}

function confirmarExcluir(reg) {
  $q.dialog({
    title: 'Excluir processo?',
    message: `"${reg.razaoSocial || 'Sem nome'}" será removido permanentemente.`,
    cancel: { label: 'Cancelar', flat: true, color: 'white' },
    ok:     { label: 'Excluir',  flat: true, color: 'negative' },
    persistent: true,
    dark: true,
  }).onOk(() => excluirRegistro(reg.id))
}

function limparHistorico() {
  registros.value = []
  localStorage.removeItem('wms_registros')
  regAberto.value = null
}

function copiarParaWhatsApp() {
  const texto = montarMensagem()
  navigator.clipboard.writeText(texto).then(() => {
    $q.notify({
      icon: 'check_circle',
      color: 'positive',
      message: 'Copiado para a área de transferência!',
      caption: 'Cole diretamente no WhatsApp.',
      position: 'top',
      timeout: 3000,
    })
  }).catch(() => {
    $q.notify({ type: 'negative', message: 'Não foi possível copiar.', position: 'top' })
  })
}

const taxas = ref([
  { label: 'Jucema',                        valor: '', tipo: 'moeda' },
  { label: 'Certificado digital da empresa', valor: '', tipo: 'simnom' },
  { label: 'Alvará da prefeitura',           valor: '', tipo: 'moeda' },
])

// Carrega valores salvos do Resumo (docsEmpresa / docsSocio / taxas)
;(() => {
  const salvo = JSON.parse(localStorage.getItem('wms_resumo') || 'null')
  if (!salvo) return
  salvo.empresa?.forEach(s => { const d = docsEmpresa.value.find(x => x.label === s.label); if (d) d.valor = s.valor })
  salvo.socio?.forEach(s => { const d = docsSocio.value.find(x => x.label === s.label); if (d) d.valor = s.valor })
  salvo.taxas?.forEach(s => { const t = taxas.value.find(x => x.label === s.label); if (t) t.valor = s.valor })
})()

function salvarResumo() {
  localStorage.setItem('wms_resumo', JSON.stringify({
    empresa: docsEmpresa.value.map(d => ({ label: d.label, valor: d.valor })),
    socio:   docsSocio.value.map(d => ({ label: d.label, valor: d.valor })),
    taxas:   taxas.value.map(t => ({ label: t.label, valor: t.valor })),
  }))
}

let _syncResumoTimer = null
function sincronizarResumoNoBanco() {
  clearTimeout(_syncResumoTimer)
  _syncResumoTimer = setTimeout(() => {
    if (!regAberto.value) return
    supabase.from('processos').update({
      razao_social: docsEmpresa.value.find(d => d.label === 'Razão social')?.valor || '',
      empresa: docsEmpresa.value.map(d => ({ label: d.label, valor: d.valor })),
      socio:   docsSocio.value.map(d => ({ label: d.label, valor: d.valor })),
      taxas:   taxas.value.map(t => ({ label: t.label, valor: t.valor })),
    }).eq('id', regAberto.value)
  }, 1500)
}

watch([docsEmpresa, docsSocio, taxas], () => {
  salvarResumo()
  sincronizarResumoNoBanco()
}, { deep: true })

const today = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
}).format(new Date())

const hour = new Date().getHours()
const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

const navItems = [
  { label: 'Dashboard',  icon: 'space_dashboard' },
  { label: 'Resumo',     icon: 'description' },
  { label: 'Controle',   icon: 'tune' },
  { label: 'Relatórios', icon: 'bar_chart' },
]

const kpis = [
  { label: 'Itens em Estoque',    value: '14.832', icon: 'inventory_2',   color: '#1a3fa0', up: true,  delta: '+2.4% hoje'  },
  { label: 'Entradas do Dia',     value: '127',    icon: 'download',      color: '#5ab82e', up: true,  delta: '+18 vs ontem' },
  { label: 'Saídas do Dia',       value: '94',     icon: 'upload',        color: '#f59e0b', up: false, delta: '-6 vs ontem'  },
  { label: 'Pedidos Pendentes',   value: '31',     icon: 'receipt_long',  color: '#7c3aed', up: false, delta: '8 em atraso'  },
]

const movements = [
  { id: 1, product: 'Caixa Papelão 50x30',  type: 'entrada', qty: 200, location: 'Rua A-12', time: 'há 10 min' },
  { id: 2, product: 'Pallet PVC Reforçado', type: 'saida',   qty: 50,  location: 'Rua B-04', time: 'há 25 min' },
  { id: 3, product: 'Fita Adesiva 50m',     type: 'entrada', qty: 500, location: 'Rua C-07', time: 'há 1h'     },
  { id: 4, product: 'Etiqueta Térmica',     type: 'saida',   qty: 120, location: 'Rua A-01', time: 'há 2h'     },
  { id: 5, product: 'Embalagem Plástica',   type: 'entrada', qty: 300, location: 'Rua D-09', time: 'há 3h'     },
]

const stockStatus = [
  { label: 'Setor A — Expedição',  used: 340, total: 400 },
  { label: 'Setor B — Recebimento', used: 210, total: 400 },
  { label: 'Setor C — Picking',    used: 370, total: 400 },
  { label: 'Setor D — Estoque Seco', used: 180, total: 400 },
]

const alerts = [
  { level: 'error',   icon: 'error',        msg: 'Setor C acima de 90% da capacidade' },
  { level: 'warning', icon: 'warning',      msg: '8 pedidos com prazo vencendo hoje'  },
  { level: 'warning', icon: 'warning',      msg: 'Inventário Setor A pendente'        },
  { level: 'info',    icon: 'info',         msg: 'Backup automático realizado às 6h'  },
]
</script>

<style scoped>
/* Layout */
.wms-header {
  background: linear-gradient(135deg, #020810 0%, #06122e 40%, #091e5a 100%);
  border-bottom: none;
  box-shadow: 0 4px 32px rgba(0,0,0,0.55);
}
.wms-header::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #5ab82e 30%, #3b82f6 60%, #5ab82e 80%, transparent 100%);
  opacity: 0.8;
}
.header-logo {
  width: 46px;
  height: 46px;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(59,130,246,0.45)) drop-shadow(0 2px 6px rgba(0,0,0,0.5));
}
.header-title {
  font-weight: 900;
  font-size: 1.15rem;
  letter-spacing: 0.14em;
  line-height: 1;
  background: linear-gradient(135deg, #ffffff 0%, #c7dcff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.header-sub {
  color: #5ab82e;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-shadow: 0 0 8px rgba(90,184,46,0.6);
}
/* Status dot */
.status-online {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border-radius: 20px;
  background: rgba(90,184,46,0.1);
  border: 1px solid rgba(90,184,46,0.3);
}
.status-online-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #5ab82e;
  box-shadow: 0 0 6px #5ab82e;
  animation: dot-pulse 2s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px #5ab82e; }
  50%       { opacity: 0.5; box-shadow: 0 0 14px #5ab82e; }
}
.status-online-txt {
  color: #a3e635;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.user-avatar {
  background: rgba(255,255,255,0.08);
  border: 1.5px solid rgba(90,184,46,0.4);
  box-shadow: 0 0 10px rgba(90,184,46,0.15);
}

/* Drawer */
.wms-drawer {
  background: #080f2a !important;
  border-right: 1px solid rgba(255,255,255,0.06) !important;
}
.wms-drawer :deep(.q-drawer__content) {
  background: #080f2a;
}

.drawer-inner {
  background: #080f2a;
  height: 100%;
}

/* Brand */
.drawer-brand {
  padding: 20px 16px 16px;
}
.drawer-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
}
.drawer-brand-title {
  color: white;
  font-weight: 900;
  font-size: 1rem;
  letter-spacing: 0.14em;
  line-height: 1;
}
.drawer-brand-sub {
  color: #5ab82e;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.drawer-divider {
  height: 1px;
  background: rgba(255,255,255,0.06);
  margin: 0 16px;
}

/* Scroll área */
.drawer-scroll {
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 10px;
}
.drawer-scroll::-webkit-scrollbar { width: 4px; }
.drawer-scroll::-webkit-scrollbar-track { background: transparent; }
.drawer-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

/* Section labels */
.nav-section-label {
  color: rgba(255,255,255,0.28);
  font-size: 0.63rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

/* Nav items */
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: rgba(255,255,255,0.5);
  transition: background 0.18s, color 0.18s;
  margin: 2px 0;
  user-select: none;
}
.nav-item:hover {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.85);
}
.nav-item--active {
  background: rgba(26,63,160,0.35);
  color: white;
}
.nav-item--active .nav-icon {
  color: #5ab82e;
}
.nav-item--danger:hover {
  background: rgba(239,68,68,0.1);
  color: #fca5a5;
}

/* Indicador lateral do item ativo */
.nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 20px;
  background: #5ab82e;
  border-radius: 0 3px 3px 0;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.nav-item--active .nav-indicator {
  transform: translateY(-50%) scaleY(1);
}

.nav-icon {
  flex-shrink: 0;
  transition: color 0.18s;
}
.nav-label {
  font-size: 0.875rem;
  font-weight: 500;
  flex: 1;
  letter-spacing: 0.01em;
}
.nav-badge {
  font-size: 0.68rem;
  padding: 2px 6px;
}

/* Footer do drawer */
.drawer-footer {
  padding: 12px 16px 16px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.drawer-user {
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 10px 12px;
}
.drawer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1a3fa0, #2563eb);
  flex-shrink: 0;
}
.drawer-user-name {
  color: white;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.1;
}
.drawer-user-role {
  color: #5ab82e;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Page */
.dash-page {
  background: linear-gradient(160deg, #091644 0%, #0d1f5c 60%, #1a3fa0 100%);
  min-height: 100vh;
}
.page-title {
  color: white;
  font-size: 1.4rem;
  font-weight: 800;
}
.page-caption {
  color: rgba(255,255,255,0.55);
  font-size: 0.85rem;
}
.page-date {
  color: rgba(255,255,255,0.45);
  font-size: 0.8rem;
  text-transform: capitalize;
}

/* ══ DASHBOARD ══ */

/* KPI Cards */
/* ── Alerta ── */
.db-alert-bar {
  display: flex; align-items: center; gap: 10px;
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 12px; padding: 10px 14px;
  font-size: 0.82rem; color: #fca5a5;
}
.db-alert-bar strong { color: #fecaca; }
.db-alert-link {
  margin-left: auto; flex-shrink: 0;
  display: flex; align-items: center; gap: 2px;
  background: none; border: none; cursor: pointer;
  color: #fca5a5; font-size: 0.78rem; font-weight: 700;
  font-family: inherit; opacity: 0.75; transition: opacity 0.15s;
}
.db-alert-link:hover { opacity: 1; }

/* ── Cards de estágio ── */
.db-stages {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
@media (max-width: 700px) { .db-stages { grid-template-columns: 1fr; } }
.db-stage {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; gap: 4px;
  text-align: left; cursor: pointer; font-family: inherit;
  padding: 18px 20px; border-radius: 18px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.09);
  transition: transform 0.15s, border-color 0.2s, background 0.2s;
}
.db-stage::before {
  content: ''; position: absolute; inset: 0 0 auto 0; height: 3px;
}
.db-stage:hover { transform: translateY(-3px); background: rgba(255,255,255,0.07); }
.db-stage--nao:hover { border-color: rgba(148,163,184,0.4); }
.db-stage--and:hover { border-color: rgba(245,158,11,0.4); }
.db-stage--ok:hover  { border-color: rgba(90,184,46,0.4); }
.db-stage--nao::before { background: linear-gradient(90deg,#94a3b8,#64748b); }
.db-stage--and::before { background: linear-gradient(90deg,#fcd34d,#f59e0b); }
.db-stage--ok::before  { background: linear-gradient(90deg,#86efac,#5ab82e); }
.db-stage-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.db-stage-icon {
  display: flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; border-radius: 11px;
}
.db-stage--nao .db-stage-icon { background: rgba(148,163,184,0.14); color: #cbd5e1; }
.db-stage--and .db-stage-icon { background: rgba(245,158,11,0.16); color: #fcd34d; }
.db-stage--ok  .db-stage-icon { background: rgba(90,184,46,0.16);  color: #86efac; }
.db-stage-pct { font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.4); }
.db-stage-num { font-size: 2.4rem; font-weight: 900; line-height: 1; }
.db-stage--nao .db-stage-num { color: #e2e8f0; }
.db-stage--and .db-stage-num { color: #fcd34d; }
.db-stage--ok  .db-stage-num { color: #86efac; }
.db-stage-label { color: rgba(255,255,255,0.55); font-size: 0.82rem; font-weight: 600; }
.db-stage-bar { margin-top: 10px; height: 5px; border-radius: 4px; background: rgba(255,255,255,0.08); overflow: hidden; }
.db-stage-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }
.db-stage--nao .db-stage-fill { background: #94a3b8; }
.db-stage--and .db-stage-fill { background: #f59e0b; }
.db-stage--ok  .db-stage-fill { background: #5ab82e; }

/* ── Em andamento (lista) ── */
.db-head-count {
  background: rgba(245,158,11,0.18); color: #fcd34d;
  font-size: 0.7rem; font-weight: 800; padding: 1px 8px; border-radius: 20px;
}
.db-and-list { display: flex; flex-direction: column; gap: 8px; }
.db-and-row {
  display: flex; align-items: center; gap: 14px;
  padding: 10px 12px; border-radius: 12px; cursor: pointer;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  transition: background 0.15s, border-color 0.15s;
}
.db-and-row:hover { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.2); }
.db-and-info { flex: 1; min-width: 0; }
.db-and-nome { font-size: 0.86rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.db-and-meta { font-size: 0.7rem; color: rgba(255,255,255,0.4); margin-top: 2px; }
.db-and-progress { display: flex; align-items: center; gap: 8px; flex-shrink: 0; width: 130px; }
.db-and-bar-bg { flex: 1; height: 6px; border-radius: 4px; background: rgba(255,255,255,0.1); overflow: hidden; }
.db-and-bar { height: 100%; border-radius: 4px; transition: width 0.4s; }
.db-and-pct { font-size: 0.78rem; font-weight: 800; min-width: 34px; text-align: right; }

/* ── KPI Cards ── */
.db-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 900px) { .db-kpis { grid-template-columns: repeat(2, 1fr); } }
.db-kpi-card {
  position: relative;
  display: flex; align-items: center; gap: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 16px; padding: 16px 18px; overflow: hidden;
}
.db-kpi-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; border-radius: 4px 0 0 4px; }
.db-kpi-body { flex: 1; min-width: 0; }
.db-kpi-label { color: rgba(255,255,255,0.4); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
.db-kpi-val   { font-size: 1.75rem; font-weight: 900; line-height: 1.1; margin-top: 2px; }
.db-kpi-sub   { color: rgba(255,255,255,0.3); font-size: 0.7rem; margin-top: 3px; }
.db-kpi-ring  { flex-shrink: 0; }

/* ── Layout grid ── */
.db-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 12px; align-items: start;
}
@media (max-width: 1100px) { .db-grid { grid-template-columns: 1fr; } }
.db-col-main { display: flex; flex-direction: column; }
.db-col-side  { display: flex; flex-direction: column; gap: 12px; }

/* ── Panels ── */
.db-panel {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 16px; padding: 18px 20px;
}
.db-panel-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 14px; padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.db-panel-title { color: white; font-size: 0.88rem; font-weight: 700; flex: 1; }
.db-link-btn {
  display: flex; align-items: center; gap: 2px;
  background: none; border: none; cursor: pointer;
  color: #5ab82e; font-size: 0.75rem; font-weight: 700;
  font-family: inherit; padding: 0; transition: opacity 0.2s;
}
.db-link-btn:hover { opacity: 0.7; }

/* ── Prazos Críticos ── */
.db-criticos-list { display: flex; flex-direction: column; gap: 4px; }
.db-critico-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px; cursor: pointer;
  border: 1px solid transparent; transition: background 0.15s;
}
.db-critico-row--vencido  { background: rgba(239,68,68,0.07);  border-color: rgba(239,68,68,0.18); }
.db-critico-row--urgente  { background: rgba(239,68,68,0.05);  border-color: rgba(239,68,68,0.12); }
.db-critico-row--priorizar{ background: rgba(245,158,11,0.05); border-color: rgba(245,158,11,0.12); }
.db-critico-row:hover { filter: brightness(1.12); }
.db-critico-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.db-critico-info { flex: 1; min-width: 0; }
.db-critico-nome { color: white; font-size: 0.86rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.db-critico-meta { color: rgba(255,255,255,0.35); font-size: 0.7rem; margin-top: 1px; }
.db-critico-badge {
  font-size: 0.67rem; font-weight: 800; letter-spacing: .04em;
  padding: 3px 8px; border-radius: 20px; flex-shrink: 0;
}
.db-cb--vencido  { background: rgba(239,68,68,0.2);  color: #fca5a5; }
.db-cb--urgente  { background: rgba(239,68,68,0.15); color: #fca5a5; }
.db-cb--priorizar{ background: rgba(245,158,11,0.15);color: #fcd34d; }
.db-critico-dias { font-size: 0.72rem; font-weight: 700; flex-shrink: 0; min-width: 72px; text-align: right; }

/* ── Timeline ── */
.db-tl-list { display: flex; flex-direction: column; gap: 8px; }
.db-tl-row  { display: flex; align-items: center; gap: 10px; }
.db-tl-label { color: rgba(255,255,255,0.45); font-size: 0.75rem; min-width: 44px; flex-shrink: 0; }
.db-tl-bar-bg { flex: 1; height: 8px; background: rgba(255,255,255,0.07); border-radius: 4px; overflow: hidden; }
.db-tl-bar { height: 100%; border-radius: 4px; min-width: 3px; transition: width 0.5s ease; }
.db-tl-count { font-size: 0.75rem; font-weight: 700; min-width: 18px; text-align: right; flex-shrink: 0; }

/* ── Gauge ── */
.db-gauge-panel { text-align: center; padding-top: 14px; }
.db-gauge-panel svg { display: block; margin: 0 auto; }
.db-gauge-num   { font-size: 2rem; font-weight: 900; line-height: 1; margin-top: -8px; }
.db-gauge-label { color: rgba(255,255,255,0.55); font-size: 0.78rem; font-weight: 600; margin-top: 4px; }
.db-gauge-sub   { color: rgba(255,255,255,0.3); font-size: 0.68rem; margin-top: 2px; }

/* ── Distribuição ── */
.db-dist-list { display: flex; flex-direction: column; gap: 10px; }
.db-dist-row  { display: flex; align-items: center; gap: 8px; }
.db-dist-label { font-size: 0.75rem; font-weight: 600; width: 56px; flex-shrink: 0; }
.db-dist-bar-wrap { flex: 1; height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
.db-dist-bar  { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
.db-dist-num  { font-size: 0.78rem; font-weight: 700; width: 18px; text-align: right; flex-shrink: 0; }

/* ── Pendências ── */
.db-pend-list { display: flex; flex-direction: column; gap: 4px; }
.db-pend-item {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 10px; border-radius: 8px;
  background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.12);
}
.db-pend-name { flex: 1; min-width: 0; font-size: 0.78rem; color: rgba(255,255,255,0.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.db-pend-tag  { font-size: 0.65rem; padding: 2px 6px; border-radius: 10px; background: rgba(245,158,11,0.15); color: #fcd34d; flex-shrink: 0; }
.db-pend-more { font-size: 0.72rem; color: rgba(255,255,255,0.3); text-align: center; padding-top: 4px; }

/* ── Ações rápidas ── */
.db-actions { display: flex; flex-direction: column; gap: 8px; }
.db-action-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 10px; border-radius: 10px; border: none;
  font-family: inherit; font-size: 0.83rem; font-weight: 700;
  cursor: pointer; transition: opacity 0.2s, transform 0.15s;
}
.db-action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
.db-action-btn--primary   { background: #5ab82e; color: white; }
.db-action-btn--secondary { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.75); border: 1px solid rgba(255,255,255,0.1); }

/* ── Empty state ── */
.db-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 28px 16px;
  color: rgba(255,255,255,0.3); font-size: 0.83rem;
}

/* ══ RESUMO ══ */
.resumo-page { animation: card-in 0.3s ease both; }

/* Transição entre etapas */
.sec-fade-enter-active,
.sec-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.sec-fade-enter-from { opacity: 0; transform: translateX(16px); }
.sec-fade-leave-to  { opacity: 0; transform: translateX(-16px); }

/* Header */
.rp-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.rp-eyebrow {
  color: #5ab82e;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  gap: 8px !important;
}
.rp-eyebrow::before {
  content: '';
  display: inline-block;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, #5ab82e, #3b82f6);
  flex-shrink: 0;
}
.rp-title {
  font-size: 2.1rem;
  font-weight: 900;
  margin: 4px 0 0;
  line-height: 1.1;
  background: linear-gradient(135deg, #ffffff 0%, #b8d4ff 60%, #a3e635 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 12px rgba(59,130,246,0.25));
}

/* Lado direito do header */
.rp-header-right {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
}

/* Progress */
.rp-progress-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  min-width: 180px;
}
.rp-progress-nums {
  display: flex;
  align-items: baseline;
  gap: 3px;
}
.rp-progress-val {
  color: white;
  font-size: 1.5rem;
  font-weight: 900;
  line-height: 1;
}
.rp-progress-of {
  color: rgba(255,255,255,0.4);
  font-size: 1rem;
  font-weight: 700;
}
.rp-progress-label {
  color: rgba(255,255,255,0.4);
  font-size: 0.75rem;
  margin-left: 4px;
}
.rp-progress-track {
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 99px;
  overflow: hidden;
}
.rp-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1a3fa0, #5ab82e);
  border-radius: 99px;
  transition: width 0.4s ease;
}
.rp-progress-pct {
  color: #5ab82e;
  font-size: 0.72rem;
  font-weight: 800;
}

/* Abas de seção */
/* ── Layout único do Resumo ── */
.rs-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rs-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 20px;
  padding: 24px;
}
.rs-card--taxas {
  border-color: rgba(245,158,11,0.2);
  background: rgba(245,158,11,0.04);
}

.rs-card-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.rs-card-icon {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rc-color);
  flex-shrink: 0;
}
.rs-card-title {
  color: white;
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.rs-card-sub {
  color: rgba(255,255,255,0.38);
  font-size: 0.75rem;
  margin-top: 4px;
}
.rs-obrig {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ef4444;
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 6px;
  padding: 2px 7px;
}
.rs-card-count {
  margin-left: auto;
  font-size: 0.78rem;
  font-weight: 700;
  color: rgba(255,255,255,0.35);
}
.rs-card-count .rs-count--done {
  color: #5ab82e;
}

/* Foco amarelo nos campos de taxa */
.rp-field-wrap--taxa:focus-within {
  border-color: rgba(245,158,11,0.5) !important;
  box-shadow: 0 0 0 3px rgba(245,158,11,0.1) !important;
}

/* Botão copiar seção */
.sec-copy-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  padding: 7px 12px;
  color: rgba(255,255,255,0.45);
  font-size: 0.75rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  white-space: nowrap;
}
.sec-copy-btn:hover {
  background: rgba(90,184,46,0.14);
  border-color: rgba(90,184,46,0.35);
  color: #a3e635;
}

/* Grid de campos */
.rp-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 700px) { .rp-fields { grid-template-columns: 1fr; } }

.rp-field { display: flex; flex-direction: column; gap: 6px; }

.rp-field-label {
  color: rgba(255,255,255,0.5);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding-left: 2px;
}
.rp-field--filled .rp-field-label { color: rgba(255,255,255,0.7); }

.rp-field-wrap {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.05);
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  height: 48px;
  padding: 0 14px;
  gap: 8px;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.rp-field-wrap:focus-within {
  border-color: #1a3fa0;
  background: rgba(26,63,160,0.1);
  box-shadow: 0 0 0 3px rgba(26,63,160,0.18);
}
.rp-field--filled .rp-field-wrap {
  border-color: rgba(90,184,46,0.35);
}

.rp-field-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  font-family: inherit;
  min-width: 0;
}
.rp-field-input::placeholder { color: rgba(255,255,255,0.2); }

.rp-field-ok  { color: #5ab82e; flex-shrink: 0; }
.rp-field-err { color: #ef4444; flex-shrink: 0; }

.rp-field--invalido .rp-field-input {
  border-color: rgba(239,68,68,0.45) !important;
}

.rp-simnom-wrap { display: flex; gap: 8px; margin-top: 2px; }
.rp-simnom-btn {
  flex: 1; padding: 8px 0; border-radius: 8px; font-size: 0.82rem; font-weight: 700;
  border: 1.5px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.45); cursor: pointer; font-family: inherit;
  transition: all 0.15s;
}
.rp-simnom-btn:hover { border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.7); }
.rp-simnom-btn--sim { background: rgba(90,184,46,0.15); border-color: rgba(90,184,46,0.5); color: #5ab82e; }
.rp-simnom-btn--nom { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.4); color: #f87171; }

.rp-prefix {
  color: rgba(255,255,255,0.35);
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

/* Barra de ação */
.rp-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.rp-btn-concluir {
  display: flex;
  align-items: center;
  gap: 9px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  border: none;
  border-radius: 12px;
  padding: 12px 28px;
  color: white;
  font-size: 0.95rem;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(22,163,74,0.35);
  transition: box-shadow 0.25s, transform 0.18s;
}
.rp-btn-concluir:hover { box-shadow: 0 12px 32px rgba(22,163,74,0.5); transform: translateY(-2px); }
.rp-btn-concluir:active { transform: translateY(0); }

/* Histórico */
.historico { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 28px; }
.historico-header { margin-bottom: 14px; }
.historico-title {
  color: white;
  font-size: 1.05rem;
  font-weight: 800;
}
.clear-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 8px;
  padding: 6px 12px;
  color: #fca5a5;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.clear-btn:hover {
  background: rgba(239,68,68,0.2);
  border-color: rgba(239,68,68,0.45);
}
.clear-btn--reg { margin-left: auto; }

.reg-list { display: flex; flex-direction: column; gap: 10px; }

.reg-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.reg-card--open {
  border-color: rgba(90,184,46,0.3);
}
.reg-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  cursor: pointer;
  user-select: none;
}
.reg-card-header:hover { background: rgba(255,255,255,0.03); }
.reg-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5ab82e;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(90,184,46,0.6);
}
.reg-razao {
  color: white;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.1;
}
.reg-data {
  color: rgba(255,255,255,0.4);
  font-size: 0.74rem;
  margin-top: 2px;
}
.reg-chevron { color: rgba(255,255,255,0.35); transition: color 0.2s; }
.reg-card--open .reg-chevron { color: #5ab82e; }

.reg-body {
  padding: 0 18px 16px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.reg-secao { margin-top: 14px; }
.reg-secao-title {
  display: flex;
  align-items: center;
  color: rgba(255,255,255,0.45);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.reg-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  gap: 12px;
}
.reg-row:last-child { border-bottom: none; }
.reg-label {
  color: rgba(255,255,255,0.5);
  font-size: 0.78rem;
  flex-shrink: 0;
}
.reg-valor {
  color: white;
  font-size: 0.82rem;
  font-weight: 600;
  text-align: right;
}
.reg-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

/* Animação expand */
.reg-expand-enter-active,
.reg-expand-leave-active {
  transition: opacity 0.2s ease, max-height 0.25s ease;
  overflow: hidden;
  max-height: 600px;
}
.reg-expand-enter-from,
.reg-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

/* Botão WhatsApp */
.whatsapp-btn {
  display: flex;
  align-items: center;
  gap: 9px;
  background: linear-gradient(135deg, #25d366, #128c7e);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 11px 20px;
  font-size: 0.875rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(37,211,102,0.3);
  transition: box-shadow 0.2s, transform 0.18s;
}
.whatsapp-btn:hover {
  box-shadow: 0 10px 28px rgba(37,211,102,0.45);
  transform: translateY(-1px);
}
.whatsapp-btn:active { transform: translateY(0); }
.whatsapp-icon {
  display: flex;
  align-items: center;
}

/* Botão Prazos na barra de ação */
.rp-btn-novo {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 16px; border-radius: 10px;
  background: rgba(90,184,46,0.15);
  border: 1px solid rgba(90,184,46,0.35);
  color: #5ab82e; font-size: 0.82rem; font-weight: 700;
  font-family: inherit; cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  letter-spacing: 0.04em; text-transform: uppercase;
}
.rp-btn-novo:hover { background: rgba(90,184,46,0.25); border-color: rgba(90,184,46,0.6); }

.prazos-nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  background: rgba(245,158,11,0.12);
  border: 1.5px solid rgba(245,158,11,0.35);
  border-radius: 12px;
  padding: 10px 20px;
  color: #fcd34d;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.prazos-nav-btn:hover {
  background: rgba(245,158,11,0.2);
  border-color: rgba(245,158,11,0.6);
  box-shadow: 0 0 16px rgba(245,158,11,0.2);
}
.prazos-nav-dot {
  position: absolute;
  top: -5px; right: -5px;
  width: 11px; height: 11px;
  border-radius: 50%;
  border: 2px solid #091644;
  animation: pulse-dot 1.5s ease-in-out infinite;
}
.prazos-nav-dot--urgente   { background: #ef4444; }
.prazos-nav-dot--priorizar { background: #f59e0b; }
@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.3); opacity: 0.7; }
}

/* ══ PRAZOS VIEW ══ */
.prazos-page { animation: card-in 0.3s ease both; }

.rp-btn-back {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 10px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.75); font-size: 0.82rem; font-weight: 600;
  font-family: inherit; cursor: pointer; flex-shrink: 0;
  transition: background 0.2s, color 0.2s;
}
.rp-btn-back:hover { background: rgba(255,255,255,0.13); color: white; }
.rp-btn-novo-proc {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 10px;
  background: rgba(90,184,46,0.12);
  border: 1px solid rgba(90,184,46,0.3);
  color: #5ab82e; font-size: 0.82rem; font-weight: 600;
  font-family: inherit; cursor: pointer; flex-shrink: 0;
  transition: background 0.2s, color 0.2s;
}
.rp-btn-novo-proc:hover { background: rgba(90,184,46,0.22); color: #7fda52; }

.prazos-legend { color: rgba(255,255,255,0.5); font-size: 0.78rem; font-weight: 600; }
.prazos-legend-item { display: flex; align-items: center; gap: 6px; }
.pl-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
.pl-dot--normal    { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.5); }
.pl-dot--priorizar { background: #f59e0b; box-shadow: 0 0 6px rgba(245,158,11,0.5); }
.pl-dot--urgente   { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.5); }

.prazos-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 80px 20px;
  color: rgba(255,255,255,0.3); font-size: 0.9rem;
}

.prazos-list { display: flex; flex-direction: column; gap: 10px; }

.prazo-card {
  display: flex; align-items: center; gap: 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 14px; padding: 16px 20px;
  transition: border-color 0.2s, background 0.2s;
  position: relative; overflow: hidden;
}
.prazo-card--normal    { border-left-color: rgba(34,197,94,0.5); }
.prazo-card--priorizar { border-left-color: rgba(245,158,11,0.5); background: rgba(245,158,11,0.04); }
.prazo-card--urgente   { border-left-color: rgba(239,68,68,0.5);  background: rgba(239,68,68,0.04); }

.prazo-card-bar {
  position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px 0 0 4px;
}
.prazo-card--normal    .prazo-card-bar { background: #22c55e; }
.prazo-card--priorizar .prazo-card-bar { background: #f59e0b; }
.prazo-card--urgente   .prazo-card-bar { background: #ef4444; }

.prazo-card-body { flex: 1; min-width: 0; padding-left: 8px; }
.prazo-card-razao { color: white; font-size: 0.95rem; font-weight: 700; }

.prazo-badge {
  font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em;
  text-transform: uppercase; padding: 4px 10px; border-radius: 20px;
  flex-shrink: 0;
}
.prazo-badge--normal    { background: rgba(34,197,94,0.15);  color: #86efac; border: 1px solid rgba(34,197,94,0.3); }
.prazo-badge--priorizar { background: rgba(245,158,11,0.15); color: #fcd34d; border: 1px solid rgba(245,158,11,0.3); }
.prazo-badge--urgente   { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }

/* Botões de alteração de prazo */
.pd-btn {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid transparent; cursor: pointer;
  opacity: 0.4; transition: opacity 0.2s, transform 0.15s;
  flex-shrink: 0;
}
.pd-btn:hover { opacity: 1; transform: scale(1.2); }
.pd-btn.pd-active { opacity: 1; border-color: white; }
.pd-btn--normal    { background: #22c55e; }
.pd-btn--priorizar { background: #f59e0b; }
.pd-btn--urgente   { background: #ef4444; }

/* ══ PRAZOS: HEADER ══ */
.pz-header {
  display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
}
.pz-header-info { flex: 1; min-width: 0; }
.pz-header-stats {
  display: flex; gap: 10px; flex-shrink: 0;
}
.pz-stat {
  display: flex; flex-direction: column; align-items: center;
  padding: 8px 16px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  min-width: 72px;
}
.pz-stat-num   { font-size: 1.4rem; font-weight: 900; line-height: 1; }
.pz-stat-label { font-size: 0.65rem; color: rgba(255,255,255,0.4); margin-top: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
.pz-stat--urgente  { border-color: rgba(239,68,68,0.25); background: rgba(239,68,68,0.06); }
.pz-stat--urgente  .pz-stat-num { color: #fca5a5; }
.pz-stat--priorizar { border-color: rgba(245,158,11,0.25); background: rgba(245,158,11,0.06); }
.pz-stat--priorizar .pz-stat-num { color: #fcd34d; }
.pz-stat--vencido  { border-color: rgba(239,68,68,0.18); }
.pz-stat--vencido  .pz-stat-num { color: #ef4444; }

/* ══ PRAZOS: TABS ══ */
.pz-tabs { display: flex; gap: 8px; }
.pz-tab {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; border-radius: 10px; cursor: pointer; font-family: inherit;
  font-size: 0.83rem; font-weight: 600;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5); transition: all 0.15s;
}
.pz-tab:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.8); }
.pz-tab--active { background: rgba(90,184,46,0.12); border-color: rgba(90,184,46,0.35); color: #5ab82e; }
.pz-tab-count {
  padding: 1px 7px; border-radius: 20px; font-size: 0.72rem; font-weight: 700;
  background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6);
}
.pz-tab-count--green { background: rgba(90,184,46,0.2); color: #5ab82e; }
.prazo-card--concluido-item { opacity: 0.85; }
.prazo-badge--concluido-item { background: rgba(34,197,94,0.15); color: #86efac; display:flex; align-items:center; gap:4px; }

/* ══ PRAZOS: FILTROS ══ */
.pz-filters {
  display: flex; flex-direction: column; gap: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px; padding: 14px 16px;
}
.pz-filter-group { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.pz-filter-label {
  font-size: 0.71rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: rgba(255,255,255,0.35);
  width: 72px; flex-shrink: 0;
}
.pz-filter-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.pz-filter-btn {
  padding: 5px 13px; border-radius: 20px; font-size: 0.78rem; font-weight: 600;
  font-family: inherit; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.55);
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}
.pz-filter-btn:hover { background: rgba(255,255,255,0.1); color: white; }
.pz-filter-btn--active {
  background: rgba(90,184,46,0.18); border-color: rgba(90,184,46,0.5);
  color: #86efac;
}
.pz-filter-btn--active.pz-filter-btn--urgente { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.5); color: #fca5a5; }
.pz-filter-btn--active.pz-filter-btn--priorizar { background: rgba(245,158,11,0.18); border-color: rgba(245,158,11,0.5); color: #fcd34d; }
.pz-filter-btn--active.pz-filter-btn--tempo { background: rgba(99,102,241,0.18); border-color: rgba(99,102,241,0.5); color: #a5b4fc; }

/* ══ PRAZOS: CARD REDESIGN ══ */
.prazo-card { align-items: stretch; }
.prazo-card-meta { color: rgba(255,255,255,0.38); font-size: 0.74rem; margin-top: 3px; }
.prazo-time-bar {
  height: 4px; background: rgba(255,255,255,0.1);
  border-radius: 4px; margin-top: 10px; overflow: hidden;
}
.prazo-time-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }

.prazo-dias {
  text-align: center; flex-shrink: 0; width: 80px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.prazo-dias-num   { font-size: 1.6rem; font-weight: 900; line-height: 1; }
.prazo-dias-label { font-size: 0.65rem; color: rgba(255,255,255,0.4); margin-top: 2px; text-align: center; }

.prazo-card-right {
  flex-shrink: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 6px; padding-left: 8px;
}
.prazo-dots {
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.prazo-concluir-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 8px;
  background: transparent; border: 1px solid transparent;
  color: rgba(255,255,255,0.2); cursor: pointer;
  transition: all 0.15s;
}
.prazo-concluir-btn:hover {
  background: rgba(90,184,46,0.12);
  border-color: rgba(90,184,46,0.35);
  color: #5ab82e;
}
.prazo-excluir-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 8px;
  background: transparent; border: 1px solid transparent;
  color: rgba(255,255,255,0.2); cursor: pointer;
  transition: all 0.15s;
}
.prazo-excluir-btn:hover {
  background: rgba(239,68,68,0.12);
  border-color: rgba(239,68,68,0.35);
  color: #f87171;
}

/* ══ DIALOG DE PRAZO ══ */
.prazo-dialog {
  background: linear-gradient(160deg, #0d1f3c, #0f2550);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 28px;
  width: 380px;
  max-width: 95vw;
}
.prazo-dialog-header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
}
.prazo-dialog-title {
  color: white; font-size: 1.1rem; font-weight: 800; line-height: 1;
}
.prazo-dialog-sub {
  color: rgba(255,255,255,0.4); font-size: 0.78rem; margin-top: 3px;
}

.prazo-opts { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }

.prazo-opt {
  display: flex; align-items: center; gap: 14px;
  background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 14px; padding: 14px 16px;
  cursor: pointer; text-align: left; font-family: inherit;
  transition: background 0.2s, border-color 0.2s, transform 0.15s;
  width: 100%;
}
.prazo-opt:hover { transform: translateX(4px); }
.prazo-opt-indicator {
  width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0;
}
.prazo-opt--normal    { border-color: rgba(34,197,94,0.25); }
.prazo-opt--normal:hover { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.5); }
.prazo-opt--normal    .prazo-opt-indicator { background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.6); }

.prazo-opt--priorizar { border-color: rgba(245,158,11,0.25); }
.prazo-opt--priorizar:hover { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.5); }
.prazo-opt--priorizar .prazo-opt-indicator { background: #f59e0b; box-shadow: 0 0 8px rgba(245,158,11,0.6); }

.prazo-opt--urgente { border-color: rgba(239,68,68,0.25); }
.prazo-opt--urgente:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.5); }
.prazo-opt--urgente .prazo-opt-indicator { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.6); }

.prazo-opt-label { color: white; font-size: 0.92rem; font-weight: 700; }
.prazo-opt-desc  { color: rgba(255,255,255,0.4); font-size: 0.75rem; margin-top: 2px; }
.prazo-opt-arrow { color: rgba(255,255,255,0.25); margin-left: auto; flex-shrink: 0; }

.prazo-cancel {
  width: 100%; padding: 10px; border-radius: 10px;
  background: transparent; border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.4); font-size: 0.82rem; font-weight: 600;
  font-family: inherit; cursor: pointer; transition: background 0.2s, color 0.2s;
}
.prazo-cancel:hover { background: rgba(255,255,255,0.06); color: white; }

/* ══ DIALOG COMPLEMENTAR ══ */
.compl-dialog {
  width: 520px; max-width: 95vw; max-height: 85vh;
  background: #0f1923;
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 20px; padding: 28px; display: flex; flex-direction: column; gap: 20px;
  overflow: hidden;
}
.compl-dialog-header {
  display: flex; align-items: flex-start; gap: 14px;
}
.compl-dialog-title { color: white; font-size: 1.1rem; font-weight: 800; }
.compl-dialog-sub   { color: rgba(255,255,255,0.45); font-size: 0.82rem; margin-top: 2px; }
.compl-fields {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 12px; overflow-y: auto; max-height: 50vh;
  padding-right: 4px;
}
@media (max-width: 520px) { .compl-fields { grid-template-columns: 1fr; } }
.compl-field { display: flex; flex-direction: column; gap: 5px; }
.compl-label {
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.04em; color: rgba(255,255,255,0.5);
}
.compl-input {
  background: rgba(255,255,255,0.06);
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 9px; padding: 9px 12px;
  color: white; font-size: 0.9rem; font-family: inherit;
  transition: border-color 0.2s;
}
.compl-input:focus { outline: none; border-color: #5ab82e; }
.compl-input::placeholder { color: rgba(255,255,255,0.25); }
.compl-actions {
  display: flex; gap: 10px; margin-top: 4px;
}
.compl-actions .prazo-cancel { width: auto; flex: 1; }
.compl-actions .rp-btn-concluir { flex: 2; }

/* ══ CONTROLE ══ */
.controle-page { animation: card-in 0.3s ease both; }

.ctrl-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
@media (max-width: 800px) { .ctrl-grid { grid-template-columns: 1fr; } }

.ctrl-card {
  display: flex; flex-direction: column; align-items: flex-start;
  gap: 10px; padding: 28px;
  background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(255,255,255,0.09);
  border-radius: 18px;
  cursor: pointer; text-align: left; font-family: inherit;
  transition: background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.ctrl-card:hover {
  background: rgba(90,184,46,0.06);
  border-color: rgba(90,184,46,0.45);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.3);
}
.ctrl-card--baixa:hover {
  background: rgba(239,68,68,0.05);
  border-color: rgba(239,68,68,0.4);
}
.ctrl-card-icon {
  width: 58px; height: 58px; border-radius: 15px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.ctrl-card-label { color: white; font-size: 1.15rem; font-weight: 800; }
.ctrl-card-desc  { color: rgba(255,255,255,0.42); font-size: 0.82rem; line-height: 1.4; }
.ctrl-card-go {
  display: flex; align-items: center; gap: 6px;
  margin-top: 10px; color: #5ab82e;
  font-size: 0.82rem; font-weight: 700;
  transition: gap 0.2s;
}
.ctrl-card:hover .ctrl-card-go { gap: 10px; }
.ctrl-card-go--baixa { color: #ef4444; }

.ctrl-consultar-wrap { margin-top: 16px; }
.ctrl-btn--consultar {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 22px; border-radius: 10px;
  font-size: 0.88rem; font-weight: 700; font-family: inherit;
  cursor: pointer;
  background: rgba(59,130,246,0.08);
  border: 1.5px solid rgba(59,130,246,0.35);
  color: #3b82f6;
  transition: background 0.15s, border-color 0.15s, transform 0.15s;
}
.ctrl-btn--consultar:hover {
  background: rgba(59,130,246,0.16);
  border-color: rgba(59,130,246,0.6);
  transform: translateY(-1px);
}

.ctrl-selected {
  background: rgba(90,184,46,0.06);
  border: 1px solid rgba(90,184,46,0.2);
  border-radius: 14px; padding: 20px;
}
.ctrl-selected-title {
  display: flex; align-items: center; gap: 8px;
  color: rgba(255,255,255,0.7); font-size: 0.88rem;
}
.ctrl-selected-title strong { color: white; font-weight: 800; }

/* ══ GUIA DE ETAPAS ══ */
.et-guia-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 20px; flex-wrap: wrap; margin-bottom: 18px;
}

/* Caixa fixa empresa + protocolo */
.et-info-fixa {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  background: rgba(13, 31, 60, 0.95);
  border: 1px solid rgba(90, 184, 46, 0.35);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  min-width: 220px;
  max-width: 320px;
}
.et-info-fixa-item {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.et-info-fixa-icon { color: #5ab82e; flex-shrink: 0; }
.et-info-fixa-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}
.et-info-fixa-valor {
  font-size: 0.82rem;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.et-info-fixa-copy {
  flex-shrink: 0;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  width: 26px; height: 26px;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}
.et-info-fixa-copy:hover { background: rgba(90,184,46,0.2); }
.et-guia-title { color: white; font-size: 1.05rem; font-weight: 800; }
.et-guia-sub   { color: rgba(255,255,255,0.4); font-size: 0.78rem; margin-top: 2px; }
.et-guia-progress { display: flex; align-items: center; gap: 10px; min-width: 200px; }
.et-guia-track {
  flex: 1; height: 7px; border-radius: 4px;
  background: rgba(255,255,255,0.1); overflow: hidden;
}
.et-guia-fill {
  height: 100%; border-radius: 4px;
  background: linear-gradient(90deg, #5ab82e, #86efac);
  transition: width 0.4s ease;
}
.et-guia-fill--baixa {
  background: linear-gradient(90deg, #ef4444, #fca5a5);
}
.et-guia-pct { color: #5ab82e; font-size: 0.85rem; font-weight: 800; min-width: 38px; text-align: right; }

.et-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
@media (max-width: 1400px) { .et-list { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 800px)  { .et-list { grid-template-columns: 1fr; } }

.et-card {
  display: flex; flex-direction: column; gap: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px; padding: 14px 16px;
  transition: border-color 0.2s, background 0.2s;
}
.et-card--concluida     { border-color: rgba(34,197,94,0.35);  background: rgba(34,197,94,0.05); }
.et-card--nao_concluida { border-color: rgba(239,68,68,0.35);  background: rgba(239,68,68,0.05); }

.et-card-top { display: flex; align-items: center; gap: 10px; }

.et-num {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.6); font-size: 0.78rem; font-weight: 800;
}
.et-num--concluida     { background: #22c55e; border-color: #22c55e; color: white; }
.et-num--nao_concluida { background: #ef4444; border-color: #ef4444; color: white; }
.et-num--pendente      { background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.4); color: #fcd34d; }

.et-titulo-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.et-titulo { color: white; font-size: 0.86rem; font-weight: 700; line-height: 1.3; }
.et-concluida-em { display: flex; align-items: center; gap: 3px; font-size: 0.7rem; color: #5ab82e; opacity: 0.9; }

.et-campo { width: 100%; }
.et-autocomplete { position: relative; width: 100%; }
.et-sugest-list {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: #0f2040; border: 1px solid rgba(90,184,46,0.3);
  border-radius: 10px; z-index: 200;
  max-height: 220px; overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.et-sugest-item {
  display: flex; align-items: center; gap: 8px;
  width: 100%; text-align: left;
  padding: 8px 12px; background: none; border: none;
  color: rgba(255,255,255,0.85); font-size: 0.82rem; font-family: inherit;
  cursor: pointer; transition: background 0.15s;
}
.et-sugest-item:hover { background: rgba(90,184,46,0.12); color: white; }
.et-sugest-icon { color: rgba(90,184,46,0.6); flex-shrink: 0; }
.et-input, .et-select {
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 9px; padding: 8px 12px;
  color: white; font-size: 0.82rem; font-family: inherit;
  outline: none; transition: border-color 0.2s;
}
.et-input:focus, .et-select:focus { border-color: rgba(90,184,46,0.5); }
.et-toggle-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.et-carimbo {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 9px; width: 100%;
  background: rgba(90,184,46,0.1); border: 1px solid rgba(90,184,46,0.35);
  color: #5ab82e; font-size: 0.82rem; font-weight: 600;
}
.et-carimbo--vazio {
  background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.3); font-weight: 400;
}
.et-toggle-btn {
  padding: 5px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700;
  font-family: inherit; cursor: pointer; letter-spacing: 0.03em;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.45); transition: all 0.15s;
}
.et-toggle-btn:hover { background: rgba(255,255,255,0.1); color: white; }
.et-toggle-btn--ativo { background: rgba(90,184,46,0.18); border-color: rgba(90,184,46,0.5); color: #86efac; }
.et-input::placeholder { color: rgba(255,255,255,0.22); }
.et-select { cursor: pointer; appearance: auto; }
.et-select option { background: #0d1f3c; color: white; }
.et-input[type="date"] { color-scheme: dark; }

.et-status-btns { display: flex; gap: 5px; flex-shrink: 0; }
.et-st-btn {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-family: inherit;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.4); cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}
.et-st-btn:hover { color: white; background: rgba(255,255,255,0.1); }
.et-st-btn--ok.et-st-active   { background: rgba(34,197,94,0.18);  border-color: rgba(34,197,94,0.5);  color: #86efac; }
.et-st-btn--nao.et-st-active  { background: rgba(239,68,68,0.18);  border-color: rgba(239,68,68,0.5);  color: #fca5a5; }
.et-st-btn--pend.et-st-active { background: rgba(245,158,11,0.18); border-color: rgba(245,158,11,0.5); color: #fcd34d; }

.et-obs {
  display: flex; align-items: center; gap: 8px;
  margin-top: auto; padding-top: 8px;
  border-top: 1px dashed rgba(255,255,255,0.08);
}
.et-obs-icon { color: rgba(255,255,255,0.25); flex-shrink: 0; }
.et-obs-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: rgba(255,255,255,0.8); font-size: 0.8rem; font-family: inherit;
}
.et-obs-input::placeholder { color: rgba(255,255,255,0.2); }

/* ══ ANEXOS DE DOCUMENTOS ══ */
.et-anexos {
  margin-top: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  overflow: hidden;
}
.et-anx-titulo {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 12px;
  background: rgba(255,255,255,0.04);
  font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em;
  color: rgba(255,255,255,0.5); text-transform: uppercase;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.et-anx-cats { display: flex; flex-direction: column; }
.et-anx-contador {
  font-size: 0.7rem; font-weight: 700;
  background: rgba(90,184,46,0.2); color: #5ab82e;
  border-radius: 10px; padding: 1px 7px; margin-left: 6px;
}
.et-anx-cat {
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding: 7px 12px;
}
.et-anx-cat:last-child { border-bottom: none; }
.et-anx-cat-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 4px;
}
.et-anx-cat-label {
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.03em;
  color: rgba(255,255,255,0.55);
}
.et-anx-add-btn {
  width: 22px; height: 22px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(90,184,46,0.12); border: 1px solid rgba(90,184,46,0.25);
  color: #5ab82e; cursor: pointer; transition: background 0.15s;
}
.et-anx-add-btn:hover { background: rgba(90,184,46,0.25); }
.et-anx-files { display: flex; flex-direction: column; gap: 3px; }
.et-anx-file {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 7px; border-radius: 6px;
  background: rgba(255,255,255,0.04);
}
.et-anx-file-icon { color: rgba(90,184,46,0.7); flex-shrink: 0; }
.et-anx-file-nome {
  flex: 1; min-width: 0;
  font-size: 0.76rem; color: rgba(255,255,255,0.8);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  cursor: pointer;
}
.et-anx-file-nome:hover { color: #5ab82e; text-decoration: underline; }
.et-anx-file-size {
  font-size: 0.68rem; color: rgba(255,255,255,0.3); flex-shrink: 0;
}
.et-anx-del-btn {
  width: 18px; height: 18px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none;
  color: rgba(255,255,255,0.25); cursor: pointer; transition: color 0.15s;
}
.et-anx-del-btn:hover { color: #ef4444; }
.et-anx-empty {
  font-size: 0.72rem; color: rgba(255,255,255,0.2); padding: 2px 0;
  font-style: italic;
}

/* ══ VIEW: CONSULTAR ══ */
.cons-page { width: 100%; }

.cons-search-wrap {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px; padding: 10px 14px;
  transition: border-color 0.2s;
}
.cons-search-wrap:focus-within { border-color: rgba(90,184,46,0.4); }
.cons-search-icon { color: rgba(255,255,255,0.3); flex-shrink: 0; }
.cons-search-input {
  flex: 1; background: none; border: none; outline: none;
  color: white; font-size: 0.88rem; font-family: inherit;
}
.cons-search-input::placeholder { color: rgba(255,255,255,0.25); }
.cons-search-clear {
  background: none; border: none; color: rgba(255,255,255,0.3);
  cursor: pointer; padding: 0; line-height: 1;
}
.cons-search-clear:hover { color: white; }

.cons-list { display: flex; flex-direction: column; gap: 10px; }
.cons-card {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 14px 18px; border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  transition: background 0.15s;
}
.cons-card:hover { background: rgba(255,255,255,0.07); }
.cons-card--clicavel { cursor: pointer; }
.cons-card--clicavel:hover { background: rgba(90,184,46,0.07); border-color: rgba(90,184,46,0.25); }
.cons-card--concluido  { border-left: 3px solid rgba(34,197,94,0.6); }
.cons-card--andamento  { border-left: 3px solid rgba(251,191,36,0.6); }
.cons-card--nao_iniciado { border-left: 3px solid rgba(255,255,255,0.15); }
.cons-continuar-btn {
  display: flex; align-items: center; gap: 4px; margin-top: 6px;
  padding: 4px 10px; border-radius: 7px;
  background: rgba(90,184,46,0.15); color: #5ab82e;
  font-size: 0.72rem; font-weight: 700;
}
.cons-continuar-btn--ver {
  background: rgba(96,165,250,0.12); color: #60a5fa;
}
.cons-docs-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 8px;
  background: rgba(99,179,237,0.1); border: 1px solid rgba(99,179,237,0.2);
  color: rgba(99,179,237,0.85); font-size: 0.72rem; font-weight: 600;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.cons-docs-btn:hover {
  background: rgba(99,179,237,0.2); border-color: rgba(99,179,237,0.45);
  color: #63b3ed;
}
.cons-email-btn {
  position: relative;
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 8px;
  background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.2);
  color: rgba(96,165,250,0.85); font-size: 0.72rem; font-weight: 600;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.cons-email-btn:hover {
  background: rgba(96,165,250,0.2); border-color: rgba(96,165,250,0.45);
  color: #60a5fa;
}
.cons-email-btn--agendado {
  background: rgba(245,158,11,0.12);
  border-color: rgba(245,158,11,0.3);
  color: #f59e0b;
}
.cons-email-btn--agendado:hover {
  background: rgba(245,158,11,0.2);
  border-color: rgba(245,158,11,0.5);
  color: #fbbf24;
}
.cons-email-badge {
  position: absolute; top: -4px; right: -4px;
  width: 8px; height: 8px; border-radius: 50%;
  background: #f59e0b;
  border: 1.5px solid #0d1b3e;
}
.cons-excluir-btn {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 7px;
  background: transparent; border: 1px solid rgba(239,68,68,0.25);
  color: rgba(239,68,68,0.5); cursor: pointer; transition: all 0.15s;
  flex-shrink: 0;
}
.cons-excluir-btn:hover {
  background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.5);
  color: #ef4444;
}

/* ── Dialog E-mail ── */
.email-dialog {
  width: 480px; max-width: 96vw;
  background: #0f1e3a; border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 24px 60px rgba(0,0,0,0.55);
  overflow: hidden;
}
.email-dialog-header {
  display: flex; align-items: center; gap: 8px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.email-dialog-title { color: #fff; font-size: 0.95rem; font-weight: 700; }
.email-dialog-sub   { color: rgba(255,255,255,0.4); font-size: 0.8rem; }
.email-tabs {
  display: flex; gap: 0;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.email-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px; background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.4); font-size: 0.78rem; font-weight: 600;
  transition: all 0.15s; font-family: inherit;
}
.email-tab:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.04); }
.email-tab--active { color: #60a5fa; border-bottom: 2px solid #60a5fa; }
.email-form { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
.email-field { display: flex; flex-direction: column; gap: 5px; }
.email-field--half { flex: 1; }
.email-label { color: rgba(255,255,255,0.55); font-size: 0.75rem; font-weight: 600; }
.email-destinatarios {
  display: flex; flex-wrap: wrap; gap: 6px;
  background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 9px; padding: 8px 10px;
}
.email-dest-chip {
  font-size: 0.72rem; font-weight: 600;
  color: rgba(255,255,255,0.65);
  background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.2);
  border-radius: 20px; padding: 2px 8px;
  white-space: nowrap;
}
.email-input {
  background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 9px; padding: 9px 12px; color: #fff; font-size: 0.85rem;
  font-family: inherit; outline: none; transition: border-color 0.15s;
  color-scheme: dark;
}
.email-input:focus { border-color: #3b82f6; }
.email-textarea {
  background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 9px; padding: 9px 12px; color: #fff; font-size: 0.85rem;
  font-family: inherit; outline: none; resize: vertical; min-height: 90px;
  transition: border-color 0.15s;
}
.email-textarea:focus { border-color: #3b82f6; }
.email-schedule-row { display: flex; gap: 10px; }
.email-agendados { margin-top: 4px; padding: 10px 12px; background: rgba(255,255,255,0.04); border-radius: 9px; }
.email-agendados-title { color: rgba(255,255,255,0.4); font-size: 0.7rem; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
.email-ag-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.email-ag-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.email-ag-para { color: rgba(255,255,255,0.75); font-size: 0.78rem; }
.email-ag-data { color: rgba(255,255,255,0.35); font-size: 0.7rem; }
.email-ag-del { background: none; border: none; cursor: pointer; color: rgba(239,68,68,0.5); display: flex; align-items: center; padding: 2px; }
.email-ag-del:hover { color: #ef4444; }
.email-dialog-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 12px 18px 16px;
  border-top: 1px solid rgba(255,255,255,0.07);
}
.email-cancel-btn {
  background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.4);
  font-size: 0.82rem; font-family: inherit; padding: 6px 12px; border-radius: 8px;
  transition: color 0.15s;
}
.email-cancel-btn:hover { color: rgba(255,255,255,0.75); }
.email-send-btn {
  display: flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg, #1a3fa0, #2563eb); border: none;
  color: #fff; font-size: 0.82rem; font-weight: 700; font-family: inherit;
  padding: 8px 18px; border-radius: 9px; cursor: pointer;
  transition: box-shadow 0.2s; box-shadow: 0 4px 12px rgba(37,99,235,0.35);
}
.email-send-btn:hover:not(:disabled) { box-shadow: 0 6px 18px rgba(37,99,235,0.5); }
.email-send-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Dialog Documentos ── */
.docs-dialog {
  background: #1a2035; border-radius: 16px;
  padding: 24px; min-width: 480px; max-width: 620px; width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}
.docs-dialog-header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
  padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.docs-dialog-empresa { font-size: 1rem; font-weight: 700; color: #fff; }
.docs-dialog-sub { font-size: 0.75rem; color: rgba(255,255,255,0.4); margin-top: 2px; }
.docs-dialog-titulo { flex: 1; }
.docs-empty {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 40px 0; color: rgba(255,255,255,0.3); font-size: 0.85rem; text-align: center;
}
.docs-empty p { margin: 0; }
.docs-cats { display: flex; flex-direction: column; gap: 16px; }
.docs-cat-label {
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em;
  color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 8px;
}
.docs-cat-files { display: flex; flex-direction: column; gap: 6px; }
.docs-file {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 10px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
}
.docs-file-icon { color: rgba(255,255,255,0.4); flex-shrink: 0; }
.docs-file-info { flex: 1; min-width: 0; }
.docs-file-nome { font-size: 0.82rem; color: #fff; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.docs-file-tamanho { font-size: 0.7rem; color: rgba(255,255,255,0.3); margin-top: 2px; }
.docs-file-acoes { display: flex; gap: 6px; flex-shrink: 0; }
.docs-btn-ver, .docs-btn-baixar, .docs-btn-del {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 8px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.15s;
}
.docs-btn-ver:hover { background: rgba(99,179,237,0.15); border-color: rgba(99,179,237,0.3); color: #63b3ed; }
.docs-btn-baixar:hover { background: rgba(90,184,46,0.15); border-color: rgba(90,184,46,0.3); color: #5ab82e; }
.docs-btn-del:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #ef4444; }

.cons-card-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
.cons-status-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
.cons-dot--concluido   { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.6); }
.cons-dot--andamento   { background: #fbbf24; box-shadow: 0 0 6px rgba(251,191,36,0.5); }
.cons-dot--nao_iniciado { background: rgba(255,255,255,0.2); }

.cons-info { min-width: 0; }
.cons-empresa {
  font-size: 0.92rem; font-weight: 700; color: white;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 4px; display: flex; align-items: center; gap: 8px;
}
.cons-empresa-proto {
  font-size: 0.72rem; font-weight: 600;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.02em; flex-shrink: 0;
}
.cons-copiar-btn {
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 5px; flex-shrink: 0;
  background: transparent; border: none;
  color: rgba(255,255,255,0.25); cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.cons-copiar-btn:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.08); }
.cons-meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.cons-meta-item {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.75rem; color: rgba(255,255,255,0.45);
}
.cons-data { color: rgba(255,255,255,0.3); }

.cons-card-right { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
.cons-pct-wrap { position: relative; width: 44px; height: 44px; }
.cons-ring { width: 44px; height: 44px; transform: rotate(-90deg); }
.cons-ring-bg  { fill: none; stroke: rgba(255,255,255,0.08); stroke-width: 3.8; }
.cons-ring-fill { fill: none; stroke-width: 3.8; stroke-linecap: round; transition: stroke-dasharray 0.4s; }
.cons-ring--concluido   { stroke: #22c55e; }
.cons-ring--andamento   { stroke: #fbbf24; }
.cons-ring--nao_iniciado { stroke: rgba(255,255,255,0.2); }
.cons-pct-num {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.62rem; font-weight: 700; color: white;
}
.cons-badge-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.cons-badge {
  padding: 4px 10px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.03em;
}
.cons-carimbo {
  border: 1px solid rgba(34,197,94,0.35);
  border-radius: 6px;
  padding: 5px 10px;
  background: rgba(34,197,94,0.06);
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.cons-carimbo-nome {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.68rem; font-weight: 700; color: #86efac;
  white-space: nowrap; letter-spacing: 0.02em;
}
.cons-carimbo-data {
  font-size: 0.6rem; color: rgba(134,239,172,0.6);
  white-space: nowrap; letter-spacing: 0.01em;
}
.cons-badge--concluido   { background: rgba(34,197,94,0.15);  color: #86efac; }
.cons-badge--andamento   { background: rgba(251,191,36,0.15); color: #fde68a; }
.cons-badge--nao_iniciado { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }

.cons-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 60px 0;
  color: rgba(255,255,255,0.25); font-size: 0.88rem;
}

/* ══ HISTÓRICO DE CONCLUSÕES ══ */
.hist-wrap {
  margin-top: 16px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; overflow: hidden;
}
.hist-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; cursor: pointer; user-select: none;
  background: rgba(255,255,255,0.04);
  transition: background 0.15s;
}
.hist-header:hover { background: rgba(255,255,255,0.07); }
.hist-header-left { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 700; color: rgba(255,255,255,0.6); }
.hist-badge {
  background: rgba(90,184,46,0.2); color: #5ab82e;
  font-size: 0.7rem; font-weight: 700;
  padding: 1px 7px; border-radius: 10px;
}
.hist-list { display: flex; flex-direction: column; }
.hist-item {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid rgba(255,255,255,0.05);
  transition: background 0.15s;
}
.hist-item:hover { background: rgba(255,255,255,0.03); }
.hist-item-main { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.hist-empresa { font-size: 0.86rem; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hist-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.hist-protocolo, .hist-local {
  display: flex; align-items: center; gap: 3px;
  font-size: 0.74rem; color: rgba(255,255,255,0.45);
}
.hist-protocolo { color: rgba(90,184,46,0.7); }
.hist-item-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.hist-data { font-size: 0.72rem; color: rgba(255,255,255,0.3); white-space: nowrap; }
.hist-del-btn {
  width: 18px; height: 18px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; color: rgba(255,255,255,0.2);
  cursor: pointer; transition: color 0.15s;
}
.hist-del-btn:hover { color: #ef4444; }

/* ══ BOTÃO CONCLUIR GUIA ══ */
.et-concluir-wrap {
  display: flex; justify-content: center; align-items: center;
  gap: 14px; flex-wrap: wrap;
  padding: 32px 0 16px;
}
.et-concluir-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 36px; border-radius: 14px;
  background: linear-gradient(135deg, #5ab82e, #3d8a1e);
  border: none; color: white; font-size: 1rem; font-weight: 700;
  font-family: inherit; letter-spacing: 0.04em; cursor: pointer;
  box-shadow: 0 4px 20px rgba(90,184,46,0.35);
  transition: opacity 0.2s, transform 0.15s;
}
.et-concluir-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-2px); }
.et-concluir-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.et-concluir-btn--depois {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 28px; border-radius: 14px;
  background: transparent;
  border: 2px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7);
  font-size: 1rem; font-weight: 600;
  font-family: inherit; letter-spacing: 0.04em; cursor: pointer;
  transition: border-color 0.2s, color 0.2s, transform 0.15s;
}
.et-concluir-btn--depois:hover:not(:disabled) { border-color: rgba(255,255,255,0.5); color: #fff; transform: translateY(-2px); }
.et-concluir-btn--depois:disabled { opacity: 0.4; cursor: not-allowed; }

/* ══ ARQUIVAMENTO DE INFORMAÇÕES — dropdown com upload ══ */
.et-arquiv {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 4px;
}
.et-arquiv-lista-toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.6);
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  text-align: left;
}
.et-arquiv-lista-toggle:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.18);
  color: white;
}
.et-arquiv-item {
  border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.08);
  overflow: hidden;
  transition: border-color 0.15s;
}
.et-arquiv-item--hasfiles {
  border-color: rgba(90,184,46,0.3);
}
.et-arquiv-head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 12px;
  background: rgba(255,255,255,0.03);
}
.et-arquiv-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 7px;
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.55);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  white-space: nowrap;
}
.et-arquiv-toggle-btn:hover {
  background: rgba(255,255,255,0.12);
  color: white;
}
.et-arquiv-toggle-btn--open {
  background: rgba(59,130,246,0.15);
  border-color: rgba(59,130,246,0.35);
  color: #60a5fa;
}
.et-arquiv-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: rgba(255,255,255,0.18);
  flex-shrink: 0;
  transition: background 0.2s, box-shadow 0.2s;
}
.et-arquiv-dot--done {
  background: #5ab82e;
  box-shadow: 0 0 6px rgba(90,184,46,0.55);
}
.et-arquiv-label {
  flex: 1;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  letter-spacing: 0.04em;
}
.et-arquiv-badge {
  font-size: 0.62rem;
  font-weight: 800;
  background: #5ab82e;
  color: #fff;
  border-radius: 10px;
  padding: 1px 7px;
}
.et-arquiv-body {
  padding: 10px 12px;
  background: rgba(0,0,0,0.18);
}
.et-arquiv-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  padding: 5px 14px;
  border-radius: 7px;
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(59,130,246,0.12);
  border: 1px solid rgba(59,130,246,0.28);
  color: #60a5fa;
  cursor: pointer;
  transition: background 0.15s;
}
.et-arquiv-upload-btn:hover { background: rgba(59,130,246,0.22); }
.et-arquiv-upload-btn--disabled { opacity: 0.4; cursor: not-allowed; }

.et-arquiv-outros-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}
.et-arquiv-outros-input {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 7px;
  padding: 6px 10px;
  font-size: 0.75rem;
  font-family: inherit;
  color: white;
  outline: none;
  transition: border-color 0.15s;
}
.et-arquiv-outros-input::placeholder { color: rgba(255,255,255,0.3); }
.et-arquiv-outros-input:focus { border-color: rgba(59,130,246,0.5); }

/* ══ EMAILS DA BAIXA ══ */
.et-emails {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.et-email-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(59,130,246,0.07);
  border: 1px solid rgba(59,130,246,0.18);
}
.et-email-icon { color: #60a5fa; flex-shrink: 0; }
.et-email-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}
.et-email-nome {
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(255,255,255,0.75);
}
.et-email-addr {
  font-size: 0.68rem;
  color: #60a5fa;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.et-email-copy {
  background: rgba(59,130,246,0.15);
  border: 1px solid rgba(59,130,246,0.25);
  border-radius: 6px;
  color: #60a5fa;
  padding: 4px 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}
.et-email-copy:hover { background: rgba(59,130,246,0.28); }

/* ══ SUB-ITENS: ATIVAR NO ESTADO ══ */
.et-estado-subs {
  margin-top: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; overflow: hidden;
}
.et-sub-titulo {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 12px;
  background: rgba(255,255,255,0.04);
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em;
  color: rgba(255,255,255,0.45); text-transform: uppercase;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.et-sub-item {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex; flex-direction: column; gap: 6px;
}
.et-sub-item:last-child { border-bottom: none; }
.et-sub-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.et-sub-label { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.7); flex: 1; }
.et-sub-acoes { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.et-sub-btn {
  padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;
  font-family: inherit; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4);
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.et-sub-sim.et-sub-btn--ativo     { background: rgba(34,197,94,0.18); border-color: rgba(34,197,94,0.5); color: #86efac; }
.et-sub-nao.et-sub-btn--ativo-nao { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.5); color: #fca5a5; }
.et-sub-arq { display: flex; align-items: center; gap: 3px; }
.et-sub-arq:hover { background: rgba(90,184,46,0.12); border-color: rgba(90,184,46,0.3); color: #5ab82e; }
.et-sub-files { display: flex; flex-direction: column; gap: 3px; padding-left: 4px; }
.et-sub-file {
  display: flex; align-items: center; gap: 6px;
  padding: 3px 6px; border-radius: 5px;
  background: rgba(255,255,255,0.03);
}
.et-sub-file-nome {
  flex: 1; min-width: 0; font-size: 0.74rem; color: rgba(255,255,255,0.75);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  cursor: pointer;
}
.et-sub-file-nome:hover { color: #5ab82e; text-decoration: underline; }
.et-sub-proto { margin-top: 2px; font-size: 0.78rem; }

/* ══ BAIXA: lista de documentos ══ */
.bx-docs-lista { display: flex; flex-direction: column; gap: 5px; margin-top: 4px; }
.bx-doc-item {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 5px 8px; border-radius: 7px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
}
.bx-doc-nome { font-size: 0.78rem; color: rgba(255,255,255,0.75); flex: 1; }
.bx-doc-btns { display: flex; gap: 4px; flex-shrink: 0; }
.bx-doc-btn {
  width: 24px; height: 24px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.35); cursor: pointer; transition: background 0.15s, color 0.15s;
}
.bx-doc-btn--ok.et-st-active  { background: rgba(34,197,94,0.18); border-color: rgba(34,197,94,0.5); color: #86efac; }
.bx-doc-btn--falta.et-st-active { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.5); color: #fca5a5; }

/* ══ PAINEL DE NOTIFICAÇÕES ══ */
.notif-panel {
  background: linear-gradient(160deg, #0d1f3c, #0f2550);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  width: 320px;
  overflow: hidden;
}
.notif-panel-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.notif-panel-title {
  color: white; font-size: 0.9rem; font-weight: 800;
}
.notif-ativar-btn {
  font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 20px;
  background: rgba(90,184,46,0.15); border: 1px solid rgba(90,184,46,0.4);
  color: #5ab82e; cursor: pointer; font-family: inherit;
  transition: background 0.2s;
}
.notif-ativar-btn:hover { background: rgba(90,184,46,0.25); }

.notif-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 28px 16px;
  color: rgba(255,255,255,0.4); font-size: 0.82rem;
}

.notif-list { max-height: 320px; overflow-y: auto; }
.notif-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  transition: background 0.15s;
}
.notif-item:hover { background: rgba(255,255,255,0.05); }
.notif-item:last-child { border-bottom: none; }

.notif-item-icon {
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.notif-item--urgente .notif-item-icon { background: rgba(239,68,68,0.15); color: #ef4444; }
.notif-item--aviso   .notif-item-icon { background: rgba(245,158,11,0.15); color: #f59e0b; }

.notif-item-body { flex: 1; min-width: 0; }
.notif-item-nome { color: white; font-size: 0.82rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.notif-item-desc { color: rgba(255,255,255,0.45); font-size: 0.72rem; margin-top: 1px; }

.notif-item-badge { font-size: 1rem; flex-shrink: 0; }

.notif-panel-foot {
  padding: 10px 16px;
  border-top: 1px solid rgba(255,255,255,0.07);
}
.notif-ver-btn {
  display: flex; align-items: center; gap: 2px; width: 100%;
  justify-content: center; background: none; border: none;
  color: #5ab82e; font-size: 0.78rem; font-weight: 700;
  cursor: pointer; font-family: inherit; transition: opacity 0.2s;
}
.notif-ver-btn:hover { opacity: 0.7; }

/* ══ CONFIG BTN ══ */
.rp-btn-config {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, color 0.2s;
}
.rp-btn-config:hover { background: rgba(255,255,255,0.12); color: white; }

/* ══ CONFIG DIALOG ══ */
.cfg-dialog {
  background: linear-gradient(160deg, #0d1f3c, #0f2550);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px; padding: 28px;
  width: 420px; max-width: 95vw;
}
.cfg-dialog-head {
  display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
}
.cfg-dialog-title { color: white; font-size: 1.05rem; font-weight: 800; }
.cfg-dialog-sub   { color: rgba(255,255,255,0.4); font-size: 0.76rem; margin-top: 2px; }

.cfg-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
.cfg-field  { display: flex; flex-direction: column; gap: 5px; }
.cfg-label  { color: rgba(255,255,255,0.55); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; }
.cfg-input {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px; padding: 10px 14px;
  color: white; font-size: 0.88rem; font-family: inherit;
  outline: none; transition: border-color 0.2s;
}
.cfg-input:focus  { border-color: rgba(90,184,46,0.5); }
.cfg-input::placeholder { color: rgba(255,255,255,0.2); }
.cfg-hint { color: rgba(255,255,255,0.3); font-size: 0.7rem; }
.cfg-info-box {
  display: flex; gap: 8px; align-items: flex-start;
  background: rgba(90,184,46,0.08); border: 1px solid rgba(90,184,46,0.25);
  border-radius: 10px; padding: 10px 12px;
  font-size: 0.78rem; line-height: 1.45; color: rgba(255,255,255,0.7);
}
.cfg-info-box code {
  background: rgba(255,255,255,0.1); border-radius: 4px;
  padding: 1px 5px; font-size: 0.72rem; color: #a3e635;
}
.cfg-provider-row { display: flex; gap: 8px; margin-bottom: 12px; }
.cfg-provider-btn {
  flex: 1; display: flex; align-items: center; gap: 7px;
  padding: 9px 12px; border-radius: 8px; border: 1.5px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6);
  font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.18s;
}
.cfg-provider-btn:hover { border-color: rgba(255,255,255,0.25); color: #fff; }
.cfg-provider-btn--active { border-color: #25d366; background: rgba(37,211,102,0.1); color: #fff; }
.cfg-provider-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.cfg-provider-tag {
  margin-left: 4px; font-size: 0.62rem; background: #25d366; color: #000;
  border-radius: 4px; padding: 1px 5px; font-weight: 700;
}
.cfg-section-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.68rem; font-weight: 800; letter-spacing: 0.1em;
  text-transform: uppercase; color: #5ab82e;
  padding-bottom: 2px; border-bottom: 1px solid rgba(90,184,46,0.2);
}

/* ══ MODAL: ENVIO RELATÓRIO BAIXA ══ */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.22s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.env-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.72);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.env-modal {
  background: linear-gradient(160deg, #0d1f3c 0%, #091530 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 18px;
  padding: 24px;
  width: 100%; max-width: 400px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.6);
}
.env-modal-head {
  display: flex; align-items: center; gap: 14px;
  margin-bottom: 24px;
}
.env-check-icon {
  width: 48px; height: 48px; border-radius: 14px;
  background: linear-gradient(135deg, #5ab82e, #3d8a1e);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; box-shadow: 0 4px 16px rgba(90,184,46,0.35);
}
.env-modal-title {
  font-size: 1rem; font-weight: 800; color: white; line-height: 1.2;
}
.env-modal-sub {
  font-size: 0.75rem; color: rgba(255,255,255,0.45); margin-top: 2px;
}
.env-close-btn {
  margin-left: auto; flex-shrink: 0;
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.4); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.env-close-btn:hover { background: rgba(255,255,255,0.12); color: white; }

/* ── Status list ── */
.env-status-list {
  display: flex; flex-direction: column; gap: 10px;
  margin-bottom: 24px;
}
.env-status-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
  transition: background 0.2s, border-color 0.2s;
}
.env-status-item--ok {
  background: rgba(90,184,46,0.08);
  border-color: rgba(90,184,46,0.3);
}
.env-status-item--error {
  background: rgba(239,68,68,0.08);
  border-color: rgba(239,68,68,0.25);
}
.env-status-item--skip {
  background: rgba(255,255,255,0.03);
  border-color: rgba(255,255,255,0.08);
  opacity: 0.6;
}
.env-status-item--sending {
  background: rgba(59,130,246,0.06);
  border-color: rgba(59,130,246,0.2);
}
.env-status-icon {
  width: 34px; height: 34px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.env-si--ok      { background: rgba(90,184,46,0.2);  color: #86efac; }
.env-si--error   { background: rgba(239,68,68,0.2);  color: #fca5a5; }
.env-si--sending { background: rgba(59,130,246,0.2); color: #93c5fd; }
.env-si--idle    { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.3); }
.env-status-label {
  flex: 1; font-size: 0.88rem; font-weight: 700; color: rgba(255,255,255,0.85);
}
.env-status-hint {
  font-size: 0.78rem; font-weight: 400; color: rgba(255,255,255,0.35); margin-left: 4px;
}
.env-si-check { color: #86efac; margin-left: auto; flex-shrink: 0; }
.env-si-x     { color: #fca5a5; margin-left: auto; flex-shrink: 0; }

/* ── Botão Fechar ── */
.env-fechar-btn {
  width: 100%; padding: 12px;
  border-radius: 10px; border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6);
  font-family: inherit; font-size: 0.85rem; font-weight: 700;
  cursor: pointer; transition: background 0.15s, color 0.15s;
}
.env-fechar-btn:hover { background: rgba(255,255,255,0.1); color: white; }

/* ══════════════════════════════════════
   LIGHT MODE OVERRIDES
   ══════════════════════════════════════ */

/* Fundo da página */
.wms-app--light .dash-page {
  background: linear-gradient(160deg, #dce8f7 0%, #e4edf8 50%, #d0dff2 100%) !important;
}

/* Textos principais */
.wms-app--light .page-title,
.wms-app--light .page-subtitle,
.wms-app--light .page-caption { color: #0f172a !important; }

/* Header mantém escuro */
.wms-app--light .wms-header { filter: none; }

/* ── Dashboard ── */
.wms-app--light .db-panel,
.wms-app--light .db-kpi-card,
.wms-app--light .db-stage {
  background: rgba(255,255,255,0.78) !important;
  border-color: rgba(15,23,42,0.09) !important;
  backdrop-filter: blur(8px);
}
.wms-app--light .db-stage-label { color: rgba(15,23,42,0.55) !important; }
.wms-app--light .db-stage-pct { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .db-stage--nao .db-stage-num { color: #334155 !important; }
.wms-app--light .db-stage-bar { background: rgba(15,23,42,0.09) !important; }
.wms-app--light .db-and-row {
  background: rgba(15,23,42,0.03) !important;
  border-color: rgba(15,23,42,0.08) !important;
}
.wms-app--light .db-and-nome { color: #0f172a !important; }
.wms-app--light .db-and-meta { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .db-and-bar-bg { background: rgba(15,23,42,0.1) !important; }
.wms-app--light .db-panel-head {
  border-bottom-color: rgba(15,23,42,0.07) !important;
}
.wms-app--light .db-panel-title,
.wms-app--light .db-critico-nome,
.wms-app--light .db-gauge-label,
.wms-app--light .db-pend-name { color: #0f172a !important; }
.wms-app--light .db-kpi-label { color: rgba(15,23,42,0.5) !important; }
.wms-app--light .db-kpi-sub,
.wms-app--light .db-critico-meta,
.wms-app--light .db-gauge-sub,
.wms-app--light .db-tl-label,
.wms-app--light .db-dist-label { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .db-tl-bar-bg,
.wms-app--light .db-dist-bar-wrap { background: rgba(15,23,42,0.09) !important; }
.wms-app--light .db-action-btn--secondary {
  background: rgba(15,23,42,0.06) !important;
  color: rgba(15,23,42,0.75) !important;
  border-color: rgba(15,23,42,0.12) !important;
}
.wms-app--light .db-empty { color: rgba(15,23,42,0.35) !important; }
.wms-app--light .db-pend-more { color: rgba(15,23,42,0.35) !important; }

/* Alerta de prazo */
.wms-app--light .db-alert-bar {
  background: rgba(239,68,68,0.1) !important;
  border-color: rgba(239,68,68,0.25) !important;
}

/* Linhas críticas */
.wms-app--light .db-critico-row {
  border-color: rgba(15,23,42,0.07) !important;
}
.wms-app--light .db-critico-row--vencido {
  background: rgba(239,68,68,0.06) !important;
  border-color: rgba(239,68,68,0.15) !important;
}
.wms-app--light .db-critico-row--urgente {
  background: rgba(239,68,68,0.04) !important;
  border-color: rgba(239,68,68,0.1) !important;
}
.wms-app--light .db-critico-row--priorizar {
  background: rgba(245,158,11,0.05) !important;
  border-color: rgba(245,158,11,0.1) !important;
}

/* ── Preferências ── */
.pref-page { animation: card-in 0.25s ease both; }
.pref-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 20px;
  align-items: start;
}
.pref-section-label {
  font-size: 0.68rem; font-weight: 800; letter-spacing: 0.12em;
  text-transform: uppercase; color: rgba(255,255,255,0.35);
  margin-bottom: 10px;
}
.pref-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 16px; padding: 20px;
}
.pref-card--muted { opacity: 0.7; }
.pref-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 14px 0; }
.pref-row {
  display: flex; align-items: center; gap: 14px;
}
.pref-row-left {
  display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;
}
.pref-row-icon-wrap {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.pref-row-label {
  color: white; font-size: 0.88rem; font-weight: 700;
}
.pref-row-desc {
  color: rgba(255,255,255,0.4); font-size: 0.73rem; margin-top: 1px;
}

/* Toggle escuro/claro */
.pref-theme-toggle {
  display: flex; background: rgba(255,255,255,0.07);
  border-radius: 10px; padding: 3px; gap: 2px; flex-shrink: 0;
}
.pref-theme-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px; border-radius: 8px; border: none;
  font-family: inherit; font-size: 0.78rem; font-weight: 700;
  cursor: pointer; transition: background 0.18s, color 0.18s;
  background: transparent; color: rgba(255,255,255,0.4);
}
.pref-theme-btn--active {
  background: #1e3a6e !important; color: white !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.pref-theme-btn--light {
  background: #ffffff !important; color: #0f172a !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* Preview miniatura */
.pref-preview-wrap { margin-top: 16px; }
.pref-preview {
  display: flex; height: 90px; border-radius: 10px; overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.35s ease;
}
.pref-preview--light { border-color: rgba(15,23,42,0.12); }
.pref-preview-sidebar {
  width: 28px; padding: 6px 5px; display: flex; flex-direction: column; gap: 5px;
  background: #080f2a; flex-shrink: 0;
}
.pref-preview-brand {
  height: 7px; border-radius: 3px; background: #5ab82e; margin-bottom: 3px;
}
.pref-preview-nav {
  height: 5px; border-radius: 3px; background: rgba(255,255,255,0.35);
}
.pref-preview-main { flex: 1; display: flex; flex-direction: column; gap: 5px; padding: 6px; transition: background 0.35s; }
.pref-preview:not(.pref-preview--light) .pref-preview-main { background: #0d1f5c; }
.pref-preview--light .pref-preview-main { background: #dce8f7; }
.pref-preview-topbar {
  height: 8px; border-radius: 3px; transition: background 0.35s;
}
.pref-preview:not(.pref-preview--light) .pref-preview-topbar { background: rgba(255,255,255,0.12); }
.pref-preview--light .pref-preview-topbar { background: rgba(255,255,255,0.7); }
.pref-preview-cards { display: flex; gap: 4px; }
.pref-preview-card {
  flex: 1; height: 20px; border-radius: 4px; transition: background 0.35s, border-color 0.35s;
  border: 1px solid;
}
.pref-preview:not(.pref-preview--light) .pref-preview-card { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.1); }
.pref-preview--light .pref-preview-card { background: rgba(255,255,255,0.82); border-color: rgba(15,23,42,0.1); }
.pref-preview-panel {
  flex: 1; border-radius: 4px; border: 1px solid; transition: background 0.35s, border-color 0.35s;
}
.pref-preview:not(.pref-preview--light) .pref-preview-panel { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); }
.pref-preview--light .pref-preview-panel { background: rgba(255,255,255,0.78); border-color: rgba(15,23,42,0.09); }
.pref-preview-label {
  font-size: 0.7rem; color: rgba(255,255,255,0.35); margin-top: 6px; text-align: center;
}
.pref-tag-soon {
  font-size: 0.65rem; font-weight: 800; padding: 3px 9px; border-radius: 20px;
  background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.35); flex-shrink: 0;
}

.pref-card-head {
  display: flex; align-items: flex-start; gap: 12px;
}
.pref-alerta-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.pref-alerta-num { font-size: 0.82rem; font-weight: 600; color: rgba(255,255,255,0.75); flex: 1; font-family: monospace; }
.pref-alerta-badge {
  font-size: 0.62rem; font-weight: 800; padding: 2px 8px; border-radius: 20px;
  background: rgba(37,211,102,0.15); color: #25d366; border: 1px solid rgba(37,211,102,0.3);
}
.pref-alerta-test-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 9px;
  background: rgba(37,211,102,0.12); color: #25d366;
  font-size: 0.78rem; font-weight: 700; font-family: inherit; cursor: pointer;
  border: 1px solid rgba(37,211,102,0.25); transition: background 0.18s;
}
.pref-alerta-test-btn:hover { background: rgba(37,211,102,0.22); }
.pref-alerta-cfg-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 12px; border-radius: 9px;
  background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.55);
  font-size: 0.75rem; font-weight: 600; font-family: inherit; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.1); transition: all 0.18s;
}
.pref-alerta-cfg-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

/* ══ RELATÓRIOS ══ */
.rl-page { animation: card-in 0.25s ease both; }

.rl-header {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 20px; flex-wrap: wrap;
}
.rl-title {
  font-size: 2rem; font-weight: 900; margin: 4px 0 2px; line-height: 1.1;
  background: linear-gradient(135deg, #ffffff 0%, #b8d4ff 60%, #a3e635 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.rl-subtitle { color: rgba(255,255,255,0.4); font-size: 0.85rem; margin: 0; font-weight: 600; }

.rl-controls { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
.rl-select {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px; padding: 8px 14px; color: rgba(255,255,255,0.8);
  font-size: 0.82rem; font-weight: 600; font-family: inherit; cursor: pointer;
  outline: none; transition: border-color 0.18s;
}
.rl-select:focus { border-color: #5ab82e; }
.rl-select option { background: #0d1f5c; color: white; }

.rl-export-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 10px; border: none;
  font-size: 0.8rem; font-weight: 700; font-family: inherit;
  cursor: pointer; transition: opacity 0.18s, transform 0.15s;
  flex-shrink: 0;
}
.rl-export-btn:hover { opacity: 0.85; transform: translateY(-1px); }
.rl-export-btn--pdf   { background: #dc2626; color: #fff; }
.rl-export-btn--excel { background: #16a34a; color: #fff; }

/* Stats bar */
.rl-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}
@media (max-width: 800px) { .rl-stats { grid-template-columns: repeat(3, 1fr); } }
.rl-stat-card {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
  border-radius: 14px; padding: 16px 18px; position: relative; overflow: hidden;
  border-top: 3px solid var(--st-cor);
}
.rl-stat-num   { font-size: 2rem; font-weight: 900; color: white; line-height: 1; }
.rl-stat-abbr  { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.1em; color: var(--st-cor); margin-top: 4px; }
.rl-stat-label { font-size: 0.7rem; color: rgba(255,255,255,0.35); margin-top: 2px; }

/* Seção */
.rl-section {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px; overflow: hidden;
}
.rl-section-head {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.02);
}
.rl-section-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.rl-section-title { font-size: 0.78rem; font-weight: 900; letter-spacing: 0.1em; color: white; }
.rl-section-label-full { font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 600; flex: 1; }
.rl-section-count {
  font-size: 0.72rem; font-weight: 800; background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5); border-radius: 20px; padding: 2px 10px;
}
.rl-empty {
  display: flex; align-items: center; gap: 8px; padding: 24px 20px;
  color: rgba(255,255,255,0.25); font-size: 0.82rem;
}
.rl-rows { display: flex; flex-direction: column; }
.rl-row {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: background 0.15s;
}
.rl-row:last-child { border-bottom: none; }
.rl-row:hover { background: rgba(255,255,255,0.03); }
.rl-row-left { flex: 1; min-width: 0; }
.rl-row-nome { font-size: 0.86rem; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rl-row-meta { display: flex; align-items: center; gap: 12px; margin-top: 3px; }
.rl-row-proto { font-size: 0.72rem; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 3px; }
.rl-row-sem-proto { font-size: 0.7rem; color: rgba(255,255,255,0.2); font-style: italic; }
.rl-row-data { font-size: 0.7rem; color: rgba(255,255,255,0.3); }
.rl-row-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: auto; }
.rl-row-badge {
  font-size: 0.65rem; font-weight: 900; letter-spacing: 0.1em;
  padding: 3px 9px; border-radius: 20px; flex-shrink: 0;
}
.rl-del-btn {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
  background: transparent; border: none;
  color: rgba(255,255,255,0.2); cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.rl-del-btn:hover { color: #f87171; background: rgba(248,113,113,0.1); }

/* Light mode: Preferências */
.wms-app--light .pref-section-label { color: rgba(15,23,42,0.4) !important; }
.wms-app--light .pref-card {
  background: rgba(255,255,255,0.78) !important;
  border-color: rgba(15,23,42,0.09) !important;
}
.wms-app--light .pref-divider { background: rgba(15,23,42,0.07) !important; }
.wms-app--light .pref-row-label { color: #0f172a !important; }
.wms-app--light .pref-row-desc { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .pref-theme-toggle { background: rgba(15,23,42,0.07) !important; }
.wms-app--light .pref-theme-btn { color: rgba(15,23,42,0.4) !important; }
.wms-app--light .pref-preview-label { color: rgba(15,23,42,0.4) !important; }
.wms-app--light .pref-tag-soon {
  background: rgba(15,23,42,0.07) !important; color: rgba(15,23,42,0.35) !important;
}

/* ── Light mode: Resumo ── */
.wms-app--light .rp-title {
  background: linear-gradient(135deg, #0f172a 0%, #1a3fa0 60%, #5ab82e 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
  filter: none !important;
}
.wms-app--light .rp-progress-val { color: #0f172a !important; }
.wms-app--light .rp-progress-of,
.wms-app--light .rp-progress-label { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .rp-progress-track { background: rgba(15,23,42,0.1) !important; }
.wms-app--light .rp-btn-back {
  background: rgba(15,23,42,0.06) !important;
  border-color: rgba(15,23,42,0.12) !important;
  color: rgba(15,23,42,0.65) !important;
}
.wms-app--light .rp-btn-back:hover { background: rgba(15,23,42,0.1) !important; color: #0f172a !important; }
/* Cards do Resumo */
.wms-app--light .rs-card {
  background: rgba(255,255,255,0.8) !important;
  border-color: rgba(15,23,42,0.09) !important;
}
.wms-app--light .rs-card-head { border-bottom-color: rgba(15,23,42,0.07) !important; }
.wms-app--light .rs-card-title { color: #0f172a !important; }
.wms-app--light .rs-card-sub { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .rs-card-count { color: rgba(15,23,42,0.4) !important; }
/* Campos do Resumo */
.wms-app--light .rp-field-label { color: rgba(15,23,42,0.5) !important; }
.wms-app--light .rp-field--filled .rp-field-label { color: rgba(15,23,42,0.7) !important; }
.wms-app--light .rp-field-wrap {
  background: rgba(255,255,255,0.85) !important;
  border-color: rgba(15,23,42,0.15) !important;
}
.wms-app--light .rp-field-wrap:focus-within {
  background: #fff !important;
  border-color: #1a3fa0 !important;
  box-shadow: 0 0 0 3px rgba(26,63,160,0.12) !important;
}
.wms-app--light .rp-field--filled .rp-field-wrap { border-color: rgba(90,184,46,0.4) !important; }
.wms-app--light .rp-field-input { color: #0f172a !important; }
.wms-app--light .rp-field-input::placeholder { color: rgba(15,23,42,0.3) !important; }
.wms-app--light .sec-copy-btn {
  background: rgba(15,23,42,0.05) !important;
  border-color: rgba(15,23,42,0.12) !important;
  color: rgba(15,23,42,0.5) !important;
}
/* Registros lista */
.wms-app--light .reg-card {
  background: rgba(255,255,255,0.8) !important;
  border-color: rgba(15,23,42,0.08) !important;
}
.wms-app--light .reg-card-header:hover { background: rgba(15,23,42,0.03) !important; }
.wms-app--light .reg-razao { color: #0f172a !important; }
.wms-app--light .reg-meta,
.wms-app--light .reg-chevron { color: rgba(15,23,42,0.4) !important; }
.wms-app--light .reg-cnpj,
.wms-app--light .reg-endereco { color: rgba(15,23,42,0.55) !important; }

/* ── Light mode: Prazos ── */
.wms-app--light .prazos-legend { color: rgba(15,23,42,0.5) !important; }
.wms-app--light .prazos-empty { color: rgba(15,23,42,0.35) !important; }
.wms-app--light .prazo-card {
  background: rgba(255,255,255,0.8) !important;
  border-color: rgba(15,23,42,0.09) !important;
}
.wms-app--light .prazo-card--priorizar { background: rgba(245,158,11,0.06) !important; }
.wms-app--light .prazo-card--urgente   { background: rgba(239,68,68,0.06) !important; }
.wms-app--light .prazo-card-razao { color: #0f172a !important; }
.wms-app--light .prazo-card-meta { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .prazo-dias-label { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .pz-stat-label { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .pz-filter-btn {
  background: rgba(15,23,42,0.05) !important;
  color: rgba(15,23,42,0.55) !important;
}
.wms-app--light .pz-filter-btn:hover { background: rgba(15,23,42,0.1) !important; color: #0f172a !important; }
.wms-app--light .pz-filter-btn--active { background: #1a3fa0 !important; color: #fff !important; }
.wms-app--light .prazo-opt-label { color: #0f172a !important; }
.wms-app--light .prazo-opt-desc  { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .prazo-opt-arrow { color: rgba(15,23,42,0.3) !important; }
.wms-app--light .prazo-cancel { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .prazo-cancel:hover { background: rgba(15,23,42,0.06) !important; color: #0f172a !important; }

/* ── Light mode: Dialog Complementar ── */
.wms-app--light .compl-dialog {
  background: #f8fafc !important;
  border-color: rgba(15,23,42,0.1) !important;
}
.wms-app--light .compl-dialog-title { color: #0f172a !important; }
.wms-app--light .compl-dialog-sub   { color: rgba(15,23,42,0.5) !important; }
.wms-app--light .compl-label        { color: rgba(15,23,42,0.5) !important; }
.wms-app--light .compl-input {
  background: white !important;
  border-color: rgba(15,23,42,0.15) !important;
  color: #0f172a !important;
}
.wms-app--light .compl-input::placeholder { color: rgba(15,23,42,0.3) !important; }

/* ── Light mode: Controle ── */
.wms-app--light .ctrl-card {
  background: rgba(255,255,255,0.8) !important;
  border-color: rgba(15,23,42,0.09) !important;
}
.wms-app--light .ctrl-card:hover {
  background: rgba(90,184,46,0.06) !important;
  box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important;
}
.wms-app--light .ctrl-card--baixa:hover { background: rgba(239,68,68,0.05) !important; }
.wms-app--light .ctrl-card-label { color: #0f172a !important; }
.wms-app--light .ctrl-card-desc  { color: rgba(15,23,42,0.5) !important; }
.wms-app--light .ctrl-selected {
  background: rgba(90,184,46,0.06) !important;
  border-color: rgba(90,184,46,0.2) !important;
}
.wms-app--light .ctrl-selected-title { color: rgba(15,23,42,0.7) !important; }
.wms-app--light .ctrl-selected-title strong { color: #0f172a !important; }

/* ── Light mode: Etapas/Guia ── */
.wms-app--light .et-guia-title { color: #0f172a !important; }
.wms-app--light .et-guia-sub   { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .et-titulo { color: #0f172a !important; }
.wms-app--light .et-num {
  background: rgba(15,23,42,0.08) !important;
  border-color: rgba(15,23,42,0.12) !important;
  color: rgba(15,23,42,0.5) !important;
}
.wms-app--light .et-num--concluida     { background: #22c55e !important; border-color: #22c55e !important; color: #fff !important; }
.wms-app--light .et-num--nao_concluida { background: #ef4444 !important; border-color: #ef4444 !important; color: #fff !important; }
.wms-app--light .et-item {
  background: rgba(255,255,255,0.8) !important;
  border-color: rgba(15,23,42,0.08) !important;
}
.wms-app--light .et-sugest-item {
  background: rgba(15,23,42,0.04) !important;
  color: rgba(15,23,42,0.75) !important;
}
.wms-app--light .et-sugest-item:hover { background: rgba(90,184,46,0.08) !important; color: #0f172a !important; }
.wms-app--light .et-input,
.wms-app--light .et-select {
  background: rgba(255,255,255,0.85) !important;
  border-color: rgba(15,23,42,0.15) !important;
  color: #0f172a !important;
}
.wms-app--light .et-input::placeholder { color: rgba(15,23,42,0.3) !important; }
.wms-app--light .et-select option { background: #fff !important; color: #0f172a !important; }
.wms-app--light .et-toggle-btn { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .et-toggle-btn:hover { background: rgba(15,23,42,0.08) !important; color: #0f172a !important; }
.wms-app--light .et-obs-icon { color: rgba(15,23,42,0.3) !important; }
.wms-app--light .et-obs-input { color: rgba(15,23,42,0.8) !important; }
.wms-app--light .et-obs-input::placeholder { color: rgba(15,23,42,0.25) !important; }
.wms-app--light .et-st-btn { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .et-st-btn:hover { color: #0f172a !important; background: rgba(15,23,42,0.08) !important; }
.wms-app--light .et-section-label { color: rgba(15,23,42,0.4) !important; }
.wms-app--light .et-arquiv-label { color: rgba(15,23,42,0.55) !important; }
.wms-app--light .et-sub-label { color: rgba(15,23,42,0.65) !important; }
.wms-app--light .et-sub-btn {
  background: rgba(15,23,42,0.05) !important;
  color: rgba(15,23,42,0.45) !important;
}
.wms-app--light .et-doc-item { background: rgba(15,23,42,0.04) !important; }
.wms-app--light .et-doc-nome,
.wms-app--light .bx-doc-nome { color: rgba(15,23,42,0.75) !important; }
.wms-app--light .et-arquiv-outros-input {
  background: rgba(255,255,255,0.85) !important;
  border-color: rgba(15,23,42,0.15) !important;
  color: #0f172a !important;
}
.wms-app--light .et-arquiv-outros-input::placeholder { color: rgba(15,23,42,0.3) !important; }
.wms-app--light .bx-section-label { color: rgba(15,23,42,0.5) !important; }
.wms-app--light .bx-item {
  background: rgba(15,23,42,0.04) !important;
  border-color: rgba(15,23,42,0.08) !important;
}
.wms-app--light .bx-item-label { color: rgba(15,23,42,0.75) !important; }
.wms-app--light .bx-remove-btn { color: rgba(15,23,42,0.3) !important; }

/* ── Light mode: Histórico ── */
.wms-app--light .hist-header {
  background: rgba(255,255,255,0.8) !important;
  border-color: rgba(15,23,42,0.08) !important;
}
.wms-app--light .hist-header:hover { background: rgba(255,255,255,0.95) !important; }
.wms-app--light .hist-item:hover { background: rgba(15,23,42,0.03) !important; }
.wms-app--light .hist-header-left { color: rgba(15,23,42,0.6) !important; }
.wms-app--light .hist-empresa { color: #0f172a !important; }
.wms-app--light .hist-meta { color: rgba(15,23,42,0.5) !important; }
.wms-app--light .hist-data { color: rgba(15,23,42,0.35) !important; }
.wms-app--light .hist-expand-btn { color: rgba(15,23,42,0.25) !important; }
.wms-app--light .hist-detail {
  background: rgba(15,23,42,0.03) !important;
  border-top-color: rgba(15,23,42,0.07) !important;
}

/* ── Light mode: Consultar ── */
.wms-app--light .cons-search-wrap {
  background: rgba(255,255,255,0.85) !important;
  border-color: rgba(15,23,42,0.14) !important;
}
.wms-app--light .cons-search-icon { color: rgba(15,23,42,0.35) !important; }
.wms-app--light .cons-search-input { color: #0f172a !important; }
.wms-app--light .cons-search-input::placeholder { color: rgba(15,23,42,0.3) !important; }
.wms-app--light .cons-search-clear { color: rgba(15,23,42,0.35) !important; }
.wms-app--light .cons-search-clear:hover { color: #0f172a !important; }
.wms-app--light .cons-card {
  background: rgba(255,255,255,0.8) !important;
  border-color: rgba(15,23,42,0.08) !important;
}
.wms-app--light .cons-card:hover { background: rgba(255,255,255,0.95) !important; }
.wms-app--light .cons-empresa { color: #0f172a !important; }
.wms-app--light .cons-empresa-proto { color: rgba(15,23,42,0.4) !important; }
.wms-app--light .cons-copiar-btn { color: rgba(15,23,42,0.3) !important; }
.wms-app--light .cons-copiar-btn:hover { color: #0f172a !important; background: rgba(15,23,42,0.07) !important; }
.wms-app--light .cons-meta { color: rgba(15,23,42,0.5) !important; }
.wms-app--light .cons-meta-item { color: rgba(15,23,42,0.5) !important; }
.wms-app--light .cons-data { color: rgba(15,23,42,0.35) !important; }
.wms-app--light .cons-ring-bg { stroke: rgba(15,23,42,0.1) !important; }
.wms-app--light .cons-ring--nao_iniciado { stroke: rgba(15,23,42,0.18) !important; }
.wms-app--light .cons-pct-num { color: #0f172a !important; }
.wms-app--light .cons-badge--concluido { background: rgba(34,197,94,0.12) !important; color: #16a34a !important; }
.wms-app--light .cons-badge--andamento { background: rgba(251,191,36,0.15) !important; color: #b45309 !important; }
.wms-app--light .cons-badge--nao_iniciado { background: rgba(15,23,42,0.07) !important; color: rgba(15,23,42,0.45) !important; }
.wms-app--light .cons-dot--nao_iniciado { background: rgba(15,23,42,0.18) !important; box-shadow: none !important; }
.wms-app--light .cons-empty { color: rgba(15,23,42,0.35) !important; }

/* ── Light mode: Notificações ── */
.wms-app--light .notif-wrap {
  background: rgba(255,255,255,0.85) !important;
  border-color: rgba(15,23,42,0.1) !important;
}
.wms-app--light .notif-header { border-bottom-color: rgba(15,23,42,0.07) !important; }
.wms-app--light .notif-title { color: #0f172a !important; }
.wms-app--light .notif-item:hover { background: rgba(15,23,42,0.03) !important; }
.wms-app--light .notif-item-nome { color: #0f172a !important; }
.wms-app--light .notif-item-desc { color: rgba(15,23,42,0.5) !important; }
.wms-app--light .notif-empty { color: rgba(15,23,42,0.4) !important; }

/* ── Light mode: Config dialog ── */
.wms-app--light .cfg-dialog-title { color: #0f172a !important; }
.wms-app--light .cfg-dialog-sub   { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .cfg-label        { color: rgba(15,23,42,0.55) !important; }
.wms-app--light .cfg-input {
  background: rgba(255,255,255,0.85) !important;
  border-color: rgba(15,23,42,0.15) !important;
  color: #0f172a !important;
}
.wms-app--light .cfg-input::placeholder { color: rgba(15,23,42,0.3) !important; }
.wms-app--light .cfg-hint { color: rgba(15,23,42,0.35) !important; }
.wms-app--light .rp-btn-config { color: rgba(15,23,42,0.5) !important; }
.wms-app--light .rp-btn-config:hover { background: rgba(15,23,42,0.1) !important; color: #0f172a !important; }

/* ── Light mode: Modal de Envio ── */
.wms-app--light .env-modal-inner {
  background: rgba(255,255,255,0.96) !important;
  border-color: rgba(15,23,42,0.1) !important;
  box-shadow: 0 24px 60px rgba(0,0,0,0.15) !important;
}
.wms-app--light .env-modal-head { border-bottom-color: rgba(15,23,42,0.07) !important; }
.wms-app--light .env-modal-title { color: #0f172a !important; }
.wms-app--light .env-modal-sub   { color: rgba(15,23,42,0.45) !important; }
.wms-app--light .env-close-btn   { color: rgba(15,23,42,0.4) !important; }
.wms-app--light .env-close-btn:hover { background: rgba(15,23,42,0.08) !important; color: #0f172a !important; }
.wms-app--light .env-status-label { color: rgba(15,23,42,0.8) !important; }
.wms-app--light .env-si--idle { background: rgba(15,23,42,0.07) !important; color: rgba(15,23,42,0.35) !important; }
.wms-app--light .env-fechar-btn {
  background: rgba(15,23,42,0.06) !important;
  color: rgba(15,23,42,0.6) !important;
}
.wms-app--light .env-fechar-btn:hover { background: rgba(15,23,42,0.1) !important; color: #0f172a !important; }
</style>
