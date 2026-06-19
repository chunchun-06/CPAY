import Spinner from './Spinner';
import { useTranslation } from 'react-i18next';

export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage,
  className = '',
}) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">{emptyMessage || t('common.noDataFound')}</p>
      </div>
    );
  }

  return (
    <div className={['w-full overflow-x-auto', className].join(' ')}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50/50"
                style={col.width ? { width: col.width } : {}}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row._id || row.id || idx}
              className={[
                'border-b border-slate-100',
                'hover:bg-slate-50 transition-colors duration-150',
                idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30',
              ].join(' ')}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
