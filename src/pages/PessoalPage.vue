<template>
  <q-layout view="hHh lpR fFf" class="ps-app">

    <!-- ── Topo ── -->
    <q-header class="ps-header">
      <div class="ps-header-inner">
        <div class="ps-header-left">
          <button class="ps-home-btn" @click="router.push('/')" title="Início">
            <q-icon name="home" size="18px" />
          </button>
          <button class="ps-home-btn" @click="sidebarOpen = !sidebarOpen" :title="sidebarOpen ? 'Fechar menu' : 'Abrir menu'">
            <q-icon :name="sidebarOpen ? 'menu_open' : 'menu'" size="18px" />
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
        <aside class="ps-sidebar" :class="{ 'ps-sidebar--closed': !sidebarOpen }">
          <nav class="ps-nav">
            <template v-for="item in navItems" :key="item.key">

              <!-- item com subgrupos (Rotinas do DP) -->
              <template v-if="item.subgrupos">
                <button
                  class="ps-nav-item ps-nav-item--parent"
                  :class="{ 'ps-nav-item--active': activeNav === item.key || (activeNav === 'rotinas-sub' && activeSubgrupo && true) }"
                  :style="(activeNav === item.key || activeNav === 'rotinas-sub') ? `--nav-color:${item.color}` : ''"
                  @click="toggleRotinas(item)"
                >
                  <span class="ps-nav-dot" :style="`background:${item.color}`" />
                  <q-icon :name="item.icon" size="16px" />
                  <span class="ps-nav-label">{{ item.label }}</span>
                  <q-icon
                    :name="rotinasExpanded ? 'expand_less' : 'expand_more'"
                    size="14px"
                    class="ps-nav-chevron"
                  />
                </button>

                <!-- dropdown de subgrupos -->
                <div v-show="rotinasExpanded" class="ps-nav-children">
                  <button
                    v-for="sg in item.subgrupos"
                    :key="sg.id"
                    class="ps-nav-child"
                    :class="{ 'ps-nav-child--active': activeSubgrupo === sg.id }"
                    :style="activeSubgrupo === sg.id ? `--nav-color:${item.color}` : ''"
                    @click="selectSubgrupo(sg.id)"
                  >
                    <span class="ps-nav-child-bar" :style="`background:${item.color}`" />
                    <span v-if="sg.numero" class="ps-nav-child-num">{{ sg.numero }}</span>
                    <span class="ps-nav-child-label">{{ sg.label }}</span>
                    <span v-if="sg.count != null" class="ps-nav-child-count">{{ sg.count }}</span>
                  </button>
                </div>
              </template>

              <!-- item simples -->
              <button
                v-else
                class="ps-nav-item"
                :class="{ 'ps-nav-item--active': activeNav === item.key }"
                :style="activeNav === item.key ? `--nav-color:${item.color}` : ''"
                @click="activeNav = item.key; activeSubgrupo = null"
              >
                <span class="ps-nav-dot" :style="`background:${item.color}`" />
                <q-icon :name="item.icon" size="16px" />
                <span>{{ item.label }}</span>
              </button>

            </template>
          </nav>
        </aside>

        <!-- Área principal -->
        <main class="ps-main">

          <!-- ══ DASHBOARD ══ -->
          <div v-if="activeNav === 'dashboard'" class="ps-view">
            <div class="ps-view-header">
              <div>
                <div class="ps-eyebrow">
                  <span class="ps-eyebrow-dot" style="background:#0d9488" />
                  Departamento Pessoal
                </div>
                <h1 class="ps-title">Dashboard</h1>
              </div>
            </div>

            <!-- cards de visão geral -->
            <div class="db-cards">
              <div class="db-card" style="--card-color:#16a34a">
                <div class="db-card-icon"><q-icon name="person_add" size="22px" /></div>
                <div class="db-card-body">
                  <span class="db-card-label">Admissões</span>
                  <span class="db-card-value">0</span>
                </div>
              </div>
              <div class="db-card" style="--card-color:#2563eb">
                <div class="db-card-icon"><q-icon name="payments" size="22px" /></div>
                <div class="db-card-body">
                  <span class="db-card-label">Folhas de Pagamento</span>
                  <span class="db-card-value">0</span>
                </div>
              </div>
              <div class="db-card" style="--card-color:#7c3aed">
                <div class="db-card-icon"><q-icon name="beach_access" size="22px" /></div>
                <div class="db-card-body">
                  <span class="db-card-label">Férias</span>
                  <span class="db-card-value">0</span>
                </div>
              </div>
              <div class="db-card" style="--card-color:#dc2626">
                <div class="db-card-icon"><q-icon name="person_remove" size="22px" /></div>
                <div class="db-card-body">
                  <span class="db-card-label">Rescisões</span>
                  <span class="db-card-value">0</span>
                </div>
              </div>
              <div class="db-card" style="--card-color:#d97706">
                <div class="db-card-icon"><q-icon name="checklist" size="22px" /></div>
                <div class="db-card-body">
                  <span class="db-card-label">Rotinas do DP</span>
                  <span class="db-card-value">{{ rotinasSubgrupos.reduce((s,g) => s + (g.count||0), 0) }}</span>
                </div>
              </div>
            </div>

            <!-- placeholder de gráficos / atividades -->
            <div class="db-placeholder">
              <q-icon name="bar_chart" size="48px" style="color:rgba(13,148,136,0.2)" />
              <p>Análises e relatórios em breve.</p>
            </div>
          </div>

          <!-- ══ ROTINAS DO DP — subgrupo selecionado ══ -->
          <div v-if="activeNav === 'rotinas'" class="ps-view">
            <template v-if="activeSubgrupo">
              <div class="ps-view-header">
                <div>
                  <div class="ps-eyebrow">
                    <span class="ps-eyebrow-dot" style="background:#d97706" />
                    Rotinas do DP
                  </div>
                  <h1 class="ps-title">{{ subgrupoLabel }}</h1>
                </div>
              </div>
              <div class="ps-empty-state">
                <q-icon name="inbox" size="48px" style="color:rgba(217,119,6,0.2)" />
                <p>Nenhuma tarefa em <strong style="color:rgba(255,255,255,0.5)">{{ subgrupoLabel }}</strong> ainda.</p>
              </div>
            </template>
            <template v-else>
              <div class="ps-empty-state" style="padding-top:120px">
                <q-icon name="checklist" size="48px" style="color:rgba(217,119,6,0.15)" />
                <p>Selecione um subgrupo no menu lateral.</p>
              </div>
            </template>
          </div>

          <!-- ══ ADMISSÕES ══ -->
          <!-- ══ ADMISSÕES ══ -->
          <div v-else-if="activeNav === 'admissoes'" class="ps-view">
            <div class="ps-view-header">
              <div>
                <div class="ps-eyebrow">
                  <span class="ps-eyebrow-dot" style="background:#16a34a" />
                  Departamento Pessoal
                </div>
                <h1 class="ps-title">Admissões</h1>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <button class="adm-btn-lixeira" @click="abrirLixeira" title="Lixeira">
                  <q-icon name="delete_sweep" size="16px" />
                  Lixeira
                  <span v-if="lixeiraCount > 0" class="adm-lixeira-badge">{{ lixeiraCount }}</span>
                </button>
                <button class="ps-btn-primary" @click="modalEmpresaAberto = true">
                  <q-icon name="add" size="15px" /> Nova Empresa
                </button>
              </div>
            </div>

            <!-- barra de pesquisa -->
            <div class="adm-search-wrap">
              <q-icon name="search" size="17px" class="adm-search-icon" />
              <input
                v-model="admBusca"
                class="adm-search-input"
                placeholder="Pesquisar por empresa, CNPJ ou funcionário..."
              />
              <button v-if="admBusca" class="adm-search-clear" @click="admBusca = ''">
                <q-icon name="close" size="15px" />
              </button>
            </div>

            <!-- loading -->
            <div v-if="carregandoEmpresas" class="ps-empty-state">
              <q-spinner size="32px" color="green" />
            </div>

            <!-- sem empresas -->
            <div v-else-if="empresas.length === 0" class="ps-empty-state">
              <q-icon name="business" size="48px" style="color:rgba(22,163,74,0.2)" />
              <p>Nenhuma empresa cadastrada ainda.</p>
            </div>

            <!-- sem resultados -->
            <div v-else-if="empresasFiltradas.length === 0" class="ps-empty-state">
              <q-icon name="search_off" size="48px" style="color:rgba(255,255,255,0.1)" />
              <p>Nenhum resultado para <strong style="color:rgba(255,255,255,0.4)">"{{ admBusca }}"</strong></p>
            </div>

            <!-- lista de empresas -->
            <div v-else class="adm-lista">
              <div v-for="emp in empresasFiltradas" :key="emp.id" class="adm-empresa">

                <!-- cabeçalho da empresa -->
                <div class="adm-emp-header" @click="toggleEmpresa(emp.id)">
                  <div class="adm-emp-left">
                    <q-icon
                      :name="empresaAberta === emp.id ? 'expand_less' : 'expand_more'"
                      size="16px" style="color:rgba(255,255,255,0.3)"
                    />
                    <span class="adm-emp-icon">
                      <q-icon name="business" size="14px" />
                    </span>
                    <span class="adm-emp-nome">{{ emp.nome }}</span>
                    <span v-if="emp.cnpj" class="adm-emp-cnpj">{{ emp.cnpj }}</span>
                    <span class="adm-emp-badge">{{ emp.admissoesFiltradas?.length ?? emp.admissoes?.length ?? 0 }}</span>
                  </div>
                  <div class="adm-emp-actions" @click.stop>
                    <button class="adm-btn-new" @click="abrirModalAdmissao(emp)" title="Nova admissão">
                      <q-icon name="person_add" size="14px" /> Nova admissão
                    </button>
                    <button class="adm-row-action adm-row-edit" @click="abrirEditarEmpresa(emp)" title="Editar empresa">
                      <q-icon name="edit" size="14px" />
                    </button>
                    <button class="adm-row-action adm-row-del" @click="excluirEmpresa(emp)" title="Excluir empresa">
                      <q-icon name="delete_outline" size="14px" />
                    </button>
                  </div>
                </div>

                <!-- admissões da empresa -->
                <div v-show="empresaAberta === emp.id" class="adm-emp-body">
                  <div v-if="!emp.admissoesFiltradas || emp.admissoesFiltradas.length === 0" class="adm-empty">
                    <q-icon name="person_add" size="28px" style="color:rgba(255,255,255,0.1)" />
                    <span>{{ admBusca ? 'Nenhum funcionário encontrado.' : 'Nenhuma admissão nesta empresa.' }}</span>
                  </div>
                  <template v-else>
                    <!-- cabeçalho da tabela -->
                    <div class="adm-table-head">
                      <span>Funcionário</span>
                      <span>Função</span>
                      <span>Salário</span>
                      <span>Horas/Sem.</span>
                      <span>Data Admissão</span>
                      <span></span>
                    </div>
                    <div
                      v-for="adm in emp.admissoesFiltradas"
                      :key="adm.id"
                      class="adm-row-wrap"
                    >
                      <!-- linha principal -->
                      <div class="adm-row">
                        <span class="adm-row-nome">{{ adm.nome_funcionario }}</span>
                        <span class="adm-row-cell">{{ adm.funcao || '—' }}</span>
                        <span class="adm-row-cell adm-row-salario">
                          {{ adm.salario ? 'R$ ' + Number(adm.salario).toLocaleString('pt-BR', {minimumFractionDigits:2}) : '—' }}
                        </span>
                        <span class="adm-row-cell">{{ adm.horas_semanais ? adm.horas_semanais + 'h' : '—' }}</span>
                        <span class="adm-row-cell">{{ adm.data_admissao ? new Date(adm.data_admissao + 'T12:00').toLocaleDateString('pt-BR') : '—' }}</span>
                        <div class="adm-row-btns">
                          <button
                            class="adm-proc-btn"
                            :class="{ 'adm-proc-btn--active': processoAberto === adm.id }"
                            @click="toggleProcessos(adm)"
                          >
                            <q-icon name="checklist" size="13px" />
                            Processos
                            <span v-if="(adm._processos || []).length" class="adm-proc-count">{{ (adm._processos || []).length }}</span>
                          </button>
                          <button class="adm-row-action adm-row-edit" @click="abrirEditarAdmissao(emp, adm)" title="Editar">
                            <q-icon name="edit" size="13px" />
                          </button>
                          <button class="adm-row-action adm-row-del" @click="excluirAdmissao(emp, adm)" title="Excluir">
                            <q-icon name="delete_outline" size="13px" />
                          </button>
                        </div>
                      </div>

                      <!-- checklist de processos -->
                      <div v-if="processoAberto === adm.id" class="adm-processos">
                        <div class="adm-proc-header">
                          <q-icon name="checklist" size="14px" style="color:rgba(255,255,255,0.3)" />
                          <span>Processos</span>
                          <span class="adm-proc-prog">
                            {{ (adm._processos || []).filter(p=>p.status==='ok').length }}/{{ (adm._processos || []).length }}
                          </span>
                          <button class="adm-proc-fechar" @click="processoAberto = null" title="Ocultar processos">
                            <q-icon name="keyboard_arrow_up" size="16px" />
                          </button>
                        </div>

                        <!-- items -->
                        <div class="adm-proc-list">
                          <div v-if="carregandoProcessos" class="adm-proc-loading">
                            <q-spinner size="16px" color="white" style="opacity:0.3" />
                          </div>
                          <div
                            v-for="proc in (adm._processos || [])"
                            :key="proc.id"
                            class="adm-proc-item"
                            :class="`adm-proc-item--${proc.status || 'pendente'}`"
                          >
                            <span class="adm-proc-titulo">{{ proc.titulo }}</span>
                            <div class="adm-proc-acoes">
                              <button
                                class="adm-proc-btn-acao adm-proc-btn-ok"
                                :class="{ 'adm-proc-btn-acao--ativo': proc.status === 'ok' }"
                                @click="setStatusProcesso(adm, proc, 'ok')"
                                :title="proc.status === 'ok' && proc.status_em ? 'OK — ' + formatarFeitoEm(proc.status_em) : 'Marcar OK'"
                              >
                                <q-icon name="check" size="14px" />
                              </button>
                              <button
                                class="adm-proc-btn-acao adm-proc-btn-nao"
                                :class="{ 'adm-proc-btn-acao--ativo': proc.status === 'nao' }"
                                @click="setStatusProcesso(adm, proc, 'nao')"
                                :title="proc.status === 'nao' && proc.status_em ? 'Não — ' + formatarFeitoEm(proc.status_em) : 'Marcar Não'"
                              >
                                <q-icon name="close" size="14px" />
                              </button>
                              <button
                                class="adm-proc-btn-acao adm-proc-btn-just"
                                :class="{ 'adm-proc-btn-acao--ativo': justificandoId === proc.id }"
                                @click="toggleJustificativa(proc)"
                                title="Justificar"
                              >
                                <q-icon name="edit_note" size="14px" />
                              </button>
                              <button class="adm-proc-del" @click="excluirProcesso(adm, proc)" title="Remover">
                                <q-icon name="delete_outline" size="13px" />
                              </button>
                            </div>
                            <!-- justificativa inline -->
                            <div v-if="justificandoId === proc.id" class="adm-proc-just-area">
                              <textarea
                                v-model="proc._justTemp"
                                class="adm-proc-just-input"
                                placeholder="Digite a justificativa..."
                                rows="2"
                                @keydown.ctrl.enter="salvarJustificativa(adm, proc)"
                              />
                              <div class="adm-proc-just-footer">
                                <span v-if="proc.justificativa" class="adm-proc-just-atual">{{ proc.justificativa }}</span>
                                <button class="adm-proc-just-salvar" @click="salvarJustificativa(adm, proc)">Salvar</button>
                                <button class="adm-proc-just-cancelar" @click="justificandoId = null">Cancelar</button>
                              </div>
                            </div>
                            <div v-else-if="proc.justificativa" class="adm-proc-just-badge">
                              <q-icon name="notes" size="11px" />
                              {{ proc.justificativa }}
                            </div>
                          </div>

                          <div v-if="!carregandoProcessos && !(adm._processos || []).length" class="adm-proc-empty">
                            Nenhum processo adicionado.
                          </div>
                        </div>

                        <!-- input novo processo -->
                        <div class="adm-proc-add">
                          <q-icon name="add" size="15px" style="color:rgba(255,255,255,0.25);flex-shrink:0" />
                          <input
                            v-model="novoProcessoTitulo"
                            class="adm-proc-input"
                            placeholder="Adicionar processo..."
                            @keyup.enter="adicionarProcesso(adm)"
                          />
                          <button
                            class="adm-proc-save"
                            :disabled="!novoProcessoTitulo.trim()"
                            @click="adicionarProcesso(adm)"
                          >Adicionar</button>
                        </div>
                      </div>

                    </div>
                  </template>
                </div>

              </div>
            </div>

            <!-- ── Modal Nova Empresa ── -->
            <Teleport to="body">
              <Transition name="ps-fade">
                <div v-if="modalEmpresaAberto" class="ps-overlay" @click.self="modalEmpresaAberto = false">
                  <div class="ps-modal">
                    <div class="ps-modal-head">
                      <span>Nova Empresa</span>
                      <button @click="modalEmpresaAberto = false"><q-icon name="close" size="18px" /></button>
                    </div>
                    <div class="ps-modal-body ps-modal-grid">
                      <label class="ps-field ps-field--full">
                        <span>Nome da empresa *</span>
                        <input v-model="novaEmpresaNome" placeholder="Ex.: Santorini Comércio Ltda" class="ps-input" @keyup.enter="salvarEmpresa" autofocus />
                      </label>
                      <label class="ps-field ps-field--full">
                        <span>CNPJ <em style="font-style:normal;opacity:.5">(opcional)</em></span>
                        <input v-model="novaEmpresaCnpj" placeholder="00.000.000/0000-00" class="ps-input" @input="mascararCnpj" maxlength="18" />
                      </label>
                    </div>
                    <div class="ps-modal-foot">
                      <button class="ps-btn-ghost" @click="modalEmpresaAberto = false">Cancelar</button>
                      <button class="ps-btn-confirm" :disabled="!novaEmpresaNome.trim()" @click="salvarEmpresa">
                        <q-icon name="add" size="15px" /> Salvar
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>
            </Teleport>

            <!-- ── Modal Nova Admissão ── -->
            <Teleport to="body">
              <Transition name="ps-fade">
                <div v-if="modalAdmissaoAberto" class="ps-overlay" @click.self="fecharModalAdmissao">
                  <div class="ps-modal ps-modal--wide">
                    <div class="ps-modal-head">
                      <span>Nova Admissão — {{ empresaSelecionada?.nome }}</span>
                      <button @click="fecharModalAdmissao"><q-icon name="close" size="18px" /></button>
                    </div>
                    <div class="ps-modal-body ps-modal-grid">
                      <label class="ps-field ps-field--full">
                        <span>Nome do funcionário *</span>
                        <input v-model="novaAdmissao.nome_funcionario" placeholder="Nome completo" class="ps-input" />
                      </label>
                      <label class="ps-field">
                        <span>Função *</span>
                        <input v-model="novaAdmissao.funcao" placeholder="Ex.: Instalador" class="ps-input" />
                      </label>
                      <label class="ps-field">
                        <span>Data de admissão *</span>
                        <input v-model="novaAdmissao.data_admissao" type="date" class="ps-input" />
                      </label>
                      <label class="ps-field">
                        <span>Salário (R$)</span>
                        <input v-model="novaAdmissao.salario" type="number" placeholder="1800.00" class="ps-input" />
                      </label>
                      <label class="ps-field">
                        <span>Horas semanais</span>
                        <input v-model="novaAdmissao.horas_semanais" type="number" placeholder="44" class="ps-input" />
                      </label>
                    </div>

                    <!-- processos pré-admissão -->
                    <div class="ps-modal-proc-section">
                      <div class="ps-modal-proc-header">
                        <q-icon name="checklist" size="15px" />
                        <span>Processos</span>
                        <span class="ps-modal-proc-prog" v-if="processosTemp.length">
                          {{ processosTemp.filter(p => p.feito).length }}/{{ processosTemp.length }}
                        </span>
                      </div>
                      <div class="ps-modal-proc-list">
                        <div
                          v-for="(proc, i) in processosTemp"
                          :key="i"
                          class="ps-modal-proc-item"
                          :class="{ 'ps-modal-proc-item--done': proc.feito }"
                        >
                          <button class="ps-modal-proc-check" @click="proc.feito = !proc.feito">
                            <q-icon :name="proc.feito ? 'check_circle' : 'radio_button_unchecked'" size="17px" />
                          </button>
                          <span class="ps-modal-proc-title">{{ proc.titulo }}</span>
                          <button class="ps-modal-proc-del" @click="processosTemp.splice(i, 1)" title="Remover">
                            <q-icon name="close" size="13px" />
                          </button>
                        </div>
                        <div v-if="!processosTemp.length" class="ps-modal-proc-empty">
                          Nenhum processo ainda
                        </div>
                      </div>
                      <div class="ps-modal-proc-add">
                        <input
                          v-model="novoProcessoTitulo"
                          class="ps-input ps-input--sm"
                          placeholder="Adicionar processo..."
                          @keydown.enter="adicionarProcessoTemp"
                        />
                        <button class="ps-btn-proc-add" :disabled="!novoProcessoTitulo.trim()" @click="adicionarProcessoTemp">
                          <q-icon name="add" size="15px" />
                        </button>
                      </div>
                    </div>

                    <div class="ps-modal-foot">
                      <button class="ps-btn-ghost" @click="fecharModalAdmissao">Cancelar</button>
                      <button
                        class="ps-btn-confirm"
                        :disabled="!novaAdmissao.nome_funcionario.trim() || !novaAdmissao.funcao.trim() || !novaAdmissao.data_admissao"
                        @click="salvarAdmissao"
                      >
                        <q-icon name="person_add" size="15px" /> Registrar
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>
            </Teleport>

            <!-- ── Modal Editar Empresa ── -->
            <Teleport to="body">
              <Transition name="ps-fade">
                <div v-if="modalEditarEmpresaAberto" class="ps-overlay" @click.self="modalEditarEmpresaAberto = false">
                  <div class="ps-modal">
                    <div class="ps-modal-head">
                      <span>Editar Empresa</span>
                      <button @click="modalEditarEmpresaAberto = false"><q-icon name="close" size="18px" /></button>
                    </div>
                    <div class="ps-modal-body ps-modal-grid">
                      <label class="ps-field ps-field--full">
                        <span>Nome da empresa *</span>
                        <input v-model="editandoEmpresa.nome" class="ps-input" />
                      </label>
                      <label class="ps-field ps-field--full">
                        <span>CNPJ <em style="font-style:normal;opacity:.5">(opcional)</em></span>
                        <input v-model="editandoEmpresa.cnpj" placeholder="00.000.000/0000-00" class="ps-input" maxlength="18" />
                      </label>
                    </div>
                    <div class="ps-modal-foot">
                      <button class="ps-btn-ghost" @click="modalEditarEmpresaAberto = false">Cancelar</button>
                      <button class="ps-btn-confirm" :disabled="!editandoEmpresa.nome?.trim()" @click="salvarEditarEmpresa">
                        <q-icon name="check" size="15px" /> Salvar
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>
            </Teleport>

            <!-- ── Modal Editar Admissão ── -->
            <Teleport to="body">
              <Transition name="ps-fade">
                <div v-if="modalEditarAdmissaoAberto" class="ps-overlay" @click.self="modalEditarAdmissaoAberto = false">
                  <div class="ps-modal ps-modal--wide">
                    <div class="ps-modal-head">
                      <span>Editar Admissão</span>
                      <button @click="modalEditarAdmissaoAberto = false"><q-icon name="close" size="18px" /></button>
                    </div>
                    <div class="ps-modal-body ps-modal-grid">
                      <label class="ps-field ps-field--full">
                        <span>Nome do funcionário *</span>
                        <input v-model="editandoAdmissao.nome_funcionario" class="ps-input" />
                      </label>
                      <label class="ps-field">
                        <span>Função *</span>
                        <input v-model="editandoAdmissao.funcao" class="ps-input" />
                      </label>
                      <label class="ps-field">
                        <span>Data de admissão</span>
                        <input v-model="editandoAdmissao.data_admissao" type="date" class="ps-input" />
                      </label>
                      <label class="ps-field">
                        <span>Salário (R$)</span>
                        <input v-model="editandoAdmissao.salario" type="number" class="ps-input" />
                      </label>
                      <label class="ps-field">
                        <span>Horas semanais</span>
                        <input v-model="editandoAdmissao.horas_semanais" type="number" class="ps-input" />
                      </label>
                    </div>

                    <!-- ── Processos dentro do modal ── -->
                    <div class="ps-modal-proc-section">
                      <div class="ps-modal-proc-header">
                        <q-icon name="checklist" size="15px" />
                        <span>Processos</span>
                        <span class="ps-modal-proc-prog" v-if="(editandoAdmissao._processos || []).length">
                          {{ (editandoAdmissao._processos || []).filter(p => p.status === 'ok').length }}/{{ (editandoAdmissao._processos || []).length }}
                        </span>
                      </div>

                      <div v-if="carregandoProcessos" class="ps-modal-proc-loading">
                        <q-spinner size="16px" /> Carregando...
                      </div>

                      <div v-else class="ps-modal-proc-list">
                        <div
                          v-for="proc in (editandoAdmissao._processos || [])"
                          :key="proc.id"
                          class="ps-modal-proc-item"
                          :class="{ 'ps-modal-proc-item--done': proc.feito }"
                        >
                          <span class="ps-modal-proc-title">{{ proc.titulo }}</span>
                          <div class="adm-proc-acoes">
                            <button
                              class="adm-proc-btn-acao adm-proc-btn-ok"
                              :class="{ 'adm-proc-btn-acao--ativo': proc.status === 'ok' }"
                              @click="setStatusProcessoModal(proc, 'ok')"
                              :title="proc.status === 'ok' && proc.status_em ? 'OK — ' + formatarFeitoEm(proc.status_em) : 'Marcar OK'"
                            ><q-icon name="check" size="14px" /></button>
                            <button
                              class="adm-proc-btn-acao adm-proc-btn-nao"
                              :class="{ 'adm-proc-btn-acao--ativo': proc.status === 'nao' }"
                              @click="setStatusProcessoModal(proc, 'nao')"
                              :title="proc.status === 'nao' && proc.status_em ? 'Não — ' + formatarFeitoEm(proc.status_em) : 'Marcar Não'"
                            ><q-icon name="close" size="14px" /></button>
                            <button
                              class="adm-proc-btn-acao adm-proc-btn-just"
                              :class="{ 'adm-proc-btn-acao--ativo': justificandoId === proc.id }"
                              @click="toggleJustificativa(proc)"
                              title="Justificar"
                            ><q-icon name="edit_note" size="14px" /></button>
                          </div>
                          <button class="ps-modal-proc-del" @click="excluirProcessoModal(proc)" title="Remover">
                            <q-icon name="delete_outline" size="13px" />
                          </button>
                          <!-- justificativa inline no modal -->
                          <div v-if="justificandoId === proc.id" class="adm-proc-just-area">
                            <textarea v-model="proc._justTemp" class="adm-proc-just-input" placeholder="Digite a justificativa..." rows="2" @keydown.ctrl.enter="salvarJustificativaModal(proc)" />
                            <div class="adm-proc-just-footer">
                              <button class="adm-proc-just-salvar" @click="salvarJustificativaModal(proc)">Salvar</button>
                              <button class="adm-proc-just-cancelar" @click="justificandoId = null">Cancelar</button>
                            </div>
                          </div>
                          <div v-else-if="proc.justificativa" class="adm-proc-just-badge">
                            <q-icon name="notes" size="11px" />{{ proc.justificativa }}
                          </div>
                        </div>

                        <div v-if="!(editandoAdmissao._processos || []).length && !carregandoProcessos" class="ps-modal-proc-empty">
                          Nenhum processo ainda
                        </div>
                      </div>

                      <!-- input novo processo -->
                      <div class="ps-modal-proc-add">
                        <input
                          v-model="novoProcessoTitulo"
                          class="ps-input ps-input--sm"
                          placeholder="Adicionar processo..."
                          @keydown.enter="adicionarProcessoModal"
                        />
                        <button
                          class="ps-btn-proc-add"
                          :disabled="!novoProcessoTitulo.trim()"
                          @click="adicionarProcessoModal"
                        >
                          <q-icon name="add" size="15px" />
                        </button>
                      </div>
                    </div>
                    <div class="ps-modal-foot">
                      <button class="ps-btn-ghost" @click="modalEditarAdmissaoAberto = false">Cancelar</button>
                      <button class="ps-btn-confirm" :disabled="!editandoAdmissao.nome_funcionario?.trim()" @click="salvarEditarAdmissao">
                        <q-icon name="check" size="15px" /> Salvar
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>
            </Teleport>

            <!-- ── Modal Lixeira ── -->
            <Teleport to="body">
              <Transition name="ps-fade">
                <div v-if="lixeiraAberta" class="ps-overlay" @click.self="lixeiraAberta = false">
                  <div class="ps-modal ps-modal--wide">
                    <div class="ps-modal-head">
                      <span>Lixeira — Admissões</span>
                      <button @click="lixeiraAberta = false"><q-icon name="close" size="18px" /></button>
                    </div>
                    <div class="ps-modal-body" style="max-height:420px;overflow-y:auto;padding:0">
                      <div v-if="lixeiraEmpresas.length === 0 && lixeiraAdmissoes.length === 0" class="adm-empty" style="padding:40px">
                        <q-icon name="delete_sweep" size="36px" style="color:rgba(255,255,255,0.1)" />
                        <span>Lixeira vazia.</span>
                      </div>

                      <!-- empresas excluídas -->
                      <template v-if="lixeiraEmpresas.length > 0">
                        <div class="lx-section-label">Empresas excluídas</div>
                        <div v-for="e in lixeiraEmpresas" :key="e.id" class="lx-row">
                          <div class="lx-row-info">
                            <q-icon name="business" size="14px" style="color:rgba(255,255,255,0.3)" />
                            <span class="lx-row-nome">{{ e.nome }}</span>
                            <span v-if="e.cnpj" class="adm-emp-cnpj">{{ e.cnpj }}</span>
                          </div>
                          <div class="lx-row-btns">
                            <button class="lx-btn-restore" @click="restaurarEmpresa(e)">
                              <q-icon name="restore_from_trash" size="14px" /> Restaurar
                            </button>
                            <button class="lx-btn-perm" @click="excluirPermanenteEmpresa(e)" title="Excluir permanentemente">
                              <q-icon name="delete_forever" size="14px" />
                            </button>
                          </div>
                        </div>
                      </template>

                      <!-- admissões excluídas -->
                      <template v-if="lixeiraAdmissoes.length > 0">
                        <div class="lx-section-label">Admissões excluídas</div>
                        <div v-for="a in lixeiraAdmissoes" :key="a.id" class="lx-row">
                          <div class="lx-row-info">
                            <q-icon name="person" size="14px" style="color:rgba(255,255,255,0.3)" />
                            <div>
                              <span class="lx-row-nome">{{ a.nome_funcionario }}</span>
                              <span class="lx-row-sub">{{ a.funcao }} · {{ a._empresa_nome }}</span>
                            </div>
                          </div>
                          <div class="lx-row-btns">
                            <button class="lx-btn-restore" @click="restaurarAdmissao(a)">
                              <q-icon name="restore_from_trash" size="14px" /> Restaurar
                            </button>
                            <button class="lx-btn-perm" @click="excluirPermanenteAdmissao(a)" title="Excluir permanentemente">
                              <q-icon name="delete_forever" size="14px" />
                            </button>
                          </div>
                        </div>
                      </template>
                    </div>
                    <div class="ps-modal-foot">
                      <button
                        v-if="lixeiraEmpresas.length > 0 || lixeiraAdmissoes.length > 0"
                        class="ps-btn-perm-all"
                        @click="esvaziarLixeira"
                      >
                        <q-icon name="delete_forever" size="15px" /> Esvaziar lixeira
                      </button>
                      <button class="ps-btn-ghost" style="margin-left:auto" @click="lixeiraAberta = false">Fechar</button>
                    </div>
                  </div>
                </div>
              </Transition>
            </Teleport>

          </div>

          <!-- ══ FOLHAS DE PAGAMENTO ══ -->
          <div v-else-if="activeNav === 'folhas'" class="ps-view">
            <div class="ps-view-header">
              <div>
                <div class="ps-eyebrow">
                  <span class="ps-eyebrow-dot" style="background:#2563eb" />
                  Departamento Pessoal
                </div>
                <h1 class="ps-title">Folhas de Pagamento</h1>
              </div>
            </div>
            <div class="ps-empty-state">
              <q-icon name="payments" size="56px" style="color:rgba(37,99,235,0.25)" />
              <p>Nenhuma folha lançada ainda.</p>
            </div>
          </div>

          <!-- ══ FÉRIAS ══ -->
          <div v-else-if="activeNav === 'ferias'" class="ps-view">
            <div class="ps-view-header">
              <div>
                <div class="ps-eyebrow">
                  <span class="ps-eyebrow-dot" style="background:#7c3aed" />
                  Departamento Pessoal
                </div>
                <h1 class="ps-title">Férias</h1>
              </div>
            </div>
            <div class="ps-empty-state">
              <q-icon name="beach_access" size="56px" style="color:rgba(124,58,237,0.25)" />
              <p>Nenhum período de férias registrado.</p>
            </div>
          </div>

          <!-- ══ RESCISÕES ══ -->
          <div v-else-if="activeNav === 'rescisoes'" class="ps-view">
            <div class="ps-view-header">
              <div>
                <div class="ps-eyebrow">
                  <span class="ps-eyebrow-dot" style="background:#dc2626" />
                  Departamento Pessoal
                </div>
                <h1 class="ps-title">Rescisões</h1>
              </div>
            </div>
            <div class="ps-empty-state">
              <q-icon name="person_remove" size="56px" style="color:rgba(220,38,38,0.25)" />
              <p>Nenhuma rescisão registrada.</p>
            </div>
          </div>

        </main>

      </q-page>
    </q-page-container>

  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase.js'

