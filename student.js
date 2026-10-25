'use strict';
// قائمة «•••» للطالب كما في كشوف: المكافآت والتعزيز، شؤون الطالب، التقويم والدعم، وحذف الطالب.
// كل بند يفتح صفحته في النافذة نفسها، و«رجوع» يعيد إلى القائمة.

const SM = [
  ['المكافآت والتعزيز', [['honor', 'مركز التقدير والتميز', 'certificate', '#f5a623'], ['badge', 'منح وسام', 'award', '#f5a623'], ['leader', 'تعيين قادة الفصل', 'id-card', '#4a8ef0']]],
  ['شؤون الطالب', [['notes', 'إضافة ملاحظات للطالب', 'clipboard', '#36b3c6'], ['plans', 'الخطط التعليمية', 'heart-pulse', '#8b5cf6'], ['exits', 'عداد الاستئذان', 'hourglass-half', '#3fa4f0'], ['weak', 'إشعار ضعف', 'file-circle-xmark', '#f0607a'], ['problems', 'المشكلات السلوكية', 'face-frown', '#f5a623']]],
  ['التقويم والدعم', [['card', 'بطاقة وصول ولي الأمر', 'qrcode', '#3fa4f0'], ['print', 'طباعة كشف الطالب', 'print', '#3fa4f0'], ['chat', 'محادثة ولي الأمر', 'whatsapp', '#5fcf80'], ['refer', 'إحالة الطالب إلى الإدارة', 'file-lines', '#8a9a8c'], ['move', 'نقل إلى فصل آخر', 'arrow-right-arrow-left', '#4a8ef0']]],
  ['أخرى', [['log', 'سجل التقييمات', 'list-ol', '#3478f6'], ['file', 'أرسل ملفه لولي الأمر', 'paper-plane', '#25b35a'], ['edit', 'بيانات الطالب وجوال ولي أمره', 'pen-to-square', '#8e8e93']]],
];
const BADGES = [['excel', 'وسام التميز', 'medal', '#f5a623'], ['disc', 'وسام الانضباط', 'user-shield', '#3478f6'], ['hifz', 'وسام الحفظ', 'book-quran', '#2fa36b'], ['part', 'وسام المشاركة', 'hand', '#f08a3c'], ['read', 'وسام القراءة', 'book-open', '#8b5cf6'], ['idea', 'وسام المبادرة', 'lightbulb', '#e0b100'], ['moral', 'وسام الخلق', 'heart', '#e8457f'], ['help', 'وسام التعاون', 'hands-holding', '#36b3c6']];
const ROLES = ['قائد الفصل', 'نائب القائد', 'مسؤول النظام', 'مسؤول النظافة', 'مسؤول الحضور', 'مسؤول المصحف والكتب'];
const HONORS = [['thanks', 'شهادة شكر وتقدير', 'تقديراً لتميّزه وجهوده'], ['excel', 'شهادة تميّز', 'لتميّزه في المادة وتفوّقه'], ['hifz', 'شهادة إتقان الحفظ', 'لإتقانه الحفظ والتسميع'], ['disc', 'شهادة انضباط', 'لانضباطه وحسن خلقه'], ['part', 'شهادة مشاركة متميزة', 'لمشاركته الفاعلة في الحصة']];
const PROBLEM_TYPES = ['الحديث الجانبي المتكرر', 'إثارة الفوضى', 'عدم إحضار الكتاب أو المصحف', 'عدم حل الواجبات', 'الخروج بلا استئذان', 'الألفاظ السيئة', 'العبث بممتلكات المدرسة', 'النوم في الحصة'];
const DEGREES = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
const WEAK_AREAS = ['القراءة', 'الحفظ والتسميع', 'الفهم والاستيعاب', 'الواجبات', 'المشاركة', 'الاختبارات'];

