'use strict';
// «التحضير»: دروس المنهج مرتبة على الوحدات والأسابيع، ولكل درس تحضيره بخانات منصة مدرستي
// (يُطلب من Claude بطلب جاهز ويُلصق، لدرس واحد أو لعدة دروس معاً)، ولكل خانة زر نسخ للصقها في المنصة،
// وتأشير ما دُرّس في كل فصل، وطباعة التحضير.
// T.lessons = [{ id, unit, title, week, f: { intro, goals, ... }, taught: { [cls]: date } }]، T.prepSet = { start, per }

// خانات منصة مدرستي أولاً (الأهداف والمحتوى الرقمي فيها مربعات جاهزة تؤشَّر كلها عند التعبئة)، ثم ما يفيد التحضير الورقي
const LF = [['strat', 'استراتيجيات التدريس'], ['tools', 'الوسائل التعليمية المستخدمة'], ['think', 'مهارات التفكير'], ['close', 'إغلاق الدرس'], ['notes', 'تعليمات المعلم للطلاب'], ['hw', 'الواجب'],
  ['intro', 'التهيئة'], ['vocab', 'مفردات الدرس'], ['goals', 'الأهداف'], ['acts', 'الأنشطة'], ['assess', 'التقويم'], ['links', 'روابط (عين وغيرها)']];
const LF_MD = 6;
// خيارات المنصة كما تظهر فيها (من تسجيل شاشة المستخدم)
const MD_STRAT = ['الفصل المقلوب', 'التعلم التعاوني', 'التعلم التشاركي', 'التعلم الذاتي', 'التعلم بالاكتشاف', 'التعلم المبني على حل المشكلات', 'التعلم المبني على المشاريع', 'التعلم المبني على اللعب', 'التعلم بالنمذجة', 'التعلم المتمايز', 'الخرائط الذهنية', 'العصف الذهني', 'رحلات تعليمية', 'رحلات تعليمية افتراضية', 'تجارب عملية', 'تجارب عملية افتراضية', 'تقارير كتب', 'دراسة حالة'];
const MD_TOOLS = ['الكتاب', 'كتب الكترونية', 'السبورة التقليدية', 'السبورة الذكية', 'الأقلام', 'جهاز عرض البيانات', 'جهاز الحاسب', 'صورة توضيحية', 'عروض تقديمية', 'نماذج مجسمة', 'الوسائط المتعددة (سمعية - بصرية)', 'الوسائط الاجتماعية', 'برمجيات / تطبيقات مثل kahoot, Padlet, Edpuzzle'];
const MD_CHIPS = { strat: MD_STRAT, tools: MD_TOOLS };
const chipOn = (text, opt) => { const w = String(text || '').split(/[،,\n;؛]+/).map((x) => exNorm(x)).filter(Boolean), o = exNorm(opt); return w.includes(o); };
const lessons = () => (T.lessons = Array.isArray(T.lessons) ? T.lessons : []);
const lesOf = (id) => lessons().find((l) => l.id === id);
const prepSet = () => (T.prepSet = T.prepSet && typeof T.prepSet === 'object' ? T.prepSet : { start: '', per: 2 });
const lesFilled = (l) => LF.filter(([k]) => (l.f || {})[k]).length;
// رقم الأسبوع الدراسي اليوم: الأسبوع الأول يبدأ بأحد أسبوع بداية الدراسة
function weekNow() {
  const st = prepSet().start;
  if (!st) return 0;
  const s = parseD(st); s.setDate(s.getDate() - s.getDay());
  return Math.floor((parseD(today()) - s) / (7 * 864e5)) + 1;
}

// ---- قراءة التحضير الملصوق: «الدرس:» يفصل الدروس، وكل خانة تبدأ باسمها ثم «:» ----
const LF_RX = [['intro', /^(?:التهيئة|التمهيد|المقدمة)/], ['vocab', /^(?:مفردات الدرس|المفردات|عناصر الدرس|محتوى الدرس)/], ['goals', /^(?:الأهداف|أهداف الدرس|الاهداف)/],
  ['strat', /^(?:الاستراتيجيات|استراتيجيات التدريس|الإستراتيجيات|إستراتيجيات التدريس|طرق التدريس)/], ['tools', /^(?:الوسائل|مصادر التعلم)/],
  ['think', /^(?:مهارات التفكير)/], ['close', /^(?:إغلاق الدرس|اغلاق الدرس|غلق الدرس|الخاتمة)/], ['notes', /^(?:تعليمات المعلم|التعليمات|تعليمات للطلاب)/],
  ['acts', /^(?:الأنشطة|النشاط|الانشطة)/], ['assess', /^(?:التقويم|التقييم|الاختبار القصير)/], ['hw', /^(?:الواجب|الواجبات|الواجب المنزلي)/], ['links', /^(?:الروابط|روابط|رابط)/]];
