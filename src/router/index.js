import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import LoginPage from '../pages/LoginPage.vue'
import GerenciamentoPage from '../pages/GerenciamentoPage.vue'
import { findSector } from '../sectors'
import { supabase } from '../lib/supabase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    {
      path: '/login/:sector',
      name: 'login',
      component: LoginPage,
      beforeEnter: (to) => {
        const sector = findSector(to.params.sector)
        if (!sector || sector.locked) return { name: 'home' }
        return true
      }
    },
    {
      path: '/gerenciamento',
      name: 'gerenciamento',
      component: GerenciamentoPage,
      meta: { requiresAuth: true }
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { name: 'login', params: { sector: 'gerenciamento' } }
  return true
})

export default router
