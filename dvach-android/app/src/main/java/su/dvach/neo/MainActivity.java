package su.dvach.neo;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.Html;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.text.method.LinkMovementMethod;
import android.text.style.ClickableSpan;
import android.text.style.ForegroundColorSpan;
import android.text.style.URLSpan;
import android.util.LruCache;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.URLUtil;
import android.widget.AbsListView;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.MediaController;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.VideoView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MainActivity extends Activity {
    private static final String[] BASES = {"https://2ch.su", "https://2ch.org", "https://2ch.life"};
    private static final String USER_AGENT = "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36 DvachNeo/0.2";
    private static final int FILE_CHOOSER = 1001;
    private static final int STORAGE_PERMISSION = 1002;

    private static final int BG = Color.rgb(0, 0, 0);
    private static final int SURFACE = Color.rgb(17, 18, 20);
    private static final int SURFACE_2 = Color.rgb(27, 29, 32);
    private static final int TEXT = Color.rgb(238, 238, 238);
    private static final int MUTED = Color.rgb(158, 163, 170);
    private static final int ACCENT = Color.rgb(231, 115, 50);
    private static final int QUOTE = Color.rgb(102, 187, 106);

    private final ExecutorService executor = Executors.newFixedThreadPool(6);
    private final Handler main = new Handler(Looper.getMainLooper());
    private SharedPreferences prefs;
    private LruCache<String, Bitmap> bitmapCache;

    private FrameLayout root;
    private LinearLayout shell;
    private FrameLayout content;
    private ProgressBar progress;
    private Button backButton;
    private Button actionButton;
    private Button refreshButton;
    private TextView titleView;

    private Screen screen = Screen.BOARDS;
    private String currentBoard;
    private long currentThread;
    private String activeBase = BASES[0];
    private ListView currentList;
    private ArrayList<BoardItem> boards = new ArrayList<>();
    private ArrayList<ThreadItem> currentCatalog = new ArrayList<>();
    private ArrayList<PostItem> currentPosts = new ArrayList<>();
    private ArrayList<MediaItem> currentGallery = new ArrayList<>();
    private final Map<String, ArrayList<ThreadItem>> catalogCache = new HashMap<>();

    private FrameLayout mediaOverlay;
    private FrameLayout mediaStage;
    private TextView mediaCounter;
    private ArrayList<MediaItem> gallery = new ArrayList<>();
    private int galleryIndex;
    private VideoView currentVideo;

    private FrameLayout postingOverlay;
    private WebView postingWebView;
    private ValueCallback<Uri[]> fileCallback;

    private String pendingDownloadUrl;
    private String pendingDownloadAgent;
    private String pendingDownloadDisposition;
    private String pendingDownloadMime;

    private enum Screen { BOARDS, CATALOG, THREAD }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("dvach_neo", MODE_PRIVATE);
        activeBase = prefs.getString("active_base", BASES[0]);
        int maxMemoryKb = (int) (Runtime.getRuntime().maxMemory() / 1024L);
        bitmapCache = new LruCache<String, Bitmap>(Math.max(4096, maxMemoryKb / 8)) {
            @Override protected int sizeOf(String key, Bitmap value) { return value.getByteCount() / 1024; }
        };
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        buildShell();
        showBoards(false);
    }

    private void buildShell() {
        root = new FrameLayout(this);
        root.setBackgroundColor(BG);
        shell = new LinearLayout(this);
        shell.setOrientation(LinearLayout.VERTICAL);
        shell.setBackgroundColor(BG);

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(6), dp(5), dp(6), dp(5));
        bar.setBackgroundColor(Color.rgb(7, 7, 8));

        backButton = toolbarButton("‹");
        titleView = new TextView(this);
        titleView.setTextColor(TEXT);
        titleView.setTextSize(17);
        titleView.setSingleLine(true);
        titleView.setEllipsize(TextUtils.TruncateAt.END);
        titleView.setGravity(Gravity.CENTER_VERTICAL);
        titleView.setTypeface(null, android.graphics.Typeface.BOLD);
        titleView.setPadding(dp(8), 0, dp(8), 0);
        actionButton = toolbarButton("Ответить");
        refreshButton = toolbarButton("↻");

        bar.addView(backButton, new LinearLayout.LayoutParams(dp(46), dp(44)));
        bar.addView(titleView, new LinearLayout.LayoutParams(0, dp(44), 1));
        bar.addView(actionButton, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(44)));
        bar.addView(refreshButton, new LinearLayout.LayoutParams(dp(48), dp(44)));

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setIndeterminate(true);
        progress.setVisibility(View.GONE);

        content = new FrameLayout(this);
        content.setBackgroundColor(BG);
        shell.addView(bar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        shell.addView(progress, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(2)));
        shell.addView(content, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        root.addView(shell, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);

        backButton.setOnClickListener(v -> navigateBack());
        refreshButton.setOnClickListener(v -> refreshCurrent());
        actionButton.setOnClickListener(v -> {
            if (screen == Screen.CATALOG && currentBoard != null) openPosting(currentBoard, 0);
            else if (screen == Screen.THREAD && currentBoard != null) openPosting(currentBoard, currentThread);
        });
    }

    private Button toolbarButton(String text) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextColor(TEXT);
        b.setTextSize(14);
        b.setAllCaps(false);
        b.setBackgroundColor(Color.TRANSPARENT);
        b.setPadding(dp(8), 0, dp(8), 0);
        b.setMinWidth(0);
        b.setMinimumWidth(0);
        return b;
    }

    private void showBoards(boolean force) {
        rememberCurrentPosition();
        screen = Screen.BOARDS;
        currentBoard = null;
        currentThread = 0;
        titleView.setText("Двач Neo");
        backButton.setVisibility(View.INVISIBLE);
        actionButton.setVisibility(View.GONE);
        refreshButton.setVisibility(View.VISIBLE);
        if (!force && !boards.isEmpty()) {
            renderBoards(boards);
            return;
        }
        setLoading(true);
        executor.execute(() -> {
            try {
                String json = fetchJson("/makaba/mobile.fcgi?task=get_boards");
                ArrayList<BoardItem> parsed = parseBoards(json);
                if (parsed.isEmpty()) throw new Exception("Список досок пуст");
                main.post(() -> {
                    boards = parsed;
                    setLoading(false);
                    renderBoards(parsed);
                });
            } catch (Exception e) {
                main.post(() -> {
                    setLoading(false);
                    boards = fallbackBoards();
                    renderBoards(boards);
                    Toast.makeText(this, "API списка досок недоступен — показан резервный список", Toast.LENGTH_LONG).show();
                });
            }
        });
    }

    private void renderBoards(ArrayList<BoardItem> data) {
        content.removeAllViews();
        LinearLayout wrap = new LinearLayout(this);
        wrap.setOrientation(LinearLayout.VERTICAL);
        wrap.setPadding(dp(10), dp(8), dp(10), dp(6));

        EditText search = new EditText(this);
        search.setHint("Найти доску");
        search.setHintTextColor(MUTED);
        search.setTextColor(TEXT);
        search.setTextSize(16);
        search.setSingleLine(true);
        search.setPadding(dp(14), dp(8), dp(14), dp(8));
        search.setBackground(rounded(SURFACE, 14));
        wrap.addView(search, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(48)));

        ListView list = baseList();
        BoardAdapter adapter = new BoardAdapter(data);
        list.setAdapter(adapter);
        list.setOnItemClickListener((parent, view, position, id) -> {
            BoardItem item = adapter.getItem(position);
            if (item != null && !item.header && item.id != null) showCatalog(item.id, false);
        });
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1);
        lp.topMargin = dp(8);
        wrap.addView(list, lp);
        content.addView(wrap, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        currentList = list;

        search.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) { adapter.filter(s.toString()); }
            @Override public void afterTextChanged(Editable s) {}
        });
    }

    private void showCatalog(String board, boolean force) {
        rememberCurrentPosition();
        screen = Screen.CATALOG;
        currentBoard = board;
        currentThread = 0;
        titleView.setText("/" + board + "/");
        backButton.setVisibility(View.VISIBLE);
        actionButton.setText("＋ Тред");
        actionButton.setVisibility(View.VISIBLE);
        refreshButton.setVisibility(View.VISIBLE);

        ArrayList<ThreadItem> cached = catalogCache.get(board);
        if (!force && cached != null && !cached.isEmpty()) {
            currentCatalog = cached;
            renderCatalog(cached);
            return;
        }
        setLoading(true);
        showLoadingMessage("Загружаю каталог /" + board + "/…");
        executor.execute(() -> {
            try {
                String json = fetchJson("/" + board + "/catalog.json");
                ArrayList<ThreadItem> parsed = parseCatalog(json);
                if (parsed.isEmpty()) throw new Exception("Каталог пуст");
                main.post(() -> {
                    setLoading(false);
                    currentCatalog = parsed;
                    catalogCache.put(board, parsed);
                    renderCatalog(parsed);
                });
            } catch (Exception e) {
                main.post(() -> {
                    setLoading(false);
                    showError("Не удалось получить каталог /" + board + "/", () -> showCatalog(board, true), activeBase + "/" + board + "/catalog.html");
                });
            }
        });
    }

    private void renderCatalog(ArrayList<ThreadItem> data) {
        content.removeAllViews();
        ListView list = baseList();
        CatalogAdapter adapter = new CatalogAdapter(data);
        list.setAdapter(adapter);
        list.setOnItemClickListener((parent, view, position, id) -> {
            ThreadItem t = adapter.getItem(position);
            if (t != null) showThread(currentBoard, t.num, false);
        });
        content.addView(list, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        currentList = list;
        restorePosition("catalog_" + currentBoard, list);
    }

    private void showThread(String board, long thread, boolean force) {
        rememberCurrentPosition();
        screen = Screen.THREAD;
        currentBoard = board;
        currentThread = thread;
        titleView.setText("/" + board + "/  №" + thread);
        backButton.setVisibility(View.VISIBLE);
        actionButton.setText("Ответить");
        actionButton.setVisibility(View.VISIBLE);
        refreshButton.setVisibility(View.VISIBLE);
        setLoading(true);
        showLoadingMessage("Загружаю тред №" + thread + "…");
        executor.execute(() -> {
            try {
                String json = fetchJson("/" + board + "/res/" + thread + ".json");
                ArrayList<PostItem> parsed = parseThread(json);
                if (parsed.isEmpty()) throw new Exception("Нет постов");
                ArrayList<MediaItem> media = new ArrayList<>();
                for (PostItem p : parsed) media.addAll(p.files);
                main.post(() -> {
                    setLoading(false);
                    currentPosts = parsed;
                    currentGallery = media;
                    renderThread(parsed);
                });
            } catch (Exception e) {
                main.post(() -> {
                    setLoading(false);
                    showError("Не удалось загрузить тред №" + thread, () -> showThread(board, thread, true), activeBase + "/" + board + "/res/" + thread + ".html");
                });
            }
        });
    }

    private void renderThread(ArrayList<PostItem> posts) {
        content.removeAllViews();
        ListView list = baseList();
        PostAdapter adapter = new PostAdapter(posts);
        list.setAdapter(adapter);
        content.addView(list, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        currentList = list;
        restorePosition("thread_" + currentBoard + "_" + currentThread, list);
    }

    private void showLoadingMessage(String message) {
        content.removeAllViews();
        TextView t = new TextView(this);
        t.setText(message);
        t.setTextColor(MUTED);
        t.setTextSize(16);
        t.setGravity(Gravity.CENTER);
        content.addView(t, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        currentList = null;
    }

    private void showError(String message, Runnable retry, String webUrl) {
        content.removeAllViews();
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(dp(26), dp(26), dp(26), dp(26));
        TextView t = text(message, 17, TEXT);
        t.setGravity(Gravity.CENTER);
        Button again = actionChip("Повторить");
        Button web = actionChip("Открыть веб-версию");
        box.addView(t, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(48));
        p.topMargin = dp(16);
        box.addView(again, p);
        LinearLayout.LayoutParams p2 = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(48));
        p2.topMargin = dp(8);
        box.addView(web, p2);
        again.setOnClickListener(v -> retry.run());
        web.setOnClickListener(v -> openWeb(webUrl));
        content.addView(box, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        currentList = null;
    }

    private ListView baseList() {
        ListView list = new ListView(this);
        list.setBackgroundColor(BG);
        list.setDivider(null);
        list.setDividerHeight(0);
        list.setCacheColorHint(BG);
        list.setClipToPadding(false);
        list.setPadding(0, dp(4), 0, dp(14));
        return list;
    }

    private ArrayList<BoardItem> parseBoards(String json) throws Exception {
        JSONObject root = new JSONObject(json);
        JSONObject categories = root.optJSONObject("boards");
        if (categories == null) categories = root;
        ArrayList<String> keys = new ArrayList<>();
        Iterator<String> it = categories.keys();
        while (it.hasNext()) keys.add(it.next());
        Collections.sort(keys, String.CASE_INSENSITIVE_ORDER);
        ArrayList<BoardItem> result = new ArrayList<>();
        for (String category : keys) {
            JSONArray arr = categories.optJSONArray(category);
            if (arr == null || arr.length() == 0) continue;
            result.add(BoardItem.header(category));
            for (int i = 0; i < arr.length(); i++) {
                JSONObject b = arr.optJSONObject(i);
                if (b == null) continue;
                String id = str(b, "id");
                if (id.isEmpty()) continue;
                String name = str(b, "name");
                result.add(new BoardItem(id, name.isEmpty() ? "/" + id + "/" : name, category, false));
            }
        }
        return result;
    }

    private ArrayList<BoardItem> fallbackBoards() {
        ArrayList<BoardItem> r = new ArrayList<>();
        r.add(BoardItem.header("Популярные"));
        String[][] b = {{"b","Бред"},{"news","Новости"},{"vg","Video Games"},{"v","Игры"},{"mobi","Мобильные устройства"},{"hw","Железо"},{"t","Технологии"},{"mu","Музыка"},{"mov","Кино"},{"a","Аниме"},{"trv","Путешествия"},{"au","Автомобили"},{"diy","DIY"},{"sci","Наука"}};
        for (String[] x : b) r.add(new BoardItem(x[0], x[1], "Популярные", false));
        return r;
    }

    private ArrayList<ThreadItem> parseCatalog(String json) throws Exception {
        JSONObject root = new JSONObject(json);
        JSONArray arr = root.optJSONArray("threads");
        ArrayList<ThreadItem> result = new ArrayList<>();
        if (arr == null) return result;
        for (int i = 0; i < arr.length(); i++) {
            JSONObject o = arr.optJSONObject(i);
            if (o == null) continue;
            long num = lng(o, "num");
            if (num <= 0) continue;
            ThreadItem t = new ThreadItem();
            t.num = num;
            t.subject = cleanText(str(o, "subject"));
            t.commentHtml = str(o, "comment");
            t.posts = integer(o, "posts_count");
            t.filesCount = integer(o, "files_count");
            t.views = integer(o, "views");
            t.files = parseFiles(o.optJSONArray("files"));
            result.add(t);
        }
        return result;
    }

    private ArrayList<PostItem> parseThread(String json) throws Exception {
        JSONObject root = new JSONObject(json);
        JSONArray threads = root.optJSONArray("threads");
        ArrayList<PostItem> result = new ArrayList<>();
        if (threads == null || threads.length() == 0) return result;
        JSONObject t = threads.optJSONObject(0);
        if (t == null) return result;
        JSONArray posts = t.optJSONArray("posts");
        if (posts == null) return result;
        for (int i = 0; i < posts.length(); i++) {
            JSONObject o = posts.optJSONObject(i);
            if (o == null) continue;
            PostItem p = new PostItem();
            p.num = lng(o, "num");
            p.parent = lng(o, "parent");
            p.date = str(o, "date");
            p.name = str(o, "name");
            p.subject = cleanText(str(o, "subject"));
            p.commentHtml = str(o, "comment");
            p.op = integer(o, "op") == 1 || i == 0;
            p.files = parseFiles(o.optJSONArray("files"));
            result.add(p);
        }
        return result;
    }

    private ArrayList<MediaItem> parseFiles(JSONArray arr) {
        ArrayList<MediaItem> result = new ArrayList<>();
        if (arr == null) return result;
        for (int i = 0; i < arr.length(); i++) {
            JSONObject o = arr.optJSONObject(i);
            if (o == null) continue;
            MediaItem m = new MediaItem();
            m.path = str(o, "path");
            m.thumbnail = str(o, "thumbnail");
            m.name = str(o, "displayname");
            if (m.name.isEmpty()) m.name = str(o, "name");
            m.width = integer(o, "width");
            m.height = integer(o, "height");
            m.sizeKb = integer(o, "size");
            m.duration = str(o, "duration");
            if (!m.path.isEmpty()) result.add(m);
        }
        return result;
    }

    private String fetchJson(String path) throws Exception {
        Exception last = null;
        LinkedHashSet<String> bases = new LinkedHashSet<>();
        bases.add(activeBase);
        bases.addAll(Arrays.asList(BASES));
        for (String base : bases) {
            HttpURLConnection c = null;
            try {
                URL url = new URL(base + path);
                c = (HttpURLConnection) url.openConnection();
                c.setConnectTimeout(12000);
                c.setReadTimeout(20000);
                c.setInstanceFollowRedirects(true);
                c.setRequestProperty("User-Agent", USER_AGENT);
                c.setRequestProperty("Accept", "application/json,text/plain,*/*");
                c.setRequestProperty("Referer", base + "/");
                int code = c.getResponseCode();
                if (code < 200 || code >= 300) throw new Exception("HTTP " + code);
                String body = readText(c.getInputStream());
                String trim = body.trim();
                if (!(trim.startsWith("{") || trim.startsWith("["))) throw new Exception("Ответ не JSON");
                activeBase = base;
                prefs.edit().putString("active_base", base).apply();
                return body;
            } catch (Exception e) {
                last = e;
            } finally {
                if (c != null) c.disconnect();
            }
        }
        throw last != null ? last : new Exception("Нет доступного зеркала");
    }

    private String readText(InputStream in) throws Exception {
        byte[] buf = new byte[8192];
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        int n;
        while ((n = in.read(buf)) >= 0) out.write(buf, 0, n);
        in.close();
        return out.toString(StandardCharsets.UTF_8);
    }

    private void loadImage(ImageView view, String path, int maxPx) {
        if (path == null || path.isEmpty()) return;
        String key = absolute(path) + "@" + maxPx;
        view.setTag(key);
        Bitmap cached = bitmapCache.get(key);
        if (cached != null) {
            view.setImageBitmap(cached);
            return;
        }
        executor.execute(() -> {
            Bitmap b = downloadBitmap(path, maxPx);
            if (b == null) return;
            bitmapCache.put(key, b);
            main.post(() -> {
                Object tag = view.getTag();
                if (key.equals(tag)) view.setImageBitmap(b);
            });
        });
    }

    private Bitmap downloadBitmap(String path, int maxPx) {
        for (String u : mediaCandidates(path)) {
            HttpURLConnection c = null;
            try {
                c = (HttpURLConnection) new URL(u).openConnection();
                c.setConnectTimeout(12000);
                c.setReadTimeout(25000);
                c.setRequestProperty("User-Agent", USER_AGENT);
                c.setRequestProperty("Referer", activeBase + "/");
                if (c.getResponseCode() < 200 || c.getResponseCode() >= 300) continue;
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                InputStream in = c.getInputStream();
                byte[] buf = new byte[16384];
                int n;
                int total = 0;
                while ((n = in.read(buf)) >= 0) {
                    total += n;
                    if (total > 40 * 1024 * 1024) return null;
                    out.write(buf, 0, n);
                }
                in.close();
                byte[] bytes = out.toByteArray();
                BitmapFactory.Options bounds = new BitmapFactory.Options();
                bounds.inJustDecodeBounds = true;
                BitmapFactory.decodeByteArray(bytes, 0, bytes.length, bounds);
                int sample = 1;
                while (Math.max(bounds.outWidth / sample, bounds.outHeight / sample) > maxPx * 2) sample *= 2;
                BitmapFactory.Options opts = new BitmapFactory.Options();
                opts.inSampleSize = Math.max(1, sample);
                return BitmapFactory.decodeByteArray(bytes, 0, bytes.length, opts);
            } catch (Exception ignored) {
            } finally {
                if (c != null) c.disconnect();
            }
        }
        return null;
    }

    private List<String> mediaCandidates(String path) {
        if (path.startsWith("http://") || path.startsWith("https://")) return Collections.singletonList(path);
        String p = path.startsWith("/") ? path : "/" + path;
        LinkedHashSet<String> urls = new LinkedHashSet<>();
        urls.add(activeBase + p);
        for (String b : BASES) urls.add(b + p);
        return new ArrayList<>(urls);
    }

    private String absolute(String path) {
        if (path == null || path.isEmpty()) return activeBase + "/";
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return activeBase + (path.startsWith("/") ? path : "/" + path);
    }

    private void openMedia(ArrayList<MediaItem> items, int index) {
        if (items == null || items.isEmpty()) return;
        closeMedia();
        gallery = items;
        galleryIndex = Math.max(0, Math.min(index, items.size() - 1));
        mediaOverlay = new FrameLayout(this);
        mediaOverlay.setBackgroundColor(Color.BLACK);

        LinearLayout column = new LinearLayout(this);
        column.setOrientation(LinearLayout.VERTICAL);
        LinearLayout top = new LinearLayout(this);
        top.setOrientation(LinearLayout.HORIZONTAL);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(dp(6), dp(5), dp(6), dp(5));
        top.setBackgroundColor(Color.rgb(8, 8, 8));
        Button close = toolbarButton("✕");
        TextView mediaTitle = text("Медиа", 16, TEXT);
        mediaTitle.setGravity(Gravity.CENTER_VERTICAL);
        Button share = toolbarButton("Поделиться");
        Button download = toolbarButton("Скачать");
        top.addView(close, new LinearLayout.LayoutParams(dp(48), dp(44)));
        top.addView(mediaTitle, new LinearLayout.LayoutParams(0, dp(44), 1));
        top.addView(share, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(44)));
        top.addView(download, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(44)));

        mediaStage = new FrameLayout(this);
        mediaStage.setBackgroundColor(Color.BLACK);

        LinearLayout nav = new LinearLayout(this);
        nav.setOrientation(LinearLayout.HORIZONTAL);
        nav.setGravity(Gravity.CENTER);
        nav.setPadding(dp(6), dp(4), dp(6), dp(7));
        Button prev = toolbarButton("‹");
        Button next = toolbarButton("›");
        mediaCounter = text("", 14, MUTED);
        mediaCounter.setGravity(Gravity.CENTER);
        nav.addView(prev, new LinearLayout.LayoutParams(dp(64), dp(46)));
        nav.addView(mediaCounter, new LinearLayout.LayoutParams(0, dp(46), 1));
        nav.addView(next, new LinearLayout.LayoutParams(dp(64), dp(46)));

        column.addView(top, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        column.addView(mediaStage, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        column.addView(nav, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        mediaOverlay.addView(column, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.addView(mediaOverlay, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        close.setOnClickListener(v -> closeMedia());
        prev.setOnClickListener(v -> showMediaAt(galleryIndex - 1));
        next.setOnClickListener(v -> showMediaAt(galleryIndex + 1));
        download.setOnClickListener(v -> requestDownload(absolute(gallery.get(galleryIndex).path), USER_AGENT, null, guessMime(gallery.get(galleryIndex).path)));
        share.setOnClickListener(v -> shareUrl(absolute(gallery.get(galleryIndex).path)));
        showMediaAt(galleryIndex);
    }

    private void showMediaAt(int index) {
        if (gallery.isEmpty()) return;
        galleryIndex = (index + gallery.size()) % gallery.size();
        MediaItem m = gallery.get(galleryIndex);
        if (currentVideo != null) {
            currentVideo.stopPlayback();
            currentVideo = null;
        }
        mediaStage.removeAllViews();
        mediaCounter.setText((galleryIndex + 1) + " / " + gallery.size() + (m.name.isEmpty() ? "" : "   " + m.name));
        if (m.isVideo()) {
            VideoView video = new VideoView(this);
            video.setBackgroundColor(Color.BLACK);
            MediaController controls = new MediaController(this);
            controls.setAnchorView(video);
            video.setMediaController(controls);
            video.setVideoURI(Uri.parse(absolute(m.path)));
            video.setOnPreparedListener(mp -> {
                mp.setLooping(false);
                video.start();
            });
            video.setOnErrorListener((mp, what, extra) -> {
                Toast.makeText(this, "Этот видеокодек не поддерживается системным плеером", Toast.LENGTH_LONG).show();
                return false;
            });
            currentVideo = video;
            mediaStage.addView(video, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        } else {
            ZoomImageView image = new ZoomImageView(this);
            image.setBackgroundColor(Color.BLACK);
            image.setImageDrawable(null);
            image.setScaleType(ImageView.ScaleType.MATRIX);
            mediaStage.addView(image, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            loadImage(image, m.path, 2200);
        }
    }

    private void closeMedia() {
        if (currentVideo != null) {
            currentVideo.stopPlayback();
            currentVideo = null;
        }
        if (mediaOverlay != null) {
            root.removeView(mediaOverlay);
            mediaOverlay = null;
        }
    }

    private void openPosting(String board, long thread) {
        closePosting();
        postingOverlay = new FrameLayout(this);
        postingOverlay.setBackgroundColor(BG);
        LinearLayout column = new LinearLayout(this);
        column.setOrientation(LinearLayout.VERTICAL);

        LinearLayout top = new LinearLayout(this);
        top.setOrientation(LinearLayout.HORIZONTAL);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(dp(6), dp(5), dp(6), dp(5));
        top.setBackgroundColor(Color.rgb(8, 8, 8));
        Button close = toolbarButton("✕");
        TextView caption = text(thread > 0 ? "Ответ /" + board + "/" : "Новый тред /" + board + "/", 16, TEXT);
        caption.setGravity(Gravity.CENTER_VERTICAL);
        Button external = toolbarButton("↗");
        top.addView(close, new LinearLayout.LayoutParams(dp(48), dp(44)));
        top.addView(caption, new LinearLayout.LayoutParams(0, dp(44), 1));
        top.addView(external, new LinearLayout.LayoutParams(dp(52), dp(44)));

        postingWebView = new WebView(this);
        postingWebView.setBackgroundColor(SURFACE);
        configurePostingWebView(postingWebView);
        column.addView(top, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        column.addView(postingWebView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        postingOverlay.addView(column, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.addView(postingOverlay, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        String url = thread > 0 ? activeBase + "/" + board + "/res/" + thread + ".html" : activeBase + "/" + board + "/";
        postingWebView.loadUrl(url);
        close.setOnClickListener(v -> closePosting());
        external.setOnClickListener(v -> openExternal(postingWebView.getUrl()));
    }

    private void configurePostingWebView(WebView web) {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setSupportZoom(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setLoadsImagesAutomatically(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setUserAgentString(USER_AGENT);
        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(web, true);

        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return handleWebNavigation(request.getUrl()); }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) { return handleWebNavigation(Uri.parse(url)); }
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                String js = "javascript:(function(){var m=document.querySelector('meta[name=viewport]');if(!m){m=document.createElement('meta');m.name='viewport';document.head.appendChild(m);}m.content='width=device-width,initial-scale=1,maximum-scale=5,user-scalable=yes';var f=document.querySelector('form[action*=posting],form[id*=post],.postform form');if(f)setTimeout(function(){f.scrollIntoView({block:\"center\"});},250);})()";
                view.evaluateJavascript(js, null);
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    startActivityForResult(Intent.createChooser(params.createIntent(), "Выберите файл"), FILE_CHOOSER);
                    return true;
                } catch (Exception e) {
                    fileCallback = null;
                    Toast.makeText(MainActivity.this, "Не удалось открыть выбор файла", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
            @Override public void onPermissionRequest(PermissionRequest request) { runOnUiThread(() -> request.grant(request.getResources())); }
        });
        web.setDownloadListener((url, userAgent, disposition, mimeType, contentLength) -> requestDownload(url, userAgent, disposition, mimeType));
    }

    private boolean handleWebNavigation(Uri uri) {
        String scheme = uri.getScheme();
        if (scheme == null || scheme.equals("http") || scheme.equals("https")) return false;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (Exception e) { Toast.makeText(this, "Ссылка не поддерживается", Toast.LENGTH_SHORT).show(); }
        return true;
    }

    private void closePosting() {
        if (fileCallback != null) {
            fileCallback.onReceiveValue(null);
            fileCallback = null;
        }
        if (postingWebView != null) {
            postingWebView.stopLoading();
            postingWebView.destroy();
            postingWebView = null;
        }
        if (postingOverlay != null) {
            root.removeView(postingOverlay);
            postingOverlay = null;
        }
    }

    private void openWeb(String url) {
        String target = url == null ? activeBase + "/" : url;
        String board = currentBoard == null ? "" : currentBoard;
        openPosting(board.isEmpty() ? "b" : board, screen == Screen.THREAD ? currentThread : 0);
        if (postingWebView != null) postingWebView.loadUrl(target);
    }

    private void refreshCurrent() {
        if (screen == Screen.BOARDS) showBoards(true);
        else if (screen == Screen.CATALOG) showCatalog(currentBoard, true);
        else showThread(currentBoard, currentThread, true);
    }

    private void navigateBack() {
        if (screen == Screen.THREAD) showCatalog(currentBoard, false);
        else if (screen == Screen.CATALOG) showBoards(false);
    }

    private void rememberCurrentPosition() {
        if (currentList == null) return;
        int pos = currentList.getFirstVisiblePosition();
        String key = null;
        if (screen == Screen.CATALOG && currentBoard != null) key = "catalog_" + currentBoard;
        if (screen == Screen.THREAD && currentBoard != null) key = "thread_" + currentBoard + "_" + currentThread;
        if (key != null) prefs.edit().putInt("pos_" + key, pos).apply();
    }

    private void restorePosition(String key, ListView list) {
        int pos = prefs.getInt("pos_" + key, 0);
        if (pos > 0) list.setSelection(pos);
    }

    private void scrollToPost(long num) {
        for (int i = 0; i < currentPosts.size(); i++) {
            if (currentPosts.get(i).num == num) {
                if (currentList != null) currentList.setSelection(i);
                return;
            }
        }
        Toast.makeText(this, "Пост >>" + num + " не найден в загруженном треде", Toast.LENGTH_SHORT).show();
    }

    private SpannableStringBuilder formattedComment(PostItem post) {
        String html = post.revealSpoilers ? post.commentHtml : maskSpoilers(post.commentHtml);
        Spanned raw = Html.fromHtml(html == null ? "" : html, Html.FROM_HTML_MODE_LEGACY);
        SpannableStringBuilder s = new SpannableStringBuilder(raw);
        URLSpan[] urls = s.getSpans(0, s.length(), URLSpan.class);
        for (URLSpan u : urls) s.removeSpan(u);
        Matcher replies = Pattern.compile(">>(\\d+)").matcher(s.toString());
        while (replies.find()) {
            final long n;
            try { n = Long.parseLong(replies.group(1)); } catch (Exception e) { continue; }
            s.setSpan(new ClickableSpan() {
                @Override public void onClick(View widget) { scrollToPost(n); }
            }, replies.start(), replies.end(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
            s.setSpan(new ForegroundColorSpan(ACCENT), replies.start(), replies.end(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
        }
        String txt = s.toString();
        int offset = 0;
        for (String line : txt.split("\\n", -1)) {
            if (line.startsWith(">") && !line.startsWith(">>")) {
                int end = Math.min(s.length(), offset + line.length());
                if (end > offset) s.setSpan(new ForegroundColorSpan(QUOTE), offset, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
            }
            offset += line.length() + 1;
        }
        return s;
    }

    private String maskSpoilers(String html) {
        if (html == null) return "";
        return html.replaceAll("(?is)<span[^>]*class=[\\\"'][^\\\"']*spoiler[^\\\"']*[\\\"'][^>]*>.*?</span>", "<span>████████</span>");
    }

    private boolean hasSpoiler(String html) {
        return html != null && html.toLowerCase(Locale.ROOT).contains("spoiler");
    }

    private String cleanText(String html) {
        if (html == null || html.isEmpty()) return "";
        String t = Html.fromHtml(html, Html.FROM_HTML_MODE_LEGACY).toString();
        return t.replaceAll("\\n{3,}", "\\n\\n").trim();
    }

    private String ellipsize(String text, int max) {
        if (text == null) return "";
        String t = text.trim();
        if (t.length() <= max) return t;
        return t.substring(0, max).trim() + "…";
    }

    private void setLoading(boolean loading) { progress.setVisibility(loading ? View.VISIBLE : View.GONE); }

    private TextView text(String value, float size, int color) {
        TextView t = new TextView(this);
        t.setText(value);
        t.setTextSize(size);
        t.setTextColor(color);
        return t;
    }

    private Button actionChip(String value) {
        Button b = new Button(this);
        b.setText(value);
        b.setAllCaps(false);
        b.setTextColor(TEXT);
        b.setTextSize(14);
        b.setPadding(dp(16), 0, dp(16), 0);
        b.setBackground(rounded(SURFACE_2, 14));
        return b;
    }

    private GradientDrawable rounded(int color, int radiusDp) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(dp(radiusDp));
        return g;
    }

    private View catalogCard(ThreadItem t) {
        LinearLayout outer = new LinearLayout(this);
        outer.setPadding(dp(8), dp(5), dp(8), dp(5));
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(12), dp(11), dp(12), dp(11));
        card.setBackground(rounded(SURFACE, 13));
        outer.addView(card, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView subject = text(t.subject.isEmpty() ? "№" + t.num : t.subject, 16, TEXT);
        subject.setTypeface(null, android.graphics.Typeface.BOLD);
        subject.setMaxLines(2);
        card.addView(subject);

        String stats = "№" + t.num + "   💬 " + t.posts + "   📎 " + (t.filesCount > 0 ? t.filesCount : t.files.size());
        if (t.views > 0) stats += "   👁 " + t.views;
        TextView meta = text(stats, 12, MUTED);
        LinearLayout.LayoutParams metaLp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        metaLp.topMargin = dp(4);
        card.addView(meta, metaLp);

        LinearLayout body = new LinearLayout(this);
        body.setOrientation(LinearLayout.HORIZONTAL);
        body.setGravity(Gravity.TOP);
        LinearLayout.LayoutParams bodyLp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        bodyLp.topMargin = dp(9);
        card.addView(body, bodyLp);

        if (!t.files.isEmpty()) {
            MediaItem m = t.files.get(0);
            ImageView thumb = new ImageView(this);
            thumb.setScaleType(ImageView.ScaleType.CENTER_CROP);
            thumb.setBackgroundColor(SURFACE_2);
            body.addView(thumb, new LinearLayout.LayoutParams(dp(104), dp(104)));
            loadImage(thumb, m.thumbnail.isEmpty() ? m.path : m.thumbnail, 360);
        }
        TextView comment = text(ellipsize(cleanText(t.commentHtml), 440), 14, TEXT);
        comment.setLineSpacing(0, 1.08f);
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1);
        cp.leftMargin = t.files.isEmpty() ? 0 : dp(11);
        body.addView(comment, cp);
        return outer;
    }

    private View postCard(PostItem p) {
        LinearLayout outer = new LinearLayout(this);
        outer.setPadding(dp(7), dp(4), dp(7), dp(4));
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(11), dp(9), dp(11), dp(10));
        card.setBackground(rounded(p.op ? Color.rgb(24, 21, 18) : SURFACE, 11));
        outer.addView(card, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        String name = p.name == null || p.name.isEmpty() ? "Аноним" : p.name;
        TextView who = text(name + (p.op ? "  OP" : ""), 12, p.op ? ACCENT : MUTED);
        TextView num = text("№" + p.num, 12, ACCENT);
        num.setGravity(Gravity.RIGHT | Gravity.CENTER_VERTICAL);
        header.addView(who, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        header.addView(num, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        card.addView(header);

        if (!p.date.isEmpty()) {
            TextView date = text(p.date, 11, MUTED);
            LinearLayout.LayoutParams dpv = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            dpv.topMargin = dp(2);
            card.addView(date, dpv);
        }
        if (!p.subject.isEmpty()) {
            TextView subject = text(p.subject, 15, TEXT);
            subject.setTypeface(null, android.graphics.Typeface.BOLD);
            LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            sp.topMargin = dp(6);
            card.addView(subject, sp);
        }

        if (!p.files.isEmpty()) {
            LinearLayout media = new LinearLayout(this);
            media.setOrientation(LinearLayout.HORIZONTAL);
            LinearLayout.LayoutParams mp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            mp.topMargin = dp(8);
            card.addView(media, mp);
            for (int i = 0; i < p.files.size(); i++) {
                MediaItem m = p.files.get(i);
                FrameLayout tile = new FrameLayout(this);
                ImageView img = new ImageView(this);
                img.setScaleType(ImageView.ScaleType.CENTER_CROP);
                img.setBackgroundColor(SURFACE_2);
                tile.addView(img, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                if (m.isVideo()) {
                    TextView play = text("▶", 22, Color.WHITE);
                    play.setGravity(Gravity.CENTER);
                    play.setBackgroundColor(Color.argb(105, 0, 0, 0));
                    tile.addView(play, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                }
                final int postMediaIndex = i;
                tile.setOnClickListener(v -> {
                    int idx = currentGallery.indexOf(p.files.get(postMediaIndex));
                    if (idx < 0) idx = 0;
                    openMedia(currentGallery, idx);
                });
                tile.setOnLongClickListener(v -> {
                    showMediaActions(m);
                    return true;
                });
                LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(dp(102), dp(102));
                if (i > 0) tp.leftMargin = dp(6);
                media.addView(tile, tp);
                loadImage(img, m.thumbnail.isEmpty() ? m.path : m.thumbnail, 360);
            }
        }

        TextView comment = text("", 14, TEXT);
        comment.setText(formattedComment(p));
        comment.setMovementMethod(LinkMovementMethod.getInstance());
        comment.setHighlightColor(Color.TRANSPARENT);
        comment.setLinkTextColor(ACCENT);
        comment.setTextIsSelectable(true);
        comment.setLineSpacing(0, 1.08f);
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        cp.topMargin = dp(8);
        card.addView(comment, cp);

        if (hasSpoiler(p.commentHtml) && !p.revealSpoilers) {
            TextView reveal = text("Показать спойлеры", 12, ACCENT);
            reveal.setPadding(0, dp(8), 0, dp(2));
            reveal.setOnClickListener(v -> {
                p.revealSpoilers = true;
                if (currentList != null && currentList.getAdapter() instanceof PostAdapter) ((PostAdapter) currentList.getAdapter()).notifyDataSetChanged();
            });
            card.addView(reveal);
        }
        return outer;
    }

    private void showMediaActions(MediaItem m) {
        new AlertDialog.Builder(this)
                .setTitle(m.name.isEmpty() ? "Медиа" : m.name)
                .setItems(new String[]{"Открыть", "Скачать", "Поделиться", "Копировать ссылку"}, (d, which) -> {
                    String url = absolute(m.path);
                    if (which == 0) {
                        int idx = currentGallery.indexOf(m);
                        openMedia(currentGallery.isEmpty() ? new ArrayList<>(Collections.singletonList(m)) : currentGallery, Math.max(0, idx));
                    } else if (which == 1) requestDownload(url, USER_AGENT, null, guessMime(m.path));
                    else if (which == 2) shareUrl(url);
                    else copyLink(url);
                }).show();
    }

    private void shareUrl(String url) {
        Intent i = new Intent(Intent.ACTION_SEND);
        i.setType("text/plain");
        i.putExtra(Intent.EXTRA_TEXT, url);
        startActivity(Intent.createChooser(i, "Поделиться"));
    }

    private void copyLink(String url) {
        ClipboardManager cm = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
        cm.setPrimaryClip(ClipData.newPlainText("2ch media", url));
        Toast.makeText(this, "Ссылка скопирована", Toast.LENGTH_SHORT).show();
    }

    private void openExternal(String url) {
        if (url == null || url.isEmpty()) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); }
        catch (Exception e) { Toast.makeText(this, "Не удалось открыть ссылку", Toast.LENGTH_SHORT).show(); }
    }

    private void requestDownload(String url, String userAgent, String disposition, String mimeType) {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            pendingDownloadUrl = url;
            pendingDownloadAgent = userAgent;
            pendingDownloadDisposition = disposition;
            pendingDownloadMime = mimeType;
            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, STORAGE_PERMISSION);
            return;
        }
        enqueueDownload(url, userAgent, disposition, mimeType);
    }

    private void enqueueDownload(String url, String userAgent, String disposition, String mimeType) {
        try {
            String fileName = URLUtil.guessFileName(url, disposition, mimeType);
            DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
            req.setTitle(fileName);
            req.setDescription("Скачивание с 2ch");
            req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            req.setAllowedOverMetered(true);
            req.setAllowedOverRoaming(true);
            req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
            String cookie = CookieManager.getInstance().getCookie(url);
            if (cookie != null) req.addRequestHeader("Cookie", cookie);
            if (userAgent != null) req.addRequestHeader("User-Agent", userAgent);
            req.addRequestHeader("Referer", activeBase + "/");
            if (mimeType != null) req.setMimeType(mimeType);
            ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(req);
            Toast.makeText(this, "Скачивание началось", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Toast.makeText(this, "Ошибка скачивания", Toast.LENGTH_LONG).show();
        }
    }

    private String guessMime(String path) {
        String p = path == null ? "" : path.toLowerCase(Locale.ROOT);
        if (p.endsWith(".webm")) return "video/webm";
        if (p.endsWith(".mp4") || p.endsWith(".m4v")) return "video/mp4";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".gif")) return "image/gif";
        if (p.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER || fileCallback == null) return;
        Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == STORAGE_PERMISSION && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED && pendingDownloadUrl != null) {
            enqueueDownload(pendingDownloadUrl, pendingDownloadAgent, pendingDownloadDisposition, pendingDownloadMime);
        }
        pendingDownloadUrl = null;
    }

    @Override
    public void onBackPressed() {
        if (mediaOverlay != null) { closeMedia(); return; }
        if (postingOverlay != null) {
            if (postingWebView != null && postingWebView.canGoBack()) postingWebView.goBack();
            else closePosting();
            return;
        }
        if (screen != Screen.BOARDS) navigateBack();
        else super.onBackPressed();
    }

    @Override protected void onPause() {
        rememberCurrentPosition();
        super.onPause();
    }

    @Override protected void onDestroy() {
        closePosting();
        closeMedia();
        executor.shutdownNow();
        super.onDestroy();
    }

    private String str(JSONObject o, String key) {
        Object v = o.opt(key);
        return v == null || v == JSONObject.NULL ? "" : String.valueOf(v);
    }

    private int integer(JSONObject o, String key) {
        Object v = o.opt(key);
        if (v instanceof Number) return ((Number) v).intValue();
        try { return Integer.parseInt(String.valueOf(v)); } catch (Exception e) { return 0; }
    }

    private long lng(JSONObject o, String key) {
        Object v = o.opt(key);
        if (v instanceof Number) return ((Number) v).longValue();
        try { return Long.parseLong(String.valueOf(v)); } catch (Exception e) { return 0; }
    }

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }

    private static class BoardItem {
        final String id, name, category;
        final boolean header;
        BoardItem(String id, String name, String category, boolean header) { this.id = id; this.name = name; this.category = category; this.header = header; }
        static BoardItem header(String title) { return new BoardItem(null, title, title, true); }
    }

    private static class ThreadItem {
        long num;
        String subject = "";
        String commentHtml = "";
        int posts, filesCount, views;
        ArrayList<MediaItem> files = new ArrayList<>();
    }

    private static class PostItem {
        long num, parent;
        String date = "", name = "", subject = "", commentHtml = "";
        boolean op, revealSpoilers;
        ArrayList<MediaItem> files = new ArrayList<>();
    }

    private static class MediaItem {
        String path = "", thumbnail = "", name = "", duration = "";
        int width, height, sizeKb;
        boolean isVideo() {
            String p = path.toLowerCase(Locale.ROOT);
            return p.endsWith(".webm") || p.endsWith(".mp4") || p.endsWith(".m4v") || p.endsWith(".mov");
        }
    }

    private class BoardAdapter extends BaseAdapter {
        private final ArrayList<BoardItem> all;
        private final ArrayList<BoardItem> shown = new ArrayList<>();
        BoardAdapter(ArrayList<BoardItem> items) { all = new ArrayList<>(items); shown.addAll(items); }
        void filter(String query) {
            shown.clear();
            String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
            if (q.isEmpty()) shown.addAll(all);
            else {
                String lastCategory = null;
                for (BoardItem b : all) {
                    if (b.header) { lastCategory = b.name; continue; }
                    if (b.id.toLowerCase(Locale.ROOT).contains(q) || b.name.toLowerCase(Locale.ROOT).contains(q)) {
                        if (shown.isEmpty() || shown.get(shown.size() - 1).header || !shown.get(shown.size() - 1).category.equals(lastCategory)) {
                            boolean has = false;
                            for (BoardItem s : shown) if (s.header && s.name.equals(lastCategory)) { has = true; break; }
                            if (!has) shown.add(BoardItem.header(lastCategory));
                        }
                        shown.add(b);
                    }
                }
            }
            notifyDataSetChanged();
        }
        @Override public int getCount() { return shown.size(); }
        @Override public BoardItem getItem(int position) { return shown.get(position); }
        @Override public long getItemId(int position) { return position; }
        @Override public boolean isEnabled(int position) { return !shown.get(position).header; }
        @Override public View getView(int position, View convertView, ViewGroup parent) {
            BoardItem b = getItem(position);
            TextView t = new TextView(MainActivity.this);
            if (b.header) {
                t.setText(b.name.toUpperCase(Locale.ROOT));
                t.setTextColor(MUTED);
                t.setTextSize(12);
                t.setTypeface(null, android.graphics.Typeface.BOLD);
                t.setPadding(dp(8), dp(17), dp(8), dp(7));
                t.setBackgroundColor(BG);
            } else {
                t.setText("/" + b.id + "/   " + b.name);
                t.setTextColor(TEXT);
                t.setTextSize(16);
                t.setGravity(Gravity.CENTER_VERTICAL);
                t.setPadding(dp(14), dp(10), dp(14), dp(10));
                t.setBackground(rounded(SURFACE, 11));
                AbsListView.LayoutParams lp = new AbsListView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(52));
                t.setLayoutParams(lp);
            }
            return t;
        }
    }

    private class CatalogAdapter extends BaseAdapter {
        private final ArrayList<ThreadItem> items;
        CatalogAdapter(ArrayList<ThreadItem> items) { this.items = items; }
        @Override public int getCount() { return items.size(); }
        @Override public ThreadItem getItem(int position) { return items.get(position); }
        @Override public long getItemId(int position) { return getItem(position).num; }
        @Override public View getView(int position, View convertView, ViewGroup parent) { return catalogCard(getItem(position)); }
    }

    private class PostAdapter extends BaseAdapter {
        private final ArrayList<PostItem> items;
        PostAdapter(ArrayList<PostItem> items) { this.items = items; }
        @Override public int getCount() { return items.size(); }
        @Override public PostItem getItem(int position) { return items.get(position); }
        @Override public long getItemId(int position) { return getItem(position).num; }
        @Override public View getView(int position, View convertView, ViewGroup parent) { return postCard(getItem(position)); }
    }

    private class ZoomImageView extends ImageView implements ScaleGestureDetector.OnScaleGestureListener {
        private final Matrix matrix = new Matrix();
        private final ScaleGestureDetector detector;
        private float scale = 1f;
        private float lastX, lastY;
        private boolean dragging;
        ZoomImageView(Context context) {
            super(context);
            setScaleType(ScaleType.MATRIX);
            detector = new ScaleGestureDetector(context, this);
            setOnTouchListener((v, event) -> {
                detector.onTouchEvent(event);
                if (event.getPointerCount() == 1 && !detector.isInProgress()) {
                    if (event.getActionMasked() == MotionEvent.ACTION_DOWN) {
                        lastX = event.getX(); lastY = event.getY(); dragging = true;
                    } else if (event.getActionMasked() == MotionEvent.ACTION_MOVE && dragging && scale > 1f) {
                        float dx = event.getX() - lastX;
                        float dy = event.getY() - lastY;
                        matrix.postTranslate(dx, dy);
                        setImageMatrix(matrix);
                        lastX = event.getX(); lastY = event.getY();
                    } else if (event.getActionMasked() == MotionEvent.ACTION_UP || event.getActionMasked() == MotionEvent.ACTION_CANCEL) dragging = false;
                }
                return true;
            });
        }
        @Override public boolean onScale(ScaleGestureDetector d) {
            float factor = d.getScaleFactor();
            float target = Math.max(1f, Math.min(6f, scale * factor));
            factor = target / scale;
            scale = target;
            matrix.postScale(factor, factor, d.getFocusX(), d.getFocusY());
            setImageMatrix(matrix);
            if (scale <= 1.001f) { matrix.reset(); setImageMatrix(matrix); }
            return true;
        }
        @Override public boolean onScaleBegin(ScaleGestureDetector detector) { return true; }
        @Override public void onScaleEnd(ScaleGestureDetector detector) {}
    }
}
