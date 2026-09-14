# MIGRATION_MANIFEST

## מקור

- Repository: `yanivmizrachiy/www`
- Source commit: `112ecaf0b25b4fdd72e1b8aac0e4dbf0b4018ce6`

## קבצים קנוניים שהועברו

- `src/data/guideDeck.ts` — מקור אמת יחיד לתוכן, סדר וסטטוס השקפים.
- `src/data/guideHotspots.ts` — מקור אמת יחיד ל-hotspots מאומתים.
- `src/pages/Guide.tsx` — renderer וממשק המצגת.
- `src/components/ui/button.tsx`
- `src/lib/utils.ts`
- `src/index.css`
- `src/guide-visual-isolation.css`
- `public/guide/` — הלוגו, צילומי המסך האמיתיים והנכסים הקשורים למצגת.
- `docs/GUIDE*.md` — תיעוד קיים הקשור למצגת.

## התאמות שבוצעו בהפרדה

- בסיס Vite הוגדר ל-`/moodle-guide-presentation/`.
- נתיבי תמונות בממשק משתמשים ב-`import.meta.env.BASE_URL`.
- נוצר runtime עצמאי ומינימלי למצגת בלבד.
- `node_modules` ו-`dist` אינם חלק ממקור האמת ואסורים ב-Git.
- נוספו `SSOT.md`, `CLAUDE.md`, בדיקת SSOT, CI ו-workflow לפרסום Pages.

## גבולות

לא מועברים ולא מתווספים לריפו הזה:
Teacher Hub, LTI, Supabase, Render backend, תלמידים, ציונים או נתוני משתמשים.

## כלל מעבר

לא מוחקים ולא משנים את המקור הישן כחלק מההפרדה. לאחר ההפרדה, כל פיתוח עתידי של המצגת צריך להתבצע בריפו `moodle-guide-presentation` בלבד.
