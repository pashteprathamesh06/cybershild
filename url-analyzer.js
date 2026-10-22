(function initUrlAnalyzer() {
  if (!requireAuth()) return;

  const form = document.getElementById('url-form');
  const btn = document.getElementById('analyze-btn');
  const btnText = document.getElementById('analyze-btn-text');
  const resultSection = document.getElementById('result-section');
  const emptyState = document.getElementById('empty-state');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();
    if (!url) return;

    btn.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span> Analyzing...';
    emptyState.classList.add('hidden');

    try {
      const data = await CyberShieldAPI.post('/analyze/url', { url });
      renderResult(data.scan);
      resultSection.classList.remove('hidden');
      showToast('Analysis complete', 'success', 2500);
    } catch (err) {
      showToast(err.message || 'Analysis failed. Please try again.', 'error');
      if (resultSection.classList.contains('hidden')) emptyState.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btnText.textContent = 'Analyze URL';
    }
  });

  function renderResult(scan) {
    renderRiskGauge(document.getElementById('risk-gauge-container'), scan.riskScore);

    const badge = document.getElementById('classification-badge');
    badge.textContent = scan.classification;
    badge.className = `badge ${classificationBadgeClass(scan.classification)}`;

    document.getElementById('result-summary').textContent = scan.summary || 'No summary provided.';
    document.getElementById('result-category').textContent = scan.scamCategory;
    document.getElementById('result-confidence').textContent = `${scan.confidenceScore}%`;
    document.getElementById('result-action').textContent = scan.recommendedAction || 'No specific action recommended.';

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
