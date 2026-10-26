'use strict';
// الأدوات الخاصة، والفصل والطالب (إضافة وتعديل وحذف واستيراد)، ورسائل أولياء الأمور، وكشف إكسل، والإعدادات.

// ---- الأدوات الخاصة ----
const TOOL_GAMES = [
  ['minute', 'الدقيقة الواحدة', 'فكر وأجب', 'stopwatch', 'linear-gradient(160deg,#efe6ff,#cdb6f5)', '#7a40e0'],
  ['peer', 'أسأل زميلك', 'التعلم بالأقران', 'comments', 'linear-gradient(160deg,#e4efff,#b6cff5)', '#2f6fe0'],
  ['pick', 'من يجيب؟', 'اختيار عشوائي', 'hand-pointer', 'linear-gradient(160deg,#eff7d9,#d9eaa8)', '#5c8a12'],
];
const TOOL_ACAD = [['notes', 'المفكرة', 'ملاحظات المعلم', 'note-sticky', '#f2a03c']];
const TOOL_MGMT = [
  ['timer', 'المؤقت', 'إدارة زمن الحصة', 'hourglass-half', '#8e5cf0'],
  ['calm', 'كأس الهدوء', 'ضبط ضجيج الفصل', 'trophy', '#2f6fe0'],
  ['groups', 'مجموعات التعلم', 'تعلم تشاركي', 'people-group', '#7a6cf0'],
  ['secret', 'الطالب السري', 'مكافأة الانضباط الخفي', 'user-secret', '#111'],
];
const toolRow = ([k, n, sub, g, c]) => `<button type="button" class="tool" data-act="tool" data-k="${k}"><i style="--c:${c}">${ic(g)}</i><span><b>${n}</b><small>${sub}</small></span>${ic('next', 'chev')}</button>`;
function viewTools() {
  return `${classHead()}
    <section class="tsec"><h2><i class="ts-ic" style="--c:#f2a03c">${ic('bolt')}</i>التفاعل والألعاب</h2>
      <div class="games">${TOOL_GAMES.map(([k, n, sub, g, bg, c]) => `<button type="button" class="game" style="background:${bg};--c:${c}" data-act="tool" data-k="${k}"><span class="g-art">${ic(g)}</span><b>${n}</b><small>${sub}</small></button>`).join('')}</div></section>
    <section class="tsec"><h2><i class="ts-ic" style="--c:#2f6fe0">${ic('book')}</i>الأدوات الأكاديمية والإنجاز</h2><div class="tools-grid">${TOOL_ACAD.map(toolRow).join('')}</div></section>
    <section class="tsec"><h2><i class="ts-ic" style="--c:#2f6fe0">${ic('user')}</i>إدارة الصف والسلوك</h2><div class="tools-grid">${TOOL_MGMT.map(toolRow).join('')}</div></section>`;
}
const present = () => studentsIn(UI.cls).filter((s) => !['a', 'e', 'h'].includes(attOf(s)));
const rand = (list) => list[Math.floor(Math.random() * list.length)];
let toolTimer = null, actx = null, mic = null;
function beep(n = 3) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < n; i++) { const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.35; o.frequency.value = 880; g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.32); }
  } catch { /* no sound */ }
}
// ما يعمل في الخلفية يتوقف بإغلاق النافذة
function onSheetClose() {
  clearInterval(toolTimer); toolTimer = null;
  if (mic) { mic.getTracks().forEach((t) => t.stop()); mic = null; }
  if (pfD) { pfOrphans(); pfD = null; }
}
Acts.tool = (el) => (logAct(`tool:${el.dataset.k}`), { minute: () => countdown('الدقيقة الواحدة', 60, true), timer: () => timerSheet(), peer: peerSheet, pick: pickSheet, notes: notesSheet, calm: calmSheet, groups: groupsSheet, secret: secretSheet }[el.dataset.k])();

