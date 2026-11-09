'use strict';
// الإصدار ٢١: جدول الحصص الأسبوعي، ولوحة الفصل (كل الطلاب في شاشة واحدة)، والتسميع بالسورة والآيات،
// والملاحظة المكتوبة بأيقونة، وعدد الأسابيع بلا ملاحظة سلبية.

// ---- جدول الحصص: T.sched['<اليوم>-<الحصة>'] = الفصل ----
const SCH_DAYS = [0, 1, 2, 3, 4];
const PER_N = 7;
const PER_NAMES = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة'];
const PER_TIMES = ['07:00', '07:45', '08:30', '09:35', '10:20', '11:05', '11:50'];
const PER_LEN = 45;
const perTimes = () => PER_TIMES.map((t, i) => ((T.settings.perTimes || [])[i] || t));
const perName = (p) => `الحصة ${PER_NAMES[p - 1] || p}`;
const clsColor = (id) => CLS_COLORS[Math.max(0, T.classes.findIndex((c) => c.id === id)) % CLS_COLORS.length][0];
// حصص يوم: [{p, cls}] بترتيب الحصص
function dayPers(d = today()) {
  const w = parseD(d).getDay(), out = [];
  for (let p = 1; p <= PER_N; p++) { const c = T.sched[`${w}-${p}`]; if (c && clsOf(c)) out.push({ p, cls: c }); }
  return out;
}
const perOf = (cls, d = today()) => dayPers(d).filter((x) => x.cls === cls).map((x) => x.p);
const mins = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };
// الحصة الجارية الآن (بأوقات البداية)، وصفر إن لم تكن حصة
function perNow() {
  const n = new Date(), now = n.getHours() * 60 + n.getMinutes(), t = perTimes();
  for (let p = 1; p <= PER_N; p++) if (now >= mins(t[p - 1]) && now < mins(t[p - 1]) + PER_LEN) return p;
  return 0;
}
// حصة الفصل التي يُربط بها ما يُرصد الآن: إن كانت له حصة واحدة اليوم فهي، وإلا الجارية أو آخر ما بدأ منها
function perFor(cls) {
  const ps = perOf(cls);
  if (ps.length < 2) return ps[0] || 0;
  const now = perNow();
  if (ps.includes(now)) return now;
  const n = new Date(), m = n.getHours() * 60 + n.getMinutes(), t = perTimes();
  return ps.filter((p) => mins(t[p - 1]) <= m).pop() || ps[0];
}

// حصص اليوم في الرئيسية
function todayPersHTML() {
  const list = dayPers();
  if (!list.length) return Object.keys(T.sched).length || !T.classes.length ? '' : `<button type="button" class="sch-add" data-act="sch-open">${ic('calendar-days')} أضف جدول حصصك</button>`;
  const now = perNow();
  return `<div class="pers"><b>${ic('calendar-days')} حصص اليوم</b><div class="pers-row">${list.map(({ p, cls }) => `<button type="button" class="per${p === now ? ' now' : ''}" style="--c:${clsColor(cls)}" data-act="go" data-h="#c/${cls}/follow"><small>${PER_NAMES[p - 1]}${p === now ? ' | الآن' : ''}</small>${esc(clsOf(cls).name)}</button>`).join('')}</div></div>`;
}