const router      = useRouter()
const logoOk      = ref(true)
const activeNav   = ref('dashboard')
const sidebarOpen = ref(true)

// ── Admissões ──────────────────────────────────────
const empresas            = ref([])
const carregandoEmpresas  = ref(false)
const empresaAberta       = ref(null)
const admBusca            = ref('')

const modalEmpresaAberto  = ref(false)
const novaEmpresaNome     = ref('')
const novaEmpresaCnpj     = ref('')

const modalAdmissaoAberto = ref(false)
const empresaSelecionada  = ref(null)
const novaAdmissao = ref({ nome_funcionario: '', funcao: '', data_admissao: '', salario: '', horas_semanais: '' })

// editar empresa
const modalEditarEmpresaAberto = ref(false)
const editandoEmpresa          = ref({ id: null, nome: '', cnpj: '' })

// editar admissão
const modalEditarAdmissaoAberto = ref(false)
const editandoAdmissao          = ref({})
const editandoAdmissaoEmp       = ref(null)

// lixeira
const lixeiraAberta    = ref(false)
const lixeiraEmpresas  = ref([])
const lixeiraAdmissoes = ref([])
const lixeiraCount     = ref(0)

// processos
const processoAberto      = ref(null)
const carregandoProcessos = ref(false)
const novoProcessoTitulo  = ref('')
const processosTemp       = ref([])

