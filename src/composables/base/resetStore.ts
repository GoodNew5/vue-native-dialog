// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resetStore(store: any) {
  const initialState = { ...store.$state }

  store.$reset = () => {
    store.$patch({ ...initialState })
  }
}
