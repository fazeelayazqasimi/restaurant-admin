'use client'
import { useState, useEffect } from 'react'
import api from '../services/api'

export default function ReservationManager({ restaurantId }) {
  const [todayBookings, setTodayBookings] = useState([])
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [restaurantId])

  const fetchBookings = async () => {
    try {
      const res = await api.get(`/restaurants/${restaurantId}/reservations`)
      const allBookings = res.data.reservations || []
      
      const today = new Date().toISOString().split('T')[0]
      const todayList = allBookings.filter(b => b.date === today)
      const upcomingList = allBookings.filter(b => b.date > today)
      
      setTodayBookings(todayList)
      setUpcomingBookings(upcomingList)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (bookingId, status) => {
    try {
      await api.put(`/reservations/${bookingId}/status`, { status })
      fetchBookings()
    } catch (err) {
      alert('Failed to update status')
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'status-pending'
      case 'confirmed': return 'status-confirmed'
      case 'cancelled': return 'status-cancelled'
      case 'completed': return 'status-completed'
      case 'no_show': return 'status-no-show'
      default: return ''
    }
  }

  if (loading) {
    return <div className="rmd-loading">Loading dashboard...</div>
  }

  return (
    <>
      <style>{rmdStyles}</style>
      <div className="rmd-container">
        
        {/* Today's Bookings */}
        <div className="rmd-section">
          <div className="rmd-section-header">
            <h2>Today's Bookings</h2>
            <span className="rmd-count">{todayBookings.length}</span>
          </div>
          {todayBookings.length === 0 ? (
            <div className="rmd-empty">No bookings for today</div>
          ) : (
            <div className="rmd-bookings-list">
              {todayBookings.map(booking => (
                <div key={booking.id} className="rmd-booking-card">
                  <div className="rmd-booking-info">
                    <div className="rmd-booking-time">{booking.time}</div>
                    <div className="rmd-booking-details">
                      <div className="rmd-booking-name">{booking.user?.name || 'Walk-in'}</div>
                      <div className="rmd-booking-meta">{booking.guests} guests • Table {booking.table?.tableNumber}</div>
                    </div>
                  </div>
                  <div className="rmd-booking-status">
                    <span className={`rmd-status-badge ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="rmd-booking-actions">
                    {booking.status === 'pending' && (
                      <>
                        <button className="rmd-btn rmd-btn-confirm" onClick={() => updateStatus(booking.id, 'confirmed')}>
                          Accept
                        </button>
                        <button className="rmd-btn rmd-btn-reject" onClick={() => updateStatus(booking.id, 'cancelled')}>
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button className="rmd-btn rmd-btn-arrived" onClick={() => updateStatus(booking.id, 'completed')}>
                        Mark Arrived
                      </button>
                    )}
                    {booking.status === 'confirmed' && (
                      <button className="rmd-btn rmd-btn-cancel" onClick={() => updateStatus(booking.id, 'cancelled')}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Reservations */}
        <div className="rmd-section">
          <div className="rmd-section-header">
            <h2>Upcoming Reservations</h2>
            <span className="rmd-count">{upcomingBookings.length}</span>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="rmd-empty">No upcoming reservations</div>
          ) : (
            <div className="rmd-bookings-list">
              {upcomingBookings.map(booking => (
                <div key={booking.id} className="rmd-booking-card">
                  <div className="rmd-booking-info">
                    <div className="rmd-booking-time">{booking.date} • {booking.time}</div>
                    <div className="rmd-booking-details">
                      <div className="rmd-booking-name">{booking.user?.name || 'Walk-in'}</div>
                      <div className="rmd-booking-meta">{booking.guests} guests</div>
                    </div>
                  </div>
                  <div className="rmd-booking-status">
                    <span className={`rmd-status-badge ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}

const rmdStyles = `
  .rmd-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .rmd-section {
    background: #111118;
    border: 1px solid #1e2030;
    border-radius: 20px;
    overflow: hidden;
  }

  .rmd-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #1a1d2e;
  }
  .rmd-section-header h2 {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }
  .rmd-count {
    background: #1e2030;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    color: #64748b;
  }

  .rmd-bookings-list {
    padding: 8px 0;
  }

  .rmd-booking-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid #12141e;
    transition: background 0.15s;
  }
  .rmd-booking-card:hover {
    background: #13151f;
  }

  .rmd-booking-info {
    flex: 1;
  }
  .rmd-booking-time {
    font-size: 12px;
    color: #f43f5e;
    font-weight: 500;
    margin-bottom: 4px;
  }
  .rmd-booking-name {
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 2px;
  }
  .rmd-booking-meta {
    font-size: 12px;
    color: #475569;
  }

  .rmd-status-badge {
    display: inline-flex;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .status-pending { background: rgba(245,158,11,0.1); color: #f59e0b; }
  .status-confirmed { background: rgba(16,185,129,0.1); color: #10b981; }
  .status-cancelled { background: rgba(244,63,94,0.1); color: #f43f5e; }
  .status-completed { background: rgba(59,130,246,0.1); color: #3b82f6; }
  .status-no-show { background: rgba(100,116,139,0.1); color: #64748b; }

  .rmd-booking-actions {
    display: flex;
    gap: 8px;
  }
  .rmd-btn {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: none;
  }
  .rmd-btn-confirm { background: rgba(16,185,129,0.1); color: #10b981; }
  .rmd-btn-reject { background: rgba(244,63,94,0.1); color: #f43f5e; }
  .rmd-btn-arrived { background: rgba(59,130,246,0.1); color: #3b82f6; }
  .rmd-btn-cancel { background: rgba(244,63,94,0.1); color: #f43f5e; }

  .rmd-empty {
    text-align: center;
    padding: 48px 24px;
    color: #334155;
    font-size: 13px;
  }

  .rmd-loading {
    text-align: center;
    padding: 48px;
    color: #64748b;
  }
`
