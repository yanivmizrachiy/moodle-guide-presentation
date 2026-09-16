/**
 * The Fullscreen API, in one place (REQ-PRESENTATION-004, REQ-STABILITY-003).
 *
 * Safari still exposes only the `webkit*` names, so code that called the standard
 * ones alone had no fullscreen at all on a Mac or an iPad. iPhone is the real
 * exception: iOS Safari grants fullscreen to <video> and to nothing else, so
 * `isFullscreenSupported()` is false there — callers hide the control rather than
 * show a dead one, and the guide's fixed 100dvh shell is what fills the screen.
 *
 * This module is the only place that touches the API. The auto-request on first
 * gesture and the manual toggle in the header both come through here, so they can
 * never drift apart on which browsers they serve or which runs they skip.
 */

type WebkitFullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

/** The element currently in fullscreen, under either spelling. */
export function fullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const doc = document as WebkitFullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/** Whether this browser grants fullscreen to a normal element at all. */
export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as WebkitFullscreenDocument;
  const root = document.documentElement as WebkitFullscreenElement;
  return Boolean(
    (doc.fullscreenEnabled && root.requestFullscreen) ||
      (doc.webkitFullscreenEnabled && root.webkitRequestFullscreen)
  );
}

export async function requestFullscreenNow(): Promise<void> {
  const root = document.documentElement as WebkitFullscreenElement;
  if (root.requestFullscreen) await root.requestFullscreen();
  else if (root.webkitRequestFullscreen) await root.webkitRequestFullscreen();
}

export async function exitFullscreenNow(): Promise<void> {
  const doc = document as WebkitFullscreenDocument;
  if (doc.exitFullscreen) await doc.exitFullscreen();
  else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
}

/** Both spellings of the change event, for listeners. */
export const FULLSCREEN_CHANGE_EVENTS = ['fullscreenchange', 'webkitfullscreenchange'] as const;

/**
 * Enter real fullscreen the moment the browser allows it. Browsers refuse
 * requestFullscreen() without a user activation, so the guide spends the FIRST
 * real gesture — a tap, a click or a key — on it, and then stops asking: a
 * teacher who leaves fullscreen must not be dragged back in by their next tap.
 *
 * Automated browsers are excluded. A real fullscreen transition mid-run changes
 * the viewport under Playwright and would make E2E and visual baselines
 * non-deterministic.
 *
 * Returns a cleanup function that disarms the listeners.
 */
export function installFirstInteractionFullscreen(): () => void {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return () => {};
  if (!isFullscreenSupported() || navigator.webdriver) return () => {};

  let pending = false;
  // `pointerdown` is deliberately absent: a drag or a swipe starts with one, and
  // fullscreen should follow a completed interaction.
  const events = ['pointerup', 'touchend', 'keydown'] as const;

  const ask = () => {
    if (pending || fullscreenElement()) return;
    pending = true;
    void requestFullscreenNow()
      .then(stop)
      .catch(() => {
        // A rejected request must NOT end the attempt. Not every gesture carries
        // a usable activation, and a policy can refuse one and allow the next —
        // giving up after a single failure meant the guide silently never went
        // fullscreen at all. Stay armed and take the next gesture.
        pending = false;
      });
  };

  // Once fullscreen is reached the asking is over for this visit — so a teacher
  // who then leaves it is never pulled back in by their next tap.
  const onChange = () => {
    if (fullscreenElement()) stop();
  };

  function stop() {
    pending = false;
    for (const type of events) window.removeEventListener(type, ask, { capture: true });
    for (const type of FULLSCREEN_CHANGE_EVENTS) document.removeEventListener(type, onChange);
  }

  for (const type of events) window.addEventListener(type, ask, { capture: true });
  for (const type of FULLSCREEN_CHANGE_EVENTS) document.addEventListener(type, onChange);
  return stop;
}
