import { avatarMarkup } from "./avatar.js";

// The scene is intentionally long enough to read as a tiny story: arrival,
// boarding, then the ride away. Escape and the skip control can still end it.
const TRAVEL_DURATION = 5_200;
let travelSequence = 0;

const createElement = (tag, className) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
};

const asText = (value, fallback) => {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
};

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const smooth = (value) => {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
};

const lerp = (from, to, progress) => from + (to - from) * progress;

const hasReducedMotion = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

const setTransform = (element, transform) => {
  element.style.transform = transform;
};

const setCarriagePosition = (elements, progress) => {
  const { camera, world, carriage, avatar, destination } = elements;
  const arrival = smooth(progress / 0.23);
  const boarding = smooth((progress - 0.23) / 0.2);
  const departure = smooth((progress - 0.43) / 0.57);

  // The vehicle enters from the left, pauses beside the player, then recedes
  // through the destination gate. The avatar follows its actual 3-D position
  // only after the boarding beat, rather than simply fading between scenes.
  const carriageX = lerp(-58, 0, arrival) + lerp(0, 15, departure);
  const carriageZ = lerp(120, 0, arrival) + lerp(0, -760, departure);
  const carriageScale = lerp(0.64, 1, arrival) * lerp(1, 0.58, departure);
  const carriageOpacity = clamp(1 - Math.max(0, departure - 0.78) / 0.22);
  carriage.style.setProperty(
    "--travel-carriage-x",
    `${carriageX.toFixed(2)}vw`,
  );
  setTransform(
    carriage,
    `translate3d(calc(-50% + var(--travel-carriage-x)), ${
      Math.sin(progress * Math.PI * 8) * (progress < 0.43 ? 2 : 5)
    }px, ${carriageZ.toFixed(1)}px) scale(${carriageScale.toFixed(3)})`,
  );
  carriage.style.opacity = carriageOpacity.toFixed(3);

  const avatarX = progress < 0.43 ? lerp(17, 0, boarding) : 15 * departure;
  const avatarY =
    progress < 0.23
      ? 0
      : progress < 0.43
        ? lerp(0, 80, boarding) + Math.sin(boarding * Math.PI) * -8
        : lerp(80, 105, departure);
  const avatarScale =
    progress < 0.43 ? lerp(1, 0.9, boarding) : lerp(0.9, 0.54, departure);
  const avatarOpacity = clamp(1 - Math.max(0, departure - 0.84) / 0.16);
  setTransform(
    avatar,
    `translate3d(calc(-50% + ${avatarX.toFixed(2)}vw), ${avatarY.toFixed(
      1,
    )}px, 0) scale(${avatarScale.toFixed(3)})`,
  );
  avatar.style.opacity = avatarOpacity.toFixed(3);
  avatar.style.clipPath = `inset(0 0 ${(boarding * 32).toFixed(1)}% 0)`;

  const cameraX = Math.sin(progress * Math.PI * 2) * (progress < 0.43 ? 2 : 8);
  setTransform(camera, `translate3d(${cameraX.toFixed(2)}px, 0, 0)`);
  setTransform(
    destination,
    `translate(-50%, -50%) translateZ(${(-540 + departure * 330).toFixed(
      1,
    )}px) scale(${(0.78 + departure * 0.34).toFixed(3)})`,
  );
  world.style.setProperty("--travel-parallax", progress.toFixed(4));
};

