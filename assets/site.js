/* Floating navigation: disclosure, keyboard dismissal and current section. */
(() => {
  const header = document.getElementById('site-header');
  const toggle = document.getElementById('menu-toggle');
  const links = Array.from(document.querySelectorAll('#nav-links a[href^="#"]'));
  if (!header) return;

  const panel = document.getElementById('nav-links');
  // Menu disclosure on all screen sizes.
  const setOpen = open => {
    header.classList.toggle('nav-open', open);
    panel.inert = !open;
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
  };
  if (toggle) {
    toggle.addEventListener('click', event => {
      const open = !header.classList.contains('nav-open');
      setOpen(open);
      if (open && event.detail === 0) links[0]?.focus();
    });
    panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      if (!a.hasAttribute('data-contact-open')) { setOpen(false); toggle.focus({preventScroll:true}); }
    }));
    header.addEventListener('focusout', () => requestAnimationFrame(() => {
      if (!header.contains(document.activeElement) && !document.getElementById('contact-dialog')?.open) setOpen(false);
    }));
    header.querySelector('.floating-brand').addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', e => { if (!header.contains(e.target)) setOpen(false); });
  }

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
