'use strict';
// Behaviour: one press on a student's name records a positive or negative note with a ready
// reason. Positive notes are the student's points and level. The page says who needs a message
// home this week; the student's profile gathers everything about him, with his certificate.

let behUi = { multi: false, sel: new Set() };
const behIn = (sid, from, to = today()) => T.beh.filter((b) => b.sid === sid && b.d >= from && b.d <= to);
const behCount = (sid, kind, from) => behIn(sid, from).filter((b) => b.kind === kind).length;
// a message of this kind sent to this student's parent after this time?
const sentAfter = (sid, tpl, at) => T.sent.some((x) => x.sid === sid && x.tpl === tpl && x.at >= at);

// who needs a word home this week: too many negatives (not yet told), and the outstanding ones (not yet thanked)
function behAlerts(cid) {
  const from = weekStart();
  const warn = [], praise = [];
  for (const s of studentsIn(cid)) {
    const list = behIn(s.id, from);
    const neg = list.filter((b) => b.kind === 'neg');
    const pos = list.filter((b) => b.kind === 'pos');
    if (neg.length >= T.settings.negAlert && !sentAfter(s.id, 'warn', Math.max(...neg.map((b) => b.at)))) warn.push(s);
    if (pos.length >= 3 && !neg.length && !sentAfter(s.id, 'praise', new Date(`${from}T00:00`).getTime())) praise.push(s);
  }
  return { warn, praise };
}

Views.behavior = () => {
  if (!T.classes.length) return `${pageHead('السلوك', 'اضغط اسم الطالب لتسجّل له أو عليه')}${noClasses()}`;
  const c = curCls();
  const list = studentsIn(c);
  const from = weekStart();
  const { warn, praise } = behAlerts(c);
  const names = (arr) => arr.map((s) => esc(shortName(s))).join('، ');
  return `${pageHead('السلوك', 'اضغط اسم الطالب لتسجّل له أو عليه. الأرقام لهذا الأسبوع.', `<button type="button" class="ghost sm" data-act="stage-open">${ic('screen')} شاشة الفصل</button>`)}
    ${classChips()}
    ${warn.length ? `<div class="notice bad">${ic('alert')}<div class="grow"><b>يحتاجون تنبيه أوليائهم: ${warn.length}</b><small>${names(warn)}</small></div>
      <button type="button" class="primary sm" data-act="q-start" data-tpl="warn" data-sids="${warn.map((s) => s.id).join(',')}" data-period="week">${ic('chat')} جهّز الرسائل</button></div>` : ''}
    ${praise.length ? `<div class="notice good">${ic('star')}<div class="grow"><b>متميزون هذا الأسبوع: ${praise.length}</b><small>${names(praise)}</small></div>
      <button type="button" class="primary sm" data-act="q-start" data-tpl="praise" data-sids="${praise.map((s) => s.id).join(',')}" data-period="week">${ic('chat')} أرسل الثناء</button></div>` : ''}
    <div class="toolbar"><span class="muted">${dateLabel(today())}</span>
      <button type="button" class="ghost sm${behUi.multi ? ' on' : ''}" data-act="beh-multi">${behUi.multi ? `${ic('x')} إلغاء التحديد` : `${ic('check')} عدة طلاب معاً`}</button></div>
    ${list.length ? `<div class="grid">${list.map((s) => {
      const p = behCount(s.id, 'pos', from), n = behCount(s.id, 'neg', from);
      const on = behUi.multi && behUi.sel.has(s.id);
      return `<button type="button" class="stu${on ? ' sel' : ''}" data-act="beh-stu" data-id="${s.id}">
        ${on ? `<span class="selmark">${ic('check')}</span>` : ''}${avatar(s)}<b>${esc(shortName(s))}</b>${levelBadge(points(s.id))}
        <span class="cnt">${p ? `<i class="p">+${p}</i>` : ''}${n ? `<i class="n">−${n}</i>` : ''}</span></button>`;
    }).join('')}</div>` : `<div class="empty-state">${ic('users', 'big')}<p>لا طلاب في هذا الفصل.</p><button type="button" class="primary" data-act="go" data-tab="students">${ic('plus')} أضف الطلاب</button></div>`}
    ${behUi.multi ? `<div class="selbar"><span>المحدد: ${behUi.sel.size} من ${list.length}</span><button type="button" class="ghost sm" data-act="beh-all">${behUi.sel.size === list.length ? 'ألغِ الكل' : 'حدّد الكل'}</button><button type="button" class="primary sm" data-act="beh-multi-go"${behUi.sel.size ? '' : ' disabled'}>سجّل لهم</button></div>` : ''}
    <div class="btns end"><button type="button" class="ghost sm" data-act="q-start" data-tpl="weekly" data-sids="${list.map((s) => s.id).join(',')}" data-period="week">${ic('chat')} تقرير الأسبوع لكل الأولياء</button>
      <button type="button" class="ghost sm" data-act="beh-xlsx">${ic('file')} تقرير السلوك (إكسل)</button></div>`;
};

