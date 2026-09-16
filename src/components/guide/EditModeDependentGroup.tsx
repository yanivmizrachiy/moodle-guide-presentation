import { ChevronLeft, ToggleRight } from 'lucide-react';
import { EDIT_MODE_DEPENDENCY_LABEL, PUBLISHED_GUIDE_SLIDES } from '@/data/guideDeck';

/**
 * The emphasized visual group of operations that work only while edit mode
 * is on (REQ-CONTENT-004). The list is derived from the published slides
 * flagged requiresEditMode, so the visible grouping is always in sync with
 * the machine signal (REQ-GUIDE-005) — it is never a hand-written copy.
 *
 * Each entry is a real button: pressing it opens that operation's own slide,
 * so the group works as the chapter's index instead of a static list.
 */
export function EditModeDependentGroup({ onSelect }: { onSelect: (slideId: string) => void }) {
  const dependent = PUBLISHED_GUIDE_SLIDES.filter((slide) => slide.requiresEditMode);
  if (dependent.length === 0) return null;

  return (
    <section
      aria-label={`פעולות שאפשר לבצע ${EDIT_MODE_DEPENDENCY_LABEL}`}
      className="rounded-3xl border-2 border-blue-300 bg-blue-50/70 p-4 shadow-[0_16px_44px_rgba(30,64,175,0.10)] sm:p-5"
    >
      <p className="flex items-center gap-2 text-base font-black text-blue-950 sm:text-lg">
        <ToggleRight aria-hidden="true" className="h-6 w-6 shrink-0 text-blue-700" />
        {EDIT_MODE_DEPENDENCY_LABEL}
      </p>
      <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {dependent.map((slide) => (
          <li key={slide.id}>
            <button
              type="button"
              onClick={() => onSelect(slide.id)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-white/90 px-3.5 py-3 text-right text-sm font-black leading-relaxed text-slate-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/70 sm:text-base"
            >
              {/* Show the action, not the question: a dependent slide is titled
                  „איך …?" or „איפה …?"; here we list what the action IS, derived
                  from that title. Both openers are stripped, so a slide titled
                  „איפה פותחים…?" lists as „פותחים…" beside the other verbs
                  instead of standing out as a question fragment. */}
              <span>{slide.title.replace(/^(?:איך|איפה)\s+/, '').replace(/\s*\?$/, '')}</span>
              <ChevronLeft aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-600" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
