// ============================================================
// Google Apps Script for Study Results spreadsheet
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
// ============================================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.key !== 'igcse-study-2026') {
      return ContentService.createTextOutput('Unauthorized');
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.target === 'progress') {
      // New: per-exercise tracking on "Writing & Notes" sheet
      writeProgress(ss, data.exercises || []);
    } else {
      // Legacy: quiz + flashcard rows on Sheet 1
      var sheet = ss.getSheets()[0];
      var rows = data.rows || [];
      for (var i = 0; i < rows.length; i++) {
        sheet.appendRow(rows[i]);
      }
    }

    return ContentService.createTextOutput('OK');
  } catch (err) {
    return ContentService.createTextOutput('Error: ' + err.message);
  }
}

// ============================================================
// Write progress data to "Writing & Notes" sheet
// Each exercise gets one row; new attempts add column pairs.
//
// Fixed columns:  A=Subject, B=Chapter, C=Exercise, D=Type
// Attempt pairs:  E/F = Att 1 Date / Att 1 Response
//                 G/H = Att 2 Date / Att 2 Response  ...
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

    // Find next empty attempt column (scan date columns: 5, 7, 9, ...)
    var lastCol = sheet.getLastColumn();
    var attemptCol = FIXED_COLS + 1; // start at column E
    if (lastCol >= attemptCol) {
      var rowVals = sheet.getRange(rowIdx, attemptCol, 1, lastCol - FIXED_COLS).getValues()[0];
      for (var c = 0; c < rowVals.length; c += 2) {
        if (rowVals[c] !== '' && rowVals[c] !== null) {
          attemptCol = FIXED_COLS + 1 + c + 2;
        }
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
