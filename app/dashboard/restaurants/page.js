'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState('all') // all | pending | approved
  const [actionId, setActionId]       = useState(null)

  useEffect(() => { fetchRestaurants() }, [])

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/admin/restaurants')
      setRestaurants(res.data.restaurants || [])
    } catch (err) {
      console.error('Fetch restaurants error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    setActionId(id)
    try {
      await api.put(`/admin/restaurants/${id}/approve`)
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r))
    } catch { alert('Failed to approve.') }
    finally { setActionId(null) }
  }

  const handleReject = async (id) => {
    if (!confirm('Reject this restaurant? The owner will be notified.')) return
    setActionId(id)
    try {
      await api.put(`/admin/restaurants/${id}/reject`)
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, isApproved: false, isRejected: true } : r))
    } catch { alert('Failed to reject.') }
    finally { setActionId(null) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this restaurant?')) return
    setActionId(id)
    try {
      await api.delete(`/admin/restaurants/${id}`)
      setRestaurants(prev => prev.filter(r => r.id !== id))
    } catch { alert('Failed to delete.') }
    finally { setActionId(null) }
  }

  const filtered = restaurants.filter(r => {
    const matchSearch =
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine?.toLowerCase().includes(search.toLowerCase()) ||
      r.owner?.name?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all'     ? true :
      filter === 'pending' ? !r.isApproved :
      filter === 'approved'? r.isApproved : true
    return matchSearch && matchFilter
  })

  const pendingCount  = restaurants.filter(r => !r.isApproved).length
  const approvedCount = restaurants.filter(r => r.isApproved).length

  if (loading) return (
    <>
      <style>{styles}</style>
      <div className="p-loading"><div className="p-spinner" /><span>Loading restaurants...</span></div>
    </>
  )

  return (
    <>
      <style>{styles}</style>
      <div className="p-root">
        <header className="p-header">
          <div>
            <p className="p-eyebrow">Management</p>
            <h1 className="p-title">Restaurants</h1>
          </div>
          <div className="p-chip">{restaurants.length} total</div>
        </header>

        {/* Quick stats */}
        <div className="r-quick-stats">
          <div className="r-qs-item">
            <span className="r-qs-val r-qs-green">{approvedCount}</span>
            <span className="r-qs-label">Approved</span>
          </div>
          <div className="r-qs-divider" />
          <div className="r-qs-item">
            <span className="r-qs-val r-qs-amber">{pendingCount}</span>
            <span className="r-qs-label">Pending</span>
          </div>
          <div className="r-qs-divider" />
          <div className="r-qs-item">
            <span className="r-qs-val r-qs-muted">{restaurants.length}</span>
            <span className="r-qs-label">Total</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-toolbar">
          <div className="p-search">
            <svg className="p-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search name, cuisine or owner..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="p-search-clear" onClick={() => setSearch('')}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
          <div className="r-filter-tabs">
            {['all','pending','approved'].map(f => (
              <button
                key={f}
                className={`r-filter-tab ${filter === f ? 'r-filter-active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'pending' && pendingCount > 0 && (
                  <span className="r-filter-dot">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-table-card">
          <div className="p-table-scroll">
            <table className="p-table">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Restaurant</th>
                  <th>Owner</th>
                  <th>Cuisine</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="p-empty">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
                          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                        </svg>
                        <p>No restaurants found</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(r => (
                  <tr key={r.id}>
                    <td className="td-muted">#{r.id}</td>
                    <td>
                      <div className="r-name-cell">
                        <div className="r-avatar">{r.name?.[0]?.toUpperCase() || 'R'}</div>
                        <div>
                          <div className="td-bold">{r.name}</div>
                          <div className="r-location">{r.location || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="td-muted">{r.owner?.name || '—'}</td>
                    <td className="td-muted">{r.cuisine || '—'}</td>
                    <td className="td-muted" style={{fontSize:'12px'}}>
                      {r.openingTime && r.closingTime ? `${r.openingTime} – ${r.closingTime}` : '—'}
                    </td>
                    <td>
                      {r.isApproved
                        ? <span className="r-badge-approved">✓ Approved</span>
                        : <span className="r-badge-pending">⏳ Pending</span>
                      }
                    </td>
                    <td>
                      <div className="r-actions">
                        {!r.isApproved && (
                          <button
                            className="r-btn r-btn-approve"
                            onClick={() => handleApprove(r.id)}
                            disabled={actionId === r.id}
                          >
                            {actionId === r.id ? <span className="p-btn-spinner" /> : null}
                            Approve
                          </button>
                        )}
                        {!r.isApproved && (
                          <button
                            className="r-btn r-btn-reject"
                            onClick={() => handleReject(r.id)}
                            disabled={actionId === r.id}
                          >
                            Reject
                          </button>
                        )}
                        <button
                          className="r-btn r-btn-delete"
                          onClick={() => handleDelete(r.id)}
                          disabled={actionId === r.id}
                        >
                          Delete
                        </button>
                      </div>
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
  .p-loading { min-height:100vh; background:#0a0a0f; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; color:#64748b; font-size:14px; font-family:'DM Sans',sans-serif; }
  .p-spinner { width:36px; height:36px; border:2px solid #1e293b; border-top-color:#f43f5e; border-radius:50%; animation:spin 0.8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }

  .p-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:24px; }
  .p-eyebrow { font-size:11px; font-weight:500; letter-spacing:0.18em; text-transform:uppercase; color:#f43f5e; margin:0 0 8px; }
  .p-title { font-family:'Syne',sans-serif; font-size:32px; font-weight:800; color:#f1f5f9; margin:0; letter-spacing:-0.02em; }
  .p-chip { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#334155; background:#111118; border:1px solid #1e2030; padding:6px 14px; border-radius:99px; }

  .r-quick-stats { display:flex; align-items:center; gap:0; background:#111118; border:1px solid #1e2030; border-radius:14px; padding:16px 24px; margin-bottom:24px; width:fit-content; }
  .r-qs-item { display:flex; flex-direction:column; gap:4px; padding:0 20px; }
  .r-qs-item:first-child { padding-left:0; }
  .r-qs-val { font-family:'Syne',sans-serif; font-size:24px; font-weight:800; }
  .r-qs-green { color:#10b981; }
  .r-qs-amber { color:#f59e0b; }
  .r-qs-muted { color:#64748b; }
  .r-qs-label { font-size:11px; color:#475569; text-transform:uppercase; letter-spacing:0.08em; }
  .r-qs-divider { width:1px; height:40px; background:#1e2030; }

  .p-toolbar { display:flex; align-items:center; gap:14px; margin-bottom:20px; flex-wrap:wrap; }
  .p-search { position:relative; display:flex; align-items:center; max-width:340px; width:100%; }
  .p-search-icon { position:absolute; left:14px; color:#334155; pointer-events:none; }
  .p-search input { width:100%; background:#111118; border:1px solid #1e2030; border-radius:10px; padding:10px 40px; font-size:13px; color:#e2e8f0; font-family:'DM Sans',sans-serif; outline:none; transition:border-color 0.2s; }
  .p-search input::placeholder { color:#334155; }
  .p-search input:focus { border-color:#f43f5e; }
  .p-search-clear { position:absolute; right:12px; background:#1e2030; border:none; cursor:pointer; color:#64748b; padding:4px; border-radius:4px; display:flex; align-items:center; }
  .p-search-clear:hover { color:#f43f5e; }

  .r-filter-tabs { display:flex; gap:4px; background:#111118; border:1px solid #1e2030; padding:4px; border-radius:10px; }
  .r-filter-tab { padding:6px 14px; border-radius:7px; border:none; background:none; font-size:12px; font-weight:500; color:#475569; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; display:flex; align-items:center; gap:6px; }
  .r-filter-tab:hover { color:#94a3b8; }
  .r-filter-active { background:#1e2030; color:#f1f5f9; }
  .r-filter-dot { background:#f59e0b; color:#000; font-size:10px; font-weight:700; padding:1px 6px; border-radius:99px; }

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

  .r-name-cell { display:flex; align-items:center; gap:10px; }
  .r-avatar { width:34px; height:34px; border-radius:10px; background:rgba(244,63,94,0.15); color:#f43f5e; font-size:14px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .r-location { font-size:11px; color:#475569; margin-top:2px; }

  .r-badge-approved { font-size:11px; font-weight:600; color:#10b981; background:rgba(16,185,129,0.1); padding:3px 10px; border-radius:99px; border:1px solid rgba(16,185,129,0.2); white-space:nowrap; }
  .r-badge-pending  { font-size:11px; font-weight:600; color:#f59e0b; background:rgba(245,158,11,0.1); padding:3px 10px; border-radius:99px; border:1px solid rgba(245,158,11,0.2); white-space:nowrap; }

  .r-actions { display:flex; gap:6px; align-items:center; }
  .r-btn { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:7px; font-size:12px; font-weight:500; cursor:pointer; border:1px solid transparent; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
  .r-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .r-btn-approve { background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.2); color:#10b981; }
  .r-btn-approve:hover:not(:disabled) { background:rgba(16,185,129,0.2); }
  .r-btn-reject  { background:rgba(245,158,11,0.1); border-color:rgba(245,158,11,0.2); color:#f59e0b; }
  .r-btn-reject:hover:not(:disabled)  { background:rgba(245,158,11,0.2); }
  .r-btn-delete  { background:rgba(244,63,94,0.08); border-color:rgba(244,63,94,0.2); color:#f43f5e; }
  .r-btn-delete:hover:not(:disabled)  { background:rgba(244,63,94,0.15); }

  .p-btn-spinner { width:11px; height:11px; border:2px solid rgba(255,255,255,0.2); border-top-color:currentColor; border-radius:50%; animation:spin 0.7s linear infinite; }

  .p-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 24px; gap:12px; color:#334155; }
  .p-empty p { font-size:13px; margin:0; }

  @media (max-width:768px) { .p-root { padding:24px 16px; } .p-header { flex-direction:column; align-items:flex-start; gap:8px; } }
`
