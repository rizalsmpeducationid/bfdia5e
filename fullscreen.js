(() => {
  const toggleButton = document.getElementById('fullscreen-toggle');
  const target = document.getElementById('hide-contenteditable');

  if (!toggleButton || !target) {
    return;
  }

  const getFullscreenElement = () =>
    document.fullscreenElement || document.webkitFullscreenElement;

  const updateButton = () => {
    const isFullscreen = Boolean(getFullscreenElement());
    toggleButton.textContent = isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
    toggleButton.setAttribute('aria-pressed', isFullscreen ? 'true' : 'false');
  };

  const requestFullscreen = () => {
    if (target.requestFullscreen) {
      return target.requestFullscreen();
    }
    if (target.webkitRequestFullscreen) {
      return target.webkitRequestFullscreen();
    }
    return Promise.resolve();
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      return document.exitFullscreen();
    }
    if (document.webkitExitFullscreen) {
      return document.webkitExitFullscreen();
    }
    return Promise.resolve();
  };

  toggleButton.addEventListener('click', () => {
    if (getFullscreenElement()) {
      exitFullscreen();
    } else {
      requestFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', updateButton);
  document.addEventListener('webkitfullscreenchange', updateButton);
  updateButton();
})();
