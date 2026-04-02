'use client'
import { useState, useEffect } from 'react'
import api from '../../services/api'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalReservations: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    cancelledReservations: 0,
    completedReservations: 0,
    noShowReservations: 0,
    pendingRestaurants: 0,
  })
  const [recentReservations, setRecentReservations] = useState([])
  const [todayReservations, setTodayReservations] = useState([])
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
      
      const users = usersRes.data?.users || []
      const restaurants = restaurantsRes.data?.restaurants || []
      
      // Fix reservations data extraction
      let reservations = []
      if (reservationsRes.data?.reservations) {
        reservations = reservationsRes.data.reservations
      } else if (Array.isArray(reservationsRes.data)) {
        reservations = reservationsRes.data
      } else {
        reservations = []
      }
      
      // Calculate stats
      const pending = reservations.filter(r => r.status === 'pending').length
      const confirmed = reservations.filter(r => r.status === 'confirmed').length
      const cancelled = reservations.filter(r => r.status === 'cancelled').length
      const completed = reservations.filter(r => r.status === 'completed').length
      const noShow = reservations.filter(r => r.status === 'no_show').length
      
      // Today's reservations
      const today = new Date().toISOString().split('T')[0]
      const todayList = reservations.filter(r => r.date === today)
      
      // Recent reservations (last 10, newest first)
      const sortedReservations = [...reservations].sort((a, b) => {
        if (a.date > b.date) return -1
        if (a.date < b.date) return 1
        return 0
      })
      const recent = sortedReservations.slice(0, 10)
      
      setStats({
        totalUsers: users.length,
        totalRestaurants: restaurants.length,
        totalReservations: reservations.length,
        pendingReservations: pending,
        confirmedReservations: confirmed,
        cancelledReservations: cancelled,
        completedReservations: completed,
        noShowReservations: noShow,
        pendingRestaurants: restaurants.filter(r => !r.isApproved).length,
      })
      
      setRecentReservations(recent)
      setTodayReservations(todayList)
      
    } catch (err) {
      console.error('Stats error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusStyle = (status) => {
    switch(status) {
      case 'pending': return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Pending' }
      case 'confirmed': return { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Confirmed' }
      case 'cancelled': return { bg: 'rgba(244,63,94,0.1)', color: '#f43f5e', label: 'Cancelled' }
      case 'completed': return { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Completed' }
      case 'no_show': return { bg: 'rgba(100,116,139,0.1)', color: '#64748b', label: 'No Show' }
      default: return { bg: 'rgba(100,116,139,0.1)', color: '#64748b', label: status || 'Unknown' }
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <div>Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '40px', color: '#e2e8f0' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ color: '#f43f5e', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Admin Console</p>
        <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '8px 0 0' }}>Dashboard Overview</h1>
        <p style={{ color: '#475569', marginTop: '8px' }}>Complete system summary and insights</p>
      </div>

      {/* Stats Grid - 4 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#111118', border: '1px solid #1e2030', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Total Users</div>
          <div style={{ fontSize: '40px', fontWeight: '800', marginTop: '8px' }}>{stats.totalUsers}</div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>Active accounts</div>
        </div>
        <div style={{ background: '#111118', border: '1px solid #1e2030', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Restaurants</div>
          <div style={{ fontSize: '40px', fontWeight: '800', marginTop: '8px' }}>{stats.totalRestaurants}</div>
          <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>{stats.pendingRestaurants} pending approval</div>
        </div>
        <div style={{ background: '#111118', border: '1px solid #1e2030', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Total Reservations</div>
          <div style={{ fontSize: '40px', fontWeight: '800', marginTop: '8px' }}>{stats.totalReservations}</div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>All time bookings</div>
        </div>
        <div style={{ background: '#111118', border: '1px solid #1e2030', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Pending Approvals</div>
          <div style={{ fontSize: '40px', fontWeight: '800', marginTop: '8px', color: '#f59e0b' }}>{stats.pendingRestaurants}</div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>Restaurants waiting</div>
        </div>
      </div>

      {/* Reservation Status Breakdown - 5 cards */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Reservation Status Breakdown</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <div style={{ background: '#111118', border: '1px solid #1e2030', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#f59e0b' }}>Pending</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>{stats.pendingReservations}</div>
          </div>
          <div style={{ background: '#111118', border: '1px solid #1e2030', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#10b981' }}>Confirmed</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>{stats.confirmedReservations}</div>
          </div>
          <div style={{ background: '#111118', border: '1px solid #1e2030', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#3b82f6' }}>Completed</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#3b82f6' }}>{stats.completedReservations}</div>
          </div>
          <div style={{ background: '#111118', border: '1px solid #1e2030', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#f43f5e' }}>Cancelled</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#f43f5e' }}>{stats.cancelledReservations}</div>
          </div>
          <div style={{ background: '#111118', border: '1px solid #1e2030', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>No Show</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#64748b' }}>{stats.noShowReservations}</div>
          </div>
        </div>
      </div>

      {/* Pending Restaurants Alert */}
      {stats.pendingRestaurants > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px', padding: '16px 20px', marginBottom: '28px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 2s infinite' }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: '500', color: '#fbbf24', margin: '0 0 4px' }}>{stats.pendingRestaurants} restaurant{stats.pendingRestaurants > 1 ? 's' : ''} awaiting approval</p>
            <a href="/dashboard/restaurants" style={{ fontSize: '12px', color: '#92400e', textDecoration: 'none' }}>Review now →</a>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Today's Reservations */}
        <div style={{ background: '#111118', border: '1px solid #1e2030', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #1a1d2e' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>📅 Today's Reservations</h2>
            <span style={{ fontSize: '11px', color: '#334155', background: '#0f1117', border: '1px solid #1e2030', padding: '4px 12px', borderRadius: '99px' }}>{todayReservations.length} today</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {todayReservations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#334155' }}>No reservations for today</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1d2e' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#334155' }}>Time</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#334155' }}>Customer</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#334155' }}>Restaurant</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#334155' }}>Guests</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#334155' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayReservations.map((r) => {
                    const style = getStatusStyle(r.status)
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #12141e' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '500' }}>{r.time}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.user?.name || 'Walk-in'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.restaurant?.name}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.guests}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: '600', background: style.bg, color: style.color }}>
                            {style.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Reservations */}
        <div style={{ background: '#111118', border: '1px solid #1e2030', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #1a1d2e' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>🕐 Recent Reservations</h2>
            <span style={{ fontSize: '11px', color: '#334155', background: '#0f1117', border: '1px solid #1e2030', padding: '4px 12px', borderRadius: '99px' }}>{recentReservations.length} entries</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {recentReservations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#334155' }}>No reservations found</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1d2e' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#334155' }}>ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#334155' }}>Customer</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#334155' }}>Restaurant</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#334155' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#334155' }}>Time</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#334155' }}>Guests</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#334155' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReservations.map((r) => {
                    const style = getStatusStyle(r.status)
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #12141e' }}>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>#{r.id}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '500' }}>{r.user?.name || 'Walk-in'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.restaurant?.name || 'Unknown'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.date}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.time}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.guests}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: '600', background: style.bg, color: style.color }}>
                            {style.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
