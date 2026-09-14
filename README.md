# Moodle Guide Presentation

מצגת Moodle עצמאית למורים, בעברית וב־RTL, עם צילומי מסך אמיתיים בלבד.

## מקור האמת היחיד

- תוכן וסדר השקפים: `src/content/deck.ts`
- סימונים חזותיים מאומתים: `src/content/hotspots.ts`
- צילומי המקור: `assets/source/screenshots/`
- לוגו המקור: `assets/source/brand/jerusalem-math-logo.png`
- ממשק המצגת: `src/Guide.tsx`

`public/assets/` ו־`dist/` הם תוצרים שנוצרים אוטומטית ואינם נשמרים ב־Git. אין לערוך אותם.

## עריכה עתידית

1. משנים טקסט, סדר או מצב פרסום רק ב־`src/content/deck.ts`.
2. צילום חדש נשמר פעם אחת בלבד כ־JPG/PNG בתוך `assets/source/screenshots/`.
3. מריצים `npm run check`.
4. פותחים Pull Request. פרסום ל־GitHub Pages מתבצע אוטומטית אחרי merge ל־`main`.

## פיתוח

```bash
npm ci
npm run dev
```

בדיקה מלאה:

```bash
npm run check
npx playwright install chromium
npm run test:e2e
```

## הפרדה מהמוצר הקודם

הריפו הזה מכיל את המצגת בלבד. הוא אינו מכיל Teacher Hub, ‏LTI, תלמידים, ציונים, Supabase, Render או נתוני משתמשים. מקור ההעברה הראשוני הוא `yanivmizrachiy/www` ב־commit `112ecaf0b25b4fdd72e1b8aac0e4dbf0b4018ce6`.