// العدّ التنازلي (الدقيقة الواحدة والمؤقت)
let cd = null;
function countdown(title, secs, fixed) {
  onSheetClose();
  cd = { title, total: secs, left: secs, run: false, fixed };
  openSheet(cdHTML(), cdHTML, 'wide');
}
const mmss = (s) => `${Math.floor(s / 60)}:${pad(s % 60)}`;
function cdHTML() {
  const R = 2 * Math.PI * 54;
  return `<h3 class="center">${cd.title}</h3><div class="cd"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="r-bg"/><circle cx="60" cy="60" r="54" class="r-fg" id="cdRing" style="stroke-dasharray:${R};stroke-dashoffset:${R * (1 - cd.left / cd.total)}"/></svg><b id="cdT" class="${cd.left ? '' : 'end'}">${cd.left ? mmss(cd.left) : 'انتهى الوقت'}</b></div>
    ${cd.fixed ? '' : `<div class="chips">${[1, 2, 3, 5, 10, 15].map((m) => `<button type="button" class="chip${cd.total === m * 60 ? ' on' : ''}" data-act="cd-set" data-m="${m}">${m} د</button>`).join('')}</div>`}
    <div class="row2"><button type="button" class="blue-btn" data-act="cd-go">${cd.run ? 'إيقاف' : cd.left && cd.left < cd.total ? 'أكمل' : 'ابدأ'}</button><button type="button" class="ghost-btn" data-act="cd-reset">من جديد</button></div>`;
}
function timerSheet() { countdown('المؤقت', 300, false); }
Acts['cd-set'] = (el) => { clearInterval(toolTimer); cd = { ...cd, total: el.dataset.m * 60, left: el.dataset.m * 60, run: false }; refresh(); };
Acts['cd-reset'] = () => { clearInterval(toolTimer); cd.left = cd.total; cd.run = false; refresh(); };
Acts['cd-go'] = () => {
  if (cd.run) { clearInterval(toolTimer); cd.run = false; refresh(); return; }
  if (!cd.left) cd.left = cd.total;
  cd.run = true;
  const end = Date.now() + cd.left * 1000;
  toolTimer = setInterval(() => {
    cd.left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    const R = 2 * Math.PI * 54;
    if ($('cdT')) $('cdT').textContent = cd.left ? mmss(cd.left) : 'انتهى الوقت';
    if ($('cdRing')) $('cdRing').style.strokeDashoffset = R * (1 - cd.left / cd.total);
    if (!cd.left) { clearInterval(toolTimer); cd.run = false; beep(); refresh(); }
  }, 250);
  refresh();
};

