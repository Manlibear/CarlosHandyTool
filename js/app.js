const App = (() => {
  const sessions = [];
  let firstFrameDataURL = null;
  let currentSession = null;

  let uploadView, markView, resultsView;
  let fileInput, generateBtn, sessionListEl, backBtn;

  function init() {
    uploadView = document.getElementById('uploadView');
    markView = document.getElementById('markView');
    resultsView = document.getElementById('resultsView');
    fileInput = document.getElementById('videoFileInput');
    generateBtn = document.getElementById('generateHeatmapBtn');
    sessionListEl = document.getElementById('sessionList');
    backBtn = document.getElementById('backToUploadBtn');

    MarkView.init();
    HeatmapView.init();

    fileInput.addEventListener('change', onFileSelected);
    generateBtn.addEventListener('click', showResults);
    backBtn.addEventListener('click', showUpload);

    showUpload();
  }

  function onFileSelected(e) {
    const file = e.target.files[0];
    if (!file) return;
    const captureFirstFrame = sessions.length === 0 && firstFrameDataURL === null;
    currentSession = VideoSession.createSession(file.name, 0);
    MarkView.loadVideo(file, currentSession, captureFirstFrame);
    fileInput.value = '';
    showMark();
  }

  function finishCurrentVideo() {
    if (!currentSession) return;
    sessions.push(currentSession);
    currentSession = null;
    MarkView.reset();
    showUpload();
  }

  function showUpload() {
    uploadView.classList.remove('d-none');
    markView.classList.add('d-none');
    resultsView.classList.add('d-none');
    generateBtn.disabled = sessions.length === 0;
    renderSessionList();
  }

  function showMark() {
    uploadView.classList.add('d-none');
    markView.classList.remove('d-none');
    resultsView.classList.add('d-none');
  }

  function showResults() {
    uploadView.classList.add('d-none');
    markView.classList.add('d-none');
    resultsView.classList.remove('d-none');
    HeatmapView.show();
  }

  function renderSessionList() {
    sessionListEl.innerHTML = '';
    if (sessions.length === 0) {
      const li = document.createElement('li');
      li.className = 'list-group-item text-muted';
      li.textContent = 'No videos marked yet.';
      sessionListEl.appendChild(li);
      return;
    }
    sessions.forEach(s => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.textContent = `${s.fileName} (${s.duration.toFixed(1)}s)`;
      sessionListEl.appendChild(li);
    });
  }

  return {
    init,
    finishCurrentVideo,
    get sessions() { return sessions; },
    get firstFrameDataURL() { return firstFrameDataURL; },
    set firstFrameDataURL(v) { firstFrameDataURL = v; }
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
