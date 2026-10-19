'use strict';
// الصفحات: فصولي ← الفصل (قائمة طلابه) ← الطالب (أيقونات التقييم). والتحضير اليومي بضغطة.

// ---- فصولي ----
Views.home = () => {
  const s = T.settings;
  const head = `<header class="bar"><div class="bar-t"><h1>فصولي</h1><small>${dateLabel(today())} | ${hijri()}</small></div>
    <button type="button" class="icon-btn" data-act="go" data-h="#settings" aria-label="الإعدادات">${ic('gear')}</button></header>`;
  if (!T.classes.length) {
    return `${head}<div class="empty">${ic('users', 'big')}<h2>أهلاً${s.teacher ? ` ${esc(s.teacher)}` : ''}</h2><p>أضف فصلك، ثم طلابه من ملف إكسل (كشف نور يصلح) أو بلصق أسمائهم.</p>
      <button type="button" class="primary big" data-act="cls-new">${ic('plus')} أضف فصلاً</button></div>`;
  }
  return `${head}<div class="cls-list">${T.classes.map((c) => {
    const n = studentsIn(c.id).length;
    const day = dayAtt(c.id);
    const abs = day ? Object.values(day).filter((v) => v === 'a').length : 0;
    return `<button type="button" class="cls-card" data-act="go" data-h="#c/${c.id}">
      <span class="cls-ic">${ic('users')}</span><span class="grow"><b>${esc(c.name)}</b><small>${plural(n, 'طالب واحد', 'طالبان', 'طلاب', 'طالباً')}</small></span>
      ${day ? `<span class="pill ok">${ic('check')} حُضِّر${abs ? ` | غاب ${abs}` : ''}</span>` : '<span class="pill">لم يُحضَّر اليوم</span>'}${ic('next', 'chev')}</button>`;
  }).join('')}</div>
    <button type="button" class="fab" data-act="cls-new" aria-label="أضف فصلاً">${ic('plus')}</button>`;
};

// ---- الفصل ----
const sortStudents = (list) => {
  const by = T.settings.sort;
  const score = (s) => behOf(s.id).reduce((n, b) => n + (b.kind === 'pos' ? 1 : -1), 0);
  return list.slice().sort((a, b) => (by === 'stars' ? score(b) - score(a) : 0) || a.name.localeCompare(b.name, 'ar'));
};
Views.class = () => {
  const c = clsOf(UI.cls);
  const all = studentsIn(c.id);
  const list = sortStudents(all);
  const day = dayAtt(c.id);
  const t = today();
  const abs = day ? all.filter((s) => day[s.id] === 'a').length : 0;
  const late = day ? all.filter((s) => day[s.id] === 'l').length : 0;
  return `<header class="bar"><button type="button" class="icon-btn" data-act="back" aria-label="رجوع">${ic('back')}</button>
      <div class="bar-t"><h1>${esc(c.name)}</h1><small>${plural(all.length, 'طالب واحد', 'طالبان', 'طلاب', 'طالباً')}</small></div>
      <button type="button" class="icon-btn" data-act="cls-more" aria-label="المزيد">${ic('more')}</button></header>
    <nav class="tools">
      <button type="button" data-act="att-open">${ic('att')}<span>التحضير</span></button>
      <button type="button" data-act="rand-open">${ic('dice')}<span>عشوائي</span></button>
      <button type="button" data-act="grp-open">${ic('groups')}<span>مجموعات</span></button>
      <button type="button" data-act="imp-open">${ic('plus')}<span>إضافة</span></button>
    </nav>
    ${all.length ? `<button type="button" class="att-strip${day ? ' done' : ''}" data-act="att-open">${day
      ? `${ic('check')}<span>حُضِّر اليوم: حاضر ${all.length - abs - late}${abs ? ` | غائب ${abs}` : ''}${late ? ` | متأخر ${late}` : ''}</span><small>تعديل</small>`
      : `${ic('att')}<span>لم تحضّر طلاب اليوم</span><small>حضّرهم</small>`}</button>` : ''}
    ${all.length ? `<div class="sort"><button type="button" class="${T.settings.sort === 'alpha' ? 'on' : ''}" data-act="sort" data-v="alpha">أبجدي</button><button type="button" class="${T.settings.sort === 'stars' ? 'on' : ''}" data-act="sort" data-v="stars">الأكثر تميّزاً</button></div>
    <ul class="stu-list">${list.map((s, i) => {
      const todays = behOf(s.id).filter((b) => b.d === t);
      const p = todays.filter((b) => b.kind === 'pos').length, n = todays.length - p;
      const a = day ? day[s.id] : '';
      return `<li><button type="button" class="stu-row${a === 'a' ? ' absent' : ''}" data-act="stu-open" data-id="${s.id}"><span class="num">${i + 1}</span>${avatar(s)}
        <span class="grow"><b>${esc(s.name)}</b>${todays.length ? `<span class="today">${todays.slice(-6).map((b) => { const e = evalOf(b.icon); return e ? `<i style="--c:${e.c}">${ic(e.icon)}</i>` : `<i class="${b.kind}">${b.kind === 'pos' ? '+' : '−'}</i>`; }).join('')}</span>` : ''}</span>
        ${a === 'a' ? '<span class="pill bad">غائب</span>' : a === 'l' ? '<span class="pill warn">متأخر</span>' : ''}
        ${p ? `<span class="cnt pos">+${p}</span>` : ''}${n ? `<span class="cnt neg">−${n}</span>` : ''}</button></li>`;
    }).join('')}</ul>`
    : `<div class="empty">${ic('users', 'big')}<h2>لا طلاب بعد</h2><p>أضفهم من ملف إكسل أو بلصق أسمائهم.</p><button type="button" class="primary big" data-act="imp-open">${ic('plus')} أضف الطلاب</button></div>`}`;
};
Acts.sort = (el) => { T.settings.sort = el.dataset.v; save(); render(); };

