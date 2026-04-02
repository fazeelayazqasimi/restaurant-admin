'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/restaurants',
    label: 'Restaurants',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
        <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/users',
    label: 'Users',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/owners',
    label: 'Restaurant Owners',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/reservations',
    label: 'Reservations',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/tables',
    label: 'Table Management',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    router.push('/login')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <style>{sidebarStyles}</style>
      
      <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {isMobileMenuOpen && isMobile && (
        <div className="mobile-overlay" onClick={closeMobileMenu} />
      )}

      <aside className={`sidebar ${isMobileMenuOpen && isMobile ? 'sidebar-mobile-open' : ''} ${isMobile ? 'sidebar-mobile' : ''}`}>
        
        {isMobile && (
          <button className="mobile-close-btn" onClick={closeMobileMenu}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}

        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
              <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
            </svg>
          </div>
          <div>
            <p className="sidebar-brand-name">TableBook</p>
            <p className="sidebar-brand-sub">Admin Console</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-nav-label">Navigation</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="sidebar-link-label">{item.label}</span>
                {isActive && <span className="sidebar-link-dot" />}
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-divider" />
          <button className="sidebar-logout" onClick={handleLogout}>
            <span className="sidebar-link-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            <span className="sidebar-link-label">Logout</span>
          </button>
        </div>

      </aside>
    </>
  )
}

const sidebarStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');

  .mobile-menu-btn {
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 1000;
    width: 40px;
    height: 40px;
    background: #0d0d13;
    border: 1px solid #161824;
    border-radius: 8px;
    display: none;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #f1f5f9;
  }
  .mobile-menu-btn:hover { background: #161824; }
  
  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 998;
    display: none;
  }
  
  .mobile-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    background: #161824;
    border: 1px solid #1e293b;
    border-radius: 6px;
    display: none;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #94a3b8;
    z-index: 1000;
  }
  .mobile-close-btn:hover {
    background: #1e293b;
    color: #f1f5f9;
  }

  .sidebar {
    width: 240px;
    min-height: 100vh;
    background: #0d0d13;
    border-right: 1px solid #161824;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    font-family: 'DM Sans', sans-serif;
    transition: transform 0.3s ease-in-out;
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 28px 22px 24px;
    border-bottom: 1px solid #161824;
  }
  .sidebar-brand-mark {
    width: 36px;
    height: 36px;
    background: #f43f5e;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
  .sidebar-brand-name {
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 2px;
  }
  .sidebar-brand-sub {
    font-size: 11px;
    color: #334155;
    margin: 0;
    text-transform: uppercase;
  }

  .sidebar-nav {
    flex: 1;
    padding: 20px 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .sidebar-nav-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #1e2842;
    padding: 0 10px;
    margin: 0 0 10px;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    color: #3d4f6b;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
  }
  .sidebar-link:hover {
    background: #13151f;
    color: #94a3b8;
  }
  .sidebar-link-active {
    background: rgba(244, 63, 94, 0.1);
    color: #f43f5e;
  }

  .sidebar-link-icon { display: flex; align-items: center; width: 18px; }
  .sidebar-link-label { flex: 1; }
  .sidebar-link-dot { width: 5px; height: 5px; border-radius: 50%; background: #f43f5e; }

  .sidebar-footer {
    padding: 0 14px 20px;
  }
  .sidebar-divider {
    height: 1px;
    background: #161824;
    margin-bottom: 16px;
  }
  .sidebar-logout {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    color: #3d4f6b;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
  }
  .sidebar-logout:hover {
    background: rgba(244, 63, 94, 0.08);
    color: #f43f5e;
  }

  @media (max-width: 768px) {
    .mobile-menu-btn { display: flex; }
    .mobile-overlay { display: block; }
    .sidebar-mobile {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 999;
      transform: translateX(-100%);
    }
    .sidebar-mobile-open { transform: translateX(0); }
    .mobile-close-btn { display: flex; }
    .sidebar-brand { padding: 20px 18px; }
    .sidebar-nav { padding: 16px 12px; }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    .sidebar { width: 220px; }
    .sidebar-brand { padding: 24px 18px; }
    .sidebar-brand-mark { width: 32px; height: 32px; }
    .sidebar-brand-name { font-size: 14px; }
  }
`
