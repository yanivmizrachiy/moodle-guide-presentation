import type { GuideChoice, GuideChoiceOption } from '@/data/guideDeck';
import { ScreenshotCard, type LightboxState } from '@/components/guide/screenshots';

/**
 * A screen whose teacher has to pick one of three or more real options
 * (REQ-GUIDE-012). Each option gets its own block: its name exactly as the
 * screen writes it, one short sentence on what choosing it gives, and the SAME
 * whole screen with the red focus on that option alone.
 *
 * This is what replaces one circle drawn around several options at once: the
 * teacher sees, option by option, which card is meant and what it does.
 */
function ChoiceOptionCard({
  option,
  slideTitle,
  onOpenScreenshot,
}: {
  option: GuideChoiceOption;
  slideTitle: string;
  onOpenScreenshot: (state: LightboxState) => void;
}) {
  return (
    <section
      aria-label={option.label}
      className="flex min-w-0 flex-col overflow-hidden rounded-3xl border-2 border-blue-200 bg-white/92 shadow-[0_16px_44px_rgba(15,23,42,0.10)] backdrop-blur"
    >
      {/* The options are alternatives, not steps 1-2-3, so the header carries
          the option's own name and no step number (as in a two-path branch). */}
      <h3 className="flex items-center gap-2.5 bg-blue-50 px-4 py-3 text-base font-black text-blue-950 sm:text-lg">
        <span
          aria-hidden="true"
          className="h-5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-blue-700 to-blue-900"
        />
        {option.label}
      </h3>

      <div className="grid gap-3 p-3.5 sm:p-4">
        <p className="text-sm font-black leading-relaxed text-slate-700 sm:text-base">{option.meaning}</p>
        {/* The sentence above already labels the screen, so the caption bar is
            hidden here exactly as it is inside a flow step. */}
        <ScreenshotCard
          screenshot={option.screenshot}
          slideTitle={slideTitle}
          onOpen={onOpenScreenshot}
          hideCaption
        />
      </div>
    </section>
  );
}

export function ChoiceOptions({
  slideTitle,
  choice,
  onOpenScreenshot,
}: {
  slideTitle: string;
  choice: GuideChoice;
  onOpenScreenshot: (state: LightboxState) => void;
}) {
  if (choice.options.length === 0) return null;

  return (
    <section aria-label="האפשרויות שעל המסך" className="mt-2 grid gap-4">
      {choice.options.map((option) => (
        <ChoiceOptionCard
          key={option.label}
          option={option}
          slideTitle={slideTitle}
          onOpenScreenshot={onOpenScreenshot}
        />
      ))}
    </section>
  );
}
