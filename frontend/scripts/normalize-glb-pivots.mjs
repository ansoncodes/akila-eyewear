import fs from "node:fs";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { getBounds } from "@gltf-transform/functions";

const MODELS_DIR = path.resolve(process.cwd(), "public/models");
const PIVOT_NAME = "__pivot__";
const TARGET_WIDTH = 0.3;
const WIDTH_TOLERANCE = 0.01;
const NOSE_BRIDGE_LIFT = 0.14;

function multiplyNodeScale(node, factor) {
  const [sx, sy, sz] = node.getScale();
  node.setScale([sx * factor, sy * factor, sz * factor]);
}

function unwrapTopLevelPivots(scene) {
  let changed = false;
  const children = [...scene.listChildren()];
  for (const child of children) {
    if (child.getName() !== PIVOT_NAME) {
      continue;
    }
    for (const grandChild of [...child.listChildren()]) {
      child.removeChild(grandChild);
      scene.addChild(grandChild);
    }
    scene.removeChild(child);
    changed = true;
  }
  return changed;
}

function getSceneSizes(scene) {
  const bounds = getBounds(scene);
  if (!bounds || !bounds.min || !bounds.max) {
    return null;
  }

  const sizeX = bounds.max[0] - bounds.min[0];
  const sizeY = bounds.max[1] - bounds.min[1];
  const sizeZ = bounds.max[2] - bounds.min[2];

  if (!Number.isFinite(sizeX) || !Number.isFinite(sizeY) || !Number.isFinite(sizeZ) || sizeX <= 0) {
    return null;
  }

  const centerX = (bounds.min[0] + bounds.max[0]) * 0.5;
  const centerY = (bounds.min[1] + bounds.max[1]) * 0.5;
  const centerZ = (bounds.min[2] + bounds.max[2]) * 0.5;

  return {
    sizeX,
    sizeY,
    sizeZ,
    centerX,
    centerY,
    centerZ,
  };
}

function normalizeScene(doc, scene) {
  const warnings = [];
  let changed = unwrapTopLevelPivots(scene);

  const initial = getSceneSizes(scene);
  if (!initial) {
    return { changed, warnings, skipped: true };
  }

  const children = scene.listChildren();
  if (!children.length) {
    return { changed, warnings, skipped: true };
  }

  const pivot = doc
    .createNode(PIVOT_NAME)
    .setTranslation([
      -initial.centerX,
      -initial.centerY + initial.sizeY * NOSE_BRIDGE_LIFT,
      -initial.centerZ,
    ]);

  for (const child of children) {
    scene.removeChild(child);
    pivot.addChild(child);
  }
  scene.addChild(pivot);
  changed = true;

  if (Math.abs(initial.sizeX - TARGET_WIDTH) > WIDTH_TOLERANCE) {
    const uniformScale = TARGET_WIDTH / initial.sizeX;
    multiplyNodeScale(pivot, uniformScale);
    changed = true;
  }

  const dominantAxis = Math.max(initial.sizeX, initial.sizeY, initial.sizeZ);
  if (dominantAxis !== initial.sizeX) {
    warnings.push("width axis is not dominant");
  }
  if (initial.sizeZ > initial.sizeX * 0.95) {
    warnings.push("depth almost equals width; verify forward axis");
  }

  return { changed, warnings, skipped: false };
}

async function run() {
  if (!fs.existsSync(MODELS_DIR)) {
    console.error(`models directory not found: ${MODELS_DIR}`);
    process.exit(1);
  }

  const io = new NodeIO();
  const files = fs
    .readdirSync(MODELS_DIR)
    .filter((name) => name.toLowerCase().endsWith(".glb"))
    .sort();

  if (!files.length) {
    console.log("no GLB files found");
    return;
  }

  for (const file of files) {
    const fullPath = path.join(MODELS_DIR, file);
    const doc = await io.read(fullPath);

    let changed = false;
    const warnings = [];

    for (const scene of doc.getRoot().listScenes()) {
      const result = normalizeScene(doc, scene);
      changed = changed || result.changed;
      warnings.push(...result.warnings);
    }

    if (changed) {
      await io.write(fullPath, doc);
      console.log(`updated  ${file}`);
    } else {
      console.log(`skipped  ${file}`);
    }

    for (const warning of warnings) {
      console.log(`warn     ${file} (${warning})`);
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
