export type GuideScreenshot = {
  src: string;
  caption: string;
  /** Renders small beside/below the main capture (e.g. a login thumbnail). */
  secondary?: boolean;
  /**
   * The single verified control this step marks (id from guideHotspots.ts).
   * Red focus is explicit per use: omit it — or leave it empty — for a clean
   * screenshot; a defined hotspot never appears on its own. At most one target
   * per use (REQ-GUIDE-002; enforced by src/data/hotspotPolicy.ts).
   */
  hotspotIds?: readonly string[];
};

export type GuideLink = {
  href: string;
  label: string;
};

export type GuideSlideStatus = 'ready' | 'needs-capture' | 'needs-fact';

/**
 * One numbered action in a vertical top-to-bottom sequence: text, its real
 * screen below it, and a double down-arrow leading to the next action.
 */
export type GuideFlowStep = {
  text: string;
  /** Optional inline link whose label renders as an emphasized clickable link
   *  right after the step text (e.g. „נכנסים לעמוד פתיחת מרחב בקישור המצורף"). */
  link?: GuideLink;
  screenshot?: GuideScreenshot;
};

/**
 * One path of a genuine two-path procedure. Each path teaches a real route
 * with its own actions and screens — the branch is a machine signal, not
 * "way A / way B" prose (REQ-GUIDE-004).
 */
export type GuideBranchPath = {
  label: string;
  steps?: string[];
  flow?: GuideFlowStep[];
  screenshots?: GuideScreenshot[];
};

/** A real two-path split: exactly two paths, enforced as a tuple (REQ-GUIDE-004). */
export type GuideBranch = {
  paths: readonly [GuideBranchPath, GuideBranchPath];
};

export type GuideSlide = {
  id: string;
  /** Derived chapter — normalizeSlide sets it from SLIDE_TOPICS -> GUIDE_TOPICS. Not authored. */
  section: string;
  /** Smaller TOC heading; filled from SLIDE_TOPICS during normalization. Not authored. */
  topic?: string;
  eyebrow: string;
  title: string;
  /** Optional: slide text exists only when the owner dictated it (SSOT.md rules 11-12). */
  summary?: string;
  steps?: string[];
  /** Vertical numbered action sequence; replaces steps+screenshots when set. */
  flow?: GuideFlowStep[];
  points?: string[];
  tip?: string;
  warning?: string;
  screenshots?: GuideScreenshot[];
  link?: GuideLink;
  keywords?: string[];
  cover?: boolean;
  status?: GuideSlideStatus;
  missingCaptureId?: string;
  /** A genuine two-path branch for a procedure with two real routes (REQ-GUIDE-004). */
  branch?: GuideBranch;
  /** Marks a procedure performable only while Moodle edit mode is on (REQ-GUIDE-005). */
  requiresEditMode?: boolean;
  /** Renders the interactive guide-side edit-mode teaching toggle (REQ-CONTENT-004). */
  editModeTeachingToggle?: boolean;
  /** Renders the emphasized group of edit-mode-dependent operations, derived from requiresEditMode (REQ-CONTENT-004). */
  editModeGroup?: boolean;
};

/**
 * How a slide is written in AUTHORED_GUIDE_SLIDES. `section` and `topic` are
 * derived (normalizeSlide fills them from the topic map), so they are omitted
 * here: a slide's chapter has exactly one editable source — SLIDE_TOPICS ->
 * GUIDE_TOPICS — and cannot be set (or drift) on the slide itself.
 */
export type AuthoredGuideSlide = Omit<GuideSlide, 'section' | 'topic'>;

/**
 * REQ-CONTENT-004 — owner-locked captions of the guide-side teaching toggle.
 * When the control is OFF it shows the off line; when ON, the on line.
 * The wording is locked by the owner; the invariant tests pin it verbatim.
 */
export const EDIT_MODE_TOGGLE_COPY = {
  off: 'כך מכבים את מצב העריכה',
  on: 'כך מדליקים את מצב העריכה',
} as const;

export type GuideSection = {
  id: string;
  title: string;
  description: string;
};

/**
 * A branch path teaches a real route: a non-empty label and at least one
 * concrete route among steps, flow, or screenshots.
 */
export function isValidBranchPath(path: GuideBranchPath): boolean {
  const hasRoute =
    (path.steps?.length ?? 0) > 0 || (path.flow?.length ?? 0) > 0 || (path.screenshots?.length ?? 0) > 0;
  return typeof path.label === 'string' && path.label.trim().length > 0 && hasRoute;
}

/** A branch is a genuine split only with exactly two valid paths (REQ-GUIDE-004). */
export function isValidBranch(branch: GuideBranch): boolean {
  const paths = branch?.paths;
  return Array.isArray(paths) && paths.length === 2 && paths.every(isValidBranchPath);
}

/**
 * Edit-mode dependency is a machine flag, not prose (REQ-GUIDE-005). When a
 * slide declares requiresEditMode it must actually teach an action (steps,
 * flow, or branch); flagging a non-procedure slide is an inconsistent state.
 */
export function isEditModeMetadataConsistent(slide: GuideSlide): boolean {
  if (slide.requiresEditMode === undefined) return true;
  if (typeof slide.requiresEditMode !== 'boolean') return false;
  if (!slide.requiresEditMode) return true;
  // An action can also be taught by a single annotated real screenshot
  // (e.g. one click inside the edit-mode activity menu).
  return (
    (slide.steps?.length ?? 0) > 0 ||
    (slide.flow?.length ?? 0) > 0 ||
    slide.branch !== undefined ||
    (slide.screenshots?.length ?? 0) > 0
  );
}

const MOODLE_HOME = 'https://moodlemoe.lms.education.gov.il/';
const MOODLE_MY = 'https://moodlemoe.lms.education.gov.il/my/';
const MOODLE_WIZARD = 'https://moodlemoe.lms.education.gov.il/local/auto_course_create/wizard.php';

/**
 * Fixed presentation attribution, shown on the cover and the opening slide.
 * Content source of truth — do not hard-code these lines in the renderer.
 */
export const GUIDE_ATTRIBUTION = {
  district: 'הדרכה במחוז ירושלים והעיר ירושלים - מנח״י, בהובלת איילת קריספין',
  site: 'האתר מנוהל ע״י יניב רז · מדריך מחוזי חט״ב בעיר ירושלים',
} as const;

/** Slide 1: the presentation cover. */
export const FIRST_GUIDE_SLIDE_ID = 'cover';

/** Slide 2: where the training itself begins, and where Quick Start starts. */
export const FIRST_TRAINING_SLIDE_ID = 'open-space-start';

// Chapter structure per the owner's master spec (2026-09-14): main topics
// with question sub-topics; the opening flow keeps its own chapter.
export const GUIDE_SECTIONS: GuideSection[] = [
  { id: 'opening', title: 'פתיחת מרחב למידה', description: '' },
  { id: 'space-management', title: 'ניהול מרחב הלמידה', description: '' },
  { id: 'users-roles', title: 'משתמשים ותפקידים', description: '' },
  { id: 'editing', title: 'מצב עריכה וניהול תוכן', description: '' },
  { id: 'tasks-grades', title: 'משימות, ניסיונות וציונים', description: '' },
  { id: 'monitoring', title: 'מעקב אחר פעילות', description: '' },
];

/** Smaller heading inside a chapter; the TOC groups questions under these. */
export type GuideTopic = { id: string; section: string; title: string };

export const GUIDE_TOPICS: GuideTopic[] = [
  { id: 'opening', section: 'opening', title: 'שלב אחר שלב' },
  { id: 'wizard', section: 'opening', title: 'תוכן מוכן ושכפול' },
  { id: 'start', section: 'opening', title: 'סדר עבודה' },
  { id: 'space', section: 'space-management', title: 'המרחב' },
  { id: 'students-join', section: 'users-roles', title: 'הצטרפות תלמידים' },
  { id: 'participants', section: 'users-roles', title: 'משתתפים' },
  { id: 'groups', section: 'users-roles', title: 'קבוצות' },
  { id: 'teachers', section: 'users-roles', title: 'מורים נוספים' },
  { id: 'edit-mode-basics', section: 'editing', title: 'מה זה מצב עריכה?' },
  { id: 'space-editing', section: 'editing', title: 'איך עורכים את מרחב הלמידה שלנו?' },
  { id: 'editing', section: 'editing', title: 'עריכה וניהול תוכן' },
  { id: 'imports', section: 'editing', title: 'ייבוא ועדכונים' },
  { id: 'tasks', section: 'tasks-grades', title: 'משימות והערכה' },
  { id: 'grading', section: 'tasks-grades', title: 'ניסיונות וציון עובר' },
  { id: 'monitoring', section: 'monitoring', title: 'יומנים, ציונים ודוחות' },
  { id: 'support', section: 'monitoring', title: 'בדיקה ותמיכה' },
];

// One place to file every slide under its smaller heading.
export const SLIDE_TOPICS: Readonly<Record<string, string>> = {
  cover: 'opening',
  'open-space-start': 'opening',
  'open-space-my-courses': 'opening',
  'open-space-wizard': 'opening',
  'open-space-two-paths': 'opening',
  'open-space-group-choice': 'opening',
  'open-space-details-empty': 'opening',
  'open-space-details-check': 'opening',
  'open-space-type': 'opening',
  'open-space-content': 'opening',
  'open-space-confirm': 'opening',
  'open-space-background-create': 'opening',
  'open-space-created-notification': 'opening',
  'open-space-result': 'opening',
  'wizard-ready-content-catalog': 'wizard',
  'wizard-ready-content-search': 'wizard',
  'wizard-ready-content-list-toggle': 'wizard',
  'wizard-clone-my-content': 'wizard',
  'wizard-clone-search-sort': 'wizard',
  'wizard-clone-previous-year': 'wizard',
  'quick-start': 'start',
  workflow: 'start',
  interface: 'space',
  'student-space-view': 'space',
  'pass-grade': 'grading',
  'archive-space': 'space',
  'self-learning-space': 'space',
  'rename-space': 'space-editing',
  'space-image': 'space-editing',
  'space-heading': 'space-editing',
  'rename-task': 'space-editing',
  'edit-mode': 'edit-mode-basics',
  'edit-mode-dependent': 'edit-mode-basics',
  'add-content': 'editing',
  'organize-content': 'editing',
  'hide-task': 'editing',
  'delete-task': 'editing',
  'unhide-task': 'editing',
  'digital-task-icon': 'editing',
  'drag-task': 'editing',
  'import-task': 'imports',
  'content-updates-meaning': 'imports',
  'content-updates': 'imports',
  'student-view': 'editing',
  'external-tools': 'editing',
  'home-edit-controls': 'editing',
  'unit-menu': 'editing',
  'section-menu-actions': 'editing',
  'hidden-items-appearance': 'editing',
  'activity-chooser-more': 'editing',
  'send-task': 'tasks',
  'student-reach-task': 'tasks',
  'student-solve-task': 'tasks',
  'quiz-settings': 'grading',
  'task-correction': 'grading',
  'assignment-submissions': 'tasks',
  'task-feedback': 'tasks',
  'student-result': 'tasks',
  'student-correct-space': 'monitoring',
  logs: 'monitoring',
  'activity-dates': 'monitoring',
  'student-attempt-count': 'monitoring',
  'student-highest-score': 'monitoring',
  gradebook: 'monitoring',
  'export-grades': 'monitoring',
  'report-chooser': 'monitoring',
  completion: 'monitoring',
  'learning-management': 'monitoring',
  notifications: 'monitoring',
  'common-mistakes': 'support',
  recovery: 'support',
  'final-checklist': 'support',
  'late-enrol-link': 'students-join',
  'self-enrol-troubleshoot-method': 'students-join',
  'self-enrol-student': 'students-join',
  'task-link-first-enrol': 'students-join',
  participants: 'participants',
  'remove-participant': 'participants',
  groups: 'groups',
  'group-data': 'groups',
  'add-teacher': 'teachers',
  'teacher-limit': 'teachers',
};

function toModernScreenshotFilename(src: string) {
  return src.replace(/\.[^.]+$/, '.avif');
}

const TOPIC_SECTION: Readonly<Record<string, string>> = Object.fromEntries(
  GUIDE_TOPICS.map((topic) => [topic.id, topic.section])
);

// Every rendered screenshot src is normalized to .avif so the <picture> avif
// <source> and its .webp fallback both point at files the audit guarantees.
// Without this a raw .jpg/.png src reaches the avif <source> verbatim; if that
// original is ever renamed or dropped the source 404s and the card shows its
// "failed to load" state even though the .avif/.webp siblings exist. Classic
// screenshots, flow-step screens, and branch-path screens all use it.
const normalizeShot = (shot: GuideScreenshot): GuideScreenshot => ({
  ...shot,
  src: toModernScreenshotFilename(shot.src),
});

