"use client";

import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import type { GlassesModel } from "@/types/api";

interface VirtualTryOnProps {
  model: GlassesModel | null;
}

export default function VirtualTryOn({ model }: VirtualTryOnProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!model?.glb_file_url) return;
    const calibration = model;

    const videoEl = videoRef.current;
    const stageEl = stageRef.current;
    if (!videoEl || !stageEl) return;
    const videoElement: HTMLVideoElement = videoEl;
    const stageElement: HTMLDivElement = stageEl;

    let stream: MediaStream | null = null;
    let frameId = 0;
    let stopped = false;
    let faceLandmarker: FaceLandmarker | null = null;
    let lastVideoTime = -1;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    stageElement.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.01, 100);
    camera.position.set(0, 0, 2.2);

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(1.5, 1.2, 1.5);
    scene.add(keyLight);

    const loader = new GLTFLoader();
    let glasses: THREE.Object3D | null = null;

    const targetPosition = new THREE.Vector3(0, 0, -1.2);
    const currentScale = new THREE.Vector3(1, 1, 1);
    const targetScale = new THREE.Vector3(1, 1, 1);
    const targetRotation = new THREE.Euler(0, 0, 0);

    loader.load(
      model.glb_file_url,
      (gltf) => {
        glasses = gltf.scene;
        glasses.visible = false;
        glasses.scale.setScalar(model.scale || 1);
        scene.add(glasses);
      },
      undefined,
      () => setError("Unable to load try-on model.")
    );

    function resizeStage() {
      const currentStage = stageRef.current;
      if (!currentStage) return;

      const width = currentStage.clientWidth;
      const height = currentStage.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    async function setupFaceLandmarker() {
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
      });
    }

    function applyLandmarks(landmarks: Array<{ x: number; y: number }>) {
      if (!glasses) return;

      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const noseBridge = landmarks[168];
      if (!leftEye || !rightEye || !noseBridge) {
        glasses.visible = false;
        return;
      }

      glasses.visible = true;

      const eyeDx = rightEye.x - leftEye.x;
      const eyeDy = rightEye.y - leftEye.y;
      const eyeDistance = Math.sqrt(eyeDx * eyeDx + eyeDy * eyeDy);
      const roll = Math.atan2(eyeDy, eyeDx);

      const scale = Math.max(0.5, eyeDistance * 5.6 * calibration.scale);

      targetPosition.set(
        (0.5 - noseBridge.x) * 2 + calibration.position_x,
        (0.5 - noseBridge.y) * 1.6 + calibration.position_y,
        -1.15 + calibration.position_z
      );

      targetScale.setScalar(scale);
      targetRotation.set(calibration.rotation_x, calibration.rotation_y, -roll + calibration.rotation_z);
    }

    async function renderLoop() {
      if (stopped) return;

      if (videoElement.readyState >= 2 && faceLandmarker && videoElement.currentTime !== lastVideoTime) {
        lastVideoTime = videoElement.currentTime;
        const result = faceLandmarker.detectForVideo(videoElement, performance.now());
        const landmarks = result.faceLandmarks?.[0];

        if (landmarks && landmarks.length > 0) {
          applyLandmarks(landmarks as Array<{ x: number; y: number }>);
        } else if (glasses) {
          glasses.visible = false;
        }
      }

      if (glasses && glasses.visible) {
        glasses.position.lerp(targetPosition, 0.22);
        currentScale.lerp(targetScale, 0.22);
        glasses.scale.copy(currentScale);
        glasses.rotation.x += (targetRotation.x - glasses.rotation.x) * 0.22;
        glasses.rotation.y += (targetRotation.y - glasses.rotation.y) * 0.22;
        glasses.rotation.z += (targetRotation.z - glasses.rotation.z) * 0.22;
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderLoop);
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        videoElement.srcObject = stream;
        await videoElement.play();
        await setupFaceLandmarker();

        resizeStage();
        window.addEventListener("resize", resizeStage);
        renderLoop();
      } catch {
        setError("Camera access denied or unavailable.");
      }
    }

    start();

    return () => {
      stopped = true;
      window.removeEventListener("resize", resizeStage);
      window.cancelAnimationFrame(frameId);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      faceLandmarker?.close();
      renderer.dispose();

      if (renderer.domElement.parentElement === stageElement) {
        stageElement.removeChild(renderer.domElement);
      }
    };
  }, [model]);

  if (!model?.glb_file_url) {
    return <p className="text-sm text-rose-300">This product does not have a try-on model.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        <div ref={stageRef} className="pointer-events-none absolute inset-0" />
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
