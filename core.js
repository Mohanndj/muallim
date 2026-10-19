'use strict';
// «مساعد المعلم» (الإصدار ٤، بشكل «كشوف» وطريقته للاستعمال الشخصي): الحالة والحفظ والأدوات المشتركة والإطار.
// كل شيء في هذا الجوال فقط (localStorage)؛ لا يُرسل شيء إلا رسائل واتساب التي يرسلها المعلم بنفسه.

const APP_VERSION = 4;
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

// ---- رسوم الأيقونات (خط أبيض داخل دائرة ملونة) ----
const G = {
  plus: 'M12 5v14M5 12h14', check: 'M5 12.5l4.5 4.5L19 7', x: 'M6 6l12 12M18 6 6 18', back: 'M9 6l6 6-6 6', next: 'M15 6l-6 6 6 6',
  more: 'M5 12h.01M12 12h.01M19 12h.01', search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  home: 'M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19zM9.5 15.5c1.4 1.3 3.6 1.3 5 0',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  follow: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 14l2 2 4-4',
  hand: 'M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4a1.5 1.5 0 0 1 3 0v6.5M14 10.5V5.5a1.5 1.5 0 0 1 3 0V12M17 9.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1.5a6 6 0 0 1-4.8-2.4L3.4 16a1.5 1.5 0 0 1 2.3-1.9L8 16.5',
  doc: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 12h6M9 15.5h6M9 9h2',
  tools: 'M4 20l6-6M14 10l6-6M4 4l16 16M7 3l4 4-4 4-4-4zM17 13l4 4-4 4-4-4z',
  print: 'M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M6 14h12v7H6z',
  file: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13l4 5M13 13l-4 5',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4', trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  down: 'M12 4v11M7 10l5 5 5-5M5 20h14', up: 'M12 20V9M7 14l5-5 5 5M5 4h14', send: 'M21 3 10 14M21 3l-7 18-4-7-7-4z',
  undo: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3', bolt: 'M13 2 4 14h7l-1 8 9-12h-7z', book: 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z',
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM4 21a8 8 0 0 1 16 0', users: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  timer: 'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 10v4l2.5 2.5M9 2h6',
  // التقييم
  headok: 'M14.5 21v-3h2a2 2 0 0 0 2-2v-2.5l2-.8-2-3.7A7 7 0 1 0 6 15v6M9.5 9.5l1.6 1.6 3-3',
  headx: 'M14.5 21v-3h2a2 2 0 0 0 2-2v-2.5l2-.8-2-3.7A7 7 0 1 0 6 15v6M10 7.5l3.5 3.5M13.5 7.5 10 11',
  trophyx: 'M8 21h8M12 16v5M6 3h12v5a6 6 0 0 1-12 0zM10 6l4 4M14 6l-4 4',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  bookok: 'M2 5h6a4 4 0 0 1 4 3 4 4 0 0 1 4-3h6v14h-6a4 4 0 0 0-4 3 4 4 0 0 0-4-3H2zM14 11.5l1.5 1.5 3-3',
  bookx: 'M2 5h6a4 4 0 0 1 4 3 4 4 0 0 1 4-3h6v14h-6a4 4 0 0 0-4 3 4 4 0 0 0-4-3H2zM14.5 9.5l3 3M17.5 9.5l-3 3',
  zz: 'M4 11h5l-5 6h5M13 5h6l-6 7h6',
  talk: 'M7 20v-1a3 3 0 0 1 3-3M17 20v-1a3 3 0 0 0-3-3M8.5 13a2 2 0 1 0 0-4M15.5 13a2 2 0 1 0 0-4M9 2h9a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-4l-3 2V9H9z',
  faceangry: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 9l2 1M16 9l-2 1M9 16c2-1.5 4-1.5 6 0',
  faceflat: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 10h.01M15 10h.01M9 15.5h6',
  bookoff: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM9 7l7 7',
  cap: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6',
  alert: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v6M12 16.5h.01',
  docminus: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM9 14h6',
  eyeoff: 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.7 9.7 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 5.4-1.6',
  cup: 'M7 3h10l-.8 6.5a4.2 4.2 0 0 1-8.4 0zM12 14v7M8.5 21h7',
  userok: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 13-3.5M16 11l2 2 4-4',
  xcircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 9l6 6M15 9l-6 6',
  // الحضور
  ucheck: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 11l2 2 4-4',
  ux: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 8l4 4M21 8l-4 4',
  uexcl: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M20 6v5M20 14h.01',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  remote: 'M3 4h18v12H3zM8 20h8M12 16v4M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9 14a3 3 0 0 1 6 0',
  run: 'M14 5a1.6 1.6 0 1 0 0-.01M10 21l2.5-6 3 3V21M7 12l3-3.5 4 1 2.5 3 3 .5M10.5 8.5 8.5 14',
};
const ic = (n, cls = '') => `<svg class="ic${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="${G[n] || ''}"/></svg>`;
// صورة الطالب: الصورة الزرقاء العامة
const AVATAR = '<svg class="avatar" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="var(--blue)"/><circle cx="50" cy="50" r="44" fill="#fff"/><path fill="var(--blue)" d="M50 18c-10 0-17 8-17 18 0 6 2 11 5 14-1 3-3 6-7 7-10 3-17 9-17 9a44 44 0 0 0 72 0s-7-6-17-9c-4-1-6-4-7-7 3-3 5-8 5-14 0-10-7-18-17-18z"/></svg>';