// تعديل الجدول: اختر الفصل ثم اضغط خانات حصصه
let schBrush = '';
Acts['sch-open'] = () => { if (!clsOf(schBrush)) schBrush = (T.classes[0] || {}).id || ''; openSheet(schHTML(), schHTML, 'wide'); };
function schHTML() {
  const n = Object.keys(T.sched).filter((k) => clsOf(T.sched[k])).length;
  return `<h3>جدول الحصص <small class="hint">(${n} ${n > 2 && n < 11 ? 'حصص' : 'حصة'} في الأسبوع)</small></h3>
    <p class="hint">اختر الفصل، ثم اضغط خانات حصصه. الضغطة الثانية تمسح الخانة.</p>
    <div class="sch-brush">${T.classes.map((c) => `<button type="button" class="${schBrush === c.id ? 'on' : ''}" style="--c:${clsColor(c.id)}" data-act="sch-brush" data-id="${c.id}">${esc(c.name)}</button>`).join('')}<button type="button" class="er${schBrush === '' ? ' on' : ''}" data-act="sch-brush" data-id="">${ic('eraser')} امسح</button></div>
    <div class="sch-grid"><span></span>${PER_NAMES.map((x, i) => `<span class="sch-ph">${i + 1}</span>`).join('')}
      ${SCH_DAYS.map((w) => `<span class="sch-day">${AR_DAYS[w]}</span>${Array.from({ length: PER_N }, (_, i) => { const c = clsOf(T.sched[`${w}-${i + 1}`]); return `<button type="button" class="sch-cell${c ? ' on' : ''}"${c ? ` style="--c:${clsColor(c.id)}"` : ''} data-act="sch-cell" data-k="${w}-${i + 1}" aria-label="${AR_DAYS[w]} ${perName(i + 1)}">${c ? esc(c.name) : ''}</button>`; }).join('')}`).join('')}</div>
    <details class="sch-times"><summary>${ic('clock')} أوقات بداية الحصص (لمعرفة حصتك الآن)</summary><div>${perTimes().map((t, i) => `<label>${PER_NAMES[i]}<input type="time" data-input="per-time" data-i="${i}" value="${t}"></label>`).join('')}</div></details>
    <button type="button" class="blue-btn wide" data-act="close-sheet">${ic('check')} تم</button>`;
}
Acts['sch-brush'] = (el) => { schBrush = el.dataset.id; refresh(); };
Acts['sch-cell'] = (el) => {
  const k = el.dataset.k;
  if (!schBrush || T.sched[k] === schBrush) delete T.sched[k]; else T.sched[k] = schBrush;
  save(); refresh();
};
Inputs['per-time'] = (el) => { if (!el.value) return; const t = perTimes(); t[Number(el.dataset.i)] = el.value; T.settings.perTimes = t; save(); };

// ---- سجل حصص الفصل: كل يوم رُصد فيه شيء، بحصته وغيابه وملاحظاته ----
Acts['per-log'] = () => openSheet(perLogHTML(), perLogHTML, 'gray');
function perLogHTML() {
  const cls = UI.cls, ids = new Set(studentsIn(cls).map((s) => s.id));
  const att = T.att[cls] || {};
  const days = new Set(Object.keys(att));
  const behs = T.beh.filter((b) => ids.has(b.sid));
  for (const b of behs) days.add(b.d);
  const notes = [];
  for (const sid of ids) for (const n of ((T.snotes || {})[sid] || [])) { notes.push({ ...n, sid }); days.add(n.d); }
  const list = [...days].filter((d) => d <= today()).sort().reverse().slice(0, 40);
  return `<h3>سجل حصص ${esc(clsOf(cls).name)}</h3>
    ${list.length ? list.map((d) => {
      const bs = behs.filter((b) => b.d === d).sort((a, b) => a.at - b.at);
      const ps = [...new Set([...perOf(cls, d), ...bs.map((b) => b.p).filter(Boolean)])].sort((a, b) => a - b);
      const ab = {};
      for (const [sid, v] of Object.entries(att[d] || {})) if (ids.has(sid)) (ab[v] = ab[v] || []).push(stuOf(sid));
      const ns = notes.filter((n) => n.d === d);
      return `<div class="sm-card pl-day"><div class="pl-h"><b>${dateLabel(d)}</b>${ps.length ? `<span>${ps.map(perName).join(' و')}</span>` : ''}</div>
        ${Object.keys(ab).length ? ATT.filter(([k]) => ab[k]).map(([k, n, g, c]) => `<p class="pl-att" style="--c:${c}"><i>${ic(g)}</i><b>${n}:</b> ${ab[k].map(shortName).map(esc).join('، ')}</p>`).join('') : att[d] ? `<p class="pl-att" style="--c:#66c470"><i>${ic('user-check')}</i>الكل حاضر</p>` : ''}
        ${bs.length || ns.length ? `<ul class="log">${bs.map((b) => { const L = behLook(b); return `<li><i style="--c:${L.c}">${ic(L.g)}</i><span class="grow"><b>${esc(shortName(stuOf(b.sid)))}:</b> ${esc(b.reason)}${b.t ? ` <small>${esc(b.t)}</small>` : ''}</span>${ps.length > 1 && b.p ? `<small>${PER_NAMES[b.p - 1]}</small>` : ''}<em>${fmt1(b.w)}</em></li>`; }).join('')}${ns.map((n) => `<li><i style="--c:#36b3c6">${ic('clipboard')}</i><span class="grow"><b>${esc(shortName(stuOf(n.sid)))}:</b> ${esc(n.t)}</span></li>`).join('')}</ul>` : ''}</div>`;
    }).join('') : '<p class="hint">لم يُرصد شيء لهذا الفصل بعد.</p>'}`;
}