const setWhirlwindPosition = (elements, progress) => {
  const { camera, world, avatar, spirals, particles, target } = elements;
  const spin = progress * Math.PI * 12;
  const flight = smooth((progress - 0.18) / 0.82);
  const launch = smooth((progress - 0.36) / 0.64);

  const wobble = Math.sin(progress * Math.PI * 8) * (8 + flight * 22);

  // Camera and world drift at different rates, giving the vortex genuine
  // depth/parallax instead of a single flat rotation.
  setTransform(
    camera,
    `translate3d(${(Math.sin(spin * 0.22) * 11).toFixed(1)}px, ${(
      Math.cos(spin * 0.17) * 8
    ).toFixed(1)}px, 0) rotateZ(${(Math.sin(spin * 0.08) * 1.8).toFixed(
      2,
    )}deg)`,
  );
  setTransform(
    world,
    `translate3d(${(Math.sin(spin * 0.13) * 28).toFixed(1)}px, ${(
      Math.cos(spin * 0.19) * 18
    ).toFixed(1)}px, ${(Math.sin(spin * 0.11) * 100).toFixed(
      1,
    )}px) rotateZ(${(progress * 8).toFixed(2)}deg)`,
  );

  const avatarX = Math.sin(spin * 0.91) * (18 + flight * 62) + launch * 28;
  const avatarY = Math.cos(spin * 1.07) * (10 + flight * 45) - launch * 80;
  const avatarScale = lerp(1, 0.56, launch) + Math.sin(spin) * 0.035;
  const avatarOpacity = clamp(1 - Math.max(0, launch - 0.9) / 0.1);
  setTransform(
    avatar,
    `translate3d(calc(-50% + ${avatarX.toFixed(1)}px), ${avatarY.toFixed(
      1,
    )}px, 0) rotateZ(${(progress * 1_080 + Math.sin(spin * 0.6) * 18).toFixed(
      1,
    )}deg) rotateY(${(Math.sin(spin * 0.8) * 22).toFixed(
      1,
    )}deg) scale(${avatarScale.toFixed(3)})`,
  );
  avatar.style.opacity = avatarOpacity.toFixed(3);

  spirals.forEach((spiral, index) => {
    const offset = index / Math.max(1, spirals.length);
    const radius = 90 + index * 28 + flight * 38;
    const angle = spin * (0.62 + index * 0.035) + offset * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.56;
    const z = -460 + index * 74 + Math.sin(angle * 0.7) * 80 + flight * 260;
    const scale = 0.55 + index * 0.035 + flight * 0.3;
    setTransform(
      spiral,
      `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(
        1,
      )}px) rotateZ(${((angle * 180) / Math.PI + 90).toFixed(1)}deg) scale(${scale.toFixed(
        3,
      )})`,
    );
    spiral.style.opacity = (0.32 + (1 - index / spirals.length) * 0.56).toFixed(
      3,
    );
  });

  particles.forEach((particle, index) => {
    const orbit = index / Math.max(1, particles.length);
    const angle = spin * (0.35 + (index % 5) * 0.08) + orbit * Math.PI * 2;
    const radius = 80 + (index % 6) * 54 + flight * 130;
    const x = Math.cos(angle) * radius + wobble;
    const y = Math.sin(angle * 1.12) * radius * 0.62;
    const z = -360 + (index % 8) * 75 + flight * 310;
    setTransform(
      particle,
      `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(
        1,
      )}px) rotate(${((angle * 180) / Math.PI).toFixed(1)}deg)`,
    );
    particle.style.opacity = (0.3 + (index % 4) * 0.17).toFixed(3);
  });
  target.style.opacity = (0.25 + launch * 0.75).toFixed(3);
  target.style.transform = `translate(-50%, -50%) translateZ(${(
    -620 +
    launch * 380
  ).toFixed(1)}px) scale(${(0.7 + launch * 0.45).toFixed(3)})`;
};

const appendCarriageScene = (world, image) => {
  const destination = createElement("div", "travel-destination");
  destination.setAttribute("aria-hidden", "true");
  if (image) {
    destination.style.backgroundImage = `linear-gradient(0deg, #0d0b1dcc, transparent), url("${encodeURI(
      image,
    )}")`;
    destination.style.backgroundSize = "cover";
    destination.style.backgroundPosition = "center";
  }

  const carriage = createElement("div", "travel-carriage");
  carriage.setAttribute("aria-hidden", "true");
  const roof = createElement("div", "travel-carriage-roof");
  const body = createElement("div", "travel-carriage-body");
  const windowLeft = createElement(
    "span",
    "travel-carriage-window travel-carriage-window-left",
  );
  const windowRight = createElement(
    "span",
    "travel-carriage-window travel-carriage-window-right",
  );
  const step = createElement("div", "travel-carriage-step");
  body.append(windowLeft, windowRight, step);
  const wheels = ["left", "right"].map((side) => {
    const wheel = createElement("span", `travel-wheel travel-wheel-${side}`);
    wheel.setAttribute("aria-hidden", "true");
    return wheel;
  });
  const lanterns = ["left", "right"].map((side) => {
    const lantern = createElement(
      "span",
      `travel-lantern travel-lantern-${side}`,
    );
    lantern.setAttribute("aria-hidden", "true");
    return lantern;
  });
  carriage.append(roof, body, ...wheels, ...lanterns);

  const track = createElement("div", "travel-carriage-track");
  track.setAttribute("aria-hidden", "true");
  world.append(destination, track, carriage);
  return { carriage, destination };
};

