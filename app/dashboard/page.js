'use client'
import { useState, useEffect } from 'react'
import api from '../../services/api'
import StatsCard from '../../components/StatsCard'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalReservations: 0,
    pendingReservations: 0,
    pendingRestaurants: 0,
  })
  const [recentReservations, setRecentReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [usersRes, restaurantsRes, reservationsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/restaurants'),
        api.get('/reservations/all'),
      ])
      const users = usersRes.data.users
      const restaurants = restaurantsRes.data.restaurants
      const reservations = reservationsRes.data.reservations
      setStats({
        totalUsers: users.length,
        totalRestaurants: restaurants.length,
        totalReservations: reservations.length,
        pendingReservations: reservations.filter(r => r.status === 'pending').length,
        pendingRestaurants: restaurants.filter(r => !r.isApproved).length,
      })
      setRecentReservations(reservations.slice(0, 5))
    } catch (err) {
      console.error('Stats error:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = {
    pending:   { label: 'Pending',   cls: 'status-pending' },
    confirmed: { label: 'Confirmed', cls: 'status-confirmed' },
    rejected:  { label: 'Rejected',  cls: 'status-rejected' },
  }

  if (loading) {
    return (
      <>
        <style>{sharedStyles}</style>
        <div className="dash-loading">
          <div className="dash-spinner" />
          <span>Loading dashboard</span>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{sharedStyles}</style>
      <div className="dash-root">

        {/* Header */}
        <header className="dash-header">
          <div>
            <p className="dash-header-eyebrow">Admin Console</p>
            <h1 className="dash-header-title">Dashboard Overview</h1>
          </div>
          <div className="dash-header-date">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card stat-blue">
            <div className="stat-top">
              <span className="stat-label">Total Users</span>
              <span className="stat-icon-wrap stat-icon-blue">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </span>
            </div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{ width: '70%', background: '#3b82f6' }} /></div>
          </div>

          <div className="stat-card stat-rose">
            <div className="stat-top">
              <span className="stat-label">Restaurants</span>
              <span className="stat-icon-wrap stat-icon-rose">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                </svg>
              </span>
            </div>
            <div className="stat-value">{stats.totalRestaurants}</div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{ width: '55%', background: '#f43f5e' }} /></div>
          </div>

          <div className="stat-card stat-emerald">
            <div className="stat-top">
              <span className="stat-label">Reservations</span>
              <span className="stat-icon-wrap stat-icon-emerald">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </span>
            </div>
            <div className="stat-value">{stats.totalReservations}</div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{ width: '85%', background: '#10b981' }} /></div>
          </div>

          <div className="stat-card stat-amber">
            <div className="stat-top">
              <span className="stat-label">Pending Approvals</span>
              <span className="stat-icon-wrap stat-icon-amber">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </span>
            </div>
            <div className="stat-value">{stats.pendingRestaurants}</div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{ width: `${Math.min((stats.pendingRestaurants / Math.max(stats.totalRestaurants, 1)) * 100, 100)}%`, background: '#f59e0b' }} /></div>
          </div>
        </section>

        {/* Alert */}
        {stats.pendingRestaurants > 0 && (
          <div className="dash-alert">
            <div className="dash-alert-dot" />
            <div className="dash-alert-content">
              <p className="dash-alert-title">
                {stats.pendingRestaurants} restaurant{stats.pendingRestaurants > 1 ? 's' : ''} awaiting approval
              </p>
              <a href="/dashboard/restaurants" className="dash-alert-link">
                Review now
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        )}

        {/* Recent Reservations */}
        <section className="dash-table-section">
          <div className="dash-table-header">
            <h2 className="dash-table-title">Recent Reservations</h2>
            <span className="dash-table-count">{recentReservations.length} entries</span>
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
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
                {recentReservations.map((r) => {
                  const s = statusConfig[r.status] || { label: r.status, cls: '' }
                  return (
                    <tr key={r.id}>
                      <td className="cell-muted">#{r.id}</td>
                      <td className="cell-bold">{r.user.name}</td>
                      <td className="cell-muted">{r.restaurant.name}</td>
                      <td className="cell-muted">{r.date}</td>
                      <td className="cell-muted">{r.time}</td>
                      <td className="cell-muted">{r.guests}</td>
                      <td><span className={`status-badge ${s.cls}`}>{s.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </>
  )
}

const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .dash-root {
    min-height: 100vh;
    background: #0a0a0f;
    padding: 40px 44px;
    font-family: 'DM Sans', sans-serif;
    color: #e2e8f0;
  }

  /* --- Loading --- */
  .dash-loading {
    min-height: 100vh;
    background: #0a0a0f;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #64748b;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    letter-spacing: 0.05em;
  }
  .dash-spinner {
    width: 36px; height: 36px;
    border: 2px solid #1e293b;
    border-top-color: #f43f5e;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* --- Header --- */
  .dash-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 40px;
  }
  .dash-header-eyebrow {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #f43f5e;
    margin: 0 0 8px;
  }
  .dash-header-title {
    font-family: 'Syne', sans-serif;
    font-size: 32px;
    font-weight: 800;
    color: #f1f5f9;
    margin: 0;
    letter-spacing: -0.02em;
  }
  .dash-header-date {
    font-size: 12px;
    color: #475569;
    letter-spacing: 0.02em;
  }

  /* --- Stats Grid --- */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 600px)  { .stats-grid { grid-template-columns: 1fr; } }

  .stat-card {
    background: #111118;
    border: 1px solid #1e2030;
    border-radius: 16px;
    padding: 24px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s, transform 0.2s;
  }
  .stat-card:hover {
    transform: translateY(-2px);
    border-color: #2a2d3e;
  }

  .stat-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .stat-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #64748b;
  }
  .stat-icon-wrap {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .stat-icon-blue    { background: rgba(59,130,246,0.12); color: #3b82f6; }
  .stat-icon-rose    { background: rgba(244,63,94,0.12);  color: #f43f5e; }
  .stat-icon-emerald { background: rgba(16,185,129,0.12); color: #10b981; }
  .stat-icon-amber   { background: rgba(245,158,11,0.12); color: #f59e0b; }

  .stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 40px;
    font-weight: 800;
    color: #f1f5f9;
    line-height: 1;
    margin-bottom: 18px;
    letter-spacing: -0.03em;
  }

  .stat-bar {
    height: 3px;
    background: #1e2030;
    border-radius: 99px;
    overflow: hidden;
  }
  .stat-bar-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 1s cubic-bezier(.4,0,.2,1);
  }

  /* --- Alert --- */
  .dash-alert {
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(245,158,11,0.06);
    border: 1px solid rgba(245,158,11,0.2);
    border-radius: 14px;
    padding: 16px 20px;
    margin-bottom: 28px;
  }
  .dash-alert-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #f59e0b;
    flex-shrink: 0;
    box-shadow: 0 0 10px #f59e0b;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .dash-alert-title {
    font-size: 13px;
    font-weight: 500;
    color: #fbbf24;
    margin: 0 0 4px;
  }
  .dash-alert-link {
    font-size: 12px;
    color: #92400e;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    opacity: 0.8;
    transition: opacity 0.15s;
  }
  .dash-alert-link:hover { opacity: 1; }

  /* --- Table Section --- */
  .dash-table-section {
    background: #111118;
    border: 1px solid #1e2030;
    border-radius: 20px;
    overflow: hidden;
  }
  .dash-table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 28px 20px;
    border-bottom: 1px solid #1a1d2e;
  }
  .dash-table-title {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0;
    letter-spacing: -0.01em;
  }
  .dash-table-count {
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #334155;
    background: #0f1117;
    border: 1px solid #1e2030;
    padding: 4px 12px;
    border-radius: 99px;
  }
  .dash-table-wrap { overflow-x: auto; }
  .dash-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .dash-table thead tr {
    border-bottom: 1px solid #1a1d2e;
  }
  .dash-table th {
    padding: 12px 20px;
    text-align: left;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #334155;
  }
  .dash-table tbody tr {
    border-bottom: 1px solid #12141e;
    transition: background 0.15s;
  }
  .dash-table tbody tr:last-child { border-bottom: none; }
  .dash-table tbody tr:hover { background: #13151f; }
  .dash-table td { padding: 14px 20px; }
  .cell-muted { color: #64748b; }
  .cell-bold  { color: #e2e8f0; font-weight: 500; }

  /* --- Status Badges --- */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .status-badge::before {
    content: '';
    width: 5px; height: 5px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
  .status-pending   { background: rgba(245,158,11,0.1);  color: #f59e0b; border: 1px solid rgba(245,158,11,0.2);  }
  .status-confirmed { background: rgba(16,185,129,0.1);  color: #10b981; border: 1px solid rgba(16,185,129,0.2);  }
  .status-rejected  { background: rgba(244,63,94,0.1);   color: #f43f5e; border: 1px solid rgba(244,63,94,0.2);   }
`
hhhhhhhh