// أسأل زميلك: طالب يسأل وآخر يجيب
function peerSheet() {
  const p = present();
  if (p.length < 2) { toast('يحتاج طالبين حاضرين على الأقل'); return; }
  const a = rand(p), b = rand(p.filter((s) => s !== a));
  openSheet(`<h3 class="center">أسأل زميلك</h3><div class="pair"><div><small>يسأل</small>${AVATAR}<b>${esc(shortName(a))}</b></div><span>${ic('comments')}</span><div><small>يجيب</small>${AVATAR}<b>${esc(shortName(b))}</b></div></div>
    <button type="button" class="blue-btn wide" data-act="tool" data-k="peer">زوج آخر</button>`, null, 'wide');
}
// من يجيب؟ اختيار عشوائي من الحاضرين بلا تكرار حتى يُختار الجميع
let picked = [];
function pickSheet(s) {
  openSheet(`<h3 class="center">من يجيب؟</h3><div class="pick-box">${AVATAR}<b id="pickN">${s ? esc(s.name) : '؟'}</b></div>
    <button type="button" class="blue-btn wide" data-act="pick-go">اختر طالباً</button>${s ? `<button type="button" class="ghost-btn wide" data-act="eval-open" data-id="${s.id}">قيّمه</button>` : ''}`, null, 'wide');
}
Acts['pick-go'] = () => {
  const p = present();
  if (!p.length) return;
  let pool = p.filter((s) => !picked.includes(s.id));
  if (!pool.length) { picked = []; pool = p; }
  const s = rand(pool);
  picked.push(s.id);
  let k = 0;
  clearInterval(toolTimer);
  toolTimer = setInterval(() => {
    if (!$('pickN')) { clearInterval(toolTimer); return; }
    if (k++ < 14) { $('pickN').textContent = shortName(rand(p)); return; }
    clearInterval(toolTimer);
    pickSheet(s);
  }, 70);
};
// المفكرة: ملاحظات المعلم لهذا الفصل
function notesSheet() {
  openSheet(`<h3>المفكرة</h3><textarea id="noteT" rows="12" data-input="note" placeholder="ملاحظاتك على هذا الفصل…">${esc(T.notes[UI.cls] || '')}</textarea><p class="hint">تُحفظ وحدها.</p>`);
}
Inputs.note = (el) => { T.notes[UI.cls] = el.value; save(); };
// كأس الهدوء: يمتلئ الكأس ما دام الفصل هادئاً (بميكروفون الجوال)، ويتوقف إذا ارتفع الصوت
let calm = null;
function calmSheet() {
  calm = { fill: 0, loud: 0, limit: 55 };
  openSheet(`<h3 class="center">كأس الهدوء</h3><div class="cup"><div class="cup-in"><i id="cupF" style="height:0%"></i></div><b id="cupT">اضغط «ابدأ»</b></div>
    <label class="center">الحساسية<input type="range" id="calmLim" min="30" max="85" value="55"></label>
    <button type="button" class="blue-btn wide" data-act="calm-go">ابدأ</button><p class="hint center">يستعمل ميكروفون الجوال لقياس الصوت فقط، ولا يسجّل شيئاً.</p>`, null, 'wide');
}
Acts['calm-go'] = async () => {
  if (mic) return;
  try {
    mic = await navigator.mediaDevices.getUserMedia({ audio: true });
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const an = actx.createAnalyser(); an.fftSize = 512;
    actx.createMediaStreamSource(mic).connect(an);
    const buf = new Uint8Array(an.fftSize);
    toolTimer = setInterval(() => {
      an.getByteTimeDomainData(buf);
      let sum = 0; for (const v of buf) sum += (v - 128) ** 2;
      const level = Math.min(100, Math.sqrt(sum / buf.length) * 3);
      const lim = 100 - Number(($('calmLim') || { value: 55 }).value);
      const loud = level > lim;
      calm.fill = Math.max(0, Math.min(100, calm.fill + (loud ? -2 : 0.25)));
      if ($('cupF')) { $('cupF').style.height = `${calm.fill}%`; $('cupF').classList.toggle('loud', loud); }
      if ($('cupT')) $('cupT').textContent = calm.fill >= 100 ? 'امتلأ الكأس! أحسنتم' : loud ? 'الصوت مرتفع' : 'هدوء… الكأس يمتلئ';
      if (calm.fill >= 100) { clearInterval(toolTimer); beep(2); }
    }, 200);
  } catch { toast('لم يُسمح باستعمال الميكروفون'); }
};
// مجموعات التعلم
const GROUP_COLORS = ['#5fcf80', '#3f8ee6', '#f2b45a', '#ee4d6a', '#7a40e0', '#4fcdb6'];
function groupsSheet() { openSheet(grpHTML(), grpHTML, 'wide'); }
function grpHTML() {
  const gs = T.groups.filter((g) => g.cls === UI.cls);
  return `<h3>مجموعات التعلم</h3><p class="hint">قسّم الحاضرين عشوائياً إلى:</p><div class="chips">${[2, 3, 4, 5, 6].map((n) => `<button type="button" class="chip" data-act="grp-split" data-n="${n}">${n} مجموعات</button>`).join('')}</div>
    ${gs.length ? `<div class="groups">${gs.map((g, i) => `<div class="grp" style="--c:${GROUP_COLORS[g.color % GROUP_COLORS.length]}"><b>المجموعة ${i + 1}</b><ul>${g.members.map(stuOf).filter(Boolean).map((s) => `<li>${esc(shortName(s))}</li>`).join('')}</ul></div>`).join('')}</div>` : ''}`;
}
Acts['grp-split'] = (el) => {
  const n = Number(el.dataset.n);
  const ids = present().map((s) => s.id);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  T.groups = T.groups.filter((g) => g.cls !== UI.cls);
  const gs = Array.from({ length: n }, (_, k) => ({ id: uid(), cls: UI.cls, name: '', color: k, members: [] }));
  ids.forEach((id, i) => gs[i % n].members.push(id));
  T.groups.push(...gs);
  save(); refresh();
};
// الطالب السري: يُختار سراً، ويُكشف آخر الحصة، فإن التزم نال «مميز سلوكيًا»
let secret = null;
function secretSheet() {
  openSheet(secret && secret.cls === UI.cls ? `<h3 class="center">الطالب السري</h3><div class="pick-box">${AVATAR}<b>${secret.shown ? esc(stuOf(secret.sid).name) : '؟ مخفي'}</b></div>
    ${secret.shown ? `<div class="row2"><button type="button" class="blue-btn" data-act="secret-ok">التزم: امنحه «مميز سلوكيًا»</button><button type="button" class="ghost-btn" data-act="secret-end">لم يلتزم</button></div>` : '<button type="button" class="blue-btn wide" data-act="secret-show">اكشف الطالب</button>'}`
    : `<h3 class="center">الطالب السري</h3><p class="center hint">يُختار طالب سراً، وأخبر الطلاب أن انضباطه سيُكافأ آخر الحصة.</p><button type="button" class="blue-btn wide" data-act="secret-new">اختر طالباً سرياً</button>`, null, 'wide');
}
Acts['secret-new'] = () => { const p = present(); if (!p.length) return; secret = { cls: UI.cls, sid: rand(p).id, shown: false }; secretSheet(); };
Acts['secret-show'] = () => { secret.shown = true; secretSheet(); };
Acts['secret-end'] = () => { secret = null; closeSheet(); };
Acts['secret-ok'] = () => {
  const e = T.evals.find((x) => x.k === 'beh') || T.evals.filter((x) => x.w > 0).sort((a, b) => b.w - a.w)[0];
  if (e) T.beh.push({ id: uid(), sid: secret.sid, d: today(), at: Date.now(), icon: e.k, reason: e.name, w: e.w });
  save(); toast(`${e ? e.name : 'أحسنت'}: ${shortName(stuOf(secret.sid))}`); secret = null; closeSheet(); render();
};

