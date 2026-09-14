export type GuideScreenshot = {
  src: string;
  caption: string;
  /** Renders small beside/below the main capture (e.g. a login thumbnail). */
  secondary?: boolean;
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
  screenshot?: GuideScreenshot;
};

export type GuideSlide = {
  id: string;
  section: string;
  /** Smaller TOC heading; filled from SLIDE_TOPICS during normalization. */
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
};

export type GuideSection = {
  id: string;
  title: string;
  description: string;
};

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
  'rename-space': 'space',
  'space-image': 'space',
  'space-heading': 'space',
  'edit-mode': 'editing',
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
  'student-solve-task': 'tasks',
  'quiz-settings': 'grading',
  'task-correction': 'tasks',
  'assignment-submissions': 'tasks',
  'task-feedback': 'tasks',
  'student-result': 'tasks',
  'student-correct-space': 'monitoring',
  logs: 'monitoring',
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
  'self-enrol-auto': 'students-join',
  'self-enrol-troubleshoot-method': 'students-join',
  'self-enrol-troubleshoot-settings': 'students-join',
  'self-enrol-student': 'students-join',
  'self-enrol-success': 'students-join',
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

function normalizeSlide(slide: GuideSlide): GuideSlide {
  const topic = SLIDE_TOPICS[slide.id];
  return {
    ...slide,
    topic,
    // Single filing source: the topic map decides the chapter as well.
    section: (topic && TOPIC_SECTION[topic]) || slide.section,
    status:
      slide.missingCaptureId && slide.status === 'ready'
        ? ('needs-capture' as const)
        : slide.status,
    screenshots: slide.screenshots?.map((screenshot) => ({
      ...screenshot,
      src: toModernScreenshotFilename(screenshot.src),
    })),
    // Flow-step screenshots go through the exact same extension normalization as
    // the classic array. Without this a raw .jpg/.png src reaches the <picture>
    // avif <source> verbatim; if that original file is ever renamed or dropped
    // the source 404s and the card shows its "failed to load" state even though
    // the .avif/.webp siblings exist. Normalizing to .avif keeps both the avif
    // source and its .webp fallback pointing at files the audit guarantees.
    flow: slide.flow?.map((step) =>
      step.screenshot
        ? { ...step, screenshot: { ...step.screenshot, src: toModernScreenshotFilename(step.screenshot.src) } }
        : step
    ),
  };
}

