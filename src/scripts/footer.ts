interface NumberTickerOptions {
  duration?: number
  decimals?: number
  delay?: number
}

interface CoordinateElement extends HTMLElement {
  dataset: {
    target: string
  }
}

interface AnimationConfig {
  threshold: number
  rootMargin: string
  duration: number
  staggerDelay: number
}

class NumberTicker {
  private element: CoordinateElement
  private targetValue: number
  private duration: number
  private decimals: number
  private delay: number
  private startValue = 0
  private hasAnimated = false
  private animationId: number | null = null

  constructor(element: CoordinateElement, targetValue: string, options: NumberTickerOptions = {}) {
    this.element = element
    this.targetValue = parseFloat(targetValue)
    this.duration = options.duration || 2000
    this.decimals = options.decimals || 4
    this.delay = options.delay || 0

    if (isNaN(this.targetValue)) {
      console.warn(`Invalid target value: ${targetValue}`)
      this.targetValue = 0
    }
  }

  animate(): void {
    if (this.hasAnimated) return
    this.hasAnimated = true

    setTimeout(() => {
      const startTime = performance.now()
      const startValue = this.startValue
      const endValue = this.targetValue
      const difference = endValue - startValue

      const updateNumber = (currentTime: number): void => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / this.duration, 1)

        // ease-out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        const currentValue = startValue + difference * easeProgress

        this.element.textContent = currentValue.toFixed(this.decimals)

        if (progress < 1) {
          this.animationId = requestAnimationFrame(updateNumber)
        } else {
          this.element.textContent = endValue.toFixed(this.decimals)
          this.animationId = null
        }
      }

      this.animationId = requestAnimationFrame(updateNumber)
    }, this.delay)
  }

  reset(): void {
    this.hasAnimated = false
    this.element.textContent = this.startValue.toFixed(this.decimals)

    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  destroy(): void {
    this.reset()
  }
}

class FooterAnimationController {
  private coordinateElements: NodeListOf<CoordinateElement>
  private tickers: NumberTicker[] = []
  private observer: IntersectionObserver | null = null
  private observedTarget: Element | null = null
  private config: AnimationConfig

  constructor(config: Partial<AnimationConfig> = {}) {
    this.config = {
      // the footer is taller than most viewports, so a fractional threshold
      // can never be satisfied — trigger as soon as any part is visible
      threshold: 0,
      rootMargin: '0px',
      duration: 2500,
      staggerDelay: 300,
      ...config,
    }

    this.coordinateElements = document.querySelectorAll(
      '.coordinate-value',
    ) as NodeListOf<CoordinateElement>
    this.init()
  }

  private init(): void {
    this.setupTickers()
    this.setupIntersectionObserver()
    this.setupCleanup()
  }

  private setupTickers(): void {
    this.coordinateElements.forEach((element, index) => {
      const targetValue = element.dataset.target

      if (!targetValue) {
        console.warn('Coordinate element missing data-target attribute', element)
        return
      }

      const ticker = new NumberTicker(element, targetValue, {
        duration: this.config.duration,
        decimals: 4,
        delay: index * this.config.staggerDelay,
      })

      this.tickers.push(ticker)
    })
  }

  private setupIntersectionObserver(): void {
    // watch the coordinates block itself, not the whole (very tall) footer
    const target = document.querySelector('.coordinates') ?? document.querySelector('footer')

    if (!target || typeof IntersectionObserver === 'undefined') {
      this.startAnimation()
      return
    }

    this.observedTarget = target

    const options: IntersectionObserverInit = {
      threshold: this.config.threshold,
      rootMargin: this.config.rootMargin,
    }

    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.startAnimation()
          this.observer?.unobserve(entry.target)
        }
      })
    }, options)

    this.observer.observe(target)
  }

  /** true while the elements this controller holds are still in the document */
  isAttached(): boolean {
    const first = this.coordinateElements[0]
    return !!first && document.contains(first)
  }

  private setupCleanup(): void {
    window.addEventListener('beforeunload', () => {
      this.destroy()
    })
  }

  private startAnimation(): void {
    this.tickers.forEach(ticker => ticker.animate())
  }

  reset(): void {
    this.tickers.forEach(ticker => ticker.reset())
  }

  destroy(): void {
    this.tickers.forEach(ticker => ticker.destroy())
    this.tickers = []
    this.observedTarget = null

    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}

let controller: FooterAnimationController | null = null

function initializeFooterAnimations(): void {
  // footer is transition:persist, so keep the controller as long as it still
  // points at live nodes — rebuild only if the footer DOM was replaced
  if (controller?.isAttached()) return

  controller?.destroy()
  controller = null

  try {
    controller = new FooterAnimationController()
  } catch (error) {
    console.error('Failed to initialize footer animations:', error)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFooterAnimations)
} else {
  initializeFooterAnimations()
}

document.addEventListener('astro:page-load', initializeFooterAnimations)
