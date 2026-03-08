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
        {slug:'ch01-travellers-tales', title:"Travellers' Tales"},
        {slug:'ch02-world-of-nature', title:'World of Nature'},
        {slug:'ch03-points-of-view', title:'Points of View'},
        {slug:'ch04-all-the-world', title:'All the World'},
        {slug:'ch05-family-friends', title:'Family & Friends'},
        {slug:'ch06-material-world', title:'Material World'},
        {slug:'ch07-believe-it-or-not', title:'Believe It or Not'},
        {slug:'ch08-world-famous', title:'World Famous'},
        {slug:'ch09-endings', title:'Endings'}
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

  var TYPES = ['notes', 'cheatsheet', 'quiz'];
  var TYPE_LABELS = {notes: 'Notes', cheatsheet: 'Cheatsheet', quiz: 'Quiz'};

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
  for (var t = 0; t < TYPES.length; t++) {
    var suffix = '-' + TYPES[t] + '.html';
    if (filename.indexOf(suffix) !== -1) {
      currentType = TYPES[t];
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

  // Type switcher (Notes / Cheatsheet / Quiz)
  var typesDiv = el('div', 'sn-types');
  for (var j = 0; j < TYPES.length; j++) {
    var tp = TYPES[j];
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
      '#study-nav{position:sticky;top:0;z-index:1000;background:' + color + ';' +
      'color:#fff;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;' +
      'font-size:13px;padding:0 12px;box-shadow:0 2px 8px rgba(0,0,0,.15)}' +
      '#study-nav *{box-sizing:border-box}' +
      '.sn-row{display:flex;align-items:center;gap:8px;max-width:900px;margin:0 auto;min-height:40px;flex-wrap:wrap;padding:6px 0}' +
      '.sn-home{color:#fff;text-decoration:none;font-weight:700;font-size:14px;white-space:nowrap;opacity:.9;padding:4px 8px;border-radius:6px}' +
      '.sn-home:hover{opacity:1;background:rgba(255,255,255,.15)}' +
      '.sn-chapter-nav{display:flex;align-items:center;gap:4px;flex:1;justify-content:center;min-width:0}' +
      '.sn-arrow{color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:4px 8px;border-radius:6px;white-space:nowrap}' +
      '.sn-arrow:hover:not(.sn-disabled){background:rgba(255,255,255,.15)}' +
      '.sn-disabled{opacity:.3;cursor:default}' +
      '.sn-title{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;text-align:center}' +
      '.sn-types{display:flex;gap:2px}' +
      '.sn-type{color:#fff;text-decoration:none;padding:4px 12px;border-radius:6px;font-weight:600;font-size:12px;opacity:.7;white-space:nowrap}' +
      '.sn-type:hover{opacity:.9;background:rgba(255,255,255,.15)}' +
      '.sn-type.sn-active{opacity:1;background:rgba(255,255,255,.25)}' +
      '@media(max-width:600px){' +
        '.sn-row{justify-content:center;gap:4px;padding:8px 0}' +
        '.sn-chapter-nav{order:2;width:100%;justify-content:center}' +
        '.sn-home{order:1}.sn-types{order:3;width:100%;justify-content:center}' +
        '.sn-title{max-width:140px;font-size:13px}' +
      '}' +
      '@media print{#study-nav{display:none!important}}';
    document.head.appendChild(s);
  }
})();
