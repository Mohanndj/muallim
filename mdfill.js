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
const MD_OPEN = () => (/Android/i.test(navigator.userAgent) ? `intent://${MD_SITE}/#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(`https://${MD_SITE}/`)};end` : `https://${MD_SITE}/`);
Acts['md-fill'] = async () => {
  // الزر يُجهَّز أولاً (نسخه يستبدل ما في الحافظة)، ثم يُنسخ التحضير
  if (!T.mdReady) { Acts['md-setup'](); return; }
  const l = lesOf(UI.les);
  try { await navigator.clipboard.writeText(`${MD_MARK}${JSON.stringify({ t: l.title, f: l.f || {} })}`); } catch { toast('تعذّر النسخ'); return; }
  openSheet(`<h3>${ic('check')} نُسخ تحضير «${esc(l.title)}»</h3>
    <a class="wa-btn wide md-open" href="${MD_OPEN()}" target="_blank" rel="noopener">${ic('school')} افتح منصة مدرستي في كروم</a>
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
