'use strict';
// التعبئة في منصة مدرستي: «إشارة مرجعية» في كروم (زر محفوظ يُستدعى بكتابة اسمه في شريط العنوان)
// تعمل داخل صفحة «إعداد الدرس» في المنصة وحساب المعلم نفسه (ما تفعله هناك في mdpage.js).
// هنا: نسخ تحضير الدرس للتعبئة، وشرح تجهيز الإشارة مرة واحدة.

const MD_MARK = 'مساعد المعلم|تحضير';
// الإشارة المرجعية تحمّل أحدث نسخة من mdpage.js من موقع التطبيق (فلا يحتاج إعادة تجهيزها بعد كل تحسين)،
// وإن منعت المنصة التحميل عملت النسخة المحفوظة في الإشارة نفسها.
const MD_URL = 'https://mohanndj.github.io/muallim/mdpage.js';
const mdBookmark = () => `javascript:${encodeURIComponent(`(function(){var s=document.createElement('script');s.src='${MD_URL}?'+Date.now();s.onerror=function(){(${window.mdFillSrc})()};document.head.appendChild(s)})()`)}`;

// ---- في التطبيق: نسخ التحضير للتعبئة، وتجهيز الزر مرة واحدة ----
// منصة مدرستي تُفتح في تطبيق كروم نفسه (لا في نافذة التطبيق المصغرة) حتى يعمل فيها زر «تعبئة»
const MD_SITE = 'schools.madrasati.sa';
// بلا «رابط بديل» ولا نافذة جديدة: متصفح سامسونج كان يفتح الرابط البديل في نفسه بدل كروم
const MD_ANDROID = /Android/i.test(navigator.userAgent);
// في أندرويد: تطبيق «تحضير مدرستي» (android/) يفتح المنصة داخله ومعه تحضير الدرس؛ وإن لم يكن مثبّتاً نُزّل
// نسخة من ملف التطبيق على موقع «مساعد المعلم» نفسه: تُنزَّل كما تُنزَّل النسخة الاحتياطية
// (الروابط الخارجية تفتح في متصفح مصغّر لا يحفظ الملف). تُحدَّث يدوياً من الإصدار «app» إن أُعيد بناء التطبيق.
const MD_APK = 'https://mohanndj.github.io/muallim/muallim-madrasati.apk';
Acts['md-apk'] = async (el) => {
  el.disabled = true;
  try {
    const r = await fetch(`muallim-madrasati.apk?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    download(new Blob([await r.arrayBuffer()], { type: 'application/vnd.android.package-archive' }), 'muallim-madrasati.apk');
    toast('نزل التطبيق: افتحه من الإشعار وثبّته');
  } catch { toast('تعذّر التنزيل، تأكد من الإنترنت'); }
  el.disabled = false;
};
const mdIntent = (l) => `intent://fill#Intent;scheme=muallimfill;package=sa.mohanndj.muallim;${l ? `S.lesson=${encodeURIComponent(JSON.stringify({ t: l.title, f: l.f || {} }))};` : ''}S.browser_fallback_url=${encodeURIComponent(MD_APK)};end`;
const MD_OPEN = () => (MD_ANDROID ? mdIntent(null) : `https://${MD_SITE}/`);
const mdLink = (cls, label) => `<a class="${cls}" href="${MD_OPEN()}"${MD_ANDROID ? '' : ' target="_blank" rel="noopener"'}>${ic('school')} ${label}</a>`;
// التطبيق يعمل داخل متصفح سامسونج: كروم هو الذي فيه زر «تعبئة»
const MD_SAMSUNG = /SamsungBrowser/i.test(navigator.userAgent);
const mdSamsungHint = () => `<details class="md-hint"${MD_SAMSUNG ? ' open' : ''}><summary>تُفتح في متصفح سامسونج بدل كروم؟</summary>
  <ol class="md-steps"><li>افتح <b>الإعدادات</b> في الجوال، ثم <b>التطبيقات</b>، ثم <b>اختيار التطبيقات الافتراضية</b>، ثم <b>تطبيق المتصفح</b>، واختر <b>Chrome</b>.</li>
  <li>وأفضل من ذلك: افتح رابط «مساعد المعلم» في كروم (mohanndj.github.io/muallim)، ومن النقاط الثلاث ⋮ اختر «إضافة إلى الشاشة الرئيسية»، واستعمل هذه الأيقونة بدل القديمة. بياناتك تنتقل بـ«الإعدادات ← احفظ نسخة» ثم «استرجع نسخة» في الجديدة.</li></ol></details>`;
Acts['md-fill'] = async () => {
  if (MD_ANDROID) { location.href = mdIntent(lesOf(UI.les)); return; }
  // في غير أندرويد: إشارة مرجعية تُجهَّز أولاً (نسخها يستبدل ما في الحافظة)، ثم يُنسخ التحضير
  if (!T.mdReady) { Acts['md-setup'](); return; }
  const l = lesOf(UI.les);
  try { await navigator.clipboard.writeText(`${MD_MARK}${JSON.stringify({ t: l.title, f: l.f || {} })}`); } catch { toast('تعذّر النسخ'); return; }
  openSheet(`<h3>${ic('check')} نُسخ تحضير «${esc(l.title)}»</h3>
    ${mdLink('wa-btn wide md-open', 'افتح منصة مدرستي في كروم')}
    ${mdSamsungHint()}
    <ol class="md-steps"><li>في مدرستي: افتح الجدول الدراسي، ثم الحصة، ثم «إعداد الدرس».</li><li>اضغط شريط العنوان أعلى الصفحة، واكتب: <b>تعبئة</b></li><li>اختر من القائمة «تعبئة» (عليها علامة النجمة): يضغط «التالي»، ويؤشّر الأهداف والمحتوى الرقمي والاستراتيجيات والوسائل، ويكتب مهارات التفكير وإغلاق الدرس وتعليمات المعلم.</li><li>أضف واجباً أو نشاطاً (المنصة تشترطه)، وراجع، ثم «حفظ وإنهاء».</li></ol>
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
