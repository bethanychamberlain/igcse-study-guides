// ============================================================
// Shared navigation bar for IGCSE Study Guides
// Injected via <script src="nav.js"> or <script src="../nav.js">
// ============================================================
(function() {
  var SUBJECTS = {
    biology: {
      label: 'Biology', color: '#27ae60',
      chapters: [
        {slug:'ch01-classification', title:'Classification'},
        {slug:'ch02-cells', title:'Cells'},
        {slug:'ch03-movement', title:'Movement In/Out of Cells'},
        {slug:'ch04-biological-molecules', title:'Biological Molecules'},
        {slug:'ch05-enzymes', title:'Enzymes'},
        {slug:'ch06-photosynthesis', title:'Photosynthesis'},
        {slug:'ch07-human-nutrition', title:'Human Nutrition'},
        {slug:'ch08-plant-transport', title:'Plant Transport'},
        {slug:'ch09-circulation', title:'Circulation'},
        {slug:'ch10-diseases-immunity', title:'Diseases & Immunity'},
        {slug:'ch11-respiration', title:'Respiration'},
        {slug:'ch12-gas-exchange', title:'Gas Exchange'},
        {slug:'ch13-excretion', title:'Excretion'},
        {slug:'ch14-coordination', title:'Coordination'},
        {slug:'ch15-antibiotics', title:'Antibiotics'},
        {slug:'ch16-reproduction', title:'Reproduction'},
        {slug:'ch17-inheritance', title:'Inheritance'},
        {slug:'ch18-variation-evolution', title:'Variation & Evolution'},
        {slug:'ch19-ecology', title:'Ecology'},
        {slug:'ch20-human-impacts', title:'Human Impacts'},
        {slug:'ch21-biotechnology', title:'Biotechnology'}
      ]
    },
    chemistry: {
      label: 'Chemistry', color: '#8e44ad',
      chapters: [
        {slug:'ch01-states', title:'States of Matter'},
        {slug:'ch02-atoms-elements', title:'Atoms & Elements'},
        {slug:'ch03-atoms-combining', title:'Atoms Combining'},
        {slug:'ch04-reacting-masses', title:'Reacting Masses'},
        {slug:'ch05-using-moles', title:'Using Moles'},
        {slug:'ch06-redox-reactions', title:'Redox Reactions'},
        {slug:'ch07-electrolysis', title:'Electrolysis'},
        {slug:'ch08-energy-changes', title:'Energy Changes'},
        {slug:'ch09-rate-of-reaction', title:'Rate of Reaction'},
        {slug:'ch10-reversible-equilibrium', title:'Reversible & Equilibrium'},
        {slug:'ch11-acids-bases-salts', title:'Acids, Bases & Salts'},
        {slug:'ch12-periodic-table', title:'Periodic Table'},
        {slug:'ch13-metals-behaviour', title:'Metals Behaviour'},
        {slug:'ch14-extracting-metals', title:'Extracting Metals'},
        {slug:'ch15-environment', title:'Environment'},
        {slug:'ch16-organic-chemistry', title:'Organic Chemistry'},
        {slug:'ch17-polymers', title:'Polymers'},
        {slug:'ch18-separation-purification', title:'Separation & Purification'},
        {slug:'ch19-experiments-tests', title:'Experiments & Tests'}
      ]
    },
    physics: {
      label: 'Physics', color: '#2e86c1',
      chapters: [
        {slug:'ch01-measurements-units', title:'Measurements & Units'},
        {slug:'ch02-forces-motion', title:'Forces & Motion'},
        {slug:'ch03-forces-pressure', title:'Forces & Pressure'},
        {slug:'ch04-energy', title:'Energy'},
        {slug:'ch05-thermal-effects', title:'Thermal Effects'},
        {slug:'ch06-waves-sounds', title:'Waves & Sounds'},
        {slug:'ch07-rays-waves', title:'Rays & Waves'},
        {slug:'ch08-electricity', title:'Electricity'},
        {slug:'ch09-magnets-currents', title:'Magnets & Currents'},
        {slug:'ch10-radioactivity', title:'Radioactivity'},
        {slug:'ch11-earth-space', title:'Earth & Space'}
      ]
    },
    english: {
      label: 'English', color: '#c2185b',
      chapters: [
        {slug:'ch01-travellers-tales', title:"Travellers' Tales", types:['notes','cheatsheet','quiz','writing']},
        {slug:'ch02-world-of-nature', title:'World of Nature', types:['notes','cheatsheet','quiz','writing']},
        {slug:'ch03-points-of-view', title:'Points of View', types:['notes','cheatsheet','quiz','writing']},
        {slug:'ch04-all-the-world', title:'All the World', types:['notes','cheatsheet','quiz','writing']},
        {slug:'ch05-family-friends', title:'Family & Friends', types:['notes','cheatsheet','quiz','writing']},
        {slug:'ch06-material-world', title:'Material World', types:['notes','cheatsheet','quiz','writing']},
        {slug:'ch07-believe-it-or-not', title:'Believe It or Not', types:['notes','cheatsheet','quiz','writing']},
        {slug:'ch08-world-famous', title:'World Famous', types:['notes','cheatsheet','quiz','writing']},
        {slug:'ch09-endings', title:'Endings', types:['notes','cheatsheet','quiz','writing']}
      ]
    },
    spanish: {
      label: 'Spanish', color: '#e67e22',
      chapters: [
        {slug:'ch01-my-home', title:'My Home'},
        {slug:'ch02-family-friends', title:'Family & Friends'},
        {slug:'ch03-home-town', title:'Home Town'},
        {slug:'ch04-spanish-schools', title:'Spanish Schools'},
        {slug:'ch05-international-travel', title:'International Travel'},
        {slug:'ser-estar', title:'Ser vs Estar'}
      ]
    },
    math: {
      label: 'Math', color: '#e74c3c',
      chapters: [
        {slug:'ch01-shape-space1', title:'Shape & Space 1'},
        {slug:'ch02-algebra1', title:'Algebra 1'},
        {slug:'ch03-number1', title:'Number 1'},
        {slug:'ch04-handling-data1', title:'Handling Data 1'},
        {slug:'ch05-shape-space2', title:'Shape & Space 2'},
        {slug:'ch06-algebra2', title:'Algebra 2'},
        {slug:'ch07-number2', title:'Number 2'},
        {slug:'ch08-probability', title:'Probability'},
        {slug:'ch09-shape-space3', title:'Shape & Space 3'},
        {slug:'ch10-number3', title:'Number 3'},
        {slug:'ch11-using-applying', title:'Using & Applying'}
      ]
    }
  };

  var ALL_TYPES = ['notes', 'cheatsheet', 'quiz', 'writing'];
  var DEFAULT_TYPES = ['notes', 'cheatsheet', 'quiz'];
  var TYPE_LABELS = {notes: 'Notes', cheatsheet: 'Cheatsheet', quiz: 'Quiz', writing: 'Writing'};

  // Helper to create elements
  function el(tag, cls, text, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    if (attrs) { for (var k in attrs) e.setAttribute(k, attrs[k]); }
    return e;
  }

  function makeLink(href, cls, text, title) {
    var a = document.createElement('a');
    a.href = href;
    if (cls) a.className = cls;
    a.textContent = text;
    if (title) a.title = title;
    return a;
  }

  function chLabel(slug) {
    var num = slug.split('-')[0];
    return num.replace('ch0', 'Ch ').replace('ch', 'Ch ');
  }

  // Detect current page from URL
  var path = window.location.pathname;
  var parts = path.split('/').filter(function(p) { return p.length > 0; });
  var filename = parts[parts.length - 1] || '';
  var dir = parts[parts.length - 2] || '';

  var isRoot = !SUBJECTS[dir];
  var isIndex = filename === 'index.html' || filename === '';

  if (isIndex) return;
  if (isRoot) { renderSimpleNav(); return; }

  var subject = SUBJECTS[dir];
  if (!subject) return;

  var currentType = null;
  var currentSlug = null;
  for (var t = 0; t < ALL_TYPES.length; t++) {
    var suffix = '-' + ALL_TYPES[t] + '.html';
    if (filename.indexOf(suffix) !== -1) {
      currentType = ALL_TYPES[t];
      currentSlug = filename.replace(suffix, '');
      break;
    }
  }
  if (!currentType || !currentSlug) return;

  var chapterIndex = -1;
  for (var i = 0; i < subject.chapters.length; i++) {
    if (subject.chapters[i].slug === currentSlug) { chapterIndex = i; break; }
  }
  if (chapterIndex === -1) return;

  var chapter = subject.chapters[chapterIndex];
  var prev = chapterIndex > 0 ? subject.chapters[chapterIndex - 1] : null;
  var next = chapterIndex < subject.chapters.length - 1 ? subject.chapters[chapterIndex + 1] : null;

  // Build nav
  var nav = document.createElement('nav');
  nav.id = 'study-nav';

  var row = el('div', 'sn-row');

  // Home link
  row.appendChild(makeLink('../index.html', 'sn-home', '\u2302 Home'));

  // Chapter nav (prev / title / next)
  var chNav = el('div', 'sn-chapter-nav');
  if (prev) {
    chNav.appendChild(makeLink(prev.slug + '-' + currentType + '.html', 'sn-arrow', '\u2039 ' + chLabel(prev.slug), prev.title));
  } else {
    chNav.appendChild(el('span', 'sn-arrow sn-disabled', '\u2039'));
  }
  chNav.appendChild(el('span', 'sn-title', chapter.title));
  if (next) {
    chNav.appendChild(makeLink(next.slug + '-' + currentType + '.html', 'sn-arrow', chLabel(next.slug) + ' \u203a', next.title));
  } else {
    chNav.appendChild(el('span', 'sn-arrow sn-disabled', '\u203a'));
  }
  row.appendChild(chNav);

  // Type switcher (Notes / Cheatsheet / Quiz / Writing if available)
  var chapterTypes = chapter.types || DEFAULT_TYPES;
  var typesDiv = el('div', 'sn-types');
  for (var j = 0; j < chapterTypes.length; j++) {
    var tp = chapterTypes[j];
    var cls = 'sn-type' + (tp === currentType ? ' sn-active' : '');
    typesDiv.appendChild(makeLink(currentSlug + '-' + tp + '.html', cls, TYPE_LABELS[tp]));
  }
  row.appendChild(typesDiv);

  nav.appendChild(row);

  // Inject CSS
  injectCSS(subject.color);
  document.body.insertBefore(nav, document.body.firstChild);

  // --- Simple nav for root pages (flash-cards, word-roots) ---
  function renderSimpleNav() {
    var nav = document.createElement('nav');
    nav.id = 'study-nav';
    var row = el('div', 'sn-row');
    row.appendChild(makeLink('index.html', 'sn-home', '\u2302 Home'));
    var title = el('span', 'sn-title');
    title.style.flex = '1';
    title.style.textAlign = 'center';
    title.textContent = document.title.split(' \u2014 ')[0].split(' — ')[0];
    row.appendChild(title);
    nav.appendChild(row);
    injectCSS('#2c3e50');
    document.body.insertBefore(nav, document.body.firstChild);
  }

  function injectCSS(color) {
    var s = document.createElement('style');
    s.textContent =
      '#study-nav{position:sticky;top:0;z-index:1000;' +
      'background:linear-gradient(rgba(0,0,0,.32),rgba(0,0,0,.22)),' + color + ';' +
      'color:#fff;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;' +
      'font-size:13px;padding:0 16px;box-shadow:0 2px 8px rgba(0,0,0,.2);' +
      'margin-bottom:16px}' +
      '#study-nav *{box-sizing:border-box}' +
      '.sn-row{display:flex;align-items:center;gap:12px;max-width:900px;margin:0 auto;min-height:44px;flex-wrap:wrap;padding:6px 0}' +
      '.sn-home{color:#fff;text-decoration:none;font-weight:700;font-size:14px;white-space:nowrap;opacity:.9;padding:4px 10px;border-radius:6px}' +
      '.sn-home:hover{opacity:1;background:rgba(255,255,255,.15)}' +
      '.sn-chapter-nav{display:flex;align-items:center;gap:2px;flex:1;justify-content:center;min-width:0;' +
      'border-left:1px solid rgba(255,255,255,.25);border-right:1px solid rgba(255,255,255,.25);' +
      'margin:0 4px;padding:0 8px}' +
      '.sn-arrow{color:#fff;text-decoration:none;font-weight:600;font-size:12px;' +
      'padding:3px 10px;border-radius:20px;white-space:nowrap;' +
      'background:rgba(255,255,255,.13);letter-spacing:.2px}' +
      '.sn-arrow:hover:not(.sn-disabled){background:rgba(255,255,255,.25)}' +
      '.sn-disabled{opacity:.25;cursor:default;background:none!important}' +
      '.sn-title{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;' +
      'text-overflow:ellipsis;max-width:200px;text-align:center;padding:0 10px;letter-spacing:.3px}' +
      '.sn-types{display:flex;gap:4px}' +
      '.sn-type{color:#fff;text-decoration:none;padding:4px 12px;border-radius:6px;font-weight:600;font-size:12px;opacity:.7;white-space:nowrap}' +
      '.sn-type:hover{opacity:.9;background:rgba(255,255,255,.15)}' +
      '.sn-type.sn-active{opacity:1;background:rgba(255,255,255,.25)}' +
      '@media(max-width:600px){' +
        '.sn-row{justify-content:center;gap:6px;padding:8px 0}' +
        '.sn-chapter-nav{order:2;width:100%;justify-content:center;border-left:none;border-right:none;' +
        'border-top:1px solid rgba(255,255,255,.2);border-bottom:1px solid rgba(255,255,255,.2);' +
        'margin:2px 0;padding:4px 0}' +
        '.sn-home{order:1}.sn-types{order:3;width:100%;justify-content:center}' +
        '.sn-title{max-width:140px;font-size:13px}' +
      '}' +
      '@media print{#study-nav{display:none!important}}';
    document.head.appendChild(s);
  }
})();