// ---- الطالب: أيقونات التقييم ----
let stuId = '';
Acts['stu-open'] = (el) => { stuId = el.dataset.id; openSheet(stuSheet(), stuSheet); };
function stuSheet() {
  const s = stuOf(stuId);
  if (!s) return '';
  const all = behOf(s.id);
  const count = (k) => all.filter((b) => b.icon === k).length;
  const a = attOf(s);
  const tile = (e) => `<button type="button" class="ev" style="--c:${e.c}" data-act="ev" data-k="${e.k}"><span class="ev-i">${ic(e.icon)}${count(e.k) ? `<b>${count(e.k)}</b>` : ''}</span><span>${e.name}</span></button>`;
  const pos = all.filter((b) => b.kind === 'pos').length;
  const recent = all.slice().sort((x, y) => y.at - x.at).slice(0, 12);
  return `<div class="who">${avatar(s, 'lg')}<div class="grow"><h3>${esc(s.name)}</h3><small>${esc(clsOf(s.cls) ? clsOf(s.cls).name : '')}</small></div></div>
    <div class="seg att3">${[['p', 'حاضر'], ['l', 'متأخر'], ['a', 'غائب']].map(([v, n]) => `<button type="button" class="${a === v ? `on ${v}` : ''}" data-act="stu-att" data-v="${v}">${n}</button>`).join('')}</div>
    <h4 class="pos-h">إيجابي</h4><div class="evs">${EVALS.filter((e) => e.kind === 'pos').map(tile).join('')}</div>
    <h4 class="neg-h">سلبي</h4><div class="evs">${EVALS.filter((e) => e.kind === 'neg').map(tile).join('')}</div>
    <div class="sums"><span class="good">إيجابي: ${pos}</span><span class="bad">سلبي: ${all.length - pos}</span><span>غياب: ${attCount(s, 'a')}</span><span>تأخر: ${attCount(s, 'l')}</span></div>
    ${recent.length ? `<h4>آخر التقييمات</h4><ul class="log">${recent.map((b) => { const e = evalOf(b.icon); return `<li><i style="--c:${e ? e.c : b.kind === 'pos' ? '#16a34a' : '#dc2626'}">${ic(e ? e.icon : 'star')}</i><span class="grow">${esc(b.reason)}</span><small>${dateLabel(b.d)}</small><button type="button" class="x" data-act="ev-del" data-id="${b.id}" aria-label="احذف">${ic('x')}</button></li>`; }).join('')}</ul>` : ''}
    <div class="row2"><button type="button" class="wa" data-act="send-file" data-id="${s.id}"${phoneOk(s.phone) ? '' : ' disabled'}>${ic('send')} أرسل ملفه لولي الأمر</button>
      <button type="button" class="ghost" data-act="stu-edit" data-id="${s.id}">${ic('edit')} بياناته</button></div>
    ${phoneOk(s.phone) ? '' : '<p class="hint">أضف جوال ولي أمره من «بياناته» ليصله ملفه.</p>'}`;
}
Acts.ev = (el) => {
  const e = evalOf(el.dataset.k);
  const b = { id: uid(), sid: stuId, d: today(), at: Date.now(), kind: e.kind, icon: e.k, reason: e.name, note: '' };
  T.beh.push(b);
  save(); refresh();
  const t = $('sheetBody').querySelector(`.ev[data-k="${e.k}"]`);
  if (t) t.classList.add('pop');
  if (navigator.vibrate) navigator.vibrate(15);
  toast(`${e.kind === 'pos' ? '+' : '−'} ${e.name}: ${shortName(stuOf(stuId))}`, () => { T.beh = T.beh.filter((x) => x.id !== b.id); save(); refresh(); });
};
Acts['ev-del'] = (el) => {
  if (!armed(el)) return;
  T.beh = T.beh.filter((x) => x.id !== el.dataset.id);
  save(); refresh();
};
// حالة الطالب اليوم من نافذته: تحضير الفصل اليوم يبدأ إن لم يكن بدأ (والباقون حاضرون)
Acts['stu-att'] = (el) => {
  const s = stuOf(stuId);
  setAtt(s, el.dataset.v);
  save(); refresh();
};
function setAtt(s, v, d = today()) {
  T.att[s.cls] = T.att[s.cls] || {};
  const day = (T.att[s.cls][d] = T.att[s.cls][d] || {});
  if (v === 'p') delete day[s.id]; else day[s.id] = v;
}

