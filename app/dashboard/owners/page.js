'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'

export default function OwnersPage() {
  const [owners, setOwners]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchOwners() }, [])

  const fetchOwners = async () => {
    try {
      const res = await api.get('/admin/users')
      const allUsers = res.data.users || []
      // Only restaurant owners
      setOwners(allUsers.filter(u => u.role === 'restaurant'))
    } catch (err) {
      console.error('Fetch owners error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this restaurant owner? Their restaurants may also be affected.')) return
    setDeleting(id)
    try {
      await api.delete(`/admin/users/${id}`)
      setOwners(prev => prev.filter(o => o.id !== id))
    } catch {
      alert('Failed to delete owner.')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = owners.filter(o =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase()) ||
    o.phone?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <>
      <style>{styles}</style>
      <div className="p-loading"><div className="p-spinner" /><span>Loading owners...</span></div>
    </>
  )

  return (
    <>
      <style>{styles}</style>
      <div className="p-root">
        <header className="p-header">
          <div>
            <p className="p-eyebrow">Management</p>
            <h1 className="p-title">Restaurant Owners</h1>
          </div>
          <div className="p-chip">{owners.length} owners</div>
        </header>

        <div className="p-toolbar">
          <div className="p-search">
            <svg className="p-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="p-search-clear" onClick={() => setSearch('')}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
          {search && <span className="p-result-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>}
        </div>

        <div className="p-table-card">
          <div className="p-table-scroll">
            <table className="p-table">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Owner Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Verified</th>
                  <th>Restaurants</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="p-empty">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
                          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                        </svg>
                        <p>{search ? 'No owners match your search' : 'No restaurant owners registered'}</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(o => (
                  <tr key={o.id}>
                    <td className="td-muted">#{o.id}</td>
                    <td>
                      <div className="p-user-cell">
                        <div className="p-avatar p-avatar-blue">{o.name?.[0]?.toUpperCase() || '?'}</div>
                        <span className="td-bold">{o.name}</span>
                      </div>
                    </td>
                    <td className="td-muted">{o.email}</td>
                    <td className="td-muted">{o.phone || <span className="td-nil">—</span>}</td>
                    <td>
                      {o.isVerified
                        ? <span className="p-verified">✓ Verified</span>
                        : <span className="p-unverified">✗ Unverified</span>
                      }
                    </td>
                    <td className="td-muted">
                      {o.restaurants?.length ?? 0} restaurant{(o.restaurants?.length ?? 0) !== 1 ? 's' : ''}
                    </td>
                    <td className="td-muted">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <button
                        className="p-del-btn"
                        onClick={() => handleDelete(o.id)}
                        disabled={deleting === o.id}
                      >
                        {deleting === o.id ? <span className="p-btn-spinner" /> : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        )}
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');

  .p-root { min-height:100vh; background:#0a0a0f; padding:40px 44px; font-family:'DM Sans',sans-serif; color:#e2e8f0; }
  .p-loading { min-height:100vh; background:#0a0a0f; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; color:#64748b; font-family:'DM Sans',sans-serif; font-size:14px; }
  .p-spinner { width:36px; height:36px; border:2px solid #1e293b; border-top-color:#f43f5e; border-radius:50%; animation:spin 0.8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }

  .p-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:32px; }
  .p-eyebrow { font-size:11px; font-weight:500; letter-spacing:0.18em; text-transform:uppercase; color:#f43f5e; margin:0 0 8px; }
  .p-title { font-family:'Syne',sans-serif; font-size:32px; font-weight:800; color:#f1f5f9; margin:0; letter-spacing:-0.02em; }
  .p-chip { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#334155; background:#111118; border:1px solid #1e2030; padding:6px 14px; border-radius:99px; }

  .p-toolbar { display:flex; align-items:center; gap:14px; margin-bottom:20px; }
  .p-search { position:relative; display:flex; align-items:center; max-width:380px; width:100%; }
  .p-search-icon { position:absolute; left:14px; color:#334155; pointer-events:none; }
  .p-search input { width:100%; background:#111118; border:1px solid #1e2030; border-radius:10px; padding:10px 40px; font-size:13px; color:#e2e8f0; font-family:'DM Sans',sans-serif; outline:none; transition:border-color 0.2s; }
  .p-search input::placeholder { color:#334155; }
  .p-search input:focus { border-color:#f43f5e; }
  .p-search-clear { position:absolute; right:12px; background:#1e2030; border:none; cursor:pointer; color:#64748b; padding:4px; border-radius:4px; display:flex; align-items:center; transition:color 0.15s; }
  .p-search-clear:hover { color:#f43f5e; }
  .p-result-count { font-size:12px; color:#475569; }

  .p-table-card { background:#111118; border:1px solid #1e2030; border-radius:20px; overflow:hidden; }
  .p-table-scroll { overflow-x:auto; }
  .p-table { width:100%; border-collapse:collapse; font-size:13px; }
  .p-table thead tr { border-bottom:1px solid #1a1d2e; }
  .p-table th { padding:13px 20px; text-align:left; font-size:11px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:#334155; }
  .p-table tbody tr { border-bottom:1px solid #12141e; transition:background 0.15s; }
  .p-table tbody tr:last-child { border-bottom:none; }
  .p-table tbody tr:hover { background:#13151f; }
  .p-table td { padding:13px 20px; }
  .td-muted { color:#64748b; }
  .td-bold { color:#e2e8f0; font-weight:500; }
  .td-nil { color:#2d3348; }

  .p-user-cell { display:flex; align-items:center; gap:10px; }
  .p-avatar { width:32px; height:32px; border-radius:50%; background:rgba(244,63,94,0.15); color:#f43f5e; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .p-avatar-blue { background:rgba(59,130,246,0.15); color:#3b82f6; }

  .p-verified   { font-size:11px; font-weight:600; color:#10b981; background:rgba(16,185,129,0.1); padding:3px 10px; border-radius:99px; border:1px solid rgba(16,185,129,0.2); }
  .p-unverified { font-size:11px; font-weight:600; color:#64748b; background:rgba(100,116,139,0.1); padding:3px 10px; border-radius:99px; border:1px solid rgba(100,116,139,0.2); }

  .p-del-btn { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.2); color:#f43f5e; border-radius:8px; font-size:12px; font-weight:500; cursor:pointer; transition:background 0.15s; font-family:'DM Sans',sans-serif; }
  .p-del-btn:hover:not(:disabled) { background:rgba(244,63,94,0.15); }
  .p-del-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .p-btn-spinner { width:12px; height:12px; border:2px solid rgba(244,63,94,0.3); border-top-color:#f43f5e; border-radius:50%; animation:spin 0.7s linear infinite; }

  .p-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 24px; gap:12px; color:#334155; }
  .p-empty p { font-size:13px; margin:0; }

  @media (max-width:768px) { .p-root { padding:24px 16px; } .p-header { flex-direction:column; align-items:flex-start; gap:8px; } }
`
