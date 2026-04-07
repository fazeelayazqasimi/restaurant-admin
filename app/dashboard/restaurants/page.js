'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState('all')
  const [actionId, setActionId]       = useState(null)
  const [showModal, setShowModal]     = useState(false)

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
      // FIX: sirf isApproved: false — isRejected field schema mein nahi
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, isApproved: false } : r))
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
      filter === 'all'      ? true :
      filter === 'pending'  ? !r.isApproved :
      filter === 'approved' ? r.isApproved : true
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
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div className="p-chip">{restaurants.length} total</div>
            <button className="add-btn" onClick={() => setShowModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Restaurant
            </button>
          </div>
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
                        {/* FIX: Approve/Reject sirf pending pe dikhein */}
                        {!r.isApproved && (
                          <button className="r-btn r-btn-approve" onClick={() => handleApprove(r.id)} disabled={actionId === r.id}>
                            {actionId === r.id ? <span className="p-btn-spinner" /> : null}
                            Approve
                          </button>
                        )}
                        {!r.isApproved && (
                          <button className="r-btn r-btn-reject" onClick={() => handleReject(r.id)} disabled={actionId === r.id}>
                            Reject
                          </button>
                        )}
                        <button className="r-btn r-btn-delete" onClick={() => handleDelete(r.id)} disabled={actionId === r.id}>
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

      {/* Add Restaurant Modal */}
      {showModal && (
        <AddRestaurantModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            fetchRestaurants()
          }}
        />
      )}
    </>
  )
}

