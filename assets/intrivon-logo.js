/* INTRIVON hero.
   The company mark turns once as a solid object, then unfolds into a short wordless story
   of an AI agent at work, following the firm's own method: it observes (gathers data),
   evaluates (compares options) and acts and learns (delivers a decision, takes feedback),
   before folding back into the mark. Draws in a 640-unit space, scaled to the device
   pixel ratio. Pauses off screen, when hidden, or on request; honours reduced motion. */
(() => {
  const canvas = document.getElementById('intrivon-logo');
  const button = document.getElementById('logo-toggle');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const SIZE = 640, CX = SIZE / 2, CY = SIZE / 2, FOCAL = 1700;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- timeline (ms) ---------- */
  const PH = [
    ['turn', 5200], ['morph', 1400], ['observe', 5600], ['evaluate', 6200], ['act', 4800], ['back', 1400]
  ];
  const CYCLE = PH.reduce((s, p) => s + p[1], 0);
  function phaseAt(ms) {
    let t = ms % CYCLE;
    for (const [name, len] of PH) { if (t < len) return { name, t, len, u: t / len }; t -= len; }
    return { name: 'turn', t: 0, len: PH[0][1], u: 0 };
  }

  /* ---------- helpers ---------- */
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const seg = (t, a, b) => ease((t - a) / (b - a));           // 0→1 between times a and b
  const fadeInOut = (t, len, f = 450) => Math.min(seg(t, 0, f), seg(t, len, len - f)); // soft edges
  const AQUA = [100, 211, 206], WHITE = [255, 255, 255], MIST = [157, 176, 187];
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mix = (a, b, t) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * t));

  function diamond(cx, cy, r) {
    ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath();
  }
  function bez(p0, p1, p2, p3, s) { // cubic Bézier point
    const k = 1 - s;
    return [k * k * k * p0[0] + 3 * k * k * s * p1[0] + 3 * k * s * s * p2[0] + s * s * s * p3[0],
            k * k * k * p0[1] + 3 * k * k * s * p1[1] + 3 * k * s * s * p2[1] + s * s * s * p3[1]];
  }
  function curve(pts, p, colour, width, dash) { // draw the first p (0..1) of a polyline
    const n = Math.max(2, Math.round(pts.length * clamp(p)));
    if (n < 2) return;
    ctx.beginPath(); pts.slice(0, n).forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
    ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
  }
  const sample = (p0, p1, p2, p3, n = 48) => Array.from({ length: n + 1 }, (_, i) => bez(p0, p1, p2, p3, i / n));
  function caption(text, alpha) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = rgb(AQUA);
    ctx.font = '700 17px Calibri, Carlito, "Segoe UI", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.18em';
    ctx.fillText(text, CX + 4, 586); ctx.restore();
  }
  function core(cx, cy, r, glow = 0.35, alpha = 1) { // the agent: the mark's diamond, with a halo
    ctx.save(); ctx.globalAlpha = alpha;
    diamond(cx, cy, r + 10); ctx.strokeStyle = rgb(AQUA, glow); ctx.lineWidth = 1.5; ctx.stroke();
    diamond(cx, cy, r); ctx.fillStyle = rgb(AQUA); ctx.fill(); ctx.restore();
  }

  /* ---------- the mark as a solid object ---------- */
  const S = 4.9, OX = 50, OY = 53.25;                 // from assets/intrivon-mark-dark.svg (100-unit field)
  const pt = ([x, y]) => [(x - OX) * S, (y - OY) * S];
  const V_POLY = [[4, 38], [50, 84], [96, 38], [77.5, 38], [50, 65.5], [22.5, 38]].map(pt);
  const D_POLY = [[50, 22.5], [65.5, 38], [50, 53.5], [34.5, 38]].map(pt);
  const D_CY = (38 - OY) * S, D_R = 15.5 * S;         // the diamond's centre (relative) and half-diagonal
  const bodies = [
    { id: 'v', poly: V_POLY, z0: -16, z1: 16, cap: WHITE, back: [214, 224, 230], dark: [96, 114, 130], light: [214, 224, 230] },
    { id: 'd', poly: D_POLY, z0: -6, z1: 28, cap: AQUA, back: [82, 190, 185], dark: [12, 100, 97], light: [82, 190, 185] }
  ];
  const faces = [];
  bodies.forEach(b => {
    const n = b.poly.length; let area = 0;
    for (let i = 0; i < n; i++) { const [x1, y1] = b.poly[i], [x2, y2] = b.poly[(i + 1) % n]; area += x1 * y2 - x2 * y1; }
    const sign = area > 0 ? 1 : -1;
    faces.push({ pts: b.poly.map(([x, y]) => [x, y, b.z1]), normal: [0, 0, 1], kind: 'cap', body: b });
    faces.push({ pts: b.poly.map(([x, y]) => [x, y, b.z0]), normal: [0, 0, -1], kind: 'back', body: b });
    for (let i = 0; i < n; i++) {
      const a = b.poly[i], c = b.poly[(i + 1) % n], dx = c[0] - a[0], dy = c[1] - a[1], len = Math.hypot(dx, dy);
      faces.push({ pts: [[a[0], a[1], b.z0], [c[0], c[1], b.z0], [c[0], c[1], b.z1], [a[0], a[1], b.z1]], normal: [sign * dy / len, -sign * dx / len, 0], kind: 'side', body: b });
    }
  });
  const LIGHT = (() => { const l = [-0.45, -0.6, 0.66], m = Math.hypot(...l); return l.map(v => v / m); })();
  function rotate([x, y, z], a) {
    const x1 = x * Math.cos(a.ry) + z * Math.sin(a.ry), z1 = -x * Math.sin(a.ry) + z * Math.cos(a.ry);
    const y2 = y * Math.cos(a.rx) - z1 * Math.sin(a.rx), z2 = y * Math.sin(a.rx) + z1 * Math.cos(a.rx);
    return [x1, y2, z2];
  }
  const project = ([x, y, z]) => { const f = FOCAL / (FOCAL - z); return [CX + x * f, CY + y * f]; };
  // opts: per-body { scale, alpha, dy } so the mark can shrink into its core and grow back.
  function drawMark(a, opts = {}) {
    const drawn = [];
    faces.forEach(f => {
      const o = opts[f.body.id] || {};
      const sc = o.scale ?? 1, al = o.alpha ?? 1, dy = o.dy ?? 0;
      if (al <= 0) return;
      const n = rotate(f.normal, a);
      if (n[2] <= 0.02) return;
      const pts = f.pts.map(([x, y, z]) => rotate([x * sc, y * sc + dy, z * sc], a));
      const depth = pts.reduce((s, p) => s + p[2], 0) / pts.length;
      let colour;
      if (f.kind === 'cap') colour = f.body.cap;
      else if (f.kind === 'back') colour = f.body.back;
      else { const lit = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]); colour = mix(f.body.dark, f.body.light, 0.15 + 0.85 * lit); }
      drawn.push({ depth, colour, alpha: al, screen: pts.map(project) });
    });
    drawn.sort((p, q) => p.depth - q.depth);
    ctx.lineJoin = 'round';
    drawn.forEach(f => {
      ctx.globalAlpha = f.alpha;
      ctx.beginPath(); f.screen.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      ctx.fillStyle = rgb(f.colour); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.8; ctx.fill(); ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  /* ---------- scenes ---------- */
  const CORE_R = 22;
  let corePulse = 0; // extra halo when a packet arrives

  // Observe: data sources on the left feed the agent.
  const NODES = [170, 245, 320, 395, 470].map((y, i) => {
    const p0 = [128, y], p3 = [CX - CORE_R - 14, CY];
    return { p0, pts: sample(p0, [CX - 130, y], [CX - 90, CY], p3), delay: i * 260, start: 480 + i * 260 };
  });
  function observe(t, len) {
    const out = seg(t, len, len - 500); // 1 → 0 at the end
    NODES.forEach((nd, i) => {
      const appear = seg(t, nd.delay, nd.delay + 450) * out;
      if (appear <= 0) return;
      ctx.save(); ctx.globalAlpha = appear;
      const s = 9 * appear;
      ctx.strokeStyle = rgb(WHITE, 0.85); ctx.lineWidth = 1.5;
      ctx.strokeRect(nd.p0[0] - s - 6, nd.p0[1] - s, 2 * s, 2 * s);
      // a little "data" inside: two short lines
      ctx.strokeStyle = rgb(WHITE, 0.45); ctx.beginPath();
      ctx.moveTo(nd.p0[0] - s - 2, nd.p0[1] - 3); ctx.lineTo(nd.p0[0] + s - 10, nd.p0[1] - 3);
      ctx.moveTo(nd.p0[0] - s - 2, nd.p0[1] + 3); ctx.lineTo(nd.p0[0] + s - 13, nd.p0[1] + 3); ctx.stroke();
      // connection draws toward the core
      const p = seg(t, nd.start, nd.start + 700);
      curve(nd.pts, p, rgb(MIST, 0.55), 1.25);
      // packets travel once the line is complete
      if (p >= 1) {
        for (let k = 0; k < 2; k++) {
          const s2 = ((t - nd.start - 700) / 1300 + k * 0.5 + i * 0.17) % 1;
          if (s2 < 0) continue;
          const q = nd.pts[Math.round(s2 * (nd.pts.length - 1))];
          ctx.globalAlpha = appear * Math.min(1, s2 * 6, (1 - s2) * 6);
          ctx.fillStyle = rgb(AQUA); ctx.beginPath(); ctx.arc(q[0], q[1], 3, 0, Math.PI * 2); ctx.fill();
          if (s2 > 0.96) corePulse = Math.max(corePulse, 1);
        }
      }
      ctx.restore();
    });
    caption('01 / OBSERVE', fadeInOut(t, len));
  }

  // Evaluate: options fan out to the right; the agent scans them and settles on one.
  const OPTS = [-140, -70, 0, 70, 140].map((dy, i) => {
    const p0 = [CX + CORE_R + 14, CY], p3 = [536, CY + dy];
    return { pts: sample(p0, [CX + 110, CY], [CX + 150, CY + dy], p3), end: p3, value: [0.55, 0.85, 0.4, 0.95, 0.62][i] };
  });
  const CHOSEN = 1;
  function evaluate(t, len) {
    const out = seg(t, len, len - 500);
    const scanStart = 1900, scanEach = 420, decide = scanStart + scanEach * OPTS.length + 250;
    OPTS.forEach((op, i) => {
      const p = seg(t, 150 * i, 150 * i + 900);
      if (p <= 0) return;
      const scanning = clamp(1 - Math.abs((t - (scanStart + scanEach * i + scanEach / 2)) / (scanEach * 0.6)));
      const decided = seg(t, decide, decide + 500);
      const isChosen = i === CHOSEN;
      let colour = mix(MIST, WHITE, scanning), alpha = 0.55 + 0.45 * scanning, width = 1.25 + 1.2 * scanning;
      if (decided > 0) {
        if (isChosen) { colour = mix(colour, AQUA, decided); width = 1.25 + 1.5 * decided; alpha = 1; }
        else alpha *= 1 - 0.75 * decided;
      }
      ctx.save(); ctx.globalAlpha = alpha * out;
      curve(op.pts, p, rgb(colour), width);
      // the option's measure: a short bar at the end of each curve
      const bp = seg(t, 150 * i + 900, 150 * i + 1500) * op.value * 64;
      if (bp > 0) {
        ctx.fillStyle = rgb(isChosen && decided > 0 ? AQUA : MIST, 0.55);
        ctx.fillRect(op.end[0] + 8, op.end[1] - 3, bp, 6);
      }
      ctx.restore();
    });
    caption('02 / EVALUATE', fadeInOut(t, len));
  }

  // Act & learn: the chosen course becomes a delivered decision; feedback flows back to the agent.
  const CARD = { x: 552, y: CY - 70 - 44, w: 72, h: 88 };
  const LOOP = sample([CARD.x + CARD.w / 2, CARD.y + CARD.h + 4], [CARD.x + 40, CY + 170], [CX + 80, CY + 170], [CX, CY + CORE_R + 14]);
  function act(t, len) {
    const out = seg(t, len, len - 500);
    const op = OPTS[CHOSEN];
    ctx.save(); ctx.globalAlpha = out;
    curve(op.pts, 1, rgb(AQUA), 2.6);
    // link from the course to the card
    const link = seg(t, 0, 500);
    ctx.beginPath(); ctx.moveTo(op.end[0], op.end[1]); ctx.lineTo(op.end[0] + (CARD.x - op.end[0]) * link, op.end[1]);
    ctx.strokeStyle = rgb(AQUA); ctx.lineWidth = 2.6; ctx.stroke();
    // the card draws itself
    const cp = seg(t, 450, 1100);
    if (cp > 0) {
      ctx.strokeStyle = rgb(WHITE, 0.9); ctx.lineWidth = 1.5;
      const per = (CARD.w + CARD.h) * 2 * cp;
      ctx.setLineDash([per, 9999]); ctx.strokeRect(CARD.x, CARD.y, CARD.w, CARD.h); ctx.setLineDash([]);
    }
    [0, 1, 2].forEach(i => {
      const lp = seg(t, 1100 + i * 220, 1400 + i * 220);
      if (lp <= 0) return;
      ctx.strokeStyle = rgb(WHITE, 0.5); ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(CARD.x + 12, CARD.y + 20 + i * 14); ctx.lineTo(CARD.x + 12 + (CARD.w - 24) * (i === 2 ? 0.6 : 1) * lp, CARD.y + 20 + i * 14); ctx.stroke();
    });
    const stamp = seg(t, 1900, 2250);
    if (stamp > 0) { diamond(CARD.x + CARD.w - 18, CARD.y + CARD.h - 18, 8 * stamp); ctx.fillStyle = rgb(AQUA); ctx.fill(); }
    // feedback loop back to the agent
    const lp = seg(t, 2300, 3100);
    if (lp > 0) {
      curve(LOOP, lp, rgb(MIST, 0.55), 1.25, [4, 6]);
      if (lp >= 1) {
        const s2 = ((t - 3100) / 1300) % 1;
        const q = LOOP[Math.round(s2 * (LOOP.length - 1))];
        ctx.globalAlpha = out * Math.min(1, s2 * 6, (1 - s2) * 6);
        ctx.fillStyle = rgb(AQUA); ctx.beginPath(); ctx.arc(q[0], q[1], 3, 0, Math.PI * 2); ctx.fill();
        if (s2 > 0.96) corePulse = Math.max(corePulse, 1);
      }
    }
    ctx.restore();
    caption('03 / ACT & LEARN', fadeInOut(t, len));
  }

  /* ---------- frame ---------- */
  let playing = !reduced.matches, visible = true, elapsed = 0, previous = 0, frameId = 0, lastDraw = 0;
  let tiltX = 0, tiltY = 0, targetX = 0, targetY = 0;

  function turnAngles(u) { // starts and ends at rest, facing front; quickest past the back
    return { ry: 2 * Math.PI * u - Math.sin(2 * Math.PI * u) + tiltX * 0.3, rx: 0.14 + 0.2 * Math.sin(2 * Math.PI * u) + tiltY * 0.25 };
  }

  function draw(ms) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    const ph = phaseAt(ms);
    corePulse = Math.max(0, corePulse - 0.06);
    if (ph.name === 'turn') {
      drawMark(turnAngles(ph.u));
      return;
    }
    if (ph.name === 'morph' || ph.name === 'back') {
      // m: 0 = the full mark, 1 = only the agent core at the centre
      const m = ph.name === 'morph' ? ease(ph.u) : 1 - ease(ph.u);
      const a = { ry: tiltX * 0.3 * (1 - m), rx: 0.14 * (1 - m) + tiltY * 0.25 * (1 - m) };
      drawMark(a, {
        v: { scale: 1 - 0.35 * m, alpha: 1 - m },
        d: { scale: 1 - (1 - CORE_R / D_R) * m, dy: -D_CY * m }
      });
      return;
    }
    if (ph.name === 'observe') observe(ph.t, ph.len);
    else if (ph.name === 'evaluate') evaluate(ph.t, ph.len);
    else if (ph.name === 'act') act(ph.t, ph.len);
    // the halo appears with the first scene and leaves with the last; the diamond itself is continuous
    const halo = ph.name === 'observe' ? seg(ph.t, 0, 500) : ph.name === 'act' ? seg(ph.t, ph.len, ph.len - 500) : 1;
    const breathe = 1 + 0.05 * Math.sin(ms / 260) * halo;
    core(CX, CY, CORE_R * breathe, (0.35 + 0.5 * corePulse) * halo);
  }

  function fit() {
    const css = canvas.clientWidth || 430;
    const px = Math.round(css * Math.min(window.devicePixelRatio || 1, 2.5));
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
    ctx.setTransform(px / SIZE, 0, 0, px / SIZE, 0, 0);
  }
  function still() { ctx.clearRect(0, 0, SIZE, SIZE); drawMark({ ry: -0.55 + tiltX * 0.3, rx: 0.2 + tiltY * 0.25 }); }

  function frame(now) {
    frameId = 0;
    if (!playing || !visible || document.hidden) return;
    if (previous) elapsed += Math.min(now - previous, 100);
    previous = now;
    frameId = requestAnimationFrame(frame);
    if (now - lastDraw < 28) return; // ~30 fps is plenty and halves the work on phones
    lastDraw = now;
    tiltX += (targetX - tiltX) * 0.1;
    tiltY += (targetY - tiltY) * 0.1;
    draw(elapsed);
  }
  function sync() {
    cancelAnimationFrame(frameId); frameId = 0; previous = 0;
    if (button) {
      button.textContent = playing ? 'Pause animation' : 'Play animation';
      button.setAttribute('aria-label', playing ? 'Pause logo animation' : 'Play logo animation');
    }
    if (playing && visible && !document.hidden) frameId = requestAnimationFrame(frame);
  }

  if (button) button.addEventListener('click', () => { playing = !playing; sync(); });
  reduced.addEventListener('change', () => { playing = !reduced.matches; if (reduced.matches) still(); sync(); });
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(canvas);

  const hero = canvas.closest('.hero');
  if (hero && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('pointermove', e => {
      const b = hero.getBoundingClientRect();
      targetX = ((e.clientX - b.left) / b.width - 0.5) * 2;
      targetY = ((e.clientY - b.top) / b.height - 0.5) * 2;
      if (!playing && reduced.matches) { tiltX = targetX; tiltY = targetY; still(); }
    });
    hero.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; if (!playing && reduced.matches) { tiltX = 0; tiltY = 0; still(); } });
  }

  const refit = () => { fit(); if (reduced.matches && !playing) still(); else draw(elapsed); };
  if ('ResizeObserver' in window) new ResizeObserver(refit).observe(canvas); else window.addEventListener('resize', refit);
  if (document.fonts && document.fonts.load) document.fonts.load('700 17px Carlito').catch(() => {});
  fit();
  if (reduced.matches) still(); else draw(0);
  sync();
  // For previews and tests: window.intrivonHero.seek(ms) draws one moment of the story.
  window.intrivonHero = { seek(ms) { playing = false; sync(); elapsed = ms; draw(ms); }, cycle: CYCLE };
})();
