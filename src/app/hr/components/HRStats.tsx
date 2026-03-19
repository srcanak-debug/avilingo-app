'use client'
import React from 'react'

interface HRStatsProps {
  candidatesCount: number
  examsCount: number
  certifiedCount: number
  passRate: number
}

export const HRStats: React.FC<HRStatsProps> = ({
  candidatesCount,
  examsCount,
  certifiedCount,
  passRate
}) => {
  const stats = [
    { label: 'Total Candidates', value: candidatesCount, color: '#5AAEDF' },
    { label: 'Exams Assigned', value: examsCount, color: '#DEAC50' },
    { label: 'Certified', value: certifiedCount, color: '#1AD18A' },
    { label: 'Pass Rate', value: `${passRate}%`, color: passRate >= 70 ? '#1AD18A' : '#EF4444' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {s.label}
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: s.color,
            fontFamily: 'var(--fm)'
          }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  )
}
