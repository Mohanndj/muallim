'use strict';
// الإصدار ٢٨: تصوير أوراق الاختبار بسرعة بكاميرا الجوال، وجمعها في ملف PDF واحد يُرسل إلى Claude ليصححها.
// الكاميرا تعمل داخل النافذة (زر تصوير كبير، وكل ضغطة صفحة)، وإن لم يُسمح بها فبكاميرا الجوال أو من المعرض.
// الصفحات في الذاكرة فقط حتى يُصنع الملف (صور أوراق الطلاب لا تُحفظ ولا تُزامَن). الملف بلا مكتبات: صور JPEG داخل صفحات A4.

let scan = null; // { ex, cls, pages: [{ jpg: Uint8Array, w, h, url }], stream, pdf }
const SCAN_MAX = 1700;
const scanEx = () => (scan && scan.ex ? exOf(scan.ex) : null);

Acts['scan-open'] = async (el) => {
  scanStop();
  scan = { ex: el.dataset.ex || '', cls: el.dataset.cls || '', pages: [], stream: null, pdf: null };
  openSheet(scanHTML(), null, 'wide gray scan-sheet');
  await scanCam();
};
function scanHTML() {
  const x = scanEx();
  return `<h3>${ic('camera')} صوّر أوراق الاختبار</h3>
    ${x ? `<p class="hint">${esc(x.title)}${scan.cls && clsOf(scan.cls) ? ` | ${esc(clsOf(scan.cls).name)}` : ''}</p>` : ''}
    <div class="scan-view" id="scanView"><video id="scanVid" playsinline muted autoplay></video><p class="scan-msg" id="scanMsg">جارٍ فتح الكاميرا…</p></div>
    <div class="scan-ctl"><label class="ghost-btn sm file">${ic('image')} من المعرض<input type="file" id="scanFiles" accept="image/*" multiple hidden></label>
      <button type="button" class="scan-shot" data-act="scan-shot" aria-label="صوّر الصفحة"><i></i></button>
      <span class="scan-n" id="scanN">0 صفحة</span></div>
    <div class="scan-thumbs" id="scanThumbs"></div>
    <div id="scanOut"></div>`;
}
async function scanCam() {
  const msg = $('scanMsg');
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('none');
    scan.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
    if (!scan || !$('scanVid')) { scanStop(); return; }
    $('scanVid').srcObject = scan.stream;
    if (msg) msg.hidden = true;
  } catch {
    if (!$('scanView')) return;
    // بلا إذن الكاميرا: كاميرا الجوال نفسها، كل صورة صفحة
    $('scanView').innerHTML = `<label class="scan-alt">${ic('camera')}<b>اضغط لتصوير صفحة</b><small>لم يُسمح للتطبيق بالكاميرا، فستُفتح كاميرا الجوال</small><input type="file" id="scanFiles2" accept="image/*" capture="environment" hidden></label>`;
  }
}
// إغلاق النافذة: تُطفأ الكاميرا وتُنسى الصور
function scanEnd() { scanStop(); if (scan) scan.pages.forEach((p) => URL.revokeObjectURL(p.url)); scan = null; }
function scanStop() {
  if (scan && scan.stream) { scan.stream.getTracks().forEach((t) => t.stop()); scan.stream = null; }
}
// صفحة من إطار الكاميرا أو من صورة: تُصغَّر إلى ١٧٠٠ بكسل لأطول ضلع، JPEG
function scanCanvas(src, w, h) {
  const k = Math.min(1, SCAN_MAX / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c;
}
async function scanAdd(c) {
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.72));
  if (!blob || !scan) return;
  scan.pages.push({ jpg: new Uint8Array(await blob.arrayBuffer()), w: c.width, h: c.height, url: URL.createObjectURL(blob) });
  scan.pdf = null;
  scanList();
}
Acts['scan-shot'] = async () => {
  const v = $('scanVid');
  if (!v || !v.videoWidth) { toast('الكاميرا لم تعمل؛ صوّر من «من المعرض»'); return; }
  const view = $('scanView');
  view.classList.remove('flash'); void view.offsetWidth; view.classList.add('flash');
  if (navigator.vibrate) navigator.vibrate(20);
  await scanAdd(scanCanvas(v, v.videoWidth, v.videoHeight));
};
document.addEventListener('change', async (e) => {
  if (!['scanFiles', 'scanFiles2'].includes(e.target.id) || !scan) return;
  for (const f of [...e.target.files]) {
    try {
      const bmp = await createImageBitmap(f, { imageOrientation: 'from-image' });
      await scanAdd(scanCanvas(bmp, bmp.width, bmp.height));
    } catch { toast('تعذّرت قراءة صورة'); }
  }
  e.target.value = '';
});
function scanList() {
  if (!scan || !$('scanThumbs')) return;
  const n = scan.pages.length;
  $('scanN').textContent = `${n} ${n > 2 && n < 11 ? 'صفحات' : 'صفحة'}`;
  $('scanThumbs').innerHTML = scan.pages.map((p, i) => `<div class="scan-th"><img src="${p.url}" alt=""><b>${i + 1}</b><button type="button" class="x" data-act="scan-del" data-i="${i}" aria-label="احذف الصفحة">${ic('x')}</button></div>`).join('');
  $('scanOut').innerHTML = n ? `<button type="button" class="blue-btn wide" data-act="scan-pdf">${ic('file-lines')} اصنع ملف PDF (${n} ${n > 2 && n < 11 ? 'صفحات' : 'صفحة'})</button>` : '';
}
Acts['scan-del'] = (el) => { const [p] = scan.pages.splice(Number(el.dataset.i), 1); if (p) URL.revokeObjectURL(p.url); scan.pdf = null; scanList(); };