// ============================================================
// Section Pagination — shows one section at a time on notes pages
// Hero, progress bar, and how-to always visible.
// Each "page" = one .section-header + its following .card(s).
// The .end-card is appended to the last page.
// Applets in the visible section auto-expand; hidden ones collapse.
// ============================================================
(function() {
  var path = window.location.pathname;
  var filename = path.split('/').pop() || '';
  if (filename.indexOf('-notes') === -1) return;

  var headers = document.querySelectorAll('.section-header');
  if (headers.length < 2) return; // single section — no pagination needed

  // Build pages: each page is an array of elements (section-header + cards until next header)
  var pages = [];
  for (var i = 0; i < headers.length; i++) {
    var group = [headers[i]];
    var next = headers[i].nextElementSibling;
    while (next && !next.classList.contains('section-header') && !next.classList.contains('end-card')) {
      group.push(next);
      next = next.nextElementSibling;
    }
    pages.push(group);
  }

  // Attach .end-card to the last page
  var endCard = document.querySelector('.end-card');
  if (endCard) {
    pages[pages.length - 1].push(endCard);
  }

  // Hide all pages initially
  for (var p = 0; p < pages.length; p++) {
    for (var e = 0; e < pages[p].length; e++) {
      pages[p][e].style.display = 'none';
    }
  }

  // Inject CSS
  var pagCss = document.createElement('style');
  pagCss.textContent =
    '.section-nav{max-width:700px;margin:24px auto;display:flex;align-items:center;' +
    'justify-content:space-between;gap:12px;font-family:inherit}' +
    '.section-nav-btn{background:#2c3e50;color:#fff;border:none;border-radius:24px;' +
    'padding:10px 22px;font-size:14px;font-weight:700;cursor:pointer;' +
    'font-family:inherit;transition:all .2s;min-width:100px}' +
    '.section-nav-btn:hover:not(:disabled){background:#1a252f;transform:translateY(-1px)}' +
    '.section-nav-btn:disabled{background:#ccc;cursor:default}' +
    '.section-nav-info{text-align:center;font-size:13px;color:#666;line-height:1.4}' +
    '.section-nav-info strong{display:block;font-size:15px;color:#2c3e50}' +
    '.section-dots{display:flex;gap:6px;justify-content:center;margin-top:6px}' +
    '.section-dot{width:10px;height:10px;border-radius:50%;background:#ddd;transition:background .2s}' +
    '.section-dot.active{background:#2c3e50}' +
    '.section-dot.done{background:#27ae60}' +
    '@media print{.section-nav{display:none!important}}';
  document.head.appendChild(pagCss);

  // Build top nav bar (after the .how-to or .progress-bar)
  function createNavBar(id) {
    var bar = document.createElement('div');
    bar.className = 'section-nav';
    bar.id = id;

    var prevBtn = document.createElement('button');
    prevBtn.className = 'section-nav-btn';
    prevBtn.textContent = 'Previous';
    bar.appendChild(prevBtn);

    var info = document.createElement('div');
    info.className = 'section-nav-info';
    var label = document.createElement('strong');
    info.appendChild(label);
    var dots = document.createElement('div');
    dots.className = 'section-dots';
    for (var d = 0; d < pages.length; d++) {
      var dot = document.createElement('span');
      dot.className = 'section-dot';
      dots.appendChild(dot);
    }
    info.appendChild(dots);
    bar.appendChild(info);

    var nextBtn = document.createElement('button');
    nextBtn.className = 'section-nav-btn';
    nextBtn.textContent = 'Next';
    bar.appendChild(nextBtn);

    return {bar: bar, prevBtn: prevBtn, nextBtn: nextBtn, label: label, dots: dots};
  }

  var topNav = createNavBar('section-nav-top');
  var bottomNav = createNavBar('section-nav-bottom');

  // Insert top nav after .how-to or .progress-bar (whichever is last before first section)
  var howTo = document.querySelector('.how-to');
  var insertAfter = howTo || document.querySelector('.progress-bar');
  if (insertAfter && insertAfter.nextSibling) {
    insertAfter.parentNode.insertBefore(topNav.bar, insertAfter.nextSibling);
  } else {
    // Fallback: insert before the first section header
    headers[0].parentNode.insertBefore(topNav.bar, headers[0]);
  }

  // Insert bottom nav after the last page element
  var lastPage = pages[pages.length - 1];
  var lastEl = lastPage[lastPage.length - 1];
  if (lastEl.nextSibling) {
    lastEl.parentNode.insertBefore(bottomNav.bar, lastEl.nextSibling);
  } else {
    lastEl.parentNode.appendChild(bottomNav.bar);
  }

  // Track current page
  var currentPage = 0;

  // Check which pages have at least one checkbox checked (for dot coloring)
  function getPageCompletionStatus() {
    var status = [];
    for (var p = 0; p < pages.length; p++) {
      var hasCheckbox = false;
      var allChecked = true;
      for (var e = 0; e < pages[p].length; e++) {
        var cbs = pages[p][e].querySelectorAll('input[type="checkbox"]');
        for (var c = 0; c < cbs.length; c++) {
          hasCheckbox = true;
          if (!cbs[c].checked) allChecked = false;
        }
      }
      status.push(hasCheckbox && allChecked);
    }
    return status;
  }

  function showPage(idx) {
    // Hide current page
    for (var e = 0; e < pages[currentPage].length; e++) {
      pages[currentPage][e].style.display = 'none';
      // Collapse applets on the page we're leaving
      var applets = pages[currentPage][e].querySelectorAll('.applet-wrap');
      for (var a = 0; a < applets.length; a++) {
        applets[a].classList.add('collapsed');
      }
    }

    currentPage = idx;

    // Show new page
    for (var e2 = 0; e2 < pages[currentPage].length; e2++) {
      pages[currentPage][e2].style.display = '';
      // Auto-expand applets on the visible page
      var applets2 = pages[currentPage][e2].querySelectorAll('.applet-wrap.collapsed');
      for (var a2 = 0; a2 < applets2.length; a2++) {
        // toggleApplet removes .collapsed AND lazy-loads the GeoGebra applet
        var header = applets2[a2].querySelector('.applet-header');
        if (header && typeof window.toggleApplet === 'function') {
          window.toggleApplet(header);
        } else {
          // Non-GeoGebra pages: just remove collapsed class
          applets2[a2].classList.remove('collapsed');
        }
      }
    }

    // Get section title from the header
    var headerEl = pages[currentPage][0];
    var title = headerEl.textContent.trim();
    // Strip the "Section X.X" prefix for cleaner display
    var numSpan = headerEl.querySelector('.num');
    if (numSpan) {
      title = title.replace(numSpan.textContent.trim(), '').trim();
    }

    // Update both nav bars
    var completion = getPageCompletionStatus();
    [topNav, bottomNav].forEach(function(nav) {
      nav.label.textContent = 'Section ' + (currentPage + 1) + ' of ' + pages.length;
      nav.prevBtn.disabled = currentPage === 0;
      nav.nextBtn.disabled = currentPage === pages.length - 1;
      nav.nextBtn.textContent = currentPage === pages.length - 1 ? 'Done!' : 'Next';
      var allDots = nav.dots.querySelectorAll('.section-dot');
      for (var d = 0; d < allDots.length; d++) {
        allDots[d].classList.toggle('active', d === currentPage);
        allDots[d].classList.toggle('done', completion[d] && d !== currentPage);
      }
    });

    // Scroll to top of content
    var scrollTarget = topNav.bar;
    scrollTarget.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  // Wire up both nav bars
  [topNav, bottomNav].forEach(function(nav) {
    nav.prevBtn.addEventListener('click', function() {
      if (currentPage > 0) {
        document.dispatchEvent(new Event('section-navigate'));
        showPage(currentPage - 1);
      }
    });
    nav.nextBtn.addEventListener('click', function() {
      if (currentPage < pages.length - 1) {
        document.dispatchEvent(new Event('section-navigate'));
        showPage(currentPage + 1);
      }
    });
  });

  // Update dot completion status when checkboxes change
  document.addEventListener('change', function(e) {
    if (e.target && e.target.type === 'checkbox') {
      var completion = getPageCompletionStatus();
      [topNav, bottomNav].forEach(function(nav) {
        var allDots = nav.dots.querySelectorAll('.section-dot');
        for (var d = 0; d < allDots.length; d++) {
          allDots[d].classList.toggle('done', completion[d] && d !== currentPage);
        }
      });
    }
  });

  // Show the first page
  showPage(0);
})();

// ============================================================
// Page View Tracking — logs a view after 30s on any subject page
// ============================================================
(function() {
  var SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzwQywmHmRgm9J3U-UjI6KXnmke5DCX1nplLgOAtPo81BGkWgy1jWLu1r08_N021Hv3/exec';
  var SHEETS_KEY = 'igcse-study-2026';
  var path = window.location.pathname;
  var filename = path.split('/').pop() || '';
  var parts = path.split('/').filter(function(p) { return p.length > 0; });
  var dir = parts[parts.length - 2] || '';
  var subjectMap = {biology:'Biology',chemistry:'Chemistry',physics:'Physics',english:'English',spanish:'Spanish',math:'Math'};
  var subject = subjectMap[dir];
  if (!subject) return;

  var pageMode = null;
  ['notes','cheatsheet','quiz','writing'].forEach(function(t) {
    if (filename.indexOf('-' + t) !== -1) pageMode = t;
  });
  if (!pageMode) return;

  // Chapter label matching quiz-challenge.js format: "Ch1 Travellers Tales"
  var slug = filename.replace(/-(notes|cheatsheet|quiz|writing)\.html$/, '');
  var chapter = slug.replace(/^ch0?(\d+)-/, 'Ch$1 ').replace(/-/g, ' ');
  chapter = chapter.replace(/\b\w/g, function(c) { return c.toUpperCase(); });

  // After 30 seconds on page, log a view event
  setTimeout(function() {
    var now = new Date();
    try {
      fetch(SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type': 'text/plain'},
        body: JSON.stringify({
          key: SHEETS_KEY,
          rows: [[
            now.toISOString().slice(0, 10),
            now.toTimeString().slice(0, 5),
            'page-view',
            subject,
            chapter,
            pageMode,
            '',
            'viewed',
            '',
            30
          ]]
        })
      }).catch(function() {});
    } catch(e) {}
  }, 30000);

  // --- Tab-Away Tracking ---
  // Logs when the student leaves the tab and how long they were gone.
  // Only logs absences > 5 seconds to filter accidental switches.
  var hiddenAt = null;

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      hiddenAt = Date.now();
    } else if (hiddenAt) {
      var awaySec = Math.round((Date.now() - hiddenAt) / 1000);
      hiddenAt = null;
      if (awaySec < 5) return; // ignore brief switches
      var now = new Date();
      try {
        fetch(SHEETS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {'Content-Type': 'text/plain'},
          body: JSON.stringify({
            key: SHEETS_KEY,
            rows: [[
              now.toISOString().slice(0, 10),
              now.toTimeString().slice(0, 5),
              'tab-away',
              subject,
              chapter,
              pageMode,
              '',
              'returned',
              '',
              awaySec
            ]]
          })
        }).catch(function() {});
      } catch(e) {}
    }
  });
})();