// ---- الفصل ----
Acts['cls-new'] = (el, e) => { if (e) e.stopPropagation(); openSheet(`<form data-submit="cls-save"><h3>فصل جديد</h3><label>اسم الفصل<input name="name" required placeholder="مثل: أول متوسط أ"></label><button class="blue-btn wide">احفظ</button></form>`); };
Acts['cls-save'] = (f) => {
  const name = f.elements.name.value.trim();
  if (!name) return;
  if (f.dataset.id) { clsOf(f.dataset.id).name = name; save(); closeSheet(); render(); return; }
  const c = { id: uid(), name };
  T.classes.push(c);
  save(); closeSheet(); go(`#c/${c.id}/follow`);
  Acts['imp-open']();
};
let moreCls = '';
Acts['cls-more'] = (el) => {
  moreCls = el.dataset.id;
  UI.cls = moreCls;
  const c = clsOf(moreCls);
  openSheet(`<h3>${esc(c.name)}</h3><div class="menu">
    <button type="button" data-act="imp-open">${ic('plus')}<span>أضف طلاباً (إكسل أو لصق أسماء أو طالب واحد)</span></button>
    <button type="button" data-act="xlsx">${ic('file')}<span>كشف الفصل في ملف إكسل</span></button>
    <button type="button" data-act="cls-rename">${ic('edit')}<span>غيّر اسم الفصل</span></button>
    <button type="button" class="red" data-act="cls-del">${ic('trash')}<span>احذف الفصل وطلابه</span></button></div>`);
};
Acts['cls-rename'] = () => { const c = clsOf(moreCls); openSheet(`<form data-submit="cls-save" data-id="${c.id}"><h3>اسم الفصل</h3><label>الاسم<input name="name" required value="${esc(c.name)}"></label><button class="blue-btn wide">احفظ</button></form>`); };
Acts['cls-del'] = (el) => {
  if (!armed(el)) return;
  const id = moreCls;
  const sids = new Set(T.students.filter((s) => s.cls === id).map((s) => s.id));
  T.classes = T.classes.filter((c) => c.id !== id);
  T.students = T.students.filter((s) => s.cls !== id);
  T.beh = T.beh.filter((b) => !sids.has(b.sid));
  T.groups = T.groups.filter((g) => g.cls !== id);
  for (const sid of sids) delete T.marksYW[sid];
  delete T.att[id]; delete T.notes[id];
  save(); closeSheet(); go('#home'); toast('حُذف الفصل');
};

