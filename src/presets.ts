import type { CanyonUniforms } from "./main"
import { DangColor } from "./util"

const darkFog = (uniforms: CanyonUniforms) => {
	uniforms.fogNear.value = 1000
	uniforms.fogMid.value = 5500
	uniforms.fogFar.value = 8000
}

export const presets = {
	default: (uniforms: CanyonUniforms) => {
		uniforms.fogColorNear.value = new DangColor("#080041")
		uniforms.fogColorMid.value = new DangColor("#b300b0")
		uniforms.fogColorFar.value = new DangColor("#ffffff")
		uniforms.fogNear.value = 666
		uniforms.fogMid.value = 3000
		uniforms.fogFar.value = 10e3
	},
	nightlight: (uniforms: CanyonUniforms) => {
		uniforms.fogColorNear.value = new DangColor("#060415")
		uniforms.fogColorMid.value = new DangColor("#fdffa3")
		uniforms.fogColorFar.value = new DangColor("#0d0a0f")
		darkFog(uniforms)
	},
	wine: (uniforms: CanyonUniforms) => {
		uniforms.fogColorNear.value = new DangColor("#050315")
		uniforms.fogColorMid.value = new DangColor("#5d3243")
		uniforms.fogColorFar.value = new DangColor("#0d090f")
		darkFog(uniforms)
	},
} as const

export type Preset = keyof typeof presets

export const applyPreset = (name: Preset, uniforms: CanyonUniforms) => {
	return presets[name](uniforms)
}
