import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronsDown,
  Copy,
  ExternalLink,
  Facebook,
  Home,
  List,
  Maximize2,
  Minimize2,
  Search,
  ToggleRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditModeDependentGroup } from '@/components/guide/EditModeDependentGroup';
import { ChoiceOptions } from '@/components/guide/ChoiceOptions';
import { EditModeToggle } from '@/components/guide/EditModeToggle';
import { FlowSteps, NumberedStepRow } from '@/components/guide/FlowSteps';
import { TwoPathBranch } from '@/components/guide/TwoPathBranch';
import {
  collectSlideScreenshots,
  imageUrl,
  LightboxImage,
  ScreenshotCard,
  type LightboxState,
} from '@/components/guide/screenshots';
import { cn } from '@/lib/utils';
import {
  exitFullscreenNow,
  fullscreenElement,
  FULLSCREEN_CHANGE_EVENTS,
  isFullscreenSupported,
  requestFullscreenNow,
} from '@/lib/fullscreen';
import { isDistrictEmbedMode, notifyDistrictParentOfGuideLocation } from '@/lib/embed';
import {
  FIRST_GUIDE_SLIDE_ID,
  EDIT_MODE_DEPENDENCY_LABEL,
  GUIDE_ATTRIBUTION,
  GUIDE_SECTIONS,
  GUIDE_TOPICS,
  PUBLISHED_GUIDE_SLIDES,
  slideSearchText,
  type GuideSlide,
} from '@/data/guideDeck';

type Panel = 'menu' | 'search' | null;

function getSlideIndexFromUrl(): number {
  if (typeof window === 'undefined') return 0;
  const slideId = new URLSearchParams(window.location.search).get('slide');
  const index = PUBLISHED_GUIDE_SLIDES.findIndex((slide) => slide.id === slideId);
  return index >= 0 ? index : 0;
}