// ---- الطالب ----
function stuForm(s) {
  return `<form data-submit="stu-save" data-id="${s ? s.id : ''}"><h3>${s ? 'بيانات الطالب' : 'طالب جديد'}</h3>
    <label>اسم الطالب<input name="name" required value="${esc(s ? s.name : '')}"></label>
    <label>جوال ولي الأمر (واتساب)<input name="phone" inputmode="tel" dir="ltr" value="${esc(s ? s.phone : '')}" placeholder="05xxxxxxxx"></label>
    <button class="blue-btn wide">احفظ</button>${s ? `<button type="button" class="red-btn wide" data-act="stu-del" data-id="${s.id}">احذف الطالب</button>` : ''}</form>`;
}
Acts['stu-new'] = () => openSheet(stuForm(null));
Acts['stu-edit'] = (el) => openSheet(stuForm(stuOf(el.dataset.id)));
Acts['stu-save'] = (f) => {
  const name = f.elements.name.value.trim();
  if (!name) return;
  const phone = normPhone(f.elements.phone.value);
  if (f.elements.phone.value.trim() && !phoneOk(phone)) { toast('رقم الجوال غير صحيح'); return; }
  if (f.dataset.id) Object.assign(stuOf(f.dataset.id), { name, phone });
  else T.students.push({ id: uid(), cls: UI.cls, name, phone, parent: '' });
  save(); closeSheet(); render(); toast('حُفظ');
};
Acts['stu-del'] = (el) => {
  if (!armed(el)) return;
  const id = el.dataset.id;
  T.students = T.students.filter((s) => s.id !== id);
  T.beh = T.beh.filter((b) => b.sid !== id);
  delete T.marksYW[id];
  for (const g of T.groups) g.members = g.members.filter((m) => m !== id);
  for (const days of Object.values(T.att)) for (const day of Object.values(days)) delete day[id];
  for (const k of ['badges', 'snotes', 'plans', 'exits', 'weak', 'problems', 'refers', 'honors']) if (T[k]) delete T[k][id];
  for (const roles of Object.values(T.roles || {})) for (const r of Object.keys(roles)) if (roles[r] === id) delete roles[r];
  save(); closeSheet(); render();
};

