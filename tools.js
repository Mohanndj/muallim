'use strict';
// الأدوات: الفصل والطالب (إضافة وتعديل وحذف)، الاستيراد من إكسل أو نص، المجموعات، الاختيار العشوائي،
// رسائل أولياء الأمور، كشف إكسل، والإعدادات والنسخة الاحتياطية.

// ---- الفصل ----
Acts['cls-new'] = () => openSheet(`<form data-submit="cls-save"><h3>فصل جديد</h3>
  <label>اسم الفصل<input name="name" required placeholder="مثل: أول متوسط ١"></label>
  <button class="primary big">${ic('check')} احفظ</button></form>`);
Acts['cls-save'] = (f) => {
  const name = f.elements.name.value.trim();
  if (!name) return;
  if (f.dataset.id) { clsOf(f.dataset.id).name = name; save(); closeSheet(); render(); return; }
  const c = { id: uid(), name };
  T.classes.push(c);
  save(); closeSheet();
  go(`#c/${c.id}`);
  Acts['imp-open']();
};
Acts['cls-more'] = () => {
  const c = clsOf(UI.cls);
  openSheet(`<h3>${esc(c.name)}</h3><div class="menu">
    <button type="button" data-act="imp-open">${ic('plus')}<span>أضف طلاباً (إكسل أو لصق أسماء أو طالب واحد)</span></button>
    <button type="button" data-act="xlsx">${ic('file')}<span>كشف الفصل في ملف إكسل</span></button>
    <button type="button" data-act="cls-rename">${ic('edit')}<span>غيّر اسم الفصل</span></button>
    <button type="button" class="danger" data-act="cls-del">${ic('trash')}<span>احذف الفصل وطلابه</span></button></div>`);
};
Acts['cls-rename'] = () => {
  const c = clsOf(UI.cls);
  openSheet(`<form data-submit="cls-save" data-id="${c.id}"><h3>اسم الفصل</h3><label>الاسم<input name="name" required value="${esc(c.name)}"></label><button class="primary big">${ic('check')} احفظ</button></form>`);
};
Acts['cls-del'] = (el) => {
  if (!armed(el)) return;
  const id = UI.cls;
  const sids = new Set(studentsIn(id).map((s) => s.id));
  T.classes = T.classes.filter((c) => c.id !== id);
  T.students = T.students.filter((s) => s.cls !== id);
  T.beh = T.beh.filter((b) => !sids.has(b.sid));
  T.groups = T.groups.filter((g) => g.cls !== id);
  delete T.att[id];
  save(); closeSheet();
  go('#home');
  toast('حُذف الفصل');
};

// ---- الطالب ----
function stuForm(s) {
  return `<form data-submit="stu-save" data-id="${s ? s.id : ''}"><h3>${s ? 'بيانات الطالب' : 'طالب جديد'}</h3>
    <label>اسم الطالب<input name="name" required value="${esc(s ? s.name : '')}"></label>
    <label>جوال ولي الأمر (واتساب)<input name="phone" inputmode="tel" dir="ltr" class="latin" value="${esc(s ? s.phone : '')}" placeholder="05xxxxxxxx"></label>
    <label>اسم ولي الأمر (اختياري)<input name="parent" value="${esc(s ? s.parent : '')}"></label>
    <button class="primary big">${ic('check')} احفظ</button>
    ${s ? `<button type="button" class="danger big" data-act="stu-del" data-id="${s.id}">${ic('trash')} احذف الطالب</button>` : ''}</form>`;
}
Acts['stu-new'] = () => openSheet(stuForm(null));
Acts['stu-edit'] = (el) => openSheet(stuForm(stuOf(el.dataset.id)));
Acts['stu-save'] = (f) => {
  const v = (k) => f.elements[k].value.trim();
  if (!v('name')) return;
  const phone = normPhone(v('phone'));
  if (v('phone') && !phoneOk(phone)) { toast('رقم الجوال غير صحيح'); return; }
  if (f.dataset.id) {
    Object.assign(stuOf(f.dataset.id), { name: v('name'), phone, parent: v('parent') });
    save(); render(); stuId = f.dataset.id; openSheet(stuSheet(), stuSheet);
    return;
  }
  T.students.push({ id: uid(), cls: UI.cls, name: v('name'), phone, parent: v('parent') });
  save(); closeSheet(); render();
  toast('أُضيف الطالب');
};
Acts['stu-del'] = (el) => {
  if (!armed(el)) return;
  const id = el.dataset.id;
  T.students = T.students.filter((s) => s.id !== id);
  T.beh = T.beh.filter((b) => b.sid !== id);
  for (const g of T.groups) g.members = g.members.filter((m) => m !== id);
  for (const days of Object.values(T.att)) for (const day of Object.values(days)) delete day[id];
  save(); closeSheet(); render();
};

