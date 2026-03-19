'use client'
import { useState } from 'react'

interface Participant {
  id: string
  name: string
  role: string
  muted: boolean
  handRaised: boolean
}

export default function LiveClassroom() {
  const [inSession, setInSession] = useState(false)
  const [participants] = useState<Participant[]>([
    { id: 'p1', name: 'Capt. Selim Kaya', role: 'Instructor', muted: false, handRaised: false },
    { id: 'p2', name: 'F/O Ahmet Yılmaz', role: 'Trainee', muted: true, handRaised: true },
    { id: 'p3', name: 'Canan Demir', role: 'Cabin Crew', muted: true, handRaised: false },
  ])

  return (
    <div style={{ height: 'calc(100vh - 200px)', display: 'flex', gap: '20px', animation: 'drawerSlideIn 0.4s ease-out' }}>
      {/* Main Classroom Area */}
      <div style={{ flex: 1, background: '#000', borderRadius: '20px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
         <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            {!inSession ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📹</div>
                <h3 style={{ color: '#fff', margin: 0 }}>Classroom ready: CRM Refresher #402</h3>
                <button onClick={() => setInSession(true)} style={{ marginTop: '20px', padding: '12px 32px', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Start Live Session</button>
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <div style={{ padding: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', color: '#fff', fontWeight: 800, marginBottom: '8px' }}>Instructor Cam</div>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>Real-time HD Stream Active</div>
                 </div>
              </div>
            )}
         </div>

         {/* Controls Bar */}
         <div style={{ height: '80px', background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <button style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', background: '#334155', color: '#fff', cursor: 'pointer' }}>🎙️</button>
            <button style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', background: '#334155', color: '#fff', cursor: 'pointer' }}>📷</button>
            <button style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', background: '#334155', color: '#fff', cursor: 'pointer' }}>🖥️</button>
            <button style={{ padding: '0 24px', height: '44px', borderRadius: '22px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 800, cursor: 'pointer' }} onClick={() => setInSession(false)}>End for All</button>
         </div>
      </div>

      {/* Sidebar (Participants & Chat) */}
      <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
         <div style={{ flex: 1, background: '#fff', borderRadius: '20px', border: '1px solid var(--bdr)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: 'var(--navy)' }}>Participants ({participants.length})</h4>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {participants.map(p => (
                 <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                       <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--off)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>{p.name[0]}</div>
                       <div>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--t3)' }}>{p.role}</div>
                       </div>
                    </div>
                    <span>{p.handRaised ? '✋' : ''}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  )
}
