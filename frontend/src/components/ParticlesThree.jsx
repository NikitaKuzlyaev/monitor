import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function ParticleSystem({ count = 10000, bodies = [] }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.pow(Math.random(), 1.5) * 6
      const x = Math.cos(angle) * radius 
      const y = Math.sin(angle) * radius
      const offset = Math.random() * 1000
      const deformFreq = 0.5 + Math.random() * 1.5
      const deformAmp = 4 + Math.random() * 8
      temp.push({ angle, radius, offset, deformFreq, deformAmp, x, y })
    }
    return temp
  }, [count])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() / 10

    // Обновляем позиции тел
    bodies.forEach((b, idx) => {
      const angle = t * b.speed + b.phase
      b.position.set(Math.cos(angle) * b.orbit, Math.sin(angle) * b.orbit, 0)
    })

    particles.forEach((p, i) => {
      // Базовое колебание частиц
      const deformation =
        Math.sin(t * p.deformFreq + p.offset) * p.deformAmp +
        Math.sin(t * 0.3 + p.angle * 2) * 2

      let x = Math.cos(p.angle) * (p.radius + deformation)
      let y = Math.sin(p.angle) * (p.radius + deformation)

      // Влияние тел на частицы
      bodies.forEach((b) => {
        const dx = b.position.x - x
        const dy = b.position.y - y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < b.influence) {
          // простое смещение к телу
          const effect = (b.influence - dist) / b.influence
          x += dx * 0.4 * effect
          y += dy * 2.4 * effect
        }
      })

      const scale = 1 + Math.sin(t * 3 + p.offset) * 0.3

      dummy.position.set(x, y, 0)
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <sphereGeometry args={[0.02, 1, 1]} />
      <meshStandardMaterial
        emissive="#003377"
        emissiveIntensity={2.5}
        roughness={1.0}
        metalness={1.0}
        transparent
        opacity={1.0}
      />
    </instancedMesh>
  )
}

function ParticlesThree({ count = 30000 }) {
  // Два тела для вращения
  const bodies = useMemo(() => [
    { orbit: 5, speed: 2.5, phase: 0, influence: 20, position: new THREE.Vector3() },
    { orbit: 7, speed: -2.3, phase: Math.PI, influence: 20, position: new THREE.Vector3() },
    { orbit: 10, speed: -1.3, phase: 1.2, influence: 20, position: new THREE.Vector3() },
    { orbit: 1, speed: 0.3, phase: 1.27282, influence: 20, position: new THREE.Vector3() }
  ], [])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden',
        // background: 'radial-gradient(circle at center,rgba(62, 10, 157, 0.26), #000)'
        backgroundColor: 'white',
      }}
    >
      <Canvas camera={{ position: [2, 10, 12], fov: 70 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 10]} intensity={2} color="#000000" />
        <ParticleSystem count={count} bodies={bodies} />
      </Canvas>
    </div>
  )
}

export default ParticlesThree
