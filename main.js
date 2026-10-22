/**
 * CyberShield AI — shared UI utilities used across every page.
 */

// ---------- Toasts ----------
function ensureToastContainer() {
  let el = document.querySelector('.toast-container');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast-container';
    document.body.appendChild(el);
  }
  return el;
}

function showToast(message, type = 'info', duration = 4000) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---------- Auth guard helpers ----------
function requireAuth() {
  const token = CyberShieldAPI.getToken();
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function requireAdmin() {
  const user = CyberShieldAPI.getUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

function redirectIfLoggedIn() {
  if (CyberShieldAPI.getToken()) {
    window.location.href = 'dashboard.html';
  }
}

// ---------- Navbar / sidebar auth-aware rendering ----------
function initUserChip() {
  const chip = document.querySelector('[data-user-chip]');
  const user = CyberShieldAPI.getUser();
  if (chip && user) {
    const initials = user.name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    chip.innerHTML = `<span class="avatar">${initials}</span><span>${escapeHTML(user.name)}</span>`;
  }

  document.querySelectorAll('[data-logout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      CyberShieldAPI.clearSession();
      window.location.href = 'index.html';
    });
  });

  // Show/hide admin links
  const adminLinks = document.querySelectorAll('[data-admin-only]');
  if (user && user.role === 'admin') {
    adminLinks.forEach((el) => el.classList.remove('hidden'));
  } else {
    adminLinks.forEach((el) => el.classList.add('hidden'));
  }
}

function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

// ---------- Formatting helpers ----------
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function classificationBadgeClass(classification) {
  switch (classification) {
    case 'Safe':
      return 'badge-safe';
    case 'Suspicious':
      return 'badge-warn';
    case 'Scam':
    case 'Malicious':
      return 'badge-danger';
    default:
      return 'badge-neutral';
  }
}

function riskColor(score) {
  if (score >= 70) return 'var(--signal-danger)';
  if (score >= 35) return 'var(--signal-warn)';
  return 'var(--signal-safe)';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  const intervals = [
    ['year', 31536000], ['month', 2592000], ['day', 86400],
    ['hour', 3600], ['minute', 60],
  ];
  for (const [name, secs] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${name}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

// ---------- Risk gauge renderer ----------
function renderRiskGauge(container, score, size = 140) {
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = riskColor(score);

  container.innerHTML = `
    <div class="risk-gauge" style="width:${size}px;height:${size}px;">
      <svg viewBox="0 0 140 140">
        <circle class="risk-gauge-track" cx="70" cy="70" r="${radius}"></circle>
        <circle class="risk-gauge-fill" cx="70" cy="70" r="${radius}"
          stroke="${color}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${circumference}"
          style="stroke-dashoffset:${offset}"></circle>
      </svg>
      <div class="risk-gauge-label">
        <span class="num" style="color:${color}">${score}</span>
        <span class="unit">Risk / 100</span>
      </div>
    </div>
  `;
}

// ---------- FAQ accordion (landing page) ----------
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    if (q) {
      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach((el) => el.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initUserChip();
  initMobileNav();
  initFAQ();
});
