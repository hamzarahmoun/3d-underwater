import { useAnimations, useGLTF } from "@react-three/drei";

import { useAtom } from "jotai";
import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";
import { SkeletonUtils } from "three-stdlib";
import { themeAtom, THEMES } from "./UI";
import { useControls } from "leva";
import { randFloat, randInt } from "three/src/math/MathUtils.js";
import { useFrame } from "@react-three/fiber";
const wander = new Vector3();
const horizontalWander = new Vector3();
const limits = new Vector3();
const steering = new Vector3();

export const Boids = ({ boundaries }) => {
  const [theme] = useAtom(themeAtom);
  const { NB_BOIDS, MIN_SCALE, MAX_SCALE, MIN_SPEED, MAX_SPEED, MAX_STEERING } =
    useControls(
      "General settings",
      {
        NB_BOIDS: { value: 100, min: 1, max: 200 },
        MIN_SCALE: { value: 0.7, min: 0.1, max: 2, step: 0.1 },
        MAX_SCALE: { value: 1.3, min: 0.1, max: 2, step: 0.1 },
        MIN_SPEED: { value: 0.9, min: 0, max: 10, step: 0.1 },
        MAX_SPEED: { value: 3.6, min: 0, max: 10, step: 0.1 },
        MAX_STEERING: { value: 0.1, min: 0, max: 1, step: 0.01 },
      },
      { collapsed: true }
    );
  const { threeD, ALIGNEMENT, AVOIDANCE, COHESION } = useControls(
    "Boid Rules",
    {
      threeD: { value: true },

    },
    { collapsed: true }
  );
  const boids = useMemo(() => {
    return new Array(NB_BOIDS).fill().map((_, i) => ({
      model: THEMES[theme].models[randInt(0, THEMES[theme].models.length - 1)],
      position: new Vector3(
        randFloat(-boundaries.x / 2, boundaries.x / 2),
        randFloat(-boundaries.y / 2, boundaries.y / 2),
        threeD ? randFloat(-boundaries.z / 2, boundaries.z / 2) : 0
      ),
      velocity: new Vector3(0, 0, 0),
      wander: randFloat(0, Math.PI * 2),
      scale: randFloat(MIN_SCALE, MAX_SCALE),
    }));
  }, [NB_BOIDS, boundaries, theme, MIN_SCALE, MAX_SCALE, threeD]);
  const { WANDER_RADIUS, WANDER_STRENGTH, WANDER_CIRCLE } = useControls(
    "Wander",
    {
      WANDER_CIRCLE: false,
      WANDER_RADIUS: { value: 5, min: 1, max: 10, step: 1 },
      WANDER_STRENGTH: { value: 2, min: 0, max: 10, step: 1 },
    },
    { collapsed: true }
  );
  useFrame((_, delta) => {
    for (let i = 0; i < boids.length; i++) {
      const boid = boids[i];

      // WANDER
      boid.wander += randFloat(-0.05, 0.05);

      wander.set(
        Math.cos(boid.wander) * WANDER_RADIUS,
        Math.sin(boid.wander) * WANDER_RADIUS,
        0
      );

      wander.normalize();
      wander.multiplyScalar(WANDER_STRENGTH);
      horizontalWander.set(
        Math.cos(boid.wander) * WANDER_RADIUS,
        0,
        Math.sin(boid.wander) * WANDER_RADIUS
      );

      horizontalWander.normalize();
      horizontalWander.multiplyScalar(WANDER_STRENGTH);
      //limites
      if (Math.abs(boid.position.x) + 1 > boundaries.x / 2) {
        limits.x = -boid.position.x;
        boid.wander += Math.PI;
      }
      if (Math.abs(boid.position.y) + 1 > boundaries.y / 2) {
        limits.y = -boid.position.y;
        boid.wander += Math.PI;
      }
      if (Math.abs(boid.position.z) + 1 > boundaries.z / 2) {
        limits.z = -boid.position.z;
        boid.wander += Math.PI;
      }
      limits.normalize();
      limits.multiplyScalar(50);
      //forces
      steering.add(limits);
      steering.add(wander);

      steering.clampLength(0, MAX_STEERING * delta);
      boid.velocity.add(steering);
      boid.velocity.clampLength(
        0,
        MAX_SPEED * delta
      );

      // APPLY VELOCITY
      boid.position.add(boid.velocity);
    } 
  });
  return boids.map((boid, index) => (
    <Boid
      key={index + boid.model}
      position={boid.position}
      model={boid.model}
      scale={boid.scale}
      velocity={boid.velocity}
      animation={"Fish_Armature|Swimming_Fast"}
      wanderCircle={WANDER_CIRCLE}
      wanderRadius={WANDER_RADIUS / boid.scale}

    />
  ));

};

const Boid = ({ position, model,  velocity,animation, wanderCircle,
  wanderRadius, ...props }) => {
  const { scene, animations } = useGLTF(`/models/${model}.glb`);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const group = useRef();
  const { actions } = useAnimations(animations, group);
  useEffect(() => {
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
  }, []);

  useEffect(() => {
    actions[animation]?.play();
    return () => {
      actions[animation]?.stop();
    };
  }, [animation]);
  useFrame(() => {
    const target = group.current.clone(true);
    target.lookAt(group.current.position.clone().add(velocity));
    group.current.quaternion.slerp(target.quaternion, 0.1);

    group.current.position.copy(position);
  });
  return (
    <group {...props} ref={group} position={position}>
      <primitive object={clone} rotation-y={Math.PI / 2} />
      <mesh visible={wanderCircle}>
        <sphereGeometry args={[wanderRadius, 32]} />
        <meshBasicMaterial color={"red"} wireframe />
      </mesh>
    </group>
  );
};
