'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AdminHeaderProps {
  adminName: string;
  adminEmail: string;
}

export default function AdminHeader({ adminName, adminEmail }: AdminHeaderProps) {
  const [showProfile, setShowProfile] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // Clear cookies
    document.cookie = "adminId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "adminRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push('/login')
  }

  return (
    <header style={{
      height: '70px',
      background: '#fff',
      borderBottom: '1px solid var(--bdr)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0
    }}>
      {/* Search Bar */}
      <div style={{ position: 'relative', width: '300px' }}>
        <input 
          placeholder="Global search..." 
          style={{ 
            background: 'var(--off)', 
            border: 'none', 
            padding: '10px 16px 10px 40px',
            fontSize: '13px'
          }} 
        />
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Notifications */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <span style={{ fontSize: '20px' }}>🔔</span>
          <span style={{
            position: 'absolute', top: '-1px', right: '-2px', width: '8px', height: '8px',
            background: '#ef4444', borderRadius: '50%', border: '2px solid #fff'
          }} />
        </div>

        {/* Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "5px 12px 5px 6px",
              borderRadius: "24px",
              border: "1.5px solid var(--bdr)",
              background: "#fff",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "linear-gradient(135deg, var(--sky) 0%, var(--navy) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 800, color: "#fff",
            }}>
              {adminName?.charAt(0) || 'A'}
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--navy)", lineHeight: 1.2 }}>
                {adminName || 'Admin'}
              </div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--t3)" }}>
                Super Admin
              </div>
            </div>
            <span style={{ fontSize: '10px', opacity: 0.5 }}>▼</span>
          </button>

          {showProfile && (
            <>
              <div
                onClick={() => setShowProfile(false)}
                style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1001 }}
              />
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0, width: "220px",
                background: "#fff", borderRadius: "12px", boxShadow: "var(--sh)",
                border: "1px solid var(--bdr)", padding: "8px", zIndex: 1002
              }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--bdr)", marginBottom: "6px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--navy)" }}>{adminName}</div>
                  <div style={{ fontSize: "11px", color: "var(--t3)", wordBreak: "break-all" }}>{adminEmail}</div>
                </div>
                <button
                  style={{
                    display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px",
                    borderRadius: "8px", border: "none", background: "transparent", fontSize: "13px",
                    fontWeight: 600, color: "var(--t2)", cursor: "pointer", textAlign: "left", fontFamily: "var(--fb)"
                  }}
                >
                  👤 Profile Settings
                </button>
                <button
                  onClick={handleSignOut}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px",
                    borderRadius: "8px", border: "none", background: "transparent", fontSize: "13px",
                    fontWeight: 600, color: "#ef4444", cursor: "pointer", textAlign: "left", fontFamily: "var(--fb)"
                  }}
                >
                  🔓 Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
