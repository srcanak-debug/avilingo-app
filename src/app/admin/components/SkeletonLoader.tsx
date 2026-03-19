'use client'

export const SkeletonBox = ({ width = '100%', height = '20px', borderRadius = '4px', marginBottom = '0' }) => (
  <div style={{
    width, height, borderRadius, marginBottom,
    background: 'linear-gradient(90deg, #f0f2f5 25%, #e6e9ef 50%, #f0f2f5 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-pulse 1.5s infinite linear'
  }} />
)

export const SkeletonStats = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
    {[1, 2, 3, 4].map(i => (
      <div key={i} style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid var(--bdr)' }}>
        <SkeletonBox width="40px" height="40px" borderRadius="10px" marginBottom="16px" />
        <SkeletonBox width="60%" height="24px" marginBottom="8px" />
        <SkeletonBox width="40%" height="16px" />
      </div>
    ))}
  </div>
)

export const SkeletonTable = () => (
  <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--bdr)', overflow: 'hidden' }}>
    <div style={{ padding: '20px', borderBottom: '1px solid var(--bdr)' }}>
      <SkeletonBox width="200px" height="24px" />
    </div>
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '20px', borderBottom: i < 5 ? '1px solid var(--bdr)' : 'none' }}>
        <SkeletonBox width="40px" height="40px" borderRadius="50%" />
        <div style={{ flex: 1 }}>
          <SkeletonBox width="40%" height="16px" marginBottom="8px" />
          <SkeletonBox width="25%" height="12px" />
        </div>
        <SkeletonBox width="80px" height="32px" borderRadius="8px" />
      </div>
    ))}
  </div>
)

const skeletonStyles = `
@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = skeletonStyles
  document.head.appendChild(style)
}
