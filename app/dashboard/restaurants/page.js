'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('all')
  const [showForm, setShowForm]       = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')

  const [form, setForm] = useState({
    name: '', description: '', location: '',
    openingTime: '', closingTime: '',
    ownerName: '', ownerEmail: '', ownerPassword: '', ownerPhone: ''
  })

  useEffect(() => { fetchRestaurants() }, [])

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/admin/restaurants')
      setRestaurants(res.data.restaurants)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await api.put(`/restaurants/${id}/approve`)
      fetchRestaurants()
    } catch { alert('Failed to approve.') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) return
    try {
      await api.delete(`/admin/restaurants/${id}`)
      fetchRestaurants()
    } catch { alert('Failed to delete.') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setFormLoading(true)
    try {
      await api.post('/admin/restaurants', form)
      setSuccess('Restaurant created successfully.')
      setForm({ name: '', description: '', location: '', openingTime: '', closingTime: '', ownerName: '', ownerEmail: '', ownerPassword: '', ownerPhone: '' })
      setShowForm(false)
      fetchRestaurants()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create.')
    } finally {
      setFormLoading(false)
    }
  }

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const filtered = restaurants.filter(r => {
    if (filter === 'approved') return r.isApproved
    if (filter === 'pending')  return !r.isApproved
    return true
  })

  const counts = {
    all:      restaurants.length,
    approved: restaurants.filter(r => r.isApproved).length,
    pending:  restaurants.filter(r => !r.isApproved).length,
  }

  if (loading) return (
    <>
      <style>{pageStyles}</style>
      <div className="page-loading">
        <div className="page-spinner" />
        <span>Loading restaurants</span>
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
            <p className="page-eyebrow">Management</p>
            <h1 className="page-title">Restaurants</h1>
          </div>
          <button
            className={`btn-primary ${showForm ? 'btn-cancel' : ''}`}
            onClick={() => { setShowForm(!showForm); setError(''); setSuccess('') }}
          >
            {showForm ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                Cancel
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Add Restaurant
              </>
            )}
          </button>
        </header>

        {/* Flash messages */}
        {success && (
          <div className="flash flash-success">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            {success}
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="form-card">
            <div className="form-card-header">
              <h2 className="form-card-title">New Restaurant</h2>
              <p className="form-card-sub">Fill in the details to create a new restaurant and owner account.</p>
            </div>

            {error && (
              <div className="flash flash-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Section: Restaurant Info */}
              <div className="form-section-label">Restaurant Info</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Restaurant Name <span className="req">*</span></label>
                  <input required type="text" className="form-input" placeholder="e.g. The Grand Table"
                    value={form.name} onChange={e => setField('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location <span className="req">*</span></label>
                  <input required type="text" className="form-input" placeholder="e.g. Karachi, Pakistan"
                    value={form.location} onChange={e => setField('location', e.target.value)} />
                </div>
                <div className="form-group form-span-2">
                  <label className="form-label">Description</label>
                  <textarea className="form-input form-textarea" rows={3} placeholder="Brief description of the restaurant..."
                    value={form.description} onChange={e => setField('description', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Opening Time <span className="req">*</span></label>
                  <input required type="time" className="form-input"
                    value={form.openingTime} onChange={e => setField('openingTime', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Closing Time <span className="req">*</span></label>
                  <input required type="time" className="form-input"
                    value={form.closingTime} onChange={e => setField('closingTime', e.target.value)} />
                </div>
              </div>

              {/* Section: Owner Account */}
              <div className="form-section-label" style={{ marginTop: '28px' }}>Owner Account</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Owner Name</label>
                  <input type="text" className="form-input" placeholder="Full name"
                    value={form.ownerName} onChange={e => setField('ownerName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Owner Phone</label>
                  <input type="text" className="form-input" placeholder="03001234567"
                    value={form.ownerPhone} onChange={e => setField('ownerPhone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Owner Email <span className="req">*</span></label>
                  <input required type="email" className="form-input" placeholder="owner@restaurant.com"
                    value={form.ownerEmail} onChange={e => setField('ownerEmail', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password <span className="req">*</span></label>
                  <input required type="password" className="form-input" placeholder="••••••••"
                    value={form.ownerPassword} onChange={e => setField('ownerPassword', e.target.value)} />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={formLoading} className="btn-primary">
                  {formLoading ? (
                    <><div className="btn-spinner" /> Creating...</>
                  ) : 'Create Restaurant'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {['all', 'approved', 'pending'].map(f => (
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
                  <th>Restaurant</th>
                  <th>Location</th>
                  <th>Owner</th>
                  <th>Hours</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
                          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                        </svg>
                        <p>No restaurants found.</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(r => (
                  <tr key={r.id}>
                    <td className="cell-muted">#{r.id}</td>
                    <td>
                      <p className="cell-bold">{r.name}</p>
                      {r.description && (
                        <p className="cell-sub">{r.description.slice(0, 42)}{r.description.length > 42 ? '...' : ''}</p>
                      )}
                    </td>
                    <td className="cell-muted">{r.location}</td>
                    <td>
                      <p className="cell-bold">{r.owner?.name}</p>
                      <p className="cell-sub">{r.owner?.email}</p>
                    </td>
                    <td className="cell-muted">{r.openingTime} — {r.closingTime}</td>
                    <td className="cell-muted">{r._count?.reservations || 0}</td>
                    <td>
                      {r.isApproved ? (
                        <span className="status-badge status-confirmed">Approved</span>
                      ) : (
                        <span className="status-badge status-pending">Pending</span>
                      )}
                    </td>
                    <td>
                      <div className="action-row">
                        {!r.isApproved && (
                          <button className="btn-approve" onClick={() => handleApprove(r.id)}>Approve</button>
                        )}
                        <button className="btn-delete" onClick={() => handleDelete(r.id)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
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
    display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 36px;
  }
  .page-eyebrow {
    font-size: 11px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase;
    color: #f43f5e; margin: 0 0 8px;
  }
  .page-title {
    font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800;
    color: #f1f5f9; margin: 0; letter-spacing: -0.02em;
  }

  /* Buttons */
  .btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 22px;
    background: #f43f5e; color: #fff;
    border: none; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: background 0.15s, transform 0.1s;
  }
  .btn-primary:hover { background: #e11d48; }
  .btn-primary:active { transform: scale(0.98); }
  .btn-primary:disabled { background: #4b1b26; color: #7f1d1d; cursor: not-allowed; }
  .btn-cancel { background: #1e2030; color: #94a3b8; }
  .btn-cancel:hover { background: #252838; }

  .btn-ghost {
    display: inline-flex; align-items: center;
    padding: 10px 22px;
    background: transparent; color: #64748b;
    border: 1px solid #1e2030; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .btn-ghost:hover { border-color: #2d3348; color: #94a3b8; }

  .btn-approve {
    padding: 6px 14px;
    background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
    color: #10b981; border-radius: 8px; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: background 0.15s; white-space: nowrap;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-approve:hover { background: rgba(16,185,129,0.15); }

  .btn-delete {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px;
    background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.2);
    color: #f43f5e; border-radius: 8px; cursor: pointer;
    transition: background 0.15s; flex-shrink: 0;
  }
  .btn-delete:hover { background: rgba(244,63,94,0.18); }

  .btn-spinner {
    width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #fff; border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* Flash */
  .flash {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 18px; border-radius: 10px;
    font-size: 13px; font-weight: 500; margin-bottom: 20px;
  }
  .flash-success { background: rgba(16,185,129,0.08); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
  .flash-error   { background: rgba(244,63,94,0.08);  color: #f43f5e; border: 1px solid rgba(244,63,94,0.2);  margin-bottom: 20px; }

  /* Form card */
  .form-card {
    background: #111118; border: 1px solid #1e2030; border-radius: 20px;
    padding: 32px; margin-bottom: 28px;
  }
  .form-card-header { margin-bottom: 28px; }
  .form-card-title {
    font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700;
    color: #f1f5f9; margin: 0 0 6px;
  }
  .form-card-sub { font-size: 13px; color: #475569; margin: 0; }

  .form-section-label {
    font-size: 11px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
    color: #334155; padding-bottom: 12px; border-bottom: 1px solid #1a1d2e; margin-bottom: 20px;
  }
  .form-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }
  @media (max-width: 700px) { .form-grid { grid-template-columns: 1fr; } }
  .form-span-2 { grid-column: span 2; }
  @media (max-width: 700px) { .form-span-2 { grid-column: span 1; } }

  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-label { font-size: 12px; font-weight: 500; color: #64748b; }
  .req { color: #f43f5e; }

  .form-input {
    background: #0d0f18; border: 1px solid #1e2030; border-radius: 10px;
    padding: 10px 14px; font-size: 13px; color: #e2e8f0;
    font-family: 'DM Sans', sans-serif; outline: none;
    transition: border-color 0.15s;
  }
  .form-input::placeholder { color: #2d3348; }
  .form-input:focus { border-color: #f43f5e; }
  .form-textarea { resize: vertical; min-height: 80px; }

  .form-actions { display: flex; gap: 12px; margin-top: 28px; }

  /* Filter Tabs */
  .filter-tabs {
    display: flex; gap: 8px; margin-bottom: 20px;
  }
  .filter-tab {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 10px;
    font-size: 12px; font-weight: 500;
    background: #111118; border: 1px solid #1e2030;
    color: #64748b; cursor: pointer;
    text-transform: capitalize; letter-spacing: 0.02em;
    transition: all 0.15s; font-family: 'DM Sans', sans-serif;
  }
  .filter-tab:hover { border-color: #2d3348; color: #94a3b8; }
  .filter-tab-active {
    background: #f43f5e; border-color: #f43f5e; color: #fff;
  }
  .filter-tab-active:hover { background: #e11d48; border-color: #e11d48; }
  .filter-tab-count {
    background: rgba(255,255,255,0.12); padding: 1px 7px; border-radius: 99px; font-size: 11px;
  }
  .filter-tab:not(.filter-tab-active) .filter-tab-count {
    background: #1a1d2e; color: #475569;
  }

  /* Table */
  .table-card {
    background: #111118; border: 1px solid #1e2030; border-radius: 20px; overflow: hidden;
  }
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

  .action-row { display: flex; align-items: center; gap: 8px; }

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
  .status-badge::before {
    content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor;
  }
  .status-confirmed { background: rgba(16,185,129,0.1);  color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
  .status-pending   { background: rgba(245,158,11,0.1);  color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
`