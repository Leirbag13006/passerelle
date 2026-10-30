import { useEffect, useRef, useState } from 'react'
import { onMotionChange, reducedMotion } from '../lib/a11y'
import { skyFragment, skyVertex } from '../shaders/sky'

const CLOUDS_SRC = '/clouds.png'

// Fond animé du hero, rendu en WebGL2.
// - mis en pause hors écran et quand l'onglet est caché
// - une seule image fixe si l'utilisateur préfère réduire les animations
// - dégradé CSS de secours si WebGL n'est pas disponible
export default function SkyBackground({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' })
    if (!gl) {
      setFailed(true)
      return
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
      return s
    }
    let program: WebGLProgram
    try {
      program = gl.createProgram()!
      gl.attachShader(program, compile(gl.VERTEX_SHADER, skyVertex))
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, skyFragment))
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link')
    } catch (err) {
      console.error('[SkyBackground]', err)
      setFailed(true)
      return
    }
    gl.useProgram(program)

    // triangle plein écran
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'u_res')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')
    const uScale = gl.getUniformLocation(program, 'u_scale')
    const uClouds = gl.getUniformLocation(program, 'u_clouds')
    const uCloudAspect = gl.getUniformLocation(program, 'u_cloudAspect')
    const uCloudsReady = gl.getUniformLocation(program, 'u_cloudsReady')

    // plaque de nuages Blender : fondu d'entrée une fois chargée
    const tex = gl.createTexture()
    let cloudAspect = 16 / 9
    let cloudsLoadedAt = -1
    let disposed = false
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (disposed) return
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, img)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      cloudAspect = img.naturalWidth / img.naturalHeight
      cloudsLoadedAt = performance.now()
      start()
    }
    img.src = CLOUDS_SRC

    // les nuages sont doux : inutile de rendre au-delà de 1.5x
    const scale = Math.min(window.devicePixelRatio || 1, 1.5)

    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * scale))
      const h = Math.max(1, Math.round(canvas.clientHeight * scale))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
    }

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    const onPointer = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1
      mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1)
    }

    // départ décalé pour que la traînée soit déjà en vol au chargement
    const t0 = performance.now() - 6500
    let raf = 0
    let visible = true

    const draw = (now: number) => {
      resize()
      mouse.x += (mouse.tx - mouse.x) * 0.04
      mouse.y += (mouse.ty - mouse.y) * 0.04
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, reducedMotion() ? 11 : (now - t0) / 1000)
      gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.uniform1f(uScale, scale)
      const ready = cloudsLoadedAt < 0 ? 0 : reducedMotion() ? 1 : Math.min(1, (now - cloudsLoadedAt) / 1400)
      gl.uniform1f(uCloudsReady, ready * ready * (3 - 2 * ready))
      gl.uniform1f(uCloudAspect, cloudAspect)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.uniform1i(uClouds, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const loop = (now: number) => {
      draw(now)
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      cancelAnimationFrame(raf)
      if (!visible || document.hidden) return
      if (reducedMotion()) draw(performance.now())
      else raf = requestAnimationFrame(loop)
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      start()
    })
    io.observe(canvas)
    const ro = new ResizeObserver(() => reducedMotion() && draw(performance.now()))
    ro.observe(canvas)
    document.addEventListener('visibilitychange', start)
    const offMotion = onMotionChange(start)
    window.addEventListener('pointermove', onPointer, { passive: true })
    start()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', start)
      offMotion()
      window.removeEventListener('pointermove', onPointer)
      // pas de loseContext() : le canvas peut être remonté (StrictMode) et récupérerait un contexte perdu
      gl.deleteBuffer(buf)
      gl.deleteTexture(tex)
      gl.deleteProgram(program)
    }
  }, [])

  if (failed) {
    return (
      <div
        aria-hidden="true"
        className={className}
        style={{
          background:
            'radial-gradient(120% 70% at 80% 100%, #4a5fd6 0%, rgba(0,0,0,0) 60%), linear-gradient(180deg, #03061c 0%, #0b1a6e 55%, #3346c4 100%)',
        }}
      />
    )
  }
  return <canvas ref={canvasRef} aria-hidden="true" className={className} />
}