function SlideContent({
  slide,
  onOpenScreenshot,
  onStart,
  onJumpToSlide,
}: {
  slide: GuideSlide;
  onOpenScreenshot: (state: LightboxState) => void;
  onStart: () => void;
  onJumpToSlide: (slideId: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink(href: string) {
    // Success feedback only when the copy really happened.
    let ok = false;
    try {
      await navigator.clipboard.writeText(href);
      ok = true;
    } catch {
      // Clipboard API can be blocked (e.g. embedded views); fall back to the
      // selection-based copy, which works inside a user gesture.
      const helper = document.createElement('textarea');
      helper.value = href;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      helper.remove();
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  if (slide.cover) {
    return (
      <div className="relative flex min-h-full flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
        {/* The glows hang past the cover's edges on purpose. Left loose they are
            clipped from sight but still counted in the cover's scrollHeight — 128px
            of phantom height that made the cover read as overflowing on a short
            laptop screen (REQ-PRESENTATION-001). Their own clipped layer keeps the
            look and gives the cover back its true height. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-36 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-800/25 to-transparent" />
        </div>

        <div className="relative z-10 w-full border-b border-amber-300/50 bg-slate-950/88 px-4 py-4 text-center shadow-[0_12px_36px_rgba(0,0,0,0.24)] sm:px-8 sm:py-5">
          <p className="text-[clamp(1.05rem,2vw,1.65rem)] font-black leading-tight text-amber-200">
            {GUIDE_ATTRIBUTION.district}
          </p>
          <p className="mt-1.5 text-[clamp(.95rem,1.5vw,1.25rem)] font-bold leading-relaxed text-white">
            {GUIDE_ATTRIBUTION.site}
          </p>
          {/* The owner's page, in one source (REQ-CONTENT-010). */}
          <a
            href={GUIDE_ATTRIBUTION.follow.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-3.5 inline-flex items-center gap-2.5 rounded-full border border-sky-300/80 bg-gradient-to-b from-sky-400 to-sky-700 px-5 py-2.5 text-sm font-black text-white shadow-[0_10px_26px_rgba(2,132,199,0.55),0_2px_0_rgba(255,255,255,0.35)_inset,0_-3px_10px_rgba(3,49,89,0.55)_inset] ring-2 ring-sky-200/40 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(56,189,248,0.75),0_2px_0_rgba(255,255,255,0.45)_inset] hover:brightness-110 active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 sm:text-base"
          >
            <Facebook aria-hidden="true" className="h-5 w-5 drop-shadow-[0_1px_2px_rgba(2,44,80,0.6)]" />
            {GUIDE_ATTRIBUTION.follow.label}
          </a>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-5 text-center sm:px-10 sm:py-7 lg:px-16">
          <div className="mb-3 flex justify-center sm:mb-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-300/30 blur-2xl" />
              <picture className="relative block">
                <source type="image/webp" srcSet={`${import.meta.env.BASE_URL}guide/jerusalem-math-logo.webp`} />
                <img
                  src={`${import.meta.env.BASE_URL}guide/jerusalem-math-logo.png`}
                  alt="יחידת מתמטיקה — מחוז ירושלים והעיר ירושלים"
                  width={512}
                  height={512}
                  className="h-24 w-24 animate-[spin_14s_linear_infinite] rounded-full bg-white object-contain p-2 shadow-[0_14px_45px_rgba(0,0,0,0.48)] ring-4 ring-amber-300/80 sm:h-32 sm:w-32 lg:h-36 lg:w-36"
                />
              </picture>
            </div>
          </div>

          <p className="text-sm font-black text-amber-300 sm:text-base">{slide.eyebrow}</p>

          <div className="mt-3 w-full max-w-5xl rounded-[28px] border border-white/20 bg-slate-950/55 px-5 py-5 shadow-[0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-sm sm:px-9 sm:py-6">
            <h1 className="font-display text-4xl font-black leading-tight text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.72)] sm:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
            {slide.summary && (
              <p className="mx-auto mt-3 max-w-3xl text-base font-semibold leading-relaxed text-slate-50 sm:text-lg lg:text-xl">
                {slide.summary}
              </p>
            )}
          </div>

          <div className="mt-5 flex justify-center">
            <Button
              size="lg"
              onClick={onStart}
              className="h-16 min-w-44 gap-3 rounded-2xl bg-amber-400 px-10 text-xl font-black text-slate-950 shadow-[0_16px_38px_rgba(251,191,36,0.22),0_8px_22px_rgba(0,0,0,0.28)] hover:bg-amber-300"
            >
              <List className="h-6 w-6" />
              התחל
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasScreenshots = Boolean(slide.screenshots?.length);
  const flow = slide.flow ?? [];
  const hasFlow = flow.length > 0;
  const hasBranch = Boolean(slide.branch);
  const hasChoice = Boolean(slide.choice);
  // Only a slide with an explicit, relevant link shows the link row — no generic
  // „פתיחת Moodle" button on concept slides that don't point anywhere specific.
  const link = slide.link;
  // When a flow step already carries the link inline, don't repeat it as a big CTA
  // button — keep only "copy", centered under the step so the row lines up with the
  // flow's centered down-arrow. The inline link is then the one the row copies.
  const inlineFlowLink = flow.find((step) => step.link)?.link;
  const flowHasInlineLink = Boolean(inlineFlowLink);
  const copyHref = link?.href ?? inlineFlowLink?.href;

  const linkRow = copyHref ? (
    <div className={cn('flex flex-wrap items-center gap-3 pt-1', flowHasInlineLink && 'justify-center')}>
      {link && !flowHasInlineLink && (
        <Button
          asChild
          size="lg"
          className="h-12 gap-2 rounded-2xl bg-slate-950 px-6 font-black text-white shadow-[0_12px_28px_rgba(15,23,42,0.20)] hover:bg-blue-900"
        >
          <a href={link.href} target="_blank" rel="noopener noreferrer">
            {link.label}
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      )}
      <Button
        size="lg"
        variant="outline"
        onClick={() => void copyLink(copyHref)}
        aria-label="העתקת הקישור"
        className="h-12 gap-2 rounded-2xl border-slate-300 bg-white/80 px-5 font-black text-slate-700 hover:bg-slate-100"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        {copied ? 'הקישור הועתק' : 'העתקת הקישור'}
      </Button>
    </div>
  ) : null;

  return (
    <div className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_0%_100%,rgba(251,191,36,0.12),transparent_28%),linear-gradient(180deg,#ffffff,#f8fafc)] p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />

      <div
        className={cn(
          'relative z-10 mx-auto grid min-h-full gap-6 lg:gap-8',
          // A flow slide reads top-to-bottom: title pinned to the top, one column.
          // A branch slide needs the width for two side-by-side lanes.
          hasBranch
            ? 'max-w-[1400px] content-start'
            : hasFlow || hasChoice
              ? 'max-w-[1080px] content-start'
              : hasScreenshots
                ? 'max-w-[1540px] content-center lg:grid-cols-[0.72fr_1.28fr]'
                : 'max-w-5xl content-center'
        )}
      >
        <div
          className={cn(
            'flex min-w-0 flex-col',
            hasFlow || hasBranch || hasChoice ? 'justify-start' : 'justify-center'
          )}
        >
          {/* The attribution card lives on the cover; repeating it here pushed the
              slide title down, so the title now starts at the top. */}
          <header>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {slide.eyebrow && (
                <div className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-800 shadow-sm">
                  {slide.eyebrow}
                </div>
              )}
              {slide.requiresEditMode && (
                <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-900 shadow-sm">
                  <ToggleRight aria-hidden="true" className="h-4 w-4" />
                  {EDIT_MODE_DEPENDENCY_LABEL}
                </div>
              )}
            </div>
            <h1 className="font-display text-[clamp(2rem,4.3vw,4.4rem)] font-black leading-[1.02] tracking-tight text-slate-950">
              {slide.title}
            </h1>
            {slide.summary && (
              <p className="mt-4 max-w-3xl text-base font-bold leading-relaxed text-slate-600 sm:text-lg lg:text-xl">
                {slide.summary}
              </p>
            )}
          </header>

          <div className="mt-5 grid gap-4">
            {slide.steps && slide.steps.length > 0 && (
              <section aria-label="שלבי הפעולה">
                <ol className="grid gap-2.5">
                  {slide.steps.map((step, index) => (
                    <li key={`${slide.id}-${index}`}>
                      <NumberedStepRow index={index}>{step}</NumberedStepRow>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {slide.points && slide.points.length > 0 && (
              <section aria-label="נקודות חשובות">
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {slide.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-white/88 px-3.5 py-3 shadow-sm backdrop-blur"
                    >
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <span className="text-sm font-black leading-relaxed text-slate-700 sm:text-base">{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {slide.indexCards && slide.indexCards.length > 0 && (
              // An index slide's cards are navigation: each one opens the slide
              // that teaches that button (REQ-GUIDE-011).
              <section aria-label="הכפתורים הראשיים">
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {slide.indexCards.map((card) => (
                    <li key={card.slideId}>
                      <button
                        type="button"
                        onClick={() => onJumpToSlide(card.slideId)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/88 px-3.5 py-3 text-right text-sm font-black leading-relaxed text-slate-800 shadow-sm backdrop-blur transition hover:border-blue-400 hover:bg-blue-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/70 sm:text-base"
                      >
                        <span>{card.label}</span>
                        <ChevronLeft aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-600" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {slide.tip && (
              <aside className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-black leading-relaxed text-amber-950 sm:text-base">
                <span className="ml-2">טיפ:</span>
                {slide.tip}
              </aside>
            )}

            {slide.warning && (
              <aside className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black leading-relaxed text-rose-950 sm:text-base">
                <span className="ml-2">חשוב:</span>
                {slide.warning}
              </aside>
            )}

            {!hasFlow && linkRow}

            {hasFlow && (
              <section aria-label="רצף הפעולות" className="mt-2">
                <FlowSteps
                  idPrefix={slide.id}
                  slideTitle={slide.title}
                  flow={flow}
                  onOpenScreenshot={onOpenScreenshot}
                  afterFirstStep={linkRow}
                  numbered={flow.length > 1}
                />
              </section>
            )}

            {slide.choice && (
              <ChoiceOptions
                slideTitle={slide.title}
                choice={slide.choice}
                onOpenScreenshot={onOpenScreenshot}
              />
            )}

            {slide.branch && (
              <TwoPathBranch
                idPrefix={slide.id}
                slideTitle={slide.title}
                branch={slide.branch}
                onOpenScreenshot={onOpenScreenshot}
              />
            )}

            {slide.editModeTeachingToggle && <EditModeToggle />}

            {slide.editModeGroup && <EditModeDependentGroup onSelect={onJumpToSlide} />}
          </div>
        </div>

        {hasScreenshots && (
          <div
            className={cn(
              'grid content-center gap-5 lg:py-2',
              (slide.screenshots?.length ?? 0) > 1 ? 'md:grid-cols-2' : 'grid-cols-1'
            )}
          >
            {slide.screenshots?.map((screenshot) => (
              <div key={screenshot.src}>
                <ScreenshotCard
                  screenshot={screenshot}
                  slideTitle={slide.title}
                  onOpen={onOpenScreenshot}
                />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default function Guide() {
  const reducedMotion = Boolean(useReducedMotion());
  const embeddedMode = isDistrictEmbedMode();
  const [currentIndex, setCurrentIndex] = useState(getSlideIndexFromUrl);
  const [panel, setPanel] = useState<Panel>(null);
  const [query, setQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Read once on mount: it never changes for a given browser, and reading it
  // during render would read the DOM from inside a render pass.
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  useEffect(() => setFullscreenSupported(!embeddedMode && isFullscreenSupported()), [embeddedMode]);
  const [direction, setDirection] = useState(1);
  const [lightbox, setLightbox] = useState<LightboxState>(null);
  // Which chapter is expanded in the table of contents. The menu lists only the
  // chapter headings; a chapter reveals its topics and questions when opened.
  const [openSection, setOpenSection] = useState<string | null>(null);
  const slideRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number | null>(null);
  const hasMountedSlide = useRef(false);

  const attachSlide = useCallback((node: HTMLElement | null) => {
    slideRef.current = node;
    node?.scrollTo({ top: 0 });
  }, []);

  const slide = PUBLISHED_GUIDE_SLIDES[currentIndex] ?? PUBLISHED_GUIDE_SLIDES[0];
  // The cover is an entry gate: its single CTA opens the table of contents so the
  // reader picks a chapter first, so the duplicated chrome (footer next/prev,
  // header home, section label) stays hidden there.
  const isCover = Boolean(slide.cover);
  const sequence = useMemo(() => PUBLISHED_GUIDE_SLIDES.map((item) => item.id), []);
  const position = sequence.indexOf(slide.id);
  const canGoPrevious = position > 0;
  const canGoNext = position >= 0 && position < sequence.length - 1;
  const currentSection = GUIDE_SECTIONS.find((section) => section.id === slide.section);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('he');
    if (!normalized) return PUBLISHED_GUIDE_SLIDES.slice(0, 18);

    return PUBLISHED_GUIDE_SLIDES.filter((item) =>
      slideSearchText(item).toLocaleLowerCase('he').includes(normalized)
    );
  }, [query]);

  function writeUrl(slideId: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('slide', slideId);
    window.history.pushState({}, '', url);
  }

  function jumpToSlide(slideId: string) {
    const index = PUBLISHED_GUIDE_SLIDES.findIndex((item) => item.id === slideId);
    if (index < 0) return;

    setDirection(index >= currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setPanel(null);
    setQuery('');
    writeUrl(slideId);
  }

  function goBy(delta: number) {
    if (position < 0) return;
    const nextId = sequence[position + delta];
    if (!nextId) return;
    // No setDirection here: jumpToSlide derives the same value from the target
    // index a line later, and setting it twice only invites the two to disagree.
    jumpToSlide(nextId);
  }

  async function toggleFullscreen() {
    if (!isFullscreenSupported()) return;
    if (fullscreenElement()) await exitFullscreenNow();
    else await requestFullscreenNow();
  }


  useEffect(() => {
    const onPopState = () => {
      const nextIndex = getSlideIndexFromUrl();
      setDirection(nextIndex >= currentIndex ? 1 : -1);
      setCurrentIndex(nextIndex);
      setPanel(null);
      setLightbox(null);
    };
    const onFullscreenChange = () => setIsFullscreen(Boolean(fullscreenElement()));

    window.addEventListener('popstate', onPopState);
    for (const type of FULLSCREEN_CHANGE_EVENTS) document.addEventListener(type, onFullscreenChange);
    return () => {
      window.removeEventListener('popstate', onPopState);
      for (const type of FULLSCREEN_CHANGE_EVENTS) document.removeEventListener(type, onFullscreenChange);
    };
  }, [currentIndex]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // AnimatePresence mode="wait" holds the outgoing slide until its exit finishes, so
  // the incoming article is not in the document when this effect first runs. Focusing
  // too early lands on nothing and keyboard focus falls back to <body> on every move.
  // Wait for the new node to actually be connected, then move focus onto it.
  useEffect(() => {
    if (!hasMountedSlide.current) {
      hasMountedSlide.current = true;
      return;
    }

    let frame = 0;
    let attempts = 0;
    const focusSlide = () => {
      // During the exit animation slideRef still points at the OUTGOING article, which
      // is also still connected. Only the node tagged with the current slide id is the
      // one that will survive.
      const node = slideRef.current;
      if (node?.isConnected && node.dataset.slideId === slide.id) {
        node.focus({ preventScroll: true });
        return;
      }
      if (attempts < 240) {
        attempts += 1;
        frame = requestAnimationFrame(focusSlide);
      }
    };

    frame = requestAnimationFrame(focusSlide);
    return () => cancelAnimationFrame(frame);
  }, [slide.id]);

  useEffect(() => {
    document.title = `${slide.title} | מדריך Moodle למורים`;
    notifyDistrictParentOfGuideLocation();

    // Prefetch the neighbouring slides' screenshots, flow screens included.
    for (const neighbourPosition of [position - 1, position + 1]) {
      const neighbourId = sequence[neighbourPosition];
      if (!neighbourId) continue;
      const neighbour = PUBLISHED_GUIDE_SLIDES.find((item) => item.id === neighbourId);
      const shots = neighbour ? collectSlideScreenshots(neighbour) : [];
      for (const screenshot of shots) {
        const image = new Image();
        image.decoding = 'async';
        image.src = imageUrl(screenshot.src);
      }
    }
  }, [position, sequence, slide.id, slide.title]);

  useEffect(() => {
    if (panel === 'search') window.setTimeout(() => searchInputRef.current?.focus(), 30);
  }, [panel]);

  // Slide numbers for the TOC and search results, matching the footer counter.
  const slideNumberOf = useMemo(() => new Map(sequence.map((id, index) => [id, index + 1])), [sequence]);

  // The TOC lists only the chapter headings; a chapter opens its topics and
  // questions when clicked. Opening the menu starts every chapter collapsed and
  // just scrolls the reader's current chapter into view.
  useEffect(() => {
    if (panel !== 'menu') return;
    setOpenSection(null);
    const frame = requestAnimationFrame(() => {
      document.querySelector('[data-toc-current-section="true"]')?.scrollIntoView({ block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [panel, slide.section]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (event.key === 'Escape') {
        if (lightbox) setLightbox(null);
        else if (panel) setPanel(null);
        else if (fullscreenElement()) void exitFullscreenNow();
        return;
      }
      if (isTyping || panel || lightbox) return;

      if (event.key === 'ArrowLeft' || event.key === 'PageDown') {
        event.preventDefault();
        goBy(1);
      }
      if (event.key === 'ArrowRight' || event.key === 'PageUp') {
        event.preventDefault();
        goBy(-1);
      }
      if (event.key === 'Home') {
        event.preventDefault();
        jumpToSlide(FIRST_GUIDE_SLIDE_ID);
      }
      if (event.key === 'End') {
        event.preventDefault();
        jumpToSlide(sequence[sequence.length - 1]);
      }
      // event.code keeps the shortcuts on the same physical keys under a Hebrew layout,
      // where event.key reports the Hebrew character instead of f/m.
      if (event.key.toLocaleLowerCase() === 'f' || event.code === 'KeyF') {
        event.preventDefault();
        setPanel('search');
      }
      if (event.key.toLocaleLowerCase() === 'm' || event.code === 'KeyM') {
        event.preventDefault();
        setPanel('menu');
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightbox, panel, position, sequence]);

  const progress = position >= 0 ? ((position + 1) / sequence.length) * 100 : 0;
  const transition = reducedMotion
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 170, damping: 24, mass: 0.72 };

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        dir="rtl"
        data-guide-shell="premium-presentation"
        // grid-cols-[minmax(0,1fr)] is load-bearing, not decoration: a grid column
        // defaults to min-content, so the header's intrinsic width stretched the
        // whole shell to 413px inside a 375px phone and pushed 38px of every row —
        // including the „לשקף הבא" control — off the left edge (REQ-PRESENTATION-006).
        className="fixed inset-0 z-[100] grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto] overflow-hidden bg-[radial-gradient(circle_at_50%_-20%,#1d4ed8_0%,#0f172a_46%,#020617_100%)] text-slate-900"
      >
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-white/10 bg-slate-950/30 px-3 text-white backdrop-blur-xl sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            {/* The cover IS the guide's home page (REQ-CONTENT-012), so it carries
                no navigation: a house pointing at the page you are already on, a
                „back" with nothing behind it and a contents button beside „התחל"
                are all noise on the one screen that should read as a cover
                (REQ-PRESENTATION-005). Search and the fullscreen control stay
                everywhere. */}
            {!isCover && (
              <>
                <Button
                  size="icon"
                  aria-label="עמוד הבית"
                  onClick={() => jumpToSlide(FIRST_GUIDE_SLIDE_ID)}
                  className="rounded-xl bg-pink-500 text-white shadow-md ring-1 ring-pink-300/50 hover:bg-pink-600 hover:text-white focus-visible:ring-2 focus-visible:ring-pink-300"
                >
                  <Home className="h-6 w-6" />
                </Button>
                <Button
                  size="icon"
                  aria-label="תוכן העניינים"
                  onClick={() => setPanel('menu')}
                  className="rounded-xl bg-white/10 text-white shadow-md ring-1 ring-white/25 hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <List className="h-6 w-6" />
                </Button>
                <Button
                  size="icon"
                  aria-label="חזרה שלב אחד אחורה"
                  onClick={() => goBy(-1)}
                  disabled={!canGoPrevious}
                  className="rounded-xl bg-amber-400 text-slate-950 shadow-md hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-40"
                >
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" aria-label="חיפוש במצגת" onClick={() => setPanel('search')} className="gap-2 text-white hover:bg-white/10 hover:text-white">
              <Search className="h-5 w-5" />
              <span className="hidden sm:inline">חיפוש</span>
            </Button>
          </div>

          {isCover ? (
            <div className="min-w-0" />
          ) : (
            <div className="min-w-0 text-center">
              <p className="truncate text-xs font-black text-amber-300 sm:text-sm">
                {currentSection?.title ?? 'Moodle'}
              </p>
              <p className="hidden max-w-[48vw] truncate text-xs font-bold text-white/70 sm:block">{slide.title}</p>
            </div>
          )}

          <div className="flex items-center gap-1 sm:gap-2">
            {/* The way out of fullscreen is always on screen while fullscreen is
                possible at all. Where the browser grants it to no element —
                iOS Safari on iPhone — a permanently dead button would be worse
                than none, and the fixed 100dvh shell already fills the screen. */}
            {fullscreenSupported && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void toggleFullscreen()}
                aria-label={isFullscreen ? 'יציאה ממסך מלא' : 'מעבר למסך מלא'}
                className="text-white hover:bg-white/10 hover:text-white"
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </header>

        {/* A live region only announces when it stays mounted and its text changes.
            The slide article is re-created on every navigation, so the announcement
            lives here instead. */}
        <p aria-live="polite" aria-atomic="true" className="sr-only">
          {`${slide.title} — שקף ${position + 1} מתוך ${sequence.length}`}
        </p>

        <main className="relative flex min-h-0 items-center justify-center overflow-hidden p-0 sm:p-3 lg:p-4">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <m.article
              key={slide.id}
              ref={attachSlide}
              data-slide-id={slide.id}
              data-cover={slide.cover ? 'true' : undefined}
              tabIndex={-1}
              aria-label={slide.title}
              custom={direction}
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction * 110, rotateY: direction * -5, scale: 0.985, filter: 'blur(8px)' }
              }
              animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1, filter: 'blur(0px)' }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction * -90, rotateY: direction * 4, scale: 0.99, filter: 'blur(7px)' }
              }
              transition={transition}
              onTouchStart={(event) => {
                touchStartX.current = event.changedTouches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                const start = touchStartX.current;
                const end = event.changedTouches[0]?.clientX;
                touchStartX.current = null;
                if (start == null || end == null) return;
                const distance = end - start;
                if (Math.abs(distance) < 70) return;
                if (distance < 0) goBy(1);
                else goBy(-1);
              }}
              className="h-full w-full overflow-y-auto bg-white shadow-[0_35px_110px_rgba(0,0,0,0.52)] outline-none sm:rounded-[30px] lg:h-auto lg:max-h-full lg:w-[min(96vw,calc((100dvh-148px)*16/9),1660px)] lg:aspect-video"
              style={{ transformPerspective: 1800 }}
            >
              <SlideContent
                slide={slide}
                onOpenScreenshot={setLightbox}
                onStart={() => setPanel('menu')}
                onJumpToSlide={jumpToSlide}
              />
            </m.article>
          </AnimatePresence>
        </main>

        {!isCover && (
        <footer className="grid min-h-[72px] grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-white/10 bg-slate-950/30 px-3 text-white backdrop-blur-xl sm:px-5 lg:px-8">
          <div className="flex justify-start">
            <Button
              variant="ghost"
              onClick={() => goBy(-1)}
              aria-label="לשקף הקודם"
              disabled={!canGoPrevious}
              className="h-11 gap-2 rounded-2xl px-4 font-black text-white hover:bg-white/10 hover:text-white disabled:text-white/25"
            >
              <ArrowRight className="h-5 w-5" />
              <span className="hidden sm:inline">הקודם</span>
            </Button>
          </div>

          <div className="flex min-w-[150px] items-center gap-3 sm:min-w-[320px]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPanel('menu')}
              className="hidden shrink-0 gap-2 rounded-xl font-black text-white hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <List className="h-4 w-4" />
              תוכן
            </Button>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="text-xs font-black text-white/90">{position + 1} מתוך {sequence.length}</div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <m.div
                  className="h-full rounded-full bg-amber-400"
                  animate={{ width: `${progress}%` }}
                  transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 24 }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => goBy(1)}
              aria-label="לשקף הבא"
              disabled={!canGoNext}
              className="h-11 gap-2 rounded-2xl bg-amber-400 px-5 font-black text-slate-950 shadow-lg hover:bg-amber-300 disabled:bg-white/10 disabled:text-white/25"
            >
              <span className="hidden sm:inline">הבא</span>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </footer>
        )}

        <AnimatePresence>
          {panel && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/78 p-3 backdrop-blur-xl sm:p-6"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setPanel(null);
              }}
            >
              <m.section
                role="dialog"
                aria-modal="true"
                aria-label={panel === 'search' ? 'חיפוש במצגת' : 'תוכן העניינים'}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.99 }}
                transition={transition}
                className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl"
              >
                <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
                  <h2 className="text-2xl font-black text-slate-950">{panel === 'menu' ? 'תוכן העניינים' : 'חיפוש'}</h2>
                  <Button variant="ghost" size="icon" onClick={() => setPanel(null)} aria-label="סגירה">
                    <X className="h-6 w-6" />
                  </Button>
                </header>

                {panel === 'menu' ? (
                  <>
                  <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="grid gap-3">
                      {GUIDE_SECTIONS.map((section) => {
                        // The cover is the guide's home page, not a chapter entry
                        // (REQ-CONTENT-012) — the house button leads there.
                        const sectionSlides = PUBLISHED_GUIDE_SLIDES.filter(
                          (item) => item.section === section.id && !item.cover
                        );
                        if (sectionSlides.length === 0) return null;
                        const sectionTopics = GUIDE_TOPICS.filter((topic) => topic.section === section.id);
                        const isOpen = openSection === section.id;
                        const isCurrentSection = section.id === slide.section;
                        return (
                          <div
                            key={section.id}
                            data-toc-current-section={isCurrentSection ? 'true' : undefined}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                          >
                            <h3>
                              <button
                                type="button"
                                onClick={() => setOpenSection((current) => (current === section.id ? null : section.id))}
                                aria-expanded={isOpen}
                                className={cn(
                                  'flex w-full items-center justify-between gap-3 px-5 py-4 text-right transition',
                                  isOpen ? 'bg-blue-800 text-white' : 'bg-slate-50 text-slate-950 hover:bg-blue-50'
                                )}
                              >
                                <span className="flex min-w-0 items-center gap-3">
                                  <span className="text-lg font-black">{section.title}</span>
                                </span>
                                <ChevronsDown
                                  className={cn('h-5 w-5 shrink-0 transition-transform', isOpen ? 'rotate-180' : '')}
                                />
                              </button>
                            </h3>
                            {isOpen && (
                              <div className="px-4 pb-4 pt-1 sm:px-5">
                                {sectionTopics.map((topic) => {
                                  const topicSlides = sectionSlides.filter((item) => item.topic === topic.id);
                                  if (topicSlides.length === 0) return null;
                                  return (
                                    <div key={topic.id} className="mt-3">
                                      <h4 className="border-b border-slate-200 pb-1 text-sm font-black text-blue-800">
                                        {topic.title}
                                      </h4>
                                      <div className="mt-2 grid gap-2">
                                        {topicSlides.map((item) => (
                                          <button
                                            key={item.id}
                                            onClick={() => jumpToSlide(item.id)}
                                            aria-current={item.id === slide.id ? 'page' : undefined}
                                            className={cn(
                                              'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-right text-sm font-bold transition',
                                              item.id === slide.id
                                                ? 'bg-blue-800 text-white shadow-md'
                                                : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-900'
                                            )}
                                          >
                                            <span className="flex min-w-0 items-center gap-2.5">
                                              <span
                                                className={cn(
                                                  'inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-black tabular-nums',
                                                  item.id === slide.id ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800'
                                                )}
                                              >
                                                {slideNumberOf.get(item.id)}
                                              </span>
                                              <span>{item.title}</span>
                                            </span>
                                            <ArrowLeft className="h-4 w-4 shrink-0" />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Way back to the cover, and the owner's page — one source for
                      the follow link (REQ-CONTENT-010). */}
                  <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
                    <Button
                      size="lg"
                      onClick={() => jumpToSlide(FIRST_GUIDE_SLIDE_ID)}
                      className="h-12 gap-2 rounded-2xl bg-amber-400 px-5 font-black text-slate-950 hover:bg-amber-300"
                    >
                      <Home className="h-5 w-5" />
                      חזרה לעמוד השער
                    </Button>
                    <a
                      href={GUIDE_ATTRIBUTION.follow.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 rounded-2xl border border-sky-300/80 bg-gradient-to-b from-sky-400 to-sky-700 px-5 py-2.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(2,132,199,0.45),0_2px_0_rgba(255,255,255,0.35)_inset,0_-3px_10px_rgba(3,49,89,0.5)_inset] ring-2 ring-sky-200/40 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(56,189,248,0.6),0_2px_0_rgba(255,255,255,0.45)_inset] hover:brightness-110 active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 sm:text-base"
                    >
                      <Facebook aria-hidden="true" className="h-5 w-5 drop-shadow-[0_1px_2px_rgba(2,44,80,0.6)]" />
                      {GUIDE_ATTRIBUTION.follow.label}
                    </a>
                  </footer>
                  </>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="border-b border-slate-200 p-5 sm:px-7">
                      <div className="relative">
                        <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                          ref={searchInputRef}
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="חיפוש שאלה, פעולה או כפתור"
                          className="h-14 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pr-12 pl-4 text-base font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
                      <div className="grid gap-2">
                        {searchResults.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => jumpToSlide(item.id)}
                            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-right transition hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                          >
                            <div className="min-w-0">
                              {item.eyebrow && (
                                <p className="text-xs font-black text-blue-700">{item.eyebrow}</p>
                              )}
                              <p className="mt-1 text-base font-black text-slate-950">{item.title}</p>
                            </div>
                            <span className="flex shrink-0 items-center gap-2">
                              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-1 text-[11px] font-black tabular-nums text-blue-800">
                                {slideNumberOf.get(item.id)}
                              </span>
                              <ArrowLeft className="h-5 w-5 text-blue-700" />
                            </span>
                          </button>
                        ))}
                        {searchResults.length === 0 && (
                          <p className="rounded-2xl bg-slate-50 p-6 text-center font-bold text-slate-500">לא נמצאה שאלה מתאימה.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </m.section>
            </m.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {lightbox && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[70] flex items-center justify-center bg-slate-950/92 p-3 backdrop-blur-xl sm:p-6"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setLightbox(null);
              }}
            >
              <m.figure
                role="dialog"
                aria-modal="true"
                aria-label={`צילום בגודל מלא: ${lightbox.screenshot.caption}`}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 14 }}
                transition={transition}
                className="relative flex max-h-[94dvh] w-full max-w-[1600px] flex-col overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-[0_40px_140px_rgba(0,0,0,0.65)]"
              >
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-blue-700">{lightbox.slideTitle}</p>
                    <figcaption className="mt-1 text-sm font-black text-slate-800 sm:text-base">{lightbox.screenshot.caption}</figcaption>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setLightbox(null)} aria-label="סגירת הצילום">
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-100 p-2 sm:p-4">
                  <div className="relative inline-block max-w-full">
                    <LightboxImage
                      key={lightbox.screenshot.src}
                      src={lightbox.screenshot.src}
                      caption={lightbox.screenshot.caption}
                      hotspotIds={lightbox.screenshot.hotspotIds}
                    />
                  </div>
                </div>
              </m.figure>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}

