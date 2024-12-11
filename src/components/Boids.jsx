import { useAnimations, useGLTF } from "@react-three/drei";

import { useAtom } from "jotai";
import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";
import { SkeletonUtils } from "three-stdlib";
import { themeAtom, THEMES } from "./UI";
import { useControls } from "leva";

export const Boids = ({}) => {
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
  return (
    <>
      <Boid
        position={new Vector3(0, 0, 0)}
        model={THEMES[theme].models[0]}
        animation={"Fish_Armature|Swimming_Fast"}
      />
    </>
  );
};

const Boid = ({ position, model, animation, ...props }) => {
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

  return (
    <group {...props} ref={group} position={position}>
      <primitive object={clone} rotation-y={Math.PI / 2} />
    </group>
  );
};