// ─── Add Restaurant Modal (3 Steps) ─────────────────────────────────
function AddRestaurantModal({ onClose, onSuccess }) {
  const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)

  const [step, setSaving_step] = useState(1) // 1=owner, 2=restaurant, 3=confirm
  const [saving, setSaving]    = useState(false)
  const [error, setError]      = useState('')

  const [form, setForm] = useState({
    // Owner
    ownerName: '', email: '', phone: '', password: '',
    // Restaurant
    restaurantName: '', location: '',
    openingTime: '12:00', closingTime: '23:00',
    description: '', cuisine: '',
  })

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const validateStep1 = () => {
    if (!form.ownerName || !form.email || !form.phone || !form.password)
      return 'All fields are required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return 'Invalid email address.'
    if (!/^[0-9]{10,15}$/.test(form.phone))
      return 'Phone must be 10–15 digits only.'
    if (form.password.length < 6)
      return 'Password must be at least 6 characters.'
    return null
  }

  const validateStep2 = () => {
    if (!form.restaurantName || !form.location)
      return 'Restaurant name and location are required.'
    return null
  }

  const handleNext = () => {
    const err = step === 1 ? validateStep1() : validateStep2()
    if (err) { setError(err); return }
    setError('')
    setSaving_step(s => s + 1)
  }

  const handleBack = () => {
    setError('')
    setSaving_step(s => s - 1)
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      await api.post('/auth/register', {
        name:     form.ownerName,
        email:    form.email,
        phone:    form.phone,
        password: form.password,
        role:     'restaurant',
        restaurant: {
          name:        form.restaurantName,
          location:    form.location,
          openingTime: form.openingTime,
          closingTime: form.closingTime,
          description: form.description,
          cuisine:     form.cuisine,
        }
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Email may already exist.')
      setSaving_step(1)
    } finally {
      setSaving(false)
    }
  }

  const stepLabels = ['Owner Info', 'Restaurant', 'Confirm']

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-box">

        {/* Header */}
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">Step {step} of 3</p>
            <h2 className="modal-title">
              {step === 1 ? 'Owner Details'
               : step === 2 ? 'Restaurant Details'
               : 'Confirm & Register'}
            </h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Step indicators */}
        <div className="modal-steps">
          {stepLabels.map((label, i) => (
            <>
              <div key={label} className={`modal-step ${step > i ? 'modal-step-done' : step === i+1 ? 'modal-step-active' : ''}`}>
                <span>{step > i+1 ? '✓' : i+1}</span>
                {label}
              </div>
              {i < stepLabels.length - 1 && <div key={`line-${i}`} className="modal-step-line" />}
            </>
          ))}
        </div>

        {error && (
          <div className="modal-error">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <div className="modal-body">

          {/* Step 1 — Owner */}
          {step === 1 && (
            <div className="modal-grid">
              <div className="modal-field modal-field-full">
                <label>Owner Full Name <span>*</span></label>
                <input type="text" placeholder="e.g. Ahmed Khan" value={form.ownerName} onChange={e => set('ownerName', e.target.value)} />
              </div>
              <div className="modal-field">
                <label>Email Address <span>*</span></label>
                <input type="email" placeholder="owner@restaurant.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="modal-field">
                <label>Phone Number <span>*</span></label>
                <input type="tel" placeholder="03001234567" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="modal-field modal-field-full">
                <label>Password <span>*</span></label>
                <input type="password" placeholder="Minimum 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 2 — Restaurant */}
          {step === 2 && (
            <div className="modal-grid">
              <div className="modal-field modal-field-full">
                <label>Restaurant Name <span>*</span></label>
                <input type="text" placeholder="e.g. Kababjees" value={form.restaurantName} onChange={e => set('restaurantName', e.target.value)} />
              </div>
              <div className="modal-field modal-field-full">
                <label>Location <span>*</span></label>
                <input type="text" placeholder="e.g. DHA Phase 6, Karachi" value={form.location} onChange={e => set('location', e.target.value)} />
              </div>
              <div className="modal-field modal-field-full">
                <label>Cuisine Type <span className="modal-optional">(Optional)</span></label>
                <input type="text" placeholder="e.g. Pakistani, Chinese, BBQ" value={form.cuisine} onChange={e => set('cuisine', e.target.value)} />
              </div>
              <div className="modal-field">
                <label>Opening Time</label>
                <select value={form.openingTime} onChange={e => set('openingTime', e.target.value)}>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="modal-field">
                <label>Closing Time</label>
                <select value={form.closingTime} onChange={e => set('closingTime', e.target.value)}>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="modal-field modal-field-full">
                <label>Description <span className="modal-optional">(Optional)</span></label>
                <textarea placeholder="Describe the restaurant..." value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
              </div>
            </div>
          )}

          {/* Step 3 — Confirm */}
          {step === 3 && (
            <div className="confirm-box">
              <div className="confirm-section">
                <p className="confirm-section-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Owner Details
                </p>
                <div className="confirm-rows">
                  <ConfirmRow label="Name"  value={form.ownerName} />
                  <ConfirmRow label="Email" value={form.email} />
                  <ConfirmRow label="Phone" value={form.phone} />
                </div>
              </div>
              <div className="confirm-divider" />
              <div className="confirm-section">
                <p className="confirm-section-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
                  Restaurant Details
                </p>
                <div className="confirm-rows">
                  <ConfirmRow label="Name"     value={form.restaurantName} />
                  <ConfirmRow label="Location" value={form.location} />
                  {form.cuisine && <ConfirmRow label="Cuisine"  value={form.cuisine} />}
                  <ConfirmRow label="Hours"    value={`${form.openingTime} – ${form.closingTime}`} />
                  {form.description && <ConfirmRow label="Description" value={form.description} />}
                </div>
              </div>
              <div className="confirm-note">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Restaurant will be registered as <strong>Pending</strong> — go to Restaurants page to approve.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="modal-footer">
          {step > 1 && (
            <button className="modal-btn-back" onClick={handleBack}>← Back</button>
          )}
          <div style={{ flex:1 }} />
          <button className="modal-btn-cancel" onClick={onClose}>Cancel</button>
          {step < 3 ? (
            <button className="modal-btn-next" onClick={handleNext}>Continue →</button>
          ) : (
            <button className="modal-btn-submit" onClick={handleSubmit} disabled={saving}>
              {saving && <span className="p-btn-spinner" style={{ borderTopColor:'#fff' }} />}
              {saving ? 'Registering...' : '✓ Confirm & Register'}
            </button>
          )}
        </div>

      </div>
    </>
  )
}

function ConfirmRow({ label, value }) {
  return (
    <div className="confirm-row">
      <span className="confirm-row-label">{label}</span>
      <span className="confirm-row-value">{value}</span>
    </div>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────
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

  .add-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; background:#f43f5e; color:#fff; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s, transform 0.15s; box-shadow:0 4px 14px rgba(244,63,94,0.3); }
  .add-btn:hover { background:#e11d48; transform:translateY(-1px); }

  .r-quick-stats { display:flex; align-items:center; background:#111118; border:1px solid #1e2030; border-radius:14px; padding:16px 24px; margin-bottom:24px; width:fit-content; }
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

  .p-btn-spinner { width:11px; height:11px; border:2px solid rgba(255,255,255,0.2); border-top-color:currentColor; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }

  .p-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 24px; gap:12px; color:#334155; }
  .p-empty p { font-size:13px; margin:0; }

  /* ── Modal ── */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:999; backdrop-filter:blur(4px); }
  .modal-box { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:1000; background:#0f0f1a; border:1px solid #1e2030; border-radius:24px; width:100%; max-width:580px; max-height:90vh; overflow-y:auto; box-shadow:0 40px 80px rgba(0,0,0,0.7); }

  .modal-header { display:flex; align-items:flex-start; justify-content:space-between; padding:28px 28px 0; }
  .modal-eyebrow { font-size:11px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:#f43f5e; margin:0 0 6px; }
  .modal-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#f1f5f9; margin:0; letter-spacing:-0.02em; }
  .modal-close { background:#1e2030; border:1px solid #2a2d3e; border-radius:8px; color:#64748b; cursor:pointer; width:32px; height:32px; display:flex; align-items:center; justify-content:center; transition:all 0.15s; flex-shrink:0; }
  .modal-close:hover { background:#2a2d3e; color:#f1f5f9; }

  .modal-steps { display:flex; align-items:center; padding:20px 28px 0; }
  .modal-step { display:flex; align-items:center; gap:8px; font-size:12px; font-weight:500; color:#334155; white-space:nowrap; transition:color 0.2s; }
  .modal-step span { width:22px; height:22px; border-radius:50%; background:#1e2030; border:1px solid #2a2d3e; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; transition:all 0.2s; }
  .modal-step-done { color:#f1f5f9; }
  .modal-step-done span { background:#10b981; border-color:#10b981; color:#fff; }
  .modal-step-active { color:#f1f5f9; }
  .modal-step-active span { background:#f43f5e; border-color:#f43f5e; color:#fff; }
  .modal-step-line { flex:1; height:1px; background:#1e2030; margin:0 10px; }

  .modal-error { display:flex; align-items:center; gap:8px; background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.2); color:#f43f5e; padding:11px 16px; border-radius:10px; font-size:13px; margin:16px 28px 0; }

  .modal-body { padding:20px 28px; }

  .modal-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .modal-field { display:flex; flex-direction:column; gap:7px; }
  .modal-field-full { grid-column:1 / -1; }
  .modal-field label { font-size:12px; font-weight:500; color:#64748b; }
  .modal-field label span { color:#f43f5e; }
  .modal-optional { color:#334155 !important; font-weight:400 !important; }
  .modal-field input, .modal-field select, .modal-field textarea { background:#0d0d18; border:1px solid #1e2030; border-radius:10px; padding:11px 14px; font-size:13px; color:#e2e8f0; font-family:'DM Sans',sans-serif; outline:none; transition:border-color 0.2s; }
  .modal-field input:focus, .modal-field select:focus, .modal-field textarea:focus { border-color:#f43f5e; }
  .modal-field input::placeholder, .modal-field textarea::placeholder { color:#2d3348; }
  .modal-field textarea { resize:vertical; min-height:80px; }
  .modal-field select { cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:32px; }

  /* Confirm step */
  .confirm-box { display:flex; flex-direction:column; gap:0; background:#0d0d18; border:1px solid #1e2030; border-radius:16px; overflow:hidden; }
  .confirm-section { padding:18px 20px; }
  .confirm-section-title { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.1em; color:#64748b; margin:0 0 14px; }
  .confirm-rows { display:flex; flex-direction:column; gap:10px; }
  .confirm-row { display:flex; gap:12px; align-items:baseline; }
  .confirm-row-label { font-size:12px; color:#475569; width:90px; flex-shrink:0; }
  .confirm-row-value { font-size:13px; color:#e2e8f0; font-weight:500; }
  .confirm-divider { height:1px; background:#1e2030; }
  .confirm-note { display:flex; align-items:flex-start; gap:8px; padding:14px 20px; background:rgba(245,158,11,0.05); border-top:1px solid rgba(245,158,11,0.15); font-size:12px; color:#92400e; line-height:1.5; }
  .confirm-note strong { color:#f59e0b; }

  .modal-footer { display:flex; align-items:center; gap:10px; padding:0 28px 28px; }
  .modal-btn-back   { padding:10px 18px; background:none; border:1px solid #1e2030; color:#64748b; border-radius:10px; font-size:13px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
  .modal-btn-back:hover { border-color:#2a2d3e; color:#94a3b8; }
  .modal-btn-cancel { padding:10px 18px; background:none; border:1px solid #1e2030; color:#64748b; border-radius:10px; font-size:13px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
  .modal-btn-cancel:hover { border-color:#2a2d3e; color:#94a3b8; }
  .modal-btn-next   { padding:10px 22px; background:#1e2030; border:none; color:#f1f5f9; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s; }
  .modal-btn-next:hover { background:#2a2d3e; }
  .modal-btn-submit { display:inline-flex; align-items:center; gap:8px; padding:10px 22px; background:#f43f5e; border:none; color:#fff; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; box-shadow:0 4px 14px rgba(244,63,94,0.3); transition:background 0.15s; }
  .modal-btn-submit:hover:not(:disabled) { background:#e11d48; }
  .modal-btn-submit:disabled { background:#4b1b26; cursor:not-allowed; box-shadow:none; }

  @media (max-width:768px) {
    .p-root { padding:24px 16px; }
    .p-header { flex-direction:column; align-items:flex-start; gap:12px; }
    .modal-box { max-width:calc(100vw - 32px); }
    .modal-grid { grid-template-columns:1fr; }
    .modal-field-full { grid-column:1; }
  }
`
