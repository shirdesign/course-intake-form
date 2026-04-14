# הגדרת שאלון אפיון לקוחות

## מה נוצר

| קובץ | תיאור |
|------|-------|
| `src/pages/ClientIntakeForm.tsx` | טופס 9 שלבים בעברית |
| `src/services/intakeForm.service.ts` | שירות שליחה ל-Apps Script |
| `src/i18n/locales/he.json` | תרגומים (נוסף מפתח `intake`) |
| `scripts/intake-apps-script.js` | קוד Google Apps Script |
| Route `/intake` | נוסף ל-`App.tsx` |

---

## הגדרת Google Apps Script (חובה לפני שימוש)

### שלב 1 — פתיחת Apps Script

1. עברו ל-[script.google.com](https://script.google.com)
2. לחצו **+ פרויקט חדש**
3. מחקו את הקוד שמופיע (הפונקציה הריקה)

### שלב 2 — הדבקת הקוד

1. פתחו את הקובץ `scripts/intake-apps-script.js`
2. העתיקו את כל תוכנו
3. הדביקו בחלון ה-Apps Script

### שלב 3 — פריסה

1. לחצו **Deploy → New deployment**
2. בחרו **Web app**
3. הגדרות:
   - **Execute as**: Me (האימייל שלכם)
   - **Who has access**: Anyone
4. לחצו **Deploy**
5. אשרו הרשאות גישה ל-Google Sheets ו-Google Drive
6. **העתיקו את ה-URL** שמופיע (נראה כך: `https://script.google.com/macros/s/AKfy.../exec`)

### שלב 4 — הגדרת משתנה סביבה

בתיקיית הפרויקט, ערכו (או צרו) את הקובץ `.env.local`:

```
VITE_INTAKE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

החליפו את ה-URL בזה שהעתקתם.

### שלב 5 — בדיקה

```bash
npm run dev
```

פתחו `http://localhost:5173/intake` ומלאו את הטופס. לאחר שליחה:

- **Google Sheets**: קובץ בשם "אפיון לקוחות" ייפתח ב-Drive שלכם עם שורה חדשה
- **Google Docs**: מסמך חדש ייווצר בתיקייה "מסמכי אפיון" עם כל הפרטים

---

## שינוי שמות ברירת מחדל

בפסקת ה-Configuration בתחילת `intake-apps-script.js`:

```javascript
var SHEET_NAME  = 'אפיון לקוחות';   // שם הגיליון
var FOLDER_NAME = 'מסמכי אפיון';    // שם תיקיית הדוקים
```

לאחר כל שינוי בקוד — חובה לפרוס **גרסה חדשה** (Deploy → New deployment).

---

## שיתוף הטופס עם לקוחות

ה-URL הציבורי של הטופס לאחר deploy של האפליקציה:

```
https://your-domain.com/intake
```

ניתן גם לשלוח לינק זמני עם `vercel dev` או `ngrok` לבדיקות.

---

## CORS — הסבר טכני

הטופס שולח `POST` ישיר ל-Apps Script. Google מאפשר זאת כאשר:
- הסקריפט פרוס עם **Who has access: Anyone**
- ה-Content-Type הוא `text/plain` (לא JSON, למניעת preflight)
- הסקריפט מחזיר `ContentService` עם `MimeType.JSON`

אם מקבלים שגיאת CORS — וודאו שנפרסה **גרסה חדשה** לאחר שינויים בקוד.