function mascararCnpj() {
  let v = novaEmpresaCnpj.value.replace(/\D/g, '').slice(0, 14)
  if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d+)$/, '$1.$2.$3/$4')
  else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d+)$/, '$1.$2.$3')
  else if (v.length > 2) v = v.replace(/^(\d{2})(\d+)$/, '$1.$2')
  novaEmpresaCnpj.value = v
}

const empresasFiltradas = computed(() => {
  const q = admBusca.value.trim().toLowerCase()
  if (!q) return empresas.value.map(e => ({ ...e, admissoesFiltradas: e.admissoes }))
  return empresas.value
    .map(e => {
      const matchEmp = e.nome.toLowerCase().includes(q) || (e.cnpj || '').replace(/\D/g,'').includes(q.replace(/\D/g,'')) || (e.cnpj || '').toLowerCase().includes(q)
      const admFiltradas = e.admissoes.filter(a => a.nome_funcionario.toLowerCase().includes(q) || (a.funcao || '').toLowerCase().includes(q))
      if (!matchEmp && admFiltradas.length === 0) return null
      return { ...e, admissoesFiltradas: matchEmp ? e.admissoes : admFiltradas }
    })
    .filter(Boolean)
})

async function carregarEmpresas() {
  carregandoEmpresas.value = true
  const { data: emps } = await supabase.from('ps_empresas').select('*').is('deleted_at', null).order('nome')
  const { data: adms } = await supabase.from('ps_admissoes').select('*').is('deleted_at', null).order('data_admissao', { ascending: false })
  empresas.value = (emps || []).map(e => ({
    ...e,
    admissoes: (adms || []).filter(a => a.empresa_id === e.id)
  }))
  carregandoEmpresas.value = false
}

