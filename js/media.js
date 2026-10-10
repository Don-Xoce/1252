/*
 * Full-screen viewer for videos, PDFs, pictures and slide galleries.
 * Plain HTML on top of the 3-D scene: it plays videos smoothly even on slow smart boards.
 */
(function () {
  "use strict";

  var L = window.I18N;

  var root, stage, titleEl, counterEl, prevBtn, nextBtn, closeBtn;
  var current = null;   // { page, index, count, pdf, renderTask }
  var onCloseCb = null;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Could not load " + src)); };
      document.head.appendChild(s);
    });
  }

  var pdfReady = null;
  function loadPdfJs() {
    if (!pdfReady) {
      var scripts = [loadScript("vendor/pdf.min.js")];
      // Opened straight from a USB stick (file://): browsers block background workers,
      // so PDF.js runs its worker code on the page instead.
      if (location.protocol === "file:") scripts.push(loadScript("vendor/pdf.worker.min.js"));
      pdfReady = Promise.all(scripts).then(function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
        return window.pdfjsLib;
      });
    }
    return pdfReady;
  }

  function build() {
    root = el("div", "viewer");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    var bar = el("div", "viewer-bar");
    titleEl = el("div", "viewer-title");
    var close = el("button", "btn", "");
    closeBtn = close;
    close.addEventListener("click", function () { api.close(); });
    bar.appendChild(titleEl);
    bar.appendChild(close);

    stage = el("div", "viewer-stage");

    var nav = el("div", "viewer-nav");
    prevBtn = el("button", "btn", "");
    nextBtn = el("button", "btn", "");
    counterEl = el("div", "viewer-count");
    prevBtn.addEventListener("click", function () { api.step(-1); });
    nextBtn.addEventListener("click", function () { api.step(1); });
    nav.appendChild(prevBtn);
    nav.appendChild(counterEl);
    nav.appendChild(nextBtn);

    root.appendChild(bar);
    root.appendChild(stage);
    root.appendChild(nav);
    document.body.appendChild(root);
  }

  function setNav(show) {
    root.classList.toggle("has-nav", !!show);
    if (show) {
      counterEl.textContent = (current.index + 1) + " / " + current.count;
      prevBtn.disabled = current.index <= 0;
      nextBtn.disabled = current.index >= current.count - 1;
    }
  }

  function message(text) {
    stage.innerHTML = "";
    stage.appendChild(el("div", "viewer-msg", text));
  }

  function showVideo(page) {
    var v = el("video");
    v.src = page.src;
    if (page.poster) v.poster = page.poster;
    v.controls = true;
    v.playsInline = true;
    v.preload = "auto";
    v.addEventListener("error", function () {
      message(L.t("videoError"));
    });
    stage.appendChild(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked: the controls are still there */ });
  }

  function showImage(src) {
    stage.innerHTML = "";
    var img = el("img");
    img.alt = "";
    img.src = src;
    img.onerror = function () { message(L.t("fileError")); };
    stage.appendChild(img);
  }

  function renderPdfPage() {
    var c = current;
    if (c.renderTask) { try { c.renderTask.cancel(); } catch (e) { /* ignore */ } }
    c.pdf.getPage(c.index + 1).then(function (pg) {
      if (current !== c) return;
      var base = pg.getViewport({ scale: 1 });
      var box = stage.getBoundingClientRect();
      var scale = Math.min(box.width / base.width, box.height / base.height);
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      var vp = pg.getViewport({ scale: scale * ratio });
      var canvas = el("canvas");
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      canvas.style.width = Math.floor(vp.width / ratio) + "px";
      canvas.style.height = Math.floor(vp.height / ratio) + "px";
      c.renderTask = pg.render({ canvasContext: canvas.getContext("2d"), viewport: vp });
      c.renderTask.promise.then(function () {
        if (current !== c) return;
        stage.innerHTML = "";
        stage.appendChild(canvas);
      }, function () { /* cancelled */ });
      setNav(true);
    });
  }

  function showPdf(page) {
    message(L.t("opening"));
    loadPdfJs()
      .then(function (pdfjsLib) { return pdfjsLib.getDocument(page.src).promise; })
      .then(function (pdf) {
        if (!current || current.page !== page) return;
        current.pdf = pdf;
        current.count = pdf.numPages;
        current.index = 0;
        renderPdfPage();
      })
      .catch(function () {
        if (!current || current.page !== page) return;
        // Fallback: let the browser's own PDF viewer show it.
        stage.innerHTML = "";
        var f = el("iframe");
        f.src = page.src;
        f.title = L.T(page.title) || "PDF";
        stage.appendChild(f);
      });
  }

  var api = {
    isOpen: function () { return !!current; },

    open: function (page, onClose) {
      if (!root) build();
      api.close(true);
      onCloseCb = onClose || null;
      current = { page: page, index: 0, count: 1 };
      titleEl.textContent = L.T(page.title);
      closeBtn.textContent = "\u2715 " + L.t("close");
      prevBtn.textContent = "\u25C0 " + L.t("back");
      nextBtn.textContent = L.t("next") + " \u25B6";
      stage.innerHTML = "";
      root.classList.add("open");
      setNav(false);
      if (page.type === "video") showVideo(page);
      else if (page.type === "image") showImage(page.src);
      else if (page.type === "gallery") {
        current.count = (page.images || []).length;
        showImage(page.images[0]);
        setNav(current.count > 1);
      } else if (page.type === "pdf") showPdf(page);
    },

    step: function (dir) {
      if (!current) return;
      var i = current.index + dir;
      if (i < 0 || i >= current.count) return;
      current.index = i;
      if (current.page.type === "gallery") {
        showImage(current.page.images[i]);
        setNav(true);
      } else if (current.pdf) {
        renderPdfPage();
      }
    },

    togglePlay: function () {
      var v = stage && stage.querySelector("video");
      if (!v) return false;
      if (v.paused) v.play(); else v.pause();
      return true;
    },

    close: function (silent) {
      if (!current) return;
      var v = stage.querySelector("video");
      if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
      if (current.pdf) current.pdf.destroy();
      current = null;
      stage.innerHTML = "";
      root.classList.remove("open");
      var cb = onCloseCb;
      onCloseCb = null;
      if (!silent && cb) cb();
    }
  };

  window.addEventListener("resize", function () {
    if (current && current.pdf) renderPdfPage();
  });

  window.MediaViewer = api;
})();
