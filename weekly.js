'use strict';
// «رسائل نهاية الأسبوع» (الإصدار ١٨): لكل ولي أمر رسالة من قالب يختاره المعلم، تجمع وحدها ما رُصد على ابنه
// من الأحد إلى الخميس: الحضور والغياب والتأخر والهروب والاستئذان، والنقاط، والتسميع، والإيجابيات والملاحظات.
// الإرسال: «أرسل» يفتح واتساب والرسالة مكتوبة، وبعد العودة ينتقل إلى ولي الأمر التالي (واتساب لا يسمح بإرسال آلي).
// T.waTpl = [{ id, name, text }]، T.settings.waTplId، T.weekSent[أحد الأسبوع][sid] = وقت الإرسال

const WA_VARS = [['الطالب', 'اسم الطالب'], ['الأسبوع', 'تاريخ الأسبوع'], ['المادة', 'المادة'], ['الحضور', 'أيام الحضور'], ['الغياب', 'أيام الغياب'], ['التأخر', 'مرات التأخر'], ['الهروب', 'مرات الهروب'], ['الاستئذان', 'مرات الاستئذان'],
  ['النقاط', 'نقاط الأسبوع'], ['التسميع', 'مرات التسميع'], ['الإيجابيات', 'الإيجابيات'], ['الملاحظات', 'الملاحظات'], ['المعلم', 'اسمك']];
const WA_DEFAULT = [
  ['praise', 'ثناء', `السلام عليكم ورحمة الله وبركاته
ولي أمر الطالب {الطالب} حفظه الله
يسعدنا أن نشكر ابنكم على جهوده هذا الأسبوع ({الأسبوع}) في مادة {المادة}:
الحضور: {الحضور} | الغياب: {الغياب} | التأخر: {التأخر} | الهروب: {الهروب}
النقاط: {النقاط} | التسميع: {التسميع}
الإيجابيات: {الإيجابيات}
الملاحظات: {الملاحظات}
بارك الله فيه ونفع به.
{المعلم}`],
  ['follow', 'متابعة', `السلام عليكم ورحمة الله وبركاته
ولي أمر الطالب {الطالب} حفظه الله
هذا ملخص ابنكم هذا الأسبوع ({الأسبوع}) في مادة {المادة}:
الحضور: {الحضور} | الغياب: {الغياب} | التأخر: {التأخر} | الهروب: {الهروب}
النقاط: {النقاط} | التسميع: {التسميع}
الإيجابيات: {الإيجابيات}
الملاحظات: {الملاحظات}
نأمل متابعته معنا، وثقتنا بكم كبيرة.
{المعلم}`],
];
const waTpls = () => {
  if (!Array.isArray(T.waTpl) || !T.waTpl.length) T.waTpl = WA_DEFAULT.map(([id, name, text]) => ({ id, name, text }));
  return T.waTpl;
};
const waTplOf = (id) => waTpls().find((t) => t.id === id) || waTpls()[0];

