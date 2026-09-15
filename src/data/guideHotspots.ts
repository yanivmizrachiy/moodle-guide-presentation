export type GuideHotspot = {
  /** Stable id for audits and future editing. */
  id: string;
  /** Short Hebrew description of the real Moodle control. */
  label: string;
  /** Percentage coordinates relative to the original screenshot. */
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Verified screenshot hotspots only.
 *
 * IMPORTANT:
 * - Keep this map empty for a screenshot until the control location has been
 *   checked against the real source image.
 * - Coordinates are percentages (0..100), never pixels, so overlays remain
 *   aligned on desktop, mobile and in the lightbox.
 * - Never infer or invent a hotspot from a caption alone.
 */
export const GUIDE_SCREENSHOT_HOTSPOTS: Readonly<Record<string, readonly GuideHotspot[]>> = Object.freeze({
  // 3200x1800 current-design confirmation step: the "אישור" button, bottom-left.
  '24-wizard-step4': [
    { id: 'confirm-button', label: 'אישור', x: 4.0, y: 78.0, width: 4.9, height: 5.5 },
  ],
  // 3200x1800: the blue "רשום אותי" button on the current space's enrol page.
  '53-student-enrol': [
    { id: 'enrol-me', label: 'רשום אותי', x: 57.2, y: 47.4, width: 9.6, height: 9.8 },
  ],
  // 958x797: the attempts select and the pass-grade field above it.
  '33-quiz-question-behaviour': [
    { id: 'unlimited-attempts', label: 'מספר נסיונות מותרים — אין הגבלה', x: 56.2, y: 11.8, width: 15.8, height: 10.4 },
    { id: 'pass-grade', label: 'ציון "עובר"', x: 47.5, y: 5.4, width: 24, height: 8 },
  ],
  // 3200x1800 settings form: the full-name field.
  '41-space-settings': [
    { id: 'fullname', label: 'השם המלא של מרחב־הלימוד', x: 26.8, y: 35.8, width: 30, height: 7.4 },
  ],
  // 3200x1800 settings form bottom: the save button.
  '43-space-settings-save': [
    { id: 'save', label: 'שמירת השינויים והצגתם', x: 43.5, y: 85.5, width: 13, height: 5.6 },
  ],
  // 3200x1800 settings: the course-image files box.
  '44-space-image': [
    { id: 'image-box', label: 'תמונת מרחב־הלימוד', x: 41.3, y: 5.6, width: 16.4, height: 24.5 },
  ],
  // 3200x1800 logs chooser: the filters row and the show button.
  '51-logs-chooser': [
    { id: 'filters', label: 'מסנני יומני המעקב', x: 21.5, y: 43.2, width: 60.5, height: 12.6 },
    { id: 'show-logs', label: 'הצגת יומני מעקב אלו', x: 68.2, y: 53.8, width: 13.2, height: 7 },
  ],
  // 3200x1800 logs table: the results header area.
  '52-logs-table': [
    { id: 'log-rows', label: 'עמודות היומן: מי, מה, מתי', x: 3.6, y: 60.2, width: 77, height: 9 },
  ],
  // 3200x1800 new my-courses page: the "מרחב חדש" button.
  '61-my-courses-new': [
    { id: 'new-space', label: 'מרחב חדש', x: 22.4, y: 20.4, width: 10.6, height: 7.6 },
  ],
  // 3200x1800 home page in edit mode: the "עריכה" toggle, top-left corner.
  '05-home-edit-on': [
    { id: 'edit-toggle', label: 'עריכה', x: 3.4, y: 2.2, width: 6.6, height: 6 },
  ],
  // 400x62 top-bar crop: the "מצב עריכה" toggle sits on the left.
  '03-topbar-edit-off': [
    { id: 'edit-toggle', label: 'מצב עריכה', x: 5, y: 20, width: 36, height: 56 },
  ],
  '04-topbar-edit-on': [
    { id: 'edit-toggle', label: 'מצב עריכה', x: 5, y: 20, width: 36, height: 56 },
  ],
  // 3200x1800 student quiz page after submission: the "ניסיון חדש" button.
  '56-quiz-retry': [
    { id: 'new-attempt', label: 'ניסיון חדש', x: 63, y: 33.2, width: 9.4, height: 7.6 },
  ],
  // 3200x1800 activity kebab menu: the availability and delete entries.
  '42-activity-menu': [
    { id: 'settings', label: 'הגדרות', x: 5.2, y: 59.3, width: 13.4, height: 7.6 },
    { id: 'availability', label: 'זמינות', x: 5.2, y: 68, width: 13.4, height: 7.6 },
    { id: 'delete', label: 'מחיקה', x: 5.2, y: 80.8, width: 13.4, height: 7.6 },
  ],
  // 3200x1800 course page in edit mode: the add-activity button at the section end.
  '15-add-activity-button': [
    { id: 'add-activity', label: 'הוספת משאב או פעילות', x: 36, y: 84, width: 12, height: 5.6 },
  ],
  // 3200x1800 delete-confirmation dialog: the red confirm button.
  '50-delete-confirm': [
    { id: 'confirm-delete', label: 'מחיקה', x: 34.5, y: 22, width: 6, height: 4.8 },
  ],
  // 3200x1800 hidden-item kebab menu: the "זמינות" entry.
  '49-hidden-item-menu': [
    { id: 'availability', label: 'זמינות', x: 4.5, y: 59, width: 13, height: 6 },
  ],
  // 3200x1800 student quiz page after enrol: the "התחלת ניסיון מענה" button.
  '59-quiz-after-enrol': [
    { id: 'start-attempt', label: 'התחלת ניסיון מענה', x: 64.8, y: 35.3, width: 9.6, height: 4.6 },
  ],
  // 1600x900 opening wizard, step 1: the two real choice cards. Each branch
  // path opts into its own card via hotspotIds, so the shared screen circles
  // only the option that path is about.
  '45-open-space-choice': [
    { id: 'with-group', label: 'עם קבוצת לימוד', x: 50.3, y: 29.8, width: 22.2, height: 45.3 },
    { id: 'without-group', label: 'ללא קבוצת לימוד', x: 27.5, y: 29.8, width: 22.2, height: 45.3 },
  ],
  // 3200x1800 course page: the space-navigation tabs. Shared across several
  // slides, so each is marked only on steps that opt in via hotspotIds.
  '10-course-page': [
    { id: 'settings-tab', label: 'הגדרות', x: 58.3, y: 20.4, width: 5.6, height: 4.6 },
    { id: 'participants-tab', label: 'משתתפים', x: 51.6, y: 20.4, width: 5, height: 4.6 },
  ],
  // 3200x1800 participants list: the roles column (each participant's תפקיד).
  '47-participants-list': [
    { id: 'roles-column', label: 'תפקיד', x: 41, y: 76, width: 11, height: 10 },
  ],
  // 3200x1800 role editor open: the role picker with its options.
  '62-role-options': [
    { id: 'role-select', label: 'בחירת תפקיד', x: 41, y: 90.5, width: 13.5, height: 8 },
  ],
  // 3200x1800 after saving: the updated role cell shows "תלמיד, מורה".
  '63-role-teacher-saved': [
    { id: 'updated-role', label: 'תלמיד, מורה', x: 46.8, y: 84.5, width: 8, height: 5 },
  ],
  // 3200x1800 new wizard, ready-content step: the search row.
  '34-wizard-ready-content-search': [
    { id: 'search', label: 'חיפוש', x: 87.3, y: 26.0, width: 8.7, height: 4.1 },
  ],
  // 3200x1800 ready-content list view: the view-toggle buttons.
  '35-wizard-ready-content-list-toggle': [
    { id: 'view-toggle', label: 'שינוי תצוגה', x: 4.0, y: 50.2, width: 5.4, height: 5.0 },
  ],
  // 3200x1800 clone step: the breadcrumb showing the chosen path.
  '36-wizard-clone-my-content': [
    { id: 'clone-path', label: 'שכפול תוכן שלי', x: 76.5, y: 21.9, width: 7.1, height: 3.0 },
  ],
  // 3200x1800 clone list: search row and the year sort control.
  '37-wizard-clone-sort': [
    { id: 'search', label: 'חיפוש', x: 87.3, y: 26.0, width: 8.7, height: 4.1 },
    { id: 'year-sort', label: 'מיון לפי שנת לימודים', x: 5.3, y: 32.9, width: 7.5, height: 2.8 },
  ],
  // 3200x1800 clone list: the selected previous-year row's year cell.
  '38-wizard-clone-previous-year': [
    { id: 'previous-year', label: 'מרחב משנה קודמת', x: 6.2, y: 68.1, width: 3.7, height: 3.1 },
  ],
  // 3200x1800 grader report: the "ציונים" tab in the space navigation.
  '65-gradebook-grader': [
    { id: 'grades-tab', label: 'ציונים', x: 72.7, y: 21.7, width: 4.4, height: 5.0 },
  ],
  // 3200x1800 export page: the format dropdown and the download button.
  '66-gradebook-export': [
    { id: 'format', label: 'יצוא לגליון האלקטרוני של Excel', x: 61.6, y: 25.1, width: 10.9, height: 3.2 },
    { id: 'download', label: 'הורדה', x: 3.3, y: 93.1, width: 5.4, height: 5.1 },
  ],
  // 3200x1800 quiz overview report: grading-method line and the grade column.
  '67-quiz-attempts-report': [
    { id: 'highest-grade-note', label: 'הציון הגבוה ביותר', x: 72.6, y: 8.4, width: 22.3, height: 3.6 },
    { id: 'grade-column', label: 'ציונים/100.00', x: 42.4, y: 38.6, width: 7.4, height: 3.3 },
  ],
  // 3200x1800 teacher quiz view: attempts count and grading method.
  '68-quiz-view-teacher': [
    { id: 'attempts', label: 'ניסיונות מענה', x: 71.7, y: 57.1, width: 7.4, height: 3.2 },
    { id: 'grading-method', label: 'שיטת מתן הציון', x: 67.3, y: 49.5, width: 11.8, height: 3.1 },
  ],
  // 3200x1800 edit mode: the section-title edit pencil.
  '69-section-rename-pencil': [
    { id: 'rename-pencil', label: 'עריכת שם היחידה', x: 68.9, y: 48.7, width: 2.2, height: 3.3 },
  ],
  // 3200x1800 edit mode: the inline title field.
  '70-section-rename-field': [
    { id: 'rename-field', label: 'שדה הכותרת', x: 54.0, y: 47.9, width: 21.3, height: 4.7 },
  ],
  // 3200x1800 groups page: the create-group button.
  '71-groups-page': [
    { id: 'create-group', label: 'יצירת קבוצה', x: 70.1, y: 81.4, width: 7.6, height: 5.3 },
  ],
  // 3200x1800 group form: the group-name field.
  '72-group-create-form': [
    { id: 'group-name', label: 'שם הקבוצה', x: 43.4, y: 27.8, width: 28.8, height: 5.5 },
  ],
  // 3200x1800 add/remove members: the add button.
  '73-group-add-members': [
    { id: 'add-member', label: 'הוספה', x: 53.3, y: 39.3, width: 9.4, height: 5.0 },
  ],
  // 3200x1800 grader: the visible-groups selector open with its options.
  '75-grader-group-selector-open': [
    { id: 'group-option', label: 'קבוצה 1', x: 65.6, y: 49.5, width: 7.2, height: 6.0 },
  ],
  // 3200x1800 grader filtered by group: the selector showing the chosen group.
  '76-grader-group-filtered': [
    { id: 'group-widget', label: 'בחירת קבוצות נראות', x: 47.9, y: 29.5, width: 10.4, height: 4.9 },
  ],
  // 3200x1800 participants: the unenrol (trash) icon in the user's row.
  '77-participant-row-controls': [
    { id: 'unenrol-icon', label: 'ביטול שיוך לתפקיד בקורס', x: 9.6, y: 79.6, width: 1.9, height: 3.2 },
  ],
  // 3200x1800 unenrol dialog: the confirm button.
  '78-unenrol-confirm-dialog': [
    { id: 'confirm-unenrol', label: 'ביטול שיוך לתפקיד בקורס', x: 34.9, y: 21.5, width: 13.1, height: 5.2 },
  ],
  // 958x910 student my-courses: the "למידה עצמית" self-learning space card.
  '30-student-mycourses-selflearning': [
    { id: 'self-learning', label: 'למידה עצמית', x: 71.5, y: 50.5, width: 14, height: 5 },
  ],
  // Concept-highlight audit: the one key term that answers each slide's question.
  '20-wizard-step1-selected': [
    { id: 'no-group', label: 'ללא קבוצת לימוד', x: 31.3, y: 66.2, width: 18.4, height: 6.3 },
  ],
  '46-open-space-form': [
    { id: 'next', label: 'הבא', x: 4.2, y: 90.7, width: 3.9, height: 5.2 },
  ],
  '58-student-space-topic': [
    { id: 'pending', label: 'ממתין לביצוע', x: 14.7, y: 93.4, width: 7.3, height: 4.7 },
  ],
  '54-student-enrolled': [
    { id: 'enrolled-ok', label: 'נרשמתם לקורס בהצלחה', x: 58.5, y: 28.5, width: 12, height: 4.5 },
  ],
  '26-selfenrol-methods-list': [
    { id: 'self-enrol-method', label: 'שיוך עצמי (תלמיד)', x: 75, y: 48, width: 20, height: 4.2 },
  ],
  '27-selfenrol-settings': [
    { id: 'enrol-active', label: 'מנגנון רישום עצמי פעיל?', x: 75.4, y: 35.9, width: 17.7, height: 3.6 },
  ],
  '74-groups-two-groups': [
    { id: 'add-members', label: 'הוספת/הסרת משתתפים מקבוצה', x: 33, y: 85.3, width: 16, height: 5.5 },
  ],
  '06-course-edit-on': [
    { id: 'edit-toggle', label: 'מצב עריכה', x: 1.2, y: 2.2, width: 8.6, height: 4.6 },
  ],
  '09-user-menu': [
    { id: 'switch-role', label: 'החלפת תפקיד ל...', x: 13.5, y: 25.9, width: 10, height: 3.4 },
  ],
  '08-more-options': [
    { id: 'lti', label: 'כלי או שירות LTI חיצוני', x: 32.2, y: 68.2, width: 11.8, height: 3.5 },
  ],
  '07-unit-menu': [
    { id: 'unit-kebab', label: 'תפריט יחידת ההוראה', x: 8.2, y: 74.5, width: 4.3, height: 7.8 },
  ],
  '14-hidden-items': [
    { id: 'hidden-label', label: 'מוסתר בפני תלמידים', x: 56.5, y: 29.6, width: 11.5, height: 3.6 },
  ],
  '18-reports': [
    { id: 'learning-mgmt', label: 'ניהול למידה', x: 68.3, y: 58.7, width: 6.4, height: 3.2 },
  ],
  // 3200x1800 activity edit menu: the move entry.
  '80-activity-menu-move': [
    { id: 'move-entry', label: 'העברה', x: 17.7, y: 57.6, width: 6.3, height: 4.2 },
  ],
  // 3200x1800 move-activity dialog: the chosen destination.
  '81-move-activity-modal': [
    { id: 'move-target', label: 'בחירת היעד', x: 58.4, y: 46.1, width: 4.2, height: 3.2 },
  ],
  // 3200x1800 after the move: the activity at its new position.
  '82-move-activity-result': [
    { id: 'moved-activity', label: 'המשימה במיקום החדש', x: 68.7, y: 60.2, width: 5.3, height: 3.7 },
  ],
});

export function isValidHotspot(hotspot: GuideHotspot) {
  return (
    hotspot.id.trim().length > 0 &&
    hotspot.label.trim().length > 0 &&
    Number.isFinite(hotspot.x) &&
    Number.isFinite(hotspot.y) &&
    Number.isFinite(hotspot.width) &&
    Number.isFinite(hotspot.height) &&
    hotspot.x >= 0 &&
    hotspot.y >= 0 &&
    hotspot.width > 0 &&
    hotspot.height > 0 &&
    hotspot.x + hotspot.width <= 100 &&
    hotspot.y + hotspot.height <= 100
  );
}

export function getGuideScreenshotHotspots(src: string): readonly GuideHotspot[] {
  const key = src.replace(/\.[^.]+$/, '');
  return (GUIDE_SCREENSHOT_HOTSPOTS[key] ?? []).filter(isValidHotspot);
}
