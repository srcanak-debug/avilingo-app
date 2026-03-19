'use client'
import { useState, useEffect } from 'react'

export default function Virtual360() {
  const [aircraftType, setAircraftType] = useState('B737-800')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate VR Engine loading
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [aircraftType])

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid var(--bdr)', animation: 'drawerSlideIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>360° Aircraft Walkthrough</h2>
          <p style={{ fontSize: '14px', color: 'var(--t3)', margin: '4px 0 0' }}>Immersive VR familiarization for cabin crew and pilots.</p>
        </div>
        <select 
          value={aircraftType} 
          onChange={(e) => setAircraftType(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--bdr)', fontWeight: 700, background: 'var(--off)', cursor: 'pointer' }}
        >
          <option value="B737-800">Boeing 737-800</option>
          <option value="A320neo">Airbus A320neo</option>
          <option value="B787">Boeing 787 Dreamliner</option>
        </select>
      </div>

      <div style={{ position: 'relative', height: '500px', background: '#000', borderRadius: '20px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div className="vr-pulse" style={{ width: '60px', height: '60px', borderRadius: '50%', border: '4px solid var(--navy)', margin: '0 auto 20px', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
            <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Initializing VR {aircraftType} Environment...</div>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
             {/* Mock 360 Scene Overlay */}
             <div style={{ position: 'absolute', inset: 0, background: 'url(https://images.unsplash.com/photo-1544620347-c4fd4a3d5947?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.6 }}></div>
             
             <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', textAlign: 'center', color: '#fff' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🥽</div>
                  <div style={{ fontWeight: 800, fontSize: '18px' }}>Move to Look Around</div>
                  <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '13px' }}>Point at hotspots (🔴) to interact with cockpit controls or safety equipment.</p>
                </div>
             </div>

             {/* Dynamic UI Controls Overlay */}
             <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ background: 'rgba(0,0,0,0.6)', padding: '12px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                   <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Section</div>
                   <div style={{ color: '#fff', fontWeight: 700 }}>Aft Galley - Emergency Stowing</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                   <button style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>➕</button>
                   <button style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>➖</button>
                   <button style={{ height: '40px', padding: '0 20px', borderRadius: '20px', border: 'none', background: 'var(--navy)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Enter FULLSCREEN VR</button>
                </div>
             </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
