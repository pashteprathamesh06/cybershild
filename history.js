(function initHistory() {
  if (!requireAuth()) return;

  const searchInput = document.getElementById('search-input');
  const typeFilter = document.getElementById('type-filter');
  const classificationFilter = document.getElementById('classification-filter');
  const sortSelect = document.getElementById('sort-select');
  const tbody = document.getElementById('history-body');
  const pagination = document.getElementById('pagination');
  const modal = document.getElementById('detail-modal');
  const modalContent = document.getElementById('detail-modal-content');

  let currentPage = 1;
  let debounceTimer = null;

  function debounceLoad() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { currentPage = 1; loadHistory(); }, 350);
  }

  searchInput.addEventListener('input', debounceLoad);
  typeFilter.addEventListener('change', () => { currentPage = 1; loadHistory(); });
  classificationFilter.addEventListener('change', () => { currentPage = 1; loadHistory(); });
  sortSelect.addEventListener('change', () => { currentPage = 1; loadHistory(); });

  async function loadHistory() {
    tbody.innerHTML = `<tr><td colspan="7" class="text-muted">Loading...</td></tr>`;

    const [sortBy, order] = sortSelect.value.split('-');
    const params = new URLSearchParams({
      page: currentPage,
      limit: 10,
      sortBy,
      order,
    });
    if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
    if (typeFilter.value) params.set('scanType', typeFilter.value);
    if (classificationFilter.value) params.set('classification', classificationFilter.value);

    try {
      const data = await CyberShieldAPI.get(`/scans?${params.toString()}`);
      renderTable(data.scans);
      renderPagination(data.page, data.pages);
    } catch (err) {
      showToast(err.message || 'Failed to load history', 'error');
      tbody.innerHTML = `<tr><td colspan="7" class="text-muted">Failed to load scan history.</td></tr>`;
    }
  }

  function renderTable(scans) {
    if (!scans || !scans.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-muted">No scans match your filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = scans.map((s) => `
      <tr>
        <td>${escapeHTML(capitalize(s.scanType))}</td>
        <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(truncate(s.input, 45))}</td>
        <td>${escapeHTML(s.scamCategory)}</td>
        <td>${s.riskScore}/100</td>
        <td><span class="badge ${classificationBadgeClass(s.classification)}">${s.classification}</span></td>
        <td class="text-muted">${formatDate(s.createdAt)}</td>
        <td>
          <button class="btn btn-ghost btn-sm" data-view="${s._id}">View</button>
          <button class="btn btn-ghost btn-sm" data-delete="${s._id}" style="color:var(--signal-danger);">Delete</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => viewScan(btn.dataset.view, scans));
    });
    tbody.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => deleteScan(btn.dataset.delete));
    });
  }

  function renderPagination(page, pages) {
    if (pages <= 1) { pagination.innerHTML = ''; return; }
    let html = '';
    for (let i = 1; i <= pages; i++) {
      html += `<button class="btn btn-sm ${i === page ? 'btn-primary' : 'btn-secondary'}" data-page="${i}">${i}</button>`;
    }
    pagination.innerHTML = html;
    pagination.querySelectorAll('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.page, 10); loadHistory(); });
    });
  }

  function viewScan(id, scans) {
    const scan = scans.find((s) => s._id === id);
    if (!scan) return;

    modalContent.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
        <span class="badge ${classificationBadgeClass(scan.classification)}">${scan.classification}</span>
        <button class="btn btn-ghost btn-sm" id="close-detail">✕ Close</button>
      </div>
      <h3 style="margin-bottom:4px;">${escapeHTML(capitalize(scan.scanType))} Scan</h3>
      <p class="text-muted mono" style="font-size:0.82rem;word-break:break-all;">${escapeHTML(scan.input)}</p>
      <div style="display:flex;gap:24px;margin:16px 0;flex-wrap:wrap;">
        <div><span class="text-muted" style="font-size:0.78rem;">RISK SCORE</span><div class="mono" style="font-weight:700;font-size:1.2rem;">${scan.riskScore}/100</div></div>
        <div><span class="text-muted" style="font-size:0.78rem;">CONFIDENCE</span><div class="mono" style="font-weight:700;font-size:1.2rem;">${scan.confidenceScore}%</div></div>
        <div><span class="text-muted" style="font-size:0.78rem;">CATEGORY</span><div class="mono" style="font-weight:700;font-size:1.2rem;">${escapeHTML(scan.scamCategory)}</div></div>
      </div>
      <h4 style="margin-bottom:8px;">Summary</h4>
      <p class="text-secondary">${escapeHTML(scan.summary || 'No summary available.')}</p>
      ${scan.suspiciousIndicators && scan.suspiciousIndicators.length ? `
        <h4 style="margin-bottom:8px;">Suspicious Indicators</h4>
        <div style="margin-bottom:14px;">${scan.suspiciousIndicators.map((i) => `<span class="list-tag">${escapeHTML(i)}</span>`).join('')}</div>
      ` : ''}
      ${scan.recommendedAction ? `
        <h4 style="margin-bottom:8px;">Recommended Action</h4>
        <p class="text-secondary">${escapeHTML(scan.recommendedAction)}</p>
      ` : ''}
      <p class="text-muted" style="font-size:0.78rem;margin-top:14px;">Scanned ${formatDate(scan.createdAt)}</p>
    `;
    modal.classList.remove('hidden');
    document.getElementById('close-detail').addEventListener('click', () => modal.classList.add('hidden'));
  }

  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

  async function deleteScan(id) {
    if (!confirm('Delete this scan permanently?')) return;
    try {
      await CyberShieldAPI.del(`/scans/${id}`);
      showToast('Scan deleted', 'success', 2000);
      loadHistory();
    } catch (err) {
      showToast(err.message || 'Failed to delete scan', 'error');
    }
  }

  function truncate(str, len) {
    if (!str) return '—';
    return str.length > len ? str.slice(0, len) + '…' : str;
  }
  function capitalize(str) { return str ? str[0].toUpperCase() + str.slice(1) : str; }

  loadHistory();
})();
