import type { ReactNode } from 'react';
import { ChevronsDown } from 'lucide-react';
import type { GuideFlowStep } from '@/data/guideDeck';
import { ScreenshotCard, type LightboxState } from '@/components/guide/screenshots';
import { cn } from '@/lib/utils';

/**
 * One numbered action row — the shared visual for a step, used by both the
 * plain steps list and the vertical flow (and, through the flow, by branch
 * paths). One canonical implementation keeps every procedure looking alike
 * (REQ-GUIDE-001/003).
 */
export function NumberedStepRow({
  index,
  children,
  centered = false,
  showNumber = true,
}: {
  index: number;
  children: ReactNode;
  /** Center the badge+text under the flow's down-arrows (REQ-GUIDE-003). */
  centered?: boolean;
  /** A single-step lane is not a sequence, so it carries no „1” badge. */
  showNumber?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/88 px-3.5 py-3 shadow-sm backdrop-blur',
        centered && 'justify-center text-center'
      )}
    >
      {showNumber && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 text-sm font-black text-white shadow-md">
          {index + 1}
        </span>
      )}
      <span className="pt-1 text-sm font-black leading-relaxed text-slate-700 sm:text-base">{children}</span>
    </div>
  );
}

/**
 * The vertical click-by-click procedure: numbered action, its real screen
 * below it, and the double down-arrow to the next action (REQ-GUIDE-003).
 * Pure data in, so a two-path branch can render one FlowSteps per path.
 */
export function FlowSteps({
  idPrefix,
  slideTitle,
  flow,
  onOpenScreenshot,
  afterFirstStep,
  numbered = true,
}: {
  idPrefix: string;
  slideTitle: string;
  flow: readonly GuideFlowStep[];
  onOpenScreenshot: (state: LightboxState) => void;
  /** Rendered right after step 1 — the slide's link row lives there today. */
  afterFirstStep?: ReactNode;
  /** A lane with a single action is not a numbered sequence. */
  numbered?: boolean;
}) {
  return (
    <ol className="grid gap-3">
      {flow.map((step, index) => (
        <li key={`${idPrefix}-flow-${index}`} className="grid gap-3">
          {index > 0 && (
            <ChevronsDown
              aria-hidden="true"
              className="mx-auto h-12 w-12 text-amber-500 drop-shadow-sm"
              strokeWidth={2.6}
            />
          )}
          {/* Every step of a flow sits centred under the same down-arrow, so the
              numbered sentences line up with it whether or not the step also
              shows a screenshot below. */}
          <NumberedStepRow index={index} centered showNumber={numbered}>
            {step.text}
            {step.link && (
              <>
                {' '}
                <a
                  href={step.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black text-blue-700 underline decoration-2 underline-offset-2 hover:text-blue-900"
                >
                  {step.link.label}
                </a>
              </>
            )}
          </NumberedStepRow>
          {index === 0 && afterFirstStep}
          {step.screenshot && (
            <ScreenshotCard
              screenshot={step.screenshot}
              slideTitle={slideTitle}
              onOpen={onOpenScreenshot}
              zoomable
              hideCaption
            />
          )}
        </li>
      ))}
    </ol>
  );
}
