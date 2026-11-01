'use strict';
// المزامنة بين أجهزة المعلم (الإصدار ٢٠): البيانات في ملف سرّي (Secret Gist) داخل حسابه على GitHub،
// مثل مزامنة «الوعي الشخصي». دمج ثلاثي (آخر نسخة مُزامَنة، هذا الجهاز، السحابة): التعديلات في الجهازين تُجمع
// عنصراً عنصراً ومفتاحاً مفتاحاً، وإن تعارض التعديل نفسه غلب هذا الجهاز. صور «ملف الإنجاز» تبقى على جهازها.

const Sync = (() => {
  const KEY = 'muallim-sync';
  const FILE = 'muallim.json';
  const DESC = 'Muallim app data — بيانات مساعد المعلم (لا تعدّل هذا الملف يدوياً)';
  const API = 'https://api.github.com';
  let cfg = read();
  let busy = false, timer = null, applying = false, lastError = '';

  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
  function store() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch { /* fine */ } }
  // الموقع نفسه يحمل «الوعي الشخصي»: إن رُبطت مزامنته على هذا الجهاز فرمزه صالح هنا أيضاً
  const mahamiToken = () => { try { return (JSON.parse(localStorage.getItem('mahami-sync')) || {}).token || ''; } catch { return ''; } };

  async function gh(path, opts = {}) {
    const res = await fetch(API + path, {
      ...opts, cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', Authorization: `Bearer ${cfg.token}`, ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
    });
    if (res.status === 401) throw new Error('auth');
    if (res.status === 403 || res.status === 429) throw new Error(res.headers.get('x-ratelimit-remaining') === '0' ? 'ratelimit' : 'forbidden');
    if (res.status === 404) throw new Error('notfound');
    if (!res.ok) throw new Error(`http${res.status}`);
    return res.status === 204 ? null : res.json();
  }

  // ---- الدمج ----
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const idList = (a) => Array.isArray(a) && a.length > 0 && a.every((x) => isObj(x) && x.id);
  const snapshot = () => { const { mdReady, ...rest } = T; return JSON.parse(JSON.stringify(rest)); };
  function merge3(b, l, r) {
    if (same(l, b)) return r;
    if (same(r, b)) return l;
    if (isObj(l) && isObj(r)) {
      const B = isObj(b) ? b : {}, out = {};
      for (const k of new Set([...Object.keys(l), ...Object.keys(r)])) {
        let v;
        if (k in l && k in r) v = merge3(B[k], l[k], r[k]);
        else if (k in l) v = k in B && same(l[k], B[k]) ? undefined : l[k]; // حُذف هناك ولم يتغير هنا
        else v = k in B && same(r[k], B[k]) ? undefined : r[k];
        if (v !== undefined) out[k] = v;
      }
      return out;
    }
    if ((idList(l) || idList(r)) && Array.isArray(l) && Array.isArray(r)) return mergeList(Array.isArray(b) ? b : [], l, r);
    return l;
  }
  function mergeList(base, local, remote, noBase = false) {
    const B = new Map(base.map((x) => [x.id, x])), L = new Map(local.map((x) => [x.id, x])), R = new Map(remote.map((x) => [x.id, x]));
    const out = [];
    for (const id of new Set([...L.keys(), ...R.keys(), ...B.keys()])) {
      const b = B.get(id), l = L.get(id), r = R.get(id);
      if (l && r) out.push(noBase ? mergeFirst(l, r) : merge3(b, l, r));
      else if (l && !r) { if (noBase || !b || !same(l, b)) out.push(l); }
      else if (!l && r) { if (noBase || !b || !same(r, b)) out.push(r); }
    }
    const order = new Map(local.map((x, i) => [x.id, i]));
    return out.sort((x, y) => (order.get(x.id) ?? 1e9) - (order.get(y.id) ?? 1e9));
  }
  // أول ربط لجهاز فيه بيانات: يُجمع ما في الجهازين، وما تعارض تغلب فيه نسخة السحابة
  function mergeFirst(l, r) {
    if (isObj(l) && isObj(r)) { const out = { ...l }; for (const k of Object.keys(r)) out[k] = k in l ? mergeFirst(l[k], r[k]) : r[k]; return out; }
    if ((idList(l) || idList(r)) && Array.isArray(l) && Array.isArray(r)) return mergeList([], l, r, true);
    return r === undefined ? l : r;
  }
  const merge = (base, local, remote) => (base ? merge3(base, local, remote) : mergeFirst(local, remote));
  function apply(data) {
    applying = true;
    // نسخة مستقلة: بيانات الجهاز لا تشارك «آخر نسخة مُزامَنة» شيئاً، فلا يغيّرها التعديل
    try { const md = T.mdReady; T = normalize(JSON.parse(JSON.stringify(data))); if (md) T.mdReady = md; save(); } finally { applying = false; }
  }

  // ---- الملف في GitHub ----
  // المحتوى ورقم نسخته (يتغير مع كل كتابة من أي جهاز)
  async function readGist() {
    const g = await gh(`/gists/${cfg.gistId}`);
    const ver = (g.history && g.history[0] && g.history[0].version) || g.updated_at || '';
    const f = g.files && g.files[FILE];
    if (!f) return { data: null, ver };
    let text = f.content;
    if (f.truncated) text = await (await fetch(f.raw_url, { cache: 'no-store' })).text();
    return { data: text ? JSON.parse(text) : null, ver };
  }
  const gistVer = async () => { const g = await gh(`/gists/${cfg.gistId}`); return (g.history && g.history[0] && g.history[0].version) || g.updated_at || ''; };
  const readVer = async (ver) => { const g = await gh(`/gists/${cfg.gistId}/${ver}`); const f = g.files && g.files[FILE]; let t = f && f.content; if (f && f.truncated) t = await (await fetch(f.raw_url, { cache: 'no-store' })).text(); return t ? JSON.parse(t) : null; };
  const writeGist = (data) => gh(`/gists/${cfg.gistId}`, { method: 'PATCH', body: JSON.stringify({ files: { [FILE]: { content: JSON.stringify(data) } } }) });
  async function findOrCreateGist() {
    for (let page = 1; page <= 5; page++) {
      const list = await gh(`/gists?per_page=100&page=${page}`);
      const hit = list.find((g) => g.files && g.files[FILE] && g.description === DESC);
      if (hit) return { id: hit.id, created: false };
      if (list.length < 100) break;
    }
    const g = await gh('/gists', { method: 'POST', body: JSON.stringify({ description: DESC, public: false, files: { [FILE]: { content: JSON.stringify(snapshot()) } } }) });
    return { id: g.id, created: true };
  }

  async function connect(token) {
    cfg = { token: token.trim(), auto: true };
    const user = await gh('/user');
    const { id, created } = await findOrCreateGist();
    Object.assign(cfg, { gistId: id, login: user.login });
    store();
    if (created) { cfg.base = snapshot(); cfg.lastSync = Date.now(); store(); return 'created'; }
    await syncNow();
    return 'joined';
  }
  function disconnect() { cfg = {}; try { localStorage.removeItem(KEY); } catch { /* fine */ } }

  async function syncNow() {
    if (!cfg.token || !cfg.gistId || busy) return false;
    if (!navigator.onLine) { lastError = 'offline'; status(); return false; }
    busy = true; status();
    try {
      // إن كتب جهاز آخر بين القراءة والكتابة يُعاد الدمج على نسخته، حتى لا تضيع تعديلاته
      let merged, remote;
      for (let i = 0; i < 4; i++) {
        const got = await readGist();
        remote = got.data;
        merged = remote ? merge(cfg.base, snapshot(), remote) : snapshot();
        if (remote && same(merged, remote)) break;
        if ((await gistVer()) !== got.ver) continue;
        const res = await writeGist(merged);
        // كتب جهاز آخر بين فحصنا وكتابتنا: نسخته قبل نسختنا مباشرة، فتُدمج معنا ونكتب مرة أخرى
        const h = (res && res.history) || [];
        if (h[1] && got.ver && h[1].version !== got.ver) {
          const theirs = await readVer(h[1].version);
          if (theirs) { merged = merge3(remote, merged, theirs); await writeGist(merged); }
        }
        break;
      }
      if (!same(merged, snapshot())) { apply(merged); render(); }
      cfg.base = JSON.parse(JSON.stringify(merged)); cfg.lastSync = Date.now(); lastError = '';
      store();
      return true;
    } catch (e) {
      lastError = e.message || 'error';
      if (lastError === 'auth') toast('رمز GitHub لم يعد صالحاً. أعد الربط من الإعدادات.');
      return false;
    } finally { busy = false; status(); }
  }
  // بعد كل حفظ على هذا الجهاز
  function schedule() {
    if (applying || !cfg.token || !cfg.gistId || cfg.auto === false) return;
    clearTimeout(timer);
    timer = setTimeout(syncNow, 3000);
  }
  function statusText() {
    if (!cfg.token) return 'غير مربوطة';
    if (busy) return 'جارٍ المزامنة…';
    const msgs = { offline: 'لا يوجد اتصال بالإنترنت', auth: 'الرمز غير صالح، أعد الربط', ratelimit: 'تجاوزت حد GitHub مؤقتاً، حاول بعد قليل', forbidden: 'الرمز لا يملك صلاحية gist', notfound: 'لم يُعثر على ملف المزامنة، أعد الربط' };
    if (lastError) return msgs[lastError] || 'تعذّرت المزامنة، سنحاول لاحقاً';
    if (cfg.lastSync) { const d = new Date(cfg.lastSync); return `آخر مزامنة: ${dateLabel(iso(d))} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
    return 'مربوطة';
  }
  function status() { const el = $('syncStatus'); if (el) el.textContent = statusText(); }

  function settingsHTML() {
    if (!cfg.token) {
      const mt = mahamiToken();
      return `<div class="card" id="syncCard"><h3>${ic('arrows-rotate')} المزامنة بين أجهزتك</h3>
        <p class="hint">تُحفظ بياناتك في ملف سرّي داخل حسابك على GitHub، فتظهر في كل جهاز تربطه بالرمز نفسه، وتُدمج تعديلاتها وحدها.</p>
        ${mt ? `<button type="button" class="blue-btn wide" data-act="sync-mahami">${ic('arrows-rotate')} اربط بحسابك نفسه في «الوعي الشخصي»</button><p class="hint center">أو الصق رمزاً آخر:</p>` : ''}
        <details class="md-hint"><summary>كيف أحصل على الرمز؟</summary><ol class="md-steps">
          <li>افتح <a href="https://github.com/settings/tokens/new?scopes=gist&description=muallim" target="_blank" rel="noopener">صفحة إنشاء رمز في GitHub</a> وسجّل الدخول.</li>
          <li>في Expiration اختر No expiration، وتأكد أن خانة gist مختارة، ثم Generate token.</li>
          <li>انسخ الرمز الذي يبدأ بـ ghp_ والصقه هنا. وهو الرمز نفسه لكل أجهزتك.</li></ol></details>
        <label>رمز GitHub<input type="password" id="syncToken" autocomplete="off" placeholder="ghp_…" dir="ltr"></label>
        <button type="button" class="${mt ? 'ghost-btn' : 'blue-btn'} wide" data-act="sync-connect">ربط ومزامنة</button>
        <p class="hint">صور «ملف الإنجاز» لا تُزامَن، تبقى في الجهاز الذي أضفتها منه.</p></div>`;
    }
    return `<div class="card" id="syncCard"><h3>${ic('arrows-rotate')} المزامنة بين أجهزتك</h3>
      <p class="hint">مربوطة بحساب GitHub: <b dir="ltr">${esc(cfg.login || '')}</b></p>
      <p class="sync-st" id="syncStatus">${esc(statusText())}</p>
      <div class="row2"><button type="button" class="blue-btn" data-act="sync-now">${ic('arrows-rotate')} زامن الآن</button><button type="button" class="red-btn" data-act="sync-off">إلغاء الربط</button></div>
      <p class="hint">في جهازك الآخر: افتح «مساعد المعلم» ثم الإعدادات، والصق الرمز نفسه، فتنتقل إليه كل بياناتك.</p></div>`;
  }

  async function link(token, btn) {
    if (!/^(ghp_|github_pat_|gho_)\w+/.test(token.trim())) { toast('الصق رمز GitHub الذي يبدأ بـ ghp_'); return; }
    btn.disabled = true; btn.textContent = 'جارٍ الربط…';
    try {
      const r = await connect(token);
      toast(r === 'created' ? 'رُبطت المزامنة وحُفظت بياناتك في حسابك' : 'رُبطت المزامنة ودُمجت بياناتك');
    } catch (err) {
      disconnect();
      toast(err.message === 'auth' ? 'الرمز غير صحيح. انسخه مرة أخرى.' : err.message === 'forbidden' ? 'الرمز لا يملك صلاحية gist. أنشئ رمزاً جديداً واختر gist.' : 'تعذّر الاتصال بـ GitHub. تحقق من الإنترنت وحاول مجدداً.');
    }
    render();
  }
  Acts['sync-mahami'] = (el) => link(mahamiToken(), el);
  Acts['sync-connect'] = (el) => link(($('syncToken') || {}).value || '', el);
  Acts['sync-now'] = async () => { const ok = await syncNow(); if (ok) toast('تمت المزامنة'); else if (lastError) toast(statusText()); };
  Acts['sync-off'] = (el) => { if (!armed(el)) return; disconnect(); render(); toast('أُلغي الربط. بياناتك ما زالت على هذا الجهاز وفي حسابك.'); };
  window.addEventListener('online', () => { lastError = ''; schedule(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && cfg.token) setTimeout(syncNow, 500); });

  return { schedule, syncNow, settingsHTML, connected: () => !!cfg.token, start: () => { if (cfg.token) setTimeout(syncNow, 1200); }, _merge: merge };
})();
