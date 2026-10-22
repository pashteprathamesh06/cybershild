(function initCompare() {
  if (!requireAuth()) return;

  const form = document.getElementById('compare-form');
  const btn = document.getElementById('compare-btn');
  const btnText = document.getElementById('compare-btn-text');
  const resultSection = document.getElementById('result-section');
  const emptyState = document.getElementById('empty-state');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageA = document.getElementById('message-a').value.trim();
    const messageB = document.getElementById('message-b').value.trim();
    if (!messageA || !messageB) return;

    btn.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span> Comparing...';
    emptyState.classList.add('hidden');

    try {
      const data = await CyberShieldAPI.post('/compare/messages', { messageA, messageB });
      renderResult(data.comparison);
      resultSection.classList.remove('hidden');
      showToast('Comparison complete', 'success', 2500);
    } catch (err) {
      showToast(err.message || 'Comparison failed. Please try again.', 'error');
      if (resultSection.classList.contains('hidden')) emptyState.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btnText.textContent = 'Compare Messages';
    }
  });

  function renderResult(result) {
    const labelMap = { A: 'Message A', B: 'Message B', Both: 'Both Messages', Neither: 'Neither Message' };
    document.getElementById('more-suspicious-label').textContent = labelMap[result.moreSuspicious] || 'Unclear';

    const badgeA = document.getElementById('badge-a');
    badgeA.textContent = result.messageA.classification;
    badgeA.className = `badge ${classificationBadgeClass(result.messageA.classification)}`;
    document.getElementById('risk-a').textContent = result.messageA.riskScore;
    document.getElementById('indicators-a').innerHTML = renderTags(result.messageA.suspiciousIndicators);

    const badgeB = document.getElementById('badge-b');
    badgeB.textContent = result.messageB.classification;
    badgeB.className = `badge ${classificationBadgeClass(result.messageB.classification)}`;
    document.getElementById('risk-b').textContent = result.messageB.riskScore;
    document.getElementById('indicators-b').innerHTML = renderTags(result.messageB.suspiciousIndicators);

    document.getElementById('similarities-list').innerHTML = renderList(result.similarities);
    document.getElementById('differences-list').innerHTML = renderList(result.differences);
    document.getElementById('techniques-list').innerHTML = renderTags(result.socialEngineeringTechniques);
    document.getElementById('summary-text').textContent = result.summary || 'No explanation provided.';
  }

  function renderTags(arr) {
    if (!arr || !arr.length) return '<p class="text-muted">None detected.</p>';
    return arr.map((i) => `<span class="list-tag">${escapeHTML(i)}</span>`).join('');
  }

  function renderList(arr) {
    if (!arr || !arr.length) return '<li class="text-muted">None noted.</li>';
    return arr.map((i) => `<li>${escapeHTML(i)}</li>`).join('');
  }
})();