// ---- الرسائل ----
const sig = () => `\n${T.settings.teacher || 'معلم المادة'}`;
function fileText(s) {
  const counts = {};
  for (const b of behOf(s.id)) { const key = `${b.reason}|${b.w}`; counts[key] = (counts[key] || 0) + 1; }
  const rows = Object.entries(counts).map(([k, n]) => { const [r, w] = k.split('|'); return [r, Number(w), n]; });
  const pos = rows.filter((r) => r[1] > 0).map(([r, , n]) => `- ${r}: ${n}`), neg = rows.filter((r) => r[1] <= 0).map(([r, , n]) => `- ${r}: ${n}`);
  return `السلام عليكم ورحمة الله وبركاته
ولي أمر الطالب ${s.name} حفظه الله
هذا ملف ابنكم في مادة ${T.settings.subject}:
الغياب: ${attCount(s, 'a')} | التأخر: ${attCount(s, 'l')} | الاستئذان: ${attCount(s, 'x')}
${pos.length ? `الإيجابيات:\n${pos.join('\n')}` : 'الإيجابيات: لا شيء بعد'}
${neg.length ? `الملاحظات:\n${neg.join('\n')}` : 'الملاحظات: لا شيء، ولله الحمد'}
مجموع النقاط: ${fmtScore(scoreOf(s.id))}
شاكرين تعاونكم.${sig()}`;
}
Acts['send-file'] = (el) => { const s = stuOf(el.dataset.id); logAct('msg:file', s.id); window.open(waLink(s.phone, fileText(s)), '_blank'); };
let sentNow = new Set();
Acts['abs-notify'] = () => { sentNow = new Set(); openSheet(absHTML(), absHTML); };
function absHTML() {
  const abs = studentsIn(UI.cls).filter((s) => attOf(s) === 'a');
  return `<h3>أبلغ أولياء الغائبين</h3><p class="hint">«أرسل» يفتح واتساب والرسالة مكتوبة، ثم ارجع للتالي.</p>
    <ul class="send-list">${abs.map((s) => `<li class="${sentNow.has(s.id) ? 'sent' : ''}"><span class="grow">${esc(s.name)}</span>${phoneOk(s.phone) ? `<button type="button" class="${sentNow.has(s.id) ? 'ghost-btn' : 'wa-btn'} sm" data-act="abs-send" data-id="${s.id}">${sentNow.has(s.id) ? 'أُرسلت' : 'أرسل'}</button>` : '<small class="hint">بلا جوال</small>'}</li>`).join('')}</ul>`;
}
Acts['abs-send'] = (el) => {
  const s = stuOf(el.dataset.id);
  logAct('msg:abs', s.id);
  window.open(waLink(s.phone, `السلام عليكم ورحمة الله وبركاته\nولي أمر الطالب ${s.name} حفظه الله\nنفيدكم بغياب ابنكم اليوم ${dateLabel(today())} عن حصة ${T.settings.subject}.${sig()}`), '_blank');
  sentNow.add(s.id); refresh();
};

