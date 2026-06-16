export const sectors = [
  {
    slug: 'gerenciamento',
    label: 'Gerenciamento',
    description: 'Indicadores, relatórios e visão geral da operação',
    icon: 'insights',
    color: '#1a3fa0',
    locked: false
  },
  {
    slug: 'pessoal',
    label: 'Pessoal',
    description: 'Colaboradores, ponto e gestão de equipes',
    icon: 'groups',
    color: '#0d9488',
    locked: true
  },
  {
    slug: 'financeiro',
    label: 'Financeiro',
    description: 'Contas, pagamentos e fluxo de caixa',
    icon: 'payments',
    color: '#5ab82e',
    locked: true
  },
  {
    slug: 'administrativo',
    label: 'Administrativo',
    description: 'Documentos, contratos e processos internos',
    icon: 'business_center',
    color: '#7c3aed',
    locked: true
  }
]

export function findSector(slug) {
  return sectors.find(s => s.slug === slug) || null
}
