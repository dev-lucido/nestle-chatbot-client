(function () {
  if (window.__mamabotWidgetLoaded) return;
  window.__mamabotWidgetLoaded = true;

  const style = document.createElement('style');
  style.textContent = `
    #mmb-fab {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #0ea5e9;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      cursor: pointer;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      transition: transform 0.2s ease, background 0.2s ease;
    }
    #mmb-fab:hover { background: #0284c7; transform: scale(1.08); }
    #mmb-fab svg { width: 28px; height: 28px; fill: #fff; }

    #mmb-panel {
      position: fixed;
      bottom: 168px;
      right: 24px;
      width: 370px;
      height: 580px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 184px);
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
    #mmb-panel.mmb-open {
      display: flex;
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    #mmb-panel iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }

    @media (max-width: 480px) {
      #mmb-panel {
        bottom: 0;
        right: 0;
        left: 0;
        width: 100%;
        max-width: 100%;
        height: 80vh;
        max-height: 80vh;
        border-radius: 16px 16px 0 0;
      }
      #mmb-fab {
        bottom: 88px;
        right: 16px;
      }
    }
  `;
  document.head.appendChild(style);

  const fab = document.createElement('button');
  fab.id = 'mmb-fab';
  fab.setAttribute('aria-label', 'Open Mamabot');
  fab.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H6l-2 2V4h16v10z"/>
    </svg>
  `;

  const panel = document.createElement('div');
  panel.id = 'mmb-panel';

  const iframe = document.createElement('iframe');
  iframe.src = 'https://dev-lucido.github.io/nestle-chatbot-client/#/mamabot';
  iframe.title = 'Mamabot';
  iframe.allow = 'clipboard-write';
  let iframeLoaded = false;

  panel.appendChild(iframe);

  let isOpen = false;

  fab.addEventListener('click', () => {
    isOpen = !isOpen;

    if (isOpen) {
      if (!iframeLoaded) { iframe.src = iframe.src; iframeLoaded = true; }
      panel.style.display = 'flex';
      requestAnimationFrame(() => panel.classList.add('mmb-open'));
      fab.setAttribute('aria-label', 'Close Mamabot');
      fab.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      `;
    } else {
      panel.classList.remove('mmb-open');
      fab.setAttribute('aria-label', 'Open Mamabot');
      fab.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H6l-2 2V4h16v10z"/>
        </svg>
      `;
      setTimeout(() => { if (!isOpen) panel.style.display = 'none'; }, 200);
    }
  });

  document.body.appendChild(panel);
  document.body.appendChild(fab);
})();
