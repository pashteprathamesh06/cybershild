(function initSimulator() {
  if (!requireAuth()) return;

  const area = document.getElementById('simulator-area');
  const scoreCorrectEl = document.getElementById('score-correct');
  const scoreTotalEl = document.getElementById('score-total');
  const newRoundBtn = document.getElementById('new-round-btn');

  let scenarios = [];
  let currentIndex = 0;
  let correctCount = 0;
  let answeredCount = 0;

  newRoundBtn.addEventListener('click', loadScenarios);

  async function loadScenarios() {
    area.innerHTML = `<div class="card text-center" style="padding:60px 20px;"><div class="spinner" style="margin:0 auto;"></div><p class="text-muted" style="margin-top:14px;">Loading scenarios...</p></div>`;
    currentIndex = 0;
    correctCount = 0;
    answeredCount = 0;
    updateScore();

    try {
      const data = await CyberShieldAPI.get('/simulator?limit=6');
      scenarios = data.scenarios || [];
      if (!scenarios.length) {
        area.innerHTML = `<div class="empty-state"><div class="icon">🎯</div><p>No scenarios available right now. Please check back later.</p></div>`;
        return;
      }
      renderScenario();
    } catch (err) {
      showToast(err.message || 'Failed to load scenarios', 'error');
      area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>Could not load scenarios.</p></div>`;
    }
  }

  function updateScore() {
    scoreCorrectEl.textContent = correctCount;
    scoreTotalEl.textContent = answeredCount;
  }

  function renderScenario() {
    if (currentIndex >= scenarios.length) {
      area.innerHTML = `
        <div class="card text-center" style="padding:50px 20px;">
          <div style="font-size:2.4rem;margin-bottom:10px;">🏁</div>
          <h2>Round complete!</h2>
          <p class="text-muted">You scored ${correctCount} out of ${answeredCount}.</p>
          <button class="btn btn-primary" id="restart-btn" style="margin-top:10px;">Try New Scenarios</button>
        </div>`;
      document.getElementById('restart-btn').addEventListener('click', loadScenarios);
      return;
    }

    const scenario = scenarios[currentIndex];
    area.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <span class="badge badge-neutral">${escapeHTML(scenario.scenarioType)}</span>
          <span class="text-muted mono" style="font-size:0.8rem;">Scenario ${currentIndex + 1} of ${scenarios.length}</span>
        </div>
        <div class="scan-console" style="margin-bottom:20px;">
          <div class="line">${escapeHTML(scenario.messageText)}</div>
        </div>
        <p style="font-weight:600;margin-bottom:14px;">Is this message a scam?</p>
        <div style="display:flex;gap:12px;">
          <button class="btn btn-danger" id="guess-scam-btn">🚩 It's a Scam</button>
          <button class="btn btn-secondary" id="guess-safe-btn">✅ It's Genuine</button>
        </div>
        <div id="feedback-area" style="margin-top:20px;"></div>
      </div>`;

    document.getElementById('guess-scam-btn').addEventListener('click', () => submitGuess(scenario, true));
    document.getElementById('guess-safe-btn').addEventListener('click', () => submitGuess(scenario, false));
  }

  async function submitGuess(scenario, userGuess) {
    document.getElementById('guess-scam-btn').disabled = true;
    document.getElementById('guess-safe-btn').disabled = true;

    try {
      const data = await CyberShieldAPI.post(`/simulator/${scenario._id}/answer`, { userGuess });
      answeredCount++;
      if (data.correct) correctCount++;
      updateScore();
      renderFeedback(data);
    } catch (err) {
      showToast(err.message || 'Could not submit answer', 'error');
    }
  }

  function renderFeedback(data) {
    const feedbackArea = document.getElementById('feedback-area');
    const verdictClass = data.correct ? 'badge-safe' : 'badge-danger';
    const verdictText = data.correct ? '✔ Correct!' : '✖ Not quite';

    feedbackArea.innerHTML = `
      <div style="border-top:1px solid var(--border-soft);padding-top:16px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <span class="badge ${verdictClass}">${verdictText}</span>
          <span class="text-muted" style="font-size:0.85rem;">This was ${data.isScam ? 'a scam' : 'genuine'}.</span>
        </div>
        <p class="text-secondary">${escapeHTML(data.explanation)}</p>
        <h4 style="margin:14px 0 8px;font-size:0.9rem;">Learning Tips</h4>
        <ul style="margin:0;">
          ${(data.learningTips || []).map((t) => `<li>${escapeHTML(t)}</li>`).join('') || '<li class="text-muted">None provided.</li>'}
        </ul>
        <button class="btn btn-primary btn-sm" id="next-btn" style="margin-top:16px;">Next Scenario →</button>
      </div>`;

    document.getElementById('next-btn').addEventListener('click', () => {
      currentIndex++;
      renderScenario();
    });
  }

  loadScenarios();
})();
