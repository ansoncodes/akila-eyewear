"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { GlassesModel } from "@/types/api";

interface ProductModelViewerProps {
  model: GlassesModel | null;
}

export default function ProductModelViewer({ model }: ProductModelViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !model?.glb_file_url) {
      return;
    }

    let frameId = 0;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#020617");

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.01, 100);
    camera.position.set(0, 0.1, 1.8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.5;
    controls.maxDistance = 3;

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(2, 2, 2);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.0);
    rimLight.position.set(-2, 1.5, -2);
    scene.add(rimLight);

    const loader = new GLTFLoader();
    let loadedModel: THREE.Object3D | null = null;

    loader.load(
      model.glb_file_url,
      (gltf) => {
        loadedModel = gltf.scene;
        loadedModel.scale.setScalar(model.scale || 1);
        loadedModel.position.set(model.position_x, model.position_y, model.position_z);
        loadedModel.rotation.set(model.rotation_x, model.rotation_y, model.rotation_z);
        scene.add(loadedModel);
      },
      undefined,
      () => {
        setError("Unable to load 3D model.");
      }
    );

    const onResize = () => {
      if (!mount) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", onResize);

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(frameId);
      controls.dispose();
      if (loadedModel) {
        scene.remove(loadedModel);
      }
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [model]);

  if (!model?.glb_file_url) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300">
        3D model unavailable for this product.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={mountRef} className="h-[420px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900" />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
