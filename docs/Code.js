// ============================================================
// Google Apps Script for IGCSE Study Results spreadsheet
// ============================================================
// HOW TO DEPLOY:
// 1. Open your "Study Results" Google Sheet
// 2. Extensions → Apps Script
// 3. Replace ALL the code with this file's contents
// 4. Click Deploy → Manage deployments
// 5. Click the pencil icon on your existing deployment
// 6. Set "Version" to "New version"
// 7. Click Deploy
// The URL stays the same — no code changes needed elsewhere.
//
// WHAT THIS CREATES (automatically on first data received):
// - "Activity Log" sheet (renames Sheet 1) — all quiz, flashcard, page-view data
// - "Writing & Notes" sheet — per-exercise progress with expanding attempt columns
// - "Dashboard" sheet — auto-calculated overview with formulas
// ============================================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.key !== 'igcse-study-2026') {
      return ContentService.createTextOutput('Unauthorized');
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // One-time setup: rename sheets, create Dashboard (cached after first run)
    ensureSetup(ss);

    if (data.target === 'resetDashboard') {
      // Admin command: delete and recreate Dashboard with latest layout
      var db = ss.getSheetByName('Dashboard');
      if (db) ss.deleteSheet(db);
      PropertiesService.getScriptProperties().deleteProperty('setupDone');
      ensureSetup(ss);
      return ContentService.createTextOutput('Dashboard reset');
    } else if (data.target === 'progress') {
      // Per-exercise tracking → "Writing & Notes" sheet
      // overwrite flag = re-save in same browser session (don't create new columns)
      writeProgress(ss, data.exercises || [], !!data.overwrite);
    } else {
      // Quiz, flashcard, page-view rows → "Activity Log" sheet
      var sheet = ss.getSheetByName('Activity Log') || ss.getSheets()[0];
      var rows = data.rows || [];
      if (rows.length > 0) {
        // Batch insert — one API call instead of N appendRow calls
        var lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
      }
    }

    return ContentService.createTextOutput('OK');
  } catch (err) {
    return ContentService.createTextOutput('Error: ' + err.message);
  }
}

// ============================================================
// ONE-TIME SETUP — runs on first doPost, skips on subsequent
// Uses PropertiesService to cache that setup has been done
// ============================================================
function ensureSetup(ss) {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('setupDone') === 'true') {
    return; // already set up — skip all checks
  }

  // Rename first sheet to "Activity Log" if it has a default name
  var first = ss.getSheets()[0];
  var name = first.getName();
  if (name === 'Sheet1' || name === 'Sheet 1') {
    first.setName('Activity Log');
  }

  // Ensure Activity Log has headers
  var actLog = ss.getSheetByName('Activity Log') || first;
  if (actLog.getRange(1, 1).getValue() === '') {
    actLog.getRange(1, 1, 1, 10).setValues([[
      'Date', 'Time', 'Type', 'Subject', 'Chapter', 'Item', 'Response', 'Result', 'Self-Rating', 'Seconds'
    ]]).setFontWeight('bold');
    actLog.setFrozenRows(1);
  }

  // Create Dashboard if it doesn't exist
  if (!ss.getSheetByName('Dashboard')) {
    createDashboard(ss);
  }

  // Mark setup as done — subsequent requests skip all the above
  props.setProperty('setupDone', 'true');
}