function prepParse(text) {
  const out = [];
  let cur = null, key = '';
  const start = (title) => { cur = { title: title || '', unit: '', f: {} }; out.push(cur); key = ''; };
  for (const line0 of String(text || '').replace(/\r/g, '').split('\n')) {
    const line = line0.replace(/[‎‏‪-‮⁦-⁩]/g, '').replace(/\*\*|__/g, '').replace(/^#+\s*/, '').trim();
    if (!line) continue;
    let m;
    if ((m = line.match(/^(?:الدرس|عنوان الدرس|اسم الدرس)\s*[:：\-]\s*(.+)$/))) { start(m[1].trim()); continue; }
    if ((m = line.match(/^(?:الوحدة)\s*[:：\-]\s*(.+)$/))) { if (!cur) start(''); cur.unit = m[1].trim(); continue; }
    const hit = LF_RX.find(([, rx]) => rx.test(line));
    if (hit && /^[^:：]{2,30}[:：]/.test(line)) {
      if (!cur) start('');
      key = hit[0];
      const rest = line.replace(/^[^:：]+[:：]\s*/, '');
      cur.f[key] = rest;
      continue;
    }
    if (cur && key) cur.f[key] = cur.f[key] ? `${cur.f[key]}\n${line}` : line;
  }
  for (const c of out) for (const k of Object.keys(c.f)) c.f[k] = c.f[k].trim();
  return out.filter((c) => Object.values(c.f).some(Boolean));
}
function prepPrompt(list) {
  const one = list.length === 1;
  return `أنا معلم ${T.settings.subject} للصف الأول المتوسط في المملكة العربية السعودية (المنهج المعتمد من وزارة التعليم).
اكتب لي تحضير ${one ? 'هذا الدرس' : 'هذه الدروس'} لأُدخله في منصة مدرستي:
${list.map((l) => `- ${l.title}${l.unit ? ` (${l.unit})` : ''}`).join('\n')}

اكتب ${one ? 'التحضير' : 'تحضير كل درس'} بهذا التنسيق حرفياً، دون أي كلام قبله أو بعده${one ? '' : '، وابدأ كل درس بسطر «الدرس:»'}:

${one ? '' : 'الدرس: اسم الدرس كما كتبته لك\n'}استراتيجيات التدريس: اثنتان أو ثلاث من هذه القائمة بنصها: ${MD_STRAT.join('، ')}
الوسائل التعليمية: ثلاث أو أربع من هذه القائمة بنصها: ${MD_TOOLS.join('، ')}
مهارات التفكير: مهارتان أو ثلاث يمارسها الطالب في هذا الدرس، في سطر واحد
إغلاق الدرس: نشاط قصير يختم به المعلم الدرس ويلخصه
تعليمات المعلم: توجيه قصير للطلاب يظهر في حسابهم (أقل من 400 حرف)
الواجب: واجب قصير مناسب
التهيئة: سؤال أو موقف قصير يشد الطلاب للدرس
الأهداف:
- أن يعرّف الطالب ...

القواعد: اختر الاستراتيجيات والوسائل من القائمتين بنصهما حرفياً مفصولة بفواصل. والأهداف سلوكية من محتوى الدرس نفسه. وتأكد من صحة كل معلومة شرعياً.`;
}

// ---- الصفحة ----
Views.prep = () => (UI.les && lesOf(UI.les) ? viewLesson(lesOf(UI.les)) : viewPrep());
function viewPrep() {
  const L = lessons(), wk = weekNow(), cur = L.filter((l) => wk && l.week === wk), late = L.filter((l) => wk && l.week && l.week < wk && T.classes.some((c) => !(l.taught || {})[c.id]));
  const units = [...new Set(L.map((l) => l.unit))];
  return `<header class="home-h"><div><h1>التحضير</h1><p>دروس المنهج وتحضيرها لمنصة مدرستي</p></div>
      <div class="round-btns"><button type="button" class="round" data-act="pr-add" aria-label="أضف دروساً">${ic('plus')}</button></div></header>
    ${L.length ? `
    <section class="pr-week"><div><b>${wk ? `الأسبوع ${wk}` : 'التوزيع على الأسابيع'}</b><small>${wk ? `${cur.length === 1 ? 'درس واحد' : cur.length === 2 ? 'درسان' : `${cur.length} دروس`} هذا الأسبوع` : 'حدّد بداية الدراسة ليظهر درس كل أسبوع'}</small></div>
      <button type="button" class="ghost-btn sm" data-act="pr-dist">${ic('calendar-check')} وزّع</button></section>
    ${cur.length ? `<div class="pf-list pr-cur">${cur.map(lesRow).join('')}</div>` : ''}
    ${late.length ? `<h4 class="sm-sec red">${ic('circle-exclamation')} دروس فاتت أسبوعها ولم تُدرَّس في كل الفصول</h4><div class="pf-list">${late.map(lesRow).join('')}</div>` : ''}
    <div class="row2"><button type="button" class="blue-btn" data-act="pr-bulk">${ic('paper-plane')} حضّر عدة دروس معاً</button><button type="button" class="ghost-btn" data-act="pr-print-plan">${ic('print')} اطبع التوزيع</button></div>
    ${units.map((u) => `<h4 class="sm-sec">${esc(u || 'دروس بلا وحدة')}</h4><div class="pf-list">${L.filter((l) => l.unit === u).map(lesRow).join('')}</div>`).join('')}`
    : `<div class="home-empty"><i>${ic('calendar-check')}</i><h2>ابدأ بدروس المنهج</h2><p>الصق أسماء الدروس (كل درس في سطر، والوحدة في سطر يبدأ بـ«الوحدة»)، ثم يُحضَّر كل درس بضغطة ويُوزَّع على الأسابيع.</p><button type="button" class="blue-btn" data-act="pr-add">${ic('plus')} أضف الدروس</button></div>`}`;
}
function lesRow(l) {
  const n = lesFilled(l), done = T.classes.filter((c) => (l.taught || {})[c.id]).length;
  return `<button type="button" class="pf-row" data-act="go" data-h="#prep/${l.id}"><i style="--c:${n ? '#36b3c6' : '#c7c7cc'}">${l.week ? `<b class="pr-wk">${l.week}</b>` : ic('book-open')}</i>
    <span class="grow"><b>${esc(l.title)}</b><small>${n ? `<em class="pf-r">${ic('check')} محضّر</em>` : '<em class="pf-r none">لم يُحضَّر</em>'}${T.classes.length ? `<em${done === T.classes.length ? ' class="pf-auto"' : ''}>دُرّس في ${done} من ${T.classes.length}</em>` : ''}</small></span>${ic('next', 'chev')}</button>`;
}

// ---- إضافة الدروس بلصق قائمتها ----
Acts['pr-add'] = () => openSheet(`<h3>أضف دروساً</h3><p class="hint">كل درس في سطر. والسطر الذي يبدأ بـ«الوحدة» عنوان وحدة لما بعده. والترقيم في أول السطر يُحذف.</p>
  <textarea id="prList" rows="10" placeholder="الوحدة الأولى: التوحيد&#10;معنى التوحيد&#10;أقسام التوحيد&#10;الوحدة الثانية: الفقه&#10;الطهارة"></textarea>
  <button type="button" class="blue-btn wide" data-act="pr-add-go">${ic('check')} أضف</button>`);
Acts['pr-add-go'] = () => {
  let unit = lessons().length ? lessons()[lessons().length - 1].unit : '', n = 0;
  for (const line0 of $('prList').value.split('\n')) {
    const line = line0.trim().replace(/^(?:[0-9٠-٩]+\s*[-–.)]\s*|[-•*]\s*)/, '').trim();
    if (!line) continue;
    if (/^(?:الوحدة|وحدة)(?:\s|[:：\-]|$)/.test(line)) { unit = line; continue; }
    lessons().push({ id: uid(), unit, title: line, week: 0, f: {}, taught: {} }); n++;
  }
  if (!n) { toast('اكتب درساً واحداً على الأقل'); return; }
  if (prepSet().start) prDistribute(false);
  save(); closeSheet(); render(); toast(`أُضيف ${n} ${n === 1 ? 'درس' : 'دروس'}`);
};

