(() => {
  const source = document.querySelector('#team .team-grid');
  if (!source) return;
  const profiles = [...source.querySelectorAll('.team-card')].map(card => ({
    name: card.querySelector('h3').textContent.trim(),
    role: card.querySelector('.role').textContent.trim(),
    bio: card.querySelector('.bio').textContent.trim(),
    portrait: card.querySelector('.portrait-frame')
  }));
  if (profiles.length !== 4) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const stage = document.createElement('div');
  stage.className = 'experts';
  stage.setAttribute('role', 'region');
  stage.setAttribute('aria-roledescription', 'carousel');
  stage.setAttribute('aria-label', 'Meet our team');
  const arrow = direction => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${direction < 0 ? 'M14 5l-7 7 7 7' : 'M10 5l7 7-7 7'}"/></svg>`;
  stage.innerHTML = `
    <svg class="expert-light-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs><filter id="portrait-light-lift" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="gamma" amplitude="1" exponent=".86" offset="0"/><feFuncG type="gamma" amplitude="1" exponent=".86" offset="0"/><feFuncB type="gamma" amplitude="1" exponent=".86" offset="0"/></feComponentTransfer></filter></defs></svg>
    <div class="expert-heading"><h3 class="expert-name"></h3><p class="expert-role"></p></div>
    <div class="expert-photo expert-slot" data-slot="active" aria-hidden="true"><span class="portrait-frame"></span></div>
    <p class="expert-bio"></p>
    <div class="expert-peer expert-peer--previous expert-slot" data-slot="previous" aria-hidden="true"><span class="portrait-frame"></span><span class="expert-peer-name">Team member</span></div>
    <div class="expert-peer expert-peer--next expert-slot" data-slot="next" aria-hidden="true"><span class="portrait-frame"></span><span class="expert-peer-name">Team member</span></div>
    <div class="expert-peer expert-peer--last expert-slot" data-slot="last" aria-hidden="true"><span class="portrait-frame"></span><span class="expert-peer-name">Team member</span></div>
    <div class="expert-portraits"></div>
    <div class="expert-controls" role="group" aria-label="Team playback controls">
      <button type="button" class="expert-playback" aria-label="Pause automatic team rotation" data-paused="false">
        <svg class="play-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4v16l13-8z"/></svg>
        <svg class="pause-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>
      </button>
      <button type="button" class="expert-arrow" data-step="-1" aria-label="Previous team member">${arrow(-1)}</button>
      <button type="button" class="expert-arrow" data-step="1" aria-label="Next team member">${arrow(1)}</button>
    </div>
    <span class="expert-status" aria-live="polite" aria-atomic="true"></span>`;
  const layer = stage.querySelector('.expert-portraits');
  const heading = stage.querySelector('.expert-heading');
  const bio = stage.querySelector('.expert-bio');
  const playback = stage.querySelector('.expert-playback');
  const cards = profiles.map((person, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'expert-portrait';
    button.dataset.index = index;
    button.setAttribute('aria-label', `View ${person.name}, ${person.role}`);
    const frame = document.createElement('span');
    frame.className = 'portrait-frame';
    frame.style.cssText = person.portrait.style.cssText;
    const image = person.portrait.querySelector('img').cloneNode(true);
    image.alt = '';
    image.className = 'portrait-base';
    image.loading = 'eager';
    const graded = document.createElement('span');
    graded.className = 'portrait-grade';
    graded.setAttribute('aria-hidden', 'true');
    frame.append(image, graded);
    const label = document.createElement('span');
    label.className = 'expert-peer-name';
    label.textContent = person.name;
    button.append(frame, label);
    layer.append(button);
    return button;
  });
  let active = 0;
  let playing = !reducedMotion.matches;
  let timer = null;
  let wrapAnimation = null;
  let resizeFrame = null;
  const pauseTime = 4000;
  const duration = 1000;
  const easing = 'cubic-bezier(.25,.75,.25,1)';
  const slotNames = ['active', 'next', 'last', 'previous'];
  const visible = () => {
    const r = stage.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  };
  function reflectPlayback() {
    playback.dataset.paused = String(!playing);
    playback.setAttribute('aria-label', playing ? 'Pause automatic team rotation' : 'Start automatic team rotation');
  }
  function schedule() {
    clearTimeout(timer);
    timer = null;
    if (playing && visible()) timer = setTimeout(() => {
      if (visible()) move(active + 1, 1, false);
      else schedule();
    }, pauseTime + duration);
  }
  function updateCopy(animate, announce) {
    const person = profiles[active];
    stage.querySelector('.expert-name').textContent = person.name;
    stage.querySelector('.expert-role').textContent = person.role;
    bio.textContent = person.bio;
    stage.dataset.active = String(active);
    if (animate && !reducedMotion.matches) [heading, bio].forEach(el => {
      el.getAnimations().forEach(animation => animation.cancel());
      el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 500, delay: 160, fill: 'backwards', easing });
    });
    if (announce) stage.querySelector('.expert-status').textContent = `${person.name}, ${person.role}. Member ${active + 1} of ${profiles.length}.`;
  }
  function positionCards(animate = false, direction = 1, previous = active) {
    if (wrapAnimation) { wrapAnimation.cancel(); wrapAnimation = null; }
    const origin = stage.getBoundingClientRect();
    const slots = Object.fromEntries(slotNames.map(name => {
      const r = stage.querySelector(`[data-slot="${name}"] .portrait-frame`).getBoundingClientRect();
      return [name, { left: r.left - origin.left, top: r.top - origin.top, width: r.width }];
    }));
    const wrapping = direction > 0 ? (previous + 3) % 4 : (previous + 2) % 4;
    const desktop = window.innerWidth > 700;
    if (!animate) stage.classList.remove('is-ready');
    cards.forEach((card, index) => {
      const before = card.getBoundingClientRect();
      const slot = slotNames[(index - active + 4) % 4];
      const target = slots[slot];
      card.dataset.position = slot;
      card.setAttribute('aria-pressed', String(index === active));
      Object.assign(card.style, { left: `${target.left}px`, top: `${target.top}px`, width: `${target.width}px` });
      // The outgoing edge portrait leaves the strip and re-enters at the other end.
      if (animate && desktop && !reducedMotion.matches && index === wrapping) {
        const from = { left: `${before.left - origin.left}px`, top: `${before.top - origin.top}px`, width: `${before.width}px` };
        const to = { left: `${target.left}px`, top: `${target.top}px`, width: `${target.width}px` };
        wrapAnimation = card.animate([
          { ...from, opacity: 1, offset: 0 },
          { ...from, left: `${direction > 0 ? -before.width - 30 : origin.width + 30}px`, opacity: 0, offset: .38 },
          { ...to, left: `${direction > 0 ? origin.width + 30 : -target.width - 30}px`, opacity: 0, offset: .39 },
          { ...to, opacity: 1, offset: 1 }
        ], { duration, easing });
      }
    });
    if (!animate) {
      void layer.offsetWidth;
      stage.classList.add('is-ready');
    }
  }
  function move(index, direction = 1, announce = true) {
    const next = (index + 4) % 4;
    if (next === active) return;
    const previous = active;
    active = next;
    updateCopy(true, announce);
    positionCards(true, direction, previous);
    schedule();
  }
  function setPlaying(value, advance = false) {
    playing = value;
    reflectPlayback();
    if (advance && playing) move(active + 1, 1, false);
    schedule();
  }
  playback.addEventListener('click', () => setPlaying(!playing, !playing));
  stage.addEventListener('click', event => {
    const card = event.target.closest('.expert-portrait');
    const arrowButton = event.target.closest('[data-step]');
    if (!card && !arrowButton) return;
    setPlaying(false);
    const step = arrowButton ? Number(arrowButton.dataset.step) : ((Number(card.dataset.index) - active + 4) % 4 === 3 ? -1 : 1);
    move(card ? Number(card.dataset.index) : active + step, step);
  });
  stage.addEventListener('keydown', event => {
    const targets = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: 3 };
    if (!(event.key in targets) || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    setPlaying(false);
    move(targets[event.key], event.key === 'ArrowLeft' || event.key === 'Home' ? -1 : 1);
  });
  let touchStart = null;
  let swiped = false;
  layer.addEventListener('touchstart', event => {
    swiped = false;
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  layer.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiped = true;
      setPlaying(false);
      move(active + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    }
  }, { passive: true });
  layer.addEventListener('click', event => {
    if (swiped) { event.preventDefault(); event.stopPropagation(); swiped = false; }
  }, true);
  layer.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => positionCards(false));
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) setPlaying(false);
    positionCards(false);
  });
  window.addEventListener('pagehide', () => clearTimeout(timer));
  window.addEventListener('pageshow', schedule);
  source.after(stage);
  source.hidden = true;
  updateCopy(false, false);
  reflectPlayback();
  positionCards(false);
  document.fonts.ready.then(() => positionCards(false));
  if ('IntersectionObserver' in window) new IntersectionObserver(schedule, { threshold: [0, .15] }).observe(stage);
  else window.addEventListener('scroll', schedule, { passive: true });
  schedule();
})();