let smSid = '';
const smS = () => stuOf(smSid);
const listOf = (key) => { T[key] = T[key] || {}; return (T[key][smSid] = T[key][smSid] || []); };
const smHead = (title) => `<div class="sm-head"><button type="button" class="round sm-back" data-act="sm" data-k="" aria-label="رجوع">${ic('back')}</button><div><b>${title}</b><small>${esc(smS().name)}</small></div></div>`;
function smOpen(k) { smView = k; openSheet(smRender(), smRender, 'gray'); }
let smView = '';
function smRender() {
  if (!smS()) return '';
  return (SMV[smView] || smMenu)();
}
Acts['stu-more'] = (el) => { smSid = el.dataset.id; smOpen(''); };
Acts.sm = (el) => {
  const k = el.dataset.k;
  if (k === 'chat') { const s = smS(); if (!phoneOk(s.phone)) { toast('أضف جوال ولي الأمر أولاً'); smOpen('edit'); return; } logAct('msg:chat', s.id); window.open(`https://wa.me/${s.phone}`, '_blank'); return; }
  if (k === 'file') { const s = smS(); if (!phoneOk(s.phone)) { toast('أضف جوال ولي الأمر أولاً'); smOpen('edit'); return; } logAct('msg:file', s.id); window.open(waLink(s.phone, fileText(s)), '_blank'); return; }
  if (k === 'print') { printStudent(smS()); return; }
  smOpen(k);
};
function smMenu() {
  const s = smS();
  return `<h3 class="sm-title">${esc(s.name)}</h3>${SM.map(([sec, items]) => `<h4 class="sm-sec">${sec}</h4><div class="sm-group">${items.map(([k, n, g, c]) => `<button type="button" class="sm-row" data-act="sm" data-k="${k}"><i style="--c:${c}">${ic(g)}</i><span>${n}</span>${ic('next', 'chev')}</button>`).join('')}</div>`).join('')}
    <div class="sm-group"><button type="button" class="sm-row red" data-act="stu-del" data-id="${s.id}"><i style="--c:#ee4d6a">${ic('trash')}</i><span>حذف الطالب</span>${ic('next', 'chev')}</button></div>`;
}

// ---- أوراق للطباعة بترويسة رسمية ----
function printForm(title, body, extraCss = '') {
  const w = window.open('', '_blank');
  if (!w) { toast('اسمح بفتح نافذة جديدة'); return; }
  const st = T.settings;
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Amiri:wght@700&display=swap">
    <style>*{box-sizing:border-box}body{font-family:Cairo,Tahoma,sans-serif;margin:14mm;color:#111;font-size:12.5pt;line-height:1.8}
    .hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1d5f3c;padding-bottom:3mm;margin-bottom:6mm}.hd div{font-size:11pt}
    h1{text-align:center;font-size:18pt;margin:0 0 6mm;color:#1d5f3c}table{width:100%;border-collapse:collapse;margin:3mm 0}td,th{border:1px solid #999;padding:2mm 3mm;text-align:right;vertical-align:top}th{background:#eef4f0;width:30%}
    .sig{display:flex;justify-content:space-between;margin-top:14mm}.sig div{text-align:center;min-width:55mm}.sig b{display:block;border-top:1px solid #777;margin-top:12mm;padding-top:1mm;font-weight:400}${extraCss}</style></head><body>
    <div class="hd"><div>المملكة العربية السعودية<br>وزارة التعليم<br>${esc(st.school || 'المدرسة: ..................')}</div><div>التاريخ: ${hijriDate()}<br>الموافق: ${today()}<br>المادة: ${esc(st.subject)}</div></div>
    ${body}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
}
const hijriDate = () => { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()); } catch { return ''; } };
const stuTable = (s) => `<table><tr><th>اسم الطالب</th><td>${esc(s.name)}</td></tr><tr><th>الفصل</th><td>${esc(clsOf(s.cls) ? clsOf(s.cls).name : '')}</td></tr></table>`;
const teacherSig = () => `<div class="sig"><div>معلم المادة<b>${esc(T.settings.teacher || '')}</b></div><div>التوقيع<b>&nbsp;</b></div></div>`;

