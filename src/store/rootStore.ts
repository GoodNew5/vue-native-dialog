import { defineStore } from 'pinia'
import { useDialogStore } from '@/composables/useDialogs/useDialogs'

export const useRootStore = defineStore('rootStore', () => {
  const dialogStore = useDialogStore()

  return {
    dialogStore
  }
})
