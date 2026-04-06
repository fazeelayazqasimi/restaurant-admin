'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'
import WalkinForm from '../../../components/WalkinForm'
import ReservationManager from '../../../components/ReservationManager'

const STATUS_COLORS = {
  available: { cls: 'ts-available', label: 'Available' },
  reserved:  { cls: 'ts-reserved',  label: 'Reserved'  },
  occupied:  { cls: 'ts-occupied',  label: 'Occupied'  },
}

export default function TablesPage() {
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [tables, setTables]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [loadingTables, setLoadingTables] = useState(false)
  const [activeTab, setActiveTab]     = useState('tables') // tables | walkin | rmd
  const [showAddTable, setShowAddTable] = useState(false)
  const [newTable, setNewTable]       = useState({ tableNumber: '', capacity: '4' })
  const [saving, setSaving]           = useState(false)
  const [updatingId, setUpdatingId]   = useState(null)

  useEffect(() => { fetchRestaurants() }, [])
  useEffect(() => { if (selectedRestaurant) fetchTables(selectedRestaurant.id) }, [selectedRestaurant])

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/admin/restaurants')
      const approved = (res.data.restaurants || []).filter(r => r.isApproved)
      setRestaurants(approved)
      if (approved.length > 0) setSelectedRestaurant(approved[0])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTables = async (restaurantId) => {
    setLoadingTables(true)
    try {
      const res = await api.get(`/restaurants/${restaurantId}/tables`)
      setTables(res.data.tables || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingTables(false)
    }
  }

  const handleAddTable = async () => {
    if (!newTable.tableNumber || !newTable.capacity) return
    setSaving(true)
    try {
      await api.post(`/restaurants/${selectedRestaurant.id}/tables`, {
        tableNumber: newTable.tableNumber,
        capacity: parseInt(newTable.capacity),
      })
      setNewTable({ tableNumber: '', capacity: '4' })
      setShowAddTable(false)
      fetchTables(selectedRestaurant.id)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add table.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (tableId, status) => {
    setUpdatingId(tableId)
    try {
      await api.put(`/restaurants/${selectedRestaurant.id}/tables/${tableId}`, { status })
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t))
    } catch { alert('Failed to update table status.') }
    finally { setUpdatingId(null) }
  }

  const handleDeleteTable = async (tableId) => {
    if (!confirm('Delete this table?')) return
    setUpdatingId(tableId)
    try {
      await api.delete(`/restaurants/${selectedRestaurant.id}/tables/${tableId}`)
      setTables(prev => prev.filter(t => t.id !== tableId))
    } catch { alert('Failed to delete table.') }
    finally { setUpdatingId(null) }
  }

  if (loading) return (
    <>
      <style>{styles}</style>
      <div className="p-loading"><div className="p-spinner" /><span>Loading...</span></div>
    </>
  )

  if (restaurants.length === 0) return (
    <>
      <style>{styles}</style>
      <div className="p-root">
        <header className="p-header">
          <div><p className="p-eyebrow">Management</p><h1 className="p-title">Table Management</h1></div>
        </header>
        <div className="t-no-rest">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
          <p>No approved restaurants yet. Approve a restaurant first.</p>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{styles}</style>
      <div className="p-root">
        <header className="p-header">
          <div>
            <p className="p-eyebrow">Management</p>
            <h1 className="p-title">Table Management</h1>
          </div>
          <select
            className="t-rest-select"
            value={selectedRestaurant?.id || ''}
            onChange={e => {
              const r = restaurants.find(r => r.id === parseInt(e.target.value))
              setSelectedRestaurant(r)
            }}
          >
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </header>

        {/* Tabs */}
        <div className="t-tabs">
          {[
            { key: 'tables', label: 'Tables' },
            { key: 'rmd',    label: 'Reservation Dashboard' },
            { key: 'walkin', label: '+ Walk-in Booking' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`t-tab ${activeTab === tab.key ? 't-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div>
            <div className="t-table-header">
              <span className="t-table-count">{tables.length} tables</span>
              <button className="t-add-btn" onClick={() => setShowAddTable(v => !v)}>
                {showAddTable ? 'Cancel' : '+ Add Table'}
              </button>
            </div>

            {showAddTable && (
              <div className="t-add-form">
                <h3>Add New Table</h3>
                <div className="t-add-grid">
                  <div className="t-add-group">
                    <label>Table Number / Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. T1, VIP-1, Garden-3"
                      value={newTable.tableNumber}
                      onChange={e => setNewTable(p => ({ ...p, tableNumber: e.target.value }))}
                    />
                  </div>
                  <div className="t-add-group">
                    <label>Capacity (seats) *</label>
                    <input
                      type="number"
                      min="1" max="50"
                      value={newTable.capacity}
                      onChange={e => setNewTable(p => ({ ...p, capacity: e.target.value }))}
                    />
                  </div>
                </div>
                <button className="t-save-btn" onClick={handleAddTable} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Table'}
                </button>
              </div>
            )}

            {loadingTables ? (
              <div className="t-loading">Loading tables...</div>
            ) : tables.length === 0 ? (
              <div className="p-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
                <p>No tables added yet. Click "Add Table" to create one.</p>
              </div>
            ) : (
              <div className="t-grid">
                {tables.map(t => {
                  const sc = STATUS_COLORS[t.status] || STATUS_COLORS.available
                  return (
                    <div key={t.id} className={`t-card ${sc.cls}`}>
                      <div className="t-card-top">
                        <span className="t-card-num">{t.tableNumber}</span>
                        <span className={`t-status-dot ${sc.cls}-dot`} />
                      </div>
                      <div className="t-card-cap">{t.capacity} seats</div>
                      <div className="t-card-status">{sc.label}</div>
                      <div className="t-card-actions">
                        <select
                          className="t-status-select"
                          value={t.status}
                          onChange={e => handleStatusChange(t.id, e.target.value)}
                          disabled={updatingId === t.id}
                        >
                          <option value="available">Available</option>
                          <option value="reserved">Reserved</option>
                          <option value="occupied">Occupied</option>
                        </select>
                        <button
                          className="t-del-btn"
                          onClick={() => handleDeleteTable(t.id)}
                          disabled={updatingId === t.id}
                          title="Delete table"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Reservation Dashboard Tab */}
        {activeTab === 'rmd' && selectedRestaurant && (
          <ReservationManager restaurantId={selectedRestaurant.id} />
        )}

        {/* Walk-in Tab */}
        {activeTab === 'walkin' && selectedRestaurant && (
          <WalkinForm
            restaurantId={selectedRestaurant.id}
            tables={tables.filter(t => t.status === 'available')}
            onSuccess={() => {
              fetchTables(selectedRestaurant.id)
              setActiveTab('rmd')
            }}
          />
        )}
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

  .t-rest-select { background:#111118; border:1px solid #1e2030; border-radius:10px; padding:10px 16px; font-size:13px; color:#e2e8f0; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer; min-width:200px; }
  .t-rest-select:focus { border-color:#f43f5e; }

  .t-tabs { display:flex; gap:4px; background:#111118; border:1px solid #1e2030; padding:4px; border-radius:12px; margin-bottom:24px; width:fit-content; }
  .t-tab { padding:8px 18px; border-radius:9px; border:none; background:none; font-size:13px; font-weight:500; color:#475569; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
  .t-tab:hover { color:#94a3b8; }
  .t-tab-active { background:#1e2030; color:#f1f5f9; }

  .t-table-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .t-table-count { font-size:13px; color:#64748b; }
  .t-add-btn { padding:8px 18px; background:#f43f5e; color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s; }
  .t-add-btn:hover { background:#e11d48; }

  .t-add-form { background:#111118; border:1px solid #1e2030; border-radius:16px; padding:24px; margin-bottom:24px; }
  .t-add-form h3 { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:#f1f5f9; margin:0 0 20px; }
  .t-add-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
  .t-add-group { display:flex; flex-direction:column; gap:6px; }
  .t-add-group label { font-size:12px; color:#64748b; font-weight:500; }
  .t-add-group input { background:#0d0f18; border:1px solid #1e2030; border-radius:10px; padding:10px 14px; font-size:13px; color:#e2e8f0; font-family:'DM Sans',sans-serif; outline:none; transition:border-color 0.2s; }
  .t-add-group input:focus { border-color:#f43f5e; }
  .t-save-btn { padding:10px 24px; background:#f43f5e; color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; }
  .t-save-btn:hover { background:#e11d48; }
  .t-save-btn:disabled { background:#4b1b26; cursor:not-allowed; }

  .t-loading { text-align:center; padding:40px; color:#475569; font-size:13px; }

  .t-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:14px; }
  .t-card { background:#111118; border:1px solid #1e2030; border-radius:16px; padding:20px; transition:border-color 0.2s, transform 0.2s; }
  .t-card:hover { transform:translateY(-2px); }
  .t-card.ts-available { border-color:rgba(16,185,129,0.2); }
  .t-card.ts-reserved  { border-color:rgba(245,158,11,0.2); }
  .t-card.ts-occupied  { border-color:rgba(244,63,94,0.2); }

  .t-card-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .t-card-num { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; color:#f1f5f9; }
  .t-status-dot { width:8px; height:8px; border-radius:50%; }
  .ts-available-dot { background:#10b981; box-shadow:0 0 6px #10b981; }
  .ts-reserved-dot  { background:#f59e0b; box-shadow:0 0 6px #f59e0b; }
  .ts-occupied-dot  { background:#f43f5e; box-shadow:0 0 6px #f43f5e; }

  .t-card-cap { font-size:12px; color:#64748b; margin-bottom:4px; }
  .t-card-status { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:14px; }
  .ts-available .t-card-status { color:#10b981; }
  .ts-reserved  .t-card-status { color:#f59e0b; }
  .ts-occupied  .t-card-status { color:#f43f5e; }

  .t-card-actions { display:flex; gap:8px; align-items:center; }
  .t-status-select { flex:1; background:#0d0f18; border:1px solid #1e2030; border-radius:8px; padding:6px 10px; font-size:11px; color:#94a3b8; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer; }
  .t-del-btn { padding:6px; background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.2); color:#f43f5e; border-radius:7px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
  .t-del-btn:hover { background:rgba(244,63,94,0.18); }
  .t-del-btn:disabled { opacity:0.4; cursor:not-allowed; }

  .t-no-rest { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 24px; gap:16px; color:#334155; text-align:center; }
  .t-no-rest p { font-size:13px; max-width:300px; }
  .p-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 24px; gap:12px; color:#334155; }
  .p-empty p { font-size:13px; margin:0; text-align:center; max-width:280px; }

  @media (max-width:768px) { .p-root { padding:24px 16px; } .p-header { flex-direction:column; align-items:flex-start; gap:12px; } .t-add-grid { grid-template-columns:1fr; } }
`