const SMV = {};
// ---- مركز التقدير والتميز: شهادة تُطبع أو تُبشَّر بها الأسرة ----
SMV.honor = () => {
  const done = listOf('honors');
  return `${smHead('مركز التقدير والتميز')}<div class="sm-card">${HONORS.map(([k, n, why]) => `<div class="honor"><i>${ic('certificate')}</i><span><b>${n}</b><small>${why}</small></span>
      <button type="button" class="blue-btn sm" data-act="honor-print" data-k="${k}">${ic('print')} اطبع</button><button type="button" class="wa-btn sm" data-act="honor-send" data-k="${k}">${ic('whatsapp')}</button></div>`).join('')}</div>
    ${done.length ? `<h4 class="sm-sec">ما مُنح له</h4><div class="sm-card">${done.slice().reverse().map((h) => `<div class="li">${esc(h.name)}<small>${h.d}</small></div>`).join('')}</div>` : ''}`;
};
const honorOf = (k) => HONORS.find((h) => h[0] === k);
function honorLog(k) { listOf('honors').push({ id: uid(), k, name: honorOf(k)[1], d: today() }); save(); }
Acts['honor-print'] = (el) => {
  const [k, name, why] = honorOf(el.dataset.k);
  const s = smS();
  honorLog(k);
  printForm(name, `<div class="cert"><h1 class="ct">${name}</h1><p>يسرّ معلم مادة ${esc(T.settings.subject)} أن يقدّم هذه الشهادة للطالب</p><div class="nm">${esc(s.name)}</div>
    <p>${why} في مادة ${esc(T.settings.subject)}، سائلين الله له دوام التوفيق والسداد.</p></div>${teacherSig()}`,
  '@page{size:A4 landscape}.cert{border:3px double #c9a227;border-radius:6mm;padding:12mm;text-align:center;font-size:15pt}.ct{font-family:Amiri,serif;font-size:32pt}.nm{font-size:26pt;font-weight:700;margin:4mm 0;color:#1d5f3c}');
  refresh();
};
Acts['honor-send'] = (el) => {
  const [k, name, why] = honorOf(el.dataset.k);
  const s = smS();
  if (!phoneOk(s.phone)) { toast('أضف جوال ولي الأمر أولاً'); return; }
  honorLog(k);
  logAct('msg:honor', s.id);
  window.open(waLink(s.phone, `السلام عليكم ورحمة الله وبركاته\nولي أمر الطالب ${s.name} حفظه الله\nيسعدنا إبلاغكم بحصول ابنكم على «${name}» ${why} في مادة ${T.settings.subject}.\nبارك الله فيه وجزاكم خيراً.${sig()}`), '_blank');
  refresh();
};

// ---- منح وسام: يظهر على بطاقة الطالب ----
SMV.badge = () => {
  const mine = listOf('badges');
  return `${smHead('منح وسام')}<p class="hint">اضغط الوسام لمنحه. يظهر على بطاقة الطالب.</p>
    <div class="badges">${BADGES.map(([k, n, g, c]) => { const has = mine.filter((b) => b.k === k).length; return `<button type="button" class="bdg${has ? ' on' : ''}" style="--c:${c}" data-act="badge-give" data-k="${k}"><i>${ic(g)}${has > 1 ? `<b>${has}</b>` : ''}</i><span>${n}</span></button>`; }).join('')}</div>
    ${mine.length ? `<h4 class="sm-sec">أوسمته</h4><div class="sm-card">${mine.slice().reverse().map((b) => { const B = BADGES.find((x) => x[0] === b.k) || BADGES[0]; return `<div class="li"><i class="mini" style="--c:${B[3]}">${ic(B[2])}</i>${B[1]}<small>${b.d}</small><button type="button" class="x" data-act="sm-del" data-key="badges" data-id="${b.id}">${ic('x')}</button></div>`; }).join('')}</div>` : ''}`;
};
Acts['badge-give'] = (el) => { listOf('badges').push({ id: uid(), k: el.dataset.k, d: today() }); save(); refresh(); toast(`مُنح ${BADGES.find((b) => b[0] === el.dataset.k)[1]}`); };
Acts['sm-del'] = (el) => { if (!armed(el)) return; T[el.dataset.key][smSid] = listOf(el.dataset.key).filter((x) => x.id !== el.dataset.id); save(); refresh(); };
const badgesOf = (sid) => ((T.badges || {})[sid] || []);