// ============================================================
// Quick Lookup — in-page dictionary so the student doesn't need
// to tab away. Logs every search to the Activity Log.
// ============================================================
(function() {
  var path = window.location.pathname;
  var filename = path.split('/').pop() || '';
  // Only on notes and quiz pages
  if (filename.indexOf('-notes') === -1 && filename.indexOf('-quiz') === -1) return;

  var SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzwQywmHmRgm9J3U-UjI6KXnmke5DCX1nplLgOAtPo81BGkWgy1jWLu1r08_N021Hv3/exec';
  var SHEETS_KEY = 'igcse-study-2026';
  var parts = path.split('/').filter(function(p) { return p.length > 0; });
  var dir = parts[parts.length - 2] || '';
  var subjectMap = {biology:'Biology',chemistry:'Chemistry',physics:'Physics',english:'English',spanish:'Spanish',math:'Math'};
  var subject = subjectMap[dir] || dir;
  var slug = filename.replace(/-(notes|cheatsheet|quiz|writing)\.html$/, '');
  var chapter = slug.replace(/^ch0?(\d+)-/, 'Ch$1 ').replace(/-/g, ' ');
  chapter = chapter.replace(/\b\w/g, function(c) { return c.toUpperCase(); });

  var css = document.createElement('style');
  css.textContent =
    '.lookup-toggle{position:fixed;bottom:20px;left:20px;z-index:998;' +
    'background:#2c3e50;color:#fff;border:none;border-radius:50%;width:44px;height:44px;' +
    'font-size:20px;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.25);' +
    'font-family:inherit;transition:all .2s;line-height:44px;text-align:center}' +
    '.lookup-toggle:hover{background:#1a252f;transform:translateY(-2px)}' +
    '.lookup-panel{position:fixed;bottom:74px;left:20px;z-index:998;' +
    'background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.2);' +
    'width:320px;max-height:400px;overflow:hidden;display:none;' +
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
    '.lookup-panel.open{display:block}' +
    '.lookup-input-wrap{display:flex;border-bottom:1px solid #eee;padding:8px}' +
    '.lookup-input{flex:1;border:1px solid #ddd;border-radius:8px;padding:8px 12px;' +
    'font-size:14px;font-family:inherit;outline:none}' +
    '.lookup-input:focus{border-color:#2c3e50}' +
    '.lookup-go{background:#2c3e50;color:#fff;border:none;border-radius:8px;' +
    'padding:8px 14px;margin-left:6px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}' +
    '.lookup-result{padding:12px;font-size:13px;line-height:1.5;max-height:320px;' +
    'overflow-y:auto;color:#333}' +
    '.lookup-result .word{font-size:16px;font-weight:700;margin-bottom:4px}' +
    '.lookup-result .pos{color:#666;font-style:italic;margin-top:8px}' +
    '.lookup-result .def{margin:2px 0 2px 12px}' +
    '.lookup-result .none{color:#999;font-style:italic}' +
    '@media print{.lookup-toggle,.lookup-panel{display:none!important}}';
  document.head.appendChild(css);

  var toggleBtn = document.createElement('button');
  toggleBtn.className = 'lookup-toggle';
  toggleBtn.textContent = '?';
  toggleBtn.title = 'Look up a word';
  document.body.appendChild(toggleBtn);

  var panel = document.createElement('div');
  panel.className = 'lookup-panel';

  var inputWrap = document.createElement('div');
  inputWrap.className = 'lookup-input-wrap';

  var input = document.createElement('input');
  input.className = 'lookup-input';
  input.type = 'text';
  input.placeholder = 'Look up a word...';
  inputWrap.appendChild(input);

  var goBtn = document.createElement('button');
  goBtn.className = 'lookup-go';
  goBtn.textContent = 'Go';
  inputWrap.appendChild(goBtn);

  panel.appendChild(inputWrap);

  var result = document.createElement('div');
  result.className = 'lookup-result';
  panel.appendChild(result);

  document.body.appendChild(panel);

  toggleBtn.addEventListener('click', function() {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      input.focus();
    }
  });

  function doLookup() {
    var word = input.value.trim().toLowerCase();
    if (!word) return;

    result.textContent = 'Looking up...';

    // Log the search to Activity Log
    var now = new Date();
    try {
      fetch(SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type': 'text/plain'},
        body: JSON.stringify({
          key: SHEETS_KEY,
          rows: [[
            now.toISOString().slice(0, 10),
            now.toTimeString().slice(0, 5),
            'lookup',
            subject,
            chapter,
            word,
            '',
            '',
            '',
            ''
          ]]
        })
      }).catch(function() {});
    } catch(e) {}

    // Fetch definition from free dictionary API
    fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        // Clear previous results
        while (result.firstChild) result.removeChild(result.firstChild);

        if (!Array.isArray(data) || data.length === 0) {
          var none = document.createElement('div');
          none.className = 'none';
          none.textContent = 'No definition found for "' + word + '"';
          result.appendChild(none);
          return;
        }

        var entry = data[0];
        var wordEl = document.createElement('div');
        wordEl.className = 'word';
        wordEl.textContent = entry.word || word;
        result.appendChild(wordEl);

        if (entry.phonetic) {
          var phonetic = document.createElement('div');
          phonetic.textContent = entry.phonetic;
          phonetic.style.color = '#888';
          phonetic.style.fontSize = '13px';
          result.appendChild(phonetic);
        }

        var meanings = entry.meanings || [];
        for (var m = 0; m < meanings.length && m < 3; m++) {
          var meaning = meanings[m];
          var pos = document.createElement('div');
          pos.className = 'pos';
          pos.textContent = meaning.partOfSpeech;
          result.appendChild(pos);

          var defs = meaning.definitions || [];
          for (var d = 0; d < defs.length && d < 2; d++) {
            var defEl = document.createElement('div');
            defEl.className = 'def';
            defEl.textContent = (d + 1) + '. ' + defs[d].definition;
            result.appendChild(defEl);
          }
        }
      })
      .catch(function() {
        result.textContent = 'Could not look up "' + word + '"';
      });
  }

  goBtn.addEventListener('click', doLookup);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLookup();
  });
})();

