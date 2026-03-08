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

interface DebugMetrics {
  templeDistance: number;
  baselineTempleDistance: number;
  scaleRatio: number;
  scale: number;
  yaw: number;
  holdFrames: number;
  tracking: "tracking" | "frozen";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, alpha: number) {
  return start + (end - start) * alpha;
}

function mapVideoToNdc(
  x: number,
  y: number,
  stageWidth: number,
  stageHeight: number,
  videoWidth: number,
  videoHeight: number
) {
  const safeStageWidth = Math.max(stageWidth, 1);
  const safeStageHeight = Math.max(stageHeight, 1);
  const safeVideoWidth = Math.max(videoWidth, 1);
  const safeVideoHeight = Math.max(videoHeight, 1);

  const stageAspect = safeStageWidth / safeStageHeight;
  const videoAspect = safeVideoWidth / safeVideoHeight;

  let renderWidth = safeStageWidth;
  let renderHeight = safeStageHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (videoAspect > stageAspect) {
    renderWidth = safeStageWidth;
    renderHeight = safeStageWidth / videoAspect;
    offsetY = (safeStageHeight - renderHeight) * 0.5;
  } else {
    renderHeight = safeStageHeight;
    renderWidth = safeStageHeight * videoAspect;
    offsetX = (safeStageWidth - renderWidth) * 0.5;
  }

  return {
    x: ((offsetX + clamp(x, 0, 1) * renderWidth) / safeStageWidth) * 2 - 1,
    y: 1 - ((offsetY + clamp(y, 0, 1) * renderHeight) / safeStageHeight) * 2,
  };
}

const FIT = {
  baseDepth: -1.18,
  xFactor: 1,
  yFactor: 1,
  minScale: 1.1,
  maxScale: 3.6,
  poseSmoothing: 0.2,
  positionSmoothing: 0.24,
  rotationSmoothing: 0.18,
  scaleSmoothing: 0.46,
  measurementSmoothing: 0.35,
  baselineSmoothing: 0.016,
  frontalYawThreshold: 0.22,
  frontalRollThreshold: 0.28,
  distanceScaleStrength: 1.3,
  distanceScaleMin: 0.7,
  distanceScaleMax: 1.9,
  yawDepthFactor: 0.34,
  yawRotationFactor: 1.28,
  yawTuckXFactor: 0.07,
  yawTuckZFactor: 0.12,
  modelTargetWidth: 0.3,
  templeScaleFactor: 9.2,
  globalScaleBoost: 1.28,
  eyeToFaceWidthFactor: 3.1,
  proximityReferenceWidth: 0.18,
  depthFaceCompensation: 0.06,
  downShift: 0.02,
  maxScaleJump: 0.9,
  confidenceHoldFrames: 6,
  lostTrackingFrames: 16,
  occluderWidthFactor: 0.96,
  occluderHeightFactor: 1.06,
  occluderDepthFactor: 0.42,
  occluderYOffset: 0.008,
  occluderZOffset: -0.035,
  debugUpdateMs: 80,
};

