"use client"

import { useEffect, useRef } from "react"

export function AnimatedTechBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return

    let frame = 0
    let animationFrame = 0
    let width = 0
    let height = 0
    const nodes = Array.from({ length: 54 }, (_, index) => ({
      x: (index * 173) % 1000,
      y: (index * 97) % 700,
      speed: 0.15 + (index % 5) * 0.04,
      phase: index * 0.7,
    }))

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const parent = canvas.parentElement
      width = parent?.clientWidth || window.innerWidth
      height = parent?.clientHeight || window.innerHeight
      canvas.width = width * ratio
      canvas.height = height * ratio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const draw = () => {
      frame += 1
      context.clearRect(0, 0, width, height)
      const spacing = 86
      context.strokeStyle = "rgba(0, 232, 165, 0.14)"
      context.lineWidth = 1
      for (let x = -spacing; x < width + spacing; x += spacing) {
        const offset = (frame * 0.22) % spacing
        context.beginPath()
        context.moveTo(x + offset, 0)
        context.lineTo(x + offset - height * 0.28, height)
        context.stroke()
      }

      nodes.forEach((node, index) => {
        const x = ((node.x + frame * node.speed) % (width + 120)) - 60
        const y = node.y + Math.sin(frame * 0.009 + node.phase) * 22
        const pulse = 0.55 + Math.sin(frame * 0.035 + node.phase) * 0.35
        context.fillStyle = `rgba(0, 232, 165, ${0.7 * pulse})`
        context.beginPath()
        context.arc(x, y, index % 4 === 0 ? 2.2 : 1.2, 0, Math.PI * 2)
        context.fill()
        if (index % 4 === 0) {
          context.strokeStyle = `rgba(0, 232, 165, ${0.32 * pulse})`
          context.beginPath()
          context.arc(x, y, 10 + pulse * 8, 0, Math.PI * 2)
          context.stroke()
        }
      })

      animationFrame = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="animated-tech-canvas" aria-hidden="true" />
}
