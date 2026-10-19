'use strict';
// The home page (what needs the teacher today), the welcome on the first visit, and demo data to
// try everything before entering a real class.

Views.home = () => {
  const s = T.settings;
  const h = new Date().getHours();
  const hello = `${h < 12 ? 'صباح الخير' : 'مساء الخير'}${s.teacher ? `، ${esc(s.teacher)}` : ''}`;
  if (!T.classes.length) {
    return `<section class="hero"><p class="hero-k">${dateLabel(today())} | ${hijri()}</p><h2>${hello}</h2><p>مساعدك في الفصل: يسجّل السلوك بضغطة، ويكتب رسائل أولياء الأمور عنك، ويحسب الدرجات ويكشف المتعثرين.</p>
      <div class="btns"><button type="button" class="gold" data-act="welcome">${ic('spark')} ابدأ الإعداد</button><button type="button" class="ghost on-dark" data-act="demo-load">${ic('eye')} جرّب ببيانات تجريبية</button></div></section>
      ${featureList()}`;
  }
  const c = curCls();
  const demo = T.classes.some((k) => k.demo);
  return `<section class="hero"><p class="hero-k">${dateLabel(today())} | ${hijri()}</p><h2>${hello}</h2>
      <p>${esc(clsOf(c).name)}: ${plural(studentsIn(c).length, 'طالب واحد', 'طالبان', 'طلاب', 'طالباً')}</p>
      <button type="button" class="stage-cta" data-act="stage-open">${ic('screen')}<span><b>شاشة الفصل</b><small>لوحة الشرف والمجموعات والقرعة والمؤقت والتحدّي، تعرضها أمام طلابك</small></span>${ic('next')}</button></section>
    ${classChips()}
    ${demo ? `<div class="banner">${ic('eye')}<span>تتصفح بيانات تجريبية. جرّب كل شيء بحرية، ثم امسحها وأضف فصلك.</span><button type="button" class="ghost sm" data-act="demo-clear">امسحها</button></div>` : ''}
    ${setupCard()}
    ${attentionCard(c)}
    ${weekCard(c)}
    ${starsCard(c)}`;
};

function featureList() {
  const f = [
    ['star', 'السلوك بضغطة', 'اضغط اسم الطالب واختر السبب، ويُحسب له وعليه وحده.'],
    ['chat', 'رسائل أولياء الأمور', 'رسالة لكل ولي أمر باسم ابنه وملاحظاته ودرجاته، تُرسل من واتساب.'],
    ['chart', 'الدرجات والمتعثرون', 'ارصد الدرجات فيظهر المتعثرون وفروعهم الضعيفة والخطة العلاجية.'],
    ['screen', 'شاشة الفصل', 'لوحة شرف ومستويات ومجموعات تتنافس وقرعة ومؤقت وتحدّي أسئلة.'],
    ['quiz', 'اختبارات تُصحَّح وحدها', 'يحلّها الطلاب من أجهزتهم، وتصلك نتائجهم وتُرصد.'],
  ];
  return `<div class="features">${f.map(([i, t, d]) => `<div class="feat">${ic(i)}<div><b>${t}</b><p>${d}</p></div></div>`).join('')}</div>`;
}