// ---- الاستيراد ----
let imp = null;
Acts['imp-open'] = () => {
  imp = null;
  openSheet(`<h3>أضف طلاب «${esc(clsOf(UI.cls).name)}»</h3>
    <label class="pick">${ic('file')}<span><b>من ملف إكسل</b><small>كشف الطلاب من نور، أو أي ملف فيه عمود «اسم الطالب» (وجوال ولي الأمر إن وُجد)</small></span><input type="file" id="impFile" accept=".xlsx" hidden></label>
    <p class="or">أو الصق الأسماء، كل طالب في سطر وبعده جواله إن شئت</p>
    <textarea id="impText" rows="5" placeholder="محمد عبدالله السالم 0551234567&#10;خالد أحمد العتيبي"></textarea>
    <button type="button" class="ghost big" data-act="imp-text">اعرض ما فهمته</button>
    <div id="impPrev"></div>
    <button type="button" class="link" data-act="stu-new">${ic('plus')} أضف طالباً واحداً</button>`);
};
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'impFile' || !e.target.files[0]) return;
  try {
    const sheets = await XlsxRead.read(e.target.files[0]);
    const rows = [];
    for (const sh of sheets) rows.push(...impFromSheet(sh));
    impPreview(rows);
  } catch { $('impPrev').innerHTML = '<p class="bad">تعذّرت قراءة الملف. تأكد أنه ملف إكسل بصيغة xlsx.</p>'; }
});
Acts['imp-text'] = () => impPreview(impFromText($('impText').value));
function impPreview(rows) {
  imp = rows.map((r) => ({ ...r, phone: normPhone(r.phone), name: r.name.replace(/\s+/g, ' ').trim() })).filter((r) => r.name);
  if (!imp.length) { $('impPrev').innerHTML = '<p class="bad">لم أجد أسماء طلاب. تأكد أن في الملف عموداً عنوانه «اسم الطالب» أو «الاسم».</p>'; return; }
  const withPhone = imp.filter((r) => phoneOk(r.phone)).length;
  $('impPrev').innerHTML = `<div class="prev"><div class="sums"><span>وجدت: ${imp.length} طالباً</span><span class="good">لهم جوال: ${withPhone}</span></div>
    <ol>${imp.slice(0, 6).map((r) => `<li>${esc(r.name)}</li>`).join('')}${imp.length > 6 ? `<li class="more">و${imp.length - 6} غيرهم</li>` : ''}</ol>
    <button type="button" class="primary big" data-act="imp-go">${ic('check')} أضف ${imp.length} طالباً</button></div>`;
  arDigits($('impPrev'));
}
Acts['imp-go'] = () => {
  let added = 0, updated = 0;
  for (const r of imp) {
    const same = T.students.find((s) => s.cls === UI.cls && s.name === r.name);
    if (same) { if (phoneOk(r.phone) && same.phone !== r.phone) { same.phone = r.phone; updated++; } continue; }
    T.students.push({ id: uid(), cls: UI.cls, name: r.name, parent: r.parent || '', phone: phoneOk(r.phone) ? r.phone : '' });
    added++;
  }
  save(); closeSheet(); render();
  toast(`أُضيف ${added} طالباً${updated ? `، وحُدّث جوال ${updated}` : ''}`);
};

// ---- الاختيار العشوائي (من الحاضرين) ----
let randDone = [];
Acts['rand-open'] = () => { randDone = []; openSheet(randSheet(''), null); };
function randSheet(name, left) {
  return `<h3>${ic('dice')} اختيار عشوائي</h3><div class="rand"><b id="randName">${name ? esc(name) : '؟'}</b></div>
    <button type="button" class="primary big" data-act="rand-go">${ic('dice')} اختر طالباً</button>
    ${left !== undefined ? `<p class="hint center">بقي ${left} لم يُختاروا</p>` : '<p class="hint center">من الحاضرين اليوم، ولا يتكرر حتى يُختار الجميع.</p>'}`;
}
Acts['rand-go'] = () => {
  const pool0 = studentsIn(UI.cls).filter((s) => attOf(s) !== 'a');
  if (!pool0.length) return;
  let pool = pool0.filter((s) => !randDone.includes(s.id));
  if (!pool.length) { randDone = []; pool = pool0; }
  const s = pool[Math.floor(Math.random() * pool.length)];
  randDone.push(s.id);
  if ($('randName')) $('randName').parentElement.classList.remove('hit');
  let k = 0;
  const spin = setInterval(() => {
    const el = $('randName');
    if (!el) { clearInterval(spin); return; }
    if (k++ < 14) { el.textContent = shortName(pool0[Math.floor(Math.random() * pool0.length)]); return; }
    clearInterval(spin);
    $('sheetBody').innerHTML = `${randSheet(s.name, pool.length - 1)}<button type="button" class="ghost big" data-act="stu-open" data-id="${s.id}">${ic('hand')} قيّمه</button>`;
    arDigits($('sheetBody'));
    $('randName').parentElement.classList.add('hit');
  }, 70);
};

