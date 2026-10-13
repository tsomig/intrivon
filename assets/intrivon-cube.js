(() => {
  const canvas = document.getElementById('intrivon-cube');
  const button = document.getElementById('cube-toggle');
  if (!canvas || !button) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const edges = [];
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
    const n = i ^ j;
    if (n === 1 || n === 2 || n === 4) edges.push([i, j]);
  }
  let playing = !reduced.matches, visible = true, elapsed = 0, previous = 0, frameId = 0;
  const ease = x => x * x * (3 - 2 * x);
  function state(ms) {
    const t = (ms % 16000) / 16000;
    if (t < .12) return { depth: 0, rx: 0, ry: 0 };
    if (t < .34) { const u = ease((t - .12) / .22); return { depth: u, rx: u * .56, ry: u * .63 }; }
    if (t < .77) { const u = (t - .34) / .43; return { depth: 1, rx: .56 + .16 * Math.sin(u * Math.PI * 2), ry: .63 + u * Math.PI * 2 }; }
    if (t < .94) { const u = ease((t - .77) / .17); return { depth: 1 - u, rx: .56 * (1 - u), ry: .63 * (1 - u) + Math.PI * 2 }; }
    return { depth: 0, rx: 0, ry: 0 };
  }
  function project(x, y, z, s) {
    z *= s.depth;
    const y1 = y * Math.cos(s.rx) - z * Math.sin(s.rx), z1 = y * Math.sin(s.rx) + z * Math.cos(s.rx);
    const x1 = x * Math.cos(s.ry) + z1 * Math.sin(s.ry), z2 = -x * Math.sin(s.ry) + z1 * Math.cos(s.ry);
    const a = Math.PI / 4, perspective = 650 / (650 - z2 * .32);
    return [320 + (x1 * Math.cos(a) - y1 * Math.sin(a)) * perspective, 320 + (x1 * Math.sin(a) + y1 * Math.cos(a)) * perspective, z2];
  }
  function draw(ms) {
    const s = state(ms);
    ctx.clearRect(0, 0, 640, 640); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    [172, 108, 42].forEach((r, layer) => {
      const v = Array.from({ length: 8 }, (_, i) => project((i & 1) ? r : -r, (i & 2) ? r : -r, (i & 4) ? r : -r, s));
      if (layer === 2) {
        const faces = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
        faces.sort((a, b) => a.reduce((sum, i) => sum + v[i][2], 0) - b.reduce((sum, i) => sum + v[i][2], 0));
        faces.forEach(f => { ctx.beginPath(); f.forEach((i, k) => k ? ctx.lineTo(v[i][0], v[i][1]) : ctx.moveTo(v[i][0], v[i][1])); ctx.closePath(); ctx.fillStyle = '#64d3ce'; ctx.globalAlpha = .2 + s.depth * .12; ctx.fill(); });
        if (s.depth === 0) { ctx.beginPath(); [0, 1, 3, 2].forEach((i, k) => k ? ctx.lineTo(v[i][0], v[i][1]) : ctx.moveTo(v[i][0], v[i][1])); ctx.closePath(); ctx.globalAlpha = 1; ctx.fillStyle = '#64d3ce'; ctx.fill(); }
      }
      ctx.lineWidth = layer === 0 ? 10 : layer === 1 ? 8 : 5;
      edges.sort((a, b) => v[a[0]][2] + v[a[1]][2] - v[b[0]][2] - v[b[1]][2]);
      edges.forEach(([i, j]) => { ctx.globalAlpha = s.depth === 0 ? 1 : Math.max(.2, Math.min(1, .34 + .66 * ((v[i][2] + v[j][2]) / (r * 4) + .5))); ctx.strokeStyle = layer === 0 ? '#ffffff' : '#64d3ce'; ctx.beginPath(); ctx.moveTo(v[i][0], v[i][1]); ctx.lineTo(v[j][0], v[j][1]); ctx.stroke(); });
    }); ctx.globalAlpha = 1;
  }
  function frame(now) {
    frameId = 0;
    if (!playing || !visible || document.hidden) return;
    if (previous) elapsed += Math.min(now - previous, 100);
    previous = now; draw(elapsed); frameId = requestAnimationFrame(frame);
  }
  function sync() {
    cancelAnimationFrame(frameId); frameId = 0; previous = 0;
    button.textContent = playing ? 'Pause animation' : 'Play animation';
    button.setAttribute('aria-label', playing ? 'Pause cube animation' : 'Play cube animation');
    if (playing && visible && !document.hidden) frameId = requestAnimationFrame(frame);
  }
  button.addEventListener('click', () => { playing = !playing; sync(); });
  reduced.addEventListener('change', () => { playing = !reduced.matches; if (reduced.matches) { elapsed = 0; draw(0); } sync(); });
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .05 }).observe(canvas);
  draw(0); sync();
})();
