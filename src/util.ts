import type { EulerOrder } from "three"
import * as THREE from "three"
import type { GLTF } from "three/examples/jsm/Addons.js"

interface Stored {
	"camera-state": {
		position: [number, number, number]
		rotation: [number, number, number, order?: EulerOrder]
		zoom: number
	}
}

/**
 * sessionStorage wrapper
 */
export function ss<L extends keyof Stored>(key: L): Stored[L] | null
export function ss<L extends keyof Stored>(key: L, value: Stored[L]): void
export function ss<L extends keyof Stored>(
	key: L,
	value?: Stored[L],
): Stored[L] | null {
	return value !== undefined
		? sessionStorage.setItem(`maver-${key}`, JSON.stringify(value))
		: JSON.parse(sessionStorage.getItem(`maver-${key}`) as string)
}

export const gltfSplineToVector3ArrayVeryCool = (raw: GLTF) => {
	const lineSegments = raw.scene.children[0] as THREE.LineSegments | undefined
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

	return vectors
}

export const debugLine = (
	vectors: THREE.Vector3[],
	color: THREE.ColorRepresentation,
) => {
	const geometry = new THREE.BufferGeometry().setFromPoints(vectors)
	const material = new THREE.LineBasicMaterial({ color })
	return new THREE.Line(geometry, material)
}
