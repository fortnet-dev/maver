import "./style.css"
import { gltfSplineToVector3ArrayVeryCool } from "./util"

import * as THREE from "three"

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"

import Stats from "three/addons/libs/stats.module.js"
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js"

const scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer()
const composer = new EffectComposer(renderer)

const CANYON_SCALE = 0.0625
const parameters = {
	loopDuration: 120e3,
	targetOffset: 4e3,
	fogColor: new THREE.Color("hsl(291, 100%, 50%)"),
	debugSplines: true,
}

// Camera
const camera = new THREE.PerspectiveCamera(
	22,
	window.innerWidth / window.innerHeight,
)

// --------------------------------------------------------------------------------
// Models

// Canyon
const loader = new GLTFLoader()
const canyon = await loader.loadAsync("/canyon.glb")
canyon.scene.scale.set(CANYON_SCALE, CANYON_SCALE, CANYON_SCALE)

scene.add(canyon.scene)

const debugGroup = new THREE.Group()
scene.add(debugGroup)

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
debugGroup.add(cameraLine)

const targetSplineGeometry = new THREE.BufferGeometry().setFromPoints(
	targetVectors,
)
const targetSplineMat = new THREE.LineBasicMaterial({ color: 0x00ff00 })
const targetLine = new THREE.Line(targetSplineGeometry, targetSplineMat)
debugGroup.add(targetLine)

const targetBall = new THREE.Mesh(
	new THREE.SphereGeometry(0.5, 32, 32),
	new THREE.MeshBasicMaterial({
		color: 0x00ff00,
	}),
)
debugGroup.add(targetBall)

debugGroup.visible = false

//Add CatmullRomCurve3  😍 to follow along path
const cameraPath = new THREE.CatmullRomCurve3(cameraVectors, true)
const targetPath = new THREE.CatmullRomCurve3(targetVectors, true)

// --------------------------------------------------------------------------------
// Postprocessing

composer.addPass(new RenderPass(scene, camera))
composer.addPass(new OutputPass())

renderer.shadowMap.enabled = true

scene.background = parameters.fogColor
scene.fog = new THREE.Fog(parameters.fogColor, 50, 1000)

// --------------------------------------------------------------------------------
// GUI

const gui = new GUI()

gui.add(camera, "fov", 10, 120).onChange(() => camera.updateProjectionMatrix())

gui.add(parameters, "loopDuration", 60e3, 240e3).name("Loop Duration")
gui.add(parameters, "targetOffset", 0, 10e3).name("Target Offset")

gui.addColor(parameters, "fogColor").onChange(() => {
	scene.background = parameters.fogColor
	scene.fog?.color.copy(parameters.fogColor)
})

gui.add(debugGroup, "visible").name("debug splines")

const guiFog = gui.addFolder("Fog")
guiFog.add(scene.fog, "far", 100, 2000)
guiFog.add(scene.fog, "near", 0, 1000)

// --------------------------------------------------------------------------------
// Animation

function animate() {
	stats.begin()

	const time = performance.now()
	const looptimeSeconds = parameters.loopDuration
	const cameraTime = (time % looptimeSeconds) / looptimeSeconds
	const targetTime =
		((time + parameters.targetOffset) % looptimeSeconds) / looptimeSeconds

	const cameraPos = cameraPath.getPointAt(cameraTime)
	camera.position.copy(cameraPos)

	const targetPos = targetPath.getPointAt(targetTime)
	targetBall.position.copy(targetPos)
	camera.lookAt(targetPos)

	composer.render()
	stats.end()
}

// --------------------------------------------------------------------------------
// Setup

const resize = () => {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
	composer.setSize(window.innerWidth, window.innerHeight)
}
resize()
window.addEventListener("resize", resize)

document.body.appendChild(renderer.domElement)
renderer.setAnimationLoop(animate)

const stats = new Stats()
document.body.appendChild(stats.dom)
