'use strict';
// «مساعد المعلم»: the state, saving, shared helpers, icons, levels, the page frame and the sheet.
// Everything stays in this browser (localStorage); nothing is sent anywhere except the WhatsApp
// messages the teacher sends himself.

const APP_VERSION = 2;
const KEY = 'muallim-v1';
const $ = (id) => document.getElementById(id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => iso(new Date());
const parseD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return iso(d); };
// the school week starts on Sunday
const weekStart = (s = today()) => addDays(s, -parseD(s).getDay());
const monthStart = (s = today()) => `${s.slice(0, 8)}01`;
const EVER = '0000-00-00';
const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const dateLabel = (s) => { const d = parseD(s); return `${AR_DAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]}`; };
const hijri = (s = today()) => { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(parseD(s)); } catch { return ''; } };

// Arabic digits on screen and in messages; the decimal point becomes «٫» (a dot looks like the Arabic zero)
const ar = (s) => String(s ?? '').replace(/(\d)\.(\d)/g, '$1٫$2').replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const latin = (s) => String(s ?? '').replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x660).replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x6f0);
const num = (s) => { const t = latin(s).replace(/[٫,]/g, '.').replace(/[^\d.\-]/g, ''); return t === '' || t === '.' ? null : Number(t); };
const bigNum = (n) => (n === 0 ? 'صفر' : n);
const round1 = (n) => Math.round(n * 10) / 10;
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const plural = (n, one, two, few, many) => (n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? `${ar(n)} ${few}` : `${ar(n)} ${many}`);

// ---- line icons (one set everywhere) ----
const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  chart: 'M4 20h16M7 16v-5M12 16V6M17 16v-8',
  quiz: 'M9 3h6v3H9zM8 4.5H6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1h-2M9 14l2 2 4-4',
  chat: 'M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20.5l1.4-5.1A8.5 8.5 0 1 1 21 11.5z',
  users: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  gear: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  screen: 'M3 4h18v12H3zM8 20h8M12 16v4',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7',
  x: 'M6 6l12 12M18 6 6 18',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  down: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  up: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  file: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13l4 5M13 13l-4 5',
  print: 'M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M6 14h12v7H6z',
  dice: 'M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  timer: 'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 10v4l2.5 2.5M9 2h6',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5.5h3v1.5a3 3 0 0 1-3 3M7 5.5H4v1.5a3 3 0 0 0 3 3',
  flag: 'M5 21V4M5 4h12l-2.5 4.5L17 13H5',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  send: 'M21 3 10 14M21 3l-7 18-4-7-7-4z',
  link: 'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  medal: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14 7 22l5-3 5 3-1.5-8',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  next: 'M15 6l-6 6 6 6',
  prev: 'M9 6l6 6-6 6',
  play: 'M7 4.5v15l12.5-7.5z',
  pause: 'M7 4h3.5v16H7zM13.5 4H17v16h-3.5z',
  reset: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  undo: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
  minus: 'M5 12h14',
  back: 'M9 6l6 6-6 6',
  sound: 'M4 9h4l5-4v14l-5-4H4zM16.5 9a4 4 0 0 1 0 6M19.5 6a8 8 0 0 1 0 12',
};
const ic = (n, cls = '') => `<svg class="ic${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n] || ''}"/></svg>`;

