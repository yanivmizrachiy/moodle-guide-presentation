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
    { id: 'time-column', label: 'עמודת „זמן” — תאריך ושעה', x: 72.8, y: 61.5, width: 6.2, height: 12.5 },
  ],
  // 3200x1800 new my-courses page: the "מרחב חדש" button.
  '61-my-courses-new': [
    { id: 'new-space', label: 'מרחב חדש', x: 22.4, y: 20.4, width: 10.6, height: 7.6 },
  ],
  // 1200x603 course page in edit mode: the „מצב עריכה" toggle, top-left corner.
  '06-course-edit-on': [
    { id: 'edit-toggle', label: 'מצב עריכה', x: 1.9, y: 1.8, width: 7.3, height: 4.8 },
  ],
  // 3200x1800 home page in edit mode: the "עריכה" toggle, top-left corner.
  '05-home-edit-on': [
    { id: 'edit-toggle', label: 'עריכה', x: 1.3, y: 1.9, width: 6, height: 2.9 },
  ],
  // 3200x1800 student quiz page after submission: the "ניסיון חדש" button.
  '56-quiz-retry': [
    { id: 'result-badges', label: 'בוצע: קבלת ציון / נכשל: קבלת ציון "עובר"', x: 51.6, y: 26.1, width: 18.2, height: 4.8 },
    { id: 'new-attempt', label: 'ניסיון חדש', x: 63, y: 33.2, width: 9.4, height: 7.6 },
  ],
  // 3200x1800 activity kebab menu: the availability and delete entries.
  '42-activity-menu': [
    { id: 'kebab', label: '⋮ — כפתור תפריט הפעילות (שלוש נקודות)', x: 14.1, y: 54.9, width: 4.8, height: 5.8 },
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
    { id: 'next', label: 'הבא', x: 4.0, y: 78.8, width: 4.4, height: 6 },
  ],
  // 3200x1800 course page: the space-navigation tabs. Shared across several
  // slides, so each is marked only on steps that opt in via hotspotIds.
  '10-course-page': [
    { id: 'edit-toggle', label: 'עריכה', x: 1.3, y: 1.9, width: 6, height: 2.9 },
    { id: 'settings-tab', label: 'הגדרות', x: 58.3, y: 20.4, width: 5.6, height: 4.6 },
    { id: 'participants-tab', label: 'משתתפים', x: 51.6, y: 20.4, width: 5, height: 4.6 },
  ],
  // 3200x1800 participants list: the roles column (each participant's תפקיד).
  '47-participants-list': [
    { id: 'users-selector', label: 'משתתפים רשומים', x: 66.6, y: 24.7, width: 13.1, height: 3.8 },
    { id: 'roles-column', label: 'עמודת „תפקידים”', x: 36.5, y: 69.5, width: 10.5, height: 16 },
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
    { id: 'project-list', label: 'בחר פרויקט', x: 4.2, y: 31.8, width: 92, height: 11.4 },
    { id: 'content-card', label: 'מתמטיקה לחט"ב ז\' – 2027', x: 72.5, y: 54.3, width: 23.3, height: 31.1 },
    { id: 'next', label: 'הבא', x: 3.5, y: 86.5, width: 5.3, height: 6.3 },
    { id: 'search', label: 'חיפוש', x: 87.3, y: 26.0, width: 8.7, height: 4.1 },
  ],
  // 3200x1800 ready-content list view: the view-toggle buttons.
  '35-wizard-ready-content-list-toggle': [
    { id: 'view-toggle', label: 'שינוי תצוגה', x: 4.0, y: 50.2, width: 5.4, height: 5.0 },
  ],
  // 3200x1800 clone step: the breadcrumb showing the chosen path.
  '36-wizard-clone-my-content': [
    { id: 'space-row', label: 'המרחב של רות ויניב', x: 86.9, y: 66.4, width: 8.4, height: 3.4 },
    { id: 'next', label: 'הבא', x: 3.5, y: 85.3, width: 5.3, height: 6.2 },
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
    { id: 'group-selector', label: 'בחירת קבוצות נראות — קבוצה 1', x: 47.8, y: 29.3, width: 10.8, height: 5.7 },
    { id: 'grades-tab', label: 'ציונים', x: 72.7, y: 21.7, width: 4.4, height: 5.0 },
  ],
  // 3200x1800 export page: the format dropdown and the download button.
  '66-gradebook-export': [
    { id: 'export-items', label: 'רשימת תיבות הסימון של פרטי הציון (תחת „יש לכלול את פרטי הציון")', x: 46.9, y: 53.2, width: 25.4, height: 37.1 },
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
    { id: 'results-tab', label: 'תוצאות', x: 60.5, y: 25.8, width: 4.3, height: 3.6 },
    { id: 'attempts', label: 'ניסיונות מענה', x: 71.7, y: 57.1, width: 7.4, height: 3.2 },
    { id: 'grading-method', label: 'שיטת מתן הציון', x: 64.3, y: 49.5, width: 14.8, height: 3.1 },
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
  '46-open-space-form': [
    { id: 'next', label: 'הבא', x: 4.2, y: 90.7, width: 3.9, height: 5.2 },
  ],
  '58-student-space-topic': [
    { id: 'activity-link', label: 'יחס - בסיסי', x: 59.8, y: 94, width: 6.4, height: 3.6 },
    { id: 'pending', label: 'ממתין לביצוע', x: 14.7, y: 93.4, width: 7.3, height: 4.7 },
  ],
  '54-student-enrolled': [
    { id: 'enrolled-ok', label: 'נרשמתם לקורס בהצלחה', x: 58.5, y: 28.5, width: 12, height: 4.5 },
  ],
  '74-groups-two-groups': [
    { id: 'add-members', label: 'הוספת/הסרת משתתפים מקבוצה', x: 33, y: 85.3, width: 16, height: 5.5 },
  ],
  '09-user-menu': [
    { id: 'user-button', label: 'יניב', x: 8.4, y: 1.9, width: 3.7, height: 2.9 },
    { id: 'switch-role', label: 'החלפת תפקיד ל...', x: 13.5, y: 25.9, width: 10, height: 3.4 },
  ],
  '08-more-options': [
    { id: 'more-tab', label: 'אפשרויות נוספות', x: 30.2, y: 23.4, width: 12.4, height: 10.2 },
    { id: 'lti', label: 'כלי או שירות LTI חיצוני', x: 32.2, y: 68.2, width: 11.8, height: 3.5 },
  ],
  '07-unit-menu': [
    { id: 'unit-kebab', label: 'תפריט יחידת ההוראה', x: 8.2, y: 74.5, width: 4.3, height: 7.8 },
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
  // 3200x1800 generic activity settings form (a forum): the name field.
  '100-activity-settings-name': [
    { id: 'activity-name', label: 'שם הפעילות', x: 28, y: 38.3, width: 35.9, height: 5.8 },
  ],
  // 3200x1800 same form: availability and the „הגבלת גישה" section.
  '101-activity-settings-access': [
    { id: 'availability-select', label: 'זמינות', x: 38.5, y: 23.6, width: 25.4, height: 5.6 },
    { id: 'add-restriction', label: 'הוספת הגבלה', x: 54.4, y: 76.5, width: 8.6, height: 5.6 },
  ],
  // 3200x1800 same form, bottom: the save buttons.
  '102-activity-settings-save': [
    { id: 'save', label: 'שמירת שינויים וחזרה למרחב־לימוד', x: 47.2, y: 89.9, width: 16.6, height: 5.4 },
  ],
  // 3200x1800 group-creation form, bottom: the save button.
  '103-group-form-save': [
    { id: 'save', label: 'שמירת שינויים', x: 63.6, y: 85.5, width: 8.8, height: 5.7 },
  ],
  // 3200x1800 „החלפת תפקיד ל..." screen: the role buttons.
  '104-switch-role-choice': [
    { id: 'student-role', label: 'תלמיד', x: 89.5, y: 47.8, width: 5.6, height: 5.5 },
  ],
  // 3200x1800 the space as a student sees it: the current-role indicator.
  '105-student-view-space': [
    { id: 'role-indicator', label: 'תלמיד — סימון התפקיד הנוכחי', x: 0.5, y: 1.4, width: 5.8, height: 4 },
  ],
  // 3200x1800 user menu while the role is switched: the way back.
  '106-return-to-teacher-role': [
    { id: 'return-role', label: 'חזרה לתפקיד הרגיל שלי', x: 0.8, y: 21, width: 15.5, height: 4.2 },
  ],
  // 3200x1800 space home page: the real button that copies the space address.
  '02-copy-space-link': [
    { id: 'copy-space-link', label: 'העתקת כתובת מרחב הלמידה ללוח', x: 61.4, y: 52.4, width: 15.3, height: 5.6 },
  ],
  // 1616x150 browser strip: the space address in the browser address bar.
  '19-space-address-bar': [
    { id: 'space-url', label: 'כתובת המרחב בשורת הכתובת', x: 9.3, y: 28, width: 24.6, height: 30 },
  ],
  // 1616x150 browser strip: the task address in the browser address bar.
  '23-task-address-bar': [
    { id: 'task-url', label: 'כתובת המשימה בשורת הכתובת', x: 9.3, y: 28, width: 26.6, height: 30 },
  ],
  // 3200x1420 participants page (cropped above the table for privacy): the menu
  // that leads to the enrolment methods.
  // 3200x1800 group members screen: the two lists it moves users between.
  '73-group-add-members': [
    { id: 'available-user', label: 'משתמשים זמינים — המשתמש שבוחרים', x: 31.4, y: 38, width: 18.7, height: 4.4 },
    { id: 'group-member', label: 'חברי הקבוצה — המשתמש שנוסף', x: 66.6, y: 38, width: 28, height: 4.4 },
    { id: 'add-member', label: 'הוספה', x: 52.9, y: 39.2, width: 9.2, height: 4.6 },
  ],
  '25-participants-nav': [
    { id: 'groups-entry', label: 'קבוצות', x: 86.5, y: 62.1, width: 9.7, height: 5.2 },
    { id: 'users-menu', label: 'תפריט „משתמשים רשומים”', x: 82.6, y: 30.2, width: 13, height: 6.8 },
    { id: 'enrol-methods-entry', label: 'שיטות שיוך לתפקיד', x: 84.6, y: 46.8, width: 10.3, height: 5.4 },
  ],
  // 3200x1800 quiz settings, „ציונים" area: pass grade, attempts and grading method.
  '86-quiz-settings-grades': [
    { id: 'pass-grade', label: 'ציון "עובר"', x: 50.1, y: 64.9, width: 13.7, height: 5.6 },
    { id: 'unlimited-attempts', label: 'מספר נסיונות מותרים — אין הגבלה', x: 56.2, y: 71.2, width: 7.7, height: 5.6 },
    { id: 'grading-method', label: 'שיטת מתן ציונים — הציון הגבוה ביותר', x: 53.1, y: 77.5, width: 10.8, height: 5.6 },
    { id: 'timing', label: 'תזמון — תחילת הבוחן וסיום הבוחן', x: 20.5, y: 15.2, width: 58.5, height: 33.5 },
  ],
  // 3200x1800 quiz settings, „התנהגות השאלה" area: the feedback-mechanism field.
  '87-quiz-settings-behaviour': [
    { id: 'question-behaviour', label: 'מנגנון המשוב בשאלות', x: 38.0, y: 64.8, width: 25.8, height: 5.6 },
  ],
  // 3200x1800 bottom of the quiz settings form: the save button.
  '88-quiz-settings-save': [
    { id: 'save', label: 'שמירת שינויים וחזרה למרחב־לימוד', x: 47.2, y: 89.9, width: 16.6, height: 5.4 },
  ],
  // 3200x1800 teacher quiz page: the „הגדרות" tab and the pass-grade line.
  '89-quiz-tabs-settings': [
    { id: 'settings-tab', label: 'הגדרות', x: 70.1, y: 22.4, width: 4.7, height: 4.9 },
    { id: 'pass-grade-line', label: 'ציון עובר: 80.00 מתוך 100.00', x: 66.0, y: 48.6, width: 13.2, height: 4.2 },
  ],
  // 3200x1800 space tab row: the tabs a teacher clicks inside the space.
  '90-course-tabs': [
    { id: 'my-courses', label: 'מרחבי הלמידה שלי', x: 61.9, y: 0.9, width: 8.4, height: 5 },
    { id: 'participants-tab', label: 'משתתפים', x: 60.7, y: 20.6, width: 5.3, height: 4.6 },
    { id: 'grades-tab', label: 'ציונים', x: 55.6, y: 20.6, width: 4.1, height: 4.6 },
    { id: 'reports-tab', label: 'דוחות', x: 50.9, y: 20.6, width: 4.2, height: 4.6 },
    { id: 'settings-tab', label: 'הגדרות', x: 66.2, y: 20.6, width: 4.5, height: 4.6 },
  ],
  // 3200x1800 reports list: the two reports the guide uses.
  '91-reports-list': [
    { id: 'logs-link', label: 'יומני מעקב', x: 72.9, y: 46.5, width: 5.9, height: 2.9 },
    { id: 'learning-management-link', label: 'ניהול למידה', x: 74.2, y: 43.6, width: 4.6, height: 2.9 },
  ],
  // 3200x1800 course page in edit mode: the rename pencil beside an activity name.
  '92-activity-rename-pencil': [
    { id: 'rename-pencil', label: 'עיפרון — שינוי שם הפעילות', x: 65.2, y: 80.1, width: 3.1, height: 5.3 },
  ],
  // 3200x1800 the open inline rename field (Esc cancels, Enter saves).
  '93-activity-rename-field': [
    { id: 'rename-field', label: 'שדה שם הפעילות', x: 52.3, y: 75.6, width: 21.9, height: 6.4 },
  ],
  // 3200x1800 enrolment-methods page: the self-enrolment row and its eye icon.
  '94-enrol-methods': [
    { id: 'self-enrol-method', label: 'שיוך עצמי (תלמיד)', x: 88.4, y: 46.2, width: 6.6, height: 4.6 },
    { id: 'self-enrol-eye', label: 'סמל העין — שיטת השיוך פעילה', x: 15.4, y: 46.4, width: 3.0, height: 4.6 },
  ],
  // 3200x1800 self-enrolment settings: the two fields that must be „כן".
  '95-selfenrol-settings': [
    { id: 'enrol-active', label: 'מנגנון רישום עצמי פעיל? — כן', x: 67.1, y: 33.6, width: 5.1, height: 5.6 },
    { id: 'allow-new-users', label: 'האם לאפשר רישום למשתמשים חדשים — כן', x: 67.1, y: 39.9, width: 5.1, height: 5.6 },
  ],
  // 3200x1800 the „אפשרויות נוספות" menu of the space, opened.
  '96-more-options-menu': [
    { id: 'more-options-tab', label: 'אפשרויות נוספות', x: 40.7, y: 18.9, width: 10.3, height: 6.8 },
    { id: 'more-menu', label: 'תפריט „אפשרויות נוספות”', x: 40.7, y: 25.8, width: 11.4, height: 21.4 },
  ],
  // 3200x1800 course page in edit mode: the „מוסתר בפני תלמידים" badge.
  '99-hidden-item': [
    { id: 'hidden-badge', label: 'מוסתר בפני תלמידים', x: 66.4, y: 42.4, width: 10.1, height: 4.2 },
  ],
  '22-wizard-step2': [
    { id: 'type-cards', label: 'תוכן מוכן (שאוכל לערוך) | שכפול תוכן שלי (ללא תלמידים) | פיתוח תכנים במרחב למידה', x: 15.5, y: 30.4, width: 69, height: 46.5 },
    { id: 'next', label: 'הבא', x: 3.5, y: 79.8, width: 5.3, height: 6.2 },
  ],
  '40-wizard-notification-update': [
    { id: 'bell', label: 'סמל הפעמון — התראות', x: 14.4, y: 1.4, width: 2.5, height: 3.6 },
    { id: 'created-notice', label: 'המערכת הצליחה ליצור את המרחב הלמידה שלך: מתמטיקה ח\'2 - יניב רז - (מתמטיקה לחט"ב', x: 15.2, y: 9.8, width: 23.3, height: 4.9 },
  ],
  '11-notifications': [
    { id: 'bell', label: 'סמל הפעמון — התראות', x: 18.6, y: 1.7, width: 2.7, height: 4.3 },
  ],
  '12-messages': [
    { id: 'messages-icon', label: 'סמל בועת ההודעות — הודעות', x: 16, y: 1.7, width: 2.5, height: 4.5 },
  ],
  '57-student-space-home': [
    { id: 'grades-tab', label: 'ציונים', x: 58.7, y: 21.2, width: 3.6, height: 3.2 },
  ],
  '64-quiz-question': [
    { id: 'next-page', label: 'העמוד הבא', x: 21.8, y: 52.2, width: 7.4, height: 6.4 },
    { id: 'save-finish', label: 'שמירה וסיום', x: 12.8, y: 33.9, width: 6.1, height: 3.5 },
  ],
  '60-student-grade-report': [
    { id: 'task-grade-row', label: 'בוחן — פרופורציה - שליטה (תרגול 2)', x: 15.8, y: 61.6, width: 60, height: 7 },
  ],
  '16-activity-chooser': [
    { id: 'type-card', label: 'בוחן', x: 50, y: 23.8, width: 8.9, height: 14.1 },
  ],
  '31-updates-drawer': [
    { id: 'updates-row', label: 'נוספו 24 עדכונים ברכיבים', x: 3.4, y: 86.1, width: 26.9, height: 6.4 },
  ],
  '32-updates-list-expanded': [
    { id: 'drag-handle', label: 'סמל ארבעת החצים — ידית גרירה של פריט עדכון', x: 26, y: 46, width: 3.4, height: 4.3 },
  ],
  '83-import-source': [
    { id: 'source-row', label: 'מתמטיקה ח\'2 - יניב רז - (מתמטיקה לחט"ב ז\' – 2027) - תשפ"ז — שורת בחירת מרחב המ', x: 22.9, y: 63.8, width: 52.9, height: 10.9 },
  ],
  '84-import-select': [
    { id: 'select-all', label: 'הכל / אין', x: 88.6, y: 59.5, width: 5.2, height: 3.3 },
  ],
  '85-import-confirm': [
    { id: 'import-table', label: 'טבלת „יבוא הגדרות" — סימוני ✓/✗ לכל הגדרה', x: 21.6, y: 52.8, width: 73.5, height: 45.2 },
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