Acts['beh-multi'] = () => { behUi.multi = !behUi.multi; behUi.sel.clear(); render(); };
Acts['beh-all'] = () => {
  const ids = studentsIn(curCls()).map((s) => s.id);
  behUi.sel = behUi.sel.size === ids.length ? new Set() : new Set(ids);
  render();
};
Acts['beh-stu'] = (el) => {
  const id = el.dataset.id;
  if (behUi.multi) { behUi.sel.has(id) ? behUi.sel.delete(id) : behUi.sel.add(id); render(); return; }
  behSheet([id]);
};
Acts['beh-multi-go'] = () => behSheet([...behUi.sel]);

function behSheet(ids) {
  const one = ids.length === 1 ? stuOf(ids[0]) : null;
  const from = weekStart();
  openSheet(`${one ? `<div class="who">${avatar(one, 'lg')}<div><h3>${esc(one.name)}</h3><div class="facts">${levelBadge(points(one.id))}<span class="good">+${behCount(one.id, 'pos', from)} هذا الأسبوع</span>${behCount(one.id, 'neg', from) ? `<span class="bad">−${behCount(one.id, 'neg', from)}</span>` : ''}</div></div></div>` : `<h3>${ar(ids.length)} طلاب</h3>`}
    <h4 class="pos-h">${ic('plus')} إيجابية <small>(نقطة له)</small></h4><div class="chips wrap">${T.reasons.pos.map((r) => `<button type="button" class="chip pos" data-act="beh-add" data-kind="pos" data-ids="${ids.join(',')}" data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>
    <h4 class="neg-h">${ic('minus')} سلبية <small>(لا تظهر في شاشة الفصل)</small></h4><div class="chips wrap">${T.reasons.neg.map((r) => `<button type="button" class="chip neg" data-act="beh-add" data-kind="neg" data-ids="${ids.join(',')}" data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>
    <input id="behNote" class="mt" placeholder="ملاحظة إضافية (اختياري)">
    ${one ? `<div class="btns"><button type="button" class="ghost sm" data-act="stu-profile" data-id="${one.id}">${ic('users')} ملفه الكامل</button><button type="button" class="ghost sm" data-act="q-start" data-tpl="" data-sids="${one.id}" data-period="week">${ic('chat')} رسالة لولي أمره</button></div>` : ''}`);
}
// record a note for these students; returns what was added (to undo) and who moved up a level
function addBeh(ids, kind, reason, note = '') {
  const now = Date.now();
  const before = new Map(ids.map((sid) => [sid, levelOf(points(sid)).tier]));
  const added = ids.map((sid, i) => ({ id: uid(), sid, d: today(), at: now + i, kind, reason, note }));
  T.beh.push(...added);
  save();
  const up = kind === 'pos' ? ids.filter((sid) => levelOf(points(sid)).tier > before.get(sid)) : [];
  return { added, up };
}
const undoBeh = (added) => () => { const gone = new Set(added.map((b) => b.id)); T.beh = T.beh.filter((b) => !gone.has(b.id)); save(); render(); };
Acts['beh-add'] = (el) => {
  const ids = el.dataset.ids.split(',');
  const note = ($('behNote') && $('behNote').value.trim()) || '';
  const { added, up } = addBeh(ids, el.dataset.kind, el.dataset.r, note);
  closeSheet();
  if (behUi.multi) { behUi.multi = false; behUi.sel.clear(); }
  render();
  const who = ids.length === 1 ? shortName(stuOf(ids[0])) : `${ids.length} طلاب`;
  const lv = up.length ? ` 🎉 ارتقى ${up.length === 1 ? shortName(stuOf(up[0])) : `${up.length} طلاب`} إلى «${levelOf(points(up[0])).name}»` : '';
  toast(`${el.dataset.kind === 'pos' ? '+' : '−'} ${el.dataset.r}: ${who}${lv}`, undoBeh(added));
};
Acts['beh-del'] = (el) => {
  if (!armed(el)) return;
  const b = T.beh.find((x) => x.id === el.dataset.id);
  T.beh = T.beh.filter((x) => x.id !== el.dataset.id);
  save(); render();
  if (b) stuProfile(b.sid);
};

// ---- the student's profile: level, notes, grades, messages, certificate ----
Acts['stu-profile'] = (el) => stuProfile(el.dataset.id);
function stuProfile(id) {
  const s = stuOf(id);
  if (!s) return;
  const n = points(s.id), lv = levelOf(n), nx = nextLevel(n);
  const from = weekStart();
  const all = T.beh.filter((b) => b.sid === s.id);
  const g = gradesOf(s);
  const hist = all.slice().sort((a, b) => b.at - a.at).slice(0, 20);
  const msgs = T.sent.filter((x) => x.sid === s.id).sort((a, b) => b.at - a.at).slice(0, 5);
  const prevMin = lv.min;
  openSheet(`<div class="profile">
    <div class="who">${avatar(s, 'xl')}<div><h3>${esc(s.name)}</h3><p class="muted">${esc(clsOf(s.cls) ? clsOf(s.cls).name : '')}${s.parent ? ` | ${esc(s.parent)}` : ''}</p></div></div>
    <div class="lv-card t${lv.tier}"><div class="row-between">${lv.tier ? levelBadge(n, true) : '<span class="lvl-none">لم يبلغ أول مستوى بعد</span>'}<b class="pts-big">${bigNum(n)} <small>نقطة</small></b></div>
      ${nx ? `<div class="bar"><i style="width:${pct(n - prevMin, nx.min - prevMin)}%"></i></div><small>بقي ${nx.min - n} لمستوى «${nx.name}»</small>` : '<small>بلغ أعلى مستوى. ما شاء الله!</small>'}</div>
    <div class="stats">
      <div class="stat good"><b>${bigNum(all.filter((b) => b.kind === 'pos' && b.d >= from).length)}</b><span>إيجابية هذا الأسبوع</span></div>
      <div class="stat bad"><b>${bigNum(all.filter((b) => b.kind === 'neg' && b.d >= from).length)}</b><span>سلبية هذا الأسبوع</span></div>
      <div class="stat bad"><b>${bigNum(all.filter((b) => b.kind === 'neg').length)}</b><span>سلبية في الفصل كله</span></div>
      <div class="stat"><b>${g.max ? `${pct(g.got, g.max)}٪` : '—'}</b><span>${g.max ? `${round1(g.got)} من ${g.max}` : 'لا درجات بعد'}</span></div></div>
    ${Object.keys(g.bySkill).length ? `<h4>الدرجات في كل فرع</h4>${Object.entries(g.bySkill).map(([k, v]) => { const p = pct(v.got, v.max); return `<div class="meter"><span>${esc(k)}</span><div class="bar"><i class="${p < T.settings.pass ? 'bad' : p >= 90 ? 'good' : ''}" style="width:${p}%"></i></div><b>${p}٪</b></div>`; }).join('')}` : ''}
    <div class="btns"><button type="button" class="primary sm" data-act="beh-stu" data-id="${s.id}">${ic('star')} سجّل ملاحظة</button><button type="button" class="ghost sm" data-act="q-start" data-tpl="" data-sids="${s.id}" data-period="week">${ic('chat')} رسالة لولي أمره</button>
      <button type="button" class="ghost sm" data-act="cert" data-id="${s.id}">${ic('medal')} شهادة تميّز</button><button type="button" class="ghost sm" data-act="stu-edit" data-id="${s.id}">${ic('edit')} بياناته</button></div>
    ${hist.length ? `<h4>سجلّ الملاحظات</h4><div class="hist">${hist.map((x) => `<div class="hrow ${x.kind}"><span>${x.kind === 'pos' ? '+' : '−'} ${esc(x.reason)}${x.note ? ` <small>(${esc(x.note)})</small>` : ''}</span><small>${dateLabel(x.d)}</small><button type="button" class="x" data-act="beh-del" data-id="${x.id}" aria-label="حذف">${ic('x')}</button></div>`).join('')}</div>` : ''}
    ${msgs.length ? `<h4>رسائل لولي أمره</h4><div class="hist">${msgs.map((x) => `<div class="hrow msg"><span>${ic('chat')} «${esc(x.name)}»</span><small>${dateLabel(iso(new Date(x.at)))}</small></div>`).join('')}</div>` : ''}
  </div>`);
}

// ---- a certificate of excellence, printed (or saved as PDF) ----
Acts.cert = (el) => {
  const s = stuOf(el.dataset.id);
  const n = points(s.id), lv = levelOf(n);
  const st = T.settings;
  const why = lv.tier ? `تقديراً لتميّزه وجدّه، وبلوغه مستوى «${lv.name}» بـ${ar(n)} نقطة تميّز` : 'تقديراً لتميّزه وجدّه ومشاركته الفاعلة';
  printPage(`شهادة ${s.name}`, `@page{size:A4 landscape;margin:0}html,body{height:100%}
    .c{position:relative;width:297mm;height:210mm;padding:14mm;background:#fffdf6}
    .f{position:absolute;inset:9mm;border:3px solid #0e6b4e;border-radius:6mm}.f:after{content:"";position:absolute;inset:3mm;border:1.5px solid #c9971c;border-radius:4mm}
    .in{position:relative;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:5mm;padding:0 26mm}
    .top{display:flex;justify-content:space-between;width:100%;font-size:13pt;color:#4b5a53}
    h1{font-family:"Amiri",serif;font-size:44pt;color:#0e6b4e;margin:0;line-height:1.2}
    .sub{font-size:15pt;color:#4b5a53;margin:0}.name{font-family:"Readex Pro",sans-serif;font-size:34pt;font-weight:700;color:#111;border-bottom:2px solid #c9971c;padding:0 12mm 2mm;margin:2mm 0}
    .why{font-size:16pt;line-height:1.9;margin:0;max-width:220mm}.dua{font-family:"Amiri",serif;font-size:16pt;color:#0e6b4e;margin:0}
    .seal{width:30mm;height:30mm;border-radius:50%;background:radial-gradient(circle at 35% 35%,#f6d77a,#c9971c);display:flex;align-items:center;justify-content:center;color:#5a3d00;font-weight:700;font-size:13pt;box-shadow:0 0 0 2mm #fff,0 0 0 2.6mm #c9971c}
    .bot{display:flex;justify-content:space-between;align-items:flex-end;width:100%;font-size:13pt}.sig{text-align:center;min-width:60mm}.sig b{display:block;margin-top:8mm;border-top:1px solid #999;padding-top:2mm}`,
  `<div class="c"><div class="f"></div><div class="in">
    <div class="top"><span>${esc(st.school || '')}</span><span>${hijri()}</span></div>
    <h1>شهادة تميّز</h1><p class="sub">يسرّ معلم مادة ${esc(st.subject)} أن يقدّم هذه الشهادة للطالب</p>
    <div class="name">${esc(s.name)}</div>
    <p class="why">${esc(why)} في مادة ${esc(st.subject)}${clsOf(s.cls) && !clsOf(s.cls).demo ? `، في فصل ${esc(clsOf(s.cls).name)}` : ''}.</p>
    <p class="dua">سائلين الله له دوام التوفيق والسداد</p>
    <div class="bot"><div class="sig">المعلم<b>${esc(st.teacher || '')}</b></div><div class="seal">${lv.tier ? esc(lv.name) : 'متميز'}</div><div class="sig">التاريخ<b>${dateLabel(today())} ${new Date().getFullYear()}م</b></div></div>
  </div></div>`);
};

// the behaviour report for the school: a sheet per class with each student's counts, and every note
Acts['beh-xlsx'] = () => {
  const sheets = [];
  const month = monthStart();
  for (const c of T.classes) {
    const list = studentsIn(c.id);
    sheets.push({
      name: `ملخص ${c.name}`,
      columns: [{ title: 'م', width: 5 }, { title: 'الطالب', width: 30 }, { title: 'المستوى', width: 10 }, { title: 'إيجابية هذا الأسبوع', width: 12 }, { title: 'سلبية هذا الأسبوع', width: 12 }, { title: 'إيجابية هذا الشهر', width: 12 }, { title: 'سلبية هذا الشهر', width: 12 }, { title: 'إيجابية الكل', width: 11 }, { title: 'سلبية الكل', width: 11 }, { title: 'أكثر ملاحظة سلبية', width: 22 }],
      rows: list.map((s, i) => {
        const all = T.beh.filter((b) => b.sid === s.id);
        const negs = {};
        for (const b of all) if (b.kind === 'neg') negs[b.reason] = (negs[b.reason] || 0) + 1;
        const top = Object.entries(negs).sort((a, b) => b[1] - a[1])[0];
        return [i + 1, s.name, levelOf(points(s.id)).name, behCount(s.id, 'pos', weekStart()), behCount(s.id, 'neg', weekStart()), behCount(s.id, 'pos', month), behCount(s.id, 'neg', month),
          all.filter((b) => b.kind === 'pos').length, all.filter((b) => b.kind === 'neg').length, top ? `${top[0]} (${top[1]})` : ''];
      }),
    });
  }
  const log = T.beh.slice().sort((a, b) => a.at - b.at).map((b) => { const s = stuOf(b.sid); return [b.d, s ? s.name : '', s && clsOf(s.cls) ? clsOf(s.cls).name : '', b.kind === 'pos' ? 'إيجابية' : 'سلبية', b.reason, b.note]; });
  sheets.push({ name: 'كل الملاحظات', columns: [{ title: 'التاريخ', width: 12 }, { title: 'الطالب', width: 30 }, { title: 'الفصل', width: 14 }, { title: 'النوع', width: 10 }, { title: 'الملاحظة', width: 22 }, { title: 'إضافة', width: 30, wrap: true }], rows: log });
  download(Xlsx.build(sheets), `muallim-behavior-${today()}.xlsx`);
};
