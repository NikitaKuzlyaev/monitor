import { useEffect, useRef } from 'react'
import { WINTER_STORM_CONFIG as config } from '../config/winterStorm'

const randomBetween = (min, max) => min + Math.random() * (max - min)

function createStar(width, height) {
  return {
    alpha: randomBetween(config.starMinOpacity, config.starMaxOpacity),
    phase: randomBetween(0, Math.PI * 2),
    size: randomBetween(config.starMinSize, config.starMaxSize),
    twinkleDepth: randomBetween(config.starMinTwinkleDepth, config.starMaxTwinkleDepth),
    twinkleSpeed: randomBetween(config.starMinTwinkleSpeed, config.starMaxTwinkleSpeed),
    x: randomBetween(0, width),
    y: randomBetween(0, height),
  }
}

function drawStars(context, stars, now, width, height) {
  context.clearRect(0, 0, width, height)
  for (const star of stars) {
    const pulse = (Math.sin(now * 0.001 * star.twinkleSpeed + star.phase) + 1) / 2
    const alpha = star.alpha * (1 - star.twinkleDepth + pulse * star.twinkleDepth)
    context.save()
    context.fillStyle = '#dceaff'
    context.globalAlpha = alpha
    if (star.size > 1.15) {
      context.shadowBlur = star.size * 3
      context.shadowColor = '#aacdff'
    }
    context.beginPath()
    context.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }
}

function createEntryPoint(width, height, size) {
  const outside = size * 5
  if (Math.random() < config.topEntryShare) {
    return {
      x: randomBetween(width * config.topEntryMinX, width * config.topEntryMaxX),
      y: -outside,
    }
  }

  return {
    x: width + outside,
    y: randomBetween(height * config.rightEntryMinY, height * config.rightEntryMaxY),
  }
}

function createFlake(width, height, initial = false) {
  const size = randomBetween(config.minSize, config.maxSize)
  const entryPoint = createEntryPoint(width, height, size)
  return {
    alpha: randomBetween(0.35, 0.95),
    angle: randomBetween(0, Math.PI * 2),
    rotation: randomBetween(0, Math.PI * 2),
    size,
    spin: randomBetween(-2.5, 2.5),
    stuck: false,
    stuckUntil: 0,
    trail: randomBetween(config.trailLength * 0.3, config.trailLength),
    vx: randomBetween(config.minSpeedX, config.maxSpeedX),
    vy: randomBetween(config.minSpeedY, config.maxSpeedY),
    x: initial ? randomBetween(-width * 0.15, width * 1.15) : entryPoint.x,
    y: initial ? randomBetween(-height * 0.2, height * 1.15) : entryPoint.y,
    shape: Array.from({ length: 7 }, () => randomBetween(0.65, 1.35)),
  }
}

