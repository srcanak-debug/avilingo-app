'use client'
import { useState, useEffect } from 'react'
import { CABIN_NORMAL_SAFETY_COURSE } from '@/lib/data/courses/cabin-normal-safety'
import { CABIN_RESOURCES } from '@/lib/data/cabin-resources'

interface Slide {
  id: number
  title: string
  content: string
  type: string
  bullets?: string[]
  mediaUrl?: string
  questions?: any[] // Support quiz slides
}

export default function LessonPlayer() {
  const [course] = useState<any>(CABIN_NORMAL_SAFETY_COURSE)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showResources, setShowResources] = useState(false)
  
  const lessons = course.slides 
    ? course.slides.map((s: any) => ({ id: s.id.toString(), title: s.title, ...s }))
    : course.outline.map((o: any, i: number) => ({ id: i.toString(), title: o.title, content: o.subpoints?.join('\n'), ...o }))

  const activeLesson = lessons[currentIndex]
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(Math.round(((currentIndex + 1) / lessons.length) * 100))
  }, [currentIndex, lessons.length])

  const handleNext = () => {
    if (currentIndex < lessons.length - 1) setCurrentIndex(prev => prev + 1)
  }

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1)
  }

  return (
    <div id="lesson-player-root" style={{ display: 'flex', height: '100%', minHeight: '650px', background: '#0f172a', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
      
      {/* Sidebar: Progressive Navigation */}
      <div style={{ width: '300px', background: 'rgba(2, 6, 23, 0.5)', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Cabin Masterclass</div>
          <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{course.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
             <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#10b981', transition: 'width 0.4s ease' }} />
             </div>
             <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{progress}%</span>
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {lessons.map((l: any, idx: number) => (
            <button 
              key={l.id} 
              onClick={() => setCurrentIndex(idx)}
              style={{ 
                width: '100%', padding: '10px 14px', borderRadius: '8px', 
                background: currentIndex === idx ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textAlign: 'left', marginBottom: '2px', transition: 'all 0.2s'
              }}
            >
              <div style={{ 
                width: '16px', height: '16px', borderRadius: '50%', 
                border: idx <= currentIndex ? 'none' : '2px solid rgba(255,255,255,0.2)',
                background: idx <= currentIndex ? '#10b981' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {idx <= currentIndex && <span style={{ fontSize: '9px', color: '#fff' }}>✓</span>}
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: currentIndex === idx ? '#fff' : 'rgba(255,255,255,0.5)' }}>{l.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, background: '#020617', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>SLIDE {currentIndex + 1} / {lessons.length}</span>
             <span style={{ color: '#fff', fontSize: '14px', fontWeight: 800 }}>{activeLesson.title}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
             <button onClick={handlePrev} disabled={currentIndex === 0} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, cursor: 'pointer', fontSize: '11px', opacity: currentIndex === 0 ? 0.3 : 1 }}>Previous</button>
             <button onClick={handleNext} disabled={currentIndex === lessons.length - 1} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '11px', opacity: currentIndex === lessons.length - 1 ? 0.3 : 1 }}>Next Slide</button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ 
            width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '48px', display: 'flex', flexDirection: 'column'
          }}>
             <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginBottom: '24px', borderLeft: '6px solid #3b82f6', paddingLeft: '24px' }}>{activeLesson.title}</h1>
             
             <div style={{ flex: 1, color: '#94a3b8', fontSize: '17px', lineHeight: 1.6 }}>
                <p>{activeLesson.content}</p>
                {activeLesson.bullets && (
                  <ul style={{ marginTop: '24px', listStyle: 'none', padding: 0 }}>
                    {activeLesson.bullets.map((b: string, i: number) => (
                      <li key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        <span style={{ color: '#3b82f6' }}>⚡</span> {b}
                      </li>
                    ))}
                  </ul>
                )}
                {activeLesson.type === 'quiz' && (
                  <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                    {activeLesson.questions.map((q: any, i: number) => (
                      <div key={i}>
                        <div style={{ fontWeight: 800, color: '#fff', marginBottom: '16px' }}>{q.q}</div>
                        {q.options.map((opt: string, j: number) => (
                          <button key={j} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: '#fff', textAlign: 'left', marginBottom: '8px', cursor: 'pointer' }}>{opt}</button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
             </div>

             <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 700 }}>EASA / ICAO COMPLIANT</span>
                <span style={{ color: '#3b82f6', fontSize: '11px', fontWeight: 800 }}>AVILINGO AI MASTERCLASS</span>
             </div>
          </div>
        </div>

        {/* Resource Overlay Panel */}
        {showResources && (
          <div style={{ 
            position: 'absolute', top: '70px', right: '24px', bottom: '90px', width: '350px', 
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', zIndex: 100, display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ color: '#fff', margin: 0, fontSize: '16px', fontWeight: 800 }}>Training Resources</h4>
              <button onClick={() => setShowResources(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {CABIN_RESOURCES.map(res => (
                <div key={res.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>{res.type}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{res.sizeMb}MB</span>
                  </div>
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>{res.title}</div>
                  <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '12px' }}>{res.description}</div>
                  <a href={res.url} download target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <button style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Download Asset</button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: '16px 32px', background: 'rgba(15, 23, 42, 0.98)', display: 'flex', alignItems: 'center', gap: '24px', position: 'relative' }}>
          <button onClick={handlePrev} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>⏮️</button>
          <button style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fff', border: 'none', color: '#000', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶️</button>
          <button onClick={handleNext} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>⏭️</button>
          
          <div style={{ flex: 1 }}>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
               <div style={{ width: `${progress}%`, height: '100%', background: '#3b82f6', borderRadius: '2px' }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
             <button onClick={() => setShowResources(!showResources)} style={{ background: showResources ? 'rgba(59, 130, 246, 0.2)' : 'none', border: 'none', color: showResources ? '#3b82f6' : '#fff', fontSize: '18px', cursor: 'pointer', opacity: 1, padding: '8px', borderRadius: '8px' }}>📂</button>
             <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>⛶</button>
          </div>
        </div>
      </div>
    </div>
  )
}

