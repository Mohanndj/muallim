'use strict';
// التعبئة في منصة مدرستي: «إشارة مرجعية» في كروم (زر محفوظ يُستدعى بكتابة اسمه في شريط العنوان)
// تعمل داخل صفحة تحضير الدرس في المنصة وحساب المعلم نفسه، فتقرأ التحضير الذي نسخه من التطبيق
// وتضعه في الخانات التي تحمل أسماءها. لا كلمة مرور ولا اتصال بغير المنصة.
// mdFill لا تعمل داخل التطبيق: نصّها هو الإشارة المرجعية (mdBookmark).

const MD_MARK = 'مساعد المعلم|تحضير';
function mdFill() {
  var MARK = 'مساعد المعلم|تحضير';
  var NAMES = {
    intro: ['التهيئة', 'التمهيد', 'المقدمة', 'تهيئة'], vocab: ['مفردات الدرس', 'المفردات', 'عناصر الدرس', 'محتوى الدرس'], goals: ['الأهداف', 'أهداف الدرس', 'الاهداف', 'نواتج التعلم'],
    strat: ['الاستراتيجيات', 'استراتيجيات التدريس', 'الإستراتيجيات', 'استراتيجية التدريس', 'طرق التدريس'], tools: ['الوسائل', 'مصادر التعلم', 'الوسائل التعليمية', 'الأدوات'],
    acts: ['الأنشطة', 'النشاط', 'الانشطة', 'أنشطة'], assess: ['التقويم', 'التقييم'], hw: ['الواجب', 'الواجبات', 'الواجب المنزلي'], links: ['الروابط', 'روابط', 'رابط', 'المحتوى الرقمي'],
  };
  var TITLES = { intro: 'التهيئة', vocab: 'مفردات الدرس', goals: 'الأهداف', strat: 'الاستراتيجيات', tools: 'الوسائل', acts: 'الأنشطة', assess: 'التقويم', hw: 'الواجب', links: 'الروابط' };
  var old = document.getElementById('mlm-box');
  if (old) old.remove();
  var box = document.createElement('div');
  box.id = 'mlm-box';
  box.setAttribute('style', 'position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;background:#fff;color:#111;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.35);padding:14px;font:15px/1.6 Tahoma,sans-serif;direction:rtl;text-align:right;max-height:70vh;overflow:auto');
  document.body.appendChild(box);
  function show(html) { box.innerHTML = '<b style="color:#3478f6">مساعد المعلم</b><button id="mlm-x" style="float:left;border:0;background:#eee;border-radius:50%;width:30px;height:30px">✕</button><div style="clear:both;margin-top:6px">' + html + '</div>'; document.getElementById('mlm-x').onclick = function () { box.remove(); }; }
  var norm = function (s) { return String(s || '').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/[:：*\s]+/g, ' ').trim(); };
  var visible = function (el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  // كل خانة كتابة في الصفحة (ومنها محررات النصوص داخل إطار)
  function fields() {
    var out = [];
    document.querySelectorAll('textarea, input[type=text], input:not([type]), [contenteditable=""], [contenteditable=true]').forEach(function (el) {
      if (visible(el) && !el.closest('#mlm-box') && !el.disabled && !el.readOnly) out.push({ el: el, doc: document });
    });
    document.querySelectorAll('iframe').forEach(function (f) {
      try { var b = f.contentDocument && f.contentDocument.body; if (b && (b.isContentEditable || f.contentDocument.designMode === 'on') && visible(f)) out.push({ el: b, frame: f }); } catch (e) { /* إطار من موقع آخر */ }
    });
    return out;
  }
  // اسم الخانة: ما كُتب عليها أو فوقها
  function labelOf(fd) {
    var el = fd.frame || fd.el, bits = [el.getAttribute('aria-label'), el.getAttribute('placeholder'), el.getAttribute('title'), el.getAttribute('name'), el.id];
    if (el.id) { var l = document.querySelector('label[for="' + el.id + '"]'); if (l) bits.unshift(l.textContent); }
    var p = el.parentElement;
    for (var i = 0; i < 5 && p; i++, p = p.parentElement) {
      var t = '';
      p.childNodes.forEach(function (n) { if (n.nodeType === 3) t += n.textContent; else if (n.nodeType === 1 && !n.contains(el) && !n.querySelector('textarea,input,iframe,[contenteditable]') && n.textContent.length < 60) t += ' ' + n.textContent; });
      if (norm(t)) { bits.push(t); break; }
      var prev = p.previousElementSibling;
      if (prev && prev.textContent.length < 60 && norm(prev.textContent)) { bits.push(prev.textContent); break; }
    }
    return norm(bits.filter(Boolean).join(' | '));
  }
  function put(fd, text) {
    var el = fd.el;
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, el.tagName === 'INPUT' ? text.replace(/\n+/g, ' | ') : text);
    } else {
      el.innerHTML = text.split('\n').map(function (l) { return '<p>' + l.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</p>'; }).join('');
    }
    ['input', 'change', 'keyup', 'blur'].forEach(function (t) { el.dispatchEvent(new Event(t, { bubbles: true })); });
    (fd.frame || el).style.outline = '3px solid #5fcf80';
  }
  function fill(raw) {
    var i = raw.indexOf(MARK);
    if (i < 0) { show('<p>لم أجد تحضيراً منسوخاً من التطبيق.</p><p>ارجع إلى «مساعد المعلم»، وافتح الدرس، واضغط «عبّئ في مدرستي»، ثم عُد إلى هذه الصفحة واضغط الزر مرة أخرى.</p>'); return; }
    var data;
    try { data = JSON.parse(raw.slice(i + MARK.length)); } catch (e) { show('<p>التحضير المنسوخ ناقص. انسخه من التطبيق مرة أخرى.</p>'); return; }
    var fs = fields(), used = [], done = [], miss = [];
    Object.keys(TITLES).forEach(function (k) {
      if (!data.f[k]) return;
      var hit = null;
      for (var j = 0; j < fs.length && !hit; j++) {
        if (used.indexOf(j) >= 0) continue;
        var lb = labelOf(fs[j]);
        if (NAMES[k].some(function (n) { return lb.indexOf(norm(n)) >= 0; })) hit = j;
      }
      if (hit === null) { miss.push(TITLES[k]); return; }
      used.push(hit); put(fs[hit], data.f[k]); done.push(TITLES[k]);
    });
    window.__mlmReport = 'تقرير صفحة مدرستي لمساعد المعلم\n' + location.pathname + '\n' + fs.map(function (fd, j) { var e = fd.frame || fd.el; return (j + 1) + ') ' + e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(/\s+/).slice(0, 3).join('.') : '') + ' :: ' + labelOf(fd).slice(0, 80); }).join('\n');
    show('<p><b>«' + (data.t || '') + '»</b></p>' + (done.length ? '<p style="color:#23843f">✓ عبّأت: ' + done.join('، ') + '</p>' : '') +
      (miss.length ? '<p style="color:#c0392b">لم أجد في هذه الصفحة خانة: ' + miss.join('، ') + '</p>' : '') +
      '<p>راجع الخانات المحاطة بالأخضر، ثم احفظ من المنصة كعادتك.</p>' +
      (miss.length ? '<p style="font-size:13px;color:#555">إن كانت الخانات في خطوة أخرى من الصفحة فانتقل إليها واضغط الزر مرة أخرى. وإن كانت هنا ولم أجدها فاضغط «انسخ تقريراً» وأرسله لمن صمّم لك التطبيق.</p><button id="mlm-rep" style="border:0;background:#3478f6;color:#fff;border-radius:12px;padding:8px 14px">انسخ تقريراً</button>' : ''));
    var rb = document.getElementById('mlm-rep');
    if (rb) rb.onclick = function () { navigator.clipboard.writeText(window.__mlmReport).then(function () { rb.textContent = 'نُسخ التقرير'; }, function () { prompt('انسخ هذا', window.__mlmReport); }); };
  }
  // التحضير المنسوخ: من الحافظة، وإن لم يُسمح فخانة يُلصق فيها
  function ask() {
    show('<p>الصق هنا التحضير الذي نسخته من التطبيق (اضغط مطولاً ثم «لصق»):</p><textarea id="mlm-t" style="width:100%;height:90px;border:1px solid #ccc;border-radius:10px;padding:6px"></textarea><button id="mlm-go" style="margin-top:6px;border:0;background:#3478f6;color:#fff;border-radius:12px;padding:8px 18px">عبّئ</button>');
    document.getElementById('mlm-go').onclick = function () { fill(document.getElementById('mlm-t').value); };
  }
  if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { if (t && t.indexOf(MARK) >= 0) fill(t); else ask(); }, ask);
  else ask();
}
const mdBookmark = () => `javascript:${encodeURIComponent(`(${mdFill.toString()})()`)}`;