// ---- تعيين قادة الفصل: لكل مهمة طالب واحد في الفصل ----
SMV.leader = () => {
  const s = smS();
  const roles = (T.roles = T.roles || {})[s.cls] || {};
  return `${smHead('تعيين قادة الفصل')}<div class="sm-card">${ROLES.map((r) => { const who = stuOf(roles[r]); const me = roles[r] === s.id; return `<div class="li role"><span class="grow"><b>${r}</b><small>${who ? esc(who.name) : 'لم يُعيَّن'}</small></span>
    <button type="button" class="${me ? 'ghost-btn' : 'blue-btn'} sm" data-act="role-set" data-r="${esc(r)}">${me ? 'ألغِ التعيين' : 'عيّنه'}</button></div>`; }).join('')}</div>`;
};
Acts['role-set'] = (el) => {
  const s = smS();
  T.roles = T.roles || {};
  const roles = (T.roles[s.cls] = T.roles[s.cls] || {});
  if (roles[el.dataset.r] === s.id) delete roles[el.dataset.r]; else roles[el.dataset.r] = s.id;
  save(); refresh();
};
const rolesOf = (s) => Object.entries(((T.roles || {})[s.cls]) || {}).filter(([, sid]) => sid === s.id).map(([r]) => r);

// ---- ملاحظات الطالب ----
SMV.notes = () => {
  const list = listOf('snotes');
  return `${smHead('ملاحظات الطالب')}<div class="sm-card"><textarea id="snoteT" rows="3" placeholder="اكتب ملاحظتك…"></textarea><button type="button" class="blue-btn wide" data-act="snote-add">${ic('plus')} أضف الملاحظة</button></div>
    ${list.length ? `<div class="sm-card">${list.slice().reverse().map((n) => `<div class="li"><span class="grow">${esc(n.t)}<small>${n.d}</small></span><button type="button" class="x" data-act="sm-del" data-key="snotes" data-id="${n.id}">${ic('trash')}</button></div>`).join('')}</div>` : ''}`;
};
Acts['snote-add'] = () => { const t = $('snoteT').value.trim(); if (!t) return; listOf('snotes').push({ id: uid(), t, d: today() }); save(); refresh(); };

// ---- الخطط التعليمية: علاجية أو إثرائية، وتُطبع ----
SMV.plans = () => {
  const list = listOf('plans');
  return `${smHead('الخطط التعليمية')}<form class="sm-card" data-submit="plan-add">
      <div class="seg2"><label><input type="radio" name="type" value="علاجية" checked> خطة علاجية</label><label><input type="radio" name="type" value="إثرائية"> خطة إثرائية</label></div>
      <label>المهارة أو الهدف<input name="goal" required placeholder="مثل: إتقان حفظ سورة النبأ"></label>
      <label>الإجراءات<textarea name="steps" rows="3" placeholder="كل إجراء في سطر"></textarea></label>
      <label>المدة<input name="dur" placeholder="مثل: أسبوعان"></label>
      <button class="blue-btn wide">${ic('plus')} أضف الخطة</button></form>
    ${list.length ? `<div class="sm-card">${list.slice().reverse().map((p) => `<div class="li"><span class="grow"><b>خطة ${p.type}: ${esc(p.goal)}</b><small>${p.d}${p.dur ? ` | ${esc(p.dur)}` : ''} | ${p.done ? 'تحققت' : 'جارية'}</small></span>
      <button type="button" class="ghost-btn sm" data-act="plan-done" data-id="${p.id}">${p.done ? 'أعدها جارية' : 'تحققت'}</button><button type="button" class="ghost-btn sm" data-act="plan-print" data-id="${p.id}">${ic('print')}</button><button type="button" class="x" data-act="sm-del" data-key="plans" data-id="${p.id}">${ic('trash')}</button></div>`).join('')}</div>` : ''}`;
};
Acts['plan-add'] = (f) => { listOf('plans').push({ id: uid(), type: f.elements.type.value, goal: f.elements.goal.value.trim(), steps: f.elements.steps.value.trim(), dur: f.elements.dur.value.trim(), d: today(), done: false }); save(); refresh(); };
Acts['plan-done'] = (el) => { const p = listOf('plans').find((x) => x.id === el.dataset.id); p.done = !p.done; save(); refresh(); };
Acts['plan-print'] = (el) => {
  const p = listOf('plans').find((x) => x.id === el.dataset.id), s = smS();
  printForm(`خطة ${p.type}`, `<h1>خطة ${p.type} فردية</h1>${stuTable(s)}<table><tr><th>المهارة أو الهدف</th><td>${esc(p.goal)}</td></tr><tr><th>الإجراءات</th><td>${esc(p.steps).replace(/\n/g, '<br>')}</td></tr><tr><th>المدة</th><td>${esc(p.dur)}</td></tr><tr><th>تاريخ البدء</th><td>${p.d}</td></tr><tr><th>النتيجة</th><td>${p.done ? 'تحققت' : '&nbsp;'}</td></tr></table>${teacherSig()}`);
};

