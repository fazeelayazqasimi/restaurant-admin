'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'

export default function TablesPage() {
  const [tables, setTables] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    tableNumber: '',
    capacity: '',
    restaurantId: ''
  })

  useEffect(() => {
    fetchRestaurants()
  }, [])

  useEffect(() => {
    if (selectedRestaurant) {
      fetchTables()
    }
  }, [selectedRestaurant])

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/admin/restaurants')
      setRestaurants(res.data.restaurants)
      if (res.data.restaurants.length > 0) {
        setSelectedRestaurant(res.data.restaurants[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTables = async () => {
    try {
      const res = await api.get(`/restaurants/${selectedRestaurant}/tables`)
      setTables(res.data.tables)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setFormLoading(true)
    try {
      await api.post(`/restaurants/${selectedRestaurant}/tables`, form)
      setSuccess('Table added successfully.')
      setForm({ tableNumber: '', capacity: '', restaurantId: selectedRestaurant })
      setShowForm(false)
      fetchTables()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add table.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleStatusUpdate = async (tableId, status) => {
    try {
      await api.put(`/tables/${tableId}/status`, { status })
      fetchTables()
      setSuccess(`Table status updated to ${status}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      alert('Failed to update status')
    }
  }

  const handleDelete = async (tableId) => {
    if (!confirm('Delete this table?')) return
    try {
      await api.delete(`/tables/${tableId}`)
      fetchTables()
      setSuccess('Table deleted.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      alert('Failed to delete')
    }
  }

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'status-available'
      case 'reserved': return 'status-reserved'
      case 'occupied': return 'status-occupied'
      default: return ''
    }
  }

  if (loading) {
    return (
      <>
        <style>{pageStyles}</style>
        <div className="page-loading">
          <div className="page-spinner" />
          <span>Loading tables</span>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{pageStyles}</style>
      <div className="page-root">

        <header className="page-header">
          <div>
            <p className="page-eyebrow">Restaurant Management</p>
            <h1 className="page-title">Tables</h1>
          </div>
          <button
            className={`btn-primary ${showForm ? 'btn-cancel' : ''}`}
            onClick={() => { setShowForm(!showForm); setError(''); setSuccess('') }}
          >
            {showForm ? (
              <>Cancel</>
            ) : (
              <>+ Add Table</>
            )}
          </button>
        </header>

        {/* Restaurant Selector */}
        <div className="restaurant-selector">
          <label className="selector-label">Select Restaurant:</label>
          <select
            className="selector-input"
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
          >
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {success && (
          <div className="flash flash-success">{success}</div>
        )}

        {/* Add Table Form */}
        {showForm && (
          <div className="form-card">
            <h2 className="form-title">Add New Table</h2>
            {error && <div className="flash flash-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Table Number *</label>
                  <input
                    required
                    type="text"
                    className="form-input"
                    placeholder="e.g., Table 1, A1, 101"
                    value={form.tableNumber}
                    onChange={e => setField('tableNumber', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity (seats) *</label>
                  <input
                    required
                    type="number"
                    className="form-input"
                    placeholder="e.g., 4"
                    value={form.capacity}
                    onChange={e => setField('capacity', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" disabled={formLoading} className="btn-primary">
                  {formLoading ? 'Adding...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tables Grid */}
        <div className="tables-grid">
          {tables.length === 0 ? (
            <div className="empty-state-large">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
              </svg>
              <p>No tables added yet</p>
              <p className="empty-sub">Click "Add Table" to create your first table</p>
            </div>
          ) : (
            tables.map(table => (
              <div key={table.id} className={`table-card-item ${getStatusColor(table.status)}`}>
                <div className="table-header">
                  <h3 className="table-number">{table.tableNumber}</h3>
                  <button className="delete-btn" onClick={() => handleDelete(table.id)}>×</button>
                </div>
                <div className="table-capacity">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span>{table.capacity} seats</span>
                </div>
                <div className="table-status">
                  <span className={`status-badge ${getStatusColor(table.status)}`}>
                    {table.status || 'available'}
                  </span>
                </div>
                <div className="table-actions">
                  <button
                    className="action-btn available-btn"
                    onClick={() => handleStatusUpdate(table.id, 'available')}
                  >
                    Available
                  </button>
                  <button
                    className="action-btn reserved-btn"
                    onClick={() => handleStatusUpdate(table.id, 'reserved')}
                  >
                    Reserved
                  </button>
                  <button
                    className="action-btn occupied-btn"
                    onClick={() => handleStatusUpdate(table.id, 'occupied')}
                  >
                    Occupied
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </>
  )
}

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .page-root {
    min-height: 100vh;
    background: #0a0a0f;
    padding: 40px 44px;
    font-family: 'DM Sans', sans-serif;
    color: #e2e8f0;
  }

  .page-loading {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
  .page-spinner {
    width: 36px; height: 36px;
    border: 2px solid #1e293b;
    border-top-color: #f43f5e;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }
  .page-eyebrow {
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #f43f5e;
    margin: 0 0 8px;
  }
  .page-title {
    font-family: 'Syne', sans-serif;
    font-size: 32px;
    font-weight: 800;
    color: #f1f5f9;
    margin: 0;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    background: #f43f5e;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }
  .btn-primary:hover { background: #e11d48; }
  .btn-cancel { background: #1e2030; color: #94a3b8; }
  .btn-cancel:hover { background: #252838; }

  .restaurant-selector {
    background: #111118;
    border: 1px solid #1e2030;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .selector-label {
    font-size: 13px;
    color: #64748b;
  }
  .selector-input {
    background: #0d0f18;
    border: 1px solid #1e2030;
    border-radius: 8px;
    padding: 8px 16px;
    color: #e2e8f0;
    font-size: 13px;
    min-width: 200px;
  }

  .flash {
    padding: 12px 18px;
    border-radius: 10px;
    margin-bottom: 20px;
  }
  .flash-success {
    background: rgba(16,185,129,0.08);
    color: #10b981;
    border: 1px solid rgba(16,185,129,0.2);
  }
  .flash-error {
    background: rgba(244,63,94,0.08);
    color: #f43f5e;
    border: 1px solid rgba(244,63,94,0.2);
  }

  .form-card {
    background: #111118;
    border: 1px solid #1e2030;
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 28px;
  }
  .form-title {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 20px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .form-label {
    font-size: 12px;
    color: #64748b;
  }
  .form-input {
    background: #0d0f18;
    border: 1px solid #1e2030;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    color: #e2e8f0;
  }
  .form-input:focus {
    border-color: #f43f5e;
    outline: none;
  }
  .form-actions {
    margin-top: 20px;
  }

  .tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .table-card-item {
    background: #111118;
    border: 1px solid #1e2030;
    border-radius: 16px;
    padding: 20px;
    transition: all 0.2s;
  }
  .table-card-item:hover {
    transform: translateY(-2px);
    border-color: #2d3348;
  }
  .table-card-item.status-available { border-left: 3px solid #10b981; }
  .table-card-item.status-reserved { border-left: 3px solid #f59e0b; }
  .table-card-item.status-occupied { border-left: 3px solid #f43f5e; }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .table-number {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }
  .delete-btn {
    background: rgba(244,63,94,0.1);
    border: none;
    color: #f43f5e;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 18px;
  }

  .table-capacity {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #64748b;
    font-size: 13px;
    margin-bottom: 12px;
  }

  .table-status {
    margin-bottom: 16px;
  }
  .status-badge {
    display: inline-flex;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .status-available .status-badge { background: rgba(16,185,129,0.1); color: #10b981; }
  .status-reserved .status-badge { background: rgba(245,158,11,0.1); color: #f59e0b; }
  .status-occupied .status-badge { background: rgba(244,63,94,0.1); color: #f43f5e; }

  .table-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .action-btn {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    border: none;
  }
  .available-btn {
    background: rgba(16,185,129,0.1);
    color: #10b981;
  }
  .reserved-btn {
    background: rgba(245,158,11,0.1);
    color: #f59e0b;
  }
  .occupied-btn {
    background: rgba(244,63,94,0.1);
    color: #f43f5e;
  }

  .empty-state-large {
    text-align: center;
    padding: 80px 20px;
    color: #334155;
  }
  .empty-state-large svg {
    margin-bottom: 16px;
  }
  .empty-sub {
    font-size: 12px;
    margin-top: 8px;
  }
`
