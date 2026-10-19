'use strict';
// «شاشة الفصل»: what the teacher shows on the classroom screen. A scoreboard look for middle-school
// students: the honour board (only positive points, never a negative note), team competition,
// a random draw, a big timer, and a quiz shown question by question. The teacher drives it from
// the same device (phone cast to the screen, or the class computer with a restored backup).

let stage = { on: false, tab: 'honor', period: 'week', drawn: {}, norep: true, pick: '', rolling: false, award: '', sound: true,
  ch: { quiz: '', i: 0, show: false }, tm: { total: 180, left: 180, running: false, endAt: 0, done: false } };
const ST_TABS = [['honor', 'لوحة الشرف', 'trophy'], ['groups', 'المجموعات', 'flag'], ['draw', 'القرعة', 'dice'], ['timer', 'المؤقت', 'timer'], ['challenge', 'تحدّي', 'bolt']];
const GROUP_NAMES = ['الفجر', 'النور', 'الهدى', 'اليقين', 'الإحسان', 'الفلاح'];
const GROUP_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6'];
const CH_COLORS = ['#e74c3c', '#2f80ed', '#e0a800', '#27ae60', '#8e44ad', '#16a085'];

function openStage(tab) {
  if (!T.classes.length) { closeSheet(); go('students'); toast('أضف فصلك وطلابه أولاً'); return; }
  closeSheet();
  stage.on = true;
  if (tab) stage.tab = tab;
  if (!T.settings.screenTried) { T.settings.screenTried = true; save(); }
  document.body.classList.add('stage-on', 'locked');
  $('stage').hidden = false;
  try { if (document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); } catch { /* not allowed here */ }
  stageRender();
}
function closeStage() {
  if (!stage.on) return;
  stage.on = false;
  tmPause();
  $('stage').hidden = true;
  $('stage').innerHTML = '';
  document.body.classList.remove('stage-on', 'locked');
  try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch { /* fine */ }
  render();
}
Hooks.push(() => { if (stage.on) stageRender(); });

function stageRender() {
  if (!stage.on) return;
  const c = curCls();
  const view = { honor: stHonor, groups: stGroups, draw: stDraw, timer: stTimer, challenge: stChallenge }[stage.tab] || stHonor;
  $('stage').innerHTML = `<header class="st-top">
      <div class="st-brand"><span class="st-logo">${ic('book')}</span><div><b>${esc(clsOf(c).name)}</b><small>${esc(T.settings.subject)} | ${dateLabel(today())} | ${hijri()}</small></div></div>
      <nav class="st-tabs">${ST_TABS.map(([k, n, i]) => `<button type="button" class="${k === stage.tab ? 'on' : ''}" data-act="st-tab" data-v="${k}">${ic(i)}<span>${n}</span></button>`).join('')}</nav>
      <div class="st-ctl">${T.classes.length > 1 ? `<button type="button" class="st-btn" data-act="st-cls" title="الفصل التالي">${ic('users')}</button>` : ''}
        <button type="button" class="st-btn${stage.sound ? '' : ' off'}" data-act="st-sound" title="الصوت">${ic('sound')}</button>
        <button type="button" class="st-btn" data-act="st-full" title="ملء الشاشة">${ic('expand')}</button>
        <button type="button" class="st-btn" data-act="stage-close" title="إغلاق">${ic('x')}</button></div>
    </header><main class="st-body st-${stage.tab}">${view(c)}</main>`;
  arDigits($('stage'));
}
Acts['stage-open'] = () => openStage();
Acts['stage-close'] = () => closeStage();
Acts['stage-quiz'] = (el) => { stage.ch = { quiz: el.dataset.id, i: 0, show: false }; openStage('challenge'); };
Acts['st-tab'] = (el) => { stage.tab = el.dataset.v; stageRender(); };
Acts['st-period'] = (el) => { stage.period = el.dataset.v; stageRender(); };
Acts['st-sound'] = () => { stage.sound = !stage.sound; stageRender(); };
Acts['st-full'] = () => {
  try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch { toast('ملء الشاشة غير متاح هنا'); }
};
Acts['st-cls'] = () => {
  const i = T.classes.findIndex((k) => k.id === curCls());
  UI.cls = T.classes[(i + 1) % T.classes.length].id;
  stage.pick = '';
  render();
};
const periodSeg = () => `<div class="st-seg">${[['week', 'هذا الأسبوع'], ['all', 'الفصل الدراسي']].map(([k, n]) => `<button type="button" class="${k === stage.period ? 'on' : ''}" data-act="st-period" data-v="${k}">${n}</button>`).join('')}</div>`;
const stFrom = () => (stage.period === 'week' ? weekStart() : EVER);

