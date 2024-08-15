import type { EulerOrder } from "three"

interface Stored {
	"camera-state": {
		position: [
			number,
			number,
			number,
		]
		rotation: [
			number,
			number,
			number,
			order?: EulerOrder,
		]
		zoom: number
	}
}

/**
 * sessionStorage wrapper
 */
export function ss<
	L extends
		keyof Stored,
>(
	key: L,
):
	| Stored[L]
	| null
export function ss<
	L extends
		keyof Stored,
>(
	key: L,
	value: Stored[L],
): void
export function ss<
	L extends
		keyof Stored,
>(
	key: L,
	value?: Stored[L],
):
	| Stored[L]
	| null {
	return value !==
		undefined
		? sessionStorage.setItem(
				`maver-${key}`,
				JSON.stringify(
					value,
				),
			)
		: JSON.parse(
				sessionStorage.getItem(
					`maver-${key}`,
				) as string,
			)
}
