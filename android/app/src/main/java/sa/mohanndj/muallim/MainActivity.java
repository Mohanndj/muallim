package sa.mohanndj.muallim;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.os.Message;
import android.webkit.WebResourceError;
import android.webkit.WebResourceResponse;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import android.webkit.JavascriptInterface;
import android.content.ClipData;
import android.content.ClipboardManager;
import java.util.ArrayList;
import java.util.Collections;
import android.os.Build;
import android.webkit.ConsoleMessage;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

// منصة مدرستي داخل التطبيق (يسجل المعلم دخوله مرة واحدة فتبقى)، وزر عائم «عبّئ التحضير»
// يضع في صفحة «إعداد الدرس» تحضير الدرس الذي أرسله «مساعد المعلم» (mdpage.js من موقع التطبيق، أو نسخته المرفقة).
public class MainActivity extends Activity {
  static final String HOME = "https://schools.madrasati.sa/";
  static final String FILLER = "https://mohanndj.github.io/muallim/mdpage.js";
  WebView web;
  Button fill;
  ProgressBar bar;
  TextView msg;
  // «التعلّم»: وصف صفحات المنصة وما يُضغط فيها (mdlearn.js)، يُنسخ بالضغط المطوّل على الزر
  static final String LEARN = "https://mohanndj.github.io/muallim/mdlearn.js";
  final ArrayList<String> rec = new ArrayList<>();
  String learnJs;
  String lastErr;

  // ما يحدث في التطبيق نفسه (فتح الصفحات وأخطاؤها) يدخل في التقرير كذلك
  void note(String t, String v) {
    String u = v == null ? "" : v;
    if (u.length() > 300) u = u.substring(0, 300);
    synchronized (rec) { rec.add("{\"t\":\"" + t + "\",\"v\":" + org.json.JSONObject.quote(u) + "}"); while (rec.size() > 300) rec.remove(0); }
  }

  class Rec {
    @JavascriptInterface
    public void log(String s) { synchronized (rec) { rec.add(s.length() > 6000 ? s.substring(0, 6000) : s); while (rec.size() > 300) rec.remove(0); } }
  }
  String lesson;
  SharedPreferences prefs;
  // طريقة فتح المنصة: ٠ متصفح التطبيق كما هو، ٢ طلبات الصفحات يجلبها التطبيق بنفسه (إن رفضت المنصة الأولى)
  int mode;
  String agent;

