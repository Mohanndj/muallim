'use strict';
// «مساعد المعلم» (الإصدار ٤، بشكل «كشوف» وطريقته للاستعمال الشخصي): الحالة والحفظ والأدوات المشتركة والإطار.
// كل شيء في هذا الجوال فقط (localStorage)؛ لا يُرسل شيء إلا رسائل واتساب التي يرسلها المعلم بنفسه.

const APP_VERSION = 9;
const KEY = 'muallim-v1';
const $ = (id) => document.getElementById(id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => iso(new Date());
const parseD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const dateLabel = (s) => { const d = parseD(s); return `${AR_DAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]}`; };
const latin = (s) => String(s ?? '').replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x660).replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x6f0);
const num = (s) => { const t = latin(s).replace(/[٫,]/g, '.').replace(/[^\d.\-]/g, ''); return t === '' || t === '.' || t === '-' ? null : Number(t); };
// الأرقام كما في كشوف: 1.0 و 0.5- (الرقم بنقطة عشرية واحدة)
const fmt1 = (n) => `${Math.abs(n).toFixed(1)}${n < 0 ? '-' : ''}`;
const fmtScore = (n) => { const r = Math.round(n * 10) / 10; return `${Number.isInteger(r) ? Math.abs(r) : Math.abs(r).toFixed(1)}${r < 0 ? '-' : ''}`; };

// ---- الأيقونات: من مكتبة Font Awesome (fa.js)، والأسماء القصيرة هنا تدل عليها ----
const ALIAS = {
  x: 'xmark', back: 'chevron-right', next: 'chevron-left', more: 'ellipsis', search: 'magnifying-glass', home: 'house',
  follow: 'clipboard-check', doc: 'file-lines', tools: 'screwdriver-wrench', file: 'file-excel', edit: 'pen', down: 'download', up: 'upload',
  send: 'paper-plane', undo: 'rotate-left', book: 'book-open-reader', timer: 'stopwatch',
  // أسماء الإصدار ٤ للتقييمات (محفوظة في بيانات المعلم)
  headok: 'microphone', headx: 'person-walking-arrow-right', trophyx: 'person-falling-burst', bookok: 'book-open', bookx: 'file-circle-xmark',
  zz: 'bed', talk: 'comments', faceangry: 'face-angry', faceflat: 'face-meh', bookoff: 'book', cap: 'graduation-cap', alert: 'circle-exclamation',
  docminus: 'book-quran', eyeoff: 'eye-slash', cup: 'utensils', userok: 'user-tie', xcircle: 'circle-xmark',
};
const faName = (n) => (FA[n] ? n : FA[ALIAS[n]] ? ALIAS[n] : '');
const ic = (n, cls = '') => { const f = FA[faName(n)]; return f ? `<svg class="ic${cls ? ` ${cls}` : ''}" viewBox="0 0 ${f[0]} 512" aria-hidden="true"><path d="${f[1]}"/></svg>` : ''; };
// صورة الطالب: الدائرة الزرقاء بصورة الشخص
const AVATAR = `<svg class="avatar" viewBox="0 0 ${FA['circle-user'][0]} 512" aria-hidden="true"><path fill="var(--blue)" d="${FA['circle-user'][1]}"/></svg>`;