// ---- sounds and celebrations ----
let actx;
function tone(freq, dur, when = 0, type = 'sine', vol = 0.16) {
  if (!stage.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime + when;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t); o.stop(t + dur + 0.05);
  } catch { /* no sound on this device */ }
}
const chime = (big) => [523, 659, 784, ...(big ? [1047, 1319] : [])].forEach((f, i) => tone(f, big ? 0.5 : 0.32, i * 0.11, 'triangle'));
function celebrate(title, line, lv) {
  const fx = $('fx');
  const bits = Array.from({ length: lv ? 70 : 38 }, (_, i) => `<i style="--x:${Math.round(Math.random() * 100)}vw;--d:${(Math.random() * 0.6).toFixed(2)}s;--r:${Math.round(Math.random() * 720 - 360)}deg;--c:${['#f4c542', '#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#fff'][i % 6]}"></i>`).join('');
  fx.innerHTML = `<div class="cele${lv ? ' lvup' : ''}" data-act="fx-close"><div class="cele-card">
    <p class="cele-k">${lv ? `${ic('medal')} مستوى جديد` : `${ic('star')} +١ نقطة`}</p><h2>${esc(title)}</h2><p>${esc(line)}</p>${lv ? levelBadge(lv.min, true) : ''}</div><div class="confetti">${bits}</div></div>`;
  arDigits(fx);
  chime(!!lv);
  clearTimeout(celebrate.t1); clearTimeout(celebrate.t2);
  celebrate.t1 = setTimeout(() => fx.firstChild && fx.firstChild.classList.add('out'), lv ? 3000 : 1900);
  celebrate.t2 = setTimeout(() => { fx.innerHTML = ''; }, lv ? 3500 : 2400);
}
Acts['fx-close'] = () => { $('fx').innerHTML = ''; };