// ---- المجموعات ----
const GROUP_COLORS = ['#16a34a', '#2563eb', '#e0a100', '#dc2626', '#7c3aed', '#0d9488'];
Acts['grp-open'] = () => openSheet(grpSheet(), grpSheet);
function grpSheet() {
  const gs = T.groups.filter((g) => g.cls === UI.cls);
  const pick = `<div class="chips">${[2, 3, 4, 5, 6].map((n) => `<button type="button" class="chip" data-act="grp-split" data-n="${n}">${n} مجموعات</button>`).join('')}</div>`;
  if (!gs.length) return `<h3>${ic('groups')} المجموعات</h3><p class="hint">قسّم الفصل عشوائياً إلى:</p>${pick}`;
  return `<h3>${ic('groups')} المجموعات</h3><div class="groups">${gs.map((g, i) => `<div class="grp" style="--c:${GROUP_COLORS[g.color % GROUP_COLORS.length]}"><b>المجموعة ${i + 1}</b>
    <ul>${g.members.map(stuOf).filter(Boolean).map((s) => `<li>${esc(shortName(s))}</li>`).join('')}</ul></div>`).join('')}</div>
    <p class="hint">قسّمها من جديد:</p>${pick}`;
}
Acts['grp-split'] = (el) => {
  const n = Number(el.dataset.n);
  const ids = studentsIn(UI.cls).filter((s) => attOf(s) !== 'a').map((s) => s.id);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  T.groups = T.groups.filter((g) => g.cls !== UI.cls);
  const gs = Array.from({ length: n }, (_, k) => ({ id: uid(), cls: UI.cls, name: '', color: k, members: [] }));
  ids.forEach((id, i) => gs[i % n].members.push(id));
  T.groups.push(...gs);
  save(); refresh();
};

// ---- رسائل أولياء الأمور ----
const teacherSig = () => (T.settings.teacher ? `\n${T.settings.teacher}` : '\nمعلم المادة');
// ملف الطالب: حضوره، وتقييماته بأيقوناتها وعددها
function fileText(s) {
  const all = behOf(s.id);
  const lines = (kind) => EVALS.filter((e) => e.kind === kind).map((e) => [e.name, all.filter((b) => b.icon === e.k).length]).filter(([, n]) => n).map(([n, c]) => `- ${n}: ${c}`);
  const other = all.filter((b) => !b.icon).map((b) => `- ${b.reason}`);
  const pos = lines('pos'), neg = lines('neg');
  return ar(`السلام عليكم ورحمة الله وبركاته
ولي أمر الطالب ${s.name} حفظه الله
هذا ملف ابنكم في مادة ${T.settings.subject} حتى ${dateLabel(today())}:
الغياب: ${attCount(s, 'a')} | التأخر: ${attCount(s, 'l')}
${pos.length ? `الإيجابيات:\n${pos.join('\n')}` : 'الإيجابيات: لا شيء بعد'}
${neg.length ? `الملاحظات:\n${neg.join('\n')}` : 'الملاحظات: لا شيء، ولله الحمد'}${other.length ? `\n${other.join('\n')}` : ''}
شاكرين تعاونكم.${teacherSig()}`);
}
Acts['send-file'] = (el) => window.open(waLink(stuOf(el.dataset.id).phone, fileText(stuOf(el.dataset.id))), '_blank');
// الغائبون اليوم: رسالة لكل ولي أمر، يرسلها بضغطة ثم يعود للتالي
let sentNow = new Set();
Acts['abs-notify'] = () => { sentNow = new Set(); openSheet(absSheet(), absSheet); };
function absSheet() {
  const abs = studentsIn(UI.cls).filter((s) => attOf(s) === 'a');
  return `<h3>${ic('send')} أبلغ أولياء الغائبين</h3><p class="hint">اضغط «أرسل» فيفتح واتساب والرسالة مكتوبة، ثم ارجع للتالي.</p>
    <ul class="send-list">${abs.map((s) => `<li class="${sentNow.has(s.id) ? 'sent' : ''}">${avatar(s)}<span class="grow">${esc(s.name)}</span>${phoneOk(s.phone)
      ? `<button type="button" class="${sentNow.has(s.id) ? 'ghost' : 'wa'} sm" data-act="abs-send" data-id="${s.id}">${sentNow.has(s.id) ? `${ic('check')} أُرسلت` : `${ic('send')} أرسل`}</button>` : '<span class="pill">بلا جوال</span>'}</li>`).join('')}</ul>
    <button type="button" class="ghost big" data-act="att-open">${ic('back')} رجوع للتحضير</button>`;
}
Acts['abs-send'] = (el) => {
  const s = stuOf(el.dataset.id);
  window.open(waLink(s.phone, ar(`السلام عليكم ورحمة الله وبركاته\nولي أمر الطالب ${s.name} حفظه الله\nنفيدكم بغياب ابنكم اليوم ${dateLabel(today())} عن حصة ${T.settings.subject}.${teacherSig()}`)), '_blank');
  sentNow.add(s.id);
  refresh();
};