// التقييمات كما رتّبها المعلم في كشوف (الدرجة لكل مرة)، ويعدّلها من الإعدادات
const EVAL_DEFAULT = [
  ['part', 'مشاركة', 'check', '#5fcf80', 1], ['wrong', 'خطأ', 'xmark', '#ee4d6a', -1],
  ['recite', 'سمّع', 'microphone', '#4fcdb6', 2], ['out', 'خروج بلا استئذان', 'person-walking-arrow-right', '#ef7366', -2],
  ['chaos', 'الوقوف أو اللعب داخل الفصل أو إثارة فوضى', 'person-falling-burst', '#e8457f', -1], ['beh', 'مميز سلوكيًا', 'star', '#f2b45a', 2],
  ['hw', 'حل الواجب', 'book-open', '#4cbf74', 0.5], ['nohw', 'لم يحل الواجب', 'file-circle-xmark', '#e9506b', -0.5],
  ['sleep', 'النوم في الحصة', 'bed', '#3f8ee6', -0.5], ['talk', 'التحدث أثناء حديث المعلم إليهم', 'comments', '#7a40e0', -1],
  ['naughty', 'مشاغب', 'face-angry', '#8dd0f2', -2], ['words', 'ألفاظ سيئة أو تلفظ على زميله', 'face-meh', '#f08a3c', -1],
  ['nobook', 'نسيان الكتاب', 'book', '#f2b46a', -0.5], ['hifz', 'سمع', 'graduation-cap', '#8ef05a', 5],
  ['midhifz', 'متوسط الحفظ', 'circle-exclamation', '#9fd3df', 2.5], ['nomushaf', 'نسى المصحف', 'book-quran', '#ec4d63', 0],
  ['noread', 'لا يعرف القراءة', 'eye-slash', '#ef4e66', -1], ['eat', 'الأكل داخل الصف', 'utensils', '#ec4d6c', -1],
  ['neat', 'الأناقة الشخصية', 'user-tie', '#efd36a', 1], ['damage', 'العبث بممتلكات الحكومة', 'circle-xmark', '#1f3f7a', 0],
];
const EVAL_GLYPHS = ['check', 'xmark', 'microphone', 'person-walking-arrow-right', 'person-falling-burst', 'star', 'book-open', 'file-circle-xmark', 'bed', 'comments', 'face-angry', 'face-meh', 'face-smile', 'book', 'graduation-cap', 'circle-exclamation', 'book-quran', 'eye-slash', 'utensils', 'user-tie', 'circle-xmark', 'hand', 'thumbs-up', 'thumbs-down', 'heart', 'lightbulb', 'brain', 'medal', 'award', 'trophy', 'mobile-screen', 'pencil', 'clock', 'bolt', 'mosque', 'children'];
const EVAL_COLORS = ['#5fcf80', '#4cbf74', '#4fcdb6', '#8ef05a', '#3f8ee6', '#8dd0f2', '#9fd3df', '#7a40e0', '#f2b45a', '#efd36a', '#f2b46a', '#f08a3c', '#ef7366', '#ee4d6a', '#e8457f', '#1f3f7a'];
// حالات الحضور السبع
const ATT = [
  ['p', 'حاضر', 'user-check', '#66c470'], ['a', 'غائب', 'user-xmark', '#ef4b5f'], ['x', 'مستأذن', 'person-circle-exclamation', '#3b82f6'], ['l', 'متأخر', 'clock', '#f2a03c'],
  ['r', 'عن بعد', 'desktop', '#8e3bbf'], ['e', 'غائب بعذر', 'file-medical', '#4b4fb8'], ['h', 'هارب', 'person-running', '#111'],
];
const attInfo = (v) => ATT.find((a) => a[0] === v) || ATT[0];
// أعمال السنة: خمسة بنود، لكل منها درجة كاملة
const YW_DEFAULT = [['act', 'الأنشطة', 20], ['test', 'الاختبارات', 20], ['proj', 'البحوث والمشاريع', 20], ['part', 'المشاركة', 20], ['hw', 'الواجبات', 20]];

let T;
// يقرأ بيانات الإصدارات السابقة كما هي: ما لا يستعمله هذا الإصدار يبقى محفوظاً فيها
function normalize(d) {
  d = d && typeof d === 'object' ? d : {};
  const arr = (x) => (Array.isArray(x) ? x : []);
  const st = d.settings || {};
  const evals = arr(d.evals).filter((e) => e && e.k && e.name).map((e) => ({ k: String(e.k), name: String(e.name), g: faName(e.g) ? e.g : 'check', c: String(e.c || '#5fcf80'), w: Number(e.w) || 0 }));
  return {
    ...d,
    settings: { ...st, teacher: String(st.teacher || ''), subject: String(st.subject || 'الدراسات الإسلامية'), school: String(st.school || '') },
    evals: evals.length ? evals : EVAL_DEFAULT.map(([k, name, g, c, w]) => ({ k, name, g, c, w })),
    yw: arr(d.yw).length ? d.yw : YW_DEFAULT.map(([k, name, max]) => ({ k, name, max })),
    classes: arr(d.classes).filter((c) => c && c.id).map((c) => ({ id: c.id, name: String(c.name || '') })),
    students: arr(d.students).filter((s) => s && s.id).map((s) => ({ id: s.id, cls: s.cls || '', name: String(s.name || ''), parent: String(s.parent || ''), phone: String(s.phone || '') })),
    // تقييم: الأيقونة (k) واسمها ودرجتها وقت التسجيل
    beh: arr(d.beh).filter((b) => b && b.id && b.sid).map((b) => ({ id: b.id, sid: b.sid, d: b.d || today(), at: b.at || Date.now(), icon: String(b.icon || ''), reason: String(b.reason || ''), w: typeof b.w === 'number' ? b.w : b.kind === 'neg' ? -1 : 1 })),
    // الحضور: لكل فصل ولكل يوم: حالة من لم يكن حاضراً (الباقون حاضرون)
    att: d.att && typeof d.att === 'object' ? d.att : {},
    // درجات أعمال السنة: marksYW[sid][k]
    marksYW: d.marksYW && typeof d.marksYW === 'object' ? d.marksYW : {},
    groups: arr(d.groups).filter((g) => g && g.id && g.cls).map((g) => ({ id: g.id, cls: g.cls, name: String(g.name || ''), color: Number(g.color) || 0, members: arr(g.members).map(String) })),
    notes: d.notes && typeof d.notes === 'object' ? d.notes : {},
  };
}
function load() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEY)); } catch { d = null; }
  T = normalize(d);
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(T)); } catch { toast('تعذّر الحفظ: مساحة المتصفح ممتلئة'); }
}

