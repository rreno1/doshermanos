/**
 * Dos Hermanos Catering System — DOM Helpers & UI Controls
 */

export function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

export function formatCurrency(amount) {
  return '₱' + (Number(amount) || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function renderStatusBadge(status) {
  const normalized = String(status || '').toLowerCase();
  let badgeClass = 'badge-requested';

  if (['confirmed', 'paid'].includes(normalized)) badgeClass = 'badge-confirmed';
  if (['cancelled', 'unpaid'].includes(normalized)) badgeClass = 'badge-cancelled';
  if (['partially_paid'].includes(normalized)) badgeClass = 'badge-partially_paid';

  return `<span class="badge ${badgeClass}">${status.replace('_', ' ')}</span>`;
}
