/* INTRIVON site behaviour: mobile menu, header hairline on scroll, current-section highlight in the nav. */
(() => {
  const header = document.getElementById('site-header');
  const toggle = document.getElementById('menu-toggle');
  const links = Array.from(document.querySelectorAll('#nav-links a[href^="#"]'));
  if (!header) return;

  // Mobile menu
  const setOpen = open => {
    header.classList.toggle('nav-open', open);
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
  };
  if (toggle) {
    toggle.addEventListener('click', () => setOpen(!header.classList.contains('nav-open')));
    links.forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', e => { if (!header.contains(e.target)) setOpen(false); });
  }

  // Hairline under the header once the page has scrolled
  const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mark the section in view as current in the navigation
  const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const sections = Array.from(byId.keys()).map(id => document.getElementById(id)).filter(Boolean);
  let current = null, queued = false;
  const spy = () => {
    queued = false;
    const line = window.innerHeight * .4;
    let id = null;
    sections.forEach(s => { if (s.getBoundingClientRect().top <= line) id = s.id; });
    const last = sections[sections.length - 1];
    if (last && last.getBoundingClientRect().bottom < line) id = null;
    if (id === current) return;
    current = id;
    links.forEach(a => {
      if (a === byId.get(id)) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  };
  const queueSpy = () => { if (!queued) { queued = true; requestAnimationFrame(spy); } };
  window.addEventListener('scroll', queueSpy, { passive: true });
  window.addEventListener('resize', queueSpy);
  spy();
})();
