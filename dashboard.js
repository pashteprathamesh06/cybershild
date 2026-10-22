(async function initDashboard() {
  if (!requireAuth()) return;

  const user = CyberShieldAPI.getUser();
  const heading = document.getElementById('welcome-heading');
  if (user && heading) heading.textContent = `Welcome back, ${user.name.split(' ')[0]}`;

  try {
    const data = await CyberShieldAPI.get('/scans/dashboard/summary');
    renderStats(data.stats);
    renderTrendChart(data.riskTrend);
    renderCategoryChart(data.categoryDistribution);
    renderRecentActivity(data.recentScans);
  } catch (err) {
    showToast(err.message || 'Failed to load dashboard data', 'error');
  }
})();

function renderStats(stats) {
  const total = stats?.totalScans || 0;
  const high = stats?.highRiskScans || 0;
  const safe = stats?.safeScans || 0;
  const rate = total > 0 ? Math.round((high / total) * 100) : 0;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-high').textContent = high;
  document.getElementById('stat-safe').textContent = safe;
  document.getElementById('stat-rate').textContent = `${rate}%`;
}

function renderTrendChart(trend) {
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;

  const labels = (trend || []).map((t) => t._id);
  const counts = (trend || []).map((t) => t.count);

  if (!labels.length) {
    ctx.parentElement.insertAdjacentHTML('beforeend', '<p class="text-muted" style="margin-top:12px;">Not enough data yet — run a few scans to see trends.</p>');
    return;
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Scans per day',
        data: counts,
        borderColor: '#F2A93B',
        backgroundColor: 'rgba(242,169,59,0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8A97A8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#8A97A8' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
      },
    },
  });
}

function renderCategoryChart(categories) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  const labels = (categories || []).map((c) => c._id || 'Unclassified');
  const counts = (categories || []).map((c) => c.count);

  if (!labels.length) {
    ctx.parentElement.insertAdjacentHTML('beforeend', '<p class="text-muted" style="margin-top:12px;">No category data yet.</p>');
    return;
  }

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: ['#F2A93B', '#4FD1AE', '#F2685C', '#5EEAD4', '#8A97A8', '#FFC163', '#3A5A63', '#A9BFC7'],
        borderColor: '#0E1A1F',
        borderWidth: 2,
      }],
    },
    options: {
      plugins: { legend: { position: 'bottom', labels: { color: '#A9BFC7', boxWidth: 12, padding: 12 } } },
    },
  });
}

function renderRecentActivity(scans) {
  const tbody = document.getElementById('recent-activity-body');
  if (!scans || !scans.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-muted">No scans yet — try the URL Analyzer to get started.</td></tr>`;
    return;
  }

  tbody.innerHTML = scans.map((s) => `
    <tr onclick="window.location.href='history.html'" style="cursor:pointer;">
      <td>${escapeHTML(capitalize(s.scanType))}</td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(truncate(s.input, 40))}</td>
      <td>${escapeHTML(s.scamCategory)}</td>
      <td>${s.riskScore}/100</td>
      <td><span class="badge ${classificationBadgeClass(s.classification)}">${s.classification}</span></td>
      <td class="text-muted">${timeAgo(s.createdAt)}</td>
    </tr>
  `).join('');
}

function truncate(str, len) {
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function capitalize(str) {
  return str ? str[0].toUpperCase() + str.slice(1) : str;
}
