'use client'
import { useState } from 'react'
import api from '../services/api'

export default function WalkinForm({ restaurantId, tables, onSuccess }) {
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    tableId: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    guests: '2'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/reservations/walkin', {
        restaurantId,
        tableId: form.tableId,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        date: form.date,
        time: form.time,
        guests: parseInt(form.guests)
      })
      setSuccess('Walk-in booking created successfully!')
      setForm({
        customerName: '',
        customerPhone: '',
        tableId: '',
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        guests: '2'
      })
      if (onSuccess) onSuccess()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <>
      <style>{walkinStyles}</style>
      <div className="walkin-container">
        <div className="walkin-header">
          <h3>Walk-in Customer Booking</h3>
          <p>Add a manual booking for customers who walk in</p>
        </div>

        {success && <div className="walkin-success">{success}</div>}
        {error && <div className="walkin-error">{error}</div>}

        <form onSubmit={handleSubmit} className="walkin-form">
          <div className="walkin-grid">
            <div className="walkin-group">
              <label>Customer Name *</label>
              <input
                required
                type="text"
                placeholder="Full name"
                value={form.customerName}
                onChange={e => setField('customerName', e.target.value)}
              />
            </div>

            <div className="walkin-group">
              <label>Customer Phone *</label>
              <input
                required
                type="tel"
                placeholder="Phone number"
                value={form.customerPhone}
                onChange={e => setField('customerPhone', e.target.value)}
              />
            </div>

            <div className="walkin-group">
              <label>Table *</label>
              <select
                required
                value={form.tableId}
                onChange={e => setField('tableId', e.target.value)}
              >
                <option value="">Select a table</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.tableNumber} - {t.capacity} seats ({t.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="walkin-group">
              <label>Date *</label>
              <input
                required
                type="date"
                value={form.date}
                onChange={e => setField('date', e.target.value)}
              />
            </div>

            <div className="walkin-group">
              <label>Time *</label>
              <input
                required
                type="time"
                value={form.time}
                onChange={e => setField('time', e.target.value)}
              />
            </div>

            <div className="walkin-group">
              <label>Number of Guests *</label>
              <input
                required
                type="number"
                min="1"
                max="20"
                value={form.guests}
                onChange={e => setField('guests', e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="walkin-submit">
            {loading ? 'Creating...' : 'Create Walk-in Booking'}
          </button>
        </form>
      </div>
    </>
  )
}

const walkinStyles = `
  .walkin-container {
    background: #111118;
    border: 1px solid #1e2030;
    border-radius: 20px;
    padding: 24px;
  }
  .walkin-header {
    margin-bottom: 20px;
  }
  .walkin-header h3 {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 4px;
  }
  .walkin-header p {
    font-size: 13px;
    color: #64748b;
    margin: 0;
  }
  .walkin-success {
    background: rgba(16,185,129,0.08);
    color: #10b981;
    border: 1px solid rgba(16,185,129,0.2);
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 20px;
    font-size: 13px;
  }
  .walkin-error {
    background: rgba(244,63,94,0.08);
    color: #f43f5e;
    border: 1px solid rgba(244,63,94,0.2);
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 20px;
    font-size: 13px;
  }
  .walkin-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  .walkin-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .walkin-group label {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }
  .walkin-group input, .walkin-group select {
    background: #0d0f18;
    border: 1px solid #1e2030;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    color: #e2e8f0;
    font-family: 'DM Sans', sans-serif;
  }
  .walkin-group input:focus, .walkin-group select:focus {
    border-color: #f43f5e;
    outline: none;
  }
  .walkin-submit {
    width: 100%;
    padding: 12px;
    background: #f43f5e;
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .walkin-submit:hover {
    background: #e11d48;
  }
  .walkin-submit:disabled {
    background: #4b1b26;
    cursor: not-allowed;
  }
  @media (max-width: 640px) {
    .walkin-grid {
      grid-template-columns: 1fr;
    }
  }
`
