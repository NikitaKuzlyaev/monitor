// FlyingStars.tsx
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
} from "three";

type FlyingStarsProps = {
  count?: number;
  speed?: number;
  spread?: number;
};

function createSpikyStarGeometry(points = 4, inner = 0.08, outer = 0.55, depth = 0.12) {
  const vertices: number[] = [];
  const indices: number[] = [];

  const frontCenter = vertices.length / 3;
  vertices.push(0, 0, depth / 2);

  const backCenter = vertices.length / 3;
  vertices.push(0, 0, -depth / 2);

  const ringFront: number[] = [];
  const ringBack: number[] = [];

  const total = points * 2;

  for (let i = 0; i < total; i++) {
    const angle = (i / total) * Math.PI * 2;
    const radius = i % 2 === 0 ? outer : inner;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    ringFront.push(vertices.length / 3);
    vertices.push(x, y, depth / 2);

    ringBack.push(vertices.length / 3);
    vertices.push(x, y, -depth / 2);
  }

  for (let i = 0; i < total; i++) {
    const next = (i + 1) % total;

    indices.push(frontCenter, ringFront[i], ringFront[next]);
    indices.push(backCenter, ringBack[next], ringBack[i]);

    indices.push(
      ringFront[i],
      ringBack[i],
      ringBack[next],
      ringFront[i],
      ringBack[next],
      ringFront[next]
    );
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function FlyingStars({
  count = 7,
  speed = 0.35,
  spread = 7,
}: FlyingStarsProps) {
  const groupRef = useRef<Group>(null);

  const geometry = useMemo(() => createSpikyStarGeometry(), []);

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#eeeeee",
        roughness: 0.55,
        metalness: 0.15,
      }),
    []
  );

  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      offset: i / count,
      xJitter: (Math.random() - 0.5) * 2.2,
      yJitter: (Math.random() - 0.5) * 1.2,
      z: -10.5 - Math.random() * 2.5,
      scale: 0.45 + Math.random() * 1.2,
      rotationSpeed: 0.25 + Math.random() * 0.8,
    }));
  }, [count]);

  useFrame(({ clock, viewport }) => {
    if (!groupRef.current) return;

    const t = clock.elapsedTime * speed;

    groupRef.current.children.forEach((child, i) => {
      const star = stars[i];
      const mesh = child as Mesh;

      const progress = (t + star.offset) % 1;

      const startX = -viewport.width / 2 - spread * 0.25;
      const startY = -viewport.height / 2 - spread * 0.15;

      const endX = viewport.width / 2 + spread * 0.25;
      const endY = viewport.height / 2 + spread * 0.15;

      mesh.position.x = startX + (endX - startX) * progress + star.xJitter;
      mesh.position.y = startY + (endY - startY) * progress + star.yJitter;
      mesh.position.z = star.z;

      mesh.rotation.x += 0.003 * star.rotationSpeed;
      mesh.rotation.y += 0.006 * star.rotationSpeed;
      mesh.rotation.z -= 0.004 * star.rotationSpeed;

      const fadeIn = Math.min(progress * 4, 1);
      const fadeOut = Math.min((1 - progress) * 4, 1);
      const fade = Math.min(fadeIn, fadeOut);

      mesh.scale.setScalar(star.scale * fade);
    });
  });

  return (
    <group ref={groupRef}>
      {stars.map((star, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={material}
          scale={star.scale}
        />
      ))}
    </group>
  );
}