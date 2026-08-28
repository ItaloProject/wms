export const sectors = [
  {
    slug: 'gerenciamento',
    label: 'Gerenciamento',
    description: 'Indicadores, relatórios e visão geral da operação',
    icon: 'trending_up',
    color: 'oklch(0.52 0.16 258)',
    locked: false
  },
  {
    slug: 'pessoal',
    label: 'Pessoal',
    description: 'Folha de ponto, admissões, rescisões e férias',
    icon: 'groups',
    color: 'oklch(0.6 0.11 185)',
    locked: false
  },
  {
    slug: 'financeiro',
    label: 'Financeiro',
    description: 'Contas, pagamentos e fluxo de caixa',
    icon: 'account_balance_wallet',
    color: 'oklch(0.64 0.19 143)',
    locked: true
  },
  {
    slug: 'administrativo',
    label: 'Administrativo',
    description: 'Documentos, contratos e processos internos',
    icon: 'work',
    color: 'oklch(0.56 0.21 300)',
    locked: true
  }
]

export function findSector(slug) {
  return sectors.find(s => s.slug === slug) || null
}
