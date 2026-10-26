// «التعلّم» داخل تطبيق «تحضير مدرستي»: يسجّل بصمت شكل صفحات منصة مدرستي وما يضغطه المعلم فيها
// (أسماء الأزرار والعناوين والخانات وأنواعها فقط، بلا ما يكتبه ولا أي قيم)، حتى يُبنى زر «حضّر جدولي كله»
// على صفحاتها الحقيقية. التطبيق يحقنه في كل صفحة، ويجمع ما يرسله (MlmRec.log)، والضغط المطوّل على الزر يقدّمه.
(function () {
  if (window.__mlmRec || typeof MlmRec === 'undefined') return;
  window.__mlmRec = 1;
  var cut = function (s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; };
  var cls = function (el) { return typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean).slice(0, 3).join('.') : ''; };
  function desc(el) {
    var parts = [], e = el;
    for (var i = 0; i < 6 && e && e.nodeType === 1 && e !== document.body; i++, e = e.parentElement) {
      parts.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (cls(e) ? '.' + cls(e) : '') + (e.getAttribute('role') ? '[role=' + e.getAttribute('role') + ']' : ''));
    }
    return { path: parts.join(' > '), text: cut(el.innerText || el.value || el.getAttribute('aria-label') || '', 50), type: el.type || '' };
  }
  function outline() {
    var o = { title: cut(document.title, 60), heads: [], buttons: [], fields: [], boxes: 0, radios: 0, links: [] };
    document.querySelectorAll('h1,h2,h3,h4,h5,h6,legend,label,.title,[class*=title],[class*=header]').forEach(function (el) {
      if (!el.getClientRects().length) return;
      var t = cut(el.innerText, 60);
      if (t && o.heads.indexOf(t) < 0 && o.heads.length < 60) o.heads.push(t);
    });
    document.querySelectorAll('button, [role=button], a.btn, input[type=button], input[type=submit]').forEach(function (el) {
      if (!el.getClientRects().length) return;
      var t = cut(el.innerText || el.value || el.getAttribute('aria-label'), 40);
      if (o.buttons.length < 60) o.buttons.push(t + ' <' + el.tagName.toLowerCase() + (cls(el) ? '.' + cls(el) : '') + '>');
    });
    document.querySelectorAll('input, textarea, select, [contenteditable=true]').forEach(function (el) {
      if (!el.getClientRects().length && el.type !== 'checkbox' && el.type !== 'radio') return;
      if (el.type === 'checkbox') { o.boxes++; return; }
      if (el.type === 'radio') { o.radios++; return; }
      if (o.fields.length < 40) o.fields.push(el.tagName.toLowerCase() + ':' + (el.type || '') + ':' + cut(el.placeholder || el.getAttribute('aria-label') || el.name || '', 40));
    });
    document.querySelectorAll('a[href]').forEach(function (el) {
      if (!el.getClientRects().length || o.links.length >= 40) return;
      var h = el.getAttribute('href');
      if (h && h.charAt(0) !== '#' && h.indexOf('javascript') !== 0) o.links.push(cut(el.innerText, 30) + ' -> ' + cut(h.replace(/^https?:\/\/[^/]+/, ''), 60));
    });
    o.customBoxes = document.querySelectorAll('[class*=checkbox], [role=checkbox]').length;
    return o;
  }
  var send = function (o) { try { MlmRec.log(JSON.stringify(o)); } catch (e) { /* التطبيق القديم */ } };
  var where = function () { return location.pathname + location.search + location.hash; };
  document.addEventListener('click', function (e) { send({ t: 'click', u: where(), el: desc(e.target) }); }, true);
  // صفحات المنصة تتغير دون إعادة تحميل: كل تغيّر في العنوان، وبعد ثانيتين وصف الصفحة
  var last = '';
  setInterval(function () { var u = where(); if (u !== last) { last = u; setTimeout(function () { send({ t: 'page', u: where(), o: outline() }); }, 2000); } }, 700);
  // ونافذة تُفتح (مثل إضافة واجب) تُوصف كذلك
  var lastDlg = 0;
  setInterval(function () {
    var d = document.querySelectorAll('[role=dialog], .modal.show, .modal[style*=block], mat-dialog-container, .p-dialog, .cdk-overlay-pane');
    var n = 0; d.forEach(function (x) { if (x.getClientRects().length) n++; });
    if (n !== lastDlg) { lastDlg = n; if (n) setTimeout(function () { send({ t: 'dialog', u: where(), o: outline() }); }, 1200); }
  }, 800);
  send({ t: 'page', u: where(), o: outline() });
})();