// ---- تسجيل تقييم: مشترك بين نافذة الطالب والبطاقة واللوحة ----
function addBeh(sid, e, extra = {}) {
  const s = stuOf(sid), p = s ? perFor(s.cls) : 0;
  const b = { id: uid(), sid, d: today(), at: Date.now(), icon: e.k, reason: e.name, w: e.w, ...(p ? { p } : {}), ...extra };
  T.beh.push(b);
  return b;
}
const behUndo = (b) => () => { T.beh = T.beh.filter((x) => x.id !== b.id); save(); refresh(); };
const behToast = (b) => `${b.reason}${b.t ? ` (${b.t})` : ''}: ${shortName(stuOf(b.sid))} (${fmt1(b.w)})`;

// ---- التسميع: السورة ومن آية إلى آية ----
const SURAHS = ['الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة', 'الأنعام', 'الأعراف', 'الأنفال', 'التوبة', 'يونس', 'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر', 'النحل', 'الإسراء', 'الكهف', 'مريم', 'طه', 'الأنبياء', 'الحج', 'المؤمنون', 'النور', 'الفرقان', 'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم', 'لقمان', 'السجدة', 'الأحزاب', 'سبأ', 'فاطر', 'يس', 'الصافات', 'ص', 'الزمر', 'غافر', 'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية', 'الأحقاف', 'محمد', 'الفتح', 'الحجرات', 'ق', 'الذاريات', 'الطور', 'النجم', 'القمر', 'الرحمن', 'الواقعة', 'الحديد', 'المجادلة', 'الحشر', 'الممتحنة', 'الصف', 'الجمعة', 'المنافقون', 'التغابن', 'الطلاق', 'التحريم', 'الملك', 'القلم', 'الحاقة', 'المعارج', 'نوح', 'الجن', 'المزمل', 'المدثر', 'القيامة', 'الإنسان', 'المرسلات', 'النبأ', 'النازعات', 'عبس', 'التكوير', 'الانفطار', 'المطففين', 'الانشقاق', 'البروج', 'الطارق', 'الأعلى', 'الغاشية', 'الفجر', 'البلد', 'الشمس', 'الليل', 'الضحى', 'الشرح', 'التين', 'العلق', 'القدر', 'البينة', 'الزلزلة', 'العاديات', 'القارعة', 'التكاثر', 'العصر', 'الهمزة', 'الفيل', 'قريش', 'الماعون', 'الكوثر', 'الكافرون', 'النصر', 'المسد', 'الإخلاص', 'الفلق', 'الناس'];
const isTasE = (e) => /سم|حفظ/.test(e.name);
const tsText = (ts) => `سورة ${ts.s}${ts.f ? ` من ${ts.f}${ts.t && ts.t !== ts.f ? ` إلى ${ts.t}` : ''}` : ''}`;
let tsAsk = null;
// إن كان التقييم تسميعاً تُسأل السورة والآيات (أو «بلا تفاصيل»)، ثم done(الإضافات، سُئل؟)
function withTasmee(sid, e, done) {
  if (!isTasE(e)) { done({}, false); return; }
  const s = stuOf(sid);
  const last = behOf(sid).filter((b) => b.ts && b.ts.s).sort((a, b) => b.at - a.at)[0];
  const ids = new Set(studentsIn(s.cls).map((x) => x.id));
  const cl = T.beh.filter((b) => b.ts && b.ts.s && ids.has(b.sid)).sort((a, b) => b.at - a.at)[0];
  tsAsk = { sid, e, done, s: last ? last.ts.s : cl ? cl.ts.s : '', f: last && last.ts.t ? Number(last.ts.t) + 1 : '' };
  openSheet(`<div class="ev-head small">${AVATAR}<b>${esc(s.name)}</b></div>
    <h3 class="center">${esc(e.name)}</h3>
    <div class="sm-card ts-form"><label>السورة<input id="tsS" list="tsList" value="${esc(tsAsk.s)}" placeholder="مثل: الطلاق" autocomplete="off"></label>
      <datalist id="tsList">${SURAHS.map((x) => `<option value="${x}">`).join('')}</datalist>
      <div class="row2"><label>من آية<input id="tsF" inputmode="numeric" value="${tsAsk.f}"></label><label>إلى آية<input id="tsT" inputmode="numeric" enterkeyhint="done"></label></div></div>
    <button type="button" class="blue-btn wide" data-act="ts-save">${ic('check')} سجّل</button>
    <button type="button" class="link" data-act="ts-save" data-none="1">سجّل بلا تفاصيل</button>`, null, 'gray');
  setTimeout(() => { const f = $(tsAsk.s ? (tsAsk.f ? 'tsT' : 'tsF') : 'tsS'); if (f) f.focus(); }, 80);
}
Acts['ts-save'] = (el) => {
  const a = tsAsk;
  if (!a) return;
  let extra = {};
  if (!el.dataset.none) {
    const s = $('tsS').value.trim().replace(/^سورة\s+/, '');
    let f = num($('tsF').value), t = num($('tsT').value);
    if (!s) { $('tsS').focus(); toast('اكتب السورة، أو «سجّل بلا تفاصيل»'); return; }
    if (f !== null && t !== null && t < f) [f, t] = [t, f];
    const ts = { s, ...(f ? { f } : {}), ...(t ? { t } : f ? { t: f } : {}) };
    extra = { ts, t: tsText(ts) };
  }
  tsAsk = null;
  a.done(extra, true);
};
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'tsT') { e.preventDefault(); Acts['ts-save']({ dataset: {} }); } });

