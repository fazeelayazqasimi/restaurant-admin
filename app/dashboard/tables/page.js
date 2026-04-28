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

const TABLE_R = 28

const ROOM_ELEMENT_TYPES = [
  { type: 'bar',      label: 'Bar',          icon: '🍺', color: '#8b5cf6', w: 90,  h: 38 },
  { type: 'kitchen',  label: 'Kitchen',      icon: '👨‍🍳', color: '#f97316', w: 84,  h: 38 },
  { type: 'counter',  label: 'Cash Counter', icon: '💰', color: '#06b6d4', w: 94,  h: 38 },
  { type: 'entrance', label: 'Entrance',     icon: '🚪', color: '#84cc16', w: 64,  h: 38 },
  { type: 'washroom', label: 'Washroom',     icon: '🚻', color: '#64748b', w: 74,  h: 38 },
  { type: 'stage',    label: 'Stage',        icon: '🎤', color: '#ec4899', w: 100, h: 48 },
  { type: 'lounge',   label: 'Lounge',       icon: '🛋️', color: '#a78bfa', w: 94,  h: 48 },
  { type: 'exit',     label: 'Exit',         icon: '🚨', color: '#ef4444', w: 56,  h: 38 },
  { type: 'reception',label: 'Reception',    icon: '📋', color: '#14b8a6', w: 90,  h: 38 },
  { type: 'dj',       label: 'DJ Booth',     icon: '🎧', color: '#d946ef', w: 80,  h: 48 },
]

// ─── Storage helpers ──────────────────────────────────────────────────────────
function loadPositions(restaurantId, floorId) {
  try { return JSON.parse(localStorage.getItem(`floormap_${restaurantId}_f${floorId}`)) || {} }
  catch { return {} }
}
function savePositions(restaurantId, floorId, pos) {
  try { localStorage.setItem(`floormap_${restaurantId}_f${floorId}`, JSON.stringify(pos)) }
  catch {}
}
function loadRoomElements(restaurantId, floorId) {
  try { return JSON.parse(localStorage.getItem(`floormap_elements_${restaurantId}_f${floorId}`)) || [] }
  catch { return [] }
}
function saveRoomElements(restaurantId, floorId, elems) {
  try { localStorage.setItem(`floormap_elements_${restaurantId}_f${floorId}`, JSON.stringify(elems)) }
  catch {}
}
function loadFloors(restaurantId) {
  try {
    const f = JSON.parse(localStorage.getItem(`floors_${restaurantId}`))
    return f && f.length > 0 ? f : [{ id: 1, name: 'Ground Floor' }]
  }
  catch { return [{ id: 1, name: 'Ground Floor' }] }
}
function saveFloors(restaurantId, floors) {
  try { localStorage.setItem(`floors_${restaurantId}`, JSON.stringify(floors)) }
  catch {}
}

// ─── Collision helpers ────────────────────────────────────────────────────────
function getRoomElemRect(elem, canvas, getMapBounds) {
  const { ox, oy, mapW, mapH } = getMapBounds(canvas)
  const def = ROOM_ELEMENT_TYPES.find(d => d.type === elem.type) || { w: 80, h: 38 }
  const x = ox + elem.nx * mapW
  const y = oy + elem.ny * mapH
  return { x, y, w: def.w, h: def.h }
}

function tableRectFromPos(pos, cap, canvas, getMapBounds) {
  const { ox, oy, mapW, mapH } = getMapBounds(canvas)
  const x = ox + pos.nx * mapW
  const y = oy + pos.ny * mapH
  const tW = 52 + Math.min(cap || 4, 8) * 2
  const tH = 34
  const pad = 16
  return { x, y, w: tW + pad * 2, h: tH + pad * 2 }
}

function rectsOverlap(a, b) {
  return !(a.x + a.w / 2 < b.x - b.w / 2 ||
           a.x - a.w / 2 > b.x + b.w / 2 ||
           a.y + a.h / 2 < b.y - b.h / 2 ||
           a.y - a.h / 2 > b.y + b.h / 2)
}