// ---- levels: every positive note is a point; the total in the term gives the student's level ----
const LEVELS = [
  { min: 0, name: 'بداية', tier: 0 },
  { min: 5, name: 'مثابر', tier: 1 },
  { min: 15, name: 'متقن', tier: 2 },
  { min: 30, name: 'متميز', tier: 3 },
  { min: 50, name: 'قدوة', tier: 4 },
  { min: 80, name: 'نخبة', tier: 5 },
];
const levelOf = (n) => LEVELS.reduce((l, x) => (n >= x.min ? x : l), LEVELS[0]);
const nextLevel = (n) => LEVELS.find((x) => x.min > n) || null;
const levelBadge = (n, big = false) => { const l = levelOf(n); return l.tier ? `<span class="lvl t${l.tier}${big ? ' lvl-lg' : ''}">${ic('medal')}${l.name}</span>` : ''; };
// initials in a coloured circle, the same colour for the same student everywhere
const AV_COLORS = ['#0e7a55', '#2563eb', '#b45309', '#7c3aed', '#be123c', '#0f766e', '#4d7c0f', '#c2410c'];
function avatar(s, cls = '') {
  // the first name and the family name, without its «ال» (الزهراني → ز)
  const w = s.name.trim().split(/\s+/);
  const last = w.length > 1 ? w[w.length - 1].replace(/^ال(?=..)/, '') : '';
  const ini = (w[0] || '').charAt(0) + last.charAt(0);
  let h = 0; for (const ch of s.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `<span class="av ${cls}" style="--av:${AV_COLORS[h % AV_COLORS.length]}">${esc(ini)}</span>`;
}

const DEFAULT_REASONS = {
  pos: ['مشاركة متميزة', 'إجابة صحيحة', 'حل الواجب', 'حفظ متقن', 'تعاون مع زملائه', 'انضباط وهدوء', 'إحضار الكتاب'],
  neg: ['حديث جانبي', 'لم يحل الواجب', 'لم يحضر الكتاب', 'تأخر عن الحصة', 'عدم الانتباه', 'نوم في الحصة', 'إزعاج زملائه'],
};
const DEFAULT_SKILLS = ['التوحيد', 'الحديث والسيرة', 'الفقه والسلوك', 'التفسير'];
const DEFAULT_TPLS = [
  { id: 'weekly', name: 'تقرير السلوك', text: 'السلام عليكم ورحمة الله وبركاته\nولي أمر الطالب {الطالب} حفظه الله\nهذا ملخص {الفترة} لابنكم {الاسم} في مادة {المادة}:\n{ملخص_السلوك}\nشاكرين تعاونكم.\n{المعلم}' },
  { id: 'praise', name: 'ثناء وشكر', text: 'السلام عليكم ورحمة الله وبركاته\nولي أمر الطالب {الطالب} حفظه الله\nيسرّني إبلاغكم بتميّز ابنكم {الاسم} في مادة {المادة}:\n{الإيجابيات}\nبارك الله فيه وجزاكم خيراً على حسن تربيته.\n{المعلم}' },
  { id: 'warn', name: 'تنبيه سلوكي', text: 'السلام عليكم ورحمة الله وبركاته\nولي أمر الطالب {الطالب} حفظه الله\nنودّ إطلاعكم على ملاحظات {الفترة} على ابنكم {الاسم} في مادة {المادة}:\n{السلبيات}\nنأمل متابعته وتوجيهه، وثقتنا بكم كبيرة.\n{المعلم}' },
  { id: 'grades', name: 'الدرجات', text: 'السلام عليكم ورحمة الله وبركاته\nولي أمر الطالب {الطالب} حفظه الله\nدرجات ابنكم {الاسم} في مادة {المادة}:\n{الدرجات}\nالمجموع: {المجموع}\n{المعلم}' },
  { id: 'notice', name: 'إعلان', text: 'السلام عليكم ورحمة الله وبركاته\nولي أمر الطالب {الطالب} حفظه الله\n{نص}\n{المعلم}' },
];

let T;
function normalize(d) {
  d = d && typeof d === 'object' ? d : {};
  const arr = (x) => (Array.isArray(x) ? x : []);
  const st = d.settings || {};
  const classes = arr(d.classes).filter((c) => c && c.id).map((c) => ({ id: c.id, name: String(c.name || ''), ...(c.demo ? { demo: true } : {}) }));
  return {
    settings: {
      teacher: String(st.teacher || ''), school: String(st.school || ''), subject: String(st.subject || 'الدراسات الإسلامية'),
      phone: String(st.phone || ''), negAlert: Number(st.negAlert) > 0 ? Number(st.negAlert) : 3, pass: Number(st.pass) > 0 ? Number(st.pass) : 60,
      showAns: st.showAns !== false,
      // a teacher from version 1 already has classes: no welcome for him
      onboarded: !!st.onboarded || classes.length > 0, screenTried: !!st.screenTried, hideSetup: !!st.hideSetup,
    },
    classes,
    students: arr(d.students).filter((s) => s && s.id).map((s) => ({ id: s.id, cls: s.cls || '', name: String(s.name || ''), parent: String(s.parent || ''), phone: String(s.phone || '') })),
    beh: arr(d.beh).filter((b) => b && b.id && b.sid).map((b) => ({ id: b.id, sid: b.sid, d: b.d || today(), at: b.at || Date.now(), kind: b.kind === 'neg' ? 'neg' : 'pos', reason: String(b.reason || ''), note: String(b.note || '') })),
    reasons: { pos: arr(d.reasons && d.reasons.pos).length ? d.reasons.pos.map(String) : [...DEFAULT_REASONS.pos], neg: arr(d.reasons && d.reasons.neg).length ? d.reasons.neg.map(String) : [...DEFAULT_REASONS.neg] },
    skills: arr(d.skills).length ? d.skills.map(String) : [...DEFAULT_SKILLS],
    tpls: arr(d.tpls).length ? d.tpls.filter((t) => t && t.id).map((t) => ({ id: t.id, name: String(t.name || ''), text: String(t.text || '') })) : DEFAULT_TPLS.map((t) => ({ ...t })),
    sent: arr(d.sent).filter((x) => x && x.sid).map((x) => ({ id: x.id || uid(), sid: x.sid, at: x.at || Date.now(), tpl: String(x.tpl || ''), name: String(x.name || '') })),
    queue: d.queue && Array.isArray(d.queue.list) ? d.queue : null,
    items: arr(d.items).filter((i) => i && i.id).map((i) => ({ id: i.id, cls: i.cls || '', title: String(i.title || ''), max: Number(i.max) > 0 ? Number(i.max) : 10, skill: String(i.skill || ''), d: i.d || today(), quiz: i.quiz || '' })),
    marks: d.marks && typeof d.marks === 'object' ? d.marks : {},
    quizzes: arr(d.quizzes).filter((q) => q && q.id).map((q) => ({ id: q.id, title: String(q.title || ''), skill: String(q.skill || ''), qs: arr(q.qs), at: q.at || Date.now(), ...(q.demo ? { demo: true } : {}) })),
    // the class split into teams for the classroom screen; bonus = points given to the whole team
    groups: arr(d.groups).filter((g) => g && g.id && g.cls).map((g) => ({ id: g.id, cls: g.cls, name: String(g.name || ''), color: Number(g.color) || 0, members: arr(g.members).map(String), bonus: arr(g.bonus).filter((b) => b && b.at).map((b) => ({ at: b.at, d: b.d || today() })) })),
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

// ---- lookups ----
const clsOf = (id) => T.classes.find((c) => c.id === id);
const stuOf = (id) => T.students.find((s) => s.id === id);
const studentsIn = (cid) => T.students.filter((s) => s.cls === cid);
const firstName = (s) => (s.name.trim().split(/\s+/)[0] || s.name);
const shortName = (s) => s.name.trim().split(/\s+/).slice(0, 2).join(' ');
// a student's points: his positive notes from a day on
const points = (sid, from = EVER) => T.beh.reduce((n, b) => n + (b.sid === sid && b.kind === 'pos' && b.d >= from ? 1 : 0), 0);
// the class picked is the same on every page
let UI = { cls: '', tab: 'home' };
function curCls() {
  if (!clsOf(UI.cls)) UI.cls = T.classes[0] ? T.classes[0].id : '';
  return UI.cls;
}
function classChips(act = 'pick-cls') {
  if (T.classes.length < 2) return '';
  const c = curCls();
  return `<div class="chips cls-chips">${T.classes.map((k) => `<button type="button" class="chip${k.id === c ? ' on' : ''}" data-act="${act}" data-id="${k.id}">${esc(k.name)} <small>${ar(studentsIn(k.id).length)}</small></button>`).join('')}</div>`;
}
const noClasses = () => `<div class="empty-state">${ic('users', 'big')}<h3>لا توجد فصول بعد</h3><p>ابدأ بإضافة فصلك وطلابه، ويعمل كل شيء بعدها.</p><button type="button" class="primary" data-act="go" data-tab="students">${ic('plus')} أضف فصلك وطلابك</button></div>`;
// every page starts the same way: its name, one line saying what it is for, and its main buttons
const pageHead = (title, sub, extra = '') => `<div class="phead"><div class="phead-t"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${extra ? `<div class="phead-x">${extra}</div>` : ''}</div>`;

// ---- phone numbers: Saudi numbers written 05… become 9665… for WhatsApp ----
function normPhone(s) {
  let p = latin(s).replace(/[^\d+]/g, '').replace(/^\+/, '').replace(/^00/, '');
  if (/^05\d{8}$/.test(p)) p = `966${p.slice(1)}`;
  else if (/^5\d{8}$/.test(p)) p = `966${p}`;
  return p;
}
const phoneOk = (p) => /^\d{9,15}$/.test(p || '');

// ---- frame ----
const TABS = [
  ['home', 'الرئيسية', 'home'],
  ['behavior', 'السلوك', 'star'],
  ['grades', 'الدرجات', 'chart'],
  ['quizzes', 'الاختبارات', 'quiz'],
  ['messages', 'الرسائل', 'chat'],
];
const Views = {};
const Hooks = []; // run after every render (the classroom screen redraws with the data)
function render() {
  const y = window.scrollY;
  const tab = Views[UI.tab] ? UI.tab : 'home';
  UI.tab = tab;
  const navOn = TABS.some(([k]) => k === tab) ? tab : 'home';
  $('nav').innerHTML = TABS.map(([k, n, i]) => `<button type="button" class="${k === navOn ? 'on' : ''}" data-act="go" data-tab="${k}">${ic(i)}<span>${n}</span></button>`).join('');
  $('topDate').textContent = `${dateLabel(today())} | ${hijri()}`;
  $('main').innerHTML = Views[tab]();
  arDigits($('main'));
  window.scrollTo(0, y);
  for (const h of Hooks) h();
}
// digits in text become Arabic; inputs, links and anything marked .latin keep theirs
function arDigits(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest('textarea,script,style,.latin') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  for (let n = w.nextNode(); n; n = w.nextNode()) if (/\d/.test(n.nodeValue)) n.nodeValue = ar(n.nodeValue);
}
function go(tab) {
  UI.tab = tab;
  if (location.hash !== `#${tab}`) history.replaceState(null, '', `#${tab}`);
  window.scrollTo(0, 0);
  render();
}

// ---- the sheet (a panel that slides up) ----
function openSheet(html, wide = false) {
  $('sheetBody').innerHTML = html;
  arDigits($('sheetBody'));
  $('sheet').hidden = false;
  $('sheet').classList.toggle('wide', wide);
  document.body.classList.add('locked');
  $('sheetBody').scrollTop = 0;
}
function closeSheet() {
  $('sheet').hidden = true;
  if (!document.body.classList.contains('stage-on')) document.body.classList.remove('locked');
  $('sheetBody').innerHTML = '';
}

let toastTimer;
function toast(msg, undo) {
  const t = $('toast');
  t.innerHTML = `<span>${esc(ar(msg))}</span>${undo ? `<button type="button" data-act="undo">${ic('undo')} تراجع</button>` : ''}`;
  t.hidden = false;
  toast.undo = undo || null;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; toast.undo = null; }, undo ? 6000 : 3000);
}

// two presses to delete: the first turns the button into «متأكد؟» for a few seconds
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
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast('نُسخ'); } catch {
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('نُسخ'); } catch { toast('تعذّر النسخ'); }
    ta.remove();
  }
}
// a page printed from a new window, with the app's fonts (tests, certificates)
function printPage(title, css, body) {
  const w = window.open('', '_blank');
  if (!w) { toast('اسمح للتطبيق بفتح نافذة جديدة'); return; }
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Readex+Pro:wght@400;600;700&family=Amiri:wght@400;700&display=swap">
    <style>*{box-sizing:border-box}body{font-family:"IBM Plex Sans Arabic",Tahoma,sans-serif;color:#111;margin:0}${css}</style></head><body>${body}</body></html>`);
  w.document.close();
  arDigits(w.document.body);
  const print = () => setTimeout(() => w.print(), 300);
  if (w.document.fonts && w.document.fonts.ready) w.document.fonts.ready.then(print); else print();
}

// ---- actions: every button carries data-act; each page adds its own handlers here ----
const Acts = {
  go: (el) => { closeSheet(); go(el.dataset.tab); },
  'pick-cls': (el) => { UI.cls = el.dataset.id; render(); },
  'close-sheet': () => closeSheet(),
  undo: () => { const u = toast.undo; $('toast').hidden = true; toast.undo = null; if (u) u(); },
};
const Changes = {}; // data-change handlers for inputs (fired on change)
const Inputs = {}; // data-input handlers (fired while typing)

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const f = Acts[el.dataset.act];
  if (f) { e.preventDefault(); f(el, e); }
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (el && Changes[el.dataset.change]) Changes[el.dataset.change](el, e);
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
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('sheet').hidden) closeSheet();
});

function start() {
  load();
  const h = location.hash.slice(1);
  if (Views[h]) UI.tab = h;
  render();
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) closeSheet(); });
  if (!T.settings.onboarded) openWelcome();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
