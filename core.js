'use strict';
// «مساعد المعلم» (الإصدار ٣، على طريقة «كشوف»): الحالة والحفظ والأدوات المشتركة والإطار والنافذة.
// كل شيء في هذا الجوال فقط (localStorage)؛ لا يُرسل شيء إلا رسائل واتساب التي يرسلها المعلم بنفسه.

const APP_VERSION = 3;
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
const hijri = (s = today()) => { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(parseD(s)); } catch { return ''; } };
// أرقام عربية؛ والنقطة العشرية «٫» (النقطة تشبه الصفر العربي)
const ar = (s) => String(s ?? '').replace(/(\d)\.(\d)/g, '$1٫$2').replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const latin = (s) => String(s ?? '').replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x660).replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x6f0);
const plural = (n, one, two, few, many) => (n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? `${ar(n)} ${few}` : `${ar(n)} ${many}`);
// رقم كبير وحده: «صفر» لا «٠» (يشبه نقطة)
const bigNum = (n) => (n === 0 ? 'صفر' : n);

// ---- الأيقونات ----
const ICONS = {
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7',
  x: 'M6 6l12 12M18 6 6 18',
  back: 'M9 6l6 6-6 6',
  next: 'M15 6l-6 6 6 6',
  gear: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  users: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  att: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  dice: 'M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  groups: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  file: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13l4 5M13 13l-4 5',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  down: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  up: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  send: 'M21 3 10 14M21 3l-7 18-4-7-7-4z',
  undo: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
  sort: 'M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 7v5l3 2',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  // أيقونات التقييم
  hand: 'M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4a1.5 1.5 0 0 1 3 0v6.5M14 10.5V5.5a1.5 1.5 0 0 1 3 0V12M17 9.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1.5a6 6 0 0 1-4.8-2.4L3.4 16a1.5 1.5 0 0 1 2.3-1.9L8 16.5',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  bookok: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM9 10l2 2 4-4',
  quran: 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  chat: 'M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20.5l1.4-5.1A8.5 8.5 0 1 1 21 11.5z',
  bookx: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM10 7.5l4 4M14 7.5l-4 4',
  bookoff: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM3 3l18 18',
  eyeoff: 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.7 9.7 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 5.4-1.6',
  noise: 'M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
};
const ic = (n, cls = '') => `<svg class="ic${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n] || ''}"/></svg>`;

// أيقونات التقييم العشر: خمس إيجابية وخمس سلبية
const EVALS = [
  { k: 'part', kind: 'pos', name: 'مشاركة', icon: 'hand', c: '#16a34a' },
  { k: 'ans', kind: 'pos', name: 'إجابة متميزة', icon: 'star', c: '#e0a100' },
  { k: 'hw', kind: 'pos', name: 'حل الواجب', icon: 'bookok', c: '#2563eb' },
  { k: 'hifz', kind: 'pos', name: 'حفظ متقن', icon: 'quran', c: '#0d9488' },
  { k: 'disc', kind: 'pos', name: 'انضباط', icon: 'shield', c: '#7c3aed' },
  { k: 'talk', kind: 'neg', name: 'حديث جانبي', icon: 'chat', c: '#ea580c' },
  { k: 'nohw', kind: 'neg', name: 'لم يحل الواجب', icon: 'bookx', c: '#dc2626' },
  { k: 'nobook', kind: 'neg', name: 'بدون كتاب', icon: 'bookoff', c: '#b45309' },
  { k: 'inatt', kind: 'neg', name: 'عدم انتباه', icon: 'eyeoff', c: '#9333ea' },
  { k: 'noise', kind: 'neg', name: 'إزعاج', icon: 'noise', c: '#be123c' },
];
const evalOf = (k) => EVALS.find((e) => e.k === k);