// ---- ملف PDF: كل صورة في صفحة A4 بهامش، بلا مكتبات ----
function scanPdf(pages) {
  const enc = new TextEncoder(), parts = [], offs = [];
  let len = 0;
  const put = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
  const obj = (n, body) => { offs[n] = len; put(`${n} 0 obj\n`); body(); put('\nendobj\n'); };
  const W = 595.28, H = 841.89, M = 18, N = pages.length;
  put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  obj(1, () => put('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => put(`<< /Type /Pages /Count ${N} /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] >>`));
  pages.forEach((p, i) => {
    const pn = 3 + i * 3, cn = pn + 1, im = pn + 2;
    const k = Math.min((W - 2 * M) / p.w, (H - 2 * M) / p.h), dw = p.w * k, dh = p.h * k, x = (W - dw) / 2, y = (H - dh) / 2;
    const cs = `q ${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`;
    obj(pn, () => put(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${im} 0 R >> >> /Contents ${cn} 0 R >>`));
    obj(cn, () => { put(`<< /Length ${cs.length} >>\nstream\n`); put(cs); put('\nendstream'); });
    obj(im, () => { put(`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpg.length} >>\nstream\n`); put(p.jpg); put('\nendstream'); });
  });
  const xref = len, total = 3 + N * 3;
  put(`xref\n0 ${total}\n0000000000 65535 f \n`);
  for (let n = 1; n < total; n++) put(`${String(offs[n]).padStart(10, '0')} 00000 n \n`);
  put(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts, { type: 'application/pdf' });
}
// طلب التصحيح لـClaude: نموذج الإجابة من الاختبار إن فُتح منه
function scanPrompt() {
  const x = scanEx();
  const n = scan.pages.length;
  return [`مرفق ملف PDF فيه ${n} ${n > 2 && n < 11 ? 'صفحات' : 'صفحة'}: صور أوراق إجابات طلابي في اختبار${x ? ` «${x.title}»` : ''}.`,
    'صحّح كل ورقة، وأعطني جدولاً: اسم الطالب كما كتبه، ودرجة كل سؤال، والمجموع، وملاحظة قصيرة إن وُجدت.',
    'إن لم تستطع قراءة اسم أو إجابة فاذكر ذلك صراحة ولا تخمّن.',
    ...(x ? ['', `الدرجة الكاملة: ${fmtScore(exTotal(x))}`, 'نموذج الإجابة:', exText(x)] : [])].join('\n');
}
const scanName = () => `muallim-exam-${today()}.pdf`;
Acts['scan-pdf'] = () => {
  scan.pdf = scanPdf(scan.pages);
  const mb = scan.pdf.size < 1048576 ? `${Math.max(1, Math.round(scan.pdf.size / 1024))} ك.ب` : `${(scan.pdf.size / 1048576).toFixed(1)} م.ب`;
  const file = new File([scan.pdf], scanName(), { type: 'application/pdf' });
  const canShare = navigator.canShare && navigator.canShare({ files: [file] });
  $('scanOut').innerHTML = `<div class="sm-card scan-done"><b>${ic('check')} الملف جاهز: ${scan.pages.length} ${scan.pages.length > 2 && scan.pages.length < 11 ? 'صفحات' : 'صفحة'} (${mb})</b>
    ${canShare ? `<button type="button" class="blue-btn wide" data-act="scan-share">${ic('send')} أرسله إلى Claude</button>` : ''}
    <div class="row2"><button type="button" class="ghost-btn" data-act="scan-save">${ic('down')} احفظ الملف</button><button type="button" class="ghost-btn" data-act="scan-copy">${ic('clipboard')} انسخ طلب التصحيح</button></div>
    <p class="hint">${canShare ? 'اختر تطبيق Claude من قائمة المشاركة، ثم الصق طلب التصحيح إن لم يظهر معه.' : 'احفظ الملف، ثم ارفعه في Claude والصق طلب التصحيح.'}</p></div>`;
};
Acts['scan-share'] = async () => {
  const file = new File([scan.pdf], scanName(), { type: 'application/pdf' });
  const text = scanPrompt();
  try { await navigator.clipboard.writeText(text); } catch { /* fine */ }
  try { await navigator.share({ files: [file], text, title: 'تصحيح الاختبار' }); } catch (e) { if (e && e.name !== 'AbortError') toast('تعذّرت المشاركة؛ احفظ الملف'); }
};
Acts['scan-save'] = () => download(scan.pdf, scanName());
Acts['scan-copy'] = async () => { try { await navigator.clipboard.writeText(scanPrompt()); toast('نُسخ طلب التصحيح'); } catch { toast('تعذّر النسخ'); } };
