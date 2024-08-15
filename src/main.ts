import "./style.css"
import { debugLine, gltfSplineToVector3ArrayVeryCool } from "./util"

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

const parameters = {
	loopDuration: 240e3,
	targetOffset: 8e3,
	fogColor: new THREE.Color("#d900ff"),
	debugSplines: true,
}

// Camera
const camera = new THREE.PerspectiveCamera(
	22,
	window.innerWidth / window.innerHeight,
	1,
	10e3,
)

// --------------------------------------------------------------------------------
// Models

// Canyon
const loader = new GLTFLoader()
const canyon = await loader.loadAsync("/canyon.glb")

scene.add(canyon.scene)

const debugGroup = new THREE.Group()
scene.add(debugGroup)

// Camera path
const cameraSpline = await loader.loadAsync("/camera.glb")
const cameraVectors = gltfSplineToVector3ArrayVeryCool(cameraSpline)
const cameraPath = new THREE.CatmullRomCurve3(cameraVectors, true)
debugGroup.add(debugLine(cameraVectors, "#ff0000"))

// Camera target path
const targetSpline = await loader.loadAsync("/target.glb")
const targetVectors = gltfSplineToVector3ArrayVeryCool(targetSpline)
const targetPath = new THREE.CatmullRomCurve3(targetVectors, true)
debugGroup.add(debugLine(targetVectors, "#00ff00"))

const targetBall = new THREE.Mesh(
	new THREE.SphereGeometry(5, 32, 32),
	new THREE.MeshBasicMaterial({ color: "#00ff00" }),
)
debugGroup.add(targetBall)

debugGroup.visible = false

// --------------------------------------------------------------------------------
// Postprocessing

composer.addPass(new RenderPass(scene, camera))
composer.addPass(new OutputPass())

renderer.shadowMap.enabled = true

scene.background = parameters.fogColor
scene.fog = new THREE.Fog(parameters.fogColor, 500, 10e3)

// --------------------------------------------------------------------------------
// GUI

const gui = new GUI()

gui.add(camera, "fov", 10, 120).onChange(() => camera.updateProjectionMatrix())

gui.add(parameters, "loopDuration", 120e3, 480e3).name("Loop Duration")
gui.add(parameters, "targetOffset", 6e3, 12e3).name("Target Offset")

gui.addColor(parameters, "fogColor").onChange(() => {
	scene.background = parameters.fogColor
	scene.fog?.color.copy(parameters.fogColor)
})

gui.add(debugGroup, "visible").name("debug splines")

const guiFog = gui.addFolder("Fog")
guiFog.add(scene.fog, "far", 5e3, 20e3)
guiFog.add(scene.fog, "near", 500, 5e3)

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
