import {
  createVNode,
  Fragment,
  getCurrentInstance,
  h,
  markRaw,
  nextTick,
  ref,
  render,
  watch
} from 'vue'
import { defineStore } from 'pinia'
import hammerjs from 'hammerjs'
import type { IDialogState, INavComponent, TBreakpointsOptions, TDialog } from './types'
import { handleMediaListenersMode } from './types'
import { animationsComplete, rejectedAnimation, waitForTransition } from '@/helpers/browserHelpers'
import * as cssClasses from './cssClasses'

// https://typescript.tv/errors/#ts4023
//https://vuejs.org/api/options-rendering.html#render

// https://kadiryazici.github.io/bottom-sheet-vue3/
// https://codepen.io/collection/XLebem?grid_type=grid&cursor=eyJwYWdlIjoyMX0=
// https://codepen.io/juliangarnier/details/mWdraw
// https://easings.net/#easeInQuad
// https://animejs.com/documentation/#timelineBasics
// https://github.com/vaban-ru/vue-bottom-sheet/blob/master/src/VueBottomSheet.vue
// https://codepen.io/designcouch/pen/obvKxm

// если не успел закрыться предыдущий и открывается следующий то баг они не закрываются

export const useDialogStore = defineStore('dialogStore', () => {
  const instance = getCurrentInstance()

  if (!instance) throw new Error('current instance not found')

  const docum = document
  const HTMLDocument = docum.documentElement
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const v3ScrollLock = !isSafari ? null : import('v3-scroll-lock').then((m) => m)
  const dialogAndBackdropTransitionDuration = 0.4
  const dialogAndBackdropTransitionDurationMS = dialogAndBackdropTransitionDuration * 1000
  const dialogTransitionOpacityValue = `opacity ${dialogAndBackdropTransitionDuration}s allow-discrete`
  const dialogTransitionValue = `
  ${dialogTransitionOpacityValue},
    display ${dialogAndBackdropTransitionDuration}s allow-discrete,
    overlay ${dialogAndBackdropTransitionDuration}s allow-discrete;
   `
  let openedDialogs: IDialogState[] = []
  const viewport = ref(HTMLDocument.clientHeight)
  const dialogRefs = ref<IDialogState[]>([])

  /**
   * Базовая анимация опасити для диалога и бекдропа
   */

  const cssText = `
  dialog, ::backdrop {
    transition: ${dialogTransitionValue}
    transition-timing-function: cubic-bezier(0.37, 0, 0.63, 1);
    opacity: 0;
  }

    dialog::backdrop {
      background-color: var(--dialog-overlay);
    }

    /* IN */
    [open],
    [open]::backdrop {
      opacity: 1;
    }

    /* OUT */
    @starting-style {
      [open],
      [open]::backdrop {
        opacity: 0;
      }
    }
  `

  const styleSheet = docum.createElement('style')
  styleSheet.innerText = cssText
  docum.head.appendChild(styleSheet)

  async function handleMutation(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      const { attributeName } = mutation
      const currentDialog = getCurrentOpenedDialog()
      const currentDialogEl = currentDialog?.rawOptions.ref.el as HTMLElement

      // /**
      //  * TODO: возможно это можно решить лучше
      //  * next tick нужен в случае когда закрываем все открытые диалоги
      //  * без него закрывается только первый диалог
      //  */
      await nextTick()

      if (!currentDialog) break

      if (attributeName !== 'open') break

      const { target } = mutation

      if (!(target instanceof HTMLDialogElement)) break

      const name = target.getAttribute(cssClasses.dialogNameAttr)

      if (!name) break

      if (!currentDialogEl) break

      currentDialog.isOpen = target.hasAttribute('open')

      if (!currentDialog.isOpen) {
        performFullClose()
        break
      }

      performFullOpen()
    }
  }

  let dialogAttrObserver: MutationObserver | null = new MutationObserver(handleMutation)

  const dialogResizeObserver = new ResizeObserver(() => {
    viewport.value = HTMLDocument.clientHeight
  })

  function clickOutside(event: Event) {
    const target = event.target as HTMLDialogElement
    const name = target.getAttribute(cssClasses.dialogNameAttr)

    if (target.nodeName !== 'DIALOG' || !name) return

    closeDialog()
  }

  async function closeDialog(dialogElement?: HTMLDialogElement) {
    /** 1. entrty to close dialog */
    const dialogEl = dialogElement || getCurrentOpenedDialogElement()

    if (!dialogEl) return

    /**
     * если убрать nextTick, то при кейсе
     * когда юзер свайпом попытается убрать боттомшит вниз
     * диалог не закроется предположительно связано с тем как обрабатывает
     * жесты hammerjs
     */

    await nextTick()

    dialogEl.close()
  }

  function setDialogOpacity(dialogEl: HTMLElement, val: number) {
    dialogEl.style.setProperty('opacity', val.toString())
  }

  function getInvisibleDialog(dialogElement: HTMLElement) {
    return dialogElement.getAttribute('style')?.includes('opacity: 0;')
  }

  function removeHammerStyles(dialog: IDialogState) {
    const dialogElement = dialog.rawOptions.ref.el as HTMLDialogElement

    if (!dialogElement) return

    let currentTransform = dialogElement.style.transform

    function getCssProperties(styleString: string) {
      const regex = /([a-zA-Z-]+)\s*:/g

      const properties: string[] = []
      let match

      while ((match = regex.exec(styleString)) !== null) {
        properties.push(match[1].trim())
      }

      return properties
    }

    const hammerCssProperties = getCssProperties(dialog.bottomSheetStyles.hammerjsStyles)

    hammerCssProperties.forEach((property) => {
      dialogElement.style.removeProperty(property)
    })

    currentTransform = currentTransform.replace(/translateY\([^)]+\)/, '').trim()

    dialogElement.style.transform = currentTransform
    dialogElement.style.transition = ''
  }

  async function unlockScroll() {
    if (!openedDialogs.length) {
      /**
       * Удаляем блокировку скрола с HTML
       */

      if (v3ScrollLock) {
        const scrollLocker = await v3ScrollLock

        scrollLocker.unlockAllScrolls()

        return
      }

      docum.body.style.overflow = ''
    }
  }

  async function myLockScroll(dialog: HTMLElement) {
    if (v3ScrollLock) {
      const scrollLocker = await v3ScrollLock

      scrollLocker.lockScroll(dialog, {
        reserveScrollBarGap: true
      })

      return
    }

    docum.body.style.overflow = 'hidden'
  }

  async function openDialog(dialog: string, mode: 'modal' | 'unmodal' = 'modal') {
    /** 1. entrty to dialog */
    const dialogInstance = getDialogInstance(dialog)

    if (!dialogInstance) return

    openedDialogs.push(dialogInstance)

    const dialogEl = getCurrentOpenedDialogElement()

    if (!dialogEl) return

    dialogEl.removeAttribute('inert')

    dialogAttrObserver = new MutationObserver(handleMutation)

    dialogAttrObserver.observe(dialogEl, {
      attributes: true
    })

    if (mode === 'modal') {
      dialogEl.showModal()
      return
    }

    dialogEl.show()
  }

  async function performFullClose() {
    /** 2. handle remove inner components and animation */
    const dialog = getCurrentOpenedDialog()
    const dialogEl = getCurrentOpenedDialogElement()

    if (!dialogEl || !dialog) return

    openedDialogs.pop()
    dialogEl.classList.remove(cssClasses.dialogOpenedClass)
    dialogEl.setAttribute('inert', '')

    dialogAttrObserver?.disconnect()

    const { rawOptions } = dialog
    const { onUnmounted, onBeforeUnmount, showBottomSheet, onMounted } = rawOptions

    const responseProps = {
      el: dialogEl,
      backdropTransitionDuration: dialogAndBackdropTransitionDurationMS
    }

    console.log(openedDialogs, 'CLOSED')

    if (onBeforeUnmount) {
      await onBeforeUnmount(responseProps)
    } else {
      setDialogOpacity(dialogEl, 0)
    }

    // Ждем завершения всех анимации
    const animations = await animationsComplete(dialogEl)

    unlockScroll()

    if (showBottomSheet) {
      removeHammerStyles(dialog)
    }

    const invisibleDialog = getInvisibleDialog(dialogEl)

    if (onUnmounted && onMounted && invisibleDialog) {
      /**
       * если передал onMounted и onUnmounted
       * но диалог невидим то удалим opacity сделав его видимым
       */
      dialogEl.style.removeProperty('opacity')
    }

    if (!onMounted && onBeforeUnmount) {
      /**
       * если не передал onMounted
       * но передал onBeforeUnmount
       * то сбрасываем результат работы onBeforeUnmount чтобы
       * при следующем открытии диалога,
       * при вызове onMounted запустилась анимация по-умолчанию
       */
      dialogEl.style.removeProperty('transition')
      dialogEl.style.removeProperty('transform')
      dialogEl.style.removeProperty('opacity')
    }

    /**
     * если прервали анимацию закрытия то выходим
     */
    const isAbortedAnimation = rejectedAnimation(animations)

    if (isAbortedAnimation) return

    /**
     * Удаляем содержимое диалога из DOM
     * Разблокируем скрол
     */

    render(null, dialogEl)

    if (onUnmounted) {
      onUnmounted(responseProps)
    }
  }

  async function performFullOpen() {
    /** 2. render inner components and animation */
    const dialog = getCurrentOpenedDialog()
    const dialogEl = dialog?.rawOptions.ref.el as HTMLDialogElement

    if (!dialog || !dialogEl) return

    console.log(openedDialogs, 'CLOSED')

    myLockScroll(dialogEl)
    removeHammerStyles(dialog)

    const node = renderInnerComponents(dialog)
    const { rawOptions } = dialog
    const { onMounted, onBeforeMount } = rawOptions

    // const isAbortedAnimation = rejectedAnimation(animations)

    // if (isAbortedAnimation) return

    if (!node) return

    if (onBeforeMount) {
      onBeforeMount({ el: dialogEl })
    }

    render(node, dialogEl)

    dialogEl.classList.add(cssClasses.dialogOpenedClass)

    const responseProps = {
      el: dialogEl,
      backdropTransitionDuration: dialogAndBackdropTransitionDurationMS
    }

    if (onMounted) {
      const invisibleDialog = getInvisibleDialog(dialogEl)

      if (invisibleDialog) {
        setDialogOpacity(dialogEl, 1)
      }

      onMounted(responseProps)
    } else {
      setDialogOpacity(dialogEl, 1)
    }
  }

  function formatTrasformTransition(withTransformTransition: boolean) {
    const dialogDefaultTransition = `transition: ${dialogTransitionValue}`

    if (!withTransformTransition) return ''

    const preparedTransformTransition = `${dialogDefaultTransition.replace(
      ';',
      ''
    )}, \n transform ${dialogAndBackdropTransitionDuration}s;`

    return preparedTransformTransition
  }

  function applyBottomSheetTransform(
    dialog: IDialogState,
    value: number,
    withTransformTransition = false
  ) {
    const transitionWithTransform = formatTrasformTransition(withTransformTransition)
    const dialogElement = dialog.rawOptions.ref.el as HTMLDialogElement
    const userStyles = dialog.bottomSheetStyles.userStyles
    const hammerJsStyles = dialog.bottomSheetStyles.hammerjsStyles

    if (!dialogElement) return

    const newStyle = `transform: translateY(${value}px)`

    const mergedStyles = `${transitionWithTransform} ${userStyles} ${hammerJsStyles} ${newStyle}`

    dialogElement.setAttribute('style', mergedStyles)
  }

  async function dragHandler(event: HammerInput, dialog: IDialogState) {
    const dialogElement = dialog.rawOptions.ref.el as HTMLDialogElement

    if (!dialogElement) return

    const dialogHeightRect = dialogElement.getBoundingClientRect().height
    const closingTreshold = dialogHeightRect / 2

    if (event.deltaY > 0) {
      if (event.type === 'panup') {
        applyBottomSheetTransform(dialog, event.deltaY)
        return
      }

      if (event.type === 'pandown') {
        applyBottomSheetTransform(dialog, event.deltaY)
      }

      if (event.type === 'panend') {
        applyBottomSheetTransform(dialog, 0, true)
      }

      if (event.deltaY >= closingTreshold) {
        const remainingSpace = calcClosedOffsetBottomSheetValue(dialogHeightRect, event.deltaY)

        const { rawOptions } = dialog
        const { onBeforeUnmount } = rawOptions

        /**
         * если не передали onBeforeUnmount
         * то выполняем анимацию закрытия ботомшита по-умолчанию
         **/

        if (!onBeforeUnmount) {
          applyBottomSheetTransform(dialog, remainingSpace + closingTreshold, true)
        }

        dialog.hammerInstance?.stop(true)
        dialogElement.setAttribute('inert', '')
        closeDialog(dialogElement)

        /**
         * ждем завершения transitionend
         */

        if (!onBeforeUnmount) {
          await waitForTransition(dialogElement)
        }

        /**
         * удалим стили которые были применены hamerjs при инициализации экземпляра
         * такие как
         * touch-action: pan-y;
         * user-select: none;
         * -webkit-user-drag: none;
         * и подобные
         */
      }
    }
  }

  function calcClosedOffsetBottomSheetValue(dialogHeight: number, value: number) {
    const viewportFreeSpace = viewport.value - dialogHeight
    const isNoRemainingSpace =
      Math.sign(viewportFreeSpace) === -1 || Math.sign(viewportFreeSpace) === 0

    if (isNoRemainingSpace) {
      return viewport.value
    }

    return viewportFreeSpace + value
  }

  function getCurrentOpenedDialog(name?: string): IDialogState | undefined {
    if (name) {
      return openedDialogs.find((dialog) => dialog.rawOptions.name === name)
    }

    if (!openedDialogs.length) return

    return openedDialogs[openedDialogs.length - 1]
  }

  function getCurrentOpenedDialogElement(): HTMLDialogElement | null | undefined {
    return getCurrentOpenedDialog()?.rawOptions.ref?.el as HTMLDialogElement
  }

  function handleMediaListeners(
    mediaQueryList: MediaQueryList,
    handleMediaQueryList: (event: MediaQueryListEvent | MediaQueryList) => void,
    mode: handleMediaListenersMode = handleMediaListenersMode.add
  ) {
    if (mode === handleMediaListenersMode.add) {
      mediaQueryList.addEventListener('change', handleMediaQueryList)
    }

    if (mode === handleMediaListenersMode.remove) {
      mediaQueryList.removeEventListener('change', handleMediaQueryList)

      return
    }

    handleMediaQueryList(mediaQueryList)
  }

  const formatMediaQueryString = (breakpoints: TBreakpointsOptions) => {
    const min = breakpoints[0]
    const max = breakpoints[1]

    if (!min) {
      return `(max-width: ${max}px)`
    }

    if (max === Infinity) {
      return `(min-width: ${min}px)`
    }

    return `(min-width: ${min}px) and (max-width: ${max}px)`
  }

  function handleDrag() {
    return function (event: HammerInput) {
      const dialog = getCurrentOpenedDialog()

      if (!dialog) return

      dragHandler(event, dialog)
    }
  }

  function removeHammerListeners(dialog: IDialogState) {
    console.log(dialog)

    dialog.hammerInstance?.off('panstart panup pandown panend', handleDrag)
  }

  function resetDialogState(dialog: IDialogState) {
    dialog.isOpen = false
    dialog.bottomSheetStyles = {
      hammerjsStyles: '',
      userStyles: ''
    }
  }

  function renderInnerComponents(dialog: IDialogState) {
    if (!instance) throw new Error('current instance not found')
    /**
     * Метод отрисовывает компоненты внутри диалога
     * Включая также элементы навигации такие как боттомшит или кнопка закрытия
     */

    const { rawOptions } = dialog
    const {
      component,
      name,
      showBottomSheet,
      showButtonClose,
      buttonCloseBreakpoints,
      bottomSheetBreakpoints
    } = rawOptions

    const componentWithAppContext = createVNode(component, {
      onVnodeUnmounted() {
        const dialog = dialogRefs.value.find((dialogRef) => dialogRef.rawOptions.name === name)

        if (!dialog) return

        resetDialogState(dialog)
      }
    })

    const currentOpenedDialogElement = rawOptions.ref.el as HTMLDialogElement

    if (!currentOpenedDialogElement) return

    componentWithAppContext.appContext = { ...instance.appContext }

    const navigationComponents = [
      {
        extraClass: cssClasses.dialogButtonCloseClass,
        conditionRender: showButtonClose,
        breakpoints: buttonCloseBreakpoints,
        vnode: h('button', {
          'dialog-button': 'close',
          'aria-label': 'close dialog',
          class: 'native-dialog-close-button',
          onClick() {
            closeDialog()
          }
        })
      },
      {
        onDestroy: () => {
          console.log('009')
          removeHammerStyles(dialog)
          removeHammerListeners(dialog)
        },
        extraClass: cssClasses.dialogWithBottomSheetClass,
        conditionRender: showBottomSheet,
        breakpoints: bottomSheetBreakpoints,
        vnode: h('div', {
          class: cssClasses.bottomSheetMainClass,
          async onVnodeMounted() {
            currentOpenedDialogElement.classList.add(cssClasses.dialogWithBottomSheetClass)

            const dialogStyles = currentOpenedDialogElement.getAttribute('style') || ''

            const { rawOptions } = dialog
            const { handleDrag } = rawOptions

            const hammer = new hammerjs.Manager(currentOpenedDialogElement, {
              touchAction: 'pan-y',
              inputClass: Hammer.TouchMouseInput,
              recognizers: [[Hammer.Pan, { direction: Hammer.DIRECTION_VERTICAL }]]
            })

            hammer.on('panstart panup pandown panend', (event) => {
              handleDrag(event)
            })

            dialog.hammerInstance = hammer

            const hammerjsStyles = currentOpenedDialogElement
              .getAttribute('style')
              ?.replace(dialogStyles, '')

            setTimeout(() => {
              dialog.bottomSheetStyles.hammerjsStyles = hammerjsStyles || ''
            }, 0)
          }
        })
      }
    ]

    function renderNavComponents(navComponents: INavComponent[]) {
      return navComponents.map((navComponent) => {
        const { conditionRender, breakpoints, vnode, extraClass = '' } = navComponent

        const navigationNode = conditionRender ? vnode : null

        const mqList = window.matchMedia(formatMediaQueryString(breakpoints))

        const breakpointState = ref(false)

        const handleMediaQueryListChange = (event: MediaQueryList | MediaQueryListEvent) => {
          breakpointState.value = event.matches
        }

        return h('div', {
          class: cssClasses.nativeDialogNavElementClass,
          onVnodeMounted(node) {
            /**
             * TODO: возможно стоит придумать что-то лучше
             * чем использование as HTMLElement
             */
            const navElement = node.el as HTMLElement

            if (!navElement) return

            handleMediaListeners(mqList, handleMediaQueryListChange)

            watch(
              breakpointState,
              (effect) => {
                if (!effect) {
                  /**
                   * нужно сбрасывать также стили для ботошита
                   */
                  render(null, navElement)
                  currentOpenedDialogElement.classList.remove(extraClass)

                  if (navComponent.onDestroy) {
                    console.log('onDestroy')

                    navComponent.onDestroy()
                  }

                  return
                }

                currentOpenedDialogElement.classList.add(extraClass)
                render(navigationNode, navElement)
              },
              {
                immediate: true
              }
            )
          },

          onVnodeBeforeUnmount() {
            handleMediaListeners(
              mqList,
              handleMediaQueryListChange,
              handleMediaListenersMode.remove
            )
          }
        })
      })
    }

    return h(Fragment, [componentWithAppContext, renderNavComponents(navigationComponents)])
  }

  function createDialogs(dialogs: TDialog[]) {
    if (!dialogs) return

    const userDialogs = dialogs.map((appDialog) => {
      const {
        name,
        component,
        showButtonClose = true,
        withClickOutside = true,
        showBottomSheet = true,
        bottomSheetBreakpoints = [0, 1024],
        buttonCloseBreakpoints = [1024, Infinity],
        classList,
        onMounted,
        onUnmounted,
        onBeforeMount,
        onBeforeUnmount
      } = appDialog

      const dialog = h('dialog', {
        [cssClasses.dialogNameAttr]: name,
        inert: '',
        style: !onMounted || !onBeforeUnmount ? 'opacity: 0;' : '',
        class: `${cssClasses.nativeDialogClass} ${classList}`,
        onClick(event) {
          if (!withClickOutside || !getCurrentOpenedDialog()) return

          clickOutside(event)
        },

        onVnodeBeforeUnmount() {
          dialogRefs.value = []
          openedDialogs = []
          dialogResizeObserver.disconnect()
          dialogAttrObserver?.disconnect()

          if (showBottomSheet) {
            const currentOpenedDialpg = getCurrentOpenedDialog()

            if (!currentOpenedDialpg) return

            removeHammerListeners(currentOpenedDialpg)
          }
        }
      })

      if (!dialog) return

      const drag = handleDrag()

      dialogRefs.value.push({
        isOpen: false,
        hammerInstance: null,
        bottomSheetStyles: {
          userStyles: '',
          hammerjsStyles: ''
        },
        rawOptions: markRaw({
          ref: dialog,
          component: component,
          onMounted,
          onUnmounted,
          onBeforeMount,
          onBeforeUnmount,
          name,
          showBottomSheet,
          showButtonClose,
          buttonCloseBreakpoints,
          bottomSheetBreakpoints,
          withClickOutside,

          handleDrag: drag
        })
      })

      return dialog
    })

    return h('div', { class: cssClasses.nativeDialogRootClass }, userDialogs)
  }

  function closeOpenedDialogs() {
    openedDialogs.forEach(async (dialog) => {
      const openedDialog = dialog.rawOptions?.ref.el as HTMLDialogElement
      openedDialog.close()
    })
  }

  function getDialogInstance(name: string) {
    return dialogRefs.value.find((dialogRef) => dialogRef.rawOptions.name === name)
  }

  return {
    dialogRefs,
    createDialogs,
    getDialogInstance,
    openDialog,
    closeDialog,
    closeOpenedDialogs
  }
})
