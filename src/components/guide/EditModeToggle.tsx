import { useState } from 'react';
import { EDIT_MODE_TOGGLE_COPY } from '@/data/guideDeck';
import { cn } from '@/lib/utils';

/**
 * The interactive guide-side edit-mode teaching control (REQ-CONTENT-004,
 * REQ-GUIDE-005). It really toggles, is keyboard- and screen-reader
 * accessible, and is deliberately styled as a guide widget — a dashed
 * practice frame, nothing like the screenshot cards — so it can never be
 * mistaken for a real Moodle screen. The real Moodle evidence stays in the
 * captures beside it. The caption wording is owner-locked in
 * EDIT_MODE_TOGGLE_COPY and pinned by the invariant tests.
 */
export function EditModeToggle() {
  const [on, setOn] = useState(false);

  return (
    <section
      aria-label="רכיב אינטראקטיבי של המדריך לתרגול מתג העריכה"
      className="rounded-3xl border-2 border-dashed border-amber-400 bg-amber-50/70 p-4 shadow-sm sm:p-5"
    >
      <span className="inline-flex items-center rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-slate-950">
        רכיב אינטראקטיבי של המדריך
      </span>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="מתג עריכה לתרגול"
          onClick={() => setOn((value) => !value)}
          className={cn(
            'flex min-h-11 items-center gap-3 rounded-full border px-3 py-2 outline-none transition-colors',
            'focus-visible:ring-4 focus-visible:ring-amber-300/80',
            on ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white text-slate-700'
          )}
        >
          <span className="text-sm font-black">עריכה</span>
          <span
            aria-hidden="true"
            className={cn(
              'flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
              on ? 'justify-end bg-blue-300/60' : 'justify-start bg-slate-300'
            )}
          >
            <span className="h-5 w-5 rounded-full bg-white shadow-md transition-transform" />
          </span>
        </button>

        <p aria-live="polite" className="text-sm font-black leading-relaxed text-slate-800 sm:text-base">
          {on ? EDIT_MODE_TOGGLE_COPY.on : EDIT_MODE_TOGGLE_COPY.off}
        </p>
      </div>
    </section>
  );
}
