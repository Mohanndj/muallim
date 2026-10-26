'use strict';
// «ملف الإنجاز»: عناصر تقييم الأداء الوظيفي للمعلم (أحد عشر عنصراً بأوزانها)، ولكل عنصر:
// تقدير ذاتي من ١ إلى ٥، وشواهد يضيفها (نص وتاريخ ورابط وصور)، وشواهد يجمعها التطبيق وحده من عمله اليومي.
// الصور في هذا الجوال (IndexedDB) لأنها أكبر من مساحة الحفظ العادية، وتدخل في النسخة الاحتياطية.

// [المفتاح، الاسم، الوزن، الأيقونة، اللون، شواهد مقترحة]
const STD = [
  ['duty', 'أداء الواجبات الوظيفية', 10, 'briefcase', '#3478f6', ['التقيد بالدوام الرسمي', 'أداء الحصص وفق الجدول', 'المناوبة والإشراف اليومي', 'حصص الانتظار', 'المشاركة في اللجان المدرسية', 'إنجاز المهام المكلّف بها']],
  ['prof', 'التفاعل مع المجتمع المهني', 10, 'handshake', '#7a40e0', ['حضور دورة أو برنامج تدريبي', 'تبادل الزيارات الصفية', 'المشاركة في مجتمع تعلم مهني', 'تقديم درس تطبيقي', 'حضور ورشة عمل أو لقاء تربوي', 'نقل الخبرة للزملاء']],
  ['parents', 'التفاعل مع أولياء الأمور', 10, 'users', '#25b35a', ['إشعار أولياء الأمور بمستوى أبنائهم', 'مقابلة ولي أمر', 'حضور الجمعية العمومية لأولياء الأمور', 'إشراك ولي الأمر في خطة علاجية', 'رسائل التهنئة والتحفيز']],
  ['strat', 'التنويع في استراتيجيات التدريس', 10, 'lightbulb', '#f2a03c', ['التعلم التعاوني', 'التعلم بالأقران', 'العصف الذهني', 'الحوار والمناقشة', 'التعلم باللعب', 'خرائط المفاهيم', 'مراعاة الفروق الفردية']],
  ['results', 'تحسين نتائج المتعلمين', 10, 'arrow-trend-up', '#2fa36b', ['خطة علاجية للمتعثرين', 'برنامج إثرائي للمتفوقين', 'تكريم المتفوقين', 'حصص تقوية', 'معالجة الفاقد التعليمي']],
  ['plan', 'إعداد وتنفيذ خطة التعلم', 10, 'calendar-check', '#36b3c6', ['توزيع المنهج', 'تحضير الدروس', 'الخطة الفصلية', 'الواجبات والتكليفات', 'ربط الأهداف بالأنشطة']],
  ['tech', 'توظيف تقنيات ووسائل التعلم المناسبة', 10, 'laptop', '#4a8ef0', ['منصة مدرستي', 'العروض التقديمية', 'السبورة الذكية', 'الوسائل التعليمية', 'الفصول الافتراضية', 'أدوات الفصل الرقمية']],
  ['env', 'تهيئة البيئة التعليمية', 5, 'seedling', '#5fcf80', ['التحفيز والتعزيز', 'لوحة الشرف', 'تنظيم الفصل', 'قادة الفصل', 'بيئة آمنة وداعمة']],
  ['mgmt', 'الإدارة الصفية', 5, 'chalkboard-user', '#e8457f', ['قواعد الصف', 'ضبط السلوك', 'إدارة وقت الحصة', 'متابعة الحضور', 'معالجة المشكلات السلوكية']],
  ['analysis', 'تحليل نتائج المتعلمين وتشخيص مستوياتهم', 10, 'chart-column', '#8b5cf6', ['تحليل نتائج الاختبارات', 'الاختبار التشخيصي', 'تصنيف الطلاب حسب المستوى', 'خطة مبنية على التحليل']],
  ['assess', 'تنوع أساليب التقويم', 10, 'list-check', '#f08a3c', ['اختبارات قصيرة', 'اختبارات إلكترونية', 'التقويم الشفهي والتسميع', 'المشاريع والبحوث', 'ملف إنجاز الطالب', 'التقويم الذاتي وتقويم الأقران']],
];
const RATES = ['ضعيف', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'];
const stdOf = (k) => STD.find((s) => s[0] === k);
const pf = () => { const p = (T.port = T.port && typeof T.port === 'object' ? T.port : {}); p.rates = p.rates || {}; p.ev = Array.isArray(p.ev) ? p.ev : []; return p; };
const evOfStd = (k) => pf().ev.filter((e) => e.k === k).sort((a, b) => (b.d || '').localeCompare(a.d || ''));
const stdScore = (s) => { const r = pf().rates[s[0]]; return r ? (s[2] * r) / 5 : 0; };
const pfTotal = () => Math.round(STD.reduce((n, s) => n + stdScore(s), 0) * 10) / 10;

// ---- سجل ما يعمله المعلم (رسائل أولياء الأمور والأدوات) ليصير شاهداً وحده ----
function logAct(k, sid = '') {
  T.log = Array.isArray(T.log) ? T.log : [];
  T.log.push({ d: today(), k, sid });
  save();
}
const logOf = (pre) => (Array.isArray(T.log) ? T.log : []).filter((x) => x.k === pre || x.k.startsWith(`${pre}:`));
const allOf = (key) => Object.values(T[key] || {}).flat();
const MSG_NAMES = { abs: 'إبلاغ بالغياب', file: 'ملف الطالب', honor: 'تهنئة وشهادة', weak: 'إشعار ضعف', test: 'درجة اختبار', chat: 'محادثة' };
const TOOL_NAMES = { minute: 'الدقيقة الواحدة', peer: 'أسأل زميلك', pick: 'من يجيب؟', groups: 'مجموعات التعلم', timer: 'المؤقت', calm: 'كأس الهدوء', secret: 'الطالب السري', notes: 'المفكرة' };
const toolCount = (keys) => keys.map((k) => [TOOL_NAMES[k], logOf(`tool:${k}`).length]).filter(([, n]) => n);
const countsLine = (pairs) => pairs.map(([n, c]) => `${n}: ${c}`).join(' | ');
// مستوى الطالب في أعمال السنة (نسبة ما رُصد له)
function ywPct(s) {
  let got = 0, max = 0;
  for (const y of T.yw) { const v = (T.marksYW[s.id] || {})[y.k]; if (typeof v === 'number') { got += v; max += y.max; } }
  return max ? (got / max) * 100 : null;
}
function classAnalysis(c) {
  const list = studentsIn(c.id), p = list.map(ywPct).filter((x) => x !== null);
  return { c, n: list.length, rated: p.length, avg: p.length ? Math.round(p.reduce((a, b) => a + b, 0) / p.length) : 0,
    hi: p.filter((x) => x >= 90).length, mid: p.filter((x) => x >= 70 && x < 90).length, lo: p.filter((x) => x < 70).length };
}
// ما يجمعه التطبيق لكل عنصر: أسطر «العنوان: القيمة»
function autoEv(k) {
  const L = [];
  const add = (t, v) => { if (v) L.push([t, v]); };
  const posBeh = T.beh.filter((b) => b.w > 0).length, negBeh = T.beh.filter((b) => b.w < 0).length;
  if (k === 'duty') {
    const days = new Set([...T.beh.map((b) => b.d), ...Object.values(T.att).flatMap((x) => Object.keys(x))]);
    add('أيام المتابعة والتحضير في الفصول', days.size ? `${days.size} يوماً` : '');
    add('الفصول التي تدرّسها', T.classes.length ? `${T.classes.length} (${T.classes.map((c) => c.name).join('، ')})` : '');
  } else if (k === 'parents') {
    const m = logOf('msg');
    add('رسائل واتساب لأولياء الأمور', m.length ? `${m.length} رسالة` : '');
    add('أنواعها', countsLine(Object.entries(MSG_NAMES).map(([x, n]) => [n, m.filter((y) => y.k === `msg:${x}`).length]).filter(([, n]) => n)));
    add('أولياء أمور تواصلت معهم', new Set(m.map((x) => x.sid).filter(Boolean)).size || '');
  } else if (k === 'strat') {
    add('استراتيجيات طبّقتها بأدوات الفصل', countsLine(toolCount(['groups', 'peer', 'minute', 'pick']).map(([n, c]) => [n, `${c} مرة`])));
    add('مجموعات تعلم محفوظة', T.groups.length || '');
  } else if (k === 'results') {
    const plans = allOf('plans');
    add('خطط علاجية', plans.filter((p) => p.type === 'علاجية').length ? `${plans.filter((p) => p.type === 'علاجية').length} (تحقق منها ${plans.filter((p) => p.type === 'علاجية' && p.done).length})` : '');
    add('خطط إثرائية', plans.filter((p) => p.type === 'إثرائية').length || '');
    add('شهادات تقدير للطلاب', allOf('honors').length || '');
    add('إشعارات ضعف لمتابعة المتعثرين', allOf('weak').length || '');
  } else if (k === 'plan') {
    const L = Array.isArray(T.lessons) ? T.lessons : [];
    add('دروس المنهج في خطتك', L.length ? `${L.length} درساً${L.some((l) => l.week) ? ` موزعة على ${new Set(L.map((l) => l.week).filter(Boolean)).size} أسبوعاً` : ''}` : '');
    add('دروس محضّرة', L.filter(lesFilled).length || '');
    add('دروس مُنفّذة في الفصول', L.reduce((n, l) => n + Object.keys(l.taught || {}).length, 0) || '');
  } else if (k === 'tech') {
    add('تقييمات سجّلتها بالتطبيق', T.beh.length || '');
    add('أدوات الفصل الرقمية', countsLine(toolCount(['timer', 'calm', 'minute', 'pick', 'secret']).map(([n, c]) => [n, `${c} مرة`])));
  } else if (k === 'env') {
    add('تعزيز إيجابي للطلاب', posBeh ? `${posBeh} مرة` : '');
    add('أوسمة منحتها', allOf('badges').length || '');
    add('شهادات تقدير', allOf('honors').length || '');
    add('قادة الفصل المعيّنون', Object.values(T.roles || {}).reduce((n, r) => n + Object.keys(r).length, 0) || '');
  } else if (k === 'mgmt') {
    add('ملاحظات سلوكية سجّلتها', negBeh ? `${negBeh} ملاحظة` : '');
    add('مشكلات سلوكية موثّقة بإجرائها', allOf('problems').length || '');
    add('استئذانات موثّقة', allOf('exits').length || '');
    add('إحالات للإدارة', allOf('refers').length || '');
    add('أدوات ضبط الفصل', countsLine(toolCount(['timer', 'calm', 'secret']).map(([n, c]) => [n, `${c} مرة`])));
  } else if (k === 'analysis') {
    for (const a of T.classes.map(classAnalysis).filter((x) => x.rated)) add(a.c.name, `المتوسط ${a.avg}% | متقدم ${a.hi} | متوسط ${a.mid} | يحتاج دعماً ${a.lo}`);
    for (const x of Array.isArray(T.exams) ? T.exams : []) for (const c of T.classes) { const st = exStats(x, c.id); if (st.sc.length) add(`${x.title} (${c.name})`, `المتوسط ${fmtScore(Math.round(st.avg * 10) / 10)} من ${fmtScore(st.tot)} | نجح ${st.pass} من ${st.sc.length}`); }
  } else if (k === 'assess') {
    for (const y of T.yw) { const n = T.students.filter((s) => typeof (T.marksYW[s.id] || {})[y.k] === 'number').length; add(`درجات ${y.name} المرصودة`, n ? `${n} طالباً` : ''); }
    add('تقويم يومي بالأيقونات', T.beh.length ? `${T.beh.length} تقييم` : '');
    const xs = Array.isArray(T.exams) ? T.exams : [];
    add('اختبارات أعددتها', xs.length ? `${xs.length} (${[...new Set(xs.flatMap((x) => x.qs.map((q) => ({ mc: 'اختيار', tf: 'صح وخطأ', text: 'مقالي' }[q.type]))))].join('، ')})` : '');
    add('أوراق صحّحتها', xs.reduce((n, x) => n + Object.values(x.res || {}).reduce((m, r) => m + Object.values(r).filter((v) => !v.abs).length, 0), 0) || '');
  }
  return L;
}
const stdHas = (k) => evOfStd(k).length + autoEv(k).length;

// ---- الصفحة الرئيسية لملف الإنجاز ----
Views.port = () => (UI.std && stdOf(UI.std) ? viewStd(stdOf(UI.std)) : viewPort());
function viewPort() {
  const p = pf(), tot = pfTotal(), rated = STD.filter((s) => p.rates[s[0]]).length, full = STD.filter((s) => stdHas(s[0])).length;
  const C = 2 * Math.PI * 34;
  return `<header class="home-h"><div><h1>ملف الإنجاز</h1><p>عناصر تقييم الأداء الوظيفي وشواهدها</p></div>
      <div class="round-btns"><button type="button" class="round" data-act="pf-print" aria-label="اطبع الملف">${ic('print')}</button></div></header>
    <section class="pf-sum"><div class="pf-ring"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" class="r-bg"/><circle cx="40" cy="40" r="34" class="r-fg" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - tot / 100)}"/></svg><b>${fmtScore(tot)}<small>من 100</small></b></div>
      <div class="pf-facts"><b>درجتك التقديرية</b><span>${ic('star')} قدّرت ${rated} من ${STD.length} عنصراً</span><span>${ic('folder-open')} عناصر لها شواهد: ${full} من ${STD.length}</span><span>${ic('image')} شواهدك: ${p.ev.length}</span></div></section>
    <button type="button" class="blue-btn wide pf-add" data-act="pf-new">${ic('plus')} أضف شاهداً</button>
    <div class="pf-list">${STD.map((s) => {
      const [k, n, w, g, c] = s, r = p.rates[k], mine = evOfStd(k).length, auto = autoEv(k).length;
      return `<button type="button" class="pf-row" data-act="go" data-h="#port/${k}"><i style="--c:${c}">${ic(g)}</i>
        <span class="grow"><b>${n}</b><small><em class="pf-w">${w} درجات</em>${r ? `<em class="pf-r">${RATES[r - 1]}</em>` : '<em class="pf-r none">لم تقدّره</em>'}${mine ? `<em>${ic('image')} ${mine}</em>` : ''}${auto ? `<em class="pf-auto">${ic('bolt')} تلقائي</em>` : ''}</small></span>
        ${ic('next', 'chev')}</button>`;
    }).join('')}</div>`;
}

// ---- صفحة العنصر ----
function viewStd(s) {
  const [k, n, w, g, c, sug] = s, r = pf().rates[k], mine = evOfStd(k), auto = autoEv(k);
  const used = new Set(mine.map((e) => e.t));
  return `<header class="cls-h"><button type="button" class="round" data-act="go" data-h="#port" aria-label="رجوع">${ic('back')}</button><h1>ملف الإنجاز</h1></header>
    <section class="pf-hero" style="--c:${c}"><i>${ic(g)}</i><div><b>${n}</b><small>الوزن: ${w} درجات من 100 | درجتك: ${r ? fmtScore(stdScore(s)) : 'لم تقدّرها'}</small></div></section>
    <div class="card"><h3>تقديرك لنفسك</h3><div class="pf-rates">${RATES.map((t, i) => `<button type="button" class="${r === i + 1 ? 'on' : ''}" data-act="pf-rate" data-k="${k}" data-r="${i + 1}"><b>${i + 1}</b>${t}</button>`).join('')}</div></div>
    ${auto.length ? `<div class="card"><h3>${ic('bolt')} من عملك في التطبيق</h3><p class="hint">يجمعه التطبيق وحده، ويُطبع مع الملف.</p><div class="pf-auto-list">${auto.map(([t, v]) => `<div><small>${esc(t)}</small><b>${esc(v)}</b></div>`).join('')}</div>
      ${k === 'analysis' ? `<button type="button" class="ghost-btn wide" data-act="pf-analysis">${ic('print')} اطبع تحليل النتائج</button>` : ''}</div>` : ''}
    <div class="card"><div class="pf-h"><h3>شواهدك</h3><button type="button" class="blue-btn sm" data-act="pf-new" data-k="${k}">${ic('plus')} شاهد</button></div>
      ${mine.length ? mine.map(evCard).join('') : '<p class="hint">لا شواهد بعد. اختر من المقترحة بالأسفل أو أضف شاهدك.</p>'}</div>
    <div class="card"><h3>شواهد مقترحة</h3><p class="hint">اضغط أحدها فيُكتب عنوانه، ثم أرفق صورته واحفظ.</p>
      <div class="pf-sug">${sug.map((t) => `<button type="button" class="${used.has(t) ? 'on' : ''}" data-act="pf-new" data-k="${k}" data-t="${esc(t)}">${used.has(t) ? ic('check') : ic('plus')} ${esc(t)}</button>`).join('')}</div></div>`;
}
const evCard = (e) => `<div class="pf-ev" data-act="pf-edit" data-id="${e.id}"><div class="grow"><b>${esc(e.t)}</b><small>${e.d ? dateLabel(e.d) : ''}${e.note ? ` | ${esc(e.note)}` : ''}</small>
    ${e.link ? `<a href="${esc(e.link)}" target="_blank" rel="noopener" class="pf-link" data-act="pf-link">${ic('link')} الرابط</a>` : ''}</div>
    ${(e.imgs || []).length ? `<div class="pf-thumbs">${e.imgs.slice(0, 3).map((id) => `<img data-mid="${id}" alt="">`).join('')}${e.imgs.length > 3 ? `<span>+${e.imgs.length - 3}</span>` : ''}</div>` : ''}</div>`;
Acts['pf-rate'] = (el) => { const p = pf(), r = Number(el.dataset.r); p.rates[el.dataset.k] = p.rates[el.dataset.k] === r ? 0 : r; save(); render(); };

// ---- إضافة شاهد أو تعديله: نافذة واحدة ----
let pfD = null;
Acts['pf-new'] = (el) => {
  pfD = { id: '', k: el.dataset.k || (UI.std && stdOf(UI.std) ? UI.std : ''), t: el.dataset.t || '', d: today(), note: '', link: '', imgs: [] };
  openSheet(pfForm(), pfForm);
  if (!pfD.t && $('pfT')) $('pfT').focus();
};
Acts['pf-link'] = (el) => window.open(el.href, '_blank', 'noopener');
Acts['pf-edit'] = (el) => {
  const ev = pf().ev.find((x) => x.id === el.dataset.id);
  pfD = { ...ev, imgs: [...(ev.imgs || [])] };
  openSheet(pfForm(), pfForm);
};
function pfForm() {
  const s = stdOf(pfD.k);
  return `<h3>${pfD.id ? 'الشاهد' : 'شاهد جديد'}</h3>
    ${s ? `<button type="button" class="pf-pick" data-act="pf-k" data-k="">${ic(s[3])}<span>${s[1]}</span><small>غيّر</small></button>`
    : `<p class="hint">لأي عنصر هذا الشاهد؟</p><div class="pf-stds">${STD.map(([k, n, , g, c]) => `<button type="button" style="--c:${c}" data-act="pf-k" data-k="${k}"><i>${ic(g)}</i>${n}</button>`).join('')}</div>`}
    ${s && !pfD.t ? `<div class="pf-sug small">${s[5].map((t) => `<button type="button" data-act="pf-t" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
    <label>عنوان الشاهد<input id="pfT" data-input="pf-f" data-f="t" value="${esc(pfD.t)}" placeholder="مثل: حضور دورة التعلم النشط"></label>
    <label>التاريخ<input type="date" id="pfDt" data-input="pf-f" data-f="d" value="${pfD.d}"></label>
    <label>وصف مختصر (اختياري)<textarea id="pfN" data-input="pf-f" data-f="note" rows="2">${esc(pfD.note)}</textarea></label>
    <label>رابط (اختياري، مثل ملف في Drive)<input id="pfL" dir="ltr" data-input="pf-f" data-f="link" value="${esc(pfD.link)}" placeholder="https://"></label>
    <div class="pf-imgs">${pfD.imgs.map((id) => `<div><img data-mid="${id}" alt=""><button type="button" class="x" data-act="pf-img-del" data-id="${id}" aria-label="احذف الصورة">${ic('x')}</button></div>`).join('')}
      <label class="pf-cam">${ic('camera')}<span>صورة</span><input type="file" id="pfImg" accept="image/*" multiple hidden></label></div>
    <button type="button" class="blue-btn wide" data-act="pf-save">احفظ</button>
    ${pfD.id ? `<button type="button" class="red-btn wide" data-act="pf-del">${ic('trash')} احذف الشاهد</button>` : ''}`;
}
Inputs['pf-f'] = (el) => { pfD[el.dataset.f] = el.value; };
Acts['pf-k'] = (el) => { pfD.k = el.dataset.k; refresh(); };
Acts['pf-t'] = (el) => { pfD.t = el.dataset.t; refresh(); };
Acts['pf-save'] = () => {
  if (!pfD.k) { toast('اختر العنصر'); return; }
  if (!pfD.t.trim()) { toast('اكتب عنوان الشاهد'); $('pfT').focus(); return; }
  const p = pf(), ev = { id: pfD.id || uid(), k: pfD.k, t: pfD.t.trim(), d: pfD.d || today(), note: pfD.note.trim(), link: pfD.link.trim(), imgs: pfD.imgs };
  const old = p.ev.find((x) => x.id === ev.id);
  if (old) { for (const id of (old.imgs || []).filter((i) => !ev.imgs.includes(i))) Media.del(id); Object.assign(old, ev); } else p.ev.push(ev);
  pfD = null;
  save(); closeSheet(); render(); toast('حُفظ الشاهد');
};
Acts['pf-del'] = (el) => {
  if (!armed(el)) return;
  const p = pf(), ev = p.ev.find((x) => x.id === pfD.id);
  for (const id of ev.imgs || []) Media.del(id);
  p.ev = p.ev.filter((x) => x !== ev);
  pfD = null;
  save(); closeSheet(); render(); toast('حُذف الشاهد');
};
// الصورة المضافة ولم يُحفظ الشاهد تُحذف بإغلاق النافذة
const pfOrphans = () => { if (!pfD) return; const old = pf().ev.find((x) => x.id === pfD.id); for (const id of pfD.imgs.filter((i) => !(old && (old.imgs || []).includes(i)))) Media.del(id); };
Acts['pf-img-del'] = (el) => { const old = pf().ev.find((x) => x.id === pfD.id); if (!(old && (old.imgs || []).includes(el.dataset.id))) Media.del(el.dataset.id); pfD.imgs = pfD.imgs.filter((i) => i !== el.dataset.id); refresh(); };
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'pfImg' || !pfD) return;
  const files = [...e.target.files];
  e.target.value = '';
  for (const f of files) {
    try { const id = uid(); await Media.put(id, await shrink(f)); pfD.imgs.push(id); } catch { toast('تعذّر قراءة الصورة'); }
  }
  refresh();
});
// تصغير الصورة (أطول ضلع ١٤٠٠) حتى لا تملأ الجوال
function shrink(file) {
  return new Promise((ok, no) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, 1400 / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL('image/jpeg', 0.72));
    };
    im.onerror = () => { URL.revokeObjectURL(url); no(new Error('img')); };
    im.src = url;
  });
}

