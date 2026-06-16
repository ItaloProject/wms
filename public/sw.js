const CACHE = 'wms-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// Recebe dados do app e agenda verificação
self.addEventListener('message', e => {
  if (e.data?.type === 'CHECK_PRAZOS') {
    verificarENotificar(e.data.registros)
  }
})

function diasRestantes(reg) {
  if (!reg.dataVencimento) return 10
  const venc = new Date(reg.dataVencimento)
  const hoje = new Date()
  venc.setHours(0,0,0,0); hoje.setHours(0,0,0,0)
  return Math.round((venc - hoje) / 86400000)
}

function verificarENotificar(registros) {
  if (!registros?.length) return

  registros.forEach(reg => {
    const dias = diasRestantes(reg)
    const prazo = reg.prazo || 'normal'
    const nome = reg.razaoSocial || 'Processo sem nome'
    const tag = `wms-${reg.id}`

    if (prazo === 'urgente') {
      self.registration.showNotification('🔴 Processo Urgente', {
        body: `${nome} — ${dias < 0 ? Math.abs(dias) + ' dias vencido' : dias + ' dias restantes'}`,
        icon: '/logo.png',
        badge: '/logo.png',
        tag,
        requireInteraction: true,
        data: { url: '/' }
      })
    } else if (dias < 0) {
      self.registration.showNotification('⚠️ Prazo Vencido', {
        body: `${nome} está vencido há ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? '' : 's'}`,
        icon: '/logo.png',
        badge: '/logo.png',
        tag,
        requireInteraction: true,
        data: { url: '/' }
      })
    } else if (dias <= 3) {
      self.registration.showNotification('⏰ Prazo Próximo', {
        body: `${nome} — vence em ${dias === 0 ? 'hoje' : dias + ' dia' + (dias === 1 ? '' : 's')}`,
        icon: '/logo.png',
        badge: '/logo.png',
        tag,
        data: { url: '/' }
      })
    }
  })
}

// Clique na notificação abre o app
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      if (clients.length) return clients[0].focus()
      return self.clients.openWindow(e.notification.data?.url || '/')
    })
  )
})
