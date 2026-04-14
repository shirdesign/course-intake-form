/**
 * המפצחות — Client Intake Form
 * Google Apps Script Web App
 *
 * הוראות פריסה (SETUP):
 * 1. פתח script.google.com → פרויקט חדש
 * 2. הדבק את כל הקוד הזה
 * 3. שנה את SHEET_NAME ו-FOLDER_NAME לפי הצורך
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. העתק את ה-URL שנוצר
 * 6. הוסף ל-.env.local של הפרויקט:
 *    VITE_INTAKE_SCRIPT_URL=<ה-URL שהעתקת>
 */

// ─── Configuration ────────────────────────────────────────────────────────────

var SHEET_NAME  = 'אפיון לקוחות';   // שם גיליון Google Sheets
var FOLDER_NAME = 'מסמכי אפיון';    // שם תיקייה ב-Google Drive לדוקים

// ─── Entry point ──────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var raw  = e.postData ? e.postData.contents : '{}';
    var data = JSON.parse(raw);

    var sheetUrl = appendToSheet(data);
    var docUrl   = createSpecDoc(data);

    return jsonResponse({ success: true, sheetUrl: sheetUrl, docUrl: docUrl });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// Allow preflight / browser test
function doGet() {
  return jsonResponse({ status: 'ok', message: 'המפצחות intake endpoint is live' });
}

// ─── Google Sheet ─────────────────────────────────────────────────────────────

function appendToSheet(data) {
  var ss    = getOrCreateSpreadsheet();
  var sheet = getOrCreateSheet(ss, SHEET_NAME);

  // Write header row on first use
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(getHeaderRow());
    sheet.getRange(1, 1, 1, getHeaderRow().length)
      .setFontWeight('bold')
      .setBackground('#4a90d9')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow(buildDataRow(data));
  return ss.getUrl();
}

function getHeaderRow() {
  return [
    'תאריך שליחה', 'שם פרויקט', 'סוג אירוע', 'פרטי אירוע אחר',
    'טווח גיל', 'רמת טכנולוגיה', 'מספר משתתפים', 'תאריך אירוע',
    'מועד אחרון', 'תקציב',
    'לוגו קיים', 'צבע ראשי', 'צבע משני', 'סגנון עיצוב',
    'קישורי השראה', 'נכסים קיימים',
    'תבנית משחק', 'תבנית אחר', 'מספר שלבים', 'מערכת ניקוד',
    'בונוס/קנס', 'זמן לשאלה', 'כמות שאלות', 'עלית קושי',
    'סוגי שאלות', 'ספק תוכן', 'נושא ראשי', 'תת-נושאים',
    'שפה', 'התאמה אישית', 'פרטי התאמה',
    'תמיכה מובייל', 'מצב משחק', 'לוח תוצאות',
    'שמע', 'רמת אנימציה', 'משוב',
    'פלטפורמה', 'שמירת נתונים', 'מה לשמור', 'שליטת גישה',
    'נקודת התחלה', 'שם תבנית', 'שינויים נדרשים', 'פיצ\'רים מיוחדים',
    'פורמטי תוצר', 'תצוגה מקדימה', 'תיעוד',
    'תמיכה ביום האירוע', 'סיבובי תיקונים', 'תמיכה לאחר השקה',
    'שם איש קשר', 'טלפון', 'אימייל',
    'בקשות מיוחדות', 'דוגמאות שאהבו', 'דוגמאות שלא אהבו', 'קריטריוני הצלחה',
    'קישור מסמך אפיון',
  ];
}

function buildDataRow(data) {
  return [
    data.submittedAt || new Date().toISOString(),
    data.projectName || '',
    data.eventType || '',
    data.eventTypeOther || '',
    data.targetAgeRange || '',
    data.techLevel || '',
    data.participantsCount || '',
    data.eventDate || '',
    data.deadline || '',
    data.budget || '',
    data.hasExistingLogo || '',
    data.primaryColor || '',
    data.secondaryColor || '',
    arr(data.designStyle),
    data.inspirationLinks || '',
    data.hasExistingAssets || '',
    data.gameTemplate || '',
    data.gameTemplateOther || '',
    data.stagesCount || '',
    data.hasScoringSystem || '',
    data.bonusPenalty || '',
    data.timePerQuestion || '',
    data.totalQuestions || '',
    data.difficultyProgression || '',
    arr(data.questionTypes),
    data.contentProvider || '',
    data.mainTopic || '',
    data.subTopics || '',
    data.language || '',
    data.needsPersonalization || '',
    data.personalizationDetails || '',
    data.mobileSupport || '',
    data.multiplayerType || '',
    data.leaderboard || '',
    arr(data.audioFeatures),
    data.animationLevel || '',
    arr(data.feedbackType),
    data.platform || '',
    data.dataStorage || '',
    arr(data.dataToSave),
    data.accessControl || '',
    data.startingFrom || '',
    data.templateName || '',
    data.requiredChanges || '',
    data.specialFeatures || '',
    arr(data.deliverableFormats),
    data.needsPreviewDemo || '',
    data.needsDocumentation || '',
    data.eventDaySupport || '',
    data.correctionRounds || '',
    data.postLaunchSupport || '',
    data.contactName || '',
    data.contactPhone || '',
    data.contactEmail || '',
    data.specialRequests || '',
    data.likedExamples || '',
    data.dislikedExamples || '',
    data.successCriteria || '',
    '', // doc URL — filled in after doc is created
  ];
}