// ---- عداد الاستئذان: خروج الطالب من الحصة وعودته ----
SMV.exits = () => {
  const list = listOf('exits');
  const open = list.find((x) => !x.end);
  const done = list.filter((x) => x.end);
  const mins = (x) => Math.max(1, Math.round((x.end - x.start) / 60000));
  return `${smHead('عداد الاستئذان')}<div class="sm-card center"><div class="exit-big${open ? ' run' : ''}">${ic('hourglass-half')}<b id="exitT">${open ? mmss(Math.floor((Date.now() - open.start) / 1000)) : `${done.length} مرة`}</b><small>${open ? 'خارج الفصل الآن' : 'مرات الاستئذان'}</small></div>
    <button type="button" class="${open ? 'blue-btn' : 'wa-btn'} wide" data-act="exit-go">${open ? 'عاد إلى الفصل' : 'خرج الآن'}</button></div>
    ${done.length ? `<div class="sm-card">${done.slice().reverse().map((x) => `<div class="li"><span class="grow">${x.d} | ${new Date(x.start).toTimeString().slice(0, 5)}<small>المدة: ${mins(x)} دقيقة</small></span><button type="button" class="x" data-act="sm-del" data-key="exits" data-id="${x.id}">${ic('trash')}</button></div>`).join('')}</div>` : ''}`;
};
Acts['exit-go'] = () => {
  const list = listOf('exits');
  const open = list.find((x) => !x.end);
  if (open) open.end = Date.now(); else list.push({ id: uid(), d: today(), start: Date.now(), end: 0 });
  save(); refresh();
};
// العدّاد يتحرك ما دامت صفحته مفتوحة
setInterval(() => { const el = $('exitT'); if (el && smView === 'exits') { const o = listOf('exits').find((x) => !x.end); if (o) el.textContent = mmss(Math.floor((Date.now() - o.start) / 1000)); } }, 1000);
const isOut = (sid) => ((T.exits || {})[sid] || []).some((x) => !x.end);

