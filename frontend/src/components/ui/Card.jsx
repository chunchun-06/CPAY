export default function Card({
  title,
  subtitle,
  children,
  className = '',
  action,
  noPad = false,
}) {
  return (
    <div
      className={[
        'rounded-2xl border border-slate-200',
        'bg-white',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        'animate-fade-in',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPad ? '' : 'p-6'}>{children}</div>
    </div>
  );
}
