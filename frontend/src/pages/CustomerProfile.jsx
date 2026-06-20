import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import PaymentForm from '../components/payments/PaymentForm';
import PaymentTable from '../components/payments/PaymentTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { getCustomerById } from '../api/customerApi';
import { getLoanByCustomer } from '../api/loanApi';
import { getPaymentHistory, createPayment, updatePayment, deletePayment } from '../api/paymentApi';
import { closeLoan } from '../api/loanApi';
import { deleteCustomer, regenerateToken } from '../api/customerApi';
import useToast from '../hooks/useToast';
import {
  formatCurrency,
  formatDate,
  formatMobile,
  getInitials,
  getOrdinal,
} from '../utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CustomerProfile() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [customer, setCustomer] = useState(null);
  const [loan, setLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentInitialData, setPaymentInitialData] = useState(null);
  const [closeDialog, setCloseDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [regenDialog, setRegenDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [custRes, loanRes] = await Promise.all([
        getCustomerById(id),
        getLoanByCustomer(id).catch(() => null),
      ]);
      const c = custRes.data.data || custRes.data.customer || custRes.data;
      setCustomer(c);
      if (loanRes) {
        const l = loanRes.data.data || loanRes.data.loan || loanRes.data;
        setLoan(l);
      }
    } catch {
      toast.error(t('customer.notFound'));
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadPayments = useCallback(async () => {
    if (!loan?._id) return;
    setPaymentsLoading(true);
    try {
      const { data } = await getPaymentHistory(loan._id);
      setPayments(data.data || data.payments || data || []);
    } finally {
      setPaymentsLoading(false);
    }
  }, [loan?._id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadPayments(); }, [loadPayments]);

  // Record payment
  const handlePayment = async (paymentData) => {
    setActionLoading(true);
    try {
      await createPayment(paymentData);
      toast.success(t('payment.recordedSuccess'));
      setPaymentModal(false);
      setPaymentInitialData(null);
      await Promise.all([load(), loadPayments()]);
    } catch (err) {
      const apiErrs = err.response?.data?.errors;
      if (apiErrs && apiErrs.length > 0) {
        toast.error(apiErrs.map(e => e.message).join('\n'));
      } else {
        toast.error(err.response?.data?.message || t('payment.recordFailed'));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const [editPaymentModal, setEditPaymentModal] = useState(false);
  const [deletePaymentDialog, setDeletePaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const handleEditPayment = async (paymentData) => {
    setActionLoading(true);
    try {
      await updatePayment(selectedPayment._id || selectedPayment.id, paymentData);
      toast.success('Payment updated successfully');
      setEditPaymentModal(false);
      setSelectedPayment(null);
      await Promise.all([load(), loadPayments()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePayment = async () => {
    setActionLoading(true);
    try {
      await deletePayment(selectedPayment._id || selectedPayment.id);
      toast.success('Payment deleted successfully');
      setDeletePaymentDialog(false);
      setSelectedPayment(null);
      await Promise.all([load(), loadPayments()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Close loan
  const handleCloseLoan = async () => {
    setActionLoading(true);
    try {
      await closeLoan(loan._id);
      toast.success(t('customer.loanClosedSuccess'));
      setCloseDialog(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('customer.loanCloseFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  // Delete customer
  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteCustomer(id);
      toast.success(t('customer.deletedSuccess', { name: customer?.fullName || '' }));
      navigate('/customers');
    } catch (err) {
      toast.error(err.response?.data?.message || t('customer.deleteFailed'));
      setActionLoading(false);
      setDeleteDialog(false);
    }
  };

  // Regenerate token
  const handleRegen = async () => {
    setActionLoading(true);
    try {
      const { data } = await regenerateToken(id);
      toast.success(t('customer.tokenRegenerated'));
      setRegenDialog(false);
      await load();
    } catch (err) {
      toast.error(t('customer.tokenRegenFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  // Copy public link
  const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  const publicLink = (customer?.customerId && customer?.token)
    ? `${baseUrl.replace(/\/$/, '')}/customer/${customer.customerId}-${customer.token}`
    : customer?.publicLink || null;

  const copyLink = () => {
    if (!publicLink) return;
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    toast.success(t('customer.linkCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  // WhatsApp share
  const whatsappShare = () => {
    if (!publicLink) return;
    const msg = `नमस्ते, अपना पूरा हिसाब, भुगतान इतिहास और वर्तमान बकाया देखने के लिए इस लिंक पर क्लिक करें:\n\n${publicLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF();
    // Header
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129);
    doc.text(t('customer.pdfHeader'), 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${t('common.customer')}: ${customer?.fullName || ''}`, 14, 35);
    doc.text(`${t('fields.mobileNumber')}: ${customer?.mobileNumber || ''}`, 14, 42);
    doc.text(`${t('fields.address')}: ${customer?.address || '—'}`, 14, 49);
    doc.text(`${t('common.generated')}: ${formatDate(new Date())}`, 14, 56);

    // Loan info
    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129);
    doc.text(t('customer.loanDetails'), 14, 68);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`${t('fields.loanAmount')}: ${formatCurrency(loan?.loanAmount)}`, 14, 76);
    doc.text(`${t('fields.interestRate')}: ${loan?.interestRate}%/${t('common.month')}`, 14, 83);
    doc.text(`${t('fields.remainingPrincipal')}: ${formatCurrency(loan?.remainingPrincipal)}`, 14, 90);
    doc.text(`${t('fields.monthlyInterest')}: ${formatCurrency(loan?.monthlyInterest)}`, 14, 97);
    doc.text(`${t('fields.loanStartDate')}: ${formatDate(loan?.loanStartDate)}`, 14, 104);
    doc.text(`${t('fields.status')}: ${t(`status.${loan?.status || 'active'}`).toUpperCase()}`, 14, 111);

    // Payments table
    if (payments.length > 0) {
      doc.setFontSize(13);
      doc.setTextColor(16, 185, 129);
      doc.text(t('fields.paymentHistory'), 14, 125);

      autoTable(doc, {
        startY: 130,
        head: [[t('fields.date'), t('fields.interestPaid'), t('fields.principalPaid'), t('fields.totalPaid'), t('fields.remainingPrincipal'), t('fields.remarks')]],
        body: payments.map((p) => [
          formatDate(p.date),
          formatCurrency(p.interestPaid),
          formatCurrency(p.principalPaid),
          formatCurrency(p.totalPaid),
          formatCurrency(p.remainingPrincipal),
          p.remarks || '—',
        ]),
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 250, 248] },
        styles: { fontSize: 9 },
      });
    }

    doc.save(`CPAY_${customer?.fullName || 'Statement'}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`);
    toast.success(t('customer.pdfExported'));
  };

  if (loading) {
    return (
      <Layout pageTitle={t('customer.customerProfile')}>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Spinner size="xl" />
        </div>
      </Layout>
    );
  }

  const isLoanActive = loan?.status === 'active';
  const initials = getInitials(customer?.fullName || '');

  // Computed Financials
  const actualPayments = payments.filter(p => !p.isVirtual);
  const pendingItems = payments.filter(p => p.isVirtual && p.status !== 'paid');
  const totalInterestPending = pendingItems.reduce((acc, p) => acc + p.interestPaid, 0);
  const lastPaymentDate = actualPayments.length > 0 ? actualPayments[0].date : null;
  const isOverdue = pendingItems.some(p => p.daysOverdue > 0);
  const currentStatus = isOverdue ? 'Overdue' : pendingItems.length > 0 ? 'Pending' : 'Paid';

  return (
    <Layout pageTitle={customer?.fullName || t('customer.customerProfile')}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <span className="text-emerald-400 text-2xl font-black">{initials}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                {customer?.customerId && (
                  <span className="text-xl font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                    {customer.customerId}
                  </span>
                )}
                {customer?.fullName}
              </h1>
              <p className="text-lg text-slate-600 font-semibold">{formatMobile(customer?.mobileNumber)}</p>
              {customer?.address && <p className="text-slate-600 mt-1">{customer.address}</p>}
              {customer?.notes && <p className="text-slate-500 italic mt-1">{customer.notes}</p>}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-slate-100">
            <Link to={`/customers/${id}/edit`}>
              <Button variant="outline" size="sm">
                {t('common.edit')}
              </Button>
            </Link>
            {isLoanActive && (
              <Button variant="primary" size="sm" onClick={() => { setPaymentInitialData(null); setPaymentModal(true); }}>
                {t('customer.addPayment')}
              </Button>
            )}
            {isLoanActive && (
              <Button variant="outline" size="sm" onClick={() => setCloseDialog(true)}>
                {t('customer.closeLoan')}
              </Button>
            )}
            {publicLink && (
              <Button variant="outline" size="sm" onClick={whatsappShare} className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300">
                {t('common.share')}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportPDF}>
              {t('common.exportPdf')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteDialog(true)} className="hover:text-rose-500 hover:bg-rose-50">
              {t('common.delete')}
            </Button>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Financial Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Total Interest Paid</p>
              <p className="text-xl font-black text-emerald-700">{formatCurrency(loan?.totalInterestPaid || 0)}</p>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">Total Interest Pending</p>
              <p className="text-xl font-black text-rose-700">{formatCurrency(totalInterestPending)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Total Principal Paid</p>
              <p className="text-xl font-black text-blue-700">{formatCurrency(loan?.totalPrincipalPaid || 0)}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Remaining Principal</p>
              <p className="text-xl font-black text-amber-700">{formatCurrency(loan?.remainingPrincipal || 0)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Monthly Interest</p>
              <p className="text-xl font-black text-slate-800">{formatCurrency(loan?.monthlyInterest || 0)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Collected</p>
              <p className="text-xl font-black text-slate-800">{formatCurrency((loan?.totalInterestPaid || 0) + (loan?.totalPrincipalPaid || 0))}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Payment Date</p>
              <p className="text-base font-bold text-slate-800">{lastPaymentDate ? formatDate(lastPaymentDate) : '—'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Next Due Date</p>
              <p className="text-base font-bold text-slate-800">{t('customer.ofEachMonth', { ordinal: getOrdinal(loan?.monthlyDueDay || 1), day: loan?.monthlyDueDay || 1 })}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Current Status:</span>
            {currentStatus === 'Paid' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-100 text-emerald-700"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Paid</span>}
            {currentStatus === 'Pending' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-amber-100 text-amber-700"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pending</span>}
            {currentStatus === 'Overdue' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-rose-100 text-rose-700"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Overdue</span>}
          </div>
        </div>

        {/* Loan Details + Customer Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Loan Details */}
          <Card title={t('customer.loanDetails')}>
            <dl className="space-y-3">
              {[
                { label: t('fields.loanAmount'), value: formatCurrency(loan?.loanAmount) },
                { label: t('fields.interestRate'), value: `${loan?.interestRate || 0}% ${t('customer.perMonth')}` },
                { label: t('fields.loanStartDate'), value: formatDate(loan?.loanStartDate) },
                { label: t('customer.totalPaidPrincipal'), value: formatCurrency((loan?.loanAmount || 0) - (loan?.remainingPrincipal || 0)) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <dt className="text-sm font-medium text-slate-500">{label}</dt>
                  <dd className="text-sm font-bold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Customer Details */}
          <Card title={t('customer.customerDetails')}>
            <dl className="space-y-3">
              <div className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
                <dt className="text-sm font-medium text-slate-500">{t('fields.mobileNumber')}</dt>
                <dd className="text-sm font-bold text-slate-800">{formatMobile(customer?.mobileNumber)}</dd>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
                <dt className="text-sm font-medium text-slate-500">{t('fields.address')}</dt>
                <dd className="text-sm font-bold text-slate-800 text-right max-w-[60%]">{customer?.address || '—'}</dd>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
                <dt className="text-sm font-medium text-slate-500">{t('fields.notes')}</dt>
                <dd className="text-sm font-medium text-slate-600 text-right max-w-[60%]">{customer?.notes || '—'}</dd>
              </div>
            </dl>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('customer.customerLink')}</p>
              {publicLink ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <p className="text-xs text-slate-600 truncate flex-1 font-mono">{publicLink}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={copyLink} className="w-full">
                      {copied ? t('common.copied') : t('common.copyLink')}
                    </Button>
                    <a href={publicLink} target="_blank" rel="noopener noreferrer" className="block w-full">
                      <Button variant="outline" size="sm" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                        Open Portal
                      </Button>
                    </a>
                    <Button variant="outline" size="sm" onClick={whatsappShare} className="w-full text-green-600 border-green-200 hover:bg-green-50">
                      {t('common.share')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setRegenDialog(true)} className="w-full text-amber-600 hover:bg-amber-50">
                      {t('common.regenerate')}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Payment History */}
        <Card
          title={t('fields.paymentHistory')}
          subtitle={t('customer.transactionCount', { count: payments.length })}
          action={
            isLoanActive && (
              <Button variant="primary" size="sm" onClick={() => setPaymentModal(true)}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('customer.addPayment')}
              </Button>
            )
          }
          noPad
        >
          <PaymentTable 
            payments={payments} 
            loading={paymentsLoading} 
            onPayPending={(item) => { setPaymentInitialData(item); setPaymentModal(true); }}
            onEditPayment={(item) => { setSelectedPayment(item); setEditPaymentModal(true); }}
            onDeletePayment={(item) => { setSelectedPayment(item); setDeletePaymentDialog(true); }}
          />
        </Card>
      </div>

      {/* Payment Modal (Create) */}
      <Modal isOpen={paymentModal} onClose={() => { setPaymentModal(false); setPaymentInitialData(null); }} title={t('payment.recordPayment')} size="md">
        <PaymentForm loan={loan} initialData={paymentInitialData} onSubmit={handlePayment} loading={actionLoading} />
      </Modal>

      {/* Edit Payment Modal */}
      <Modal isOpen={editPaymentModal} onClose={() => { setEditPaymentModal(false); setSelectedPayment(null); }} title="Edit Payment" size="md">
        {selectedPayment && (
          <PaymentForm 
            loan={loan} 
            initialData={{ ...selectedPayment, isEditMode: true }} 
            onSubmit={handleEditPayment} 
            loading={actionLoading} 
          />
        )}
      </Modal>

      {/* Delete Payment Dialog */}
      <ConfirmDialog
        isOpen={deletePaymentDialog}
        onClose={() => setDeletePaymentDialog(false)}
        onConfirm={handleDeletePayment}
        title="Delete Payment"
        message="Are you sure you want to delete this payment? All dependent loan balances will be recalculated."
        confirmText="Delete Payment"
        danger
        loading={actionLoading}
      />

      {/* Close Loan Dialog */}
      <ConfirmDialog
        isOpen={closeDialog}
        onClose={() => setCloseDialog(false)}
        onConfirm={handleCloseLoan}
        title={t('customer.closeLoan')}
        message={t('customer.closeLoanDesc', { name: customer?.fullName, remaining: formatCurrency(loan?.remainingPrincipal) })}
        confirmText={t('customer.closeLoan')}
        loading={actionLoading}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        title={t('common.deleteCustomer')}
        message={t('customer.deleteConfirm')}
        confirmText={t('common.delete')}
        danger
        loading={actionLoading}
      />

      {/* Regen Token Dialog */}
      <ConfirmDialog
        isOpen={regenDialog}
        onClose={() => setRegenDialog(false)}
        onConfirm={handleRegen}
        title={t('customer.regenerateToken')}
        message={t('customer.regenerateConfirm')}
        confirmText={t('common.regenerate')}
        loading={actionLoading}
      />
    </Layout>
  );
}