// ---- getting started: the steps left, each with its button ----
function setupSteps() {
  const s = T.settings;
  const withPhone = T.students.filter((x) => phoneOk(x.phone)).length;
  return [
    [!!s.teacher, 'اكتب اسمك ومادتك', 'يظهر اسمك في الرسائل والشهادات', 'go', 'settings'],
    [T.students.length > 0, 'أضف طلاب فصلك', 'من ملف إكسل (كشف نور) أو بلصق الأسماء', 'go', 'students'],
    [T.students.length > 0 && withPhone === T.students.length, 'أضف أرقام أولياء الأمور', T.students.length ? `لهم رقم: ${withPhone} من ${T.students.length}` : 'لتصلهم الرسائل على واتساب', 'go', 'students'],
    [T.beh.length > 0, 'سجّل أول ملاحظة سلوك', 'اضغط اسم طالب في «السلوك»', 'go', 'behavior'],
    [!!s.screenTried, 'جرّب شاشة الفصل', 'اعرضها على شاشة الفصل أمام طلابك', 'stage-open', ''],
  ];
}
function setupCard() {
  if (T.settings.hideSetup) return '';
  const steps = setupSteps();
  const done = steps.filter((x) => x[0]).length;
  if (done === steps.length) return '';
  return `<div class="card setup"><div class="row-between"><h3>${ic('flag')} خطوات البداية</h3><span class="tag">${done} من ${steps.length}</span></div>
    <div class="bar"><i style="width:${pct(done, steps.length)}%"></i></div>
    <ol class="steps">${steps.map(([ok, t, d, act, tab]) => `<li class="${ok ? 'done' : ''}"><button type="button" data-act="${act}" data-tab="${tab}"><span class="tick">${ok ? ic('check') : ''}</span><span class="grow"><b>${t}</b><small>${d}</small></span>${ok ? '' : ic('next')}</button></li>`).join('')}</ol>
    <button type="button" class="link sm" data-act="setup-hide">أخفِ هذه الخطوات</button></div>`;
}
Acts['setup-hide'] = () => { T.settings.hideSetup = true; save(); render(); };

// ---- what needs the teacher now, in this class ----
function attentionCard(c) {
  const rows = [];
  const { warn, praise } = behAlerts(c);
  if (warn.length) rows.push(['bad', 'alert', `${plural(warn.length, 'طالب يحتاج', 'طالبان يحتاجان', 'طلاب يحتاجون', 'طالباً يحتاجون')} تنبيه ولي أمره`, warn.map(shortName).join('، '), `data-act="q-start" data-tpl="warn" data-sids="${warn.map((s) => s.id).join(',')}" data-period="week"`, 'جهّز الرسائل']);
  if (praise.length) rows.push(['good', 'star', `${plural(praise.length, 'طالب متميز', 'طالبان متميزان', 'طلاب متميزون', 'طالباً متميزاً')} هذا الأسبوع`, praise.map(shortName).join('، '), `data-act="q-start" data-tpl="praise" data-sids="${praise.map((s) => s.id).join(',')}" data-period="week"`, 'أرسل الثناء']);
  const { weak } = classAnalysis(c);
  if (weak.length) rows.push(['warn', 'chart', `${plural(weak.length, 'طالب متعثر', 'طالبان متعثران', 'طلاب متعثرون', 'طالباً متعثراً')} في الدرجات`, weak.map((x) => shortName(x.s)).join('، '), 'data-act="gr-weak"', 'اعرضهم']);
  const missing = itemsOf(c).filter((it) => studentsIn(c).some((s) => markOf(it.id, s.id) === null));
  if (missing.length) rows.push(['warn', 'edit', `${plural(missing.length, 'تقويم', 'تقويمان', 'تقويمات', 'تقويماً')} لم تكتمل درجاته`, missing.map((it) => it.title).join('، '), `data-act="it-open" data-id="${missing[0].id}"`, 'أكمل الرصد']);
  const noPhone = studentsIn(c).filter((s) => !phoneOk(s.phone)).length;
  if (noPhone) rows.push(['warn', 'phone', `${plural(noPhone, 'طالب', 'طالبان', 'طلاب', 'طالباً')} بلا رقم ولي أمر`, 'لن تصلهم الرسائل', 'data-act="go" data-tab="students"', 'أضف الأرقام']);
  return `<div class="card"><h3>${ic('bolt')} يحتاج انتباهك</h3>
    ${rows.length ? rows.map(([k, i, t, d, act, btn]) => `<div class="att ${k}"><span class="att-i">${ic(i)}</span><div class="grow"><b>${t}</b><small>${esc(d)}</small></div><button type="button" class="ghost sm" ${act}>${btn}</button></div>`).join('')
      : `<p class="calm">${ic('check')} لا شيء يحتاج انتباهك الآن.</p>`}</div>`;
}
Acts['gr-weak'] = () => { grUi.view = 'res'; go('grades'); };

