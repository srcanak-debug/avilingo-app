'use client'
import { useState, useEffect } from 'react'

interface Qualification {
  id: string
  user_name: string
  role: string
  cert_type: string
  expiry_date: string
  status: 'valid' | 'expiring' | 'expired'
}

export default function QualificationTracker() {
  const [quals, setQuals] = useState<Qualification[]>([
    { id: '1', user_name: 'Ahmet Yılmaz', role: 'Captain', cert_type: 'ATPL(A)', expiry_date: '2026-10-15', status: 'valid' },
    { id: '2', user_name: 'Ayşe Kaya', role: 'Cabin Crew', cert_type: 'Medical Class 2', expiry_date: '2026-04-20', status: 'expiring' },
    { id: '3', user_name: 'Mehmet Demir', role: 'ATC', cert_type: 'ELP Level 4', expiry_date: '2025-12-01', status: 'expired' },
  ])

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid var(--bdr)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Qualification Tracker</h2>
          <p style={{ fontSize: '14px', color: 'var(--t3)', margin: '4px 0 0' }}>Monitor certification and license compliance across the fleet.</p>
        </div>
        <button style={{ padding: '10px 20px', background: 'var(--navy)', color: '#fff', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
          + Add Certificate
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Active', value: 142, color: '#3b82f6' },
          { label: 'Expiring Soon', value: 8, color: '#f59e0b' },
          { label: 'Expired', value: 3, color: '#ef4444' }
        ].map(s => (
          <div key={s.label} style={{ padding: '16px', borderRadius: '12px', background: 'var(--off)', border: '1px solid var(--bdr)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--bdr)' }}>
              <th style={{ padding: '12px', fontSize: '12px', color: 'var(--t3)', textTransform: 'uppercase' }}>Personnel</th>
              <th style={{ padding: '12px', fontSize: '12px', color: 'var(--t3)', textTransform: 'uppercase' }}>Certificate</th>
              <th style={{ padding: '12px', fontSize: '12px', color: 'var(--t3)', textTransform: 'uppercase' }}>Expiry</th>
              <th style={{ padding: '12px', fontSize: '12px', color: 'var(--t3)', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '12px', fontSize: '12px', color: 'var(--t3)', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quals.map(q => (
              <tr key={q.id} style={{ borderBottom: '1px solid var(--bdr)' }}>
                <td style={{ padding: '16px 12px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{q.user_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--t3)' }}>{q.role}</div>
                </td>
                <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 600 }}>{q.cert_type}</td>
                <td style={{ padding: '16px 12px', fontSize: '14px' }}>{q.expiry_date}</td>
                <td style={{ padding: '16px 12px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '100px', 
                    fontSize: '11px', 
                    fontWeight: 700,
                    background: q.status === 'valid' ? '#ecfdf5' : q.status === 'expiring' ? '#fff7ed' : '#fef2f2',
                    color: q.status === 'valid' ? '#10b981' : q.status === 'expiring' ? '#f59e0b' : '#ef4444'
                  }}>
                    {q.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <button style={{ background: 'none', border: '1px solid var(--bdr)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Renew</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