function toggleEmpresa(id) {
  empresaAberta.value = empresaAberta.value === id ? null : id
}

async function salvarEmpresa() {
  const nome = novaEmpresaNome.value.trim()
  if (!nome) return
  const payload = { nome, cnpj: novaEmpresaCnpj.value.trim() || null }
  const { data } = await supabase.from('ps_empresas').insert(payload).select().single()
  if (data) {
    empresas.value.push({ ...data, admissoes: [] })
    empresaAberta.value = data.id
  }
  novaEmpresaNome.value = ''
  novaEmpresaCnpj.value = ''
  modalEmpresaAberto.value = false
}

function abrirModalAdmissao(emp) {
  empresaSelecionada.value = emp
  novaAdmissao.value = { nome_funcionario: '', funcao: '', data_admissao: '', salario: '', horas_semanais: '' }
  processosTemp.value = []
  novoProcessoTitulo.value = ''
  modalAdmissaoAberto.value = true
}

function fecharModalAdmissao() {
  modalAdmissaoAberto.value = false
  empresaSelecionada.value = null
  processosTemp.value = []
}

function adicionarProcessoTemp() {
  const titulo = novoProcessoTitulo.value.trim()
  if (!titulo) return
  processosTemp.value.push({ titulo, feito: false })
  novoProcessoTitulo.value = ''
}

