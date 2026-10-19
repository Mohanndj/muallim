'use strict';
// The classes and their students (with the parent's name and WhatsApp number), importing them
// from an Excel file or pasted lines, and the settings page with the backup.

const backBtn = `<button type="button" class="back" data-act="go" data-tab="home">${ic('back')} الرئيسية</button>`;

Views.students = () => {
  if (!T.classes.length) {
    return `${backBtn}${pageHead('طلابي', 'فصولك وطلابها وأرقام أولياء أمورهم')}
      <div class="empty-state">${ic('users', 'big')}<h3>أضف فصلك الأول</h3><p>ثم أضف طلابه من ملف إكسل (كشف نور يصلح) أو بلصق أسمائهم.</p>
      <button type="button" class="primary" data-act="cls-new">${ic('plus')} أضف فصلاً</button></div>`;
  }
  const c = curCls();
  const list = studentsIn(c);
  const noPhone = list.filter((s) => !phoneOk(s.phone)).length;
  return `${backBtn}${pageHead('طلابي', 'فصولك وطلابها وأرقام أولياء أمورهم', `<button type="button" class="ghost sm" data-act="cls-new">${ic('plus')} فصل</button>`)}
    ${classChips() || `<div class="chips cls-chips"><span class="chip on">${esc(clsOf(c).name)}</span></div>`}
    <div class="card">
      <div class="row-between"><h3>${esc(clsOf(c).name)}${clsOf(c).demo ? ' <span class="tag">تجريبي</span>' : ''}</h3><button type="button" class="ghost sm" data-act="cls-edit" data-id="${c}">${ic('edit')} الفصل</button></div>
      <div class="facts"><span>الطلاب: ${list.length}</span>${noPhone ? `<span class="warn">بلا رقم ولي أمر: ${noPhone}</span>` : list.length ? `<span class="good">${ic('check')} كل الطلاب لهم رقم</span>` : ''}</div>
      <div class="btns"><button type="button" class="primary" data-act="imp-open">${ic('file')} أضف من إكسل أو بلصق الأسماء</button><button type="button" class="ghost" data-act="stu-new">${ic('plus')} طالب واحد</button></div>
    </div>
    ${list.length ? `<ul class="list">${list.map((s, i) => `<li><button type="button" class="li-btn" data-act="stu-profile" data-id="${s.id}">
      <span class="no">${i + 1}</span>${avatar(s)}<span class="grow"><b>${esc(s.name)}</b>${s.parent ? `<small>${esc(s.parent)}</small>` : ''}</span>
      ${phoneOk(s.phone) ? `<span class="tag good">${ic('phone')} رقم</span>` : '<span class="tag warn">بلا رقم</span>'}</button></li>`).join('')}</ul>` : '<p class="empty">لا طلاب في هذا الفصل بعد.</p>'}`;
};

Acts['cls-new'] = () => openSheet(`<form data-submit="cls-save"><h3>فصل جديد</h3>
  <label>اسم الفصل<input name="name" required placeholder="مثل: أول متوسط ٢"></label>
  <div class="sheet-actions"><button class="primary">احفظ</button><button type="button" class="ghost" data-act="close-sheet">إلغاء</button></div></form>`);
Acts['cls-edit'] = (el) => {
  const c = clsOf(el.dataset.id);
  openSheet(`<form data-submit="cls-save" data-id="${c.id}"><h3>الفصل</h3>
  <label>اسم الفصل<input name="name" required value="${esc(c.name)}"></label>
  <div class="sheet-actions"><button class="primary">احفظ</button><button type="button" class="danger" data-act="cls-del" data-id="${c.id}">${ic('trash')} احذف الفصل وطلابه</button></div></form>`);
};
Acts['cls-save'] = (f) => {
  const name = f.elements.name.value.trim();
  if (!name) return;
  if (f.dataset.id) clsOf(f.dataset.id).name = name;
  else { const c = { id: uid(), name }; T.classes.push(c); UI.cls = c.id; }
  save(); closeSheet(); go('students');
};
// a class and everything that belongs to it
function delClass(id) {
  const sids = new Set(studentsIn(id).map((s) => s.id));
  T.classes = T.classes.filter((c) => c.id !== id);
  T.students = T.students.filter((s) => s.cls !== id);
  T.beh = T.beh.filter((b) => !sids.has(b.sid));
  T.sent = T.sent.filter((x) => !sids.has(x.sid));
  T.groups = T.groups.filter((g) => g.cls !== id);
  for (const it of T.items.filter((i) => i.cls === id)) delete T.marks[it.id];
  T.items = T.items.filter((i) => i.cls !== id);
  if (T.queue && T.queue.list.some((m) => sids.has(m.sid))) T.queue = null;
}
Acts['cls-del'] = (el) => {
  if (!armed(el)) return;
  delClass(el.dataset.id);
  save(); closeSheet(); render();
  toast('حُذف الفصل');
};

