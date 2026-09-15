import { ToggleRight } from 'lucide-react';
import { PUBLISHED_GUIDE_SLIDES } from '@/data/guideDeck';

/**
 * The emphasized visual group of operations that work only while edit mode
 * is on (REQ-CONTENT-004). The list is derived from the published slides
 * flagged requiresEditMode, so the visible grouping is always in sync with
 * the machine signal (REQ-GUIDE-005) — it is never a hand-written copy.
 */
export function EditModeDependentGroup() {
  const dependent = PUBLISHED_GUIDE_SLIDES.filter((slide) => slide.requiresEditMode);
  if (dependent.length === 0) return null;

  return (
    <section
      aria-label="פעולות שאפשר לבצע רק כשמצב העריכה דולק"
      className="rounded-3xl border-2 border-blue-300 bg-blue-50/70 p-4 shadow-[0_16px_44px_rgba(30,64,175,0.10)] sm:p-5"
    >
      <p className="flex items-center gap-2 text-base font-black text-blue-950 sm:text-lg">
        <ToggleRight aria-hidden="true" className="h-6 w-6 shrink-0 text-blue-700" />
        רק כשמצב העריכה דולק
      </p>
      <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {dependent.map((slide) => (
          <li
            key={slide.id}
            className="rounded-2xl border border-blue-200 bg-white/90 px-3.5 py-3 text-sm font-black leading-relaxed text-slate-800 shadow-sm sm:text-base"
          >
            {slide.title}
          </li>
        ))}
      </ul>
    </section>
  );
}
