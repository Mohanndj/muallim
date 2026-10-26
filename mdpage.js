// التعبئة داخل صفحة «إعداد الدرس» في منصة مدرستي. هذا الملف يعمل في صفحة المنصة نفسها (لا في التطبيق):
// تستدعيه الإشارة المرجعية «تعبئة» في كروم وهو داخل حسابه، فيقرأ التحضير المنسوخ من التطبيق، ثم:
// الخطوة الأولى (المعلومات الأساسية) يضغط «التالي»، وفي الثانية يؤشّر كل الأهداف وكل المحتوى الرقمي،
// والاستراتيجيات والوسائل التي اختارها المعلم، ويكتب مهارات التفكير وإغلاق الدرس وتعليمات المعلم.
// لا يحفظ ولا يرسل شيئاً: المعلم يراجع ثم يضغط «حفظ وإنهاء» بنفسه.
// في التطبيق يُحمَّل هذا الملف ليؤخذ نصه للإشارة المرجعية فقط (window.mdFillSrc).
(function () {
  function mdFill() {
    var MARK = 'مساعد المعلم|تحضير';
    var SECS = [['goals', ['الأهداف التي سيكتسبها', 'الاهداف التي سيكتسبها', 'أهداف الدرس']], ['digital', ['المحتوى الرقمي']], ['strat', ['استراتيجيات التدريس', 'إستراتيجيات التدريس']], ['tools', ['الوسائل التعليمية']],
      ['think', ['مهارات التفكير']], ['close', ['إغلاق الدرس', 'غلق الدرس']], ['notes', ['تعليمات المعلم']], ['acts', ['إثراءات المعلم', 'يتعين عليك إضافة']]];
    var TEXTS = { think: 'مهارات التفكير', close: 'إغلاق الدرس', notes: 'تعليمات المعلم' };
    var norm = function (s) { return String(s || '').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[:：*()\s]+/g, ' ').trim(); };
    var old = document.getElementById('mlm-box');
    if (old) old.remove();
    var box = document.createElement('div');
    box.id = 'mlm-box';
    box.setAttribute('style', 'position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;background:#fff;color:#111;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.35);padding:14px;font:15px/1.7 Tahoma,sans-serif;direction:rtl;text-align:right;max-height:65vh;overflow:auto');
    document.body.appendChild(box);
    var btn = 'border:0;border-radius:12px;padding:8px 14px;margin:4px 0 0 6px;font:inherit;';
    function show(html) {
      box.innerHTML = '<b style="color:#1a8f5c">مساعد المعلم</b><button id="mlm-x" style="float:left;border:0;background:#eee;border-radius:50%;width:30px;height:30px">✕</button><div style="clear:both;margin-top:4px">' + html + '</div>';
      document.getElementById('mlm-x').onclick = function () { box.remove(); };
    }
    var visible = function (el) { var r = el.getBoundingClientRect(); return r.width > 0 || r.height > 0 || el.offsetParent !== null; };
    // عناوين الأقسام بترتيبها في الصفحة
    function heads() {
      var out = [];
      document.querySelectorAll('h1,h2,h3,h4,h5,h6,label,span,div,p,b,strong,legend,mat-label').forEach(function (el) {
        if (el.closest('#mlm-box') || el.querySelector('input,textarea,[role=checkbox]')) return;
        var t = norm(el.textContent);
        if (!t || t.length > 90) return;
        SECS.forEach(function (s) { if (s[1].some(function (n) { return t.indexOf(norm(n)) >= 0; })) out.push({ k: s[0], el: el }); });
      });
      // الأعمق فقط (لا الحاوية التي تضم العنوان)
      return out.filter(function (h) { return !out.some(function (o) { return o !== h && o.k === h.k && h.el.contains(o.el); }); });
    }
    var before = function (a, b) { return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING); };
    // القسم الذي يقع فيه عنصر: آخر عنوان قبله
    function secOf(el, H) { var k = '', last = null; H.forEach(function (h) { if (before(h.el, el) && (!last || before(last, h.el))) { last = h.el; k = h.k; } }); return k; }
    function boxes() {
      var out = [];
      document.querySelectorAll('input[type=checkbox], [role=checkbox]').forEach(function (el) {
        if (el.closest('#mlm-box') || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
        if (el.matches('[role=checkbox]') && el.querySelector('input[type=checkbox]')) return;
        out.push(el);
      });
      return out;
    }
    var isOn = function (el) { return el.checked === true || el.getAttribute('aria-checked') === 'true'; };
    function textOf(el) {
      var l = el.closest('label') || (el.id && document.querySelector('label[for="' + el.id + '"]'));
      if (l && norm(l.textContent)) return norm(l.textContent);
      var p = el.parentElement;
      for (var i = 0; i < 4 && p; i++, p = p.parentElement) { var t = norm(p.textContent); if (t) return t.length < 120 ? t : ''; }
      return norm(el.getAttribute('aria-label'));
    }
    function tick(el) {
      if (isOn(el)) return true;
      el.click();
      if (!isOn(el)) { var l = el.closest('label') || el.parentElement; if (l) l.click(); }
      return isOn(el);
    }
    function write(el, text) {
      if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, text);
      } else el.innerText = text;
      ['input', 'change', 'keyup', 'blur'].forEach(function (t) { el.dispatchEvent(new Event(t, { bubbles: true })); });
      el.style.outline = '3px solid #5fcf80';
    }
    var list = function (s) { return String(s || '').split(/[،,\n;؛]+/).map(norm).filter(Boolean); };
    // لكل اختيار مطلوب: المربع الذي نصه مثله تماماً، وإلا أقرب مربع يحتويه
    function pick(items, wants) {
      var out = [];
      wants.forEach(function (w) {
        var hit = items.filter(function (it) { return it.t === w; })[0] || items.filter(function (it) { return it.t.indexOf(w) >= 0 || (it.t.length > 3 && w.indexOf(it.t) >= 0); }).sort(function (a, b) { return a.t.length - b.t.length; })[0];
        if (hit && out.indexOf(hit) < 0) out.push(hit);
      });
      return out;
    }

    function fill(data) {
      var H = heads();
      var has = function (k) { return H.some(function (h) { return h.k === k; }); };
      // الخطوة الأولى: «التالي» ثم انتظار الخطوة الثانية
      if (!has('goals') && !has('strat')) {
        var next = [].slice.call(document.querySelectorAll('button, a, [role=button]')).filter(function (b) { return norm(b.textContent) === 'التالي' && visible(b) && !b.disabled; })[0];
        if (!next) { report('لم أجد في هذه الصفحة خانات التحضير. افتح «إعداد الدرس» للحصة ثم اضغط «تعبئة».'); return; }
        show('<p>أنتقل إلى الخطوة الثانية…</p>');
        next.click();
        var n = 0, iv = setInterval(function () { n++; var H2 = heads(); if (H2.some(function (h) { return h.k === 'goals' || h.k === 'strat'; }) && boxes().length) { clearInterval(iv); setTimeout(function () { fill(data); }, 500); } else if (n > 40) { clearInterval(iv); report('لم تظهر الخطوة الثانية. اضغط «التالي» بنفسك ثم «تعبئة» مرة أخرى.'); } }, 250);
        return;
      }
      var f = data.f || {}, got = { goals: 0, digital: 0, strat: [], tools: [] }, wants = { strat: list(f.strat), tools: list(f.tools) };
      var items = { strat: [], tools: [] };
      boxes().forEach(function (el) {
        var k = secOf(el, H);
        if (k === 'goals' || k === 'digital') { if (tick(el)) got[k]++; }
        else if (items[k]) items[k].push({ el: el, t: textOf(el) });
      });
      ['strat', 'tools'].forEach(function (k) { pick(items[k], wants[k]).forEach(function (it) { if (tick(it.el)) got[k].push(it.t); }); });
      var wrote = [], miss = [];
      Object.keys(TEXTS).forEach(function (k) {
        if (!f[k]) return;
        var h = H.filter(function (x) { return x.k === k; })[0], el = null;
        if (h) el = [].slice.call(document.querySelectorAll('textarea, [contenteditable=true], input[type=text]')).filter(function (x) { return before(h.el, x) && !x.closest('#mlm-box'); })[0];
        if (!el) { var ph = [].slice.call(document.querySelectorAll('textarea')).filter(function (x) { return norm(x.placeholder).indexOf(norm(TEXTS[k]).split(' ')[0]) >= 0; })[0]; el = ph || null; }
        if (el) { write(el, k === 'notes' ? f[k].slice(0, 500) : f[k]); wrote.push(TEXTS[k]); } else miss.push(TEXTS[k]);
      });
      if (wants.strat.length && !got.strat.length) miss.push('الاستراتيجيات');
      if (wants.tools.length && !got.tools.length) miss.push('الوسائل');
      var lines = [];
      if (got.goals) lines.push('✓ الأهداف: أشّرتها كلها (' + got.goals + ')'); else miss.push('الأهداف');
      if (got.digital) lines.push('✓ المحتوى الرقمي: أشّرته كله (' + got.digital + ')');
      if (got.strat.length) lines.push('✓ الاستراتيجيات: ' + got.strat.join('، '));
      if (got.tools.length) lines.push('✓ الوسائل: ' + got.tools.join('، '));
      if (wrote.length) lines.push('✓ كتبت: ' + wrote.join('، '));
      report('<p><b>«' + (data.t || '') + '»</b></p><p style="color:#23843f">' + lines.join('<br>') + '</p>' + (miss.length ? '<p style="color:#c0392b">لم أجد: ' + miss.join('، ') + '</p>' : '') +
        '<p><b>بقي عليك:</b> أضف واجباً أو نشاطاً من أزرار المنصة (تشترط واحداً على الأقل)، ثم راجع واضغط «حفظ وإنهاء».</p>' +
        (f.hw ? '<button id="mlm-hw" style="' + btn + 'background:#1a8f5c;color:#fff">انسخ نص الواجب</button>' : ''), miss.length);
      var hb = document.getElementById('mlm-hw');
      if (hb) hb.onclick = function () { navigator.clipboard.writeText(f.hw).then(function () { hb.textContent = 'نُسخ، الصقه في نافذة الواجب'; }, function () { prompt('انسخ الواجب', f.hw); }); };
    }
    // ما في الصفحة من أقسام وخانات (بلا أي بيانات طلاب) يُرسل لمن صمّم التطبيق إن لم تُعرف الصفحة
    function report(html, withRep) {
      show((html.charAt(0) === '<' ? html : '<p>' + html + '</p>') + '<button id="mlm-rep" style="' + btn + 'background:#eef;color:#3478f6">انسخ تقريراً للمصمم</button>');
      document.getElementById('mlm-rep').onclick = function () {
        var H = heads(), B = boxes();
        var rep = 'تقرير صفحة مدرستي\n' + location.pathname + '\nالعناوين: ' + H.map(function (h) { return h.k + '=' + norm(h.el.textContent).slice(0, 40) + '<' + h.el.tagName.toLowerCase() + '>'; }).join(' | ') +
          '\nالمربعات: ' + B.length + ' ' + B.slice(0, 40).map(function (b) { return (secOf(b, H) || '?') + ':' + b.tagName.toLowerCase() + (b.className && typeof b.className === 'string' ? '.' + b.className.split(/\s+/)[0] : '') + ':' + textOf(b).slice(0, 25); }).join(' | ') +
          '\nالخانات: ' + [].slice.call(document.querySelectorAll('textarea,[contenteditable=true]')).map(function (x) { return x.tagName.toLowerCase() + ':' + norm(x.placeholder || '').slice(0, 30) + ':' + (secOf(x, H) || '?'); }).join(' | ') +
          '\nالأزرار: ' + [].slice.call(document.querySelectorAll('button')).map(function (b) { return norm(b.textContent).slice(0, 20); }).filter(Boolean).slice(0, 30).join(' | ');
        var rb = this;
        navigator.clipboard.writeText(rep).then(function () { rb.textContent = 'نُسخ التقرير، أرسله'; }, function () { prompt('انسخ هذا', rep); });
      };
    }
    function start(raw) {
      var i = raw.indexOf(MARK);
      if (i < 0) { ask(); return; }
      try { fill(JSON.parse(raw.slice(i + MARK.length))); } catch (e) { report('التحضير المنسوخ ناقص. انسخه من التطبيق مرة أخرى. (' + e.message + ')'); }
    }
    function ask() {
      show('<p>لم أجد تحضيراً منسوخاً. في «مساعد المعلم» افتح الدرس واضغط «عبّئ في مدرستي»، ثم ارجع هنا واضغط «تعبئة». أو الصقه هنا:</p><textarea id="mlm-t" style="width:100%;height:70px;border:1px solid #ccc;border-radius:10px;padding:6px"></textarea><button id="mlm-go" style="' + btn + 'background:#1a8f5c;color:#fff">عبّئ</button>');
      document.getElementById('mlm-go').onclick = function () { start(document.getElementById('mlm-t').value); };
    }
    if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { start(t || ''); }, ask);
    else ask();
  }
  if (typeof Acts === 'undefined') mdFill(); else window.mdFillSrc = mdFill.toString();
})();
