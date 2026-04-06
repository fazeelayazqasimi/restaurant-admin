'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'

export default function DashboardLayout({ children }) {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) router.push('/login')
  }, [])

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
        .layout-root {
          display: flex;
          min-height: 100vh;
          background: #0a0a0f;
        }
        .layout-main {
          flex: 1;
          overflow-x: hidden;
          min-width: 0;
        }
        @media (max-width: 768px) {
          .layout-main { padding-top: 0; }
        }
      `}</style>
      <div className="layout-root">
        <Sidebar />
        <main className="layout-main">
          {children}
        </main>
      </div>
    </>
  )
}
