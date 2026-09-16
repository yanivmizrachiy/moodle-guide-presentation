# Moodle Guide Presentation

מצגת Moodle עצמאית למורים, בעברית וב־RTL, עם צילומי מסך אמיתיים בלבד.

## מקור האמת היחיד

רשימת מקורות האמת בריפו נמצאת במקום אחד בלבד: `SSOT.md`, פרק „מקורות האמת בתוך הריפו". כללי הפרויקט נמצאים ב-`SSOT.md` והנחיות Claude Code ב-`CLAUDE.md`.

אין ליצור מקור תוכן נוסף ואין ליצור צילומי דמה. צילום חסר נשאר מסומן כ־`needs-capture` עד שקיים צילום אמיתי.

- רשימת הצילומים החסרים: `docs/GUIDE_MISSING_CAPTURES.md`
- מה מכיל כל צילום ומה הוסתר בו: `docs/GUIDE_SCREENSHOTS_MANIFEST.md`
- **מדריך עריכה תפעולי (מאיפה עורכים כל דבר): `docs/EDITING_GUIDE.md`**

> `SSOT.md` הוא הסמכות הנורמטיבית היחידה. ה-README ומדריך העריכה הם תפעוליים בלבד ואינם מקור דרישות שני.

## עבודה מקומית

```bash
npm ci
npm run dev
```

בדיקות לפני commit/push:

```bash
npm run check        # שער מהיר: typecheck + ssot + בדיקות יחידה/אינוריאנטים + build
npm run check:full   # שער רחב: check + בדיקות דפדפן/נגישות/ויזואל (Playwright)
```

## צילומים

- צילום חדש נכנס כמקור (jpg/png) ל־`public/guide/screenshots/` ברזולוציית מכשיר מלאה (SSOT כלל 13).
- נגזרות AVIF/WebP נוצרות רק עם `npm run shots:derive` (או `-- --all` לרענון מלא).
- צילום חי מול Moodle: `scripts/capture/launch.mjs` (המשתמש מתחבר בעצמו) ואז `scripts/capture/steps.mjs`.
- דפדפן שני לתצוגת תלמיד: `CDP_PORT=9224 PROFILE=student node scripts/capture/launch.mjs`, ואז אותו `steps.mjs` עם `CDP_PORT=9224`.

## פרסום

GitHub Pages נבנה אוטומטית מ־`main` באמצעות GitHub Actions.

כתובת היעד:
`https://yanivmizrachiy.github.io/moodle-guide-presentation/`

## מקור ההעברה

פרטי ההעברה (הריפו המקורי ו-commit המקור) מתועדים ב-`MIGRATION_MANIFEST.md`.

הריפו הזה מיועד למצגת בלבד ואינו מכיל Teacher Hub, ‏LTI, ‏Supabase, תלמידים, ציונים או backend.
