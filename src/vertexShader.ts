export const canyonVertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const canyonFragmentShader = `
  uniform vec3 fogColorNear;
	uniform vec3 fogColorMid;
  uniform vec3 fogColorFar;
  uniform float fogNear;
  uniform float fogMid;
  uniform float fogFar;
  varying vec3 vWorldPosition;

  void main() {
    float depth = distance(vWorldPosition, cameraPosition);

    vec3 fogColor;
    if (depth < fogMid) {
      float t = smoothstep(fogNear, fogMid, depth);
      fogColor = mix(fogColorNear, fogColorMid, t);
    } else {
      float t = smoothstep(fogMid, fogFar, depth);
      fogColor = mix(fogColorMid, fogColorFar, t);
    }

    gl_FragColor = vec4(fogColor, 1.0);
  }
`
