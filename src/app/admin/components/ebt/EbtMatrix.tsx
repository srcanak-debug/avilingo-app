'use client'
import { useState } from 'react'

interface Competency {
  code: string
  name: string
  indicators: string[]
}

interface AssessmentRow {
  trainee: string
  instructor: string
  date: string
  aircraft: string
  scores: Record<string, number>
}

export default function EbtMatrix() {
  const competencies: Competency[] = [
    { code: 'APL', name: 'Application of Procedures', indicators: ['SOP Compliance', 'Checklist Usage'] },
    { code: 'COM', name: 'Communication', indicators: ['Clarity', 'Phraseology', 'Listening'] },
    { code: 'SAW', name: 'Situational Awareness', indicators: ['Spatial orientation', 'System monitoring'] },
    { code: 'FPA', name: 'Flight Path Management (Automation)', indicators: ['Mode selection', 'Management'] },
    { code: 'FPM', name: 'Flight Path Management (Manual)', indicators: ['Handling', 'Trim'] },
    { code: 'PSD', name: 'Problem Solving & Decision Making', indicators: ['Risk assessment', 'Option generation'] },
    { code: 'LTW', name: 'Leadership & Teamwork', indicators: ['Briefing', 'Coordination', 'Advocacy'] },
    { code: 'WKL', name: 'Workload Management', indicators: ['Prioritization', 'Task management'] },
  ]

  const [assessments] = useState<AssessmentRow[]>([
    { trainee: 'Capt. Ali Vural', instructor: 'JRE', date: '2026-03-10', aircraft: 'B737-MAX', scores: { 'APL': 4, 'COM': 5, 'SAW': 4, 'FPA': 5, 'FPM': 4, 'PSD': 4, 'LTW': 5, 'WKL': 4 } },
    { trainee: 'F/O Caner Ak', instructor: 'JRE', date: '2026-03-12', aircraft: 'B737-MAX', scores: { 'APL': 3, 'COM': 4, 'SAW': 4, 'FPA': 4, 'FPM': 3, 'PSD': 3, 'LTW': 4, 'WKL': 3 } },
  ])

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid var(--bdr)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>EBT Competency Matrix</h2>
          <p style={{ fontSize: '14px', color: 'var(--t3)', margin: '4px 0 0' }}>Data-driven performance tracking based on ICAO Competency Framework.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--bdr)', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Generate KPI Report</button>
          <button style={{ padding: '10px 20px', background: 'var(--navy)', color: '#fff', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>New Assessment</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--bdr)' }}>
          <thead>
            <tr style={{ background: 'var(--off)' }}>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid var(--bdr)', fontSize: '12px', fontWeight: 800 }}>Trainee / Date</th>
              {competencies.map(c => (
                <th key={c.code} style={{ padding: '12px', textAlign: 'center', border: '1px solid var(--bdr)', fontSize: '11px', fontWeight: 800 }}>
                  <div title={c.name}>{c.code}</div>
                </th>
              ))}
              <th style={{ padding: '12px', textAlign: 'center', border: '1px solid var(--bdr)', fontSize: '11px', fontWeight: 800 }}>AVG</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((a, i) => {
              const scoreVals = Object.values(a.scores)
              const avg = (scoreVals.reduce((acc, v) => acc + v, 0) / scoreVals.length).toFixed(1)
              return (
                <tr key={i}>
                  <td style={{ padding: '12px', border: '1px solid var(--bdr)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>{a.trainee}</div>
                    <div style={{ fontSize: '11px', color: 'var(--t3)' }}>{a.date} • {a.aircraft}</div>
                  </td>
                  {competencies.map(c => (
                    <td key={c.code} style={{ padding: '12px', textAlign: 'center', border: '1px solid var(--bdr)' }}>
                      <div style={{ 
                        width: '24px', height: '24px', borderRadius: '4px', margin: '0 auto',
                        background: a.scores[c.code] >= 4 ? '#ecfdf5' : a.scores[c.code] >= 3 ? '#fff7ed' : '#fef2f2',
                        color: a.scores[c.code] >= 4 ? '#10b981' : a.scores[c.code] >= 3 ? '#f59e0b' : '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800
                      }}>
                        {a.scores[c.code]}
                      </div>
                    </td>
                  ))}
                  <td style={{ padding: '12px', textAlign: 'center', border: '1px solid var(--bdr)', fontWeight: 800, color: 'var(--navy)' }}>{avg}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--bdr)', background: 'var(--off)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy)', marginBottom: '16px' }}>Performance Trends</h3>
          <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '10px', borderBottom: '1px solid var(--bdr)' }}>
            {[65, 80, 45, 90, 70, 85].map((h, i) => (
              <div key={i} style={{ flex: 1, height: h + '%', background: h > 75 ? '#10b981' : h > 50 ? '#3b82f6' : '#ef4444', borderRadius: '4px 4px 0 0' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--t3)', marginTop: '8px' }}>
            <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
          </div>
        </div>
        <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--bdr)', background: 'var(--off)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy)', marginBottom: '16px' }}>Competency Heatmap</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
             {competencies.map(c => (
               <div key={c.code} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--bdr)', background: '#fff' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--t3)' }}>{c.code}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy)' }}>{(Math.random() * 2 + 3).toFixed(1)}</div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}