function drawFlake(context, flake) {
  context.save()
  context.globalAlpha = flake.alpha
  context.translate(flake.x, flake.y)
  context.rotate(flake.rotation)
  context.fillStyle = '#f7fbff'
  context.beginPath()
  flake.shape.forEach((radius, index) => {
    const angle = (index / flake.shape.length) * Math.PI * 2
    const x = Math.cos(angle) * flake.size * radius
    const y = Math.sin(angle) * flake.size * radius * 0.72
    if (index === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  })
  context.closePath()
  context.fill()
  context.restore()
}

function WinterStorm({ titleRef }) {
  const canvasRef = useRef(null)
  const starsCanvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const starsCanvas = starsCanvasRef.current
    const host = canvas.parentElement
    const context = canvas.getContext('2d', { alpha: true })
    const starsContext = starsCanvas.getContext('2d', { alpha: true })
    const maskCanvas = document.createElement('canvas')
    const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true })
    const flakes = []
    const stars = []
    let animationFrame
    let height = 0
    let lastFrame = performance.now()
    let maskPixels
    let pixelRatio = 1
    let titleBounds
    let width = 0

    const rebuildTitleMask = () => {
      const title = titleRef.current
      if (!title || !width || !height) return

      const canvasBounds = canvas.getBoundingClientRect()
      const titleRect = title.getBoundingClientRect()
      titleBounds = {
        bottom: titleRect.bottom - canvasBounds.top,
        left: titleRect.left - canvasBounds.left,
        right: titleRect.right - canvasBounds.left,
        top: titleRect.top - canvasBounds.top,
      }

      maskCanvas.width = canvas.width
      maskCanvas.height = canvas.height
      maskContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      maskContext.clearRect(0, 0, width, height)
      const style = window.getComputedStyle(title)
      maskContext.fillStyle = '#fff'
      maskContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      maskContext.textBaseline = 'top'
      maskContext.fillText(title.textContent || '', titleBounds.left, titleBounds.top)
      maskPixels = maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data
    }

    const resize = () => {
      const bounds = host.getBoundingClientRect()
      width = bounds.width
      height = bounds.height
      pixelRatio = Math.min(window.devicePixelRatio || 1, config.maxPixelRatio)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      starsCanvas.width = Math.round(width * pixelRatio)
      starsCanvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      starsContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      flakes.length = 0
      stars.length = 0
      for (let index = 0; index < config.particleCount; index += 1) {
        flakes.push(createFlake(width, height, true))
      }
      for (let index = 0; index < config.starCount; index += 1) {
        stars.push(createStar(width, height))
      }
      rebuildTitleMask()
    }

    const isOverTitle = (x, y) => {
      if (!maskPixels || !titleBounds || x < titleBounds.left || x > titleBounds.right || y < titleBounds.top || y > titleBounds.bottom) return false
      const pixelX = Math.floor(x * pixelRatio)
      const pixelY = Math.floor(y * pixelRatio)
      return maskPixels[(pixelY * maskCanvas.width + pixelX) * 4 + 3] > 20
    }

    const respawn = (flake) => Object.assign(flake, createFlake(width, height))

    const render = (now) => {
      const delta = Math.min((now - lastFrame) / 1000, 0.034)
      lastFrame = now
      drawStars(starsContext, stars, now, width, height)
      context.clearRect(0, 0, width, height)
      const gust = Math.sin(now / 610) * config.gustStrength + Math.sin(now / 1370) * config.gustStrength * 0.5

      for (const flake of flakes) {
        if (flake.stuck) {
          if (now >= flake.stuckUntil) {
            flake.stuck = false
            flake.vx = randomBetween(config.minSpeedX * 1.3, config.maxSpeedX)
            flake.vy = randomBetween(config.minSpeedY * 0.55, config.maxSpeedY * 0.8)
          } else {
            flake.rotation += flake.spin * delta * 0.12
            drawFlake(context, flake)
            continue
          }
        }

        const velocityX = flake.vx + gust * (0.35 + flake.size / config.maxSize)
        context.save()
        context.globalAlpha = flake.alpha * 0.16
        context.strokeStyle = '#dceeff'
        context.lineWidth = Math.max(0.5, flake.size * 0.16)
        context.beginPath()
        context.moveTo(flake.x, flake.y)
        context.lineTo(flake.x - (velocityX / 600) * flake.trail, flake.y - (flake.vy / 600) * flake.trail)
        context.stroke()
        context.restore()

        flake.x += velocityX * delta
        flake.y += flake.vy * delta
        flake.rotation += flake.spin * delta

        if (isOverTitle(flake.x, flake.y)) {
          flake.stuck = true
          flake.stuckUntil = now + randomBetween(config.stuckDurationMin, config.stuckDurationMax)
        }
        if (flake.y > height + flake.size * 6 || flake.x < -flake.size * 8) respawn(flake)
        drawFlake(context, flake)
      }
      animationFrame = requestAnimationFrame(render)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    window.addEventListener('resize', rebuildTitleMask)
    resize()
    animationFrame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', rebuildTitleMask)
    }
  }, [titleRef])

  return (
    <>
      <canvas aria-hidden="true" className="night-stars" ref={starsCanvasRef} />
      <canvas aria-hidden="true" className="winter-storm" ref={canvasRef} />
    </>
  )
}

export default WinterStorm
