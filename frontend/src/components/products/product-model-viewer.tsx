"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { GlassesModel } from "@/types/api";

interface ProductModelViewerProps {
  model: GlassesModel | null;
  productId?: number;
}

export default function ProductModelViewer({ model, productId }: ProductModelViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !model?.glb_file_url) {
      return;
    }

    let frameId = 0;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f7efe7");

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = "grab";

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.01, 100);
    camera.position.set(0, 0.1, 1.8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.5;
    controls.maxDistance = 3;

    scene.add(new THREE.AmbientLight(0xffffff, 1.35));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(2, 2, 2);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xe9d6c8, 0.9);
    rimLight.position.set(-2, 1.5, -2);
    scene.add(rimLight);

    const loader = new GLTFLoader();
    let loadedModel: THREE.Object3D | null = null;

    const onPointerDown = () => {
      setIsDragging(true);
      renderer.domElement.style.cursor = "grabbing";
    };

    const onPointerUp = () => {
      setIsDragging(false);
      renderer.domElement.style.cursor = "grab";
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);

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
      window.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.cancelAnimationFrame(frameId);
      setIsDragging(false);
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
      <div className="flex h-[420px] items-center justify-center rounded-3xl bg-white text-[#7b6f68] shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
        3D model unavailable for this product.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-[rgba(255,255,255,0.75)] px-3 py-1.5 text-xs text-[#3f352f] shadow-[0_6px_18px_rgba(46,31,22,0.14)] backdrop-blur-sm">
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.7} />
          <span className="[font-family:Inter,sans-serif]">Drag to rotate</span>
        </div>
        {productId ? (
          <Link
            href={`/try-on/${productId}`}
            className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#a95a3b] bg-[#C4714F] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(196,113,79,0.42)] transition hover:-translate-x-1/2 hover:-translate-y-0.5 hover:bg-[#B96543] focus:outline-none focus:ring-2 focus:ring-[#f3c9b5] focus:ring-offset-2"
          >
            Try On Your Face
          </Link>
        ) : null}
        <div
          ref={mountRef}
          className={`h-[420px] overflow-hidden rounded-3xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        />
      </div>
      {error ? <p className="text-sm text-[#a26143]">{error}</p> : null}
    </div>
  );
}
