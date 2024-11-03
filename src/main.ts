import { resetStore } from '@/composables/base/resetStore'
import { createPinia } from 'pinia'
import { createApp, markRaw } from 'vue'
import type { Router } from 'vue-router'
import { appRouter } from './router.ts'
import App from './App.vue'
import './styles/app.scss'

createApp(App)
  .use(
    createPinia()
      .use(({ store }) => {
        store.router = markRaw(appRouter)
      })
      .use(resetStore)
  )
  .use(appRouter)
  .mount('#app')

declare module 'pinia' {
  export interface PiniaCustomProperties {
    router: Router
  }
}
