(function () {
  // Prevent double-initialization
  if (window.__babyNameWidgetLoaded) return;
  window.__babyNameWidgetLoaded = true;

  // ── Styles ──────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #bng-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #7c3aed;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      cursor: pointer;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      transition: transform 0.2s ease, background 0.2s ease;
    }
    #bng-fab:hover { background: #6d28d9; transform: scale(1.08); }
    #bng-fab svg { width: 28px; height: 28px; fill: #fff; }

    #bng-panel {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 370px;
      height: 580px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 112px);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.22);
      z-index: 99998;
      display: none;
      flex-direction: column;
      background: #fff;
      transition: opacity 0.2s ease, transform 0.2s ease;
      opacity: 0;
      transform: translateY(12px) scale(0.97);
    }
    #bng-panel.bng-open {
      display: flex;
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    #bng-panel iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }

    /* Mobile: full-screen panel */
    @media (max-width: 480px) {
      #bng-panel {
        bottom: 0;
        right: 0;
        left: 0;
        width: 100%;
        max-width: 100%;
        height: 80vh;
        max-height: 80vh;
        border-radius: 16px 16px 0 0;
      }
      #bng-fab {
        bottom: 16px;
        right: 16px;
      }
    }
  `;
  document.head.appendChild(style);

  // ── FAB button ───────────────────────────────────────────────────────────
  const fab = document.createElement('button');
  fab.id = 'bng-fab';
  fab.setAttribute('aria-label', 'Open Baby Name Generator');
  fab.innerHTML = `
    <!-- Chat bubble icon -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H6l-2 2V4h16v10z"/>
    </svg>
  `;

  // ── Panel with iframe ────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'bng-panel';

  const iframe = document.createElement('iframe');
  iframe.src = 'https://dev-lucido.github.io/nestle-chatbot-client/#/namegenerator';
  iframe.title = 'Baby Name Generator';
  iframe.allow = 'clipboard-write';
  // Load iframe lazily on first open
  let iframeLoaded = false;

  panel.appendChild(iframe);

  // ── Toggle logic ─────────────────────────────────────────────────────────
  let isOpen = false;

  fab.addEventListener('click', () => {
    isOpen = !isOpen;

    if (isOpen) {
      // Lazy-load iframe
      if (!iframeLoaded) {
        iframe.src = iframe.src; // triggers load
        iframeLoaded = true;
      }
      panel.style.display = 'flex';
      // Trigger animation on next frame
      requestAnimationFrame(() => panel.classList.add('bng-open'));
      fab.setAttribute('aria-label', 'Close Baby Name Generator');
      fab.innerHTML = `
        <!-- X icon -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      `;
    } else {
      panel.classList.remove('bng-open');
      fab.setAttribute('aria-label', 'Open Baby Name Generator');
      fab.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H6l-2 2V4h16v10z"/>
        </svg>
      `;
      // Hide after transition
      setTimeout(() => {
        if (!isOpen) panel.style.display = 'none';
      }, 200);
    }
  });

  // ── Mount ────────────────────────────────────────────────────────────────
  document.body.appendChild(panel);
  document.body.appendChild(fab);
})();