// ─── Google Doc ───────────────────────────────────────────────────────────────

function createSpecDoc(data) {
  var folder = getOrCreateFolder(FOLDER_NAME);
  var title  = 'אפיון: ' + (data.projectName || 'פרויקט חדש') + ' — ' + formatDate(data.submittedAt);
  var doc    = DocumentApp.create(title);

  // Move to folder
  var file = DriveApp.getFileById(doc.getId());
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  var body = doc.getBody();
  body.setAttributes({ [DocumentApp.Attribute.FONT_FAMILY]: 'David', [DocumentApp.Attribute.FONT_SIZE]: 11 });

  // Title
  var titlePara = body.appendParagraph(title);
  titlePara.setHeading(DocumentApp.ParagraphHeading.TITLE);
  titlePara.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

  appendSubtitle(body, 'נוצר ב-' + formatDate(data.submittedAt) + ' | המפצחות');

  // ── Section: פרטי פרויקט ──────────────────────────────────────────────────
  appendSection(body, '1. פרטי הפרויקט הכלליים');
  appendField(body, 'שם הפרויקט', data.projectName);
  appendField(body, 'סוג האירוע', data.eventType + (data.eventTypeOther ? ' — ' + data.eventTypeOther : ''));
  appendField(body, 'טווח גיל קהל יעד', data.targetAgeRange);
  appendField(body, 'רמת טכנולוגיה', data.techLevel);
  appendField(body, 'מספר משתתפים', data.participantsCount);
  appendField(body, 'תאריך האירוע', data.eventDate);
  appendField(body, 'מועד אחרון לקבלת המשחק', data.deadline);
  appendField(body, 'תקציב', data.budget);

  // ── Section: מיתוג ──────────────────────────────────────────────────────────
  appendSection(body, '2. מיתוג ועיצוב');
  appendField(body, 'לוגו קיים', data.hasExistingLogo);
  appendField(body, 'צבע ראשי', data.primaryColor);
  appendField(body, 'צבע משני', data.secondaryColor);
  appendField(body, 'סגנון עיצוב', arr(data.designStyle));
  appendField(body, 'קישורי השראה', data.inspirationLinks);
  appendField(body, 'נכסים גרפיים קיימים', data.hasExistingAssets);

  // ── Section: סוג המשחק ──────────────────────────────────────────────────────
  appendSection(body, '3. סוג המשחק ומכניקה');
  appendField(body, 'תבנית משחק', data.gameTemplate + (data.gameTemplateOther ? ' — ' + data.gameTemplateOther : ''));
  appendField(body, 'כמות שאלות כוללת', data.totalQuestions);
  appendField(body, 'מספר שלבים / סיבובים', data.stagesCount);
  appendField(body, 'זמן לכל שאלה', data.timePerQuestion);
  appendField(body, 'מערכת ניקוד', data.hasScoringSystem);
  appendField(body, 'בונוסים / קנסות', data.bonusPenalty);
  appendField(body, 'עלית קושי', data.difficultyProgression);

  // ── Section: תוכן ──────────────────────────────────────────────────────────
  appendSection(body, '4. תוכן המשחק');
  appendField(body, 'נושא ראשי', data.mainTopic);
  appendField(body, 'תת-נושאים', data.subTopics);
  appendField(body, 'ספק תוכן', data.contentProvider);
  appendField(body, 'סוגי שאלות', arr(data.questionTypes));
  appendField(body, 'שפה', data.language);
  appendField(body, 'התאמה אישית', data.needsPersonalization);
  appendField(body, 'פרטי התאמה', data.personalizationDetails);

  // ── Section: פיצ'רים ──────────────────────────────────────────────────────
  appendSection(body, "5. פיצ'רים ואינטראקטיביות");
  appendField(body, 'תמיכת מובייל', data.mobileSupport);
  appendField(body, 'מצב משחק / מולטיפלייר', data.multiplayerType);
  appendField(body, 'לוח תוצאות', data.leaderboard);
  appendField(body, 'שמע', arr(data.audioFeatures));
  appendField(body, 'רמת אנימציה', data.animationLevel);
  appendField(body, 'משוב על תשובות', arr(data.feedbackType));

  // ── Section: טכני ──────────────────────────────────────────────────────────
  appendSection(body, '6. דרישות טכניות');
  appendField(body, 'פלטפורמה', data.platform);
  appendField(body, 'שמירת נתונים', data.dataStorage);
  appendField(body, 'מה לשמור', arr(data.dataToSave));
  appendField(body, 'שליטת גישה', data.accessControl);

  // ── Section: שינויים ──────────────────────────────────────────────────────
  appendSection(body, '7. שינויים בתבנית קיימת');
  appendField(body, 'נקודת התחלה', data.startingFrom);
  appendField(body, 'שם תבנית', data.templateName);
  appendField(body, 'שינויים נדרשים', data.requiredChanges);
  appendField(body, "פיצ'רים מיוחדים", data.specialFeatures);

  // ── Section: תוצרים ──────────────────────────────────────────────────────
  appendSection(body, '8. תוצרים ותמיכה');
  appendField(body, 'פורמטי תוצר', arr(data.deliverableFormats));
  appendField(body, 'תצוגה מקדימה', data.needsPreviewDemo);
  appendField(body, 'תיעוד', data.needsDocumentation);
  appendField(body, 'תמיכה ביום האירוע', data.eventDaySupport);
  appendField(body, 'סיבובי תיקונים', data.correctionRounds);
  appendField(body, 'תמיכה לאחר השקה', data.postLaunchSupport);

  // ── Section: קשר ──────────────────────────────────────────────────────────
  appendSection(body, '9. פרטי קשר והערות');
  appendField(body, 'שם איש קשר', data.contactName);
  appendField(body, 'טלפון', data.contactPhone);
  appendField(body, 'אימייל', data.contactEmail);
  appendField(body, 'בקשות מיוחדות', data.specialRequests);
  appendField(body, 'דוגמאות שאהבו', data.likedExamples);
  appendField(body, 'דוגמאות שלא אהבו', data.dislikedExamples);
  appendField(body, 'קריטריוני הצלחה', data.successCriteria);

  doc.saveAndClose();

  var docUrl = doc.getUrl();

  // Write doc URL back to last column of last sheet row
  try {
    var ss    = getOrCreateSpreadsheet();
    var sheet = getOrCreateSheet(ss, SHEET_NAME);
    var lastRow = sheet.getLastRow();
    var lastCol = getHeaderRow().length;
    sheet.getRange(lastRow, lastCol).setValue(docUrl);
  } catch (_) { /* non-fatal */ }

  return docUrl;
}

