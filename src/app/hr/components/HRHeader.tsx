'use client'
import React from 'react'

interface HRHeaderProps {
  orgName: string
  creditBalance: number
  onShowPurchase: () => void
  onSignOut: () => void
}

export const HRHeader: React.FC<HRHeaderProps> = ({ 
  orgName, 
  creditBalance, 
  onShowPurchase, 
  onSignOut 
}) => {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '14px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--fm)',
          fontSize: '18px',
          fontWeight: 900,
          color: '#fff',
          marginBottom: '1px'
        }}>
          Avil<span style={{ color: '#5AAEDF' }}>ingo</span> 
          <span style={{ fontWeight: 400, fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>
            HR Portal
          </span>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
          {orgName}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
            Credit Balance
          </div>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            color: creditBalance > 5 ? '#1AD18A' : '#EF4444', 
            fontFamily: 'var(--fm)' 
          }}>
            {creditBalance || 0}
          </div>
        </div>
        <button 
          onClick={onShowPurchase} 
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#3A8ED0',
            color: '#fff',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--fb)'
          }}
        >
          + Buy Credits
        </button>
        <button 
          onClick={onSignOut} 
          style={{
            padding: '7px 14px',
            borderRadius: '7px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'var(--fb)'
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
