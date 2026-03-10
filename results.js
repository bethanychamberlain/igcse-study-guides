// ============================================================
// Shared Study Results Module
// Handles localStorage persistence + Google Sheets sync
// Loaded via <script src="results.js"> or <script src="../results.js">
// ============================================================
(function() {
  // ============================================================
  // GOOGLE SHEETS CONFIGURATION
  var SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzwQywmHmRgm9J3U-UjI6KXnmke5DCX1nplLgOAtPo81BGkWgy1jWLu1r08_N021Hv3/exec';
  var SHEETS_KEY = 'igcse-study-2026'; // must match the key in your Apps Script
  // ============================================================

  var STORAGE_KEY = 'study-results';

  // ---- TUTOR MODE ----
  // When active, all tracking is silently suppressed (set via Ctrl+Shift+K)
  function isTutorMode() {
    try { return localStorage.getItem('igcse-tutor-mode') === 'on'; } catch(e) { return false; }
  }

  // ---- SAVE ----
  // rows: array of objects {date, time, type, subject, chapter, item, response, result, selfRating, seconds}
  function save(rows) {
    if (!rows || rows.length === 0) return {local: false, sheets: false};
    if (isTutorMode()) return {local: false, sheets: false};
    var localOk = saveToLocalStorage(rows);
    var sheetsOk = postToGoogleSheets(rows);
    return {local: localOk, sheets: sheetsOk};
  }

  function saveToLocalStorage(rows) {
    try {
      var existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      var combined = existing.concat(rows);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
      } catch(e) {
        // Storage full — trim oldest entries and retry
        combined = combined.slice(-3000);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
      }
      return true;
    } catch(e) {
      console.warn('localStorage save failed:', e);
      return false;
    }
  }

  function postToGoogleSheets(rows) {
    if (!SHEETS_URL) return false;
    // Convert objects to arrays matching spreadsheet columns
    var sheetRows = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      sheetRows.push([
        r.date, r.time, r.type, r.subject, r.chapter,
        r.item, r.response || '', r.result,
        r.selfRating !== undefined ? r.selfRating : '', r.seconds
      ]);
    }
    try {
      fetch(SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type': 'text/plain'},
        body: JSON.stringify({key: SHEETS_KEY, rows: sheetRows})
      }).catch(function(err) {
        console.warn('Google Sheets sync failed:', err);
      });
      return true; // fire-and-forget — we assume it works
    } catch(e) {
      return false;
    }
  }

  // ---- READ ----
  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch(e) { return []; }
  }

  function count() {
    return getAll().length;
  }

  // Summary stats for dashboard
  function getStats() {
    var all = getAll();
    var stats = {total: all.length, byType: {}, bySubject: {}, recent: []};
    for (var i = 0; i < all.length; i++) {
      var r = all[i];
      stats.byType[r.type] = (stats.byType[r.type] || 0) + 1;
      stats.bySubject[r.subject] = (stats.bySubject[r.subject] || 0) + 1;
    }
    // Last 10 sessions (group by date+time+type)
    stats.recent = all.slice(-50);
    return stats;
  }

  // ---- EXPORT ----
  function csvEscape(str) {
    str = String(str);
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
      return '"' + str.replace(/"/g, '""').replace(/\n/g, ' ') + '"';
    }
    return str;
  }

  function downloadCSV() {
    var all = getAll();
    if (all.length === 0) { alert('No results saved yet.'); return; }
    var headers = 'Date,Time,Type,Subject,Chapter,Item,Response,Result,Self-Rating,Seconds';
    var lines = [];
    for (var i = 0; i < all.length; i++) {
      var r = all[i];
      lines.push([
        r.date, r.time, r.type,
        csvEscape(r.subject), csvEscape(r.chapter), csvEscape(r.item),
        csvEscape(r.response || ''), r.result,
        r.selfRating !== undefined ? r.selfRating : '', r.seconds
      ].join(','));
    }
    var csv = headers + '\n' + lines.join('\n');
    var blob = new Blob([csv], {type: 'text/csv'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'study-results-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- CHECK CONFIG ----
  function isSheetsConfigured() {
    return SHEETS_URL.length > 0;
  }

  window.StudyResults = {
    save: save,
    getAll: getAll,
    count: count,
    getStats: getStats,
    downloadCSV: downloadCSV,
    isSheetsConfigured: isSheetsConfigured,
    isTutorMode: isTutorMode
  };
})();