// ============================================================
// Page Save — auto-save for notes & writing pages
// localStorage persistence + per-exercise Google Sheets tracking
// ============================================================
(function() {
  var path = window.location.pathname;
  var filename = path.split('/').pop() || '';
  var isNotes = filename.indexOf('-notes') !== -1;
  var isWriting = filename.indexOf('-writing') !== -1;
  if (!isNotes && !isWriting) return;

  var SAVE_KEY = 'page-save-' + filename.replace('.html', '');
  var pageType = isWriting ? 'writing' : 'notes';
  var SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzwQywmHmRgm9J3U-UjI6KXnmke5DCX1nplLgOAtPo81BGkWgy1jWLu1r08_N021Hv3/exec';
  var SHEETS_KEY = 'igcse-study-2026';

  // Detect subject and chapter from path (format matches quiz-challenge.js)
  var parts = path.split('/').filter(function(p) { return p.length > 0; });
  var dir = parts[parts.length - 2] || '';
  var subjectMap = {biology:'Biology',chemistry:'Chemistry',physics:'Physics',english:'English',spanish:'Spanish',math:'Math'};
  var subject = subjectMap[dir] || dir;
  var slug = filename.replace(/-(notes|cheatsheet|quiz|writing)\.html$/, '');
  var chapter = slug.replace(/^ch0?(\d+)-/, 'Ch$1 ').replace(/-/g, ' ');
  chapter = chapter.replace(/\b\w/g, function(c) { return c.toUpperCase(); });

  // nav.js is the last script tag, so DOM is ready
  var textareas = document.querySelectorAll('textarea');
  var checkboxes = document.querySelectorAll('input[type="checkbox"]');
  if (textareas.length === 0 && checkboxes.length === 0) return;

  // --- Restore saved state from localStorage ---
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      var state = JSON.parse(raw);
      if (state.textareas) {
        textareas.forEach(function(ta, i) {
          if (state.textareas[i]) {
            ta.value = state.textareas[i];
            ta.dispatchEvent(new Event('input'));
          }
        });
      }
      if (state.checkboxes) {
        checkboxes.forEach(function(cb, i) {
          if (state.checkboxes[i] !== undefined && cb.checked !== state.checkboxes[i]) {
            cb.checked = state.checkboxes[i];
            cb.dispatchEvent(new Event('change'));
          }
        });
      }
    }
  } catch(e) {}

  // --- Auto-save to localStorage on change ---
  var timer;
  var pageDirty = false; // true when changes exist that haven't been Sheets-saved
  function saveToLocal() {
    var s = { textareas: [], checkboxes: [], saved: new Date().toISOString() };
    textareas.forEach(function(ta) { s.textareas.push(ta.value); });
    checkboxes.forEach(function(cb) { s.checkboxes.push(cb.checked); });
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch(e) {}
  }

  textareas.forEach(function(ta) {
    ta.addEventListener('input', function() {
      pageDirty = true;
      clearTimeout(timer);
      timer = setTimeout(saveToLocal, 1500);
    });
  });
  checkboxes.forEach(function(cb) {
    cb.addEventListener('change', function() {
      pageDirty = true;
      saveToLocal();
    });
  });

  // Warn before leaving with unsaved work
  window.addEventListener('beforeunload', function(e) {
    if (pageDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // --- Exercise label extraction ---
  // Writing pages: h2 inside parent .card
  // Notes pages: .section-header preceding parent .card
  function getWritingLabels() {
    var labelCounts = {};
    textareas.forEach(function(ta) {
      var card = ta.closest('.card');
      var h2 = card ? card.querySelector('h2') : null;
      var base = h2 ? h2.textContent.trim() : 'Textarea';
      labelCounts[base] = (labelCounts[base] || 0) + 1;
    });
    var seen = {};
    var labels = [];
    textareas.forEach(function(ta) {
      var card = ta.closest('.card');
      var h2 = card ? card.querySelector('h2') : null;
      var base = h2 ? h2.textContent.trim() : 'Textarea';
      seen[base] = (seen[base] || 0) + 1;
      labels.push(labelCounts[base] > 1 ? base + ' (' + seen[base] + ')' : base);
    });
    return labels;
  }

  function getNotesData(dateStr) {
    var sectionMap = {};
    var sectionOrder = [];
    checkboxes.forEach(function(cb) {
      var card = cb.closest('.card');
      var label = 'Progress';
      if (card) {
        var prev = card.previousElementSibling;
        while (prev) {
          if (prev.classList && prev.classList.contains('section-header')) {
            var numSpan = prev.querySelector('.num');
            var numText = numSpan ? numSpan.textContent.trim() : '';
            label = prev.textContent.trim();
            if (numText) label = label.replace(numText, '').trim();
            break;
          }
          prev = prev.previousElementSibling;
        }
      }
      if (!sectionMap[label]) { sectionMap[label] = {checked:0, total:0, items:[]}; sectionOrder.push(label); }
      sectionMap[label].total++;
      // Get the checkbox label text from its parent <li>
      var li = cb.closest('li');
      var itemText = li ? li.textContent.trim() : 'Item ' + (sectionMap[label].total);
      sectionMap[label].items.push((cb.checked ? '\u2705 ' : '\u2610 ') + itemText);
      if (cb.checked) sectionMap[label].checked++;
    });
    var exercises = [];
    sectionOrder.forEach(function(label) {
      var s = sectionMap[label];
      var detail = s.checked + '/' + s.total + ' checked\n' + s.items.join('\n');
      exercises.push([subject, chapter, label, 'notes', dateStr, detail]);
    });
    return exercises;
  }

  // Build structured checkbox items for the Checkbox Tracker sheet
  // Returns flat array of [subject, chapter, section, itemText, checked]
  function buildCheckboxItems() {
    var items = [];
    checkboxes.forEach(function(cb) {
      var card = cb.closest('.card');
      var section = 'Progress';
      if (card) {
        var prev = card.previousElementSibling;
        while (prev) {
          if (prev.classList && prev.classList.contains('section-header')) {
            var numSpan = prev.querySelector('.num');
            var numText = numSpan ? numSpan.textContent.trim() : '';
            section = prev.textContent.trim();
            if (numText) section = section.replace(numText, '').trim();
            break;
          }
          prev = prev.previousElementSibling;
        }
      }
      var li = cb.closest('li');
      var itemText = li ? li.textContent.trim() : 'Item';
      items.push([subject, chapter, section, itemText, cb.checked]);
    });
    return items;
  }

  // --- Build exercises array for Google Sheets ---
  function buildExercises(dateStr) {
    var exercises = [];

    if (isWriting) {
      var labels = getWritingLabels();
      textareas.forEach(function(ta, i) {
        var content = ta.value.trim();
        if (content.length > 0) {
          exercises.push([subject, chapter, labels[i], 'writing', dateStr, content]);
        }
      });
      // Writer's Checklist row (if checkboxes exist)
      if (checkboxes.length > 0) {
        var checked = 0;
        checkboxes.forEach(function(cb) { if (cb.checked) checked++; });
        exercises.push([subject, chapter, "Writer's Checklist", 'writing', dateStr,
          checked + '/' + checkboxes.length + ' checked']);
      }
    } else {
      exercises = getNotesData(dateStr);
    }

    return exercises;
  }

  // --- Save button + toast ---
  var css = document.createElement('style');
  css.textContent =
    '.page-save-btn{position:fixed;bottom:20px;right:20px;z-index:999;' +
    'background:#27ae60;color:#fff;border:none;border-radius:28px;' +
    'padding:12px 24px;font-size:14px;font-weight:700;font-family:inherit;' +
    'cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.25);transition:all .2s}' +
    '.page-save-btn:hover{transform:translateY(-2px);box-shadow:0 5px 16px rgba(0,0,0,.3)}' +
    '.page-save-btn:active{transform:translateY(0)}' +
    '.save-toast{position:fixed;bottom:72px;right:20px;z-index:999;' +
    'background:#2c3e50;color:#fff;padding:10px 20px;border-radius:8px;' +
    'font-size:13px;font-weight:600;font-family:inherit;opacity:0;' +
    'transition:opacity .3s;pointer-events:none}' +
    '.save-toast.show{opacity:1}' +
    '@media print{.page-save-btn,.save-toast{display:none!important}}';
  document.head.appendChild(css);

  var btn = document.createElement('button');
  btn.className = 'page-save-btn';
  btn.textContent = 'Save Progress';
  document.body.appendChild(btn);

  var toast = document.createElement('div');
  toast.className = 'save-toast';
  toast.textContent = 'Progress saved!';
  document.body.appendChild(toast);

  // Track whether we already saved to Sheets in this page load (session).
  // First save = new attempt. Subsequent saves = overwrite (same work session).
  var savedThisSession = false;

  // Core save logic — used by both button click and silent navigation saves
  function saveToSheets() {
    saveToLocal();
    var dateStr = new Date().toISOString().slice(0, 10);
    var exercises = buildExercises(dateStr);
    if (exercises.length > 0) {
      var payload = {key: SHEETS_KEY, target: 'progress', exercises: exercises};
      if (savedThisSession) {
        payload.overwrite = true;
      }
      if (isNotes) {
        payload.checkboxItems = buildCheckboxItems();
      }
      try {
        fetch(SHEETS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {'Content-Type': 'text/plain'},
          body: JSON.stringify(payload)
        }).catch(function() {});
      } catch(e) {}
      savedThisSession = true;
    }
    pageDirty = false;
  }

  btn.addEventListener('click', function() {
    saveToSheets();
    // Flash confirmation
    toast.classList.add('show');
    btn.textContent = 'Saved!';
    setTimeout(function() {
      toast.classList.remove('show');
      btn.textContent = 'Save Progress';
    }, 2000);
  });

  // Silent save when navigating between sections
  document.addEventListener('section-navigate', function() {
    if (pageDirty) {
      saveToSheets();
    }
  });

  // =====================================================
  // QR Code Photo Upload Section (notes pages only)
  // =====================================================
  if (isNotes && checkboxes.length > 0) {
    var uploadUrl = SHEETS_URL +
      '?subject=' + encodeURIComponent(subject) +
      '&chapter=' + encodeURIComponent(chapter);

    var qrCss = document.createElement('style');
    qrCss.textContent =
      '.qr-upload-section{max-width:700px;margin:40px auto 60px;padding:24px;' +
      'background:#f8f9fa;border:2px dashed #bbb;border-radius:16px;text-align:center}' +
      '.qr-upload-section h3{margin:0 0 8px;font-size:18px;color:#2c3e50}' +
      '.qr-upload-section p{margin:0 0 16px;font-size:14px;color:#555;line-height:1.5}' +
      '.qr-upload-section img{display:block;margin:0 auto 16px;border-radius:8px}' +
      '.qr-upload-link{display:inline-block;background:#e74c3c;color:#fff;' +
      'text-decoration:none;border-radius:24px;padding:12px 28px;font-size:15px;' +
      'font-weight:700;margin-bottom:16px;transition:all .2s}' +
      '.qr-upload-link:hover{background:#c0392b;transform:translateY(-1px)}' +
      '.qr-or{display:block;font-size:13px;color:#999;margin-bottom:12px}' +
      '.qr-done-btn{background:#27ae60;color:#fff;border:none;border-radius:24px;' +
      'padding:10px 24px;font-size:14px;font-weight:700;cursor:pointer;' +
      'font-family:inherit;transition:all .2s}' +
      '.qr-done-btn:hover{background:#219a52;transform:translateY(-1px)}' +
      '.qr-done-btn.confirmed{background:#95a5a6;cursor:default}' +
      '.qr-reminder{position:fixed;bottom:72px;left:20px;z-index:999;' +
      'background:#e74c3c;color:#fff;padding:10px 16px;border-radius:10px;' +
      'font-size:13px;font-weight:600;font-family:inherit;' +
      'box-shadow:0 3px 12px rgba(0,0,0,.25);opacity:0;transition:opacity .5s;' +
      'pointer-events:none;max-width:260px;line-height:1.4}' +
      '.qr-reminder.show{opacity:1}' +
      '@media print{.qr-upload-section,.qr-reminder{display:none!important}}';
    document.head.appendChild(qrCss);

    // Build QR section at bottom of page
    var qrSection = document.createElement('div');
    qrSection.className = 'qr-upload-section';

    var qrTitle = document.createElement('h3');
    qrTitle.textContent = 'Upload Your Handwritten Notes';
    qrSection.appendChild(qrTitle);

    var qrDesc = document.createElement('p');
    qrDesc.textContent = 'Take a photo of your notes and upload them.';
    qrSection.appendChild(qrDesc);

    // Always show direct upload link (works on same device)
    var uploadLink = document.createElement('a');
    uploadLink.className = 'qr-upload-link';
    uploadLink.href = uploadUrl;
    uploadLink.target = '_blank';
    uploadLink.textContent = 'Take Photo & Upload';
    qrSection.appendChild(uploadLink);

    // Also show QR code for scanning from a different device
    var qrOr = document.createElement('span');
    qrOr.className = 'qr-or';
    qrOr.textContent = 'or scan from another device:';
    qrSection.appendChild(qrOr);

    var qrImg = document.createElement('img');
    qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' +
      encodeURIComponent(uploadUrl);
    qrImg.alt = 'QR code — scan to upload notes photo';
    qrImg.width = 150;
    qrImg.height = 150;
    qrSection.appendChild(qrImg);

    var qrDoneBtn = document.createElement('button');
    qrDoneBtn.className = 'qr-done-btn';
    qrDoneBtn.textContent = "I've uploaded my notes";
    qrSection.appendChild(qrDoneBtn);

    document.body.appendChild(qrSection);

    // Floating reminder bubble (fades in, then auto-fades after 5s)
    var qrReminder = document.createElement('div');
    qrReminder.className = 'qr-reminder';
    qrReminder.textContent = "Don't forget to photograph your handwritten notes!";
    document.body.appendChild(qrReminder);

    // State tracking
    var photoUploaded = false;
    var anyChecked = false;
    var checkCount = 0;        // counts checkbox checks (not unchecks)
    var reminderTimer = null;

    qrDoneBtn.addEventListener('click', function() {
      photoUploaded = true;
      qrDoneBtn.textContent = 'Uploaded!';
      qrDoneBtn.classList.add('confirmed');
      qrReminder.classList.remove('show');
    });

    // Flash reminder for 5 seconds, then fade out
    function flashReminder() {
      if (photoUploaded) return;
      qrReminder.classList.add('show');
      clearTimeout(reminderTimer);
      reminderTimer = setTimeout(function() {
        qrReminder.classList.remove('show');
      }, 5000);
    }

    // Show reminder every 4th checkbox check (not on every one)
    checkboxes.forEach(function(cb) {
      cb.addEventListener('change', function() {
        // Track anyChecked for beforeunload
        anyChecked = false;
        for (var i = 0; i < checkboxes.length; i++) {
          if (checkboxes[i].checked) { anyChecked = true; break; }
        }
        // Only count newly checked boxes (not unchecks)
        if (cb.checked) {
          checkCount++;
          if (checkCount % 4 === 0) {
            flashReminder();
          }
        }
      });
    });

    // Enhance beforeunload to also warn about un-uploaded photo
    window.addEventListener('beforeunload', function(e) {
      if (anyChecked && !photoUploaded) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }
})();
