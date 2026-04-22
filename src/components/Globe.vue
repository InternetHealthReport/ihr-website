<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const containerRef = ref(null)
let renderer = null
let frameId = null

function initGlobe(container) {
  const scene = new THREE.Scene()

  // Renderer
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(window.devicePixelRatio)
  const initSize = container.offsetHeight
  renderer.setSize(initSize, initSize)
  scene.background = null
  container.appendChild(renderer.domElement)

  // Lights
  const light1 = new THREE.PointLight(0x5a54ff, 0.75)
  light1.position.set(-150, 150, -50)
  const light2 = new THREE.PointLight(0x4158f6, 0.75)
  light2.position.set(-400, 200, 150)
  const light3 = new THREE.PointLight(0x803bff, 0.7)
  light3.position.set(100, 250, -100)
  scene.add(light1, light2, light3)

  // Globe sphere
  const sphereGeometry = new THREE.SphereGeometry(2, 64, 64)
  const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xeeeeee })
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  sphere.castShadow = true
  sphere.receiveShadow = true
  scene.add(sphere)

  // Map overlay texture
  const loader = new THREE.TextureLoader()
  const overlayMaterial = new THREE.MeshBasicMaterial({
    map: loader.load('https://i.imgur.com/JLFp6Ws.png'),
    transparent: true
  })
  const overlaySphereGeometry = new THREE.SphereGeometry(2.003, 64, 64)
  const overlaySphere = new THREE.Mesh(overlaySphereGeometry, overlayMaterial)
  overlaySphere.castShadow = true
  overlaySphere.receiveShadow = true
  sphere.add(overlaySphere)

  // Bezier curve tubes
  const numPoints = 100
  const start = new THREE.Vector3(0, 1.5, 1.3)
  const middle = new THREE.Vector3(0.6, 0.6, 3.2)
  const end = new THREE.Vector3(1.5, -1, 0.8)
  const curveQuad = new THREE.QuadraticBezierCurve3(start, middle, end)

  const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0xd965fa })

  const tubeRotations = [
    { y: 0, z: 0, x: 0 },
    { y: 0.75, z: 0.75, x: -0.1 },
    { y: 2.1, z: 0.5, x: 0.2 },
    { y: 2.3, z: 0.8, x: 0.2 },
    { y: 2.9, z: 1.1, x: 2 },
    { y: 7.1, z: 1, x: 4.4 },
    { y: 2.1, z: 3, x: 4.4 },
    { y: 2.5, z: 1, x: 1.1 }
  ]

  const tubes = []
  for (const rot of tubeRotations) {
    const tube = new THREE.TubeGeometry(curveQuad, numPoints, 0.01, 20, false)
    tube.setDrawRange(0, 10000)
    const mesh = new THREE.Mesh(tube, tubeMaterial)
    mesh.rotation.set(rot.x, rot.y, rot.z)
    sphere.add(mesh)
    tubes.push(tube)
  }

  // Mouse drag rotation
  let isDragging = false
  let previousMouseX = 0
  let previousMouseY = 0

  container.addEventListener('mousedown', (e) => {
    isDragging = true
    previousMouseX = e.offsetX
    previousMouseY = e.offsetY
  })
  container.addEventListener('mousemove', (e) => {
    if (isDragging) {
      sphere.rotation.y += (e.offsetX - previousMouseX) * 0.004
      sphere.rotation.x += (e.offsetY - previousMouseY) * 0.004
    }
    previousMouseX = e.offsetX
    previousMouseY = e.offsetY
  })
  const onMouseUp = () => {
    isDragging = false
  }
  document.addEventListener('mouseup', onMouseUp)
  container.addEventListener('mouseleave', () => {
    isDragging = false
  })

  // Camera
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
  camera.position.z = 4

  // Animation state
  let renderCount = 0
  let currentGrowing = 0

  function growTube(index, count) {
    count = Math.ceil(count / 3) * 3
    tubes[index].setDrawRange(0, count)
    if (index > 2) {
      tubes[index - 3].setDrawRange(count, 10000)
    } else {
      tubes[tubes.length - 3 + index].setDrawRange(count, 10000)
    }
  }

  function animate() {
    if (renderCount < 10000) {
      renderCount += 80
      growTube(currentGrowing, renderCount)
    } else {
      renderCount = 0
      if (currentGrowing >= tubes.length - 1) {
        currentGrowing = 0
      } else {
        currentGrowing++
      }
    }

    frameId = requestAnimationFrame(animate)

    if (!isDragging) {
      sphere.rotation.y += 0.0005
    }

    renderer.render(scene, camera)
  }

  animate()

  function onResize() {
    const size = container.offsetHeight
    renderer.setSize(size, size)
  }
  window.addEventListener('resize', onResize)

  // Return cleanup function
  return () => {
    if (frameId) cancelAnimationFrame(frameId)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('mouseup', onMouseUp)
    renderer.dispose()
    container.removeChild(renderer.domElement)
  }
}

let cleanup = null

onMounted(() => {
  if (containerRef.value) {
    cleanup = initGlobe(containerRef.value)
  }
})

onUnmounted(() => {
  if (cleanup) cleanup()
})
</script>

<template>
  <div ref="containerRef" class="globe-container"></div>
</template>

<style scoped>
.globe-container {
  width: 100%;
  height: 100%;
  cursor: grab;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.globe-container:active {
  cursor: grabbing;
}
</style>
