// HalftoneOverlay.tsx
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ShaderMaterial, Vector2 } from "three";

export function HalftoneOverlay() {
  const materialRef = useRef<ShaderMaterial>(null);
  const size = useThree((state) => state.size);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new Vector2(size.width, size.height) },

          uCellSize: { value: 3.0 },
          uOpacity: { value: 1.0 },
          uNoisePower: { value: 0.7 },
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
          uniform float uCellSize;
          uniform float uOpacity;
          uniform float uNoisePower;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);

            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));

            vec2 u = f * f * (3.0 - 2.0 * f);

            return mix(a, b, u.x) +
              (c - a) * u.y * (1.0 - u.x) +
              (d - b) * u.x * u.y;
          }

          float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;

            for (int i = 0; i < 5; i++) {
              v += a * noise(p);
              p *= 3.0;
              a *= 0.47;
            }

            return v;
          }

          mat2 rot(float a) {
            float s = sin(a);
            float c = cos(a);
            return mat2(c, -s, s, c);
          }

          float circleGlyph(vec2 p, float r) {
            float d = length(p);
            return 1.0 - smoothstep(r, r + 0.035, d);
          }

          float plusGlyph(vec2 p, float size, float width) {
            vec2 a = abs(p);

            float vertical = 1.0 - smoothstep(width, width + 0.025, a.x);
            vertical *= 1.0 - smoothstep(size, size + 0.025, a.y);

            float horizontal = 1.0 - smoothstep(width, width + 0.025, a.y);
            horizontal *= 1.0 - smoothstep(size, size + 0.025, a.x);

            return max(vertical, horizontal);
          }

          float crossGlyph(vec2 p, float size, float width) {
            p = rot(0.785398) * p;
            return plusGlyph(p, size, width);
          }

          float diamondGlyph(vec2 p, float size, float width) {
            float d = abs(p.x) + abs(p.y);
            return 1.0 - smoothstep(size, size + width, d);
          }

          float sparkleGlyph(vec2 p, float size, float width) {
            float plus = plusGlyph(p, size, width);
            float cross = crossGlyph(p, size * 0.85, width * 0.75);
            float core = circleGlyph(p, width * 1.4);

            return max(max(plus, cross * 0.75), core);
          }

          void main() {
            vec2 uv = vUv;
            vec2 pixel = uv * uResolution;

            vec2 cell = floor(pixel / uCellSize);
            vec2 local = fract(pixel / uCellSize) - 0.5;

            vec2 nUv = uv;
            nUv.x *= uResolution.x / uResolution.y;

            float n1 = fbm(nUv * 1.8 + vec2(uTime * 0.015, uTime * 0.125));
            float n2 = fbm(nUv * 3.6 - vec2(uTime * 0.01, uTime * -0.125));

            float mask = n1 * 0.34 + n2 * 0.35;
            mask = smoothstep(0.22, 0.95, mask);

            float rnd = hash(cell);
            float rnd2 = hash(cell + 31.41);

            local += (rnd - 0.5) * 0.06;

            float size = mix(0.08, 0.42, mask);
            size *= mix(0.75, 1.18, rnd);

            float dot = circleGlyph(local, size * 0.75);
            float plus = plusGlyph(local, size, size * 0.23);
            float cross = crossGlyph(local, size, size * 0.22);
            float diamond = diamondGlyph(local, size * 0.72, 0.04);
            float sparkle = sparkleGlyph(local, size * 1.15, size * 0.16);

            float glyph = 0.0;

            glyph = mix(glyph, dot, smoothstep(0.10, 0.35, mask));
            glyph = mix(glyph, max(dot, plus), smoothstep(0.35, 0.55, mask));
            glyph = mix(glyph, max(cross, diamond), smoothstep(0.55, 0.72, mask));
            glyph = mix(glyph, sparkle, smoothstep(0.72, 0.95, mask));

            if (rnd2 > 0.86) {
              glyph = max(glyph, cross);
            }

            if (rnd2 > 0.94) {
              glyph = max(glyph, sparkle);
            }

            float broken = smoothstep(0.12, 0.8, mask + rnd * uNoisePower);

            float blackZone = smoothstep(0.35, 0.85, mask);
            float whiteZone = 1.0 - smoothstep(0.18, 0.55, mask);

            float blackAlpha = glyph * blackZone * broken * uOpacity;

            float whiteGlyph = max(dot, plus * 0.15);
            float whiteAlpha = whiteGlyph * whiteZone * uOpacity * 0.65;

            whiteAlpha *= step(0.88, rnd);

            float useBlack = step(whiteAlpha, blackAlpha);

            vec3 color = mix(vec3(1.0), vec3(0.0), useBlack);
            float alpha = max(blackAlpha, whiteAlpha);

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
  });

  return (
    <mesh frustumCulled={false} renderOrder={1000}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}