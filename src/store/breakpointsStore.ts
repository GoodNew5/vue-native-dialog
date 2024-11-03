import scssBreakpoints from '@/styles/breakpoints.scss?inline'
import { useMediaQuery } from '@vueuse/core'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export interface Breakpoints {
  LAP: string
  TO_LAP: string
  DESK: string
  TO_DESK: string
  HANDS: string
  TO_HANDS: string
  SCREENS: {
    IS_MOBILE: boolean
    IS_TABLET: boolean
    IS_LAPTOP: boolean
    IS_DESKTOP: boolean
  }
}

const scssVariablesToJSObject = () => {
  const result = {} as Breakpoints
  const regex = /(\n|\s|{|}|:export|;\s*}$)/g

  return (
    scssBreakpoints
      .replace(regex, '')
      .split(';')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((acc: any, item: string) => {
        return Object.assign(acc, {
          [item.split(':')[0]]: item.split(':')[1]
        })
      }, result)
  )
}

export const breakpoints = scssVariablesToJSObject()

const formatBreakpoint = (breakpoint: string) => Number(breakpoint.replace('px', ''))

export const LAP_BREAKPOINT = formatBreakpoint(breakpoints.LAP)
export const TO_LAP_BREAKPOINT = formatBreakpoint(breakpoints.TO_LAP)
export const DESK_BREAKPOINT = formatBreakpoint(breakpoints.DESK)
export const TO_DESK_BREAKPOINT = formatBreakpoint(breakpoints.TO_DESK)
export const HANDS_BREAKPOINT = formatBreakpoint(breakpoints.HANDS)
export const TO_HANDS_BREAKPOINT = formatBreakpoint(breakpoints.TO_HANDS)

const LAP = useMediaQuery(`(min-width: ${LAP_BREAKPOINT}px)`)
const TO_LAP = useMediaQuery(`(max-width: ${TO_LAP_BREAKPOINT}px)`)
const DESK = useMediaQuery(`(min-width: ${DESK_BREAKPOINT}px)`)
const TO_DESK = useMediaQuery(`(max-width: ${TO_DESK_BREAKPOINT}px)`)
const HANDS = useMediaQuery(`(min-width: ${HANDS_BREAKPOINT}px)`)
const TO_HANDS = useMediaQuery(`(max-width: ${TO_HANDS_BREAKPOINT}px)`)

export const useBreakpointsStore = defineStore('breakpointsStore', () => {
  const isLap = ref(LAP)
  const isToLap = ref(TO_LAP)
  const isDesk = ref(DESK)
  const isToDesk = ref(TO_DESK)
  const isHands = ref(HANDS)
  const isToHands = ref(TO_HANDS)

  const isTablet = computed(() => isHands.value && isToLap.value)
  const isLaptop = computed(() => isLap.value && isToDesk.value)

  return {
    isLap,
    isToLap,
    isDesk,
    isToDesk,
    isHands,
    isToHands,
    IS_MOBILE: isToHands,
    IS_TABLET: isTablet,
    IS_LAPTOP: isLaptop,
    IS_DESKTOP: isDesk
  }
})
