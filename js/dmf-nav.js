// DMF Records: one product. The website and the DMF app (served at /app/ on this same domain) share one nav and
// one sign-in. The app keeps its Supabase session in localStorage under AUTH_KEY; same origin means this page can
// see it. Signed in: "Dashboard" + the account + "Sign out". Signed out: "App" + "Sign in" (both open /app/).
// Keep links and AUTH_KEY in step with the app's src/lib/siteNav.ts.
(function () {
  var SUPABASE_URL = "https://akqonumkjrfxhncidygl.supabase.co";
  var SUPABASE_KEY = "sb_publishable_tlxjQHv4ho9KqCWgc1k6yA_eScKf8Dt";
  var SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm";
  var AUTH_KEY = "sb-akqonumkjrfxhncidygl-auth-token";
  var APP = "/app/";
  var LINKS = [["home", "Home", "/"], ["roster", "Roster", "/roster.html"], ["news", "News", "/news.html"], ["promo", "Promo", "/promo.html"]];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function stored() {
    try { var v = JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); var s = v && (v.currentSession || v); return s && s.refresh_token ? s : null; } catch (e) { return null; }
  }
  function here() {
    var p = location.pathname.replace(/index\.html$/, "");
    if (p === "/" || p === "") return "home";
    if (/^\/news(-\d{4}-\d{2}-\d{2})?\.html$/.test(p)) return "news";
    if (/^\/promo\.html$/.test(p)) return "promo";
    if (/^\/(roster|big-homie-cash|freezzo|obmb-delo|ellumf|go-savage)\.html$/.test(p)) return "roster";
    return "";
  }

  var client = null;
  function sb() {
    // Same options as the app's client, so both read and refresh one session.
    if (!client) client = import(SUPABASE_JS).then(function (m) {
      return m.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: AUTH_KEY } });
    });
    return client;
  }

  function render(session) {
    var nav = document.querySelector("nav.dmf-nav") || document.querySelector("body > nav");
    if (!nav) { nav = document.createElement("nav"); document.body.insertBefore(nav, document.body.firstChild); }
    nav.className = "dmf-nav";
    nav.setAttribute("aria-label", "DMF Records");
    var cur = here();
    var html = '<a href="/" class="brand"><img src="/icon.png" alt="">DMF Records</a><span>';
    LINKS.forEach(function (l) { html += '<a href="' + l[2] + '"' + (cur === l[0] ? ' aria-current="page"' : "") + ">" + l[1] + "</a>"; });
    if (session) {
      var email = (session.user && session.user.email) || "";
      html += '<a href="' + APP + '#/home" class="dash" data-dmf="app">Dashboard</a>';
      if (email) html += '<span class="who" data-dmf="who" title="' + esc(email) + '">' + esc(email) + "</span>";
      html += '<a href="' + APP + '" data-dmf="auth" role="button">Sign out</a>';
    } else {
      html += '<a href="' + APP + '" data-dmf="app">App</a><a href="' + APP + '" data-dmf="auth">Sign in</a>';
    }
    nav.innerHTML = html + "</span>";
    if (session) nav.querySelector('[data-dmf="auth"]').addEventListener("click", function (e) { e.preventDefault(); signOut(); });
    document.documentElement.setAttribute("data-dmf-auth", session ? "in" : "out");
  }

  function signOut() {
    var done = function () { try { localStorage.removeItem(AUTH_KEY); } catch (e) { /* storage blocked */ } render(null); };
    sb().then(function (c) { return c.auth.signOut(); }).then(done, done);
  }

  function start() {
    var s = stored();
    render(s);
    if (s) {
      // Confirm with Supabase (refreshes an expired token, drops a revoked one) and follow later changes.
      sb().then(function (c) {
        c.auth.onAuthStateChange(function (_e, session) { render(session); });
        return c.auth.getSession().then(function (r) { render(r.data && r.data.session); });
      }).catch(function () { /* offline: keep what localStorage says */ });
    }
    // Signed in or out in the app (another tab): follow it here.
    window.addEventListener("storage", function (e) { if (e.key === AUTH_KEY || e.key === null) render(stored()); });
  }
  window.DMFNav = { render: render, signOut: signOut, stored: stored };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
