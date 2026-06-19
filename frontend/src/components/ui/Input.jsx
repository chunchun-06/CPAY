import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    className = '',
    containerClassName = '',
    id,
    required,
    type = 'text',
    ...props
  },
  ref
) {
  const { t } = useTranslation();
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={['flex flex-col gap-1.5', containerClassName].join(' ')}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-slate-700"
        >
          {label ? t(label) : null}
          {required && <span className="text-rose-400 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={[
          'w-full rounded-xl px-4 py-3 text-base',
          'bg-white border border-slate-300 text-slate-900 placeholder-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          'transition-all duration-200 shadow-sm',
          'min-h-[48px]',
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50'
            : 'hover:border-slate-400',
          className,
        ].join(' ')}
        {...props}
        placeholder={props.placeholder ? t(props.placeholder) : undefined}
      />
      {error && (
        <p className="text-sm text-rose-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {t(error)}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-500">{t(helperText)}</p>
      )}
    </div>
  );
});

export default Input;
