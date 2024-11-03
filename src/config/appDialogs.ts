import CasualDialog from '@/components/CasualDialog/CasualDialog.vue'
import SimpleDialog from '@/components/SimpleDialog/SimpleDialog.vue'
import { TO_HANDS_BREAKPOINT, HANDS_BREAKPOINT } from '@/store/breakpointsStore'
import anime from 'animejs'
import ComplexAnimationDialog from '@/components/ComplexAnimationDialog/ComplexAnimationDialog.vue'
import {
  type TBreakpointsOptions,
  type TCustomAnimationTResponseMethod
} from '@/composables/useDialogs/types'

import { appDialogNames } from '@/types'

const buttonCloseBreakpoints: TBreakpointsOptions = [HANDS_BREAKPOINT, Infinity]
const bottomSheetBreakpoints: TBreakpointsOptions = [0, TO_HANDS_BREAKPOINT]

//https://animejs.com/documentation/#pennerFunctions

const setOpenAnimationForSimpleDialog = (dialog: TCustomAnimationTResponseMethod) => {
  // const breakpoints = useBreakpointsStore()
  // const { isHands } = breakpoints

  // if (!isHands) return

  anime.remove(dialog.el)
  const { el, backdropTransitionDuration } = dialog

  const duration = 800 - backdropTransitionDuration

  const initialTimeline = anime.timeline({
    duration: 0
  })

  initialTimeline.add({
    targets: el,
    scale: 0,
    opacity: 1
  })

  const timeline = anime.timeline({
    easing: 'easeInOutExpo',
    duration
  })

  timeline.add({
    targets: el,
    scale: 1
  })
}

const setCloseAnimationForSimpleDialog = async (dialog: TCustomAnimationTResponseMethod) => {
  // const breakpoints = useBreakpointsStore()
  // const { isHands } = breakpoints

  // if (!isHands) return

  anime.remove(dialog.el)

  const { el, backdropTransitionDuration } = dialog
  const duration = 800 - backdropTransitionDuration

  const timeline = anime.timeline({
    easing: 'easeInOutExpo',
    duration
  })

  await timeline.add({
    targets: el,
    scale: 0,
    opacity: 0
  }).finished
}

export const appDialogs = [
  {
    name: appDialogNames.CasualDialog,
    component: CasualDialog,
    classList: 'bgc17 casual-dialog',
    showButtonClose: false,
    withClickOutside: false,
    showBottomSheet: false
  },
  {
    name: appDialogNames.ComplexAnimationDialog,
    component: ComplexAnimationDialog,
    classList: 'complex-animation-dialog',
    showButtonClose: true,
    withClickOutside: true,
    showBottomSheet: true,
    onMounted: (dialog: TCustomAnimationTResponseMethod) => {
      const { el, backdropTransitionDuration } = dialog

      const containerBox = el.querySelector('.container-box')
      const buttonClose = el.querySelector('.native-dialog-close-button')

      if (!containerBox || !buttonClose) return

      const svgRect = el.querySelector('.test-dialog-rect') as SVGElement
      const duration = 600 - backdropTransitionDuration

      console.log(duration)

      anime.remove(el)
      anime.remove(buttonClose)
      anime.remove(containerBox)
      anime.remove(svgRect)

      if (svgRect instanceof SVGRectElement) {
        const initialTimeline = anime.timeline({
          duration: 0,
          opacity: 0
        })

        initialTimeline
          .add({
            targets: buttonClose,
            opacity: 0
          })
          .add({
            targets: containerBox,
            opacity: 0,
            translateY: -50
          })

        const timeline = anime.timeline({
          easing: 'easeInOutSine',
          duration,
          delay: 0
        })

        timeline
          .add({
            targets: svgRect,
            strokeDashoffset: [anime.setDashoffset, 0],
            delay: function (_, i) {
              return i * 250
            }
          })
          .add({
            targets: svgRect,
            fill: 'hsl(0, 0%, 20%)'
          })
          .add({
            targets: buttonClose,
            opacity: 1
          })
          .add({
            targets: containerBox,
            translateY: 0,
            opacity: 1
          })
      }
    }
  },
  {
    name: appDialogNames.SimpleDialog,
    component: SimpleDialog,
    withClickOutside: true,
    classList: 'simple-dialog',
    bottomSheetBreakpoints,
    buttonCloseBreakpoints,
    onBeforeUnmount: setCloseAnimationForSimpleDialog,
    onMounted: setOpenAnimationForSimpleDialog
  }
]
