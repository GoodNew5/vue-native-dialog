<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { watch } from 'vue'
import { appRoutes } from './config/appRoutes'
import { useRootStore } from './store/rootStore'
import BrowserDetector from 'browser-dtector'
import { appDialogs } from './config/appDialogs'

const route = useRoute()
const rootStore = useRootStore()
const { dialogStore } = rootStore
const { createDialogs, closeOpenedDialogs } = dialogStore
const myDialogs = createDialogs(appDialogs)

const browser = new BrowserDetector(window.navigator.userAgent).parseUserAgent()

document.documentElement.classList.add(browser.name.replace(' ', '_'))

watch(route, () => {
  for (const page in appRoutes) {
    const currentPageName = appRoutes[page].NAME
    const className = `is-${currentPageName}-page`

    closeOpenedDialogs()

    if (route.name === currentPageName) {
      document.documentElement.classList.add(className)
    } else {
      document.documentElement.classList.remove(className)
    }
  }
})
</script>

<template>
  <Teleport to="#app">
    <myDialogs />
  </Teleport>
  <RouterView />
</template>
