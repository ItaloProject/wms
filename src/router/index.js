import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import LoginPage from '../pages/LoginPage.vue'
import GerenciamentoPage from '../pages/GerenciamentoPage.vue'
import { findSector } from '../sectors'

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
    { path: '/gerenciamento', name: 'gerenciamento', component: GerenciamentoPage },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

export default router