// ---- التحضير ----
Acts['att-open'] = () => {
  const cid = UI.cls;
  T.att[cid] = T.att[cid] || {};
  if (!T.att[cid][today()]) { T.att[cid][today()] = {}; save(); render(); }
  openSheet(attSheet(), attSheet);
};
function attSheet() {
  const cid = UI.cls;
  const day = dayAtt(cid) || {};
  const list = studentsIn(cid).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  const abs = list.filter((s) => day[s.id] === 'a');
  const late = list.filter((s) => day[s.id] === 'l').length;
  return `<h3>${ic('att')} تحضير اليوم</h3><p class="hint">${dateLabel(today())} | ${hijri()}. الكل حاضر؛ اضغط اسم الغائب مرة، والمتأخر مرتين.</p>
    <div class="sums"><span class="good">حاضر: ${list.length - abs.length - late}</span><span class="bad">غائب: ${abs.length}</span><span class="warn">متأخر: ${late}</span></div>
    <ul class="att-list">${list.map((s) => { const v = day[s.id] || 'p'; return `<li><button type="button" class="att-row ${v}" data-act="att-cycle" data-id="${s.id}">${avatar(s)}<span class="grow">${esc(s.name)}</span><span class="att-v">${v === 'a' ? 'غائب' : v === 'l' ? 'متأخر' : 'حاضر'}</span></button></li>`; }).join('')}</ul>
    <div class="row2"><button type="button" class="primary" data-act="close-sheet">${ic('check')} تم</button>
      ${abs.length ? `<button type="button" class="wa" data-act="abs-notify">${ic('send')} أبلغ أولياء الغائبين (${abs.length})</button>` : ''}</div>
    <button type="button" class="link" data-act="att-all">الكل حاضر</button>`;
}
Acts['att-cycle'] = (el) => {
  const s = stuOf(el.dataset.id);
  const v = attOf(s) || 'p';
  setAtt(s, v === 'p' ? 'a' : v === 'a' ? 'l' : 'p');
  save(); refresh();
};
Acts['att-all'] = () => { T.att[UI.cls][today()] = {}; save(); refresh(); };
