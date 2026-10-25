'use strict';
// «الاختبارات»: إعداد الأسئلة (طلب جاهز يُنسخ لـClaude، ثم تُلصق الأسئلة أو تُكتب بتنسيق بسيط)،
// وطباعة الورقة بنموذجين ونموذج الإجابة، والتصحيح بالضغط على إجابة كل طالب، ونقل الدرجة إلى أعمال السنة،
// وتحليل النتائج وإبلاغ أولياء الأمور.
// T.exams = [{ id, title, lesson, d, yw, qs: [{ id, type: mc|tf|text, q, opts, ans, mark }], res: { [cls]: { [sid]: { a, m, abs, at } } } }]

// ---- قراءة الأسئلة من النص (لا تخمين: ما لم يُفهم يُعلَّم بالأحمر ولا يُحفظ حتى يُصحَّح) ----
const exDigits = (s) => String(s).replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x660).replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x6f0);
const exNorm = (s) => exDigits(s).replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const EX_T = ['صح', 'صحيح', 'صحيحه', 'صواب', 'نعم'], EX_F = ['خطا', 'خاطي', 'خاطئ', 'خاطيه', 'خاطئه', 'غلط', 'لا'];
const exBool = (s) => { const w = exNorm(s).split(' ')[0] || ''; return EX_T.includes(w) ? true : EX_F.includes(w) ? false : null; };
const EX_L = '(?:هـ|[أابجدهوز]|[a-f])';
const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
const EX_RX = {
  title: /^(?:عنوان الاختبار|اسم الاختبار|العنوان)\s*[:：]\s*(.+)$/,
  lesson: /^(?:الموضوع|الدرس|الوحدة)\s*[:：]\s*(.+)$/,
  keyHead: /^(?:مفتاح الإجابات|مفتاح الاجابات|الإجابات الصحيحة|الاجابات الصحيحة|الإجابات|الاجابات|نموذج الإجابة|نموذج الاجابة)\s*[:：]?\s*$/,
  q: /^(?:(?:س|سؤال|السؤال)\s*([0-9٠-٩]+)\s*[:：\-–.)]?\s*|(?:س|سؤال|السؤال)\s*[:：\-–]\s*|([0-9٠-٩]+)\s*[-–.)]\s*)(.*)$/,
  type: /^(?:النوع|نوع السؤال)\s*[:：]\s*(.+)$/,
  ans: /^(?:الإجابة الصحيحة|الاجابة الصحيحة|الإجابة النموذجية|الاجابة النموذجية|الإجابة|الاجابة|الجواب)\s*[:：]\s*(.*)$/,
  mark: /^(?:الدرجة|درجته|الدرجات)\s*[:：]\s*([0-9٠-٩]+(?:[.,٫][0-9٠-٩]+)?)/,
  opt: new RegExp(`^[(\\[]?\\s*(${EX_L})\\s*[)\\]\\-–.]\\s*(.+)$`, 'i'),
  bullet: /^[-•*▪◦]\s*(.+)$/,
};
const EX_MARK = /\s*(?:✓|✔|\((?:صحيح|الصحيح|الإجابة الصحيحة)\)|\*)\s*$/;
function exParse(text) {
  const out = { title: '', lesson: '', qs: [], stray: [] }, items = [], keyMap = {};
  let cur = null, last = '', keyMode = false;
  for (const line0 of String(text || '').replace(/\r/g, '').split('\n')) {
    const line = line0.replace(/[‎‏‪-‮⁦-⁩]/g, '').replace(/\*\*|__/g, '').replace(/^#+\s*/, '').trim();
    if (!line) { if (last !== 'q') last = ''; continue; }
    let m;
    if (keyMode) {
      const pairs = [...exDigits(line).matchAll(/(?:س\s*)?([0-9]+)\s*[-–.):：=]\s*([^0-9،,؛|]+)/g)];
      if (pairs.length) { for (const p of pairs) keyMap[+p[1]] = p[2].trim(); continue; }
      keyMode = false;
    }
    if (EX_RX.keyHead.test(line)) { keyMode = true; cur = null; last = ''; continue; }
    if (!cur && (m = line.match(EX_RX.title))) { out.title = m[1].trim(); continue; }
    if (!cur && (m = line.match(EX_RX.lesson))) { out.lesson = m[1].trim(); continue; }
    if ((m = line.match(EX_RX.q)) && (m[3] || '').trim()) {
      const no = m[1] || m[2];
      cur = { no: no ? +exDigits(no) : 0, q: m[3].trim(), opts: [], type: '', ansRaw: '', hasAns: false, mark: 0, marked: -1 };
      items.push(cur); last = 'q';
      continue;
    }
    if (!cur) { out.stray.push(line); continue; }
    if ((m = line.match(EX_RX.type))) { cur.type = m[1]; last = ''; continue; }
    if ((m = line.match(EX_RX.mark))) { cur.mark = Number(exDigits(m[1]).replace(/[,٫]/, '.')); last = ''; continue; }
    if ((m = line.match(EX_RX.ans))) { cur.ansRaw = m[1].trim(); cur.hasAns = true; last = 'ans'; continue; }
    if (!cur.hasAns && EX_RX.opt.test(line)) {
      // عدة اختيارات في سطر واحد: «أ) طهور ب) طاهر ج) نجس»
      for (const part of line.split(new RegExp(`\\s+(?=[(\\[]?${EX_L}\\s*\\)\\s)`, 'i'))) {
        const o = part.match(EX_RX.opt);
        if (!o) { if (cur.opts.length) cur.opts[cur.opts.length - 1].text += ` ${part}`; else out.stray.push(part); continue; }
        let t = o[2].trim();
        if (EX_MARK.test(t)) { t = t.replace(EX_MARK, ''); cur.marked = cur.marked === -1 ? cur.opts.length : -2; }
        cur.opts.push({ label: o[1], text: t });
      }
      last = 'opt';
      continue;
    }
    if (!cur.hasAns && (m = line.match(EX_RX.bullet))) {
      let t = m[1].trim();
      if (EX_MARK.test(t)) { t = t.replace(EX_MARK, ''); cur.marked = cur.marked === -1 ? cur.opts.length : -2; }
      cur.opts.push({ label: '', text: t }); last = 'opt';
      continue;
    }
    if (last === 'ans') cur.ansRaw += ` ${line}`;
    else if (last === 'q') cur.q += ` ${line}`;
    else if (last === 'opt' && cur.opts.length) cur.opts[cur.opts.length - 1].text += ` ${line}`;
    else out.stray.push(line);
  }
  items.forEach((c, i) => { const n = c.no || i + 1; if (!c.hasAns && keyMap[n] !== undefined) { c.ansRaw = keyMap[n]; c.hasAns = true; } });
  out.qs = items.map(exResolve);
  return out;
}
function exResolve(c) {
  const q = { id: uid(), type: '', q: c.q.trim(), opts: c.opts.map((o) => o.text.trim()), ans: null, mark: c.mark > 0 ? c.mark : 1, bad: '' };
  const t = exNorm(c.type), r = c.ansRaw.trim();
  const tfOpts = q.opts.length === 2 && q.opts.every((o) => exBool(o) !== null) && exBool(q.opts[0]) !== exBool(q.opts[1]);
  q.type = /صح|خطا/.test(t) ? 'tf' : /نص|مقال|قصير|كتاب|اكمل|اذكر|عرف|علل/.test(t) ? 'text' : /اختيار|متعدد/.test(t) ? 'mc'
    : tfOpts ? 'tf' : q.opts.length ? 'mc' : c.hasAns && exBool(r) !== null && exNorm(r).split(' ').length === 1 ? 'tf' : 'text';
  if (!q.q) q.bad = 'السؤال بلا نص';
  else if (q.type === 'tf') {
    if (tfOpts && c.marked >= 0) q.ans = exBool(q.opts[c.marked]);
    else if (!r) q.bad = 'لم أجد إجابته (صح أو خطأ)';
    else if (exBool(r) === null) q.bad = `لم أفهم الإجابة «${r}»: المتوقع صح أو خطأ`;
    else q.ans = exBool(r);
    q.opts = [];
  } else if (q.type === 'mc') {
    let ix = null;
    const lm = r.match(new RegExp(`^[(\\[]?\\s*(${EX_L})\\s*(?:[)\\]\\-–.:]|$)`, 'i'));
    const n = exDigits(r).match(/^\(?\s*([0-9]+)\s*\)?$/);
    if (q.opts.length < 2) q.bad = 'فيه أقل من اختيارين';
    else if (c.marked === -2) q.bad = 'عُلّم فيه أكثر من اختيار صحيح';
    else if (c.marked >= 0) ix = c.marked;
    else if (!r) q.bad = 'لم أجد إجابته';
    else if (new RegExp(`^${EX_L}\\s*(?:،|,|و)\\s*${EX_L}$`, 'i').test(r)) q.bad = 'له أكثر من إجابة';
    else if (lm && (r.length <= 3 || /[)\]\-–.:]/.test(r.slice(0, 4)))) {
      const k = c.opts.findIndex((o) => o.label && exNorm(o.label) === exNorm(lm[1]));
      if (k >= 0) ix = k; else q.bad = `الإجابة «${r}» لا تطابق حرف أي اختيار`;
    } else if (n) { const k = +n[1] - 1; if (k >= 0 && k < q.opts.length) ix = k; else q.bad = `الإجابة «${r}» خارج الاختيارات`; }
    else { const k = q.opts.map(exNorm).indexOf(exNorm(r)); if (k >= 0) ix = k; else q.bad = `الإجابة «${r}» لا تطابق أي اختيار`; }
    if (ix !== null) q.ans = ix;
  } else { q.opts = []; q.ans = r; }
  return q;
}
// الأسئلة نصاً (للتعديل): التنسيق نفسه الذي تُقرأ به
function exText(x) {
  return [`العنوان: ${x.title}`, x.lesson ? `الدرس: ${x.lesson}` : '', '', ...x.qs.map((q, i) => [`س${i + 1}: ${q.q}`,
    ...(q.type === 'mc' ? q.opts.map((o, j) => `${LETTERS[j]}) ${o}`) : []), q.type === 'tf' ? 'النوع: صح وخطأ' : q.type === 'text' ? 'النوع: مقالي' : '',
    q.type === 'mc' ? `الإجابة: ${LETTERS[q.ans]}` : q.type === 'tf' ? `الإجابة: ${q.ans ? 'صح' : 'خطأ'}` : q.ans ? `الإجابة: ${q.ans}` : '',
    q.mark !== 1 ? `الدرجة: ${q.mark}` : '', ''].filter((l, k, a) => l || k === a.length - 1).join('\n'))].join('\n').trim();
}
const EX_EXAMPLE = `العنوان: اختبار قصير في الطهارة
الدرس: الطهارة وأقسام المياه

س1: الماء الباقي على أصل خلقته يسمى:
أ) طهوراً
ب) نجساً
ج) مستعملاً
الإجابة: أ

س2: الوضوء شرط لصحة الصلاة.
النوع: صح وخطأ
الإجابة: صح

س3: اذكر نواقض الوضوء.
النوع: مقالي
الإجابة: الخارج من السبيلين، والنوم المستغرق...
الدرجة: 2`;
function exPrompt(topic, n, types) {
  const tn = { mc: 'اختيار من متعدد بأربعة اختيارات', tf: 'صح وخطأ', text: 'مقالي قصير' };
  return `أنا معلم ${T.settings.subject} للصف الأول المتوسط في المملكة العربية السعودية (المنهج المعتمد من وزارة التعليم).
اكتب لي اختباراً قصيراً في: ${topic || '[اكتب الدرس هنا]'}
عدد الأسئلة: ${n}، وأنواعها: ${types.map((t) => tn[t]).join('، ')}.
اجعل الأسئلة واضحة مناسبة لعمر الطلاب، ومن محتوى الدرس نفسه، وتأكد من صحة كل إجابة شرعياً.
اكتبه بهذا التنسيق حرفياً، دون أي كلام قبله أو بعده:

${EX_EXAMPLE}

القواعد: لكل سؤال اختيار إجابة واحدة بحرفها. سطر «الدرجة» فقط إن كانت درجة السؤال أكثر من واحدة. اترك سطراً فارغاً بين الأسئلة.`;
}