// ---- ملاحظة مكتوبة بأيقونة ولون ودرجة، تظهر كبقية التقييمات ----
let cn = null;
const CN_W = [2, 1, 0.5, 0, -0.5, -1, -2];
function cnOpen(sid, back) { cn = { sid, back, t: '', g: 'note-sticky', c: '#3f8ee6', w: 1 }; openSheet(cnHTML(), cnHTML, 'gray'); setTimeout(() => $('cnT') && $('cnT').focus(), 80); }
function cnHTML() {
  if (!cn) return '';
  return `<div class="ev-head small">${AVATAR}<b>${esc(stuOf(cn.sid).name)}</b></div>
    <div class="sm-card"><label>الملاحظة<input id="cnT" data-input="cn-t" value="${esc(cn.t)}" placeholder="مثل: سمّع من 1 إلى 2 من سورة الطلاق"></label>
      <h4>الأيقونة</h4><div class="pick-ic">${['note-sticky', ...EVAL_GLYPHS].map((g) => `<button type="button" class="${cn.g === g ? 'on' : ''}" style="--c:${cn.c}" data-act="cn-g" data-g="${g}">${ic(g)}</button>`).join('')}</div>
      <h4>اللون</h4><div class="pick-c">${EVAL_COLORS.map((c) => `<button type="button" class="${cn.c === c ? 'on' : ''}" style="background:${c}" data-act="cn-c" data-c="${c}" aria-label="لون"></button>`).join('')}</div>
      <h4>الدرجة</h4><div class="cn-w">${CN_W.map((w) => `<button type="button" class="${cn.w === w ? 'on' : ''}${w < 0 ? ' neg' : ''}" data-act="cn-w" data-w="${w}">${w > 0 ? '+' : ''}${fmtScore(w)}</button>`).join('')}</div></div>
    <button type="button" class="blue-btn wide" data-act="cn-save">${ic('check')} احفظ الملاحظة</button>`;
}
Inputs['cn-t'] = (el) => { if (cn) cn.t = el.value; };
Acts['cn-g'] = (el) => { cn.g = el.dataset.g; refresh(); };
Acts['cn-c'] = (el) => { cn.c = el.dataset.c; refresh(); };
Acts['cn-w'] = (el) => { cn.w = Number(el.dataset.w); refresh(); };
Acts['cn-save'] = () => {
  const t = (cn.t || '').trim();
  if (!t) { $('cnT').focus(); toast('اكتب الملاحظة'); return; }
  const b = addBeh(cn.sid, { k: NOTE_K, name: t, w: cn.w }, { g: cn.g, c: cn.c });
  const back = cn.back;
  cn = null;
  save();
  if (back) back(); else closeSheet();
  refresh();
  toast(behToast(b), behUndo(b));
};
Acts['cn-open'] = (el) => cnOpen(el.dataset.id, el.dataset.from === 'board' ? () => { bd.sid = ''; openSheet(bdHTML(), bdHTML, 'wide gray'); } : () => openSheet(evalSheet(), evalSheet, 'gray'));

