import type { Component, RendererElement, RendererNode, VNode } from 'vue'

export type TResponseMethod = {
  el: HTMLElement
}

export type IOnBeforeMount = Omit<TResponseMethod, 'rect'>
export interface TCustomAnimationTResponseMethod extends TResponseMethod {
  backdropTransitionDuration: number
}

export type ReturnedDataFromMounted = Record<string, unknown>
export type TBreakpointsOptions = [number, number]
export type onMounted = (dialog: TCustomAnimationTResponseMethod) => void
export type onBeforeUnmount = (dialog: TCustomAnimationTResponseMethod) => Promise<void>
export type onUnmounted = (dialog: TResponseMethod) => Promise<void>
export type onBeforeMount = (dialog: IOnBeforeMount) => Promise<void>
export type TOnClose = (dialog: TResponseMethod) => void

export enum handleMediaListenersMode {
  add,
  remove
}

export interface INavComponent {
  conditionRender: boolean
  breakpoints: TBreakpointsOptions
  vnode: VNode
  extraClass?: string
  onDestroy?: () => void
}

export interface IInitialStyles {
  userStyles: string
  hammerjsStyles: string
}

export interface IDialogRawOptions {
  classList?: string
  component: Component
  ref: VNode<
    RendererNode,
    RendererElement,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any
    }
  >
  onMounted?: onMounted
  onUnmounted?: onUnmounted
  onBeforeMount?: onBeforeMount
  onBeforeUnmount?: onBeforeUnmount
  name: string
  showBottomSheet: boolean
  showButtonClose: boolean
  withClickOutside: boolean
  buttonCloseBreakpoints: TBreakpointsOptions
  bottomSheetBreakpoints: TBreakpointsOptions

  handleDrag: (event: HammerInput) => void
}

export type IUseDialogOptions = IDialogRawOptions

export interface IDialogState {
  isOpen?: boolean
  bottomSheetStyles: IInitialStyles
  hammerInstance: null | HammerManager
  rawOptions: IDialogRawOptions
}

export type TDialog = {
  component: Component
  classList?: string
  name: string
  showBottomSheet?: boolean
  showButtonClose?: boolean
  withClickOutside?: boolean
  onMounted?: onMounted
  onUnmounted?: onUnmounted
  onBeforeMount?: onBeforeMount
  onBeforeUnmount?: onBeforeUnmount
  buttonCloseBreakpoints?: TBreakpointsOptions
  bottomSheetBreakpoints?: TBreakpointsOptions
}
