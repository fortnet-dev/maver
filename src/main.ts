import "./style.css"
import { ss } from "./util"

import * as THREE from "three"

import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js"
import { degToRad } from "three/src/math/MathUtils.js"

const CANYON_SCALE = 0.0625

// Resize listener on the window
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Scene and renderer
const scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
)

// Somthin Light
const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(5, 5, 5)
light.castShadow = true
scene.add(light)

// Light shadow settings (optional)
light.shadow.mapSize.width = 1024
light.shadow.mapSize.height = 1024
light.shadow.camera.near = 0.5
light.shadow.camera.far = 20

const resetCamera = () => {
  camera.position.set(0, 0, 0)
  camera.rotation.set(0, 0, 0)

  camera.rotation.x = degToRad(-90)
  camera.position.y = 500
}

// Saved camera state
const savedCameraState = ss("camera-state")
if (savedCameraState) {
  camera.position.fromArray(savedCameraState.position)
  camera.rotation.fromArray(savedCameraState.rotation)
  camera.zoom = savedCameraState.zoom
} else {
  resetCamera()
}

// Camera controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.addEventListener("change", () => {
  ss("camera-state", {
    position: camera.position.toArray(),
    rotation: camera.rotation.toArray(),
    zoom: camera.zoom,
  })
})

const gui = new GUI()
gui.add({ reset: resetCamera }, "reset")

// Stunning Cube
const geometry = new THREE.BoxGeometry(0.0625, 3, 0.0625)
const material = new THREE.MeshBasicMaterial({ color: 0xff00ff })
const cube = new THREE.Mesh(geometry, material)
cube.castShadow = true
cube.receiveShadow = true
scene.add(cube)

// Ground Plane (for shadow casting)
const planeGeometry = new THREE.PlaneGeometry(10, 10)
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 })
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.rotation.x = -Math.PI / 2
plane.position.y = -2
plane.receiveShadow = true
scene.add(plane)

// Canyon
const loader = new GLTFLoader()
const canyon = await loader.loadAsync("/canyon.glb")
canyon.scene.scale.set(CANYON_SCALE, CANYON_SCALE, CANYON_SCALE)
scene.add(canyon.scene)

// Camera path
const cameraSpline = await loader.loadAsync("/camera.glb")
cameraSpline.scene.scale.set(CANYON_SCALE, CANYON_SCALE, CANYON_SCALE)
// scene.add(cameraSpline.scene)

const lineSegments = cameraSpline.scene.children[0] as THREE.LineSegments | undefined
if (!lineSegments) throw new Error("No line segments found")

const positions = lineSegments.geometry.attributes.position
if (!positions) throw new Error("No positions found")

const flatPos = positions.array
const tempVec = new THREE.Vector3()
const vectors: THREE.Vector3[] = []
for (let index = 0; index < flatPos.length; index += 3) {
  tempVec.fromArray(flatPos, index)
  tempVec.applyMatrix4(lineSegments.matrixWorld)
  vectors.push(tempVec.clone())
}

const splineGeometry = new THREE.BufferGeometry().setFromPoints(vectors)
const splineMat = new THREE.LineBasicMaterial({ color: 0xff0000 })
const line = new THREE.Line(splineGeometry, splineMat)
line.scale.set(CANYON_SCALE, CANYON_SCALE, CANYON_SCALE)
scene.add(line)

function animate() {
  renderer.render(scene, camera)
  cube.rotation.x += 0.01
  cube.rotation.y += 0.01
  cube.rotation.z += 0.125
  controls.update()
}
renderer.setAnimationLoop(animate)
