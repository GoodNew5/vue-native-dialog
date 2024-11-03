<script lang="ts" setup>
import { appDialogNames } from '@/types'
import { useDialogStore } from '@/composables/useDialogs/useDialogs'
import { useBreakpointsStore } from '@/store/breakpointsStore'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'

const breakpoints = useBreakpointsStore()
const { openDialog } = useDialogStore()

const { IS_DESKTOP, IS_LAPTOP, IS_TABLET, IS_MOBILE } = storeToRefs(breakpoints)

onMounted(() => {
  console.info('HomePage mounted')
})
</script>

<template>
  <div class="home-page">
    <header class="header">
      <button @click="openDialog(appDialogNames.ComplexAnimationDialog)" class="button-open-dialog">
        OPEN COMPLEX ANIMATION DIALOG
      </button>
      <button @click="openDialog(appDialogNames.SimpleDialog)" class="button-open-dialog">
        OPEN SIMPLE DIALOG
      </button>
      <button @click="openDialog(appDialogNames.CasualDialog)" class="button-open-dialog">
        OPEN CASUAL DIALOG
      </button>
    </header>
    <div class="breakpoint" v-if="IS_MOBILE">MOBILE</div>
    <div class="breakpoint" v-if="IS_TABLET">TABLET</div>
    <div class="breakpoint" v-if="IS_LAPTOP">LAPTOP</div>
    <div class="breakpoint" v-if="IS_DESKTOP">DESKTOP</div>
  </div>
</template>
<style scoped src="./HomePage.scss" />