function stuForm(s) {
  return `<form data-submit="stu-save" data-id="${s ? s.id : ''}"><h3>${s ? 'بيانات الطالب' : 'طالب جديد'}</h3>
    <label>اسم الطالب<input name="name" required value="${esc(s ? s.name : '')}"></label>
    <label>اسم ولي الأمر (اختياري)<input name="parent" value="${esc(s ? s.parent : '')}" placeholder="مثل: أبو عبدالله"></label>
    <label>جوال ولي الأمر (واتساب)<input name="phone" inputmode="tel" dir="ltr" class="latin" value="${esc(s ? s.phone : '')}" placeholder="05xxxxxxxx"></label>
    <label>الفصل<select name="cls">${T.classes.map((c) => `<option value="${c.id}"${(s ? s.cls : curCls()) === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
    <div class="sheet-actions"><button class="primary">احفظ</button>${s ? `<button type="button" class="danger" data-act="stu-del" data-id="${s.id}">${ic('trash')} احذف الطالب</button>` : '<button type="button" class="ghost" data-act="close-sheet">إلغاء</button>'}</div></form>`;
}
Acts['stu-new'] = () => openSheet(stuForm(null));
Acts['stu-edit'] = (el) => openSheet(stuForm(stuOf(el.dataset.id)));
Acts['stu-save'] = (f) => {
  const v = (k) => f.elements[k].value.trim();
  if (!v('name')) return;
  const data = { name: v('name'), parent: v('parent'), phone: normPhone(v('phone')), cls: v('cls') };
  if (v('phone') && !phoneOk(data.phone)) { toast('رقم الجوال غير صحيح'); return; }
  if (f.dataset.id) { Object.assign(stuOf(f.dataset.id), data); save(); render(); stuProfile(f.dataset.id); return; }
  T.students.push({ id: uid(), ...data });
  save(); closeSheet(); render();
};
Acts['stu-del'] = (el) => {
  if (!armed(el)) return;
  const id = el.dataset.id;
  T.students = T.students.filter((s) => s.id !== id);
  T.beh = T.beh.filter((b) => b.sid !== id);
  T.sent = T.sent.filter((x) => x.sid !== id);
  for (const g of T.groups) g.members = g.members.filter((m) => m !== id);
  for (const k of Object.keys(T.marks)) delete T.marks[k][id];
  save(); closeSheet(); render();
};

// ---- import: an Excel file (any column order, the header row is looked for) or pasted lines ----
let imp = null;
Acts['imp-open'] = (el, e, intro) => {
  imp = null;
  openSheet(`${intro ? `<p class="step-k">${intro}</p>` : ''}<h3>أضف الطلاب</h3>
    <div class="choice2">
      <label class="pick-file">${ic('file')}<b>من ملف إكسل</b><small>كشف الطلاب من نظام نور أو أي ملف فيه عمود «اسم الطالب»</small><input type="file" id="impFile" accept=".xlsx" hidden></label>
      <div class="pick-paste">${ic('edit')}<b>أو الصق الأسماء</b><small>كل طالب في سطر، وبعده جوال ولي أمره إن شئت</small></div>
    </div>
    <textarea id="impText" rows="6" placeholder="محمد عبدالله السالم 0551234567&#10;خالد أحمد العتيبي 0509876543"></textarea>
    <button type="button" class="ghost" data-act="imp-text">${ic('eye')} اعرض ما فهمته</button>
    <div id="impPrev"></div>`);
};
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'impFile' || !e.target.files[0]) return;
  try {
    const sheets = await XlsxRead.read(e.target.files[0]);
    const rows = [];
    for (const sh of sheets) rows.push(...impFromSheet(sh));
    impPreview(rows);
  } catch { $('impPrev').innerHTML = '<p class="warn">تعذّرت قراءة الملف. تأكد أنه ملف إكسل بصيغة xlsx.</p>'; }
});
Acts['imp-text'] = () => impPreview(impFromText($('impText').value));

const H_NAME = /اسم\s*الطالب|^الاسم|^اسم$|الاسم\s*الرباعي|الاسم\s*الكامل|^name/i;
const H_PHONE = /جوال|هاتف|موبايل|الجوال|رقم\s*التواصل|phone|mobile/i;
const H_PARENT = /ولي\s*الأمر|ولي\s*امر|اسم\s*الأب|اسم\s*الوالد|parent/i;
const H_CLASS = /الفصل|الشعبة|الصف|class/i;
function impFromSheet(sh) {
  let maxR = 0, maxC = 0;
  for (const k of sh.cells.keys()) { const [r, c] = k.split(',').map(Number); maxR = Math.max(maxR, r); maxC = Math.max(maxC, c); }
  // the header: the first row (of the first 15) with a name column
  let head = 0;
  const cols = {};
  for (let r = 1; r <= Math.min(15, maxR) && !head; r++) {
    for (let c = 1; c <= maxC; c++) {
      const v = String(sh.get(r, c) ?? '').trim();
      if (!v) continue;
      if (H_PARENT.test(v) && !H_PHONE.test(v)) cols.parent = cols.parent || c;
      else if (H_PHONE.test(v)) cols.phone = cols.phone || c;
      else if (H_NAME.test(v)) cols.name = cols.name || c;
      else if (H_CLASS.test(v) && v.length < 20) cols.cls = cols.cls || c;
    }
    if (cols.name) head = r; else for (const k of Object.keys(cols)) delete cols[k];
  }
  const out = [];
  if (head) {
    for (let r = head + 1; r <= maxR; r++) {
      const name = String(sh.get(r, cols.name) ?? '').trim();
      if (!name || /^\d+$/.test(latin(name))) continue;
      out.push({ name, phone: cols.phone ? String(sh.get(r, cols.phone) ?? '') : '', parent: cols.parent ? String(sh.get(r, cols.parent) ?? '').trim() : '', cls: cols.cls ? String(sh.get(r, cols.cls) ?? '').trim() : '' });
    }
    return out;
  }
  // no header: each row, the longest text with two words or more is the name, a long number the phone
  for (let r = 1; r <= maxR; r++) {
    let name = '', phone = '';
    for (let c = 1; c <= maxC; c++) {
      const v = String(sh.get(r, c) ?? '').trim();
      if (/^\+?\d[\d\s-]{8,}$/.test(latin(v))) phone = phone || v;
      else if (/\S+\s+\S+/.test(v) && !/\d/.test(latin(v)) && v.length > name.length) name = v;
    }
    if (name) out.push({ name, phone, parent: '', cls: '' });
  }
  return out;
}
function impFromText(text) {
  const out = [];
  for (let line of String(text || '').split(/\r?\n/)) {
    line = line.replace(/^\s*[\d٠-٩]+\s*[-.)–]\s*/, '').trim();
    if (!line) continue;
    const ph = latin(line).match(/\+?\d[\d\s-]{7,}\d/);
    let phone = '';
    if (ph) { phone = ph[0]; line = latin(line).replace(ph[0], ' ').replace(/[\d]/g, '').trim(); }
    const parts = line.split(/\t|[،,|؛]/).map((x) => x.trim()).filter(Boolean);
    if (!parts.length) continue;
    out.push({ name: parts[0], parent: parts[1] || '', phone, cls: '' });
  }
  return out;
}
function impPreview(rows) {
  rows = rows.map((r) => ({ ...r, phone: normPhone(r.phone) }));
  const byCls = [...new Set(rows.map((r) => r.cls).filter(Boolean))];
  imp = rows;
  if (!rows.length) { $('impPrev').innerHTML = '<p class="warn">لم أجد أسماء طلاب. تأكد أن في الملف عموداً عنوانه «اسم الطالب» أو «الاسم».</p>'; return; }
  const bad = rows.filter((r) => r.phone && !phoneOk(r.phone)).length;
  $('impPrev').innerHTML = `<div class="card soft"><div class="facts"><span>وجدت: ${rows.length} طالباً</span><span class="good">لهم رقم: ${rows.filter((r) => phoneOk(r.phone)).length}</span>${bad ? `<span class="warn">أرقام غير مفهومة: ${bad}</span>` : ''}</div>
    <ol class="prev">${rows.slice(0, 8).map((r) => `<li>${esc(r.name)}${r.phone ? ` <span class="latin muted" dir="ltr">${esc(r.phone)}</span>` : ''}${r.cls ? ` <small>(${esc(r.cls)})</small>` : ''}</li>`).join('')}${rows.length > 8 ? `<li class="more">و${rows.length - 8} غيرهم</li>` : ''}</ol>
    <label>أضفهم إلى<select id="impCls">${byCls.length > 1 ? '<option value="*">فصولهم كما في الملف (تُنشأ الفصول الناقصة)</option>' : ''}${T.classes.map((c) => `<option value="${c.id}"${c.id === UI.cls ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}<option value="+">فصل جديد…</option></select></label>
    <input id="impNew" placeholder="اسم الفصل الجديد" value="${esc(byCls[0] || '')}" ${T.classes.length ? 'hidden' : ''}>
    <p class="hint">الطالب الموجود بالاسم نفسه في الفصل لا يتكرر، ويُحدَّث رقمه إن كان في الملف رقم.</p>
    <button type="button" class="primary big" data-act="imp-go">${ic('check')} أضف ${rows.length} طالباً</button></div>`;
  arDigits($('impPrev'));
  if (!T.classes.length) $('impCls').value = byCls.length > 1 ? '*' : '+';
}
document.addEventListener('change', (e) => { if (e.target.id === 'impCls') $('impNew').hidden = e.target.value !== '+'; });
Acts['imp-go'] = () => {
  if (!imp) return;
  const pick = $('impCls').value;
  const classByName = (name) => {
    let c = T.classes.find((k) => k.name.trim() === name.trim());
    if (!c) { c = { id: uid(), name: name.trim() }; T.classes.push(c); }
    return c.id;
  };
  let target = pick;
  if (pick === '+') { const n = $('impNew').value.trim(); if (!n) { toast('اكتب اسم الفصل'); return; } target = classByName(n); }
  let added = 0, updated = 0;
  for (const r of imp) {
    const cid = pick === '*' ? classByName(r.cls || 'فصل بلا اسم') : target;
    const same = T.students.find((s) => s.cls === cid && s.name.replace(/\s+/g, ' ') === r.name.replace(/\s+/g, ' '));
    if (same) { if (phoneOk(r.phone) && same.phone !== r.phone) { same.phone = r.phone; updated++; } if (r.parent && !same.parent) same.parent = r.parent; continue; }
    T.students.push({ id: uid(), cls: cid, name: r.name.replace(/\s+/g, ' '), parent: r.parent, phone: phoneOk(r.phone) ? r.phone : '' });
    added++;
  }
  UI.cls = pick === '*' ? UI.cls : target;
  T.settings.onboarded = true;
  save(); closeSheet(); render();
  toast(`أُضيف ${added} طالباً${updated ? `، وحُدّث رقم ${updated}` : ''}`);
};

// ---- settings and backup ----
Views.settings = () => {
  const s = T.settings;
  return `${backBtn}${pageHead('الإعدادات', 'بياناتك، وما يُحسب في التطبيق، ونسختك الاحتياطية')}
  <form class="card" data-submit="set-save"><h3>${ic('users')} بياناتك</h3>
    <label>اسمك كما يظهر في الرسائل والشهادات<input name="teacher" value="${esc(s.teacher)}" placeholder="مثل: أ. محمد العتيبي"></label>
    <label>المادة<input name="subject" value="${esc(s.subject)}"></label>
    <label>المدرسة (اختياري)<input name="school" value="${esc(s.school)}"></label>
    <label>جوالك (واتساب) لتصلك نتائج الطلاب في الاختبارات<input name="phone" inputmode="tel" dir="ltr" class="latin" value="${esc(s.phone)}" placeholder="05xxxxxxxx"></label>
    <h3 class="mt">${ic('alert')} التنبيهات</h3>
    <label>نبّهني إذا بلغت الملاحظات السلبية على طالب في الأسبوع<input name="negAlert" inputmode="numeric" value="${ar(s.negAlert)}"></label>
    <label>الطالب متعثر إذا قلّت نسبته في الدرجات عن (٪)<input name="pass" inputmode="numeric" value="${ar(s.pass)}"></label>
    <label class="check"><input type="checkbox" name="showAns"${s.showAns ? ' checked' : ''}> يرى الطالب الإجابات الصحيحة بعد إنهاء الاختبار</label>
    <button class="primary">احفظ</button>
  </form>
  <div class="card"><h3>${ic('star')} أسباب الملاحظات وفروع المادة</h3><p class="hint">كل سبب في سطر. تظهر أزراراً عند تسجيل ملاحظة. كل ملاحظة إيجابية نقطة للطالب في مستواه ولوحة الشرف؛ والسلبية لا تظهر في شاشة الفصل أبداً.</p>
    <label>الإيجابية<textarea id="rPos" rows="5">${esc(T.reasons.pos.join('\n'))}</textarea></label>
    <label>السلبية<textarea id="rNeg" rows="5">${esc(T.reasons.neg.join('\n'))}</textarea></label>
    <label>فروع المادة (للدرجات والاختبارات)<textarea id="rSkills" rows="4">${esc(T.skills.join('\n'))}</textarea></label>
    <button type="button" class="primary" data-act="reasons-save">احفظ</button></div>
  <div class="card"><h3>${ic('medal')} المستويات</h3><p class="hint">يرتقي الطالب بنقاطه في الفصل الدراسي:</p>
    <div class="lv-list">${LEVELS.filter((l) => l.tier).map((l) => `<div>${levelBadge(l.min)}<small>من ${l.min} نقطة</small></div>`).join('')}</div></div>
  <div class="card"><h3>${ic('down')} نسخة احتياطية</h3><p>بياناتك محفوظة في هذا الجوال فقط. احفظ نسخة من حين لآخر، وبها تنقل بياناتك إلى جهاز آخر (مثل حاسب الفصل).</p>
    <div class="btns"><button type="button" class="primary" data-act="bk-out">${ic('down')} احفظ نسخة</button><label class="file-btn">${ic('up')} استرجع نسخة<input type="file" id="bkIn" accept=".json,application/json" hidden></label></div></div>
  <div class="card"><h3>${ic('book')} عن التطبيق</h3><p class="hint">مساعد المعلم، الإصدار ${APP_VERSION}</p>
    <div class="btns"><button type="button" class="ghost sm" data-act="welcome">أعد عرض الترحيب</button>${s.hideSetup ? '<button type="button" class="ghost sm" data-act="setup-show">أظهر خطوات البداية</button>' : ''}</div>
    <button type="button" class="danger mt" data-act="wipe">${ic('trash')} امسح كل البيانات</button></div>`;
};
Acts['setup-show'] = () => { T.settings.hideSetup = false; save(); go('home'); };
Acts['set-save'] = (f) => {
  const v = (k) => f.elements[k].value.trim();
  const ph = normPhone(v('phone'));
  if (v('phone') && !phoneOk(ph)) { toast('رقم جوالك غير صحيح'); return; }
  Object.assign(T.settings, { teacher: v('teacher'), subject: v('subject') || 'الدراسات الإسلامية', school: v('school'), phone: ph,
    negAlert: num(v('negAlert')) > 0 ? num(v('negAlert')) : 3, pass: num(v('pass')) > 0 ? Math.min(100, num(v('pass'))) : 60, showAns: f.elements.showAns.checked });
  save(); render(); toast('حُفظت الإعدادات');
};
Acts['reasons-save'] = () => {
  const lines = (id) => $(id).value.split('\n').map((x) => x.trim()).filter(Boolean);
  if (lines('rPos').length) T.reasons.pos = lines('rPos');
  if (lines('rNeg').length) T.reasons.neg = lines('rNeg');
  if (lines('rSkills').length) T.skills = lines('rSkills');
  save(); render(); toast('حُفظت');
};
Acts['bk-out'] = () => download(new Blob([JSON.stringify({ app: 'muallim', v: APP_VERSION, at: Date.now(), data: T })], { type: 'application/json' }), `muallim-backup-${today()}.json`);
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'bkIn' || !e.target.files[0]) return;
  try {
    const j = JSON.parse(await e.target.files[0].text());
    if (j.app !== 'muallim' || !j.data) throw new Error('not ours');
    T = normalize(j.data); save(); render(); toast('استُرجعت النسخة');
  } catch { toast('هذا الملف ليس نسخة من «مساعد المعلم»'); }
});
Acts.wipe = (el) => {
  if (!armed(el)) return;
  localStorage.removeItem(KEY);
  load(); go('home'); openWelcome();
  toast('مُسحت البيانات');
};