// ============================================================
// CREATE DASHBOARD — formulas auto-update from live data
//
// Layout (with generous spacing to prevent QUERY overflow):
//   Rows 1-3:   Title + timestamp
//   Rows 4-12:  Subject Overview (6 subjects)
//   Rows 14-28: Study Habits (pivot tables, LIMIT 20 each)
//   Rows 30-42: Weakest Chapters (LIMIT 10)
//   Rows 44-70: Writing Progress (LIMIT 25)
//   Rows 72-94: Recent Activity (LIMIT 20)
// ============================================================
function createDashboard(ss) {
  var db = ss.insertSheet('Dashboard', 0); // insert as first tab

  // --- Styling helpers ---
  function header(row, text) {
    db.getRange(row, 1, 1, 8).merge()
      .setValue(text)
      .setFontWeight('bold').setFontSize(12)
      .setBackground('#2c3e50').setFontColor('#ffffff');
  }
  function subHeader(row, cols) {
    var r = db.getRange(row, 1, 1, cols.length);
    r.setValues([cols]).setFontWeight('bold').setBackground('#ecf0f1');
  }

  // ===== TITLE =====
  db.getRange(1, 1, 1, 8).merge()
    .setValue('IGCSE Study Dashboard')
    .setFontWeight('bold').setFontSize(16)
    .setHorizontalAlignment('center');
  db.getRange(2, 1, 1, 8).merge()
    .setFormula('="Last refreshed: "&TEXT(NOW(),"yyyy-mm-dd hh:mm")')
    .setFontColor('#888888').setHorizontalAlignment('center');

  // ===== SUBJECT OVERVIEW (Row 4-12) =====
  header(4, 'Subject Overview');
  subHeader(5, ['Subject', 'Pages Viewed', 'Quiz Answers', 'Avg Rating (1-4)', 'Quiz Minutes', 'Flashcard Items', 'Last Active', '']);

  var subjects = ['Biology', 'Chemistry', 'Physics', 'English', 'Spanish', 'Math'];
  for (var i = 0; i < subjects.length; i++) {
    var r = 6 + i;
    var s = subjects[i];
    db.getRange(r, 1).setValue(s);
    // Pages Viewed
    db.getRange(r, 2).setFormula('=COUNTIFS(\'Activity Log\'!C:C,"page-view",\'Activity Log\'!D:D,"' + s + '")');
    // Quiz Answers
    db.getRange(r, 3).setFormula('=COUNTIFS(\'Activity Log\'!C:C,"quiz",\'Activity Log\'!D:D,"' + s + '")');
    // Avg Rating
    db.getRange(r, 4).setFormula('=IFERROR(AVERAGEIFS(\'Activity Log\'!I:I,\'Activity Log\'!D:D,"' + s + '",\'Activity Log\'!C:C,"quiz",\'Activity Log\'!I:I,"<>"),"-")');
    // Quiz Minutes
    db.getRange(r, 5).setFormula('=ROUND(SUMIFS(\'Activity Log\'!J:J,\'Activity Log\'!D:D,"' + s + '",\'Activity Log\'!C:C,"quiz")/60,1)');
    // Flashcard Items (flashcards use subject "Word Roots" so only show for that)
    if (s === 'English') {
      db.getRange(r, 6).setFormula('=COUNTIFS(\'Activity Log\'!C:C,"flashcard")');
    } else {
      db.getRange(r, 6).setValue('-');
    }
    // Last Active
    db.getRange(r, 7).setFormula('=IFERROR(TEXT(MAX(FILTER(\'Activity Log\'!A:A,\'Activity Log\'!D:D="' + s + '")),"yyyy-mm-dd"),"-")');
  }
  // Flashcard note — on English row (row 9), Flashcard column (col 6)
  db.getRange(9, 6).setNote('Flashcards are logged under "Word Roots" subject — total shown on English row');

  // ===== STUDY HABITS (Row 14-28) =====
  header(14, 'Study Habits — Did He Study Before Challenging?');
  db.getRange(15, 1, 1, 6).setValues([['', '', '', '', '', '']]);
  db.getRange(15, 1).setValue('This table shows page views by type per chapter, plus quiz attempts. Chapters with quiz attempts but NO notes views = skipped studying.');
  db.getRange(15, 1, 1, 6).merge().setFontColor('#666666').setFontStyle('italic').setWrap(true);

  // Page views pivot: chapters × page types (LIMIT 12 to prevent overflow)
  db.getRange(17, 1).setValue('Page Views by Chapter & Type:').setFontWeight('bold');
  db.getRange(18, 1).setFormula(
    '=IFERROR(QUERY(\'Activity Log\'!C:F,"SELECT E, COUNT(C) WHERE C=\'page-view\' GROUP BY E PIVOT F ORDER BY E LIMIT 12 LABEL E \'Chapter\'",1),"No page views yet")'
  );

  // Quiz attempts per chapter (LIMIT 12 to match)
  db.getRange(17, 6).setValue('Quiz Attempts:').setFontWeight('bold');
  db.getRange(18, 6).setFormula(
    '=IFERROR(QUERY(\'Activity Log\'!C:E,"SELECT E, COUNT(C) WHERE C=\'quiz\' GROUP BY E ORDER BY E LIMIT 12 LABEL E \'Chapter\', COUNT(C) \'Answers\'",1),"No quiz data yet")'
  );

  // ===== WEAKEST CHAPTERS (Row 32-43) =====
  header(32, 'Weakest Chapters — Lowest Avg Self-Rating');
  subHeader(33, ['Subject', 'Chapter', 'Avg Rating', 'Questions', '', '', '', '']);
  db.getRange(34, 1).setFormula(
    '=IFERROR(QUERY(\'Activity Log\'!A:J,"SELECT D, E, AVG(I), COUNT(F) WHERE C=\'quiz\' AND I IS NOT NULL GROUP BY D, E ORDER BY AVG(I) ASC LIMIT 10 LABEL D \'Subject\', E \'Chapter\', AVG(I) \'Avg Rating\', COUNT(F) \'Questions\'",0),"No quiz data yet")'
  );

  // ===== WRITING PROGRESS (Row 46-70) =====
  header(46, 'Writing & Notes Progress');
  db.getRange(47, 1).setFormula(
    '=IFERROR(QUERY(\'Writing & Notes\'!A:F,"SELECT A, B, C, D WHERE A IS NOT NULL ORDER BY A, B, C LIMIT 25 LABEL A \'Subject\', B \'Chapter\', C \'Exercise\', D \'Type\'",1),"No writing/notes data yet")'
  );

  // ===== RECENT ACTIVITY (Row 74-96) =====
  header(74, 'Recent Activity — Last 20 Entries');
  db.getRange(75, 1).setFormula(
    '=IFERROR(QUERY(\'Activity Log\'!A:J,"SELECT A, B, C, D, E, F, I, J ORDER BY A DESC, B DESC LIMIT 20 LABEL A \'Date\', B \'Time\', C \'Type\', D \'Subject\', E \'Chapter\', F \'Item\', I \'Rating\', J \'Seconds\'",1),"No activity yet")'
  );

  // ===== FORMATTING =====
  db.setColumnWidth(1, 120);
  db.setColumnWidth(2, 110);
  db.setColumnWidth(3, 110);
  db.setColumnWidth(4, 110);
  db.setColumnWidth(5, 130);
  db.setColumnWidth(6, 110);
  db.setColumnWidth(7, 110);
  db.setColumnWidth(8, 100);

  // Freeze header row area
  db.setFrozenRows(3);
}