const appendWhirlwindScene = (world, destinationText) => {
  const target = createElement("div", "travel-whirlwind-target");
  target.setAttribute("aria-hidden", "true");
  target.dataset.target = destinationText;
  const targetRing = createElement("span", "travel-target-ring");
  target.append(targetRing);

  const vortex = createElement("div", "travel-vortex");
  vortex.setAttribute("aria-hidden", "true");
  const spirals = [];
  for (let index = 0; index < 8; index += 1) {
    const spiral = createElement("span", "travel-spiral");
    spiral.style.setProperty("--travel-spiral-index", String(index));
    spiral.setAttribute("aria-hidden", "true");
    vortex.append(spiral);
    spirals.push(spiral);
  }

  const particles = [];
  for (let index = 0; index < 22; index += 1) {
    const particle = createElement("i", "travel-particle");
    particle.style.setProperty("--travel-particle-index", String(index));
    particle.style.setProperty(
      "--travel-particle-size",
      `${4 + (index % 3) * 2}px`,
    );
    particle.setAttribute("aria-hidden", "true");
    vortex.append(particle);
    particles.push(particle);
  }
  world.append(target, vortex);
  return { target, spirals, particles };
};

/**
 * Play the travel vignette and resolve after its overlay/listeners are gone.
 * `mode: "carriage"` is the correct-destination journey; `"whirlwind"`
 * visibly tumbles the avatar toward the selected wrong destination.
 */
