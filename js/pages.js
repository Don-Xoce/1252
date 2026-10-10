/*
 * Draws every page, cover and tab onto 2-D canvases: white card-stock folders and white paper pages.
 * The 3-D scene (app.js) turns these canvases into textures.
 * All text comes from content.js / i18n.js in the chosen language.
 */
(function () {
  "use strict";

  var L = window.I18N;
  var T = L.T;

  var FONT = '"Inter", -apple-system, "SF Pro Display", "Segoe UI", Roboto, Arial, sans-serif';
  var PAGE_W = 1024, PAGE_H = 1344;
  var COVER_W = 640, COVER_H = 816;          // front cover (slightly shorter than the back)
  var PANEL_W = 640, PANEL_H = 840, TAB_H = 84; // back panel + its tab

  var INK = "#111113";
  var SOFT = "#6e6e73";
  var FAINT = "#d2d2d7";
  var GOOD = "#248a3d";
  var GOOD_BG = "#34c759";
  var BAD = "#d70015";
  var BAD_BG = "#ff3b30";

  // ---------- helpers ----------

  function makeCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function hexToRgb(hex) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function alpha(hex, a) {
    var rgb = hexToRgb(hex);
    return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")";
  }

  function font(size, weight, style) {
    return (style || "") + " " + (weight || 400) + " " + Math.round(size) + "px " + FONT;
  }

  function wrap(ctx, text, maxW) {
    var words = String(text).split(/\s+/);
    var lines = [];
    var line = "";
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // Draws wrapped text and returns the y below it. dry = measure only.
  function textBlock(ctx, text, x, y, maxW, size, lineH, opts, dry) {
    opts = opts || {};
    ctx.font = font(size, opts.weight, opts.style);
    var lines = wrap(ctx, text, maxW);
    if (!dry) {
      ctx.fillStyle = opts.color || INK;
      ctx.textAlign = opts.align || "left";
      ctx.textBaseline = "alphabetic";
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, y + size + i * lineH);
      }
    }
    return y + (lines.length - 1) * lineH + size * 1.25;
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function pill(ctx, x, y, w, h, fill, stroke, lw) {
    roundRect(ctx, x, y, w, h, h / 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 3; ctx.stroke(); }
  }

  function shadowOn(ctx, blur, y, a) {
    ctx.shadowColor = "rgba(0,0,0," + (a == null ? 0.18 : a) + ")";
    ctx.shadowBlur = blur;
    ctx.shadowOffsetY = y || 0;
  }
  function shadowOff(ctx) {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  // Fine paper grain (also hides colour banding).
  var grain = null;
  function grainPattern(ctx) {
    if (!grain) {
      grain = makeCanvas(160, 160);
      var g = grain.getContext("2d");
      var img = g.createImageData(160, 160);
      for (var i = 0; i < img.data.length; i += 4) {
        var v = 128 + (Math.random() - 0.5) * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      // a few longer paper fibres
      g.globalAlpha = 0.25;
      for (var f = 0; f < 60; f++) {
        g.strokeStyle = Math.random() > 0.5 ? "#fff" : "#000";
        g.lineWidth = 0.6;
        g.beginPath();
        var x = Math.random() * 160, y = Math.random() * 160, a = Math.random() * Math.PI;
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10);
        g.stroke();
      }
    }
    return ctx.createPattern(grain, "repeat");
  }

  // A sheet of paper or card stock: base tone, soft light from the top-left, grain, and a crisp edge.
  function paper(ctx, x, y, w, h, r, base, opts) {
    opts = opts || {};
    ctx.save();
    roundRect(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.fillStyle = base;
    ctx.fillRect(x, y, w, h);
    var light = ctx.createLinearGradient(x, y, x + w * 0.7, y + h);
    light.addColorStop(0, "rgba(255,255,255,0.55)");
    light.addColorStop(0.5, "rgba(255,255,255,0)");
    light.addColorStop(1, "rgba(0,0,0," + (opts.shade == null ? 0.06 : opts.shade) + ")");
    ctx.fillStyle = light;
    ctx.fillRect(x, y, w, h);
    // slightly darker towards the edges, like real paper
    var vig = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.05)");
    ctx.fillStyle = vig;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = opts.grain == null ? 0.045 : opts.grain;
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,0.10)";
    ctx.lineWidth = 2;
    roundRect(ctx, x + 1, y + 1, w - 2, h - 2, r);
    ctx.stroke();
  }

  function dot(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function bulletIcon(ctx, kind, x, cy, r, n) {
    ctx.save();
    if (kind === "check" || kind === "cross") {
      dot(ctx, x, cy, r, kind === "check" ? GOOD_BG : BAD_BG);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = r * 0.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      if (kind === "check") {
        ctx.moveTo(x - r * 0.42, cy + r * 0.02);
        ctx.lineTo(x - r * 0.1, cy + r * 0.34);
        ctx.lineTo(x + r * 0.45, cy - r * 0.32);
      } else {
        ctx.moveTo(x - r * 0.33, cy - r * 0.33);
        ctx.lineTo(x + r * 0.33, cy + r * 0.33);
        ctx.moveTo(x + r * 0.33, cy - r * 0.33);
        ctx.lineTo(x - r * 0.33, cy + r * 0.33);
      }
      ctx.stroke();
    } else if (kind === "number") {
      dot(ctx, x, cy, r, INK);
      ctx.fillStyle = "#fff";
      ctx.font = font(r * 1.05, 700);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n), x, cy + r * 0.05);
    } else {
      dot(ctx, x, cy, r * 0.3, INK);
    }
    ctx.restore();
  }

  // A clean line-art puppet hanging from its control bar.
  function drawPuppet(ctx, cx, top, s, color) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = 8 * s;
    ctx.beginPath();
    ctx.moveTo(cx - 120 * s, top);
    ctx.lineTo(cx + 120 * s, top);
    ctx.moveTo(cx, top - 46 * s);
    ctx.lineTo(cx, top + 46 * s);
    ctx.stroke();
    var headY = top + 230 * s;
    var bodyY = top + 345 * s;
    ctx.lineWidth = 2 * s;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(cx - 115 * s, top); ctx.lineTo(cx - 98 * s, bodyY - 74 * s);
    ctx.moveTo(cx + 115 * s, top); ctx.lineTo(cx + 98 * s, bodyY - 74 * s);
    ctx.moveTo(cx, top + 42 * s); ctx.lineTo(cx, headY - 58 * s);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 6 * s;
    ctx.fillStyle = "rgba(0,0,0,0.04)";
    ctx.beginPath();
    ctx.moveTo(cx - 48 * s, bodyY - 22 * s); ctx.lineTo(cx - 98 * s, bodyY - 74 * s);
    ctx.moveTo(cx + 48 * s, bodyY - 22 * s); ctx.lineTo(cx + 98 * s, bodyY - 74 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, bodyY + 30 * s, 70 * s, 92 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, headY, 56 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function pad2(n) { return n < 10 ? "0" + n : String(n); }

  // ---------- page frame ----------

  var M = 18;                 // transparent margin around the sheet
  var LEFT = 96;
  var WIDTH = PAGE_W - LEFT * 2;
  var CONTENT_TOP = 150;
  var CONTENT_BOTTOM = PAGE_H - 130;

  function pageBase(ctx, folder, info) {
    paper(ctx, M, M, PAGE_W - 2 * M, PAGE_H - 2 * M, 14, "#fbfbf9", { shade: 0.04, grain: 0.04 });

    // header: colour dot + folder name
    dot(ctx, LEFT + 8, 92, 8, folder.color);
    ctx.fillStyle = SOFT;
    ctx.font = font(26, 600);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(L.t("file") + " " + pad2(info.folderIndex + 1) + "  ·  " + T(folder.tab).toUpperCase(), LEFT + 28, 93);
    ctx.textBaseline = "alphabetic";

    // footer: page dots
    var n = info.pageCount;
    var d = 12, gap = 12, wide = 34;
    var total = (n - 1) * (d + gap) + wide;
    var x0 = PAGE_W / 2 - total / 2;
    for (var i = 0; i < n; i++) {
      var on = i === info.pageIndex;
      pill(ctx, x0, PAGE_H - 88, on ? wide : d, d, on ? INK : FAINT);
      x0 += (on ? wide : d) + gap;
    }
  }

  // Runs draw(scale, dry) with the biggest text that still fits (easier to read on a smart board).
  function fit(ctx, draw, maxY) {
    var s = 1.3;
    while (s > 0.55 && draw(s, true) > maxY) s -= 0.05;
    draw(s, false);
  }

  function accentBar(ctx, folder, y, x) {
    pill(ctx, x == null ? LEFT : x, y, 64, 8, folder.color);
  }

  // ---------- page types ----------

  var drawers = {};

  drawers.title = function (ctx, page, folder, info) {
    var cx = PAGE_W / 2;
    drawPuppet(ctx, cx, 230, 0.95, INK);
    fit(ctx, function (s, dry) {
      var y = 700;
      y = textBlock(ctx, T(page.title), cx, y, WIDTH, 100 * s, 108 * s, { weight: 800, align: "center" }, dry);
      y += 22 * s;
      if (page.subtitle) y = textBlock(ctx, T(page.subtitle), cx, y, WIDTH - 40, 44 * s, 56 * s, { color: SOFT, align: "center" }, dry);
      var note = T(page.note) || (info.folderIndex === 0 && info.pageIndex === 0 ? T(window.PRESENTATION.presenter) : "");
      if (note) {
        y += 44 * s;
        ctx.font = font(36 * s, 600);
        var w = ctx.measureText(note).width + 72 * s;
        if (!dry) {
          pill(ctx, cx - w / 2, y, w, 76 * s, INK);
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(note, cx, y + 39 * s);
          ctx.textBaseline = "alphabetic";
        }
        y += 76 * s;
      }
      return y;
    }, CONTENT_BOTTOM);
  };

  drawers.text = function (ctx, page, folder) {
    var icon = page.icon || "dot";
    fit(ctx, function (s, dry) {
      var y = CONTENT_TOP + 20;
      if (page.title) y = textBlock(ctx, T(page.title), LEFT, y, WIDTH, 78 * s, 86 * s, { weight: 800 }, dry);
      if (!dry) accentBar(ctx, folder, y + 6);
      y += 56 * s;
      if (page.text) {
        y = textBlock(ctx, T(page.text), LEFT, y, WIDTH, 46 * s, 62 * s, { color: SOFT }, dry);
        y += 36 * s;
      }
      var list = page.bullets || [];
      var r = 27 * s;
      for (var i = 0; i < list.length; i++) {
        var textX = LEFT + r * 2 + 30;
        ctx.font = font(46 * s, 600);
        var lines = wrap(ctx, T(list[i]), WIDTH - (textX - LEFT));
        var blockH = lines.length * 60 * s;
        if (!dry) {
          bulletIcon(ctx, icon, LEFT + r, y + 30 * s, r, i + 1);
          ctx.fillStyle = INK;
          ctx.textAlign = "left";
          for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], textX, y + 46 * s + j * 60 * s);
        }
        y += blockH + 32 * s;
      }
      return y;
    }, CONTENT_BOTTOM);
  };

  drawers.quotes = function (ctx, page, folder) {
    var color = page.good === false ? BAD_BG : GOOD_BG;
    fit(ctx, function (s, dry) {
      var y = CONTENT_TOP + 20;
      y = textBlock(ctx, T(page.title), LEFT, y, WIDTH, 78 * s, 86 * s, { weight: 800 }, dry);
      if (!dry) accentBar(ctx, folder, y + 6);
      y += 58 * s;
      var quotes = page.quotes || [];
      for (var i = 0; i < quotes.length; i++) {
        var indent = i % 2 ? 80 : 0;
        var w = WIDTH - 80;
        var x = LEFT + indent;
        ctx.font = font(44 * s, 600);
        var lines = wrap(ctx, "“" + T(quotes[i]) + "”", w - 90);
        var h = lines.length * 56 * s + 56 * s;
        if (!dry) {
          shadowOn(ctx, 18, 6, 0.08);
          roundRect(ctx, x, y, w, h, 28);
          ctx.fillStyle = "#f4f4f2";
          ctx.fill();
          shadowOff(ctx);
          pill(ctx, x + 20, y + 18, 8, h - 36, color);
          ctx.fillStyle = INK;
          ctx.font = font(44 * s, 600);
          ctx.textAlign = "left";
          for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], x + 52, y + 28 * s + 42 * s + j * 56 * s);
        }
        y += h + 28 * s;
      }
      return y;
    }, CONTENT_BOTTOM);
  };

  drawers.compare = function (ctx, page, folder) {
    fit(ctx, function (s, dry) {
      var y = CONTENT_TOP + 20;
      y = textBlock(ctx, T(page.title), LEFT, y, WIDTH, 74 * s, 82 * s, { weight: 800 }, dry);
      if (!dry) accentBar(ctx, folder, y + 6);
      y += 46 * s;
      var colW = (WIDTH - 22) / 2;
      var xs = [LEFT, LEFT + colW + 22];
      var heads = [T(page.left) || L.t("leader"), T(page.right) || L.t("manipulator")];
      var cols = [GOOD_BG, BAD_BG];
      for (var c = 0; c < 2; c++) {
        if (!dry) {
          pill(ctx, xs[c], y, colW, 76 * s, cols[c]);
          ctx.fillStyle = "#fff";
          ctx.font = font(40 * s, 700);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(heads[c], xs[c] + colW / 2, y + 39 * s);
          ctx.textBaseline = "alphabetic";
        }
      }
      y += 100 * s;
      var rows = page.rows || [];
      for (var i = 0; i < rows.length; i++) {
        if (!dry) {
          ctx.fillStyle = SOFT;
          ctx.font = font(25 * s, 700);
          ctx.textAlign = "left";
          ctx.fillText(T(rows[i][0]).toUpperCase(), LEFT + 8, y + 26 * s);
        }
        y += 38 * s;
        ctx.font = font(37 * s, 500);
        var l1 = wrap(ctx, T(rows[i][1]), colW - 44);
        var l2 = wrap(ctx, T(rows[i][2]), colW - 44);
        var h = Math.max(l1.length, l2.length) * 47 * s + 34 * s;
        if (!dry) {
          [l1, l2].forEach(function (lines, c) {
            roundRect(ctx, xs[c], y, colW, h, 18);
            ctx.fillStyle = c ? "rgba(255,59,48,0.08)" : "rgba(52,199,89,0.10)";
            ctx.fill();
            ctx.fillStyle = INK;
            ctx.font = font(37 * s, 500);
            ctx.textAlign = "left";
            for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], xs[c] + 22, y + 17 * s + 36 * s + j * 47 * s);
          });
        }
        y += h + 18 * s;
      }
      return y;
    }, CONTENT_BOTTOM);
  };

  drawers.quiz = function (ctx, page, folder, info) {
    var good = /^leader/i.test(page.answer || "");
    fit(ctx, function (s, dry) {
      var y = CONTENT_TOP + 20;
      y = textBlock(ctx, T(page.title), LEFT, y, WIDTH, 70 * s, 78 * s, { weight: 800 }, dry);
      if (!dry) accentBar(ctx, folder, y + 6);
      y += 56 * s;
      ctx.font = font(48 * s, 600);
      var lines = wrap(ctx, T(page.scenario), WIDTH - 110);
      var h = lines.length * 62 * s + 84 * s;
      if (!dry) {
        shadowOn(ctx, 24, 8, 0.08);
        roundRect(ctx, LEFT, y, WIDTH, h, 32);
        ctx.fillStyle = "#f4f4f2";
        ctx.fill();
        shadowOff(ctx);
        ctx.fillStyle = FAINT;
        ctx.font = font(150, 800);
        ctx.textAlign = "left";
        ctx.fillText("“", LEFT + 14, y + 116);
        ctx.fillStyle = INK;
        ctx.font = font(48 * s, 600);
        for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], LEFT + 60, y + 42 * s + 48 * s + j * 62 * s);
      }
      y += h + 70 * s;

      var bw = (WIDTH - 36) / 2;
      var bh = 112 * s;
      if (!info.revealed) {
        if (!dry) {
          [[L.t("leader"), GOOD, LEFT], [L.t("manipulator"), BAD, LEFT + bw + 36]].forEach(function (b) {
            pill(ctx, b[2], y, bw, bh, null, b[1], 4);
            ctx.fillStyle = b[1];
            ctx.font = font(42 * s, 700);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(b[0] + "?", b[2] + bw / 2, y + bh / 2);
            ctx.textBaseline = "alphabetic";
          });
          ctx.fillStyle = SOFT;
          textBlock(ctx, L.t("quizPrompt"), PAGE_W / 2, y + bh + 40 * s, WIDTH, 32 * s, 42 * s, { align: "center", color: SOFT, style: "italic" });
        }
        y += bh + 120 * s;
      } else {
        if (!dry) {
          var label = L.t(good ? "leader" : "manipulator").toUpperCase();
          ctx.font = font(70 * s, 800);
          var bwid = Math.max(560 * s, ctx.measureText("✔ " + label).width + 120 * s);
          var bhei = 144 * s;
          shadowOn(ctx, 30, 10, 0.18);
          pill(ctx, PAGE_W / 2 - bwid / 2, y, bwid, bhei, good ? GOOD_BG : BAD_BG);
          shadowOff(ctx);
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText((good ? "✔ " : "✖ ") + label, PAGE_W / 2, y + bhei / 2 + 2);
          ctx.textBaseline = "alphabetic";
        }
        y += 194 * s;
        if (page.why) y = textBlock(ctx, T(page.why), PAGE_W / 2, y, WIDTH - 40, 48 * s, 62 * s, { align: "center", color: INK, weight: 600 }, dry);
      }
      return y;
    }, CONTENT_BOTTOM);
  };

  drawers.big = function (ctx, page) {
    var cx = PAGE_W / 2;
    var text = T(page.text), small = T(page.small);
    var measure = function (s) {
      var y = textBlock(ctx, text, cx, 0, WIDTH, 92 * s, 104 * s, { weight: 800, align: "center" }, true);
      if (small) y = textBlock(ctx, small, cx, y + 60 * s, WIDTH - 40, 44 * s, 58 * s, { align: "center" }, true);
      return y;
    };
    var s = 1.2;
    while (s > 0.55 && measure(s) > CONTENT_BOTTOM - CONTENT_TOP - 220) s -= 0.05;
    var total = measure(s);
    var y = CONTENT_TOP + (CONTENT_BOTTOM - CONTENT_TOP - total) / 2 + 50;
    // three threads coming down from the top
    for (var k = -1; k <= 1; k++) {
      var sx = cx + k * 170;
      var g = ctx.createLinearGradient(0, 130, 0, y - 60);
      g.addColorStop(0, "rgba(17,17,19,0)");
      g.addColorStop(1, "rgba(17,17,19,0.5)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, 130);
      ctx.lineTo(sx, y - 60);
      ctx.stroke();
      dot(ctx, sx, y - 60, 7, INK);
    }
    y = textBlock(ctx, text, cx, y, WIDTH, 92 * s, 104 * s, { weight: 800, align: "center" }, false);
    if (small) textBlock(ctx, small, cx, y + 60 * s, WIDTH - 40, 44 * s, 58 * s, { align: "center", color: SOFT }, false);
  };

  function mediaIcon(ctx, type, cx, cy, size) {
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = size * 0.06;
    ctx.lineJoin = "round";
    if (type === "video") {
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.17, cy - size * 0.27);
      ctx.lineTo(cx + size * 0.3, cy);
      ctx.lineTo(cx - size * 0.17, cy + size * 0.27);
      ctx.closePath();
      ctx.fill();
    } else if (type === "pdf") {
      roundRect(ctx, cx - size * 0.35, cy - size * 0.45, size * 0.7, size * 0.9, size * 0.08);
      ctx.stroke();
      ctx.font = font(size * 0.26, 700);
      ctx.textAlign = "center";
      ctx.fillText("PDF", cx, cy + size * 0.1);
    } else {
      for (var k = (type === "gallery" ? 2 : 0); k >= 0; k--) {
        var o = k * size * 0.1;
        ctx.fillStyle = k ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.9)";
        roundRect(ctx, cx - size * 0.45 + o, cy - size * 0.32 - o, size * 0.9, size * 0.64, size * 0.08);
        ctx.fill();
      }
      ctx.fillStyle = "#3a3a3c";
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.35, cy + size * 0.22);
      ctx.lineTo(cx - size * 0.08, cy - size * 0.1);
      ctx.lineTo(cx + size * 0.12, cy + size * 0.1);
      ctx.lineTo(cx + size * 0.22, cy);
      ctx.lineTo(cx + size * 0.35, cy + size * 0.22);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMedia(ctx, page, folder) {
    var y = CONTENT_TOP + 20;
    y = textBlock(ctx, T(page.title), LEFT, y, WIDTH, 70, 78, { weight: 800 });
    accentBar(ctx, folder, y + 6);
    y += 58;
    var w = WIDTH, h = Math.round(WIDTH * 9 / 16);
    if (page.type === "pdf") h = Math.round(WIDTH * 0.75);
    ctx.save();
    shadowOn(ctx, 40, 16, 0.25);
    roundRect(ctx, LEFT, y, w, h, 24);
    ctx.fillStyle = "#000";
    ctx.fill();
    shadowOff(ctx);
    ctx.clip();
    var img = page._img;
    if (img) {
      var r = Math.max(w / img.width, h / img.height);
      var iw = img.width * r, ih = img.height * r;
      try { ctx.drawImage(img, LEFT + (w - iw) / 2, y + (h - ih) / 2, iw, ih); } catch (e) { /* ignore */ }
    } else {
      var g = ctx.createRadialGradient(PAGE_W / 2, y + h / 2, 10, PAGE_W / 2, y + h / 2, w * 0.6);
      g.addColorStop(0, "#3a3a3c");
      g.addColorStop(1, "#000");
      ctx.fillStyle = g;
      ctx.fillRect(LEFT, y, w, h);
    }
    ctx.restore();
    if (page.type === "video" || !img) mediaIcon(ctx, page.type, PAGE_W / 2, y + h / 2, 170);
    y += h + 56;
    if (page.caption) y = textBlock(ctx, T(page.caption), PAGE_W / 2, y, WIDTH, 46, 60, { align: "center", weight: 600 });
    textBlock(ctx, L.t(page.type === "video" ? "hintVideo" : "hintOpen"), PAGE_W / 2, y + 16, WIDTH, 32, 42,
      { align: "center", color: SOFT, style: "italic" });
  }

  drawers.video = drawers.pdf = drawers.image = drawers.gallery = drawMedia;

  // ---------- folder parts ----------

  var STOCK = "#f2f1ec";        // outside of the folder (card stock)
  var STOCK_IN = "#e8e6df";     // inside of the folder

  // Two faint score lines near the bottom, like a real file folder.
  function scoreLines(ctx, w, h) {
    ctx.strokeStyle = "rgba(0,0,0,0.07)";
    ctx.lineWidth = 2;
    [h - 70, h - 52].forEach(function (y) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    });
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1;
    [h - 68, h - 50].forEach(function (y) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    });
  }

  function drawCover(folder, index) {
    var c = makeCanvas(COVER_W, COVER_H);
    var ctx = c.getContext("2d");
    paper(ctx, 4, 4, COVER_W - 8, COVER_H - 8, 10, STOCK, { shade: 0.08, grain: 0.06 });
    scoreLines(ctx, COVER_W, COVER_H);

    // printed label sticker
    var lx = 56, ly = 150, lw = COVER_W - 112, lh = 330;
    shadowOn(ctx, 10, 3, 0.12);
    roundRect(ctx, lx, ly, lw, lh, 10);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    shadowOff(ctx);
    ctx.save();
    roundRect(ctx, lx, ly, lw, lh, 10);
    ctx.clip();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(lx, ly, lw, lh);
    ctx.restore();

    dot(ctx, lx + 40, ly + 50, 9, folder.color);
    ctx.fillStyle = SOFT;
    ctx.font = font(24, 600);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(L.t("file") + " " + pad2(index + 1), lx + 60, ly + 51);
    ctx.textBaseline = "alphabetic";

    var title = T(folder.title);
    var size = 58;
    ctx.font = font(size, 800);
    while (wrap(ctx, title, lw - 80).length > 3 && size > 34) {
      size -= 4;
      ctx.font = font(size, 800);
    }
    var y = textBlock(ctx, title, lx + 40, ly + 92, lw - 80, size, size * 1.12, { weight: 800 });
    if (folder.subtitle) textBlock(ctx, T(folder.subtitle), lx + 40, y + 6, lw - 80, 28, 36, { color: SOFT, weight: 500 });

    // page count, printed small at the bottom
    ctx.fillStyle = SOFT;
    ctx.font = font(24, 600);
    ctx.textAlign = "left";
    ctx.fillText(L.pages((folder.pages || []).length).toUpperCase(), 56, COVER_H - 100);
    return c;
  }

  function drawCoverInside(folder) {
    var c = makeCanvas(COVER_W, COVER_H);
    var ctx = c.getContext("2d");
    paper(ctx, 4, 4, COVER_W - 8, COVER_H - 8, 10, STOCK_IN, { shade: 0.06, grain: 0.06 });
    ctx.fillStyle = INK;
    ctx.font = font(42, 800);
    ctx.textAlign = "left";
    ctx.fillText(L.t("inThisFile"), 60, 120);
    accentBar(ctx, folder, 144, 60);
    var y = 222;
    (folder.pages || []).forEach(function (p, i) {
      if (y > COVER_H - 80) return;
      var label = p.type === "quiz" ? L.t("question", { n: i + 1 }) : (T(p.title) || T(p.text) || p.type);
      dot(ctx, 80, y - 10, 20, "rgba(0,0,0,0.07)");
      ctx.fillStyle = INK;
      ctx.font = font(22, 700);
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), 80, y - 2);
      ctx.textAlign = "left";
      ctx.font = font(28, 500);
      ctx.fillStyle = "#3a3a3c";
      var line = wrap(ctx, label, COVER_W - 200)[0];
      if (line !== label) line += "…";
      ctx.fillText(line, 118, y);
      y += 60;
    });
    return c;
  }

  // Back panel of the folder with its tab sticking up. Height = PANEL_H + TAB_H.
  // side "out" = the outside (seen from behind), "in" = the inside (seen when the folder is open).
  function drawPanel(folder, index, side) {
    var c = makeCanvas(PANEL_W, PANEL_H + TAB_H);
    var ctx = c.getContext("2d");
    var tabW = 250;
    var tabX = 40 + (index % 3) * 170;
    if (side === "out") tabX = PANEL_W - tabX - tabW; // mirrored when seen from behind
    var base = side === "out" ? STOCK : STOCK_IN;
    // tab + body as one sheet
    ctx.save();
    ctx.beginPath();
    var r = 18, bodyTop = TAB_H;
    ctx.moveTo(4, bodyTop + 10);
    ctx.arcTo(4, bodyTop, 14, bodyTop, 10);
    ctx.lineTo(tabX - 14, bodyTop);
    ctx.quadraticCurveTo(tabX, bodyTop, tabX + 6, bodyTop - 20);
    ctx.lineTo(tabX + 14, 4 + r);
    ctx.arcTo(tabX + 18, 4, tabX + 18 + r, 4, r);
    ctx.lineTo(tabX + tabW - 18 - r, 4);
    ctx.arcTo(tabX + tabW - 18, 4, tabX + tabW - 14, 4 + r, r);
    ctx.lineTo(tabX + tabW - 6, bodyTop - 20);
    ctx.quadraticCurveTo(tabX + tabW, bodyTop, tabX + tabW + 14, bodyTop);
    ctx.lineTo(PANEL_W - 14, bodyTop);
    ctx.arcTo(PANEL_W - 4, bodyTop, PANEL_W - 4, bodyTop + 10, 10);
    ctx.lineTo(PANEL_W - 4, PANEL_H + TAB_H - 14);
    ctx.arcTo(PANEL_W - 4, PANEL_H + TAB_H - 4, PANEL_W - 14, PANEL_H + TAB_H - 4, 10);
    ctx.lineTo(14, PANEL_H + TAB_H - 4);
    ctx.arcTo(4, PANEL_H + TAB_H - 4, 4, PANEL_H + TAB_H - 14, 10);
    ctx.closePath();
    ctx.clip();
    paper(ctx, 0, 0, PANEL_W, PANEL_H + TAB_H, 0, base, { shade: 0.08, grain: 0.06 });
    ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,0.10)";
    ctx.lineWidth = 2;
    // tab label: colour dot + name
    var name = T(folder.tab);
    var size = 30;
    ctx.font = font(size, 700);
    while (ctx.measureText(name).width > tabW - 80 && size > 18) {
      size -= 2;
      ctx.font = font(size, 700);
    }
    var tw = ctx.measureText(name).width;
    var startX = tabX + tabW / 2 - (tw + 28) / 2;
    dot(ctx, startX + 7, TAB_H / 2 + 4, 7, folder.color);
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(name, startX + 28, TAB_H / 2 + 5);
    ctx.textBaseline = "alphabetic";
    if (side === "out") scoreLines(ctx, PANEL_W, PANEL_H + TAB_H);
    return c;
  }

  function drawPageBack() {
    var c = makeCanvas(512, 672);
    var ctx = c.getContext("2d");
    paper(ctx, 9, 9, 494, 654, 7, "#f7f7f4", { shade: 0.05, grain: 0.05 });
    return c;
  }

  // Smooth round light (512px + grain so it never looks blocky).
  function drawGlow(color, a) {
    var c = makeCanvas(512, 512);
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    var steps = 12;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      // smooth "ease-out" falloff instead of a linear one
      g.addColorStop(t, alpha(color, (a || 1) * Math.pow(1 - t, 2.2)));
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(0, 0, 512, 512);
    return c;
  }

  // Fades a reflection out from top to bottom.
  function drawFade() {
    var c = makeCanvas(4, 256);
    var ctx = c.getContext("2d");
    var g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "rgb(255,255,255)");
    g.addColorStop(0.12, "rgb(150,150,150)");
    g.addColorStop(0.45, "rgb(30,30,30)");
    g.addColorStop(1, "rgb(0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    return c;
  }

  // A fine thread: solid at the bottom, fading upwards.
  function drawThread() {
    var c = makeCanvas(8, 256);
    var ctx = c.getContext("2d");
    var g = ctx.createLinearGradient(0, 256, 0, 0);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.5, "rgba(255,255,255,0.5)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(3, 0, 2, 256);
    return c;
  }

  window.PageArt = {
    PAGE_W: PAGE_W,
    PAGE_H: PAGE_H,
    COVER_RATIO: COVER_H / COVER_W,
    // where the tab sits across the top of the folder (0 = left edge, 1 = right edge)
    tabSpan: function (index) {
      var x = 40 + (index % 3) * 170;
      return [(x + 26) / PANEL_W, (x + 250 - 26) / PANEL_W];
    },
    PANEL_TAB_RATIO: TAB_H / PANEL_H,
    drawPage: function (page, folder, info) {
      var c = makeCanvas(PAGE_W, PAGE_H);
      var ctx = c.getContext("2d");
      pageBase(ctx, folder, info);
      (drawers[page.type] || drawers.text)(ctx, page, folder, info);
      return c;
    },
    drawPageBack: drawPageBack,
    drawCover: drawCover,
    drawCoverInside: drawCoverInside,
    drawPanel: drawPanel,
    drawGlow: drawGlow,
    drawFade: drawFade,
    drawThread: drawThread,
    isMedia: function (p) { return !!p && /^(video|pdf|image|gallery)$/.test(p.type); }
  };
})();
