import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024
const SMALL_MOBILE_BREAKPOINT = 480
const VERY_SMALL_MOBILE_BREAKPOINT = 320

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange);
  }, [])

  return !!isMobile
}

// Hook amélioré pour détecter différentes tailles d'écran
export function useResponsive() {
  const [screenInfo, setScreenInfo] = React.useState({
    isMobile: false,
    isTablet: false,
    isSmallMobile: false,
    isVerySmallMobile: false,
    screenSize: 'desktop',
    width: 0,
    height: 0
  })

  React.useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      const isMobile = width < MOBILE_BREAKPOINT
      const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT
      const isSmallMobile = width < SMALL_MOBILE_BREAKPOINT
      const isVerySmallMobile = width < VERY_SMALL_MOBILE_BREAKPOINT

      let screenSize = 'desktop'
      if (isVerySmallMobile) {
        screenSize = 'very-small-mobile'
      } else if (isSmallMobile) {
        screenSize = 'small-mobile'
      } else if (isMobile) {
        screenSize = 'mobile'
      } else if (isTablet) {
        screenSize = 'tablet'
      }

      setScreenInfo({
        isMobile,
        isTablet,
        isSmallMobile,
        isVerySmallMobile,
        screenSize,
        width,
        height,
        isDesktop: !isMobile && !isTablet
      })
    }

    updateScreenInfo()
    window.addEventListener('resize', updateScreenInfo)
    window.addEventListener('orientationchange', updateScreenInfo)

    return () => {
      window.removeEventListener('resize', updateScreenInfo)
      window.removeEventListener('orientationchange', updateScreenInfo)
    }
  }, [])

  return screenInfo
}

// Hook pour détecter l'orientation
export function useOrientation() {
  const [orientation, setOrientation] = React.useState('portrait')

  React.useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)

    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [])

  return orientation
}

// Hook pour détecter le type d'appareil
export function useDeviceType() {
  const [deviceInfo, setDeviceInfo] = React.useState({
    type: 'desktop',
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isTouchDevice: false
  })

  React.useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/i.test(userAgent)
    const isAndroid = /android/i.test(userAgent)
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent)
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isSafari = /safari/i.test(userAgent) && !/chrome/i.test(userAgent)
    const isChrome = /chrome/i.test(userAgent)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    let type = 'desktop'
    if (isTablet) {
      type = 'tablet'
    } else if (isMobile) {
      if (isIOS) {
        type = 'ios'
      } else if (isAndroid) {
        type = 'android'
      } else {
        type = 'mobile'
      }
    }

    setDeviceInfo({
      type,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      isTouchDevice
    })
  }, [])

  return deviceInfo
}