// ---- الحساب ----
const exams = () => (T.exams = Array.isArray(T.exams) ? T.exams : []);
const exOf = (id) => exams().find((x) => x.id === id);
const exTotal = (x) => x.qs.reduce((n, q) => n + q.mark, 0);
const exRes = (x, cls) => ((x.res = x.res || {})[cls] = x.res[cls] || {});
// درجة السؤال: الاختيار والصح/الخطأ تُصحَّح بالمقارنة، والمقالي بما يضعه المعلم
function exQScore(q, r) {
  if (q.type === 'text') return typeof (r.m || {})[q.id] === 'number' ? r.m[q.id] : null;
  const a = (r.a || {})[q.id];
  if (a === undefined) return null;
  return a === q.ans ? q.mark : 0;
}
function exScore(x, r) {
  if (!r || r.abs) return null;
  if (typeof r.s === 'number') return r.s;
  const qs = x.qs.map((q) => exQScore(q, r));
  return qs.some((v) => v !== null) ? qs.reduce((n, v) => n + (v || 0), 0) : null;
}
const exDone = (x, r) => r && !r.abs && (typeof r.s === 'number' || x.qs.every((q) => exQScore(q, r) !== null));
function exStats(x, cls) {
  const R = exRes(x, cls), list = studentsIn(cls), sc = list.map((s) => exScore(x, R[s.id])).filter((v) => v !== null), tot = exTotal(x);
  return { n: list.length, done: list.filter((s) => exDone(x, R[s.id])).length, abs: list.filter((s) => R[s.id] && R[s.id].abs).length, sc, tot,
    avg: sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : 0, hi: sc.length ? Math.max(...sc) : 0, lo: sc.length ? Math.min(...sc) : 0, pass: sc.filter((v) => v >= tot / 2).length };
}
// أعمال السنة: درجة البند = متوسط نسب الطالب في الاختبارات المرتبطة به × درجته الكاملة (لأقرب نصف)
function exToYW(sid) {
  const s = stuOf(sid);
  if (!s) return;
  for (const y of T.yw) {
    const linked = exams().filter((x) => x.yw === y.k && x.qs.length);
    const p = linked.map((x) => { const v = exScore(x, ((x.res || {})[s.cls] || {})[sid]); return v === null ? null : v / exTotal(x); }).filter((v) => v !== null);
    if (!p.length) continue;
    T.marksYW[sid] = T.marksYW[sid] || {};
    T.marksYW[sid][y.k] = Math.round((p.reduce((a, b) => a + b, 0) / p.length) * y.max * 2) / 2;
  }
}
// نموذج ب: الأسئلة والاختيارات بترتيب آخر ثابت لكل اختبار
function exSeed(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909), (h >>> 0) / 4294967296)); }
function exShuffle(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// [{ q, order: ترتيب الاختيارات الأصلية }] بحسب النموذج
function exModel(x, b) {
  // أسئلة كل نوع معاً (الاختيار ثم الصح والخطأ ثم المقالي)، كما في الورقة المطبوعة
  if (!b) return ['mc', 'tf', 'text'].flatMap((t) => x.qs.filter((q) => q.type === t).map((q) => ({ q, order: q.opts.map((_, i) => i) })));
  const rnd = exSeed(`${x.id}b`);
  const qs = x.qs.map((q) => ({ q, order: q.type === 'mc' ? exShuffle(q.opts.map((_, i) => i), rnd) : [] }));
  return ['mc', 'tf', 'text'].flatMap((t) => exShuffle(qs.filter((o) => o.q.type === t), rnd));
}

// ---- قائمة الاختبارات ----
Views.exams = () => (UI.ex && exOf(UI.ex) ? (UI.exCls && clsOf(UI.exCls) ? viewExGrade(exOf(UI.ex), UI.exCls) : viewExam(exOf(UI.ex))) : viewExams());
function viewExams() {
  const list = exams().slice().sort((a, b) => (b.d || '').localeCompare(a.d || ''));
  return `<header class="home-h"><div><h1>الاختبارات</h1><p>أعدّ أسئلتك واطبعها وصحّحها، وتنتقل الدرجات وحدها</p></div>
      <div class="round-btns"><button type="button" class="round" data-act="ex-new" aria-label="اختبار جديد">${ic('plus')}</button></div></header>
    ${list.length ? `<div class="ex-list">${list.map((x) => {
      const cls = Object.keys(x.res || {}).filter((c) => clsOf(c));
      return `<button type="button" class="ex-card" data-act="go" data-h="#exams/${x.id}"><i>${ic('file-pen')}</i><span class="grow"><b>${esc(x.title)}</b>
        <small><em>${x.qs.length} أسئلة</em><em>الدرجة ${fmtScore(exTotal(x))}</em>${cls.map((c) => { const st = exStats(x, c); return st.sc.length ? `<em class="ok">${esc(clsOf(c).name)}: ${fmtScore(Math.round(st.avg * 10) / 10)}</em>` : ''; }).join('')}</small></span>${ic('next', 'chev')}</button>`;
    }).join('')}</div>`
    : `<div class="home-empty"><i>${ic('file-pen')}</i><h2>أول اختبار لك</h2><p>اكتب الدرس، وانسخ الطلب الجاهز إلى Claude، ثم الصق الأسئلة. تطبعها بنموذجين، وتصحّحها بالضغط، فتنتقل الدرجة إلى أعمال السنة.</p><button type="button" class="blue-btn" data-act="ex-new">${ic('plus')} اختبار جديد</button></div>`}`;
}

// ---- إعداد الاختبار: الطلب الجاهز، ثم الأسئلة نصاً مع معاينة ----
let exD = null;
Acts['ex-new'] = () => { exD = { id: '', topic: '', n: 10, types: ['mc', 'tf'], text: '', yw: T.yw.find((y) => y.k === 'test') ? 'test' : '', ex: false }; openSheet(exForm(), exForm, 'gray'); };
Acts['ex-edit'] = (el) => { const x = exOf(el.dataset.id); exD = { id: x.id, topic: x.lesson, n: 10, types: ['mc', 'tf'], text: exText(x), yw: x.yw || '', ex: false }; openSheet(exForm(), exForm, 'gray'); };
function exForm() {
  return `<h3>${exD.id ? 'عدّل الاختبار' : 'اختبار جديد'}</h3>
    ${exD.id ? '' : `<div class="sm-card"><h4 class="ex-step"><b>1</b> اطلب الأسئلة من Claude</h4>
      <label>الدرس أو الموضوع<input id="exTopic" data-input="ex-f" data-f="topic" value="${esc(exD.topic)}" placeholder="مثل: الطهارة وأقسام المياه"></label>
      <p class="hint">عدد الأسئلة</p><div class="chips">${[5, 10, 15, 20].map((n) => `<button type="button" class="chip${exD.n === n ? ' on' : ''}" data-act="ex-n" data-n="${n}">${n}</button>`).join('')}</div>
      <p class="hint">أنواعها</p><div class="chips">${[['mc', 'اختيار من متعدد'], ['tf', 'صح وخطأ'], ['text', 'مقالي']].map(([k, n]) => `<button type="button" class="chip${exD.types.includes(k) ? ' on' : ''}" data-act="ex-type" data-k="${k}">${n}</button>`).join('')}</div>
      <button type="button" class="blue-btn wide" data-act="ex-ask">${ic('paper-plane')} انسخ الطلب وافتح Claude</button>
      <p class="hint">يُنسخ الطلب ويُفتح Claude. إن لم يُكتب الطلب هناك فالصقه، ثم انسخ الأسئلة التي يكتبها وارجع.</p></div>`}
    <div class="sm-card"><h4 class="ex-step"><b>${exD.id ? '' : '2'}</b> ${exD.id ? 'الأسئلة' : 'الصق الأسئلة هنا (أو اكتبها)'}</h4>
      <div class="row2 tight"><button type="button" class="ghost-btn sm" data-act="ex-paste">${ic('clipboard')} الصق</button><button type="button" class="ghost-btn sm" data-act="ex-ex">${exD.ex ? 'أخفِ المثال' : 'كيف أكتبها؟'}</button></div>
      ${exD.ex ? `<pre class="ex-pre">${esc(EX_EXAMPLE)}</pre>` : ''}
      <textarea id="exText" data-input="ex-text" rows="8" dir="rtl" placeholder="س1: ...&#10;أ) ...&#10;ب) ...&#10;الإجابة: أ">${esc(exD.text)}</textarea></div>
    <div id="exPrev">${exTail()}</div>`;
}
// المعاينة وزر الحفظ: يتحدثان مع الكتابة وحدهما، فلا تُعاد خانة الكتابة ولا يُغلق المفتاح
function exTail() {
  const P = exD.text.trim() ? exParse(exD.text) : null, bad = P ? P.qs.filter((q) => q.bad) : [];
  const graded = exD.id && Object.values(exOf(exD.id).res || {}).some((r) => Object.keys(r).length);
  return `${exPrevHTML(P)}
    ${P && P.qs.length ? `<div class="sm-card"><label>عنوان الاختبار<input id="exTitle" data-input="ex-f" data-f="title" value="${esc(exD.title ?? P.title ?? '')}" placeholder="${esc(P.title || exD.topic || 'اختبار قصير')}"></label>
      <p class="hint">تنتقل درجته إلى أعمال السنة في بند:</p><div class="chips">${[...T.yw.map((y) => [y.k, y.name]), ['', 'لا تنقلها']].map(([k, n]) => `<button type="button" class="chip${exD.yw === k ? ' on' : ''}" data-act="ex-yw" data-k="${k}">${esc(n)}</button>`).join('')}</div>
      ${graded ? '<p class="hint red">صُحّح هذا الاختبار: الأسئلة التي لم يتغير نصها تبقى إجابات الطلاب عليها.</p>' : ''}
      <button type="button" class="blue-btn wide" data-act="ex-save"${bad.length ? ' disabled' : ''}>${ic('check')} احفظ الاختبار (${P.qs.length} أسئلة)</button>
      ${bad.length ? `<p class="hint red center">صحّح الأسئلة المعلّمة بالأحمر أولاً (${bad.length})</p>` : ''}</div>` : ''}`;
}
function exPrevHTML(P) {
  if (!P) return '';
  if (!P.qs.length) return '<p class="hint red center">لم أجد أسئلة. يبدأ كل سؤال بـ«س1:» أو «1-».</p>';
  return `<div class="sm-card"><h4 class="ex-step">المعاينة: ${P.qs.length} أسئلة | الدرجة ${fmtScore(P.qs.reduce((n, q) => n + q.mark, 0))}</h4>
    ${P.qs.map((q, i) => `<div class="ex-q${q.bad ? ' bad' : ''}"><b>س${i + 1}: ${esc(q.q)}</b> <em>${{ mc: 'اختيار', tf: 'صح وخطأ', text: 'مقالي' }[q.type]}${q.mark !== 1 ? ` | ${fmtScore(q.mark)} درجات` : ''}</em>
      ${q.type === 'mc' ? `<ol class="ex-opts">${q.opts.map((o, j) => `<li class="${q.ans === j ? 'ok' : ''}"><span>${LETTERS[j]})</span> ${esc(o)}</li>`).join('')}</ol>` : ''}
      ${q.type === 'tf' && q.ans !== null ? `<p class="ex-a">الإجابة: ${q.ans ? 'صح' : 'خطأ'}</p>` : ''}${q.type === 'text' && q.ans ? `<p class="ex-a">الإجابة: ${esc(q.ans)}</p>` : ''}
      ${q.bad ? `<p class="red">${ic('circle-exclamation')} ${esc(q.bad)}</p>` : ''}</div>`).join('')}
    ${P.stray.length ? `<p class="hint">أسطر لم أفهمها ولن تُحفظ: ${P.stray.slice(0, 3).map((s) => `«${esc(s.slice(0, 40))}»`).join('، ')}${P.stray.length > 3 ? '…' : ''}</p>` : ''}</div>`;
}
Inputs['ex-f'] = (el) => { exD[el.dataset.f] = el.value; };
// المعاينة تتحدث مع الكتابة دون أن يخرج المؤشر من الخانة
let exTimer = null;
Inputs['ex-text'] = (el) => {
  exD.text = el.value;
  clearTimeout(exTimer);
  exTimer = setTimeout(() => { if ($('exPrev')) $('exPrev').innerHTML = exTail(); }, 350);
};
Acts['ex-n'] = (el) => { exD.n = Number(el.dataset.n); refresh(); };
Acts['ex-type'] = (el) => { const k = el.dataset.k; exD.types = exD.types.includes(k) ? exD.types.filter((t) => t !== k) : [...exD.types, k]; if (!exD.types.length) exD.types = [k]; refresh(); };
Acts['ex-yw'] = (el) => { exD.yw = el.dataset.k; refresh(); };
Acts['ex-ex'] = () => { exD.ex = !exD.ex; refresh(); };
Acts['ex-ask'] = async () => {
  const p = exPrompt(exD.topic.trim(), exD.n, exD.types);
  try { await navigator.clipboard.writeText(p); toast('نُسخ الطلب'); } catch { toast('لم يُنسخ الطلب تلقائياً'); }
  window.open(`https://claude.ai/new?q=${encodeURIComponent(p)}`, '_blank');
};
Acts['ex-paste'] = async () => {
  try { const t = await navigator.clipboard.readText(); if (!t.trim()) { toast('لا يوجد نص منسوخ'); return; } exD.text = t; refresh(); } catch { toast('اضغط مطولاً في الخانة ثم «لصق»'); $('exText').focus(); }
};
Acts['ex-save'] = () => {
  const P = exParse(exD.text);
  if (!P.qs.length || P.qs.some((q) => q.bad)) return;
  const title = (exD.title || '').trim() || P.title || exD.topic.trim() || 'اختبار قصير';
  let x = exD.id && exOf(exD.id);
  if (x) {
    // السؤال الذي لم يتغير نصه ونوعه يحتفظ بمعرّفه، فتبقى إجابات الطلاب عليه
    const old = x.qs.slice();
    for (const q of P.qs) { const o = old.find((z) => z.q === q.q && z.type === q.type); if (o) { q.id = o.id; old.splice(old.indexOf(o), 1); } }
    Object.assign(x, { title, lesson: P.lesson || x.lesson, yw: exD.yw, qs: P.qs.map(({ bad, ...q }) => q) });
  } else {
    x = { id: uid(), title, lesson: P.lesson || exD.topic.trim(), d: today(), yw: exD.yw, qs: P.qs.map(({ bad, ...q }) => q), res: {} };
    exams().push(x);
  }
  for (const s of T.students) exToYW(s.id);
  exD = null;
  save(); closeSheet(); go(`#exams/${x.id}`, true); toast('حُفظ الاختبار');
};

