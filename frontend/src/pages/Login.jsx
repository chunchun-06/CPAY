import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { validateLogin, hasErrors } from '../utils/validators';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const { t } = useTranslation();
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateLogin(form);
    setErrors(errs);
    if (hasErrors(errs)) return;

    setSubmitting(true);
    try {
      await login(form.email, form.password);
      toast.success(t('auth.welcomeBack'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message || t('auth.loginFailed');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-blue-500/20 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
              <span className="text-white text-3xl font-black">C</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">CPAY</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">{t('common.loanManagementSystem')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('fields.email')}
              type="email"
              required
              placeholder="admin@cpay.com"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label={t('fields.password')}
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                error={errors.password}
                autoComplete="current-password"
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 bottom-3 p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={submitting}
              className="mt-2"
            >
              {t('auth.loginToCpay')}
            </Button>
          </form>

          <p className="text-center text-xs font-semibold text-slate-400 mt-6">
            {t('common.secureAdminAccess')}
          </p>
        </div>
      </div>
    </div>
  );
}