async function salvarAdmissao() {
  const a = novaAdmissao.value
  const payload = {
    empresa_id:       empresaSelecionada.value.id,
    nome_funcionario: a.nome_funcionario.trim(),
    funcao:           a.funcao.trim(),
    data_admissao:    a.data_admissao || null,
    salario:          a.salario ? Number(a.salario) : null,
    horas_semanais:   a.horas_semanais ? Number(a.horas_semanais) : null,
  }
  const { data } = await supabase.from('ps_admissoes').insert(payload).select().single()
  if (data) {
    const emp = empresas.value.find(e => e.id === empresaSelecionada.value.id)
    if (emp) {
      let processosSalvos = []
      if (processosTemp.value.length) {
        const rows = processosTemp.value.map(p => ({ admissao_id: data.id, titulo: p.titulo, feito: p.feito }))
        const { data: procs } = await supabase.from('ps_admissao_processos').insert(rows).select()
        processosSalvos = procs || []
      }
      emp.admissoes.unshift({ ...data, _processos: processosSalvos })
    }
  }
  fecharModalAdmissao()
}

// ── soft delete empresa ─────────────────────────────
async function excluirEmpresa(emp) {
  const agora = new Date().toISOString()
  await supabase.from('ps_empresas').update({ deleted_at: agora }).eq('id', emp.id)
  empresas.value = empresas.value.filter(e => e.id !== emp.id)
  await contarLixeira()
}

// ── editar empresa ──────────────────────────────────
function abrirEditarEmpresa(emp) {
  editandoEmpresa.value = { id: emp.id, nome: emp.nome, cnpj: emp.cnpj || '' }
  modalEditarEmpresaAberto.value = true
}
async function salvarEditarEmpresa() {
  const { id, nome, cnpj } = editandoEmpresa.value
  await supabase.from('ps_empresas').update({ nome: nome.trim(), cnpj: cnpj.trim() || null }).eq('id', id)
  const emp = empresas.value.find(e => e.id === id)
  if (emp) { emp.nome = nome.trim(); emp.cnpj = cnpj.trim() || null }
  modalEditarEmpresaAberto.value = false
}

// ── soft delete admissão ────────────────────────────
async function excluirAdmissao(emp, adm) {
  const agora = new Date().toISOString()
  await supabase.from('ps_admissoes').update({ deleted_at: agora }).eq('id', adm.id)
  emp.admissoes = emp.admissoes.filter(a => a.id !== adm.id)
  await contarLixeira()
}

// ── editar admissão ─────────────────────────────────
async function abrirEditarAdmissao(emp, adm) {
  editandoAdmissaoEmp.value = emp
  editandoAdmissao.value = { ...adm, _processos: adm._processos ? [...adm._processos] : undefined }
  novoProcessoTitulo.value = ''
  modalEditarAdmissaoAberto.value = true
  if (!editandoAdmissao.value._processos) {
    carregandoProcessos.value = true
    const { data } = await supabase.from('ps_admissao_processos').select('*').eq('admissao_id', adm.id).order('created_at')
    editandoAdmissao.value._processos = data || []
    adm._processos = editandoAdmissao.value._processos
    carregandoProcessos.value = false
  }
}

async function adicionarProcessoModal() {
  const titulo = novoProcessoTitulo.value.trim()
  if (!titulo) return
  const adm = editandoAdmissao.value
  const { data } = await supabase.from('ps_admissao_processos').insert({ admissao_id: adm.id, titulo, feito: false }).select().single()
  if (data) {
    if (!adm._processos) adm._processos = []
    adm._processos.push(data)
    const orig = editandoAdmissaoEmp.value?.admissoes.find(a => a.id === adm.id)
    if (orig) { if (!orig._processos) orig._processos = []; orig._processos.push(data) }
  }
  novoProcessoTitulo.value = ''
}

async function toggleProcessoModal(proc) {
  await setStatusProcessoModal(proc, proc.feito ? 'pendente' : 'ok')
}

async function excluirProcessoModal(proc) {
  await supabase.from('ps_admissao_processos').delete().eq('id', proc.id)
  const adm = editandoAdmissao.value
  adm._processos = adm._processos.filter(p => p.id !== proc.id)
  const orig = editandoAdmissaoEmp.value?.admissoes.find(a => a.id === adm.id)
  if (orig?._processos) orig._processos = orig._processos.filter(p => p.id !== proc.id)
}
async function salvarEditarAdmissao() {
  const a = editandoAdmissao.value
  const payload = {
    nome_funcionario: a.nome_funcionario.trim(),
    funcao:           (a.funcao || '').trim(),
    data_admissao:    a.data_admissao || null,
    salario:          a.salario ? Number(a.salario) : null,
    horas_semanais:   a.horas_semanais ? Number(a.horas_semanais) : null,
  }
  await supabase.from('ps_admissoes').update(payload).eq('id', a.id)
  const emp = editandoAdmissaoEmp.value
  const idx = emp.admissoes.findIndex(x => x.id === a.id)
  if (idx !== -1) emp.admissoes[idx] = { ...emp.admissoes[idx], ...payload }
  modalEditarAdmissaoAberto.value = false
}

// ── lixeira ─────────────────────────────────────────
async function contarLixeira() {
  const { count: ce } = await supabase.from('ps_empresas').select('*', { count: 'exact', head: true }).not('deleted_at', 'is', null)
  const { count: ca } = await supabase.from('ps_admissoes').select('*', { count: 'exact', head: true }).not('deleted_at', 'is', null)
  lixeiraCount.value = (ce || 0) + (ca || 0)
}

async function abrirLixeira() {
  const { data: emps } = await supabase.from('ps_empresas').select('*').not('deleted_at', 'is', null).order('nome')
  const { data: adms } = await supabase.from('ps_admissoes').select('*, ps_empresas(nome)').not('deleted_at', 'is', null).order('nome_funcionario')
  lixeiraEmpresas.value = emps || []
  lixeiraAdmissoes.value = (adms || []).map(a => ({ ...a, _empresa_nome: a.ps_empresas?.nome || '—' }))
  lixeiraAberta.value = true
}

async function restaurarEmpresa(e) {
  await supabase.from('ps_empresas').update({ deleted_at: null }).eq('id', e.id)
  lixeiraEmpresas.value = lixeiraEmpresas.value.filter(x => x.id !== e.id)
  await carregarEmpresas()
  await contarLixeira()
}

async function restaurarAdmissao(a) {
  await supabase.from('ps_admissoes').update({ deleted_at: null }).eq('id', a.id)
  lixeiraAdmissoes.value = lixeiraAdmissoes.value.filter(x => x.id !== a.id)
  await carregarEmpresas()
  await contarLixeira()
}

async function excluirPermanenteEmpresa(e) {
  await supabase.from('ps_admissoes').delete().eq('empresa_id', e.id)
  await supabase.from('ps_empresas').delete().eq('id', e.id)
  lixeiraEmpresas.value = lixeiraEmpresas.value.filter(x => x.id !== e.id)
  await contarLixeira()
}

