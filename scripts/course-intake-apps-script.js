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
var FILES_FOLDER_NAME = 'קבצי לקוחות';

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
  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'תאריך שליחה', 'שם לקוח', 'שם פרויקט', 'איש קשר', 'תאריך יעד', 'תקציב',
      'מטרת הקורס', 'קהל יעד', 'סגנון למידה',
      'לוגו', 'קו עיצובי', 'צבעים', 'השראות', 'פונטים', 'הערות כלליות',
      'מספר משחקים', 'שמות משחקים', 'קבצים'
    ]);
  }
  var gameNames = (data.games || []).map(function(g) { return g.tempName; }).join(', ');
  var fileNames = [];
  if (data.logoFileData) fileNames.push('לוגו: ' + data.logoFileData.name);
  (data.generalFilesData || []).forEach(function(f) { fileNames.push(f.name); });

  sheet.appendRow([
    data.submittedAt || new Date().toISOString(),
    data.clientName, data.projectName, data.contactPerson, data.deadline, data.budget,
    data.courseGoal, data.targetAudience, data.learningStyle,
    data.logoStatus, (data.designStyle || []).join(', '), (data.preferredColors || []).join(', '),
    data.inspirations, data.fonts, data.generalNotes,
    (data.games || []).length, gameNames, fileNames.join(', ')
  ]);
}

function createSpecDoc(data) {
  var docFolder = getOrCreateFolder(DOC_FOLDER_NAME);
  var title = 'אפיון – ' + (data.projectName || data.clientName || 'לקוח חדש');
  var doc = DocumentApp.create(title);

  var file = DriveApp.getFileById(doc.getId());
  docFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  // Save uploaded files to Drive and collect links
  var clientFolderName = (data.projectName || data.clientName || 'לקוח חדש') + ' – קבצים';
  var logoLink = null;
  var generalFileLinks = [];

  if (data.logoFileData || (data.generalFilesData && data.generalFilesData.length)) {
    var filesRoot = getOrCreateFolder(FILES_FOLDER_NAME);
    var clientFolder = getOrCreateSubfolder(filesRoot, clientFolderName);

    if (data.logoFileData) {
      logoLink = saveBase64File(clientFolder, data.logoFileData);
    }
    (data.generalFilesData || []).forEach(function(fd) {
      var link = saveBase64File(clientFolder, fd);
      if (link) generalFileLinks.push({ name: fd.name, url: link });
    });
  }

  var body = doc.getBody();
  body.clear();

  var titlePara = body.appendParagraph(title);
  titlePara.setHeading(DocumentApp.ParagraphHeading.TITLE);
  appendPara(body, 'נוצר: ' + new Date().toLocaleString('he-IL'));

  appendHeading(body, '👤 פרטי לקוח');
  appendField(body, 'שם לקוח', data.clientName);
  appendField(body, 'שם פרויקט / קורס', data.projectName);
  appendField(body, 'איש קשר', data.contactPerson);
  appendField(body, 'תאריך יעד', data.deadline);
  appendField(body, 'תקציב', data.budget);

  appendHeading(body, '🎯 מטרת הפרויקט');
  appendField(body, 'מטרת הקורס', data.courseGoal);
  appendField(body, 'קהל יעד', data.targetAudience);
  appendField(body, 'סגנון למידה', data.learningStyle);

  appendHeading(body, '🎨 מיתוג ועיצוב');
  appendField(body, 'לוגו', data.logoStatus);
  if (logoLink) appendLink(body, 'קובץ לוגו', data.logoFileData.name, logoLink);
  appendField(body, 'קו עיצובי', (data.designStyle || []).join(', '));
  appendField(body, 'צבעים מועדפים', (data.preferredColors || []).join(', '));
  appendField(body, 'השראות / דוגמאות', data.inspirations);
  appendField(body, 'פונטים', data.fonts);
  appendField(body, 'הערות כלליות', data.generalNotes);
  if (generalFileLinks.length) {
    appendSubHeading(body, 'קבצים מצורפים');
    generalFileLinks.forEach(function(f) {
      appendLink(body, f.name, f.name, f.url);
    });
  }

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
    appendField(body, 'מסכים', (game.screens || []).join(' | '));
    appendField(body, 'הערות', game.notes);

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

// ── File helpers ──────────────────────────────────────────────────────────────

function saveBase64File(folder, fileData) {
  try {
    var parts = fileData.data.split(',');
    var mimeType = parts[0].split(':')[1].split(';')[0];
    var bytes = Utilities.base64Decode(parts[1]);
    var blob = Utilities.newBlob(bytes, mimeType, fileData.name);
    var saved = folder.createFile(blob);
    return saved.getUrl();
  } catch (err) {
    return null;
  }
}

function getOrCreateSubfolder(parent, name) {
  var folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

// ── Doc helpers ───────────────────────────────────────────────────────────────

function appendLink(body, label, linkText, url) {
  var p = body.appendParagraph('');
  p.appendText(label + ': ').setBold(true);
  var anchor = p.appendText(linkText);
  anchor.setBold(false);
  // Note: Apps Script doesn't support inline hyperlinks via setText,
  // so we append the URL in parentheses
  p.appendText(' (' + url + ')').setBold(false);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getOrCreateSpreadsheet() {
  var files = DriveApp.searchFiles(
    'title = "' + SHEET_NAME + '" and mimeType = "application/vnd.google-apps.spreadsheet" and trashed = false'
  );
  if (files.hasNext()) return SpreadsheetApp.openById(files.next().getId());
  return SpreadsheetApp.create(SHEET_NAME);
}

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
  p.appendText(String(value)).setBold(false);
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
