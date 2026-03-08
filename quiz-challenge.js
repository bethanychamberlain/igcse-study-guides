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
  // Results saving handled by results.js (localStorage + Google Sheets)

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

  // Detect IGCSE command word from question text
  function detectCommand(qText) {
    var t = qText.toLowerCase();
    if (/^(state|name|give|list|identify|write down)\b/.test(t)) return 'state';
    if (/^define\b/.test(t)) return 'define';
    if (/^describe\b/.test(t)) return 'describe';
    if (/^explain\b/.test(t)) return 'explain';
    if (/^(compare|distinguish)\b/.test(t)) return 'compare';
    if (/^(discuss|evaluate|assess)\b/.test(t)) return 'discuss';
    if (/^(suggest|predict)\b/.test(t)) return 'suggest';
    if (/^(calculate|work out|find the value)\b/.test(t)) return 'calculate';
    if (/^(draw|sketch|label|complete the diagram)\b/.test(t)) return 'draw';
    if (/^(outline|summarise|summarize)\b/.test(t)) return 'outline';
    if (/write\b/.test(t) && /equation/.test(t)) return 'equation';
    if (/\bquot(e|ation)\b/.test(t) || /from the (text|passage|extract)/.test(t)) return 'quote';
    if (/\banalys[ei]/.test(t) || /\beffect\b.*on the reader/.test(t) || /\blanguage\b/.test(t)) return 'analyse';
    return null;
  }

  function strategyHint(marks, subject, qText) {
    var cmd = detectCommand(qText);

    // ---- ENGLISH ----
    if (subject === 'english') {
      if (cmd === 'quote') return marks + ' mark' + (marks>1?'s':'') + ' \u2014 Find and copy the exact words from the text. Use quotation marks.';
      if (cmd === 'analyse' || (marks >= 3 && !cmd)) {
        if (marks <= 3) return marks + ' marks \u2014 Use P.E.E.: Point (what you notice) \u2192 Evidence (quote with \u201c...\u201d) \u2192 Explanation (what effect it has and why).';
        if (marks <= 5) return marks + ' marks \u2014 Write ' + Math.ceil(marks/2) + ' P.E.E. paragraphs. Point \u2192 Evidence (\u201cquote\u201d) \u2192 Explanation of effect on the reader.';
        return marks + ' marks \u2014 Extended response. Plan first. Write ' + Math.ceil(marks/2) + '+ P.E.E. paragraphs with varied vocabulary. Aim for 200\u2013300 words.';
      }
      if (marks <= 1) return '1 mark \u2014 Short, precise answer. One clear point.';
      if (marks <= 2) return marks + ' marks \u2014 ' + marks + ' clear points from the text. Quote where possible.';
      if (marks >= 5) return marks + ' marks \u2014 Use P.E.E. structure. Point \u2192 Evidence (\u201cquote\u201d) \u2192 Explanation. Aim for ' + Math.ceil(marks/2) + ' paragraphs.';
      return marks + ' marks \u2014 ' + marks + ' distinct points. Use P.E.E. if the question asks about language or effect.';
    }

    // ---- SPANISH ----
    if (subject === 'spanish') {
      if (marks <= 2) return marks + ' mark' + (marks>1?'s':'') + ' \u2014 Check: verb tense correct? Adjective agreement? Accent marks?';
      if (marks <= 4) return marks + ' marks \u2014 Use connectives (porque, tambi\u00e9n, sin embargo). Check gender/number agreement on every noun+adjective.';
      return marks + ' marks \u2014 Extended writing. Use a variety of tenses (present + past). Include opinions (creo que, en mi opini\u00f3n). Check every verb ending.';
    }

    // ---- MATH ----
    if (subject === 'math') {
      if (cmd === 'calculate' || cmd === 'draw') {
        return marks + ' mark' + (marks>1?'s':'') + ' \u2014 Show ALL working. Write the formula first, then substitute, then answer with correct units.';
      }
      if (marks <= 1) return '1 mark \u2014 Give the exact value. Include units if the question uses them.';
      return marks + ' marks \u2014 Show your working step by step. Each step can earn a mark even if the final answer is wrong.';
    }

    // ---- SCIENCE (Biology, Chemistry, Physics) ----
    // Command-word-specific hints
    if (cmd === 'state' || cmd === 'define') {
      return marks + ' mark' + (marks>1?'s':'') + ' \u2014 Brief and precise. Use the correct scientific term. No explanation needed.';
    }
    if (cmd === 'calculate') {
      return marks + ' marks \u2014 Write the formula \u2192 substitute values \u2192 calculate \u2192 answer with correct UNITS. Each step earns marks.';
    }
    if (cmd === 'equation') {
      var isChemistry = subject === 'chemistry';
      return marks + ' mark' + (marks>1?'s':'') + ' \u2014 ' + (isChemistry ? 'Reactants \u2192 Products. Check: is it balanced? State symbols (s), (l), (g), (aq) if asked.' : 'Write the word equation with an arrow \u2192 not an equals sign.');
    }
    if (cmd === 'describe') {
      return marks + ' marks \u2014 Say WHAT happens, step by step. ' + marks + ' distinct points. Use scientific terms. Don\'t explain why unless asked.';
    }
    if (cmd === 'explain') {
      return marks + ' marks \u2014 Say what happens AND why. Use \u201cbecause\u201d to link cause \u2192 effect. ' + marks + ' distinct reasoning points.';
    }
    if (cmd === 'compare') {
      return marks + ' marks \u2014 Name a similarity AND a difference (use \u201cwhereas\u201d / \u201cbut\u201d). Always mention BOTH things being compared in each point.';
    }
    if (cmd === 'suggest') {
      return marks + ' marks \u2014 Apply what you know to a new situation. There may be more than one right answer \u2014 just give a logical, scientific reason.';
    }
    if (cmd === 'discuss') {
      return marks + ' marks \u2014 Arguments FOR and AGAINST. Use evidence. Finish with a conclusion stating your view.';
    }
    if (cmd === 'draw') {
      return marks + ' mark' + (marks>1?'s':'') + ' \u2014 Use a ruler for straight lines. Label clearly. Include units on axes if it\u2019s a graph.';
    }

    // Generic fallback by marks (still subject-tinted)
    if (marks <= 1) return '1 mark = 1 precise point. No waffle \u2014 one correct scientific term or fact.';
    if (marks === 2) return '2 marks = 2 distinct points. State + give a reason (use \u201cbecause\u201d).';
    if (marks === 3) return '3 marks = 3 distinct points in full sentences. Use scientific terminology.';
    if (marks === 4) return '4 marks = structured answer. ' + (subject === 'chemistry' ? 'Include equations if relevant. ' : '') + '4 scoreable points with clear reasoning.';
    if (marks <= 6) return marks + ' marks = structured response. Plan: intro point + ' + (marks-1) + ' supporting points with reasoning. ' + (subject === 'physics' ? 'Show formulas and units.' : 'Use key scientific terms.');
    return marks + ' marks = extended answer. Plan before you write. Intro, ' + marks + ' key points with evidence/reasoning, brief conclusion. Aim for 150\u2013250 words.';
  }

  // results.js handles localStorage + Google Sheets (loaded before this script)

  // ---- MC DETECTION ----
  function isMCQuestion(card) {
    var strongs = card.querySelectorAll('.q-text strong');
    var letters = [];
    for (var i = 0; i < strongs.length; i++) {
      var t = strongs[i].textContent.trim();
      if (/^[A-D]$/.test(t)) letters.push(t);
    }
    return letters.length >= 3; // at least A, B, C
  }

  function getMCOptions(card) {
    // Extract MC option text from q-text
    var qText = card.querySelector('.q-text');
    if (!qText) return [];
    var strongs = qText.querySelectorAll('strong');
    var options = [];
    for (var i = 0; i < strongs.length; i++) {
      var letter = strongs[i].textContent.trim();
      if (!/^[A-D]$/.test(letter)) continue;
      // Get the text after this strong element until next <br> or strong
      var text = '';
      var node = strongs[i].nextSibling;
      while (node && !(node.nodeType === 1 && (node.tagName === 'BR' || node.tagName === 'STRONG'))) {
        text += node.textContent || '';
        node = node.nextSibling;
      }
      options.push({letter: letter, text: text.trim()});
    }
    return options;
  }

  function getCorrectMCLetter(card) {
    var ansBox = card.querySelector('.answer-box');
    if (!ansBox) return '';
    var firstStrong = ansBox.querySelector('strong');
    if (firstStrong) {
      var t = firstStrong.textContent.trim();
      if (/^[A-D]$/.test(t)) return t;
    }
    return '';
  }

  // ---- LIST QUESTION DETECTION ----
  function isListQuestion(card) {
    if (isMCQuestion(card)) return false;
    var info = getListInfo(card);
    return info.count >= 2;
  }

  function getListInfo(card) {
    var ansBox = card.querySelector('.answer-box');
    if (!ansBox) return {count: 0, labels: [], answers: []};

    var ansHTML = ansBox.innerHTML;
    var ansText = ansBox.textContent;

    // Check for sub-parts like (a), (b), (c) in the question text
    var qText = card.querySelector('.q-text');
    var qStr = qText ? qText.textContent : '';
    var subPartMatch = qStr.match(/\(([a-z])\)/g);
    if (subPartMatch && subPartMatch.length >= 2) {
      // Extract answers for each sub-part from the answer box
      var labels = [];
      var answers = [];
      for (var i = 0; i < subPartMatch.length; i++) {
        labels.push(subPartMatch[i]);
        // Try to extract answer text for this part
        var letter = subPartMatch[i].charAt(1);
        var nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
        var partRegex = new RegExp('\\(' + letter + '\\)\\s*([^]*?)(?=\\(' + nextLetter + '\\)|$)');
        var partMatch = ansText.match(partRegex);
        answers.push(partMatch ? partMatch[1].replace(/\[\d+\]/g, '').trim() : '');
      }
      return {count: labels.length, labels: labels, answers: answers};
    }

    // Count [1] markers in answer — each represents a separate scoreable point
    var markMatches = ansText.match(/\[\s*1\s*\]/g);
    if (markMatches && markMatches.length >= 2) {
      // Extract bold terms as the expected answers
      var bolds = ansBox.querySelectorAll('strong');
      var answers = [];
      for (var b = 0; b < bolds.length; b++) {
        var term = bolds[b].textContent.trim();
        if (term.length > 1 && !/^[A-D]$/.test(term) && !/^Answer$/i.test(term)) {
          answers.push(term);
        }
      }
      var count = Math.max(markMatches.length, answers.length);
      if (count < 2) return {count: 0, labels: [], answers: []};
      var labels = [];
      for (var n = 1; n <= count; n++) labels.push(n + '.');
      return {count: count, labels: labels, answers: answers};
    }

    return {count: 0, labels: [], answers: []};
  }

  // ---- HINT SYSTEM ----
  var qHints = {};       // data-q -> number of hints used
  var qHintData = {};    // data-q -> array of hint strings
  var qMCEliminated = {}; // data-q -> set of eliminated letters

  function buildHints(card) {
    var qNum = getQNum(card);
    var marks = getMarks(card);
    var hints = [];

    if (isMCQuestion(card)) {
      // For MC: each hint eliminates a wrong option
      var correct = getCorrectMCLetter(card);
      var options = getMCOptions(card);
      var wrong = [];
      for (var i = 0; i < options.length; i++) {
        if (options[i].letter !== correct) wrong.push(options[i].letter);
      }
      // Shuffle wrong options so eliminated ones vary
      for (var j = wrong.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = wrong[j]; wrong[j] = wrong[k]; wrong[k] = tmp;
      }
      for (var w = 0; w < wrong.length; w++) {
        hints.push({type: 'eliminate', letter: wrong[w]});
      }
    } else if (isListQuestion(card)) {
      // For list questions: reveal first letter per box
      var listInfo = getListInfo(card);
      for (var li = 0; li < listInfo.answers.length; li++) {
        var ans = listInfo.answers[li];
        // Get the first significant word
        var firstWord = ans.split(/[\s,;:]+/).filter(function(w) { return w.length > 1; })[0] || ans.charAt(0);
        hints.push({type: 'listLetter', index: li, term: firstWord});
      }
    } else {
      // For text: extract key terms from answer bold elements
      var ansBox = card.querySelector('.answer-box');
      if (ansBox) {
        var bolds = ansBox.querySelectorAll('strong');
        for (var b = 0; b < bolds.length; b++) {
          var term = bolds[b].textContent.trim();
          if (term.length > 1 && !/^[A-D]$/.test(term)) {
            hints.push({type: 'firstLetter', term: term});
          }
        }
      }
      // If no bold terms found, use first words of answer text
      if (hints.length === 0 && ansBox) {
        var ansText = ansBox.textContent.replace(/Answer/i, '').trim();
        var words = ansText.split(/\s+/).filter(function(w) { return w.length > 3; });
        for (var ww = 0; ww < Math.min(words.length, 3); ww++) {
          hints.push({type: 'firstLetter', term: words[ww]});
        }
      }
    }
    return hints;
  }

  function hintPenalty(numHints) {
    if (numHints === 0) return 1;
    if (numHints === 1) return 0.5;
    if (numHints === 2) return 0.25;
    return 0; // 3+ hints = no marks
  }

  function hintPenaltyText(numHints) {
    if (numHints === 0) return '';
    if (numHints === 1) return '1 hint used (\u201350%)';
    if (numHints === 2) return '2 hints used (\u201375%)';
    return numHints + ' hints used (\u2013100%)';
  }

  function useHint(card, qNum, btn) {
    var hints = qHintData[qNum];
    if (!hints || hints.length === 0) return;

    var used = qHints[qNum];
    if (used >= hints.length) return; // all used up

    var hint = hints[used];
    qHints[qNum] = used + 1;

    if (hint.type === 'eliminate') {
      // MC: cross out a wrong option
      qMCEliminated[qNum][hint.letter] = true;
      var mcWrap = card.querySelector('.ch-mc-wrap');
      if (mcWrap) {
        var opts = mcWrap.querySelectorAll('.ch-mc-option');
        for (var i = 0; i < opts.length; i++) {
          if (opts[i].getAttribute('data-letter') === hint.letter) {
            opts[i].classList.add('eliminated');
            // If this was selected, deselect it
            if (opts[i].classList.contains('selected')) {
              opts[i].classList.remove('selected');
              if (qTextareas[qNum] && qTextareas[qNum]._ref) {
                qTextareas[qNum]._ref.value = '';
              }
            }
            break;
          }
        }
      }
    } else if (hint.type === 'listLetter') {
      // List question: show first letter as placeholder in the specific input box
      var inputEl = document.getElementById('list-input-' + qNum + '-' + hint.index);
      if (inputEl) {
        inputEl.placeholder = hint.term.charAt(0).toUpperCase() + '...';
        inputEl.style.borderColor = '#3498db';
      }
    } else if (hint.type === 'firstLetter') {
      // Text: show first letter of the next key term
      var infoEl = document.getElementById('hint-info-' + qNum);
      if (infoEl) {
        // Build running list of revealed letters
        var letters = [];
        for (var j = 0; j <= used; j++) {
          if (hints[j].type === 'firstLetter') {
            letters.push(hints[j].term.charAt(0).toUpperCase() + '...');
          }
        }
        if (letters.length > 0) {
          infoEl.textContent = hintPenaltyText(qHints[qNum]) + ' \u2014 Key terms start with: ' + letters.join(', ');
          return; // skip the default info update below
        }
      }
    }

    // Update penalty display
    var infoEl = document.getElementById('hint-info-' + qNum);
    if (infoEl) {
      infoEl.textContent = hintPenaltyText(qHints[qNum]);
    }

    // Disable button if all hints exhausted
    if (qHints[qNum] >= hints.length) {
      btn.classList.add('used-up');
      btn.textContent = 'No hints left';
    }
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
    '.ch-word-count{font-size:11px;color:#bdc3c7;text-align:right;margin-top:4px;font-variant-numeric:tabular-nums;transition:color .3s}' +
    '.ch-mc-wrap{padding:8px 20px 16px}' +
    '.ch-mc-option{display:flex;align-items:center;gap:10px;padding:10px 14px;margin:4px 0;border:2px solid #ddd;border-radius:10px;' +
      'cursor:pointer;transition:all .15s;font-size:14px}' +
    '.ch-mc-option:hover{border-color:var(--subject);background:rgba(0,0,0,.02)}' +
    '.ch-mc-option.selected{border-color:var(--subject);background:rgba(39,174,96,.08)}' +
    '.ch-mc-option.eliminated{opacity:.3;pointer-events:none;text-decoration:line-through;border-style:dashed}' +
    '.ch-mc-bubble{width:28px;height:28px;border-radius:50%;border:2px solid #bbb;display:flex;align-items:center;' +
      'justify-content:center;font-weight:800;font-size:13px;color:#888;flex-shrink:0;transition:all .15s}' +
    '.ch-mc-option.selected .ch-mc-bubble{background:var(--subject);border-color:var(--subject);color:#fff}' +
    '.ch-list-wrap{padding:8px 20px 16px}' +
    '.ch-list-row{display:flex;align-items:center;gap:8px;margin:4px 0}' +
    '.ch-list-label{font-weight:700;font-size:13px;color:#7f8c8d;min-width:24px;text-align:right}' +
    '.ch-list-input{flex:1;border:2px solid #ddd;border-radius:8px;padding:8px 12px;' +
      'font-family:inherit;font-size:14px;line-height:1.4;transition:border-color .2s}' +
    '.ch-list-input:focus{border-color:var(--subject);outline:none}' +
    '.ch-list-input::placeholder{color:#ccc}' +
    '.ch-hint-btn{font-family:inherit;font-size:11px;font-weight:600;padding:4px 10px;border:2px solid #3498db;' +
      'border-radius:6px;background:#eaf2f8;color:#2471a3;cursor:pointer;white-space:nowrap;transition:all .15s;margin-left:4px}' +
    '.ch-hint-btn:hover{background:#3498db;color:#fff}' +
    '.ch-hint-btn.used-up{opacity:.4;pointer-events:none}' +
    '.ch-hint-info{font-size:11px;color:#e67e22;font-weight:600;margin-top:4px}' +
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

      var header = card.querySelector('.q-header');

      // "Hint" button in the header row
      qHints[qNum] = 0;
      qHintData[qNum] = buildHints(card);
      qMCEliminated[qNum] = {};
      var hintBtn = el('button', 'ch-hint-btn', 'Hint');
      hintBtn.title = 'Get a hint (costs marks)';
      hintBtn.addEventListener('click', (function(c, q, btn) {
        return function(e) {
          e.stopPropagation();
          useHint(c, q, btn);
        };
      })(card, qNum, hintBtn));
      if (header) header.appendChild(hintBtn);

      // "Later" button in the header row
      var laterBtn = el('button', 'ch-later-btn', 'Later');
      laterBtn.title = 'Skip for now \u2014 come back to it';
      laterBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        skipQuestion(card, qNum);
      });
      if (header) header.appendChild(laterBtn);

      var ismc = isMCQuestion(card);
      var qText = getQText(card);

      if (ismc) {
        // ---- MC: render clickable bubbles ----
        var mcWrap = el('div', 'ch-mc-wrap');
        var options = getMCOptions(card);
        var selectedRef = {value: ''};
        for (var oi = 0; oi < options.length; oi++) {
          (function(opt) {
            var row = el('div', 'ch-mc-option');
            row.setAttribute('data-letter', opt.letter);
            var bubble = el('div', 'ch-mc-bubble', opt.letter);
            var label = el('span', null, opt.text);
            row.appendChild(bubble);
            row.appendChild(label);
            row.addEventListener('click', function() {
              // Deselect all in this group
              var siblings = mcWrap.querySelectorAll('.ch-mc-option');
              for (var s = 0; s < siblings.length; s++) siblings[s].classList.remove('selected');
              row.classList.add('selected');
              selectedRef.value = opt.letter;
            });
            mcWrap.appendChild(row);
          })(options[oi]);
        }

        // Strategy hint
        var hint = el('div', 'ch-strategy', strategyHint(marks, subjectKey, qText));
        mcWrap.appendChild(hint);

        // Hint penalty info (hidden until hints used)
        var hintInfo = el('div', 'ch-hint-info');
        hintInfo.id = 'hint-info-' + qNum;
        mcWrap.appendChild(hintInfo);

        if (header && header.nextSibling) {
          card.insertBefore(mcWrap, header.nextSibling);
        } else {
          card.appendChild(mcWrap);
        }

        // Store a fake textarea-like accessor for saving
        qTextareas[qNum] = {value: '', _ref: selectedRef, _mc: mcWrap,
          get value() { return this._ref.value; },
          set disabled(v) { if(v) { var opts = this._mc.querySelectorAll('.ch-mc-option'); for(var i=0;i<opts.length;i++) opts[i].style.pointerEvents='none'; }},
          set style(v) {}
        };
      } else if (isListQuestion(card)) {
        // ---- LIST: render individual input boxes ----
        var listInfo = getListInfo(card);
        var listWrap = el('div', 'ch-list-wrap');
        var listInputs = [];
        for (var li = 0; li < listInfo.count; li++) {
          var row = el('div', 'ch-list-row');
          var label = el('span', 'ch-list-label', listInfo.labels[li]);
          var input = document.createElement('input');
          input.type = 'text';
          input.className = 'ch-list-input';
          input.id = 'list-input-' + qNum + '-' + li;
          input.placeholder = '';
          row.appendChild(label);
          row.appendChild(input);
          listWrap.appendChild(row);
          listInputs.push(input);
        }

        // Strategy hint
        var hint = el('div', 'ch-strategy', strategyHint(marks, subjectKey, qText));
        listWrap.appendChild(hint);

        // Hint penalty info
        var hintInfo = el('div', 'ch-hint-info');
        hintInfo.id = 'hint-info-' + qNum;
        listWrap.appendChild(hintInfo);

        if (header && header.nextSibling) {
          card.insertBefore(listWrap, header.nextSibling);
        } else {
          card.appendChild(listWrap);
        }

        // Store a fake textarea-like accessor that joins all inputs
        qTextareas[qNum] = {_inputs: listInputs, _wrap: listWrap,
          get value() {
            var vals = [];
            for (var i = 0; i < this._inputs.length; i++) {
              var v = this._inputs[i].value.trim();
              if (v) vals.push(v);
            }
            return vals.join('; ');
          },
          set disabled(v) { if(v) { for(var i=0;i<this._inputs.length;i++) this._inputs[i].disabled=true; }},
          set style(v) {}
        };
      } else {
        // ---- TEXT: render textarea ----
        var wrap = el('div', 'ch-textarea-wrap');
        var ta = document.createElement('textarea');
        ta.className = 'ch-textarea';
        ta.placeholder = 'Write your answer here...';
        ta.style.minHeight = Math.max(60, marks * 28 + 40) + 'px';
        wrap.appendChild(ta);

        // Strategy hint
        var hint = el('div', 'ch-strategy', strategyHint(marks, subjectKey, qText));
        wrap.appendChild(hint);

        // Hint penalty info
        var hintInfo = el('div', 'ch-hint-info');
        hintInfo.id = 'hint-info-' + qNum;
        wrap.appendChild(hintInfo);

        // Word count for longer answers (4+ marks)
        if (marks >= 4) {
          var wc = el('div', 'ch-word-count', '0 words');
          wrap.appendChild(wc);
          ta.addEventListener('input', (function(wcEl) {
            return function() {
              var words = this.value.trim().split(/\s+/).filter(function(w){return w.length>0;});
              var count = words.length;
              wcEl.textContent = count + ' word' + (count !== 1 ? 's' : '');
              if (count >= 150) wcEl.style.color = '#27ae60';
              else if (count >= 50) wcEl.style.color = '#7f8c8d';
              else wcEl.style.color = '#bdc3c7';
            };
          })(wc));
        }

        if (header && header.nextSibling) {
          card.insertBefore(wrap, header.nextSibling);
        } else {
          card.appendChild(wrap);
        }
        qTextareas[qNum] = ta;
      }

      qTotalTime[qNum] = 0;
      qFocusTimes[qNum] = null;

      // Track time (textarea/input focus)
      if (!ismc) {
        var focusTargets = qTextareas[qNum]._inputs || [qTextareas[qNum]];
        for (var ft = 0; ft < focusTargets.length; ft++) {
          if (!focusTargets[ft] || !focusTargets[ft].addEventListener) continue;
          (function(q) {
            focusTargets[ft].addEventListener('focus', function() {
              if (!qFocusTimes[q]) qFocusTimes[q] = Date.now();
            });
            focusTargets[ft].addEventListener('blur', function() {
              if (qFocusTimes[q]) {
                qTotalTime[q] += Math.round((Date.now() - qFocusTimes[q]) / 1000);
                qFocusTimes[q] = null;
              }
            });
          })(qNum);
        }
      }
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

    // Disable textareas/inputs and hide hint buttons
    Object.keys(qTextareas).forEach(function(qNum) {
      qTextareas[qNum].disabled = true;
      // For real textareas, dim them; for fake accessors (MC/list), dim the wrapper
      if (qTextareas[qNum].style && typeof qTextareas[qNum].style === 'object') {
        qTextareas[qNum].style.opacity = '0.7';
      } else if (qTextareas[qNum]._wrap) {
        qTextareas[qNum]._wrap.style.opacity = '0.7';
      } else if (qTextareas[qNum]._mc) {
        qTextareas[qNum]._mc.style.opacity = '0.7';
      }
    });
    document.querySelectorAll('.ch-hint-btn').forEach(function(b) {
      b.style.display = 'none';
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
    var saveStatus = el('p');
    saveStatus.id = 'save-status';
    saveStatus.style.cssText = 'font-size:12px;color:#7f8c8d;margin-top:8px';
    var dlBtn = el('button', null, 'Download All as CSV');
    dlBtn.style.cssText = 'font-family:inherit;font-size:12px;padding:8px 16px;background:#7f8c8d;color:#fff;border:none;border-radius:10px;cursor:pointer;margin:4px';
    dlBtn.addEventListener('click', function() {
      if (window.StudyResults) StudyResults.downloadCSV();
    });
    saveSection.appendChild(sp);
    saveSection.appendChild(saveBtn);
    saveSection.appendChild(saveStatus);
    saveSection.appendChild(dlBtn);

    if (finishSection && finishSection.parentNode) {
      finishSection.parentNode.insertBefore(saveSection, finishSection);
    } else {
      document.body.appendChild(saveSection);
    }
  }

  // ---- SAVE RESULTS (via results.js — localStorage + Google Sheets) ----
  function saveResults() {
    if (!window.StudyResults) {
      alert('Results module not loaded. Try refreshing the page.');
      return;
    }
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

    // Build result objects
    var rows = [];
    qCards.forEach(function(card) {
      var qNum = getQNum(card);
      var marks = getMarks(card);
      var qText = getQText(card);
      var answer = qTextareas[qNum] ? qTextareas[qNum].value.trim() : '';
      var rating = pageRatings[qNum] || '';
      var secs = qTotalTime[qNum] || 0;

      var result = 'blank';
      if (answer.length > 0) result = 'attempted';
      if (originalParents[qNum]) result = 'skipped';

      var hintsUsed = qHints[qNum] || 0;
      var penalty = hintPenalty(hintsUsed);
      var resultStr = result;
      if (hintsUsed > 0) resultStr += ' (' + hintsUsed + ' hint' + (hintsUsed > 1 ? 's' : '') + ', ' + Math.round(penalty * 100) + '%)';

      rows.push({
        date: dateStr,
        time: timeStr,
        type: 'quiz',
        subject: subjectLabel,
        chapter: chapterLabel,
        item: 'Q' + qNum + ' (' + marks + 'mk): ' + qText,
        response: answer,
        result: resultStr,
        selfRating: rating,
        seconds: secs
      });
    });

    StudyResults.save(rows);
    var total = StudyResults.count();

    var saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.textContent = 'Saved!';
      saveBtn.style.background = '#27ae60';
      setTimeout(function() {
        saveBtn.textContent = 'Save Results';
        saveBtn.style.background = '#2e86c1';
      }, 2500);
    }
    var status = document.getElementById('save-status');
    if (status) {
      status.textContent = total + ' results stored locally' + (StudyResults.isSheetsConfigured() ? ' + synced to Google Sheets' : '');
    }
  }
})();
