import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { formatCurrency, formatDateInput } from '../../utils/formatters';
import { validatePayment, hasErrors } from '../../utils/validators';

export default function PaymentForm({ loan, initialData, onSubmit, loading = false }) {
  const { t } = useTranslation();
  const monthlyInterest = initialData?.interestPaid ?? loan?.monthlyInterest ?? 0;
  const remainingPrincipal = initialData?.remainingPrincipal ?? loan?.remainingPrincipal ?? 0;

  const [form, setForm] = useState({
    date: formatDateInput(initialData?.date ? new Date(initialData.date) : new Date()),
    interestPaid: String(monthlyInterest),
    principalPaid: '0',
    remarks: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const mi = initialData?.interestPaid ?? loan?.monthlyInterest ?? 0;
    setForm((prev) => ({
      ...prev,
      interestPaid: String(mi),
      date: formatDateInput(initialData?.date ? new Date(initialData.date) : new Date()),
    }));
  }, [initialData, loan?.monthlyInterest]);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const totalAmount =
    (Number(form.interestPaid) || 0) + (Number(form.principalPaid) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validatePayment(form, remainingPrincipal);
    setErrors(errs);
    if (hasErrors(errs)) return;

    await onSubmit({
      loanId: loan._id,
      date: form.date,
      interestPaid: Number(form.interestPaid),
      principalPaid: Number(form.principalPaid),
      totalAmount: totalAmount,
      totalPaid: totalAmount, // Send both to be safe
      remarks: form.remarks,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Current Loan Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">{t('fields.remainingPrincipal')}</p>
          <p className="text-base font-bold text-slate-800">{formatCurrency(remainingPrincipal)}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600/80 mb-1 uppercase tracking-wider">{t('fields.monthlyInterest')}</p>
          <p className="text-base font-bold text-emerald-600">{formatCurrency(monthlyInterest)}</p>
        </div>
      </div>

      {/* Form fields */}
      <Input
        label={t('fields.date')}
        type="date"
        required
        value={form.date}
        onChange={set('date')}
        error={errors.date}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('fields.interestPaid')}
          type="number"
          required
          min={0}
          value={form.interestPaid}
          onChange={set('interestPaid')}
          error={errors.interestPaid}
        />
        <Input
          label={t('fields.principalPaid')}
          type="number"
          required
          min={0}
          max={remainingPrincipal}
          value={form.principalPaid}
          onChange={set('principalPaid')}
          error={errors.principalPaid}
          helperText={`${t('common.max')}: ${formatCurrency(remainingPrincipal)}`}
        />
      </div>

      {/* Total preview */}
      {totalAmount > 0 && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex justify-between items-center shadow-sm">
          <p className="text-sm text-blue-700 font-bold uppercase tracking-wider">{t('payment.totalAmount')}</p>
          <p className="text-2xl font-black text-blue-600">{formatCurrency(totalAmount)}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('fields.remarks')}</label>
        <textarea
          rows={2}
          className="w-full rounded-xl px-4 py-3 text-base bg-white border border-slate-300 hover:border-slate-400 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none shadow-sm"
          placeholder={t('payment.optionalNote')}
          value={form.remarks}
          onChange={set('remarks')}
        />
      </div>

      <Button type="submit" fullWidth size="lg" loading={loading}>
        {t('payment.recordPayment')}
      </Button>
    </form>
  );
}
