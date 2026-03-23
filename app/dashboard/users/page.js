'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'

export default function UsersPage() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data.users)
    } catch (err) {
      console.error('Fetch users error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      fetchUsers()
    } catch {
      alert('Failed to delete.')
    }
  }

  const roleConfig = {
    admin:      { cls: 'role-admin',      label: 'Admin'      },
    restaurant: { cls: 'role-restaurant', label: 'Restaurant' },
    user:       { cls: 'role-user',       label: 'User'       },
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <>
        <style>{pageStyles}</style>
        <div className="page-loading">
          <div className="page-spinner" />
          <span>Loading users</span>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{pageStyles}</style>
      <div className="page-root">

        {/* Header */}
        <header className="page-header">
          <div>
            <p className="page-eyebrow">Management</p>
            <h1 className="page-title">Users</h1>
          </div>
          <div className="page-meta-chip">{users.length} total users</div>
        </header>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
          {search && (
            <span className="search-result-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Table */}
        <div className="table-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      <div className="empty-state">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        <p>No users match your search</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(u => {
                    const r = roleConfig[u.role] || { cls: 'role-user', label: u.role }
                    return (
                      <tr key={u.id}>
                        <td className="cell-muted">#{u.id}</td>
                        <td className="cell-bold">{u.name}</td>
                        <td className="cell-muted">{u.email}</td>
                        <td className="cell-muted">{u.phone || <span className="cell-empty">—</span>}</td>
                        <td>
                          <span className={`role-badge ${r.cls}`}>{r.label}</span>
                        </td>
                        <td className="cell-muted">{new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td>
                          {u.role !== 'admin' && (
                            <button className="btn-delete" onClick={() => handleDelete(u.id)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
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
    min-height: 100vh;
    background: #0a0a0f;
    padding: 40px 44px;
    font-family: 'DM Sans', sans-serif;
    color: #e2e8f0;
  }

  .page-loading {
    min-height: 100vh;
    background: #0a0a0f;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; color: #64748b;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; letter-spacing: 0.05em;
  }
  .page-spinner {
    width: 36px; height: 36px;
    border: 2px solid #1e293b;
    border-top-color: #f43f5e;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Header */
  .page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 36px;
  }
  .page-eyebrow {
    font-size: 11px; font-weight: 500;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: #f43f5e; margin: 0 0 8px;
    font-family: 'DM Sans', sans-serif;
  }
  .page-title {
    font-family: 'Syne', sans-serif;
    font-size: 32px; font-weight: 800;
    color: #f1f5f9; margin: 0;
    letter-spacing: -0.02em;
  }
  .page-meta-chip {
    font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
    color: #334155; background: #111118;
    border: 1px solid #1e2030; padding: 6px 14px; border-radius: 99px;
  }

  /* Toolbar */
  .toolbar {
    display: flex; align-items: center; gap: 14px; margin-bottom: 20px;
  }
  .search-wrap {
    position: relative; display: flex; align-items: center;
    max-width: 360px; width: 100%;
  }
  .search-icon {
    position: absolute; left: 14px; color: #334155; pointer-events: none;
  }
  .search-input {
    width: 100%;
    background: #111118;
    border: 1px solid #1e2030;
    border-radius: 10px;
    padding: 10px 40px 10px 40px;
    font-size: 13px;
    color: #e2e8f0;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s;
  }
  .search-input::placeholder { color: #334155; }
  .search-input:focus { border-color: #f43f5e; }
  .search-clear {
    position: absolute; right: 12px;
    background: #1e2030; border: none; cursor: pointer;
    color: #64748b; padding: 4px; border-radius: 4px;
    display: flex; align-items: center; transition: color 0.15s;
  }
  .search-clear:hover { color: #f43f5e; }
  .search-result-count {
    font-size: 12px; color: #475569;
  }

  /* Table */
  .table-card {
    background: #111118;
    border: 1px solid #1e2030;
    border-radius: 20px;
    overflow: hidden;
  }
  .table-wrap { overflow-x: auto; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .data-table thead tr { border-bottom: 1px solid #1a1d2e; }
  .data-table th {
    padding: 14px 20px; text-align: left;
    font-size: 11px; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: #334155;
  }
  .data-table tbody tr {
    border-bottom: 1px solid #12141e;
    transition: background 0.15s;
  }
  .data-table tbody tr:last-child { border-bottom: none; }
  .data-table tbody tr:hover { background: #13151f; }
  .data-table td { padding: 14px 20px; }

  .cell-muted  { color: #64748b; }
  .cell-bold   { color: #e2e8f0; font-weight: 500; }
  .cell-empty  { color: #2d3348; }

  /* Empty state */
  .empty-cell { padding: 0 !important; }
  .empty-state {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 60px 24px; gap: 12px;
    color: #334155;
  }
  .empty-state p { font-size: 13px; margin: 0; }

  /* Role badges */
  .role-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 11px; border-radius: 99px;
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .role-badge::before {
    content: ''; width: 5px; height: 5px;
    border-radius: 50%; background: currentColor;
  }
  .role-admin      { background: rgba(168,85,247,0.1); color: #a855f7; border: 1px solid rgba(168,85,247,0.2); }
  .role-restaurant { background: rgba(59,130,246,0.1);  color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); }
  .role-user       { background: rgba(100,116,139,0.1); color: #94a3b8; border: 1px solid rgba(100,116,139,0.2); }

  /* Delete button */
  .btn-delete {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px;
    background: rgba(244,63,94,0.08);
    border: 1px solid rgba(244,63,94,0.2);
    color: #f43f5e;
    border-radius: 8px; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: background 0.15s, border-color 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-delete:hover {
    background: rgba(244,63,94,0.15);
    border-color: rgba(244,63,94,0.4);
  }
`