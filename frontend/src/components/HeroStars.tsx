// HeroStars.tsx
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ShaderMaterial, Vector2, Vector4 } from "three";

type FixedStar = {
  /** x/y in normalized screen coordinates: x: 0..1, y: 0..1 */
  x: number;
  y: number;
  /** star size in shader units, e.g. 0.06..0.24 */
  size: number;
};

type HeroStarsProps = {
  speed?: number;
  stars?: [FixedStar, FixedStar, FixedStar, FixedStar];
};

const DEFAULT_STARS: [FixedStar, FixedStar, FixedStar, FixedStar] = [
  { x: 0.14, y: 0.22, size: 0.09 },
  { x: 0.34, y: 0.72, size: 0.16 },
  { x: 0.68, y: 0.28, size: 0.12 },
  { x: 0.84, y: 0.64, size: 0.22 },
];

export function HeroStars({
  speed = 0.12,
  stars = DEFAULT_STARS,
}: HeroStarsProps) {
  const materialRef = useRef<ShaderMaterial>(null);
  const size = useThree((state) => state.size);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        dithering: false,
        toneMapped: false,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new Vector2(size.width, size.height) },
          uSpeed: { value: speed },
          uStar0: { value: new Vector4(stars[0].x, stars[0].y, stars[0].size, 0) },
          uStar1: { value: new Vector4(stars[1].x, stars[1].y, stars[1].size, 0) },
          uStar2: { value: new Vector4(stars[2].x, stars[2].y, stars[2].size, 0) },
          uStar3: { value: new Vector4(stars[3].x, stars[3].y, stars[3].size, 0) },
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
          uniform float uSpeed;
          uniform vec4 uStar0;
          uniform vec4 uStar1;
          uniform vec4 uStar2;
          uniform vec4 uStar3;

          mat2 rot(float a) {
            float s = sin(a);
            float c = cos(a);
            return mat2(c, -s, s, c);
          }

          float hash(float n) {
            return fract(sin(n) * 43758.5453123);
          }

          float rnd(float seed, float i) {
            return hash(seed * 17.31 + i * 41.73);
          }

          float taperedRay(vec2 p, float angle, float len, float baseWidth, float curve) {
            vec2 q = rot(-angle) * p;

            float x = q.x;
            float y = q.y;

            float t = clamp(x / len, 0.0, 1.0);
            float bend = curve * t * t * len;

            float w = baseWidth * pow(1.0 - t, 1.65);

            float body = abs(y - bend) - w;
            float back = -x;
            float front = x - len;

            return max(max(body, back), front);
          }

          float sdOrganicStar(vec2 p, float seed) {
            float d = 999.0;

            float l0 = mix(0.88, 1.22, rnd(seed, 0.0));
            float l1 = mix(0.58, 0.84, rnd(seed, 1.0));
            float l2 = mix(0.82, 1.14, rnd(seed, 2.0));
            float l3 = mix(0.46, 0.68, rnd(seed, 3.0));
            float l4 = mix(0.52, 0.78, rnd(seed, 4.0));
            float l5 = mix(0.78, 1.10, rnd(seed, 5.0));

            float w0 = mix(0.125, 0.170, rnd(seed, 6.0));
            float w1 = mix(0.085, 0.120, rnd(seed, 7.0));
            float w2 = mix(0.095, 0.135, rnd(seed, 8.0));
            float w3 = mix(0.080, 0.115, rnd(seed, 9.0));
            float w4 = mix(0.075, 0.110, rnd(seed, 10.0));
            float w5 = mix(0.090, 0.130, rnd(seed, 11.0));

            d = min(d, taperedRay(p,  0.00, l0, w0,  0.025));
            d = min(d, taperedRay(p,  0.82, l1, w1,  0.075));
            d = min(d, taperedRay(p,  1.72, l2, w2,  0.115));
            d = min(d, taperedRay(p,  2.95, l3, w3, -0.040));
            d = min(d, taperedRay(p, -2.20, l4, w4, -0.070));
            d = min(d, taperedRay(p, -1.10, l5, w5, -0.105));

            float core =
              abs(p.x * 0.72 + p.y * 0.18) +
              abs(p.x * -0.22 + p.y * 0.92) -
              mix(0.020, 0.00165, rnd(seed, 12.0));

            d = min(d, core);

            return d;
          }

          float star(vec2 uv, vec2 center, float size, float angle, vec2 stretch, float seed) {
            vec2 p = (uv - center) / size;
            p = rot(-angle) * p;
            p *= stretch;

            return sdOrganicStar(p, seed);
          }

          vec2 normalizedCenter(vec4 starConfig, float aspect) {
            // x/y задаются как 0..1 относительно экрана.
            // После aspect correction x тоже переводится в 0..aspect.
            return vec2(starConfig.x * aspect, starConfig.y);
          }

          float drawFixedStar(vec2 uv, vec4 starConfig, float aspect, float seed) {
            vec2 center = normalizedCenter(starConfig, aspect);
            float size = starConfig.z;

            float angle = mix(-0.55, 0.25, rnd(seed, 32.0));
            vec2 stretch = vec2(
              mix(1.0, 1.35, rnd(seed, 33.0)),
              mix(0.76, 0.96, rnd(seed, 34.0))
            );

            return star(uv, center, size, angle, stretch, seed);
          }

          void main() {
            vec2 uv = vUv;
            float aspect = uResolution.x / uResolution.y;
            uv.x *= aspect;

            float d = 999.0;
            d = min(d, drawFixedStar(uv, uStar0, aspect, 13.731));
            d = min(d, drawFixedStar(uv, uStar1, aspect, 27.462));
            d = min(d, drawFixedStar(uv, uStar2, aspect, 41.193));
            d = min(d, drawFixedStar(uv, uStar3, aspect, 54.924));

            float fill = smoothstep(0.006, -0.006, d);

            float outlineWidth = 0.014;
            float outline =
              smoothstep(outlineWidth, 0.0, abs(d)) *
              (1.0 - smoothstep(0.0, -0.014, d));

            float shimmer =
              0.5 + 0.5 * sin(uTime * max(uSpeed, 0.0) * 14.0 + uv.x * 8.0 + uv.y * 5.5);

            vec3 outlineColorA = vec3(0.98, 1.0, 1.0);
            vec3 outlineColorB = vec3(0.45, 0.78, 1.0);
            vec3 outlineColor = mix(outlineColorA, outlineColorB, shimmer);

            vec3 color = mix(outlineColor, vec3(0.0), fill);
            float alpha = max(fill, outline * 0.9);

            gl_FragColor = vec4(color, alpha);
          }
        `,
      }),
    [size.width, size.height]
  );

  useFrame(({ clock }) => {
    if (!materialRef.current) return;

    materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
    materialRef.current.uniforms.uSpeed.value = speed;
    materialRef.current.uniforms.uStar0.value.set(stars[0].x, stars[0].y, stars[0].size, 0);
    materialRef.current.uniforms.uStar1.value.set(stars[1].x, stars[1].y, stars[1].size, 0);
    materialRef.current.uniforms.uStar2.value.set(stars[2].x, stars[2].y, stars[2].size, 0);
    materialRef.current.uniforms.uStar3.value.set(stars[3].x, stars[3].y, stars[3].size, 0);
  });

  return (
    <mesh frustumCulled={false} renderOrder={20000}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}