// التقييمات كما رتّبها المعلم في كشوف (الدرجة لكل مرة)، ويعدّلها من الإعدادات
const EVAL_DEFAULT = [
  ['part', 'مشاركة', 'check', '#5fcf80', 1], ['wrong', 'خطأ', 'x', '#ee4d6a', -1],
  ['recite', 'سمّع', 'headok', '#4fcdb6', 2], ['out', 'خروج بلا استئذان', 'headx', '#ef7366', -2],
  ['chaos', 'الوقوف أو اللعب داخل الفصل أو إثارة فوضى', 'trophyx', '#e8457f', -1], ['beh', 'مميز سلوكيًا', 'star', '#f2b45a', 2],
  ['hw', 'حل الواجب', 'bookok', '#4cbf74', 0.5], ['nohw', 'لم يحل الواجب', 'bookx', '#e9506b', -0.5],
  ['sleep', 'النوم في الحصة', 'zz', '#3f8ee6', -0.5], ['talk', 'التحدث أثناء حديث المعلم إليهم', 'talk', '#7a40e0', -1],
  ['naughty', 'مشاغب', 'faceangry', '#8dd0f2', -2], ['words', 'ألفاظ سيئة أو تلفظ على زميله', 'faceflat', '#f08a3c', -1],
  ['nobook', 'نسيان الكتاب', 'bookoff', '#f2b46a', -0.5], ['hifz', 'سمع', 'cap', '#8ef05a', 5],
  ['midhifz', 'متوسط الحفظ', 'alert', '#9fd3df', 2.5], ['nomushaf', 'نسى المصحف', 'docminus', '#ec4d63', 0],
  ['noread', 'لا يعرف القراءة', 'eyeoff', '#ef4e66', -1], ['eat', 'الأكل داخل الصف', 'cup', '#ec4d6c', -1],
  ['neat', 'الأناقة الشخصية', 'userok', '#efd36a', 1], ['damage', 'العبث بممتلكات الحكومة', 'xcircle', '#1f3f7a', 0],
];
const EVAL_GLYPHS = ['check', 'x', 'headok', 'headx', 'trophyx', 'star', 'bookok', 'bookx', 'zz', 'talk', 'faceangry', 'faceflat', 'bookoff', 'cap', 'alert', 'docminus', 'eyeoff', 'cup', 'userok', 'xcircle', 'hand', 'clock', 'bolt', 'book'];
const EVAL_COLORS = ['#5fcf80', '#4cbf74', '#4fcdb6', '#8ef05a', '#3f8ee6', '#8dd0f2', '#9fd3df', '#7a40e0', '#f2b45a', '#efd36a', '#f2b46a', '#f08a3c', '#ef7366', '#ee4d6a', '#e8457f', '#1f3f7a'];
// حالات الحضور السبع
const ATT = [
  ['p', 'حاضر', 'ucheck', '#66c470'], ['a', 'غائب', 'ux', '#ef4b5f'], ['x', 'مستأذن', 'uexcl', '#3b82f6'], ['l', 'متأخر', 'clock', '#f2a03c'],
  ['r', 'عن بعد', 'remote', '#8e3bbf'], ['e', 'غائب بعذر', 'ux', '#4b4fb8'], ['h', 'هارب', 'run', '#111'],
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
  const evals = arr(d.evals).filter((e) => e && e.k && e.name).map((e) => ({ k: String(e.k), name: String(e.name), g: G[e.g] ? e.g : 'check', c: String(e.c || '#5fcf80'), w: Number(e.w) || 0 }));
  return {
    ...d,
    settings: { ...st, teacher: String(st.teacher || ''), subject: String(st.subject || 'الدراسات الإسلامية') },
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
let UI = { view: 'home', cls: '', tab: 'follow', q: '', date: today() };
let curHash = '';
function route() {
  const h = location.hash.slice(1);
  const m = h.match(/^c\/([^/]+)(?:\/(\w+))?$/);
  if (m && clsOf(m[1])) { UI.view = 'class'; UI.cls = m[1]; UI.tab = m[2] || 'follow'; } else if (h === 'settings') UI.view = 'settings'; else UI.view = 'home';
  curHash = location.hash;
}
function go(hash, replace = false) {
  if (location.hash !== hash) history[replace ? 'replaceState' : 'pushState'](null, '', hash);
  route();
  window.scrollTo(0, 0);
  render();
}
function render() {
  const y = window.scrollY;
  const a = document.activeElement;
  const keep = a && a.id && a.tagName === 'INPUT' ? [a.id, a.selectionStart] : null;
  $('main').innerHTML = (Views[UI.view] || Views.home)();
  $('dock').innerHTML = dockHTML();
  window.scrollTo(0, y);
  if (keep && $(keep[0])) { $(keep[0]).focus({ preventScroll: true }); try { $(keep[0]).setSelectionRange(keep[1], keep[1]); } catch { /* fine */ } }
}
// شريط الأسفل العائم: في الرئيسية الفصول والإعدادات، وداخل الفصل أقسامه الأربعة
function dockHTML() {
  const items = UI.view === 'class'
    ? [['follow', 'المتابعة', 'follow'], ['att', 'حاضر', 'hand'], ['yw', 'أعمال السنة', 'doc'], ['tools', 'الأدوات الخاصة', 'tools']].map(([k, n, i]) => [`#c/${UI.cls}/${k}`, n, i, UI.tab === k])
    : [['#home', 'الفصول', 'home', UI.view === 'home'], ['#settings', 'الإعدادات', 'gear', UI.view === 'settings']];
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
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) closeSheet(); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