// ─── FloorMap Component ───────────────────────────────────────────────────────
function FloorMap({ tables, restaurantId, floorId, floorName }) {
  const canvasRef    = useRef(null)
  const animFrameRef = useRef(null)
  const timeRef      = useRef(0)

  const positionsRef     = useRef({})
  const dragRef          = useRef(null)
  const elemDragRef      = useRef(null)
  const cursorRef        = useRef('default')
  const roomElemsRef     = useRef([])
  const [roomElements, setRoomElements] = useState([])
  const [showElemPanel, setShowElemPanel] = useState(false)
  const [showDeleteElem, setShowDeleteElem] = useState(null) // elem id hovered

  // Load elements and positions when floor changes
  useEffect(() => {
    const elems = loadRoomElements(restaurantId, floorId)
    setRoomElements(elems)
    roomElemsRef.current = elems
  }, [restaurantId, floorId])

  useEffect(() => { roomElemsRef.current = roomElements }, [roomElements])

  // ── Initialize table positions per floor ──────────────────────────────────
  useEffect(() => {
    const saved = loadPositions(restaurantId, floorId)
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
          nx: Math.max(0.06, Math.min(0.94, cellW * (col + 0.5) + jx)),
          ny: Math.max(0.06, Math.min(0.94, cellH * (row + 0.5) + jy)),
        }
      }
    })
    const ids = new Set(tables.map(t => t.id))
    Object.keys(positionsRef.current).forEach(k => { if (!ids.has(Number(k))) delete positionsRef.current[k] })
  }, [tables, restaurantId, floorId])

  // ── Canvas helpers ────────────────────────────────────────────────────────
  const getMapBounds = useCallback((canvas) => {
    const pad = 28
    return {
      ox: pad + 8, oy: pad + 24,
      mapW: canvas.width  - (pad + 8) * 2,
      mapH: canvas.height - pad - 24 - 16,
    }
  }, [])

  const nxToX = useCallback((nx, canvas) => {
    const { ox, mapW } = getMapBounds(canvas); return ox + nx * mapW
  }, [getMapBounds])

  const nyToY = useCallback((ny, canvas) => {
    const { oy, mapH } = getMapBounds(canvas); return oy + ny * mapH
  }, [getMapBounds])

  const pixelToNorm = useCallback((px, py, canvas) => {
    const { ox, oy, mapW, mapH } = getMapBounds(canvas)
    return {
      nx: Math.max(0.03, Math.min(0.97, (px - ox) / mapW)),
      ny: Math.max(0.03, Math.min(0.97, (py - oy) / mapH)),
    }
  }, [getMapBounds])

  // ── Hit tests ─────────────────────────────────────────────────────────────
  const hitTable = useCallback((px, py, canvas) => {
    for (const t of tables) {
      const pos = positionsRef.current[t.id]
      if (!pos) continue
      const { ox, oy, mapW, mapH } = getMapBounds(canvas)
      const x = ox + pos.nx * mapW
      const y = oy + pos.ny * mapH
      const tW = 52 + Math.min(t.capacity || 4, 8) * 2
      const tH = 34
      const hitPad = 14
      if (px >= x - tW / 2 - hitPad && px <= x + tW / 2 + hitPad &&
          py >= y - tH / 2 - hitPad && py <= y + tH / 2 + hitPad) return t.id
    }
    return null
  }, [tables, getMapBounds])

  const hitRoomElem = useCallback((px, py, canvas) => {
    const { ox, oy, mapW, mapH } = getMapBounds(canvas)
    for (const elem of [...roomElemsRef.current].reverse()) {
      const def = ROOM_ELEMENT_TYPES.find(d => d.type === elem.type) || { w: 80, h: 38 }
      const x = ox + elem.nx * mapW
      const y = oy + elem.ny * mapH
      if (px >= x - def.w / 2 - 6 && px <= x + def.w / 2 + 6 &&
          py >= y - def.h / 2 - 6 && py <= y + def.h / 2 + 6) return elem.id
    }
    return null
  }, [getMapBounds])

  // ── Check collision of table pos against all room elements ────────────────
  const collidesWithElement = useCallback((nx, ny, cap, canvas) => {
    const pos = { nx, ny }
    const tableRect = tableRectFromPos(pos, cap, canvas, getMapBounds)
    for (const elem of roomElemsRef.current) {
      const er = getRoomElemRect(elem, canvas, getMapBounds)
      if (rectsOverlap(tableRect, er)) return true
    }
    return false
  }, [getMapBounds])

  // ── Add room element ──────────────────────────────────────────────────────
  const addRoomElement = (type) => {
    const id = `elem_${Date.now()}`
    const updated = [...roomElemsRef.current, { id, type, nx: 0.5, ny: 0.2 }]
    setRoomElements(updated)
    roomElemsRef.current = updated
    saveRoomElements(restaurantId, floorId, updated)
    setShowElemPanel(false)
  }

  const removeRoomElement = (id) => {
    const updated = roomElemsRef.current.filter(e => e.id !== id)
    setRoomElements(updated)
    roomElemsRef.current = updated
    saveRoomElements(restaurantId, floorId, updated)
  }

  // ── Mouse / Touch events ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const getXY = (e) => {
      const rect   = canvas.getBoundingClientRect()
      const scaleX = canvas.width  / rect.width
      const scaleY = canvas.height / rect.height
      if (e.touches) return {
        px: (e.touches[0].clientX - rect.left) * scaleX,
        py: (e.touches[0].clientY - rect.top)  * scaleY,
      }
      return {
        px: (e.clientX - rect.left) * scaleX,
        py: (e.clientY - rect.top)  * scaleY,
      }
    }

    const onDown = (e) => {
      const { px, py } = getXY(e)
      // Check room element first (they are on top layer)
      const elemId = hitRoomElem(px, py, canvas)
      if (elemId != null) {
        e.preventDefault()
        const elem = roomElemsRef.current.find(el => el.id === elemId)
        elemDragRef.current = {
          elemId,
          offsetX: px - nxToX(elem.nx, canvas),
          offsetY: py - nyToY(elem.ny, canvas),
        }
        canvas.style.cursor = 'grabbing'
        return
      }
      // Then check table
      const id = hitTable(px, py, canvas)
      if (id == null) return
      e.preventDefault()
      const pos = positionsRef.current[id]
      dragRef.current = {
        tableId: id,
        offsetX: px - nxToX(pos.nx, canvas),
        offsetY: py - nyToY(pos.ny, canvas),
        lastValidNx: pos.nx,
        lastValidNy: pos.ny,
      }
      canvas.style.cursor = 'grabbing'
    }

    const onMove = (e) => {
      const { px, py } = getXY(e)

      // Moving a room element
      if (elemDragRef.current) {
        e.preventDefault()
        const { elemId, offsetX, offsetY } = elemDragRef.current
        const norm = pixelToNorm(px - offsetX, py - offsetY, canvas)
        const updated = roomElemsRef.current.map(el =>
          el.id === elemId ? { ...el, nx: norm.nx, ny: norm.ny } : el
        )
        roomElemsRef.current = updated
        return
      }

      // Moving a table
      if (dragRef.current) {
        e.preventDefault()
        const { tableId, offsetX, offsetY } = dragRef.current
        const norm = pixelToNorm(px - offsetX, py - offsetY, canvas)
        const t = tables.find(tb => tb.id === tableId)
        // Collision check
        if (!collidesWithElement(norm.nx, norm.ny, t?.capacity, canvas)) {
          positionsRef.current[tableId] = norm
          dragRef.current.lastValidNx = norm.nx
          dragRef.current.lastValidNy = norm.ny
        } else {
          // Snap back to last valid
          positionsRef.current[tableId] = {
            nx: dragRef.current.lastValidNx,
            ny: dragRef.current.lastValidNy,
          }
        }
        return
      }

      // Cursor hover
      const elemId = hitRoomElem(px, py, canvas)
      const tableId = hitTable(px, py, canvas)
      const next = (elemId != null || tableId != null) ? 'grab' : 'default'
      if (cursorRef.current !== next) { canvas.style.cursor = next; cursorRef.current = next }
    }

    const onUp = () => {
      if (elemDragRef.current) {
        // Save room element positions
        saveRoomElements(restaurantId, floorId, roomElemsRef.current)
        setRoomElements([...roomElemsRef.current])
        elemDragRef.current = null
        canvas.style.cursor = 'default'
        cursorRef.current = 'default'
        return
      }
      if (dragRef.current) {
        savePositions(restaurantId, floorId, positionsRef.current)
        dragRef.current = null
        canvas.style.cursor = 'default'
        cursorRef.current = 'default'
      }
    }

    const onDblClick = (e) => {
      const { px, py } = getXY(e)
      const elemId = hitRoomElem(px, py, canvas)
      if (elemId) {
        if (confirm('Remove this element from the floor?')) removeRoomElement(elemId)
      }
    }

    canvas.addEventListener('mousedown',  onDown)
    canvas.addEventListener('mousemove',  onMove)
    canvas.addEventListener('mouseup',    onUp)
    canvas.addEventListener('mouseleave', onUp)
    canvas.addEventListener('dblclick',   onDblClick)
    canvas.addEventListener('touchstart', onDown, { passive: false })
    canvas.addEventListener('touchmove',  onMove, { passive: false })
    canvas.addEventListener('touchend',   onUp)

    return () => {
      canvas.removeEventListener('mousedown',  onDown)
      canvas.removeEventListener('mousemove',  onMove)
      canvas.removeEventListener('mouseup',    onUp)
      canvas.removeEventListener('mouseleave', onUp)
      canvas.removeEventListener('dblclick',   onDblClick)
      canvas.removeEventListener('touchstart', onDown)
      canvas.removeEventListener('touchmove',  onMove)
      canvas.removeEventListener('touchend',   onUp)
    }
  }, [tables, restaurantId, floorId, hitTable, hitRoomElem, nxToX, nyToY, pixelToNorm, collidesWithElement])

  // ── Draw loop ─────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W   = canvas.width
    const H   = canvas.height
    timeRef.current += 0.012

    ctx.clearRect(0, 0, W, H)

    // Background grid
    ctx.strokeStyle = 'rgba(255,255,255,0.022)'
    ctx.lineWidth   = 1
    const gSize = 36
    for (let x = 0; x < W; x += gSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += gSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // Room boundary
    const bpad = 28
    ctx.strokeStyle = 'rgba(244,63,94,0.2)'
    ctx.lineWidth   = 1.5
    ctx.setLineDash([6, 8])
    ctx.strokeRect(bpad, bpad + 16, W - bpad * 2, H - bpad * 2 - 16)
    ctx.setLineDash([])

    // Floor label top-left
    ctx.font      = '600 11px "DM Sans", sans-serif'
    ctx.fillStyle = 'rgba(244,63,94,0.55)'
    ctx.fillText(`📍 ${floorName}  ·  drag tables & elements to position`, bpad + 8, bpad + 12)

    if (tables.length === 0 && roomElemsRef.current.length === 0) {
      ctx.font = '500 13px "DM Sans", sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.textAlign = 'center'
      ctx.fillText('Add tables or room elements to see floor map', W / 2, H / 2)
      ctx.textAlign = 'left'
      animFrameRef.current = requestAnimationFrame(draw)
      return
    }

    const { ox, oy, mapW, mapH } = getMapBounds(canvas)
    const layout = tables.map(t => ({ t, pos: positionsRef.current[t.id] })).filter(l => l.pos)

    // ── Draw Room Elements FIRST (below tables) ───────────────────────────
    roomElemsRef.current.forEach(elem => {
      const def = ROOM_ELEMENT_TYPES.find(d => d.type === elem.type) || { w: 80, h: 38, color: '#64748b', icon: '?', label: elem.type }
      const x   = ox + elem.nx * mapW
      const y   = oy + elem.ny * mapH
      const w   = def.w, h = def.h, r = 8

      const isElemDrag = elemDragRef.current?.elemId === elem.id

      // Shadow/glow
      ctx.shadowColor = def.color
      ctx.shadowBlur  = isElemDrag ? 22 : 10

      // Body
      ctx.fillStyle = isElemDrag ? '#1a1a2e' : '#12121c'
      ctx.beginPath()
      ctx.moveTo(x - w/2 + r, y - h/2)
      ctx.lineTo(x + w/2 - r, y - h/2); ctx.arcTo(x + w/2, y - h/2, x + w/2, y - h/2 + r, r)
      ctx.lineTo(x + w/2, y + h/2 - r); ctx.arcTo(x + w/2, y + h/2, x + w/2 - r, y + h/2, r)
      ctx.lineTo(x - w/2 + r, y + h/2); ctx.arcTo(x - w/2, y + h/2, x - w/2, y + h/2 - r, r)
      ctx.lineTo(x - w/2, y - h/2 + r); ctx.arcTo(x - w/2, y - h/2, x - w/2 + r, y - h/2, r)
      ctx.closePath()
      ctx.fill()

      // Border
      ctx.strokeStyle = def.color
      ctx.lineWidth   = isElemDrag ? 2 : 1.5
      ctx.stroke()

      ctx.shadowBlur = 0

      // Left accent bar
      ctx.fillStyle = def.color
      ctx.beginPath()
      ctx.moveTo(x - w/2, y - h/2 + r)
      ctx.arcTo(x - w/2, y - h/2, x - w/2 + r, y - h/2, r)
      ctx.lineTo(x - w/2 + 5, y - h/2)
      ctx.lineTo(x - w/2 + 5, y + h/2)
      ctx.lineTo(x - w/2 + r, y + h/2)
      ctx.arcTo(x - w/2, y + h/2, x - w/2, y + h/2 - r, r)
      ctx.closePath()
      ctx.fill()

      // Icon
      ctx.font         = `${Math.min(h * 0.5, 18)}px sans-serif`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(def.icon, x - w/2 + 5 + 18, y)

      // Label
      ctx.font      = `600 ${Math.min(h * 0.32, 12)}px "DM Sans", sans-serif`
      ctx.fillStyle = '#f1f5f9'
      ctx.fillText(def.label, x - w/2 + 5 + 36 + (w - 5 - 36) / 2, y - 3)

      // Hint
      ctx.font      = `400 9px "DM Sans", sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillText('drag · dbl-click remove', x - w/2 + 5 + 36 + (w - 5 - 36) / 2, y + 9)

      ctx.textAlign    = 'left'
      ctx.textBaseline = 'alphabetic'
    })

    // ── Connection lines between tables ───────────────────────────────────
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        const a = layout[i].pos, b = layout[j].pos
        const dx = a.nx - b.nx, dy = a.ny - b.ny
        const d  = Math.sqrt(dx * dx + dy * dy)
        if (d < 0.2) {
          const alpha = (0.2 - d) / 0.2 * 0.1
          ctx.strokeStyle = `rgba(100,116,139,${alpha})`
          ctx.lineWidth   = 1
          ctx.beginPath()
          ctx.moveTo(ox + a.nx * mapW, oy + a.ny * mapH)
          ctx.lineTo(ox + b.nx * mapW, oy + b.ny * mapH)
          ctx.stroke()
        }
      }
    }

    // ── Draw Tables ───────────────────────────────────────────────────────
    layout.forEach(({ t, pos }) => {
      const sc     = STATUS_COLORS[t.status] || STATUS_COLORS.available
      const x      = ox + pos.nx * mapW
      const y      = oy + pos.ny * mapH
      const cap    = t.capacity || 4
      const tW     = 52 + Math.min(cap, 8) * 2
      const tH     = 34
      const cW     = 13, cH = 9, cGap = 5, cRad = 3
      const isDrag = dragRef.current?.tableId === t.id

      const colR = sc.hex === '#10b981' ? '16,185,129' : sc.hex === '#f59e0b' ? '245,158,11' : '244,63,94'

      const rrect = (rx, ry, rw, rh, rr) => {
        ctx.beginPath()
        ctx.moveTo(rx + rr, ry)
        ctx.lineTo(rx + rw - rr, ry); ctx.arcTo(rx + rw, ry, rx + rw, ry + rr, rr)
        ctx.lineTo(rx + rw, ry + rh - rr); ctx.arcTo(rx + rw, ry + rh, rx + rw - rr, ry + rh, rr)
        ctx.lineTo(rx + rr, ry + rh); ctx.arcTo(rx, ry + rh, rx, ry + rh - rr, rr)
        ctx.lineTo(rx, ry + rr); ctx.arcTo(rx, ry, rx + rr, ry, rr)
        ctx.closePath()
      }

      if (isDrag) {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'
        ctx.lineWidth   = 1.5
        ctx.setLineDash([5, 5])
        rrect(x - tW / 2 - cGap - cH - 4, y - tH / 2 - cGap - cH - 4,
              tW + (cGap + cH + 4) * 2, tH + (cGap + cH + 4) * 2, 8)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Chairs
      const drawChair = (cx2, cy2, horiz) => {
        ctx.fillStyle   = `rgba(${colR},0.22)`
        if (horiz) rrect(cx2 - cH / 2, cy2 - cW / 2, cH, cW, cRad)
        else       rrect(cx2 - cW / 2, cy2 - cH / 2, cW, cH, cRad)
        ctx.fill()
        ctx.strokeStyle = `rgba(${colR},0.7)`
        ctx.lineWidth   = 1
        if (horiz) rrect(cx2 - cH / 2, cy2 - cW / 2, cH, cW, cRad)
        else       rrect(cx2 - cW / 2, cy2 - cH / 2, cW, cH, cRad)
        ctx.stroke()
      }

      const sideChairs  = Math.max(0, Math.floor((cap - 4) / 2))
      const topCount    = Math.min(cap, 2) + sideChairs
      const bottomCount = Math.min(Math.max(cap - 2, 0), 2) + sideChairs
      const leftCount   = cap > 4 + sideChairs * 2 ? 1 : 0
      const rightCount  = cap > 5 + sideChairs * 2 ? 1 : 0

      const topSlots = topCount || 1
      for (let c = 0; c < topSlots; c++) {
        drawChair(x - (tW * 0.6) / 2 + (tW * 0.6 / topSlots) * (c + 0.5), y - tH / 2 - cGap - cH / 2, false)
      }
      const botSlots = bottomCount || 1
      for (let c = 0; c < botSlots; c++) {
        drawChair(x - (tW * 0.6) / 2 + (tW * 0.6 / botSlots) * (c + 0.5), y + tH / 2 + cGap + cH / 2, false)
      }
      if (leftCount)  drawChair(x - tW / 2 - cGap - cH / 2, y, true)
      if (rightCount) drawChair(x + tW / 2 + cGap + cH / 2, y, true)

      // Table surface
      ctx.shadowColor = sc.hex
      ctx.shadowBlur  = isDrag ? 18 : 6
      ctx.fillStyle   = isDrag ? '#1c1c2a' : '#16161f'
      rrect(x - tW / 2, y - tH / 2, tW, tH, 6)
      ctx.fill()
      ctx.shadowBlur  = 0

      ctx.strokeStyle = isDrag ? '#fff' : sc.hex
      ctx.lineWidth   = isDrag ? 2 : 1.5
      rrect(x - tW / 2, y - tH / 2, tW, tH, 6)
      ctx.stroke()

      ctx.strokeStyle = `rgba(${colR},0.15)`
      ctx.lineWidth   = 1
      rrect(x - tW / 2 + 4, y - tH / 2 + 4, tW - 8, tH - 8, 3)
      ctx.stroke()

      ctx.font         = '700 11px "Syne", sans-serif'
      ctx.fillStyle    = '#f1f5f9'
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(t.tableNumber, x, y - 4)
      ctx.font      = '400 8px "DM Sans", sans-serif'
      ctx.fillStyle = `rgba(${colR},0.7)`
      ctx.fillText(`${cap}p`, x, y + 7)
      ctx.textAlign    = 'left'
      ctx.textBaseline = 'alphabetic'
    })

    animFrameRef.current = requestAnimationFrame(draw)
  }, [tables, floorName, getMapBounds])

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

      {/* Add Element Button */}
      <button
        className="fm-add-elem-btn"
        onClick={() => setShowElemPanel(v => !v)}
        title="Add room element"
      >
        {showElemPanel ? '✕' : '+ Element'}
      </button>

      {/* Element Panel */}
      {showElemPanel && (
        <div className="fm-elem-panel">
          <div className="fm-elem-panel-title">Add Room Element</div>
          <div className="fm-elem-grid">
            {ROOM_ELEMENT_TYPES.map(def => (
              <button
                key={def.type}
                className="fm-elem-item"
                style={{ '--ec': def.color }}
                onClick={() => addRoomElement(def.type)}
              >
                <span className="fm-elem-icon">{def.icon}</span>
                <span className="fm-elem-label">{def.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Element list (placed) */}
      {roomElements.length > 0 && (
        <div className="fm-placed-list">
          {roomElements.map(el => {
            const def = ROOM_ELEMENT_TYPES.find(d => d.type === el.type) || { icon: '?', label: el.type, color: '#64748b' }
            return (
              <div key={el.id} className="fm-placed-item" style={{ '--ec': def.color }}>
                <span>{def.icon} {def.label}</span>
                <button className="fm-placed-del" onClick={() => removeRoomElement(el.id)} title="Remove">✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Capacity Chart ───────────────────────────────────────────────────────────
function CapacityChart({ tables }) {
  const counts = {
    available: tables.filter(t => t.status === 'available').length,
    reserved:  tables.filter(t => t.status === 'reserved').length,
    occupied:  tables.filter(t => t.status === 'occupied').length,
  }
  const total = tables.length || 1
  const seats = {
    available: tables.filter(t => t.status === 'available').reduce((s, t) => s + (t.capacity || 0), 0),
    reserved:  tables.filter(t => t.status === 'reserved').reduce((s, t)  => s + (t.capacity || 0), 0),
    occupied:  tables.filter(t => t.status === 'occupied').reduce((s, t)  => s + (t.capacity || 0), 0),
  }
  const totalSeats = seats.available + seats.reserved + seats.occupied || 1
  const size = 88, stroke = 10, r = (size - stroke) / 2, circ = 2 * Math.PI * r, cx = size / 2, cy = size / 2

  const segments = [
    { key: 'available', color: '#10b981', count: counts.available },
    { key: 'reserved',  color: '#f59e0b', count: counts.reserved  },
    { key: 'occupied',  color: '#f43f5e', count: counts.occupied  },
  ]
  let offset = 0
  const arcs = segments.map(seg => {
    const frac = seg.count / total, dash = frac * circ
    const arc  = { ...seg, dash, offset, frac }
    offset += dash
    return arc
  })

  return (
    <div className="fc-chart-wrap">
      <div className="fc-donut-wrap">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2030" strokeWidth={stroke} />
          {arcs.map(a => a.frac > 0 && (
            <circle key={a.key} cx={cx} cy={cy} r={r} fill="none"
              stroke={a.color} strokeWidth={stroke}
              strokeDasharray={`${a.dash - 2} ${circ - a.dash + 2}`}
              strokeDashoffset={-a.offset} strokeLinecap="round" />
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

// ─── Floor Manager Modal ──────────────────────────────────────────────────────
function FloorManagerModal({ floors, onClose, onSave, restaurantId }) {
  const [list, setList]     = useState(floors)
  const [newName, setNewName] = useState('')

  const addFloor = () => {
    if (!newName.trim()) return
    const id = Date.now()
    setList(prev => [...prev, { id, name: newName.trim() }])
    setNewName('')
  }

  const removeFloor = (id) => {
    if (list.length <= 1) return alert('At least one floor is required.')
    if (!confirm('Remove this floor? All elements on it will be lost.')) return
    localStorage.removeItem(`floormap_${restaurantId}_f${id}`)
    localStorage.removeItem(`floormap_elements_${restaurantId}_f${id}`)
    setList(prev => prev.filter(f => f.id !== id))
  }

  const rename = (id, name) => setList(prev => prev.map(f => f.id === id ? { ...f, name } : f))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">🏢 Manage Floors</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {list.map((f, i) => (
            <div key={f.id} className="floor-row">
              <span className="floor-num">Floor {i + 1}</span>
              <input
                className="floor-name-input"
                value={f.name}
                onChange={e => rename(f.id, e.target.value)}
              />
              {list.length > 1 && (
                <button className="floor-del-btn" onClick={() => removeFloor(f.id)}>✕</button>
              )}
            </div>
          ))}
          <div className="floor-add-row">
            <input
              className="floor-name-input"
              placeholder="New floor name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addFloor()}
            />
            <button className="floor-add-btn" onClick={addFloor}>+ Add</button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-save" onClick={() => { onSave(list); onClose() }}>Save Floors</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TablesPage() {
  const [restaurants, setRestaurants]     = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [tables, setTables]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [loadingTables, setLoadingTables] = useState(false)
  const [activeTab, setActiveTab]         = useState('tables')
  const [showAddTable, setShowAddTable]   = useState(false)
  const [newTable, setNewTable]           = useState({ tableNumber: '', capacity: '4' })
  const [saving, setSaving]               = useState(false)
  const [updatingId, setUpdatingId]       = useState(null)

  // ── Floor state ───────────────────────────────────────────────────────────
  const [floors, setFloors]               = useState([{ id: 1, name: 'Ground Floor' }])
  const [activeFloor, setActiveFloor]     = useState(null)
  const [showFloorManager, setShowFloorManager] = useState(false)

  useEffect(() => { fetchRestaurants() }, [])

  useEffect(() => {
    if (selectedRestaurant) {
      fetchTables(selectedRestaurant.id)
      const f = loadFloors(selectedRestaurant.id)
      setFloors(f)
      setActiveFloor(f[0])
    }
  }, [selectedRestaurant])

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

  const handleSaveFloors = (updatedFloors) => {
    setFloors(updatedFloors)
    saveFloors(selectedRestaurant.id, updatedFloors)
    if (!updatedFloors.find(f => f.id === activeFloor?.id)) {
      setActiveFloor(updatedFloors[0])
    }
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
                {/* Floor selector bar */}
                <div className="fc-floor-bar">
                  <div className="fc-floor-tabs">
                    {floors.map((f, i) => (
                      <button
                        key={f.id}
                        className={`fc-floor-tab ${activeFloor?.id === f.id ? 'fc-floor-tab-active' : ''}`}
                        onClick={() => setActiveFloor(f)}
                      >
                        {i === 0 ? '🏠' : i === 1 ? '🏢' : '⬆️'} {f.name}
                      </button>
                    ))}
                  </div>
                  <button className="fc-manage-floors-btn" onClick={() => setShowFloorManager(true)}>
                    ⚙ Manage Floors
                  </button>
                </div>

                <div className="fc-map-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  Live Floor Map — {selectedRestaurant?.name} · {activeFloor?.name}
                </div>
                <div className="fc-map-canvas">
                  {loadingTables
                    ? <div className="fc-map-loading">Loading floor plan...</div>
                    : activeFloor && (
                      <FloorMap
                        tables={tables}
                        restaurantId={selectedRestaurant?.id}
                        floorId={activeFloor.id}
                        floorName={activeFloor.name}
                      />
                    )
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

                {/* Active floor info */}
                <div className="fc-floor-info">
                  <div className="fc-floor-info-label">Active Floor</div>
                  <div className="fc-floor-info-name">{activeFloor?.name}</div>
                  <div className="fc-floor-info-count">{floors.length} floor{floors.length > 1 ? 's' : ''} total</div>
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

        {/* Floor Manager Modal */}
        {showFloorManager && (
          <FloorManagerModal
            floors={floors}
            restaurantId={selectedRestaurant?.id}
            onClose={() => setShowFloorManager(false)}
            onSave={handleSaveFloors}
          />
        )}
      </div>
    </>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

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

  /* ── Floor Map Panel ──────────────────────────────── */
  .fc-panel { display:grid; grid-template-columns:1fr 230px; gap:16px; margin-bottom:24px; }

  .fc-map-wrap { background:#111118; border:1px solid #1e2030; border-radius:16px; overflow:hidden; }

  /* Floor tab bar */
  .fc-floor-bar { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:#0d0f18; border-bottom:1px solid #1e2030; gap:8px; flex-wrap:wrap; }
  .fc-floor-tabs { display:flex; gap:4px; flex-wrap:wrap; }
  .fc-floor-tab { padding:5px 13px; border-radius:8px; border:1px solid #1e2030; background:none; font-size:12px; font-weight:500; color:#475569; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
  .fc-floor-tab:hover { color:#94a3b8; border-color:#334155; }
  .fc-floor-tab-active { background:#1e2030; color:#f1f5f9; border-color:#334155; }
  .fc-manage-floors-btn { padding:5px 13px; border-radius:8px; border:1px solid rgba(244,63,94,0.3); background:rgba(244,63,94,0.07); font-size:12px; color:#f43f5e; cursor:pointer; font-family:'DM Sans',sans-serif; white-space:nowrap; transition:all 0.15s; }
  .fc-manage-floors-btn:hover { background:rgba(244,63,94,0.14); }

  .fc-map-label { display:flex; align-items:center; gap:8px; padding:10px 16px; font-size:11px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:#475569; border-bottom:1px solid #1e2030; }
  .fc-map-canvas { height:360px; position:relative; }
  .fc-map-loading { display:flex; align-items:center; justify-content:center; height:100%; color:#334155; font-size:13px; }

  /* Sidebar */
  .fc-sidebar { background:#111118; border:1px solid #1e2030; border-radius:16px; padding:20px; display:flex; flex-direction:column; gap:14px; }
  .fc-sidebar-title { font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#475569; }

  .fc-chart-wrap { display:flex; flex-direction:column; align-items:center; gap:12px; }
  .fc-donut-wrap { position:relative; display:flex; align-items:center; justify-content:center; }
  .fc-donut-center { position:absolute; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .fc-donut-num { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#f1f5f9; line-height:1; }
  .fc-donut-lbl { font-size:10px; color:#475569; margin-top:2px; }

  .fc-legend { width:100%; display:flex; flex-direction:column; gap:8px; }
  .fc-legend-row { display:flex; align-items:center; gap:8px; }
  .fc-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .fc-legend-name { font-size:12px; color:#64748b; flex:1; }
  .fc-legend-count { font-size:13px; font-weight:700; color:#f1f5f9; font-family:'Syne',sans-serif; }

  .fc-seats { margin-top:4px; padding-top:10px; border-top:1px solid #1e2030; display:flex; align-items:baseline; gap:6px; }
  .fc-seats-num { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; color:#f43f5e; }
  .fc-seats-lbl { font-size:11px; color:#475569; }

  .fc-stats { display:flex; flex-direction:column; gap:8px; border-top:1px solid #1e2030; padding-top:12px; }
  .fc-stat { display:flex; align-items:baseline; gap:8px; }
  .fc-stat-num { font-family:'Syne',sans-serif; font-size:18px; font-weight:800; }
  .fc-stat-lbl { font-size:11px; color:#475569; }

  .fc-floor-info { background:#0d0f18; border:1px solid #1e2030; border-radius:10px; padding:12px; }
  .fc-floor-info-label { font-size:10px; color:#475569; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:4px; }
  .fc-floor-info-name { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:#f1f5f9; }
  .fc-floor-info-count { font-size:11px; color:#475569; margin-top:2px; }

  /* ── Room Element UI (overlay) ───────────────────── */
  .fm-add-elem-btn {
    position:absolute; bottom:12px; right:12px;
    padding:7px 14px; border-radius:9px;
    border:1px solid rgba(244,63,94,0.35);
    background:rgba(244,63,94,0.1);
    color:#f43f5e; font-size:12px; font-weight:600;
    cursor:pointer; font-family:'DM Sans',sans-serif;
    backdrop-filter:blur(8px);
    transition:all 0.15s; z-index:10;
  }
  .fm-add-elem-btn:hover { background:rgba(244,63,94,0.2); }

  .fm-elem-panel {
    position:absolute; bottom:50px; right:12px;
    background:#13131e; border:1px solid #1e2030;
    border-radius:14px; padding:14px; width:260px;
    z-index:20; box-shadow:0 8px 40px rgba(0,0,0,0.6);
  }
  .fm-elem-panel-title { font-size:11px; color:#475569; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:10px; }
  .fm-elem-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
  .fm-elem-item {
    display:flex; align-items:center; gap:7px;
    padding:8px 10px; border-radius:9px;
    border:1px solid #1e2030; background:#0d0f18;
    color:#94a3b8; font-size:12px; font-weight:500;
    cursor:pointer; font-family:'DM Sans',sans-serif;
    transition:all 0.15s; text-align:left;
  }
  .fm-elem-item:hover { border-color:var(--ec); color:#f1f5f9; background:#111118; }
  .fm-elem-icon { font-size:15px; }
  .fm-elem-label { font-size:11px; }

  .fm-placed-list {
    position:absolute; top:12px; right:12px;
    display:flex; flex-direction:column; gap:5px;
    z-index:10; max-height:calc(100% - 60px); overflow-y:auto;
  }
  .fm-placed-item {
    display:flex; align-items:center; gap:8px;
    padding:5px 10px; border-radius:8px;
    border:1px solid var(--ec,#334155);
    background:rgba(13,15,24,0.85);
    backdrop-filter:blur(8px);
    font-size:11px; color:#94a3b8;
  }
  .fm-placed-del {
    background:none; border:none; color:#475569;
    cursor:pointer; font-size:11px; padding:0; line-height:1;
    margin-left:auto;
  }
  .fm-placed-del:hover { color:#f43f5e; }

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

  /* ── Floor Manager Modal ─────────────────────────── */
  .modal-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.75);
    display:flex; align-items:center; justify-content:center;
    z-index:999; backdrop-filter:blur(4px);
  }
  .modal-box {
    background:#111118; border:1px solid #1e2030;
    border-radius:20px; width:420px; max-width:95vw;
    box-shadow:0 24px 80px rgba(0,0,0,0.7);
    overflow:hidden;
  }
  .modal-header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px; border-bottom:1px solid #1e2030; }
  .modal-title { font-family:'Syne',sans-serif; font-size:17px; font-weight:800; color:#f1f5f9; }
  .modal-close { background:none; border:none; color:#475569; font-size:16px; cursor:pointer; padding:4px; }
  .modal-close:hover { color:#f43f5e; }

  .modal-body { padding:20px 24px; display:flex; flex-direction:column; gap:10px; max-height:320px; overflow-y:auto; }
  .floor-row { display:flex; align-items:center; gap:10px; }
  .floor-num { font-size:12px; color:#475569; min-width:54px; }
  .floor-name-input { flex:1; background:#0d0f18; border:1px solid #1e2030; border-radius:9px; padding:8px 12px; font-size:13px; color:#e2e8f0; font-family:'DM Sans',sans-serif; outline:none; }
  .floor-name-input:focus { border-color:#f43f5e; }
  .floor-del-btn { padding:6px 10px; background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.2); color:#f43f5e; border-radius:8px; cursor:pointer; font-size:13px; }
  .floor-del-btn:hover { background:rgba(244,63,94,0.2); }

  .floor-add-row { display:flex; gap:8px; margin-top:4px; padding-top:12px; border-top:1px solid #1e2030; }
  .floor-add-btn { padding:8px 16px; background:#f43f5e; color:#fff; border:none; border-radius:9px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; white-space:nowrap; }
  .floor-add-btn:hover { background:#e11d48; }

  .modal-footer { display:flex; gap:10px; justify-content:flex-end; padding:16px 24px; border-top:1px solid #1e2030; }
  .modal-cancel { padding:8px 18px; background:none; border:1px solid #1e2030; border-radius:10px; color:#64748b; font-size:13px; cursor:pointer; font-family:'DM Sans',sans-serif; }
  .modal-cancel:hover { border-color:#334155; color:#94a3b8; }
  .modal-save { padding:8px 20px; background:#f43f5e; color:#fff; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; }
  .modal-save:hover { background:#e11d48; }

  @media (max-width:900px) { .fc-panel { grid-template-columns:1fr; } }
  @media (max-width:768px) { .p-root { padding:24px 16px; } .p-header { flex-direction:column; align-items:flex-start; gap:12px; } .t-add-grid { grid-template-columns:1fr; } }
`
