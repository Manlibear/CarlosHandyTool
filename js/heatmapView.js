
const HeatmapView = (() => {
  let heatmapInstance = null;
  let bgImage, heatmapContainer, slider, sliderValueLabel;

  function init() {
    bgImage = document.getElementById('resultImage');
    heatmapContainer = document.getElementById('heatmapContainer');
    slider = document.getElementById('alphaSlider');
    sliderValueLabel = document.getElementById('alphaValue');

    slider.addEventListener('input', () => {
      sliderValueLabel.textContent = Number(slider.value).toFixed(2);
      render();
    });

    window.addEventListener('resize', () => {
      if (heatmapContainer.classList.contains('d-none') && !heatmapInstance) return;
      if (!bgImage.src) return;
      sizeContainer();
      createInstance();
      render();
    });
  }

  function sizeContainer() {
    heatmapContainer.style.width = bgImage.clientWidth + 'px';
    heatmapContainer.style.height = bgImage.clientHeight + 'px';
  }

  function createInstance() {
    heatmapContainer.innerHTML = '';
    heatmapInstance = h337.create({
      container: heatmapContainer,
      radius: 40,
      maxOpacity: 0.8,
      minOpacity: 0,
      blur: 0.85
    });
    // heatmap.js forces position:relative on its container; put it back to
    // absolute so it overlays the image instead of flowing below it.
    heatmapContainer.style.position = 'absolute';
  }

  function show() {
    bgImage.onload = () => {
      sizeContainer();
      createInstance();
      sliderValueLabel.textContent = Number(slider.value).toFixed(2);
      render();
    };
    bgImage.src = App.firstFrameDataURL;
  }

  function render() {
    if (!heatmapInstance) return;
    const alpha = parseFloat(slider.value);
    const points = Weighting.buildHeatmapPoints(App.sessions, alpha, bgImage.clientWidth, bgImage.clientHeight);
    const max = points.length ? Math.max(...points.map(p => p.value)) : 1;
    heatmapInstance.setData({ max: max || 1, data: points });
  }

  return { init, show };
})();