// ---- التوزيع على الأسابيع ----
Acts['pr-dist'] = () => openSheet(`<form data-submit="pr-dist-go"><h3>وزّع الدروس على الأسابيع</h3>
  <label>أول يوم في الدراسة<input type="date" name="start" required value="${prepSet().start || today()}"></label>
  <label>عدد الدروس في الأسبوع<input name="per" inputmode="numeric" required value="${prepSet().per || 2}"></label>
  <p class="hint">تُرتَّب الدروس بترتيبها في القائمة. وتستطيع تغيير أسبوع أي درس من صفحته.</p>
  <button class="blue-btn wide">${ic('calendar-check')} وزّع</button></form>`);
Acts['pr-dist-go'] = (f) => {
  const per = num(f.elements.per.value);
  if (!(per > 0)) { toast('اكتب عدد الدروس في الأسبوع'); return; }
  Object.assign(prepSet(), { start: f.elements.start.value, per });
  prDistribute(true);
  save(); closeSheet(); render(); toast('وُزّعت الدروس');
};
// all = true: كل الدروس من جديد؛ وإلا فالدروس التي بلا أسبوع بعد آخر درس موزَّع
function prDistribute(all) {
  const per = prepSet().per || 2, L = lessons();
  let i = all ? 0 : L.filter((l) => l.week).length;
  for (const l of L) if (all || !l.week) { l.week = Math.floor(i / per) + 1; i++; }
}
Acts['pr-print-plan'] = () => {
  const L = lessons(), weeks = [...new Set(L.map((l) => l.week || 0))].sort((a, b) => a - b);
  printForm('توزيع المنهج', `<h1>توزيع منهج ${esc(T.settings.subject)}</h1><table class="r"><tr><th>الأسبوع</th><th>الوحدة</th><th>الدرس</th>${T.classes.map((c) => `<th>${esc(c.name)}</th>`).join('')}</tr>
    ${weeks.flatMap((w) => L.filter((l) => (l.week || 0) === w).map((l, i) => `<tr>${i ? '' : `<td rowspan="${L.filter((x) => (x.week || 0) === w).length}">${w || '-'}</td>`}<td>${esc(l.unit)}</td><td>${esc(l.title)}</td>${T.classes.map((c) => `<td>${(l.taught || {})[c.id] || ''}</td>`).join('')}</tr>`)).join('')}</table>${teacherSig()}`,
  '.r th,.r td{width:auto;font-size:10.5pt}');
};