async function excluirPermanenteAdmissao(a) {
  await supabase.from('ps_admissoes').delete().eq('id', a.id)
  lixeiraAdmissoes.value = lixeiraAdmissoes.value.filter(x => x.id !== a.id)
  await contarLixeira()
}

// ── processos da admissão ───────────────────────────
async function toggleProcessos(adm) {
  if (processoAberto.value === adm.id) {
    processoAberto.value = null
    return
  }
  processoAberto.value = adm.id
  novoProcessoTitulo.value = ''
  if (!adm._processos) {
    carregandoProcessos.value = true
    const { data } = await supabase
      .from('ps_admissao_processos')
      .select('*')
      .eq('admissao_id', adm.id)
      .order('created_at')
    adm._processos = data || []
    carregandoProcessos.value = false
  }
}

async function adicionarProcesso(adm) {
  const titulo = novoProcessoTitulo.value.trim()
  if (!titulo) return
  const { data } = await supabase
    .from('ps_admissao_processos')
    .insert({ admissao_id: adm.id, titulo, feito: false })
    .select().single()
  if (data) {
    if (!adm._processos) adm._processos = []
    adm._processos.push(data)
  }
  novoProcessoTitulo.value = ''
}

function formatarFeitoEm(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
         d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const justificandoId = ref(null)

function toggleJustificativa(proc) {
  if (justificandoId.value === proc.id) { justificandoId.value = null; return }
  proc._justTemp = proc.justificativa || ''
  justificandoId.value = proc.id
}

async function setStatusProcesso(adm, proc, novoStatus) {
  const status = proc.status === novoStatus ? 'pendente' : novoStatus
  const status_em = status !== 'pendente' ? new Date().toISOString() : null
  const feito = status === 'ok'
  await supabase.from('ps_admissao_processos').update({ status, status_em, feito }).eq('id', proc.id)
  proc.status = status; proc.status_em = status_em; proc.feito = feito
}

async function setStatusProcessoModal(proc, novoStatus) {
  const status = proc.status === novoStatus ? 'pendente' : novoStatus
  const status_em = status !== 'pendente' ? new Date().toISOString() : null
  const feito = status === 'ok'
  await supabase.from('ps_admissao_processos').update({ status, status_em, feito }).eq('id', proc.id)
  proc.status = status; proc.status_em = status_em; proc.feito = feito
}

async function salvarJustificativa(adm, proc) {
  const justificativa = (proc._justTemp || '').trim()
  await supabase.from('ps_admissao_processos').update({ justificativa }).eq('id', proc.id)
  proc.justificativa = justificativa
  justificandoId.value = null
}

async function salvarJustificativaModal(proc) {
  const justificativa = (proc._justTemp || '').trim()
  await supabase.from('ps_admissao_processos').update({ justificativa }).eq('id', proc.id)
  proc.justificativa = justificativa
  justificandoId.value = null
}

async function toggleProcesso(adm, proc) {
  await setStatusProcesso(adm, proc, proc.feito ? 'pendente' : 'ok')
}

async function excluirProcesso(adm, proc) {
  await supabase.from('ps_admissao_processos').delete().eq('id', proc.id)
  adm._processos = adm._processos.filter(p => p.id !== proc.id)
}

async function esvaziarLixeira() {
  const empIds = lixeiraEmpresas.value.map(e => e.id)
  if (empIds.length > 0) {
    await supabase.from('ps_admissoes').delete().in('empresa_id', empIds)
    await supabase.from('ps_empresas').delete().in('id', empIds)
  }
  await supabase.from('ps_admissoes').delete().not('deleted_at', 'is', null)
  lixeiraEmpresas.value = []
  lixeiraAdmissoes.value = []
  await contarLixeira()
}

onMounted(async () => { await carregarEmpresas(); await contarLixeira() })

// Rotinas do DP — dropdown no sidebar
const rotinasExpanded = ref(true)
const activeSubgrupo  = ref('agenda')

const rotinasSubgrupos = [
  { id: 'agenda',       label: 'Agenda',                numero: null,  count: 28  },
  { id: 'solicitacoes', label: 'Solicitações Gerais',   numero: '1·0', count: 7   },
  { id: 'feriados',     label: 'Avisos de Feriados',    numero: '1·3', count: 6   },
  { id: 'dctfweb',      label: 'Envio de DCTFWeb',      numero: '1·4', count: null },
  { id: 'trabalhistas', label: 'Consultas Trabalhistas',numero: '1·5', count: 93  },
  { id: 'fgts',         label: 'Certidão do FGTS',      numero: '1·6', count: 268 },
  { id: 'rendimentos',  label: 'Informes de Rendimentos',numero:'1·7', count: 1   },
]

const subgrupoLabel = computed(() =>
  rotinasSubgrupos.find(s => s.id === activeSubgrupo.value)?.label ?? ''
)

const navItems = [
  { key: 'dashboard', label: 'Dashboard',  icon: 'dashboard',    color: '#0d9488' },
  {
    key: 'rotinas', label: 'Rotinas', icon: 'checklist', color: '#d97706',
    subgrupos: rotinasSubgrupos,
  },
  { key: 'admissoes', label: 'Admissões',           icon: 'person_add',   color: '#16a34a' },
  { key: 'folhas',    label: 'Folhas',              icon: 'payments',     color: '#2563eb' },
  { key: 'ferias',    label: 'Férias',              icon: 'beach_access', color: '#7c3aed' },
  { key: 'rescisoes', label: 'Rescisões',           icon: 'person_remove',color: '#dc2626' },
]

function toggleRotinas(item) {
  if (activeNav.value !== item.key) {
    activeNav.value = item.key
    rotinasExpanded.value = true
  } else {
    rotinasExpanded.value = !rotinasExpanded.value
  }
}

function selectSubgrupo(id) {
  activeNav.value = 'rotinas'
  activeSubgrupo.value = id
}

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
  width: 210px; flex-shrink: 0; overflow: hidden;
  background: rgba(255,255,255,0.02);
  border-right: 1px solid rgba(255,255,255,0.05);
  padding: 20px 10px;
  transition: width 0.22s ease, padding 0.22s ease, opacity 0.18s ease;
}
.ps-sidebar--closed {
  width: 0; padding: 20px 0; opacity: 0; border-right-color: transparent;
}
.ps-nav { display: flex; flex-direction: column; gap: 4px; }
.ps-nav-item {
  display: flex; align-items: center; gap: 9px;
  width: 100%; padding: 9px 12px; border-radius: 10px;
  background: transparent; border: none; cursor: pointer;
  color: rgba(255,255,255,0.4); font-size: 0.82rem;
  transition: all 0.15s; text-align: left;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.ps-nav-item:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
.ps-nav-item--active {
  background: color-mix(in oklab, var(--nav-color, #0d9488) 18%, transparent) !important;
  color: color-mix(in oklab, var(--nav-color, #0d9488) 90%, white) !important;
  font-weight: 600;
}
.ps-nav-item--parent { justify-content: space-between; }
.ps-nav-label { flex: 1; }
.ps-nav-chevron { opacity: 0.4; flex-shrink: 0; }
.ps-nav-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  opacity: 0.55;
}
.ps-nav-item--active .ps-nav-dot { opacity: 1; }
.ps-eyebrow-dot {
  display: inline-block; width: 7px; height: 7px; border-radius: 50%;
}

/* ── Dropdown filhos ── */
.ps-nav-children { display: flex; flex-direction: column; margin-bottom: 4px; }
.ps-nav-child {
  display: flex; align-items: center; gap: 7px;
  width: 100%; padding: 7px 12px 7px 20px; border-radius: 8px;
  background: transparent; border: none; cursor: pointer;
  color: rgba(255,255,255,0.35); font-size: 0.78rem;
  transition: all 0.12s; text-align: left;
}
.ps-nav-child:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6); }
.ps-nav-child--active {
  background: color-mix(in oklab, var(--nav-color, #d97706) 12%, transparent) !important;
  color: color-mix(in oklab, var(--nav-color, #d97706) 80%, white) !important;
  font-weight: 600;
}
.ps-nav-child-bar {
  width: 2px; height: 14px; border-radius: 2px; flex-shrink: 0; opacity: 0.7;
}
.ps-nav-child--active .ps-nav-child-bar { opacity: 1; }
.ps-nav-child-num {
  font-size: 0.68rem; color: rgba(255,255,255,0.22);
  min-width: 22px; font-variant-numeric: tabular-nums;
}
.ps-nav-child-label { flex: 1; text-transform: uppercase; letter-spacing: 0.03em; }
.ps-nav-child-count {
  font-size: 0.68rem; color: rgba(255,255,255,0.2);
  font-variant-numeric: tabular-nums;
}

/* ── Main ── */
.ps-main { flex: 1; padding: 28px 32px; min-width: 0; overflow-y: auto; }
.ps-view-header { margin-bottom: 28px; }
.ps-eyebrow { display: flex; align-items: center; gap: 7px; font-size: 0.75rem; color: rgba(255,255,255,0.35); margin-bottom: 4px; }
.ps-eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
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

/* ── Dashboard ── */
.db-cards {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px; margin-bottom: 32px;
}
.db-card {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px; border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid color-mix(in oklab, var(--card-color) 25%, transparent);
  transition: background 0.15s;
}
.db-card:hover { background: rgba(255,255,255,0.07); }
.db-card-icon {
  display: flex; align-items: center; justify-content: center;
  width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
  background: color-mix(in oklab, var(--card-color) 18%, transparent);
  color: var(--card-color);
}
.db-card-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.db-card-label { font-size: 0.72rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.04em; }
.db-card-value { font-size: 1.5rem; font-weight: 700; color: rgba(255,255,255,0.85); line-height: 1; }
.db-placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 60px 0; color: rgba(255,255,255,0.2); font-size: 0.88rem;
}

/* ── Admissões ── */
.adm-search-wrap {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; padding: 0 12px; margin-bottom: 18px;
  transition: border-color 0.15s;
}
.adm-search-wrap:focus-within { border-color: rgba(22,163,74,0.35); }
.adm-search-icon { color: rgba(255,255,255,0.25); flex-shrink: 0; }
.adm-search-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: rgba(255,255,255,0.8); font-size: 0.86rem; padding: 10px 0;
}
.adm-search-input::placeholder { color: rgba(255,255,255,0.2); }
.adm-search-clear {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.25); display: flex; align-items: center;
  transition: color 0.12s; padding: 0;
}
.adm-search-clear:hover { color: rgba(255,255,255,0.5); }

.adm-emp-cnpj {
  font-size: 0.72rem; color: rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.04); border-radius: 5px;
  padding: 2px 7px; font-variant-numeric: tabular-nums;
}

.adm-lista { display: flex; flex-direction: column; gap: 10px; }

.adm-empresa {
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; overflow: hidden;
  background: rgba(255,255,255,0.02);
}

.adm-emp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; cursor: pointer; user-select: none;
  transition: background 0.12s;
}
.adm-emp-header:hover { background: rgba(255,255,255,0.03); }
.adm-emp-left { display: flex; align-items: center; gap: 10px; }
.adm-emp-icon {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
  background: rgba(22,163,74,0.15); color: #4ade80;
}
.adm-emp-nome { font-size: 0.88rem; font-weight: 600; color: rgba(255,255,255,0.8); }
.adm-emp-badge {
  font-size: 0.7rem; background: rgba(22,163,74,0.15);
  color: #4ade80; border-radius: 20px; padding: 1px 8px;
  font-weight: 600;
}
.adm-btn-new {
  display: flex; align-items: center; gap: 5px;
  background: rgba(22,163,74,0.1); border: 1px solid rgba(22,163,74,0.2);
  color: #4ade80; border-radius: 7px;
  padding: 5px 12px; font-size: 0.75rem; cursor: pointer; transition: all 0.12s;
}
.adm-btn-new:hover { background: rgba(22,163,74,0.2); }

.adm-emp-body { border-top: 1px solid rgba(255,255,255,0.05); }

.adm-empty {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 24px; color: rgba(255,255,255,0.2); font-size: 0.82rem;
}

/* tabela admissões */
.adm-table-head, .adm-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.2fr 90px 110px 160px;
  gap: 8px; align-items: center;
  padding: 9px 16px; font-size: 0.8rem;
}
.adm-table-head {
  background: rgba(255,255,255,0.025);
  color: rgba(255,255,255,0.3); font-size: 0.7rem;
  text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.adm-row { border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.1s; }
.adm-row:last-child { border-bottom: none; }
.adm-row:hover { background: rgba(255,255,255,0.025); }
.adm-row-nome { color: rgba(255,255,255,0.8); font-weight: 500; }
.adm-row-cell { color: rgba(255,255,255,0.5); }
.adm-row-salario { color: #4ade80; }
/* ── wrapper para admissão + processos ── */
.adm-row-wrap { border-bottom: 1px solid rgba(255,255,255,0.03); }
.adm-row-wrap:last-child { border-bottom: none; }
.adm-row { border-bottom: none; }

/* botão processos */
.adm-proc-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 9px; border-radius: 6px; border: none; cursor: pointer;
  font-size: 0.72rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
  background: rgba(99,102,241,0.1); color: rgba(165,180,252,0.6);
  border: 1px solid rgba(99,102,241,0.15);
  transition: all 0.12s; white-space: nowrap; position: relative;
}
.adm-proc-btn:hover { background: rgba(99,102,241,0.18); color: rgba(165,180,252,0.9); border-color: rgba(99,102,241,0.3); }
.adm-proc-btn--active { background: rgba(99,102,241,0.22) !important; color: rgba(165,180,252,1) !important; border-color: rgba(99,102,241,0.4) !important; }
.adm-proc-count {
  background: rgba(99,102,241,0.7); color: #fff;
  font-size: 0.6rem; border-radius: 20px; padding: 1px 5px; line-height: 1.3;
}

/* checklist area */
.adm-processos {
  border-top: 1px solid rgba(99,102,241,0.12);
  background: rgba(99,102,241,0.04);
  padding: 12px 16px 10px;
}
.adm-proc-header {
  display: flex; align-items: center; gap: 7px;
  font-size: 0.72rem; color: rgba(255,255,255,0.35);
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 10px; font-weight: 600;
}
.adm-proc-fechar {
  background: none; border: none; cursor: pointer; padding: 2px 4px;
  color: rgba(255,255,255,0.2); border-radius: 5px; line-height: 1;
  transition: all 0.12s; display: flex; align-items: center;
}
.adm-proc-fechar:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.6); }
.adm-proc-prog {
  background: rgba(99,102,241,0.15); color: rgba(165,180,252,0.7);
  border-radius: 20px; padding: 1px 8px; font-size: 0.68rem;
}
.adm-proc-list { display: flex; flex-direction: column; gap: 3px; margin-bottom: 10px; }
.adm-proc-loading, .adm-proc-empty {
  display: flex; align-items: center; justify-content: center;
  gap: 6px; padding: 8px; color: rgba(255,255,255,0.2); font-size: 0.78rem;
}

