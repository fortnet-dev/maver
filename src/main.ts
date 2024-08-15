import "./style.css"
import { gltfSplineToVector3ArrayVeryCool } from "./util"

import * as THREE from "three"

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js"

import Stats from "three/addons/libs/stats.module.js"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"

const scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer({})
const composer = new EffectComposer(renderer)
const gui = new GUI()

const CANYON_SCALE = 0.0625
const parameters = {
	loopDuration: 120e3,
	targetOffset: 4e3,
	glowColor: new THREE.Color(0xbf40bf),
	canyonColor: new THREE.Color(0x1e49d6),
}

const paramGroupGui = gui.addFolder("Parameters")
paramGroupGui.add(parameters, "loopDuration", 60e3, 240e3).name("Loop Duration")
paramGroupGui.add(parameters, "targetOffset", 0, 10e3).name("Target Offset")

gui
	.addColor(parameters, "glowColor")
	.name("Glow Color")
	.onChange(() => {
		scene.background = parameters.glowColor
		scene.fog?.color.copy(parameters.glowColor)
	})
gui
	.addColor(parameters, "canyonColor")
	.name("Canyon Color")
	.onChange(() => {
		console.log(canyon.scene.getObjectById(0))
	})

scene.background = parameters.glowColor
scene.fog = new THREE.Fog(parameters.glowColor, 0.01, 1000)

// Camera
const camera = new THREE.PerspectiveCamera(
	10,
	window.innerWidth / window.innerHeight,
)

gui
	.add(camera, "fov", 10, 120)
	.name("Camera FOV")
	.onChange(() => camera.updateProjectionMatrix())

// Somthin Light

const light = new THREE.PointLight(0xbf40bf, 10e3)
// scene.add(light)

gui.add(light, "intensity", 0, 100e3).name("Light Intensity")

// Canyon
const loader = new GLTFLoader()
const canyon = await loader.loadAsync("/canyon.glb")
canyon.scene.scale.set(CANYON_SCALE, CANYON_SCALE, CANYON_SCALE)

scene.add(canyon.scene)

// Camera path
const cameraSpline = await loader.loadAsync("/camera.glb")
const cameraVectors = gltfSplineToVector3ArrayVeryCool(
	cameraSpline,
	CANYON_SCALE,
)

// Camera target path
const targetSpline = await loader.loadAsync("/target.glb")
const targetVectors = gltfSplineToVector3ArrayVeryCool(
	targetSpline,
	CANYON_SCALE,
)

const cameraSplineGeometry = new THREE.BufferGeometry().setFromPoints(
	cameraVectors,
)
const cameraSplineMat = new THREE.LineBasicMaterial({ color: 0xff0000 })
const cameraLine = new THREE.Line(cameraSplineGeometry, cameraSplineMat)
scene.add(cameraLine)

const targetSplineGeometry = new THREE.BufferGeometry().setFromPoints(
	targetVectors,
)
const targetSplineMat = new THREE.LineBasicMaterial({ color: 0x00ff00 })
const targetLine = new THREE.Line(targetSplineGeometry, targetSplineMat)
scene.add(targetLine)

const targetBall = new THREE.Mesh(
	new THREE.SphereGeometry(0.5, 32, 32),
	new THREE.MeshBasicMaterial({
		color: 0x00ff00,
	}),
)
scene.add(targetBall)

//Add CatmullRomCurve3  😍 to follow along path
const cameraPath = new THREE.CatmullRomCurve3(cameraVectors, true)
const targetPath = new THREE.CatmullRomCurve3(targetVectors, true)

// --------------------------------------------------------------------------------

composer.addPass(new RenderPass(scene, camera))
composer.addPass(new OutputPass())

renderer.shadowMap.enabled = true

const resize = () => {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
	composer.setSize(window.innerWidth, window.innerHeight)
}
// Resize listener on the window
resize()
window.addEventListener("resize", resize)

document.body.appendChild(renderer.domElement)

function animate() {
	stats.begin()

	const time = Date.now()
	const looptimeSeconds = parameters.loopDuration
	const cameraTime = (time % looptimeSeconds) / looptimeSeconds
	const targetTime =
		((time + parameters.targetOffset) % looptimeSeconds) / looptimeSeconds

	const cameraPos = cameraPath.getPointAt(cameraTime)
	camera.position.copy(cameraPos)
	light.position.copy(cameraPos)

	const targetPos = targetPath.getPointAt(targetTime)
	targetBall.position.copy(targetPos)
	camera.lookAt(targetPos)

	composer.render()
	stats.end()
}

const stats = new Stats()
document.body.appendChild(stats.dom)

renderer.setAnimationLoop(animate)
