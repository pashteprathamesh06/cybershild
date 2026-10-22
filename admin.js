(function initAdmin() {
  if (!requireAuth()) return;
  if (!requireAdmin()) return;

  // ---------- Tabs ----------
  const tabs = document.querySelectorAll('.pill-tab');
  const panels = {
    overview: document.getElementById('tab-overview'),
    users: document.getElementById('tab-users'),
    scans: document.getElementById('tab-scans'),
    content: document.getElementById('tab-content'),
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      Object.values(panels).forEach((p) => p.classList.add('hidden'));
      panels[tab.dataset.tab].classList.remove('hidden');

      if (tab.dataset.tab === 'users') loadUsers();
      if (tab.dataset.tab === 'scans') loadScans();
      if (tab.dataset.tab === 'content') loadContent();
    });
  });

  // ---------- Overview ----------
  async function loadOverview() {
    try {
      const data = await CyberShieldAPI.get('/admin/dashboard');
      document.getElementById('admin-total-users').textContent = data.overview.totalUsers;
      document.getElementById('admin-total-scans').textContent = data.overview.totalScans;
      document.getElementById('admin-high-risk').textContent = data.overview.highRiskScans;
      document.getElementById('admin-safe-scans').textContent = data.overview.safeScans;

      renderTrendChart(data.scanTrend);
      renderClassificationChart(data.classificationDistribution);
      renderCategoryChart(data.categoryDistribution);
      renderRecentActivity(data.recentActivity);
    } catch (err) {
      showToast(err.message || 'Failed to load admin dashboard', 'error');
    }
  }

  function renderTrendChart(trend) {
    const ctx = document.getElementById('adminTrendChart');
    const labels = (trend || []).map((t) => t._id);
    const counts = (trend || []).map((t) => t.count);
    if (!labels.length) return;
    new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Scans/day', data: counts, borderColor: '#F2A93B', backgroundColor: 'rgba(242,169,59,0.15)', fill: true, tension: 0.35 }] },
      options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8A97A8' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#8A97A8' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true } } },
    });
  }

  function renderClassificationChart(dist) {
    const ctx = document.getElementById('adminClassificationChart');
    const labels = (dist || []).map((d) => d._id || 'Unknown');
    const counts = (dist || []).map((d) => d.count);
    if (!labels.length) return;
    const colorMap = { Safe: '#4FD1AE', Suspicious: '#F2A93B', Scam: '#F2685C', Malicious: '#B33A30' };
    new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: counts, backgroundColor: labels.map((l) => colorMap[l] || '#8A97A8'), borderColor: '#0E1A1F', borderWidth: 2 }] },
      options: { plugins: { legend: { position: 'bottom', labels: { color: '#A9BFC7', boxWidth: 12 } } } },
    });
  }

  function renderCategoryChart(categories) {
    const ctx = document.getElementById('adminCategoryChart');
    const labels = (categories || []).map((c) => c._id || 'Unclassified');
    const counts = (categories || []).map((c) => c.count);
    if (!labels.length) return;
    new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Scans', data: counts, backgroundColor: '#5EEAD4' }] },
      options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8A97A8' }, grid: { display: false } }, y: { ticks: { color: '#8A97A8' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true } } },
    });
  }

  function renderRecentActivity(activity) {
    const tbody = document.getElementById('admin-recent-body');
    if (!activity || !activity.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted">No activity yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = activity.map((s) => `
      <tr>
        <td>${escapeHTML(s.user ? s.user.name : 'Unknown')}</td>
        <td>${escapeHTML(capitalize(s.scanType))}</td>
        <td>${escapeHTML(s.scamCategory)}</td>
        <td>${s.riskScore}/100</td>
        <td><span class="badge ${classificationBadgeClass(s.classification)}">${s.classification}</span></td>
        <td class="text-muted">${timeAgo(s.createdAt)}</td>
      </tr>
    `).join('');
  }

  // ---------- Users ----------
  let userSearchTimer = null;
  document.getElementById('user-search').addEventListener('input', () => {
    clearTimeout(userSearchTimer);
    userSearchTimer = setTimeout(loadUsers, 350);
  });

  async function loadUsers() {
    const tbody = document.getElementById('admin-users-body');
    tbody.innerHTML = `<tr><td colspan="6" class="text-muted">Loading...</td></tr>`;
    const search = document.getElementById('user-search').value.trim();
    const params = new URLSearchParams({ limit: 50 });
    if (search) params.set('search', search);

    try {
      const data = await CyberShieldAPI.get(`/admin/users?${params.toString()}`);
      if (!data.users.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-muted">No users found.</td></tr>`;
        return;
      }
      tbody.innerHTML = data.users.map((u) => `
        <tr>
          <td>${escapeHTML(u.name)}</td>
          <td>${escapeHTML(u.email)}</td>
          <td><span class="badge ${u.role === 'admin' ? 'badge-warn' : 'badge-neutral'}">${u.role}</span></td>
          <td><span class="badge ${u.isActive ? 'badge-safe' : 'badge-danger'}">${u.isActive ? 'Active' : 'Disabled'}</span></td>
          <td class="text-muted">${formatDate(u.createdAt)}</td>
          <td>
            <button class="btn btn-ghost btn-sm" data-toggle-role="${u._id}" data-current-role="${u.role}">Make ${u.role === 'admin' ? 'User' : 'Admin'}</button>
            <button class="btn btn-ghost btn-sm" data-toggle-active="${u._id}" data-current-active="${u.isActive}" style="color:var(--signal-danger);">${u.isActive ? 'Disable' : 'Enable'}</button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('[data-toggle-role]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const newRole = btn.dataset.currentRole === 'admin' ? 'user' : 'admin';
          try {
            await CyberShieldAPI.patch(`/admin/users/${btn.dataset.toggleRole}`, { role: newRole });
            showToast('User role updated', 'success', 2000);
            loadUsers();
          } catch (err) { showToast(err.message || 'Update failed', 'error'); }
        });
      });
      tbody.querySelectorAll('[data-toggle-active]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const newActive = btn.dataset.currentActive !== 'true';
          try {
            await CyberShieldAPI.patch(`/admin/users/${btn.dataset.toggleActive}`, { isActive: newActive });
            showToast('User status updated', 'success', 2000);
            loadUsers();
          } catch (err) { showToast(err.message || 'Update failed', 'error'); }
        });
      });
    } catch (err) {
      showToast(err.message || 'Failed to load users', 'error');
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted">Failed to load users.</td></tr>`;
    }
  }

  // ---------- Scans ----------
  let scanSearchTimer = null;
  document.getElementById('scan-search').addEventListener('input', () => {
    clearTimeout(scanSearchTimer);
    scanSearchTimer = setTimeout(loadScans, 350);
  });
  document.getElementById('admin-type-filter').addEventListener('change', loadScans);
  document.getElementById('admin-classification-filter').addEventListener('change', loadScans);

  async function loadScans() {
    const tbody = document.getElementById('admin-scans-body');
    tbody.innerHTML = `<tr><td colspan="7" class="text-muted">Loading...</td></tr>`;

    const params = new URLSearchParams({ limit: 50 });
    const search = document.getElementById('scan-search').value.trim();
    const scanType = document.getElementById('admin-type-filter').value;
    const classification = document.getElementById('admin-classification-filter').value;
    if (search) params.set('search', search);
    if (scanType) params.set('scanType', scanType);
    if (classification) params.set('classification', classification);

    try {
      const data = await CyberShieldAPI.get(`/admin/scans?${params.toString()}`);
      if (!data.scans.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-muted">No scans found.</td></tr>`;
        return;
      }
      tbody.innerHTML = data.scans.map((s) => `
        <tr>
          <td>${escapeHTML(s.user ? s.user.name : 'Unknown')}</td>
          <td>${escapeHTML(capitalize(s.scanType))}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(truncate(s.input, 40))}</td>
          <td>${escapeHTML(s.scamCategory)}</td>
          <td>${s.riskScore}/100</td>
          <td><span class="badge ${classificationBadgeClass(s.classification)}">${s.classification}</span></td>
          <td class="text-muted">${formatDate(s.createdAt)}</td>
        </tr>
      `).join('');
    } catch (err) {
      showToast(err.message || 'Failed to load scans', 'error');
      tbody.innerHTML = `<tr><td colspan="7" class="text-muted">Failed to load scans.</td></tr>`;
    }
  }

  // ---------- Content ----------
  document.getElementById('content-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('content-title').value.trim();
    const category = document.getElementById('content-category').value;
    const summary = document.getElementById('content-summary').value.trim();
    const content = document.getElementById('content-body').value.trim();
    const keyTakeaways = document.getElementById('content-takeaways').value
      .split('\n').map((s) => s.trim()).filter(Boolean);

    try {
      await CyberShieldAPI.post('/admin/learning', { title, category, summary, content, keyTakeaways });
      showToast('Module published', 'success', 2000);
      e.target.reset();
      loadContent();
    } catch (err) {
      showToast(err.message || 'Failed to publish module', 'error');
    }
  });

  async function loadContent() {
    const tbody = document.getElementById('admin-content-body');
    tbody.innerHTML = `<tr><td colspan="4" class="text-muted">Loading...</td></tr>`;
    try {
      const data = await CyberShieldAPI.get('/learning');
      if (!data.modules.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-muted">No modules yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = data.modules.map((m) => `
        <tr>
          <td>${escapeHTML(m.title)}</td>
          <td>${escapeHTML(m.category)}</td>
          <td><span class="badge ${m.isPublished ? 'badge-safe' : 'badge-neutral'}">${m.isPublished ? 'Published' : 'Draft'}</span></td>
          <td><button class="btn btn-ghost btn-sm" data-delete-content="${m._id}" style="color:var(--signal-danger);">Delete</button></td>
        </tr>
      `).join('');

      tbody.querySelectorAll('[data-delete-content]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this module?')) return;
          try {
            await CyberShieldAPI.del(`/admin/learning/${btn.dataset.deleteContent}`);
            showToast('Module deleted', 'success', 2000);
            loadContent();
          } catch (err) { showToast(err.message || 'Delete failed', 'error'); }
        });
      });
    } catch (err) {
      showToast(err.message || 'Failed to load content', 'error');
    }
  }

  function truncate(str, len) { if (!str) return '—'; return str.length > len ? str.slice(0, len) + '…' : str; }
  function capitalize(str) { return str ? str[0].toUpperCase() + str.slice(1) : str; }

  loadOverview();
})();
