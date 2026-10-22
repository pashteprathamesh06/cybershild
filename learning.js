(function initLearning() {
  if (!requireAuth()) return;

  const moduleList = document.getElementById('module-list');
  const modal = document.getElementById('module-modal');
  const modalClose = document.getElementById('modal-close');

  const iconMap = {
    'Phishing Awareness': '🎣',
    'OTP Scams': '🔑',
    'UPI Fraud': '💸',
    'Banking Fraud': '🏦',
    'Social Engineering': '🧠',
    'Password Security': '🔒',
    'MFA Security': '🛡️',
    'Fake Job Scams': '💼',
    'Investment Scams': '📈',
    'Safe Internet Practices': '🌐',
  };

  let modules = [];

  async function loadModules() {
    try {
      const data = await CyberShieldAPI.get('/learning');
      modules = data.modules || [];
      renderModules();
    } catch (err) {
      showToast(err.message || 'Failed to load learning content', 'error');
      moduleList.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">⚠️</div><p>Could not load learning modules.</p></div>`;
    }
  }

  function renderModules() {
    if (!modules.length) {
      moduleList.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">📚</div><p>No learning content available yet.</p></div>`;
      return;
    }

    moduleList.innerHTML = modules.map((m, idx) => `
      <div class="card feature-card" style="cursor:pointer;" data-idx="${idx}">
        <div class="feature-icon">${iconMap[m.category] || '📘'}</div>
        <span class="badge badge-neutral" style="align-self:flex-start;">${escapeHTML(m.category)}</span>
        <h3 style="font-size:1.05rem;">${escapeHTML(m.title)}</h3>
        <p style="font-size:0.88rem;">${escapeHTML(m.summary)}</p>
        <span style="color:var(--brand-strong);font-size:0.85rem;font-weight:600;">Read module →</span>
      </div>
    `).join('');

    moduleList.querySelectorAll('[data-idx]').forEach((card) => {
      card.addEventListener('click', () => openModal(modules[parseInt(card.dataset.idx, 10)]));
    });
  }

  function openModal(mod) {
    document.getElementById('modal-category').textContent = mod.category;
    document.getElementById('modal-title').textContent = mod.title;
    document.getElementById('modal-content').textContent = mod.content;
    document.getElementById('modal-takeaways').innerHTML = (mod.keyTakeaways || [])
      .map((t) => `<li>${escapeHTML(t)}</li>`).join('') || '<li class="text-muted">None listed.</li>';
    modal.classList.remove('hidden');
  }

  modalClose.addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

  loadModules();
})();
