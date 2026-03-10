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

    if (data.target === 'progress') {
      // Per-exercise tracking → "Writing & Notes" sheet
      writeProgress(ss, data.exercises || []);
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
// Same-date saves OVERWRITE the last attempt (prevents column
// bloat from multiple Save clicks in one session).
//
// exercises: array of [subject, chapter, exercise, type, date, content]
// ============================================================
function writeProgress(ss, exercises) {
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

    // Find the right attempt column:
    // - If the last filled attempt has the SAME date, overwrite it
    // - Otherwise, use the next empty column pair
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

    // If last attempt has the same date, overwrite instead of creating new column
    if (lastFilledCol !== null) {
      var lastDate = sheet.getRange(rowIdx, lastFilledCol).getValue();
      var lastDateStr = (lastDate instanceof Date)
        ? lastDate.toISOString().slice(0, 10)
        : String(lastDate);
      if (lastDateStr === date) {
        attemptCol = lastFilledCol; // overwrite same-date attempt
      }
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