const normalizeFlow = (flow?: GuideFlowStep[]): GuideFlowStep[] | undefined =>
  flow?.map((step) => (step.screenshot ? { ...step, screenshot: normalizeShot(step.screenshot) } : step));

const normalizeBranchPath = (path: GuideBranchPath): GuideBranchPath => ({
  ...path,
  screenshots: path.screenshots?.map(normalizeShot),
  flow: normalizeFlow(path.flow),
});

export function normalizeSlide(slide: AuthoredGuideSlide): GuideSlide {
  const topic = SLIDE_TOPICS[slide.id];
  const branch: GuideBranch | undefined = slide.branch
    ? { paths: [normalizeBranchPath(slide.branch.paths[0]), normalizeBranchPath(slide.branch.paths[1])] }
    : undefined;
  return {
    ...slide,
    topic,
    // Single filing source: the topic map is the ONLY place a slide's chapter
    // is set. Every real slide has a SLIDE_TOPICS entry (a deck invariant
    // enforces it, and would fail loudly otherwise); the fallback only keeps a
    // synthetic test slide with no topic from producing an undefined section.
    section: (topic && TOPIC_SECTION[topic]) || GUIDE_SECTIONS[0].id,
    // Truth stays strict: a slide that still owes a real capture cannot be
    // published, no matter what schema (e.g. a branch) it also carries.
    status:
      slide.missingCaptureId && slide.status === 'ready'
        ? ('needs-capture' as const)
        : slide.status,
    screenshots: slide.screenshots?.map(normalizeShot),
    flow: normalizeFlow(slide.flow),
    branch,
  };
}

