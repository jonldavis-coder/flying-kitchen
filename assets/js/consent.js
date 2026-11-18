/* KiteKitchen consent, GA4, and ads.
   GA4 follows the same delay as Jonathan's other sites (StateWatchPro):
   the gtag library is not requested until the first pointer, key, or scroll,
   or a short timeout after load, so it stays outside Lighthouse's early window.
   Consent Mode v2 defaults are queued before that library loads.
   Storage stays denied in the EEA, UK, and Switzerland until the visitor
   accepts. Elsewhere analytics storage is granted unless they reject.
   Ad scripts load only after Accept, and only when ads are enabled. */
(function () {
  var cfg = window.KITE_KITCHEN || {};
  var id = String(cfg.GA_MEASUREMENT_ID || "");
  var ads = cfg.ADS || { enabled: false, publisherId: "" };
  var adsOn = ads.enabled === true && /^ca-pub-\d+$/.test(String(ads.publisherId || ""));
  var KEY = "kk-consent";
  var regions = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IS","IT","LI","LV","LT","LU","MT","NL","NO","PL","PT","RO","SK","SI","ES","SE","GB","CH"];

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: 500,
    region: regions
  });
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
    security_storage: "granted"
  });

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function apply(choice) {
    var grantAds = choice === "granted" && adsOn;
    window.gtag("consent", "update", {
      analytics_storage: choice === "granted" ? "granted" : "denied",
      ad_storage: grantAds ? "granted" : "denied",
      ad_user_data: grantAds ? "granted" : "denied",
      ad_personalization: grantAds ? "granted" : "denied"
    });
    if (grantAds) loadAds();
  }

  var choice = stored();
  if (choice === "granted" || choice === "denied") apply(choice);

  var gaStarted = false;
  function startGa() {
    if (gaStarted) return;
    if (!/^G-[A-Z0-9]+$/.test(id)) return;
    gaStarted = true;
    ["pointerdown", "keydown", "scroll", "touchstart"].forEach(function (ev) {
      window.removeEventListener(ev, startGa);
    });
    window.gtag("js", new Date());
    window.gtag("config", id, { send_page_view: true });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
  }

  ["pointerdown", "keydown", "scroll", "touchstart"].forEach(function (ev) {
    window.addEventListener(ev, startGa, { once: true, passive: true });
  });
  window.addEventListener("load", function () { window.setTimeout(startGa, 4500); });

  var adsStarted = false;
  function loadAds() {
    if (adsStarted || !adsOn) return;
    if (stored() !== "granted") return;
    adsStarted = true;
    document.querySelectorAll(".kk-ad-frame").forEach(function (frame) {
      frame.textContent = "";
      var ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.style.display = "block";
      ins.style.width = "100%";
      ins.style.height = "100%";
      ins.setAttribute("data-ad-client", ads.publisherId);
      ins.setAttribute("data-ad-format", "auto");
      ins.setAttribute("data-full-width-responsive", "false");
      frame.appendChild(ins);
    });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(ads.publisherId);
    s.crossOrigin = "anonymous";
    s.onload = function () {
      document.querySelectorAll(".adsbygoogle").forEach(function () {
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
      });
    };
    document.head.appendChild(s);
  }

  function banner() { return document.getElementById("kk-consent"); }

  function showBanner() {
    var el = banner();
    if (el) el.hidden = false;
  }

  function hideBanner() {
    var el = banner();
    if (el) el.hidden = true;
  }

  function choose(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
    apply(value);
    hideBanner();
  }

  document.addEventListener("click", function (event) {
    var t = event.target;
    if (!t || !t.closest) return;
    if (t.closest("[data-consent='granted']")) choose("granted");
    else if (t.closest("[data-consent='denied']")) choose("denied");
    else if (t.closest("[data-consent-open]")) showBanner();
  });

  if (!choice) showBanner();
  if (choice === "granted") loadAds();
})();
