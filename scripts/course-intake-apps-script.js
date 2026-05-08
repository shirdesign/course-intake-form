/**
 * Course Intake Form – Google Apps Script backend
 *
 * Deploy as Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Set VITE_COURSE_INTAKE_SCRIPT_URL in .env.local to the deployed URL.
 */

var SHEET_NAME = 'אפיון קורסים';
var DOC_FOLDER_NAME = 'מסמכי אפיון קורסים';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    appendToSheet(data);
    var docUrl = createSpecDoc(data);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, docUrl: docUrl }))
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function appendToSheet(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'תאריך שליחה', 'שם לקוח', 'שם פרויקט', 'איש קשר', 'תאריך יעד', 'תקציב',
      'מטרת הקורס', 'קהל יעד', 'סגנון למידה',
      'לוגו', 'קו עיצובי', 'צבעים', 'השראות', 'פונטים', 'הערות כלליות',
      'מספר משחקים', 'שמות משחקים'
    ]);
  }
  var gameNames = (data.games || []).map(function(g) { return g.tempName; }).join(', ');
  sheet.appendRow([
    data.submittedAt || new Date().toISOString(),
    data.clientName, data.projectName, data.contactPerson, data.deadline, data.budget,
    data.courseGoal, data.targetAudience, data.learningStyle,
    data.logoStatus, (data.designStyle || []).join(', '), data.preferredColors,
    data.inspirations, data.fonts, data.generalNotes,
    (data.games || []).length, gameNames
  ]);
}

function createSpecDoc(data) {
  var folder = getOrCreateFolder(DOC_FOLDER_NAME);
  var title = 'אפיון – ' + (data.projectName || data.clientName || 'לקוח חדש');
  var doc = DocumentApp.create(title);

  // Move to folder
  var file = DriveApp.getFileById(doc.getId());
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  var body = doc.getBody();
  body.clear();

  // ── Title ──────────────────────────────────────────────────
  var titlePara = body.appendParagraph(title);
  titlePara.setHeading(DocumentApp.ParagraphHeading.TITLE);

  appendPara(body, 'נוצר: ' + new Date().toLocaleString('he-IL'), 'metadata');

  // ── Section: Client details ────────────────────────────────
  appendHeading(body, '👤 פרטי לקוח');
  appendField(body, 'שם לקוח', data.clientName);
  appendField(body, 'שם פרויקט / קורס', data.projectName);
  appendField(body, 'איש קשר', data.contactPerson);
  appendField(body, 'תאריך יעד', data.deadline);
  appendField(body, 'תקציב', data.budget);

  // ── Section: Project goal ─────────────────────────────────
  appendHeading(body, '🎯 מטרת הפרויקט');
  appendField(body, 'מטרת הקורס', data.courseGoal);
  appendField(body, 'קהל יעד', data.targetAudience);
  appendField(body, 'סגנון למידה', data.learningStyle);

  // ── Section: Branding ─────────────────────────────────────
  appendHeading(body, '🎨 מיתוג ועיצוב');
  appendField(body, 'לוגו', data.logoStatus);
  appendField(body, 'קו עיצובי', (data.designStyle || []).join(', '));
  appendField(body, 'צבעים מועדפים', data.preferredColors);
  appendField(body, 'השראות / דוגמאות', data.inspirations);
  appendField(body, 'פונטים', data.fonts);
  appendField(body, 'הערות כלליות', data.generalNotes);

  // ── Games ─────────────────────────────────────────────────
  var games = data.games || [];
  games.forEach(function(game, idx) {
    var gameNum = idx + 1;

    body.appendHorizontalRule();
    appendHeading(body, '🎮 משחק ' + gameNum + ': ' + (game.tempName || 'ללא שם'));

    appendSubHeading(body, 'מטרה');
    appendField(body, 'מטרת המשחק', game.goal);
    appendField(body, 'מה הלמד יבין בסוף', game.userUnderstanding);
    appendField(body, 'מיקום בקורס', (game.positionInCourse || []).join(', '));

    appendSubHeading(body, 'חוויה ותוכן');
    appendField(body, 'תחושה רצויה', (game.desiredFeeling || []).join(', '));
    appendField(body, 'נושא המשחק', game.contentTopic);
    appendField(body, 'סגנון תוכן', (game.contentStyle || []).join(', '));
    appendField(body, 'אספקת תוכן', (game.contentDelivery || []).join(', '));

    appendSubHeading(body, 'טכנולוגיה ותבנית');
    appendField(body, 'בסיס טכנולוגי', game.techBase);
    appendField(body, 'תבנית נבחרת', (game.template || []).join(', '));
    appendField(body, 'פונקציות רצויות', (game.gameFunctions || []).join(', '));

    appendSubHeading(body, 'מסכים');
    var screensList = (game.screens || []).join(' | ');
    appendField(body, 'מסכים', screensList);
    appendField(body, 'הערות', game.notes);

    // Team section
    body.appendParagraph('');
    var teamHeader = body.appendParagraph('🔧 חלק הצוות – משחק ' + gameNum);
    teamHeader.setHeading(DocumentApp.ParagraphHeading.HEADING3);
    teamHeader.setBackgroundColor('#FFF9C4');

    appendTeamField(body, 'הערות על התבנית');
    appendTeamField(body, 'הערות על הפונקציות');
    appendTeamField(body, 'סיכונים / מגבלות');
    appendTeamField(body, 'הצעות ייעול');
    appendTeamField(body, 'זמן עבודה משוער');
    appendTeamField(body, 'תמחור משוער');
  });

  doc.saveAndClose();
  return doc.getUrl();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function appendHeading(body, text) {
  body.appendParagraph('');
  var p = body.appendParagraph(text);
  p.setHeading(DocumentApp.ParagraphHeading.HEADING1);
}

function appendSubHeading(body, text) {
  var p = body.appendParagraph(text);
  p.setHeading(DocumentApp.ParagraphHeading.HEADING2);
}

function appendField(body, label, value) {
  if (!value || (Array.isArray(value) && !value.length)) return;
  var p = body.appendParagraph('');
  p.appendText(label + ': ').setBold(true);
  p.appendText(value || '—').setBold(false);
}

function appendTeamField(body, label) {
  var p = body.appendParagraph('');
  p.appendText(label + ': ').setBold(true);
  p.appendText('_________________________________').setBold(false);
}

function appendPara(body, text) {
  var p = body.appendParagraph(text);
  p.setForegroundColor('#888888');
  p.setFontSize(10);
}
