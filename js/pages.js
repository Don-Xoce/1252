/*
 * Draws every page, cover and tab onto 2-D canvases.
 * The 3-D scene (app.js) turns these canvases into textures.
 */
(function () {
  "use strict";

  var SANS = '"Trebuchet MS", "Segoe UI", Verdana, Arial, sans-serif';
  var PAGE_W = 1024, PAGE_H = 1344;
  var COVER_W = 640, COVER_H = 840;

  var INK = "#231d16";
  var SOFT_INK = "#5b5145";
  var PAPER = "#f6efdf";
  var GOOD = "#2f8a4f";
  var BAD = "#c2412f";
  var GOLD = "#c8913a";

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

  // amount < 0 darkens toward black, > 0 lightens toward white
  function shade(hex, amount) {
    var rgb = hexToRgb(hex);
    var t = amount < 0 ? 0 : 255;
    var p = Math.abs(amount);
    return "rgb(" + rgb.map(function (v) { return Math.round(v + (t - v) * p); }).join(",") + ")";
  }

  function alpha(hex, a) {
    var rgb = hexToRgb(hex);
    return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")";
  }

  function font(size, weight, style) {
    return (style || "") + " " + (weight || "normal") + " " + Math.round(size) + "px " + SANS;
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
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function bulletIcon(ctx, kind, x, cy, r, n, color) {
    ctx.save();
    if (kind === "check" || kind === "cross") {
      ctx.fillStyle = kind === "check" ? GOOD : BAD;
      ctx.beginPath();
      ctx.arc(x, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = r * 0.28;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      if (kind === "check") {
        ctx.moveTo(x - r * 0.45, cy + r * 0.02);
        ctx.lineTo(x - r * 0.1, cy + r * 0.38);
        ctx.lineTo(x + r * 0.5, cy - r * 0.35);
      } else {
        ctx.moveTo(x - r * 0.38, cy - r * 0.38);
        ctx.lineTo(x + r * 0.38, cy + r * 0.38);
        ctx.moveTo(x + r * 0.38, cy - r * 0.38);
        ctx.lineTo(x - r * 0.38, cy + r * 0.38);
      }
      ctx.stroke();
    } else if (kind === "number") {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = font(r * 1.15, "bold");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n), x, cy + r * 0.05);
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, cy, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // A little puppet like the ones in the video, hanging from a control bar.
  function drawPuppet(ctx, cx, top, scale, color, strings) {
    var s = scale;
    ctx.save();
    ctx.lineCap = "round";
    // control bar (the cross the puppeteer holds)
    ctx.strokeStyle = shade(color, -0.45);
    ctx.lineWidth = 12 * s;
    ctx.beginPath();
    ctx.moveTo(cx - 120 * s, top);
    ctx.lineTo(cx + 120 * s, top);
    ctx.moveTo(cx, top - 50 * s);
    ctx.lineTo(cx, top + 50 * s);
    ctx.stroke();

    var headY = top + 230 * s;
    var bodyY = top + 340 * s;
    // strings
    if (strings !== false) {
      ctx.strokeStyle = alpha("#3a3026", 0.55);
      ctx.lineWidth = 2.5 * s;
      ctx.beginPath();
      ctx.moveTo(cx - 115 * s, top); ctx.lineTo(cx - 95 * s, bodyY - 70 * s);
      ctx.moveTo(cx + 115 * s, top); ctx.lineTo(cx + 95 * s, bodyY - 70 * s);
      ctx.moveTo(cx, top + 45 * s); ctx.lineTo(cx, headY - 55 * s);
      ctx.stroke();
    }
    // arms up
    ctx.strokeStyle = color;
    ctx.lineWidth = 26 * s;
    ctx.beginPath();
    ctx.moveTo(cx - 50 * s, bodyY - 20 * s); ctx.lineTo(cx - 95 * s, bodyY - 70 * s);
    ctx.moveTo(cx + 50 * s, bodyY - 20 * s); ctx.lineTo(cx + 95 * s, bodyY - 70 * s);
    ctx.stroke();
    // body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, bodyY + 30 * s, 72 * s, 95 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // head
    ctx.beginPath();
    ctx.arc(cx, headY, 58 * s, 0, Math.PI * 2);
    ctx.fill();
    // soft highlight
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.arc(cx - 18 * s, headY - 18 * s, 22 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function paperBase(ctx, folder, info) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    // gentle edge shading so the page feels like paper
    var g = ctx.createRadialGradient(PAGE_W / 2, PAGE_H / 2, PAGE_H * 0.3, PAGE_W / 2, PAGE_H / 2, PAGE_H * 0.8);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(120,90,40,0.12)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // header strip
    ctx.fillStyle = folder.color;
    ctx.fillRect(0, 0, PAGE_W, 18);
    ctx.fillStyle = SOFT_INK;
    ctx.font = font(30, "bold");
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    var label = "FILE " + pad2(info.folderIndex + 1) + "  ·  " + folder.tab.toUpperCase();
    ctx.fillText(label, 80, 82);

    // footer
    ctx.strokeStyle = alpha("#000000", 0.1);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, PAGE_H - 92);
    ctx.lineTo(PAGE_W - 80, PAGE_H - 92);
    ctx.stroke();
    ctx.font = font(28);
    ctx.fillStyle = SOFT_INK;
    ctx.textAlign = "right";
    ctx.fillText("Page " + (info.pageIndex + 1) + " of " + info.pageCount, PAGE_W - 80, PAGE_H - 48);
    ctx.textAlign = "left";
    ctx.fillText(window.PRESENTATION.title, 80, PAGE_H - 48);
  }

  function pad2(n) { return n < 10 ? "0" + n : String(n); }

  // Runs draw(scale, dry) with the biggest text that still fits (easier to read on a smart board).
  function fit(ctx, draw, maxY) {
    var s = 1.3;
    while (s > 0.55 && draw(s, true) > maxY) s -= 0.05;
    draw(s, false);
  }

  var CONTENT_TOP = 130;
  var CONTENT_BOTTOM = PAGE_H - 120;
  var LEFT = 80;
  var WIDTH = PAGE_W - 160;

  // ---------- page types ----------

  var drawers = {};

  drawers.title = function (ctx, page, folder) {
    var cx = PAGE_W / 2;
    drawPuppet(ctx, cx, 220, 1, "#d6a75c");
    fit(ctx, function (s, dry) {
      var y = 720;
      y = textBlock(ctx, page.title, cx, y, WIDTH, 96 * s, 104 * s, { weight: "bold", align: "center" }, dry);
      y += 26 * s;
      if (page.subtitle) y = textBlock(ctx, page.subtitle, cx, y, WIDTH - 60, 48 * s, 60 * s, { color: SOFT_INK, align: "center" }, dry);
      var note = page.note || (folder === window.PRESENTATION.folders[0] ? window.PRESENTATION.presenter : "");
      if (note) {
        y += 40 * s;
        y = textBlock(ctx, note, cx, y, WIDTH, 44 * s, 54 * s, { color: GOLD, weight: "bold", align: "center" }, dry);
      }
      return y;
    }, CONTENT_BOTTOM);
  };

  drawers.text = function (ctx, page, folder) {
    var icon = page.icon || "dot";
    fit(ctx, function (s, dry) {
      var y = CONTENT_TOP + 20;
      if (page.title) y = textBlock(ctx, page.title, LEFT, y, WIDTH, 76 * s, 84 * s, { weight: "bold" }, dry);
      if (!dry) {
        ctx.fillStyle = folder.color;
        ctx.fillRect(LEFT, y + 6, 120, 8);
      }
      y += 50 * s;
      if (page.text) {
        y = textBlock(ctx, page.text, LEFT, y, WIDTH, 48 * s, 64 * s, {}, dry);
        y += 36 * s;
      }
      var list = page.bullets || [];
      var r = 26 * s;
      for (var i = 0; i < list.length; i++) {
        var textX = LEFT + r * 2 + 28;
        ctx.font = font(46 * s);
        var lines = wrap(ctx, list[i], WIDTH - (textX - LEFT));
        var blockH = lines.length * 60 * s;
        if (!dry) {
          bulletIcon(ctx, icon, LEFT + r, y + 30 * s, r, i + 1, folder.color);
          ctx.fillStyle = INK;
          ctx.textAlign = "left";
          for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], textX, y + 46 * s + j * 60 * s);
        }
        y += blockH + 30 * s;
      }
      return y;
    }, CONTENT_BOTTOM);
  };

  drawers.quotes = function (ctx, page, folder) {
    var color = page.good === false ? BAD : GOOD;
    fit(ctx, function (s, dry) {
      var y = CONTENT_TOP + 20;
      y = textBlock(ctx, page.title, LEFT, y, WIDTH, 76 * s, 84 * s, { weight: "bold" }, dry);
      y += 40 * s;
      var quotes = page.quotes || [];
      for (var i = 0; i < quotes.length; i++) {
        var indent = i % 2 ? 90 : 0;
        var w = WIDTH - 90;
        var x = LEFT + indent;
        ctx.font = font(46 * s, "bold", "italic");
        var lines = wrap(ctx, "“" + quotes[i] + "”", w - 80);
        var h = lines.length * 58 * s + 56 * s;
        if (!dry) {
          ctx.fillStyle = alpha(page.good === false ? "#c2412f" : "#2f8a4f", 0.1);
          ctx.strokeStyle = color;
          ctx.lineWidth = 4;
          roundRect(ctx, x, y, w, h, 34);
          ctx.fill();
          ctx.stroke();
          // bubble tail
          ctx.beginPath();
          var tx = i % 2 ? x + w - 80 : x + 60;
          ctx.moveTo(tx, y + h - 2);
          ctx.lineTo(tx + (i % 2 ? 30 : -10), y + h + 34);
          ctx.lineTo(tx + 40, y + h - 2);
          ctx.fillStyle = PAPER;
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = INK;
          ctx.font = font(46 * s, "bold", "italic");
          ctx.textAlign = "left";
          for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], x + 40, y + 28 * s + 46 * s + j * 58 * s);
        }
        y += h + 58 * s;
      }
      return y;
    }, CONTENT_BOTTOM);
  };

  drawers.compare = function (ctx, page) {
    fit(ctx, function (s, dry) {
      var y = CONTENT_TOP + 20;
      y = textBlock(ctx, page.title, LEFT, y, WIDTH, 72 * s, 80 * s, { weight: "bold" }, dry);
      y += 30 * s;
      var colW = (WIDTH - 24) / 2;
      var xs = [LEFT, LEFT + colW + 24];
      var heads = [page.left || "Leader", page.right || "Manipulator"];
      var cols = [GOOD, BAD];
      for (var c = 0; c < 2; c++) {
        if (!dry) {
          ctx.fillStyle = cols[c];
          roundRect(ctx, xs[c], y, colW, 76 * s, 38 * s);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = font(42 * s, "bold");
          ctx.textAlign = "center";
          ctx.fillText(heads[c], xs[c] + colW / 2, y + 52 * s);
        }
      }
      y += 100 * s;
      var rows = page.rows || [];
      for (var i = 0; i < rows.length; i++) {
        if (!dry) {
          ctx.fillStyle = SOFT_INK;
          ctx.font = font(28 * s, "bold");
          ctx.textAlign = "left";
          ctx.fillText(rows[i][0].toUpperCase(), LEFT + 6, y + 28 * s);
        }
        y += 40 * s;
        ctx.font = font(38 * s);
        var l1 = wrap(ctx, rows[i][1], colW - 40);
        var l2 = wrap(ctx, rows[i][2], colW - 40);
        var h = Math.max(l1.length, l2.length) * 48 * s + 34 * s;
        if (!dry) {
          [l1, l2].forEach(function (lines, c) {
            ctx.fillStyle = alpha(c ? "#c2412f" : "#2f8a4f", 0.1);
            roundRect(ctx, xs[c], y, colW, h, 18);
            ctx.fill();
            ctx.fillStyle = INK;
            ctx.font = font(38 * s);
            ctx.textAlign = "left";
            for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], xs[c] + 20, y + 17 * s + 38 * s + j * 48 * s);
          });
        }
        y += h + 22 * s;
      }
      return y;
    }, CONTENT_BOTTOM);
  };

  drawers.quiz = function (ctx, page, folder, info) {
    var good = /^leader/i.test(page.answer || "");
    fit(ctx, function (s, dry) {
      var y = CONTENT_TOP + 20;
      y = textBlock(ctx, page.title, LEFT, y, WIDTH, 68 * s, 76 * s, { weight: "bold" }, dry);
      y += 40 * s;
      // speech bubble with the situation
      ctx.font = font(50 * s, "bold");
      var lines = wrap(ctx, page.scenario, WIDTH - 100);
      var h = lines.length * 64 * s + 80 * s;
      if (!dry) {
        ctx.fillStyle = "#fffaf0";
        ctx.strokeStyle = folder.color;
        ctx.lineWidth = 6;
        roundRect(ctx, LEFT, y, WIDTH, h, 40);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.textAlign = "left";
        for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], LEFT + 50, y + 40 * s + 50 * s + j * 64 * s);
      }
      y += h + 70 * s;

      var bw = (WIDTH - 40) / 2;
      var bh = 120 * s;
      if (!info.revealed) {
        if (!dry) {
          [["Leader", GOOD, LEFT], ["Manipulator", BAD, LEFT + bw + 40]].forEach(function (b) {
            ctx.strokeStyle = b[1];
            ctx.lineWidth = 6;
            roundRect(ctx, b[2], y, bw, bh, bh / 2);
            ctx.stroke();
            ctx.fillStyle = b[1];
            ctx.font = font(48 * s, "bold");
            ctx.textAlign = "center";
            ctx.fillText(b[0] + "?", b[2] + bw / 2, y + bh / 2 + 17 * s);
          });
          ctx.fillStyle = SOFT_INK;
          ctx.font = font(36 * s, "", "italic");
          ctx.textAlign = "center";
          ctx.fillText("What do you think? Then press “Show answer”.", PAGE_W / 2, y + bh + 90 * s);
        }
        y += bh + 110 * s;
      } else {
        var color = good ? GOOD : BAD;
        if (!dry) {
          ctx.save();
          ctx.translate(PAGE_W / 2, y + 90 * s);
          ctx.rotate(-0.05);
          ctx.strokeStyle = color;
          ctx.lineWidth = 10;
          roundRect(ctx, -330 * s, -80 * s, 660 * s, 160 * s, 26);
          ctx.stroke();
          ctx.fillStyle = color;
          ctx.font = font(84 * s, "bold");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText((good ? "✔ " : "✖ ") + page.answer.toUpperCase(), 0, 4 * s);
          ctx.restore();
          ctx.textBaseline = "alphabetic";
        }
        y += 210 * s;
        if (page.why) y = textBlock(ctx, page.why, PAGE_W / 2, y, WIDTH - 40, 50 * s, 64 * s, { align: "center", color: INK }, dry);
      }
      return y;
    }, CONTENT_BOTTOM);
  };

  drawers.big = function (ctx, page, folder) {
    var cx = PAGE_W / 2;
    // measure first, then centre vertically
    var measure = function (s) {
      var y = textBlock(ctx, page.text, cx, 0, WIDTH, 92 * s, 104 * s, { weight: "bold", align: "center" }, true);
      if (page.small) y = textBlock(ctx, page.small, cx, y + 60 * s, WIDTH - 40, 46 * s, 60 * s, { align: "center" }, true);
      return y;
    };
    var s = 1.2;
    while (s > 0.55 && measure(s) > CONTENT_BOTTOM - CONTENT_TOP - 200) s -= 0.05;
    var total = measure(s);
    var y = CONTENT_TOP + (CONTENT_BOTTOM - CONTENT_TOP - total) / 2 + 40;
    // decorative strings from the top
    ctx.strokeStyle = alpha(folder.color, 0.6);
    ctx.lineWidth = 3;
    for (var k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(cx + k * 160, 110);
      ctx.lineTo(cx + k * 160, y - 50);
      ctx.stroke();
      ctx.fillStyle = folder.color;
      ctx.beginPath();
      ctx.arc(cx + k * 160, y - 50, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    y = textBlock(ctx, page.text, cx, y, WIDTH, 92 * s, 104 * s, { weight: "bold", align: "center" }, false);
    if (page.small) textBlock(ctx, page.small, cx, y + 60 * s, WIDTH - 40, 46 * s, 60 * s, { align: "center", color: SOFT_INK }, false);
  };

  function mediaIcon(ctx, type, cx, cy, size) {
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = size * 0.07;
    ctx.lineJoin = "round";
    if (type === "video") {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.2, cy - size * 0.3);
      ctx.lineTo(cx + size * 0.32, cy);
      ctx.lineTo(cx - size * 0.2, cy + size * 0.3);
      ctx.closePath();
      ctx.fill();
    } else if (type === "pdf") {
      roundRect(ctx, cx - size * 0.35, cy - size * 0.45, size * 0.7, size * 0.9, size * 0.06);
      ctx.stroke();
      ctx.font = font(size * 0.26, "bold");
      ctx.textAlign = "center";
      ctx.fillText("PDF", cx, cy + size * 0.1);
    } else {
      // picture / gallery
      for (var k = (type === "gallery" ? 2 : 0); k >= 0; k--) {
        var o = k * size * 0.1;
        ctx.fillStyle = k ? "rgba(255,255,255,0.35)" : "#fff";
        roundRect(ctx, cx - size * 0.45 + o, cy - size * 0.32 - o, size * 0.9, size * 0.64, size * 0.06);
        ctx.fill();
      }
      ctx.fillStyle = "#5c6b7a";
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
    y = textBlock(ctx, page.title || "", LEFT, y, WIDTH, 72 * 1, 80, { weight: "bold" });
    y += 40;
    var w = WIDTH, h = Math.round(WIDTH * 9 / 16);
    if (page.type === "pdf") h = Math.round(WIDTH * 0.75);
    // frame
    ctx.fillStyle = "#1a140e";
    roundRect(ctx, LEFT, y, w, h, 24);
    ctx.fill();
    var img = page._img;
    if (img) {
      ctx.save();
      roundRect(ctx, LEFT, y, w, h, 24);
      ctx.clip();
      var r = Math.max(w / img.width, h / img.height);
      var iw = img.width * r, ih = img.height * r;
      try { ctx.drawImage(img, LEFT + (w - iw) / 2, y + (h - ih) / 2, iw, ih); } catch (e) { /* ignore */ }
      ctx.restore();
    } else {
      var g = ctx.createRadialGradient(PAGE_W / 2, y + h / 2, 10, PAGE_W / 2, y + h / 2, w * 0.6);
      g.addColorStop(0, shade(folder.color, -0.35));
      g.addColorStop(1, "#140f0a");
      ctx.fillStyle = g;
      roundRect(ctx, LEFT, y, w, h, 24);
      ctx.fill();
    }
    if (page.type === "video" || !img) mediaIcon(ctx, page.type, PAGE_W / 2, y + h / 2, 180);
    y += h + 50;
    if (page.caption) y = textBlock(ctx, page.caption, PAGE_W / 2, y, WIDTH, 48, 62, { align: "center" });
    var hint = {
      video: "Press “Play video” to watch.",
      pdf: "Press “Open” to show it full screen.",
      image: "Press “Open” to show it full screen.",
      gallery: "Press “Open” to show the slides."
    }[page.type];
    textBlock(ctx, hint, PAGE_W / 2, y + 20, WIDTH, 36, 46, { align: "center", color: SOFT_INK, style: "italic" });
  }

  drawers.video = drawers.pdf = drawers.image = drawers.gallery = drawMedia;

  // ---------- public API ----------

  function drawPage(page, folder, info) {
    var c = makeCanvas(PAGE_W, PAGE_H);
    var ctx = c.getContext("2d");
    paperBase(ctx, folder, info);
    (drawers[page.type] || drawers.text)(ctx, page, folder, info);
    return c;
  }

  function drawPageBack() {
    var c = makeCanvas(512, 672);
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#ece3cf";
    ctx.fillRect(0, 0, 512, 672);
    ctx.strokeStyle = "rgba(90,120,170,0.18)";
    ctx.lineWidth = 2;
    for (var y = 90; y < 640; y += 34) {
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(482, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.12;
    drawPuppet(ctx, 256, 190, 0.6, "#8a6a3a", true);
    ctx.globalAlpha = 1;
    return c;
  }

  function drawCover(folder, index) {
    var c = makeCanvas(COVER_W, COVER_H);
    var ctx = c.getContext("2d");
    var base = shade(folder.color, -0.72);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, COVER_W, COVER_H);
    var g = ctx.createLinearGradient(0, 0, COVER_W, COVER_H);
    g.addColorStop(0, "rgba(255,255,255,0.10)");
    g.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, COVER_W, COVER_H);
    // stitched border
    ctx.setLineDash([14, 10]);
    ctx.strokeStyle = alpha(folder.color, 0.55);
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, COVER_W - 52, COVER_H - 52);
    ctx.setLineDash([]);

    // file number
    ctx.fillStyle = folder.color;
    ctx.font = font(34, "bold");
    ctx.textAlign = "left";
    ctx.fillText("FILE " + pad2(index + 1), 60, 96);

    // label card
    var cardY = 250, cardH = 300;
    ctx.fillStyle = "#f3e9d2";
    roundRect(ctx, 60, cardY, COVER_W - 120, cardH, 14);
    ctx.fill();
    ctx.fillStyle = folder.color;
    ctx.fillRect(60, cardY, COVER_W - 120, 16);
    var s = 1;
    var titleSize = 62;
    ctx.font = font(titleSize, "bold");
    while (wrap(ctx, folder.title, COVER_W - 180).length > 2 && titleSize > 36) {
      titleSize -= 4;
      ctx.font = font(titleSize, "bold");
    }
    var y = textBlock(ctx, folder.title, COVER_W / 2, cardY + 50, COVER_W - 180, titleSize, titleSize * 1.12, { weight: "bold", align: "center" });
    if (folder.subtitle) textBlock(ctx, folder.subtitle, COVER_W / 2, y + 14, COVER_W - 180, 34 * s, 42, { align: "center", color: SOFT_INK });

    // strings hanging down
    ctx.strokeStyle = alpha(folder.color, 0.5);
    ctx.lineWidth = 2;
    for (var k = 0; k < 3; k++) {
      var x = 200 + k * 120;
      ctx.beginPath();
      ctx.moveTo(x, cardY + cardH);
      ctx.lineTo(x, 700 - (k % 2) * 40);
      ctx.stroke();
      ctx.fillStyle = folder.color;
      ctx.beginPath();
      ctx.arc(x, 700 - (k % 2) * 40, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = alpha(folder.color, 0.8);
    ctx.font = font(26, "bold");
    ctx.textAlign = "center";
    ctx.fillText((folder.pages || []).length + " PAGES", COVER_W / 2, COVER_H - 60);
    return c;
  }

  function drawCoverInside(folder) {
    var c = makeCanvas(COVER_W, COVER_H);
    var ctx = c.getContext("2d");
    ctx.fillStyle = shade(folder.color, -0.6);
    ctx.fillRect(0, 0, COVER_W, COVER_H);
    ctx.fillStyle = "#efe4cb";
    roundRect(ctx, 50, 50, COVER_W - 100, COVER_H - 100, 10);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = font(44, "bold");
    ctx.textAlign = "left";
    ctx.fillText("In this file", 90, 130);
    ctx.fillStyle = folder.color;
    ctx.fillRect(90, 150, 90, 6);
    var y = 210;
    (folder.pages || []).forEach(function (p, i) {
      if (y > COVER_H - 120) return;
      var label = p.type === "quiz" ? "Question " + (i + 1) : (p.title || p.text || p.type);
      ctx.fillStyle = SOFT_INK;
      ctx.font = font(30, "bold");
      ctx.fillText(String(i + 1), 90, y);
      ctx.fillStyle = INK;
      ctx.font = font(30);
      var line = wrap(ctx, label, COVER_W - 230)[0];
      if (line !== label) line += "...";
      ctx.fillText(line, 140, y);
      y += 54;
    });
    return c;
  }

  function drawTab(folder) {
    var c = makeCanvas(384, 112);
    var ctx = c.getContext("2d");
    ctx.fillStyle = folder.color;
    ctx.fillRect(0, 0, 384, 112);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(0, 0, 384, 10);
    var size = 50;
    ctx.font = font(size, "bold");
    while (ctx.measureText(folder.tab).width > 340 && size > 24) {
      size -= 2;
      ctx.font = font(size, "bold");
    }
    ctx.fillStyle = "#1c150e";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(folder.tab, 192, 60);
    return c;
  }

  function drawGlow(color) {
    var c = makeCanvas(256, 256);
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, alpha(color, 0.55));
    g.addColorStop(0.5, alpha(color, 0.16));
    g.addColorStop(1, alpha(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return c;
  }

  window.PageArt = {
    PAGE_W: PAGE_W,
    PAGE_H: PAGE_H,
    drawPage: drawPage,
    drawPageBack: drawPageBack,
    drawCover: drawCover,
    drawCoverInside: drawCoverInside,
    drawTab: drawTab,
    drawGlow: drawGlow,
    isMedia: function (p) { return !!p && /^(video|pdf|image|gallery)$/.test(p.type); }
  };
})();