export async function playTravel({
  from = "",
  to = "",
  equipped = {},
  characterId,
  image,
  mode = "carriage",
} = {}) {
  if (typeof document === "undefined" || !document.body) return;

  const source = asText(from, "출발지");
  const destination = asText(to, "다음 방");
  const travelMode = mode === "whirlwind" ? "whirlwind" : "carriage";
  const overlay = createElement(
    "div",
    `travel-overlay travel-overlay--${travelMode}`,
  );
  overlay.dataset.mode = travelMode;
  overlay.dataset.target = destination;
  const headingId = `travel-heading-${++travelSequence}`;
  const statusId = `travel-status-${travelSequence}`;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", headingId);
  overlay.setAttribute("aria-describedby", statusId);
  overlay.tabIndex = -1;

  const scene = createElement("div", "travel-scene");
  scene.setAttribute("aria-hidden", "true");
  const camera = createElement("div", "travel-camera");
  const world = createElement("div", `travel-world travel-${travelMode}-world`);
  const avatar = createElement("div", "travel-avatar");
  avatar.setAttribute("aria-hidden", "true");
  avatar.innerHTML = avatarMarkup(equipped, characterId);

  const elements = { camera, world, avatar };
  if (travelMode === "carriage") {
    Object.assign(elements, appendCarriageScene(world, image));
  } else {
    Object.assign(elements, appendWhirlwindScene(world, destination));
  }
  camera.append(world);
  scene.append(camera, avatar);

  const hud = createElement("section", "travel-hud");
  const eyebrow = createElement("p", "travel-eyebrow");
  eyebrow.textContent =
    travelMode === "carriage" ? "마법 마차 이동" : "돌풍 이동";
  const heading = createElement("h2", "travel-heading");
  heading.id = headingId;
  heading.textContent =
    travelMode === "carriage"
      ? "마법 마차가 목적지로 출발합니다"
      : "돌풍이 엉뚱한 곳으로 날려 보내요";
  const route = createElement("p", "travel-route");
  const routeFrom = createElement("span", "travel-route-point");
  routeFrom.textContent = source;
  const routeArrow = createElement("span", "travel-route-arrow");
  routeArrow.setAttribute("aria-hidden", "true");
  routeArrow.textContent = "→";
  const routeTo = createElement("span", "travel-route-point");
  routeTo.textContent = destination;
  route.append(routeFrom, routeArrow, routeTo);

  const targetLabel = createElement("p", "travel-target-label");
  targetLabel.textContent =
    travelMode === "whirlwind"
      ? `돌풍 목적지 · ${destination}`
      : `도착 목적지 · ${destination}`;
  targetLabel.setAttribute("data-travel-target", destination);

  const progressTrack = createElement("div", "travel-progress-track");
  const progressBar = createElement("div", "travel-progress-bar");
  progressTrack.append(progressBar);
  progressTrack.setAttribute("role", "progressbar");
  progressTrack.setAttribute("aria-label", "이동 진행률");
  progressTrack.setAttribute("aria-valuemin", "0");
  progressTrack.setAttribute("aria-valuemax", "100");
  progressTrack.setAttribute("aria-valuenow", "0");
  const status = createElement("p", "travel-status");
  status.id = statusId;
  status.setAttribute("aria-live", "polite");
  status.textContent =
    travelMode === "carriage" ? "마차를 부르는 중…" : "바람이 모이는 중…";

  const skip = createElement("button", "travel-skip");
  skip.type = "button";
  skip.textContent = "건너뛰기";
  skip.setAttribute("aria-label", "이동 장면 건너뛰고 도착하기");
  hud.append(eyebrow, heading, route, targetLabel, progressTrack, status, skip);
  overlay.append(scene, hud);

  const previousFocus = document.activeElement;
  const background = Array.from(document.body.children).map((element) => ({
    element,
    inert: element.inert,
  }));
  const previousOverflow = document.body.style.overflow;
  background.forEach(({ element }) => {
    element.inert = true;
  });
  document.body.style.overflow = "hidden";
  document.body.append(overlay);

  let animationFrame = null;
  let reducedMotionTimer = null;
  let completed = false;
  const fallbackFrame = (callback) =>
    setTimeout(() => callback(Date.now()), 16);
  const requestFrame =
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function"
      ? (callback) => window.requestAnimationFrame(callback)
      : fallbackFrame;
  const cancelFrame = (frame) => {
    if (
      typeof window !== "undefined" &&
      typeof window.cancelAnimationFrame === "function"
    ) {
      window.cancelAnimationFrame(frame);
    } else {
      clearTimeout(frame);
    }
  };

  const restoreFocus = () => {
    if (
      previousFocus &&
      typeof previousFocus.focus === "function" &&
      (typeof previousFocus.isConnected !== "boolean" ||
        previousFocus.isConnected)
    ) {
      try {
        previousFocus.focus({ preventScroll: true });
      } catch {
        previousFocus.focus();
      }
    }
  };

  return new Promise((resolve) => {
    const cleanup = () => {
      if (animationFrame !== null) cancelFrame(animationFrame);
      if (reducedMotionTimer !== null) clearTimeout(reducedMotionTimer);
      document.removeEventListener("keydown", onKeyDown);
      skip.removeEventListener("click", finish);
      if (
        typeof window !== "undefined" &&
        typeof window.removeEventListener === "function"
      ) {
        window.removeEventListener("resize", updateViewport);
      }
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      background.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      document.body.style.overflow = previousOverflow;
      restoreFocus();
    };

    const finish = () => {
      if (completed) return;
      completed = true;
      cleanup();
      resolve();
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
      } else if (event.key === "Tab") {
        // The skip button is the only interactive control in this dialog.
        event.preventDefault();
        try {
          skip.focus({ preventScroll: true });
        } catch {
          skip.focus();
        }
      }
    };

    const updateViewport = () => {
      if (typeof window === "undefined") return;
      scene.style.setProperty(
        "--travel-viewport-width",
        `${Math.max(1, window.innerWidth || 1)}px`,
      );
      scene.style.setProperty(
        "--travel-viewport-height",
        `${Math.max(1, window.innerHeight || 1)}px`,
      );
    };

    const updateProgress = (progress) => {
      const percentage = Math.round(progress * 100);
      progressBar.style.width = `${percentage}%`;
      progressTrack.setAttribute("aria-valuenow", String(percentage));
      let announcement;
      if (travelMode === "carriage") {
        announcement =
          percentage < 23
            ? "마법 마차가 도착하는 중…"
            : percentage < 43
              ? "마차에 올라타는 중…"
              : percentage < 92
                ? `${destination}(으)로 마차가 출발했습니다.`
                : `${destination}에 마차가 도착하는 중…`;
        setCarriagePosition(elements, progress);
      } else {
        announcement =
          percentage < 18
            ? "바람이 모이는 중…"
            : percentage < 38
              ? "빙글빙글! 돌풍이 아바타를 들어 올려요."
              : percentage < 92
                ? `${destination}(으)로 돌풍이 날아가는 중…`
                : `${destination} 근처로 휙 날아왔어요!`;
        setWhirlwindPosition(elements, progress);
      }
      if (status.textContent !== announcement)
        status.textContent = announcement;
    };

    skip.addEventListener("click", finish);
    document.addEventListener("keydown", onKeyDown);
    updateViewport();
    if (
      typeof window !== "undefined" &&
      typeof window.addEventListener === "function"
    ) {
      window.addEventListener("resize", updateViewport, { passive: true });
    }

    const reducedMotion = hasReducedMotion();
    if (reducedMotion) {
      overlay.classList.add("travel-overlay--reduced");
      updateProgress(1);
      avatar.style.opacity = "1";
      status.textContent = `동작을 줄여 ${destination}까지 짧게 이동했습니다.`;
      reducedMotionTimer = setTimeout(finish, 260);
    } else {
      let startedAt = null;
      const animate = (now) => {
        if (completed) return;
        if (startedAt === null) startedAt = now;
        const progress = clamp((now - startedAt) / TRAVEL_DURATION);
        updateProgress(progress);
        if (progress >= 1) {
          finish();
          return;
        }
        animationFrame = requestFrame(animate);
      };
      updateProgress(0);
      animationFrame = requestFrame(animate);
    }

    if (typeof skip.focus === "function") {
      try {
        skip.focus({ preventScroll: true });
      } catch {
        skip.focus();
      }
    }
  });
}
