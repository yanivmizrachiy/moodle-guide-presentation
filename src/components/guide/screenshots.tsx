import { useState } from 'react';
import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { Expand } from 'lucide-react';
import type { GuideScreenshot, GuideSlide } from '@/data/guideDeck';
import { getVisibleGuideHotspots } from '@/data/hotspotPolicy';

/** The one thing a failed capture says, in the card and in the lightbox alike. */
const SHOT_FAILED_TEXT = 'הצילום לא נטען. אין מוצג תחליף.';

/** Lightbox request: which capture to show full-size, under which slide title. */
export type LightboxState = {
  screenshot: GuideScreenshot;
  slideTitle: string;
} | null;

export function imageUrl(src: string) {
  return `${import.meta.env.BASE_URL}guide/screenshots/${src}`;
}

/**
 * The deck normalizes every capture to .avif, but a WebP sibling ships for all of them
 * and the audit enforces that. Serving AVIF alone left every screenshot blank on a
 * browser without AVIF support, so offer the WebP as a real fallback.
 */
function screenshotSources(src: string) {
  const webp = src.replace(/\.[^.]+$/, '.webp');
  return { avif: imageUrl(src), webp: imageUrl(webp) };
}

/**
 * Every screenshot a slide can show, whatever shape carries it: the classic
 * array, flow steps, and both paths of a two-path branch. The canonical
 * enumerator for app-side work such as neighbour preloading.
 */
export function collectSlideScreenshots(slide: GuideSlide): GuideScreenshot[] {
  return [
    ...(slide.screenshots ?? []),
    ...(slide.flow ?? []).flatMap((step) => (step.screenshot ? [step.screenshot] : [])),
    ...(slide.branch?.paths ?? []).flatMap((path) => [
      ...(path.screenshots ?? []),
      ...(path.flow ?? []).flatMap((step) => (step.screenshot ? [step.screenshot] : [])),
    ]),
    ...(slide.choice?.options ?? []).map((option) => option.screenshot),
  ];
}

/* Red focus is deliberate, not automatic: no hotspotIds means a clean screenshot.
 * A use can request one verified target; the policy helper caps the visible result
 * at one so a page never gets covered in competing red circles. */
/**
 * A capture is shown WHOLE by default, with the red circle and the arrow on the
 * control: the teacher has to see where on the page that control sits, which a
 * close-up destroys. A use may opt into a close-up with `zoom: true` — only for
 * a control that stands alone on an otherwise empty part of the screen.
 */
function focusHotspot(screenshot: GuideScreenshot) {
  if (screenshot.zoom !== true) return null;
  const hotspots = getVisibleGuideHotspots(screenshot.src, screenshot.hotspotIds);
  return hotspots.length === 1 ? hotspots[0] : null;
}

/**
 * How far to magnify a close-up. Deliberately moderate: the control has to be
 * big enough to read, while the surrounding screen stays visible so the teacher
 * still sees WHERE on the page the control sits.
 */
function focusScale(width: number) {
  return Math.min(3.4, Math.max(1.4, 14 / Math.max(width, 0.5)));
}

/**
 * The red arrow that points at the marked control, drawn in its own untilted,
 * fixed-size box so it never inherits the ellipse's non-uniform scaling. It
 * approaches from whichever side of the capture has room, and its tip stops on
 * the edge of the target instead of covering it.
 */
