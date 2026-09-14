# SSOT — Moodle Guide Presentation

זהו **מקור האמת היחיד והמחייב למצגת ההדרכה של Moodle**.

## כלל בלעדיות מוחלט

רק הריפו הבא רשאי לעסוק באופן פעיל במצגת:

`yanivmizrachiy/moodle-guide-presentation`

אין ריפו פעיל נוסף למצגת, אין mirror לפיתוח, ואין מקור תוכן מקביל.

כל קובץ מצגת/Guide שקיים ב-`yanivmizrachiy/www`, ב-`yanivmizrachiy/moodle-teacher-hub` או בכל ריפו אחר הוא חומר legacy/היסטורי בלבד ואינו מקור אמת ואינו יעד עריכה.

## תחום הריפו

הריפו עוסק **רק במצגת/מדריך ההדרכה למורים**.

כן שייך לכאן:
- תוכן השקפים.
- סדר ומזהי השקפים.
- screenshots אמיתיים של Moodle.
- hotspots וסימונים חזותיים.
- עיצוב המצגת.
- רכיבי UI שנדרשים למצגת.
- בדיקות איכות ואמת של המצגת.
- CI ו-GitHub Pages של המצגת.
- תיעוד והחלטות שקשורים למצגת בלבד.

לא שייך לכאן:
- Teacher Hub.
- LTI.
- Supabase.
- Render backend.
- תלמידים.
- ציונים.
- לוגים ונתוני משתמשים.
- מערכת ניהול Moodle שאינה חלק מהמצגת.

## מקורות האמת בתוך הריפו

- תוכן, סדר, סטטוס ומזהי השקפים: `src/data/guideDeck.ts`
- hotspots מאומתים בלבד: `src/data/guideHotspots.ts`
- ממשק המצגת: `src/pages/Guide.tsx`
- עיצוב: `src/index.css` ו-`src/guide-visual-isolation.css`
- צילומי מסך ולוגו אמיתיים: `public/guide/`
- מעקב צילומים חסרים: `docs/GUIDE_MISSING_CAPTURES.md`
- מניפסט screenshots: `docs/GUIDE_SCREENSHOTS_MANIFEST.md`
- היסטוריית ההעברה: `MIGRATION_MANIFEST.md`

## כללי גבול מחייבים

1. אין ליצור deck נוסף או מקור תוכן נוסף.
2. אין לערוך את המצגת ב-`yanivmizrachiy/www`.
3. אין לערוך את המצגת ב-`yanivmizrachiy/moodle-teacher-hub`.
4. אין לערוך את המצגת בשום ריפו אחר.
5. כל שינוי עתידי במצגת נעשה **רק כאן**.
6. אין demo, mock, placeholder או screenshots מומצאים.
7. צילום חסר נשאר `needs-capture` עד שיש צילום Moodle אמיתי.
8. `dist/` הוא תוצר build ואינו מקור אמת.
9. workflows, scripts ובדיקות שקשורים למצגת וממשיכים להיות שימושיים צריכים לחיות כאן בלבד.
10. אין לתחזק runtime פעיל נוסף למצגת מחוץ לריפו הזה.

## מקור ההעברה ההיסטורי

- מקור ישן: `yanivmizrachiy/www`
- Commit מקור: `112ecaf0b25b4fdd72e1b8aac0e4dbf0b4018ce6`
- לאחר ההעברה, המקור הישן אינו יעד עריכה למצגת.

## כלל ניקיון

שרידים היסטוריים של המצגת בריפואים אחרים אינם הופכים אותם למקורות אמת. ניתן להסיר אותם רק לאחר בדיקה מאומתת שאין בהם חומר ייחודי שטרם הועבר לכאן.