// ---- تحضير عدة دروس بطلب واحد ----
let prSel = new Set();
Acts['pr-bulk'] = () => { const L = lessons(); prSel = new Set(L.filter((l) => !lesFilled(l)).slice(0, 5).map((l) => l.id)); openSheet(prBulkHTML(), prBulkHTML, 'gray'); };
function prBulkHTML() {
  const L = lessons();
  return `<h3>حضّر عدة دروس معاً</h3><div class="sm-card"><h4 class="ex-step"><b>1</b> اختر الدروس (خمسة أو أقل أفضل)</h4>
      <div class="pr-pick">${L.map((l) => `<button type="button" class="${prSel.has(l.id) ? 'on' : ''}" data-act="pr-sel" data-id="${l.id}">${prSel.has(l.id) ? ic('check') : ''}${esc(l.title)}${lesFilled(l) ? ' <small>(محضّر)</small>' : ''}</button>`).join('')}</div>
      <button type="button" class="blue-btn wide" data-act="pr-ask"${prSel.size ? '' : ' disabled'}>${ic('paper-plane')} انسخ الطلب وافتح Claude (${prSel.size})</button></div>
    <div class="sm-card"><h4 class="ex-step"><b>2</b> الصق ما كتبه Claude</h4><button type="button" class="ghost-btn sm" data-act="pr-paste-bulk">${ic('clipboard')} الصق</button>
      <textarea id="prBulk" rows="6" placeholder="الدرس: ...&#10;التهيئة: ...&#10;الأهداف: ..."></textarea><button type="button" class="blue-btn wide" data-act="pr-bulk-go">${ic('check')} احفظ التحضير في الدروس</button></div>`;
}
Acts['pr-sel'] = (el) => { const id = el.dataset.id; if (prSel.has(id)) prSel.delete(id); else prSel.add(id); refresh(); };
Acts['pr-ask'] = async (el) => {
  const list = el.dataset.id ? [lesOf(el.dataset.id)] : lessons().filter((l) => prSel.has(l.id));
  const p = prepPrompt(list);
  try { await navigator.clipboard.writeText(p); toast('نُسخ الطلب'); } catch { toast('لم يُنسخ الطلب تلقائياً'); }
  window.open(`https://claude.ai/new?q=${encodeURIComponent(p)}`, '_blank');
};
Acts['pr-paste-bulk'] = async () => { try { $('prBulk').value = await navigator.clipboard.readText(); } catch { toast('اضغط مطولاً في الخانة ثم «لصق»'); $('prBulk').focus(); } };
const prKey = (s) => exNorm(s).replace(/^(?:درس|الدرس)\s+/, '');
Acts['pr-bulk-go'] = () => {
  const P = prepParse($('prBulk').value);
  if (!P.length) { toast('لم أجد تحضيراً: يبدأ كل درس بـ«الدرس:» ثم الخانات'); return; }
  const miss = [];
  let n = 0;
  for (const c of P) {
    const l = lessons().find((x) => prKey(x.title) === prKey(c.title)) || (P.length === 1 && prSel.size === 1 ? lesOf([...prSel][0]) : null);
    if (!l) { miss.push(c.title || 'بلا عنوان'); continue; }
    l.f = { ...l.f, ...c.f }; n++;
  }
  save();
  if (miss.length) { refresh(); toast(`حُفظ ${n}، ولم أجد في قائمتك: ${miss.join('، ')}`); return; }
  closeSheet(); render(); toast(`حُفظ تحضير ${n} ${n === 1 ? 'درس' : 'دروس'}`);
};