function weekCard(c) {
  const list = studentsIn(c);
  const from = weekStart();
  const pos = list.reduce((n, s) => n + behCount(s.id, 'pos', from), 0);
  const neg = list.reduce((n, s) => n + behCount(s.id, 'neg', from), 0);
  const sids = new Set(list.map((s) => s.id));
  const sent = T.sent.filter((x) => sids.has(x.sid) && iso(new Date(x.at)) >= from).length;
  const { list: g } = classAnalysis(c);
  const marked = g.filter((x) => x.g.max);
  const avg = marked.length ? Math.round(marked.reduce((n, x) => n + pct(x.g.got, x.g.max), 0) / marked.length) : null;
  return `<div class="card"><h3>${ic('chart')} هذا الأسبوع</h3><div class="stats">
    <div class="stat good"><b>${bigNum(pos)}</b><span>ملاحظات إيجابية</span></div>
    <div class="stat bad"><b>${bigNum(neg)}</b><span>ملاحظات سلبية</span></div>
    <div class="stat"><b>${bigNum(sent)}</b><span>رسائل أرسلتها</span></div>
    <div class="stat"><b>${avg === null ? '—' : `${avg}٪`}</b><span>متوسط الدرجات</span></div></div></div>`;
}

function starsCard(c) {
  const from = weekStart();
  const top = studentsIn(c).map((s) => ({ s, n: points(s.id, from) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 3);
  if (!top.length) return '';
  return `<div class="card"><div class="row-between"><h3>${ic('trophy')} نجوم الأسبوع</h3><button type="button" class="ghost sm" data-act="stage-open">${ic('screen')} اعرضهم</button></div>
    ${top.map((x, i) => `<button type="button" class="star-row" data-act="stu-profile" data-id="${x.s.id}"><span class="rank r${i + 1}">${i + 1}</span>${avatar(x.s)}<span class="grow"><b>${esc(shortName(x.s))}</b>${levelBadge(points(x.s.id))}</span><span class="pts">${x.n} <small>نقطة</small></span></button>`).join('')}</div>`;
}

// ---- welcome: three short steps, then the students ----
function openWelcome(step = 0) {
  if (step === 0) {
    openSheet(`<div class="welcome"><div class="logo-big">${ic('book')}</div><h2>أهلاً بك في «مساعد المعلم»</h2>
      <p class="lead">كل ما تحتاجه مع طلابك وأولياء أمورهم في مكان واحد، بلا تعقيد.</p>${featureList()}
      <button type="button" class="primary big" data-act="welcome-next">ابدأ الإعداد (دقيقة واحدة)</button>
      <button type="button" class="ghost big" data-act="demo-load">${ic('eye')} جرّبه أولاً ببيانات تجريبية</button>
      <p class="hint center">بياناتك تبقى في جوالك فقط، لا تُرفع إلى أي مكان.</p></div>`);
    return;
  }
  const s = T.settings;
  openSheet(`<form data-submit="welcome-save" class="welcome"><p class="step-k">الخطوة ١ من ٢</p><h2>عرّفنا بك</h2>
    <label>اسمك كما يظهر في الرسائل<input name="teacher" required value="${esc(s.teacher)}" placeholder="مثل: أ. محمد العتيبي"></label>
    <label>المادة<input name="subject" value="${esc(s.subject)}"></label>
    <label>اسم فصلك الأول<input name="cls" required placeholder="مثل: أول متوسط ١" value="${esc(T.classes[0] && !T.classes[0].demo ? T.classes[0].name : '')}"></label>
    <p class="hint">تضيف فصولك الأخرى لاحقاً من «طلابي».</p>
    <button class="primary big">التالي: أضف الطلاب</button></form>`);
}
Acts.welcome = () => openWelcome(0);
Acts['welcome-next'] = () => openWelcome(1);
Acts['welcome-save'] = (f) => {
  const v = (k) => f.elements[k].value.trim();
  if (!v('teacher') || !v('cls')) return;
  T.settings.teacher = v('teacher');
  T.settings.subject = v('subject') || 'الدراسات الإسلامية';
  T.settings.onboarded = true;
  let c = T.classes.find((k) => !k.demo && k.name === v('cls'));
  if (!c) { c = { id: uid(), name: v('cls') }; T.classes.push(c); }
  UI.cls = c.id;
  save();
  go('students');
  Acts['imp-open'](null, null, 'الخطوة ٢ من ٢: أضف طلاب فصلك');
};

// ---- demo data: a made-up class to try everything; removed in one press ----
const DEMO_NAMES = ['عبدالله محمد الأحمدي', 'خالد سعد الشهري', 'فيصل ناصر القحطاني', 'سلمان فهد العنزي', 'يوسف إبراهيم الغامدي', 'عمر عبدالعزيز الحربي', 'أنس ماجد الزهراني', 'تركي سامي المطيري', 'ريان علي الدوسري', 'زياد خالد العتيبي', 'حمزة يوسف السبيعي', 'معاذ أحمد الشمري', 'بدر صالح المالكي', 'نواف راشد الرشيدي'];
Acts['demo-load'] = () => {
  const cid = uid();
  T.classes.push({ id: cid, name: 'فصل تجريبي', demo: true });
  const studs = DEMO_NAMES.map((name) => ({ id: uid(), cls: cid, name, parent: '', phone: '' }));
  T.students.push(...studs);
  // notes over the last five weeks: most positive, some negative
  let seed = 7;
  const rnd = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor((seed / 233280) * n); };
  const t0 = today();
  for (let k = 0; k < 160; k++) {
    const s = studs[(rnd(studs.length) + rnd(4)) % studs.length];
    const d = addDays(t0, -rnd(35));
    if (d > t0) continue;
    const neg = rnd(7) === 0 || (s === studs[13] && rnd(2) === 0);
    T.beh.push({ id: uid(), sid: s.id, d, at: parseD(d).getTime() + 36e6 + k, kind: neg ? 'neg' : 'pos', reason: neg ? T.reasons.neg[rnd(T.reasons.neg.length)] : T.reasons.pos[rnd(T.reasons.pos.length)], note: '' });
  }
  const items = [['اختبار قصير: أركان الإيمان', 10, 'التوحيد', -20], ['واجب: الطهارة', 5, 'الفقه والسلوك', -12], ['اختبار قصير: الأربعون النووية', 10, 'الحديث والسيرة', -5]];
  for (const [title, max, skill, back] of items) {
    const it = { id: uid(), cls: cid, title, max, skill, d: addDays(t0, back), quiz: '' };
    T.items.push(it);
    T.marks[it.id] = {};
    studs.forEach((s, i) => { T.marks[it.id][s.id] = i === 13 || i === 9 ? Math.round(max * (0.3 + rnd(3) / 10)) : Math.max(1, max - rnd(Math.ceil(max / 2.5))); });
  }
  T.quizzes.push({ id: uid(), demo: true, at: Date.now(), title: 'تحدّي: أركان الإيمان', skill: 'التوحيد', qs: [
    { type: 'mc', q: 'كم عدد أركان الإيمان؟', opts: ['خمسة', 'ستة', 'سبعة', 'أربعة'], ans: 1, explain: 'الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر خيره وشره.' },
    { type: 'tf', q: 'الإيمان بالقدر من أركان الإيمان.', opts: [], ans: true, explain: 'هو الركن السادس.' },
    { type: 'mc', q: 'من الملك الموكّل بالوحي؟', opts: ['ميكائيل', 'إسرافيل', 'جبريل', 'مالك'], ans: 2, explain: 'جبريل عليه السلام هو الموكّل بالوحي.' },
    { type: 'mc', q: 'أول الرسل إلى أهل الأرض هو:', opts: ['آدم', 'نوح', 'إبراهيم', 'موسى'], ans: 1, explain: 'نوح عليه السلام أول الرسل.' },
    { type: 'tf', q: 'الإيمان قول باللسان فقط.', opts: [], ans: false, explain: 'الإيمان قول باللسان واعتقاد بالقلب وعمل بالجوارح.' },
  ] });
  T.settings.onboarded = true;
  UI.cls = cid;
  save(); closeSheet(); go('home');
  toast('أُضيف فصل تجريبي فيه ١٤ طالباً. جرّب كل شيء!');
};
Acts['demo-clear'] = (el) => {
  if (!armed(el)) return;
  for (const c of T.classes.filter((k) => k.demo)) delClass(c.id);
  T.quizzes = T.quizzes.filter((q) => !q.demo);
  save(); render();
  toast('مُسحت البيانات التجريبية');
  if (!T.classes.length) openWelcome(1);
};
