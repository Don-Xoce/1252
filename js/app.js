/*
 * The 3-D scene: white card-stock folders hanging on fine threads, in a turning carousel
 * above a glossy floor with soft reflections. Tap / swipe to turn it, open a folder,
 * and flip through its pages (they curl as they turn).
 *
 * Built to stay smooth on school smart boards:
 *  - it only redraws when something moves,
 *  - it limits how many pixels are drawn, and lowers the quality by itself if the board is slow,
 *  - the background is plain CSS (always smooth, costs nothing),
 *  - page pictures are made only for the folder that is open.
 *
 * Add ?quality=low to the address to force the lightest mode.
 */
(function () {
  "use strict";

  var DATA = window.PRESENTATION;
  var Art = window.PageArt;
  var L = window.I18N;
  var T = L.T;
  var Settings = window.Settings;
  var params = new URLSearchParams(location.search);
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SPEED = reduceMotion ? 0.4 : 1;
  var canDrawImages = location.protocol !== "file:"; // browsers block reading pictures into 3-D from a USB stick

  // ---------- sizes (in 3-D units) ----------
  var W = 1.6, H = 2.1;
  var PW = 1.54, PH = PW * Art.PAGE_H / Art.PAGE_W;
  var COVER_H = W * Art.COVER_RATIO;
  var PANEL_H = H * (1 + Art.PANEL_TAB_RATIO);
  var FLOOR_Y = -H / 2 - 0.015;
  var PAGE_GAP = 0.004;
  var CURL_SEGMENTS = 24;
  var FOV = 36;

  // ---------- renderer ----------
  var canvas = document.getElementById("scene");
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    document.getElementById("no3d").hidden = false;
    document.getElementById("loading").classList.add("done");
    return;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  var maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  var quality = params.get("quality") === "low" ? 0.45 : 1;
  var PIXEL_BUDGET = 4.2e6; // sharp on big screens; lowered automatically if the board is slow
  function pixelRatio() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var budget = Math.sqrt((PIXEL_BUDGET * quality) / (window.innerWidth * window.innerHeight));
    return Math.max(0.5, Math.min(dpr, budget));
  }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 100);

  // soft studio light: white paper facing you shows as true white, turned folders shade naturally
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d8d8, 1.15));
  var keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
  keyLight.position.set(1.2, 2.2, 5);
  scene.add(keyLight);

  function canvasTexture(c, anisotropy) {
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = anisotropy || 1;
    return t;
  }

  // Paper: lit, with smooth cut-out corners (no blending, so no sorting problems).
  function paperMaterial(tex, side) {
    return new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, alphaToCoverage: true, side: side || THREE.FrontSide });
  }

  function noHit(o) { o.raycast = function () {}; return o; }

  // A soft, blurred copy of the cover for its mirror image on the floor.
  function blurredCopy(src) {
    var c = document.createElement("canvas");
    c.width = src.width / 2;
    c.height = src.height / 2;
    var ctx = c.getContext("2d");
    ctx.filter = "blur(1.5px)";
    ctx.drawImage(src, 0, 0, c.width, c.height);
    return c;
  }

  // ---------- shared resources ----------
  var glowTex = canvasTexture(Art.drawGlow("#ffffff"));
  var shadowTex = canvasTexture(Art.drawGlow("#000000"));
  var fadeTex = new THREE.CanvasTexture(Art.drawFade());
  var threadTex = canvasTexture(Art.drawThread());
  var pageBackTex = canvasTexture(Art.drawPageBack(), maxAniso);
  var pageBackMat = paperMaterial(pageBackTex, THREE.BackSide);
  var blankPageMat = paperMaterial(pageBackTex);
  var threadMat = new THREE.MeshBasicMaterial({ map: threadTex, transparent: true, depthWrite: false, opacity: 0.6 });
  var beadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  var beadGeo = new THREE.SphereGeometry(0.02, 12, 8);

  var panelInGeo = new THREE.PlaneGeometry(W, PANEL_H);
  panelInGeo.translate(W / 2, (PANEL_H - H) / 2, 0);
  var panelOutGeo = new THREE.PlaneGeometry(W, PANEL_H);
  panelOutGeo.rotateY(Math.PI);
  panelOutGeo.translate(W / 2, (PANEL_H - H) / 2, -0.002);
  var coverFrontGeo = new THREE.PlaneGeometry(W, COVER_H);
  coverFrontGeo.translate(W / 2, -H / 2 + COVER_H / 2, 0.001);
  var coverBackGeo = new THREE.PlaneGeometry(W, COVER_H);
  coverBackGeo.rotateY(Math.PI);
  coverBackGeo.translate(W / 2, -H / 2 + COVER_H / 2, -0.001);
  // mirror image of the cover, flipped upside down, sitting under the floor line
  var REFLECT_H = COVER_H * 0.6;
  var reflectGeo = new THREE.PlaneGeometry(W, REFLECT_H);
  (function () {
    var uv = reflectGeo.attributes.uv;
    var cut = REFLECT_H / COVER_H;
    for (var i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) > 0.5 ? 0 : cut);
  })();
  reflectGeo.translate(W / 2, FLOOR_Y - REFLECT_H / 2 - 0.004, 0.02);
  var shadowGeo = new THREE.PlaneGeometry(1, 1);
  shadowGeo.rotateX(-Math.PI / 2);
  var THREAD_LEN = 8;
  var threadGeo = new THREE.PlaneGeometry(0.02, THREAD_LEN);
  threadGeo.translate(0, THREAD_LEN / 2, 0);

  // ---------- floor light & backdrop ----------
  var floorLight = noHit(new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.12, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })
  ));
  floorLight.rotation.x = -Math.PI / 2;
  scene.add(floorLight);

  // Dims everything behind an open folder.
  var backdrop = noHit(new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false, fog: false })
  ));
  backdrop.visible = false;
  scene.add(backdrop);

  // ---------- the carousel ----------
  var ring = new THREE.Group();
  scene.add(ring);
  var folders = [];
  var R = 3.4, STEP = 1;

  function disposeFolder(f) {
    f.disposables.forEach(function (d) { d.dispose(); });
    f.pages.forEach(function (p) {
      if (p.tex) { p.tex.dispose(); p.front.material.dispose(); }
      p.geo.dispose();
    });
  }

  function buildFolder(data, index) {
    var coverCanvas = Art.drawCover(data, index);
    var tex = {
      cover: canvasTexture(coverCanvas, maxAniso),
      reflect: canvasTexture(blurredCopy(coverCanvas)),
      inside: canvasTexture(Art.drawCoverInside(data), maxAniso),
      panelIn: canvasTexture(Art.drawPanel(data, index, "in"), maxAniso),
      panelOut: canvasTexture(Art.drawPanel(data, index, "out"), maxAniso)
    };
    var coverMat = paperMaterial(tex.cover);
    var insideMat = paperMaterial(tex.inside);
    var panelInMat = paperMaterial(tex.panelIn);
    var panelOutMat = paperMaterial(tex.panelOut);
    var reflectMat = new THREE.MeshBasicMaterial({ map: tex.reflect, alphaMap: fadeTex, transparent: true, opacity: 0, depthWrite: false });
    var shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: theme.shadow, depthWrite: false, fog: false });

    var group = new THREE.Group();
    var inner = new THREE.Group();
    inner.position.x = -W / 2;
    group.add(inner);

    // soft contact shadow + reflection on the floor
    var shadow = noHit(new THREE.Mesh(shadowGeo, shadowMat));
    shadow.scale.set(W * 1.5, 1, 0.7);
    shadow.position.set(0, FLOOR_Y + 0.002, 0.05);
    group.add(shadow);
    var reflection = noHit(new THREE.Mesh(reflectGeo, reflectMat));
    inner.add(reflection);

    // back panel with its tab (inside face + outside face)
    inner.add(new THREE.Mesh(panelInGeo, panelInMat));
    inner.add(new THREE.Mesh(panelOutGeo, panelOutMat));

    // pages (each has its own bendable sheet so it can curl)
    var pagesGroup = new THREE.Group();
    inner.add(pagesGroup);
    var n = data.pages.length;
    var pages = data.pages.map(function (pd, i) {
      var pivot = new THREE.Group();
      pivot.position.z = rightZ(i, n);
      // closed folders: sheets sit a little crooked, like real paper
      pivot.rotation.z = (i % 2 ? 1 : -1) * 0.006 * (1 + (i % 3));
      pivot.position.y = 0.035 + (i % 3) * 0.01;
      var geo = new THREE.PlaneGeometry(PW, PH, CURL_SEGMENTS, 1);
      var front = new THREE.Mesh(geo, blankPageMat);
      var back = new THREE.Mesh(geo, pageBackMat);
      front.frustumCulled = back.frustumCulled = false;
      pivot.add(front, back);
      pagesGroup.add(pivot);
      var p = { pivot: pivot, front: front, geo: geo, data: pd, tex: null, flip: 0, dir: 1, tilt: pivot.rotation.z, lift: pivot.position.y };
      bendPage(p, 0);
      return p;
    });

    // front cover (opens to the left)
    var cover = new THREE.Group();
    cover.position.z = coverZ(n);
    cover.add(new THREE.Mesh(coverFrontGeo, coverMat));
    cover.add(new THREE.Mesh(coverBackGeo, insideMat));
    inner.add(cover);

    // two fine threads holding the folder by the corners of its tab, with a tiny bead at each hole
    var top = H / 2 + (PANEL_H - H) * 0.62;
    var span = Art.tabSpan(index);
    [[span[0] * W, -0.025], [span[1] * W, 0.025]].forEach(function (s) {
      var t = noHit(new THREE.Mesh(threadGeo, threadMat));
      t.position.set(s[0], top, -0.004);
      t.rotation.z = s[1];
      inner.add(t);
      var bead = noHit(new THREE.Mesh(beadGeo, beadMat));
      bead.position.set(s[0], top, 0);
      inner.add(bead);
    });

    group.traverse(function (o) { o.userData.folderIndex = index; });

    return {
      data: data, index: index, group: group, inner: inner, cover: cover, pagesGroup: pagesGroup, pages: pages,
      reflection: reflection, shadow: shadow, tex: tex,
      baseAngle: 0,
      disposables: [tex.cover, tex.reflect, tex.inside, tex.panelIn, tex.panelOut, coverMat, insideMat, panelInMat, panelOutMat, reflectMat, shadowMat]
    };
  }

  // Redraws the pictures of a folder in place (used when the language changes).
  function redrawFolder(f) {
    f.tex.cover.image = Art.drawCover(f.data, f.index);
    f.tex.reflect.image = blurredCopy(f.tex.cover.image);
    f.tex.inside.image = Art.drawCoverInside(f.data);
    f.tex.panelIn.image = Art.drawPanel(f.data, f.index, "in");
    f.tex.panelOut.image = Art.drawPanel(f.data, f.index, "out");
    ["cover", "reflect", "inside", "panelIn", "panelOut"].forEach(function (k) { f.tex[k].needsUpdate = true; });
    f.pages.forEach(function (p, i) { if (p.tex) buildPageTexture(f, i); });
  }

  function rightZ(i, n) { return 0.004 + (n - 1 - i) * PAGE_GAP; }
  function leftZ(i) { return 0.006 + i * PAGE_GAP; }
  function coverZ(n) { return 0.008 + n * PAGE_GAP; }

  // Bends a page along its width: the free edge leads, like real paper being turned.
  var curlX = new Float32Array(CURL_SEGMENTS + 1);
  var curlZ = new Float32Array(CURL_SEGMENTS + 1);
  function bendPage(p, k) {
    var theta = Math.PI * k;
    var curl = 1.15 * Math.sin(Math.PI * k) * p.dir;
    var hinge = 0.03;
    var seg = PW / CURL_SEGMENTS;
    var x = hinge * Math.cos(theta), z = hinge * Math.sin(theta);
    for (var j = 0; j <= CURL_SEGMENTS; j++) {
      curlX[j] = x;
      curlZ[j] = z;
      var u = (j + 0.5) / CURL_SEGMENTS;
      var phi = Math.min(Math.PI, Math.max(0, theta + curl * (u - 0.5)));
      x += Math.cos(phi) * seg;
      z += Math.sin(phi) * seg;
    }
    var pos = p.geo.attributes.position;
    var cols = CURL_SEGMENTS + 1;
    for (var row = 0; row < 2; row++) {
      for (var c = 0; c < cols; c++) {
        var idx = row * cols + c;
        pos.setX(idx, curlX[c]);
        pos.setZ(idx, curlZ[c]);
      }
    }
    pos.needsUpdate = true;
    p.geo.computeVertexNormals();
  }

  function buildRing() {
    folders.forEach(function (f) { ring.remove(f.group); disposeFolder(f); });
    var N = DATA.folders.length;
    STEP = (Math.PI * 2) / N;
    R = Math.max(3.4, (N * 2.3) / (Math.PI * 2));
    folders = DATA.folders.map(function (d, i) {
      var f = buildFolder(d, i);
      var a = i * STEP;
      f.group.position.set(Math.sin(a) * R, 0, Math.cos(a) * R);
      f.group.rotation.y = a;
      f.baseAngle = a;
      ring.add(f.group);
      return f;
    });
    floorLight.position.set(0, FLOOR_Y - 0.001, R - 0.2);
    floorLight.scale.set(7, 4.5, 1);
    backdrop.position.set(0, 0, R - 0.45);
    buildTabsUI();
    layoutCameras();
  }

  // ---------- day / night ----------
  var THEMES = {
    night: { fog: 0x000000, reflect: 0.42, shadow: 0.0, floor: 0.10, thread: 0xffffff, threadOpacity: 0.55, bead: 0xffffff, backdrop: 0x000000 },
    day: { fog: 0xececef, reflect: 0.3, shadow: 0.35, floor: 0.0, thread: 0x1d1d1f, threadOpacity: 0.35, bead: 0x1d1d1f, backdrop: 0xf2f2f4 }
  };
  var theme = THEMES[Settings.effectiveTheme()];
  var fogNear = 8, fogFar = 16;

  function applyTheme() {
    theme = THEMES[Settings.effectiveTheme()];
    scene.fog = new THREE.Fog(theme.fog, fogNear, fogFar);
    threadMat.color.setHex(theme.thread);
    threadMat.opacity = theme.threadOpacity;
    beadMat.color.setHex(theme.bead);
    floorLight.material.opacity = theme.floor;
    floorLight.visible = theme.floor > 0;
    backdrop.material.color.setHex(theme.backdrop);
    folders.forEach(function (f) { f.shadow.material.opacity = theme.shadow; });
    needsRender = true;
  }

  // ---------- cameras ----------
  var carouselCam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  var openCam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  var lookAt = new THREE.Vector3();

  function layoutCameras() {
    var aspect = window.innerWidth / window.innerHeight;
    var tan = Math.tan((FOV * Math.PI) / 360);
    var needW = Math.min(2 * R + 0.4, 8.6);
    var dC = Math.max(5.0 / tan / 2, needW / 2 / (tan * aspect));
    carouselCam.pos.set(0, 0.35, R + dC);
    carouselCam.look.set(0, -0.6, R - 0.8);
    var dO = Math.max(3.0 / 2 / tan, 3.55 / 2 / (tan * aspect));
    openCam.pos.set(0, -0.06, R + dO);
    openCam.look.set(0, -0.06, R);
    fogNear = dC + 0.6;
    fogFar = dC + 2 * R + 1.5;
    scene.fog = new THREE.Fog(theme.fog, fogNear, fogFar);
    if (mode === "carousel") setCamera(carouselCam);
    if (mode === "open") setCamera(openCam);
  }

  function setCamera(c) {
    camera.position.copy(c.pos);
    lookAt.copy(c.look);
    camera.lookAt(lookAt);
  }

  // ---------- tweens ----------
  var tweens = [];
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeInOutQuint(t) { return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2; }
  function tween(duration, delay, update, done, ease) {
    var tw = { d: Math.max(0.001, duration * SPEED), delay: delay * SPEED, t: 0, update: update, done: done, ease: ease || easeInOut };
    tweens.push(tw);
    return tw;
  }
  function stepTweens(dt) {
    var list = tweens.slice();
    for (var i = 0; i < list.length; i++) {
      var tw = list[i];
      tw.t += dt;
      if (tw.t < tw.delay) continue;
      var p = Math.min(1, (tw.t - tw.delay) / tw.d);
      tw.update(tw.ease(p), p);
      if (p >= 1) {
        tweens.splice(tweens.indexOf(tw), 1);
        if (tw.done) tw.done();
      }
    }
  }

  // ---------- state ----------
  var mode = "carousel";       // carousel | opening | open | closing
  var current = 0;             // folder at the front
  var angle = 0, targetAngle = 0, angleVel = 0;
  var openFolder = null;
  var openAmount = 0;          // 0 = carousel, 1 = folder fully open
  var pageIndex = 0;
  var needsRender = true;
  var ambient = params.get("quality") !== "low" && !reduceMotion;

  function mod(a, n) { return ((a % n) + n) % n; }

  function goTo(index) {
    var target = -index * STEP;
    while (target - angle > Math.PI) target -= Math.PI * 2;
    while (target - angle < -Math.PI) target += Math.PI * 2;
    targetAngle = target;
    current = mod(index, folders.length);
    updateUI();
  }

  // ---------- page textures (only for the open folder) ----------
  var buildQueue = [];

  function pageInfo(f, i, p) {
    return { folderIndex: f.index, pageIndex: i, pageCount: f.pages.length, revealed: !!p.data._revealed };
  }

  function buildPageTexture(f, i) {
    var p = f.pages[i];
    var c = Art.drawPage(p.data, f.data, pageInfo(f, i, p));
    if (p.tex) {
      p.tex.image = c;
      p.tex.needsUpdate = true;
    } else {
      p.tex = canvasTexture(c, maxAniso);
      p.front.material = paperMaterial(p.tex);
      renderer.initTexture(p.tex);
    }
    needsRender = true;
    loadPagePicture(f, i);
  }

  function loadPagePicture(f, i) {
    var p = f.pages[i];
    var src = p.data.poster || (p.data.type === "image" ? p.data.src : null) || (p.data.type === "gallery" && p.data.images ? p.data.images[0] : null);
    if (!src || p.data._img || p.data._imgLoading) return;
    if (!canDrawImages && src.indexOf("blob:") !== 0) return;
    p.data._imgLoading = true;
    var img = new Image();
    img.onload = function () {
      p.data._img = img;
      if (openFolder === f && p.tex) buildPageTexture(f, i);
    };
    img.src = src;
  }

  function releasePageTextures(f) {
    buildQueue.length = 0;
    f.pages.forEach(function (p) {
      if (p.tex) {
        p.tex.dispose();
        p.front.material.dispose();
        p.tex = null;
        p.front.material = blankPageMat;
      }
    });
  }

  // ---------- open / close / flip ----------
  function openCurrent() {
    if (mode !== "carousel") return;
    var f = folders[current];
    if (!f.pages.length) return;
    mode = "opening";
    openFolder = f;
    pageIndex = 0;
    angle = targetAngle;
    angleVel = 0;
    ring.rotation.y = angle;
    buildPageTexture(f, 0);
    for (var i = 1; i < f.pages.length; i++) buildQueue.push([f, i]);

    var fromPos = camera.position.clone(), fromLook = lookAt.clone();
    var fromRot = f.group.rotation.z;
    backdrop.visible = true;
    tween(1.15, 0, function (k) {
      camera.position.lerpVectors(fromPos, openCam.pos, k);
      lookAt.lerpVectors(fromLook, openCam.look, k);
      camera.lookAt(lookAt);
      backdrop.material.opacity = 0.9 * k;
      f.group.rotation.z = fromRot * (1 - k);
      f.shadow.material.opacity = theme.shadow * (1 - k);
      openAmount = k;
      // straighten the sheets
      f.pages.forEach(function (p) {
        p.pivot.rotation.z = p.tilt * (1 - k);
        p.pivot.position.y = p.lift * (1 - k);
      });
    }, null, easeInOutQuint);
    tween(1.0, 0.3, function (k) {
      f.inner.position.x = -W / 2 + (W / 2) * k;
      f.cover.rotation.y = -Math.PI * k;
      f.cover.position.z = coverZ(f.pages.length) * (1 - k);
      f.cover.position.y = Math.sin(Math.PI * k) * 0.03;
    }, function () {
      mode = "open";
      updateUI();
    });
    updateUI();
  }

  function closeFolder(after) {
    if (mode !== "open") return;
    var f = openFolder;
    mode = "closing";
    MediaViewer.close(true);
    f.pages.forEach(function (p, i) {
      if (p.flip > 0) {
        var start = p.flip;
        p.dir = -1;
        tween(0.6, 0, function (k) {
          p.flip = start * (1 - k);
          applyFlip(p, i, f.pages.length);
        });
      }
    });
    var fromPos = camera.position.clone(), fromLook = lookAt.clone();
    tween(0.9, 0.25, function (k) {
      f.cover.rotation.y = -Math.PI * (1 - k);
      f.cover.position.z = coverZ(f.pages.length) * k;
      f.inner.position.x = -(W / 2) * k;
    });
    tween(1.15, 0.45, function (k) {
      camera.position.lerpVectors(fromPos, carouselCam.pos, k);
      lookAt.lerpVectors(fromLook, carouselCam.look, k);
      camera.lookAt(lookAt);
      backdrop.material.opacity = 0.9 * (1 - k);
      f.shadow.material.opacity = theme.shadow * k;
      openAmount = 1 - k;
      f.pages.forEach(function (p) {
        p.pivot.rotation.z = p.tilt * k;
        p.pivot.position.y = p.lift * k;
      });
    }, function () {
      backdrop.visible = false;
      releasePageTextures(f);
      openFolder = null;
      mode = "carousel";
      updateUI();
      if (after) after();
    }, easeInOutQuint);
    updateUI();
  }

  function applyFlip(p, i, n) {
    var k = p.flip;
    bendPage(p, k);
    p.pivot.position.z = rightZ(i, n) * (1 - k) + leftZ(i) * k;
  }

  function flipTo(target) {
    var f = openFolder;
    var n = f.pages.length;
    target = Math.max(0, Math.min(n - 1, target));
    if (target === pageIndex) return;
    var dir = target > pageIndex ? 1 : -1;
    var stagger = 0;
    while (pageIndex !== target) {
      var i = dir > 0 ? pageIndex : pageIndex - 1;
      animateFlip(f.pages[i], i, n, dir > 0 ? 1 : 0, stagger);
      stagger += 0.12;
      pageIndex += dir;
    }
    MediaViewer.close(true);
    updateUI();
  }

  function animateFlip(p, i, n, to, delay) {
    var from = p.flip;
    p.dir = to > from ? 1 : -1;
    tween(0.9, delay || 0, function (k) {
      p.flip = from + (to - from) * k;
      applyFlip(p, i, n);
    }, function () {
      updateUI();
    });
  }

  function next() {
    if (mode === "carousel") return openCurrent();
    if (mode !== "open") return;
    if (pageIndex < openFolder.pages.length - 1) flipTo(pageIndex + 1);
    else closeFolder(function () { goTo(current + 1); });
  }

  function prev() {
    if (mode === "carousel") return goTo(current - 1);
    if (mode !== "open") return;
    if (pageIndex > 0) flipTo(pageIndex - 1);
    else closeFolder();
  }

  function currentPage() {
    return mode === "open" ? openFolder.pages[pageIndex] : null;
  }

  function doAction() {
    var p = currentPage();
    if (!p) return false;
    if (Art.isMedia(p.data)) {
      MediaViewer.open(p.data, function () { needsRender = true; });
      return true;
    }
    if (p.data.type === "quiz") {
      p.data._revealed = !p.data._revealed;
      buildPageTexture(openFolder, pageIndex);
      updateUI();
      return true;
    }
    return false;
  }

  // Clicker / keyboard "next": reveal first, then move on.
  function presenterNext() {
    var p = currentPage();
    if (p && p.data.type === "quiz" && !p.data._revealed) return doAction();
    next();
  }

  // ---------- UI ----------
  var ui = {
    tabs: document.getElementById("tabs"),
    folderName: document.getElementById("folder-name"),
    pageCount: document.getElementById("page-count"),
    action: document.getElementById("action"),
    hint: document.getElementById("hint"),
    openBtn: document.getElementById("btn-open"),
    capTitle: document.getElementById("cap-title"),
    capSub: document.getElementById("cap-sub"),
    caption: document.getElementById("caption")
  };

  function buildTabsUI() {
    ui.tabs.innerHTML = "";
    folders.forEach(function (f, i) {
      var b = document.createElement("button");
      b.className = "tab";
      b.textContent = T(f.data.tab);
      b.style.setProperty("--tab", f.data.color);
      b.addEventListener("click", function () {
        if (mode !== "carousel") return;
        if (i === current) openCurrent(); else goTo(i);
      });
      ui.tabs.appendChild(b);
    });
  }

  var shownCaption = -1;
  function updateCaption() {
    if (shownCaption === current) return;
    shownCaption = current;
    var f = folders[current];
    ui.caption.classList.remove("in");
    void ui.caption.offsetWidth; // restart the fade-in
    ui.capTitle.textContent = T(f.data.title);
    ui.capSub.textContent = T(f.data.subtitle);
    ui.caption.classList.add("in");
  }

  function updateUI() {
    var isOpen = mode === "open" || mode === "opening";
    document.body.classList.toggle("is-open", isOpen);
    Array.prototype.forEach.call(ui.tabs.children, function (b, i) {
      b.classList.toggle("active", i === current);
    });
    var f = folders[current];
    ui.openBtn.textContent = L.t("open", { x: T(f.data.tab) });
    updateCaption();
    if (openFolder) {
      ui.folderName.textContent = T(openFolder.data.title);
      ui.pageCount.textContent = L.t("pageOf", { n: pageIndex + 1, m: openFolder.pages.length });
    }
    var p = currentPage();
    var label = "";
    if (p && mode === "open") {
      if (p.data.type === "video") label = "▶  " + L.t("playVideo");
      else if (Art.isMedia(p.data)) label = "⤢  " + L.t("openFull");
      else if (p.data.type === "quiz") label = L.t(p.data._revealed ? "hideAnswer" : "showAnswer");
    }
    if (label) ui.action.textContent = label;
    ui.action.classList.toggle("show", !!label);
    needsRender = true;
  }

  // Called by the settings panel.
  window.addEventListener("languagechange-app", function () {
    folders.forEach(redrawFolder);
    buildTabsUI();
    shownCaption = -1;
    updateUI();
  });
  window.addEventListener("themechange-app", applyTheme);

  document.getElementById("btn-prev").addEventListener("click", function () { goTo(current - 1); });
  document.getElementById("btn-next").addEventListener("click", function () { goTo(current + 1); });
  ui.openBtn.addEventListener("click", openCurrent);
  document.getElementById("btn-page-prev").addEventListener("click", prev);
  document.getElementById("btn-page-next").addEventListener("click", next);
  document.getElementById("btn-close").addEventListener("click", function () { closeFolder(); });
  ui.action.addEventListener("click", doAction);

  document.getElementById("btn-full").addEventListener("click", function () {
    var d = document, el = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    } else {
      var req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) req.call(el);
    }
  });

  function hideHint() { ui.hint.classList.add("gone"); }

  // ---------- touch / mouse ----------
  var raycaster = new THREE.Raycaster();
  var pointer = null;

  canvas.addEventListener("pointerdown", function (e) {
    if (pointer) return;
    Settings.closePanel();
    pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, lastT: performance.now(), moved: false, vel: 0 };
    canvas.setPointerCapture(e.pointerId);
    angleVel = 0;
  });

  canvas.addEventListener("pointermove", function (e) {
    if (!pointer || e.pointerId !== pointer.id) return;
    var dx = e.clientX - pointer.lastX;
    if (Math.abs(e.clientX - pointer.x) > 10 || Math.abs(e.clientY - pointer.y) > 10) pointer.moved = true;
    var now = performance.now();
    if (mode === "carousel" && pointer.moved) {
      var k = (Math.PI * 0.9) / Math.max(600, window.innerWidth);
      angle += dx * k;
      targetAngle = angle;
      var dt = Math.max(1, now - pointer.lastT);
      pointer.vel = pointer.vel * 0.6 + ((dx * k) / dt) * 1000 * 0.4;
      needsRender = true;
      hideHint();
    }
    pointer.lastX = e.clientX;
    pointer.lastT = now;
  });

  function endPointer(e) {
    if (!pointer || e.pointerId !== pointer.id) return;
    var p = pointer;
    pointer = null;
    var dx = e.clientX - p.x;
    if (mode === "carousel") {
      if (p.moved) {
        angleVel = p.vel;
        var projected = angle + p.vel * 0.3;
        goTo(Math.round(-projected / STEP));
      } else {
        tapAt(e.clientX, e.clientY);
      }
    } else if (mode === "open") {
      if (p.moved && Math.abs(dx) > 50) {
        if (dx < 0) next(); else prev();
      } else if (!p.moved) {
        tapAt(e.clientX, e.clientY);
      }
    }
    hideHint();
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", function (e) {
    if (pointer && e.pointerId === pointer.id) {
      pointer = null;
      if (mode === "carousel") goTo(Math.round(-angle / STEP));
    }
  });

  function tapAt(x, y) {
    var v = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(v, camera);
    if (mode === "carousel") {
      var hits = raycaster.intersectObject(ring, true).filter(function (h) { return h.object.isMesh; });
      if (!hits.length) return;
      var idx = hits[0].object.userData.folderIndex;
      if (idx === current) openCurrent(); else goTo(idx);
    } else if (mode === "open") {
      var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -R);
      var point = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
      if (!point || Math.abs(point.x) > W + 0.1 || Math.abs(point.y) > H / 2 + 0.2) return;
      if (point.x < 0) prev(); else next();
    }
  }

  var wheelLock = 0;
  canvas.addEventListener("wheel", function (e) {
    e.preventDefault();
    var now = performance.now();
    if (now < wheelLock || mode !== "carousel") return;
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 8) return;
    wheelLock = now + 350;
    goTo(current + (d > 0 ? 1 : -1));
    hideHint();
  }, { passive: false });

  // ---------- keyboard and presentation clickers ----------
  window.addEventListener("keydown", function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    var k = e.key;
    if (MediaViewer.isOpen()) {
      if (k === "Escape") MediaViewer.close();
      else if (k === "ArrowLeft" || k === "PageUp") MediaViewer.step(-1);
      else if (k === "ArrowRight") MediaViewer.step(1);
      else if (k === "PageDown") MediaViewer.close();
      else if (k === " ") { if (!MediaViewer.togglePlay()) MediaViewer.step(1); }
      else return;
      e.preventDefault();
      return;
    }
    hideHint();
    var nextKeys = ["PageDown", " ", "ArrowDown"];
    if (k === "f" || k === "F") document.getElementById("btn-full").click();
    else if (k === "Escape" && Settings.isOpen()) Settings.closePanel();
    else if (mode === "carousel") {
      if (k === "ArrowRight") goTo(current + 1);
      else if (k === "ArrowLeft" || k === "PageUp" || k === "ArrowUp") goTo(current - 1);
      else if (k === "Enter" || nextKeys.indexOf(k) >= 0) openCurrent();
      else if (k === "Home") goTo(0);
      else return;
    } else if (mode === "open") {
      if (k === "Enter") { if (!doAction()) next(); }
      else if (nextKeys.indexOf(k) >= 0 || k === "ArrowRight") presenterNext();
      else if (k === "ArrowLeft" || k === "PageUp" || k === "ArrowUp") prev();
      else if (k === "Escape" || k === "Backspace") closeFolder();
      else return;
    } else return;
    e.preventDefault();
  });

  // ---------- add files (videos, PDFs, pictures) ----------
  var fileInput = document.getElementById("file-input");
  document.getElementById("btn-add").addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    addFiles(fileInput.files);
    fileInput.value = "";
  });

  var dropZone = document.getElementById("drop");
  var dragDepth = 0;
  window.addEventListener("dragenter", function (e) { e.preventDefault(); dragDepth++; dropZone.hidden = false; });
  window.addEventListener("dragleave", function () { if (--dragDepth <= 0) { dragDepth = 0; dropZone.hidden = true; } });
  window.addEventListener("dragover", function (e) { e.preventDefault(); });
  window.addEventListener("drop", function (e) {
    e.preventDefault();
    dragDepth = 0;
    dropZone.hidden = true;
    if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });

  function addFiles(list) {
    var pages = [];
    Array.prototype.forEach.call(list, function (file) {
      var type = null;
      if (/^video\//.test(file.type)) type = "video";
      else if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) type = "pdf";
      else if (/^image\//.test(file.type)) type = "image";
      if (!type) return;
      pages.push({ type: type, title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "), src: URL.createObjectURL(file), caption: "" });
    });
    if (!pages.length) {
      alert(L.t("onlyMedia"));
      return;
    }
    var go = function () {
      var added = DATA.folders.filter(function (f) { return f._added; })[0];
      if (!added) {
        added = {
          tab: { en: "Added Files", es: "Archivos añadidos", ru: "Добавленные файлы" },
          color: "#8e8e93",
          title: { en: "Added Files", es: "Archivos añadidos", ru: "Добавленные файлы" },
          subtitle: { en: "Shared today", es: "Compartidos hoy", ru: "Добавлены сегодня" },
          pages: [], _added: true
        };
        DATA.folders.push(added);
      }
      added.pages = added.pages.concat(pages);
      buildRing();
      applyTheme();
      angle = targetAngle = -current * STEP;
      shownCaption = -1;
      goTo(DATA.folders.indexOf(added));
    };
    if (mode === "open") closeFolder(go); else if (mode === "carousel") go();
  }

  // ---------- resize ----------
  function resize() {
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    layoutCameras();
    needsRender = true;
  }
  window.addEventListener("resize", resize);

  // ---------- automatic quality ----------
  var perf = { frames: 0, time: 0, warm: 0 };
  function watchPerformance(dt) {
    perf.warm += dt;
    if (perf.warm < 2.5) return;
    perf.frames++;
    perf.time += dt;
    if (perf.frames < 45) return;
    var fps = perf.frames / perf.time;
    perf.frames = 0;
    perf.time = 0;
    if (fps < 40 && quality > 0.3) {
      quality *= 0.75;
      if (quality < 0.6) {
        ambient = false;
        document.body.classList.add("lite");
      }
      resize();
    }
  }

  // ---------- per-frame updates ----------
  function stepCarousel(dt) {
    if (mode !== "carousel" || pointer) return false;
    var steps = Math.ceil(dt / 0.016);
    var h = dt / steps;
    for (var s = 0; s < steps; s++) {
      var force = (targetAngle - angle) * 34 - angleVel * 10.5;
      angleVel += force * h;
      angle += angleVel * h;
    }
    if (Math.abs(targetAngle - angle) > 0.0004 || Math.abs(angleVel) > 0.002) return true;
    angle = targetAngle;
    angleVel = 0;
    return false;
  }

  // "Star" layout: each folder turns to face you as it comes to the front and turns
  // edge-on at the back. The front folder is bigger and is the only one with a reflection.
  function updateFolders(t) {
    for (var i = 0; i < folders.length; i++) {
      var f = folders[i];
      var rel = Math.atan2(Math.sin(angle + f.baseAngle), Math.cos(angle + f.baseAngle));
      var front = Math.max(0, 1 - Math.abs(rel) / (STEP * 1.15));
      front = front * front * (3 - 2 * front);
      var isOpen = f === openFolder;
      f.group.rotation.y = f.baseAngle - rel / 2;
      var s = 0.8 + 0.2 * front;
      f.group.scale.setScalar(isOpen ? s + (1 - s) * openAmount : s);
      f.reflection.material.opacity = theme.reflect * front * front * (isOpen ? 1 - openAmount : 1);
      f.reflection.visible = f.reflection.material.opacity > 0.003;
      if (ambient && !isOpen) f.group.rotation.z = Math.sin(t * 0.6 + i * 2.3) * 0.006;
    }
  }

  // ---------- main loop ----------
  var clock = new THREE.Clock();
  var elapsed = 0;
  var swaySkip = 0;

  function frame() {
    requestAnimationFrame(frame);
    var dt = Math.min(clock.getDelta(), 0.1);
    elapsed += dt;

    if (buildQueue.length) {
      var job = buildQueue.shift();
      if (openFolder === job[0]) buildPageTexture(job[0], job[1]);
    }

    var moving = tweens.length > 0 || !!(pointer && pointer.moved);
    stepTweens(dt);
    if (stepCarousel(dt)) moving = true;
    ring.rotation.y = angle;

    var swaying = ambient && mode === "carousel";
    if (moving || needsRender || swaying) updateFolders(elapsed);

    if (moving || needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
      if (moving) watchPerformance(dt);
    } else if (swaying) {
      // idle: the folders sway very gently; 20 frames a second is plenty for that
      if (++swaySkip >= 3) { swaySkip = 0; renderer.render(scene, camera); }
    }
  }

  // ---------- start (after the font is ready, so the pictures use it) ----------
  function start() {
    buildRing();
    applyTheme();
    resize();
    setCamera(carouselCam);
    updateFolders(0);
    updateUI();
    renderer.render(scene, camera);
    document.getElementById("loading").classList.add("done");
    requestAnimationFrame(frame);

    // Links like  index.html#file=3&page=2  start on that folder and page.
    var startParams = new URLSearchParams(location.hash.slice(1));
    var startFile = parseInt(startParams.get("file"), 10);
    if (startFile >= 1 && startFile <= folders.length) {
      goTo(startFile - 1);
      angle = targetAngle;
      var startPage = parseInt(startParams.get("page"), 10);
      if (startPage >= 1) {
        openCurrent();
        var wait = setInterval(function () {
          if (mode !== "open") return;
          clearInterval(wait);
          flipTo(startPage - 1);
        }, 50);
      }
    }
  }

  var fontsReady = document.fonts && document.fonts.load
    ? Promise.all([
      document.fonts.load('800 40px "Inter"'), document.fonts.load('400 40px "Inter"'),
      document.fonts.load('700 40px "Inter"', "Кто")
    ])
    : Promise.resolve();
  var started = false;
  function startOnce() { if (!started) { started = true; start(); } }
  fontsReady.then(startOnce, startOnce);
  setTimeout(startOnce, 2500);

  window.App = {
    goTo: goTo, open: openCurrent, next: next, prev: prev, close: closeFolder, action: doAction,
    state: function () { return { mode: mode, folder: current, page: pageIndex, tweens: tweens.length, quality: quality, elapsed: elapsed }; }
  };
})();
