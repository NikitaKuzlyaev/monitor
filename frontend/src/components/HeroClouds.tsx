// HeroClouds.tsx
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ShaderMaterial, Vector2 } from "three";

export function HeroClouds() {
  const materialRef = useRef<ShaderMaterial>(null);
  const size = useThree((state) => state.size);

  const material = useMemo(
    () =>
      new ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uResolution: { value: new Vector2(size.width, size.height) },
  },
        vertexShader: `
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 0.0, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;

  mat2 m = mat2(
    1.62,  1.18,
   -1.18,  1.62
  );

  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = m * p + 19.17;
    a *= 0.52;
  }

  return v;
}

float ridged(vec2 p) {
  float v = 0.0;
  float a = 0.5;

  mat2 m = mat2(
    1.70,  0.92,
   -0.92,  1.70
  );

  for (int i = 0; i < 5; i++) {
    float n = noise(p);
    n = 1.0 - abs(n * 2.0 - 1.0);
    n *= n;
    v += a * n;

    p = m * p + 7.31;
    a *= 0.5;
  }

  return v;
}

float heightField(vec2 p) {
  float t = uTime * 0.295;

  // Медленный дрейф поля.
  vec2 q = p;
  q += vec2(t * 0.32, -t * 0.18);

  // Domain warp: именно он дает “геологические” изгибы линий.
  vec2 w1;
  w1.x = fbm(q * 1.10 + vec2(13.2, 4.7) + t * 0.35);
  w1.y = fbm(q * 1.05 + vec2(2.8, 19.1) - t * 0.27);

  q += (w1 - 0.5) * 1.25;

  vec2 w2;
  w2.x = fbm(q * 2.25 + vec2(31.4, 8.9) - t * 0.21);
  w2.y = fbm(q * 2.05 + vec2(6.6, 27.3) + t * 0.18);

  q += (w2 - 0.5) * 0.38;

  float large = fbm(q * 1.05);
  float medium = fbm(q * 2.35 + 11.0);
  float sharp = ridged(q * 3.60 - 4.0);

  // “Долина”/разлом, чтобы получить плотную темную зону как на референсе.
  float river = abs(fbm(q * vec2(0.85, 1.70) + vec2(0.0, t * 0.75)) - 0.52);
  river = 1.0 - smoothstep(0.045, 0.22, river);

  float h = large * 0.58 + medium * 0.27 + sharp * 0.15;
  h -= river * 0.22;

  return clamp(h, 0.0, 1.0);
}

float contourLine(float h, float levels, float width) {
  float x = h * levels;

  // Расстояние до ближайшей целой ступени высоты.
  float d = abs(fract(x) - 0.5);

  // fwidth делает толщину линий стабильной при разных разрешениях.
  float aa = fwidth(x) * 1.35;

  return 1.0 - smoothstep(width, width + aa, d);
}

float majorContourLine(float h, float levels, float width) {
  float x = h * levels / 5.0;
  float d = abs(fract(x) - 0.5);
  float aa = fwidth(x) * 1.5;

  return 1.0 - smoothstep(width, width + aa, d);
}

void main() {
  vec2 uv = vUv;

  vec2 p = uv * 2.0 - 1.0;
  p.x *= uResolution.x / max(uResolution.y, 1.0);

  // Масштаб карты.
  p *= 4.05;

  float h = heightField(p);

  // Легкая бумажная подложка.
  float paper = noise(uv * uResolution.xy * 0.42) * 0.35;
  vec3 base = vec3(0.925, 0.905, 0.855) + paper;

  // Тональная заливка высот.
  vec3 low = vec3(0.78, 0.80, 0.76);
  vec3 high = vec3(0.96, 0.94, 0.88);
  vec3 terrain = mix(low, high, smoothstep(0.18, 0.92, h));

  vec3 color = mix(base, terrain, 0.45);

  // Количество изолиний. Больше значение — плотнее контуры.
  float levels = 7.0;

  float thin = contourLine(h, levels, 0.55);
  float major = majorContourLine(h, levels, 0.355);

  // Локальная крутизна высот. На крутых участках линии становятся плотнее/темнее.
  float slope = length(vec2(dFdx(h), dFdy(h))) * 3.0;
  float steep = smoothstep(0.12, 0.130, slope);

  vec3 lineColor = vec3(0.19, 0.19, 0.17);
  vec3 majorColor = vec3(0.8, 0.8, 0.8);

  color = mix(color, lineColor, thin * 0.70);
  color = mix(color, majorColor, major * 0.988);

  // Дополнительная штриховка в крутых зонах.
  float micro = contourLine(h + fbm(p * 9.0) * 0.018, levels * 2.0, 0.475);
  color = mix(color, vec3(0.2), micro * steep * 0.928);

  // Затемнение “ущелий”/низин.
  float valley = smoothstep(0.34, 0.32, h);
  color = mix(color, vec3(0.20, 0.20, 0.18), valley * 0.118);

  // Небольшая виньетка.
  float vig = 1.0 - smoothstep(1.35, 1.35, length(uv - 0.5)) * 0.18;
  color *= vig;

  gl_FragColor = vec4(color, 1.0);
}
        `,
      }),
    [size.width, size.height]
  );

  useFrame(({ clock }) => {
    if (!materialRef.current) return;

    materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}