// ---- إشعار ضعف: يُرسل لولي الأمر ويُطبع ----
SMV.weak = () => {
  const list = listOf('weak');
  return `${smHead('إشعار ضعف')}<form class="sm-card" data-submit="weak-add"><p class="hint">مجال الضعف:</p><div class="chips">${WEAK_AREAS.map((a, i) => `<label class="chk"><input type="checkbox" name="area" value="${a}"${i ? '' : ''}> ${a}</label>`).join('')}</div>
      <label>ملاحظة أو توصية<textarea name="note" rows="2" placeholder="مثل: يحتاج مراجعة الحفظ في البيت يومياً"></textarea></label><button class="blue-btn wide">احفظ الإشعار</button></form>
    ${list.length ? `<div class="sm-card">${list.slice().reverse().map((w) => `<div class="li"><span class="grow"><b>${esc(w.areas.join('، '))}</b><small>${w.d}${w.note ? ` | ${esc(w.note)}` : ''}</small></span>
      <button type="button" class="wa-btn sm" data-act="weak-send" data-id="${w.id}">${ic('whatsapp')}</button><button type="button" class="ghost-btn sm" data-act="weak-print" data-id="${w.id}">${ic('print')}</button><button type="button" class="x" data-act="sm-del" data-key="weak" data-id="${w.id}">${ic('trash')}</button></div>`).join('')}</div>` : ''}`;
};
Acts['weak-add'] = (f) => {
  const areas = [...f.querySelectorAll('input[name=area]:checked')].map((x) => x.value);
  if (!areas.length) { toast('اختر مجال الضعف'); return; }
  listOf('weak').push({ id: uid(), areas, note: f.elements.note.value.trim(), d: today() }); save(); refresh();
};
Acts['weak-send'] = (el) => {
  const w = listOf('weak').find((x) => x.id === el.dataset.id), s = smS();
  if (!phoneOk(s.phone)) { toast('أضف جوال ولي الأمر أولاً'); return; }
  logAct('msg:weak', s.id);
  window.open(waLink(s.phone, `السلام عليكم ورحمة الله وبركاته\nولي أمر الطالب ${s.name} حفظه الله\nنفيدكم بملاحظة ضعف لدى ابنكم في مادة ${T.settings.subject} في: ${w.areas.join('، ')}.${w.note ? `\n${w.note}` : ''}\nنأمل متابعته، وثقتنا بكم كبيرة.${sig()}`), '_blank');
};
Acts['weak-print'] = (el) => {
  const w = listOf('weak').find((x) => x.id === el.dataset.id), s = smS();
  printForm('إشعار ضعف', `<h1>إشعار ضعف دراسي</h1>${stuTable(s)}<p>المكرم ولي أمر الطالب المذكور، السلام عليكم ورحمة الله وبركاته، نفيدكم بأن ابنكم يعاني ضعفاً في مادة ${esc(T.settings.subject)} في المجالات الآتية:</p>
    <table><tr><th>مجالات الضعف</th><td>${esc(w.areas.join('، '))}</td></tr><tr><th>التوصية</th><td>${esc(w.note) || '&nbsp;'}</td></tr><tr><th>التاريخ</th><td>${w.d}</td></tr></table>
    <p>نأمل التعاون معنا في متابعته. شاكرين تعاونكم.</p><div class="sig"><div>معلم المادة<b>${esc(T.settings.teacher || '')}</b></div><div>توقيع ولي الأمر<b>&nbsp;</b></div></div>`);
};

// ---- المشكلات السلوكية: سجل بالدرجة والإجراء، ويُطبع ----
SMV.problems = () => {
  const list = listOf('problems');
  return `${smHead('المشكلات السلوكية')}<form class="sm-card" data-submit="prob-add">
      <label>المشكلة<input name="what" list="probList" required placeholder="اختر أو اكتب"><datalist id="probList">${PROBLEM_TYPES.map((p) => `<option value="${p}">`).join('')}</datalist></label>
      <p class="hint">درجة المخالفة:</p><div class="seg2">${DEGREES.map((d, i) => `<label><input type="radio" name="deg" value="${d}"${i ? '' : ' checked'}> ${d}</label>`).join('')}</div>
      <label>الإجراء المتخذ<input name="act" placeholder="مثل: تنبيه شفهي، تواصل مع ولي الأمر"></label>
      <button class="blue-btn wide">${ic('plus')} سجّل المشكلة</button></form>
    ${list.length ? `<div class="sm-card">${list.slice().reverse().map((p) => `<div class="li"><span class="grow"><b>${esc(p.what)}</b><small>${p.d} | الدرجة ${p.deg}${p.act ? ` | ${esc(p.act)}` : ''}</small></span><button type="button" class="x" data-act="sm-del" data-key="problems" data-id="${p.id}">${ic('trash')}</button></div>`).join('')}</div>
      <button type="button" class="ghost-btn wide" data-act="prob-print">${ic('print')} اطبع سجل المشكلات</button>` : ''}`;
};
Acts['prob-add'] = (f) => { listOf('problems').push({ id: uid(), what: f.elements.what.value.trim(), deg: f.elements.deg.value, act: f.elements.act.value.trim(), d: today() }); save(); refresh(); };
Acts['prob-print'] = () => {
  const s = smS();
  printForm('سجل المشكلات السلوكية', `<h1>سجل المشكلات السلوكية</h1>${stuTable(s)}<table><tr><th style="width:auto">التاريخ</th><th style="width:auto">المشكلة</th><th style="width:auto">الدرجة</th><th style="width:auto">الإجراء المتخذ</th></tr>${listOf('problems').map((p) => `<tr><td>${p.d}</td><td>${esc(p.what)}</td><td>${p.deg}</td><td>${esc(p.act)}</td></tr>`).join('')}</table>${teacherSig()}`);
};