// ---- كشف الفصل في إكسل ----
Acts.xlsx = () => {
  const c = clsOf(UI.cls);
  const list = studentsIn(c.id).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  const days = Object.keys(T.att[c.id] || {}).sort();
  const sheets = [
    { name: 'الكشف', columns: [{ title: 'م', width: 5 }, { title: 'الطالب', width: 30 }, { title: 'الغياب', width: 9 }, { title: 'التأخر', width: 9 }, { title: 'إيجابي', width: 9 }, { title: 'سلبي', width: 9 }, ...EVALS.map((e) => ({ title: e.name, width: 12 }))],
      rows: list.map((s, i) => { const all = behOf(s.id); const pos = all.filter((b) => b.kind === 'pos').length; return [i + 1, s.name, attCount(s, 'a'), attCount(s, 'l'), pos, all.length - pos, ...EVALS.map((e) => all.filter((b) => b.icon === e.k).length)]; }) },
    { name: 'الحضور', columns: [{ title: 'الطالب', width: 30 }, ...days.map((d) => ({ title: d, width: 11 }))],
      rows: list.map((s) => [s.name, ...days.map((d) => ({ a: 'غائب', l: 'متأخر' }[(T.att[c.id][d] || {})[s.id]] || 'حاضر'))]) },
    { name: 'التقييمات', columns: [{ title: 'التاريخ', width: 12 }, { title: 'الطالب', width: 30 }, { title: 'النوع', width: 9 }, { title: 'التقييم', width: 18 }],
      rows: T.beh.filter((b) => list.some((s) => s.id === b.sid)).sort((a, b) => a.at - b.at).map((b) => [b.d, stuOf(b.sid).name, b.kind === 'pos' ? 'إيجابي' : 'سلبي', b.reason]) },
  ];
  download(Xlsx.build(sheets), `muallim-${today()}.xlsx`);
};

// ---- الإعدادات ----
Views.settings = () => {
  const s = T.settings;
  return `<header class="bar"><button type="button" class="icon-btn" data-act="back" aria-label="رجوع">${ic('back')}</button><div class="bar-t"><h1>الإعدادات</h1></div></header>
  <form class="card" data-submit="set-save">
    <label>اسمك (يظهر في رسائل أولياء الأمور)<input name="teacher" value="${esc(s.teacher)}" placeholder="مثل: أ. محمد العتيبي"></label>
    <label>المادة<input name="subject" value="${esc(s.subject)}"></label>
    <button class="primary big">${ic('check')} احفظ</button></form>
  <div class="card"><h3>نسخة احتياطية</h3><p class="hint">بياناتك في هذا الجوال فقط. احفظ نسخة من حين لآخر، وبها تنقلها إلى جهاز آخر.</p>
    <div class="row2"><button type="button" class="ghost" data-act="bk-out">${ic('down')} احفظ نسخة</button><label class="ghost file">${ic('up')} استرجع نسخة<input type="file" id="bkIn" accept=".json,application/json" hidden></label></div></div>
  <div class="card"><button type="button" class="danger big" data-act="wipe">${ic('trash')} امسح كل البيانات</button></div>
  <p class="ver">مساعد المعلم | الإصدار ${APP_VERSION}</p>`;
};
Acts['set-save'] = (f) => {
  T.settings.teacher = f.elements.teacher.value.trim();
  T.settings.subject = f.elements.subject.value.trim() || 'الدراسات الإسلامية';
  save(); render(); toast('حُفظ');
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
  load(); go('#home');
  toast('مُسحت البيانات');
};

// ---- قراءة الأسماء من إكسل أو من نص ----
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
