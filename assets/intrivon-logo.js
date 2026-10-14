/* INTRIVON hero: the company mark (the Value V and its core diamond) as a solid object,
   turning slowly in three dimensions. Draws in a 640-unit space and scales to the device
   pixel ratio so it stays sharp. Pauses when off screen, hidden, or on request. */
(() => {
  const canvas = document.getElementById('intrivon-logo');
  const button = document.getElementById('logo-toggle');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const SIZE = 640, TURN = 15000, FOCAL = 1700;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Geometry from assets/intrivon-mark-dark.svg (100-unit field), centred and scaled up.
  const S = 4.9, CX = 50, CY = 53.25;
  const pt = ([x, y]) => [(x - CX) * S, (y - CY) * S];
  const bodies = [
    { // the V
      poly: [[4, 38], [50, 84], [96, 38], [77.5, 38], [50, 65.5], [22.5, 38]].map(pt),
      z0: -16, z1: 16, cap: [255, 255, 255], back: [214, 224, 230], dark: [96, 114, 130], light: [214, 224, 230]
    },
    { // the core diamond, raised a little in front of the V
      poly: [[50, 22.5], [65.5, 38], [50, 53.5], [34.5, 38]].map(pt),
      z0: -6, z1: 28, cap: [100, 211, 206], back: [82, 190, 185], dark: [12, 100, 97], light: [82, 190, 185]
    }
  ];

  // Build faces once: caps plus one quad per outline edge, each with its outward normal.
  const faces = [];
  bodies.forEach(b => {
    const n = b.poly.length;
    let area = 0;
    for (let i = 0; i < n; i++) { const [x1, y1] = b.poly[i], [x2, y2] = b.poly[(i + 1) % n]; area += x1 * y2 - x2 * y1; }
    const sign = area > 0 ? 1 : -1;
    faces.push({ pts: b.poly.map(([x, y]) => [x, y, b.z1]), normal: [0, 0, 1], kind: 'cap', body: b });
    faces.push({ pts: b.poly.map(([x, y]) => [x, y, b.z0]), normal: [0, 0, -1], kind: 'back', body: b });
    for (let i = 0; i < n; i++) {
      const a = b.poly[i], c = b.poly[(i + 1) % n];
      const dx = c[0] - a[0], dy = c[1] - a[1], len = Math.hypot(dx, dy);
      faces.push({
        pts: [[a[0], a[1], b.z0], [c[0], c[1], b.z0], [c[0], c[1], b.z1], [a[0], a[1], b.z1]],
        normal: [sign * dy / len, -sign * dx / len, 0], kind: 'side', body: b
      });
    }
  });

  const LIGHT = (() => { const l = [-0.45, -0.6, 0.66], m = Math.hypot(...l); return l.map(v => v / m); })();
  const rgb = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mix = (a, b, t) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * t));

  let playing = !reduced.matches, visible = true, elapsed = 0, previous = 0, frameId = 0, lastDraw = 0;
  let tiltX = 0, tiltY = 0, targetX = 0, targetY = 0;

  function fit() {
    const css = canvas.clientWidth || 430;
    const px = Math.round(css * Math.min(window.devicePixelRatio || 1, 2.5));
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
    ctx.setTransform(px / SIZE, 0, 0, px / SIZE, 0, 0);
  }

  // Slow near the front view, quicker past the back; a gentle nod adds the third axis.
  function angles(ms) {
    const u = (ms % TURN) / TURN;
    return {
      ry: 2 * Math.PI * u - 0.5 * Math.sin(2 * Math.PI * u) + tiltX * 0.3,
      rx: 0.14 + 0.2 * Math.sin(2 * Math.PI * u) + tiltY * 0.25
    };
  }

  function rotate([x, y, z], a) {
    const x1 = x * Math.cos(a.ry) + z * Math.sin(a.ry), z1 = -x * Math.sin(a.ry) + z * Math.cos(a.ry);
    const y2 = y * Math.cos(a.rx) - z1 * Math.sin(a.rx), z2 = y * Math.sin(a.rx) + z1 * Math.cos(a.rx);
    return [x1, y2, z2];
  }
  function project([x, y, z]) {
    const f = FOCAL / (FOCAL - z);
    return [SIZE / 2 + x * f, SIZE / 2 + y * f];
  }

  function draw(a) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.lineJoin = 'round';
    const drawn = [];
    faces.forEach(f => {
      const n = rotate(f.normal, a);
      if (n[2] <= 0.02) return; // facing away
      const pts = f.pts.map(p => rotate(p, a));
      const depth = pts.reduce((s, p) => s + p[2], 0) / pts.length;
      let colour;
      if (f.kind === 'cap') colour = f.body.cap;
      else if (f.kind === 'back') colour = f.body.back;
      else {
        const lit = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        colour = mix(f.body.dark, f.body.light, 0.15 + 0.85 * lit);
      }
      drawn.push({ depth, colour, screen: pts.map(project) });
    });
    drawn.sort((p, q) => p.depth - q.depth); // far to near
    drawn.forEach(f => {
      ctx.beginPath();
      f.screen.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.closePath();
      ctx.fillStyle = rgb(f.colour, 1); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.8;
      ctx.fill(); ctx.stroke();
    });
  }

  function frame(now) {
    frameId = 0;
    if (!playing || !visible || document.hidden) return;
    if (previous) elapsed += Math.min(now - previous, 100);
    previous = now;
    frameId = requestAnimationFrame(frame);
    if (now - lastDraw < 28) return; // ~30 fps is plenty for a slow turn and halves the work on phones
    lastDraw = now;
    tiltX += (targetX - tiltX) * 0.1;
    tiltY += (targetY - tiltY) * 0.1;
    draw(angles(elapsed));
  }

  function still() { draw({ ry: -0.55 + tiltX * 0.3, rx: 0.2 + tiltY * 0.25 }); }

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
      if (!playing) { tiltX = targetX; tiltY = targetY; still(); }
    });
    hero.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; if (!playing) { tiltX = 0; tiltY = 0; still(); } });
  }

  const refit = () => { fit(); if (playing) draw(angles(elapsed)); else still(); };
  if ('ResizeObserver' in window) new ResizeObserver(refit).observe(canvas); else window.addEventListener('resize', refit);
  fit();
  if (reduced.matches) still(); else draw(angles(0));
  sync();
})();
