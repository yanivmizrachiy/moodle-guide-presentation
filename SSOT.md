# SSOT — Moodle Guide Presentation

זהו **מקור האמת היחיד והמחייב למצגת Moodle**.

## תחום הריפו
הריפו עוסק **רק במצגת/מדריך ההדרכה למורים**. אין בו Teacher Hub, LTI, Supabase, ציונים, תלמידים או backend.

## מקורות האמת בתוך הריפו
- תוכן, סדר, סטטוס ומזהי השקפים: `src/data/guideDeck.ts`
- hotspots מאומתים בלבד: `src/data/guideHotspots.ts`
- ממשק המצגת: `src/pages/Guide.tsx`
- עיצוב: `src/index.css` ו-`src/guide-visual-isolation.css`
- צילומי מסך ולוגו אמיתיים: `public/guide/`
- מעקב צילומים חסרים: `docs/GUIDE_MISSING_CAPTURES.md`

## כללי גבול מחייבים
1. אין ליצור deck נוסף או מקור תוכן נוסף.
2. אין לערוך את המצגת ב-`yanivmizrachiy/www` או ב-`yanivmizrachiy/moodle-teacher-hub`.
3. כל שינוי עתידי במצגת נעשה **רק כאן**.
4. אין demo, mock, placeholder או screenshots מומצאים.
5. צילום חסר נשאר `needs-capture` עד שיש צילום Moodle אמיתי.
6. `dist/` הוא תוצר build ואינו מקור אמת.

## מקור ההעברה ההיסטורי
- מקור ישן: `yanivmizrachiy/www`
- Commit מקור: `112ecaf0b25b4fdd72e1b8aac0e4dbf0b4018ce6`
- לאחר ההעברה, המקור הישן אינו יעד עריכה למצגת.
