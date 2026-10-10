/*
 * Settings panel: language, Day / Night / Auto appearance, and brightness.
 * Appearance and brightness are remembered on each screen; the language always starts in English.
 */
(function () {
  "use strict";

  var L = window.I18N;
  var KEY = "whts-settings";
  var state = { theme: "night", brightness: 100 };

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (saved.theme === "day" || saved.theme === "night" || saved.theme === "auto") state.theme = saved.theme;
    if (saved.brightness >= 30 && saved.brightness <= 130) state.brightness = saved.brightness;
  } catch (e) { /* private mode: just use the defaults */ }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function effectiveTheme() {
    if (state.theme !== "auto") return state.theme;
    var h = new Date().getHours();
    return h >= 7 && h < 19 ? "day" : "night";
  }

  var lastEffective = null;
  function applyTheme() {
    var eff = effectiveTheme();
    document.documentElement.setAttribute("data-theme", eff);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", eff === "day" ? "#f2f2f4" : "#000000");
    markActive("theme", state.theme);
    if (eff !== lastEffective) {
      lastEffective = eff;
      window.dispatchEvent(new Event("themechange-app"));
    }
  }

  function applyBrightness() {
    var b = state.brightness;
    var dim = document.getElementById("dim");
    var scene = document.getElementById("scene");
    // below 100%: a black veil over everything; above 100%: brighten the 3-D picture
    dim.style.opacity = b < 100 ? ((100 - b) / 100) * 0.9 : 0;
    scene.style.filter = b > 100 ? "brightness(" + b / 100 + ")" : "";
    var range = document.getElementById("brightness");
    if (range && +range.value !== b) range.value = b;
    var out = document.getElementById("brightness-value");
    if (out) out.textContent = b + "%";
  }

  function applyLanguage() {
    document.documentElement.lang = L.lang;
    document.title = L.t("title");
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (el) {
      el.textContent = L.t(el.getAttribute("data-i18n"));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-title]"), function (el) {
      el.title = L.t(el.getAttribute("data-i18n-title"));
      el.setAttribute("aria-label", el.title);
    });
    markActive("lang", L.lang);
  }

  function markActive(group, value) {
    Array.prototype.forEach.call(document.querySelectorAll('#settings [data-' + group + ']'), function (b) {
      var on = b.getAttribute("data-" + group) === value;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  var panel, button;
  function isOpen() { return panel && !panel.hidden; }
  function openPanel() { panel.hidden = false; requestAnimationFrame(function () { panel.classList.add("show"); }); button.classList.add("on"); }
  function closePanel() {
    if (!isOpen()) return;
    panel.classList.remove("show");
    button.classList.remove("on");
    setTimeout(function () { if (!panel.classList.contains("show")) panel.hidden = true; }, 250);
  }

  function init() {
    panel = document.getElementById("settings");
    button = document.getElementById("btn-settings");
    button.addEventListener("click", function (e) {
      e.stopPropagation();
      if (isOpen()) closePanel(); else openPanel();
    });
    document.addEventListener("pointerdown", function (e) {
      if (isOpen() && !panel.contains(e.target) && !button.contains(e.target)) closePanel();
    });
    Array.prototype.forEach.call(panel.querySelectorAll("[data-lang]"), function (b) {
      b.addEventListener("click", function () {
        if (L.lang === b.getAttribute("data-lang")) return;
        L.lang = b.getAttribute("data-lang");
        applyLanguage();
        window.dispatchEvent(new Event("languagechange-app"));
      });
    });
    Array.prototype.forEach.call(panel.querySelectorAll("[data-theme]"), function (b) {
      b.addEventListener("click", function () {
        state.theme = b.getAttribute("data-theme");
        save();
        applyTheme();
      });
    });
    var range = document.getElementById("brightness");
    range.addEventListener("input", function () {
      state.brightness = +range.value;
      applyBrightness();
    });
    range.addEventListener("change", save);

    applyLanguage();
    applyTheme();
    applyBrightness();
    setInterval(applyTheme, 60000); // Auto mode follows the clock
  }

  window.Settings = {
    effectiveTheme: effectiveTheme,
    isOpen: isOpen,
    closePanel: closePanel
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
