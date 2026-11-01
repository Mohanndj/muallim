'use strict';
// الصفحات: الفصول ← الفصل بأقسامه الأربعة (المتابعة، حاضر، أعمال السنة، الأدوات الخاصة).

const searchBar = (ph = 'بحث') => `<label class="search">${ic('search')}<input id="q" data-input="q" value="${esc(UI.q)}" placeholder="${ph}" autocomplete="off"></label>`;
Inputs.q = (el) => { UI.q = el.value; render(); };
const match = (s) => !UI.q.trim() || s.name.includes(UI.q.trim());

// ---- الفصول ----
// لكل فصل لون، بترتيب الفصول
const CLS_COLORS = [['#2f8456', '#144a2e'], ['#3478f6', '#1b4fc4'], ['#7a40e0', '#4a2296'], ['#e9762b', '#b4500e'], ['#159a9c', '#0b6668'], ['#d9406f', '#9c1c47']];
Views.home = () => {
  const list = T.classes.filter((c) => !UI.q.trim() || c.name.includes(UI.q.trim()));
  return `<header class="home-h"><div><h1>الفصول</h1><p>إدارة الفصول ومتابعة مستواهم</p><span class="home-date">${ic('calendar-check')} ${dateLabel(today())} | ${hijriDate()}</span></div>
      <div class="round-btns"><button type="button" class="round wa-round" data-act="wk-open" aria-label="رسائل نهاية الأسبوع">${ic('whatsapp')}</button><button type="button" class="round" data-act="cls-new" aria-label="أضف فصلاً">${ic('plus')}</button></div></header>
    ${weekDue() ? `<button type="button" class="wa-bar" data-act="wk-open">${ic('whatsapp')} حان وقت رسائل نهاية الأسبوع لأولياء الأمور</button>` : ''}
    ${T.classes.length ? searchBar() : `<div class="home-empty"><i>${ic('school')}</i><h2>أهلاً بك${T.settings.teacher ? ` ${esc(T.settings.teacher)}` : ''}</h2><p>ابدأ بإضافة فصلك الأول، ثم أضف طلابه من كشف نور أو بلصق أسمائهم.</p><button type="button" class="blue-btn" data-act="cls-new">${ic('plus')} أضف فصلاً</button></div>`}
    ${T.classes.length ? `<div class="cls-grid">${list.map((c, ci) => {
      const lv = classLevel(c.id);
      const C = 2 * Math.PI * 16;
      const [c1, c2] = CLS_COLORS[T.classes.indexOf(c) % CLS_COLORS.length];
      return `<div class="cls-card" style="--c1:${c1};--c2:${c2}" data-act="go" data-h="#c/${c.id}/follow"><span class="cls-art">${ic('book-quran')}</span>
        <button type="button" class="dots-btn" data-act="cls-more" data-id="${c.id}" aria-label="خيارات">${ic('more')}</button>
        <b class="cls-name">${esc(c.name)}</b>
        <div class="cls-lv"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" class="r-bg"/><circle cx="20" cy="20" r="16" class="r-fg" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - lv / 100)}"/><text x="20" y="24">${lv}%</text></svg><span>| مستوى الفصل</span></div>
        <span class="cls-n">${ic('users')} ${studentsIn(c.id).length} طالب</span></div>`;
    }).join('')}<button type="button" class="cls-add" data-act="cls-new" aria-label="أضف فصلاً">${ic('plus')}</button></div>` : ''}`;
};

// ---- رأس صفحة الفصل ----
function classHead(extra = '') {
  return `<header class="cls-h"><button type="button" class="round" data-act="back" aria-label="رجوع">${ic('back')}</button><h1>${esc(clsOf(UI.cls).name)}</h1>
    <div class="round-btns">${extra}</div></header>`;
}
const filters = (withDate) => `<div class="filters">${searchBar()}<div class="fbox"><small>المادة</small><span>${esc(T.settings.subject)}</span></div>
  ${withDate ? `<label class="fbox"><small>التاريخ</small><input type="date" id="attDate" value="${UI.date}" max="${today()}"></label>` : ''}</div>`;

Views.class = () => ({ follow: viewFollow, att: viewAtt, yw: viewYW, tools: viewTools }[UI.tab] || viewFollow)();