// ---- البحث ----
const clsOf = (id) => T.classes.find((c) => c.id === id);
const stuOf = (id) => T.students.find((s) => s.id === id);
const studentsIn = (cid) => T.students.filter((s) => s.cls === cid).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
const shortName = (s) => s.name.trim().split(/\s+/).slice(0, 2).join(' ');
const behOf = (sid) => T.beh.filter((b) => b.sid === sid);
const evalOf = (k) => T.evals.find((e) => e.k === k);
const scoreOf = (sid) => behOf(sid).reduce((n, b) => n + b.w, 0);
const attOf = (s, d = today()) => ((T.att[s.cls] || {})[d] || {})[s.id] || 'p';
const attCount = (s, v) => Object.values(T.att[s.cls] || {}).filter((day) => day[s.id] === v).length;
function setAtt(s, v, d = today()) {
  T.att[s.cls] = T.att[s.cls] || {};
  const day = (T.att[s.cls][d] = T.att[s.cls][d] || {});
  if (v === 'p') delete day[s.id]; else day[s.id] = v;
}
// مستوى الفصل: متوسط درجات أعمال السنة المرصودة
function classLevel(cid) {
  let got = 0, max = 0;
  for (const s of studentsIn(cid)) for (const y of T.yw) { const v = (T.marksYW[s.id] || {})[y.k]; if (typeof v === 'number') { got += v; max += y.max; } }
  return max ? Math.round((got / max) * 100) : 0;
}

// ---- أرقام الجوال ----
function normPhone(s) {
  let p = latin(s).replace(/[^\d+]/g, '').replace(/^\+/, '').replace(/^00/, '');
  if (/^05\d{8}$/.test(p)) p = `966${p.slice(1)}`;
  else if (/^5\d{8}$/.test(p)) p = `966${p}`;
  return p;
}
const phoneOk = (p) => /^\d{9,15}$/.test(p || '');
const waLink = (phone, text) => `https://wa.me/${phone || ''}?text=${encodeURIComponent(text)}`;

