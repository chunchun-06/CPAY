import { useTranslation } from 'react-i18next';

export default function StatCard({
  label,
  value,
  icon,
  color = 'emerald',
  trend,
  loading = false,
}) {
  const { t } = useTranslation();

  const colorMap = {
    emerald: {
      bg: 'from-emerald-500/20 to-emerald-600/5',
      icon: 'bg-emerald-500/20 text-emerald-400',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
    },
    rose: {
      bg: 'from-rose-500/20 to-rose-600/5',
      icon: 'bg-rose-500/20 text-rose-400',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
    },
    amber: {
      bg: 'from-amber-500/20 to-amber-600/5',
      icon: 'bg-amber-500/20 text-amber-400',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
    },
    blue: {
      bg: 'from-blue-500/20 to-blue-600/5',
      icon: 'bg-blue-500/20 text-blue-400',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-600/5',
      icon: 'bg-purple-500/20 text-purple-400',
      text: 'text-purple-400',
      border: 'border-purple-500/20',
    },
    slate: {
      bg: 'from-slate-500/20 to-slate-600/5',
      icon: 'bg-slate-500/20 text-slate-400',
      text: 'text-slate-400',
      border: 'border-slate-500/20',
    },
  };

  const c = colorMap[color] || colorMap.emerald;

  return (
    <div
      className={[
        'relative rounded-2xl p-5 overflow-hidden h-full flex flex-col justify-center',
        'border border-slate-200 bg-white',
        'hover:shadow-md transition-all duration-300 cursor-default',
        'shadow-sm',
      ].join(' ')}
    >
      {/* Gradient blob */}
      <div
        className={[
          'absolute inset-0 bg-gradient-to-br opacity-10 pointer-events-none',
          c.bg,
        ].join(' ')}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            {label}
          </p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />
          ) : (
            <p className={['text-2xl font-black text-slate-800'].join(' ')}>{value}</p>
          )}
          {trend && (
            <p className="text-xs text-slate-500 mt-1.5">{t(trend)}</p>
          )}
        </div>
        {icon && (
          <div
            className={[
              'p-3 rounded-xl shrink-0 ml-3',
              c.icon,
            ].join(' ')}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
