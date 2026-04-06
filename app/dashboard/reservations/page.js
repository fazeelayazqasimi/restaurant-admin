'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'

const STATUS_MAP = {
  pending:   { label: 'Pending',   cls: 'sb-pending'   },
  confirmed: { label: 'Confirmed', cls: 'sb-confirmed' },
  cancelled: { label: 'Cancelled', cls: 'sb-cancelled' },
  completed: { label: 'Completed', cls: 'sb-completed' },
  no_show:   { label: 'No Show',   cls: 'sb-noshow'    },
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filter, setFilter]             = useState('all')
  const [updating, setUpdating]         = useState(null)

  useEffect(() => { fetchReservations() }, [])

  const fetchReservations = async () => {
    try {
      const res = await api.get('/admin/reservations')
      setReservations(res.data.reservations || [])
    } catch (err) {
      console.error('Fetch reservations error:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, status) => {
    setUpdating(id)
    try {
      await api.put(`/reservations/${id}/status`, { status })
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } catch { alert('Failed to update status.') }
    finally { setUpdating(null) }
  }

  const filtered = reservations.filter(r => {
    // FIX: walk-in safe access
    const customer = r.user?.name || r.customerName || 'Walk-in'
    const restaurant = r.restaurant?.name || ''
    const matchSearch =
      customer.toLowerCase().includes(search.toLowerCase()) ||
      restaurant.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ? true : r.status === filter
    return matchSearch && matchFilter
  })

  if (loading) return (
    <>
      <style>{styles}</style>
      <div className="p-loading"><div className="p-spinner" /><span>Loading reservations...</span></div>
    </>
  )

  return (
    <>
      <style>{styles}</style>
      <div className="p-root">
        <header className="p-header">
          <div>
            <p className="p-eyebrow">Management</p>
            <h1 className="p-title">All Reservations</h1>
          </div>
          <div className="p-chip">{reservations.length} total</div>
        </header>

        {/* Toolbar */}
        <div className="p-toolbar">
          <div className="p-search">
            <svg className="p-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search customer or restaurant..."
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
            {['all','pending','confirmed','cancelled','completed','no_show'].map(f => (
              <button
                key={f}
                className={`r-filter-tab ${filter === f ? 'r-filter-active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'no_show' ? 'No Show' : f.charAt(0).toUpperCase() + f.slice(1)}
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
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Guests</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="p-empty">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        <p>No reservations found</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(r => {
                  const s = STATUS_MAP[r.status] || { label: r.status, cls: '' }
                  // FIX: safe access for walk-in
                  const customerName = r.user?.name || r.customerName || 'Walk-in'
                  const restaurantName = r.restaurant?.name || '—'
                  return (
                    <tr key={r.id}>
                      <td className="td-muted">#{r.id}</td>
                      <td className="td-bold">{customerName}</td>
                      <td className="td-muted">{restaurantName}</td>
                      <td className="td-muted">{r.date}</td>
                      <td className="td-muted">{r.time}</td>
                      <td className="td-muted">{r.guests}</td>
                      <td>
                        {r.isWalkIn
                          ? <span className="res-walkin">Walk-in</span>
                          : <span className="res-online">Online</span>
                        }
                      </td>
                      <td><span className={`d-badge ${s.cls}`}>{s.label}</span></td>
                      <td>
                        <div className="res-actions">
                          {r.status === 'pending' && (
                            <>
                              <button className="r-btn r-btn-approve" onClick={() => updateStatus(r.id, 'confirmed')} disabled={updating===r.id}>Confirm</button>
                              <button className="r-btn r-btn-reject"  onClick={() => updateStatus(r.id, 'cancelled')} disabled={updating===r.id}>Cancel</button>
                            </>
                          )}
                          {r.status === 'confirmed' && (
                            <>
                              <button className="r-btn r-btn-complete" onClick={() => updateStatus(r.id, 'completed')} disabled={updating===r.id}>Complete</button>
                              <button className="r-btn r-btn-noshow"   onClick={() => updateStatus(r.id, 'no_show')}   disabled={updating===r.id}>No Show</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
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

  .p-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:28px; }
  .p-eyebrow { font-size:11px; font-weight:500; letter-spacing:0.18em; text-transform:uppercase; color:#f43f5e; margin:0 0 8px; }
  .p-title { font-family:'Syne',sans-serif; font-size:32px; font-weight:800; color:#f1f5f9; margin:0; letter-spacing:-0.02em; }
  .p-chip { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#334155; background:#111118; border:1px solid #1e2030; padding:6px 14px; border-radius:99px; }

  .p-toolbar { display:flex; align-items:center; gap:14px; margin-bottom:20px; flex-wrap:wrap; }
  .p-search { position:relative; display:flex; align-items:center; max-width:320px; width:100%; }
  .p-search-icon { position:absolute; left:14px; color:#334155; pointer-events:none; }
  .p-search input { width:100%; background:#111118; border:1px solid #1e2030; border-radius:10px; padding:10px 40px; font-size:13px; color:#e2e8f0; font-family:'DM Sans',sans-serif; outline:none; transition:border-color 0.2s; }
  .p-search input::placeholder { color:#334155; }
  .p-search input:focus { border-color:#f43f5e; }
  .p-search-clear { position:absolute; right:12px; background:#1e2030; border:none; cursor:pointer; color:#64748b; padding:4px; border-radius:4px; display:flex; align-items:center; }
  .p-search-clear:hover { color:#f43f5e; }

  .r-filter-tabs { display:flex; gap:4px; background:#111118; border:1px solid #1e2030; padding:4px; border-radius:10px; flex-wrap:wrap; }
  .r-filter-tab { padding:5px 12px; border-radius:7px; border:none; background:none; font-size:12px; font-weight:500; color:#475569; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
  .r-filter-tab:hover { color:#94a3b8; }
  .r-filter-active { background:#1e2030; color:#f1f5f9; }

  .p-table-card { background:#111118; border:1px solid #1e2030; border-radius:20px; overflow:hidden; }
  .p-table-scroll { overflow-x:auto; }
  .p-table { width:100%; border-collapse:collapse; font-size:13px; }
  .p-table thead tr { border-bottom:1px solid #1a1d2e; }
  .p-table th { padding:13px 16px; text-align:left; font-size:11px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:#334155; white-space:nowrap; }
  .p-table tbody tr { border-bottom:1px solid #12141e; transition:background 0.15s; }
  .p-table tbody tr:last-child { border-bottom:none; }
  .p-table tbody tr:hover { background:#13151f; }
  .p-table td { padding:12px 16px; white-space:nowrap; }
  .td-muted { color:#64748b; }
  .td-bold { color:#e2e8f0; font-weight:500; }

  .res-walkin { font-size:11px; font-weight:600; color:#a855f7; background:rgba(168,85,247,0.1); padding:3px 10px; border-radius:99px; border:1px solid rgba(168,85,247,0.2); }
  .res-online { font-size:11px; font-weight:600; color:#3b82f6; background:rgba(59,130,246,0.1); padding:3px 10px; border-radius:99px; border:1px solid rgba(59,130,246,0.2); }

  .d-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 11px; border-radius:99px; font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; }
  .d-badge::before { content:''; width:5px; height:5px; border-radius:50%; background:currentColor; }
  .sb-pending   { background:rgba(245,158,11,0.1);  color:#f59e0b; border:1px solid rgba(245,158,11,0.2); }
  .sb-confirmed { background:rgba(16,185,129,0.1);  color:#10b981; border:1px solid rgba(16,185,129,0.2); }
  .sb-cancelled { background:rgba(244,63,94,0.1);   color:#f43f5e; border:1px solid rgba(244,63,94,0.2); }
  .sb-completed { background:rgba(59,130,246,0.1);  color:#3b82f6; border:1px solid rgba(59,130,246,0.2); }
  .sb-noshow    { background:rgba(100,116,139,0.1); color:#64748b; border:1px solid rgba(100,116,139,0.2); }

  .res-actions { display:flex; gap:5px; }
  .r-btn { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:7px; font-size:11px; font-weight:500; cursor:pointer; border:1px solid transparent; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
  .r-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .r-btn-approve  { background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.2); color:#10b981; }
  .r-btn-approve:hover:not(:disabled) { background:rgba(16,185,129,0.2); }
  .r-btn-reject   { background:rgba(244,63,94,0.08); border-color:rgba(244,63,94,0.2); color:#f43f5e; }
  .r-btn-reject:hover:not(:disabled)  { background:rgba(244,63,94,0.15); }
  .r-btn-complete { background:rgba(59,130,246,0.1); border-color:rgba(59,130,246,0.2); color:#3b82f6; }
  .r-btn-complete:hover:not(:disabled){ background:rgba(59,130,246,0.2); }
  .r-btn-noshow   { background:rgba(100,116,139,0.1); border-color:rgba(100,116,139,0.2); color:#64748b; }
  .r-btn-noshow:hover:not(:disabled)  { background:rgba(100,116,139,0.2); }

  .p-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 24px; gap:12px; color:#334155; }
  .p-empty p { font-size:13px; margin:0; }

  @media (max-width:768px) { .p-root { padding:24px 16px; } .p-header { flex-direction:column; align-items:flex-start; gap:8px; } }
`
