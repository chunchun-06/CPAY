import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { validateCustomer, hasErrors } from '../../utils/validators';
import { formatCurrency, formatDateInput } from '../../utils/formatters';

const defaultForm = {
  fullName: '',
  mobileNumber: '',
  address: '',
  notes: '',
  loanAmount: '',
  interestRate: '',
  monthlyDueDay: '',
  loanStartDate: formatDateInput(new Date()),
};

export default function CustomerForm({ initialData, onSubmit, loading = false, submitLabel }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      const loan = initialData.loan || {};
      setForm({
        fullName: initialData.fullName || '',
        mobileNumber: initialData.mobileNumber || '',
        address: initialData.address || '',
        notes: initialData.notes || '',
        loanAmount: loan.loanAmount || initialData.loanAmount || '',
        interestRate: loan.interestRate || initialData.interestRate || '',
        monthlyDueDay: loan.monthlyDueDay || initialData.monthlyDueDay || '',
        loanStartDate: formatDateInput(loan.loanStartDate || initialData.loanStartDate) || formatDateInput(new Date()),
      });
    }
  }, [initialData]);

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const monthlyInterest =
    form.loanAmount && form.interestRate
      ? Math.round((Number(form.loanAmount) * Number(form.interestRate)) / 100)
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateCustomer(form);
    setErrors(errs);
    if (hasErrors(errs)) return;
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Personal Info */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
          {t('customer.personalInfo')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('fields.fullName')}
            required
            placeholder="Ramesh Kumar"
            value={form.fullName}
            onChange={set('fullName')}
            error={errors.fullName}
          />
          <Input
            label={t('fields.mobileNumber')}
            required
            placeholder="9876543210"
            value={form.mobileNumber}
            onChange={set('mobileNumber')}
            error={errors.mobileNumber}
            type="tel"
            maxLength={10}
          />
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('fields.address')}
            </label>
            <textarea
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-base bg-white border border-slate-300 hover:border-slate-400 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none shadow-sm"
              placeholder={t('fields.address')}
              value={form.address}
              onChange={set('address')}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('fields.notes')}
            </label>
            <textarea
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-base bg-white border border-slate-300 hover:border-slate-400 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none shadow-sm"
              placeholder={t('fields.notes')}
              value={form.notes}
              onChange={set('notes')}
            />
          </div>
        </div>
      </div>

      {/* Loan Details */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
          {t('customer.loanDetails')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('fields.loanAmount')}
            required
            type="number"
            placeholder="100000"
            value={form.loanAmount}
            onChange={set('loanAmount')}
            error={errors.loanAmount}
            min={1000}
          />
          <Input
            label={t('fields.interestRate')}
            required
            type="number"
            step="0.1"
            placeholder="3"
            value={form.interestRate}
            onChange={set('interestRate')}
            error={errors.interestRate}
            min={0.1}
            max={100}
          />
          <Input
            label={t('fields.monthlyDueDay')}
            required
            type="number"
            placeholder="5"
            value={form.monthlyDueDay}
            onChange={set('monthlyDueDay')}
            error={errors.monthlyDueDay}
            min={1}
            max={31}
            helperText={t('customer.dueDayHelper')}
          />
          <Input
            label={t('fields.loanStartDate')}
            required
            type="date"
            value={form.loanStartDate}
            onChange={set('loanStartDate')}
            error={errors.loanStartDate}
          />
        </div>
      </div>

      {/* Monthly Interest Preview */}
      {monthlyInterest > 0 && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-emerald-700 font-bold">{t('customer.monthlyInterestPreview')}</p>
            <p className="text-xs font-semibold text-emerald-600/70 mt-0.5">
              {form.interestRate}% {t('common.of')} {formatCurrency(Number(form.loanAmount))}
            </p>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {formatCurrency(monthlyInterest)}
          </p>
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={loading}>
        {submitLabel || t('common.save')}
      </Button>
    </form>
  );
}