// ============================================================
// WRITE PROGRESS — "Writing & Notes" sheet
// Each exercise gets one row; new attempts add column pairs.
//
// Fixed columns:  A=Subject, B=Chapter, C=Exercise, D=Type
// Attempt pairs:  E/F = Att 1 Date / Att 1 Response
//                 G/H = Att 2 Date / Att 2 Response  ...
//
// overwrite flag (sent by client on re-saves within the same
// browser session) causes same-date attempts to be overwritten
// instead of creating new columns. A fresh page load always
// creates a new attempt, even on the same day — so morning and
// evening sessions are preserved separately.
//
// exercises: array of [subject, chapter, exercise, type, date, content]
// ============================================================
function writeProgress(ss, exercises, overwrite) {
  var SHEET_NAME = 'Writing & Notes';
  var FIXED_COLS = 4;

  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, FIXED_COLS)
      .setValues([['Subject', 'Chapter', 'Exercise', 'Type']])
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(FIXED_COLS);
  }

  // Read existing data once for fast row lookup
  var lastRow = sheet.getLastRow();
  var lookup = {}; // "subject|chapter|exercise" → row number (1-indexed)
  if (lastRow >= 2) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
    for (var r = 0; r < ids.length; r++) {
      var key = ids[r][0] + '|' + ids[r][1] + '|' + ids[r][2];
      lookup[key] = r + 2;
    }
  }

  for (var i = 0; i < exercises.length; i++) {
    var ex = exercises[i];
    var subject = ex[0], chapter = ex[1], exercise = ex[2], type = ex[3];
    var date = ex[4], content = ex[5];
    var key = subject + '|' + chapter + '|' + exercise;

    // Find or create the row
    var rowIdx = lookup[key];
    if (!rowIdx) {
      sheet.appendRow([subject, chapter, exercise, type]);
      rowIdx = sheet.getLastRow();
      lookup[key] = rowIdx;
    }

    // Find the next empty attempt column (scan date columns: 5, 7, 9, ...)
    var lastCol = sheet.getLastColumn();
    var attemptCol = FIXED_COLS + 1; // start at column E
    var lastFilledCol = null;        // track the last non-empty date column

    if (lastCol >= attemptCol) {
      var rowVals = sheet.getRange(rowIdx, attemptCol, 1, lastCol - FIXED_COLS).getValues()[0];
      for (var c = 0; c < rowVals.length; c += 2) {
        if (rowVals[c] !== '' && rowVals[c] !== null) {
          lastFilledCol = FIXED_COLS + 1 + c;
          attemptCol = FIXED_COLS + 1 + c + 2; // next empty pair
        }
      }
    }

    // Only overwrite the last attempt if the client sent the overwrite flag
    // (meaning this is a re-save within the same browser session).
    // A fresh page load never sends overwrite, so morning + evening sessions
    // always get separate attempt columns even on the same day.
    if (overwrite && lastFilledCol !== null) {
      attemptCol = lastFilledCol;
    }

    // Add column headers if this is a new attempt pair
    if (attemptCol > lastCol || !sheet.getRange(1, attemptCol).getValue()) {
      var attNum = Math.floor((attemptCol - FIXED_COLS - 1) / 2) + 1;
      sheet.getRange(1, attemptCol).setValue('Att ' + attNum + ' Date').setFontWeight('bold');
      sheet.getRange(1, attemptCol + 1).setValue('Att ' + attNum + ' Response').setFontWeight('bold');
    }

    // Write the attempt
    sheet.getRange(rowIdx, attemptCol).setValue(date);
    sheet.getRange(rowIdx, attemptCol + 1).setValue(content);
  }
}

