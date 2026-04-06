'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '../../services/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) router.push('/dashboard')
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      if (res.data.user.role !== 'admin') {
        setError('Access denied. Admin accounts only.')
        setLoading(false)
        return
      }
      localStorage.setItem('admin_token', res.data.token)
      localStorage.setItem('admin_user', JSON.stringify(res.data.user))
      router.push('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{loginStyles}</style>
      <div className="login-root">
        {/* Background grid */}
        <div className="login-grid-bg" />

        <div className="login-card">
          {/* Brand */}
          <div className="login-brand">
            <div className="login-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
                <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
              </svg>
            </div>
            <div>
              <h1 className="login-brand-name">TableBook</h1>
              <p className="login-brand-sub">Admin Console</p>
            </div>
          </div>

          <h2 className="login-title">Sign in to continue</h2>
          <p className="login-sub">Restricted access — authorised personnel only</p>

          {error && (
            <div className="login-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-group">
              <label>Email address</label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  type="email"
                  placeholder="admin@tablebook.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-group">
              <label>Password</label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="login-eye-btn" onClick={() => setShowPass(p => !p)}>
                  {showPass ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? (
                <>
                  <span className="login-btn-spinner" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

const loginStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .login-root {
    min-height: 100vh;
    background: #080810;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Sans', sans-serif;
    position: relative;
    overflow: hidden;
  }

  .login-grid-bg {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(244,63,94,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(244,63,94,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }
  .login-grid-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 50% at 50% 50%, transparent 40%, #080810 100%);
  }

  .login-card {
    position: relative;
    z-index: 1;
    background: #0f0f1a;
    border: 1px solid #1e2030;
    border-radius: 24px;
    padding: 44px 40px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 0 0 1px rgba(244,63,94,0.05), 0 40px 80px rgba(0,0,0,0.6);
  }

  .login-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 36px;
  }
  .login-brand-icon {
    width: 44px; height: 44px;
    background: #f43f5e;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    color: white;
    box-shadow: 0 8px 24px rgba(244,63,94,0.3);
  }
  .login-brand-name {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #f1f5f9;
  }
  .login-brand-sub {
    font-size: 11px;
    color: #334155;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 2px;
  }

  .login-title {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 800;
    color: #f1f5f9;
    letter-spacing: -0.02em;
    margin-bottom: 8px;
  }
  .login-sub {
    font-size: 13px;
    color: #475569;
    margin-bottom: 28px;
  }

  .login-error {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(244,63,94,0.08);
    border: 1px solid rgba(244,63,94,0.2);
    color: #f43f5e;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 13px;
    margin-bottom: 20px;
  }

  .login-form { display: flex; flex-direction: column; gap: 18px; }

  .login-group { display: flex; flex-direction: column; gap: 7px; }
  .login-group label {
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    letter-spacing: 0.04em;
  }

  .login-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .login-input-icon {
    position: absolute;
    left: 14px;
    color: #334155;
    pointer-events: none;
  }
  .login-input-wrap input {
    width: 100%;
    background: #0d0d18;
    border: 1px solid #1e2030;
    border-radius: 12px;
    padding: 12px 16px 12px 42px;
    font-size: 14px;
    color: #e2e8f0;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .login-input-wrap input::placeholder { color: #2d3348; }
  .login-input-wrap input:focus {
    border-color: #f43f5e;
    box-shadow: 0 0 0 3px rgba(244,63,94,0.08);
  }

  .login-eye-btn {
    position: absolute;
    right: 14px;
    background: none;
    border: none;
    color: #334155;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 4px;
    transition: color 0.15s;
  }
  .login-eye-btn:hover { color: #94a3b8; }

  .login-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px;
    background: #f43f5e;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    margin-top: 4px;
    box-shadow: 0 8px 24px rgba(244,63,94,0.25);
  }
  .login-btn:hover:not(:disabled) {
    background: #e11d48;
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgba(244,63,94,0.35);
  }
  .login-btn:active:not(:disabled) { transform: translateY(0); }
  .login-btn:disabled { background: #4b1b26; cursor: not-allowed; box-shadow: none; }

  .login-btn-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`
