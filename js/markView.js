const MarkView = (() => {
  let videoEl, canvasEl, ctx;
  let toggleLeftBtn, toggleRightBtn, doneBtn, errorEl, fileNameEl;
  const markers = {};
  let currentSession = null;
  let draggingHand = null;
  let currentObjectURL = null;

  function init() {
    videoEl = document.getElementById('markVideo');
    canvasEl = document.getElementById('markCanvas');
    ctx = canvasEl.getContext('2d');
    toggleLeftBtn = document.getElementById('toggleLeftBtn');
    toggleRightBtn = document.getElementById('toggleRightBtn');
    doneBtn = document.getElementById('doneBtn');
    errorEl = document.getElementById('markError');
    fileNameEl = document.getElementById('markFileName');

    markers.left = new HandMarker('L', '#0d6efd');
    markers.right = new HandMarker('R', '#dc3545');

    toggleLeftBtn.addEventListener('click', () => toggleHand('left'));
    toggleRightBtn.addEventListener('click', () => toggleHand('right'));
    doneBtn.addEventListener('click', () => App.finishCurrentVideo());

    canvasEl.addEventListener('pointerdown', onPointerDown);
    canvasEl.addEventListener('pointermove', onPointerMove);
    canvasEl.addEventListener('pointerup', onPointerUp);
    canvasEl.addEventListener('pointercancel', onPointerUp);

    videoEl.addEventListener('timeupdate', syncMarkersToTime);
    videoEl.addEventListener('seeked', syncMarkersToTime);
    window.addEventListener('resize', () => syncMarkersToTime());

    document.addEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.code !== 'Space') return;
    if (!currentSession) return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
    e.preventDefault();
    if (videoEl.paused) {
      videoEl.play();
    } else {
      videoEl.pause();
    }
  }

  function loadVideo(file, session, captureFirstFrame) {
    currentSession = session;
    errorEl.classList.add('d-none');
    fileNameEl.textContent = file.name;
    doneBtn.disabled = true;
    markers.left.visible = false;
    markers.right.visible = false;
    updateHandButtons();

    if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
    currentObjectURL = URL.createObjectURL(file);
    videoEl.src = currentObjectURL;

    videoEl.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    if (captureFirstFrame) {
      videoEl.addEventListener('loadeddata', captureFrameOnce, { once: true });
    }
  }

  function onLoadedMetadata() {
    if (!isFinite(videoEl.duration) || videoEl.duration <= 0) {
      errorEl.textContent = 'This video has no readable duration and cannot be marked. Please choose another file.';
      errorEl.classList.remove('d-none');
      doneBtn.disabled = true;
      return;
    }
    currentSession.duration = videoEl.duration;
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    doneBtn.disabled = false;
    syncMarkersToTime();
  }

  function captureFrameOnce() {
    const off = document.createElement('canvas');
    off.width = videoEl.videoWidth;
    off.height = videoEl.videoHeight;
    off.getContext('2d').drawImage(videoEl, 0, 0, off.width, off.height);
    App.firstFrameDataURL = off.toDataURL('image/png');
  }

  function toggleHand(hand) {
    if (markers[hand].visible) {
      removeHand(hand);
    } else {
      addHand(hand);
    }
  }

  function addHand(hand) {
    if (!currentSession) return;
    const t = videoEl.currentTime;
    VideoSession.addKeyframe(currentSession, hand, t, 0.5, 0.5, true);
    syncMarkersToTime();
  }

  function removeHand(hand) {
    if (!currentSession) return;
    const t = videoEl.currentTime;
    const state = VideoSession.getStateAtTime(currentSession, hand, t);
    const x = state ? state.x : 0.5;
    const y = state ? state.y : 0.5;
    VideoSession.addKeyframe(currentSession, hand, t, x, y, false);
    syncMarkersToTime();
  }

  function updateHandButtons() {
    toggleLeftBtn.textContent = markers.left.visible ? 'Remove Left Hand' : 'Add Left Hand';
    toggleLeftBtn.classList.toggle('btn-outline-primary', !markers.left.visible);
    toggleLeftBtn.classList.toggle('btn-warning', markers.left.visible);

    toggleRightBtn.textContent = markers.right.visible ? 'Remove Right Hand' : 'Add Right Hand';
    toggleRightBtn.classList.toggle('btn-outline-danger', !markers.right.visible);
    toggleRightBtn.classList.toggle('btn-warning', markers.right.visible);
  }

  function syncMarkersToTime() {
    if (!currentSession) return;
    for (const hand of ['left', 'right']) {
      const state = VideoSession.getStateAtTime(currentSession, hand, videoEl.currentTime);
      const marker = markers[hand];
      if (!state || !state.present) {
        marker.visible = false;
      } else {
        marker.visible = true;
        marker.xPx = state.x * canvasEl.width;
        marker.yPx = state.y * canvasEl.height;
      }
    }
    updateHandButtons();
    redraw();
  }

  function redraw() {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    markers.left.draw(ctx);
    markers.right.draw(ctx);
  }

  function canvasPoint(e) {
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / rect.width;
    const scaleY = canvasEl.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function onPointerDown(e) {
    const p = canvasPoint(e);
    if (markers.right.hitTest(p.x, p.y)) {
      draggingHand = 'right';
    } else if (markers.left.hitTest(p.x, p.y)) {
      draggingHand = 'left';
    } else {
      return;
    }
    canvasEl.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!draggingHand) return;
    const p = canvasPoint(e);
    const marker = markers[draggingHand];
    marker.xPx = Math.max(0, Math.min(canvasEl.width, p.x));
    marker.yPx = Math.max(0, Math.min(canvasEl.height, p.y));
    redraw();
  }

  function onPointerUp() {
    if (!draggingHand) return;
    const marker = markers[draggingHand];
    const x = marker.xPx / canvasEl.width;
    const y = marker.yPx / canvasEl.height;
    VideoSession.addKeyframe(currentSession, draggingHand, videoEl.currentTime, x, y, true);
    draggingHand = null;
    updateHandButtons();
  }

  function reset() {
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.load();
    if (currentObjectURL) {
      URL.revokeObjectURL(currentObjectURL);
      currentObjectURL = null;
    }
    currentSession = null;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  }

  return { init, loadVideo, reset };
})();
