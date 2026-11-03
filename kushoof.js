'use strict';
// الإصدار ٢٣: استيراد ملاحظات الطلاب من كشوف. كشوف لا يُصدّر ملفاً، فيُعدّ ملف muallim-kushoof.json من تسجيل شاشته
// (لكل طالب: اسمه كما في كشوف، ومجموع نقاطه، وعدد كل تقييم بمفتاحه في EVAL_DEFAULT). الملف لا يُرفع إلى المستودع أبداً (أسماء حقيقية).
// يُطابَق كل اسم بطالب في الفصل المختار، وما لم يُطابَق يُختار له بيده أو يُضاف طالباً جديداً.

let kImp = null;
const kNorm = (s) => String(s || '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ً-ْـ]/g, '').replace(/عبد\s+/g, 'عبد').replace(/\s+/g, ' ').trim();
// كل كلمات الاسم في كشوف موجودة في اسم الطالب هنا
const kMatch = (kName, s) => { const a = kNorm(s.name).split(' '); return kNorm(kName).split(' ').every((w) => a.includes(w)); };
// التقييم بمفتاحه، أو باسمه الأصلي إن غيّر المعلم مفتاحاً
const kEval = (k) => evalOf(k) || (() => { const d = EVAL_DEFAULT.find((x) => x[0] === k); return d ? T.evals.find((e) => e.name === d[1]) : null; })();
// تاريخ الملاحظات المستوردة: سبت مضى عليه ثمانية أيام على الأقل، فلا تدخل في رسالة هذا الأسبوع ولا الأسبوع المنتهي
function kDate() {
  const d = parseD(today());
  d.setDate(d.getDate() - 8);
  while (d.getDay() !== 6) d.setDate(d.getDate() - 1);
  return iso(d);
}
function kAutoMap() {
  kImp.map = kImp.data.students.map((k) => {
    const c = studentsIn(kImp.cls).filter((s) => kMatch(k.name, s));
    return c.length === 1 ? c[0].id : 'new';
  });
}
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'kIn' || !e.target.files[0]) return;
  let data = null;
  try { data = JSON.parse(await e.target.files[0].text()); } catch { data = null; }
  e.target.value = '';
  if (!data || data.app !== 'muallim-kushoof' || !Array.isArray(data.students)) { toast('هذا ليس ملف ملاحظات كشوف'); return; }
  const want = kNorm(data.cls);
  const c = T.classes.find((x) => kNorm(x.name) === want) || T.classes[0];
  if (!c) { toast('أضف الفصل أولاً'); return; }
  kImp = { data, cls: c.id };
  kAutoMap();
  openSheet(kHTML(), kHTML, 'gray');
});
function kHTML() {
  if (!kImp) return '';
  const { data } = kImp;
  const done = (T.kImports || []).includes(data.id);
  const notes = data.students.reduce((n, s) => n + Object.values(s.ev || {}).reduce((a, b) => a + b, 0), 0);
  const list = studentsIn(kImp.cls);
  const matched = kImp.map.filter((m) => m && m !== 'new').length;
  return `<h3>استيراد من كشوف</h3>
    ${done ? `<p class="bd-warn" style="--c:#e9762b">${ic('circle-exclamation')} استوردت هذا الملف من قبل؛ استيراده مرة أخرى يكرر الملاحظات.</p>` : ''}
    <div class="sm-card"><label>إلى فصل<select data-input="k-cls">${T.classes.map((c) => `<option value="${c.id}"${c.id === kImp.cls ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      <p class="hint">في الملف: ${data.students.length} طالباً، و${notes} ملاحظة. وُجد منهم في الفصل: ${matched}.</p></div>
    <div class="sm-card k-list">${data.students.map((k, i) => {
      const pts = Object.entries(k.ev || {}).reduce((n, [ek, c]) => { const e = kEval(ek); return n + (e ? e.w * c : 0); }, 0);
      return `<div class="k-row"><div class="grow"><b>${esc(k.name)}</b><small>${Object.entries(k.ev || {}).map(([ek, c]) => { const e = kEval(ek); return e ? `<i class="k-ic" style="--c:${e.c}" title="${esc(e.name)}">${ic(e.g)}${c > 1 ? `<b>${c}</b>` : ''}</i>` : `<em class="k-miss">${esc(ek)}؟</em>`; }).join('')}</small><small class="hint">النقاط: ${fmtScore(pts)}${typeof k.total === 'number' && Math.abs(pts - k.total) > 0.01 ? ` <em class="k-miss">(في كشوف ${fmtScore(k.total)})</em>` : ''}</small></div>
        <select data-input="k-map" data-i="${i}"><option value="new"${kImp.map[i] === 'new' ? ' selected' : ''}>طالب جديد</option><option value=""${kImp.map[i] === '' ? ' selected' : ''}>لا تستورده</option>${list.map((s) => `<option value="${s.id}"${kImp.map[i] === s.id ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>`;
    }).join('')}</div>
    <button type="button" class="blue-btn wide" data-act="k-go">${ic('check')} استورد الملاحظات</button>`;
}
Inputs['k-cls'] = (el) => { kImp.cls = el.value; kAutoMap(); refresh(); };
Inputs['k-map'] = (el) => { kImp.map[Number(el.dataset.i)] = el.value; refresh(); };
Acts['k-go'] = () => {
  const { data } = kImp, d = kDate(), at = parseD(d).getTime() + 12 * 3600e3;
  let n = 0, st = 0, added = 0;
  data.students.forEach((k, i) => {
    let sid = kImp.map[i];
    if (!sid) return;
    if (sid === 'new') { sid = uid(); T.students.push({ id: sid, cls: kImp.cls, name: k.name, parent: '', phone: '' }); added++; }
    st++;
    for (const [ek, c] of Object.entries(k.ev || {})) {
      const e = kEval(ek);
      if (!e) continue;
      for (let j = 0; j < c; j++) { T.beh.push({ id: uid(), sid, d, at: at + n, icon: e.k, reason: e.name, w: e.w, src: data.id }); n++; }
    }
    if (k.role) { T.roles = T.roles || {}; const r = (T.roles[kImp.cls] = T.roles[kImp.cls] || {}); if (!r[k.role]) r[k.role] = sid; }
  });
  T.kImports = [...new Set([...(T.kImports || []), data.id])];
  kImp = null;
  save(); closeSheet(); render();
  toast(`استُوردت ${n} ملاحظة لـ${st} طالباً${added ? `، منهم ${added} جدد` : ''}`);
};
// التراجع: حذف كل ما استُورد من كشوف (الطلاب الذين أُضيفوا يبقون)
Acts['k-undo'] = (el) => {
  if (!armed(el)) return;
  const ids = new Set(T.kImports || []);
  const before = T.beh.length;
  T.beh = T.beh.filter((b) => !ids.has(b.src));
  T.kImports = [];
  save(); render(); toast(`حُذفت ${before - T.beh.length} ملاحظة مستوردة`);
};
const kushoofCard = () => `<div class="card"><h3>استيراد من كشوف</h3>
  <label class="ghost-btn file wide">${ic('up')} اختر ملف ملاحظات كشوف<input type="file" id="kIn" accept=".json,application/json" hidden></label>
  ${(T.kImports || []).length ? `<button type="button" class="red-btn wide" data-act="k-undo">احذف ما استوردته من كشوف</button>` : ''}</div>`;
