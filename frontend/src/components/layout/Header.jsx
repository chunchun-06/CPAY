import { useThemeContext } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function Header({ pageTitle = 'Dashboard', onMenuClick }) {
  const { isDark, toggleTheme } = useThemeContext();
  const { admin } = useAuth();
  const { t, i18n } = useTranslation();

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
      {/* Left: Hamburger + Title */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h2 className="text-base sm:text-lg font-bold text-slate-800">{pageTitle}</h2>
      </div>

      {/* Right: Theme toggle + Admin badge */}
      <div className="flex items-center gap-3">
        {/* Language toggle */}
        <button
          onClick={() => {
            const newLng = i18n.language === 'en' ? 'hi' : 'en';
            i18n.changeLanguage(newLng);
          }}
          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-sm transition-colors border border-blue-200"
          title="Toggle Language"
        >
          {i18n.language === 'en' ? 'HI' : 'EN'}
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle theme"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Admin badge */}
        {admin && (
          <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-xs font-black">
                {(admin.name || admin.email || 'A')[0].toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-blue-700 font-bold">Admin</span>
          </div>
        )}
      </div>
    </header>
  );
}