// ---- giving a point from the screen ----
Acts['st-award'] = (el) => {
  stage.award = el.dataset.r || '';
  openSheet(`<h3>${ic('star')} لمن النقطة؟</h3>${stage.award ? `<p class="muted">${esc(stage.award)}</p>` : ''}
    <div class="pick-grid">${studentsIn(curCls()).map((s) => `<button type="button" class="pick-stu" data-act="st-award-stu" data-id="${s.id}">${avatar(s)}<span>${esc(shortName(s))}</span></button>`).join('')}</div>`, true);
};
Acts['st-award-one'] = (el) => { stage.award = ''; Acts['st-award-stu'](el); };
Acts['st-award-stu'] = (el) => {
  const id = el.dataset.id;
  if (stage.award) { stGive(id, stage.award); return; }
  const s = stuOf(id);
  openSheet(`<div class="who">${avatar(s, 'lg')}<div><h3>${esc(s.name)}</h3>${levelBadge(points(s.id))}</div></div><h4>على ماذا؟</h4>
    <div class="chips wrap">${T.reasons.pos.map((r) => `<button type="button" class="chip pos big" data-act="st-give" data-id="${id}" data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>`);
};
Acts['st-give'] = (el) => stGive(el.dataset.id, el.dataset.r);
function stGive(sid, reason) {
  const s = stuOf(sid);
  const { added, up } = addBeh([sid], 'pos', reason);
  closeSheet();
  stage.award = '';
  render();
  celebrate(shortName(s), up.length ? `ارتقى إلى مستوى «${levelOf(points(sid)).name}»` : reason, up.length ? levelOf(points(sid)) : null);
  toast(`+ ${reason}: ${shortName(s)}`, undoBeh(added));
}

// ---- the honour board ----
function stHonor(c) {
  const from = stFrom();
  const list = studentsIn(c).map((s) => ({ s, n: points(s.id, from) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n || a.s.name.localeCompare(b.s.name, 'ar'));
  const award = `<button type="button" class="st-gold" data-act="st-award">${ic('plus')} امنح نقطة</button>`;
  const head = `<div class="st-head"><h1>${ic('trophy')} لوحة الشرف</h1>${periodSeg()}${award}</div>`;
  const ladder = `<div class="ladder">${LEVELS.filter((l) => l.tier).map((l) => `<span>${levelBadge(l.min)}<small>${l.min}+</small></span>`).join('')}</div>`;
  if (!list.length) {
    return `${head}<div class="st-empty">${ic('trophy', 'huge')}<h2>من يكون أول نجوم ${stage.period === 'week' ? 'هذا الأسبوع' : 'الفصل'}؟</h2><p>كل مشاركة متميزة وإجابة صحيحة نقطة تقرّبك من القمة ومن مستوى أعلى.</p></div>${ladder}`;
  }
  const rank = (x) => 1 + list.filter((y) => y.n > x.n).length;
  const top = list.slice(0, 3);
  const pod = (x, place) => {
    if (!x) return `<div class="pod pl${place} empty"></div>`;
    const r = rank(x);
    return `<button type="button" class="pod pl${place}" data-act="st-award-one" data-id="${x.s.id}"><div class="pod-av">${avatar(x.s, 'st')}<span class="medal m${Math.min(r, 3)}">${r}</span></div>
      <b class="pod-name">${esc(shortName(x.s))}</b>${levelBadge(points(x.s.id))}<div class="pod-col"><span class="pod-pts">${x.n}</span><small>نقطة</small></div></button>`;
  };
  const rest = list.slice(3, 13);
  return `${head}<div class="podium">${pod(top[1], 2)}${pod(top[0], 1)}${pod(top[2], 3)}</div>
    ${rest.length ? `<div class="ranks">${rest.map((x) => `<button type="button" class="rank-row" data-act="st-award-one" data-id="${x.s.id}"><span class="rk">${rank(x)}</span>${avatar(x.s)}<b>${esc(shortName(x.s))}</b>${levelBadge(points(x.s.id))}<span class="rp">${x.n}</span></button>`).join('')}</div>` : ''}
    ${ladder}`;
}

// ---- teams ----
const groupsOf = (c) => T.groups.filter((g) => g.cls === c);
const groupScore = (g, from) => g.members.reduce((n, sid) => n + points(sid, from), 0) + g.bonus.filter((b) => b.d >= from).length;
function stGroups(c) {
  const gs = groupsOf(c);
  if (!gs.length) {
    return `<div class="st-head"><h1>${ic('flag')} المجموعات</h1></div><div class="st-empty">${ic('flag', 'huge')}<h2>قسّم الفصل إلى مجموعات تتنافس</h2>
      <p>تُوزَّع الأسماء عشوائياً. نقاط كل طالب تُضاف لمجموعته، وتستطيع منح المجموعة كلها نقطة.</p>
      <div class="st-row">${[2, 3, 4, 5, 6].map((n) => `<button type="button" class="st-gold" data-act="gr-split" data-n="${n}">${n} مجموعات</button>`).join('')}</div></div>`;
  }
  const from = stFrom();
  const scores = gs.map((g) => ({ g, n: groupScore(g, from) }));
  const max = Math.max(1, ...scores.map((x) => x.n));
  const lead = Math.max(...scores.map((x) => x.n));
  const inGroup = new Set(gs.flatMap((g) => g.members));
  const loose = studentsIn(c).filter((s) => !inGroup.has(s.id));
  return `<div class="st-head"><h1>${ic('flag')} المجموعات</h1>${periodSeg()}<button type="button" class="st-ghost sm" data-act="gr-edit">${ic('edit')} الأسماء</button><button type="button" class="st-ghost sm" data-act="gr-resplit">${ic('dice')} أعد التقسيم</button></div>
    <div class="teams n${gs.length}">${scores.map(({ g, n }) => `<div class="team${n === lead && lead > 0 ? ' lead' : ''}" style="--gc:${GROUP_COLORS[g.color % GROUP_COLORS.length]}">
      ${n === lead && lead > 0 ? `<span class="crown">${ic('trophy')}</span>` : ''}
      <div class="team-bar"><i style="height:${Math.max(4, pct(n, max))}%"></i><span class="team-n">${bigNum(n)}</span></div>
      <h3>${esc(g.name)}</h3><p class="team-m">${g.members.map(stuOf).filter(Boolean).map((s) => esc(firstName(s))).join('، ')}</p>
      <button type="button" class="team-add" data-act="gr-bonus" data-id="${g.id}">${ic('plus')} نقطة</button></div>`).join('')}</div>
    ${loose.length ? `<p class="st-note">${plural(loose.length, 'طالب', 'طالبان', 'طلاب', 'طالباً')} بلا مجموعة: ${loose.map((s) => esc(firstName(s))).join('، ')} <button type="button" class="st-link" data-act="gr-loose">وزّعهم</button></p>` : ''}`;
}
Acts['gr-split'] = (el) => {
  const c = curCls();
  const n = Number(el.dataset.n);
  const ids = studentsIn(c).map((s) => s.id);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  T.groups = T.groups.filter((g) => g.cls !== c);
  for (let k = 0; k < n; k++) T.groups.push({ id: uid(), cls: c, name: GROUP_NAMES[k], color: k, members: [], bonus: [] });
  const gs = groupsOf(c);
  ids.forEach((id, i) => gs[i % n].members.push(id));
  save(); render();
  chime();
};
Acts['gr-resplit'] = (el) => {
  if (!armed(el)) return;
  T.groups = T.groups.filter((g) => g.cls !== curCls());
  save(); render();
};
Acts['gr-loose'] = () => {
  const c = curCls();
  const gs = groupsOf(c);
  const inGroup = new Set(gs.flatMap((g) => g.members));
  for (const s of studentsIn(c).filter((x) => !inGroup.has(x.id))) gs.reduce((a, b) => (b.members.length < a.members.length ? b : a)).members.push(s.id);
  save(); render();
};
Acts['gr-bonus'] = (el) => {
  const g = T.groups.find((x) => x.id === el.dataset.id);
  const b = { at: Date.now(), d: today() };
  g.bonus.push(b);
  save(); render();
  celebrate(`مجموعة ${g.name}`, 'نقطة للمجموعة كلها', null);
  toast(`+١ لمجموعة ${g.name}`, () => { g.bonus = g.bonus.filter((x) => x !== b); save(); render(); });
};
Acts['gr-edit'] = () => {
  const gs = groupsOf(curCls());
  openSheet(`<form data-submit="gr-save"><h3>${ic('flag')} المجموعات</h3><p class="hint">غيّر الأسماء، وانقل الطالب بالضغط على اسمه.</p>
    ${gs.map((g) => `<div class="g-edit" style="--gc:${GROUP_COLORS[g.color % GROUP_COLORS.length]}"><input name="g_${g.id}" value="${esc(g.name)}">
      <div class="chips wrap">${g.members.map(stuOf).filter(Boolean).map((s) => `<button type="button" class="chip" data-act="gr-move" data-sid="${s.id}" data-gid="${g.id}">${esc(shortName(s))}</button>`).join('')}</div></div>`).join('')}
    <div class="sheet-actions"><button class="primary">احفظ</button></div></form>`);
};
// a press moves the student to the next team
Acts['gr-move'] = (el) => {
  const gs = groupsOf(curCls());
  const i = gs.findIndex((g) => g.id === el.dataset.gid);
  gs[i].members = gs[i].members.filter((m) => m !== el.dataset.sid);
  gs[(i + 1) % gs.length].members.push(el.dataset.sid);
  save(); render();
  Acts['gr-edit']();
};
Acts['gr-save'] = (f) => {
  for (const g of groupsOf(curCls())) { const v = f.elements[`g_${g.id}`].value.trim(); if (v) g.name = v; }
  save(); closeSheet(); render();
};

// ---- the random draw ----
function stDraw(c) {
  const list = studentsIn(c);
  const drawn = (stage.drawn[c] || []).filter((id) => list.some((s) => s.id === id));
  const left = list.filter((s) => !drawn.includes(s.id));
  const cur = stage.pick && stuOf(stage.pick);
  const done = stage.norep && !left.length;
  return `<div class="st-head"><h1>${ic('dice')} القرعة</h1><div class="st-seg"><button type="button" class="${stage.norep ? 'on' : ''}" data-act="st-norep" data-v="1">دون تكرار</button><button type="button" class="${stage.norep ? '' : 'on'}" data-act="st-norep" data-v="0">مع التكرار</button></div></div>
    <div class="draw-box${cur && !stage.rolling ? ' landed' : ''}${stage.rolling ? ' rolling' : ''}"><div class="draw-name" id="stName">${cur ? esc(shortName(cur)) : '؟'}</div><small>${cur && !stage.rolling ? esc(cur.name) : stage.rolling ? '…' : 'من سيكون؟'}</small></div>
    <div class="st-row"><button type="button" class="st-gold big" data-act="st-draw"${stage.rolling || done || !list.length ? ' disabled' : ''}>${ic('dice')} اسحب اسماً</button>
      ${cur && !stage.rolling ? `<button type="button" class="st-ghost" data-act="st-award-one" data-id="${cur.id}">${ic('star')} امنحه نقطة</button>` : ''}</div>
    ${stage.norep ? `<p class="st-note">${done ? 'سُحبت كل الأسماء.' : `بقي ${left.length} من ${list.length}`}${drawn.length ? ` <button type="button" class="st-link" data-act="st-draw-reset">ابدأ من جديد</button>` : ''}</p>` : ''}`;
}
Acts['st-norep'] = (el) => { stage.norep = el.dataset.v === '1'; stageRender(); };
Acts['st-draw-reset'] = () => { stage.drawn[curCls()] = []; stage.pick = ''; stageRender(); };
Acts['st-draw'] = () => {
  if (stage.rolling) return;
  const c = curCls();
  const list = studentsIn(c);
  const drawn = (stage.drawn[c] = stage.drawn[c] || []);
  const pool = stage.norep ? list.filter((s) => !drawn.includes(s.id)) : list;
  if (!pool.length) return;
  const final = pool[Math.floor(Math.random() * pool.length)];
  stage.rolling = true;
  stage.pick = final.id;
  stageRender();
  let k = 0;
  const steps = 24;
  const tick = () => {
    if (!stage.on) { stage.rolling = false; return; }
    const el = $('stName');
    if (k < steps) {
      const s = list[(k * 7 + Math.floor(Math.random() * list.length)) % list.length];
      if (el) el.textContent = shortName(s);
      tone(320 + k * 18, 0.05, 0, 'square', 0.04);
      k++;
      setTimeout(tick, 45 + k * k * 0.9);
      return;
    }
    stage.rolling = false;
    if (stage.norep) drawn.push(final.id);
    chime();
    stageRender();
  };
  tick();
};

// ---- the timer ----
let tmInt = null;
const tmLeft = () => { const t = stage.tm; return t.running ? Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000)) : t.left; };
const tmFmt = (s) => `${Math.floor(s / 60)}:${pad(s % 60)}`;
const RING = 2 * Math.PI * 54;
function stTimer() {
  const t = stage.tm;
  const left = tmLeft();
  return `<div class="st-head"><h1>${ic('timer')} المؤقت</h1></div>
    <div class="tm${t.running ? ' run' : ''}${t.done ? ' done' : ''}"><svg viewBox="0 0 120 120" class="tm-ring"><circle cx="60" cy="60" r="54" class="tm-bg"/><circle cx="60" cy="60" r="54" class="tm-fg" id="stRing" style="stroke-dasharray:${RING};stroke-dashoffset:${RING * (1 - left / Math.max(1, t.total))}"/></svg>
      <div class="tm-time" id="stTime">${t.done ? 'انتهى الوقت' : tmFmt(left)}</div></div>
    <div class="st-row">${[1, 2, 3, 5, 10, 15].map((m) => `<button type="button" class="st-chip${t.total === m * 60 ? ' on' : ''}" data-act="tm-set" data-m="${m}">${m} د</button>`).join('')}</div>
    <div class="st-row"><button type="button" class="st-ghost" data-act="tm-add" data-s="-30">− ٣٠ ث</button>
      <button type="button" class="st-gold big" data-act="tm-go">${t.running ? `${ic('pause')} إيقاف` : `${ic('play')} ${left < t.total && left > 0 ? 'أكمل' : 'ابدأ'}`}</button>
      <button type="button" class="st-ghost" data-act="tm-add" data-s="30">+ ٣٠ ث</button><button type="button" class="st-ghost" data-act="tm-reset" title="من جديد">${ic('reset')}</button></div>`;
}
function tmTick() {
  const t = stage.tm;
  const left = tmLeft();
  const el = $('stTime'), ring = $('stRing');
  if (el) el.textContent = ar(tmFmt(left));
  if (ring) ring.style.strokeDashoffset = RING * (1 - left / Math.max(1, t.total));
  if (left <= 0 && t.running) {
    t.running = false; t.left = 0; t.done = true;
    clearInterval(tmInt); tmInt = null;
    [0, 0.45, 0.9].forEach((w) => { tone(880, 0.3, w, 'square', 0.12); tone(660, 0.3, w + 0.18, 'square', 0.12); });
    if (stage.on) stageRender();
  }
}
function tmPause() { const t = stage.tm; if (t.running) { t.left = tmLeft(); t.running = false; } clearInterval(tmInt); tmInt = null; }
Acts['tm-go'] = () => {
  const t = stage.tm;
  if (t.running) { tmPause(); stageRender(); return; }
  if (t.left <= 0) t.left = t.total;
  t.done = false;
  t.endAt = Date.now() + t.left * 1000;
  t.running = true;
  clearInterval(tmInt);
  tmInt = setInterval(tmTick, 250);
  stageRender();
};
Acts['tm-set'] = (el) => { tmPause(); Object.assign(stage.tm, { total: Number(el.dataset.m) * 60, left: Number(el.dataset.m) * 60, done: false }); stageRender(); };
Acts['tm-reset'] = () => { tmPause(); Object.assign(stage.tm, { left: stage.tm.total, done: false }); stageRender(); };
Acts['tm-add'] = (el) => {
  const t = stage.tm, s = Number(el.dataset.s);
  const left = Math.max(0, tmLeft() + s);
  if (t.running) t.endAt = Date.now() + left * 1000; else t.left = left;
  t.total = Math.max(t.total, left);
  t.done = false;
  stageRender();
};

// ---- the challenge: a saved test shown question by question ----
function stChallenge() {
  if (!T.quizzes.length) {
    return `<div class="st-head"><h1>${ic('bolt')} تحدّي الفصل</h1></div><div class="st-empty">${ic('bolt', 'huge')}<h2>لا اختبارات بعد</h2><p>أنشئ اختباراً في صفحة «الاختبارات»، ثم اعرضه هنا سؤالاً سؤالاً.</p>
      <button type="button" class="st-gold" data-act="st-to-quizzes">${ic('plus')} أنشئ اختباراً</button></div>`;
  }
  const z = T.quizzes.find((x) => x.id === stage.ch.quiz);
  if (!z) {
    return `<div class="st-head"><h1>${ic('bolt')} تحدّي الفصل</h1></div><p class="st-note">اختر الاختبار:</p>
      <div class="ch-list">${T.quizzes.slice().sort((a, b) => b.at - a.at).map((q) => `<button type="button" class="ch-card" data-act="ch-quiz" data-id="${q.id}">${ic('bolt')}<b>${esc(q.title)}</b><small>${q.qs.length} أسئلة</small></button>`).join('')}</div>`;
  }
  const i = Math.min(stage.ch.i, z.qs.length - 1);
  const q = z.qs[i];
  const show = stage.ch.show;
  const opts = q.type === 'tf' ? [['صح', true], ['خطأ', false]] : q.opts.map((o, k) => [o, k]);
  return `<div class="st-head"><h1>${ic('bolt')} ${esc(z.title)}</h1><span class="st-prog">السؤال ${i + 1} من ${z.qs.length}</span><button type="button" class="st-ghost sm" data-act="ch-quiz" data-id="">اختبار آخر</button></div>
    <div class="ch-dots">${z.qs.map((_, k) => `<i class="${k < i ? 'past' : k === i ? 'now' : ''}"></i>`).join('')}</div>
    <div class="ch-q">${esc(q.q)}</div>
    <div class="ch-opts ${q.type}">${opts.map(([t, v], k) => { const right = v === q.ans; return `<div class="ch-opt${show ? (right ? ' right' : ' dim') : ''}" style="--oc:${q.type === 'tf' ? (v ? '#27ae60' : '#e74c3c') : CH_COLORS[k % CH_COLORS.length]}">
      <span class="ch-l">${q.type === 'tf' ? ic(v ? 'check' : 'x') : 'أبجدهو'[k]}</span><span class="ch-t">${esc(t)}</span>${show && right ? `<span class="ch-ok">${ic('check')}</span>` : ''}</div>`; }).join('')}</div>
    ${show && q.explain ? `<div class="ch-exp">${ic('book')}<span>${esc(q.explain)}</span></div>` : ''}
    <div class="st-row"><button type="button" class="st-ghost" data-act="ch-move" data-d="-1"${i ? '' : ' disabled'}>${ic('prev')} السابق</button>
      ${show ? `<button type="button" class="st-gold" data-act="st-award" data-r="إجابة صحيحة">${ic('star')} نقطة لمن أجاب</button>` : `<button type="button" class="st-gold big" data-act="ch-show">${ic('eye')} أظهر الإجابة</button>`}
      <button type="button" class="st-ghost" data-act="ch-move" data-d="1"${i < z.qs.length - 1 ? '' : ' disabled'}>التالي ${ic('next')}</button></div>`;
}
Acts['ch-quiz'] = (el) => { stage.ch = { quiz: el.dataset.id, i: 0, show: false }; stageRender(); };
Acts['ch-show'] = () => { stage.ch.show = true; chime(); stageRender(); };
Acts['ch-move'] = (el) => {
  const z = T.quizzes.find((x) => x.id === stage.ch.quiz);
  if (!z) return;
  stage.ch.i = Math.max(0, Math.min(z.qs.length - 1, stage.ch.i + Number(el.dataset.d)));
  stage.ch.show = false;
  stageRender();
};
Acts['st-to-quizzes'] = () => { closeStage(); go('quizzes'); openSheet(qzForm(null)); };

// keys for a class computer or a remote: arrows move, space acts, escape leaves
document.addEventListener('keydown', (e) => {
  if (!stage.on || !$('sheet').hidden || /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) return;
  const press = (sel) => { const b = $('stage').querySelector(sel); if (b && !b.disabled) { e.preventDefault(); b.click(); } };
  if (e.key === 'Escape' && !document.fullscreenElement) closeStage();
  else if (stage.tab === 'challenge' && e.key === 'ArrowLeft') press('[data-act="ch-move"][data-d="1"]');
  else if (stage.tab === 'challenge' && e.key === 'ArrowRight') press('[data-act="ch-move"][data-d="-1"]');
  else if (e.key === ' ' || e.key === 'Enter') press({ challenge: '[data-act="ch-show"]', draw: '[data-act="st-draw"]', timer: '[data-act="tm-go"]' }[stage.tab] || '#none');
});
