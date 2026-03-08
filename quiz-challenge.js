// ============================================================
// Quiz Challenge Mode
// Adds exam-style challenge mode to any quiz page.
// Loaded via <script src="../quiz-challenge.js">
// ============================================================
(function() {
  var qCards = document.querySelectorAll('.q-card');
  if (qCards.length === 0) return;

  // ---- STATE ----
  var challengeActive = false;
  var quizStartTime = null;
  var qFocusTimes = {};    // data-q -> last focus timestamp
  var qTotalTime = {};     // data-q -> cumulative seconds
  var qTextareas = {};     // data-q -> textarea element
  var originalParents = {}; // data-q -> {parent, nextSibling} for restoring position
  var saveDirHandle = null;
  var RESULTS_FILE = 'study-results.csv';
  var CSV_HEADERS = 'Date,Time,Type,Subject,Chapter,Item,Response,Result,Self-Rating,Seconds';

  // ---- PAGE INFO (from URL) ----
  var SUBJECT_LABELS = {
    biology:'Biology', chemistry:'Chemistry', physics:'Physics',
    english:'English', spanish:'Spanish', math:'Math'
  };
  var path = window.location.pathname;
  var parts = path.split('/').filter(function(p){return p.length>0;});
  var filename = parts[parts.length-1] || '';
  var dir = parts[parts.length-2] || '';
  var subjectKey = SUBJECT_LABELS[dir] ? dir : '';
  var subjectLabel = SUBJECT_LABELS[dir] || dir;
  var chapterSlug = filename.replace(/-quiz\.html$/, '');
  var chapterLabel = chapterSlug.replace(/^ch0?(\d+)-/, 'Ch$1 ').replace(/-/g, ' ');
  // Capitalize first letter of each word
  chapterLabel = chapterLabel.replace(/\b\w/g, function(c){return c.toUpperCase();});

  // ---- HELPERS ----
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function getMarks(card) {
    var m = card.querySelector('.q-marks');
    if (!m) return 0;
    var match = m.textContent.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  function getQNum(card) {
    return card.getAttribute('data-q') || '0';
  }

  function getQText(card) {
    var t = card.querySelector('.q-text');
    return t ? t.textContent.trim().substring(0, 120) : '';
  }

  function strategyHint(marks) {
    if (marks <= 1) return '1 mark = 1 precise point. No waffle.';
    if (marks === 2) return '2 marks = 2 distinct points. One sentence each.';
    if (marks === 3) return '3 marks = 3 distinct points in full sentences.';
    if (marks === 4) return '4 marks = 4 points. Use a clear structure.';
    if (marks <= 6) return marks + ' marks = structured answer. Intro point + ' + (marks-1) + ' supporting points. Full sentences, clear reasoning chain.';
    return marks + ' marks = extended answer. Plan before you write. ' + marks + ' distinct scoreable points needed.';
  }

  // ---- IndexedDB for shared folder handle (same DB as flash-cards) ----
  function openHandleDB() {
    return new Promise(function(resolve, reject) {
      var req = indexedDB.open('flashcard-settings', 1);
      req.onupgradeneeded = function() { req.result.createObjectStore('handles'); };
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error); };
    });
  }
  async function saveDirHandleToDB(handle) {
    var db = await openHandleDB();
    var tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').put(handle, 'saveDir');
  }
  async function loadDirHandleFromDB() {
    try {
      var db = await openHandleDB();
      return new Promise(function(resolve) {
        var tx = db.transaction('handles', 'readonly');
        var req = tx.objectStore('handles').get('saveDir');
        req.onsuccess = function() { resolve(req.result || null); };
        req.onerror = function() { resolve(null); };
      });
    } catch(e) { return null; }
  }

  // ---- INJECT CHALLENGE BUTTON ----
  var controls = document.querySelector('.controls');
  if (!controls) return;

  var challengeBtn = el('button', 'btn btn-primary', 'Challenge Mode');
  challengeBtn.style.cssText = 'background:#e74c3c;margin-left:8px;';
  challengeBtn.addEventListener('click', function() {
    if (!challengeActive) startChallenge();
  });
  controls.appendChild(challengeBtn);

  // ---- INJECT CSS ----
  var style = document.createElement('style');
  style.textContent =
    '.ch-mode .q-answer,.ch-mode .self-rate,.ch-mode .answer-lines{display:none!important}' +
    '.ch-mode .q-header{cursor:default!important}' +
    '.ch-textarea-wrap{padding:8px 20px 16px}' +
    '.ch-textarea{width:100%;min-height:80px;border:2px solid #ddd;border-radius:8px;padding:10px 12px;' +
      'font-family:inherit;font-size:14px;line-height:1.5;resize:vertical;transition:border-color .2s}' +
    '.ch-textarea:focus{border-color:var(--subject);outline:none}' +
    '.ch-strategy{font-size:12px;color:#7f8c8d;margin-top:6px;font-style:italic}' +
    '.ch-later-btn{font-family:inherit;font-size:12px;font-weight:600;padding:6px 14px;border:2px solid #f39c12;' +
      'border-radius:6px;background:#fef9e7;color:#b8770e;cursor:pointer;margin-left:auto;white-space:nowrap;transition:all .15s}' +
    '.ch-later-btn:hover{background:#f39c12;color:#fff}' +
    '.ch-later-btn.returned{border-color:#27ae60;background:#e8f8f0;color:#1a7a3a}' +
    '#skipped-section{margin-top:32px;display:none}' +
    '#skipped-section.has-items{display:block}' +
    '#skipped-header{background:#fef9e7;border:2px solid #f39c12;border-radius:10px;padding:14px 20px;margin-bottom:12px;' +
      'display:flex;align-items:center;gap:10px}' +
    '#skipped-header .badge{background:#f39c12;color:#fff;font-weight:800;font-size:14px;' +
      'width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center}' +
    '.skipped-card{opacity:.85;border-left:4px solid #f39c12!important}' +
    '#challenge-banner{background:linear-gradient(135deg,#2c3e50,#34495e);color:#fff;border-radius:10px;' +
      'padding:16px 20px;margin-bottom:20px}' +
    '#challenge-banner h3{font-size:16px;margin-bottom:8px}' +
    '#challenge-banner p{font-size:13px;opacity:.9;margin-bottom:4px}' +
    '#challenge-timer{position:sticky;top:44px;z-index:999;background:#2c3e50;color:#fff;text-align:center;' +
      'padding:6px 16px;border-radius:0 0 8px 8px;font-size:13px;font-weight:600;max-width:200px;margin:0 auto 16px;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.2)}' +
    '#finish-section{text-align:center;margin:32px 0}' +
    '#finish-btn{font-family:inherit;font-size:16px;font-weight:700;padding:14px 36px;background:#27ae60;color:#fff;' +
      'border:none;border-radius:10px;cursor:pointer;transition:all .15s}' +
    '#finish-btn:hover{background:#1e8449}' +
    '.ch-review-mode .q-answer.visible{display:block!important}' +
    '.ch-review-mode .self-rate{display:flex!important}' +
    '#save-section{text-align:center;margin:24px 0;display:none}' +
    '#save-btn{font-family:inherit;font-size:15px;font-weight:700;padding:12px 28px;background:#2e86c1;color:#fff;' +
      'border:none;border-radius:10px;cursor:pointer;margin:4px}' +
    '#save-btn:hover{background:#1a5276}' +
    '#save-section p{font-size:14px;color:#555;margin-bottom:12px}' +
    '@media print{#challenge-banner,#challenge-timer,#finish-section,#save-section,.ch-later-btn{display:none!important}}';
  document.head.appendChild(style);

  // ---- START CHALLENGE ----
  function startChallenge() {
    challengeActive = true;
    quizStartTime = Date.now();
    document.body.classList.add('ch-mode');

    // Hide the study-mode controls
    var btns = controls.querySelectorAll('.btn');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i] !== challengeBtn) btns[i].style.display = 'none';
    }
    var scoreDisp = controls.querySelector('.score-display');
    if (scoreDisp) scoreDisp.style.display = 'none';
    challengeBtn.textContent = 'Challenge Mode Active';
    challengeBtn.style.cssText = 'background:#c0392b;cursor:default;opacity:.8;margin-left:8px';
    challengeBtn.disabled = true;

    // Hide the quiz guide (how-it-works for study mode)
    var guide = document.querySelector('.quiz-guide');
    if (guide) guide.style.display = 'none';

    // Disable click-to-reveal on q-headers
    document.querySelectorAll('.q-header').forEach(function(h) {
      h.style.pointerEvents = 'none';
    });

    // Insert banner
    var banner = el('div');
    banner.id = 'challenge-banner';
    var bh = el('h3', null, 'Exam Challenge Mode');
    var bp1 = el('p', null, 'Write your answers below each question. Answers are hidden until you finish.');
    var bp2 = el('p', null, 'Strategy: check the marks — that tells you how many points the examiner wants. 3 marks = 3 distinct points.');
    var bp3 = el('p', null, 'Stuck on one? Hit "Later" to push it to the bottom. Come back to it before finishing.');
    banner.appendChild(bh);
    banner.appendChild(bp1);
    banner.appendChild(bp2);
    banner.appendChild(bp3);
    var firstTier = document.querySelector('.tier-header');
    if (firstTier) firstTier.parentNode.insertBefore(banner, firstTier);

    // Insert timer
    var timer = el('div');
    timer.id = 'challenge-timer';
    timer.textContent = '0:00';
    if (firstTier) firstTier.parentNode.insertBefore(timer, firstTier);
    setInterval(function() {
      if (!quizStartTime) return;
      var secs = Math.floor((Date.now() - quizStartTime) / 1000);
      var m = Math.floor(secs / 60);
      var s = secs % 60;
      timer.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    }, 1000);

    // Add textareas, strategy hints, and "Later" buttons to each question
    qCards.forEach(function(card) {
      var qNum = getQNum(card);
      var marks = getMarks(card);

      // "Later" button in the header row
      var laterBtn = el('button', 'ch-later-btn', 'Later');
      laterBtn.title = 'Skip for now — come back to it';
      laterBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        skipQuestion(card, qNum);
      });
      var header = card.querySelector('.q-header');
      if (header) header.appendChild(laterBtn);

      // Textarea wrapper
      var wrap = el('div', 'ch-textarea-wrap');
      var ta = document.createElement('textarea');
      ta.className = 'ch-textarea';
      ta.placeholder = 'Write your answer here...';
      // Set height based on marks
      ta.style.minHeight = Math.max(60, marks * 28 + 40) + 'px';
      wrap.appendChild(ta);

      // Strategy hint
      var hint = el('div', 'ch-strategy', strategyHint(marks));
      wrap.appendChild(hint);

      // Insert after q-header
      if (header && header.nextSibling) {
        card.insertBefore(wrap, header.nextSibling);
      } else {
        card.appendChild(wrap);
      }

      qTextareas[qNum] = ta;
      qTotalTime[qNum] = 0;
      qFocusTimes[qNum] = null;

      // Track time in textarea
      ta.addEventListener('focus', function() {
        qFocusTimes[qNum] = Date.now();
      });
      ta.addEventListener('blur', function() {
        if (qFocusTimes[qNum]) {
          qTotalTime[qNum] += Math.round((Date.now() - qFocusTimes[qNum]) / 1000);
          qFocusTimes[qNum] = null;
        }
      });
    });

    // Create skipped section
    var skipSection = el('div');
    skipSection.id = 'skipped-section';
    var skipHeader = el('div');
    skipHeader.id = 'skipped-header';
    var skipBadge = el('div', 'badge', '0');
    skipBadge.id = 'skip-badge';
    var skipLabel = el('div');
    var skipTitle = el('strong', null, 'Come Back To These');
    var skipDesc = el('div', null, 'You skipped these — don\'t leave them blank!');
    skipDesc.style.cssText = 'font-size:12px;color:#b8770e';
    skipLabel.appendChild(skipTitle);
    skipLabel.appendChild(skipDesc);
    skipHeader.appendChild(skipBadge);
    skipHeader.appendChild(skipLabel);
    skipSection.appendChild(skipHeader);

    // Insert before the footer or at end of body
    var footer = document.querySelector('.footer');
    if (footer) {
      footer.parentNode.insertBefore(skipSection, footer);
    } else {
      document.body.appendChild(skipSection);
    }

    // Create "I'm Done" section
    var finishSection = el('div');
    finishSection.id = 'finish-section';
    var finishBtn = el('button', null, 'I\'m Done — Check My Answers');
    finishBtn.id = 'finish-btn';
    finishBtn.addEventListener('click', finishChallenge);
    finishSection.appendChild(finishBtn);

    if (footer) {
      footer.parentNode.insertBefore(finishSection, footer);
    } else {
      document.body.appendChild(finishSection);
    }
  }

  // ---- SKIP / LATER ----
  var skippedCount = 0;

  function skipQuestion(card, qNum) {
    var skipSection = document.getElementById('skipped-section');
    if (!skipSection) return;

    // Remember original position
    originalParents[qNum] = {
      parent: card.parentNode,
      next: card.nextSibling
    };

    // Move to skipped section
    card.classList.add('skipped-card');
    skipSection.appendChild(card);
    skippedCount++;
    updateSkipBadge();

    // Change "Later" to "Return to position"
    var btn = card.querySelector('.ch-later-btn');
    if (btn) {
      btn.textContent = 'Return';
      btn.classList.add('returned');
      btn.onclick = null;
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        returnQuestion(card, qNum);
      });
    }
  }

  function returnQuestion(card, qNum) {
    var orig = originalParents[qNum];
    if (!orig) return;

    card.classList.remove('skipped-card');
    if (orig.next) {
      orig.parent.insertBefore(card, orig.next);
    } else {
      orig.parent.appendChild(card);
    }
    delete originalParents[qNum];
    skippedCount--;
    updateSkipBadge();

    // Change button back to "Later"
    var btn = card.querySelector('.ch-later-btn');
    if (btn) {
      btn.textContent = 'Later';
      btn.classList.remove('returned');
      btn.onclick = null;
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        skipQuestion(card, qNum);
      });
    }
  }

  function updateSkipBadge() {
    var badge = document.getElementById('skip-badge');
    if (badge) badge.textContent = skippedCount;
    var section = document.getElementById('skipped-section');
    if (section) {
      if (skippedCount > 0) {
        section.classList.add('has-items');
      } else {
        section.classList.remove('has-items');
      }
    }
  }

  // ---- FINISH CHALLENGE ----
  function finishChallenge() {
    // Flush any active focus timers
    qCards.forEach(function(card) {
      var qNum = getQNum(card);
      if (qFocusTimes[qNum]) {
        qTotalTime[qNum] += Math.round((Date.now() - qFocusTimes[qNum]) / 1000);
        qFocusTimes[qNum] = null;
      }
    });

    // Return any still-skipped questions
    var skipSection = document.getElementById('skipped-section');
    if (skipSection) {
      var remaining = skipSection.querySelectorAll('.q-card');
      remaining.forEach(function(card) {
        var qNum = getQNum(card);
        returnQuestion(card, qNum);
      });
    }

    // Switch to review mode
    document.body.classList.remove('ch-mode');
    document.body.classList.add('ch-review-mode');

    // Show all answers
    document.querySelectorAll('.q-answer').forEach(function(a) {
      a.classList.add('visible');
    });

    // Disable textareas
    Object.keys(qTextareas).forEach(function(qNum) {
      qTextareas[qNum].disabled = true;
      qTextareas[qNum].style.opacity = '0.7';
    });

    // Hide timer, banner, finish button, later buttons, skip section
    var timer = document.getElementById('challenge-timer');
    if (timer) timer.style.display = 'none';
    var banner = document.getElementById('challenge-banner');
    if (banner) {
      // Replace with review banner
      banner.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
      while (banner.firstChild) banner.removeChild(banner.firstChild);
      var rh = el('h3', null, 'Review Your Answers');
      var rp = el('p', null, 'Compare your answers to the model answers below. Rate yourself honestly (1-4) for each question, then save your results.');
      var totalSecs = Math.round((Date.now() - quizStartTime) / 1000);
      var totalMins = Math.floor(totalSecs / 60);
      var remSecs = totalSecs % 60;
      var rt = el('p', null, 'Time taken: ' + totalMins + 'm ' + remSecs + 's');
      rt.style.fontWeight = '700';
      banner.appendChild(rh);
      banner.appendChild(rp);
      banner.appendChild(rt);
    }
    var finishSection = document.getElementById('finish-section');
    if (finishSection) finishSection.style.display = 'none';
    if (skipSection) skipSection.style.display = 'none';
    document.querySelectorAll('.ch-later-btn').forEach(function(b) {
      b.style.display = 'none';
    });

    // Show save section
    var saveSection = el('div');
    saveSection.id = 'save-section';
    saveSection.style.display = 'block';
    var sp = el('p', null, 'Rate all your answers above, then save your results.');
    var saveBtn = el('button', null, 'Save Results');
    saveBtn.id = 'save-btn';
    saveBtn.addEventListener('click', saveResults);
    var changeFolderBtn = el('button', null, 'Change save folder');
    changeFolderBtn.style.cssText = 'font-family:inherit;font-size:12px;padding:8px 16px;background:#34495e;color:#fff;border:none;border-radius:10px;cursor:pointer;margin:4px';
    changeFolderBtn.addEventListener('click', changeSaveFolder);
    saveSection.appendChild(sp);
    saveSection.appendChild(saveBtn);
    saveSection.appendChild(changeFolderBtn);

    if (finishSection && finishSection.parentNode) {
      finishSection.parentNode.insertBefore(saveSection, finishSection);
    } else {
      document.body.appendChild(saveSection);
    }
  }

  // ---- SAVE RESULTS ----
  async function ensureDirHandle() {
    if (!saveDirHandle) {
      saveDirHandle = await loadDirHandleFromDB();
    }
    if (saveDirHandle) {
      var perm = await saveDirHandle.queryPermission({mode: 'readwrite'});
      if (perm !== 'granted') {
        perm = await saveDirHandle.requestPermission({mode: 'readwrite'});
      }
      if (perm !== 'granted') saveDirHandle = null;
    }
    if (!saveDirHandle) {
      saveDirHandle = await window.showDirectoryPicker({id: 'study-results', mode: 'readwrite'});
      await saveDirHandleToDB(saveDirHandle);
    }
    return saveDirHandle;
  }

  function csvEscape(str) {
    str = String(str).replace(/\n/g, ' ').replace(/\r/g, '');
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  async function saveResults() {
    var now = new Date();
    var dateStr = now.toLocaleDateString('en-US');
    var timeStr = now.toLocaleTimeString('en-US');

    // Collect ratings from the page
    var pageRatings = {};
    document.querySelectorAll('.rate-btn.selected').forEach(function(btn) {
      var card = btn.closest('.q-card');
      if (card) {
        pageRatings[getQNum(card)] = btn.getAttribute('data-val');
      }
    });

    // Build rows
    var newLines = [];
    qCards.forEach(function(card) {
      var qNum = getQNum(card);
      var marks = getMarks(card);
      var qText = getQText(card);
      var answer = qTextareas[qNum] ? qTextareas[qNum].value.trim() : '';
      var rating = pageRatings[qNum] || '';
      var secs = qTotalTime[qNum] || 0;

      newLines.push([
        dateStr,
        timeStr,
        'quiz',
        csvEscape(subjectLabel),
        csvEscape(chapterLabel),
        csvEscape('Q' + qNum + ' (' + marks + 'mk): ' + qText),
        csvEscape(answer),
        rating,
        rating,
        secs
      ].join(','));
    });

    var newRows = newLines.join('\n');
    var saveBtn = document.getElementById('save-btn');

    // Try File System Access API
    if (window.showDirectoryPicker) {
      try {
        var dirHandle = await ensureDirHandle();
        var existingCSV = '';
        try {
          var existingHandle = await dirHandle.getFileHandle(RESULTS_FILE);
          var file = await existingHandle.getFile();
          existingCSV = await file.text();
        } catch(e) { /* file doesn't exist yet */ }

        var finalCSV;
        if (existingCSV && existingCSV.trim().length > 0) {
          finalCSV = existingCSV.trimEnd() + '\n' + newRows;
        } else {
          finalCSV = CSV_HEADERS + '\n' + newRows;
        }

        var fileHandle = await dirHandle.getFileHandle(RESULTS_FILE, {create: true});
        var writable = await fileHandle.createWritable();
        await writable.write(finalCSV);
        await writable.close();
        if (saveBtn) {
          saveBtn.textContent = 'Saved!';
          saveBtn.style.background = '#27ae60';
          setTimeout(function() {
            saveBtn.textContent = 'Save Results';
            saveBtn.style.background = '#2e86c1';
          }, 2000);
        }
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: download file
    var csv = CSV_HEADERS + '\n' + newRows;
    var blob = new Blob([csv], {type: 'text/csv'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'study-results-' + now.toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function changeSaveFolder() {
    if (!window.showDirectoryPicker) {
      alert('Your browser does not support folder picking. Use Chrome or Edge.');
      return;
    }
    try {
      saveDirHandle = await window.showDirectoryPicker({id: 'study-results', mode: 'readwrite'});
      await saveDirHandleToDB(saveDirHandle);
      alert('Save folder updated!');
    } catch(e) { /* user cancelled */ }
  }
})();
