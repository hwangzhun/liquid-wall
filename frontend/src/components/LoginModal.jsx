import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';

export default function LoginModal({ onClose }) {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState(false);

  // Wrap onClose to play exit animation first
  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => onClose?.(), 210);
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '登录失败');
      }
      login(data.token);
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-50/30 dark:bg-slate-900/50 backdrop-blur-md ${closing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-sm detail-glass-panel rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden ${closing ? 'modal-panel-exit' : 'modal-panel-enter'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#197fe6]/10 text-[#197fe6] flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock</span>
            </div>
            <h2 className="text-lg font-bold text-[color:var(--color-fg)]">管理员登录</h2>
          </div>
          <button
            onClick={handleClose}
            className="liquid-button h-9 w-9 flex items-center justify-center rounded-full text-[color:var(--color-fg-subtle)] hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 flex flex-col gap-4">
          <p className="text-sm text-[color:var(--color-fg-subtle)]">
            登录后即可发布和管理留言。
          </p>

          <div>
            <label className="block text-xs font-semibold text-[color:var(--color-fg-muted)] mb-1.5 uppercase tracking-wider">
              密码
            </label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="输入管理员密码..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-white/10 border border-white/50 dark:border-white/20 text-[color:var(--color-fg)] placeholder-[color:var(--color-fg-subtle)] text-sm outline-none focus:border-[#197fe6]/50 focus:ring-2 focus:ring-[#197fe6]/20 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100/70 dark:bg-white/10 text-[color:var(--color-fg-muted)] text-sm font-semibold hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#197fe6] text-white text-sm font-semibold shadow-lg shadow-[#197fe6]/30 hover:bg-blue-600 hover:shadow-[#197fe6]/50 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>login</span>
                  登录
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
