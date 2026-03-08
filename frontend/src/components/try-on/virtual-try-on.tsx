"use client";

import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import type { GlassesModel } from "@/types/api";

interface VirtualTryOnProps {
  model: GlassesModel | null;
}

type Landmark = { x: number; y: number; z: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const FIT = {
  baseDepth: -1.34,
  xFactor: 0.76,
  yFactor: 0.86,
  scaleFactor: 5.35,
  minScale: 0.32,
  maxScale: 1.45,
  smoothing: 0.16,
};

export default function VirtualTryOn({ model }: VirtualTryOnProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!model?.glb_file_url) return;

    const rawVideoNode = videoRef.current;
    const rawStageNode = stageRef.current;
    if (!rawVideoNode || !rawStageNode) return;

    const videoNode: HTMLVideoElement = rawVideoNode;
    const stageNode: HTMLDivElement = rawStageNode;
    const calibration = model;

    const xnnpackLog = "Created TensorFlow Lite XNNPACK delegate for CPU";
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const first = args[0];
      if (typeof first === "string" && first.includes(xnnpackLog)) {
        return;
      }
      originalConsoleError(...args);
    };

    let active = true;
    let stream: MediaStream | null = null;
    let faceLandmarker: FaceLandmarker | null = null;
    let glasses: THREE.Object3D | null = null;
    let frameId = 0;
    let lastVideoTime = -1;
    let missingFrames = 0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.01, 100);
    camera.position.set(0, 0, 2.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    stageNode.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(1.5, 1.2, 1.5);
    scene.add(keyLight);

    const targetPosition = new THREE.Vector3(0, 0, -1.2);
    const currentScale = new THREE.Vector3(1, 1, 1);
    const targetScale = new THREE.Vector3(1, 1, 1);
    const targetRotation = new THREE.Euler(0, 0, 0);

    const loader = new GLTFLoader();

    function resize() {
      const node = stageRef.current;
      if (!node) return;

      const width = node.clientWidth;
      const height = node.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function applyLandmarks(landmarks: Landmark[]) {
      if (!glasses) return;

      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const leftTemple = landmarks[234];
      const rightTemple = landmarks[454];
      const noseTip = landmarks[1];
      const noseBridge = landmarks[168];

      if (!leftEye || !rightEye || !leftTemple || !rightTemple || !noseTip || !noseBridge) {
        return;
      }

      const eyeDx = rightEye.x - leftEye.x;
      const eyeDy = rightEye.y - leftEye.y;
      const eyeDistance = Math.hypot(eyeDx, eyeDy);

      const templeDx = rightTemple.x - leftTemple.x;
      const templeDy = rightTemple.y - leftTemple.y;
      const frameWidth = Math.hypot(templeDx, templeDy);

      const eyeCenterY = (leftEye.y + rightEye.y) / 2;
      const templeCenterX = (leftTemple.x + rightTemple.x) / 2;
      const templeCenterY = (leftTemple.y + rightTemple.y) / 2;

      const roll = Math.atan2(eyeDy, eyeDx);
      const yaw = clamp((rightEye.z - leftEye.z) * 6.2, -0.55, 0.55);
      const pitch = clamp((noseTip.y - eyeCenterY) * 2.8, -0.32, 0.32);

      const xNorm = (templeCenterX - 0.5) * 2;
      const yAnchor = eyeCenterY * 0.7 + templeCenterY * 0.3;
      const yNorm = (0.5 - yAnchor) * 2;

      const widthForScale = Math.max(frameWidth, eyeDistance);
      const sceneScale = clamp(
        widthForScale * FIT.scaleFactor * calibration.scale,
        FIT.minScale,
        FIT.maxScale
      );

      targetPosition.set(
        xNorm * camera.aspect * FIT.xFactor + calibration.position_x,
        yNorm * FIT.yFactor + calibration.position_y,
        FIT.baseDepth + calibration.position_z
      );

      targetScale.setScalar(sceneScale);
      targetRotation.set(
        calibration.rotation_x + pitch,
        calibration.rotation_y + yaw,
        -roll + calibration.rotation_z
      );

      glasses.visible = true;
      missingFrames = 0;
    }

    function renderLoop() {
      if (!active) return;

      if (faceLandmarker && videoNode.readyState >= 2 && videoNode.currentTime !== lastVideoTime) {
        lastVideoTime = videoNode.currentTime;

        try {
          const result = faceLandmarker.detectForVideo(videoNode, performance.now());
          const landmarks = result.faceLandmarks?.[0] as Landmark[] | undefined;

          if (landmarks && landmarks.length > 0) {
            applyLandmarks(landmarks);
          } else {
            missingFrames += 1;
          }
        } catch {
          missingFrames += 1;
        }
      }

      if (glasses) {
        if (missingFrames > 10) {
          glasses.visible = false;
        }

        if (glasses.visible) {
          glasses.position.lerp(targetPosition, FIT.smoothing);
          currentScale.lerp(targetScale, FIT.smoothing);
          glasses.scale.copy(currentScale);
          glasses.rotation.x += (targetRotation.x - glasses.rotation.x) * FIT.smoothing;
          glasses.rotation.y += (targetRotation.y - glasses.rotation.y) * FIT.smoothing;
          glasses.rotation.z += (targetRotation.z - glasses.rotation.z) * FIT.smoothing;
        }
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderLoop);
    }

    async function initFaceLandmarker() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.6,
        minFacePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
    }

    async function start() {
      setError(null);

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        setError("Camera permission blocked or camera not available.");
        return;
      }

      if (!active) return;

      try {
        videoNode.srcObject = stream;
        await videoNode.play();
      } catch {
        setError("Could not start camera preview.");
        return;
      }

      if (!active) return;

      try {
        faceLandmarker = await initFaceLandmarker();
      } catch {
        setError("Could not initialize face tracking. Check internet and retry.");
        return;
      }

      if (!active) return;

      loader.load(
        calibration.glb_file_url,
        (gltf) => {
          if (!active) return;
          glasses = gltf.scene;
          glasses.visible = false;
          glasses.scale.setScalar(calibration.scale || 1);
          scene.add(glasses);
        },
        undefined,
        () => {
          setError("Could not load product GLB model. Check /public/models path.");
        }
      );

      resize();
      window.addEventListener("resize", resize);
      renderLoop();
    }

    start();

    return () => {
      active = false;
      console.error = originalConsoleError;
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frameId);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      faceLandmarker?.close();
      renderer.dispose();

      if (renderer.domElement.parentElement === stageNode) {
        stageNode.removeChild(renderer.domElement);
      }
    };
  }, [model]);

  if (!model?.glb_file_url) {
    return <p className="text-sm text-rose-300">This product does not have a try-on model.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video min-h-[320px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div ref={stageRef} className="pointer-events-none absolute inset-0" />
      </div>
      <p className="text-xs text-slate-300">Keep your full face centered and well lit for best tracking.</p>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
