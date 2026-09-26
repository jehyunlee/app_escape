import * as THREE from "three";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { buildRoomWorld } from "./room-world.js";
import { layoutHotspots } from "./hotspot-layout.js";
import { QUESTION_COUNT as TARGET_COUNT } from "./levels.js";

const DEFAULT_CAMERA_POSITION = [0, 2.6, 8.5];
const DEFAULT_CAMERA_TARGET = [0, 1.35, 0];
const DESKTOP_PIXEL_RATIO = 1.5;
const MOBILE_PIXEL_RATIO = 1;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const WORLD_FOG = new THREE.Color(0x151729);

function finiteNumber(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function vectorFromArray(value, fallback) {
  if (!Array.isArray(value) || value.length < 3) {
    return new THREE.Vector3(...fallback);
  }
  return new THREE.Vector3(
    finiteNumber(value[0], fallback[0]),
    finiteNumber(value[1], fallback[1]),
    finiteNumber(value[2], fallback[2]),
  );
}

function normalizeIndex(value) {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const integer = Math.trunc(numeric);
  if (integer < 0 || integer >= TARGET_COUNT) return null;
  return integer;
}

function disposeMaterial(material, textures) {
  if (!material) return;
  const materials = Array.isArray(material) ? material : [material];
  for (const entry of materials) {
    if (!entry) continue;
    for (const key of Object.keys(entry)) {
      const value = entry[key];
      if (value && value.isTexture) textures.add(value);
    }
    if (typeof entry.dispose === "function") entry.dispose();
  }
}

function disposeObjectResources(root) {
  if (!root) return;
  const textures = new Set();
  root.traverse((node) => {
    if (node.geometry && typeof node.geometry.dispose === "function") {
      node.geometry.dispose();
    }
    disposeMaterial(node.material, textures);
  });
  for (const texture of textures) texture.dispose();
}

function supportsBloom() {
  if (window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches) return false;
  if (window.innerWidth <= 720) return false;
  const memory = Number(globalThis.navigator?.deviceMemory);
  const cores = Number(globalThis.navigator?.hardwareConcurrency);
  if (Number.isFinite(memory) && memory > 0 && memory < 4) return false;
  if (Number.isFinite(cores) && cores > 0 && cores < 4) return false;
  return true;
}

/**
 * Build the interactive WebGL view for a room descriptor.
 *
 * The returned element is deliberately reusable: callers can move it between
 * mounts without rebuilding the renderer. `update` receives the answered
 * state and selected target; `pause` controls the render loop while a
 * question is visible. `layoutSeed` selects a deterministic scattered
 * arrangement for this room.
 */
export function createRoomView(room, onSelect, layoutSeed) {
  if (
    !room ||
    typeof room !== "object" ||
    !/^space-\d{3}$/.test(room.id) ||
    typeof room.name !== "string" ||
    !Number.isInteger(room.themeId) ||
    room.themeId < 1 ||
    room.themeId > 10 ||
    typeof room.description !== "string" ||
    !Array.isArray(room.clues) ||
    room.clues.length !== 3 ||
    typeof room.accent !== "string" ||
    !/^#[0-9a-f]{6}$/i.test(room.accent) ||
    typeof room.image !== "string" ||
    !room.image
  ) {
    throw new TypeError("createRoomView requires a valid room descriptor");
  }
  const element = document.createElement("section");
  element.className = "world-room-view";
  element.dataset.roomId = room.id;
  element.dataset.themeId = String(room.themeId);
  element.setAttribute("aria-label", room.name);

  const canvas = document.createElement("canvas");
  canvas.className = "world-canvas";
  canvas.dataset.renderer = "webgl";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "마우스나 손가락으로 살펴볼 수 있는 3D 방");
  canvas.setAttribute("aria-describedby", `world-room-description-${room.id}`);
  canvas.tabIndex = -1;

  const description = document.createElement("p");
  description.className = "world-room-description";
  description.id = `world-room-description-${room.id}`;
  description.textContent =
    "방 안의 물체를 선택해 문제를 여세요. 해결한 물체는 잠깁니다.";

  const controls = document.createElement("div");
  controls.className = "world-object-controls";
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", "방 안 탐색 대상");

  const buttons = [];
  const cleanup = [];
  let retryCleanup = null;
  for (let index = 0; index < TARGET_COUNT; index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "world-object-button";
    button.dataset.roomObject = String(index);
    button.textContent = `물체 ${index + 1}`;
    button.setAttribute("aria-label", "방 안의 물체");
    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
    controls.append(button);
    buttons.push(button);
  }

  element.append(canvas, controls, description);

  let renderer = null;
  let composer = null;
  let bokehPass = null;
  let scene = null;
  let camera = null;
  let world = null;
  let targets = [];
  let selectedIndex = null;
  let answeredState = Array(TARGET_COUNT).fill(false);
  let activeMarker = null;
  let activeMarkerGeometry = null;
  let activeMarkerMaterial = null;
  let manualPaused = false;
  let hiddenByDocument = document.visibilityState === "hidden";
  let disposed = false;
  let rafId = 0;
  let lastFrameTime = 0;
  let width = 0;
  let height = 0;
  let pixelRatio = 0;
  let elapsedTime = 0;
  let resizeObserver = null;
  let fallbackResizeHandler = null;
  let reducedMotion =
    window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches ?? false;
  let reducedMotionMedia = null;
  let renderFailure = null;
  let assetErrorReported = false;
  let assetErrorPanel = null;

  const pointer = new THREE.Vector2();
  const pointerGoal = new THREE.Vector2();
  const cameraTarget = new THREE.Vector3();
  const desiredCameraTarget = new THREE.Vector3();
  const baseCameraPosition = new THREE.Vector3();
  const desiredCameraPosition = new THREE.Vector3();
  const baseCameraTarget = new THREE.Vector3();
  const targetBounds = new THREE.Box3();
  const fitCenter = new THREE.Vector3();
  const fitSize = new THREE.Vector3();
  const fitDirection = new THREE.Vector3();
  const worldPoint = new THREE.Vector3();
  const projectedPoint = new THREE.Vector3();
  const objectSize = new THREE.Vector3();
  const box = new THREE.Box3();
  const raycaster = new THREE.Raycaster();
  const rendererLights = [];

  const raf = (callback) => {
    if (typeof window.requestAnimationFrame === "function") {
      return window.requestAnimationFrame(callback);
    }
    return window.setTimeout(() => callback(performance.now()), 16);
  };
  const cancelRaf = (id) => {
    if (!id) return;
    if (typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(id);
    } else {
      window.clearTimeout(id);
    }
  };

  function clearRetryListener() {
    if (retryCleanup) {
      retryCleanup();
      retryCleanup = null;
    }
  }

  function showWebGLError(error) {
    clearRetryListener();
    renderFailure =
      error instanceof Error
        ? error
        : new Error(String(error || "WebGL unavailable"));
    element.dataset.webglError = "true";
    const panel = document.createElement("div");
    panel.className = "world-error-panel";
    panel.setAttribute("role", "alert");

    const title = document.createElement("strong");
    title.textContent = "3D 방을 표시할 수 없습니다.";
    const message = document.createElement("span");
    message.textContent =
      "WebGL을 지원하는 최신 브라우저에서 다시 시도해 주세요.";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "world-error-retry";
    retry.textContent = "3D 다시 시도";
    panel.append(title, message, retry);
    element.append(panel);

    const retryHandler = () => {
      element.dispatchEvent(
        new CustomEvent("world-webgl-retry", {
          bubbles: true,
          detail: { room },
        }),
      );
      panel.remove();
      element.dataset.webglError = "false";
      renderFailure = null;
      initialize();
    };
    retry.addEventListener("click", retryHandler);
    retryCleanup = () => retry.removeEventListener("click", retryHandler);
  }

  function removeRendererChildren() {
    if (activeMarker) {
      activeMarker.removeFromParent();
      activeMarker = null;
    }
    if (activeMarkerGeometry) {
      activeMarkerGeometry.dispose();
      activeMarkerGeometry = null;
    }
    if (activeMarkerMaterial) {
      activeMarkerMaterial.dispose();
      activeMarkerMaterial = null;
    }
    if (world?.root) world.root.userData.disposed = true;
    if (scene) {
      scene.traverse((object) => {
        object.shadow?.dispose();
      });
      for (const light of rendererLights) light.removeFromParent();
      rendererLights.length = 0;
      disposeObjectResources(scene);
      scene.clear();
    }
    if (composer) {
      for (const pass of composer.passes) pass.dispose?.();
      composer.dispose?.();
      composer = null;
    }
    bokehPass = null;
    if (renderer) {
      renderer.dispose?.();
      if (disposed) renderer.forceContextLoss();
      renderer = null;
    }
    world = null;
    targets = [];
    scene = null;
    camera = null;
    width = 0;
    height = 0;
    pixelRatio = 0;
  }

  function makeLighting() {
    const hemi = new THREE.HemisphereLight(0xcad7ff, 0x171323, 1.15);
    hemi.name = "world-ambient-light";
    scene.add(hemi);
    rendererLights.push(hemi);

    const key = new THREE.DirectionalLight(0xffe3ba, 2.15);
    key.name = "world-key-light";
    key.position.set(-4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -12;
    key.shadow.camera.right = 12;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -8;
    scene.add(key);
    rendererLights.push(key);

    const fill = new THREE.PointLight(0x7d98ff, 0.8, 12, 2);
    fill.name = "world-fill-light";
    fill.position.set(3, 2.4, 1.5);
    scene.add(fill);
    rendererLights.push(fill);
  }

  function makeActiveMarker() {
    activeMarkerGeometry = new THREE.TorusGeometry(0.48, 0.026, 10, 48);
    activeMarkerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd47e,
      transparent: true,
      opacity: 0.82,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    activeMarker = new THREE.Mesh(activeMarkerGeometry, activeMarkerMaterial);
    activeMarker.name = "world-active-marker";
    activeMarker.renderOrder = 20;
    activeMarker.visible = false;
    scene.add(activeMarker);
  }

  function updateActiveState() {
    for (let index = 0; index < buttons.length; index += 1) {
      const answered = answeredState[index] === true;
      const selected = index === selectedIndex;
      const button = buttons[index];
      button.disabled = answered || targets.length !== TARGET_COUNT;
      button.setAttribute("aria-disabled", String(button.disabled));
      button.dataset.active = String(selected);
      button.dataset.selected = String(selected);
      button.dataset.answered = String(answered);
      button.dataset.solved = String(answered);
      if (targets[index]) {
        const number = document.createElement("span");
        number.className = "world-object-number";
        number.textContent = answered ? "✓" : String(index + 1);
        number.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.className = "world-object-name";
        label.textContent = targets[index].name;
        label.setAttribute("aria-hidden", "true");
        const connector = document.createElement("span");
        connector.className = "world-object-connector";
        connector.setAttribute("aria-hidden", "true");
        button.replaceChildren(connector, number, label);
        button.setAttribute(
          "aria-label",
          answered
            ? `${targets[index].name} · 풀이 완료`
            : `${targets[index].name}에서 문제 열기`,
        );
      }
      if (selected) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
      button.setAttribute("aria-pressed", String(selected));
    }
    if (activeMarker)
      activeMarker.visible =
        selectedIndex != null &&
        !answeredState[selectedIndex] &&
        targets.length === TARGET_COUNT;
  }

  function updateMarkerAndControls() {
    if (!camera || !scene || !targets.length) return;
    camera.updateMatrixWorld();
    scene.updateMatrixWorld(true);
    const cssWidth = canvas.clientWidth || width;
    const cssHeight = canvas.clientHeight || height;
    if (!cssWidth || !cssHeight) return;

    const anchors = [];
    for (let index = 0; index < targets.length; index += 1) {
      const object = targets[index]?.object;
      if (!object) continue;
      box.setFromObject(object);
      if (box.isEmpty()) object.getWorldPosition(worldPoint);
      else box.getCenter(worldPoint);
      projectedPoint.copy(worldPoint).project(camera);
      const x = (projectedPoint.x * 0.5 + 0.5) * cssWidth;
      const y = (-projectedPoint.y * 0.5 + 0.5) * cssHeight;
      const inFront = projectedPoint.z > -1 && projectedPoint.z < 1;
      const button = buttons[index];
      anchors.push({
        x,
        y,
        width: button.offsetWidth,
        height: button.offsetHeight,
      });
      // Keep every control reachable from the keyboard even during a
      // transient camera transition; auto-fit keeps these positions on-canvas.
      button.style.visibility = "visible";
      button.dataset.offscreen = String(!inFront);
    }
    const positions = layoutHotspots(anchors, cssWidth, cssHeight);
    positions.forEach((position, index) => {
      const button = buttons[index];
      button.style.left = `${position.x}px`;
      button.style.top = `${position.y}px`;
      const dx = anchors[index].x - position.x;
      const dy = anchors[index].y - position.y;
      const distance = Math.hypot(dx, dy);
      const connector = button.querySelector(".world-object-connector");
      if (connector) {
        connector.style.width = `${distance}px`;
        connector.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
        connector.hidden = distance < 2;
      }
    });

    if (
      !activeMarker ||
      selectedIndex == null ||
      !targets[selectedIndex]?.object
    )
      return;
    const activeObject = targets[selectedIndex].object;
    box.setFromObject(activeObject);
    if (box.isEmpty()) activeObject.getWorldPosition(worldPoint);
    else box.getCenter(worldPoint);
    activeMarker.position.copy(worldPoint);
    const radius = box.isEmpty()
      ? 0.42
      : Math.max(0.25, Math.min(1.1, box.getSize(objectSize).length() * 0.23));
    activeMarker.scale.setScalar(radius / 0.48);
    activeMarker.lookAt(camera.position);
  }

  function triggerSelection(index) {
    if (
      disposed ||
      manualPaused ||
      hiddenByDocument ||
      renderFailure ||
      index < 0 ||
      index >= TARGET_COUNT ||
      answeredState[index] ||
      !targets[index]?.object
    )
      return;
    selectedIndex = index;
    updateActiveState();
    updateMarkerAndControls();
    if (typeof onSelect === "function") onSelect(index);
  }

  function onButtonPointerDown(event) {
    event.stopPropagation();
  }

  function onButtonClick(index, event) {
    event.preventDefault();
    event.stopPropagation();
    triggerSelection(index);
  }

  function getCanvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    };
  }

  function onPointerMove(event) {
    if (reducedMotion) return;
    const point = getCanvasPoint(event);
    if (!point) return;
    pointerGoal.set(
      Math.max(-1, Math.min(1, point.x)),
      Math.max(-1, Math.min(1, point.y)),
    );
    scheduleFrame();
  }

  function onPointerLeave() {
    pointerGoal.set(0, 0);
    scheduleFrame();
  }

  function onCanvasPointerDown(event) {
    if (
      manualPaused ||
      hiddenByDocument ||
      renderFailure ||
      event.button !== 0 ||
      !camera ||
      !targets.length
    )
      return;
    const point = getCanvasPoint(event);
    if (!point) return;
    pointer.set(point.x, point.y);
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(
      targets.map((target) => target.object).filter(Boolean),
      true,
    );
    let selectedHit = null;
    for (const intersection of intersections) {
      if (!intersection.object?.isMesh || !intersection.object.visible)
        continue;
      let owner = intersection.object;
      while (owner && !owner.userData?.interactive) owner = owner.parent;
      const index = owner?.userData?.index;
      if (!Number.isInteger(index) || index < 0 || index >= TARGET_COUNT)
        continue;
      // Solved meshes remain visible as part of the room, but they must not
      // block an unsolved target behind them. Continue through the sorted
      // intersections instead of treating the disabled object as a hit.
      if (answeredState[index]) continue;
      selectedHit = index;
      break;
    }
    if (selectedHit == null) return;
    event.preventDefault();
    triggerSelection(selectedHit);
  }

  function updateCamera(delta) {
    if (!camera) return;
    const easing = reducedMotion
      ? 1
      : 1 - Math.exp(-Math.min(0.08, delta) * 5.4);
    if (reducedMotion) pointerGoal.set(0, 0);
    desiredCameraPosition.copy(baseCameraPosition);
    desiredCameraPosition.x += pointerGoal.x * 0.28;
    desiredCameraPosition.y += pointerGoal.y * 0.28;
    desiredCameraPosition.y -= pointerGoal.y * 0.08;
    desiredCameraPosition.z += pointerGoal.y * 0.05;
    desiredCameraTarget.copy(baseCameraTarget);
    desiredCameraTarget.x += pointerGoal.x * 0.13;
    desiredCameraTarget.y += pointerGoal.y * 0.08;
    camera.position.lerp(desiredCameraPosition, easing);
    cameraTarget.lerp(desiredCameraTarget, easing);
    camera.lookAt(cameraTarget);
  }

  function autoFitCamera() {
    if (!camera || !scene || !targets.length) return;
    scene.updateMatrixWorld(true);
    targetBounds.makeEmpty();
    targets.forEach((target) => {
      if (target?.object) targetBounds.expandByObject(target.object);
    });
    if (targetBounds.isEmpty()) return;
    // Include the enlarged support pieces and a little breathing room at the
    // edge of the camera frame. This keeps the 1.45x foreground models fully
    // visible instead of compensating by shrinking them again.
    targetBounds.expandByScalar(0.55);

    targetBounds.getCenter(fitCenter);
    targetBounds.getSize(fitSize);
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov =
      2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(camera.aspect, 0.1));
    fitDirection
      .copy(vectorFromArray(world?.camera?.position, DEFAULT_CAMERA_POSITION))
      .sub(vectorFromArray(world?.camera?.target, DEFAULT_CAMERA_TARGET))
      .normalize();
    if (fitDirection.lengthSq() < 0.01) fitDirection.set(0, 0, 1);
    const right = new THREE.Vector3(0, 1, 0).cross(fitDirection).normalize();
    const up = fitDirection.clone().cross(right).normalize();
    let distance = 1;
    for (const x of [targetBounds.min.x, targetBounds.max.x]) {
      for (const y of [targetBounds.min.y, targetBounds.max.y]) {
        for (const z of [targetBounds.min.z, targetBounds.max.z]) {
          const corner = new THREE.Vector3(x, y, z).sub(fitCenter);
          const depth = corner.dot(fitDirection);
          distance = Math.max(
            distance,
            depth +
              Math.abs(corner.dot(up)) / (Math.tan(verticalFov / 2) * 0.84),
            depth +
              Math.abs(corner.dot(right)) /
                (Math.tan(horizontalFov / 2) * 0.84),
          );
        }
      }
    }
    baseCameraTarget.copy(fitCenter);
    baseCameraPosition.copy(fitCenter).addScaledVector(fitDirection, distance);
    camera.position.copy(baseCameraPosition);
    cameraTarget.copy(baseCameraTarget);
    camera.near = Math.max(0.05, distance - fitSize.length() * 1.5);
    camera.far = Math.max(60, distance + fitSize.length() * 2.6);
    if (bokehPass?.uniforms?.focus) bokehPass.uniforms.focus.value = distance;
    camera.updateProjectionMatrix();
    camera.lookAt(cameraTarget);
    const artwork = scene.getObjectByName(`room-artwork-${room.id}`);
    if (artwork) {
      const backdropDistance = distance + fitSize.z * 0.5 + 8;
      artwork.position
        .copy(baseCameraPosition)
        .addScaledVector(fitDirection, -backdropDistance);
      artwork.lookAt(baseCameraPosition);
      const spanY = 2 * Math.tan(verticalFov / 2) * backdropDistance;
      const spanX = spanY * camera.aspect;
      artwork.scale.setScalar(
        Math.max(
          spanX / artwork.geometry.parameters.width,
          spanY / artwork.geometry.parameters.height,
        ) * 1.07,
      );
    }
  }

  function resize() {
    if (!renderer || !camera) return;
    const rect = element.getBoundingClientRect();
    const nextWidth = Math.max(
      0,
      Math.floor(rect.width || canvas.clientWidth || 0),
    );
    const nextHeight = Math.max(
      0,
      Math.floor(rect.height || canvas.clientHeight || 0),
    );
    if (!nextWidth || !nextHeight) {
      return;
    }
    const mobile = window.matchMedia("(max-width: 720px)").matches;
    const cap = mobile ? MOBILE_PIXEL_RATIO : DESKTOP_PIXEL_RATIO;
    const nextPixelRatio = Math.min(window.devicePixelRatio || 1, cap);
    if (
      width === nextWidth &&
      height === nextHeight &&
      pixelRatio === nextPixelRatio
    )
      return;
    width = nextWidth;
    height = nextHeight;
    camera.aspect = width / height;
    camera.fov = THREE.MathUtils.radToDeg(
      2 *
        Math.atan(
          Math.tan(THREE.MathUtils.degToRad(21)) *
            // Keep the portrait viewport from stretching the scattered room
            // so far vertically that nearby hotspots collapse into one another.
            Math.min(1.75, Math.max(1, 1.6 / camera.aspect)),
        ),
    );
    camera.updateProjectionMatrix();
    autoFitCamera();
    if (pixelRatio !== nextPixelRatio) {
      pixelRatio = nextPixelRatio;
      renderer.setPixelRatio(pixelRatio);
      composer?.setPixelRatio(pixelRatio);
    }
    renderer.setSize(width, height, false);
    composer?.setSize(width, height);
  }

  function renderFrame(timestamp) {
    rafId = 0;
    if (disposed || manualPaused || hiddenByDocument || renderFailure) return;
    if (lastFrameTime && timestamp - lastFrameTime < 1000 / 30) {
      scheduleFrame();
      return;
    }
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const delta = lastFrameTime
      ? Math.min(0.05, Math.max(0, (timestamp - lastFrameTime) / 1000))
      : 1 / 60;
    lastFrameTime = timestamp;
    resize();
    updateCamera(delta);
    if (!reducedMotion) {
      elapsedTime += delta;
      world?.tick?.(elapsedTime);
    }
    reportAssetError();
    scene?.updateMatrixWorld(true);
    updateMarkerAndControls();
    try {
      if (composer) composer.render(delta);
      else renderer?.render(scene, camera);
    } catch (error) {
      showWebGLError(error);
      return;
    }
    scheduleFrame();
  }

  function reportAssetError() {
    const error = world?.root?.userData?.assetError;
    if (!error || assetErrorReported) return;
    assetErrorReported = true;
    element.dataset.assetError = "true";
    description.textContent =
      "방 이미지를 불러올 수 없습니다. 다시 시도해 주세요.";
    element.dispatchEvent(
      new CustomEvent("world-asset-error", {
        bubbles: true,
        detail: { room, error },
      }),
    );
    assetErrorPanel = document.createElement("div");
    assetErrorPanel.className = "world-error-panel";
    assetErrorPanel.setAttribute("role", "alert");
    const message = document.createElement("span");
    message.textContent = "방 이미지를 불러올 수 없습니다.";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "world-error-retry";
    retry.textContent = "이미지 다시 시도";
    retry.addEventListener("click", () => {
      assetErrorPanel?.remove();
      assetErrorPanel = null;
      initialize();
    });
    assetErrorPanel.append(message, retry);
    element.append(assetErrorPanel);
  }

  function scheduleFrame() {
    if (disposed || manualPaused || hiddenByDocument || renderFailure || rafId)
      return;
    rafId = raf(renderFrame);
  }

  function setPaused(value) {
    manualPaused = Boolean(value);
    if (manualPaused && rafId) {
      cancelRaf(rafId);
      rafId = 0;
    } else if (!manualPaused) {
      scheduleFrame();
    }
  }

  function onVisibilityChange() {
    hiddenByDocument = document.visibilityState === "hidden";
    if (hiddenByDocument && rafId) {
      cancelRaf(rafId);
      rafId = 0;
    } else if (!hiddenByDocument) {
      lastFrameTime = 0;
      scheduleFrame();
    }
  }

  function onReducedMotionChange(event) {
    reducedMotion = Boolean(event.matches);
    if (reducedMotion) pointerGoal.set(0, 0);
    scheduleFrame();
  }

  function initialize() {
    if (disposed) return;
    assetErrorPanel?.remove();
    assetErrorPanel = null;
    removeRendererChildren();
    clearRetryListener();
    element.dataset.webglError = "false";
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, DESKTOP_PIXEL_RATIO),
      );

      scene = new THREE.Scene();
      scene.background = WORLD_FOG.clone();
      scene.fog = new THREE.Fog(WORLD_FOG.clone(), 7, 24);
      camera = new THREE.PerspectiveCamera(42, 1, 0.08, 60);
      world = buildRoomWorld(scene, room, layoutSeed);
      if (
        !world ||
        !Array.isArray(world.targets) ||
        world.targets.length !== TARGET_COUNT
      ) {
        throw new Error("Room world must expose exactly fifteen targets.");
      }
      targets = world.targets.map((target) => ({
        name: String(target?.name || ""),
        object: target?.object,
        index: target?.index,
      }));
      if (targets.some((target) => !target.object?.isObject3D)) {
        throw new Error("Room world target is not a THREE.Object3D.");
      }
      if (
        targets.some(
          (target, index) =>
            target.index !== index || target.object.userData?.index !== index,
        )
      ) {
        throw new Error("Room world targets must have stable indices.");
      }
      if (
        new Set(targets.map((target) => target.name)).size !== TARGET_COUNT ||
        new Set(targets.map((target) => target.object.userData?.kind)).size !==
          TARGET_COUNT
      ) {
        throw new Error("Room world targets must have unique names and kinds.");
      }
      if (targets.some((target) => /\d+$/.test(target.name))) {
        throw new Error("Room world target names must not end with ordinals.");
      }
      baseCameraPosition.copy(
        vectorFromArray(world.camera?.position, DEFAULT_CAMERA_POSITION),
      );
      baseCameraTarget.copy(
        vectorFromArray(world.camera?.target, DEFAULT_CAMERA_TARGET),
      );
      camera.position.copy(baseCameraPosition);
      cameraTarget.copy(baseCameraTarget);
      camera.lookAt(cameraTarget);
      makeLighting();
      makeActiveMarker();
      updateActiveState();

      const focus = Math.max(2, Math.min(22, finiteNumber(world.focus, 8)));
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bokehPass = new BokehPass(scene, camera, {
        focus,
        aperture: 0.00025,
        maxblur: 0.005,
      });
      composer.addPass(bokehPass);
      if (supportsBloom()) {
        composer.addPass(
          new UnrealBloomPass(
            new THREE.Vector2(Math.max(1, width), Math.max(1, height)),
            0.13,
            0.28,
            0.9,
          ),
        );
      }
      composer.addPass(new OutputPass());
      resize();
      renderFailure = null;
      assetErrorReported = false;
      delete element.dataset.assetError;
      elapsedTime = 0;
      lastFrameTime = 0;
      scheduleFrame();
    } catch (error) {
      removeRendererChildren();
      showWebGLError(error);
    }
  }

  function onResizeObserved() {
    resize();
    scheduleFrame();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (rafId) cancelRaf(rafId);
    rafId = 0;
    clearRetryListener();
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (fallbackResizeHandler) {
      window.removeEventListener("resize", fallbackResizeHandler);
      fallbackResizeHandler = null;
    }
    document.removeEventListener("visibilitychange", onVisibilityChange);
    reducedMotionMedia?.removeEventListener?.("change", onReducedMotionChange);
    for (const remove of cleanup) remove();
    cleanup.length = 0;
    removeRendererChildren();
    element.replaceChildren();
  }

  for (let index = 0; index < buttons.length; index += 1) {
    const button = buttons[index];
    const pointerDown = (event) => onButtonPointerDown(event);
    const click = (event) => onButtonClick(index, event);
    button.addEventListener("pointerdown", pointerDown);
    button.addEventListener("click", click);
    cleanup.push(() => {
      button.removeEventListener("pointerdown", pointerDown);
      button.removeEventListener("click", click);
    });
  }

  element.addEventListener("pointermove", onPointerMove);
  element.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("pointerdown", onCanvasPointerDown);
  document.addEventListener("visibilitychange", onVisibilityChange);
  cleanup.push(() => element.removeEventListener("pointermove", onPointerMove));
  cleanup.push(() =>
    element.removeEventListener("pointerleave", onPointerLeave),
  );
  cleanup.push(() =>
    canvas.removeEventListener("pointerdown", onCanvasPointerDown),
  );

  reducedMotionMedia = window.matchMedia?.(REDUCED_MOTION_QUERY) ?? null;
  reducedMotionMedia?.addEventListener?.("change", onReducedMotionChange);
  resizeObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(onResizeObserved)
      : null;
  if (resizeObserver) resizeObserver.observe(element);
  else {
    fallbackResizeHandler = onResizeObserved;
    window.addEventListener("resize", fallbackResizeHandler);
  }

  initialize();

  return {
    element,
    update(state = {}) {
      const answered = Array.isArray(state?.answered) ? state.answered : [];
      answeredState = Array.from(
        { length: TARGET_COUNT },
        (_value, index) => answered[index] === true,
      );
      selectedIndex = normalizeIndex(state?.selected);
      updateActiveState();
      resize();
      updateMarkerAndControls();
      scheduleFrame();
    },
    pause: setPaused,
    dispose,
  };
}
