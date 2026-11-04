(() => {
  const dialog = document.getElementById('contact-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  let trigger;
  document.querySelectorAll('[data-contact-open]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      trigger = link;
      dialog.showModal();
      document.body.classList.add('contact-open');
    });
  });
  dialog.querySelector('.contact-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('contact-open');
    trigger?.focus();
  });
  // Native POST keeps provider validation, email activation and spam checks intact.
  // Never show a local delivery confirmation before the provider accepts a submission.
})();