// ---- المتابعة: بطاقة لكل طالب بأيقونات تقييمه ----
const stuPage = {};
function viewFollow() {
  const list = studentsIn(UI.cls);
  if (!list.length) {
    return `${classHead(`<button type="button" class="round" data-act="cls-more" data-id="${UI.cls}" aria-label="خيارات">${ic('more')}</button>`)}
      <div class="empty">${AVATAR}<h2>لا طلاب في هذا الفصل</h2><p>أضفهم من ملف إكسل (كشف نور) أو بلصق أسمائهم.</p><button type="button" class="blue-btn" data-act="imp-open">${ic('plus')} أضف الطلاب</button></div>`;
  }
  const sel = UI.multi;
  return `${classHead(`<button type="button" class="round${sel ? ' on' : ''}" data-act="multi" aria-label="تقييم جماعي" title="تقييم جماعي">${ic('list-check')}</button><button type="button" class="round" data-act="cls-more" data-id="${UI.cls}" aria-label="خيارات">${ic('more')}</button>`)}
    ${searchBar()}
    ${sel ? `<div class="multi-bar"><span>${ic('list-check')} اختر الطلاب: ${sel.size} من ${list.length}</span><button type="button" class="ghost-btn sm" data-act="multi-all">${sel.size === list.length ? 'ألغِ الكل' : 'الكل'}</button><button type="button" class="blue-btn sm" data-act="multi-ev"${sel.size ? '' : ' disabled'}>قيّمهم</button><button type="button" class="x" data-act="multi" aria-label="إلغاء">${ic('x')}</button></div>` : ''}
    <div class="cards">${list.filter(match).map((s) => {
      // كل أيقونة استُعملت مع الطالب مرة واحدة بعدّادها، بترتيب أول استعمال؛ وعشر خانات في الصفحة
      const used = [];
      for (const b of behOf(s.id).sort((x, y) => x.at - y.at)) { const u = used.find((x) => x.k === b.icon && x.name === b.reason); if (u) u.n++; else used.push({ k: b.icon, name: b.reason, n: 1 }); }
      const pages = Math.max(2, Math.ceil(used.length / 10));
      const pg = Math.min(stuPage[s.id] || 0, pages - 1);
      const slots = Array.from({ length: 10 }, (_, i) => used[pg * 10 + i]);
      return `<div class="scard${sel && sel.has(s.id) ? ' sel' : ''}" data-act="eval-open" data-id="${s.id}">
        <div class="sc-av">${AVATAR}</div>
        <div class="sc-body"><div class="sc-top"><span class="sc-nm"><b class="sc-name">${esc(s.name)}</b>${stuTags(s)}</span><span class="sc-x"><span class="pill-blue${scoreOf(s.id) < 0 ? ' neg' : ''}">${fmtScore(scoreOf(s.id))}</span><button type="button" class="dots" data-act="stu-more" data-id="${s.id}" aria-label="خيارات">${ic('more')}</button></span></div>
          <div class="slots">${slots.map((u) => { if (!u) return '<i class="slot"></i>'; const e = evalOf(u.k); return `<i class="slot on" style="--c:${e ? e.c : '#9aa3ad'}" title="${esc(u.name)}">${ic(e ? e.g : 'check')}${u.n > 1 ? `<b>${u.n}</b>` : ''}</i>`; }).join('')}</div>
          <div class="quick">${quickEvals().map((e) => `<button type="button" style="--c:${e.c}" data-act="qev" data-id="${s.id}" data-k="${e.k}"><i>${ic(e.g)}</i>${esc(e.name.length > 9 ? `${e.name.slice(0, 9)}…` : e.name)}</button>`).join('')}</div>
          <div class="pager">${Array.from({ length: pages }, (_, i) => `<button type="button" class="${i === pg ? 'on' : ''}" data-act="stu-page" data-id="${s.id}" data-p="${i}" aria-label="صفحة ${i + 1}"></button>`).join('')}</div></div></div>`;
    }).join('')}</div>`;
}
// ما يظهر تحت اسم الطالب: مهمته في الفصل، وأوسمته، وخروجه من الحصة الآن
function stuTags(s) {
  const roles = rolesOf(s), bs = badgesOf(s.id), out = isOut(s.id);
  if (!roles.length && !bs.length && !out) return '';
  const seen = [...new Set(bs.map((b) => b.k))];
  return `<span class="sc-tags">${out ? `<em class="tag out">${ic('hourglass-half')} خارج الفصل</em>` : ''}${roles.map((r) => `<em class="tag role">${ic('crown')} ${r}</em>`).join('')}${seen.map((k) => { const B = BADGES.find((x) => x[0] === k); return B ? `<i class="bdg-mini" style="--c:${B[3]}" title="${B[1]}">${ic(B[2])}</i>` : ''; }).join('')}</span>`;
}
Acts['stu-page'] = (el) => { stuPage[el.dataset.id] = Number(el.dataset.p); render(); };

