<script lang="ts" setup>
import { useBreakpointsStore } from '@/store/breakpointsStore'
import { storeToRefs } from 'pinia'
import { onMounted, ref, useTemplateRef } from 'vue'
const remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize)
const rem = remInPixels * 1

const rect = useTemplateRef('rect')
const length = ref<number>()
const breakpoints = useBreakpointsStore()
const { isHands } = storeToRefs(breakpoints)

onMounted(() => {
  if (rect.value) {
    length.value = rect.value.getTotalLength()
  }
})
</script>

<template>
  <div class="test-dialog-component">
    <div class="container-box">
      <h4 class="title">TestModal</h4>
      <p class="description">test modal description</p>
    </div>
    <svg v-if="isHands" inert class="test-dialog-svg-container" width="100%" height="100%">
      <rect
        ref="rect"
        class="test-dialog-rect"
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="var(--theme-color4-dark)"
        stroke-width="2"
        :stroke-dasharray="`${length} ${length}`"
        :stroke-dashoffset="`${length}`"
        :rx="rem"
        :ry="rem"
      />
    </svg>
  </div>
</template>
<style scoped src="./ComplexAnimationDialog.scss" />