// ---- صفحة الاختبار: الطباعة والفصول ----
function viewExam(x) {
  return `<header class="cls-h"><button type="button" class="round" data-act="go" data-h="#exams" aria-label="رجوع">${ic('back')}</button><h1>${esc(x.title)}</h1>
      <div class="round-btns"><button type="button" class="round" data-act="ex-more" data-id="${x.id}" aria-label="خيارات">${ic('more')}</button></div></header>
    <section class="ex-hero"><div><b>${x.qs.length}</b><small>أسئلة</small></div><div><b>${fmtScore(exTotal(x))}</b><small>الدرجة</small></div><div><b>${esc(x.yw ? (T.yw.find((y) => y.k === x.yw) || {}).name || '-' : '-')}</b><small>في أعمال السنة</small></div></section>
    ${x.lesson ? `<p class="hint ex-lesson">${ic('book-open')} ${esc(x.lesson)}</p>` : ''}
    <div class="card"><h3>${ic('print')} الطباعة</h3><div class="ex-print">
      <button type="button" class="ghost-btn" data-act="ex-print" data-m="a">نموذج أ</button><button type="button" class="ghost-btn" data-act="ex-print" data-m="b">نموذج ب</button><button type="button" class="ghost-btn" data-act="ex-print" data-m="key">نموذج الإجابة</button></div>
      <p class="hint">نموذج ب: الأسئلة نفسها بترتيب آخر حتى لا ينقل الطالب من جاره.</p></div>
    <div class="card"><h3>${ic('check')} التصحيح ورصد الدرجات</h3>${T.classes.length ? T.classes.map((c) => { const st = exStats(x, c.id); return `<button type="button" class="ex-cls" data-act="go" data-h="#exams/${x.id}/${c.id}"><span class="grow"><b>${esc(c.name)}</b>
      <small>${st.done || st.sc.length ? `صُحّح ${st.done} من ${st.n}${st.sc.length ? ` | المتوسط ${fmtScore(Math.round(st.avg * 10) / 10)} من ${fmtScore(st.tot)}` : ''}` : 'لم يُصحَّح بعد'}</small></span><span class="blue-btn sm">صحّح</span></button>`; }).join('') : '<p class="hint">أضف فصلاً أولاً.</p>'}</div>`;
}
let exMoreId = '';
Acts['ex-more'] = (el) => {
  exMoreId = el.dataset.id;
  openSheet(`<h3>${esc(exOf(exMoreId).title)}</h3><div class="menu"><button type="button" data-act="ex-edit" data-id="${exMoreId}">${ic('pen')} عدّل الأسئلة أو البند</button>
    <button type="button" data-act="ex-copy">${ic('clipboard')} انسخ الأسئلة نصاً</button><button type="button" class="red" data-act="ex-del">${ic('trash')} احذف الاختبار</button></div>`);
};
Acts['ex-copy'] = async () => { try { await navigator.clipboard.writeText(exText(exOf(exMoreId))); toast('نُسخت الأسئلة'); } catch { toast('تعذّر النسخ'); } };
Acts['ex-del'] = (el) => {
  if (!armed(el)) return;
  T.exams = exams().filter((x) => x.id !== exMoreId);
  save(); closeSheet(); go('#exams', true); toast('حُذف الاختبار، ودرجات أعمال السنة كما هي');
};
Acts['ex-print'] = (el) => {
  const x = exOf(UI.ex), m = el.dataset.m, st = T.settings;
  if (m === 'key') {
    const row = (b) => exModel(x, b).map(({ q, order }, i) => `<tr><td>س${i + 1}</td><td>${q.type === 'mc' ? `${LETTERS[order.indexOf(q.ans)]}) ${esc(q.opts[q.ans])}` : q.type === 'tf' ? (q.ans ? 'صح' : 'خطأ') : esc(q.ans || '')}</td><td>${fmtScore(q.mark)}</td></tr>`).join('');
    printForm(`نموذج الإجابة: ${x.title}`, `<h1>نموذج الإجابة: ${esc(x.title)}</h1><div class="two"><div><h2>نموذج أ</h2><table class="k"><tr><th>السؤال</th><th>الإجابة</th><th>الدرجة</th></tr>${row(false)}</table></div>
      <div><h2>نموذج ب</h2><table class="k"><tr><th>السؤال</th><th>الإجابة</th><th>الدرجة</th></tr>${row(true)}</table></div></div>`, '.two{display:grid;grid-template-columns:1fr 1fr;gap:6mm}.k th,.k td{width:auto}.k td:first-child{white-space:nowrap}h2{font-size:13pt;margin:0}');
    return;
  }
  const b = m === 'b', qs = exModel(x, b);
  const secs = [['mc', 'اختر الإجابة الصحيحة بوضع دائرة حول حرفها'], ['tf', 'ضع علامة (✓) أمام العبارة الصحيحة وعلامة (✗) أمام الخاطئة'], ['text', 'أجب عما يأتي']];
  let n = 0;
  const body = secs.map(([t, head]) => { const list = qs.filter((o) => o.q.type === t); if (!list.length) return ''; return `<h3>${head}:</h3>${list.map(({ q, order }) => { n++; return `<div class="q"><p><b>س${n}:</b> ${esc(q.q)} <span class="mk">(${fmtScore(q.mark)})</span>${t === 'tf' ? '<span class="tf">(&nbsp;&nbsp;&nbsp;&nbsp;)</span>' : ''}</p>
    ${t === 'mc' ? `<div class="op">${order.map((j, k) => `<span><b>${LETTERS[k]})</b> ${esc(q.opts[j])}</span>`).join('')}</div>` : ''}${t === 'text' ? '<div class="ln"></div>'.repeat(Math.max(2, Math.ceil(q.mark * 1.5))) : ''}</div>`; }).join('')}`; }).join('');
  printForm(x.title, `<table class="hd2"><tr><th>اسم الطالب</th><td></td><th>الفصل</th><td style="width:22%"></td></tr><tr><th>الدرجة</th><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / ${fmtScore(exTotal(x))}</td><th>النموذج</th><td>${b ? 'ب' : 'أ'}</td></tr></table>
    <h1>${esc(x.title)}</h1>${x.lesson ? `<p class="ls">${esc(x.lesson)}</p>` : ''}${body}<p class="end">انتهت الأسئلة، وفقك الله.</p>
    <div class="sig"><div>معلم المادة<b>${esc(st.teacher || '')}</b></div><div>المراجعة<b>&nbsp;</b></div></div>`,
  'body{margin:10mm 12mm;font-size:13pt}.hd2 th{width:14%;white-space:nowrap}h1{margin:3mm 0 1mm;font-size:16pt}.ls{text-align:center;margin:0 0 3mm;color:#444}h3{font-size:12.5pt;background:#eef4f0;padding:1mm 3mm;border-radius:2mm;margin:5mm 0 2mm}.q{page-break-inside:avoid;margin:0 0 3mm}.q p{margin:0}.mk{color:#666;font-size:10pt}.tf{float:left;font-weight:700}.op{display:grid;grid-template-columns:1fr 1fr;gap:1mm 6mm;padding-inline-start:6mm}.ln{border-bottom:1px dotted #888;height:8mm}.end{text-align:center;margin-top:6mm;font-weight:700}');
};

