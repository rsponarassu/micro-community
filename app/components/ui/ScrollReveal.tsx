'use client'

import React, { useEffect, useRef, useState } from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  animation?: 'fade-up' | 'fade-down' | 'fade-in' | 'zoom-in' | 'slide-left' | 'slide-right'
  delay?: number
  duration?: number
  className?: string
  threshold?: number
}

export default function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  className = '',
  threshold = 0.1,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // IntersectionObserver to detect when element scrolls into view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  const getAnimationStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      transitionProperty: 'opacity, transform, filter',
      transitionDuration: `${duration}ms`,
      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      transitionDelay: `${delay}ms`,
      willChange: 'opacity, transform',
    }

    if (!isVisible) {
      switch (animation) {
        case 'fade-up':
          return { ...base, opacity: 0, transform: 'translate3d(0, 30px, 0)' }
        case 'fade-down':
          return { ...base, opacity: 0, transform: 'translate3d(0, -30px, 0)' }
        case 'zoom-in':
          return { ...base, opacity: 0, transform: 'scale(0.92)' }
        case 'slide-left':
          return { ...base, opacity: 0, transform: 'translate3d(40px, 0, 0)' }
        case 'slide-right':
          return { ...base, opacity: 0, transform: 'translate3d(-40px, 0, 0)' }
        case 'fade-in':
        default:
          return { ...base, opacity: 0 }
      }
    }

    return {
      ...base,
      opacity: 1,
      transform: 'translate3d(0, 0, 0) scale(1)',
      filter: 'none',
    }
  }

  return (
    <div ref={ref} style={getAnimationStyles()} className={className}>
      {children}
    </div>
  )
}
