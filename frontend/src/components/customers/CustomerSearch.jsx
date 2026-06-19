import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function CustomerSearch({ onSearch, placeholder, className = '' }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(query.trim());
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query, onSearch]);

  const clear = () => {
    setQuery('');
    onSearch('');
  };

  const finalPlaceholder = placeholder || t('common.searchPlaceholder');

  return (
    <div className={['relative flex items-center', className].join(' ')}>
      {/* Search icon */}
      <svg
        className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={finalPlaceholder}
        className="w-full pl-11 pr-10 py-3 min-h-[48px] rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-base shadow-sm"
      />

      {/* Clear button */}
      {query && (
        <button
          onClick={clear}
          className="absolute right-3 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label={t('common.clearSearch')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
