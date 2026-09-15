import { cn } from '@/lib/utils';
import type { GuideBranch, GuideBranchPath } from '@/data/guideDeck';
import { FlowSteps, NumberedStepRow } from '@/components/guide/FlowSteps';
import { ScreenshotCard, type LightboxState } from '@/components/guide/screenshots';

/**
 * A genuine two-path split (REQ-GUIDE-004): two labeled lanes side by side on
 * desktop, a vertical stack joined by an "או" connector on mobile — never
 * "way A / way B" prose. Each lane renders its own real steps/flow/screens
 * through the same canonical primitives every procedure uses.
 */

const PATH_ACCENTS = [
  {
    card: 'border-blue-200',
    header: 'bg-blue-50 text-blue-950',
    badge: 'bg-gradient-to-br from-blue-700 to-blue-900',
  },
  {
    card: 'border-amber-300',
    header: 'bg-amber-50 text-amber-950',
    badge: 'bg-gradient-to-br from-amber-500 to-amber-600',
  },
] as const;

function BranchPathCard({
  path,
  index,
  idPrefix,
  slideTitle,
  onOpenScreenshot,
}: {
  path: GuideBranchPath;
  index: 0 | 1;
  idPrefix: string;
  slideTitle: string;
  onOpenScreenshot: (state: LightboxState) => void;
}) {
  const accent = PATH_ACCENTS[index];
  return (
    <section
      aria-label={path.label}
      className={cn(
        'flex min-w-0 flex-col overflow-hidden rounded-3xl border-2 bg-white/92 shadow-[0_16px_44px_rgba(15,23,42,0.10)] backdrop-blur',
        accent.card
      )}
    >
      {/* The two lanes are alternatives, not steps 1 and 2 — the colour tells
          them apart, so the header carries the label alone. */}
      <h3 className={cn('flex items-center gap-2.5 px-4 py-3 text-base font-black sm:text-lg', accent.header)}>
        <span aria-hidden="true" className={cn('h-5 w-1.5 shrink-0 rounded-full', accent.badge)} />
        {path.label}
      </h3>

      <div className="grid flex-1 content-start gap-3 p-3.5 sm:p-4">
        {path.steps && path.steps.length > 0 && (
          <ol className="grid gap-2.5">
            {path.steps.map((step, stepIndex) => (
              <li key={`${idPrefix}-path${index}-step-${stepIndex}`}>
                <NumberedStepRow index={stepIndex} showNumber={path.steps!.length > 1}>
                  {step}
                </NumberedStepRow>
              </li>
            ))}
          </ol>
        )}

        {path.flow && path.flow.length > 0 && (
          <FlowSteps
            idPrefix={`${idPrefix}-path${index}`}
            slideTitle={slideTitle}
            flow={path.flow}
            onOpenScreenshot={onOpenScreenshot}
            numbered={path.flow.length > 1}
          />
        )}

        {path.screenshots?.map((screenshot) => (
          <ScreenshotCard
            key={`${idPrefix}-path${index}-${screenshot.src}`}
            screenshot={screenshot}
            slideTitle={slideTitle}
            onOpen={onOpenScreenshot}
          />
        ))}
      </div>
    </section>
  );
}

export function TwoPathBranch({
  idPrefix,
  slideTitle,
  branch,
  onOpenScreenshot,
}: {
  idPrefix: string;
  slideTitle: string;
  branch: GuideBranch;
  onOpenScreenshot: (state: LightboxState) => void;
}) {
  return (
    <section aria-label="שתי דרכים לאותה מטרה" className="mt-2">
      <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
        <BranchPathCard
          path={branch.paths[0]}
          index={0}
          idPrefix={idPrefix}
          slideTitle={slideTitle}
          onOpenScreenshot={onOpenScreenshot}
        />

        {/* The connector keeps the two lanes visually one decision: a divider
            line through an "או" pill — vertical between columns on desktop,
            horizontal between the stacked cards on mobile. */}
        <div className="relative flex items-center justify-center py-1 md:px-1 md:py-0" aria-hidden="true">
          <span className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-slate-300 md:inset-x-auto md:inset-y-6 md:right-1/2 md:h-auto md:w-px md:translate-x-1/2 md:translate-y-0" />
          <span className="relative z-10 rounded-full border-2 border-amber-400 bg-white px-4 py-1 text-base font-black text-amber-600 shadow-sm">
            או
          </span>
        </div>

        <BranchPathCard
          path={branch.paths[1]}
          index={1}
          idPrefix={idPrefix}
          slideTitle={slideTitle}
          onOpenScreenshot={onOpenScreenshot}
        />
      </div>
    </section>
  );
}