// ---- بطاقة وصول ولي الأمر: بطاقة باسم الطالب وفصله تُطبع ----
SMV.card = () => `${smHead('بطاقة وصول ولي الأمر')}<div class="sm-card center"><div class="pcard"><b>${esc(smS().name)}</b><span>${esc(clsOf(smS().cls) ? clsOf(smS().cls).name : '')}</span><small>${esc(T.settings.school || '')}</small></div>
  <button type="button" class="blue-btn wide" data-act="pcard-print">${ic('print')} اطبع البطاقة</button><p class="hint">إن كانت البطاقة في كشوف بشكل آخر، أرسل صورتها ليكون مثلها.</p></div>`;
Acts['pcard-print'] = () => {
  const s = smS();
  printForm('بطاقة وصول ولي الأمر', `<div class="pc"><h2>بطاقة وصول ولي الأمر</h2><div class="n">${esc(s.name)}</div><div>${esc(clsOf(s.cls) ? clsOf(s.cls).name : '')}</div><div class="ph">جوال ولي الأمر: ${esc(s.phone ? `0${s.phone.slice(3)}` : '..................')}</div></div>`,
    '.pc{width:90mm;margin:10mm auto;border:2px solid #3478f6;border-radius:5mm;padding:6mm;text-align:center}.pc h2{margin:0 0 3mm;color:#3478f6;font-size:13pt}.n{font-size:18pt;font-weight:700}.ph{margin-top:3mm;font-size:11pt}');
};

// ---- إحالة الطالب إلى الإدارة ----
SMV.refer = () => {
  const list = listOf('refers');
  return `${smHead('إحالة الطالب إلى الإدارة')}<form class="sm-card" data-submit="refer-add"><label>إلى<input name="to" value="وكيل شؤون الطلاب"></label>
    <label>سبب الإحالة<textarea name="why" rows="3" required></textarea></label><p class="hint">تُرفق بالنموذج المشكلات السلوكية المسجلة للطالب.</p>
    <button class="blue-btn wide">${ic('print')} احفظ واطبع نموذج الإحالة</button></form>
    ${list.length ? `<div class="sm-card">${list.slice().reverse().map((r) => `<div class="li"><span class="grow"><b>${esc(r.to)}</b><small>${r.d} | ${esc(r.why)}</small></span><button type="button" class="x" data-act="sm-del" data-key="refers" data-id="${r.id}">${ic('trash')}</button></div>`).join('')}</div>` : ''}`;
};
Acts['refer-add'] = (f) => {
  const r = { id: uid(), to: f.elements.to.value.trim() || 'وكيل شؤون الطلاب', why: f.elements.why.value.trim(), d: today() };
  listOf('refers').push(r); save(); refresh();
  const s = smS(), probs = listOf('problems');
  printForm('إحالة طالب', `<h1>نموذج إحالة طالب</h1><p>المكرم ${esc(r.to)} حفظه الله، السلام عليكم ورحمة الله وبركاته، أحيل إليكم الطالب الآتي للأسباب المذكورة:</p>${stuTable(s)}
    <table><tr><th>سبب الإحالة</th><td>${esc(r.why).replace(/\n/g, '<br>')}</td></tr><tr><th>الإجراءات السابقة</th><td>${probs.length ? probs.map((p) => `${p.d}: ${esc(p.what)} (${p.deg})${p.act ? `، ${esc(p.act)}` : ''}`).join('<br>') : 'لا يوجد'}</td></tr>
    <tr><th>الغياب | التأخر</th><td>${attCount(s, 'a')} | ${attCount(s, 'l')}</td></tr></table><div class="sig"><div>معلم المادة<b>${esc(T.settings.teacher || '')}</b></div><div>المستلم<b>&nbsp;</b></div></div>`);
};

