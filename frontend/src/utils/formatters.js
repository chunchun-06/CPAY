import i18n from '../i18n';

// Format currency in Indian Rupee format
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date as DD MMM YYYY
export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Format date as YYYY-MM-DD for input fields
export function formatDateInput(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'pending':
    case 'overdue':
      return 'bg-rose-50 text-rose-600 border-rose-200';
    case 'upcoming':
      return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'active':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'closed':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

// Get readable status label
export function getStatusLabel(status) {
  switch (status?.toLowerCase()) {
    case 'paid':
      return i18n.t('status.paid');
    case 'pending':
      return i18n.t('status.pending');
    case 'upcoming':
      return i18n.t('status.upcoming');
    case 'active':
      return i18n.t('status.active');
    case 'closed':
      return i18n.t('status.closed');
    default:
      return status || '—';
  }
}

// Format mobile number
export function formatMobile(mobile) {
  if (!mobile) return '—';
  const cleaned = String(mobile).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return mobile;
}

// Get initials from name for avatar
export function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Calculate monthly interest
export function calcMonthlyInterest(principal, rate) {
  if (!principal || !rate) return 0;
  return Math.round((principal * rate) / 100);
}

// Get ordinal suffix for day
export function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
