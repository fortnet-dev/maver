import "./style.css";
import {ss} from "./util";

import * as THREE from "three";

import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import {degToRad} from "three/src/math/MathUtils.js";

import Stats from "three/addons/libs/stats.module.js";
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {OutputPass} from "three/addons/postprocessing/OutputPass.js";
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";

const CANYON_SCALE = 0.0625;

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({});
const composer = new EffectComposer(renderer);
const gui = new GUI();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight
);

// Somthin Light

const lightGroup = new THREE.Group();
scene.add(lightGroup);

const lightPos = [0, 10, 0] as const;
const light = new THREE.PointLight(0xffffff, 100e3);
light.castShadow = true;
lightGroup.add(light);

const lamp = new THREE.SphereGeometry(0.5, 32, 32);
const lampMesh = new THREE.Mesh(
  lamp,
  new THREE.MeshBasicMaterial({color: 0xffffff})
);
lampMesh.material = new THREE.MeshBasicMaterial({color: 0xffffff});
lampMesh.castShadow = true;
lampMesh.receiveShadow = true;
lightGroup.add(lampMesh);

lightGroup.position.set(...lightPos);

const lightGuiGroup = gui.addFolder("Light");
lightGuiGroup.add(lightGroup.position, "x", -500, 500);
lightGuiGroup.add(lightGroup.position, "y", 0, 500);
lightGuiGroup.add(lightGroup.position, "z", -500, 500);
lightGuiGroup.add(light, "intensity", 0, 100e3);

const resetCamera = () => {
  camera.position.set(0, 0, 0);
  camera.rotation.set(0, 0, 0);

  camera.rotation.x = degToRad(-90);
  camera.position.y = 500;
};

// Saved camera state
const savedCameraState = ss("camera-state");
if (savedCameraState) {
  camera.position.fromArray(savedCameraState.position);
  camera.rotation.fromArray(savedCameraState.rotation);
  camera.zoom = savedCameraState.zoom;
} else {
  resetCamera();
}

// Camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener("change", () => {
  ss("camera-state", {
    position: camera.position.toArray(),
    rotation: camera.rotation.toArray(),
    zoom: camera.zoom,
  });
});
gui.addFolder("Camera").add({"reset camera": resetCamera}, "reset camera");

// Stunning Cube
const geometry = new THREE.BoxGeometry(30, 30, 30);
const material = new THREE.MeshBasicMaterial({color: 0xff00ff});
const cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;
cube.receiveShadow = true;
scene.add(cube);

// Ground Plane (for shadow casting)
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshStandardMaterial({color: 0x888888});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -2;
plane.receiveShadow = true;
scene.add(plane);

// Canyon
const loader = new GLTFLoader();
const canyon = await loader.loadAsync("/canyon.glb");
canyon.scene.scale.set(CANYON_SCALE, CANYON_SCALE, CANYON_SCALE);
scene.add(canyon.scene);

// Camera path
const cameraSpline = await loader.loadAsync("/camera.glb");
cameraSpline.scene.scale.set(CANYON_SCALE, CANYON_SCALE, CANYON_SCALE);
// scene.add(cameraSpline.scene)

const lineSegments = cameraSpline.scene.children[0] as
  | THREE.LineSegments
  | undefined;
if (!lineSegments) throw new Error("No line segments found");

const positions = lineSegments.geometry.attributes.position;
if (!positions) throw new Error("No positions found");

const flatPos = positions.array;
const tempVec = new THREE.Vector3();
const vectors: THREE.Vector3[] = [];
for (let index = 0; index < flatPos.length; index += 3) {
  tempVec.fromArray(flatPos, index);
  tempVec.applyMatrix4(lineSegments.matrixWorld);
  vectors.push(tempVec.clone());
}

const splineGeometry = new THREE.BufferGeometry().setFromPoints(vectors);
const splineMat = new THREE.LineBasicMaterial({color: 0xff0000});
const line = new THREE.Line(splineGeometry, splineMat);
line.scale.set(CANYON_SCALE, CANYON_SCALE, CANYON_SCALE);
scene.add(line);

//Add CatmullRomCurve3  😍 to follow along path
const scaledPoints = vectors.map((vector) =>
  vector.clone().multiplyScalar(CANYON_SCALE)
);
const path = new THREE.CatmullRomCurve3(scaledPoints, true);

// --------------------------------------------------------------------------------

const stats = new Stats();
document.body.appendChild(stats.dom);

composer.addPass(new RenderPass(scene, camera));
composer.addPass(new OutputPass());

renderer.shadowMap.enabled = true;

const resize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
};
// Resize listener on the window
resize();
window.addEventListener("resize", resize);

document.body.appendChild(renderer.domElement);

function animate(time: number) {
  stats.begin();
  // renderer.render(scene, camera)
  composer.render();

  // put cube on path
  const t = ((time / 10) % vectors.length) / vectors.length;
  const position = path.getPointAt(t);
  cube.position.copy(position);

  controls.update();
  stats.end();
}
renderer.setAnimationLoop(animate);
