'use client'
import { useState } from 'react'

interface CourseCategory {
  id: string
  name: string
  icon: string
  description: string
  courseCount: number
}

const AVIATION_CATEGORIES: CourseCategory[] = [
  { id: 'pilot', name: 'Pilot Courses', icon: '👨‍✈️', description: 'Type ratings, CRM, and ATPL refreshers.', courseCount: 12 },
  { id: 'cabin', name: 'Cabin Courses', icon: '💺', description: 'Safety, first aid, and service excellence.', courseCount: 8 },
  { id: 'technician', name: 'Technician Courses', icon: '⚙️', description: 'Maintenance, Part-66, and engine types.', courseCount: 15 },
  { id: 'ground', name: 'Ground Personnel', icon: '🏢', description: 'Check-in, security, and terminal ops.', courseCount: 6 },
  { id: 'handling', name: 'Handling Personnel', icon: '🚜', description: 'Ramp safety, pushback, and de-icing.', courseCount: 9 },
  { id: 'loadmaster', name: 'Loadmaster Courses', icon: '📦', description: 'Weight & balance and cargo loading.', courseCount: 4 },
  { id: 'manager', name: 'Manager Courses', icon: '📊', description: 'Leadership and SMS/Quality mgmt.', courseCount: 5 },
  { id: 'flightschool', name: 'Flight School', icon: '✈️', description: 'Ab-initio and basic theory modules.', courseCount: 22 },
  { id: 'dispatcher', name: 'Dispatcher Courses', icon: '📡', description: 'Flight planning and nav log prep.', courseCount: 7 },
]

export default function CategoryManager() {
  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid var(--bdr)', animation: 'drawerSlideIn 0.4s ease-out' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Course Categories</h2>
        <p style={{ fontSize: '14px', color: 'var(--t3)', margin: '4px 0 0' }}>Manage role-specific training cells across the ecosystem.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {AVIATION_CATEGORIES.map(cat => (
          <div key={cat.id} style={{ background: 'var(--off)', borderRadius: '16px', padding: '20px', border: '1px solid var(--bdr)', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '24px' }}>{cat.icon}</div>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '15px' }}>{cat.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--t3)' }}>{cat.courseCount} Active Courses</div>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--t3)', margin: 0, lineHeight: 1.4 }}>{cat.description}</p>
            <button style={{ width: '100%', marginTop: '16px', padding: '8px', borderRadius: '8px', border: '1px solid var(--bdr)', background: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Manage Content</button>
          </div>
        ))}
      </div>
    </div>
  )
}
