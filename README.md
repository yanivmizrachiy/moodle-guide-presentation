# Moodle Guide Presentation

מצגת Moodle עצמאית למורים, בעברית וב־RTL, עם צילומי מסך אמיתיים בלבד.

## מקור האמת היחיד

- תוכן, סדר, סטטוס ושיוך השקפים: `src/data/guideDeck.ts`
- סימונים חזותיים מאומתים: `src/data/guideHotspots.ts`
- ממשק המצגת: `src/pages/Guide.tsx`
- עיצוב: `src/index.css` ו־`src/guide-visual-isolation.css`
- צילומי המסך והלוגו האמיתיים: `public/guide/`
- בדיקות שלמות אוטומטיות (מזהי שקפים, צילומים, קישורים, איכות תצוגה): `tests/deck-invariants.test.ts`
- כללי הפרויקט: `SSOT.md`
- הנחיות Claude Code: `CLAUDE.md`

אין ליצור מקור תוכן נוסף ואין ליצור צילומי דמה. צילום חסר נשאר מסומן כ־`needs-capture` עד שקיים צילום אמיתי.

## עבודה מקומית

```bash
npm ci
npm run dev
```

בדיקה מלאה לפני כל שינוי:

```bash
npm run check
```

## צילומים

- צילום חדש נכנס כמקור (jpg/png) ל־`public/guide/screenshots/` ברזולוציית מכשיר מלאה (SSOT כלל 13).
- נגזרות AVIF/WebP נוצרות רק עם `npm run shots:derive` (או `-- --all` לרענון מלא).
- צילום חי מול Moodle: `scripts/capture/launch.mjs` (המשתמש מתחבר בעצמו) ואז `scripts/capture/steps.mjs`.

## פרסום

GitHub Pages נבנה אוטומטית מ־`main` באמצעות GitHub Actions.

כתובת היעד:
`https://yanivmizrachiy.github.io/moodle-guide-presentation/`

## מקור ההעברה

המצגת הופרדה מתוך `yanivmizrachiy/www` בנקודת המקור:
`112ecaf0b25b4fdd72e1b8aac0e4dbf0b4018ce6`.

הריפו הזה מיועד למצגת בלבד ואינו מכיל Teacher Hub, ‏LTI, ‏Supabase, תלמידים, ציונים או backend.
