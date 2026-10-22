(function initScreenshotAnalyzer() {
  if (!requireAuth()) return;

  const form = document.getElementById('screenshot-form');
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('upload-drop');
  const placeholder = document.getElementById('upload-placeholder');
  const previewImg = document.getElementById('preview-img');
  const btn = document.getElementById('analyze-btn');
  const btnText = document.getElementById('analyze-btn-text');
  const resultSection = document.getElementById('result-section');
  const emptyState = document.getElementById('empty-state');

  let selectedFile = null;

  dropZone.addEventListener('click', () => fileInput.click());

  ['dragover', 'dragenter'].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  });
  ['dragleave', 'drop'].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); });
  });
  dropZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload a PNG, JPG, JPEG, or WEBP image.', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('Image must be under 8MB.', 'error');
      return;
    }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewImg.classList.remove('hidden');
      placeholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
    btn.disabled = false;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    btn.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span> Extracting & analyzing...';
    emptyState.classList.add('hidden');

    const formData = new FormData();
    formData.append('screenshot', selectedFile);

    try {
      const data = await CyberShieldAPI.postForm('/analyze/screenshot', formData);
      renderResult(data.scan);
      resultSection.classList.remove('hidden');
      showToast('Analysis complete', 'success', 2500);
    } catch (err) {
      showToast(err.message || 'Analysis failed. Please try again.', 'error');
      if (resultSection.classList.contains('hidden')) emptyState.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btnText.textContent = 'Extract & Analyze';
    }
  });

  function renderResult(scan) {
    document.getElementById('extracted-text').textContent = scan.extractedText || '(no text extracted)';
    renderRiskGauge(document.getElementById('risk-gauge-container'), scan.riskScore);

    const badge = document.getElementById('classification-badge');
    badge.textContent = scan.classification;
    badge.className = `badge ${classificationBadgeClass(scan.classification)}`;

    document.getElementById('result-summary').textContent = scan.summary || 'No summary provided.';
    document.getElementById('result-category').textContent = scan.scamCategory;
    document.getElementById('result-confidence').textContent = `${scan.confidenceScore}%`;

    const indicatorsEl = document.getElementById('result-indicators');
    indicatorsEl.innerHTML = scan.suspiciousIndicators && scan.suspiciousIndicators.length
      ? scan.suspiciousIndicators.map((i) => `<span class="list-tag">${escapeHTML(i)}</span>`).join('')
      : '<p class="text-muted">No suspicious indicators detected.</p>';

    const tipsEl = document.getElementById('result-tips');
    tipsEl.innerHTML = scan.safetyRecommendations && scan.safetyRecommendations.length
      ? scan.safetyRecommendations.map((t) => `<li>${escapeHTML(t)}</li>`).join('')
      : '<li class="text-muted">No specific tips provided.</li>';
  }
})();