.adm-proc-item {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 6px; border-radius: 7px; transition: background 0.1s;
}
.adm-proc-item:hover { background: rgba(255,255,255,0.04); }
.adm-proc-item--done .adm-proc-titulo { text-decoration: line-through; color: rgba(255,255,255,0.28) !important; }

/* três botões de ação por processo */
.adm-proc-item { flex-wrap: wrap; }
.adm-proc-acoes { display: flex; align-items: center; gap: 4px; margin-left: auto; flex-shrink: 0; }
.adm-proc-btn-acao {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px; border: 1px solid transparent;
  cursor: pointer; transition: all 0.13s; flex-shrink: 0;
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.3);
  border-color: rgba(255,255,255,0.08);
}
/* OK */
.adm-proc-btn-ok:hover { background: rgba(22,163,74,0.1); color: rgba(74,222,128,0.8); border-color: rgba(22,163,74,0.25); }
.adm-proc-btn-ok.adm-proc-btn-acao--ativo { background: rgba(22,163,74,0.18); color: #4ade80; border-color: rgba(22,163,74,0.4); }
/* Não */
.adm-proc-btn-nao:hover { background: rgba(239,68,68,0.1); color: rgba(252,165,165,0.8); border-color: rgba(239,68,68,0.25); }
.adm-proc-btn-nao.adm-proc-btn-acao--ativo { background: rgba(239,68,68,0.15); color: #fca5a5; border-color: rgba(239,68,68,0.35); }
/* Justificar */
.adm-proc-btn-just:hover { background: rgba(234,179,8,0.1); color: rgba(253,224,71,0.8); border-color: rgba(234,179,8,0.25); }
.adm-proc-btn-just.adm-proc-btn-acao--ativo { background: rgba(234,179,8,0.15); color: #fde047; border-color: rgba(234,179,8,0.35); }
/* timestamp pequeno dentro do botão */
.adm-proc-ts { font-size: 0.63rem; opacity: 0.8; font-weight: 400; }

/* área de justificativa inline */
.adm-proc-just-area {
  width: 100%; margin-top: 6px; padding: 0 6px;
  display: flex; flex-direction: column; gap: 6px;
}
.adm-proc-just-input {
  width: 100%; background: rgba(255,255,255,0.04);
  border: 1px solid rgba(234,179,8,0.25); border-radius: 7px;
  color: rgba(255,255,255,0.75); font-size: 0.8rem;
  padding: 7px 10px; resize: none; outline: none; font-family: inherit;
  transition: border-color 0.12s;
}
.adm-proc-just-input:focus { border-color: rgba(234,179,8,0.5); }
.adm-proc-just-footer { display: flex; gap: 6px; justify-content: flex-end; }
.adm-proc-just-salvar {
  background: rgba(234,179,8,0.15); border: 1px solid rgba(234,179,8,0.3);
  color: #fde047; border-radius: 6px; padding: 4px 12px;
  font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.12s;
}
.adm-proc-just-salvar:hover { background: rgba(234,179,8,0.25); }
.adm-proc-just-cancelar {
  background: transparent; border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.35); border-radius: 6px; padding: 4px 10px;
  font-size: 0.75rem; cursor: pointer; transition: all 0.12s;
}
.adm-proc-just-cancelar:hover { color: rgba(255,255,255,0.6); }
/* badge de justificativa */
.adm-proc-just-badge {
  width: 100%; padding: 4px 8px; margin-top: 2px;
  font-size: 0.74rem; color: rgba(253,224,71,0.55);
  display: flex; align-items: flex-start; gap: 5px; font-style: italic;
}

.adm-proc-titulo {
  flex: 1; font-size: 0.82rem; color: rgba(255,255,255,0.7); line-height: 1.3;
}
.adm-proc-del {
  background: none; border: none; cursor: pointer; padding: 2px;
  color: rgba(255,255,255,0.15); display: flex; align-items: center;
  border-radius: 4px; transition: all 0.12s; opacity: 0;
}
.adm-proc-item:hover .adm-proc-del { opacity: 1; }
.adm-proc-del:hover { color: rgba(239,68,68,0.7); background: rgba(239,68,68,0.08); }

.adm-proc-add {
  display: flex; align-items: center; gap: 7px;
  border-top: 1px solid rgba(255,255,255,0.05); padding-top: 9px;
}
.adm-proc-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: rgba(255,255,255,0.7); font-size: 0.82rem;
}
.adm-proc-input::placeholder { color: rgba(255,255,255,0.2); }
.adm-proc-save {
  background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.25);
  color: rgba(165,180,252,0.8); border-radius: 6px;
  padding: 4px 12px; font-size: 0.75rem; cursor: pointer; transition: all 0.12s;
}
.adm-proc-save:hover:not(:disabled) { background: rgba(99,102,241,0.25); }
.adm-proc-save:disabled { opacity: 0.35; cursor: not-allowed; }

