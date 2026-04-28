'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../../services/api'
import WalkinForm from '../../../components/WalkinForm'
import ReservationManager from '../../../components/ReservationManager'

const STATUS_COLORS = {
  available: { cls: 'ts-available', label: 'Available', hex: '#10b981', glow: 'rgba(16,185,129,0.35)' },
  reserved:  { cls: 'ts-reserved',  label: 'Reserved',  hex: '#f59e0b', glow: 'rgba(245,158,11,0.35)' },
  occupied:  { cls: 'ts-occupied',  label: 'Occupied',  hex: '#f43f5e', glow: 'rgba(244,63,94,0.35)'  },
}

// ─── Floor Map Component (Drag & Drop) ───────────────────────────────────────
const TABLE_R = 28  // table circle radius

function loadPositions(restaurantId) {
  try { return JSON.parse(localStorage.getItem(`floormap_${restaurantId}`)) || {} }
  catch { return {} }
}
function savePositions(restaurantId, pos) {
  try { localStorage.setItem(`floormap_${restaurantId}`, JSON.stringify(pos)) }
  catch {}
}

function FloorMap({ tables, restaurantId }) {
  const canvasRef    = useRef(null)
  const animFrameRef = useRef(null)
  const timeRef      = useRef(0)

  // positions keyed by table.id  →  { nx, ny }  (normalized 0–1)
  const positionsRef = useRef({})
  const dragRef      = useRef(null)   // { tableId, offsetX, offsetY }
  const cursorRef    = useRef('default')

  // ── Initialize positions ──────────────────────────────────
  useEffect(() => {
    const saved = loadPositions(restaurantId)
    const cols  = Math.ceil(Math.sqrt(tables.length * 1.4)) || 1
    const cellW = 1 / cols
    const cellH = 1 / (Math.ceil(tables.length / cols) || 1)

    tables.forEach((t, i) => {
      if (saved[t.id]) {
        positionsRef.current[t.id] = saved[t.id]
      } else {
        const col  = i % cols
        const row  = Math.floor(i / cols)
        const seed = (t.id || i) * 2654435761
        const jx   = ((seed & 0xff) / 255 - 0.5) * cellW * 0.4
        const jy   = (((seed >> 8) & 0xff) / 255 - 0.5) * cellH * 0.4
        positionsRef.current[t.id] = {
          nx: Math.max(0.05, Math.min(0.95, cellW * (col + 0.5) + jx)),
          ny: Math.max(0.05, Math.min(0.95, cellH * (row + 0.5) + jy)),
        }
      }
    })
    // clean up deleted tables
    const ids = new Set(tables.map(t => t.id))
    Object.keys(positionsRef.current).forEach(k => { if (!ids.has(Number(k))) delete positionsRef.current[k] })
  }, [tables, restaurantId])

  // ── Canvas pixel helpers ──────────────────────────────────
  const getMapBounds = useCallback((canvas) => {
    const pad = 24
    return {
      ox: pad + 8, oy: pad + 8,
      mapW: canvas.width  - (pad + 8) * 2,
      mapH: canvas.height - (pad + 8) * 2,
    }
  }, [])

  const nxToX = useCallback((nx, canvas) => {
    const { ox, mapW } = getMapBounds(canvas)
    return ox + nx * mapW
  }, [getMapBounds])

  const nyToY = useCallback((ny, canvas) => {
    const { oy, mapH } = getMapBounds(canvas)
    return oy + ny * mapH
  }, [getMapBounds])

  const pixelToNorm = useCallback((px, py, canvas) => {
    const { ox, oy, mapW, mapH } = getMapBounds(canvas)
    return {
      nx: Math.max(0.04, Math.min(0.96, (px - ox) / mapW)),
      ny: Math.max(0.04, Math.min(0.96, (py - oy) / mapH)),
    }
  }, [getMapBounds])

  // ── Hit test ──────────────────────────────────────────────
  const hitTable = useCallback((px, py, canvas) => {
    for (const t of tables) {
      const pos = positionsRef.current[t.id]
      if (!pos) continue
      const x = nxToX(pos.nx, canvas)
      const y = nyToY(pos.ny, canvas)
      if (Math.sqrt((px - x) ** 2 + (py - y) ** 2) <= TABLE_R + 6) return t.id
    }
    return null
  }, [tables, nxToX, nyToY])

  // ── Mouse events ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const getXY = (e) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width  / rect.width
      const scaleY = canvas.height / rect.height
      if (e.touches) {
        return {
          px: (e.touches[0].clientX - rect.left) * scaleX,
          py: (e.touches[0].clientY - rect.top)  * scaleY,
        }
      }
      return {
        px: (e.clientX - rect.left) * scaleX,
        py: (e.clientY - rect.top)  * scaleY,
      }
    }

    const onDown = (e) => {
      const { px, py } = getXY(e)
      const id = hitTable(px, py, canvas)
      if (id == null) return
      e.preventDefault()
      const pos = positionsRef.current[id]
      dragRef.current = {
        tableId: id,
        offsetX: px - nxToX(pos.nx, canvas),
        offsetY: py - nyToY(pos.ny, canvas),
      }
      canvas.style.cursor = 'grabbing'
    }

    const onMove = (e) => {
      const { px, py } = getXY(e)
      if (!dragRef.current) {
        const id = hitTable(px, py, canvas)
        const next = id != null ? 'grab' : 'default'
        if (cursorRef.current !== next) { canvas.style.cursor = next; cursorRef.current = next }
        return
      }
      e.preventDefault()
      const { tableId, offsetX, offsetY } = dragRef.current
      const norm = pixelToNorm(px - offsetX, py - offsetY, canvas)
      positionsRef.current[tableId] = norm
    }

    const onUp = () => {
      if (!dragRef.current) return
      savePositions(restaurantId, positionsRef.current)
      dragRef.current = null
      canvas.style.cursor = 'default'
      cursorRef.current = 'default'
    }

    canvas.addEventListener('mousedown',  onDown)
    canvas.addEventListener('mousemove',  onMove)
    canvas.addEventListener('mouseup',    onUp)
    canvas.addEventListener('mouseleave', onUp)
    canvas.addEventListener('touchstart', onDown, { passive: false })
    canvas.addEventListener('touchmove',  onMove, { passive: false })
    canvas.addEventListener('touchend',   onUp)

    return () => {
      canvas.removeEventListener('mousedown',  onDown)
      canvas.removeEventListener('mousemove',  onMove)
      canvas.removeEventListener('mouseup',    onUp)
      canvas.removeEventListener('mouseleave', onUp)
      canvas.removeEventListener('touchstart', onDown)
      canvas.removeEventListener('touchmove',  onMove)
      canvas.removeEventListener('touchend',   onUp)
    }
  }, [tables, restaurantId, hitTable, nxToX, nyToY, pixelToNorm])

  // ── Draw loop ─────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx  = canvas.getContext('2d')
    const W    = canvas.width
    const H    = canvas.height
    const pad  = 24
    timeRef.current += 0.012

    ctx.clearRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)'
    ctx.lineWidth   = 1
    const gSize = 40
    for (let x = 0; x < W; x += gSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += gSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // Room boundary
    ctx.strokeStyle = 'rgba(244,63,94,0.18)'
    ctx.lineWidth   = 1.5
    ctx.setLineDash([6, 8])
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2)
    ctx.setLineDash([])

    ctx.font      = '500 11px "DM Sans", sans-serif'
    ctx.fillStyle = 'rgba(244,63,94,0.5)'
    ctx.fillText('FLOOR PLAN  ·  drag to reposition', pad + 8, pad + 16)

    if (tables.length === 0) {
      ctx.font = '500 13px "DM Sans", sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.textAlign = 'center'
      ctx.fillText('Add tables to see floor map', W / 2, H / 2)
      ctx.textAlign = 'left'
      return
    }

    const { ox, oy, mapW, mapH } = getMapBounds(canvas)
    const layout = tables.map(t => ({ t, pos: positionsRef.current[t.id] })).filter(l => l.pos)

    // Connection lines
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        const a = layout[i].pos, b = layout[j].pos
        const dx = a.nx - b.nx, dy = a.ny - b.ny
        const d  = Math.sqrt(dx * dx + dy * dy)
        if (d < 0.22) {
          const alpha = (0.22 - d) / 0.22 * 0.12
          ctx.strokeStyle = `rgba(100,116,139,${alpha})`
          ctx.lineWidth   = 1
          ctx.beginPath()
          ctx.moveTo(ox + a.nx * mapW, oy + a.ny * mapH)
          ctx.lineTo(ox + b.nx * mapW, oy + b.ny * mapH)
          ctx.stroke()
        }
      }
    }

    // Tables
    layout.forEach(({ t, pos }, i) => {
      const sc     = STATUS_COLORS[t.status] || STATUS_COLORS.available
      const x      = ox + pos.nx * mapW
      const y      = oy + pos.ny * mapH
      const pulse  = Math.sin(timeRef.current + i * 1.2) * 0.5 + 0.5
      const r      = TABLE_R
      const isDrag = dragRef.current?.tableId === t.id

      // Drag highlight ring
      if (isDrag) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.lineWidth   = 2
        ctx.setLineDash([4, 4])
        ctx.beginPath(); ctx.arc(x, y, r + 10, 0, Math.PI * 2); ctx.stroke()
        ctx.setLineDash([])
      }

      // Glow pulse (available only)
      if (t.status === 'available') {
        const gr = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.2 + pulse * 6)
        gr.addColorStop(0, sc.glow.replace('0.35', String(0.2 + pulse * 0.1)))
        gr.addColorStop(1, 'transparent')
        ctx.fillStyle = gr
        ctx.beginPath(); ctx.arc(x, y, r * 2.2 + pulse * 6, 0, Math.PI * 2); ctx.fill()
      }

      // Chairs
      const chairs = Math.min(t.capacity || 4, 8)
      for (let c = 0; c < chairs; c++) {
        const angle = (c / chairs) * Math.PI * 2 - Math.PI / 2
        const cx2 = x + Math.cos(angle) * (r + 11)
        const cy2 = y + Math.sin(angle) * (r + 11)
        ctx.fillStyle = `rgba(${sc.hex === '#10b981' ? '16,185,129' : sc.hex === '#f59e0b' ? '245,158,11' : '244,63,94'},0.35)`
        ctx.beginPath(); ctx.arc(cx2, cy2, 4.5, 0, Math.PI * 2); ctx.fill()
      }

      // Table circle
      ctx.shadowColor = sc.hex
      ctx.shadowBlur  = isDrag ? 22 : 14 + pulse * 6
      ctx.fillStyle   = isDrag ? '#1a1a26' : '#111118'
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur  = 0

      ctx.strokeStyle = isDrag ? '#fff' : sc.hex
      ctx.lineWidth   = isDrag ? 2.5 : 2
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke()

      // Text
      ctx.font = '700 13px "Syne", sans-serif'
      ctx.fillStyle = '#f1f5f9'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(t.tableNumber, x, y - 4)
      ctx.font = '400 9px "DM Sans", sans-serif'
      ctx.fillStyle = 'rgba(241,245,249,0.45)'
      ctx.fillText(`${t.capacity}p`, x, y + 9)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
    })

    animFrameRef.current = requestAnimationFrame(draw)
  }, [tables, getMapBounds])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [draw])

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      const p = canvas.parentElement
      if (p) { canvas.width = p.clientWidth; canvas.height = p.clientHeight }
    })
    ro.observe(canvas.parentElement)
    const p = canvas.parentElement
    if (p) { canvas.width = p.clientWidth; canvas.height = p.clientHeight }
    return () => ro.disconnect()
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  )
}