// ---- نقل إلى فصل آخر ----
SMV.move = () => {
  const s = smS();
  const others = T.classes.filter((c) => c.id !== s.cls);
  return `${smHead('نقل إلى فصل آخر')}<div class="sm-group">${others.length ? others.map((c) => `<button type="button" class="sm-row" data-act="move-go" data-c="${c.id}"><i style="--c:#4a8ef0">${ic('users')}</i><span>${esc(c.name)}</span>${ic('next', 'chev')}</button>`).join('') : '<p class="hint" style="padding:12px">لا يوجد فصل آخر. أضف فصلاً من الصفحة الرئيسية.</p>'}</div>`;
};
Acts['move-go'] = (el) => {
  const s = smS();
  const from = s.cls;
  s.cls = el.dataset.c;
  for (const g of T.groups) g.members = g.members.filter((m) => m !== s.id);
  const roles = (T.roles || {})[from] || {};
  for (const r of Object.keys(roles)) if (roles[r] === s.id) delete roles[r];
  save(); closeSheet(); render();
  toast(`نُقل إلى ${clsOf(s.cls).name}`);
};

// ---- سجل التقييمات وبيانات الطالب ----
SMV.log = () => {
  const s = smS();
  const recent = behOf(s.id).sort((a, b) => b.at - a.at);
  return `${smHead('سجل التقييمات')}<div class="sm-card">${recent.length ? `<ul class="log">${recent.map((b) => { const e = evalOf(b.icon); return `<li><i style="--c:${e ? e.c : '#9aa3ad'}">${ic(e ? e.g : 'check')}</i><span class="grow">${esc(b.reason)}</span><em>${fmt1(b.w)}</em><small>${dateLabel(b.d)}</small><button type="button" class="x" data-act="ev-del" data-id="${b.id}" aria-label="احذف">${ic('x')}</button></li>`; }).join('')}</ul>` : '<p class="hint">لا تقييمات بعد.</p>'}</div>
    <p class="hint">الغياب: ${attCount(s, 'a')} | التأخر: ${attCount(s, 'l')} | الاستئذان: ${attCount(s, 'x')}</p>`;
};
Acts['ev-del'] = (el) => { if (!armed(el)) return; T.beh = T.beh.filter((b) => b.id !== el.dataset.id); save(); refresh(); };
SMV.edit = () => { const s = smS(); return `${smHead('بيانات الطالب')}<form class="sm-card" data-submit="stu-save" data-id="${s.id}">
  <label>اسم الطالب<input name="name" required value="${esc(s.name)}"></label>
  <label>جوال ولي الأمر (واتساب)<input name="phone" inputmode="tel" dir="ltr" value="${esc(s.phone)}" placeholder="05xxxxxxxx"></label><button class="blue-btn wide">احفظ</button></form>`; };

// ---- كشف الطالب كاملاً للطباعة ----
function printStudent(s) {
  const all = behOf(s.id);
  const by = {};
  for (const b of all) { const k = `${b.reason}|${b.w}`; by[k] = (by[k] || 0) + 1; }
  const m = T.marksYW[s.id] || {};
  printForm(`كشف ${s.name}`, `<h1>كشف متابعة طالب</h1>${stuTable(s)}
    <table><tr><th>مجموع النقاط</th><td>${fmtScore(scoreOf(s.id))}</td></tr><tr><th>الحضور</th><td>${ATT.slice(1).map(([k, n]) => `${n}: ${attCount(s, k)}`).join(' | ')}</td></tr>
    <tr><th>التقييمات</th><td>${Object.entries(by).map(([k, n]) => { const [r, w] = k.split('|'); return `${esc(r)} (${fmt1(Number(w))}): ${n}`; }).join('<br>') || 'لا يوجد'}</td></tr>
    <tr><th>أعمال السنة</th><td>${T.yw.map((y) => `${esc(y.name)}: ${typeof m[y.k] === 'number' ? m[y.k] : '-'} من ${y.max}`).join('<br>')}</td></tr>
    <tr><th>الأوسمة</th><td>${badgesOf(s.id).map((b) => (BADGES.find((x) => x[0] === b.k) || [])[1]).join('، ') || 'لا يوجد'}</td></tr>
    <tr><th>المهام في الفصل</th><td>${rolesOf(s).join('، ') || 'لا يوجد'}</td></tr>
    <tr><th>الملاحظات</th><td>${listOf('snotes').map((n) => `${n.d}: ${esc(n.t)}`).join('<br>') || 'لا يوجد'}</td></tr>
    <tr><th>المشكلات السلوكية</th><td>${listOf('problems').map((p) => `${p.d}: ${esc(p.what)} (${p.deg})`).join('<br>') || 'لا يوجد'}</td></tr></table>${teacherSig()}`);
}
