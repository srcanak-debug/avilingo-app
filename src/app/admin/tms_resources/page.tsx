'use client'
import { SkeletonBox } from '../components/SkeletonLoader'

export default function PlaceholderPage() {
  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--fm)', fontSize: '24px', fontWeight: 900, color: 'var(--navy)', marginBottom: '8px', textTransform: 'capitalize' }}>
          tms resources
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--t3)' }}>This module is currently being migrated to the new architecture.</p>
      </div>
      
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--bdr)', padding: '40px', textAlign: 'center' }}>
        <SkeletonBox width="60px" height="60px" borderRadius="12px" marginBottom="20px" />
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '12px' }}>Module Coming Soon</div>
        <SkeletonBox width="40%" height="16px" marginBottom="8px" />
        <SkeletonBox width="30%" height="16px" />
      </div>
    </div>
  )
}