// ---- نافذة التقييم ----
let evalSid = '';
Acts['eval-open'] = (el, e) => {
  if (e && e.target.closest('.dots, .pager, .quick')) return;
  // في التقييم الجماعي: الضغط يختار الطالب ولا يفتح نافذته
  if (UI.multi) { const id = el.dataset.id; if (UI.multi.has(id)) UI.multi.delete(id); else UI.multi.add(id); render(); return; }
  evalSid = el.dataset.id; openSheet(evalSheet(), evalSheet, 'gray');
};
// أكثر أربعة تقييمات استعمالاً: على بطاقة كل طالب، تُسجَّل بضغطة دون فتح نافذته
function quickEvals() {
  const n = {};
  for (const b of T.beh) n[b.icon] = (n[b.icon] || 0) + 1;
  return T.evals.slice().sort((a, b) => (n[b.k] || 0) - (n[a.k] || 0) || T.evals.indexOf(a) - T.evals.indexOf(b)).slice(0, 4);
}
Acts.qev = (el) => {
  if (UI.multi) return;
  const e = evalOf(el.dataset.k), s = stuOf(el.dataset.id);
  const b = { id: uid(), sid: s.id, d: today(), at: Date.now(), icon: e.k, reason: e.name, w: e.w };
  T.beh.push(b);
  save(); render();
  if (navigator.vibrate) navigator.vibrate(15);
  toast(`${e.name}: ${shortName(s)} (${fmt1(e.w)})`, () => { T.beh = T.beh.filter((x) => x.id !== b.id); save(); render(); });
};
// ---- التقييم الجماعي: تقييم واحد لعدة طلاب بضغطة ----
Acts.multi = () => { UI.multi = UI.multi ? null : new Set(); render(); };
Acts['multi-all'] = () => { const ids = studentsIn(UI.cls).map((s) => s.id); UI.multi = UI.multi.size === ids.length ? new Set() : new Set(ids); render(); };
Acts['multi-ev'] = () => openSheet(`<h3>قيّم ${UI.multi.size} ${UI.multi.size > 2 && UI.multi.size < 11 ? 'طلاب' : 'طالباً'}</h3>
  <div class="ev-grid">${T.evals.map((e) => `<button type="button" class="ev-row" data-act="multi-go" data-k="${e.k}"><i style="--c:${e.c}">${ic(e.g)}</i><span>${esc(e.name)}</span><em>${fmt1(e.w)}</em></button>`).join('')}</div>`, null, 'gray');