// Single source of truth: every guide slide is authored here, in presentation order.
const AUTHORED_GUIDE_SLIDES: GuideSlide[] = [
  {
    id: FIRST_GUIDE_SLIDE_ID,
    section: 'spaces',
    eyebrow: 'מחוז ירושלים והעיר ירושלים — מנח״י',
    title: 'מדריך למורים במערכת Moodle',
    keywords: ['מודל', 'Moodle', 'מדריך', 'מצגת'],
    cover: true,
    status: 'ready',
  },
  {
  id: FIRST_TRAINING_SLIDE_ID,
  section: 'spaces',
  eyebrow: 'פתיחת מרחב למידה · שלב 1',
  title: 'איך פותחים מרחב למידה במודל?',
  flow: [
    { text: 'נכנסים לעמוד פתיחת מרחב.' },
    {
      text: 'מתחברים באמצעות סיסמת משרד החינוך.',
      screenshot: { src: '01-login.png', caption: 'התחברו באמצעות סיסמת משרד החינוך.' },
    },
    {
      text: 'בחרו אם לפתוח מרחב למידה עם תלמידים או ללא תלמידים.',
      screenshot: { src: '45-open-space-choice.png', caption: 'מסך הבחירה — „עם קבוצת לימוד” או „ללא קבוצת לימוד”.' },
    },
    {
      text: 'ממלאים את הפרטים: בית ספר, מקצוע, שכבת גיל וכיתה.',
      screenshot: { src: '46-open-space-form.png', caption: 'טופס שלב 1 לאחר מילוי הפרטים.' },
    },
    { text: 'לחצו על כפתור ההמשך באשף.' },
    {
      text: 'לחצו על סוג המרחב הרצוי.',
      screenshot: { src: '22-wizard-step2.jpg', caption: 'שלב „סוג מרחב הלמידה”.' },
    },
    {
      text: 'לחצו „אישור”.',
      screenshot: { src: '24-wizard-step4.jpg', caption: 'שלב „אישור וסיום” עם כפתור „אישור”.' },
    },
    {
      text: 'לאחר שהיצירה הסתיימה נכנסים למרחב שנוצר ומוודאים שזה המרחב הנכון.',
      screenshot: { src: '10-course-page.png', caption: 'עמוד מרחב Moodle לאחר פתיחת המרחב.' },
    },
  ],
  link: { href: MOODLE_WIZARD, label: 'לפתיחת מרחב למידה' },
  keywords: ['פתיחת מרחב', 'כניסה', 'Moodle', 'מודל', 'עם תלמידים', 'ללא תלמידים'],
  status: 'ready',
  },
  {
  id: 'open-space-my-courses',
  section: 'spaces',
  eyebrow: 'פתיחת מרחב למידה · שלב 2',
  title: 'איפה לוחצים כדי לפתוח מרחב חדש?',
  summary: 'אחרי ההתחברות מגיעים ל„מרחבי הלמידה שלי”. הכניסה לתהליך היא „מרחב חדש”.',
  steps: ['לחצו „מרחב חדש”.'],
  screenshots: [
    { src: '61-my-courses-new.png', caption: '„מרחבי הלמידה שלי” בעיצוב החדש — הכפתור „מרחב חדש” והסבר הסיור המודרך.' },
  ],
  link: { href: MOODLE_MY, label: 'פתיחת מרחבי הלמידה שלי' },
  keywords: ['מרחבי הלמידה שלי', 'מרחב חדש'],
  status: 'ready',
  },
  {
  id: 'open-space-wizard',
  section: 'spaces',
  eyebrow: 'פתיחת מרחב למידה · שלב 3',
  title: 'איך מתחילים באשף?',
  summary: 'בוחרים את קבוצת הלימוד הרצויה, או ממשיכים במסלול שבו ממלאים את מאפייני הכיתה.',
  steps: ['בחרו את מסלול הפתיחה המתאים.'],
  screenshots: [{ src: '45-open-space-choice.png', caption: 'מסך הבחירה — „עם קבוצת לימוד” או „ללא קבוצת לימוד”.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['אשף', 'פתיחת מרחב', 'קבוצת לימוד'],
  status: 'ready',
  },
  {
  id: 'open-space-group-choice',
  section: 'spaces',
  eyebrow: 'פתיחת מרחב למידה · שלב 4',
  title: 'איך פותחים מרחב בלי קבוצת לימוד?',
  summary: 'אם בוחרים „ללא קבוצת לימוד”, המרחב ייפתח לרישום עצמאי של תלמידים באופן אוטומטי. לאחר יצירתו שולחים לתלמידים את קישור המרחב.',
  steps: ['לחצו „ללא קבוצת לימוד”.'],
  screenshots: [{ src: '20-wizard-step1-selected.png', caption: '„ללא קבוצת לימוד” מסומן, ומתחת נפתח הטופס „מרחב למידה חדש”.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['קבוצת לימוד', 'ללא קבוצת לימוד', 'רישום עצמי', 'בלי תלמידים'],
  status: 'ready',
  },
  {
  id: 'open-space-details-empty',
  section: 'spaces',
  eyebrow: 'פתיחת מרחב למידה · שלב 5',
  title: 'איפה ממלאים את מאפייני הכיתה?',
  summary: 'במסלול ללא קבוצת לימוד ממלאים את הפרטים שמופיעים בפועל: בית ספר, מקצוע, שכבת גיל וכיתה.',
  steps: ['מלאו את פרטי הכיתה במסך הזה.'],
  screenshots: [{ src: '21-wizard-step1-form.png', caption: 'הטופס „מרחב למידה חדש” לפני מילוי — בית ספר, מקצוע, שכבת גיל וכיתה.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['בית ספר', 'מקצוע', 'שכבה', 'כיתה'],
  status: 'ready',
  },
  {
  id: 'open-space-details-check',
  section: 'spaces',
  eyebrow: 'פתיחת מרחב למידה · שלב 6',
  title: 'מה עושים אחרי שמילאנו את מאפייני הכיתה?',
  summary: 'בודקים שהפרטים נכונים וממשיכים לשלב בחירת סוג מרחב הלמידה.',
  steps: ['לחצו על כפתור ההמשך באשף.'],
  screenshots: [{ src: '46-open-space-form.png', caption: 'טופס שלב 1 לאחר מילוי הפרטים.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['בדיקה', 'פרטי מרחב', 'המשך'],
  status: 'ready',
  },
  {
  id: 'open-space-type',
  section: 'spaces',
  eyebrow: 'פתיחת מרחב למידה · שלב 7',
  title: 'איזה סוג מרחב בוחרים?',
  summary: 'האשף מציג אפשרויות כמו מרחב ריק, „שכפול תוכן שלי” ו„תוכן מוכן”. כל אפשרות ממשיכה למסלול המתאים לה.',
  steps: ['לחצו על סוג המרחב הרצוי.'],
  screenshots: [{ src: '22-wizard-step2.jpg', caption: 'שלב „סוג מרחב הלמידה”.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['סוג מרחב', 'מרחב ריק', 'שכפול תוכן שלי', 'תוכן מוכן'],
  status: 'ready',
  },
  {
  id: 'open-space-content',
  section: 'spaces',
  eyebrow: 'פתיחת מרחב למידה · שלב 8',
  title: 'איך בוחרים תוכן מוכן למרחב?',
  summary: 'לאחר בחירת „תוכן מוכן” מוצגים מקצועות ופרויקטים זמינים. בוחרים את התוכן שמתאים למרחב.',
  steps: ['בחרו את התוכן הרצוי.'],
  screenshots: [{ src: '34-wizard-ready-content-search.png', caption: 'שלב „תוכן מרחב הלמידה” — בחירת פרויקט ותוכן מוכן.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['בחירת תוכן', 'תוכן מוכן', 'מקצועות', 'פרויקטים'],
  status: 'ready',
  },
  {
  id: 'open-space-confirm',
  section: 'spaces',
  eyebrow: 'פתיחת מרחב למידה · שלב 9',
  title: 'מה לוחצים כדי ליצור את המרחב?',
  summary: 'במסך „אישור וסיום” בודקים את הפרטים ומבצעים את פעולת היצירה.',
  steps: ['לחצו „אישור”.'],
  screenshots: [{ src: '24-wizard-step4.jpg', caption: 'שלב „אישור וסיום” עם כפתור „אישור”.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['אישור', 'סיום', 'יצירת מרחב'],
  status: 'ready',
  },
  {
  id: 'open-space-background-create',
  section: 'spaces',
  eyebrow: 'פתיחת מרחב למידה · שלב 10',
  title: 'צריך להמתין מול המסך בזמן יצירת המרחב?',
  summary: 'לא. באשף החדש יצירת המרחב יכולה להמשיך ברקע, ואין צורך להישאר מול המסך עד לסיום.',
  screenshots: [{ src: '39-wizard-background-create.jpg', caption: 'הודעת האשף לאחר שליחת בקשת יצירת המרחב.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['יצירה ברקע', 'אין צורך להמתין', 'מרחב חדש'],
  status: 'ready',
  },
  {
  id: 'open-space-created-notification',
  section: 'spaces',
  eyebrow: 'פתיחת מרחב למידה · שלב 11',
  title: 'איך יודעים שהמרחב נוצר?',
  summary: 'עדכון על סיום היצירה נשלח במייל, והתהליך עשוי להימשך עד 3 שעות. כשמתקבל העדכון — המרחב מופיע ב„מרחבי הלמידה שלי”.',
  screenshots: [{ src: '40-wizard-notification-update.jpg', caption: 'הודעת המייל על סיום יצירת המרחב.' }],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['הודעה', 'יצירת מרחב', 'סיום יצירה'],
  status: 'needs-capture',
  missingCaptureId: 'M29',
  },
  {
  id: 'open-space-result',
  section: 'spaces',
  eyebrow: 'פתיחת מרחב למידה · שלב 12',
  title: 'מה רואים אחרי שהמרחב נפתח?',
  summary: 'לאחר שהיצירה הסתיימה נכנסים למרחב שנוצר ומוודאים שזה המרחב הנכון.',
  screenshots: [{ src: '10-course-page.png', caption: 'עמוד מרחב Moodle לאחר פתיחת המרחב.' }],
  link: { href: MOODLE_MY, label: 'פתיחת מרחבי הלמידה שלי' },
  keywords: ['עמוד מרחב', 'מרחב שנפתח'],
  status: 'ready',
  },
  {
  id: 'wizard-ready-content-catalog',
  section: 'spaces',
  eyebrow: 'האשף החדש · תוכן מוכן',
  title: 'איזה תוכן מוכן אפשר להוסיף?',
  summary: '„תוכן מוכן” מאפשר ליצור מרחב עם תכנים מוכנים במקצועות ופרויקטים הזמינים במערכת, ובהם תכנים בעברית, אנגלית, מתמטיקה לחטיבה, מדע וטכנולוגיה ומשימות אוריינות מתוקשבות.',
  screenshots: [{ src: '34-wizard-ready-content-search.jpg', caption: 'שלב „תוכן מרחב הלמידה” — שורת החיפוש, בחירת פרויקט ופריטי התוכן.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['תוכן מוכן', 'מתמטיקה לחטיבה', 'עברית', 'אנגלית', 'מדע וטכנולוגיה'],
  status: 'ready',
  },
  {
  id: 'wizard-ready-content-search',
  section: 'spaces',
  eyebrow: 'האשף החדש · חיפוש',
  title: 'איך מוצאים תוכן מוכן במהירות?',
  summary: 'משתמשים בשורת החיפוש החכמה כדי למצוא את התוכן המוכן הרלוונטי.',
  steps: ['הקלידו מילת חיפוש בשורת החיפוש.'],
  screenshots: [{ src: '34-wizard-ready-content-search.jpg', caption: 'שורת החיפוש ופריטי התוכן המוכן.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['חיפוש חכם', 'תוכן מוכן', 'חיפוש'],
  status: 'ready',
  },
  {
  id: 'wizard-ready-content-list-toggle',
  section: 'spaces',
  eyebrow: 'האשף החדש · תצוגה',
  title: 'איך משנים מתצוגת תמונות לרשימה?',
  summary: 'אפשר לשנות את תצוגת התוכן מתמונות לרשימה פשוטה כדי לסרוק את האפשרויות בדרך שנוחה לכם.',
  steps: ['לחצו על כפתור שינוי התצוגה.'],
  screenshots: [{ src: '35-wizard-ready-content-list-toggle.jpg', caption: 'תוכן מוכן בתצוגת רשימה.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['תצוגת רשימה', 'תמונות', 'שינוי תצוגה'],
  status: 'ready',
  },
  {
  id: 'wizard-clone-my-content',
  section: 'spaces',
  eyebrow: 'האשף החדש · שכפול',
  title: 'איך משכפלים מרחב שכבר יש לי?',
  summary: 'בוחרים „שכפול תוכן שלי” ואז מחפשים את מרחב הלמידה שרוצים לשכפל.',
  steps: ['בחרו „שכפול תוכן שלי”.'],
  screenshots: [{ src: '36-wizard-clone-my-content.jpg', caption: 'רשימת המרחבים לשכפול — שם מרחב הלמידה, בית ספר ושנת לימודים.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['שכפול תוכן שלי', 'שכפול מרחב'],
  status: 'ready',
  },
  {
  id: 'wizard-clone-search-sort',
  section: 'spaces',
  eyebrow: 'האשף החדש · שכפול',
  title: 'איך מוצאים את המרחב שרוצים לשכפל?',
  summary: 'אפשר לחפש לפי מילת חיפוש ולמיין מרחבים לפי שם, בית ספר או שנת לימודים.',
  steps: ['חפשו או בחרו את המיון המתאים.'],
  screenshots: [{ src: '37-wizard-clone-sort.jpg', caption: 'רשימת מרחבים לשכפול עם אפשרויות חיפוש ומיון.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['מיון', 'בית ספר', 'שנת לימודים', 'חיפוש מרחב'],
  status: 'ready',
  },
  {
  id: 'wizard-clone-previous-year',
  section: 'spaces',
  eyebrow: 'האשף החדש · שכפול',
  title: 'אפשר לשכפל מרחב משנה קודמת לבד?',
  summary: 'כן. באשף החדש ניתן לשכפל באופן עצמאי מרחב למידה משנה קודמת, ללא צורך בהגשת טופס בקשה למשרד החינוך.',
  screenshots: [{ src: '38-wizard-clone-previous-year.jpg', caption: 'מרחב משנת תשפ"ה מסומן ברשימה — מוכן לשכפול.' }],
  link: { href: MOODLE_WIZARD, label: 'פתיחת אשף יצירת מרחב' },
  keywords: ['שנה קודמת', 'שכפול עצמאי', 'ללא טופס'],
  status: 'ready',
  },
  {
  id: 'quick-start',
  section: 'spaces',
  eyebrow: 'התחלה',
  title: 'מהו סדר העבודה במרחב חדש?',
  summary: 'פותחים, מגדירים, בודקים, מצרפים תלמידים ואז עוקבים.',
  steps: ['פותחים את המרחב הנכון.', 'מעדכנים הגדרות ותוכן.', 'בודקים בתצוגת תלמיד.', 'מצרפים תלמידים ועוקבים אחרי ביצוע.'],
  keywords: ['התחלה', 'סדר עבודה', 'מרחב חדש'],
  status: 'ready',
  },
  {
  id: 'workflow',
  section: 'spaces',
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
  section: 'spaces',
  eyebrow: 'ממשק',
  title: 'איפה נמצאים הכפתורים המרכזיים במרחב?',
  summary: 'רוב הפעולות נמצאות בתפריט המרחב, בסרגל העליון ובעמוד היחידות.',
  points: ['הגדרות.', 'משתתפים.', 'ציונים ודוחות.', 'מצב עריכה.'],
  screenshots: [{ src: '10-course-page.png', caption: 'תפריט המרחב והיחידות בעמוד.' }],
  keywords: ['ממשק', 'תפריט', 'סרגל', 'כפתורים'],
  status: 'ready',
  },
  {
  id: 'student-space-view',
  section: 'spaces',
  eyebrow: 'תצוגת תלמיד',
  title: 'איך תלמיד רואה את המרחב שלנו?',
  screenshots: [
    { src: '57-student-space-home.png', caption: 'דף הבית של המרחב בתצוגת תלמיד — תפריט מצומצם: מרחב־לימוד, ציונים ודוחות.' },
    { src: '58-student-space-topic.png', caption: 'יחידת „יחס” בתצוגת תלמיד — בוחן „ממתין לביצוע” וסימוני ההשלמה בסרגל הצד.' },
  ],
  keywords: ['תצוגת תלמיד', 'איך תלמיד רואה', 'ממתין לביצוע', 'המרחב שלנו'],
  status: 'ready',
  },
  {
  id: 'archive-space',
  section: 'spaces',
  eyebrow: 'ארכיון',
  title: 'מה עושים עם מרחב שלא משתמשים בו?',
  summary: 'מעבירים מרחב שאינו בשימוש לארכיון במקום להשאיר אותו ברשימה הפעילה.',
  steps: ['פותחים את המרחבים שלי.', 'פותחים את פעולות המרחב.', 'בוחרים העברה לארכיון.', 'מוודאים שהמרחב בארכיון.'],
  keywords: ['ארכיון', 'מרחב ישן'],
  status: 'needs-capture',
  missingCaptureId: 'M02',
  },
  {
  id: 'self-learning-space',
  section: 'spaces',
  eyebrow: 'למידה עצמית',
  title: 'מהו מרחב לימוד עצמי?',
  summary: 'זהו מרחב ללא מורה. התלמיד מתרגל בו עצמאית והביצועים שם אינם משויכים למרחב של המורה.',
  points: ['ללא מורה.', 'תרגול עצמאי.', 'ביצועים שם אינם מוצגים למורה במרחב שלו.'],
  screenshots: [{ src: '30-student-mycourses-selflearning.jpg', caption: 'מרחב המורה לצד מרחב „למידה עצמית”.' }],
  keywords: ['לימוד עצמי', 'למידה עצמית', 'מרחב אחר'],
  status: 'ready',
  },
  {
  id: 'rename-space',
  section: 'spaces',
  eyebrow: 'עריכת פרטי המרחב',
  title: 'איך משנים את שם מרחב הלימוד?',
  summary: 'נכנסים להגדרות, משנים את שם המרחב ושומרים.',
  steps: ['לוחצים „הגדרות”.', 'משנים את שדה השם.', 'לוחצים „שמירת שינויים”.'],
  screenshots: [
    { src: '10-course-page.png', caption: 'כפתור „הגדרות” בתפריט המרחב.' },
    { src: '41-space-settings.png', caption: 'עריכת הגדרות המרחב — השם המלא, השם הקצר וקטגוריית המרחב.' },
    { src: '43-space-settings-save.png', caption: 'כפתור „שמירת השינויים והצגתם” בתחתית טופס ההגדרות.' },
  ],
  keywords: ['שם', 'שינוי שם', 'הגדרות'],
  status: 'ready',
  },
  {
  id: 'space-image',
  section: 'spaces',
  eyebrow: 'עריכת פרטי המרחב',
  title: 'איך משנים את התמונה הראשית של המרחב?',
  summary: 'נכנסים להגדרות, בוחרים תמונה ושומרים.',
  screenshots: [
    { src: '44-space-image.png', caption: 'אזור „תמונת מרחב־הלימוד” בהגדרות — התמונה הנוכחית וסוגי הקבצים האפשריים.' },
  ],
  keywords: ['תמונה', 'תמונת מרחב', 'הגדרות'],
  status: 'ready',
  },
  {
  id: 'space-heading',
  section: 'spaces',
  eyebrow: 'עריכת פרטי המרחב',
  title: 'איך משנים כותרת?',
  summary: 'מפעילים עריכה, פותחים את עריכת הכותרת, משנים ושומרים.',
  flow: [
    {
      text: 'מפעילים את מתג „עריכה” ולוחצים על סמל העיפרון שליד הכותרת.',
      screenshot: { src: '69-section-rename-pencil.png', caption: 'מצב עריכה — סמל העיפרון ליד כותרת היחידה.' },
    },
    {
      text: 'מקלידים את הכותרת החדשה ומקישים Enter לשמירה.',
      screenshot: { src: '70-section-rename-field.png', caption: 'שדה עריכת הכותרת פתוח — Enter לשמירה, Esc לביטול.' },
    },
  ],
  keywords: ['כותרת', 'שם יחידה', 'עריכה'],
  status: 'ready',
  },
  {
  id: 'self-enrol-auto',
  section: 'students',
  eyebrow: 'הצטרפות תלמידים',
  title: 'איך מצרפים תלמידים חדשים למרחב הלימוד?',
  flow: [
    { text: 'המורה שולח לתלמיד את הקישור הישיר למרחב הלימוד.' },
    {
      text: 'התלמיד פותח את הקישור ומתחבר למערכת.',
      screenshot: { src: '01-login.png', caption: 'התחברות באמצעות סיסמת משרד החינוך.' },
    },
    {
      text: 'התלמיד לוחץ על הכפתור „רשום אותי”.',
      screenshot: { src: '53-student-enrol.png', caption: 'מסך התלמיד עם הכפתור „רשום אותי”.' },
    },
    {
      text: 'התלמיד רואה שההרשמה הצליחה ונכנס למרחב.',
      screenshot: { src: '54-student-enrolled.png', caption: '„נרשמתם לקורס בהצלחה” — תצוגת תלמיד לאחר הרשמה עצמית.' },
    },
    {
      text: 'המורה נכנס ל„משתמשים” ורואה את התלמיד ברשימת המשתתפים במרחב.',
      screenshot: { src: '47-participants-list.png', caption: 'עמוד „משתתפים” — רשימת המשתתפים במרחב.' },
    },
    { text: 'לכל משתתף במרחב מוגדר תפקיד, למשל „תלמיד” או „מורה”.' },
  ],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['מצרפים תלמידים', 'רישום עצמי', 'קישור למרחב', 'רשום אותי', 'משתמשים', 'תפקיד'],
  status: 'ready',
  },
  {
  id: 'self-enrol-troubleshoot-method',
  section: 'students',
  eyebrow: 'פתרון תקלה · שיוך עצמי',
  title: 'מה בודקים אם תלמיד לא מצליח להירשם?',
  summary: 'במרחב שנפתח ללא קבוצת לימוד הרישום העצמי אמור להיות פעיל אוטומטית. אם תלמיד אינו מצליח להצטרף, בודקים ששיטת „שיוך עצמי (תלמיד)” פעילה.',
  steps: ['בדקו שסמל העין של „שיוך עצמי (תלמיד)” פתוח.'],
  screenshots: [{ src: '26-selfenrol-methods-list.jpg', caption: '„שיוך עצמי (תלמיד)” ברשימת שיטות השיוך.' }],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['שיוך עצמי', 'פתרון תקלה', 'עין פתוחה'],
  status: 'ready',
  },
  {
  id: 'self-enrol-troubleshoot-settings',
  section: 'students',
  eyebrow: 'פתרון תקלה · שיוך עצמי',
  title: 'איזו הגדרה בודקים אם הרישום העצמי לא עובד?',
  summary: 'אם יש תקלה ברישום העצמי, בודקים בהגדרות השיוך שהאפשרות לרישום משתמשים חדשים פעילה.',
  steps: ['בדקו את „האם לאפשר רישום למשתמשים חדשים?”.'],
  screenshots: [{ src: '27-selfenrol-settings.jpg', caption: 'הגדרות „שיוך עצמי” עם אפשרות הרישום למשתמשים חדשים.' }],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['שיוך עצמי', 'רישום משתמשים חדשים', 'פתרון תקלה'],
  status: 'ready',
  },
  {
  id: 'self-enrol-student',
  section: 'students',
  eyebrow: 'הצטרפות תלמיד',
  title: 'מה התלמיד לוחץ בפעם הראשונה?',
  summary: 'אחרי שהתלמיד מקבל את קישור המרחב ומגיע למסך ההצטרפות, הוא משלים את הרישום למרחב.',
  steps: ['לחצו „רשום אותי”.'],
  screenshots: [{ src: '53-student-enrol.png', caption: 'מסך התלמיד עם הכפתור „רשום אותי”.' }],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['רשום אותי', 'קישור למרחב', 'תלמיד'],
  status: 'ready',
  },
  {
  id: 'self-enrol-success',
  section: 'students',
  eyebrow: 'הצטרפות תלמיד',
  title: 'איך יודעים שההרשמה הצליחה?',
  summary: 'אחרי ההרשמה התלמיד רואה הודעת הצלחה ונכנס למרחב.',
  screenshots: [{ src: '54-student-enrolled.png', caption: '„נרשמתם לקורס בהצלחה” — תצוגת תלמיד לאחר הרשמה עצמית.' }],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['הרשמה הצליחה', 'תלמיד', 'שיוך עצמי'],
  status: 'ready',
  },
  {
  id: 'task-link-first-enrol',
  section: 'students',
  eyebrow: 'קישור למשימה',
  title: 'מה קורה אם תלמיד לא רשום ונכנס דרך קישור למשימה?',
  summary: 'תחילה נרשמים למרחב, ואז פותחים שוב את הקישור הישיר למשימה.',
  flow: [
    {
      text: 'לוחצים „רשום אותי”.',
      screenshot: { src: '53-student-enrol.png', caption: 'מסך ההצטרפות עם הכפתור „רשום אותי”.' },
    },
    {
      text: 'מסיימים את ההרשמה למרחב.',
      screenshot: { src: '54-student-enrolled.png', caption: 'הודעת ההצלחה — „נרשמתם לקורס בהצלחה”.' },
    },
    {
      text: 'פותחים שוב את קישור המשימה.',
      screenshot: { src: '59-quiz-after-enrol.png', caption: 'עמוד הבוחן עם הכפתור „התחלת ניסיון מענה”.' },
    },
    { text: 'המשימה נפתחת.' },
  ],
  keywords: ['קישור למשימה', 'רשום אותי', 'הרשמה'],
  status: 'ready',
  },
  {
  id: 'participants',
  section: 'students',
  eyebrow: 'משתתפים',
  title: 'איך רואים מי נמצא במרחב?',
  summary: 'לוחצים „משתתפים” ורואים הרשמה, תפקיד, קבוצה וגישה אחרונה.',
  steps: ['לוחצים „משתתפים”.', 'מחפשים תלמיד או משתמשים במסנן.', 'בודקים תפקיד וקבוצה.'],
  screenshots: [
    { src: '47-participants-list.png', caption: 'עמוד „משתתפים” — הרשימה עם עמודות התפקידים, הקבוצות והגישה האחרונה.' },
  ],
  warning: 'גישה אחרונה אינה מוכיחה למידה או השלמת פעילות.',
  keywords: ['משתתפים', 'תלמיד', 'גישה אחרונה', 'קבוצה'],
  status: 'ready',
  },
  {
  id: 'remove-participant',
  section: 'students',
  eyebrow: 'משתתפים',
  title: 'איך מסירים משתתף?',
  summary: 'מסירים את השיוך של המשתמש למרחב ומאשרים את הפעולה.',
  flow: [
    {
      text: 'בעמוד „משתתפים” לוחצים על סמל הפח בשורת המשתמש.',
      screenshot: { src: '77-participant-row-controls.png', caption: 'שורת המשתמש עם סמלי הפח, העיפרון והפרטים.' },
    },
    {
      text: 'בחלון האישור לוחצים „ביטול שיוך לתפקיד בקורס”.',
      screenshot: { src: '78-unenrol-confirm-dialog.png', caption: 'חלון האישור — „ביטול שיוך לתפקיד בקורס” או „ביטול”.' },
    },
  ],
  keywords: ['הסרה', 'ביטול שיוך', 'משתתפים'],
  status: 'ready',
  },
  {
  id: 'groups',
  section: 'students',
  eyebrow: 'קבוצות',
  title: 'איך מחלקים תלמידים לקבוצות?',
  summary: 'פותחים את ניהול הקבוצות, יוצרים קבוצה ומוסיפים אליה תלמידים.',
  flow: [
    {
      text: 'בעמוד „משתתפים” בוחרים „קבוצות” ולוחצים „יצירת קבוצה”.',
      screenshot: { src: '71-groups-page.png', caption: 'מסך הקבוצות — אזור „ניהול קבוצות” עם „יצירת קבוצה”.' },
    },
    {
      text: 'מזינים את שם הקבוצה ולוחצים „שמירת השינויים”.',
      screenshot: { src: '72-group-create-form.png', caption: 'טופס יצירת הקבוצה עם שדה „שם הקבוצה”.' },
    },
    {
      text: 'בוחרים את הקבוצה, לוחצים „הוספת/הסרת משתתפים מקבוצה”, מסמנים תלמיד ולוחצים „הוספה”.',
      screenshot: { src: '73-group-add-members.png', caption: 'מסך הוספת המשתתפים — בוחרים תלמיד ולוחצים „הוספה”.' },
    },
    {
      text: 'הקבוצות מופיעות ברשימה עם מספר החברים בכל קבוצה.',
      screenshot: { src: '74-groups-two-groups.png', caption: 'רשימת הקבוצות עם מספר החברים בכל אחת.' },
    },
  ],
  keywords: ['קבוצות', 'חלוקה לקבוצות'],
  status: 'ready',
  },
  {
  id: 'group-data',
  section: 'students',
  eyebrow: 'קבוצות',
  title: 'איך מורה רואה נתונים של קבוצה מסוימת?',
  summary: 'בוחרים את הקבוצה במסך הנתונים ורואים רק את הנתונים הרלוונטיים לה.',
  flow: [
    {
      text: 'בדוח הציונים פותחים את „בחירת קבוצות נראות” ובוחרים קבוצה.',
      screenshot: { src: '75-grader-group-selector-open.png', caption: 'בורר „בחירת קבוצות נראות” פתוח עם רשימת הקבוצות.' },
    },
    {
      text: 'הדוח מציג עכשיו רק את תלמידי הקבוצה שנבחרה.',
      screenshot: { src: '76-grader-group-filtered.png', caption: 'דוח הציונים מסונן לקבוצה שנבחרה, כולל „ממוצע הקבוצה”.' },
    },
  ],
  keywords: ['קבוצה', 'מסנן', 'נתונים'],
  status: 'ready',
  },
  {
  id: 'add-teacher',
  section: 'students',
  eyebrow: 'מורים נוספים',
  title: 'איך מצרפים מורה נוסף למרחב הלימוד?',
  flow: [
    { text: 'שולחים למורה הנוסף את הקישור הישיר למרחב הלימוד.' },
    {
      text: 'המורה הנוסף פותח את הקישור, מתחבר ולוחץ „רשום אותי”.',
      screenshot: { src: '53-student-enrol.png', caption: 'מסך ההצטרפות עם הכפתור „רשום אותי”.' },
    },
    {
      text: 'מנהל המרחב נכנס ל„משתמשים” ופותח את רשימת המשתתפים.',
      screenshot: { src: '47-participants-list.png', caption: 'עמוד „משתתפים” — רשימת המשתתפים והתפקידים.' },
    },
    {
      text: 'לוחצים על סמל העיפרון בעמודת התפקידים.',
      screenshot: { src: '48-role-edit-pencil.png', caption: 'עריכת התפקיד בשורה — בורר התפקיד עם שמירה וביטול.' },
    },
    {
      text: 'בוחרים „מורה” מרשימת התפקידים.',
      screenshot: { src: '62-role-options.png', caption: 'רשימת התפקידים בעריכה: „מורה”, „מורה לא עורך - תבניות”, „תלמיד”.' },
    },
    {
      text: 'לוחצים על „שמירת שינויים” ומוודאים שברשימת המשתתפים מופיע התפקיד „מורה”.',
      screenshot: { src: '63-role-teacher-saved.png', caption: 'לאחר השמירה: עמודת התפקידים מציגה „תלמיד, מורה”.' },
    },
  ],
  keywords: ['מורה נוסף', 'תפקיד', 'משתתפים', 'עיפרון'],
  status: 'ready',
  },
  {
  id: 'teacher-limit',
  section: 'students',
  eyebrow: 'מורים נוספים',
  title: 'כמה מורים יכולים להתחבר לאותו מרחב?',
  summary: 'לא מפרסמים מספר עד שקיים נתון מחייב במקור האמת.',
  keywords: ['כמה מורים', 'מורים נוספים'],
  status: 'needs-fact',
  },
  {
  id: 'edit-mode',
  section: 'spaces',
  eyebrow: 'עריכה',
  title: 'מהו מצב עריכה במרחב הלמידה ומה אפשר לעשות בו?',
  summary: 'מדליקים את מתג „עריכה” בסרגל העליון.',
  steps: ['מאתרים את המתג.', 'מדליקים אותו.', 'מבצעים שינוי.', 'מכבים ובודקים.'],
  points: [
    'הוספת משאב או פעילות.',
    'עריכת כותרות בעיפרון.',
    'תפריט ⋮ לכל פריט: הגדרות, העברה, זמינות, שכפול, מחיקה.',
    'גרירת פריטים ממקום למקום.',
  ],
  screenshots: [
    { src: '03-topbar-edit-off.png', caption: 'מצב עריכה כבוי.' },
    { src: '04-topbar-edit-on.png', caption: 'מצב עריכה פעיל.' },
  ],
  keywords: ['מצב עריכה', 'עריכה', 'שינוי'],
  status: 'ready',
  },
  {
  id: 'add-content',
  section: 'spaces',
  eyebrow: 'תוכן',
  title: 'איך מוסיפים משאב או פעילות?',
  summary: 'מפעילים עריכה, לוחצים „הוספת משאב או פעילות” ובוחרים את הסוג.',
  steps: ['מפעילים עריכה.', 'לוחצים „הוספת משאב או פעילות”.', 'בוחרים סוג.', 'שומרים ובודקים.'],
  screenshots: [
    { src: '15-add-activity-button.png', caption: 'כפתור „+ הוספת משאב או פעילות”.' },
    { src: '16-activity-chooser.png', caption: 'בורר הפעילויות והמשאבים.' },
    { src: '17-activity-chooser-more.jpg', caption: 'אפשרויות נוספות בבורר.' },
  ],
  keywords: ['פעילות', 'משאב', 'קובץ', 'מטלה', 'בוחן'],
  status: 'ready',
  },
  {
  id: 'organize-content',
  section: 'spaces',
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
  section: 'spaces',
  eyebrow: 'ניהול משימות',
  title: 'איך מסתירים משימה או תוכן מהתלמידים?',
  summary: 'המשימה נשארת אצל המורה אבל מוסתרת מהתלמידים.',
  screenshots: [{ src: '42-activity-menu.png', caption: 'תפריט ⋮ של פעילות במצב עריכה — „זמינות” להסתרה.' }],
  keywords: ['הסתרה', 'משימה', 'זמינות'],
  status: 'ready',
  },
  {
  id: 'delete-task',
  section: 'spaces',
  eyebrow: 'ניהול משימות',
  title: 'איך מוחקים משימה, קישור או תוכן אחר מהמרחב?',
  summary: 'מחיקה מסירה את המשימה גם מתצוגת המורה; זו אינה הסתרה.',
  warning: 'יש להבדיל בין הסתרה למחיקה.',
  screenshots: [
    { src: '42-activity-menu.png', caption: 'תפריט ⋮ של פעילות במצב עריכה — „מחיקה” בתחתית התפריט.' },
    { src: '50-delete-confirm.png', caption: 'חלון האישור „האם למחוק את הפעילות?” — מחיקה או ביטול.' },
  ],
  keywords: ['מחיקה', 'משימה', 'הסתרה'],
  status: 'ready',
  },
  {
  id: 'unhide-task',
  section: 'spaces',
  eyebrow: 'ניהול משימות',
  title: 'איך מציגים מחדש תוכן שהוסתר?',
  steps: ['נכנסים למצב עריכה.', 'פותחים את תפריט ⋮ של הפריט המוסתר.', 'בוחרים „זמינות”.'],
  screenshots: [
    { src: '49-hidden-item-menu.png', caption: 'תפריט ⋮ של פריט „מוסתר בפני תלמידים” — האפשרות „זמינות”.' },
  ],
  keywords: ['הצגה מחדש', 'מוסתר', 'זמינות', 'הצג'],
  status: 'ready',
  },
  {
  id: 'digital-task-icon',
  section: 'spaces',
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
  section: 'spaces',
  eyebrow: 'סידור משימות',
  title: 'איך גוררים משימה ממקום למקום?',
  summary: 'במצב עריכה פותחים את תפריט המשימה, בוחרים „העברה” ובוחרים את המיקום החדש.',
  flow: [
    {
      text: 'במצב עריכה פותחים את תפריט שלוש הנקודות של המשימה ולוחצים „העברה”.',
      screenshot: { src: '80-activity-menu-move.png', caption: 'תפריט המשימה במצב עריכה — „העברה” בין הפעולות.' },
    },
    {
      text: 'בחלון „הזזת פעילות” בוחרים אחרי איזו פעילות למקם את המשימה.',
      screenshot: { src: '81-move-activity-modal.png', caption: 'חלון „הזזת פעילות” — עץ היחידות והפעילויות לבחירת היעד.' },
    },
    {
      text: 'המשימה עברה למקומה החדש.',
      screenshot: { src: '82-move-activity-result.png', caption: 'המשימה במיקומה החדש מיד לאחר ההעברה.' },
    },
  ],
  keywords: ['גרירה', 'הזזה', 'העברה', 'משימה'],
  status: 'ready',
  },
  {
  id: 'student-view',
  section: 'spaces',
  eyebrow: 'בדיקה',
  title: 'איך בודקים את המרחב כתלמיד?',
  summary: 'מחליפים תפקיד לתלמיד ובודקים לפני ששולחים קישור או משימה.',
  steps: ['מכבים עריכה.', 'פותחים את תפריט המשתמש.', 'בוחרים „החלפת תפקיד ל...” ואז „תלמיד”.', 'בודקים וחוזרים לתפקיד הרגיל.'],
  screenshots: [{ src: '09-user-menu.png', caption: 'תפריט המשתמש — מכאן מגיעים להחלפת תפקיד.' }],
  warning: 'לבדיקת הרשמה או הרשאות מיוחדות משתמשים בחשבון בדיקה מאושר.',
  keywords: ['תצוגת תלמיד', 'החלפת תפקיד', 'בדיקה'],
  status: 'ready',
  },
  {
  id: 'external-tools',
  section: 'spaces',
  eyebrow: 'כלים חיצוניים',
  title: 'איך מגיעים לכלי או שירות LTI חיצוני?',
  summary: 'פותחים „אפשרויות נוספות” ובוחרים „כלי או שירות LTI חיצוני”.',
  screenshots: [{ src: '08-more-options.jpg', caption: 'תפריט „אפשרויות נוספות” כולל ניהול כלי LTI.' }],
  warning: 'לא משנים הגדרות חיבור ללא הרשאה.',
  keywords: ['LTI', 'כלי חיצוני', 'חיבור'],
  status: 'ready',
  },
  {
  id: 'home-edit-controls',
  section: 'spaces',
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
  section: 'spaces',
  eyebrow: 'עריכה',
  title: 'איפה פותחים את תפריט יחידת ההוראה?',
  summary: 'פותחים את תפריט שלוש הנקודות של היחידה כדי להגיע לפעולות היחידה.',
  screenshots: [{ src: '07-unit-menu.jpg', caption: 'תפריט יחידת הוראה במצב עריכה.' }],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['יחידת הוראה', 'שלוש נקודות', 'תפריט'],
  status: 'ready',
  },
  {
  id: 'section-menu-actions',
  section: 'spaces',
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
  section: 'spaces',
  eyebrow: 'עריכה',
  title: 'איך נראים פריטים שמוסתרים מהתלמידים?',
  summary: 'Moodle מסמן פריטים מוסתרים כדי שהמורה יזהה מיד מה התלמידים אינם רואים.',
  screenshots: [{ src: '14-hidden-items.jpg', caption: 'דוגמאות לסימוני הסתרה וזמינות במרחב.' }],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['מוסתר בפני תלמידים', 'זמין', 'הסתרה'],
  status: 'ready',
  },
  {
  id: 'activity-chooser-more',
  section: 'spaces',
  eyebrow: 'תוכן',
  title: 'אילו פעילויות נוספות אפשר להוסיף?',
  summary: 'בורר הפעילויות כולל גם כלים נוספים כמו H5P, משחקים, Meet ו-SCORM כאשר הם זמינים.',
  screenshots: [{ src: '17-activity-chooser-more.jpg', caption: 'החלק הנוסף של בורר הפעילויות והמשאבים.' }],
  link: { href: MOODLE_HOME, label: 'פתיחת Moodle' },
  keywords: ['H5P', 'SCORM', 'Meet', 'פעילויות נוספות'],
  status: 'ready',
  },
  {
  id: 'import-task',
  section: 'spaces',
  eyebrow: 'ייבוא',
  title: 'איך מייבאים משימה ממרחב אחר?',
  summary: 'נכנסים ל„שימוש חוזר בתכנים”, בוחרים מקור, משימה ויעד ומאשרים.',
  screenshots: [{ src: '08-more-options.jpg', caption: '„אפשרויות נוספות” — מכאן נכנסים ל„שימוש חוזר בתכנים”.' }],
  keywords: ['ייבוא', 'שימוש חוזר בתכנים', 'מרחב אחר'],
  status: 'needs-capture',
  missingCaptureId: 'M18',
  },
  {
  id: 'content-updates-meaning',
  section: 'spaces',
  eyebrow: 'עדכונים למרחב',
  title: 'מה הם עדכונים למרחב?',
  summary: 'אלו משימות או תכנים שצוות מודל משנה, מעדכן או מוסיף במהלך השנה.',
  screenshots: [{ src: '31-updates-drawer.jpg', caption: 'פאנל עדכוני התוכן למורה.' }],
  keywords: ['עדכונים', 'תוכן ארצי', 'תבניות'],
  status: 'ready',
  },
  {
  id: 'content-updates',
  section: 'spaces',
  eyebrow: 'עדכונים למרחב',
  title: 'איך מכניסים עדכון למרחב?',
  summary: 'מפעילים עריכה, פותחים את רשימת העדכונים וגוררים את העדכון ליחידה המתאימה.',
  steps: ['מפעילים עריכה.', 'פותחים את פאנל העדכונים.', 'תופסים את ידית הגרירה.', 'גוררים ליחידה המתאימה.'],
  screenshots: [
    { src: '31-updates-drawer.jpg', caption: 'פאנל העדכונים.' },
    { src: '32-updates-list-expanded.jpg', caption: 'רשימת העדכונים וידית הגרירה.' },
  ],
  keywords: ['עדכונים', 'גרירה', 'תוכן ארצי'],
  status: 'needs-capture',
  missingCaptureId: 'M19',
  },
  {
  id: 'send-task',
  section: 'tasks-grades',
  eyebrow: 'שליחת משימה',
  title: 'איך שולחים לתלמידים משימה?',
  summary: 'אפשר להפנות למיקום בתוך המרחב או לשלוח קישור ישיר למשימה.',
  points: ['דרך המרחב — מציינים איפה המשימה.', 'בקישור ישיר — שולחים את כתובת המשימה.'],
  keywords: ['שליחת משימה', 'קישור משימה', 'שיתוף'],
  status: 'needs-capture',
  missingCaptureId: 'M11',
  },
  {
  id: 'student-solve-task',
  section: 'tasks-grades',
  eyebrow: 'תצוגת תלמיד',
  title: 'איך תלמיד פותר משימה במרחב?',
  flow: [
    {
      text: 'פותחים את המשימה ולוחצים „התחלת ניסיון מענה”.',
      screenshot: { src: '59-quiz-after-enrol.png', caption: 'עמוד הבוחן בתצוגת תלמיד עם „התחלת ניסיון מענה”.' },
    },
    {
      text: 'עונים על השאלות, עמוד אחרי עמוד.',
      screenshot: { src: '64-quiz-question.png', caption: 'עמוד שאלה בבוחן — בחירת תשובה ו„העמוד הבא”.' },
    },
    {
      text: 'בסיום לוחצים „שמירה וסיום” ואז „הגשה סופית”.',
      screenshot: { src: '55-quiz-review.png', caption: '„סקירת ניסיון מענה” לאחר ההגשה הסופית.' },
    },
  ],
  keywords: ['תלמיד פותר', 'התחלת ניסיון מענה', 'הגשה סופית'],
  status: 'ready',
  },
  {
  id: 'task-correction',
  section: 'tasks-grades',
  eyebrow: 'הגדרות משימה',
  title: 'איך מגדירים אם תלמיד יכול לתקן את התשובות שלו?',
  summary: 'מגדירים את מספר הניסיונות ואת מנגנון המשוב בשאלות.',
  steps: ['פותחים הגדרות בוחן.', 'בוחרים מספר ניסיונות.', 'בוחרים מנגנון משוב.', 'שומרים ובודקים כתלמיד.'],
  points: ['ניסיון אחד — אין ניסיון נוסף לאחר ההגשה.', 'במצב אינטראקטיבי ניתן לאפשר ניסיונות מענה לשאלה ורמזים.'],
  screenshots: [{ src: '33-quiz-question-behaviour.jpg', caption: 'מספר ניסיונות ומנגנון המשוב בשאלות.' }],
  keywords: ['תיקון', 'ניסיון נוסף', 'משוב', 'רמזים'],
  status: 'ready',
  },
  {
  id: 'assignment-submissions',
  section: 'tasks-grades',
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
  section: 'tasks-grades',
  eyebrow: 'משוב',
  title: 'איך מוסיפים משוב לתלמיד בסיום משימה?',
  summary: 'פותחים את ההגשה, כותבים משוב ושומרים.',
  keywords: ['משוב', 'הגשה', 'ציון'],
  status: 'needs-capture',
  missingCaptureId: 'M13',
  },
  {
  id: 'student-result',
  section: 'tasks-grades',
  eyebrow: 'תוצאה',
  title: 'איך תלמיד יודע אם עבר או נכשל במשימה?',
  summary: 'לאחר ההגשה התלמיד רואה את מסך התוצאה: ירוק מציין עבר, אדום מציין נכשל.',
  screenshots: [
    { src: '56-quiz-retry.png', caption: 'אחרי ההגשה: „בוצע” בירוק ו„נכשל” באדום מול ציון העובר.' },
    { src: '60-student-grade-report.png', caption: '„דוח ציוני התלמיד במרחב־לימוד זה” — „ציונים” בתפריט התלמיד.' },
  ],
  keywords: ['עבר', 'נכשל', 'ירוק', 'אדום', 'תוצאה'],
  status: 'ready',
  },
  {
  id: 'quiz-settings',
  section: 'tasks-grades',
  eyebrow: 'הגדרות משימה',
  title: 'איך מגדירים שתלמיד יוכל לנסות לפתור את המשימה שוב ושוב?',
  summary: 'בהגדרות הבוחן בוחרים את מספר הניסיונות המותרים.',
  steps: [
    'נכנסים למצב עריכה.',
    'פותחים את הגדרות הבוחן.',
    'מאתרים את „מספר נסיונות מותרים”.',
    'בוחרים „אין הגבלה”.',
    'שומרים.',
    'בודקים בתצוגת תלמיד שאפשר לבצע ניסיון נוסף.',
  ],
  points: ['למבחן חד־פעמי בוחרים ניסיון אחד.', 'לתרגול בוחרים „אין הגבלה”.'],
  screenshots: [
    { src: '33-quiz-question-behaviour.jpg', caption: '„מספר נסיונות מותרים” בהגדרות הבוחן — „אין הגבלה”.' },
    { src: '55-quiz-review.png', caption: 'תצוגת תלמיד: „סקירת ניסיון מענה” לאחר ההגשה הסופית.' },
    { src: '56-quiz-retry.png', caption: 'תצוגת תלמיד לאחר ההגשה: הכפתור „ניסיון חדש” וסיכום הניסיון שהסתיים.' },
  ],
  keywords: ['ניסיונות', 'פעם אחת', 'מבחן', 'בוחן', 'ניסיון חדש'],
  status: 'ready',
  },
  {
  id: 'pass-grade',
  section: 'tasks-grades',
  eyebrow: 'הגדרות משימה',
  title: 'איך מגדירים לתלמיד מהו ציון עובר במשימה?',
  summary: 'בהגדרות הבוחן, באזור הציון, קובעים את הערך בשדה „ציון "עובר"”.',
  steps: [
    'פותחים את הגדרות הבוחן.',
    'נכנסים לאזור „ציון”.',
    'מזינים ערך בשדה „ציון "עובר"” (בנקודות, למשל 80 מתוך 100).',
    'שומרים.',
    'התלמיד רואה את מצבו מול ציון העובר: „בוצע” בירוק או „נכשל” באדום.',
  ],
  screenshots: [
    { src: '33-quiz-question-behaviour.jpg', caption: 'השדה „ציון "עובר"” באזור הציון של הגדרות הבוחן.' },
    { src: '68-quiz-view-teacher.png', caption: 'עמוד הבוחן למורה: „ציון עובר: 80.00 מתוך 100.00” ושיטת מתן הציון.' },
    { src: '56-quiz-retry.png', caption: 'תצוגת התלמיד: „ציון עובר: 80.00 מתוך 100.00” והתג „נכשל” באדום.' },
  ],
  keywords: ['ציון עובר', 'עובר', 'נכשל', 'ציון'],
  status: 'ready',
  },
  {
  id: 'student-correct-space',
  section: 'tasks-grades',
  eyebrow: 'שיוך למרחב',
  title: 'למה המורה לא רואה ביצוע שהתלמיד אומר שביצע?',
  summary: 'בודקים שהתלמיד ביצע את המשימה במרחב של המורה ולא במרחב אחר או ב„למידה עצמית”.',
  steps: ['התלמיד פותח „מרחבי־הלימוד שלי”.', 'בוחר במרחב של הכיתה והמורה.', 'מוודא שהמשימה נמצאת באותו מרחב.', 'רק אז בודקים ביצוע.'],
  screenshots: [{ src: '30-student-mycourses-selflearning.jpg', caption: 'מרחב המורה לצד מרחב „למידה עצמית”.' }],
  keywords: ['מרחב אחר', 'למידה עצמית', 'שיוך', 'תלמיד'],
  status: 'ready',
  },
  {
  id: 'logs',
  section: 'tasks-grades',
  eyebrow: 'פעילות תלמיד',
  title: 'איך רואים את יומני המעקב של הפעילות במרחב הלמידה?',
  summary: 'פותחים יומני מעקב, בוחרים תלמיד ופעילות ורואים את מועד האירוע.',
  steps: [
    'פותחים „דוחות” ואז „יומני מעקב”.',
    'בוחרים משתתף, פעילות או תאריך במסננים.',
    'לוחצים „הצגת יומני מעקב אלו”.',
    'בטבלה רואים מי ביצע, איזו פעולה ובאיזה תאריך ושעה.',
  ],
  screenshots: [
    { src: '51-logs-chooser.png', caption: '„בחירת יומני מעקב אותם יש להציג” — המסננים והכפתור „הצגת יומני מעקב אלו”.' },
    { src: '52-logs-table.png', caption: 'טבלת יומני המעקב — מי ביצע, איזו פעולה, תאריך ושעה.' },
  ],
  warning: 'יומן המעקב מציג אירועים; הוא אינו מודד זמן קשב או איכות למידה.',
  keywords: ['מתי תרגל', 'יומני מעקב', 'פעילות תלמיד', 'לוגים'],
  status: 'ready',
  },
  {
  id: 'student-attempt-count',
  section: 'tasks-grades',
  eyebrow: 'ביצועי תלמיד',
  title: 'איך רואים כמה פעמים תלמיד ניסה לפתור משימה?',
  summary: 'פותחים את מסך התוצאות של המשימה ורואים את רשימת הניסיונות.',
  flow: [
    {
      text: 'בעמוד הבוחן רואים את „ניסיונות מענה” ולוחצים „תוצאות”.',
      screenshot: { src: '68-quiz-view-teacher.png', caption: 'עמוד הבוחן למורה — „ניסיונות מענה: 1”, שיטת מתן הציון וציון עובר.' },
    },
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
  section: 'tasks-grades',
  eyebrow: 'ביצועי תלמיד',
  title: 'איך רואים את הציון הגבוה ביותר של תלמיד במשימה?',
  summary: 'במסך התוצאות משווים בין הניסיונות ורואים את הציון הגבוה ביותר.',
  points: ['כששיטת מתן הציון היא „הציון הגבוה ביותר”, הציון בבוחן הוא הגבוה מבין הניסיונות.', 'בדוח התוצאות אפשר להציג ניסיון מענה אחד שהסתיים עבור כל משתמש — הציון הגבוה ביותר.'],
  screenshots: [
    { src: '67-quiz-attempts-report.png', caption: 'דוח התוצאות — „שיטת מתן הציונים עבור בוחן זה הוא הציון הגבוה ביותר”.' },
  ],
  keywords: ['ציון גבוה ביותר', 'ניסיונות', 'ביצועים'],
  status: 'ready',
  },
  {
  id: 'gradebook',
  section: 'tasks-grades',
  eyebrow: 'ציונים',
  title: 'איך רואים ציונים של תלמידים?',
  summary: 'כל שורה היא תלמיד וכל עמודה היא פריט ציון או סיכום.',
  points: ['מאתרים תלמיד.', 'מאתרים משימה.', 'בודקים ציון או מצב.', 'בודקים סיכום רק אחרי בדיקת המשקלים.'],
  screenshots: [
    { src: '65-gradebook-grader.png', caption: 'דוח הציונים — שורה לכל תלמיד ועמודה לכל פריט ציון, עם חיפוש ובחירת קבוצות.' },
  ],
  warning: 'תא ריק אינו הוכחה לאי־הגשה.',
  keywords: ['יומן ציונים', 'ציון', 'תא ריק'],
  status: 'ready',
  },
  {
  id: 'export-grades',
  section: 'tasks-grades',
  eyebrow: 'ייצוא',
  title: 'איך מורידים דוח ציונים לכיתה?',
  summary: 'פותחים „ציונים” → „יצוא”, בוחרים פורמט ופריטים ומורידים.',
  flow: [
    {
      text: 'פותחים „ציונים” ובוחרים „יצוא”.',
      screenshot: { src: '65-gradebook-grader.png', caption: 'לשונית „ציונים” במרחב — מכאן עוברים ל„יצוא”.' },
    },
    {
      text: 'בוחרים פורמט, למשל „יצוא לגליון האלקטרוני של Excel”, ומסמנים את הפריטים הנחוצים.',
      screenshot: { src: '66-gradebook-export.png', caption: 'מסך היצוא — בחירת הפורמט וסימון פריטי הציון.' },
    },
    { text: 'לוחצים „הורדה” ובודקים את הקובץ.' },
  ],
  warning: 'קובץ ציונים עשוי להכיל מידע אישי ויש לשמור אותו במקום מאובטח.',
  keywords: ['ייצוא ציונים', 'Excel', 'CSV'],
  status: 'ready',
  },
  {
  id: 'report-chooser',
  section: 'tasks-grades',
  eyebrow: 'דוחות',
  title: 'איך בוחרים את הדוח המתאים?',
  summary: 'בוחרים דוח לפי השאלה שרוצים לבדוק.',
  points: ['פעולה ומועד — יומני מעקב.', 'השלמה — דוח השלמות.', 'צפיות — פעילות מרחב.', 'ציונים — יומן ציונים.'],
  screenshots: [{ src: '18-reports.jpg', caption: 'עמוד הדוחות — בוחרים את הדוח לפי הצורך.' }],
  keywords: ['דוחות', 'יומני מעקב', 'השלמות'],
  status: 'ready',
  },
  {
  id: 'completion',
  section: 'tasks-grades',
  eyebrow: 'השלמות',
  title: 'מה ההבדל בין השלמה לציון?',
  summary: 'השלמה מציינת שתנאי בוצע; ציון מציג תוצאת הערכה.',
  points: ['השלמה יכולה להיות אוטומטית או ידנית.', 'ציון יכול להיות מספר או אחוז.', 'אפשר להשלים ולקבל ציון נמוך.'],
  keywords: ['השלמה', 'ציון', 'תנאים'],
  status: 'ready',
  },
  {
  id: 'learning-management',
  section: 'tasks-grades',
  eyebrow: 'ניהול למידה',
  title: 'איך נכנסים לדוח „ניהול למידה”?',
  summary: 'פותחים „דוחות” ובוחרים „ניהול למידה”, אם הוא זמין במרחב.',
  screenshots: [{ src: '18-reports.jpg', caption: 'עמוד הדוחות כולל „ניהול למידה”.' }],
  keywords: ['ניהול למידה', 'גרפים', 'ממוצע'],
  status: 'ready',
  },
  {
  id: 'notifications',
  section: 'tasks-grades',
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
  section: 'tasks-grades',
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
  section: 'tasks-grades',
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
  section: 'tasks-grades',
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