// ─── Doc helpers ──────────────────────────────────────────────────────────────

function appendSection(body, title) {
  body.appendParagraph(''); // spacer
  var h = body.appendParagraph(title);
  h.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  h.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  h.editAsText().setForegroundColor('#1a56a0');
}

function appendSubtitle(body, text) {
  var p = body.appendParagraph(text);
  p.setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
  p.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
}

function appendField(body, label, value) {
  if (!value || (Array.isArray(value) && value.length === 0)) return;
  var display = Array.isArray(value) ? value.join(' | ') : String(value);
  if (!display.trim()) return;

  var p    = body.appendParagraph('');
  var text = p.editAsText();
  text.appendText(label + ': ');
  text.setFontSize(0, label.length + 1, 11);
  text.setBold(0, label.length + 1, true);
  text.appendText(display);
  text.setFontSize(label.length + 2, text.getText().length - 1, 11);
  text.setBold(label.length + 2, text.getText().length - 1, false);
  p.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
}

// ─── Drive / Sheets helpers ───────────────────────────────────────────────────

function getOrCreateSpreadsheet() {
  var files = DriveApp.getFilesByName(SHEET_NAME + '.xlsx');
  // Search by plain name in Drive
  var allFiles = DriveApp.searchFiles('title = "' + SHEET_NAME + '" and mimeType = "application/vnd.google-apps.spreadsheet"');
  if (allFiles.hasNext()) {
    return SpreadsheetApp.openById(allFiles.next().getId());
  }
  return SpreadsheetApp.create(SHEET_NAME);
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function arr(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function formatDate(iso) {
  try {
    var d = new Date(iso || Date.now());
    return d.toLocaleDateString('he-IL', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch (_) {
    return new Date().toLocaleDateString('he-IL');
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