// ---- في التطبيق: نسخ التحضير للتعبئة، وتجهيز الزر مرة واحدة ----
Acts['md-fill'] = async () => {
  // الزر يُجهَّز أولاً (نسخه يستبدل ما في الحافظة)، ثم يُنسخ التحضير
  if (!T.mdReady) { Acts['md-setup'](); return; }
  const l = lesOf(UI.les);
  try { await navigator.clipboard.writeText(`${MD_MARK}${JSON.stringify({ t: l.title, f: l.f || {} })}`); } catch { toast('تعذّر النسخ'); return; }
  openSheet(`<h3>${ic('check')} نُسخ تحضير «${esc(l.title)}»</h3>
    <ol class="md-steps"><li>افتح صفحة تحضير هذا الدرس في <b>منصة مدرستي</b> في متصفح كروم.</li><li>اضغط شريط العنوان أعلى الصفحة، واكتب: <b>تعبئة</b></li><li>اختر من القائمة «تعبئة» (عليها علامة النجمة)، فتمتلئ الخانات.</li><li>راجعها واحفظ من المنصة كعادتك.</li></ol>
    <p class="hint">إن كانت صفحة التحضير في المنصة خطوات، فاضغط «تعبئة» في كل خطوة.</p>
    <button type="button" class="link" data-act="md-setup">${ic('gear')} جهّز زر «تعبئة» من جديد</button>`);
};
Acts['md-setup'] = () => openSheet(`<h3>جهّز زر «تعبئة» في كروم (مرة واحدة)</h3>
  <ol class="md-steps"><li>اضغط الزر الأزرق بالأسفل لنسخ الزر.</li>
    <li>في كروم: اضغط النقاط الثلاث ⋮ أعلى الشاشة، ثم النجمة ☆ فتُحفظ الصفحة الحالية.</li>
    <li>اضغط «تعديل» في الشريط الذي يظهر أسفل الشاشة.</li>
    <li>في خانة الاسم امسح ما فيها واكتب: <b>تعبئة</b></li>
    <li>في خانة العنوان (الرابط) امسح ما فيها، واضغط مطولاً، ثم «لصق».</li>
    <li>ارجع إلى هنا، وافتح الدرس، واضغط «عبّئ في مدرستي».</li></ol>
  <button type="button" class="blue-btn wide" data-act="md-copy-bm">${ic('clipboard')} انسخ الزر</button>
  <p class="hint">الزر يعمل في صفحة مدرستي وأنت داخل حسابك، ولا يطلب كلمة مرور، ولا يرسل شيئاً لأي مكان.</p>`);
Acts['md-copy-bm'] = async (el) => {
  try { await navigator.clipboard.writeText(mdBookmark()); T.mdReady = 1; save(); toast('نُسخ الزر، أكمل الخطوات في كروم'); el.textContent = 'نُسخ الزر ✓'; } catch { toast('تعذّر النسخ'); }
};