function HotspotArrow({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const fromRight = x + width / 2 <= 55;
  const fromBelow = y + height / 2 <= 55;
  const tip = { x: fromRight ? 14 : 118, y: fromBelow ? 14 : 118 };
  const tail = { x: fromRight ? 124 : 8, y: fromBelow ? 124 : 8 };

  const dx = tip.x - tail.x;
  const dy = tip.y - tail.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const base = { x: tip.x - ux * 34, y: tip.y - uy * 34 };
  const head = [
    `${tip.x},${tip.y}`,
    `${base.x - uy * 15},${base.y + ux * 15}`,
    `${base.x + uy * 15},${base.y - ux * 15}`,
  ].join(' ');

  return (
    <svg
      className="pointer-events-none absolute overflow-visible"
      style={{
        left: `${fromRight ? x + width : x}%`,
        top: `${fromBelow ? y + height : y}%`,
        marginLeft: `-${tip.x}px`,
        marginTop: `-${tip.y}px`,
      }}
      width="132"
      height="132"
      viewBox="0 0 132 132"
    >
      {/* White under-stroke so the arrow stays readable over dark UI too. */}
      <line x1={tail.x} y1={tail.y} x2={base.x} y2={base.y} stroke="#ffffff" strokeWidth="11" strokeLinecap="round" opacity="0.85" />
      <polygon points={head} fill="#ffffff" opacity="0.85" transform="scale(1.18)" transform-origin={`${tip.x} ${tip.y}`} />
      <line x1={tail.x} y1={tail.y} x2={base.x} y2={base.y} stroke="#dc2626" strokeWidth="6.5" strokeLinecap="round" />
      <polygon points={head} fill="#dc2626" />
    </svg>
  );
}

function HotspotLayer({
  src,
  only,
  strokeWidth = 2.8,
}: {
  src: string;
  only?: readonly string[];
  strokeWidth?: number;
}) {
  const hotspots = getVisibleGuideHotspots(src, only);
  if (hotspots.length === 0) return null;

  return (
    <span className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
      {hotspots.map((hotspot) => (
        <HotspotArrow
          key={`${hotspot.id}-arrow`}
          x={hotspot.x}
          y={hotspot.y}
          width={hotspot.width}
          height={hotspot.height}
        />
      ))}
      {hotspots.map((hotspot) => (
        <svg
          key={hotspot.id}
          className="absolute overflow-visible"
          style={{
            left: `${hotspot.x}%`,
            top: `${hotspot.y}%`,
            width: `${hotspot.width}%`,
            height: `${hotspot.height}%`,
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <title>{hotspot.label}</title>
          <ellipse
            cx="50"
            cy="50"
            rx="48"
            ry="43"
            fill="none"
            stroke="#dc2626"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity="0.9"
          />
        </svg>
      ))}
    </span>
  );
}

/** Full-size capture with the same honest failure state as the card. */
export function LightboxImage({
  src,
  caption,
  hotspotIds,
}: {
  src: string;
  caption: string;
  hotspotIds?: readonly string[];
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="flex aspect-video w-full max-w-[900px] items-center justify-center rounded-xl bg-slate-200 px-6 text-center text-sm font-black text-slate-600">
        {SHOT_FAILED_TEXT}
      </span>
    );
  }

  return (
    <>
      <picture>
        <source type="image/avif" srcSet={screenshotSources(src).avif} />
        <img
          src={screenshotSources(src).webp}
          alt={caption}
          onError={() => setFailed(true)}
          className="block max-h-[80dvh] max-w-full rounded-xl bg-white object-contain shadow-lg"
        />
      </picture>
      <HotspotLayer src={src} only={hotspotIds} />
    </>
  );
}

export function ScreenshotCard({
  screenshot,
  slideTitle,
  onOpen,
  hideCaption = false,
  zoomable = false,
}: {
  screenshot: GuideScreenshot;
  slideTitle: string;
  onOpen: (state: LightboxState) => void;
  /** In a flow the step text already labels the screen; skip the caption bar. */
  hideCaption?: boolean;
  /** A flow step honours a capture that explicitly asks for a close-up. */
  zoomable?: boolean;
}) {
  const reducedMotion = Boolean(useReducedMotion());
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateYRaw = useTransform(pointerX, [-0.5, 0.5], [-7, 7]);
  const rotateXRaw = useTransform(pointerY, [-0.5, 0.5], [6, -6]);
  const rotateY = useSpring(rotateYRaw, { stiffness: 210, damping: 24, mass: 0.55 });
  const rotateX = useSpring(rotateXRaw, { stiffness: 210, damping: 24, mass: 0.55 });
  const [failed, setFailed] = useState(false);
  const focus = zoomable ? focusHotspot(screenshot) : null;

  function resetTilt() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return (
    <div className="guide-shot-stage relative min-w-0">
      <m.button
        type="button"
        disabled={failed}
        aria-label={
          failed
            ? `הצילום לא נטען: ${screenshot.caption}`
            : `פתיחת הצילום בגודל מלא: ${screenshot.caption}`
        }
        onClick={() => {
          if (failed) return;
          onOpen({ screenshot, slideTitle });
        }}
        onPointerMove={(event) => {
          if (reducedMotion || event.pointerType === 'touch') return;
          const rect = event.currentTarget.getBoundingClientRect();
          pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
          pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
        }}
        onPointerLeave={resetTilt}
        onPointerCancel={resetTilt}
        whileHover={reducedMotion ? undefined : { y: -8, scale: 1.012 }}
        whileTap={reducedMotion ? undefined : { scale: 0.988 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22, mass: 0.55 }}
        style={
          reducedMotion
            ? undefined
            : {
                rotateX,
                rotateY,
                transformPerspective: 1500,
                transformStyle: 'preserve-3d',
              }
        }
        className="guide-shot-card group relative block w-full rounded-[28px] text-right outline-none focus-visible:ring-4 focus-visible:ring-amber-300/70"
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-5 bottom-[-18px] h-16 rounded-[32px] bg-slate-950/35 blur-2xl transition duration-300 group-hover:bg-blue-950/45"
          style={{ transform: 'translateZ(-36px) scale(.93)' }}
        />

        {/* No resting translateZ: a persistent 3D offset makes the GPU rasterize the
            screenshot and stretch it ~1.6% through the perspective, blurring it. The
            hover tilt on the parent still works; at rest the image stays pixel-perfect. */}
        <span className="guide-shot-surface relative block overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28),0_10px_24px_rgba(15,23,42,0.18)]">
          <span className="flex items-center gap-2 border-b border-slate-200/90 bg-gradient-to-b from-white to-slate-100 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400 shadow-inner" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-inner" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-inner" />
            {!failed && (
              <span className="mr-auto inline-flex items-center gap-1.5 text-[11px] font-black text-slate-500">
                <Expand className="h-3.5 w-3.5" />
                לחצו להגדלה
              </span>
            )}
          </span>

          {failed ? (
            <span className="flex aspect-video items-center justify-center bg-slate-100 px-6 text-center text-sm font-black text-slate-500">
              {SHOT_FAILED_TEXT}
            </span>
          ) : (
            // The inner relative wrapper hugs the painted image, so hotspot
            // percentages land on the real control (w-full letterboxing drifted them).
            <span className="block overflow-hidden bg-white">
              {focus ? (
                // Close-up: the image is magnified and shifted so the marked
                // control sits in the middle of a short frame. The translate
                // percentages are of the image's own box, so this needs no
                // pixel measurements and stays correct at any card width.
                <span
                  className="relative block overflow-hidden bg-white"
                  style={{ height: 'clamp(210px, 36vh, 380px)' }}
                >
                  <span
                    className="absolute left-1/2 top-1/2 block"
                    style={{
                      width: `${focusScale(focus.width) * 100}%`,
                      transform: `translate(-${focus.x + focus.width / 2}%, -${focus.y + focus.height / 2}%)`,
                    }}
                  >
                    <picture>
                      <source type="image/avif" srcSet={screenshotSources(screenshot.src).avif} />
                      <img
                        src={screenshotSources(screenshot.src).webp}
                        alt={screenshot.caption}
                        loading="eager"
                        decoding="async"
                        onError={() => setFailed(true)}
                        className="block w-full bg-white"
                      />
                    </picture>
                    <HotspotLayer src={screenshot.src} only={screenshot.hotspotIds} strokeWidth={4.2} />
                  </span>
                </span>
              ) : (
                <span className="relative mx-auto block w-fit max-w-full">
                  <picture>
                    <source type="image/avif" srcSet={screenshotSources(screenshot.src).avif} />
                    <img
                      src={screenshotSources(screenshot.src).webp}
                      alt={screenshot.caption}
                      loading="eager"
                      decoding="async"
                      onError={() => setFailed(true)}
                      className="block max-h-[53vh] max-w-full bg-white object-contain"
                    />
                  </picture>
                  <HotspotLayer src={screenshot.src} only={screenshot.hotspotIds} />
                </span>
              )}
            </span>
          )}

          {!hideCaption && (
            <span className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm font-black leading-relaxed text-slate-700">
              <span>{screenshot.caption}</span>
            </span>
          )}

          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(115deg, transparent 12%, rgba(255,255,255,.26) 35%, transparent 55%)',
            }}
          />
        </span>
      </m.button>
    </div>
  );
}