Acts['multi-go'] = (el) => {
  const e = evalOf(el.dataset.k), at = Date.now();
  const added = [...UI.multi].map((sid) => ({ id: uid(), sid, d: today(), at, icon: e.k, reason: e.name, w: e.w }));
  T.beh.push(...added);
  const n = added.length, ids = new Set(added.map((b) => b.id));
  UI.multi = null;
  save(); closeSheet(); render();
  toast(`${e.name}: ${n} ${n > 2 && n < 11 ? 'طلاب' : 'طالباً'} (${fmt1(e.w)})`, () => { T.beh = T.beh.filter((b) => !ids.has(b.id)); save(); render(); });
};
function attChips(s) {
  const v = attOf(s);
  return `<div class="att-chips">${ATT.map(([k, n, g, c]) => `<button type="button" class="att-chip${v === k ? ' on' : ''}" style="--c:${c}" data-act="eval-att" data-v="${k}"><i>${ic(g)}</i>${n}</button>`).join('')}</div>`;
}
function evalSheet() {
  const s = stuOf(evalSid);
  if (!s) return '';
  const counts = {};
  for (const b of behOf(s.id)) counts[b.icon] = (counts[b.icon] || 0) + 1;
  const list = studentsIn(s.cls), i = list.findIndex((x) => x.id === s.id);
  return `<div class="ev-head">${AVATAR}<b>${esc(s.name)}</b>
      <div class="ev-nav"><button type="button" class="chip" data-act="ev-move" data-d="-1"${i ? '' : ' disabled'}>${ic('back')} السابق</button><small>${i + 1} من ${list.length}</small><button type="button" class="chip" data-act="ev-move" data-d="1"${i < list.length - 1 ? '' : ' disabled'}>التالي ${ic('next')}</button></div></div>${attChips(s)}
    <div class="ev-note"><input id="evNote" placeholder="ملاحظة سريعة على الطالب…" enterkeyhint="done"><button type="button" class="blue-btn sm" data-act="ev-note">${ic('plus')}</button></div>
    <div class="note-chips">${NOTE_PHRASES.map((p) => `<button type="button" data-act="ev-note" data-t="${esc(p)}">${esc(p)}</button>`).join('')}</div>
    ${(((T.snotes || {})[s.id]) || []).filter((n) => n.d === today()).map((n) => `<p class="ev-noted">${ic('check')} ${esc(n.t)}</p>`).join('')}
    <div class="ev-grid">${T.evals.map((e) => `<button type="button" class="ev-row" data-act="ev" data-k="${e.k}"><i style="--c:${e.c}">${ic(e.g)}${counts[e.k] ? `<b>${counts[e.k]}</b>` : ''}</i><span>${esc(e.name)}</span><em>${fmt1(e.w)}</em></button>`).join('')}</div>`;
}
Acts.ev = (el) => {
  const e = evalOf(el.dataset.k);
  const b = { id: uid(), sid: evalSid, d: today(), at: Date.now(), icon: e.k, reason: e.name, w: e.w };
  T.beh.push(b);
  save(); refresh();
  const row = $('sheetBody').querySelector(`.ev-row[data-k="${e.k}"]`);
  if (row) row.classList.add('hit');
  if (navigator.vibrate) navigator.vibrate(15);
  toast(`${e.name}: ${shortName(stuOf(evalSid))} (${fmt1(e.w)})`, () => { T.beh = T.beh.filter((x) => x.id !== b.id); save(); refresh(); });
};
// ملاحظات جاهزة تُحفظ بضغطة في ملاحظات الطالب (وتدخل في رسالة الأسبوع)
const NOTE_PHRASES = ['متميز اليوم', 'تحسن ملحوظ', 'لم يحضر الكتاب', 'لم يحضر المصحف', 'كثير الحديث', 'يحتاج متابعة في الحفظ', 'لم يحل الواجب'];
Acts['ev-note'] = (el) => {
  const t = (el.dataset.t || $('evNote').value).trim();
  if (!t) { $('evNote').focus(); return; }
  T.snotes = T.snotes || {};
  (T.snotes[evalSid] = T.snotes[evalSid] || []).push({ id: uid(), t, d: today() });
  save(); refresh(); toast(`حُفظت الملاحظة: ${t}`);
};
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'evNote') { e.preventDefault(); Acts['ev-note']({ dataset: {} }); } });
Acts['ev-move'] = (el) => {
  const s = stuOf(evalSid), list = studentsIn(s.cls), i = list.findIndex((x) => x.id === s.id) + Number(el.dataset.d);
  if (list[i]) { evalSid = list[i].id; refresh(); $('sheetBody').scrollTop = 0; }
};
Acts['eval-att'] = (el) => { setAtt(stuOf(evalSid), el.dataset.v); save(); refresh(); };