// Single source of truth: every guide slide is authored here, in presentation
// order. The chapter is NOT written here — it comes from the topic map.
const AUTHORED_GUIDE_SLIDES: AuthoredGuideSlide[] = [
  {
    id: FIRST_GUIDE_SLIDE_ID,
    eyebrow: 'מחוז ירושלים והעיר ירושלים — מנח״י',
    title: 'מדריך למורים במערכת Moodle',
    keywords: ['מודל', 'Moodle', 'מדריך', 'מצגת'],
    cover: true,
    status: 'ready',
  },
  {
  id: FIRST_TRAINING_SLIDE_ID,
  eyebrow: 'פתיחת מרחב למידה · שלב 1',
  title: 'איך פותחים מרחב למידה במודל?',
  flow: [
    { text: 'נכנסים לעמוד פתיחת מרחב', link: { href: MOODLE_WIZARD, label: 'בקישור המצורף' } },
    {
      text: 'מתחברים באמצעות סיסמת משרד החינוך.',
      screenshot: { src: '01-login.png', caption: 'התחברו באמצעות סיסמת משרד החינוך.' },
    },
    {
      text: 'בוחרים „עם קבוצת לימוד” או „ללא קבוצת לימוד”.',
      screenshot: { src: '45-open-space-choice.png', caption: 'מסך הבחירה — „עם קבוצת לימוד” או „ללא קבוצת לימוד”.' },
    },
    {
      text: 'ממלאים את הפרטים: בית ספר, מקצוע, שכבת גיל וכיתה.',
      screenshot: {
        src: '21-wizard-step1-form.png',
        caption: 'הטופס „מרחב למידה חדש” לפני מילוי — בית ספר, מקצוע, שכבת גיל וכיתה.',
      },
    },
    {
      text: 'לוחצים על „הבא” כדי להמשיך.',
      screenshot: { src: '46-open-space-form.png', caption: 'טופס שלב 1 לאחר מילוי הפרטים.', hotspotIds: ['next'] },
    },
    {
      text: 'בוחרים את סוג מרחב הלמידה.',
      screenshot: { src: '22-wizard-step2.png', caption: 'שלב „סוג מרחב הלמידה”.' },
    },
    {
      text: 'לוחצים על „אישור”.',
      screenshot: { src: '24-wizard-step4.png', caption: 'שלב „אישור וסיום” עם כפתור „אישור”.', hotspotIds: ['confirm-button'] },
    },
    { text: 'לאחר שהיצירה הסתיימה נכנסים למרחב שנוצר.' },
    {
      text: 'מוודאים שזה המרחב הנכון.',
      screenshot: { src: '10-course-page.png', caption: 'עמוד מרחב Moodle לאחר פתיחת המרחב.' },
    },
  ],
  link: { href: MOODLE_WIZARD, label: 'לפתיחת מרחב למידה' },
  keywords: ['פתיחת מרחב', 'כניסה', 'Moodle', 'מודל', 'עם תלמידים', 'ללא תלמידים'],
  status: 'ready',
  },
  {
  id: 'open-space-my-courses',
  eyebrow: 'פתיחת מרחב למידה · שלב 2',
  title: 'איפה לוחצים כדי לפתוח מרחב חדש?',
  summary: 'אחרי ההתחברות מגיעים ל„מרחבי הלמידה שלי”. הכניסה לתהליך היא „מרחב חדש”.',
  flow: [
    {
      text: 'לוחצים על „מרחב חדש”.',
      screenshot: {
        src: '61-my-courses-new.png',
        caption: '„מרחבי הלמידה שלי” בעיצוב החדש — הכפתור „מרחב חדש” והסבר הסיור המודרך.',
        hotspotIds: ['new-space'],
      },
    },
  ],
  link: { href: MOODLE_MY, label: 'פתיחת מרחבי הלמידה שלי' },
  keywords: ['מרחבי הלמידה שלי', 'מרחב חדש'],
  status: 'ready',
  },
  {
  id: 'open-space-wizard',
  eyebrow: 'פתיחת מרחב למידה · שלב 3',
  title: 'איך מתחילים באשף?',
  summary: 'בוחרים את קבוצת הלימוד הרצויה, או ממשיכים במסלול שבו ממלאים את מאפייני הכיתה.',
  flow: [
    {
      text: 'בוחרים „עם קבוצת לימוד” או „ללא קבוצת לימוד”.',
      screenshot: { src: '45-open-space-choice.png', caption: 'מסך הבחירה — „עם קבוצת לימוד” או „ללא קבוצת לימוד”.' },
    },
  ],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['אשף', 'פתיחת מרחב', 'קבוצת לימוד'],
  status: 'ready',
  },
  {
  id: 'open-space-two-paths',
  eyebrow: 'פתיחת מרחב למידה · שתי דרכים',
  title: 'פתיחת מרחב עם תלמידים / ללא תלמידים',
  branch: {
    paths: [
      {
        label: 'עם קבוצת לימוד',
        steps: ['המרחב נוצר עם שיוך תלמידים/קבוצה לפי הנתונים הרשמיים הזמינים במערכת.'],
        screenshots: [
          {
            src: '45-open-space-choice.png',
            caption: 'מסך הבחירה — הכרטיס „עם קבוצת לימוד”.',
            hotspotIds: ['with-group'],
          },
        ],
      },
      {
        label: 'ללא קבוצת לימוד',
        flow: [
          { text: 'המרחב מתחיל ללא תלמידים.' },
          { text: 'אפשר לצרף תלמידים למרחב גם מאוחר יותר.' },
          { text: 'המורה שולח לתלמיד את הקישור הישיר למרחב הלימוד.' },
          {
            text: 'התלמיד פותח את הקישור ומתחבר למערכת.',
            screenshot: { src: '01-login.png', caption: 'התחברות באמצעות סיסמת משרד החינוך.' },
          },
          {
            text: 'התלמיד לוחץ על הכפתור „רשום אותי”.',
            screenshot: { src: '53-student-enrol.png', caption: 'מסך התלמיד עם הכפתור „רשום אותי”.', hotspotIds: ['enrol-me'] },
          },
          {
            text: 'התלמיד רואה שההרשמה הצליחה ונכנס למרחב.',
            screenshot: { src: '54-student-enrolled.png', caption: '„נרשמתם לקורס בהצלחה” — תצוגת תלמיד לאחר הרשמה עצמית.', hotspotIds: ['enrolled-ok'] },
          },
          {
            text: 'המורה נכנס ל„משתמשים” ורואה את התלמיד ברשימת המשתתפים במרחב.',
            screenshot: { src: '47-participants-list.png', caption: 'עמוד „משתתפים” — רשימת המשתתפים במרחב.' },
          },
          { text: 'לכל משתתף במרחב מוגדר תפקיד, למשל „תלמיד” או „מורה”.' },
        ],
      },
    ],
  },
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['עם קבוצת לימוד', 'ללא קבוצת לימוד', 'עם תלמידים', 'ללא תלמידים', 'שתי דרכים'],
  status: 'ready',
  },
  {
  id: 'open-space-group-choice',
  eyebrow: 'פתיחת מרחב למידה · שלב 4',
  title: 'איך פותחים מרחב בלי קבוצת לימוד?',
  summary: 'אם בוחרים „ללא קבוצת לימוד”, המרחב ייפתח לרישום עצמאי של תלמידים באופן אוטומטי. לאחר יצירתו שולחים לתלמידים את קישור המרחב.',
  flow: [
    {
      text: 'לוחצים על „ללא קבוצת לימוד”.',
      screenshot: {
        src: '20-wizard-step1-selected.png',
        caption: '„ללא קבוצת לימוד” מסומן, ומתחת נפתח הטופס „מרחב למידה חדש”.',
        hotspotIds: ['no-group'],
      },
    },
  ],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['קבוצת לימוד', 'ללא קבוצת לימוד', 'רישום עצמי', 'בלי תלמידים'],
  status: 'ready',
  },
  {
  id: 'open-space-details-empty',
  eyebrow: 'פתיחת מרחב למידה · שלב 5',
  title: 'איפה ממלאים את מאפייני הכיתה?',
  summary: 'במסלול ללא קבוצת לימוד ממלאים את הפרטים שמופיעים בפועל: בית ספר, מקצוע, שכבת גיל וכיתה.',
  flow: [
    {
      text: 'ממלאים את פרטי הכיתה: בית ספר, מקצוע, שכבת גיל וכיתה.',
      screenshot: {
        src: '21-wizard-step1-form.png',
        caption: 'הטופס „מרחב למידה חדש” לפני מילוי — בית ספר, מקצוע, שכבת גיל וכיתה.',
      },
    },
  ],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['בית ספר', 'מקצוע', 'שכבה', 'כיתה'],
  status: 'ready',
  },
  {
  id: 'open-space-details-check',
  eyebrow: 'פתיחת מרחב למידה · שלב 6',
  title: 'מה עושים אחרי שמילאנו את מאפייני הכיתה?',
  flow: [
    {
      text: 'בודקים שהפרטים נכונים.',
      screenshot: { src: '46-open-space-form.png', caption: 'טופס שלב 1 לאחר מילוי הפרטים.' },
    },
    {
      text: 'לוחצים על „הבא”.',
      screenshot: { src: '46-open-space-form.png', caption: 'טופס שלב 1 לאחר מילוי הפרטים.', hotspotIds: ['next'] },
    },
  ],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['בדיקה', 'פרטי מרחב', 'המשך'],
  status: 'ready',
  },
  {
  id: 'open-space-type',
  eyebrow: 'פתיחת מרחב למידה · שלב 7',
  title: 'איזה סוג מרחב בוחרים?',
  summary: 'האשף מציג אפשרויות כמו מרחב ריק, „שכפול תוכן שלי” ו„תוכן מוכן”. כל אפשרות ממשיכה למסלול המתאים לה.',
  flow: [
    {
      text: 'בוחרים את סוג מרחב הלמידה.',
      screenshot: { src: '22-wizard-step2.png', caption: 'שלב „סוג מרחב הלמידה”.' },
    },
  ],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['סוג מרחב', 'מרחב ריק', 'שכפול תוכן שלי', 'תוכן מוכן'],
  status: 'ready',
  },
  {
  id: 'open-space-content',
  eyebrow: 'פתיחת מרחב למידה · שלב 8',
  title: 'איך בוחרים תוכן מוכן למרחב?',
  summary: 'לאחר בחירת „תוכן מוכן” מוצגים מקצועות ופרויקטים זמינים. בוחרים את התוכן שמתאים למרחב.',
  flow: [
    {
      text: 'בוחרים את התוכן שמתאים למרחב.',
      screenshot: {
        src: '34-wizard-ready-content-search.png',
        caption: 'שלב „תוכן מרחב הלמידה” — בחירת פרויקט ותוכן מוכן.',
      },
    },
  ],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['בחירת תוכן', 'תוכן מוכן', 'מקצועות', 'פרויקטים'],
  status: 'ready',
  },
  {
  id: 'open-space-confirm',
  eyebrow: 'פתיחת מרחב למידה · שלב 9',
  title: 'מה לוחצים כדי ליצור את המרחב?',
  flow: [
    {
      text: 'בודקים את הפרטים במסך „אישור וסיום”.',
      screenshot: { src: '24-wizard-step4.png', caption: 'שלב „אישור וסיום” עם כפתור „אישור”.' },
    },
    {
      text: 'לוחצים על „אישור”.',
      screenshot: { src: '24-wizard-step4.png', caption: 'שלב „אישור וסיום” עם כפתור „אישור”.', hotspotIds: ['confirm-button'] },
    },
  ],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['אישור', 'סיום', 'יצירת מרחב'],
  status: 'ready',
  },
  {
  id: 'open-space-background-create',
  eyebrow: 'פתיחת מרחב למידה · שלב 10',
  title: 'צריך להמתין מול המסך בזמן יצירת המרחב?',
  summary: 'לא. באשף החדש יצירת המרחב יכולה להמשיך ברקע, ואין צורך להישאר מול המסך עד לסיום.',
  screenshots: [{ src: '39-wizard-background-create.png', caption: 'הודעת האשף לאחר שליחת בקשת יצירת המרחב.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['יצירה ברקע', 'אין צורך להמתין', 'מרחב חדש'],
  status: 'ready',
  },
  {
  id: 'open-space-created-notification',
  eyebrow: 'פתיחת מרחב למידה · שלב 11',
  title: 'איך יודעים שהמרחב נוצר?',
  summary: 'לאחר שהמרחב נוצר, מתקבלת התראה במודל שמאשרת שהמערכת הצליחה ליצור את מרחב הלמידה.',
  screenshots: [
    { src: '40-wizard-notification-update.png', caption: 'פעמון ההתראות במודל עם ההתראה „המערכת הצליחה ליצור את המרחב הלמידה שלך…”.' },
  ],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['הודעה', 'יצירת מרחב', 'סיום יצירה'],
  status: 'ready',
  },
  {
  id: 'open-space-result',
  eyebrow: 'פתיחת מרחב למידה · שלב 12',
  title: 'מה רואים אחרי שהמרחב נפתח?',
  flow: [
    { text: 'לאחר שהיצירה הסתיימה נכנסים למרחב שנוצר.' },
    {
      text: 'מוודאים שזה המרחב הנכון.',
      screenshot: { src: '10-course-page.png', caption: 'עמוד מרחב Moodle לאחר פתיחת המרחב.' },
    },
  ],
  link: { href: MOODLE_MY, label: 'פתיחת מרחבי הלמידה שלי' },
  keywords: ['עמוד מרחב', 'מרחב שנפתח'],
  status: 'ready',
  },
  {
  id: 'wizard-ready-content-catalog',
  eyebrow: 'האשף החדש · תוכן מוכן',
  title: 'איזה תוכן מוכן אפשר להוסיף?',
  summary: '„תוכן מוכן” מאפשר ליצור מרחב עם תכנים מוכנים במקצועות ופרויקטים הזמינים במערכת, ובהם תכנים בעברית, אנגלית, מתמטיקה לחטיבה, מדע וטכנולוגיה ומשימות אוריינות מתוקשבות.',
  screenshots: [{ src: '34-wizard-ready-content-search.png', caption: 'שלב „תוכן מרחב הלמידה” — שורת החיפוש, בחירת פרויקט ופריטי התוכן.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['תוכן מוכן', 'מתמטיקה לחטיבה', 'עברית', 'אנגלית', 'מדע וטכנולוגיה'],
  status: 'ready',
  },
  {
  id: 'wizard-ready-content-search',
  eyebrow: 'האשף החדש · חיפוש',
  title: 'איך מוצאים תוכן מוכן במהירות?',
  summary: 'משתמשים בשורת החיפוש החכמה כדי למצוא את התוכן המוכן הרלוונטי.',
  flow: [
    {
      text: 'מקלידים מילת חיפוש בשורת החיפוש.',
      screenshot: {
        src: '34-wizard-ready-content-search.png',
        caption: 'שורת החיפוש ופריטי התוכן המוכן.',
        hotspotIds: ['search'],
      },
    },
  ],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['חיפוש חכם', 'תוכן מוכן', 'חיפוש'],
  status: 'ready',
  },
  {
  id: 'wizard-ready-content-list-toggle',
  eyebrow: 'האשף החדש · תצוגה',
  title: 'איך משנים מתצוגת תמונות לרשימה?',
  summary: 'אפשר לשנות את תצוגת התוכן מתמונות לרשימה פשוטה כדי לסרוק את האפשרויות בדרך שנוחה לכם.',
  flow: [
    {
      text: 'לוחצים על כפתור שינוי התצוגה.',
      screenshot: {
        src: '35-wizard-ready-content-list-toggle.png',
        caption: 'תוכן מוכן בתצוגת רשימה.',
        hotspotIds: ['view-toggle'],
      },
    },
  ],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['תצוגת רשימה', 'תמונות', 'שינוי תצוגה'],
  status: 'ready',
  },
  {
  id: 'wizard-clone-my-content',
  eyebrow: 'האשף החדש · שכפול',
  title: 'איך משכפלים מרחב שכבר יש לי?',
  flow: [
    {
      text: 'בוחרים „שכפול תוכן שלי”.',
      screenshot: { src: '22-wizard-step2.png', caption: 'שלב „סוג מרחב הלמידה”.' },
    },
    {
      text: 'מחפשים את מרחב הלמידה שרוצים לשכפל.',
      screenshot: {
        src: '36-wizard-clone-my-content.png',
        caption: 'רשימת המרחבים לשכפול — שם מרחב הלמידה, בית ספר ושנת לימודים.',
      },
    },
  ],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['שכפול תוכן שלי', 'שכפול מרחב'],
  status: 'ready',
  },
  {
  id: 'wizard-clone-search-sort',
  eyebrow: 'האשף החדש · שכפול',
  title: 'איך מוצאים את המרחב שרוצים לשכפל?',
  summary: 'אפשר לחפש לפי מילת חיפוש ולמיין מרחבים לפי שם, בית ספר או שנת לימודים.',
  flow: [
    {
      text: 'מקלידים מילת חיפוש בשורת החיפוש.',
      screenshot: {
        src: '37-wizard-clone-sort.png',
        caption: 'רשימת מרחבים לשכפול עם אפשרויות חיפוש ומיון.',
        hotspotIds: ['search'],
      },
    },
    {
      text: 'ממיינים את הרשימה לפי „שנת לימודים”.',
      screenshot: {
        src: '37-wizard-clone-sort.png',
        caption: 'רשימת מרחבים לשכפול עם אפשרויות חיפוש ומיון.',
        hotspotIds: ['year-sort'],
      },
    },
  ],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['מיון', 'בית ספר', 'שנת לימודים', 'חיפוש מרחב'],
  status: 'ready',
  },
  {
  id: 'wizard-clone-previous-year',
  eyebrow: 'האשף החדש · שכפול',
  title: 'אפשר לשכפל מרחב משנה קודמת לבד?',
  summary: 'כן. באשף החדש ניתן לשכפל באופן עצמאי מרחב למידה משנה קודמת, ללא צורך בהגשת טופס בקשה למשרד החינוך.',
  screenshots: [{ src: '38-wizard-clone-previous-year.png', caption: 'מרחב משנת תשפ"ה מסומן ברשימה — מוכן לשכפול.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['שנה קודמת', 'שכפול עצמאי', 'ללא טופס'],
  status: 'ready',
  },
  {
  id: 'quick-start',
  eyebrow: 'התחלה',
  title: 'מהו סדר העבודה במרחב חדש?',
  summary: 'פותחים, מגדירים, בודקים, מצרפים תלמידים ואז עוקבים.',
  steps: ['פותחים את המרחב הנכון.', 'מעדכנים הגדרות ותוכן.', 'בודקים בתצוגת תלמיד.', 'מצרפים תלמידים ועוקבים אחרי ביצוע.'],
  keywords: ['התחלה', 'סדר עבודה', 'מרחב חדש'],
  status: 'ready',
  },
  {
  id: 'workflow',
  eyebrow: 'לפני שליחה',
  title: 'מה בודקים לפני שמפרסמים פעילות?',
  summary: 'מוודאים שהפעילות גלויה, פתוחה וברורה לתלמיד.',
  points: ['הפעילות גלויה.', 'התאריכים נכונים.', 'הקישור נפתח.', 'ההוראות ברורות.'],
  warning: 'לא שולחים פעילות לפני בדיקה בתצוגת תלמיד.',
  keywords: ['פרסום', 'בדיקה', 'פעילות'],
  status: 'ready',
  },
  {
  id: 'interface',
  eyebrow: 'ממשק',
  title: 'מהם הכפתורים הראשיים במרחב הלמידה?',
  points: ['הגדרות.', 'משתתפים.', 'ציונים ודוחות.', 'מצב עריכה.'],
  screenshots: [{ src: '10-course-page.png', caption: 'תפריט המרחב והיחידות בעמוד.', hotspotIds: [] }],
  keywords: ['ממשק', 'תפריט', 'סרגל', 'כפתורים'],
  status: 'ready',
  },
  {
  id: 'student-space-view',
  eyebrow: 'תצוגת תלמיד',
  title: 'איך תלמיד רואה את המרחב שלנו?',
  screenshots: [
    { src: '57-student-space-home.png', caption: 'דף הבית של המרחב בתצוגת תלמיד — תפריט מצומצם: „מרחב־לימוד”, „ציונים” ו„דוחות”.' },
    { src: '58-student-space-topic.png', caption: 'יחידת „יחס” בתצוגת תלמיד — בוחן „ממתין לביצוע” וסימוני ההשלמה בסרגל הצד.' },
  ],
  keywords: ['תצוגת תלמיד', 'איך תלמיד רואה', 'ממתין לביצוע', 'המרחב שלנו'],
  status: 'ready',
  },
  {
  id: 'archive-space',
  eyebrow: 'ארכיון',
  title: 'מה עושים עם מרחב שלא משתמשים בו?',
  summary: 'מעבירים מרחב שאינו בשימוש לארכיון במקום להשאיר אותו ברשימה הפעילה.',
  steps: ['פותחים את המרחבים שלי.', 'פותחים את פעולות המרחב.', 'בוחרים העברה לארכיון.', 'מוודאים שהמרחב בארכיון.'],
  keywords: ['ארכיון', 'מרחב ישן'],
  // needs-fact: „ארכיון” מופיע רק כמסנן ב„מרחבי הלמידה שלי”; לא נמצאה פעולת מורה
  // „העברה לארכיון” בתפריט כרטיס המרחב ולא בעמוד הקורס. חסום לפרסום עד לבירור עובדתי,
  // ואין להמציא הסבר חלופי על ארכוב אוטומטי ללא אישור הבעלים.
  status: 'needs-fact',
  },
  {
  id: 'self-learning-space',
  eyebrow: 'למידה עצמית',
  title: 'מהו מרחב לימוד עצמי?',
  summary: 'זהו מרחב ללא מורה. התלמיד מתרגל בו עצמאית והביצועים שם אינם משויכים למרחב של המורה.',
  screenshots: [{ src: '30-student-mycourses-selflearning.jpg', caption: 'מרחב המורה לצד מרחב „למידה עצמית”.', hotspotIds: ['self-learning'] }],
  keywords: ['לימוד עצמי', 'למידה עצמית', 'מרחב אחר'],
  status: 'ready',
  },
  {
  id: 'late-enrol-link',
  eyebrow: 'הצטרפות מאוחרת',
  title: 'צירוף תלמידים מאוחר יותר',
  summary: '„ללא תלמידים” אינו מצב קבוע — אפשר לצרף תלמידים למרחב גם מאוחר יותר באמצעות קישור המרחב.',
  // Single source (REQ-CONTENT-009): the student-side self-enrol continuation
  // (login → „רשום אותי” → success → רשימת המשתתפים) is taught once, in the
  // open-space-two-paths „ללא קבוצת לימוד” card. This slide keeps only its unique
  // part — copying the space URL from the browser address bar — which is M12.
  flow: [
    {
      text: 'המורה פותח את מרחב הלמידה המדויק.',
      screenshot: { src: '10-course-page.png', caption: 'מרחב הלמידה פתוח.', hotspotIds: [] },
    },
    // The space-URL copy step has no capture yet on purpose: proving where
    // the space address is copied from needs a real browser-window shot
    // (M12, distinct from M11). Truth before design — no fake address bar.
    { text: 'מעתיק את כתובת האינטרנט של המרחב משורת הכתובת של הדפדפן.' },
    { text: 'שולח את הקישור לתלמידים.' },
  ],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['צירוף תלמידים מאוחר', 'קישור למרחב', 'הצטרפות מאוחרת', 'ללא תלמידים'],
  status: 'needs-capture',
  missingCaptureId: 'M12',
  },
  {
  id: 'self-enrol-troubleshoot-method',
  eyebrow: 'פתרון תקלה · שיוך עצמי',
  title: 'מה בודקים אם תלמיד לא מצליח להירשם?',
  summary: 'במרחב שנפתח ללא קבוצת לימוד הרישום העצמי אמור להיות פעיל אוטומטית. אם תלמיד אינו מצליח להצטרף, בודקים את שיטת „שיוך עצמי (תלמיד)” ואת הגדרותיה.',
  flow: [
    {
      text: 'לוחצים על „משתתפים” בתפריט המרחב.',
      screenshot: { src: '90-course-tabs.png', caption: 'תפריט המרחב: „מרחב־לימוד”, „הגדרות”, „משתתפים”, „ציונים”, „דוחות”.', hotspotIds: ['participants-tab'] },
    },
    {
      text: 'בודקים שסמל העין של „שיוך עצמי (תלמיד)” פתוח — כלומר השיטה פעילה.',
      screenshot: {
        src: '94-enrol-methods.png',
        caption: '„שיטות שיוך לתפקיד”: „שיוך עצמי (תלמיד)” עם מספר המשתמשים וסמלי העריכה.',
        hotspotIds: ['self-enrol-eye'],
      },
    },
    {
      text: 'פותחים את הגדרות „שיוך עצמי”.',
      screenshot: {
        src: '94-enrol-methods.png',
        caption: '„שיטות שיוך לתפקיד”: „שיוך עצמי (תלמיד)” עם מספר המשתמשים וסמלי העריכה.',
        hotspotIds: ['self-enrol-method'],
      },
    },
    {
      text: 'בודקים ש„מנגנון רישום עצמי פעיל?” מוגדר „כן”.',
      screenshot: { src: '95-selfenrol-settings.png', caption: 'טופס „שיוך עצמי”: „מנגנון רישום עצמי פעיל?” ו„האם לאפשר רישום למשתמשים חדשים”.', hotspotIds: ['enrol-active'] },
    },
    {
      text: 'בודקים ש„האם לאפשר רישום למשתמשים חדשים?” מוגדר „כן”.',
      screenshot: { src: '95-selfenrol-settings.png', caption: 'טופס „שיוך עצמי”: „מנגנון רישום עצמי פעיל?” ו„האם לאפשר רישום למשתמשים חדשים”.', hotspotIds: ['allow-new-users'] },
    },
  ],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['שיוך עצמי', 'פתרון תקלה', 'עין פתוחה', 'רישום משתמשים חדשים'],
  status: 'ready',
  },
  {
  id: 'self-enrol-student',
  eyebrow: 'הצטרפות תלמיד',
  title: 'איך תלמיד מתחבר למרחב שלנו?',
  summary: 'אחרי שהתלמיד מקבל את קישור המרחב ומגיע למסך ההצטרפות, הוא משלים את הרישום למרחב.',
  flow: [
    {
      text: 'לוחצים „רשום אותי”.',
      screenshot: { src: '53-student-enrol.png', caption: 'מסך התלמיד עם הכפתור „רשום אותי”.', hotspotIds: ['enrol-me'] },
    },
    {
      text: 'רואים את ההודעה „נרשמתם לקורס בהצלחה”.',
      screenshot: { src: '54-student-enrolled.png', caption: '„נרשמתם לקורס בהצלחה” — תצוגת התלמיד לאחר ההרשמה.', hotspotIds: ['enrolled-ok'] },
    },
    { text: 'נכנסים למרחב.' },
  ],
  keywords: ['רשום אותי', 'קישור למרחב', 'תלמיד', 'הרשמה הצליחה'],
  status: 'ready',
  },
  {
  id: 'task-link-first-enrol',
  eyebrow: 'קישור למשימה',
  title: 'מה רואה תלמיד שלא רשום למרחב ונכנס למשימה דרך קישור?',
  flow: [
    {
      text: 'לוחצים „רשום אותי” במסך שבו צריך להירשם למרחב.',
      screenshot: { src: '53-student-enrol.png', caption: 'מסך ההצטרפות עם הכפתור „רשום אותי”.', hotspotIds: ['enrol-me'] },
    },
    {
      text: 'רואים את ההודעה „נרשמתם לקורס בהצלחה”.',
      screenshot: { src: '54-student-enrolled.png', caption: 'הודעת ההצלחה — „נרשמתם לקורס בהצלחה”.', hotspotIds: ['enrolled-ok'] },
    },
    { text: 'פותחים שוב את קישור המשימה.' },
    {
      text: 'לוחצים „התחלת ניסיון מענה”.',
      screenshot: { src: '59-quiz-after-enrol.png', caption: 'עמוד הבוחן עם הכפתור „התחלת ניסיון מענה”.', hotspotIds: ['start-attempt'] },
    },
  ],
  keywords: ['קישור למשימה', 'רשום אותי', 'הרשמה'],
  status: 'ready',
  },
  {
  id: 'participants',
  eyebrow: 'משתתפים',
  title: 'איך רואים מי נמצא במרחב?',
  flow: [
    {
      text: 'לוחצים „משתתפים”.',
      screenshot: { src: '10-course-page.png', caption: 'תפריט המרחב — לשונית „משתתפים”.', hotspotIds: ['participants-tab'] },
    },
    {
      text: 'רואים את רשימת המשתתפים — כל מי שהצטרף למרחב. לכל משתתף יש סיווג: תלמיד או מורה, וכן ההרשמה, הקבוצה והגישה האחרונה.',
      screenshot: {
        src: '47-participants-list.png',
        caption: 'רשימת המשתתפים — עמודת התפקידים (תלמיד/מורה), הקבוצות והגישה האחרונה.',
        hotspotIds: ['roles-column'],
      },
    },
    {
      text: 'לוחצים על סמל העיפרון בעמודת התפקידים.',
      screenshot: { src: '48-role-edit-pencil.png', caption: 'עריכת התפקיד בשורה — בורר התפקיד עם שמירה וביטול.' },
    },
    {
      text: 'בוחרים תפקיד מהרשימה — למשל „מורה”.',
      screenshot: {
        src: '62-role-options.png',
        caption: 'עריכת התפקיד בשורה — בחירת התפקיד החדש.',
        hotspotIds: ['role-select'],
      },
    },
    { text: 'לוחצים „שמירת שינויים”.' },
    {
      text: 'רואים בעמודת התפקידים את התפקיד המעודכן — „תלמיד, מורה”.',
      screenshot: {
        src: '63-role-teacher-saved.png',
        caption: 'לאחר השמירה — עמודת התפקידים מציגה „תלמיד, מורה”.',
        hotspotIds: ['updated-role'],
      },
    },
  ],
  warning: 'גישה אחרונה אינה מוכיחה למידה או השלמת פעילות.',
  keywords: ['משתתפים', 'תלמיד', 'גישה אחרונה', 'קבוצה'],
  status: 'ready',
  },
  {
  id: 'remove-participant',
  eyebrow: 'משתתפים',
  title: 'איך מסירים משתתף?',
  flow: [
    {
      text: 'לוחצים על „משתתפים” בתפריט המרחב.',
      screenshot: { src: '10-course-page.png', caption: 'תפריט המרחב — הלשונית „משתתפים”.', hotspotIds: ['participants-tab'] },
    },
    {
      text: 'לוחצים על סמל הפח („ביטול שיוך לתפקיד בקורס”) בשורת המשתמש.',
      screenshot: { src: '77-participant-row-controls.png', caption: 'שורת המשתמש עם סמלי הפח, העיפרון והפרטים.', hotspotIds: ['unenrol-icon'] },
    },
    {
      text: 'בחלון האישור לוחצים „ביטול שיוך לתפקיד בקורס”.',
      screenshot: { src: '78-unenrol-confirm-dialog.png', caption: 'חלון האישור — „ביטול שיוך לתפקיד בקורס” או „ביטול”.', hotspotIds: ['confirm-unenrol'] },
    },
  ],
  keywords: ['הסרה', 'ביטול שיוך', 'משתתפים'],
  status: 'ready',
  },
  {
  id: 'groups',
  eyebrow: 'קבוצות',
  title: 'איך מחלקים תלמידים לקבוצות?',
  flow: [
    { text: 'בעמוד „משתתפים” בוחרים „קבוצות”.' },
    {
      text: 'לוחצים „יצירת קבוצה”.',
      screenshot: {
        src: '71-groups-page.png',
        caption: 'מסך הקבוצות — אזור „ניהול קבוצות” עם „יצירת קבוצה”.',
        hotspotIds: ['create-group'],
      },
    },
    {
      text: 'מזינים את „שם הקבוצה”.',
      screenshot: {
        src: '72-group-create-form.png',
        caption: 'טופס יצירת הקבוצה עם שדה „שם הקבוצה”.',
        hotspotIds: ['group-name'],
      },
    },
    { text: 'לוחצים „שמירת השינויים”.' },
    { text: 'בוחרים את הקבוצה ברשימת הקבוצות.' },
    {
      text: 'לוחצים „הוספת/הסרת משתתפים מקבוצה”.',
      screenshot: {
        src: '74-groups-two-groups.png',
        caption: 'רשימת הקבוצות עם מספר החברים בכל אחת.',
        hotspotIds: ['add-members'],
      },
    },
    {
      text: 'מסמנים תלמיד ברשימה.',
      screenshot: { src: '73-group-add-members.png', caption: 'מסך הוספת המשתתפים — בוחרים תלמיד ולוחצים „הוספה”.' },
    },
    {
      text: 'לוחצים „הוספה”.',
      screenshot: {
        src: '73-group-add-members.png',
        caption: 'מסך הוספת המשתתפים — בוחרים תלמיד ולוחצים „הוספה”.',
        hotspotIds: ['add-member'],
      },
    },
    {
      text: 'רואים את הקבוצות ברשימה עם מספר החברים בכל קבוצה.',
      screenshot: { src: '74-groups-two-groups.png', caption: 'רשימת הקבוצות עם מספר החברים בכל אחת.' },
    },
  ],
  keywords: ['קבוצות', 'חלוקה לקבוצות'],
  status: 'ready',
  },
  {
  id: 'group-data',
  eyebrow: 'קבוצות',
  title: 'איך מורה רואה נתונים של קבוצה מסוימת?',
  flow: [
    { text: 'פותחים את „בחירת קבוצות נראות” בדוח הציונים.' },
    {
      text: 'בוחרים את הקבוצה מהרשימה.',
      screenshot: {
        src: '75-grader-group-selector-open.png',
        caption: 'בורר „בחירת קבוצות נראות” פתוח עם רשימת הקבוצות.',
        hotspotIds: ['group-option'],
      },
    },
    {
      text: 'רואים שהדוח מציג רק את תלמידי הקבוצה שנבחרה.',
      screenshot: { src: '76-grader-group-filtered.png', caption: 'דוח הציונים מסונן לקבוצה שנבחרה, כולל „ממוצע הקבוצה”.' },
    },
  ],
  keywords: ['קבוצה', 'מסנן', 'נתונים'],
  status: 'ready',
  },
  {
  id: 'add-teacher',
  eyebrow: 'מורים נוספים',
  title: 'איך מצרפים מורה נוסף למרחב הלימוד?',
  flow: [
    { text: 'שולחים למורה הנוסף את הקישור הישיר למרחב הלימוד.' },
    { text: 'המורה הנוסף פותח את הקישור.' },
    {
      text: 'המורה הנוסף מתחבר למערכת.',
      screenshot: { src: '01-login.png', caption: 'התחברות באמצעות סיסמת משרד החינוך.' },
    },
    {
      text: 'המורה הנוסף לוחץ „רשום אותי”.',
      screenshot: { src: '53-student-enrol.png', caption: 'מסך ההצטרפות עם הכפתור „רשום אותי”.', hotspotIds: ['enrol-me'] },
    },
    {
      text: 'לוחצים „משתתפים” בתפריט המרחב.',
      screenshot: { src: '10-course-page.png', caption: 'תפריט המרחב — לשונית „משתתפים”.', hotspotIds: ['participants-tab'] },
    },
    {
      text: 'רואים את רשימת המשתתפים ואת עמודת התפקידים.',
      screenshot: {
        src: '47-participants-list.png',
        caption: 'עמוד „משתתפים” — רשימת המשתתפים והתפקידים.',
        hotspotIds: ['roles-column'],
      },
    },
    {
      text: 'לוחצים על סמל העיפרון בעמודת התפקידים.',
      screenshot: { src: '48-role-edit-pencil.png', caption: 'עריכת התפקיד בשורה — בורר התפקיד עם שמירה וביטול.' },
    },
    {
      text: 'בוחרים „מורה” מרשימת התפקידים.',
      screenshot: {
        src: '62-role-options.png',
        caption: 'רשימת התפקידים בעריכה: „מורה”, „מורה לא עורך - תבניות”, „תלמיד”.',
        hotspotIds: ['role-select'],
      },
    },
    { text: 'לוחצים על „שמירת שינויים”.' },
    {
      text: 'מוודאים שברשימת המשתתפים מופיע התפקיד „מורה”.',
      screenshot: {
        src: '63-role-teacher-saved.png',
        caption: 'לאחר השמירה: עמודת התפקידים מציגה „תלמיד, מורה”.',
        hotspotIds: ['updated-role'],
      },
    },
  ],
  keywords: ['מורה נוסף', 'תפקיד', 'משתתפים', 'עיפרון'],
  status: 'ready',
  },
  {
  id: 'teacher-limit',
  eyebrow: 'מורים נוספים',
  title: 'כמה מורים יכולים להתחבר לאותו מרחב?',
  // No teacher-facing answer is published until the owner supplies a binding
  // number; the field is intentionally empty rather than carrying invented text.
  keywords: ['כמה מורים', 'מורים נוספים'],
  status: 'needs-fact',
  },
  {
  id: 'edit-mode',
  eyebrow: 'עריכה',
  title: 'מהו מצב עריכה במרחב הלמידה ומה אפשר לעשות בו?',
  summary: 'מדליקים את מתג „עריכה” בסרגל העליון.',
  flow: [
    {
      text: 'מאתרים את מתג „מצב עריכה” בסרגל העליון.',
      screenshot: {
        src: '03-topbar-edit-off.png',
        caption: 'מתג „מצב עריכה” בסרגל העליון, במצב כבוי.',
        hotspotIds: ['edit-toggle'],
      },
    },
    {
      text: 'לוחצים על מתג „מצב עריכה” כדי להדליק אותו.',
      screenshot: {
        src: '04-topbar-edit-on.png',
        caption: 'מתג „מצב עריכה” לאחר ההדלקה, במצב פעיל.',
        hotspotIds: ['edit-toggle'],
      },
    },
    {
      text: 'לוחצים שוב על מתג „מצב עריכה” כדי לכבות אותו.',
      screenshot: {
        src: '03-topbar-edit-off.png',
        caption: 'מתג „מצב עריכה” בסרגל העליון, במצב כבוי.',
        hotspotIds: ['edit-toggle'],
      },
    },
  ],
  keywords: ['מצב עריכה', 'עריכה', 'שינוי'],
  editModeTeachingToggle: true,
  status: 'ready',
  },
  {
  id: 'edit-mode-dependent',
  eyebrow: 'מצב עריכה · תלות',
  title: 'אילו פעולות אפשר לבצע רק כשמצב העריכה דולק?',
  // The emphasized group derives its list from every published slide flagged
  // requiresEditMode, so the visual grouping and the machine signal can never
  // drift apart (REQ-CONTENT-004, REQ-GUIDE-005).
  editModeGroup: true,
  screenshots: [{ src: '06-course-edit-on.jpg', caption: 'מרחב הלמידה במצב עריכה — כפתורי ההוספה, העריכה ותפריטי ⋮.' }],
  keywords: ['מצב עריכה', 'פעולות עריכה', 'תלות במצב עריכה'],
  status: 'ready',
  },
  {
  id: 'rename-space',
  eyebrow: 'עריכת פרטי המרחב',
  title: 'איך משנים את שם מרחב הלימוד?',
  flow: [
    {
      text: 'לוחצים על „הגדרות” בתפריט המרחב.',
      screenshot: { src: '10-course-page.png', caption: 'כפתור „הגדרות” בתפריט המרחב.', hotspotIds: ['settings-tab'] },
    },
    {
      text: 'משנים את שדה „השם המלא של מרחב־הלימוד”.',
      screenshot: {
        src: '41-space-settings.png',
        caption: 'עריכת הגדרות המרחב — השם המלא, השם הקצר וקטגוריית המרחב.',
        hotspotIds: ['fullname'],
      },
    },
    {
      text: 'לוחצים על „שמירת השינויים והצגתם”.',
      screenshot: {
        src: '43-space-settings-save.png',
        caption: 'כפתור „שמירת השינויים והצגתם” בתחתית טופס ההגדרות.',
        hotspotIds: ['save'],
      },
    },
  ],
  keywords: ['שם', 'שינוי שם', 'הגדרות'],
  status: 'ready',
  },
  {
  id: 'space-image',
  eyebrow: 'עריכת פרטי המרחב',
  title: 'איך משנים את התמונה הראשית של המרחב?',
  flow: [
    {
      text: 'נכנסים ל„הגדרות” של המרחב.',
      screenshot: { src: '10-course-page.png', caption: 'תפריט המרחב — הכניסה ל„הגדרות”.', hotspotIds: ['settings-tab'] },
    },
    {
      text: 'לוחצים על תיבת „תמונת מרחב־הלימוד”.',
      screenshot: { src: '44-space-image.png', caption: 'אזור „תמונת מרחב־הלימוד” בהגדרות — התמונה הנוכחית וסוגי הקבצים האפשריים.', hotspotIds: ['image-box'] },
    },
    { text: 'מעלים את קובץ התמונה.' },
    {
      text: 'לוחצים על „שמירת השינויים והצגתם”.',
      screenshot: {
        src: '43-space-settings-save.png',
        caption: 'כפתור „שמירת השינויים והצגתם” בתחתית טופס ההגדרות.',
        hotspotIds: ['save'],
      },
    },
  ],
  keywords: ['תמונה', 'תמונת מרחב', 'הגדרות'],
  status: 'ready',
  },
  {
  id: 'space-heading',
  eyebrow: 'עריכת פרטי המרחב',
  title: 'איך משנים כותרת?',
  flow: [
    {
      text: 'מפעילים את מצב העריכה.',
      screenshot: { src: '04-topbar-edit-on.png', caption: 'מתג „מצב עריכה” לאחר ההדלקה, במצב פעיל.', hotspotIds: ['edit-toggle'] },
    },
    {
      text: 'לוחצים על סמל העיפרון שליד הכותרת.',
      screenshot: { src: '69-section-rename-pencil.png', caption: 'מצב עריכה — סמל העיפרון ליד כותרת היחידה.', hotspotIds: ['rename-pencil'] },
    },
    {
      text: 'מקלידים את הכותרת החדשה בשדה.',
      screenshot: { src: '70-section-rename-field.png', caption: 'שדה עריכת הכותרת פתוח — Enter לשמירה, Esc לביטול.', hotspotIds: ['rename-field'] },
    },
    { text: 'מקישים Enter כדי לשמור.' },
  ],
  keywords: ['כותרת', 'שם יחידה', 'עריכה'],
  requiresEditMode: true,
  status: 'ready',
  },
  {
  id: 'rename-task',
  eyebrow: 'עריכת מרחב · שם משימה',
  title: 'איך משנים שם של משימה?',
  requiresEditMode: true,
  flow: [
    {
      text: 'מדליקים את מצב העריכה.',
      screenshot: { src: '04-topbar-edit-on.png', caption: 'מתג „מצב עריכה” דלוק בסרגל העליון.' },
    },
    {
      text: 'לוחצים על העיפרון שליד שם המשימה.',
      screenshot: {
        src: '92-activity-rename-pencil.png',
        caption: 'שם המשימה במצב עריכה — סמל העיפרון פותח את השם לעריכה.',
        hotspotIds: ['rename-pencil'],
      },
    },
    {
      text: 'מקלידים את השם החדש בשדה.',
      screenshot: {
        src: '93-activity-rename-field.png',
        caption: 'שדה שם המשימה פתוח לעריכה: Esc לביטול, Enter לשמירה וסיום.',
        hotspotIds: ['rename-field'],
      },
    },
    { text: 'לוחצים Enter כדי לשמור את השם.' },
    { text: 'רואים את השם החדש במרחב.' },
  ],
  keywords: ['שינוי שם משימה', 'שם פעילות', 'עריכת משימה'],
  status: 'ready',
  },
  {
  id: 'add-content',
  eyebrow: 'תוכן',
  title: 'איך מוסיפים משאב או פעילות?',
  flow: [
    {
      text: 'מדליקים את מתג „מצב עריכה” בסרגל העליון.',
      screenshot: {
        src: '04-topbar-edit-on.png',
        caption: 'מתג „מצב עריכה” לאחר ההדלקה, במצב פעיל.',
        hotspotIds: ['edit-toggle'],
      },
    },
    {
      text: 'לוחצים על „הוספת משאב או פעילות”.',
      screenshot: {
        src: '15-add-activity-button.png',
        caption: 'כפתור „+ הוספת משאב או פעילות”.',
        hotspotIds: ['add-activity'],
      },
    },
    {
      text: 'בוחרים את סוג המשאב או הפעילות בבורר.',
      screenshot: { src: '16-activity-chooser.png', caption: 'בורר הפעילויות והמשאבים.' },
    },
    { text: 'שומרים.' },
  ],
  keywords: ['פעילות', 'משאב', 'קובץ', 'מטלה', 'בוחן'],
  requiresEditMode: true,
  status: 'ready',
  },
  {
  id: 'organize-content',
  eyebrow: 'ארגון',
  title: 'איך מארגנים יחידות ותוכן?',
  summary: 'נותנים שמות ברורים ושומרים על סדר קבוע כדי שהתלמיד ימצא במהירות את הפעילות.',
  points: ['יחידה לכל נושא או פרק.', 'שם פעולה ברור.', 'תאריך יעד כשצריך.', 'רק תוכן רלוונטי נשאר גלוי.'],
  screenshots: [{ src: '06-course-edit-on.jpg', caption: 'מרחב במצב עריכה עם יחידות ופעילויות.' }],
  keywords: ['ארגון', 'יחידות', 'שמות'],
  status: 'ready',
  },
  {
  id: 'hide-task',
  eyebrow: 'ניהול משימות',
  title: 'איך מסתירים משימה או תוכן מהתלמידים?',
  summary: 'המשימה נשארת אצל המורה אבל מוסתרת מהתלמידים.',
  flow: [
    {
      text: 'מדליקים את מצב העריכה.',
      screenshot: {
        src: '04-topbar-edit-on.png',
        caption: 'מתג „מצב עריכה” לאחר ההדלקה, במצב פעיל.',
        hotspotIds: ['edit-toggle'],
      },
    },
    {
      text: 'פותחים את תפריט ⋮ של הפעילות.',
      screenshot: { src: '42-activity-menu.png', caption: 'תפריט ⋮ של פעילות במצב עריכה — „זמינות” להסתרה.' },
    },
    {
      text: 'בוחרים „זמינות” כדי להסתיר.',
      screenshot: { src: '42-activity-menu.png', caption: 'תפריט ⋮ של פעילות במצב עריכה — „זמינות” להסתרה.', hotspotIds: ['availability'] },
    },
    {
      text: 'רואים את התג „מוסתר בפני תלמידים” על הפריט.',
      screenshot: {
        src: '99-hidden-item.png',
        caption: 'התוצאה — התג „מוסתר בפני תלמידים” על הפריט.',
        hotspotIds: ['hidden-badge'],
      },
    },
  ],
  keywords: ['הסתרה', 'משימה', 'זמינות'],
  requiresEditMode: true,
  status: 'ready',
  },
  {
  id: 'delete-task',
  eyebrow: 'ניהול משימות',
  title: 'איך מוחקים משימה, קישור או תוכן אחר מהמרחב?',
  summary: 'מחיקה מסירה את המשימה גם מתצוגת המורה; זו אינה הסתרה.',
  warning: 'יש להבדיל בין הסתרה למחיקה.',
  flow: [
    {
      text: 'פותחים את תפריט ⋮ של הפעילות.',
      screenshot: { src: '42-activity-menu.png', caption: 'תפריט ⋮ של פעילות במצב עריכה — „מחיקה” בתחתית התפריט.' },
    },
    {
      text: 'לוחצים על „מחיקה”.',
      screenshot: { src: '42-activity-menu.png', caption: 'תפריט ⋮ של פעילות במצב עריכה — „מחיקה” בתחתית התפריט.', hotspotIds: ['delete'] },
    },
    {
      text: 'לוחצים על „מחיקה” בחלון „האם למחוק את הפעילות?”.',
      screenshot: {
        src: '50-delete-confirm.png',
        caption: 'חלון האישור „האם למחוק את הפעילות?” — מחיקה או ביטול.',
        hotspotIds: ['confirm-delete'],
      },
    },
  ],
  keywords: ['מחיקה', 'משימה', 'הסתרה'],
  requiresEditMode: true,
  status: 'ready',
  },
  {
  id: 'unhide-task',
  eyebrow: 'ניהול משימות',
  title: 'איך מציגים מחדש תוכן שהוסתר?',
  flow: [
    {
      text: 'נכנסים למצב עריכה.',
      screenshot: {
        src: '04-topbar-edit-on.png',
        caption: 'מתג „מצב עריכה” לאחר ההדלקה, במצב פעיל.',
        hotspotIds: ['edit-toggle'],
      },
    },
    {
      text: 'פותחים את תפריט ⋮ של הפריט המוסתר.',
      screenshot: { src: '49-hidden-item-menu.png', caption: 'תפריט ⋮ של פריט „מוסתר בפני תלמידים” — האפשרות „זמינות”.' },
    },
    {
      text: 'בוחרים „זמינות”.',
      screenshot: {
        src: '49-hidden-item-menu.png',
        caption: 'תפריט ⋮ של פריט „מוסתר בפני תלמידים” — האפשרות „זמינות”.',
        hotspotIds: ['availability'],
      },
    },
  ],
  keywords: ['הצגה מחדש', 'מוסתר', 'זמינות', 'הצג'],
  requiresEditMode: true,
  status: 'ready',
  },
  {
  id: 'digital-task-icon',
  eyebrow: 'זיהוי משימה',
  title: 'איך מזהים משימה מתוקשבת?',
  summary: 'משימה מתוקשבת מסומנת באייקון ורוד.',
  screenshots: [
    { src: '58-student-space-topic.png', caption: 'הבוחן „יחס - בסיסי” עם האייקון הוורוד ביחידת ההוראה.' },
  ],
  keywords: ['אייקון ורוד', 'משימה מתוקשבת'],
  status: 'ready',
  },
  {
  id: 'drag-task',
  eyebrow: 'סידור משימות',
  title: 'איך גוררים משימה ממקום למקום?',
  flow: [
    {
      text: 'במצב עריכה פותחים את תפריט שלוש הנקודות של המשימה.',
      screenshot: { src: '80-activity-menu-move.png', caption: 'תפריט המשימה במצב עריכה — „העברה” בין הפעולות.' },
    },
    {
      text: 'לוחצים על „העברה”.',
      screenshot: {
        src: '80-activity-menu-move.png',
        caption: 'תפריט המשימה במצב עריכה — „העברה” בין הפעולות.',
        hotspotIds: ['move-entry'],
      },
    },
    {
      text: 'בחלון „הזזת פעילות” בוחרים אחרי איזו פעילות למקם את המשימה.',
      screenshot: {
        src: '81-move-activity-modal.png',
        caption: 'חלון „הזזת פעילות” — עץ היחידות והפעילויות לבחירת היעד.',
        hotspotIds: ['move-target'],
      },
    },
    {
      text: 'רואים את המשימה במיקומה החדש.',
      screenshot: {
        src: '82-move-activity-result.png',
        caption: 'המשימה במיקומה החדש מיד לאחר ההעברה.',
        hotspotIds: ['moved-activity'],
      },
    },
  ],
  keywords: ['גרירה', 'הזזה', 'העברה', 'משימה'],
  requiresEditMode: true,
  status: 'ready',
  },
  {
  id: 'student-view',
  eyebrow: 'בדיקה',
  title: 'איך בודקים את המרחב כתלמיד?',
  flow: [
    {
      text: 'מכבים את „מצב עריכה”.',
      screenshot: {
        src: '03-topbar-edit-off.png',
        caption: 'מתג „מצב עריכה” בסרגל העליון, במצב כבוי.',
        hotspotIds: ['edit-toggle'],
      },
    },
    { text: 'פותחים את תפריט המשתמש.' },
    {
      text: 'בוחרים „החלפת תפקיד ל...”.',
      screenshot: {
        src: '09-user-menu.png',
        caption: 'תפריט המשתמש — מכאן מגיעים להחלפת תפקיד.',
        hotspotIds: ['switch-role'],
      },
    },
    { text: 'בוחרים „תלמיד”.' },
    { text: 'בודקים את המרחב לפני ששולחים קישור או משימה.' },
    { text: 'חוזרים לתפקיד הרגיל.' },
  ],
  warning: 'לבדיקת הרשמה או הרשאות מיוחדות משתמשים בחשבון בדיקה מאושר.',
  keywords: ['תצוגת תלמיד', 'החלפת תפקיד', 'בדיקה'],
  status: 'ready',
  },
  {
  id: 'external-tools',
  eyebrow: 'כלים חיצוניים',
  title: 'איך מגיעים לכלי או שירות LTI חיצוני?',
  flow: [
    { text: 'פותחים „אפשרויות נוספות”.' },
    {
      text: 'בוחרים „כלי או שירות LTI חיצוני”.',
      screenshot: { src: '08-more-options.jpg', caption: 'תפריט „אפשרויות נוספות” כולל ניהול כלי LTI.', hotspotIds: ['lti'] },
    },
  ],
  warning: 'לא משנים הגדרות חיבור ללא הרשאה.',
  keywords: ['LTI', 'כלי חיצוני', 'חיבור'],
  status: 'ready',
  },
  {
  id: 'home-edit-controls',
  eyebrow: 'עריכה',
  title: 'איפה רואים את פעולות העריכה בעמוד הבית?',
  summary: 'במצב עריכה מופיעות פעולות הוספה ועריכה ישירות בעמוד.',
  screenshots: [{ src: '05-home-edit-on.png', caption: 'עמוד הבית במצב עריכה עם פעולות ההוספה והעריכה.' }],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['עמוד הבית', 'מצב עריכה', 'הוספת משבצת'],
  status: 'ready',
  },
  {
  id: 'unit-menu',
  eyebrow: 'עריכה',
  title: 'איפה פותחים את תפריט יחידת ההוראה?',
  flow: [
    {
      text: 'פותחים את תפריט שלוש הנקודות של היחידה כדי להגיע לפעולות היחידה.',
      screenshot: { src: '07-unit-menu.jpg', caption: 'תפריט יחידת הוראה במצב עריכה.', hotspotIds: ['unit-kebab'] },
    },
  ],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['יחידת הוראה', 'שלוש נקודות', 'תפריט'],
  status: 'ready',
  },
  {
  id: 'section-menu-actions',
  eyebrow: 'עריכה',
  title: 'אילו פעולות מופיעות בתפריט יחידת הוראה?',
  summary: 'בתפריט מופיעות פעולות עריכה, הסתרה, הזזה ומחיקה לפי ההרשאות.',
  screenshots: [{ src: '13-section-menu-full.jpg', caption: 'תפריט יחידת הוראה מלא עם פעולות העריכה.' }],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['תפריט יחידה', 'הסתרה', 'הזזה', 'מחיקה'],
  status: 'ready',
  },
  {
  id: 'hidden-items-appearance',
  eyebrow: 'עריכה',
  title: 'איך נראים פריטים שמוסתרים מהתלמידים?',
  summary: 'Moodle מסמן פריטים מוסתרים כדי שהמורה יזהה מיד מה התלמידים אינם רואים.',
  screenshots: [
    { src: '99-hidden-item.png', caption: 'תגית „מוסתר בפני תלמידים” על פריט במרחב, לצד תגית „זמין לסטודנטים, אך אינו מוצג בעמוד הראשי של הקורס”.', hotspotIds: ['hidden-badge'] },
  ],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['מוסתר בפני תלמידים', 'זמין', 'הסתרה'],
  status: 'ready',
  },
  {
  id: 'activity-chooser-more',
  eyebrow: 'תוכן',
  title: 'אילו פעילויות נוספות אפשר להוסיף?',
  summary: 'בורר הפעילויות כולל גם כלים נוספים כמו H5P, משחקים, Meet ו-SCORM כאשר הם זמינים.',
  screenshots: [
    { src: '97-activity-chooser-more.png', caption: 'סוף רשימת הבורר: „תוכן אינטראקטיבי H5P”, „Google Meet™ for Moodle” ו„תקנים - חבילת לומדה SCORM”.' },
  ],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['H5P', 'SCORM', 'Meet', 'פעילויות נוספות'],
  status: 'ready',
  },
  {
  id: 'import-task',
  eyebrow: 'ייבוא',
  title: 'איך מייבאים משימה ממרחב אחר?',
  summary: 'נכנסים ל„שימוש חוזר בתכנים”, בוחרים מקור, משימה ויעד ומאשרים.',
  screenshots: [
    { src: '96-more-options-menu.png', caption: 'תפריט „אפשרויות נוספות” פתוח — „שימוש חוזר בתכנים” ברשימה.', hotspotIds: ['more-menu'] },
    { src: '83-import-source.png', caption: 'אשף הייבוא — בחירת מרחב־הלימוד שממנו מייבאים מתוך רשימת המרחבים.' },
    { src: '84-import-select.png', caption: '„הגדרות בחירה” — סימון הפריטים לייבוא מהמרחב שנבחר.' },
    { src: '85-import-confirm.png', caption: '„אישור ותצוגה” — סקירת מה ייובא, לפני שלב „ביצוע יבוא”.' },
  ],
  keywords: ['ייבוא', 'שימוש חוזר בתכנים', 'מרחב אחר'],
  // M18 still needs-capture: steps 1–4 of the import wizard are real captures;
  // the execution ("ביצוע יבוא", step 5) and its result require a mutation on a
  // live space, so they stay uncaptured until a safe test environment exists.
  status: 'needs-capture',
  missingCaptureId: 'M18',
  },
  {
  id: 'content-updates-meaning',
  eyebrow: 'עדכונים למרחב',
  title: 'מה הם עדכונים למרחב?',
  summary: 'אלו משימות או תכנים שצוות מודל משנה, מעדכן או מוסיף במהלך השנה.',
  screenshots: [{ src: '31-updates-drawer.jpg', caption: 'פאנל עדכוני התוכן למורה.' }],
  keywords: ['עדכונים', 'תוכן ארצי', 'תבניות'],
  status: 'ready',
  },
  {
  id: 'content-updates',
  eyebrow: 'עדכונים למרחב',
  title: 'איך מכניסים עדכון למרחב?',
  summary: 'מפעילים עריכה, פותחים את רשימת העדכונים וגוררים את העדכון ליחידה המתאימה.',
  steps: ['מפעילים עריכה.', 'פותחים את פאנל העדכונים.', 'תופסים את ידית הגרירה.', 'גוררים ליחידה המתאימה.'],
  screenshots: [
    { src: '31-updates-drawer.jpg', caption: 'פאנל העדכונים.' },
    { src: '32-updates-list-expanded.jpg', caption: 'רשימת העדכונים וידית הגרירה.' },
  ],
  keywords: ['עדכונים', 'גרירה', 'תוכן ארצי'],
  requiresEditMode: true,
  status: 'needs-capture',
  missingCaptureId: 'M19',
  },
  {
  id: 'send-task',
  eyebrow: 'שליחת משימה',
  title: 'איך שולחים לתלמידים משימה?',
  summary: 'אפשר להפנות למיקום בתוך המרחב או לשלוח קישור ישיר למשימה.',
  points: ['דרך המרחב — מציינים איפה המשימה.', 'בקישור ישיר — שולחים את כתובת המשימה.'],
  keywords: ['שליחת משימה', 'קישור משימה', 'שיתוף'],
  status: 'needs-capture',
  missingCaptureId: 'M11',
  },
  {
  id: 'student-reach-task',
  eyebrow: 'הגעה למשימה · שתי דרכים',
  title: 'איך תלמיד מגיע למשימה מסוימת שהמורה מבקש ממנו לבצע?',
  branch: {
    paths: [
      {
        label: 'דרך מרחב הלמידה',
        flow: [
          {
            text: 'התלמיד נכנס למרחב.',
            screenshot: { src: '57-student-space-home.png', caption: 'דף הבית של המרחב בתצוגת תלמיד.' },
          },
          {
            text: 'מאתר את המשימה במקומה.',
            screenshot: {
              src: '58-student-space-topic.png',
              caption: 'המשימה ביחידה — „ממתין לביצוע”.',
              hotspotIds: ['pending'],
            },
          },
          {
            text: 'פותח אותה.',
            screenshot: {
              src: '59-quiz-after-enrol.png',
              caption: 'המשימה פתוחה — „התחלת ניסיון מענה”.',
              hotspotIds: ['start-attempt'],
            },
          },
        ],
      },
      {
        label: 'קישור ישיר למשימה',
        flow: [
          {
            text: 'המורה פותח את המשימה המדויקת.',
            screenshot: {
              src: '68-quiz-view-teacher.png',
              caption: 'עמוד המשימה כפי שהמורה רואה אותו.',
              hotspotIds: [],
            },
          },
          // The address-bar copy step has no capture yet on purpose: proving
          // where the URL is copied from needs a real browser-window shot
          // (M11). Truth before design — no fake address bar.
          { text: 'מעתיק את כתובת האינטרנט של המשימה משורת הכתובת של הדפדפן.' },
          { text: 'שולח אותה לתלמיד ב-WhatsApp, בדוא"ל או בדרך אחרת.' },
        ],
      },
    ],
  },
  keywords: ['קישור ישיר', 'תלמיד מגיע למשימה', 'שליחת קישור למשימה', 'שתי דרכים'],
  status: 'needs-capture',
  missingCaptureId: 'M11',
  },
  {
  id: 'student-solve-task',
  eyebrow: 'תצוגת תלמיד',
  title: 'איך תלמיד מתחיל לענות על משימה במרחב?',
  flow: [
    {
      text: 'פותחים את המשימה.',
      screenshot: { src: '58-student-space-topic.png', caption: 'המשימה ביחידה — „ממתין לביצוע”.' },
    },
    {
      text: 'לוחצים על „התחלת ניסיון מענה”.',
      screenshot: { src: '59-quiz-after-enrol.png', caption: 'עמוד הבוחן בתצוגת תלמיד עם „התחלת ניסיון מענה”.', hotspotIds: ['start-attempt'] },
    },
    {
      text: 'עונים על השאלות, עמוד אחרי עמוד.',
      screenshot: { src: '64-quiz-question.png', caption: 'עמוד שאלה בבוחן — הזנת התשובה ו„העמוד הבא”.' },
    },
    { text: 'בסיום לוחצים „שמירה וסיום”.' },
    { text: 'לוחצים „הגשה סופית”.' },
    {
      text: 'רואים את „סקירת ניסיון מענה” לאחר ההגשה הסופית.',
      screenshot: { src: '55-quiz-review.png', caption: '„סקירת ניסיון מענה” לאחר ההגשה הסופית.' },
    },
  ],
  keywords: ['תלמיד פותר', 'התחלת ניסיון מענה', 'הגשה סופית'],
  status: 'ready',
  },
  {
  id: 'task-correction',
  eyebrow: 'הגדרות משימה',
  title: 'איך מגדירים אם תלמיד יכול לתקן את התשובות שלו?',
  flow: [
    {
      text: 'בהגדרות הבוחן קובעים „מספר נסיונות מותרים”.',
      screenshot: { src: '86-quiz-settings-grades.png', caption: 'אזור „ציונים” בהגדרות הבוחן: „ציון עובר”, „מספר נסיונות מותרים” ו„שיטת מתן ציונים”.', hotspotIds: ['unlimited-attempts'] },
    },
    {
      text: 'בהגדרות הבוחן קובעים את „מנגנון המשוב בשאלות”.',
      screenshot: {
        src: '87-quiz-settings-behaviour.png',
        caption: 'אזור „התנהגות השאלה” בהגדרות הבוחן — השדה „מנגנון המשוב בשאלות”.',
        hotspotIds: ['question-behaviour'],
      },
    },
    {
      text: 'בודקים בתצוגת התלמיד אם ניתן לנסות שוב.',
      screenshot: { src: '56-quiz-retry.png', caption: 'עמוד הבוחן לאחר ההגשה — „ניסיון חדש”.', hotspotIds: ['new-attempt'] },
    },
  ],
  keywords: ['תיקון', 'ניסיון נוסף', 'משוב', 'רמזים'],
  status: 'ready',
  },
  {
  id: 'assignment-submissions',
  eyebrow: 'מטלה',
  title: 'איך בודקים הגשות של תלמידים?',
  summary: 'פותחים את המטלה, נכנסים להגשות, בוחרים תלמיד ובודקים את ההגשה.',
  steps: ['פותחים מטלה.', 'לוחצים „הצג/דרג הגשות”.', 'מסננים או מחפשים תלמיד.', 'פותחים את ההגשה.'],
  warning: 'ללא ציון אינו בהכרח „לא הוגש”; ייתכן שההגשה טרם נבדקה.',
  keywords: ['מטלה', 'הגשה', 'דרג הגשות'],
  status: 'needs-capture',
  missingCaptureId: 'M13',
  },
  {
  id: 'task-feedback',
  eyebrow: 'משוב',
  title: 'איך מוסיפים משוב לתלמיד בסיום משימה?',
  summary: 'פותחים את ההגשה, כותבים משוב ושומרים.',
  keywords: ['משוב', 'הגשה', 'ציון'],
  status: 'needs-capture',
  missingCaptureId: 'M13',
  },
  {
  id: 'student-result',
  eyebrow: 'תוצאה',
  title: 'איך תלמיד יודע אם עבר או נכשל במשימה?',
  summary: 'לאחר ההגשה התלמיד רואה את מצב הביצוע ואת הציון שלו מול ציון העובר.',
  screenshots: [
    { src: '56-quiz-retry.png', caption: '„בוצע” בירוק מציין שהמשימה הוגשה; „נכשל” באדום מציין שהציון לא הגיע לציון העובר — בדוגמה הזו התלמיד נכשל.' },
    { src: '60-student-grade-report.png', caption: '„דוח ציוני התלמיד במרחב־לימוד זה” — „ציונים” בתפריט התלמיד.' },
  ],
  keywords: ['עבר', 'נכשל', 'ירוק', 'אדום', 'תוצאה'],
  status: 'ready',
  },
  {
  id: 'quiz-settings',
  eyebrow: 'הגדרות משימה',
  title: 'איך מגדירים שתלמיד יוכל לנסות לפתור את המשימה שוב ושוב?',
  summary: 'בהגדרות הבוחן בוחרים את מספר הניסיונות המותרים.',
  flow: [
    {
      text: 'מפעילים את מצב העריכה.',
      screenshot: { src: '04-topbar-edit-on.png', caption: 'מתג „מצב עריכה” לאחר ההדלקה, במצב פעיל.', hotspotIds: ['edit-toggle'] },
    },
    {
      text: 'פותחים את הגדרות הבוחן.',
      screenshot: {
        src: '42-activity-menu.png',
        caption: 'תפריט ⋮ של פעילות במצב עריכה — „הגדרות” בראש התפריט.',
        hotspotIds: ['settings'],
      },
    },
    {
      text: 'בוחרים „מספר נסיונות מותרים: אין הגבלה”.',
      screenshot: { src: '86-quiz-settings-grades.png', caption: 'אזור „ציונים” בהגדרות הבוחן: „ציון עובר”, „מספר נסיונות מותרים” ו„שיטת מתן ציונים”.', hotspotIds: ['unlimited-attempts'] },
    },
    {
      text: 'לוחצים על „שמירת שינויים וחזרה למרחב־לימוד”.',
      screenshot: { src: '88-quiz-settings-save.png', caption: 'סוף טופס ההגדרות — כפתורי השמירה והביטול.', hotspotIds: ['save'] },
    },
    {
      text: 'בודקים בתצוגת תלמיד שאפשר לבצע ניסיון נוסף.',
      screenshot: { src: '56-quiz-retry.png', caption: 'תצוגת תלמיד לאחר ההגשה: הכפתור „ניסיון חדש”.', hotspotIds: ['new-attempt'] },
    },
  ],
  points: ['למבחן חד־פעמי בוחרים ניסיון אחד.', 'לתרגול בוחרים „אין הגבלה”.'],
  keywords: ['ניסיונות', 'פעם אחת', 'מבחן', 'בוחן', 'ניסיון חדש'],
  requiresEditMode: true,
  status: 'ready',
  },
  {
  id: 'pass-grade',
  eyebrow: 'הגדרות משימה',
  title: 'איך מגדירים לתלמיד מהו ציון עובר במשימה?',
  summary: 'בהגדרות הבוחן, באזור הציון, קובעים את הערך בשדה „ציון "עובר"”.',
  flow: [
    {
      text: 'פותחים את הגדרות הבוחן.',
      screenshot: {
        src: '42-activity-menu.png',
        caption: 'תפריט ⋮ של פעילות במצב עריכה — „הגדרות” בראש התפריט.',
        hotspotIds: ['settings'],
      },
    },
    {
      text: 'נכנסים לאזור „ציונים”.',
      screenshot: { src: '86-quiz-settings-grades.png', caption: 'אזור „ציונים” בהגדרות הבוחן: „ציון עובר”, „מספר נסיונות מותרים” ו„שיטת מתן ציונים”.' },
    },
    {
      text: 'מזינים ערך בשדה „ציון "עובר"” (בנקודות, למשל 80 מתוך 100).',
      screenshot: {
        src: '86-quiz-settings-grades.png',
        caption: 'אזור „ציונים” בהגדרות הבוחן: „ציון עובר”, „מספר נסיונות מותרים” ו„שיטת מתן ציונים”.',
        hotspotIds: ['pass-grade'],
      },
    },
    {
      text: 'לוחצים על „שמירת שינויים וחזרה למרחב־לימוד”.',
      screenshot: { src: '88-quiz-settings-save.png', caption: 'סוף טופס ההגדרות — כפתורי השמירה והביטול.', hotspotIds: ['save'] },
    },
    {
      text: 'רואים בעמוד הבוחן „ציון עובר: 80.00 מתוך 100.00”.',
      screenshot: { src: '89-quiz-tabs-settings.png', caption: 'עמוד הבוחן למורה: „ציון עובר: 80.00 מתוך 100.00” ושיטת מתן הציון.', hotspotIds: ['pass-grade-line'] },
    },
    {
      text: 'רואים בתצוגת התלמיד את מצבו מול ציון העובר: „בוצע” בירוק או „נכשל” באדום.',
      screenshot: { src: '56-quiz-retry.png', caption: 'תצוגת התלמיד: „ציון עובר: 80.00 מתוך 100.00” והתג „נכשל” באדום.' },
    },
  ],
  keywords: ['ציון עובר', 'עובר', 'נכשל', 'ציון'],
  status: 'ready',
  },
  {
  id: 'student-correct-space',
  eyebrow: 'שיוך למרחב',
  title: 'מה כדאי לבדוק אם המורה לא רואה את ביצוע המשימה של התלמיד?',
  summary: 'בודקים שהתלמיד ביצע את המשימה במרחב של המורה ולא במרחב אחר או ב„למידה עצמית”.',
  flow: [
    {
      text: 'התלמיד פותח „מרחבי־הלימוד שלי”.',
      screenshot: { src: '30-student-mycourses-selflearning.jpg', caption: 'מרחב המורה לצד מרחב „למידה עצמית” — המסומן הוא מרחב הלימוד העצמי.', hotspotIds: ['self-learning'] },
    },
    { text: 'בוחרים את המרחב של הכיתה והמורה — לא את „למידה עצמית”.' },
    { text: 'בודקים שהמשימה נמצאת באותו מרחב.' },
    { text: 'רק אז בודקים את הביצוע.' },
  ],
  keywords: ['מרחב אחר', 'למידה עצמית', 'שיוך', 'תלמיד'],
  status: 'ready',
  },
  {
  id: 'logs',
  eyebrow: 'פעילות תלמיד',
  title: 'איך רואים את יומני המעקב של הפעילות במרחב הלמידה?',
  flow: [
    {
      text: 'לוחצים על „דוחות” בתפריט המרחב.',
      screenshot: { src: '90-course-tabs.png', caption: 'תפריט המרחב: „מרחב־לימוד”, „הגדרות”, „משתתפים”, „ציונים”, „דוחות”.', hotspotIds: ['reports-tab'] },
    },
    {
      text: 'לוחצים על „יומני מעקב”.',
      screenshot: { src: '91-reports-list.png', caption: 'רשימת הדוחות של המרחב.', hotspotIds: ['logs-link'] },
    },
    {
      text: 'בוחרים משתתף, פעילות או תאריך במסננים.',
      screenshot: {
        src: '51-logs-chooser.png',
        caption: '„בחירת יומני מעקב אותם יש להציג” — המסננים והכפתור „הצגת יומני מעקב אלו”.',
        hotspotIds: ['filters'],
      },
    },
    {
      text: 'לוחצים „הצגת יומני מעקב אלו”.',
      screenshot: {
        src: '51-logs-chooser.png',
        caption: '„בחירת יומני מעקב אותם יש להציג” — המסננים והכפתור „הצגת יומני מעקב אלו”.',
        hotspotIds: ['show-logs'],
      },
    },
    {
      text: 'בטבלה רואים מי ביצע, איזו פעולה ובאיזה תאריך ושעה.',
      screenshot: {
        src: '52-logs-table.png',
        caption: 'טבלת יומני המעקב — מי ביצע, איזו פעולה, תאריך ושעה.',
        hotspotIds: ['log-rows'],
      },
    },
  ],
  warning: 'יומן המעקב מציג אירועים; הוא אינו מודד זמן קשב או איכות למידה.',
  keywords: ['מתי תרגל', 'יומני מעקב', 'פעילות תלמיד', 'לוגים'],
  status: 'ready',
  },
  {
  id: 'activity-dates',
  eyebrow: 'פעילות תלמיד · זמנים',
  title: 'איך רואים באילו תאריכים ושעות התקיימה פעילות?',
  flow: [
    {
      text: 'לוחצים על „דוחות” בתפריט המרחב.',
      screenshot: { src: '90-course-tabs.png', caption: 'תפריט המרחב: „מרחב־לימוד”, „הגדרות”, „משתתפים”, „ציונים”, „דוחות”.', hotspotIds: ['reports-tab'] },
    },
    {
      text: 'לוחצים על „יומני מעקב”.',
      screenshot: { src: '91-reports-list.png', caption: 'רשימת הדוחות של המרחב.', hotspotIds: ['logs-link'] },
    },
    {
      text: 'לוחצים „הצגת יומני מעקב אלו”.',
      screenshot: {
        src: '51-logs-chooser.png',
        caption: '„בחירת יומני מעקב אותם יש להציג” — הכפתור „הצגת יומני מעקב אלו”.',
        hotspotIds: ['show-logs'],
      },
    },
    {
      text: 'בעמודת „זמן” רואים לכל פעולה את התאריך ואת השעה.',
      screenshot: {
        src: '52-logs-table.png',
        caption: 'עמודת „זמן” בטבלת יומני המעקב — תאריך ושעה לכל אירוע.',
        hotspotIds: ['time-column'],
      },
    },
  ],
  keywords: ['תאריכים ושעות', 'מתי הייתה פעילות', 'זמן', 'יומני מעקב'],
  status: 'ready',
  },
  {
  id: 'student-attempt-count',
  eyebrow: 'ביצועי תלמיד',
  title: 'איך רואים כמה פעמים תלמיד ניסה לפתור משימה?',
  flow: [
    {
      text: 'בעמוד הבוחן רואים את „ניסיונות מענה”.',
      screenshot: {
        src: '68-quiz-view-teacher.png',
        caption: 'עמוד הבוחן למורה — „ניסיונות מענה: 1”, שיטת מתן הציון וציון עובר.',
        hotspotIds: ['attempts'],
      },
    },
    { text: 'לוחצים „תוצאות”.' },
    {
      text: 'בטבלה רואים לכל תלמיד את הניסיונות, מועדי ההתחלה והסיום והציון של כל ניסיון.',
      screenshot: { src: '67-quiz-attempts-report.png', caption: 'דוח „תוצאות” — שורת ניסיון לכל תלמיד עם מצב, זמנים וציון.' },
    },
  ],
  keywords: ['מספר ניסיונות', 'ביצועי תלמיד'],
  status: 'ready',
  },
  {
  id: 'student-highest-score',
  eyebrow: 'ביצועי תלמיד',
  title: 'איך רואים את הציון הגבוה ביותר של תלמיד במשימה?',
  summary: 'במסך התוצאות משווים בין הניסיונות ורואים את הציון הגבוה ביותר.',
  points: ['כששיטת מתן הציון היא „הציון הגבוה ביותר”, הציון בבוחן הוא הגבוה מבין הניסיונות.', 'בדוח התוצאות אפשר להציג ניסיון מענה אחד שהסתיים עבור כל משתמש — הציון הגבוה ביותר.'],
  screenshots: [
    { src: '86-quiz-settings-grades.png', caption: 'אזור „ציונים” בהגדרות הבוחן: „ציון עובר”, „מספר נסיונות מותרים” ו„שיטת מתן ציונים”.', hotspotIds: ['grading-method'] },
    { src: '67-quiz-attempts-report.png', caption: 'דוח התוצאות — „שיטת מתן הציונים עבור בוחן זה הוא הציון הגבוה ביותר”.' },
  ],
  keywords: ['ציון גבוה ביותר', 'ניסיונות', 'ביצועים'],
  status: 'ready',
  },
  {
  id: 'gradebook',
  eyebrow: 'ציונים',
  title: 'איך רואים ציונים של תלמידים?',
  summary: 'כל שורה היא תלמיד וכל עמודה היא פריט ציון או סיכום.',
  flow: [
    {
      text: 'לוחצים על „ציונים” בתפריט המרחב.',
      screenshot: { src: '90-course-tabs.png', caption: 'תפריט המרחב: „מרחב־לימוד”, „הגדרות”, „משתתפים”, „ציונים”, „דוחות”.', hotspotIds: ['grades-tab'] },
    },
    {
      text: 'רואים את דוח הציונים.',
      screenshot: { src: '65-gradebook-grader.png', caption: 'דוח הציונים — שורה לכל תלמיד ועמודה לכל פריט ציון, עם חיפוש ובחירת קבוצות.' },
    },
    { text: 'מאתרים את התלמיד בשורות.' },
    { text: 'מאתרים את המשימה בעמודות.' },
    { text: 'בודקים את הציון או את המצב בתא המפגש ביניהם.' },
  ],
  points: ['בודקים סיכום רק אחרי בדיקת המשקלים.'],
  warning: 'תא ריק אינו הוכחה לאי־הגשה.',
  keywords: ['יומן ציונים', 'ציון', 'תא ריק'],
  status: 'ready',
  },
  {
  id: 'export-grades',
  eyebrow: 'ייצוא',
  title: 'איך מורידים דוח ציונים לכיתה?',
  flow: [
    {
      text: 'פותחים „ציונים”.',
      screenshot: {
        src: '65-gradebook-grader.png',
        caption: 'דוח הציונים בלשונית „ציונים” במרחב — נקודת המוצא ל„יצוא”.',
        hotspotIds: ['grades-tab'],
      },
    },
    { text: 'בוחרים „יצוא”.' },
    {
      text: 'בוחרים פורמט, למשל „יצוא לגליון האלקטרוני של Excel”.',
      screenshot: {
        src: '66-gradebook-export.png',
        caption: 'מסך היצוא — בחירת הפורמט וסימון פריטי הציון.',
        hotspotIds: ['format'],
      },
    },
    { text: 'מסמנים את הפריטים הנחוצים.' },
    {
      text: 'לוחצים „הורדה”.',
      screenshot: {
        src: '66-gradebook-export.png',
        caption: 'מסך היצוא — בחירת הפורמט וסימון פריטי הציון.',
        hotspotIds: ['download'],
      },
    },
    { text: 'בודקים את הקובץ.' },
  ],
  warning: 'קובץ ציונים עשוי להכיל מידע אישי ויש לשמור אותו במקום מאובטח.',
  keywords: ['ייצוא ציונים', 'Excel', 'CSV'],
  status: 'ready',
  },
  {
  id: 'report-chooser',
  eyebrow: 'דוחות',
  title: 'איך בוחרים את הדוח המתאים?',
  summary: 'בוחרים דוח לפי השאלה שרוצים לבדוק.',
  points: ['פעולה ומועד — יומני מעקב.', 'השלמה — דוח השלמות.', 'צפיות — פעילות מרחב.', 'ציונים — יומן ציונים.'],
  screenshots: [{ src: '91-reports-list.png', caption: 'רשימת הדוחות של המרחב.', hotspotIds: [] }],
  keywords: ['דוחות', 'יומני מעקב', 'השלמות'],
  status: 'ready',
  },
  {
  id: 'completion',
  eyebrow: 'השלמות',
  title: 'מה ההבדל בין השלמה לציון?',
  summary: 'השלמה מציינת שתנאי בוצע; ציון מציג תוצאת הערכה.',
  points: ['השלמה יכולה להיות אוטומטית או ידנית.', 'ציון יכול להיות מספר או אחוז.', 'אפשר להשלים ולקבל ציון נמוך.'],
  keywords: ['השלמה', 'ציון', 'תנאים'],
  status: 'ready',
  },
  {
  id: 'learning-management',
  eyebrow: 'ניהול למידה',
  title: 'איך נכנסים לדוח „ניהול למידה”?',
  flow: [
    {
      text: 'לוחצים על „דוחות” בתפריט המרחב.',
      screenshot: { src: '90-course-tabs.png', caption: 'תפריט המרחב: „מרחב־לימוד”, „הגדרות”, „משתתפים”, „ציונים”, „דוחות”.', hotspotIds: ['reports-tab'] },
    },
    {
      text: 'לוחצים על „ניהול למידה”, אם הוא זמין במרחב.',
      screenshot: { src: '91-reports-list.png', caption: 'רשימת הדוחות של המרחב.', hotspotIds: ['learning-management-link'] },
    },
    {
      text: 'רואים את „סיכום הלמידה במרחב”.',
      screenshot: { src: '98-learning-summary.png', caption: '„סיכום הלמידה במרחב”: מספר התלמידים בקורס, אחוז ההשלמה וממוצע הציונים.' },
    },
  ],
  keywords: ['ניהול למידה', 'גרפים', 'ממוצע'],
  status: 'ready',
  },
  {
  id: 'notifications',
  eyebrow: 'התראות',
  title: 'איפה רואים התראות ומסרים?',
  summary: 'הפעמון פותח התראות ובועת המסרים פותחת שיחות.',
  screenshots: [
    { src: '11-notifications.jpg', caption: 'פאנל ההתראות.' },
    { src: '12-messages.jpg', caption: 'פאנל המסרים.' },
  ],
  keywords: ['התראות', 'מסרים', 'פעמון'],
  status: 'ready',
  },
  {
  id: 'common-mistakes',
  eyebrow: 'בדיקה',
  title: 'מה בודקים לפני שפונים לתמיכה?',
  summary: 'בודקים גלויוּת, תאריכים, שיוך תלמיד ותצוגת תלמיד לפני שינוי נוסף.',
  points: ['הפעילות גלויה.', 'התאריכים נכונים.', 'התלמיד במרחב הנכון.', 'הפעילות עובדת כתלמיד.', 'רעננו ובדקו שוב.'],
  tip: 'בפנייה לתמיכה מצרפים כתובת, שעה, צילום מסך ותיאור הפעולה.',
  keywords: ['תקלה', 'תמיכה', 'לא עובד'],
  status: 'ready',
  },
  {
  id: 'recovery',
  eyebrow: 'תיקון',
  title: 'מה עושים כשפעילות אינה עובדת לתלמיד?',
  summary: 'בודקים לפי סדר קבוע לפני שמוחקים או משנים הגדרות.',
  steps: ['מוודאים שהתלמיד במרחב הנכון.', 'בודקים זמינות, תאריכים וקבוצה.', 'בודקים בתצוגת תלמיד.', 'אם הבעיה נמשכת — פונים למנהל המודל.'],
  warning: 'לא מוחקים פעילות עם הגשות לפני בדיקת ההשלכות.',
  keywords: ['תיקון', 'פעילות לא עובדת', 'הרשאות'],
  status: 'ready',
  },
  {
  id: 'final-checklist',
  eyebrow: 'לפני שליחה',
  title: 'מה בודקים לפני ששולחים לתלמידים?',
  summary: 'עוברים על רשימה קצרה לפני פרסום.',
  points: ['השם וההוראות ברורים.', 'הפעילות גלויה.', 'הקישור נפתח.', 'ניסיונות ומשוב מוגדרים.', 'התלמידים במרחב הנכון.'],
  keywords: ['בדיקה סופית', 'לפני פרסום', 'סיום'],
  status: 'ready',
  },
];

export const GUIDE_SLIDES = AUTHORED_GUIDE_SLIDES.map(normalizeSlide);

// Publication invariant: a slide is public only when the normalized source
// explicitly marks it ready AND there is no unresolved real-screenshot requirement.
export const PUBLISHED_GUIDE_SLIDES = GUIDE_SLIDES.filter(
  (slide) => slide.status === 'ready' && !slide.missingCaptureId
);

