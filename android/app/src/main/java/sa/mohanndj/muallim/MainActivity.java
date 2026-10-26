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
    new Thread(new Runnable() { public void run() { learnJs = get(LEARN); } }).start();
    s.setUserAgentString(s.getUserAgentString().replace("; wv", "").replace("Version/4.0 ", ""));
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
        if ("http".equals(sc) || "https".equals(sc)) return false;
        // روابط تطبيقات أخرى (مثل نفاذ أو واتساب) تُفتح في تطبيقاتها
        try { startActivity(Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME)); } catch (Exception e) { /* لا تطبيق لها */ }
        return true;
      }
      @Override
      public void onPageStarted(WebView v, String url, android.graphics.Bitmap f) { note("start", url); }
      @Override
      public void onPageFinished(WebView v, String url) {
        note("finish", url);
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
