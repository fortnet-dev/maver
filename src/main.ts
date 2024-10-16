import "./style.css"

import { DangColor, debugLine, gltfSplineToVector3ArrayVeryCool } from "./util"
import { canyonFragmentShader, canyonVertexShader } from "./vertexShader"

import * as THREE from "three"

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"

import Stats from "three/addons/libs/stats.module.js"
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js"
import { type Preset, applyPreset, presets } from "./presets"

const scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer()
const composer = new EffectComposer(renderer)

const parameters = {
	loopDuration: 240e3,
	targetOffset: 0.06,
	debugSplines: true,
}

const camera = new THREE.PerspectiveCamera(
	14,
	window.innerWidth / window.innerHeight,
	0.1,
	15e3,
)

// --------------------------------------------------------------------------------
// Models

// Canyon
const loader = new GLTFLoader()
const canyon = await loader.loadAsync("/canyon.glb")
scene.add(canyon.scene)

const canyonUniforms = {
	fogColorNear: { value: new DangColor("#080041") },
	fogColorMid: { value: new DangColor("#b300b0") },
	fogColorFar: { value: new DangColor("#ffffff") },
	fogNear: { value: 666 },
	fogMid: { value: 3000 },
	fogFar: { value: 10e3 },
}
export type CanyonUniforms = typeof canyonUniforms

renderer.outputColorSpace = THREE.LinearSRGBColorSpace

const canyonMaterial = new THREE.ShaderMaterial({
	uniforms: canyonUniforms,
	vertexShader: canyonVertexShader,
	fragmentShader: canyonFragmentShader,
})

const canyonMesh = canyon.scene.children[0] as THREE.Mesh | undefined
if (canyonMesh?.material instanceof THREE.MeshStandardMaterial) {
	canyonMesh.material = canyonMaterial
}

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

const shaderlessLight = new THREE.DirectionalLight(0xffffff, 1)
shaderlessLight.position.set(0, 100, 0)

// --------------------------------------------------------------------------------
// Postprocessing

composer.addPass(new RenderPass(scene, camera))
composer.addPass(new OutputPass())

// Antialiasing
if (renderer.getContext() instanceof WebGL2RenderingContext) {
	composer.renderTarget1.samples = 8
	composer.renderTarget2.samples = 8
}

scene.background = canyonUniforms.fogColorFar.value

// --------------------------------------------------------------------------------
// GUI

const gui = new GUI()
// gui.close()

gui
	.add({ preset: "default" }, "preset", [...Object.keys(presets)])
	.onChange((value) => {
		applyPreset(value as Preset, canyonUniforms, scene)
	})

gui.add(camera, "fov", 5, 50).onChange(() => camera.updateProjectionMatrix())

gui.add(parameters, "loopDuration", 10e3, 480e3).name("loop duration")
gui.add(parameters, "targetOffset", 0, 0.1).name("target offset")

gui.add(debugGroup, "visible").name("debug splines")

const guiMeshFog = gui.addFolder("Mesh Shader Fog")
const canUni = canyonMaterial.uniforms as CanyonUniforms
guiMeshFog.add(canUni.fogNear, "value", 0, 15e3).name("fog near")
guiMeshFog.add(canUni.fogMid, "value", 0, 15e3).name("fog midpoint")
guiMeshFog.add(canUni.fogFar, "value", 0, 15e3).name("fog far")
guiMeshFog.addColor(canUni.fogColorNear, "value").name("fog color near")
guiMeshFog.addColor(canUni.fogColorMid, "value").name("fog color mid")
guiMeshFog
	.addColor(canUni.fogColorFar, "value")
	.name("fog color far")
	.onChange(() => {
		scene.background = canUni.fogColorFar.value
	})

guiMeshFog
	.add({ disableShader: false }, "disableShader")
	.onChange((disable) => {
		if (canyonMesh?.material) {
			if (disable) {
				canyonMesh.material = new THREE.MeshStandardMaterial()
				scene.add(shaderlessLight)
			} else {
				canyonMesh.material = canyonMaterial
				scene.remove(shaderlessLight)
			}
		}
	})

// --------------------------------------------------------------------------------
// Animation

function animate() {
	stats.begin()

	const time = Date.now()
	const looptimeSeconds = parameters.loopDuration
	const cameraTime = (time % looptimeSeconds) / looptimeSeconds
	const targetTime = (cameraTime + parameters.targetOffset) % 1

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
	renderer.setPixelRatio(window.devicePixelRatio)

	composer.setSize(window.innerWidth, window.innerHeight)
}
resize()
window.addEventListener("resize", resize)

document.body.appendChild(renderer.domElement)
renderer.setAnimationLoop(animate)

const stats = new Stats()
document.body.appendChild(stats.dom)