  @Override
  protected void onCreate(Bundle b) {
    super.onCreate(b);
    prefs = getSharedPreferences("muallim", MODE_PRIVATE);
    lesson = prefs.getString("lesson", null);
    FrameLayout root = new FrameLayout(this);
    web = new WebView(this);
    root.addView(web, new FrameLayout.LayoutParams(-1, -1));
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setLoadWithOverviewMode(true);
    s.setUseWideViewPort(true);
    // نوافذ الدخول (نفاذ وغيره) تُفتح في الصفحة نفسها
    s.setSupportMultipleWindows(true);
    s.setJavaScriptCanOpenWindowsAutomatically(true);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
    WebView.setWebContentsDebuggingEnabled(true);
    web.addJavascriptInterface(new Rec(), "MlmRec");
    new Thread(new Runnable() { public void run() { learnJs = get(LEARN); note("learn", learnJs == null ? "not loaded" : "loaded " + learnJs.length()); probe(); } }).start();
    web.setDownloadListener(new android.webkit.DownloadListener() {
      public void onDownloadStart(String url, String ua, String cd, String mime, long len) { note("download", url + " " + mime + " " + cd + " " + len); }
    });
    agent = s.getUserAgentString().replace("; wv", "").replace("Version/4.0 ", "");
    mode = prefs.getInt("mode", 0);
    // بعض المواقع الحكومية ترفض ما يأتي من داخل التطبيقات (رأس X-Requested-With باسم التطبيق): لا يُرسل
    if (WebViewFeature.isFeatureSupported(WebViewFeature.REQUESTED_WITH_HEADER_ALLOW_LIST)) WebSettingsCompat.setRequestedWithHeaderOriginAllowList(s, Collections.<String>emptySet());
    CookieManager.getInstance().setAcceptCookie(true);
    CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);
    // شريط تحميل أعلى الصفحة، وسطر يبيّن الخطأ إن لم تفتح الصفحة (كانت تبقى بيضاء بلا تفسير)
    bar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
    bar.setMax(100);
    root.addView(bar, new FrameLayout.LayoutParams(-1, 12, Gravity.TOP));
    msg = new TextView(this);
    msg.setBackgroundColor(Color.parseColor("#fff3cd"));
    msg.setTextColor(Color.parseColor("#5c4400"));
    msg.setPadding(30, 24, 30, 24);
    msg.setTextSize(14);
    msg.setVisibility(View.GONE);
    root.addView(msg, new FrameLayout.LayoutParams(-1, -2, Gravity.TOP));
    msg.setOnClickListener(new View.OnClickListener() { public void onClick(View v) { msg.setVisibility(View.GONE); web.reload(); } });
    web.setWebChromeClient(new WebChromeClient() {
      @Override
      public boolean onConsoleMessage(ConsoleMessage c) {
        if (c.messageLevel() == ConsoleMessage.MessageLevel.ERROR) { note("console", c.message() + " @" + c.sourceId() + ":" + c.lineNumber()); lastErr = c.message(); }
        return false;
      }
      @Override
      public void onProgressChanged(WebView v, int p) { bar.setProgress(p); bar.setVisibility(p < 100 ? View.VISIBLE : View.GONE); }
      @Override
      public boolean onCreateWindow(WebView v, boolean dialog, boolean user, Message m) {
        WebView pop = new WebView(MainActivity.this);
        pop.setWebViewClient(new WebViewClient() {
          @Override
          public boolean shouldOverrideUrlLoading(WebView p, WebResourceRequest r) { web.loadUrl(r.getUrl().toString()); return true; }
          @Override
          public void onPageStarted(WebView p, String url, android.graphics.Bitmap f) { if (url != null && url.startsWith("http")) { web.loadUrl(url); p.stopLoading(); } }
        });
        ((WebView.WebViewTransport) m.obj).setWebView(pop);
        m.sendToTarget();
        return true;
      }
    });
    web.setWebViewClient(new WebViewClient() {
      @Override
      public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
        Uri u = r.getUrl();
        String sc = u.getScheme();
        note("nav", u + (r.isRedirect() ? " redirect" : "") + (r.hasGesture() ? " tap" : "") + (r.isForMainFrame() ? " main" : ""));
        if ("http".equals(sc) || "https".equals(sc)) return false;
        // توجيه إلى تطبيق (مثل «افتح في تطبيق مدرستي»): إن كان له رابط ويب يُفتح هنا بدل الصفحة البيضاء
        if ("intent".equals(sc)) {
          try {
            Intent it = Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME);
            String fb = it.getStringExtra("browser_fallback_url");
            Uri d = it.getData();
            if (d != null && ("https".equals(d.getScheme()) || "http".equals(d.getScheme()))) { v.loadUrl(d.toString()); return true; }
            if (fb != null && fb.startsWith("http") && !r.hasGesture()) { v.loadUrl(fb); return true; }
            if (r.hasGesture()) startActivity(it);
          } catch (Exception e) { note("intent-fail", e.toString()); }
          return true;
        }
        // روابط تطبيقات أخرى (مثل نفاذ أو واتساب) تُفتح في تطبيقاتها إن ضغطها المعلم
        if (r.hasGesture() || !r.isRedirect()) { try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { note("open-fail", u.toString()); } }
        return true;
      }
      @Override
      public void onPageStarted(WebView v, String url, android.graphics.Bitmap f) { note("start", url); }
      @Override
      public void onPageCommitVisible(WebView v, String url) { note("visible", url); }
      @Override
      public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) { return mode == 2 ? fetch(r) : null; }
      @Override
      public boolean onRenderProcessGone(WebView v, android.webkit.RenderProcessGoneDetail d) { note("render-gone", String.valueOf(d.didCrash())); return true; }
      @Override
      public void onPageFinished(WebView v, String url) {
        note("finish", url);
        // المنصة لم تُفتح أصلاً (لا عنوان للصفحة): تُجرَّب الطريقة الأخرى وحدها
        if (v.getUrl() == null && url != null && url.contains("madrasati")) {
          if (mode == 0) { mode = 2; prefs.edit().putInt("mode", 2).apply(); note("mode", "2"); v.loadUrl(url); return; }
          show("منصة مدرستي لم تفتح داخل التطبيق. اضغط هنا لإعادة المحاولة، أو اضغط مطوّلاً على الزر الأخضر وأرسل التقرير");
        }
        if (learnJs != null) v.evaluateJavascript(learnJs, null);
        // صفحة بيضاء بعد التحميل: يُقال ذلك بدل السكوت
        v.evaluateJavascript("(document.body&&document.body.innerText||'').trim().length", new android.webkit.ValueCallback<String>() {
          public void onReceiveValue(String n) { note("textlen", n); if ("0".equals(n)) show("الصفحة فارغة: " + url + (lastErr != null ? "\nخطأ: " + lastErr : "") + "\nاضغط هنا لإعادة التحميل، أو اضغط مطوّلاً على الزر الأخضر وأرسل التقرير"); }
        });
      }
      @Override
      public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
        note("error", r.getUrl() + " " + e.getErrorCode() + " " + e.getDescription());
        if (r.isForMainFrame()) show("لم تفتح الصفحة (" + e.getDescription() + "): " + r.getUrl() + "\nاضغط هنا لإعادة المحاولة");
      }
      @Override
      public void onReceivedHttpError(WebView v, WebResourceRequest r, WebResourceResponse e) {
        note("http", r.getUrl() + " " + e.getStatusCode());
        if (r.isForMainFrame()) show("ردّ الموقع بخطأ " + e.getStatusCode() + ": " + r.getUrl() + "\nاضغط هنا لإعادة المحاولة");
      }
    });

    fill = new Button(this);
    fill.setText("عبّئ التحضير");
    fill.setTextColor(Color.WHITE);
    fill.setTextSize(16);
    fill.setAllCaps(false);
    GradientDrawable bg = new GradientDrawable();
    bg.setColor(Color.parseColor("#1a8f5c"));
    bg.setCornerRadius(60);
    fill.setBackground(bg);
    fill.setElevation(12);
    fill.setPadding(48, 20, 48, 20);
    FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(-2, -2, Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL);
    lp.bottomMargin = 40;
    root.addView(fill, lp);
    fill.setOnClickListener(new View.OnClickListener() { public void onClick(View v) { runFill(); } });
    fill.setOnLongClickListener(new View.OnLongClickListener() { public boolean onLongClick(View v) { copyReport(); return true; } });
    setContentView(root);

    if (b != null) web.restoreState(b);
    handle(getIntent(), b == null);
  }

  @Override
  protected void onNewIntent(Intent i) { super.onNewIntent(i); setIntent(i); handle(i, false); }

  // التحضير القادم من «مساعد المعلم»
  void handle(Intent i, boolean first) {
    String l = i != null ? i.getStringExtra("lesson") : null;
    if (l != null && l.length() > 2) {
      lesson = l;
      prefs.edit().putString("lesson", l).apply();
      String t = "";
      try { t = new org.json.JSONObject(l).optString("t"); } catch (Exception e) { /* بلا عنوان */ }
      Toast.makeText(this, "وصل تحضير «" + t + "». افتح إعداد الدرس واضغط «عبّئ التحضير»", Toast.LENGTH_LONG).show();
    }
    if (first || web.getUrl() == null) web.loadUrl(HOME);
  }

  // الطريقة الثانية: صفحات المنصة (طلبات GET) يجلبها التطبيق بنفسه بلا علامات «المتصفح الداخلي»،
  // مع الكوكيز نفسها، والتحويل إلى صفحة أخرى يصير تحويلاً داخل الصفحة
  WebResourceResponse fetch(WebResourceRequest r) {
    try {
      Uri u = r.getUrl();
      String host = u.getHost();
      if (!"GET".equalsIgnoreCase(r.getMethod()) || host == null || !(host.equals("madrasati.sa") || host.endsWith(".madrasati.sa"))) return null;
      String url = u.toString();
      CookieManager cm = CookieManager.getInstance();
      for (int hop = 0; hop < 6; hop++) {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setInstanceFollowRedirects(false);
        c.setConnectTimeout(15000);
        c.setReadTimeout(30000);
        for (java.util.Map.Entry<String, String> e : r.getRequestHeaders().entrySet()) {
          String k = e.getKey().toLowerCase();
          if (k.equals("x-requested-with") || k.equals("accept-encoding") || k.startsWith("sec-ch-ua") || k.equals("cookie")) continue;
          c.setRequestProperty(e.getKey(), e.getValue());
        }
        c.setRequestProperty("User-Agent", agent);
        String ck = cm.getCookie(url);
        if (ck != null) c.setRequestProperty("Cookie", ck);
        int code = c.getResponseCode();
        java.util.List<String> sc = c.getHeaderFields().get("Set-Cookie");
        if (sc != null) for (String x : sc) cm.setCookie(url, x);
        if (code >= 300 && code < 400 && c.getHeaderField("Location") != null) {
          String to = new URL(new URL(url), c.getHeaderField("Location")).toString();
          if (r.isForMainFrame()) {
            String html = "<!doctype html><script>location.replace(" + org.json.JSONObject.quote(to) + ")</script>";
            return new WebResourceResponse("text/html", "utf-8", new java.io.ByteArrayInputStream(html.getBytes("UTF-8")));
          }
          url = to;
          continue;
        }
        String ct = c.getContentType();
        String mime = ct == null ? "application/octet-stream" : ct.split(";")[0].trim();
        String cs = ct != null && ct.toLowerCase().contains("charset=") ? ct.substring(ct.toLowerCase().indexOf("charset=") + 8).trim() : null;
        java.util.Map<String, String> hs = new java.util.HashMap<>();
        for (java.util.Map.Entry<String, java.util.List<String>> e : c.getHeaderFields().entrySet()) {
          if (e.getKey() == null || e.getValue().isEmpty()) continue;
          String k = e.getKey().toLowerCase();
          if (k.equals("content-encoding") || k.equals("content-length") || k.equals("transfer-encoding") || k.equals("set-cookie")) continue;
          hs.put(e.getKey(), android.text.TextUtils.join(", ", e.getValue()));
        }
        InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
        if (in == null) in = new java.io.ByteArrayInputStream(new byte[0]);
        String why = c.getResponseMessage();
        if (r.isForMainFrame()) note("fetch", code + " " + url);
        return new WebResourceResponse(mime, cs, code, why == null || why.isEmpty() ? "OK" : why, hs, in);
      }
    } catch (Exception e) { note("fetch-fail", r.getUrl() + " " + e); }
    return null;
  }

  // ماذا يردّ موقع مدرستي على طلب عادي من التطبيق (بلا المتصفح الداخلي): الحالة والتحويل ونوع المحتوى وبدايته
  void probe() {
    try {
      HttpURLConnection c = (HttpURLConnection) new URL(HOME).openConnection();
      c.setInstanceFollowRedirects(false);
      c.setConnectTimeout(8000);
      c.setReadTimeout(8000);
      c.setRequestProperty("User-Agent", web.getSettings().getUserAgentString());
      int code = c.getResponseCode();
      StringBuilder h = new StringBuilder("status " + code);
      for (String k : new String[] { "Location", "Content-Type", "Content-Length", "Server", "Content-Security-Policy", "X-Frame-Options" }) { String v = c.getHeaderField(k); if (v != null) h.append(" | ").append(k).append(": ").append(v.length() > 200 ? v.substring(0, 200) : v); }
      note("probe", h.toString());
      InputStream in = code < 400 ? c.getInputStream() : c.getErrorStream();
      if (in != null) { String body = read(in); note("body", body.length() + " " + body.replaceAll("\\s+", " ").substring(0, Math.min(600, body.length()))); }
    } catch (Exception e) { note("probe-fail", e.toString()); }
  }

  @Override
  public void onTrimMemory(int l) { super.onTrimMemory(l); }

  void copyReport() {
    StringBuilder sb = new StringBuilder("تقرير تطبيق تحضير مدرستي\n");
    sb.append("app ").append(BuildConfig.VERSION_NAME).append(" | android ").append(Build.VERSION.RELEASE).append(" | ").append(web.getSettings().getUserAgentString()).append('\n');
    if (Build.VERSION.SDK_INT >= 26 && WebView.getCurrentWebViewPackage() != null) sb.append("webview ").append(WebView.getCurrentWebViewPackage().packageName).append(' ').append(WebView.getCurrentWebViewPackage().versionName).append('\n');
    sb.append("url ").append(web.getUrl()).append('\n');
    synchronized (rec) { for (String s : rec) sb.append(s).append('\n'); }
    if (rec.isEmpty()) sb.append("لا شيء بعد. الرابط: ").append(web.getUrl());
    ((ClipboardManager) getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("report", sb.toString()));
    Toast.makeText(this, "نُسخ التقرير (" + rec.size() + "). الصقه في المحادثة", Toast.LENGTH_LONG).show();
  }

  void show(String t) { msg.setText(t); msg.setVisibility(View.VISIBLE); }

  void runFill() {
    if (lesson == null) { Toast.makeText(this, "افتح الدرس في «مساعد المعلم» واضغط «عبّئ في مدرستي»", Toast.LENGTH_LONG).show(); return; }
    fill.setEnabled(false);
    new Thread(new Runnable() { public void run() {
      String code = download();
      if (code == null) code = asset();
      final String js = "window.__mlmData=" + lesson + ";" + (code == null ? "" : code);
      runOnUiThread(new Runnable() { public void run() { fill.setEnabled(true); web.evaluateJavascript(js, null); } });
    } }).start();
  }

  String download() { return get(FILLER); }

  String get(String url) {
    try {
      HttpURLConnection c = (HttpURLConnection) new URL(url + "?t=" + System.currentTimeMillis()).openConnection();
      c.setConnectTimeout(6000);
      c.setReadTimeout(6000);
      if (c.getResponseCode() != 200) return null;
      return read(c.getInputStream());
    } catch (Exception e) { return null; }
  }

  String asset() { try { return read(getAssets().open("mdpage.js")); } catch (Exception e) { return null; } }

  static String read(InputStream in) throws java.io.IOException {
    ByteArrayOutputStream o = new ByteArrayOutputStream();
    byte[] buf = new byte[8192];
    int n;
    while ((n = in.read(buf)) > 0) o.write(buf, 0, n);
    in.close();
    return o.toString("UTF-8");
  }

  @Override
  protected void onSaveInstanceState(Bundle b) { super.onSaveInstanceState(b); web.saveState(b); }

  @Override
  protected void onPause() { super.onPause(); CookieManager.getInstance().flush(); }

  @Override
  public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
}