// ---- مخزن الصور ----
const Media = {
  db: null, cache: new Map(),
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((ok, no) => {
      const r = indexedDB.open('muallim-media', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('m');
      r.onsuccess = () => { this.db = r.result; ok(this.db); };
      r.onerror = () => no(r.error);
    });
  },
  async tx(mode, fn) { const db = await this.open(); return new Promise((ok, no) => { const t = db.transaction('m', mode), q = fn(t.objectStore('m')); t.oncomplete = () => ok(q && q.result); t.onerror = () => no(t.error); }); },
  async put(id, data) { this.cache.set(id, data); return this.tx('readwrite', (s) => s.put(data, id)); },
  async get(id) { if (!this.cache.has(id)) this.cache.set(id, await this.tx('readonly', (s) => s.get(id))); return this.cache.get(id); },
  async del(id) { this.cache.delete(id); try { await this.tx('readwrite', (s) => s.delete(id)); } catch { /* fine */ } },
  async all() { const out = {}; for (const e of pf().ev) for (const id of e.imgs || []) { const v = await this.get(id).catch(() => null); if (v) out[id] = v; } return out; },
  async clear() { this.cache.clear(); try { await this.tx('readwrite', (s) => s.clear()); } catch { /* fine */ } },
};
// كل صورة تُعرض تُحمَّل من المخزن وحدها
function hydrateImgs(root = document) {
  for (const im of root.querySelectorAll('img[data-mid]:not([src])')) {
    im.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    Media.get(im.dataset.mid).then((v) => { if (v) im.src = v; else im.closest('.pf-thumbs, .pf-imgs > div')?.classList.add('gone'); }).catch(() => {});
  }
}
new MutationObserver(() => hydrateImgs()).observe(document.documentElement, { childList: true, subtree: true });

