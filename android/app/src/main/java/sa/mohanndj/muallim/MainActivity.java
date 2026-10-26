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
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.Toast;

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
    s.setSupportMultipleWindows(false);
    s.setUserAgentString(s.getUserAgentString().replace("; wv", "").replace("Version/4.0 ", ""));
    CookieManager.getInstance().setAcceptCookie(true);
    CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);
    web.setWebChromeClient(new WebChromeClient());
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

  String download() {
    try {
      HttpURLConnection c = (HttpURLConnection) new URL(FILLER + "?t=" + System.currentTimeMillis()).openConnection();
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
