'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AssignExamPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  const [candidate, setCandidate] = useState<any>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const sectionColors: Record<string,string> = {
    grammar:'#3A8ED0', reading:'#0A8870', writing:'#B8881A', speaking:'#B83040', listening:'#7C3AED'
  }

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: userData }, { data: templateData }, { data: examData }] = await Promise.all([
      supabase.from('users').select('*,organizations(name)').eq('id', userId).single(),
      supabase.from('exam_templates').select('*').order('name'),
      supabase.from('exams').select('*,exam_templates(name)').eq('candidate_id', userId).order('created_at', { ascending: false })
    ])
    setCandidate(userData)
    setTemplates(templateData || [])
    setExams(examData || [])
    setLoading(false)
  }

  async function assignExam() {
    if (!selectedTemplate) return
    setSaving(true)
    const { error } = await supabase.from('exams').insert({
      candidate_id: userId,
      template_id: selectedTemplate,
      org_id: candidate?.org_id || null,
      status: 'pending'
    })
    if (error) { alert('Error: ' + error.message); setSaving(false); return }
    setSaving(false)
    setSelectedTemplate('')
    loadData()
  }

  const statusColor: Record<string,string> = {
    pending:'#FAEEDA', in_progress:'#E6F1FB', completed:'#EAF3DE',
    invalidated:'#FCEBEB', grading:'#F5F3FF', certified:'#EAF3DE'
  }
  const statusText: Record<string,string> = {
    pending:'Pending', in_progress:'In Progress', completed:'Submitted',
    invalidated:'Invalidated', grading:'Grading', certified:'Certified'
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'var(--off)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--fb)',color:'var(--t3)'}}>Loading...</div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--off)',fontFamily:'var(--fb)'}}>
      <div style={{background:'#fff',padding:'14px 28px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',gap:'12px'}}>
        <a href="/admin/users" style={{fontSize:'13px',color:'var(--sky)',textDecoration:'none'}}>← Users</a>
        <span style={{color:'var(--bdr)'}}>|</span>
        <h1 style={{fontFamily:'var(--fm)',fontSize:'17px',fontWeight:800,color:'var(--navy)',margin:0}}>Assign Exam</h1>
      </div>

      <div style={{maxWidth:'800px',margin:'0 auto',padding:'28px 24px'}}>
        <div style={{background:'#fff',borderRadius:'14px',padding:'20px',border:'1px solid var(--bdr)',marginBottom:'22px',display:'flex',alignItems:'center',gap:'16px'}}>
          <div style={{width:'48px',height:'48px',borderRadius:'50%',background:'#E6F1FB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:700,color:'var(--sky)',flexShrink:0}}>
            {(candidate?.full_name||candidate?.email||'?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'2px'}}>{candidate?.full_name||'Unnamed'}</div>
            <div style={{fontSize:'13px',color:'var(--t3)'}}>{candidate?.email} · {candidate?.organizations?.name||'No organization'}</div>
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:'14px',padding:'22px',border:'2px solid var(--sky)',marginBottom:'22px'}}>
          <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',marginBottom:'16px'}}>Assign New Exam</h3>
          <div style={{marginBottom:'16px'}}>
            <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'6px'}}>Select Exam Template</label>
            <select value={selectedTemplate} onChange={e=>setSelectedTemplate(e.target.value)} style={{padding:'10px 14px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)'}}>
              <option value="">— Choose a template —</option>
              {templates.map(t=>(
                <option key={t.id} value={t.id}>{t.name} · Pass: {t.passing_cefr} · {t.time_limit_mins}min</option>
              ))}
            </select>
          </div>

          {selectedTemplate && (() => {
            const t = templates.find(t=>t.id===selectedTemplate)
            if (!t) return null
            const sections = ['grammar','reading','writing','speaking','listening'].filter(s=>(t[`${s}_count`]||0)>0)
            return (
              <div style={{background:'var(--off)',borderRadius:'10px',padding:'14px',marginBottom:'16px'}}>
                <div style={{fontSize:'13px',fontWeight:600,color:'var(--navy)',marginBottom:'10px'}}>{t.name}</div>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  {sections.map(s=>(
                    <span key={s} style={{fontSize:'11px',fontWeight:700,padding:'3px 9px',borderRadius:'100px',background:sectionColors[s]+'20',color:sectionColors[s],textTransform:'capitalize'}}>
                      {s}: {t[`${s}_count`]}q ({t[`weight_${s}`]}%)
                    </span>
                  ))}
                  <span style={{fontSize:'11px',padding:'3px 9px',borderRadius:'100px',background:'#EAF3DE',color:'#27500A',fontWeight:600}}>Pass: {t.passing_cefr}</span>
                  <span style={{fontSize:'11px',padding:'3px 9px',borderRadius:'100px',background:'var(--sky3)',color:'var(--sky)',fontWeight:600}}>{t.time_limit_mins} min</span>
                </div>
              </div>
            )
          })()}

          <button onClick={assignExam} disabled={saving||!selectedTemplate} style={{padding:'10px 28px',borderRadius:'8px',border:'none',background:selectedTemplate?'var(--navy)':'rgba(0,0,0,0.1)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:selectedTemplate?'pointer':'not-allowed',fontFamily:'var(--fb)'}}>
            {saving?'Assigning...':'Assign Exam →'}
          </button>
        </div>

        <div>
          <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',marginBottom:'14px'}}>Exam History ({exams.length})</h3>
          {exams.length === 0 ? (
            <div style={{background:'#fff',borderRadius:'12px',padding:'32px',textAlign:'center',border:'1px solid var(--bdr)',color:'var(--t3)',fontSize:'13.5px'}}>No exams assigned yet.</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {exams.map(e=>(
                <div key={e.id} style={{background:'#fff',borderRadius:'12px',padding:'16px 20px',border:'1px solid var(--bdr)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:'14px',fontWeight:600,color:'var(--navy)',marginBottom:'2px'}}>{e.exam_templates?.name}</div>
                    <div style={{fontSize:'12px',color:'var(--t3)'}}>{new Date(e.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    {e.final_cefr_score && <span style={{fontSize:'18px',fontWeight:800,color:'#0A8870',fontFamily:'var(--fm)'}}>{e.final_cefr_score}</span>}
                    <span style={{fontSize:'11.5px',fontWeight:700,padding:'3px 10px',borderRadius:'100px',background:statusColor[e.status]||'#F1EFE8',color:'#333'}}>{statusText[e.status]||e.status}</span>
                    {e.status==='certified'&&(
                      <a href={`/exam/${e.id}/certificate`} style={{fontSize:'11.5px',fontWeight:600,padding:'4px 10px',borderRadius:'6px',border:'1.5px solid #BBF7D0',background:'#F0FDF4',color:'#14532D',textDecoration:'none'}}>View Certificate</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}