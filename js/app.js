/*
 * The 3-D scene: a carousel of folders hanging on puppet strings.
 * Tap / swipe to turn it, open a folder, and flip through its pages.
 *
 * Built to stay smooth on school smart boards:
 *  - it only redraws when something moves,
 *  - it limits how many pixels are drawn,
 *  - it lowers the quality by itself if the board is slow,
 *  - page pictures are made only for the folder that is open.
 *
 * Add ?quality=low to the address to force the lightest mode.
 */
(function () {
  "use strict";

  var DATA = window.PRESENTATION;
  var Art = window.PageArt;
  var params = new URLSearchParams(location.search);
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SPEED = reduceMotion ? 0.4 : 1;
  var canDrawImages = location.protocol !== "file:"; // browsers block reading pictures into 3-D from a USB stick

  // ---------- sizes (in 3-D units) ----------
  var W = 1.6, H = 2.1, T = 0.02;
  var PW = 1.5, PH = PW * Art.PAGE_H / Art.PAGE_W;
  var PAGE_GAP = 0.004;
  var FOV = 38;

  // ---------- renderer ----------
  var canvas = document.getElementById("scene");
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    document.getElementById("no3d").hidden = false;
    document.getElementById("loading").hidden = true;
    return;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  var maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  var quality = params.get("quality") === "low" ? 0.45 : 1;
  var PIXEL_BUDGET = 2.4e6; // about a 1080p screen
  function pixelRatio() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var budget = Math.sqrt((PIXEL_BUDGET * quality) / (window.innerWidth * window.innerHeight));
    return Math.max(0.5, Math.min(dpr, budget));
  }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xfff0d8, 0x1d140b, 2.4));
  var sun = new THREE.DirectionalLight(0xffe3b5, 2.2);
  sun.position.set(3, 5, 8);
  scene.add(sun);

  function canvasTexture(c, anisotropy) {
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = anisotropy || 1;
    return t;
  }

  // ---------- shared resources ----------
  var glowTex = canvasTexture(Art.drawGlow("#f0b660"));
  var pageBackTex = canvasTexture(Art.drawPageBack(), maxAniso);
  var pageBackMat = new THREE.MeshBasicMaterial({ map: pageBackTex });
  var blankPageMat = new THREE.MeshBasicMaterial({ color: 0xf1e9d6 });
  var stringMat = new THREE.LineBasicMaterial({ color: 0xe6b866, transparent: true, opacity: 0.35 });

  var pageFrontGeo = new THREE.PlaneGeometry(PW, PH);
  pageFrontGeo.translate(PW / 2 + 0.04, 0, 0);
  var pageBackGeo = new THREE.PlaneGeometry(PW, PH);
  pageBackGeo.rotateY(Math.PI);
  pageBackGeo.translate(PW / 2 + 0.04, 0, -0.0008);
  var backCoverGeo = new THREE.BoxGeometry(W, H, T);
  backCoverGeo.translate(W / 2, 0, 0);
  var frontCoverGeo = new THREE.BoxGeometry(W, H * 0.97, T);
  frontCoverGeo.translate(W / 2, -H * 0.015, 0);
  var tabGeo = new THREE.BoxGeometry(0.66, 0.2, T);

  // ---------- atmosphere: glow + floating specks like in the video ----------
  var backGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
  );
  scene.add(backGlow);
  var floorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
  );
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = -H / 2 - 0.3;
  scene.add(floorGlow);

  var SPECKS = 160;
  var speckPos = new Float32Array(SPECKS * 3);
  var speckSpeed = new Float32Array(SPECKS);
  var speckGeo = new THREE.BufferGeometry();
  speckGeo.setAttribute("position", new THREE.BufferAttribute(speckPos, 3));
  var speckMat = new THREE.PointsMaterial({
    map: glowTex, size: 0.14, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffd28a
  });
  var specks = new THREE.Points(speckGeo, speckMat);
  scene.add(specks);

  // Darkens everything behind an open folder.
  var backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshBasicMaterial({ color: 0x0b0806, transparent: true, opacity: 0, depthWrite: false, fog: false })
  );
  backdrop.visible = false;
  scene.add(backdrop);

  // ---------- the carousel ----------
  var ring = new THREE.Group();
  scene.add(ring);
  var folders = [];   // { data, group, inner, cover, pagesGroup, pages:[{pivot, front, data, tex}], disposables }
  var R = 3.2, STEP = 1;

  function disposeFolder(f) {
    f.disposables.forEach(function (d) { d.dispose(); });
    f.pages.forEach(function (p) { if (p.tex) p.tex.dispose(); });
  }

  function buildFolder(data, index) {
    var color = new THREE.Color(data.color);
    var leather = color.clone().multiplyScalar(0.22);
    var inside = color.clone().lerp(new THREE.Color(0xe8dcc2), 0.7).multiplyScalar(0.55);

    var coverTex = canvasTexture(Art.drawCover(data, index), maxAniso);
    var insideTex = canvasTexture(Art.drawCoverInside(data), maxAniso);
    var tabTex = canvasTexture(Art.drawTab(data), maxAniso);
    var edgeMat = new THREE.MeshLambertMaterial({ color: leather });
    var coverMat = new THREE.MeshLambertMaterial({ map: coverTex });
    var insideMat = new THREE.MeshLambertMaterial({ map: insideTex });
    var backInsideMat = new THREE.MeshLambertMaterial({ color: inside });
    var tabEdgeMat = new THREE.MeshLambertMaterial({ color: color });
    var tabMat = new THREE.MeshLambertMaterial({ map: tabTex });

    var group = new THREE.Group();
    var inner = new THREE.Group();
    inner.position.x = -W / 2;
    group.add(inner);

    // back cover + tab
    var back = new THREE.Mesh(backCoverGeo, [edgeMat, edgeMat, edgeMat, edgeMat, backInsideMat, coverMat]);
    inner.add(back);
    var tab = new THREE.Mesh(tabGeo, [tabEdgeMat, tabEdgeMat, tabEdgeMat, tabEdgeMat, tabMat, tabMat]);
    tab.position.set(0.4 + (index % 3) * 0.4, H / 2 + 0.095, 0);
    inner.add(tab);

    // pages
    var pagesGroup = new THREE.Group();
    pagesGroup.visible = false;
    inner.add(pagesGroup);
    var n = data.pages.length;
    var pages = data.pages.map(function (pd, i) {
      var pivot = new THREE.Group();
      pivot.position.z = rightZ(i, n);
      var front = new THREE.Mesh(pageFrontGeo, blankPageMat);
      var backSide = new THREE.Mesh(pageBackGeo, pageBackMat);
      pivot.add(front);
      pivot.add(backSide);
      pagesGroup.add(pivot);
      return { pivot: pivot, front: front, data: pd, tex: null, flip: 0 };
    });

    // front cover (opens to the left)
    var cover = new THREE.Group();
    cover.position.z = coverZ(n);
    cover.add(new THREE.Mesh(frontCoverGeo, [edgeMat, edgeMat, edgeMat, edgeMat, coverMat, insideMat]));
    inner.add(cover);

    // puppet strings going up from the folder
    var sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.Float32BufferAttribute([
      0.18, H / 2, 0, W / 2 - 0.35, 9, 0,
      W - 0.18, H / 2, 0, W / 2 + 0.35, 9, 0
    ], 3));
    inner.add(new THREE.LineSegments(sg, stringMat));

    group.traverse(function (o) { o.userData.folderIndex = index; });

    return {
      data: data, group: group, inner: inner, cover: cover, pagesGroup: pagesGroup, pages: pages,
      disposables: [coverTex, insideTex, tabTex, edgeMat, coverMat, insideMat, backInsideMat, tabEdgeMat, tabMat, sg]
    };
  }

  function rightZ(i, n) { return T / 2 + 0.003 + (n - 1 - i) * PAGE_GAP; }
  function leftZ(i) { return T / 2 + 0.006 + i * PAGE_GAP; }
  function coverZ(n) { return T / 2 + 0.003 + n * PAGE_GAP + T / 2 + 0.002; }

  function buildRing() {
    folders.forEach(function (f) { ring.remove(f.group); disposeFolder(f); });
    var N = DATA.folders.length;
    STEP = (Math.PI * 2) / N;
    R = Math.max(3.2, (N * 2.15) / (Math.PI * 2));
    folders = DATA.folders.map(function (d, i) {
      var f = buildFolder(d, i);
      var a = i * STEP;
      f.group.position.set(Math.sin(a) * R, 0, Math.cos(a) * R);
      f.group.rotation.y = a;
      ring.add(f.group);
      return f;
    });
    backGlow.position.set(0, 0.8, -R - 1.5);
    backGlow.scale.set(R * 7, R * 4.5, 1);
    floorGlow.scale.set(R * 3.4, R * 3.4, 1);
    backdrop.position.set(0, 0, R - 0.4);
    for (var i = 0; i < SPECKS; i++) resetSpeck(i, true);
    speckGeo.attributes.position.needsUpdate = true;
    buildTabsUI();
    layoutCameras();
  }

  function resetSpeck(i, anywhere) {
    speckPos[i * 3] = (Math.random() - 0.5) * (R * 2 + 10);
    speckPos[i * 3 + 1] = anywhere ? Math.random() * 7 - 2.5 : -2.5;
    speckPos[i * 3 + 2] = Math.random() * (2 * R + 3) - R - 3;
    speckSpeed[i] = 0.05 + Math.random() * 0.12;
  }

  // ---------- cameras ----------
  var carouselCam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  var openCam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  var lookAt = new THREE.Vector3();

  function layoutCameras() {
    var aspect = window.innerWidth / window.innerHeight;
    var tan = Math.tan((FOV * Math.PI) / 360);
    // carousel: show the front folder big, with neighbours on the sides
    var needW = Math.min(2 * R + 0.6, 8.2);
    var dC = Math.max(3.7 / tan / 2 + 0.6, needW / 2 / (tan * aspect));
    carouselCam.pos.set(0, 1.0, R + dC);
    carouselCam.look.set(0, 0.05, R - 0.6);
    // open folder: fit the two-page spread, leaving room for the buttons
    var dO = Math.max(3.0 / 2 / tan, 3.5 / 2 / (tan * aspect));
    openCam.pos.set(0, -0.1, R + dO);
    openCam.look.set(0, -0.1, R);
    scene.fog = new THREE.Fog(0x0d0a07, dC + 0.5, dC + 2 * R + 1);
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
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
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
  var angle = 0, targetAngle = 0;
  var openFolder = null;
  var pageIndex = 0;
  var flipping = 0;
  var needsRender = true;
  var ambient = params.get("quality") !== "low" && !reduceMotion;

  function mod(a, n) { return ((a % n) + n) % n; }

  function goTo(index) {
    var N = folders.length;
    var target = -index * STEP;
    // pick the closest way round
    while (target - angle > Math.PI) target -= Math.PI * 2;
    while (target - angle < -Math.PI) target += Math.PI * 2;
    targetAngle = target;
    current = mod(index, N);
    updateUI();
  }

  // ---------- page textures (only for the open folder) ----------
  var buildQueue = [];

  function pageInfo(f, i, p) {
    return { folderIndex: folders.indexOf(f), pageIndex: i, pageCount: f.pages.length, revealed: !!p.data._revealed };
  }

  function buildPageTexture(f, i) {
    var p = f.pages[i];
    var c = Art.drawPage(p.data, f.data, pageInfo(f, i, p));
    if (p.tex) {
      p.tex.image = c;
      p.tex.needsUpdate = true;
    } else {
      p.tex = canvasTexture(c, maxAniso);
      p.front.material = new THREE.MeshBasicMaterial({ map: p.tex });
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
    ring.rotation.y = angle;
    f.group.position.y = 0;
    f.pagesGroup.visible = true;
    // draw the first page now, the rest one per frame so nothing stutters
    buildPageTexture(f, 0);
    for (var i = 1; i < f.pages.length; i++) buildQueue.push([f, i]);

    var fromPos = camera.position.clone(), fromLook = lookAt.clone();
    backdrop.visible = true;
    tween(0.85, 0, function (k) {
      camera.position.lerpVectors(fromPos, openCam.pos, k);
      lookAt.lerpVectors(fromLook, openCam.look, k);
      camera.lookAt(lookAt);
      backdrop.material.opacity = 0.82 * k;
      speckMat.opacity = 0.9 * (1 - k);
    });
    tween(0.8, 0.2, function (k) {
      f.inner.position.x = -W / 2 + (W / 2) * k;
      f.cover.rotation.y = -Math.PI * 0.995 * k;
      f.cover.position.z = coverZ(f.pages.length) * (1 - k) + 0.0005 * k;
      f.cover.position.y = Math.sin(Math.PI * k) * 0.02;
    }, function () {
      mode = "open";
      specks.visible = false;
      updateUI();
    });
    updateUI();
  }

  function closeFolder(after) {
    if (mode !== "open") return;
    var f = openFolder;
    mode = "closing";
    MediaViewer.close(true);
    // un-flip the pages that were turned
    f.pages.forEach(function (p, i) {
      if (p.flip > 0) {
        var start = p.flip;
        tween(0.45, 0, function (k) {
          p.flip = start * (1 - k);
          applyFlip(p, i, f.pages.length);
        });
      }
    });
    var fromPos = camera.position.clone(), fromLook = lookAt.clone();
    specks.visible = true;
    tween(0.7, 0.2, function (k) {
      f.cover.rotation.y = -Math.PI * 0.995 * (1 - k);
      f.cover.position.z = coverZ(f.pages.length) * k + 0.0005 * (1 - k);
      f.inner.position.x = -(W / 2) * k;
    });
    tween(0.85, 0.35, function (k) {
      camera.position.lerpVectors(fromPos, carouselCam.pos, k);
      lookAt.lerpVectors(fromLook, carouselCam.look, k);
      camera.lookAt(lookAt);
      backdrop.material.opacity = 0.82 * (1 - k);
      speckMat.opacity = 0.9 * k;
    }, function () {
      backdrop.visible = false;
      f.pagesGroup.visible = false;
      releasePageTextures(f);
      openFolder = null;
      mode = "carousel";
      updateUI();
      if (after) after();
    });
    updateUI();
  }

  function applyFlip(p, i, n) {
    var k = p.flip;
    p.pivot.rotation.y = -Math.PI * 0.995 * k;
    p.pivot.position.z = rightZ(i, n) * (1 - k) + leftZ(i) * k + Math.sin(Math.PI * k) * 0.18;
  }

  function flipTo(target) {
    var f = openFolder;
    var n = f.pages.length;
    target = Math.max(0, Math.min(n - 1, target));
    if (target === pageIndex) return;
    var dir = target > pageIndex ? 1 : -1;
    while (pageIndex !== target) {
      var i = dir > 0 ? pageIndex : pageIndex - 1;
      animateFlip(f.pages[i], i, n, dir > 0 ? 1 : 0);
      pageIndex += dir;
    }
    MediaViewer.close(true);
    updateUI();
  }

  function animateFlip(p, i, n, to) {
    var from = p.flip;
    flipping++;
    tween(0.65, 0, function (k) {
      p.flip = from + (to - from) * k;
      applyFlip(p, i, n);
    }, function () {
      flipping--;
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

  // The button under a video / PDF / quiz page.
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

  // Clicker / keyboard "next": reveal or play first, then move on.
  function presenterNext() {
    var p = currentPage();
    if (p && p.data.type === "quiz" && !p.data._revealed) return doAction();
    next();
  }

  // ---------- UI ----------
  var ui = {
    tabs: document.getElementById("tabs"),
    carouselBar: document.getElementById("carousel-bar"),
    openBar: document.getElementById("open-bar"),
    folderName: document.getElementById("folder-name"),
    pageCount: document.getElementById("page-count"),
    action: document.getElementById("action"),
    hint: document.getElementById("hint"),
    openBtn: document.getElementById("btn-open")
  };

  function buildTabsUI() {
    ui.tabs.innerHTML = "";
    folders.forEach(function (f, i) {
      var b = document.createElement("button");
      b.className = "tab";
      b.textContent = f.data.tab;
      b.style.setProperty("--tab", f.data.color);
      b.addEventListener("click", function () {
        if (mode !== "carousel") return;
        if (i === current) openCurrent(); else goTo(i);
      });
      ui.tabs.appendChild(b);
    });
  }

  function updateUI() {
    var isOpen = mode === "open" || mode === "opening";
    document.body.classList.toggle("is-open", isOpen);
    Array.prototype.forEach.call(ui.tabs.children, function (b, i) {
      b.classList.toggle("active", i === current);
    });
    var f = folders[current];
    ui.openBtn.textContent = "Open “" + f.data.tab + "”";
    if (openFolder) {
      ui.folderName.textContent = openFolder.data.title;
      ui.pageCount.textContent = "Page " + (pageIndex + 1) + " of " + openFolder.pages.length;
    }
    var p = currentPage();
    var label = "";
    if (p && mode === "open") {
      if (p.data.type === "video") label = "▶ Play video";
      else if (Art.isMedia(p.data)) label = "⤢ Open full screen";
      else if (p.data.type === "quiz") label = p.data._revealed ? "Hide answer" : "Show answer";
    }
    ui.action.textContent = label;
    ui.action.hidden = !label;
    needsRender = true;
  }

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
  var pointer = null; // { id, x, y, lastX, lastT, moved, vel }

  canvas.addEventListener("pointerdown", function (e) {
    if (pointer) return;
    pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, lastT: performance.now(), moved: false, vel: 0 };
    canvas.setPointerCapture(e.pointerId);
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
        // glide a little, then settle on the nearest folder
        var projected = angle + p.vel * 0.25;
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
      var hit = raycaster.intersectObject(openFolder.group, true).filter(function (h) { return h.object.isMesh; })[0];
      if (!hit) return;
      var local = openFolder.group.worldToLocal(hit.point.clone());
      if (local.x < 0) prev(); else next();
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
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
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
      alert("Only videos (.mp4), PDFs and pictures can be added.");
      return;
    }
    var go = function () {
      var added = DATA.folders.filter(function (f) { return f._added; })[0];
      if (!added) {
        added = { tab: "Added Files", color: "#9fb0c4", title: "Added Files", subtitle: "Shared today", pages: [], _added: true };
        DATA.folders.push(added);
      }
      added.pages = added.pages.concat(pages);
      buildRing();
      angle = targetAngle = -current * STEP;
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
    if (perf.warm < 2.5) return;           // ignore the first seconds while things load
    perf.frames++;
    perf.time += dt;
    if (perf.frames < 45) return;
    var fps = perf.frames / perf.time;
    perf.frames = 0;
    perf.time = 0;
    if (fps < 40 && quality > 0.3) {
      quality *= 0.75;
      if (quality < 0.6) ambient = false;    // stop the floating specks to save power
      resize();
    }
  }

  // ---------- main loop ----------
  var clock = new THREE.Clock();
  var elapsed = 0;
  var ambientSkip = false;

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

    if (mode === "carousel" && !pointer) {
      var diff = targetAngle - angle;
      if (Math.abs(diff) > 0.0005) {
        angle += diff * (1 - Math.exp(-dt * 7));
        moving = true;
      } else {
        angle = targetAngle;
      }
    }
    ring.rotation.y = angle;

    var ambientNow = ambient && mode !== "open";
    if (ambientNow) {
      // gentle puppet sway + floating specks
      folders.forEach(function (f, i) {
        if (f !== openFolder) f.group.position.y = Math.sin(elapsed * 0.9 + i * 1.7) * 0.04;
      });
      for (var i = 0; i < SPECKS; i++) {
        speckPos[i * 3 + 1] += speckSpeed[i] * dt;
        if (speckPos[i * 3 + 1] > 4.5) resetSpeck(i, false);
      }
      speckGeo.attributes.position.needsUpdate = true;
    }

    if (moving || needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
      ambientSkip = false;
      if (moving) watchPerformance(dt);
    } else if (ambientNow) {
      // idle: 30 frames a second is plenty for drifting specks
      ambientSkip = !ambientSkip;
      if (!ambientSkip) renderer.render(scene, camera);
    }
  }

  // ---------- start ----------
  buildRing();
  resize();
  setCamera(carouselCam);
  updateUI();
  renderer.render(scene, camera);
  document.getElementById("loading").hidden = true;
  requestAnimationFrame(frame);

  // Links like  index.html#file=3&page=2  start on that file and page.
  var start = new URLSearchParams(location.hash.slice(1));
  var startFile = parseInt(start.get("file"), 10);
  if (startFile >= 1 && startFile <= folders.length) {
    goTo(startFile - 1);
    angle = targetAngle;
    var startPage = parseInt(start.get("page"), 10);
    if (startPage >= 1) {
      openCurrent();
      var wait = setInterval(function () {
        if (mode !== "open") return;
        clearInterval(wait);
        flipTo(startPage - 1);
      }, 50);
    }
  }

  // for testing in the browser console
  window.App = {
    goTo: goTo, open: openCurrent, next: next, prev: prev, close: closeFolder, action: doAction,
    state: function () { return { mode: mode, folder: current, page: pageIndex, tweens: tweens.length, quality: quality, elapsed: elapsed }; }
  };
})();
