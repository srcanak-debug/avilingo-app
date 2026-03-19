'use client'
import React from 'react'
import { statusColor, statusText, cefrColors } from './constants'

interface CandidateManagementProps {
  candidates: any[]
  exams: any[]
  templates: any[]
  search: string
  onSearchChange: (val: string) => void
  showAddCandidate: boolean
  setShowAddCandidate: (val: boolean) => void
  newCandidate: { email: string; full_name: string; template_id: string }
  setNewCandidate: (val: any) => void
  onAddCandidate: () => void
  assigningExam: string | null
  setAssigningExam: (val: string | null) => void
  selectedTemplate: string
  setSelectedTemplate: (val: string) => void
  onAssignExam: (candidateId: string) => void
  onDownloadReport: (examId: string) => void
  saving: boolean
}

export const CandidateManagement: React.FC<CandidateManagementProps> = ({
  candidates,
  exams,
  templates,
  search,
  onSearchChange,
  showAddCandidate,
  setShowAddCandidate,
  newCandidate,
  setNewCandidate,
  onAddCandidate,
  assigningExam,
  setAssigningExam,
  selectedTemplate,
  setSelectedTemplate,
  onAssignExam,
  onDownloadReport,
  saving
}) => {
  const filtered = candidates.filter(
    c => !search || 
    c.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center' }}>
        <input 
          value={search} 
          onChange={e => onSearchChange(e.target.value)} 
          placeholder="Search candidates..." 
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px', fontFamily: 'var(--fb)', width: '260px' }} 
        />
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{filtered.length} candidates</span>
        <div style={{ flex: 1 }} />
        <button 
          onClick={() => setShowAddCandidate(!showAddCandidate)} 
          style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#3A8ED0', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--fb)' }}
        >
          + Add Candidate
        </button>
      </div>

      {showAddCandidate && (
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '18px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '5px' }}>Full Name *</label>
              <input value={newCandidate.full_name} onChange={e => setNewCandidate({ ...newCandidate, full_name: e.target.value })} placeholder="John Smith" style={{ padding: '9px 12px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '13px', fontFamily: 'var(--fb)', width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '5px' }}>Email *</label>
              <input type="email" value={newCandidate.email} onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })} placeholder="pilot@airline.com" style={{ padding: '9px 12px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '13px', fontFamily: 'var(--fb)', width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '5px' }}>Assign Exam (uses 1 credit)</label>
              <select value={newCandidate.template_id} onChange={e => setNewCandidate({ ...newCandidate, template_id: e.target.value })} style={{ padding: '9px 12px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '13px', fontFamily: 'var(--fb)', width: '100%' }}>
                <option value="">— No exam yet —</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={onAddCandidate} disabled={saving || !newCandidate.email || !newCandidate.full_name} style={{ padding: '8px 20px', borderRadius: '7px', border: 'none', background: '#3A8ED0', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--fb)' }}>
            {saving ? 'Adding...' : 'Add Candidate'}
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>👥</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>No candidates yet. Add your first candidate above.</div>
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
                {['Candidate', 'Exams', 'Latest Result', 'Security', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const candidateExams = exams.filter(e => e.candidate_id === c.id)
                const latest = candidateExams[0]
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(58,142,208,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#5AAEDF', flexShrink: 0 }}>
                          {(c.full_name || c.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>{c.full_name || '—'}</div>
                          <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.35)' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{candidateExams.length}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {latest ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {latest.final_cefr_score && <span style={{ fontSize: '16px', fontWeight: 800, color: cefrColors[latest.final_cefr_score] || '#fff', fontFamily: 'var(--fm)' }}>{latest.final_cefr_score}</span>}
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px', background: statusColor[latest.status] || '#F1EFE8', color: '#333' }}>{statusText[latest.status] || latest.status}</span>
                        </div>
                      ) : <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>No exams</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                      {latest?.proctoring_events?.length > 0 ? (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#EF4444', background: 'rgba(239, 68, 68, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>⚠️ {latest.proctoring_events.length} Flags</span>
                      ) : latest ? (
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>✓ Secure</span>
                      ) : null}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {assigningExam === c.id ? (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px', fontFamily: 'var(--fb)' }}>
                              <option value="">Choose template...</option>
                              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <button onClick={() => onAssignExam(c.id)} disabled={!selectedTemplate || saving} style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#3A8ED0', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--fb)' }}>Assign</button>
                            <button onClick={() => setAssigningExam(null)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--fb)' }}>Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => { setAssigningExam(c.id); setSelectedTemplate('') }} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--fb)' }}>Assign Exam</button>
                        )}
                        {latest?.status === 'certified' && (
                          <button onClick={() => onDownloadReport(latest.id)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(26,209,138,0.3)', background: 'rgba(26,209,138,0.1)', color: '#1AD18A', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--fb)' }}>⬇ Report</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