// ---- الاستيراد ----
let imp = null;
Acts['imp-open'] = () => {
  imp = null;
  openSheet(`<h3>أضف طلاب «${esc(clsOf(UI.cls).name)}»</h3>
    <label class="pick">${ic('file')}<span><b>من ملف إكسل</b><small>كشف الطلاب من نور، أو أي ملف فيه عمود «اسم الطالب»</small></span><input type="file" id="impFile" accept=".xlsx" hidden></label>
    <p class="hint">أو الصق الأسماء، كل طالب في سطر وبعده جوال ولي أمره إن شئت:</p>
    <textarea id="impText" rows="5" placeholder="محمد عبدالله السالم 0551234567"></textarea>
    <button type="button" class="ghost-btn wide" data-act="imp-text">اعرض ما فهمته</button><div id="impPrev"></div>
    <button type="button" class="link" data-act="stu-new">${ic('plus')} أضف طالباً واحداً</button>`);
};
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'impFile' || !e.target.files[0]) return;
  try { const rows = []; for (const sh of await XlsxRead.read(e.target.files[0])) rows.push(...impFromSheet(sh)); impPreview(rows); } catch { $('impPrev').innerHTML = '<p class="red">تعذّرت قراءة الملف. تأكد أنه ملف إكسل بصيغة xlsx.</p>'; }
});
Acts['imp-text'] = () => impPreview(impFromText($('impText').value));
function impPreview(rows) {
  imp = rows.map((r) => ({ ...r, phone: normPhone(r.phone), name: r.name.replace(/\s+/g, ' ').trim() })).filter((r) => r.name);
  if (!imp.length) { $('impPrev').innerHTML = '<p class="red">لم أجد أسماء طلاب. تأكد أن في الملف عموداً عنوانه «اسم الطالب» أو «الاسم».</p>'; return; }
  $('impPrev').innerHTML = `<div class="prev"><p>وجدت ${imp.length} طالباً (لهم جوال: ${imp.filter((r) => phoneOk(r.phone)).length})</p><ol>${imp.slice(0, 6).map((r) => `<li>${esc(r.name)}</li>`).join('')}</ol>${imp.length > 6 ? `<p class="hint">و${imp.length - 6} غيرهم</p>` : ''}
    <button type="button" class="blue-btn wide" data-act="imp-go">أضف ${imp.length} طالباً</button></div>`;
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

// ---- كشف إكسل ----
Acts.xlsx = () => {
  const c = clsOf(moreCls || UI.cls);
  const list = studentsIn(c.id);
  const days = Object.keys(T.att[c.id] || {}).sort();
  download(Xlsx.build([
    { name: 'المتابعة', columns: [{ title: 'م', width: 5 }, { title: 'الطالب', width: 30 }, { title: 'مجموع النقاط', width: 12 }, ...T.evals.map((e) => ({ title: e.name, width: 12 }))],
      rows: list.map((s, i) => [i + 1, s.name, scoreOf(s.id), ...T.evals.map((e) => behOf(s.id).filter((b) => b.icon === e.k).length)]) },
    { name: 'الحضور', columns: [{ title: 'الطالب', width: 30 }, ...ATT.slice(1).map(([, n]) => ({ title: n, width: 10 })), ...days.map((d) => ({ title: d, width: 11 }))],
      rows: list.map((s) => [s.name, ...ATT.slice(1).map(([k]) => attCount(s, k)), ...days.map((d) => attInfo((T.att[c.id][d] || {})[s.id] || 'p')[1])]) },
    { name: 'أعمال السنة', columns: [{ title: 'الطالب', width: 30 }, ...T.yw.map((y) => ({ title: `${y.name} (${y.max})`, width: 14 })), { title: 'المجموع', width: 10 }],
      rows: list.map((s) => { const m = T.marksYW[s.id] || {}; return [s.name, ...T.yw.map((y) => m[y.k] ?? ''), T.yw.reduce((n, y) => n + (m[y.k] || 0), 0)]; }) },
  ]), `muallim-${today()}.xlsx`);
};

// ---- الإعدادات ----
Views.settings = () => `<header class="home-h"><div><h1>الإعدادات</h1></div></header>
  <button type="button" class="wa-btn wide md-apk" data-act="md-apk">${ic('download')} ثبّت تطبيق «تحضير مدرستي»</button>
  <form class="card" data-submit="set-save"><label>اسمك (في رسائل أولياء الأمور)<input name="teacher" value="${esc(T.settings.teacher)}" placeholder="مثل: أ. محمد"></label>
    <label>المادة<input name="subject" value="${esc(T.settings.subject)}"></label>
    <label>المدرسة (تظهر في الأوراق المطبوعة)<input name="school" value="${esc(T.settings.school || '')}"></label><button class="blue-btn wide">احفظ</button></form>
  <div class="card"><h3>أيقونات التقييم</h3><p class="hint">اسم كل تقييم ودرجته (موجبة أو سالبة).</p>
    <div class="ev-edit">${T.evals.map((e) => `<div class="eve"><button type="button" class="eve-i" style="--c:${e.c}" data-act="eve-icon" data-k="${e.k}" aria-label="غيّر الأيقونة">${ic(e.g)}</button><input data-input="eve-name" data-k="${e.k}" value="${esc(e.name)}"><input class="eve-w" inputmode="decimal" dir="ltr" data-input="eve-w" data-k="${e.k}" value="${e.w}"><button type="button" class="x" data-act="eve-del" data-k="${e.k}" aria-label="احذف">${ic('trash')}</button></div>`).join('')}</div>
    <button type="button" class="ghost-btn wide" data-act="eve-add">${ic('plus')} أضف تقييماً</button></div>
  <div class="card"><h3>بنود أعمال السنة</h3><div class="ev-edit">${T.yw.map((y) => `<div class="eve"><input data-input="yw-name" data-k="${y.k}" value="${esc(y.name)}"><input class="eve-w" inputmode="decimal" dir="ltr" data-input="yw-max" data-k="${y.k}" value="${y.max}"></div>`).join('')}</div><p class="hint">الرقم: الدرجة الكاملة للبند.</p></div>
  <div class="card"><h3>نسخة احتياطية</h3><p class="hint">بياناتك في هذا الجوال فقط. احفظ نسخة من حين لآخر.</p>
    <div class="row2"><button type="button" class="ghost-btn" data-act="bk-out">${ic('down')} احفظ نسخة</button><label class="ghost-btn file">${ic('up')} استرجع نسخة<input type="file" id="bkIn" accept=".json,application/json" hidden></label></div></div>
  <div class="card"><button type="button" class="red-btn wide" data-act="wipe">امسح كل البيانات</button></div>
  <p class="ver">مساعد المعلم | الإصدار ${APP_VERSION}<br>الأيقونات: Font Awesome Free (CC BY 4.0)</p>`;
Acts['set-save'] = (f) => { T.settings.teacher = f.elements.teacher.value.trim(); T.settings.school = f.elements.school.value.trim(); T.settings.subject = f.elements.subject.value.trim() || 'الدراسات الإسلامية'; save(); render(); toast('حُفظ'); };
Inputs['eve-name'] = (el) => { const e = evalOf(el.dataset.k); if (el.value.trim()) { e.name = el.value.trim(); save(); } };
Inputs['eve-w'] = (el) => { const v = num(el.value); if (v !== null) { evalOf(el.dataset.k).w = v; save(); } };
Inputs['yw-name'] = (el) => { const y = T.yw.find((x) => x.k === el.dataset.k); if (el.value.trim()) { y.name = el.value.trim(); save(); } };
Inputs['yw-max'] = (el) => { const v = num(el.value); if (v > 0) { T.yw.find((x) => x.k === el.dataset.k).max = v; save(); } };
Acts['eve-del'] = (el) => { if (!armed(el)) return; T.evals = T.evals.filter((e) => e.k !== el.dataset.k); save(); render(); };
Acts['eve-add'] = () => { T.evals.push({ k: uid(), name: 'تقييم جديد', g: 'star', c: '#3f8ee6', w: 1 }); save(); render(); };
// الأيقونة واللون: الضغط يعرض الرسوم والألوان
let eveK = '';
Acts['eve-icon'] = (el) => { eveK = el.dataset.k; openSheet(eveIconHTML(), eveIconHTML); };
function eveIconHTML() {
  const e = evalOf(eveK);
  return `<h3>أيقونة «${esc(e.name)}»</h3><div class="pick-ic">${EVAL_GLYPHS.map((g) => `<button type="button" class="${e.g === g ? 'on' : ''}" style="--c:${e.c}" data-act="eve-g" data-g="${g}">${ic(g)}</button>`).join('')}</div>
    <h4>اللون</h4><div class="pick-c">${EVAL_COLORS.map((c) => `<button type="button" class="${e.c === c ? 'on' : ''}" style="background:${c}" data-act="eve-c" data-c="${c}" aria-label="لون"></button>`).join('')}</div>`;
}
Acts['eve-g'] = (el) => { evalOf(eveK).g = el.dataset.g; save(); refresh(); };
Acts['eve-c'] = (el) => { evalOf(eveK).c = el.dataset.c; save(); refresh(); };
// النسخة تحمل صور ملف الإنجاز كذلك
Acts['bk-out'] = async () => download(new Blob([JSON.stringify({ app: 'muallim', v: APP_VERSION, at: Date.now(), data: T, media: await Media.all().catch(() => ({})) })], { type: 'application/json' }), `muallim-backup-${today()}.json`);
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'bkIn' || !e.target.files[0]) return;
  try { const j = JSON.parse(await e.target.files[0].text()); if (j.app !== 'muallim' || !j.data) throw new Error('x'); T = normalize(j.data); save(); for (const [id, v] of Object.entries(j.media || {})) await Media.put(id, v).catch(() => {}); render(); toast('استُرجعت النسخة'); } catch { toast('هذا الملف ليس نسخة من «مساعد المعلم»'); }
});
Acts.wipe = (el) => { if (!armed(el)) return; localStorage.removeItem(KEY); Media.clear(); load(); go('#home'); toast('مُسحت البيانات'); };

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
