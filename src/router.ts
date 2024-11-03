import { createRouter, createWebHistory } from 'vue-router'
import { appRoutesArray } from '@/config/appRoutes'

export const appRouter = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: appRoutesArray.map((appRoute) => ({
    path: appRoute.PATH,
    name: appRoute.NAME,
    component: appRoute.COMPONENT
  }))
})
