'use client'
import React from 'react'
import { statusColor, statusText, cefrColors } from './constants'

interface ExamResultsProps {
  exams: any[]
  onDownloadReport: (examId: string) => void
}

export const ExamResults: React.FC<ExamResultsProps> = ({ 
  exams, 
  onDownloadReport 
}) => {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
            {['Candidate', 'Assessment', 'Score', 'Status', 'Date', 'Security', 'Actions'].map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {exams.map((e, i) => (
            <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
              <td style={{ padding: '11px 16px', fontSize: '13px', color: '#fff' }}>{e.users?.full_name || e.users?.email || '—'}</td>
              <td style={{ padding: '11px 16px', fontSize: '12.5px', color: 'rgba(255,255,255,0.5)' }}>{e.exam_templates?.name}</td>
              <td style={{ padding: '11px 16px' }}>
                {e.final_cefr_score
                  ? <span style={{ fontSize: '16px', fontWeight: 800, color: cefrColors[e.final_cefr_score] || '#fff', fontFamily: 'var(--fm)' }}>{e.final_cefr_score}</span>
                  : <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>—</span>}
              </td>
              <td style={{ padding: '11px 16px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px', background: statusColor[e.status] || '#F1EFE8', color: '#333' }}>{statusText[e.status] || e.status}</span>
              </td>
              <td style={{ padding: '11px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{new Date(e.created_at).toLocaleDateString('en-GB')}</td>
              <td style={{ padding: '11px 16px' }}>
                {e.proctoring_events?.length > 0 ? (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚠️</span> {e.proctoring_events.length}
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>✓ Secure</span>
                )}
              </td>
              <td style={{ padding: '11px 16px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {e.status === 'certified' && <a href={`/admin/review/${e.id}`} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)', color: '#D97706', fontSize: '11.5px', fontWeight: 600, textDecoration: 'none' }}>Review</a>}
                  {e.status === 'certified' && <button onClick={() => onDownloadReport(e.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(26,209,138,0.3)', background: 'rgba(26,209,138,0.1)', color: '#1AD18A', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--fb)' }}>⬇ Report</button>}
                  {e.status === 'certified' && <a href={`/exam/${e.id}/certificate`} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(58,142,208,0.3)', background: 'rgba(58,142,208,0.1)', color: '#5AAEDF', fontSize: '11.5px', fontWeight: 600, textDecoration: 'none' }}>Certificate</a>}
                </div>
              </td>
            </tr>
          ))}
          {exams.length === 0 && <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13.5px' }}>No exams yet.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