.adm-emp-actions { display: flex; align-items: center; gap: 4px; }
.adm-row-btns { display: flex; align-items: center; gap: 4px; justify-content: flex-end; }
.adm-row-action {
  display: flex; align-items: center; justify-content: center;
  width: 27px; height: 27px; border-radius: 6px;
  background: transparent; border: none; cursor: pointer;
  color: rgba(255,255,255,0.2); transition: all 0.12s;
}
.adm-row-edit:hover { background: rgba(59,130,246,0.1); color: rgba(96,165,250,0.7); }
.adm-row-del:hover  { background: rgba(239,68,68,0.1);  color: rgba(239,68,68,0.6); }

/* lixeira button */
.adm-btn-lixeira {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.35); border-radius: 8px;
  padding: 7px 14px; font-size: 0.8rem; cursor: pointer; transition: all 0.12s;
  position: relative;
}
.adm-btn-lixeira:hover { background: rgba(239,68,68,0.08); color: rgba(239,68,68,0.5); border-color: rgba(239,68,68,0.2); }
.adm-lixeira-badge {
  background: rgba(239,68,68,0.6); color: #fff;
  border-radius: 20px; font-size: 0.65rem; font-weight: 700;
  padding: 1px 6px; min-width: 18px; text-align: center;
}

/* lixeira modal rows */
.lx-section-label {
  font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em;
  color: rgba(255,255,255,0.25); padding: 12px 20px 6px; font-weight: 600;
}
.lx-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);
  gap: 12px;
}
.lx-row:hover { background: rgba(255,255,255,0.02); }
.lx-row-info { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
.lx-row-nome { font-size: 0.85rem; color: rgba(255,255,255,0.65); font-weight: 500; }
.lx-row-sub { display: block; font-size: 0.72rem; color: rgba(255,255,255,0.3); margin-top: 1px; }
.lx-btn-restore {
  display: flex; align-items: center; gap: 5px; flex-shrink: 0;
  background: rgba(22,163,74,0.1); border: 1px solid rgba(22,163,74,0.2);
  color: #4ade80; border-radius: 7px; padding: 5px 12px;
  font-size: 0.75rem; cursor: pointer; transition: all 0.12s;
}
.lx-btn-restore:hover { background: rgba(22,163,74,0.2); }

.lx-row-btns { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

.lx-btn-perm {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 7px;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);
  color: rgba(239,68,68,0.5); cursor: pointer; transition: all 0.12s;
}
.lx-btn-perm:hover { background: rgba(239,68,68,0.18); color: rgba(239,68,68,0.85); border-color: rgba(239,68,68,0.3); }

.ps-btn-perm-all {
  display: flex; align-items: center; gap: 6px;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
  color: rgba(239,68,68,0.6); border-radius: 8px;
  padding: 7px 16px; font-size: 0.8rem; cursor: pointer; transition: all 0.12s;
}
.ps-btn-perm-all:hover { background: rgba(239,68,68,0.16); color: rgba(239,68,68,0.9); }

/* ── Modal compartilhado ── */
.ps-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.ps-modal {
  background: #0e1a2b; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px; width: 420px; max-width: 95vw;
  box-shadow: 0 24px 60px rgba(0,0,0,0.5);
}
.ps-modal--wide { width: 580px; }
.ps-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 14px; border-bottom: 1px solid rgba(255,255,255,0.07);
  font-size: 0.92rem; font-weight: 600; color: rgba(255,255,255,0.85);
}
.ps-modal-head button {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.3); transition: color 0.12s;
}
.ps-modal-head button:hover { color: rgba(255,255,255,0.7); }
.ps-modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
.ps-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.ps-field { display: flex; flex-direction: column; gap: 5px; }
.ps-field--full { grid-column: 1 / -1; }
.ps-field span { font-size: 0.72rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; }
.ps-input {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px; padding: 9px 12px; color: rgba(255,255,255,0.85);
  font-size: 0.88rem; width: 100%; outline: none; transition: border-color 0.12s;
}
.ps-input:focus { border-color: rgba(22,163,74,0.4); }
.ps-input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
.ps-modal-foot {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 14px 20px 18px; border-top: 1px solid rgba(255,255,255,0.07);
}
.ps-btn-ghost {
  background: transparent; border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.4); border-radius: 8px;
  padding: 8px 16px; font-size: 0.82rem; cursor: pointer; transition: all 0.12s;
}
.ps-btn-ghost:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); }
.ps-btn-confirm {
  display: flex; align-items: center; gap: 6px;
  background: rgba(22,163,74,0.2); border: 1px solid rgba(22,163,74,0.35);
  color: #4ade80; border-radius: 8px;
  padding: 8px 18px; font-size: 0.82rem; cursor: pointer; transition: all 0.12s;
}
.ps-btn-confirm:hover:not(:disabled) { background: rgba(22,163,74,0.3); }
.ps-btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── seção processos dentro do modal ── */
.ps-modal-proc-section {
  border-top: 1px solid rgba(99,102,241,0.15);
  padding: 16px 20px 4px;
}
.ps-modal-proc-header {
  display: flex; align-items: center; gap: 7px;
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: rgba(165,180,252,0.6); margin-bottom: 12px;
}
.ps-modal-proc-prog {
  margin-left: auto;
  background: rgba(99,102,241,0.15); color: rgba(165,180,252,0.8);
  border-radius: 20px; padding: 1px 8px; font-size: 0.68rem;
}
.ps-modal-proc-loading {
  display: flex; align-items: center; gap: 7px;
  color: rgba(255,255,255,0.3); font-size: 0.8rem; padding: 8px 0;
}
.ps-modal-proc-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.ps-modal-proc-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 7px;
  background: rgba(255,255,255,0.03); transition: background 0.1s;
}
.ps-modal-proc-item:hover { background: rgba(255,255,255,0.055); }
.ps-modal-proc-item--done .ps-modal-proc-title {
  text-decoration: line-through; color: rgba(255,255,255,0.3);
}
.ps-modal-proc-check {
  background: none; border: none; cursor: pointer; padding: 0; line-height: 1;
  color: rgba(165,180,252,0.45); transition: color 0.12s; flex-shrink: 0;
}
.ps-modal-proc-item--done .ps-modal-proc-check { color: rgba(99,102,241,0.8); }
.ps-modal-proc-check:hover { color: rgba(165,180,252,0.9); }
.ps-modal-proc-title { flex: 1; font-size: 0.83rem; color: rgba(255,255,255,0.75); }
.ps-modal-proc-del {
  background: none; border: none; cursor: pointer; padding: 0; line-height: 1;
  color: rgba(255,255,255,0.12); transition: color 0.12s; flex-shrink: 0;
  opacity: 0;
}
.ps-modal-proc-item:hover .ps-modal-proc-del { opacity: 1; }
.ps-modal-proc-del:hover { color: rgba(239,68,68,0.7); }
.ps-modal-proc-empty {
  font-size: 0.8rem; color: rgba(255,255,255,0.2);
  padding: 4px 0 10px; font-style: italic;
}
.ps-modal-proc-add {
  display: flex; gap: 7px; align-items: center;
  padding-bottom: 14px;
}
.ps-input--sm { font-size: 0.82rem; padding: 7px 10px; }
.ps-btn-proc-add {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 7px; flex-shrink: 0;
  background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.25);
  color: rgba(165,180,252,0.7); cursor: pointer; transition: all 0.12s;
}
.ps-btn-proc-add:hover:not(:disabled) { background: rgba(99,102,241,0.25); color: #a5b4fc; }
.ps-btn-proc-add:disabled { opacity: 0.35; cursor: not-allowed; }

/* transição modal */
.ps-fade-enter-active, .ps-fade-leave-active { transition: opacity 0.18s; }
.ps-fade-enter-from, .ps-fade-leave-to { opacity: 0; }

</style>