// ─── Capacity Donut Chart ─────────────────────────────────────────────────────
function CapacityChart({ tables }) {
  const counts = {
    available: tables.filter(t => t.status === 'available').length,
    reserved:  tables.filter(t => t.status === 'reserved').length,
    occupied:  tables.filter(t => t.status === 'occupied').length,
  }
  const total    = tables.length || 1
  const seats    = {
    available: tables.filter(t => t.status === 'available').reduce((s, t) => s + (t.capacity || 0), 0),
    reserved:  tables.filter(t => t.status === 'reserved').reduce((s,  t) => s + (t.capacity || 0), 0),
    occupied:  tables.filter(t => t.status === 'occupied').reduce((s,  t) => s + (t.capacity || 0), 0),
  }
  const totalSeats = seats.available + seats.reserved + seats.occupied || 1

  const size   = 88
  const stroke = 10
  const r      = (size - stroke) / 2
  const circ   = 2 * Math.PI * r
  const cx     = size / 2, cy = size / 2

  const segments = [
    { key: 'available', color: '#10b981', count: counts.available },
    { key: 'reserved',  color: '#f59e0b', count: counts.reserved  },
    { key: 'occupied',  color: '#f43f5e', count: counts.occupied  },
  ]

  let offset = 0
  const arcs = segments.map(seg => {
    const frac  = seg.count / total
    const dash  = frac * circ
    const arc   = { ...seg, dash, offset, frac }
    offset += dash
    return arc
  })

  return (
    <div className="fc-chart-wrap">
      <div className="fc-donut-wrap">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2030" strokeWidth={stroke} />
          {arcs.map(a => a.frac > 0 && (
            <circle
              key={a.key}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={stroke}
              strokeDasharray={`${a.dash - 2} ${circ - a.dash + 2}`}
              strokeDashoffset={-a.offset}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="fc-donut-center">
          <span className="fc-donut-num">{tables.length}</span>
          <span className="fc-donut-lbl">tables</span>
        </div>
      </div>

      <div className="fc-legend">
        {segments.map(seg => (
          <div key={seg.key} className="fc-legend-row">
            <span className="fc-dot" style={{ background: seg.color, boxShadow: `0 0 5px ${seg.color}` }} />
            <span className="fc-legend-name">{STATUS_COLORS[seg.key].label}</span>
            <span className="fc-legend-count">{seg.count}</span>
          </div>
        ))}
        <div className="fc-seats">
          <span className="fc-seats-num">{totalSeats}</span>
          <span className="fc-seats-lbl">total seats</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TablesPage() {
  const [restaurants, setRestaurants]   = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [tables, setTables]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [loadingTables, setLoadingTables] = useState(false)
  const [activeTab, setActiveTab]       = useState('tables')
  const [showAddTable, setShowAddTable] = useState(false)
  const [newTable, setNewTable]         = useState({ tableNumber: '', capacity: '4' })
  const [saving, setSaving]             = useState(false)
  const [updatingId, setUpdatingId]     = useState(null)

  useEffect(() => { fetchRestaurants() }, [])
  useEffect(() => { if (selectedRestaurant) fetchTables(selectedRestaurant.id) }, [selectedRestaurant])

  const fetchRestaurants = async () => {
    try {
      const res      = await api.get('/admin/restaurants')
      const approved = (res.data.restaurants || []).filter(r => r.isApproved)
      setRestaurants(approved)
      if (approved.length > 0) setSelectedRestaurant(approved[0])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchTables = async (restaurantId) => {
    setLoadingTables(true)
    try {
      const res = await api.get(`/restaurants/${restaurantId}/tables`)
      setTables(res.data.tables || [])
    } catch (err) { console.error(err) }
    finally { setLoadingTables(false) }
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
    } catch (err) { alert(err.response?.data?.message || 'Failed to add table.') }
    finally { setSaving(false) }
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
            {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
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
            >{tab.label}</button>
          ))}
        </div>

        {/* ── Tables Tab ── */}
        {activeTab === 'tables' && (
          <div>
            {/* Floor Map + Chart panel */}
            <div className="fc-panel">
              <div className="fc-map-wrap">
                <div className="fc-map-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  Live Floor Map — {selectedRestaurant?.name}
                </div>
                <div className="fc-map-canvas">
                  {loadingTables
                    ? <div className="fc-map-loading">Loading floor plan...</div>
                    : <FloorMap tables={tables} restaurantId={selectedRestaurant?.id} />
                  }
                </div>
              </div>

              <div className="fc-sidebar">
                <div className="fc-sidebar-title">Capacity Overview</div>
                <CapacityChart tables={tables} />

                <div className="fc-stats">
                  <div className="fc-stat">
                    <span className="fc-stat-num" style={{ color: '#10b981' }}>
                      {tables.filter(t => t.status === 'available').reduce((s, t) => s + (t.capacity || 0), 0)}
                    </span>
                    <span className="fc-stat-lbl">free seats</span>
                  </div>
                  <div className="fc-stat">
                    <span className="fc-stat-num" style={{ color: '#f43f5e' }}>
                      {tables.filter(t => t.status === 'occupied').reduce((s, t) => s + (t.capacity || 0), 0)}
                    </span>
                    <span className="fc-stat-lbl">occupied seats</span>
                  </div>
                  <div className="fc-stat">
                    <span className="fc-stat-num" style={{ color: '#f59e0b' }}>
                      {tables.filter(t => t.status === 'reserved').reduce((s, t) => s + (t.capacity || 0), 0)}
                    </span>
                    <span className="fc-stat-lbl">reserved seats</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Table list */}
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
                      type="number" min="1" max="50"
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

        {activeTab === 'rmd' && selectedRestaurant && (
          <ReservationManager restaurantId={selectedRestaurant.id} />
        )}
        {activeTab === 'walkin' && selectedRestaurant && (
          <WalkinForm
            restaurantId={selectedRestaurant.id}
            tables={tables.filter(t => t.status === 'available')}
            onSuccess={() => { fetchTables(selectedRestaurant.id); setActiveTab('rmd') }}
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

  /* ── Floor Map + Chart Panel ─────────────────────── */
  .fc-panel { display:grid; grid-template-columns:1fr 220px; gap:16px; margin-bottom:24px; }
  
  .fc-map-wrap { background:#111118; border:1px solid #1e2030; border-radius:16px; overflow:hidden; }
  .fc-map-label { display:flex; align-items:center; gap:8px; padding:12px 16px; font-size:11px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; color:#475569; border-bottom:1px solid #1e2030; }
  .fc-map-canvas { height:320px; position:relative; }
  .fc-map-loading { display:flex; align-items:center; justify-content:center; height:100%; color:#334155; font-size:13px; }

  .fc-sidebar { background:#111118; border:1px solid #1e2030; border-radius:16px; padding:20px; display:flex; flex-direction:column; gap:16px; }
  .fc-sidebar-title { font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#475569; }

  .fc-chart-wrap { display:flex; flex-direction:column; align-items:center; gap:14px; }
  .fc-donut-wrap { position:relative; display:flex; align-items:center; justify-content:center; }
  .fc-donut-center { position:absolute; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .fc-donut-num { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#f1f5f9; line-height:1; }
  .fc-donut-lbl { font-size:10px; color:#475569; margin-top:2px; }

  .fc-legend { width:100%; display:flex; flex-direction:column; gap:8px; }
  .fc-legend-row { display:flex; align-items:center; gap:8px; }
  .fc-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .fc-legend-name { font-size:12px; color:#64748b; flex:1; }
  .fc-legend-count { font-size:13px; font-weight:700; color:#f1f5f9; font-family:'Syne',sans-serif; }

  .fc-seats { margin-top:4px; padding-top:12px; border-top:1px solid #1e2030; display:flex; align-items:baseline; gap:6px; }
  .fc-seats-num { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; color:#f43f5e; }
  .fc-seats-lbl { font-size:11px; color:#475569; }

  .fc-stats { display:flex; flex-direction:column; gap:10px; border-top:1px solid #1e2030; padding-top:14px; }
  .fc-stat { display:flex; align-items:baseline; gap:8px; }
  .fc-stat-num { font-family:'Syne',sans-serif; font-size:18px; font-weight:800; }
  .fc-stat-lbl { font-size:11px; color:#475569; }

  /* ── Table list ──────────────────────────────────── */
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

  @media (max-width:900px) { .fc-panel { grid-template-columns:1fr; } }
  @media (max-width:768px) { .p-root { padding:24px 16px; } .p-header { flex-direction:column; align-items:flex-start; gap:12px; } .t-add-grid { grid-template-columns:1fr; } }
`