export default function VirtualTryOn({ model }: VirtualTryOnProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugMetrics, setDebugMetrics] = useState<DebugMetrics | null>(null);
  const debugEnabledRef = useRef(debugEnabled);

  useEffect(() => {
    debugEnabledRef.current = debugEnabled;
    if (!debugEnabled) {
      setDebugMetrics(null);
    }
  }, [debugEnabled]);

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
    let glassesPivot: THREE.Group | null = null;
    let faceOccluder: THREE.Mesh | null = null;
    let frameId = 0;
    let lastVideoTime = -1;
    let missingFrames = 0;
    let confidenceHoldFrames = 0;
    let lastDebugAt = 0;
    let hasStablePose = false;

    let stableXNorm = 0;
    let stableYNorm = 0;
    let stableDepth = FIT.baseDepth;
    let stableScale = 1;
    let stableYaw = 0;
    let stablePitch = 0;
    let stableRoll = 0;

    let smoothedTempleDistance = 0;
    let smoothedEyeDistance = 0;
    let smoothedSideDistance = 0;
    let smoothedCheekDistance = 0;
    let smoothedFaceHeightDistance = 0;
    let baselineTempleDistance = 0;
    let lastYawRaw = 0;
    let lastRollRaw = 0;
    let modelWrapCompensation = 1;
    let modelVerticalCompensation = 0;

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

    const calibrationScale =
      calibration.calibration_source === "manual" ? clamp(calibration.scale || 1, 0.9, 1.2) : 1;
    const calibrationX = clamp(calibration.position_x, -0.08, 0.08);
    const calibrationY =
      calibration.calibration_source === "manual" ? clamp(calibration.position_y, -0.05, 0.06) : 0;
    const calibrationZ =
      calibration.calibration_source === "manual" ? clamp(calibration.position_z, -0.09, 0.06) : 0;
    const calibrationRotX = clamp(calibration.rotation_x, -0.45, 0.45);
    const calibrationRotY = clamp(calibration.rotation_y, -0.45, 0.45);
    const calibrationRotZ = clamp(calibration.rotation_z, -0.45, 0.45);

    const targetPosition = new THREE.Vector3(0, 0, FIT.baseDepth);
    const currentScale = new THREE.Vector3(1, 1, 1);
    const targetScale = new THREE.Vector3(1, 1, 1);
    const targetEuler = new THREE.Euler(0, 0, 0, "XYZ");
    const targetQuaternion = new THREE.Quaternion();
    const currentQuaternion = new THREE.Quaternion();

    const targetOccluderScale = new THREE.Vector3(1, 1, 1);
    const currentOccluderScale = new THREE.Vector3(1, 1, 1);
    const targetOccluderPosition = new THREE.Vector3(0, 0, FIT.baseDepth);
    const currentOccluderPosition = new THREE.Vector3(0, 0, FIT.baseDepth);
    const targetOccluderQuaternion = new THREE.Quaternion();
    const currentOccluderQuaternion = new THREE.Quaternion();

    const ndcPoint = new THREE.Vector3();
    const worldDirection = new THREE.Vector3();
    const worldTarget = new THREE.Vector3();

    const occluderGeometry = new THREE.SphereGeometry(1, 28, 18);
    const occluderMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
    });
    occluderMaterial.colorWrite = false;
    occluderMaterial.depthWrite = true;
    occluderMaterial.depthTest = true;
    faceOccluder = new THREE.Mesh(occluderGeometry, occluderMaterial);
    faceOccluder.visible = false;
    faceOccluder.renderOrder = 0;
    scene.add(faceOccluder);

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

    function freezePose(frames: number) {
      confidenceHoldFrames = Math.max(confidenceHoldFrames, frames);
    }

    function updateDebug(now: number, partial: DebugMetrics) {
      if (!debugEnabledRef.current) return;
      if (now - lastDebugAt < FIT.debugUpdateMs) return;
      lastDebugAt = now;
      setDebugMetrics(partial);
    }

    function resetTrackingState() {
      hasStablePose = false;
      smoothedTempleDistance = 0;
      smoothedEyeDistance = 0;
      smoothedSideDistance = 0;
      smoothedCheekDistance = 0;
      smoothedFaceHeightDistance = 0;
      baselineTempleDistance = 0;
      confidenceHoldFrames = 0;
    }

    function applyLandmarks(landmarks: Landmark[], now: number) {
      if (!glassesPivot) return;

      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const noseBridge = landmarks[168];
      const noseTip = landmarks[1];
      const leftTemple = landmarks[234];
      const rightTemple = landmarks[454];
      const leftFaceSide = landmarks[127];
      const rightFaceSide = landmarks[356];
      const leftCheek = landmarks[93];
      const rightCheek = landmarks[323];
      const forehead = landmarks[10];
      const chin = landmarks[152];

      if (
        !leftEye ||
        !rightEye ||
        !noseBridge ||
        !noseTip ||
        !leftTemple ||
        !rightTemple ||
        !leftFaceSide ||
        !rightFaceSide ||
        !leftCheek ||
        !rightCheek ||
        !forehead ||
        !chin
      ) {
        freezePose(FIT.confidenceHoldFrames);
        missingFrames += 1;
        return;
      }

      const eyeDx = rightEye.x - leftEye.x;
      const eyeDy = rightEye.y - leftEye.y;
      const eyeDistance = Math.hypot(eyeDx, eyeDy);

      const templeDx = rightTemple.x - leftTemple.x;
      const templeDy = rightTemple.y - leftTemple.y;
      const templeDistance = Math.hypot(templeDx, templeDy);

      const sideDx = rightFaceSide.x - leftFaceSide.x;
      const sideDy = rightFaceSide.y - leftFaceSide.y;
      const sideDistance = Math.hypot(sideDx, sideDy);

      const cheekDx = rightCheek.x - leftCheek.x;
      const cheekDy = rightCheek.y - leftCheek.y;
      const cheekDistance = Math.hypot(cheekDx, cheekDy);

      const faceHeightDistance = Math.hypot(forehead.x - chin.x, forehead.y - chin.y);

      if (
        !Number.isFinite(eyeDistance) ||
        !Number.isFinite(templeDistance) ||
        !Number.isFinite(sideDistance) ||
        !Number.isFinite(cheekDistance) ||
        !Number.isFinite(faceHeightDistance) ||
        eyeDistance < 0.03 ||
        eyeDistance > 0.3 ||
        templeDistance < 0.05 ||
        templeDistance > 0.5 ||
        sideDistance < 0.08 ||
        sideDistance > 0.65 ||
        cheekDistance < 0.08 ||
        cheekDistance > 0.65 ||
        faceHeightDistance < 0.12 ||
        faceHeightDistance > 0.9 ||
        leftTemple.x >= rightTemple.x
      ) {
        freezePose(FIT.confidenceHoldFrames);
        missingFrames += 1;
        return;
      }

      const eyeCenterX = (leftEye.x + rightEye.x) * 0.5;
      const eyeCenterY = (leftEye.y + rightEye.y) * 0.5;
      const eyeCenterZ = (leftEye.z + rightEye.z) * 0.5;
      const templeCenterX = (leftTemple.x + rightTemple.x) * 0.5;

      const noseDeltaX = noseBridge.x - eyeCenterX;
      const noseDeltaY = noseBridge.y - eyeCenterY;
      const noseDeltaZ = noseBridge.z - eyeCenterZ;

      const rollRaw = Math.atan2(eyeDy, eyeDx);
      const yawFromNose = clamp(noseDeltaX * 7, -0.72, 0.72);
      const yawFromDepth = clamp((rightEye.z - leftEye.z) * 5.2, -0.55, 0.55);
      const yawFromTempleDepth = clamp((rightTemple.z - leftTemple.z) * 6, -0.68, 0.68);
      const yawRaw = yawFromNose * 0.45 + yawFromDepth * 0.2 + yawFromTempleDepth * 0.35;

      const pitchFromTriangle = clamp(-noseDeltaY * 5, -0.42, 0.42);
      const pitchFromDepth = clamp(-noseDeltaZ * 3.4, -0.28, 0.28);
      const pitchRaw = pitchFromTriangle * 0.75 + pitchFromDepth * 0.25;

      if (Math.abs(yawRaw) > 0.95 || Math.abs(rollRaw) > 1.2 || !Number.isFinite(pitchRaw)) {
        freezePose(FIT.confidenceHoldFrames);
        missingFrames += 1;
        return;
      }

      if (smoothedTempleDistance > 0) {
        const jump = templeDistance / Math.max(smoothedTempleDistance, 1e-4);
        const yawJump = Math.abs(yawRaw - lastYawRaw);
        const rollJump = Math.abs(rollRaw - lastRollRaw);
        if (jump < 0.76 || jump > 1.28 || yawJump > 0.45 || rollJump > 0.5) {
          freezePose(FIT.confidenceHoldFrames);
          missingFrames += 1;
          updateDebug(now, {
            templeDistance: smoothedTempleDistance,
            baselineTempleDistance: baselineTempleDistance || smoothedTempleDistance,
            scaleRatio: 1,
            scale: stableScale,
            yaw: stableYaw,
            holdFrames: confidenceHoldFrames,
            tracking: "frozen",
          });
          return;
        }
      }

      lastYawRaw = yawRaw;
      lastRollRaw = rollRaw;

      if (!smoothedTempleDistance) {
        smoothedTempleDistance = templeDistance;
        smoothedEyeDistance = eyeDistance;
        smoothedSideDistance = sideDistance;
        smoothedCheekDistance = cheekDistance;
        smoothedFaceHeightDistance = faceHeightDistance;
      } else {
        smoothedTempleDistance = lerp(smoothedTempleDistance, templeDistance, FIT.measurementSmoothing);
        smoothedEyeDistance = lerp(smoothedEyeDistance, eyeDistance, FIT.measurementSmoothing);
        smoothedSideDistance = lerp(smoothedSideDistance, sideDistance, FIT.measurementSmoothing);
        smoothedCheekDistance = lerp(smoothedCheekDistance, cheekDistance, FIT.measurementSmoothing);
        smoothedFaceHeightDistance = lerp(
          smoothedFaceHeightDistance,
          faceHeightDistance,
          FIT.measurementSmoothing
        );
      }

      if (!baselineTempleDistance) {
        baselineTempleDistance = smoothedTempleDistance;
      }
      if (
        Math.abs(yawRaw) < FIT.frontalYawThreshold &&
        Math.abs(rollRaw) < FIT.frontalRollThreshold
      ) {
        baselineTempleDistance = lerp(
          baselineTempleDistance,
          smoothedTempleDistance,
          FIT.baselineSmoothing
        );
      }

      const yawWidthCompensation = 1 / clamp(Math.cos(Math.abs(yawRaw)), 0.65, 1);
      const compensatedTempleDistance = smoothedTempleDistance * clamp(yawWidthCompensation, 1, 1.35);
      const distanceScaleRatio = clamp(
        compensatedTempleDistance / Math.max(baselineTempleDistance, 1e-4),
        FIT.distanceScaleMin,
        FIT.distanceScaleMax
      );
      const distanceScaleMultiplier = Math.pow(distanceScaleRatio, FIT.distanceScaleStrength);

      const faceWidthFromEye = smoothedEyeDistance * FIT.eyeToFaceWidthFactor;
      const faceWidth = Math.max(
        smoothedTempleDistance * 1.05,
        smoothedSideDistance * 0.95,
        smoothedCheekDistance * 0.98,
        faceWidthFromEye * 0.92
      );
      const clampedFaceWidth = clamp(faceWidth, faceWidthFromEye * 0.95, faceWidthFromEye * 1.9);

      const anchorXNorm = eyeCenterX * 0.7 + templeCenterX * 0.2 + noseBridge.x * 0.1;
      const anchorYNorm = eyeCenterY * 0.84 + noseBridge.y * 0.16;

      const mappedAnchor = mapVideoToNdc(
        anchorXNorm,
        anchorYNorm,
        stageNode.clientWidth,
        stageNode.clientHeight,
        videoNode.videoWidth || stageNode.clientWidth,
        videoNode.videoHeight || stageNode.clientHeight
      );

      const depthFromFaceSize = clamp(
        (clampedFaceWidth - FIT.proximityReferenceWidth) * FIT.depthFaceCompensation,
        -0.01,
        0.02
      );
      const depthRaw = FIT.baseDepth + calibrationZ - Math.abs(yawRaw) * FIT.yawDepthFactor + depthFromFaceSize;

      const baselineScale =
        baselineTempleDistance *
        FIT.templeScaleFactor *
        calibrationScale *
        modelWrapCompensation *
        FIT.globalScaleBoost;
      let scaleRaw = clamp(baselineScale * distanceScaleMultiplier, FIT.minScale, FIT.maxScale);
      const minimumFaceWrapScale = clamp(
        compensatedTempleDistance *
          FIT.templeScaleFactor *
          calibrationScale *
          modelWrapCompensation *
          FIT.globalScaleBoost *
          distanceScaleMultiplier *
          0.92,
        FIT.minScale,
        FIT.maxScale
      );
      scaleRaw = Math.max(scaleRaw, minimumFaceWrapScale);

      if (hasStablePose) {
        scaleRaw = clamp(scaleRaw, stableScale - FIT.maxScaleJump, stableScale + FIT.maxScaleJump);
      }

      if (!hasStablePose) {
        stableXNorm = mappedAnchor.x;
        stableYNorm = mappedAnchor.y;
        stableDepth = depthRaw;
        stableScale = scaleRaw;
        stableYaw = yawRaw;
        stablePitch = pitchRaw;
        stableRoll = rollRaw;
        hasStablePose = true;
      } else {
        stableXNorm = lerp(stableXNorm, mappedAnchor.x, FIT.poseSmoothing);
        stableYNorm = lerp(stableYNorm, mappedAnchor.y, FIT.poseSmoothing);
        stableDepth = lerp(stableDepth, depthRaw, FIT.poseSmoothing);
        stableScale = lerp(stableScale, scaleRaw, FIT.poseSmoothing);
        stableYaw = lerp(stableYaw, yawRaw, FIT.poseSmoothing);
        stablePitch = lerp(stablePitch, pitchRaw, FIT.poseSmoothing);
        stableRoll = lerp(stableRoll, rollRaw, FIT.poseSmoothing);
      }

      const adjustedAnchorX = clamp(
        stableXNorm * FIT.xFactor + calibrationX * 1.6 + stableYaw * FIT.yawTuckXFactor,
        -1,
        1
      );
      const adjustedAnchorY = clamp(
        stableYNorm * FIT.yFactor + calibrationY * 0.5 - FIT.downShift + modelVerticalCompensation * 0.6,
        -1,
        1
      );

      ndcPoint.set(adjustedAnchorX, adjustedAnchorY, 0.5).unproject(camera);
      worldDirection.copy(ndcPoint).sub(camera.position).normalize();

      const safeDirectionZ = Math.abs(worldDirection.z) < 1e-4 ? -1e-4 : worldDirection.z;
      const depthWithYawTuck = stableDepth - Math.abs(stableYaw) * FIT.yawTuckZFactor;
      const distance = (depthWithYawTuck - camera.position.z) / safeDirectionZ;

      worldTarget.copy(camera.position).add(worldDirection.multiplyScalar(distance));
      targetPosition.copy(worldTarget);
      targetScale.setScalar(stableScale);

      targetEuler.set(
        calibrationRotX + stablePitch,
        calibrationRotY + stableYaw * FIT.yawRotationFactor,
        calibrationRotZ - stableRoll
      );
      targetQuaternion.setFromEuler(targetEuler);

      const projectionHeight =
        2 * Math.abs(depthWithYawTuck) * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
      const projectionWidth = projectionHeight * camera.aspect;

      const occluderWidthWorld = clamp(
        clampedFaceWidth * projectionWidth * FIT.occluderWidthFactor,
        0.18,
        0.62
      );
      const occluderHeightWorld = clamp(
        smoothedFaceHeightDistance * projectionHeight * FIT.occluderHeightFactor,
        0.24,
        0.76
      );
      const occluderDepthWorld = clamp(occluderWidthWorld * FIT.occluderDepthFactor, 0.08, 0.26);

      targetOccluderScale.set(
        occluderWidthWorld * 0.5,
        occluderHeightWorld * 0.5,
        occluderDepthWorld * 0.5
      );
      targetOccluderPosition.copy(targetPosition);
      targetOccluderPosition.y += FIT.occluderYOffset;
      targetOccluderPosition.z += FIT.occluderZOffset;
      targetOccluderQuaternion.copy(targetQuaternion);

      if (faceOccluder) {
        faceOccluder.visible = true;
      }

      glassesPivot.visible = true;
      missingFrames = 0;

      updateDebug(now, {
        templeDistance: smoothedTempleDistance,
        baselineTempleDistance,
        scaleRatio: distanceScaleRatio,
        scale: stableScale,
        yaw: stableYaw,
        holdFrames: confidenceHoldFrames,
        tracking: confidenceHoldFrames > 0 ? "frozen" : "tracking",
      });
    }

    function renderLoop() {
      if (!active) return;

      if (faceLandmarker && videoNode.readyState >= 2 && videoNode.currentTime !== lastVideoTime) {
        lastVideoTime = videoNode.currentTime;

        try {
          const result = faceLandmarker.detectForVideo(videoNode, performance.now());
          const landmarks = result.faceLandmarks?.[0] as Landmark[] | undefined;

          if (landmarks && landmarks.length > 0) {
            if (confidenceHoldFrames > 0) {
              confidenceHoldFrames -= 1;
              updateDebug(performance.now(), {
                templeDistance: smoothedTempleDistance,
                baselineTempleDistance: baselineTempleDistance || smoothedTempleDistance,
                scaleRatio: baselineTempleDistance
                  ? smoothedTempleDistance / Math.max(baselineTempleDistance, 1e-4)
                  : 1,
                scale: stableScale,
                yaw: stableYaw,
                holdFrames: confidenceHoldFrames,
                tracking: "frozen",
              });
            } else {
              applyLandmarks(landmarks, performance.now());
            }
          } else {
            missingFrames += 1;
          }
        } catch {
          missingFrames += 1;
        }
      }

      if (glassesPivot) {
        if (missingFrames > FIT.lostTrackingFrames) {
          glassesPivot.visible = false;
          if (faceOccluder) {
            faceOccluder.visible = false;
          }
          resetTrackingState();
        }

        if (glassesPivot.visible) {
          glassesPivot.position.lerp(targetPosition, FIT.positionSmoothing);
          currentScale.lerp(targetScale, FIT.scaleSmoothing);
          glassesPivot.scale.copy(currentScale);

          currentQuaternion.slerp(targetQuaternion, FIT.rotationSmoothing);
          glassesPivot.quaternion.copy(currentQuaternion);

          if (faceOccluder?.visible) {
            currentOccluderPosition.lerp(targetOccluderPosition, FIT.positionSmoothing);
            faceOccluder.position.copy(currentOccluderPosition);
            currentOccluderScale.lerp(targetOccluderScale, FIT.positionSmoothing);
            faceOccluder.scale.copy(currentOccluderScale);
            currentOccluderQuaternion.slerp(targetOccluderQuaternion, FIT.rotationSmoothing);
            faceOccluder.quaternion.copy(currentOccluderQuaternion);
          }
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
          const modelRoot = gltf.scene;

          const bounds = new THREE.Box3().setFromObject(modelRoot);
          const size = bounds.getSize(new THREE.Vector3());
          if (!Number.isFinite(size.x) || size.x <= 0) {
            setError("Could not normalize GLB model dimensions.");
            return;
          }

          const center = bounds.getCenter(new THREE.Vector3());
          modelRoot.position.sub(center);
          modelRoot.position.y += size.y * 0.14;

          const widthDepthRatio = size.x / Math.max(size.z, 1e-4);
          const widthHeightRatio = size.x / Math.max(size.y, 1e-4);
          modelWrapCompensation = clamp(1 + (2.7 - widthDepthRatio) * 0.12, 1.02, 1.3);
          modelVerticalCompensation = clamp((2.35 - widthHeightRatio) * 0.015, -0.02, 0.02);

          const widthScale = FIT.modelTargetWidth / size.x;
          modelRoot.scale.setScalar(widthScale);

          glassesPivot = new THREE.Group();
          glassesPivot.visible = false;
          glassesPivot.add(modelRoot);
          glassesPivot.renderOrder = 1;

          const initialEuler = new THREE.Euler(calibrationRotX, calibrationRotY, calibrationRotZ, "XYZ");
          glassesPivot.quaternion.setFromEuler(initialEuler);
          currentQuaternion.copy(glassesPivot.quaternion);
          targetQuaternion.copy(glassesPivot.quaternion);

          scene.add(glassesPivot);
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
      occluderGeometry.dispose();
      occluderMaterial.dispose();
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
        <button
          type="button"
          onClick={() => setDebugEnabled((prev) => !prev)}
          className="absolute right-3 top-3 z-20 rounded-md bg-slate-900/80 px-2 py-1 text-[11px] font-medium text-slate-200"
        >
          {debugEnabled ? "Hide Debug" : "Show Debug"}
        </button>
        {debugEnabled && debugMetrics ? (
          <div className="absolute left-3 top-3 z-20 rounded-md bg-black/70 px-2 py-1 font-mono text-[11px] text-emerald-300">
            <div>state: {debugMetrics.tracking}</div>
            <div>hold: {debugMetrics.holdFrames}</div>
            <div>temple: {debugMetrics.templeDistance.toFixed(4)}</div>
            <div>baseline: {debugMetrics.baselineTempleDistance.toFixed(4)}</div>
            <div>ratio: {debugMetrics.scaleRatio.toFixed(3)}</div>
            <div>scale: {debugMetrics.scale.toFixed(3)}</div>
            <div>yaw: {debugMetrics.yaw.toFixed(3)}</div>
          </div>
        ) : null}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-contain"
        />
        <div ref={stageRef} className="pointer-events-none absolute inset-0" />
      </div>
      <p className="text-xs text-slate-300">Keep your full face centered and well lit for best tracking.</p>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