// الأسبوع الدراسي: من الأحد إلى الخميس، والجمعة والسبت يتبعان الأسبوع الذي انتهى
function weekRange(d = today()) {
  const x = parseD(d);
  x.setDate(x.getDate() - x.getDay());
  const from = iso(x);
  x.setDate(x.getDate() + 4);
  return { from, to: iso(x) };
}
const inWeek = (d, w) => d >= w.from && d <= w.to;
const isTasmee = (b) => { const e = evalOf(b.icon); return /سم|حفظ/.test(b.reason) || (e && /سم|حفظ/.test(e.name)); };
// ما رُصد على الطالب في الأسبوع
function weekStats(s, w = weekRange()) {
  const att = T.att[s.cls] || {};
  const behs = behOf(s.id).filter((b) => inWeek(b.d, w));
  // أيام الحصص: كل يوم رُصد فيه حضور الفصل أو قُيّم فيه أحد طلابه
  const days = new Set(Object.keys(att).filter((d) => inWeek(d, w)));
  for (const b of T.beh) if (inWeek(b.d, w)) { const o = stuOf(b.sid); if (o && o.cls === s.cls) days.add(b.d); }
  const st = (v) => [...days].filter((d) => ((att[d] || {})[s.id] || 'p') === v).length;
  const absent = st('a') + st('e'), fled = st('h');
  const count = (list) => { const m = {}; for (const b of list) m[b.reason] = (m[b.reason] || 0) + 1; return Object.entries(m).map(([r, n]) => (n > 1 ? `${r} (${n})` : r)); };
  const notes = (((T.snotes || {})[s.id]) || []).filter((n) => inWeek(n.d, w)).map((n) => n.t);
  return {
    days: days.size, present: days.size - absent - fled, absent, late: st('l'), fled, exits: st('x'),
    points: behs.reduce((n, b) => n + b.w, 0), tasmee: behs.filter(isTasmee).length,
    good: count(behs.filter((b) => b.w > 0)), bad: [...count(behs.filter((b) => b.w < 0)), ...notes],
  };
}
const waNum = (n, one, two, many) => (n === 0 ? 'لا يوجد' : n === 1 ? one : n === 2 ? two : `${n} ${many}`);
function waFill(tpl, s, w = weekRange()) {
  const x = weekStats(s, w);
  const v = {
    الطالب: s.name, الأسبوع: `${dateLabel(w.from)} إلى ${dateLabel(w.to)}`, المادة: T.settings.subject, المعلم: T.settings.teacher || 'معلم المادة',
    الحضور: waNum(x.present, 'يوم واحد', 'يومان', 'أيام'), الغياب: waNum(x.absent, 'يوم واحد', 'يومان', 'أيام'), التأخر: waNum(x.late, 'مرة', 'مرتان', 'مرات'),
    الهروب: waNum(x.fled, 'مرة', 'مرتان', 'مرات'), الاستئذان: waNum(x.exits, 'مرة', 'مرتان', 'مرات'), النقاط: fmtScore(x.points), التسميع: waNum(x.tasmee, 'مرة', 'مرتان', 'مرات'),
    الإيجابيات: x.good.join('، ') || 'لا يوجد', الملاحظات: x.bad.join('، ') || 'لا شيء، ولله الحمد',
  };
  return tpl.text.replace(/\{([^{}]+)\}/g, (m, k) => (k in v ? String(v[k]) : m));
}