// ============================================================
// PHOTO UPLOAD — doGet serves a mobile upload page
// URL: .../exec?subject=Math&chapter=Ch2+Algebra+1
// Photos saved to Google Drive: IGCSE Study Photos/{Subject}/
// Also logs a row to Activity Log for tracking
// ============================================================
function doGet(e) {
  var subject = (e.parameter.subject || '').replace(/[<>"'&]/g, '');
  var chapter = (e.parameter.chapter || '').replace(/[<>"'&]/g, '');
  return HtmlService.createHtmlOutput(getUploadHtml(subject, chapter))
    .setTitle('Upload Notes Photo')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Upload a single photo from base64 data.
// Called once per file from the client (which loops through selected files).
function uploadPhoto(subject, chapter, mimeType, base64Data) {
  // Get or create folder: IGCSE Study Photos / {Subject}
  var root = DriveApp.getRootFolder();
  var parentName = 'IGCSE Study Photos';
  var parents = root.getFoldersByName(parentName);
  var parent = parents.hasNext() ? parents.next() : root.createFolder(parentName);

  if (subject) {
    var subs = parent.getFoldersByName(subject);
    parent = subs.hasNext() ? subs.next() : parent.createFolder(subject);
  }

  var now = new Date();
  var tz = Session.getScriptTimeZone();
  var ts = Utilities.formatDate(now, tz, 'yyyy-MM-dd_HHmmss');
  var base = chapter ? chapter.replace(/\s+/g, '_') : 'notes';
  var ext = (mimeType || '').indexOf('png') !== -1 ? '.png' : '.jpg';
  var name = base + '_' + ts + ext;

  var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, name);
  parent.createFile(blob);

  // Log to Activity Log
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSetup(ss);
    var sheet = ss.getSheetByName('Activity Log') || ss.getSheets()[0];
    sheet.appendRow([
      Utilities.formatDate(now, tz, 'yyyy-MM-dd'),
      Utilities.formatDate(now, tz, 'HH:mm'),
      'photo-upload',
      subject,
      chapter,
      name,
      '',
      'uploaded',
      '',
      ''
    ]);
  } catch(e) {}

  return 'OK';
}

function getUploadHtml(subject, chapter) {
  return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
  '<style>' +
  '* { box-sizing: border-box; margin: 0; padding: 0; }' +
  'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; ' +
  'max-width: 420px; margin: 0 auto; padding: 24px 16px; background: #f5f5f5; color: #333; }' +
  '.hero { text-align: center; margin-bottom: 24px; }' +
  '.hero h1 { font-size: 22px; margin-bottom: 4px; }' +
  '.hero p { color: #666; font-size: 14px; }' +
  '.tags { display: flex; gap: 8px; justify-content: center; margin: 12px 0; }' +
  '.tag { background: #e74c3c; color: #fff; padding: 4px 14px; border-radius: 14px; font-size: 13px; font-weight: 600; }' +
  '.upload-area { background: #fff; border: 2px dashed #ccc; border-radius: 12px; padding: 32px 16px; ' +
  'text-align: center; margin: 16px 0; cursor: pointer; transition: border-color 0.2s; }' +
  '.upload-area.has-file { border-color: #27ae60; border-style: solid; }' +
  '.upload-area p { font-size: 15px; color: #888; margin-top: 8px; }' +
  '.cam-icon { font-size: 48px; }' +
  '.previews { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; justify-content: center; }' +
  '.previews img { width: 90px; height: 90px; object-fit: cover; border-radius: 8px; }' +
  '.file-count { font-size: 14px; font-weight: 600; color: #27ae60; margin-top: 8px; }' +
  'input[type=file] { display: none; }' +
  '.btn { display: block; width: 100%; padding: 14px; border: none; border-radius: 10px; ' +
  'font-size: 17px; font-weight: 700; cursor: pointer; margin-top: 16px; transition: all 0.2s; }' +
  '.btn-upload { background: #e74c3c; color: #fff; }' +
  '.btn-upload:disabled { background: #ccc; }' +
  '.btn-upload:not(:disabled):active { transform: scale(0.98); }' +
  '.status { text-align: center; margin-top: 16px; font-size: 15px; font-weight: 600; }' +
  '.status.ok { color: #27ae60; }' +
  '.status.err { color: #e74c3c; }' +
  '.done-box { text-align: center; margin-top: 24px; padding: 20px; background: #fff; border-radius: 12px; display: none; }' +
  '.done-box h2 { color: #27ae60; margin-bottom: 8px; }' +
  '</style></head><body>' +
  '<div class="hero">' +
  '<div class="cam-icon">&#128247;</div>' +
  '<h1>Upload Notes Photos</h1>' +
  '<p>Take photos of your handwritten notes or choose from gallery</p>' +
  '<div class="tags">' +
  '<span class="tag">' + subject + '</span>' +
  '<span class="tag">' + chapter + '</span>' +
  '</div></div>' +

  '<form id="uploadForm">' +
  '<input type="hidden" name="subject" value="' + subject + '">' +
  '<input type="hidden" name="chapter" value="' + chapter + '">' +
  '<div class="upload-area" id="dropArea" onclick="document.getElementById(\'photo\').click()">' +
  '<div class="cam-icon">&#128248;</div>' +
  '<p>Tap to take a photo or choose from gallery</p>' +
  '<div class="previews" id="previews"></div>' +
  '<div class="file-count" id="fileCount"></div>' +
  '</div>' +
  '<input type="file" id="photo" name="photo" accept="image/*" multiple onchange="showPreviews(this)">' +
  '<button type="button" class="btn btn-upload" id="uploadBtn" disabled onclick="submitForm()">Upload Photos</button>' +
  '</form>' +
  '<div class="status" id="status"></div>' +
  '<div class="done-box" id="doneBox">' +
  '<h2>&#10003; Uploaded!</h2>' +
  '<p>Your tutor can see your notes now.<br>You can close this page or upload more.</p>' +
  '<button type="button" class="btn btn-upload" onclick="resetForm()">Upload More Photos</button>' +
  '</div>' +

  '<script>' +
  'var subject = "' + subject + '";' +
  'var chapter = "' + chapter + '";' +
  'function clearEl(el) { while (el.firstChild) el.removeChild(el.firstChild); }' +
  'function showPreviews(input) {' +
  '  var files = input.files; if (!files.length) return;' +
  '  var box = document.getElementById("previews"); clearEl(box);' +
  '  document.getElementById("fileCount").textContent = files.length + " photo" + (files.length > 1 ? "s" : "") + " selected";' +
  '  document.getElementById("dropArea").classList.add("has-file");' +
  '  document.getElementById("uploadBtn").disabled = false;' +
  '  document.getElementById("uploadBtn").textContent = "Upload " + files.length + " Photo" + (files.length > 1 ? "s" : "");' +
  '  for (var i = 0; i < files.length; i++) {' +
  '    (function(file) {' +
  '      var reader = new FileReader();' +
  '      reader.onload = function(e) {' +
  '        var img = document.createElement("img"); img.src = e.target.result;' +
  '        box.appendChild(img);' +
  '      };' +
  '      reader.readAsDataURL(file);' +
  '    })(files[i]);' +
  '  }' +
  '}' +
  'function submitForm() {' +
  '  var files = document.getElementById("photo").files;' +
  '  if (!files.length) return;' +
  '  var btn = document.getElementById("uploadBtn");' +
  '  var status = document.getElementById("status");' +
  '  btn.disabled = true;' +
  '  status.className = "status"; status.textContent = "";' +
  '  var total = files.length, done = 0, failed = 0;' +
  '  function uploadNext(i) {' +
  '    if (i >= total) {' +
  '      btn.style.display = "none";' +
  '      document.getElementById("uploadForm").style.display = "none";' +
  '      var box = document.getElementById("doneBox"); box.style.display = "block";' +
  '      box.querySelector("h2").textContent = "\\u2713 " + done + " photo" + (done > 1 ? "s" : "") + " uploaded!";' +
  '      if (failed) { status.className = "status err"; status.textContent = failed + " failed"; }' +
  '      return;' +
  '    }' +
  '    btn.textContent = "Uploading " + (i + 1) + " of " + total + "...";' +
  '    var reader = new FileReader();' +
  '    reader.onload = function(e) {' +
  '      var b64 = e.target.result.split(",")[1];' +
  '      google.script.run' +
  '        .withSuccessHandler(function() { done++; uploadNext(i + 1); })' +
  '        .withFailureHandler(function() { failed++; uploadNext(i + 1); })' +
  '        .uploadPhoto(subject, chapter, files[i].type, b64);' +
  '    };' +
  '    reader.readAsDataURL(files[i]);' +
  '  }' +
  '  uploadNext(0);' +
  '}' +
  'function resetForm() {' +
  '  document.getElementById("uploadForm").style.display = "block";' +
  '  document.getElementById("uploadForm").reset();' +
  '  document.getElementById("doneBox").style.display = "none";' +
  '  clearEl(document.getElementById("previews"));' +
  '  document.getElementById("fileCount").textContent = "";' +
  '  document.getElementById("dropArea").classList.remove("has-file");' +
  '  document.getElementById("status").textContent = "";' +
  '  var btn = document.getElementById("uploadBtn");' +
  '  btn.style.display = "block"; btn.disabled = true; btn.textContent = "Upload Photos";' +
  '}' +
  '</script></body></html>';
}

// ============================================================
// MANUAL TRIGGER — Run this from the script editor to force
// Dashboard creation without waiting for data.
// Apps Script editor → Select "manualSetup" → Click Run
// ============================================================
function manualSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // Clear cached flag so ensureSetup runs fully
  PropertiesService.getScriptProperties().deleteProperty('setupDone');
  ensureSetup(ss);
  SpreadsheetApp.getUi().alert('Setup complete! Dashboard created.');
}
