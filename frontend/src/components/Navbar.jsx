import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Navbar({ onSearch, onOpenPost, onOpenLogin, darkMode, onToggleDark }) {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  function handleSearch(e) {
    const val = e.target.value;
    setSearchValue(val);
    onSearch?.(val);
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Escape') {
      setSearchOpen(false);
      setSearchValue('');
      onSearch?.('');
    }
  }

  const openDrawer = useCallback(() => {
    setDrawerClosing(false);
    setMobileMenuOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerClosing(true);
    setTimeout(() => {
      setMobileMenuOpen(false);
      setDrawerClosing(false);
    }, 230);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 sm:pt-6 px-3 sm:px-4">
        <div className="glass-panel rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-3 sm:gap-6 max-w-4xl w-full justify-between transition-all duration-300">
          {/* Logo */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0"
            onClick={() => navigate('/')}
          >
            <img src="/favicon.png" alt="Liquid Wall" className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover" />
            <span className="font-bold text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[color:var(--color-fg)] to-[color:var(--color-fg-muted)]">
            流光语壁
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Bar (expandable with smooth width transition) */}
            <div
              className="hidden sm:flex items-center overflow-hidden transition-all duration-300 ease-in-out"
              style={{ width: searchOpen ? '13rem' : '2.5rem' }}
            >
              {searchOpen ? (
                <div className="flex items-center gap-2 bg-white/60 dark:bg-white/[0.08] dark:border-white/15 rounded-full px-3 py-1.5 border border-white/50 dark:border-[color:var(--color-border)] backdrop-blur-sm w-full">
                  <span className="material-symbols-outlined text-[color:var(--color-fg-subtle)] shrink-0" style={{ fontSize: '16px' }}>search</span>
                  <input
                    autoFocus
                    type="text"
                    value={searchValue}
                    onChange={handleSearch}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="搜索留言..."
                    className="outline-none bg-transparent text-sm text-[color:var(--color-fg)] placeholder-[color:var(--color-fg-subtle)] flex-1 min-w-0"
                  />
                  <button
                    onClick={() => { setSearchOpen(false); setSearchValue(''); onSearch?.(''); }}
                    className="text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)] shrink-0 transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/40 dark:bg-white/[0.08] text-[color:var(--color-fg-muted)] hover:bg-white dark:hover:bg-white/20 hover:text-[#197fe6] dark:hover:text-[#58a6ff] transition-all backdrop-blur-sm"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
                </button>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDark}
              className="hidden sm:flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/40 dark:bg-white/[0.08] text-[color:var(--color-fg-muted)] hover:bg-white dark:hover:bg-white/20 transition-all backdrop-blur-sm"
              title={darkMode ? '切换浅色模式' : '切换深色模式'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Login / Logout Button */}
            {isLoggedIn ? (
              <>
                {/* Post Button – visible only when logged in */}
                <button
                  onClick={onOpenPost}
                  className="hidden sm:flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#197fe6] text-white rounded-full text-sm font-semibold shadow-lg shadow-[#197fe6]/30 hover:shadow-[#197fe6]/50 hover:-translate-y-0.5 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                  <span className="hidden sm:inline">发布留言</span>
                </button>
                <button
                  onClick={logout}
                  className="hidden sm:flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/40 dark:bg-white/[0.08] text-[color:var(--color-fg-muted)] hover:bg-red-50 dark:hover:bg-red-900/25 hover:text-red-500 dark:hover:text-red-400 transition-all backdrop-blur-sm"
                  title="退出登录"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenLogin}
                className="hidden sm:flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-white/40 dark:bg-white/[0.08] text-[color:var(--color-fg-muted)] border border-white/50 dark:border-[color:var(--color-border)] rounded-full text-sm font-semibold hover:bg-white dark:hover:bg-white/15 transition-all backdrop-blur-sm"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock</span>
                <span>登录</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={openDrawer}
              className="flex md:hidden items-center justify-center w-9 h-9 rounded-full bg-white/40 dark:bg-white/[0.08] text-[color:var(--color-fg-muted)]"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>menu</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/30 backdrop-blur-sm ${drawerClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`}
            onClick={closeDrawer}
          />
          {/* Panel */}
          <div className={`relative ml-auto w-72 h-full bg-[color:var(--color-surface)] backdrop-blur-xl border-l border-[color:var(--color-border)] shadow-2xl flex flex-col p-6 pt-10 gap-2 ${drawerClosing ? 'drawer-exit' : 'drawer-enter'}`}>
            <button
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[color:var(--color-surface-2)] flex items-center justify-center text-[color:var(--color-fg-muted)] hover:opacity-90 transition-colors"
              onClick={closeDrawer}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>

            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[color:var(--color-border)]">
              <img src="/favicon.png" alt="Liquid Wall" className="w-9 h-9 rounded-xl object-cover" />
              <span className="font-bold text-lg text-[color:var(--color-fg)]">Liquid Wall</span>
            </div>

            <Link to="/" onClick={closeDrawer} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[color:var(--color-surface-2)] text-[color:var(--color-fg)] font-medium transition-colors">
              <span className="material-symbols-outlined text-[#197fe6]">home</span> Home
            </Link>

            {isLoggedIn && (
              <button
                onClick={() => { closeDrawer(); onOpenPost(); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-muted)] transition-colors"
              >
                <span className="material-symbols-outlined text-[#197fe6]">add_circle</span> 发布留言
              </button>
            )}

            <div className="mt-auto pt-4 border-t border-[color:var(--color-border)] flex flex-col gap-2">
              {/* Mobile Search */}
              <div className="flex items-center gap-2 bg-[color:var(--color-surface-2)] rounded-xl px-3 py-2">
                <span className="material-symbols-outlined text-[color:var(--color-fg-subtle)]" style={{ fontSize: '16px' }}>search</span>
                <input
                  type="text"
                  value={searchValue}
                  onChange={handleSearch}
                  placeholder="搜索留言..."
                  className="outline-none bg-transparent text-sm text-[color:var(--color-fg)] placeholder-[color:var(--color-fg-subtle)] flex-1"
                />
              </div>

              {/* Dark Mode Toggle Mobile */}
              <button
                onClick={() => { onToggleDark(); closeDrawer(); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-muted)] transition-colors"
              >
                <span className="material-symbols-outlined text-amber-500">{darkMode ? 'light_mode' : 'dark_mode'}</span>
                {darkMode ? '切换浅色模式' : '切换深色模式'}
              </button>

              {/* Login / Logout Mobile */}
              {isLoggedIn ? (
                <button
                  onClick={() => { logout(); closeDrawer(); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined">logout</span>
                  退出登录
                </button>
              ) : (
                <button
                  onClick={() => { closeDrawer(); onOpenLogin?.(); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-muted)] transition-colors"
                >
                  <span className="material-symbols-outlined text-[#197fe6]">lock</span>
                  管理员登录
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
