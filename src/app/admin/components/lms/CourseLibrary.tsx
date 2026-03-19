'use client'
import { useState } from 'react'
import { PILOT_COURSE_SEED } from '@/lib/data/pilot-seed'
import { WXR_2100_COURSE } from '@/lib/data/courses/boeing-wxr-2100'

interface Course {
  id: string
  title: string
  category: string
  format: 'SCORM' | 'Video' | 'PDF' | 'AI-Generated'
  duration: string
  enrolled: number
  status: 'active' | 'draft'
}

export default function CourseLibrary() {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: WXR_2100_COURSE.id,
      title: WXR_2100_COURSE.title,
      category: 'Pilot > General Subject',
      format: 'AI-Generated',
      duration: WXR_2100_COURSE.duration,
      enrolled: 0,
      status: 'active'
    },
    ...PILOT_COURSE_SEED.map((p, idx) => ({
      id: `p-${idx}`,
      title: p.title,
      category: 'Pilot Training',
      format: 'AI-Generated' as const,
      duration: p.duration,
      enrolled: Math.floor(Math.random() * 200) + 50,
      status: 'active' as const
    })),
    { id: '1', title: 'ETOPS Operations - Initial', category: 'Technical', format: 'SCORM', duration: '4h', enrolled: 120, status: 'active' },
    { id: '2', title: 'Crew Resource Management (CRM)', category: 'Soft Skills', format: 'Video', duration: '2h', enrolled: 450, status: 'active' },
    { id: '3', title: 'Safety Management Systems (SMS)', category: 'Safety', format: 'SCORM', duration: '3h', enrolled: 85, status: 'active' },
    { id: '4', title: 'Dangerous Goods Awareness', category: 'Regulatory', format: 'PDF', duration: '1.5h', enrolled: 310, status: 'active' },
  ])

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid var(--bdr)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>LMS Course Library</h2>
          <p style={{ fontSize: '14px', color: 'var(--t3)', margin: '4px 0 0' }}>Manage and assign aviation training content to your crew.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--bdr)', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Categories</button>
          <button style={{ padding: '10px 20px', background: 'var(--navy)', color: '#fff', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>+ Create Course</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {courses.map(course => (
          <div key={course.id} style={{ 
            borderRadius: '16px', 
            border: '1px solid var(--bdr)', 
            overflow: 'hidden',
            background: '#fff',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}>
            <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--navy) 0%, #334155 100%)', padding: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>{course.category}</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{course.duration}</span>
            </div>
            <div style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 12px', minHeight: '44px' }}>{course.title}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--t3)' }}>
                <span>Format: <strong>{course.format}</strong></span>
                <span>Enrolled: <strong>{course.enrolled}</strong></span>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                <button style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--bdr)', background: 'var(--off)', fontSize: '12px', fontWeight: 700 }}>Preview</button>
                <button style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: 'var(--navy)', color: '#fff', fontSize: '12px', fontWeight: 700 }}>Assign</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