let T;
// يقرأ بيانات الإصدارات السابقة كما هي: ما لا يستعمله هذا الإصدار يبقى محفوظاً فيها
function normalize(d) {
  d = d && typeof d === 'object' ? d : {};
  const arr = (x) => (Array.isArray(x) ? x : []);
  const st = d.settings || {};
  return {
    ...d,
    settings: { ...st, teacher: String(st.teacher || ''), subject: String(st.subject || 'الدراسات الإسلامية'), school: String(st.school || ''), sort: st.sort === 'stars' ? 'stars' : 'alpha' },
    classes: arr(d.classes).filter((c) => c && c.id).map((c) => ({ id: c.id, name: String(c.name || '') })),
    students: arr(d.students).filter((s) => s && s.id).map((s) => ({ id: s.id, cls: s.cls || '', name: String(s.name || ''), parent: String(s.parent || ''), phone: String(s.phone || '') })),
    // ملاحظة قديمة بلا أيقونة تأخذ أيقونة سببها إن طابق، وإلا تبقى بنصها
    beh: arr(d.beh).filter((b) => b && b.id && b.sid).map((b) => {
      const kind = b.kind === 'neg' ? 'neg' : 'pos';
      const e = evalOf(b.icon) || EVALS.find((x) => x.name === b.reason);
      return { id: b.id, sid: b.sid, d: b.d || today(), at: b.at || Date.now(), kind: e ? e.kind : kind, icon: e ? e.k : '', reason: e ? e.name : String(b.reason || ''), note: String(b.note || '') };
    }),
    // التحضير: لكل فصل ولكل يوم حُضِّر فيه: من غاب (a) ومن تأخر (l)؛ والباقون حاضرون
    att: d.att && typeof d.att === 'object' ? d.att : {},
    groups: arr(d.groups).filter((g) => g && g.id && g.cls).map((g) => ({ id: g.id, cls: g.cls, name: String(g.name || ''), color: Number(g.color) || 0, members: arr(g.members).map(String) })),
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
const studentsIn = (cid) => T.students.filter((s) => s.cls === cid);
const firstName = (s) => s.name.trim().split(/\s+/)[0] || s.name;
const shortName = (s) => s.name.trim().split(/\s+/).slice(0, 2).join(' ');
const behOf = (sid) => T.beh.filter((b) => b.sid === sid);
const dayAtt = (cid, d = today()) => (T.att[cid] && T.att[cid][d]) || null;
// حالة الطالب في يوم حُضِّر فيه: p حاضر، a غائب، l متأخر؛ و null إن لم يُحضَّر الفصل ذلك اليوم
const attOf = (s, d = today()) => { const day = dayAtt(s.cls, d); return day ? day[s.id] || 'p' : null; };
const attCount = (s, v) => Object.values(T.att[s.cls] || {}).filter((day) => day[s.id] === v).length;
// أول حرف من الاسم والعائلة (بلا «ال»)، بلون ثابت للطالب
const AV_COLORS = ['#0f766e', '#2563eb', '#b45309', '#7c3aed', '#be123c', '#047857', '#4d7c0f', '#c2410c'];
function avatar(s, cls = '') {
  const w = s.name.trim().split(/\s+/);
  const last = w.length > 1 ? w[w.length - 1].replace(/^ال(?=..)/, '') : '';
  let h = 0; for (const ch of s.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `<span class="av ${cls}" style="--av:${AV_COLORS[h % AV_COLORS.length]}">${esc((w[0] || '').charAt(0) + last.charAt(0))}</span>`;
}

// ---- أرقام الجوال: 05… تصير 9665… لواتساب ----
function normPhone(s) {
  let p = latin(s).replace(/[^\d+]/g, '').replace(/^\+/, '').replace(/^00/, '');
  if (/^05\d{8}$/.test(p)) p = `966${p.slice(1)}`;
  else if (/^5\d{8}$/.test(p)) p = `966${p}`;
  return p;
}
const phoneOk = (p) => /^\d{9,15}$/.test(p || '');
const waLink = (phone, text) => `https://wa.me/${phone || ''}?text=${encodeURIComponent(text)}`;

// ---- الإطار: صفحتان وإعدادات، وزر الرجوع في أندرويد يرجع خطوة ----
const Views = {};
let UI = { view: 'home', cls: '' };
let curHash = '';
function route() {
  const h = location.hash.slice(1);
  const m = h.match(/^c\/(.+)$/);
  if (m && clsOf(m[1])) { UI.view = 'class'; UI.cls = m[1]; } else if (h === 'settings') UI.view = 'settings'; else UI.view = 'home';
  curHash = location.hash;
}
function go(hash) {
  if (location.hash !== hash) history.pushState(null, '', hash || '#home');
  route();
  window.scrollTo(0, 0);
  render();
}
function render() {
  const y = window.scrollY;
  $('main').innerHTML = (Views[UI.view] || Views.home)();
  arDigits($('main'));
  window.scrollTo(0, y);
}
function arDigits(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest('textarea,script,style,.latin') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  for (let n = w.nextNode(); n; n = w.nextNode()) if (/\d/.test(n.nodeValue)) n.nodeValue = ar(n.nodeValue);
}
window.addEventListener('popstate', () => {
  // الرجوع والنافذة مفتوحة يغلقها ويبقى في الصفحة نفسها
  if (!$('sheet').hidden) { closeSheet(); history.pushState(null, '', curHash); return; }
  route(); render();
});

// ---- النافذة المنزلقة ----
let sheetRefresh = null; // ما يعيد رسم النافذة المفتوحة بعد تغيّر البيانات
function openSheet(html, refresh = null) {
  sheetRefresh = refresh;
  $('sheetBody').innerHTML = html;
  arDigits($('sheetBody'));
  $('sheet').hidden = false;
  document.body.classList.add('locked');
}
function closeSheet() {
  $('sheet').hidden = true;
  document.body.classList.remove('locked');
  $('sheetBody').innerHTML = '';
  sheetRefresh = null;
}
// يعيد رسم الصفحة والنافذة المفتوحة (بموضع التمرير نفسه)
function refresh() {
  render();
  if (!$('sheet').hidden && sheetRefresh) {
    const y = $('sheetBody').scrollTop;
    $('sheetBody').innerHTML = sheetRefresh();
    arDigits($('sheetBody'));
    $('sheetBody').scrollTop = y;
  }
}

let toastTimer;
function toast(msg, undo) {
  const t = $('toast');
  t.innerHTML = `<span>${esc(ar(msg))}</span>${undo ? `<button type="button" data-act="undo">${ic('undo')} تراجع</button>` : ''}`;
  t.hidden = false;
  toast.undo = undo || null;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; toast.undo = null; }, undo ? 5000 : 2600);
}
// الحذف بضغطتين: الأولى تجعل الزر «متأكد؟»
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

// ---- الأفعال: كل زر يحمل data-act ----
const Acts = {
  go: (el) => { closeSheet(); go(el.dataset.h); },
  back: () => history.back(),
  'close-sheet': () => closeSheet(),
  undo: () => { const u = toast.undo; $('toast').hidden = true; toast.undo = null; if (u) u(); },
};
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const f = Acts[el.dataset.act];
  if (f) { e.preventDefault(); f(el, e); }
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-submit]');
  if (!f) return;
  e.preventDefault();
  Acts[f.dataset.submit](f, e);
});

function start() {
  load();
  // مدخل أول في السجل حتى لا يخرج زر الرجوع من التطبيق والنافذة مفتوحة
  const h0 = location.hash;
  if (!history.state || !history.state.base) { history.replaceState({ base: 1 }, '', '#'); history.pushState(null, '', h0 && h0 !== '#' ? h0 : '#home'); }
  route();
  render();
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) closeSheet(); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
