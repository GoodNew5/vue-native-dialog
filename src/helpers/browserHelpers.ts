export const animationsComplete = (element: HTMLElement) =>
  Promise.allSettled(element.getAnimations().map((animation) => animation.finished))

export const cancelAnimations = (element: HTMLElement) => {
  element.getAnimations().forEach((animation) => {
    animation.cancel()
  })
}

export const rejectedAnimation = (animations: PromiseSettledResult<Animation>[]) =>
  animations.some((t) => {
    return t.status === 'rejected'
  })

export const runningAnimations = (element: HTMLElement) =>
  element.getAnimations().some((anim) => anim.playState === 'running')

export const waitForTransition = (element: HTMLElement) => {
  return new Promise((resolve) => {
    const handleTransitionEnd = () => {
      element.removeEventListener('transitionend', handleTransitionEnd)
      resolve(true)
    }

    element.addEventListener('transitionend', handleTransitionEnd)
  })
}
