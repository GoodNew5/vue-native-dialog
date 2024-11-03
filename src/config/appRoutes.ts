import type { Component } from 'vue'

export interface appRoute {
  NAME: string
  PATH: string
  APP_MENU_LINK_TITLE_LOCALE_KEY: string
  APP_MENU_LINK_DESCRIPTION_LOCALE_KEY: string
  COMPONENT: Component
}

export const appRoutes: Record<string, appRoute> = {
  HOME_PAGE: {
    NAME: 'home',
    PATH: '/',
    APP_MENU_LINK_TITLE_LOCALE_KEY: 'appMenuLinks.home',
    APP_MENU_LINK_DESCRIPTION_LOCALE_KEY: 'appMenuLinks.homeLinkDescription',
    COMPONENT: () => import('@/components/pages/HomePage/HomePage.vue'),
  },
}

export const appRoutesArray = Object.values(appRoutes)
