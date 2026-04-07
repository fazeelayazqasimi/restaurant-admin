'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'

export default function PendingRestaurantsPage() {
  const [pendingRestaurants, setPendingRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchPendingRestaurants()
  }, [])

  const fetchPendingRestaurants = async () => {
    try {
      const res = await api.get('/admin/pending-restaurants')
      setPendingRestaurants(res.data.pendingRestaurants)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    setProcessingId(id)
    try {
      // ✅ Same endpoint as RestaurantsPage
      await api.put(`/admin/restaurants/${id}/approve`)
      // ✅ Card hat jaye list se — re-fetch nahi, direct filter
      setPendingRestaurants(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.message || 'Server error'))
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id) => {
    if (!confirm('⚠️ Reject this restaurant? Owner account will be permanently deleted.')) return
    setProcessingId(id)
    try {
      // ✅ Same endpoint as RestaurantsPage (PUT, not DELETE)
      await api.put(`/admin/restaurants/${id}/reject`)
      // ✅ Card hat jaye list se
      setPendingRestaurants(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      alert('Failed to reject: ' + (err.response?.data?.message || 'Server error'))
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <span>Loading pending requests...</span>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Admin Console</p>
          <h1 style={styles.title}>Pending Restaurant Requests</h1>
          <p style={styles.subtitle}>Review and approve new restaurant registrations</p>
        </div>
        <div style={styles.countBadge}>
          {pendingRestaurants.length} pending
        </div>
      </div>

      {pendingRestaurants.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>✓</div>
          <h3 style={styles.emptyTitle}>All clear!</h3>
          <p style={styles.emptyText}>No pending restaurant requests at the moment.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {pendingRestaurants.map((restaurant) => (
            <div key={restaurant.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.restaurantIcon}>
                  <span>{restaurant.name?.charAt(0) || 'R'}</span>
                </div>
                <div style={styles.cardHeaderInfo}>
                  <h3 style={styles.restaurantName}>{restaurant.name}</h3>
                  <p style={styles.restaurantLocation}>📍 {restaurant.location}</p>
                </div>
                <div style={styles.pendingBadge}>
                  <span style={styles.pendingDot} />
                  Pending
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>🕐 Hours:</span>
                  <span style={styles.infoValue}>{restaurant.openingTime} — {restaurant.closingTime}</span>
                </div>
                {restaurant.description && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>📝 Description:</span>
                    <span style={styles.infoValue}>{restaurant.description}</span>
                  </div>
                )}
                <div style={styles.divider} />
                <div style={styles.ownerSection}>
                  <p style={styles.ownerTitle}>👤 Owner Details</p>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Name:</span>
                    <span style={styles.infoValue}>{restaurant.owner?.name}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Email:</span>
                    <span style={styles.infoValue}>{restaurant.owner?.email}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Phone:</span>
                    <span style={styles.infoValue}>{restaurant.owner?.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <button
                  style={styles.approveBtn}
                  onClick={() => handleApprove(restaurant.id)}
                  disabled={processingId === restaurant.id}
                >
                  {processingId === restaurant.id ? 'Processing...' : '✓ Approve'}
                </button>
                <button
                  style={styles.rejectBtn}
                  onClick={() => handleReject(restaurant.id)}
                  disabled={processingId === restaurant.id}
                >
                  {processingId === restaurant.id ? 'Processing...' : '✗ Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0f',
    padding: '40px 44px',
    fontFamily: "'DM Sans', sans-serif",
    color: '#e2e8f0',
  },
  loading: {
    minHeight: '100vh',
    background: '#0a0a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    color: '#64748b',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '2px solid #1e293b',
    borderTopColor: '#f43f5e',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: '40px',
  },
  eyebrow: {
    fontSize: '11px',
    fontWeight: '500',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#f43f5e',
    margin: '0 0 8px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#f1f5f9',
    margin: '0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#475569',
    marginTop: '8px',
  },
  countBadge: {
    background: '#f43f5e',
    padding: '8px 20px',
    borderRadius: '99px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    background: '#111118',
    border: '1px solid #1e2030',
    borderRadius: '20px',
    padding: '80px',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    background: 'rgba(16,185,129,0.1)',
    borderRadius: '99px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    color: '#10b981',
    margin: '0 auto 20px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#64748b',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '20px',
  },
  card: {
    background: '#111118',
    border: '1px solid #1e2030',
    borderRadius: '20px',
    overflow: 'hidden',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  cardHeader: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #1a1d2e',
  },
  restaurantIcon: {
    width: '48px',
    height: '48px',
    background: '#f43f5e',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: '16px',
    fontWeight: '700',
    margin: '0 0 4px',
  },
  restaurantLocation: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
  },
  pendingBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(245,158,11,0.1)',
    padding: '6px 12px',
    borderRadius: '99px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#f59e0b',
  },
  pendingDot: {
    width: '6px',
    height: '6px',
    background: '#f59e0b',
    borderRadius: '50%',
  },
  cardBody: {
    padding: '20px',
  },
  infoRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '10px',
    fontSize: '13px',
  },
  infoLabel: {
    width: '90px',
    color: '#64748b',
  },
  infoValue: {
    flex: 1,
    color: '#e2e8f0',
  },
  divider: {
    height: '1px',
    background: '#1a1d2e',
    margin: '16px 0',
  },
  ownerSection: {
    marginTop: '4px',
  },
  ownerTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    margin: '0 0 12px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  cardFooter: {
    padding: '16px 20px',
    borderTop: '1px solid #1a1d2e',
    display: 'flex',
    gap: '12px',
  },
  approveBtn: {
    flex: 1,
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.2)',
    padding: '10px',
    borderRadius: '10px',
    color: '#10b981',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  rejectBtn: {
    flex: 1,
    background: 'rgba(244,63,94,0.1)',
    border: '1px solid rgba(244,63,94,0.2)',
    padding: '10px',
    borderRadius: '10px',
    color: '#f43f5e',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
}

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`
  document.head.appendChild(style)
}
