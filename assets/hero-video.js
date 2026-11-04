/* Ambient hero video: explicit playback control, reduced motion and offscreen pause. */
(() => {
  const video = document.getElementById('hero-video');
  const button = document.getElementById('hero-video-toggle');
  if (!video || !button) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let requested = !reduced.matches, visible = true;
  video.muted = true;
  button.hidden = false;
  const reflect = () => {
    const paused = video.paused;
    video.closest('.hero-video').classList.toggle('hero-motion-paused', paused);
    button.dataset.paused = String(paused);
    button.setAttribute('aria-label', paused ? 'Play hero animation and video' : 'Pause hero animation and video');
  };
  const sync = () => {
    if (requested && visible && !document.hidden) {
      const playing = video.play();
      if (playing) playing.catch(reflect);
    } else video.pause();
    reflect();
  };
  button.addEventListener('click', () => { requested = video.paused; sync(); });
  video.addEventListener('play', reflect);
  video.addEventListener('pause', reflect);
  video.addEventListener('error', () => { button.hidden = true; });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => { requested = !reduced.matches; sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; sync();
    }, {threshold:.01}).observe(video);
  }
  const frameShot = t => {
    video.style.objectPosition = t >= 10.5 && t < 12.25 ? '5% 12%' : '';
  };
  if (video.requestVideoFrameCallback) {
    const frame = (_, m) => { frameShot(m.mediaTime); video.requestVideoFrameCallback(frame); };
    video.requestVideoFrameCallback(frame);
  } else video.addEventListener('timeupdate', () => frameShot(video.currentTime));
  video.addEventListener('seeked', () => frameShot(video.currentTime));
  sync();
})();