// ---- الأسابيع بلا ملاحظة سلبية: من آخر ملاحظة سلبية، أو من أول ما رُصد في الفصل ----
function clsStart(cls) {
  const ids = new Set(studentsIn(cls).map((s) => s.id));
  let m = Object.keys(T.att[cls] || {}).sort()[0] || '';
  for (const b of T.beh) if (ids.has(b.sid) && (!m || b.d < m)) m = b.d;
  return m;
}
function cleanWeeks(s, start) {
  const neg = behOf(s.id).filter((b) => b.w < 0).reduce((m, b) => (b.d > m ? b.d : m), '');
  const from = neg || start;
  if (!from) return 0;
  return Math.floor((parseD(today()) - parseD(from)) / 864e5 / 7);
}
const weeksWord = (n) => (n === 1 ? 'أسبوع' : n === 2 ? 'أسبوعان' : n <= 10 ? `${n} أسابيع` : `${n} أسبوعاً`);

// ---- لوحة الفصل: كل الطلاب في شاشة واحدة، للتقييم أو للحضور ----
const bd = { mode: 'ev', st: 'a', sid: '' };
Acts.board = () => { bd.sid = ''; openSheet(bdHTML(), bdHTML, 'wide gray'); };
function bdHTML() {
  const list = studentsIn(UI.cls);
  if (bd.sid && stuOf(bd.sid)) {
    const s = stuOf(bd.sid), v = attOf(s);
    return `<div class="bd-top"><button type="button" class="chip" data-act="bd-back">${ic('back')} اللوحة</button><b>${esc(s.name)}</b></div>
      ${v !== 'p' ? `<p class="bd-warn" style="--c:${attInfo(v)[3]}">${ic(attInfo(v)[2])} ${attInfo(v)[1]} اليوم</p>` : ''}
      <div class="ev-grid">${T.evals.map((e) => `<button type="button" class="ev-row" data-act="bd-ev" data-k="${e.k}"><i style="--c:${e.c}">${ic(e.g)}</i><span>${esc(e.name)}</span><em>${fmt1(e.w)}</em></button>`).join('')}
        <button type="button" class="ev-row" data-act="cn-open" data-id="${s.id}" data-from="board"><i style="--c:#3f8ee6">${ic('pen')}</i><span>ملاحظة بأيقونة</span></button></div>`;
  }
  const p = perOf(UI.cls);
  const absent = list.filter((s) => attOf(s) !== 'p').length;
  return `<h3>${esc(clsOf(UI.cls).name)}${p.length ? ` <small class="hint">${p.map(perName).join(' و')}</small>` : ''}</h3>
    <div class="bd-tabs"><button type="button" class="${bd.mode === 'ev' ? 'on' : ''}" data-act="bd-mode" data-m="ev">${ic('star')} التقييم</button><button type="button" class="${bd.mode === 'att' ? 'on' : ''}" data-act="bd-mode" data-m="att">${ic('user-check')} الحضور${absent ? ` (${absent})` : ''}</button></div>
    ${bd.mode === 'att' ? `<div class="bd-st">${ATT.slice(1).map(([k, n, g, c]) => `<button type="button" class="${bd.st === k ? 'on' : ''}" style="--c:${c}" data-act="bd-st" data-v="${k}"><i>${ic(g)}</i>${n}</button>`).join('')}</div>
      <p class="hint">اضغط اسم الطالب يصير «${attInfo(bd.st)[1]}»، والضغطة الثانية تعيده حاضراً.</p>` : ''}
    <div class="bd-grid">${list.map((s) => { const v = attOf(s), A = attInfo(v), sc = scoreOf(s.id); return `<button type="button" class="bd-s${v !== 'p' ? ' off' : ''}" style="--c:${A[3]}" data-act="bd-s" data-id="${s.id}"><span>${esc(shortName(s))}${phoneMark(s)}</span>${v !== 'p' ? `<em>${A[1]}</em>` : `<small class="${sc < 0 ? 'neg' : ''}">${fmtScore(sc)}</small>`}</button>`; }).join('')}</div>
    ${bd.mode === 'att' ? `<button type="button" class="ghost-btn wide" data-act="bd-allp">${ic('users')} الكل حاضر</button>` : ''}`;
}
Acts['bd-mode'] = (el) => { bd.mode = el.dataset.m; refresh(); };
Acts['bd-st'] = (el) => { bd.st = el.dataset.v; refresh(); };
Acts['bd-back'] = () => { bd.sid = ''; refresh(); };
Acts['bd-s'] = (el) => {
  const s = stuOf(el.dataset.id);
  if (bd.mode === 'ev') { bd.sid = s.id; refresh(); $('sheetBody').scrollTop = 0; return; }
  const v = attOf(s) === bd.st ? 'p' : bd.st;
  setAtt(s, v); save(); refresh();
  if (navigator.vibrate) navigator.vibrate(10);
  toast(`${shortName(s)}: ${attInfo(v)[1]}`);
};
Acts['bd-allp'] = () => { T.att[UI.cls] = T.att[UI.cls] || {}; T.att[UI.cls][today()] = {}; save(); refresh(); toast('الكل حاضر'); };
Acts['bd-ev'] = (el) => {
  const e = evalOf(el.dataset.k), sid = bd.sid;
  withTasmee(sid, e, (x, asked) => {
    const b = addBeh(sid, e, x);
    bd.sid = '';
    save();
    if (asked) openSheet(bdHTML(), bdHTML, 'wide gray');
    refresh();
    if (navigator.vibrate) navigator.vibrate(15);
    toast(behToast(b), behUndo(b));
  });
};

// ---- الحضور على بطاقة الطالب في «المتابعة» (اليوم) ----
const attMini = (s) => { const v = attOf(s); return `<div class="att-mini">${ATT.map(([k, n, g, c]) => `<button type="button" class="${v === k ? 'on' : ''}" style="--c:${c}" data-act="att-mini" data-id="${s.id}" data-v="${k}" aria-label="${n}" title="${n}">${ic(g)}</button>`).join('')}</div>`; };
Acts['att-mini'] = (el) => {
  const s = stuOf(el.dataset.id), v = attOf(s) === el.dataset.v ? 'p' : el.dataset.v;
  setAtt(s, v); save(); render();
  if (navigator.vibrate) navigator.vibrate(10);
  toast(`${shortName(s)}: ${attInfo(v)[1]}`);
};
// بيانات الطالب بضغطة على صورته
Acts['stu-data'] = (el) => { smSid = el.dataset.id; smOpen('edit'); };