// ---- الطباعة: الملف كاملاً، وتحليل النتائج ----
const hijriYear = () => { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { year: 'numeric' }).format(new Date()); } catch { return ''; } };
Acts['pf-print'] = async () => {
  const w = window.open('', '_blank');
  if (!w) { toast('اسمح بفتح نافذة جديدة'); return; }
  const imgs = await Media.all();
  const p = pf(), st = T.settings;
  const sec = (s) => {
    const [k, n, wt] = s, r = p.rates[k], auto = autoEv(k), mine = evOfStd(k);
    return `<section class="std"><h2><span>${n}</span><em>الوزن ${wt} | ${r ? `${RATES[r - 1]} (${fmtScore(stdScore(s))})` : 'لم يُقدَّر'}</em></h2>
      ${auto.length ? `<h3>من سجل المتابعة اليومية</h3><table>${auto.map(([t, v]) => `<tr><th>${esc(t)}</th><td>${esc(v)}</td></tr>`).join('')}</table>` : ''}
      ${mine.length ? `<h3>الشواهد</h3>${mine.map((e) => `<div class="ev"><b>${esc(e.t)}</b> <small>${e.d || ''}</small>${e.note ? `<p>${esc(e.note)}</p>` : ''}${e.link ? `<p class="lk">${esc(e.link)}</p>` : ''}
        ${(e.imgs || []).filter((i) => imgs[i]).length ? `<div class="ims">${e.imgs.filter((i) => imgs[i]).map((i) => `<img src="${imgs[i]}">`).join('')}</div>` : ''}</div>`).join('')}` : ''}
      ${!auto.length && !mine.length ? '<p class="none">لا شواهد بعد.</p>' : ''}</section>`;
  };
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>ملف الإنجاز</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Amiri:wght@700&display=swap">
    <style>*{box-sizing:border-box}body{font-family:Cairo,Tahoma,sans-serif;margin:12mm;color:#111;font-size:12pt;line-height:1.7}
    .cover{height:255mm;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;border:3px double #1d5f3c;border-radius:6mm;page-break-after:always}
    .cover h1{font-family:Amiri,serif;font-size:40pt;color:#1d5f3c;margin:0}.cover p{font-size:15pt;margin:2mm}.cover .sub{color:#555;font-size:13pt}
    table{width:100%;border-collapse:collapse;margin:2mm 0 4mm}td,th{border:1px solid #aaa;padding:1.5mm 3mm;text-align:right;vertical-align:top}th{background:#eef4f0;width:45%;font-weight:600}
    .sum th{width:auto;text-align:center}.sum td{text-align:center}.sum td:first-child{text-align:right}.sum tr.t td{font-weight:700;background:#f6f6f6}
    h2{display:flex;justify-content:space-between;align-items:baseline;gap:4mm;border-bottom:2px solid #1d5f3c;color:#1d5f3c;font-size:15pt;margin:0 0 3mm;padding-bottom:1mm}h2 em{font-style:normal;font-size:10.5pt;color:#555}
    h3{font-size:11.5pt;margin:3mm 0 1mm;color:#333}.std{page-break-inside:avoid;margin-bottom:8mm}.ev{border:1px solid #ddd;border-radius:3mm;padding:2mm 3mm;margin:2mm 0;page-break-inside:avoid}.ev p{margin:1mm 0}.ev small{color:#666}.lk{direction:ltr;text-align:left;color:#245;font-size:10pt;word-break:break-all}
    .ims{display:flex;flex-wrap:wrap;gap:2mm;margin-top:2mm}.ims img{max-width:84mm;max-height:70mm;border-radius:2mm;object-fit:contain}.none{color:#888}.big{text-align:center;font-size:13pt;margin:4mm 0}</style></head><body>
    <div class="cover"><p class="sub">المملكة العربية السعودية | وزارة التعليم</p><p>${esc(st.school || '')}</p><h1>ملف الإنجاز</h1><p>شواهد الأداء الوظيفي للمعلم</p>
      <p style="margin-top:12mm"><b>${esc(st.teacher || 'المعلم: ..................')}</b></p><p>معلم ${esc(st.subject)}</p><p class="sub">العام الدراسي ${hijriYear()}</p></div>
    <h2><span>ملخص عناصر التقييم</span></h2>
    <table class="sum"><tr><th>العنصر</th><th>الوزن</th><th>التقدير الذاتي</th><th>الدرجة</th><th>الشواهد</th></tr>
      ${STD.map((s) => `<tr><td>${s[1]}</td><td>${s[2]}</td><td>${p.rates[s[0]] ? `${p.rates[s[0]]} (${RATES[p.rates[s[0]] - 1]})` : '-'}</td><td>${p.rates[s[0]] ? fmtScore(stdScore(s)) : '-'}</td><td>${[evOfStd(s[0]).length || '', autoEv(s[0]).length ? 'تلقائي' : ''].filter(Boolean).join(' + ') || '-'}</td></tr>`).join('')}
      <tr class="t"><td>المجموع</td><td>100</td><td></td><td>${fmtScore(pfTotal())}</td><td>${p.ev.length}</td></tr></table>
    <div style="page-break-after:always"></div>
    ${STD.map(sec).join('')}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 900);
};
Acts['pf-analysis'] = () => {
  const rows = T.classes.map(classAnalysis);
  const lvl = (x) => (x >= 90 ? 'متقدم' : x >= 70 ? 'متوسط' : 'يحتاج دعماً');
  printForm('تحليل نتائج المتعلمين', `<h1>تحليل نتائج المتعلمين وتشخيص مستوياتهم</h1>
    <table class="an"><tr><th>الفصل</th><th>الطلاب</th><th>رُصدت درجاتهم</th><th>المتوسط</th><th>متقدم (90% فأكثر)</th><th>متوسط (70 إلى 89%)</th><th>يحتاج دعماً (أقل من 70%)</th></tr>
      ${rows.map((a) => `<tr><td>${esc(a.c.name)}</td><td>${a.n}</td><td>${a.rated}</td><td>${a.rated ? `${a.avg}%` : '-'}</td><td>${a.hi}</td><td>${a.mid}</td><td>${a.lo}</td></tr>`).join('')}</table>
    ${rows.filter((a) => a.rated).map((a) => `<h2>${esc(a.c.name)}</h2><table class="an"><tr><th>الطالب</th>${T.yw.map((y) => `<th>${esc(y.name)} (${y.max})</th>`).join('')}<th>النسبة</th><th>المستوى</th></tr>
      ${studentsIn(a.c.id).map((s) => { const m = T.marksYW[s.id] || {}, x = ywPct(s); return `<tr><td>${esc(s.name)}</td>${T.yw.map((y) => `<td>${m[y.k] ?? ''}</td>`).join('')}<td>${x === null ? '' : `${Math.round(x)}%`}</td><td>${x === null ? '' : lvl(x)}</td></tr>`; }).join('')}</table>
      ${a.lo ? `<p>الإجراء المقترح: خطط علاجية لمن يحتاجون دعماً (${a.lo})، وبرامج إثرائية للمتقدمين (${a.hi}).</p>` : ''}`).join('')}
    ${teacherSig()}`, '.an th,.an td{width:auto;text-align:center;font-size:10.5pt}.an td:first-child{text-align:right}h2{font-size:13pt;color:#1d5f3c;margin:6mm 0 1mm}');
};
