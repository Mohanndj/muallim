'use strict';
// الصفحات: الفصول ← الفصل بأقسامه الأربعة (المتابعة، حاضر، أعمال السنة، الأدوات الخاصة).

const searchBar = (ph = 'بحث') => `<label class="search">${ic('search')}<input id="q" data-input="q" value="${esc(UI.q)}" placeholder="${ph}" autocomplete="off"></label>`;
Inputs.q = (el) => { UI.q = el.value; render(); };
const match = (s) => !UI.q.trim() || s.name.includes(UI.q.trim());

// ---- الفصول ----
Views.home = () => {
  const list = T.classes.filter((c) => !UI.q.trim() || c.name.includes(UI.q.trim()));
  return `<header class="home-h"><div><h1>الفصول</h1><p>إدارة الفصول ومتابعة مستواهم</p><span class="home-date">${ic('calendar-check')} ${dateLabel(today())} | ${hijriDate()}</span></div>
      <div class="round-btns"><button type="button" class="round" data-act="cls-new" aria-label="أضف فصلاً">${ic('plus')}</button></div></header>
    ${T.classes.length ? searchBar() : `<div class="home-empty"><i>${ic('school')}</i><h2>أهلاً بك${T.settings.teacher ? ` ${esc(T.settings.teacher)}` : ''}</h2><p>ابدأ بإضافة فصلك الأول، ثم أضف طلابه من كشف نور أو بلصق أسمائهم.</p><button type="button" class="blue-btn" data-act="cls-new">${ic('plus')} أضف فصلاً</button></div>`}
    ${T.classes.length ? `<div class="cls-grid">${list.map((c) => {
      const lv = classLevel(c.id);
      const C = 2 * Math.PI * 16;
      return `<div class="cls-card" data-act="go" data-h="#c/${c.id}/follow"><span class="cls-art">${ic('book-quran')}</span>
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
  return `${classHead(`<button type="button" class="round" data-act="cls-more" data-id="${UI.cls}" aria-label="خيارات">${ic('more')}</button>`)}
    ${searchBar()}
    <div class="cards">${list.filter(match).map((s) => {
      // كل أيقونة استُعملت مع الطالب مرة واحدة بعدّادها، بترتيب أول استعمال؛ وعشر خانات في الصفحة
      const used = [];
      for (const b of behOf(s.id).sort((x, y) => x.at - y.at)) { const u = used.find((x) => x.k === b.icon && x.name === b.reason); if (u) u.n++; else used.push({ k: b.icon, name: b.reason, n: 1 }); }
      const pages = Math.max(2, Math.ceil(used.length / 10));
      const pg = Math.min(stuPage[s.id] || 0, pages - 1);
      const slots = Array.from({ length: 10 }, (_, i) => used[pg * 10 + i]);
      return `<div class="scard" data-act="eval-open" data-id="${s.id}">
        <div class="sc-av">${AVATAR}</div>
        <div class="sc-body"><div class="sc-top"><span class="sc-nm"><b class="sc-name">${esc(s.name)}</b>${stuTags(s)}</span><span class="sc-x"><span class="pill-blue">${fmtScore(scoreOf(s.id))}</span><button type="button" class="dots" data-act="stu-more" data-id="${s.id}" aria-label="خيارات">${ic('more')}</button></span></div>
          <div class="slots">${slots.map((u) => { if (!u) return '<i class="slot"></i>'; const e = evalOf(u.k); return `<i class="slot on" style="--c:${e ? e.c : '#9aa3ad'}" title="${esc(u.name)}">${ic(e ? e.g : 'check')}${u.n > 1 ? `<b>${u.n}</b>` : ''}</i>`; }).join('')}</div>
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
Acts['eval-open'] = (el, e) => { if (e && e.target.closest('.dots, .pager')) return; evalSid = el.dataset.id; openSheet(evalSheet(), evalSheet, 'gray'); };
function attChips(s) {
  const v = attOf(s);
  return `<div class="att-chips">${ATT.map(([k, n, g, c]) => `<button type="button" class="att-chip${v === k ? ' on' : ''}" style="--c:${c}" data-act="eval-att" data-v="${k}"><i>${ic(g)}</i>${n}</button>`).join('')}</div>`;
}
function evalSheet() {
  const s = stuOf(evalSid);
  if (!s) return '';
  const counts = {};
  for (const b of behOf(s.id)) counts[b.icon] = (counts[b.icon] || 0) + 1;
  return `<div class="ev-head">${AVATAR}<b>${esc(s.name)}</b></div>${attChips(s)}
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
Acts['att-all'] = () => { if (T.att[UI.cls]) delete T.att[UI.cls][UI.date]; save(); render(); toast('الكل حاضر'); };
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
    <div class="cards one">${list.filter(match).map((s) => { const m = T.marksYW[s.id] || {}; const got = T.yw.reduce((n, y) => n + (typeof m[y.k] === 'number' ? m[y.k] : 0), 0); const done = T.yw.some((y) => typeof m[y.k] === 'number'); return `<div class="scard yw">
      <div class="sc-av">${AVATAR}</div><div class="sc-body"><div class="sc-top"><b class="sc-name">${esc(s.name)}</b><span class="pill-blue">${done ? fmtScore(got) : fmtScore(scoreOf(s.id))}</span></div>
      <div class="yw-boxes">${T.yw.map((y) => `<button type="button" class="ywb${typeof m[y.k] === 'number' ? ' set' : ''}" data-act="yw-edit" data-id="${s.id}" data-k="${y.k}"><small>${esc(y.name)}</small><b>${typeof m[y.k] === 'number' ? fmtScore(m[y.k]) : y.max}</b></button>`).join('')}</div></div></div>`; }).join('')}</div>`;
}
// رصد سريع: الدرجة ثم «التالي» للبند التالي فالطالب التالي
let ywAt = null;
Acts['yw-edit'] = (el) => { ywAt = { sid: el.dataset.id, k: el.dataset.k }; openSheet(ywSheet()); setTimeout(() => $('ywIn') && $('ywIn').focus(), 60); };
function ywSheet() {
  const s = stuOf(ywAt.sid), y = T.yw.find((x) => x.k === ywAt.k);
  const v = (T.marksYW[s.id] || {})[y.k];
  return `<form data-submit="yw-save"><div class="ev-head small">${AVATAR}<b>${esc(s.name)}</b></div><h3 class="center">${esc(y.name)} <small>(من ${y.max})</small></h3>
    <input id="ywIn" class="big-in" inputmode="decimal" enterkeyhint="next" value="${typeof v === 'number' ? v : ''}" placeholder="${y.max}">
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
Acts['yw-clear'] = () => { if (T.marksYW[ywAt.sid]) delete T.marksYW[ywAt.sid][ywAt.k]; save(); render(); $('sheetBody').innerHTML = ywSheet(); };