// ---- الإطار: العنوان يحدد الصفحة، وزر الرجوع في أندرويد يرجع خطوة ----
const Views = {};
let UI = { view: 'home', cls: '', tab: 'follow', std: '', ex: '', exCls: '', les: '', q: '', date: today() };
let curHash = '';
function route() {
  const h = location.hash.slice(1);
  const m = h.match(/^c\/([^/]+)(?:\/(\w+))?$/);
  const p = h.match(/^port(?:\/(\w+))?$/), x = h.match(/^exams(?:\/(\w+))?(?:\/(\w+))?$/), pr = h.match(/^prep(?:\/(\w+))?$/);
  if (m && clsOf(m[1])) { UI.view = 'class'; UI.cls = m[1]; UI.tab = m[2] || 'follow'; } else if (p) { UI.view = 'port'; UI.std = p[1] || ''; } else if (x) { UI.view = 'exams'; UI.ex = x[1] || ''; UI.exCls = x[2] || ''; } else if (pr) { UI.view = 'prep'; UI.les = pr[1] || ''; } else if (h === 'settings') UI.view = 'settings'; else UI.view = 'home';
  curHash = location.hash;
}
function go(hash, replace = false) {
  if (location.hash !== hash) history[replace ? 'replaceState' : 'pushState'](null, '', hash);
  route();
  window.scrollTo(0, 0);
  render();
  enter();
}
// دخول الصفحة الجديدة بحركة خفيفة (عند الانتقال فقط، لا عند كل تحديث)
function enter() { const m = $('main'); m.classList.remove('enter'); void m.offsetWidth; m.classList.add('enter'); }
function render() {
  const y = window.scrollY;
  const a = document.activeElement;
  const keep = a && a.id && a.tagName === 'INPUT' ? [a.id, a.selectionStart] : null;
  $('main').innerHTML = (Views[UI.view] || Views.home)();
  $('dock').innerHTML = dockHTML();
  window.scrollTo(0, y);
  if (keep && $(keep[0])) { $(keep[0]).focus({ preventScroll: true }); try { $(keep[0]).setSelectionRange(keep[1], keep[1]); } catch { /* fine */ } }
}
// شريط الأسفل العائم: في الرئيسية الفصول والتحضير والاختبارات وملف الإنجاز والإعدادات، وداخل الفصل أقسامه الأربعة
function dockHTML() {
  const items = UI.view === 'class'
    ? [['follow', 'المتابعة', 'follow'], ['att', 'حاضر', 'hand'], ['yw', 'أعمال السنة', 'doc'], ['tools', 'الأدوات الخاصة', 'tools']].map(([k, n, i]) => [`#c/${UI.cls}/${k}`, n, i, UI.tab === k])
    : [['#home', 'الفصول', 'home', UI.view === 'home'], ['#prep', 'التحضير', 'calendar-check', UI.view === 'prep'], ['#exams', 'الاختبارات', 'file-pen', UI.view === 'exams'], ['#port', 'ملف الإنجاز', 'folder-open', UI.view === 'port'], ['#settings', 'الإعدادات', 'gear', UI.view === 'settings']];
  return `<nav class="dock">${items.map(([h, n, i, on]) => `<button type="button" class="${on ? 'on' : ''}" data-act="dock" data-h="${h}"><span>${ic(i)}</span>${n}</button>`).join('')}</nav>`;
}
window.addEventListener('popstate', () => {
  if (!$('sheet').hidden) { closeSheet(); history.pushState(null, '', curHash); return; }
  route(); render();
});

// ---- النافذة ----
let sheetRefresh = null;
function openSheet(html, refresh = null, cls = '') {
  sheetRefresh = refresh;
  $('sheet').className = `sheet ${cls}`;
  $('sheetBody').innerHTML = html;
  $('sheet').hidden = false;
  document.body.classList.add('locked');
}
function closeSheet() {
  $('sheet').hidden = true;
  document.body.classList.remove('locked');
  $('sheetBody').innerHTML = '';
  sheetRefresh = null;
  if (typeof onSheetClose === 'function') onSheetClose();
}
function refresh() {
  render();
  if (!$('sheet').hidden && sheetRefresh) {
    const y = $('sheetBody').scrollTop;
    $('sheetBody').innerHTML = sheetRefresh();
    $('sheetBody').scrollTop = y;
  }
}
let toastTimer;
function toast(msg, undo) {
  const t = $('toast');
  t.innerHTML = `<span>${esc(msg)}</span>${undo ? `<button type="button" data-act="undo">${ic('undo')} تراجع</button>` : ''}`;
  t.hidden = false;
  toast.undo = undo || null;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; toast.undo = null; }, undo ? 5000 : 2600);
}
function armed(btn) {
  if (btn.dataset.armed) return true;
  btn.dataset.armed = '1';
  const old = btn.innerHTML;
  btn.textContent = 'متأكد؟ اضغط مرة أخرى';
  btn.classList.add('danger-on');
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.innerHTML = old; btn.classList.remove('danger-on'); } }, 4000);
  return false;
}
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}

const Acts = {
  dock: (el) => go(el.dataset.h, UI.view === 'class' && el.dataset.h.startsWith(`#c/${UI.cls}`)),
  go: (el) => { closeSheet(); go(el.dataset.h); },
  back: () => { if (UI.view === 'class') go('#home'); else history.back(); },
  'close-sheet': () => closeSheet(),
  undo: () => { const u = toast.undo; $('toast').hidden = true; toast.undo = null; if (u) u(); },
};
const Inputs = {};
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const f = Acts[el.dataset.act];
  if (f) { e.preventDefault(); f(el, e); }
});
document.addEventListener('input', (e) => {
  const el = e.target.closest('[data-input]');
  if (el && Inputs[el.dataset.input]) Inputs[el.dataset.input](el, e);
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-submit]');
  if (!f) return;
  e.preventDefault();
  Acts[f.dataset.submit](f, e);
});

function start() {
  load();
  const h0 = location.hash;
  if (!history.state || !history.state.base) { history.replaceState({ base: 1 }, '', '#'); history.pushState(null, '', h0 && h0 !== '#' ? h0 : '#home'); }
  route();
  render();
  enter();
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) closeSheet(); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