// ---- التصحيح: بطاقة لكل طالب، والنافذة تُظهر الأسئلة بأزرار ----
let exGr = null;
function viewExGrade(x, cls) {
  const R = exRes(x, cls), st = exStats(x, cls), tot = exTotal(x);
  const hard = x.qs.filter((q) => q.type !== 'text').map((q) => { const got = Object.values(R).filter((r) => !r.abs && (r.a || {})[q.id] !== undefined); return { q, n: got.length, ok: got.filter((r) => r.a[q.id] === q.ans).length }; }).filter((h) => h.n).sort((a, b) => a.ok / a.n - b.ok / b.n).slice(0, 3);
  return `<header class="cls-h"><button type="button" class="round" data-act="go" data-h="#exams/${x.id}" aria-label="رجوع">${ic('back')}</button><h1>${esc(clsOf(cls).name)}</h1>
      <div class="round-btns"><button type="button" class="round" data-act="ex-res-print" aria-label="اطبع النتائج">${ic('print')}</button></div></header>
    <p class="hint ex-lesson">${ic('file-pen')} ${esc(x.title)} | الدرجة ${fmtScore(tot)}</p>
    ${st.sc.length ? `<section class="ex-hero"><div><b>${fmtScore(Math.round(st.avg * 10) / 10)}</b><small>المتوسط</small></div><div><b>${fmtScore(st.hi)}</b><small>الأعلى</small></div><div><b>${fmtScore(st.lo)}</b><small>الأدنى</small></div><div><b>${st.pass} من ${st.sc.length}</b><small>نجحوا</small></div></section>
      ${hard.length ? `<div class="card"><h3>${ic('circle-exclamation')} أصعب الأسئلة عليهم</h3>${hard.map((h) => `<div class="li"><span class="grow">${esc(h.q.q)}</span><b class="${h.ok / h.n < 0.5 ? 'red' : ''}">${Math.round((h.ok / h.n) * 100)}%</b></div>`).join('')}<p class="hint">نسبة من أجاب إجابة صحيحة.</p></div>` : ''}
      <button type="button" class="wa-bar" data-act="ex-notify">${ic('send')} أرسل الدرجات لأولياء الأمور</button>` : ''}
    <div class="cards one">${studentsIn(cls).map((s) => { const r = R[s.id], v = exScore(x, r), done = exDone(x, r); return `<div class="scard ex-s" data-act="ex-grade" data-id="${s.id}">
      <div class="sc-av">${AVATAR}</div><div class="sc-body"><div class="sc-top"><b class="sc-name">${esc(s.name)}</b>${r && r.abs ? '<span class="st-pill" style="--c:#ef4b5f">غائب</span>' : v !== null ? `<span class="pill-blue${done ? '' : ' part'}">${fmtScore(v)} / ${fmtScore(tot)}</span>` : '<span class="st-pill" style="--c:#c7c7cc">صحّح</span>'}</div>
      ${v !== null ? `<div class="ex-bar"><i style="width:${(v / tot) * 100}%"></i></div>` : ''}</div></div>`; }).join('')}</div>`;
}
Acts['ex-grade'] = (el) => { exGr = { sid: el.dataset.id, b: exGr ? exGr.b : false, quick: false }; openSheet(exGradeHTML(), exGradeHTML, 'gray'); };
function exGradeHTML() {
  const x = exOf(UI.ex), s = stuOf(exGr.sid);
  if (!x || !s) return '';
  const R = exRes(x, UI.exCls), r = R[s.id] || {}, v = exScore(x, r), tot = exTotal(x);
  const qs = exModel(x, exGr.b);
  return `<div class="ev-head small">${AVATAR}<b>${esc(s.name)}</b><span class="ex-live">${r.abs ? 'غائب' : `${v === null ? '-' : fmtScore(v)} / ${fmtScore(tot)}`}</span></div>
    <div class="chips ex-mode"><button type="button" class="chip${exGr.b ? '' : ' on'}" data-act="ex-b" data-b="">نموذج أ</button><button type="button" class="chip${exGr.b ? ' on' : ''}" data-act="ex-b" data-b="1">نموذج ب</button>
      <button type="button" class="chip${exGr.quick ? ' on' : ''}" data-act="ex-quick">الدرجة فقط</button><button type="button" class="chip${r.abs ? ' on red-on' : ''}" data-act="ex-abs">غائب</button></div>
    ${r.abs ? '' : exGr.quick ? `<form data-submit="ex-quick-save"><input id="exQ" class="big-in" inputmode="decimal" enterkeyhint="next" value="${typeof r.s === 'number' ? r.s : ''}" placeholder="${fmtScore(tot)}"><button class="blue-btn wide">${ic('check')} احفظ والتالي</button></form>`
    : `<p class="hint">اضغط ما أجاب به الطالب، فيُصحَّح وحده.</p>${qs.map(({ q, order }, i) => { const a = (r.a || {})[q.id], qv = exQScore(q, r); return `<div class="ex-g${qv === null ? '' : qv >= q.mark ? ' ok' : qv > 0 ? ' half' : ' no'}"><p><b>س${i + 1}:</b> ${esc(q.q)} <em>(${fmtScore(q.mark)})</em></p>
      ${q.type === 'mc' ? `<div class="ex-btns">${order.map((j, k) => `<button type="button" class="${a === j ? (j === q.ans ? 'ok' : 'no') : ''}" data-act="ex-a" data-q="${q.id}" data-v="${j}"><b>${LETTERS[k]}</b>${esc(q.opts[j])}</button>`).join('')}</div>`
      : q.type === 'tf' ? `<div class="ex-btns two">${[[true, 'صح'], [false, 'خطأ']].map(([b, n]) => `<button type="button" class="${a === b ? (b === q.ans ? 'ok' : 'no') : ''}" data-act="ex-a" data-q="${q.id}" data-v="${b ? 't' : 'f'}">${n}</button>`).join('')}</div>`
      : `${q.ans ? `<p class="ex-a">الإجابة: ${esc(q.ans)}</p>` : ''}<div class="ex-btns marks">${Array.from({ length: q.mark * 2 + 1 }, (_, k) => k / 2).map((m) => `<button type="button" class="${(r.m || {})[q.id] === m ? 'on' : ''}" data-act="ex-m" data-q="${q.id}" data-v="${m}">${fmtScore(m)}</button>`).join('')}</div>`}</div>`; }).join('')}`}
    <div class="row2"><button type="button" class="blue-btn" data-act="ex-next">${ic('next')} الطالب التالي</button><button type="button" class="ghost-btn" data-act="ex-clear">امسح تصحيحه</button></div>`;
}
function exR() { const R = exRes(exOf(UI.ex), UI.exCls); return (R[exGr.sid] = R[exGr.sid] || {}); }
function exAfter() { const r = exR(); r.at = Date.now(); exToYW(exGr.sid); save(); refresh(); }
Acts['ex-a'] = (el) => {
  const r = exR(), q = exOf(UI.ex).qs.find((z) => z.id === el.dataset.q), v = q.type === 'tf' ? el.dataset.v === 't' : Number(el.dataset.v);
  r.a = r.a || {};
  if (r.a[q.id] === v) delete r.a[q.id]; else r.a[q.id] = v;
  delete r.s;
  if (navigator.vibrate) navigator.vibrate(10);
  exAfter();
};
Acts['ex-m'] = (el) => { const r = exR(); r.m = r.m || {}; const v = Number(el.dataset.v); if (r.m[el.dataset.q] === v) delete r.m[el.dataset.q]; else r.m[el.dataset.q] = v; delete r.s; exAfter(); };
Acts['ex-b'] = (el) => { exGr.b = !!el.dataset.b; refresh(); };
Acts['ex-quick'] = () => { exGr.quick = !exGr.quick; refresh(); if (exGr.quick) setTimeout(() => $('exQ') && $('exQ').focus(), 60); };
Acts['ex-abs'] = () => { const r = exR(); r.abs = !r.abs; exAfter(); };
Acts['ex-quick-save'] = () => {
  const v = num($('exQ').value), tot = exTotal(exOf(UI.ex));
  if (v !== null && (v < 0 || v > tot)) { toast(`الدرجة من صفر إلى ${fmtScore(tot)}`); return; }
  const r = exR();
  if (v === null) delete r.s; else r.s = v;
  exAfter();
  Acts['ex-next']();
  if (exGr.quick) setTimeout(() => $('exQ') && $('exQ').focus(), 60);
};
Acts['ex-clear'] = (el) => {
  if (!armed(el)) return;
  delete exRes(exOf(UI.ex), UI.exCls)[exGr.sid];
  // تعود درجة أعمال السنة لما تقوله بقية الاختبارات (أو تبقى كما هي إن لم يبق غيره)
  exToYW(exGr.sid); save(); refresh();
};
Acts['ex-next'] = () => {
  const list = studentsIn(UI.exCls), i = list.findIndex((s) => s.id === exGr.sid);
  if (i < list.length - 1) { exGr.sid = list[i + 1].id; refresh(); $('sheetBody').scrollTop = 0; } else { closeSheet(); toast('انتهى الفصل'); }
};
// إبلاغ أولياء الأمور بالدرجة: رسالة لكل طالب باسمه
let exSent = new Set();
Acts['ex-notify'] = () => { exSent = new Set(); openSheet(exNotifyHTML(), exNotifyHTML); };
function exNotifyHTML() {
  const x = exOf(UI.ex), R = exRes(x, UI.exCls), list = studentsIn(UI.exCls).filter((s) => exScore(x, R[s.id]) !== null);
  return `<h3>أرسل الدرجات</h3><p class="hint">«أرسل» يفتح واتساب والرسالة مكتوبة باسم الطالب ودرجته.</p>
    <ul class="send-list">${list.map((s) => `<li class="${exSent.has(s.id) ? 'sent' : ''}"><span class="grow">${esc(s.name)} <small class="hint">${fmtScore(exScore(x, R[s.id]))} / ${fmtScore(exTotal(x))}</small></span>${phoneOk(s.phone) ? `<button type="button" class="${exSent.has(s.id) ? 'ghost-btn' : 'wa-btn'} sm" data-act="ex-send" data-id="${s.id}">${exSent.has(s.id) ? 'أُرسلت' : 'أرسل'}</button>` : '<small class="hint">بلا جوال</small>'}</li>`).join('')}</ul>`;
}
Acts['ex-send'] = (el) => {
  const x = exOf(UI.ex), s = stuOf(el.dataset.id), v = exScore(x, exRes(x, UI.exCls)[s.id]), tot = exTotal(x);
  const word = v >= tot * 0.9 ? 'ممتازة، بارك الله فيه' : v >= tot * 0.7 ? 'جيدة، ونرجو له المزيد' : v >= tot / 2 ? 'مقبولة، ويحتاج إلى مراجعة' : 'تحتاج إلى متابعة ومراجعة معه في البيت';
  logAct('msg:test', s.id);
  window.open(waLink(s.phone, `السلام عليكم ورحمة الله وبركاته\nولي أمر الطالب ${s.name} حفظه الله\nحصل ابنكم في «${x.title}» بمادة ${T.settings.subject} على ${fmtScore(v)} من ${fmtScore(tot)}، وهي درجة ${word}.${sig()}`), '_blank');
  exSent.add(s.id); refresh();
};
Acts['ex-res-print'] = () => {
  const x = exOf(UI.ex), R = exRes(x, UI.exCls), st = exStats(x, UI.exCls), tot = exTotal(x);
  printForm(`نتائج ${x.title}`, `<h1>نتائج ${esc(x.title)}</h1><table><tr><th>الفصل</th><td>${esc(clsOf(UI.exCls).name)}</td></tr><tr><th>المتوسط</th><td>${fmtScore(Math.round(st.avg * 10) / 10)} من ${fmtScore(tot)} | الأعلى ${fmtScore(st.hi)} | الأدنى ${fmtScore(st.lo)} | نجح ${st.pass} من ${st.sc.length}</td></tr></table>
    <table class="r"><tr><th>م</th><th>الطالب</th><th>الدرجة</th><th>النسبة</th></tr>${studentsIn(UI.exCls).map((s, i) => { const r = R[s.id], v = exScore(x, r); return `<tr><td>${i + 1}</td><td>${esc(s.name)}</td><td>${r && r.abs ? 'غائب' : v === null ? '' : `${fmtScore(v)} / ${fmtScore(tot)}`}</td><td>${v === null ? '' : `${Math.round((v / tot) * 100)}%`}</td></tr>`; }).join('')}</table>${teacherSig()}`, '.r th,.r td{width:auto}');
};