// ---- حاضر: سبع حالات لكل طالب، والكل حاضر حتى يتغير ----
function viewAtt() {
  const all = studentsIn(UI.cls);
  const d = UI.date;
  const counts = {};
  for (const s of all) { const v = attOf(s, d); counts[v] = (counts[v] || 0) + 1; }
  return `${classHead(`<button type="button" class="round" data-act="att-all" aria-label="الكل حاضر" title="الكل حاضر">${ic('users')}</button><button type="button" class="round" data-act="att-print" aria-label="طباعة" title="طباعة">${ic('print')}</button>`)}
    ${filters(true)}
    <div class="att-sum">${ATT.filter(([k]) => counts[k] || k === 'p').map(([k, n, g, c]) => `<div style="--c:${c}"><i>${ic(g)}</i><span>${counts[k] || 0} ${n}</span></div>`).join('')}</div>
    ${counts.a && d === today() ? `<button type="button" class="wa-bar" data-act="abs-notify">${ic('send')} أبلغ أولياء الغائبين (${counts.a})</button>` : ''}
    <div class="cards one">${all.filter(match).map((s) => { const v = attOf(s, d); const [, vn, , vc] = attInfo(v); return `<div class="scard att">
      <div class="sc-av">${AVATAR}</div><div class="sc-body"><div class="sc-top"><b class="sc-name">${esc(s.name)}</b><span class="st-pill" style="--c:${v === 'p' ? '#66c470' : vc}">${vn}</span></div>
      <div class="att-btns">${ATT.map(([k, n, g, c]) => `<button type="button" class="${v === k ? 'on' : ''}" style="--c:${c}" data-act="att-set" data-id="${s.id}" data-v="${k}"><i>${ic(g)}</i><span>${n}</span></button>`).join('')}</div></div></div>`; }).join('')}</div>`;
}
document.addEventListener('change', (e) => { if (e.target.id === 'attDate' && e.target.value) { UI.date = e.target.value > today() ? today() : e.target.value; render(); } });
Acts['att-set'] = (el) => { setAtt(stuOf(el.dataset.id), el.dataset.v, UI.date); save(); render(); };
// اليوم يبقى مرصوداً (فارغاً = الكل حاضر) حتى يُحسب في رسائل الأسبوع
Acts['att-all'] = () => { T.att[UI.cls] = T.att[UI.cls] || {}; T.att[UI.cls][UI.date] = {}; save(); render(); toast('الكل حاضر'); };
Acts['att-print'] = () => {
  const list = studentsIn(UI.cls);
  const w = window.open('', '_blank');
  if (!w) { toast('اسمح بفتح نافذة جديدة'); return; }
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تحضير ${esc(clsOf(UI.cls).name)}</title><style>body{font-family:Tahoma,sans-serif;margin:16mm}h1{font-size:18pt;margin:0 0 4mm}table{width:100%;border-collapse:collapse}td,th{border:1px solid #999;padding:2mm 3mm;text-align:right}th{background:#eef2f7}</style></head><body>
    <h1>كشف حضور ${esc(clsOf(UI.cls).name)}</h1><p>${esc(T.settings.subject)} | ${dateLabel(UI.date)} ${UI.date.slice(0, 4)}</p>
    <table><tr><th>م</th><th>الطالب</th><th>الحالة</th></tr>${list.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.name)}</td><td>${attInfo(attOf(s, UI.date))[1]}</td></tr>`).join('')}</table></body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 300);
};

// ---- أعمال السنة: خمسة بنود لكل طالب ----
function viewYW() {
  const list = studentsIn(UI.cls);
  return `${classHead(`<button type="button" class="round" data-act="cls-more" data-id="${UI.cls}" aria-label="خيارات">${ic('more')}</button>`)}
    ${filters(false)}
    <div class="yw-bulk"><span>${ic('pen')} ارصد لكل الفصل:</span>${T.yw.map((y) => `<button type="button" class="chip" data-act="yw-bulk" data-k="${y.k}">${esc(y.name)}</button>`).join('')}</div>
    <div class="cards one">${list.filter(match).map((s) => { const done = T.yw.some((y) => ywMark(s.id, y.k) !== null); return `<div class="scard yw">
      <div class="sc-av">${AVATAR}</div><div class="sc-body"><div class="sc-top"><b class="sc-name">${esc(s.name)}</b><span class="pill-blue">${done ? fmtScore(ywTotal(s.id)) : fmtScore(scoreOf(s.id))}</span></div>
      <div class="yw-boxes">${T.yw.map((y) => { const v = ywMark(s.id, y.k), d = behYW(s.id, y.k), r = v === null ? -1 : v / y.max; return `<button type="button" class="ywb${v === null ? '' : ` set ${r >= 0.8 ? 'hi' : r >= 0.5 ? 'mid' : 'lo'}`}" data-act="yw-edit" data-id="${s.id}" data-k="${y.k}"><small>${esc(y.name)}</small><b>${v === null ? y.max : fmtScore(v)}</b>${d ? `<em class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${fmtScore(d)}</em>` : ''}</button>`; }).join('')}</div></div></div>`; }).join('')}</div>`;
}
// رصد سريع: الدرجة ثم «التالي» للبند التالي فالطالب التالي
let ywAt = null;
Acts['yw-edit'] = (el) => { ywAt = { sid: el.dataset.id, k: el.dataset.k }; openSheet(ywSheet()); setTimeout(() => $('ywIn') && $('ywIn').focus(), 60); };
function ywSheet() {
  const s = stuOf(ywAt.sid), y = T.yw.find((x) => x.k === ywAt.k);
  const v = (T.marksYW[s.id] || {})[y.k];
  const d = behYW(s.id, y.k);
  return `<form data-submit="yw-save"><div class="ev-head small">${AVATAR}<b>${esc(s.name)}</b></div><h3 class="center">${esc(y.name)} <small>(من ${y.max})</small></h3>
    <input id="ywIn" class="big-in" inputmode="decimal" enterkeyhint="next" value="${typeof v === 'number' ? v : ''}" placeholder="${typeof v === 'number' ? '' : ywStart(y)}">
    ${d ? `<p class="yw-eff">أثر السلوك: <b class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${fmtScore(d)}</b> | الدرجة النهائية: <b>${fmtScore(ywMark(s.id, y.k))}</b> من ${y.max}</p>` : ''}
    <div class="row2"><button class="blue-btn">${ic('check')} احفظ والتالي</button><button type="button" class="ghost-btn" data-act="yw-clear">امسح الدرجة</button></div></form>`;
}
function ywNext() {
  const list = studentsIn(UI.cls);
  const ki = T.yw.findIndex((y) => y.k === ywAt.k);
  if (ki < T.yw.length - 1) { ywAt.k = T.yw[ki + 1].k; return true; }
  const si = list.findIndex((s) => s.id === ywAt.sid);
  if (si < list.length - 1) { ywAt = { sid: list[si + 1].id, k: T.yw[0].k }; return true; }
  return false;
}
Acts['yw-save'] = () => {
  const y = T.yw.find((x) => x.k === ywAt.k);
  const v = num($('ywIn').value);
  if (v !== null && (v < 0 || v > y.max)) { toast(`الدرجة من صفر إلى ${y.max}`); return; }
  T.marksYW[ywAt.sid] = T.marksYW[ywAt.sid] || {};
  if (v === null) delete T.marksYW[ywAt.sid][y.k]; else T.marksYW[ywAt.sid][y.k] = v;
  save(); render();
  if (ywNext()) { $('sheetBody').innerHTML = ywSheet(); $('ywIn').focus(); } else closeSheet();
};
// ---- رصد بند واحد لكل طلاب الفصل في صفحة واحدة ----
let ywBulkK = '';
// بالأزرار (الافتراضي): طالب واحد في كل مرة، وضغطة الدرجة تحفظها وتنقل إلى التالي
let ywTap = { i: 0, half: false };
Acts['yw-bulk'] = (el) => { ywBulkK = el.dataset.k; ywTap = { i: 0, half: false }; openSheet(ywTapHTML(), ywTapHTML, 'gray'); };
function ywTapHTML() {
  const y = T.yw.find((x) => x.k === ywBulkK), list = studentsIn(UI.cls), s = list[ywTap.i];
  if (!s) return '';
  const v = (T.marksYW[s.id] || {})[y.k], d = behYW(s.id, y.k), f = ywMark(s.id, y.k);
  return `<h3>${esc(y.name)} <small>(من ${y.max})</small></h3>
    <div class="ev-head small">${AVATAR}<b>${esc(s.name)}</b><span class="ex-live">${ywTap.i + 1} / ${list.length}</span></div>
    <p class="yw-eff">المرصود: <b>${typeof v === 'number' ? fmtScore(v) : 'لا شيء'}</b>${d ? ` | السلوك: <b class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${fmtScore(d)}</b>` : ''}${f !== null ? ` | النهائي: <b>${fmtScore(f)}</b>` : ''}</p>
    <div class="yt-grid">${Array.from({ length: Math.floor(y.max) + 1 }, (_, n) => Math.floor(y.max) - n).map((n) => { const val = ywTap.half && n < y.max ? n + 0.5 : n; return `<button type="button" class="${v === val ? 'on' : ''}" data-act="yt-set" data-v="${val}">${fmtScore(val)}</button>`; }).join('')}</div>
    <div class="row2 tight3"><button type="button" class="chip${ywTap.half ? ' on' : ''}" data-act="yt-half">+ نصف</button><button type="button" class="chip" data-act="yt-move" data-d="-1"${ywTap.i ? '' : ' disabled'}>السابق</button><button type="button" class="chip" data-act="yt-move" data-d="1">تخطَّ</button><button type="button" class="chip" data-act="yt-clear">امسح</button></div>
    <button type="button" class="link" data-act="yw-bulk-type" data-k="${y.k}">${ic('pen')} أو اكتب درجات الكل بلوحة المفاتيح</button>`;
}
Acts['yt-set'] = (el) => {
  const s = studentsIn(UI.cls)[ywTap.i];
  T.marksYW[s.id] = T.marksYW[s.id] || {};
  T.marksYW[s.id][ywBulkK] = Number(el.dataset.v);
  save(); render();
  if (navigator.vibrate) navigator.vibrate(10);
  Acts['yt-move']({ dataset: { d: 1 } });
};
Acts['yt-move'] = (el) => {
  const n = studentsIn(UI.cls).length;
  ywTap.i += Number(el.dataset.d);
  if (ywTap.i >= n) { closeSheet(); toast('انتهى رصد الفصل'); return; }
  ywTap.i = Math.max(0, ywTap.i); ywTap.half = false;
  refresh();
};
Acts['yt-half'] = () => { ywTap.half = !ywTap.half; refresh(); };
Acts['yt-clear'] = () => { const s = studentsIn(UI.cls)[ywTap.i]; if (T.marksYW[s.id]) delete T.marksYW[s.id][ywBulkK]; save(); render(); refresh(); };
// بالكتابة: كل الطلاب في صفحة واحدة
Acts['yw-bulk-type'] = (el) => {
  ywBulkK = el.dataset.k;
  const y = T.yw.find((x) => x.k === ywBulkK);
  openSheet(`<h3>${esc(y.name)} <small>(من ${y.max})</small></h3><p class="hint">اكتب درجة كل طالب، و«التالي» في لوحة المفاتيح ينقلك للذي بعده.</p>
    <div class="yb-list">${studentsIn(UI.cls).map((s, i) => { const v = (T.marksYW[s.id] || {})[y.k], d = behYW(s.id, y.k); return `<label class="yb"><span>${esc(s.name)}${d ? ` <em class="${d > 0 ? 'up' : 'down'}">السلوك ${d > 0 ? '+' : ''}${fmtScore(d)}</em>` : ''}</span><input class="yb-in" data-sid="${s.id}" inputmode="decimal" enterkeyhint="${i === studentsIn(UI.cls).length - 1 ? 'done' : 'next'}" value="${typeof v === 'number' ? v : ''}" placeholder="-"></label>`; }).join('')}</div>
    <button type="button" class="blue-btn wide" data-act="yw-bulk-save">${ic('check')} احفظ الكل</button>`, null, 'gray');
  setTimeout(() => { const f = document.querySelector('.yb-in'); if (f) f.focus(); }, 80);
};
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || !e.target.classList || !e.target.classList.contains('yb-in')) return;
  e.preventDefault();
  const all = [...document.querySelectorAll('.yb-in')], i = all.indexOf(e.target);
  if (i < all.length - 1) all[i + 1].focus(); else Acts['yw-bulk-save']();
});
Acts['yw-bulk-save'] = () => {
  const y = T.yw.find((x) => x.k === ywBulkK);
  const ins = [...document.querySelectorAll('.yb-in')];
  const bad = ins.find((el) => { const v = num(el.value); return v !== null && (v < 0 || v > y.max); });
  if (bad) { bad.focus(); toast(`الدرجة من صفر إلى ${y.max}`); return; }
  let n = 0;
  for (const el of ins) {
    const v = num(el.value), sid = el.dataset.sid;
    T.marksYW[sid] = T.marksYW[sid] || {};
    if (v === null) delete T.marksYW[sid][y.k]; else { T.marksYW[sid][y.k] = v; n++; }
  }
  save(); closeSheet(); render(); toast(`رُصدت ${y.name} لـ${n} ${n > 2 && n < 11 ? 'طلاب' : 'طالباً'}`);
};
Acts['yw-clear'] = () => { if (T.marksYW[ywAt.sid]) delete T.marksYW[ywAt.sid][ywAt.k]; save(); render(); $('sheetBody').innerHTML = ywSheet(); };
