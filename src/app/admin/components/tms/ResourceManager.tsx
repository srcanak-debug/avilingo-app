'use client'
import { useState } from 'react'

interface Resource {
  id: string
  name: string
  type: 'simulator' | 'classroom' | 'online'
  status: 'available' | 'booked' | 'maintenance'
  current_booking?: {
    instructor: string
    time: string
  }
}

export default function ResourceManager() {
  const [resources, setResources] = useState<Resource[]>([
    { id: '1', name: 'B737-MAX SIM-1', type: 'simulator', status: 'booked', current_booking: { instructor: 'Capt. Smith', time: '09:00 - 13:00' } },
    { id: '2', name: 'Classroom A-102', type: 'classroom', status: 'available' },
    { id: '3', name: 'Virtual Room 4', type: 'online', status: 'available' },
    { id: '4', name: 'A320 NEO SIM-2', type: 'simulator', status: 'maintenance' },
  ])

  const icons = {
    simulator: '✈️',
    classroom: '🏫',
    online: '🌐'
  }

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid var(--bdr)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Resource Management</h2>
          <p style={{ fontSize: '14px', color: 'var(--t3)', margin: '4px 0 0' }}>Schedule simulators, classrooms, and online training sessions.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--bdr)', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Filter</button>
          <button style={{ padding: '10px 20px', background: 'var(--navy)', color: '#fff', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Book Resource</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {resources.map(r => (
          <div key={r.id} style={{ 
            padding: '20px', 
            borderRadius: '16px', 
            border: '1.5px solid var(--bdr)', 
            background: r.status === 'maintenance' ? 'var(--off)' : '#fff',
            position: 'relative',
            opacity: r.status === 'maintenance' ? 0.7 : 1
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '24px' }}>{icons[r.type]}</div>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 700, 
                padding: '4px 8px', 
                borderRadius: '6px',
                background: r.status === 'available' ? '#ecfdf5' : r.status === 'booked' ? '#eff6ff' : '#fef2f2',
                color: r.status === 'available' ? '#10b981' : r.status === 'booked' ? '#3b82f6' : '#ef4444',
                textTransform: 'uppercase'
              }}>
                {r.status}
              </span>
            </div>
            
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 4px' }}>{r.name}</h3>
            <div style={{ fontSize: '12px', color: 'var(--t3)', textTransform: 'capitalize', marginBottom: '16px' }}>{r.type} Resource</div>

            {r.current_booking ? (
              <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--off)', border: '1px solid var(--bdr)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--t3)', marginBottom: '4px' }}>CURRENT SESSION</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>{r.current_booking.instructor}</div>
                <div style={{ fontSize: '12px', color: 'var(--t3)' }}>{r.current_booking.time}</div>
              </div>
            ) : (
              <div style={{ padding: '12px', borderRadius: '10px', border: '1px dashed var(--bdr)', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--t3)' }}>No active bookings</span>
              </div>
            )}

            <button style={{ width: '100%', marginTop: '16px', padding: '10px', borderRadius: '8px', border: '1px solid var(--bdr)', background: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              View Schedule
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
