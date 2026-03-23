'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState('all')

  useEffect(() => { fetchReservations() }, [])

  const fetchReservations = async () => {
    try {
      const res = await api.get('/reservations/all')
      setReservations(res.data.reservations)
    } catch (err) {
      console.error('Fetch reservations error:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = {
    pending:   { cls: 'status-pending',   label: 'Pending'   },
    confirmed: { cls: 'status-confirmed', label: 'Confirmed' },
    rejected:  { cls: 'status-rejected',  label: 'Rejected'  },
  }

  const counts = {
    all:       reservations.length,
    pending:   reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    rejected:  reservations.filter(r => r.status === 'rejected').length,
  }

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter)

  if (loading) return (
    <>
      <style>{pageStyles}</style>
      <div className="page-loading">
        <div className="page-spinner" />
        <span>Loading reservations</span>
      </div>
    </>
  )

  return (
    <>
      <style>{pageStyles}</style>
      <div className="page-root">

        {/* Header */}
        <header className="page-header">
          <div>
            <p className="page-eyebrow">Overview</p>
            <h1 className="page-title">All Reservations</h1>
          </div>
          <div className="page-meta-chip">{reservations.length} total</div>
        </header>

        {/* Summary Cards */}
        <div className="summary-row">
          <div className="summary-card">
            <span className="summary-label">Pending</span>
            <span className="summary-value summary-amber">{counts.pending}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Confirmed</span>
            <span className="summary-value summary-green">{counts.confirmed}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Rejected</span>
            <span className="summary-value summary-rose">{counts.rejected}</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {['all', 'pending', 'confirmed', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`filter-tab ${filter === f ? 'filter-tab-active' : ''}`}>
              <span className="filter-tab-label">{f}</span>
              <span className="filter-tab-count">{counts[f]}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="table-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Guests</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                        <p>No reservations found.</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(r => {
                  const s = statusConfig[r.status] || { cls: '', label: r.status }
                  return (
                    <tr key={r.id}>
                      <td className="cell-muted">#{r.id}</td>
                      <td>
                        <p className="cell-bold">{r.user.name}</p>
                        <p className="cell-sub">{r.user.email}</p>
                      </td>
                      <td>
                        <p className="cell-bold">{r.restaurant.name}</p>
                        <p className="cell-sub">{r.restaurant.location}</p>
                      </td>
                      <td className="cell-muted">{r.date}</td>
                      <td className="cell-muted">{r.time}</td>
                      <td className="cell-muted">{r.guests}</td>
                      <td>
                        <span className={`status-badge ${s.cls}`}>{s.label}</span>
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

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .page-root {
    min-height: 100vh; background: #0a0a0f;
    padding: 40px 44px;
    font-family: 'DM Sans', sans-serif; color: #e2e8f0;
  }
  .page-loading {
    min-height: 100vh; background: #0a0a0f;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; color: #64748b;
    font-family: 'DM Sans', sans-serif; font-size: 14px; letter-spacing: 0.05em;
  }
  .page-spinner {
    width: 36px; height: 36px; border: 2px solid #1e293b;
    border-top-color: #f43f5e; border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Header */
  .page-header {
    display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px;
  }
  .page-eyebrow {
    font-size: 11px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase;
    color: #f43f5e; margin: 0 0 8px; font-family: 'DM Sans', sans-serif;
  }
  .page-title {
    font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800;
    color: #f1f5f9; margin: 0; letter-spacing: -0.02em;
  }
  .page-meta-chip {
    font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
    color: #334155; background: #111118;
    border: 1px solid #1e2030; padding: 6px 14px; border-radius: 99px;
  }

  /* Summary Row */
  .summary-row {
    display: flex; gap: 12px; margin-bottom: 24px;
  }
  .summary-card {
    display: flex; flex-direction: column; gap: 6px;
    background: #111118; border: 1px solid #1e2030; border-radius: 12px;
    padding: 16px 24px; min-width: 120px;
  }
  .summary-label {
    font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #475569;
  }
  .summary-value {
    font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; line-height: 1; letter-spacing: -0.02em;
  }
  .summary-amber { color: #f59e0b; }
  .summary-green { color: #10b981; }
  .summary-rose  { color: #f43f5e; }

  /* Filter Tabs */
  .filter-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
  .filter-tab {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 10px;
    font-size: 12px; font-weight: 500;
    background: #111118; border: 1px solid #1e2030;
    color: #64748b; cursor: pointer;
    text-transform: capitalize; transition: all 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .filter-tab:hover { border-color: #2d3348; color: #94a3b8; }
  .filter-tab-active { background: #f43f5e; border-color: #f43f5e; color: #fff; }
  .filter-tab-active:hover { background: #e11d48; border-color: #e11d48; }
  .filter-tab-count {
    background: rgba(255,255,255,0.12); padding: 1px 7px; border-radius: 99px; font-size: 11px;
  }
  .filter-tab:not(.filter-tab-active) .filter-tab-count { background: #1a1d2e; color: #475569; }

  /* Table */
  .table-card { background: #111118; border: 1px solid #1e2030; border-radius: 20px; overflow: hidden; }
  .table-wrap { overflow-x: auto; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .data-table thead tr { border-bottom: 1px solid #1a1d2e; }
  .data-table th {
    padding: 14px 20px; text-align: left;
    font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #334155;
  }
  .data-table tbody tr { border-bottom: 1px solid #12141e; transition: background 0.15s; }
  .data-table tbody tr:last-child { border-bottom: none; }
  .data-table tbody tr:hover { background: #13151f; }
  .data-table td { padding: 14px 20px; }

  .cell-muted { color: #64748b; }
  .cell-bold  { color: #e2e8f0; font-weight: 500; margin: 0 0 2px; }
  .cell-sub   { color: #334155; font-size: 11px; margin: 0; }

  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 60px 24px; gap: 12px; color: #334155;
  }
  .empty-state p { font-size: 13px; margin: 0; }

  /* Status Badges */
  .status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 11px; border-radius: 99px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .status-badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
  .status-pending   { background: rgba(245,158,11,0.1);  color: #f59e0b; border: 1px solid rgba(245,158,11,0.2);  }
  .status-confirmed { background: rgba(16,185,129,0.1);  color: #10b981; border: 1px solid rgba(16,185,129,0.2);  }
  .status-rejected  { background: rgba(244,63,94,0.1);   color: #f43f5e; border: 1px solid rgba(244,63,94,0.2);   }
`