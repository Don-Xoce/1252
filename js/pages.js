/*
 * Draws every page, cover and tab onto 2-D canvases in a dark "glass & glow" style.
 * The 3-D scene (app.js) turns these canvases into textures.
 * Transparent corners are cut out in 3-D, so every shape gets soft rounded edges.
 */
(function () {
  "use strict";

  var FONT = '"Outfit", "Trebuchet MS", "Segoe UI", Verdana, Arial, sans-serif';
  var PAGE_W = 1024, PAGE_H = 1344;
  var COVER_W = 640, COVER_H = 816;          // front cover (slightly shorter than the back)
  var PANEL_W = 640, PANEL_H = 840, TAB_H = 84; // back panel + its tab

  var INK = "#f7f0e3";
  var SOFT = "rgba(247,240,227,0.66)";
  var FAINT = "rgba(247,240,227,0.14)";
  var GOOD = "#5fd590";
  var BAD = "#ff7262";
  var GOLD = "#f2c46d";

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

  // A sheet of dark frosted glass, tinted by the folder colour, with a soft rim.
  function glass(ctx, x, y, w, h, r, tint, opts) {
    opts = opts || {};
    ctx.save();
    roundRect(ctx, x, y, w, h, r);
    ctx.clip();
    var base = ctx.createLinearGradient(x, y, x + w * 0.6, y + h);
    base.addColorStop(0, opts.top || shade(tint, -0.72));
    base.addColorStop(1, opts.bottom || "#0c0907");
    ctx.fillStyle = base;
    ctx.fillRect(x, y, w, h);
    // colour glowing "behind" the glass
    var blob = ctx.createRadialGradient(x + w * 0.2, y + h * 0.12, 0, x + w * 0.2, y + h * 0.12, w * 0.95);
    blob.addColorStop(0, alpha(tint, opts.glow == null ? 0.34 : opts.glow));
    blob.addColorStop(1, alpha(tint, 0));
    ctx.fillStyle = blob;
    ctx.fillRect(x, y, w, h);
    var blob2 = ctx.createRadialGradient(x + w * 0.95, y + h, 0, x + w * 0.95, y + h, w * 0.8);
    blob2.addColorStop(0, "rgba(242,196,109,0.12)");
    blob2.addColorStop(1, "rgba(242,196,109,0)");
    ctx.fillStyle = blob2;
    ctx.fillRect(x, y, w, h);
    // diagonal sheen
    var sheen = ctx.createLinearGradient(x, y, x + w, y + h * 0.55);
    sheen.addColorStop(0, "rgba(255,255,255,0.10)");
    sheen.addColorStop(0.35, "rgba(255,255,255,0.03)");
    sheen.addColorStop(0.36, "rgba(255,255,255,0)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    // rim: bright at the top-left, fading round the sheet
    ctx.save();
    var rim = ctx.createLinearGradient(x, y, x + w, y + h);
    rim.addColorStop(0, alpha(tint, 0.95));
    rim.addColorStop(0.5, "rgba(255,255,255,0.10)");
    rim.addColorStop(1, alpha(tint, 0.45));
    ctx.strokeStyle = rim;
    ctx.lineWidth = opts.rim || 4;
    roundRect(ctx, x + 2, y + 2, w - 4, h - 4, r - 2);
    ctx.stroke();
    ctx.restore();
  }

  function pill(ctx, x, y, w, h, fill, stroke) {
    roundRect(ctx, x, y, w, h, h / 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
  }

  function glowOn(ctx, color, blur) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
  }
  function glowOff(ctx) {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  }

  function bulletIcon(ctx, kind, x, cy, r, n, color) {
    ctx.save();
    if (kind === "check" || kind === "cross") {
      var c = kind === "check" ? GOOD : BAD;
      ctx.fillStyle = alpha(kind === "check" ? "#5fd590" : "#ff7262", 0.18);
      ctx.beginPath();
      ctx.arc(x, cy, r, 0, Math.PI * 2);
      ctx.fill();
      glowOn(ctx, c, 14);
      ctx.strokeStyle = c;
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
      ctx.fillStyle = alpha(color, 0.2);
      ctx.strokeStyle = alpha(color, 0.9);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = font(r * 1.1, 700);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n), x, cy + r * 0.04);
    } else {
      glowOn(ctx, color, 16);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, cy, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // A glowing line-art puppet, like the figures in the video.
  function drawPuppet(ctx, cx, top, scale, color, faint) {
    var s = scale;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (!faint) glowOn(ctx, color, 24 * s);
    ctx.strokeStyle = color;
    // control bar
    ctx.lineWidth = 9 * s;
    ctx.beginPath();
    ctx.moveTo(cx - 120 * s, top);
    ctx.lineTo(cx + 120 * s, top);
    ctx.moveTo(cx, top - 46 * s);
    ctx.lineTo(cx, top + 46 * s);
    ctx.stroke();
    var headY = top + 230 * s;
    var bodyY = top + 345 * s;
    // strings
    ctx.lineWidth = 2.5 * s;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx - 115 * s, top); ctx.lineTo(cx - 98 * s, bodyY - 74 * s);
    ctx.moveTo(cx + 115 * s, top); ctx.lineTo(cx + 98 * s, bodyY - 74 * s);
    ctx.moveTo(cx, top + 42 * s); ctx.lineTo(cx, headY - 58 * s);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // figure (outlined, softly filled)
    ctx.fillStyle = alpha("#f2c46d", faint ? 0.06 : 0.16);
    ctx.lineWidth = 7 * s;
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

  var M = 26;                 // transparent margin around the glass sheet
  var LEFT = 96;
  var WIDTH = PAGE_W - LEFT * 2;
  var CONTENT_TOP = 150;
  var CONTENT_BOTTOM = PAGE_H - 130;

  function pageBase(ctx, folder, info) {
    glass(ctx, M, M, PAGE_W - 2 * M, PAGE_H - 2 * M, 56, folder.color, { glow: 0.26, rim: 4 });

    // header pill
    var label = "FILE " + pad2(info.folderIndex + 1) + "  ·  " + folder.tab.toUpperCase();
    ctx.font = font(26, 600);
    var w = ctx.measureText(label).width + 52;
    pill(ctx, LEFT, 70, w, 50, alpha(folder.color, 0.16), alpha(folder.color, 0.55));
    ctx.fillStyle = shade(folder.color, 0.35);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, LEFT + 26, 96);
    ctx.textBaseline = "alphabetic";

    // footer: page dots
    var n = info.pageCount;
    var dotW = 14, gap = 14, total = n * dotW + (n - 1) * gap + 30;
    var x0 = PAGE_W / 2 - total / 2;
    for (var i = 0; i < n; i++) {
      var on = i === info.pageIndex;
      ctx.fillStyle = on ? folder.color : FAINT;
      if (on) glowOn(ctx, folder.color, 12);
      pill(ctx, x0, PAGE_H - 92, on ? dotW + 30 : dotW, dotW, ctx.fillStyle);
      glowOff(ctx);
      x0 += (on ? dotW + 30 : dotW) + gap;
    }
  }

  // Runs draw(scale, dry) with the biggest text that still fits (easier to read on a smart board).
  function fit(ctx, draw, maxY) {
    var s = 1.3;
    while (s > 0.55 && draw(s, true) > maxY) s -= 0.05;
    draw(s, false);
  }

  function titleUnderline(ctx, folder, y, x) {
    x = x == null ? LEFT : x;
    var g = ctx.createLinearGradient(x, 0, x + 180, 0);
    g.addColorStop(0, folder.color);
    g.addColorStop(1, alpha(folder.color, 0));
    glowOn(ctx, folder.color, 12);
    pill(ctx, x, y, 180, 8, g);
    glowOff(ctx);
  }

  // ---------- page types ----------

  var drawers = {};

  drawers.title = function (ctx, page, folder) {
    var cx = PAGE_W / 2;
    drawPuppet(ctx, cx, 230, 0.95, GOLD);
    fit(ctx, function (s, dry) {
      var y = 700;
      if (!dry) {
        var g = ctx.createLinearGradient(0, y, 0, y + 260 * s);
        g.addColorStop(0, "#fff7e6");
        g.addColorStop(1, GOLD);
      }
      y = textBlock(ctx, page.title, cx, y, WIDTH, 100 * s, 108 * s, { weight: 700, align: "center", color: g }, dry);
      y += 22 * s;
      if (page.subtitle) y = textBlock(ctx, page.subtitle, cx, y, WIDTH - 40, 46 * s, 58 * s, { color: SOFT, align: "center" }, dry);
      var note = page.note || (folder === window.PRESENTATION.folders[0] ? window.PRESENTATION.presenter : "");
      if (note) {
        y += 40 * s;
        ctx.font = font(38 * s, 600);
        var w = ctx.measureText(note).width + 70 * s;
        if (!dry) {
          pill(ctx, cx - w / 2, y, w, 76 * s, "rgba(242,196,109,0.12)", "rgba(242,196,109,0.55)");
          ctx.fillStyle = GOLD;
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
      if (page.title) y = textBlock(ctx, page.title, LEFT, y, WIDTH, 78 * s, 86 * s, { weight: 700 }, dry);
      if (!dry) titleUnderline(ctx, folder, y + 4);
      y += 54 * s;
      if (page.text) {
        y = textBlock(ctx, page.text, LEFT, y, WIDTH, 48 * s, 64 * s, { color: SOFT }, dry);
        y += 36 * s;
      }
      var list = page.bullets || [];
      var r = 28 * s;
      for (var i = 0; i < list.length; i++) {
        var textX = LEFT + r * 2 + 30;
        ctx.font = font(46 * s, 500);
        var lines = wrap(ctx, list[i], WIDTH - (textX - LEFT));
        var blockH = lines.length * 60 * s;
        if (!dry) {
          bulletIcon(ctx, icon, LEFT + r, y + 30 * s, r, i + 1, folder.color);
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
    var color = page.good === false ? BAD : GOOD;
    fit(ctx, function (s, dry) {
      var y = CONTENT_TOP + 20;
      y = textBlock(ctx, page.title, LEFT, y, WIDTH, 78 * s, 86 * s, { weight: 700 }, dry);
      if (!dry) titleUnderline(ctx, folder, y + 4);
      y += 56 * s;
      var quotes = page.quotes || [];
      for (var i = 0; i < quotes.length; i++) {
        var indent = i % 2 ? 80 : 0;
        var w = WIDTH - 80;
        var x = LEFT + indent;
        ctx.font = font(46 * s, 500, "italic");
        var lines = wrap(ctx, "“" + quotes[i] + "”", w - 90);
        var h = lines.length * 58 * s + 56 * s;
        if (!dry) {
          roundRect(ctx, x, y, w, h, 30);
          ctx.fillStyle = alpha(page.good === false ? "#ff7262" : "#5fd590", 0.1);
          ctx.fill();
          ctx.strokeStyle = alpha(page.good === false ? "#ff7262" : "#5fd590", 0.45);
          ctx.lineWidth = 2;
          ctx.stroke();
          // glowing accent bar
          glowOn(ctx, color, 14);
          pill(ctx, x + 18, y + 16, 8, h - 32, color);
          glowOff(ctx);
          ctx.fillStyle = INK;
          ctx.font = font(46 * s, 500, "italic");
          ctx.textAlign = "left";
          for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], x + 52, y + 28 * s + 44 * s + j * 58 * s);
        }
        y += h + 30 * s;
      }
      return y;
    }, CONTENT_BOTTOM);
  };

  drawers.compare = function (ctx, page, folder) {
    fit(ctx, function (s, dry) {
      var y = CONTENT_TOP + 20;
      y = textBlock(ctx, page.title, LEFT, y, WIDTH, 74 * s, 82 * s, { weight: 700 }, dry);
      if (!dry) titleUnderline(ctx, folder, y + 4);
      y += 44 * s;
      var colW = (WIDTH - 22) / 2;
      var xs = [LEFT, LEFT + colW + 22];
      var heads = [page.left || "Leader", page.right || "Manipulator"];
      var cols = [GOOD, BAD];
      for (var c = 0; c < 2; c++) {
        if (!dry) {
          glowOn(ctx, cols[c], 18);
          pill(ctx, xs[c], y, colW, 76 * s, alpha(c ? "#ff7262" : "#5fd590", 0.22), cols[c]);
          glowOff(ctx);
          ctx.fillStyle = INK;
          ctx.font = font(42 * s, 700);
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
          ctx.font = font(26 * s, 600);
          ctx.textAlign = "left";
          ctx.fillText(rows[i][0].toUpperCase(), LEFT + 8, y + 26 * s);
        }
        y += 38 * s;
        ctx.font = font(38 * s, 500);
        var l1 = wrap(ctx, rows[i][1], colW - 44);
        var l2 = wrap(ctx, rows[i][2], colW - 44);
        var h = Math.max(l1.length, l2.length) * 48 * s + 34 * s;
        if (!dry) {
          [l1, l2].forEach(function (lines, c) {
            roundRect(ctx, xs[c], y, colW, h, 20);
            ctx.fillStyle = alpha(c ? "#ff7262" : "#5fd590", 0.09);
            ctx.fill();
            ctx.strokeStyle = alpha(c ? "#ff7262" : "#5fd590", 0.3);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = INK;
            ctx.font = font(38 * s, 500);
            ctx.textAlign = "left";
            for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], xs[c] + 22, y + 17 * s + 37 * s + j * 48 * s);
          });
        }
        y += h + 20 * s;
      }
      return y;
    }, CONTENT_BOTTOM);
  };

  drawers.quiz = function (ctx, page, folder, info) {
    var good = /^leader/i.test(page.answer || "");
    fit(ctx, function (s, dry) {
      var y = CONTENT_TOP + 20;
      y = textBlock(ctx, page.title, LEFT, y, WIDTH, 70 * s, 78 * s, { weight: 700 }, dry);
      if (!dry) titleUnderline(ctx, folder, y + 4);
      y += 54 * s;
      // the situation, on its own glass card
      ctx.font = font(50 * s, 600);
      var lines = wrap(ctx, page.scenario, WIDTH - 110);
      var h = lines.length * 64 * s + 84 * s;
      if (!dry) {
        roundRect(ctx, LEFT, y, WIDTH, h, 36);
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fill();
        ctx.strokeStyle = alpha(folder.color, 0.6);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = alpha(folder.color, 0.5);
        ctx.font = font(150, 700);
        ctx.textAlign = "left";
        ctx.fillText("“", LEFT + 16, y + 118);
        ctx.fillStyle = INK;
        ctx.font = font(50 * s, 600);
        for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], LEFT + 60, y + 42 * s + 50 * s + j * 64 * s);
      }
      y += h + 70 * s;

      var bw = (WIDTH - 36) / 2;
      var bh = 116 * s;
      if (!info.revealed) {
        if (!dry) {
          [["Leader", GOOD, LEFT, "#5fd590"], ["Manipulator", BAD, LEFT + bw + 36, "#ff7262"]].forEach(function (b) {
            pill(ctx, b[2], y, bw, bh, alpha(b[3], 0.08), alpha(b[3], 0.7));
            ctx.fillStyle = b[1];
            ctx.font = font(46 * s, 700);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(b[0] + "?", b[2] + bw / 2, y + bh / 2);
            ctx.textBaseline = "alphabetic";
          });
          ctx.fillStyle = SOFT;
          ctx.font = font(34 * s, 400, "italic");
          ctx.textAlign = "center";
          ctx.fillText("What do you think? Then press “Show answer”.", PAGE_W / 2, y + bh + 84 * s);
        }
        y += bh + 110 * s;
      } else {
        var color = good ? GOOD : BAD;
        var hex = good ? "#5fd590" : "#ff7262";
        if (!dry) {
          var bwid = 640 * s, bhei = 150 * s;
          glowOn(ctx, color, 40);
          pill(ctx, PAGE_W / 2 - bwid / 2, y, bwid, bhei, alpha(hex, 0.2), color);
          glowOff(ctx);
          ctx.fillStyle = INK;
          ctx.font = font(76 * s, 800);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText((good ? "✔ " : "✖ ") + page.answer.toUpperCase(), PAGE_W / 2, y + bhei / 2 + 2);
          ctx.textBaseline = "alphabetic";
        }
        y += 200 * s;
        if (page.why) y = textBlock(ctx, page.why, PAGE_W / 2, y, WIDTH - 40, 50 * s, 64 * s, { align: "center", color: INK, weight: 500 }, dry);
      }
      return y;
    }, CONTENT_BOTTOM);
  };

  drawers.big = function (ctx, page, folder) {
    var cx = PAGE_W / 2;
    var measure = function (s) {
      var y = textBlock(ctx, page.text, cx, 0, WIDTH, 94 * s, 106 * s, { weight: 700, align: "center" }, true);
      if (page.small) y = textBlock(ctx, page.small, cx, y + 60 * s, WIDTH - 40, 46 * s, 60 * s, { align: "center" }, true);
      return y;
    };
    var s = 1.2;
    while (s > 0.55 && measure(s) > CONTENT_BOTTOM - CONTENT_TOP - 220) s -= 0.05;
    var total = measure(s);
    var y = CONTENT_TOP + (CONTENT_BOTTOM - CONTENT_TOP - total) / 2 + 50;
    // glowing strings coming down from the top
    for (var k = -1; k <= 1; k++) {
      var sx = cx + k * 170;
      var g = ctx.createLinearGradient(0, 130, 0, y - 60);
      g.addColorStop(0, alpha(folder.color, 0));
      g.addColorStop(1, alpha(folder.color, 0.9));
      ctx.strokeStyle = g;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, 130);
      ctx.lineTo(sx, y - 60);
      ctx.stroke();
      glowOn(ctx, folder.color, 18);
      ctx.fillStyle = folder.color;
      ctx.beginPath();
      ctx.arc(sx, y - 60, 9, 0, Math.PI * 2);
      ctx.fill();
      glowOff(ctx);
    }
    var tg = ctx.createLinearGradient(0, y, 0, y + total);
    tg.addColorStop(0, "#fff8ea");
    tg.addColorStop(1, shade(folder.color, 0.35));
    y = textBlock(ctx, page.text, cx, y, WIDTH, 94 * s, 106 * s, { weight: 700, align: "center", color: tg }, false);
    if (page.small) textBlock(ctx, page.small, cx, y + 60 * s, WIDTH - 40, 46 * s, 60 * s, { align: "center", color: SOFT }, false);
  };

  function mediaIcon(ctx, type, cx, cy, size) {
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = size * 0.06;
    ctx.lineJoin = "round";
    if (type === "video") {
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      glowOn(ctx, "rgba(255,255,255,0.8)", 20);
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
      ctx.fillStyle = "#3a4656";
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
    y = textBlock(ctx, page.title || "", LEFT, y, WIDTH, 72, 80, { weight: 700 });
    titleUnderline(ctx, folder, y + 4);
    y += 56;
    var w = WIDTH, h = Math.round(WIDTH * 9 / 16);
    if (page.type === "pdf") h = Math.round(WIDTH * 0.75);
    ctx.save();
    glowOn(ctx, alpha(folder.color, 0.6), 40);
    roundRect(ctx, LEFT, y, w, h, 30);
    ctx.fillStyle = "#0b0806";
    ctx.fill();
    glowOff(ctx);
    ctx.clip();
    var img = page._img;
    if (img) {
      var r = Math.max(w / img.width, h / img.height);
      var iw = img.width * r, ih = img.height * r;
      try { ctx.drawImage(img, LEFT + (w - iw) / 2, y + (h - ih) / 2, iw, ih); } catch (e) { /* ignore */ }
    } else {
      var g = ctx.createRadialGradient(PAGE_W / 2, y + h / 2, 10, PAGE_W / 2, y + h / 2, w * 0.6);
      g.addColorStop(0, shade(folder.color, -0.3));
      g.addColorStop(1, "#0b0806");
      ctx.fillStyle = g;
      ctx.fillRect(LEFT, y, w, h);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    roundRect(ctx, LEFT, y, w, h, 30);
    ctx.stroke();
    if (page.type === "video" || !img) mediaIcon(ctx, page.type, PAGE_W / 2, y + h / 2, 170);
    y += h + 56;
    if (page.caption) y = textBlock(ctx, page.caption, PAGE_W / 2, y, WIDTH, 48, 62, { align: "center", weight: 500 });
    var hint = {
      video: "Press “Play video” to watch.",
      pdf: "Press “Open” to show it full screen.",
      image: "Press “Open” to show it full screen.",
      gallery: "Press “Open” to show the slides."
    }[page.type];
    textBlock(ctx, hint, PAGE_W / 2, y + 16, WIDTH, 34, 44, { align: "center", color: SOFT, style: "italic" });
  }

  drawers.video = drawers.pdf = drawers.image = drawers.gallery = drawMedia;

  // ---------- public API ----------

  function drawPage(page, folder, info) {
    var c = makeCanvas(PAGE_W, PAGE_H);
    var ctx = c.getContext("2d");
    pageBase(ctx, folder, info);
    (drawers[page.type] || drawers.text)(ctx, page, folder, info);
    return c;
  }

  // The back of a page: plain glass with a faint puppet.
  function drawPageBack() {
    var c = makeCanvas(512, 672);
    var ctx = c.getContext("2d");
    glass(ctx, 13, 13, 486, 646, 28, "#c9a060", { glow: 0.16, rim: 2 });
    ctx.globalAlpha = 0.35;
    drawPuppet(ctx, 256, 200, 0.55, "rgba(242,196,109,0.6)", true);
    ctx.globalAlpha = 1;
    return c;
  }

  function coverContent(ctx, folder, index, w, h) {
    // file number + puppet-cross mark
    ctx.fillStyle = shade(folder.color, 0.25);
    ctx.font = font(30, 600);
    ctx.textAlign = "left";
    ctx.fillText("FILE " + pad2(index + 1), 64, 104);
    ctx.save();
    glowOn(ctx, folder.color, 16);
    ctx.strokeStyle = folder.color;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(w - 130, 92); ctx.lineTo(w - 64, 92);
    ctx.moveTo(w - 97, 66); ctx.lineTo(w - 97, 118);
    ctx.stroke();
    ctx.restore();

    // title, big and clean
    var size = 66;
    ctx.font = font(size, 700);
    while (wrap(ctx, folder.title, w - 128).length > 3 && size > 40) {
      size -= 4;
      ctx.font = font(size, 700);
    }
    var lines = wrap(ctx, folder.title, w - 128);
    var blockH = lines.length * size * 1.1;
    var y = h * 0.47 - blockH / 2;
    var g = ctx.createLinearGradient(0, y, 0, y + blockH);
    g.addColorStop(0, "#fffaf0");
    g.addColorStop(1, shade(folder.color, 0.45));
    y = textBlock(ctx, folder.title, 64, y, w - 128, size, size * 1.1, { weight: 700, color: g });
    titleUnderline(ctx, folder, y + 6, 64);
    if (folder.subtitle) textBlock(ctx, folder.subtitle, 64, y + 34, w - 128, 32, 40, { color: SOFT });

    // page count pill
    var label = (folder.pages || []).length + " pages";
    ctx.font = font(26, 600);
    var pw = ctx.measureText(label).width + 44;
    pill(ctx, 64, h - 118, pw, 50, alpha(folder.color, 0.16), alpha(folder.color, 0.5));
    ctx.fillStyle = INK;
    ctx.textBaseline = "middle";
    ctx.fillText(label, 86, h - 92);
    ctx.textBaseline = "alphabetic";
  }

  function drawCover(folder, index) {
    var c = makeCanvas(COVER_W, COVER_H);
    var ctx = c.getContext("2d");
    glass(ctx, 8, 8, COVER_W - 16, COVER_H - 16, 40, folder.color, { glow: 0.5, rim: 5, top: shade(folder.color, -0.62) });
    coverContent(ctx, folder, index, COVER_W, COVER_H);
    return c;
  }

  function drawCoverInside(folder) {
    var c = makeCanvas(COVER_W, COVER_H);
    var ctx = c.getContext("2d");
    glass(ctx, 8, 8, COVER_W - 16, COVER_H - 16, 40, folder.color, { glow: 0.3, rim: 4 });
    ctx.fillStyle = INK;
    ctx.font = font(44, 700);
    ctx.textAlign = "left";
    ctx.fillText("In this file", 64, 128);
    titleUnderline(ctx, folder, 150, 64);
    var y = 230;
    (folder.pages || []).forEach(function (p, i) {
      if (y > COVER_H - 80) return;
      var label = p.type === "quiz" ? "Question " + (i + 1) : (p.title || p.text || p.type);
      ctx.fillStyle = alpha(folder.color, 0.18);
      ctx.beginPath();
      ctx.arc(84, y - 10, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.font = font(24, 700);
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), 84, y - 2);
      ctx.textAlign = "left";
      ctx.font = font(30, 500);
      ctx.fillStyle = SOFT;
      var line = wrap(ctx, label, COVER_W - 210)[0];
      if (line !== label) line += "…";
      ctx.fillText(line, 126, y);
      y += 64;
    });
    return c;
  }

  // Back panel of the folder with its tab sticking up. Height = PANEL_H + TAB_H.
  function drawPanel(folder, index) {
    var c = makeCanvas(PANEL_W, PANEL_H + TAB_H);
    var ctx = c.getContext("2d");
    var tabW = 250;
    var tabX = 40 + (index % 3) * 170;
    // tab
    ctx.save();
    roundRect(ctx, tabX, 6, tabW, TAB_H + 60, 26);
    ctx.clip();
    var tg = ctx.createLinearGradient(0, 0, 0, TAB_H);
    tg.addColorStop(0, shade(folder.color, 0.25));
    tg.addColorStop(1, folder.color);
    ctx.fillStyle = tg;
    ctx.fillRect(tabX, 0, tabW, TAB_H + 60);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(tabX, 6, tabW, 3);
    ctx.restore();
    var size = 36;
    ctx.font = font(size, 700);
    while (ctx.measureText(folder.tab).width > tabW - 36 && size > 20) {
      size -= 2;
      ctx.font = font(size, 700);
    }
    ctx.fillStyle = "#140e08";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(folder.tab, tabX + tabW / 2, 6 + (TAB_H - 6) / 2);
    ctx.textBaseline = "alphabetic";
    // body
    glass(ctx, 8, TAB_H, PANEL_W - 16, PANEL_H - 8, 40, folder.color, { glow: 0.42, rim: 4, top: shade(folder.color, -0.66) });
    return c;
  }

  function drawGlow(color, softness) {
    var c = makeCanvas(256, 256);
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, alpha(color, 0.6));
    g.addColorStop(softness || 0.45, alpha(color, 0.16));
    g.addColorStop(1, alpha(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return c;
  }

  // Soft glow around a folder (a rounded rectangle of light).
  function drawHalo() {
    var c = makeCanvas(256, 320);
    var ctx = c.getContext("2d");
    ctx.filter = "blur(18px)";
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 56, 56, 144, 208, 24);
    ctx.fill();
    ctx.filter = "none";
    // fallback for browsers without canvas filters: soft radial falloff
    if (!("filter" in ctx)) {
      var g = ctx.createRadialGradient(128, 160, 20, 128, 160, 150);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 320);
    }
    return c;
  }

  // A thread of light: bright at the bottom, fading upwards.
  function drawThread() {
    var c = makeCanvas(16, 256);
    var ctx = c.getContext("2d");
    var g = ctx.createLinearGradient(0, 256, 0, 0);
    g.addColorStop(0, "rgba(255,226,160,1)");
    g.addColorStop(0.6, "rgba(242,196,109,0.45)");
    g.addColorStop(1, "rgba(242,196,109,0)");
    var h = ctx.createLinearGradient(0, 0, 16, 0);
    h.addColorStop(0, "rgba(0,0,0,1)");
    h.addColorStop(0.5, "rgba(0,0,0,0)");
    h.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 256);
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = h;
    ctx.fillRect(0, 0, 16, 256);
    return c;
  }

  window.PageArt = {
    PAGE_W: PAGE_W,
    PAGE_H: PAGE_H,
    COVER_RATIO: COVER_H / COVER_W,
    PANEL_TAB_RATIO: TAB_H / PANEL_H,
    PAGE_MARGIN: M / PAGE_W,
    drawPage: drawPage,
    drawPageBack: drawPageBack,
    drawCover: drawCover,
    drawCoverInside: drawCoverInside,
    drawPanel: drawPanel,
    drawGlow: drawGlow,
    drawHalo: drawHalo,
    drawThread: drawThread,
    isMedia: function (p) { return !!p && /^(video|pdf|image|gallery)$/.test(p.type); }
  };
})();
