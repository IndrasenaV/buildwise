/* BuildWise AI marketing interactions */
(function () {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

  // Mobile nav toggle
  const toggle = qs('.nav-toggle');
  const nav = qs('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.dataset.open === 'true';
      nav.dataset.open = String(!open);
      toggle.setAttribute('aria-expanded', String(!open));
      if (!open) {
        nav.style.display = 'grid';
        nav.style.position = 'absolute';
        nav.style.top = '64px';
        nav.style.right = '20px';
        nav.style.background = 'rgba(15,23,42,.98)';
        nav.style.padding = '14px';
        nav.style.border = '1px solid #1f2942';
        nav.style.borderRadius = '12px';
        nav.style.gap = '10px';
      } else {
        nav.style.display = '';
        nav.removeAttribute('style');
      }
    });
  }

  // Smooth scroll for in-page anchors
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href') || '';
      if (id.length > 1) {
        const target = qs(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Contact form handler (no backend; show a friendly confirmation)
  const form = qs('#contactForm');
  const note = qs('#formNote');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());
      // In a real integration, POST payload to your backend here.
      console.info('[BuildWise AI] Contact form submitted:', payload);
      if (note) {
        note.textContent = 'Thanks! We received your message and will reply shortly.';
      }
      form.reset();
    });
  }

  // Year in footer
  const year = new Date().getFullYear();
  const yearEl = qs('#year');
  if (yearEl) yearEl.textContent = String(year);
})(); 