// ---- صفحة الإرسال (نافذة) ----
let wk = { cls: '', tpl: '' };
const sentOf = (w) => { T.weekSent = T.weekSent || {}; return (T.weekSent[w.from] = T.weekSent[w.from] || {}); };
Acts['wk-open'] = () => {
  if (!clsOf(wk.cls)) wk.cls = UI.view === 'class' ? UI.cls : (T.classes[0] || {}).id || '';
  wk.tpl = waTplOf(T.settings.waTplId).id; wk.prev = '';
  openSheet(wkHTML(), wkHTML, 'gray');
};
function wkHTML() {
  const w = weekRange(), sent = sentOf(w), list = studentsIn(wk.cls), tpl = waTplOf(wk.tpl);
  const done = list.filter((s) => sent[s.id]).length, next = list.find((s) => !sent[s.id] && phoneOk(s.phone));
  return `<h3>${ic('whatsapp')} رسائل نهاية الأسبوع</h3><p class="hint">${dateLabel(w.from)} إلى ${dateLabel(w.to)}</p>
    <div class="chips">${T.classes.map((c) => `<button type="button" class="chip${wk.cls === c.id ? ' on' : ''}" data-act="wk-cls" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>
    <div class="wk-tpl"><span>القالب:</span>${waTpls().map((t) => `<button type="button" class="chip${tpl.id === t.id ? ' on' : ''}" data-act="wk-tpl" data-id="${t.id}">${esc(t.name)}</button>`).join('')}<button type="button" class="chip" data-act="wk-edit">${ic('pen')} القوالب</button></div>
    ${list.length ? `${next ? `<button type="button" class="wa-btn wide wk-next" data-act="wk-send" data-id="${next.id}">${ic('paper-plane')} أرسل إلى ولي أمر ${esc(shortName(next))} (${done + 1} من ${list.length})</button>` : `<p class="wk-done">${ic('check')} أُرسلت رسائل هذا الفصل (${done} من ${list.length})</p>`}
    <ul class="send-list wk-list">${list.map((s) => `<li class="${sent[s.id] ? 'sent' : ''}"><span class="grow"><b>${esc(s.name)}</b><small class="hint">${(() => { const x = weekStats(s, w); return `نقاط ${fmtScore(x.points)} | غياب ${x.absent} | تسميع ${x.tasmee}`; })()}</small></span>
      <button type="button" class="x" data-act="wk-prev" data-id="${s.id}" aria-label="اعرض الرسالة">${ic('eye')}</button>
      ${phoneOk(s.phone) ? `<button type="button" class="${sent[s.id] ? 'ghost-btn' : 'wa-btn'} sm" data-act="wk-send" data-id="${s.id}">${sent[s.id] ? 'أُرسلت' : 'أرسل'}</button>` : '<small class="hint">بلا جوال</small>'}</li>
      ${wk.prev === s.id ? `<li class="wk-prev"><pre>${esc(waFill(tpl, s, w))}</pre></li>` : ''}`).join('')}</ul>` : '<p class="hint">لا طلاب في هذا الفصل.</p>'}`;
}
Acts['wk-cls'] = (el) => { wk.cls = el.dataset.id; wk.prev = ''; refresh(); };
Acts['wk-tpl'] = (el) => { wk.tpl = el.dataset.id; T.settings.waTplId = wk.tpl; save(); refresh(); };
Acts['wk-prev'] = (el) => { wk.prev = wk.prev === el.dataset.id ? '' : el.dataset.id; refresh(); };
Acts['wk-send'] = (el) => {
  const s = stuOf(el.dataset.id), w = weekRange();
  logAct('msg:week', s.id);
  window.open(waLink(s.phone, waFill(waTplOf(wk.tpl), s, w)), '_blank');
  sentOf(w)[s.id] = Date.now();
  save(); refresh();
};

// ---- تعديل القوالب ----
Acts['wk-edit'] = () => openSheet(wkEditHTML(), wkEditHTML, 'gray');
function wkEditHTML() {
  return `<h3>قوالب الرسائل</h3><p class="hint">اضغط أي معلومة لتُضاف إلى القالب، ويملؤها التطبيق وحده لكل طالب من رصد الأسبوع.</p>
    ${waTpls().map((t) => `<div class="sm-card"><input class="wk-name" data-input="wk-name" data-id="${t.id}" value="${esc(t.name)}">
      <textarea id="wkt-${t.id}" rows="9" data-input="wk-text" data-id="${t.id}">${esc(t.text)}</textarea>
      <div class="wk-vars">${WA_VARS.map(([k, n]) => `<button type="button" data-act="wk-var" data-id="${t.id}" data-k="${k}">${n}</button>`).join('')}</div>
      ${waTpls().length > 1 ? `<button type="button" class="red-btn sm" data-act="wk-del" data-id="${t.id}">${ic('trash')} احذف القالب</button>` : ''}</div>`).join('')}
    <button type="button" class="ghost-btn wide" data-act="wk-add">${ic('plus')} قالب جديد</button>
    <button type="button" class="blue-btn wide" data-act="wk-open">${ic('back')} رجوع إلى الإرسال</button>`;
}
Inputs['wk-name'] = (el) => { waTplOf(el.dataset.id).name = el.value.trim() || 'قالب'; save(); };
Inputs['wk-text'] = (el) => { waTplOf(el.dataset.id).text = el.value; save(); };
Acts['wk-var'] = (el) => {
  const ta = $(`wkt-${el.dataset.id}`), ins = `{${el.dataset.k}}`, p = ta.selectionStart ?? ta.value.length;
  ta.value = ta.value.slice(0, p) + ins + ta.value.slice(ta.selectionEnd ?? p);
  waTplOf(el.dataset.id).text = ta.value; save();
  ta.focus(); ta.setSelectionRange(p + ins.length, p + ins.length);
};
Acts['wk-add'] = () => { waTpls().push({ id: uid(), name: 'قالب جديد', text: WA_DEFAULT[0][2] }); save(); refresh(); };
Acts['wk-del'] = (el) => { if (!armed(el)) return; T.waTpl = waTpls().filter((t) => t.id !== el.dataset.id); save(); refresh(); };
// تذكير في الرئيسية من الخميس إلى السبت ما دام بعض أولياء الأمور لم تصلهم رسالة الأسبوع
function weekDue() {
  if (![4, 5, 6].includes(new Date().getDay())) return false;
  const sent = (T.weekSent || {})[weekRange().from] || {};
  return T.students.some((s) => phoneOk(s.phone) && !sent[s.id]);
}