// ---- صفحة الدرس: الخانات بأزرار النسخ ----
function viewLesson(l) {
  return `<header class="cls-h"><button type="button" class="round" data-act="go" data-h="#prep" aria-label="رجوع">${ic('back')}</button><h1>${esc(l.title)}</h1>
      <div class="round-btns"><button type="button" class="round" data-act="pr-more" aria-label="خيارات">${ic('more')}</button></div></header>
    ${l.unit ? `<p class="hint ex-lesson">${ic('book-open')} ${esc(l.unit)}${l.week ? ` | الأسبوع ${l.week}` : ''}</p>` : ''}
    ${T.classes.length ? `<div class="card"><h3>${ic('check')} دُرّس في</h3><div class="chips">${T.classes.map((c) => `<button type="button" class="chip${(l.taught || {})[c.id] ? ' on' : ''}" data-act="pr-taught" data-c="${c.id}">${(l.taught || {})[c.id] ? `${ic('check')} ` : ''}${esc(c.name)}</button>`).join('')}</div></div>` : ''}
    <div class="card pr-ai"><div class="row2 tight"><button type="button" class="blue-btn" data-act="pr-ask" data-id="${l.id}">${ic('paper-plane')} اطلب التحضير من Claude</button><button type="button" class="ghost-btn" data-act="pr-paste">${ic('clipboard')} الصق التحضير</button></div>
      <p class="hint">ينسخ الطلب ويفتح Claude، ثم انسخ ما يكتبه وارجع واضغط «الصق التحضير»، فتمتلئ الخانات.</p></div>
    ${lesFilled(l) ? `<div class="row2 pr-all"><button type="button" class="wa-btn" data-act="md-fill">${ic('paper-plane')} عبّئ في مدرستي</button><button type="button" class="ghost-btn" data-act="pr-copy-all">${ic('clipboard')} انسخه كاملاً</button></div>` : ''}
    <h4 class="sm-sec">خانات منصة مدرستي <small class="hint">(والأهداف والمحتوى الرقمي تُؤشَّر كلها عند التعبئة)</small></h4>
    ${LF.map(([k, n], i) => `${i === LF_MD ? '<h4 class="sm-sec">للتحضير الورقي (اختياري)</h4>' : ''}${MD_CHIPS[k] ? `<div class="card pr-f"><h3>${n}</h3><div class="pr-chips">${MD_CHIPS[k].map((o) => `<button type="button" class="${chipOn((l.f || {})[k], o) ? 'on' : ''}" data-act="pr-chip" data-k="${k}" data-o="${esc(o)}">${chipOn((l.f || {})[k], o) ? ic('check') : ''}${esc(o)}</button>`).join('')}</div></div>` : `<div class="card pr-f"><div class="pf-h"><h3>${n}</h3><button type="button" class="ghost-btn sm" data-act="pr-copy" data-k="${k}">${ic('clipboard')} انسخ</button></div>
      <textarea id="prf-${k}" data-input="pr-f" data-k="${k}" rows="${Math.min(8, Math.max(2, ((l.f || {})[k] || '').split('\n').length + 1))}" ${k === 'links' ? 'dir="ltr"' : ''}>${esc((l.f || {})[k] || '')}</textarea></div>`}`).join('')}`;
}
Inputs['pr-f'] = (el) => { const l = lesOf(UI.les); l.f = l.f || {}; l.f[el.dataset.k] = el.value; save(); };
// اختيار استراتيجية أو وسيلة من خيارات المنصة: يُحفظ نصاً مفصولاً بفواصل
Acts['pr-chip'] = (el) => {
  const l = lesOf(UI.les), k = el.dataset.k, o = el.dataset.o;
  l.f = l.f || {};
  const items = String(l.f[k] || '').split(/[،,\n;؛]+/).map((x) => x.trim()).filter(Boolean);
  const keep = items.filter((x) => !chipOn(x, o));
  l.f[k] = (keep.length === items.length ? [...items, o] : keep).join('، ');
  save(); render();
};
Acts['pr-taught'] = (el) => { const l = lesOf(UI.les); l.taught = l.taught || {}; if (l.taught[el.dataset.c]) delete l.taught[el.dataset.c]; else l.taught[el.dataset.c] = today(); save(); render(); };
async function prCopy(t, msg) { try { await navigator.clipboard.writeText(t); toast(msg); } catch { toast('تعذّر النسخ'); } }
Acts['pr-copy'] = (el) => { const t = (lesOf(UI.les).f || {})[el.dataset.k]; if (!t) { toast('الخانة فارغة'); return; } prCopy(t, `نُسخت «${LF.find((x) => x[0] === el.dataset.k)[1]}»، الصقها في مدرستي`); };
const lesText = (l) => [`الدرس: ${l.title}`, ...LF.filter(([k]) => (l.f || {})[k]).map(([k, n]) => `${n}:\n${l.f[k]}`)].join('\n\n');
Acts['pr-copy-all'] = () => prCopy(lesText(lesOf(UI.les)), 'نُسخ التحضير كاملاً');
Acts['pr-paste'] = async () => {
  let t = '';
  try { t = await navigator.clipboard.readText(); } catch { /* يُلصق باليد */ }
  if (!t.trim()) { openSheet(`<h3>الصق التحضير</h3><textarea id="prOne" rows="10"></textarea><button type="button" class="blue-btn wide" data-act="pr-paste-go">${ic('check')} املأ الخانات</button>`); $('prOne').focus(); return; }
  prFill(t);
};
Acts['pr-paste-go'] = () => { if (prFill($('prOne').value)) closeSheet(); };
function prFill(t) {
  const P = prepParse(t);
  if (!P.length) { toast('لم أجد خانات: تبدأ كل خانة باسمها مثل «الأهداف:»'); return false; }
  const l = lesOf(UI.les);
  l.f = { ...l.f, ...P[0].f };
  save(); render(); toast(`امتلأت ${Object.keys(P[0].f).length} خانات`);
  return true;
}
Acts['pr-more'] = () => {
  const l = lesOf(UI.les);
  openSheet(`<h3>${esc(l.title)}</h3><form data-submit="pr-meta"><label>اسم الدرس<input name="title" required value="${esc(l.title)}"></label><label>الوحدة<input name="unit" value="${esc(l.unit)}"></label>
    <label>الأسبوع<input name="week" inputmode="numeric" value="${l.week || ''}"></label><button class="blue-btn wide">احفظ</button></form>
    <div class="menu"><button type="button" data-act="pr-print">${ic('print')} اطبع التحضير</button><button type="button" class="red" data-act="pr-del">${ic('trash')} احذف الدرس</button></div>`);
};
Acts['pr-meta'] = (f) => { const l = lesOf(UI.les); l.title = f.elements.title.value.trim() || l.title; l.unit = f.elements.unit.value.trim(); l.week = Math.max(0, Math.round(num(f.elements.week.value) || 0)); save(); closeSheet(); render(); };
Acts['pr-del'] = (el) => { if (!armed(el)) return; T.lessons = lessons().filter((x) => x.id !== UI.les); save(); closeSheet(); go('#prep', true); toast('حُذف الدرس'); };
Acts['pr-print'] = () => {
  const l = lesOf(UI.les);
  printForm(`تحضير ${l.title}`, `<h1>تحضير درس: ${esc(l.title)}</h1><table><tr><th>الوحدة</th><td>${esc(l.unit)}</td></tr><tr><th>الصف</th><td>الأول المتوسط</td></tr>${l.week ? `<tr><th>الأسبوع</th><td>${l.week}</td></tr>` : ''}</table>
    <table>${LF.filter(([k]) => (l.f || {})[k]).map(([k, n]) => `<tr><th>${n}</th><td>${esc(l.f[k]).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>${teacherSig()}`, 'th{width:24%}');
};
