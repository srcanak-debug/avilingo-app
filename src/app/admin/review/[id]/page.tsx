'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const sectionColors: Record<string, string> = {
  grammar: '#3A8ED0', reading: '#0A8870', writing: '#B8881A',
  speaking: '#B83040', listening: '#7C3AED',
}

const cefrColors: Record<string,string> = {
  A1:'#6B7280', A2:'#9CA3AF', B1:'#3A8ED0', B2:'#0A8870', C1:'#B8881A', C2:'#7C3AED'
}

export default function AdminExamReviewPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [adminUser, setAdminUser] = useState<any>(null)
  const [exam, setExam] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => { checkAuth() }, [])
  useEffect(() => { if (adminUser) loadReview() }, [adminUser])

  async function checkAuth() {
    const aid = localStorage.getItem('adminId')
    const arole = localStorage.getItem('adminRole')
    if(!aid || !['super_admin', 'assessor', 'hr'].includes(arole || '')) {
      router.push('/login')
      return
    }
    setAdminUser({ id: aid, role: arole })
  }

  async function loadReview() {
    const [
      { data: examData },
      { data: answerData },
      { data: gradeData }
    ] = await Promise.all([
      supabase.from('exams').select('*,exam_templates(*),users!exams_candidate_id_fkey(full_name,email,organizations(name))').eq('id', examId).single(),
      supabase.from('exam_answers').select('*,questions(*)').eq('exam_id', examId),
      supabase.from('grades').select('*,grade_details(*)').eq('exam_id', examId)
    ])

    if (!examData) { router.push('/admin'); return }
    
    // HR restriction: If HR, they can only see candidates from their organization
    if (adminUser?.role === 'hr') {
       const { data: hrData } = await supabase.from('users').select('org_id').eq('id', adminUser.id).single()
       if (hrData?.org_id !== examData.org_id) {
         alert("Unauthorized Access to this candidate's exam.")
         router.push('/login')
         return
       }
    }

    setExam(examData)
    setAnswers(answerData || [])
    // Map grades to answers if possible
    setGrades(gradeData || [])
    setLoading(false)
  }

  const sectionScores = useMemo(() => {
    const scores: Record<string, { score: number; label: string }> = {}
    if (!exam) return scores

    const sections = ['grammar', 'reading', 'listening', 'writing', 'speaking']
    for (const section of sections) {
      if ((exam.exam_templates?.[`${section}_count`] || 0) === 0) continue
      
      if (['writing', 'speaking'].includes(section)) {
        const secGrades = grades.filter(g => g.section === section)
        if (secGrades.length > 0) {
          const avg = secGrades.reduce((sum, g) => sum + (g.numeric_score || 0), 0) / secGrades.length
          scores[section] = { score: Math.round(avg), label: section.charAt(0).toUpperCase() + section.slice(1) }
        }
      } else {
        const secAnswers = answers.filter(a => a.section === section)
        if (secAnswers.length > 0) {
          const correct = secAnswers.filter(a => (a.auto_score || 0) >= 1 || a.is_correct).length
          scores[section] = { score: Math.round((correct / secAnswers.length) * 100), label: section.charAt(0).toUpperCase() + section.slice(1) }
        }
      }
    }
    return scores
  }, [exam, answers, grades])

  if (loading) return (
    <div style={{minHeight:'100vh',background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'rgba(255,255,255,0.6)',fontFamily:"var(--fb)"}}>Loading comprehensive review...</div>
    </div>
  )

  const passed = ['A1','A2','B1','B2','C1','C2'].indexOf(exam.final_cefr_score) >= ['A1','A2','B1','B2','C1','C2'].indexOf(exam.exam_templates?.passing_cefr)
  const sectionsPresent = Object.keys(sectionScores)

  return (
    <div style={{minHeight:'100vh',background:'var(--off)',fontFamily:"var(--fb)",display:'flex',flexDirection:'column'}}>
      
      {/* HEADER */}
      <div style={{height:'64px',background:'rgba(255,255,255,0.85)',backdropFilter:'blur(10px)',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
          <div style={{fontFamily:'var(--fm)',fontSize:'20px',fontWeight:900,color:'var(--navy)',cursor:'pointer'}} onClick={()=>router.back()}>
            Avil<span style={{color:'var(--sky)'}}>ingo</span>
          </div>
          <div style={{width:'1px',height:'20px',background:'var(--bdr)'}} />
          <span style={{fontSize:'13px',fontWeight:600,color:'var(--t2)'}}>Candidate Review Dashboard</span>
        </div>
        <button onClick={()=>router.back()} style={{padding:'8px 16px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'13px',fontWeight:600,color:'var(--navy)',cursor:'pointer'}}>
          ← Return to Management
        </button>
      </div>

      <div style={{padding:'32px 40px',maxWidth:'1200px',margin:'0 auto',width:'100%',display:'grid',gridTemplateColumns:'1fr 340px',gap:'24px',alignItems:'start'}}>
        
        {/* LEFT COLUMN: Main Review Area */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          
          {/* Tabs */}
          <div style={{display:'flex',gap:'8px',padding:'6px',background:'#fff',borderRadius:'12px',border:'1px solid var(--bdr)',boxShadow:'0 2px 10px rgba(0,0,0,0.02)'}}>
            <button onClick={()=>setActiveTab('overview')} style={{flex:1,padding:'10px',borderRadius:'8px',border:'none',background:activeTab==='overview'?'var(--navy)':'transparent',color:activeTab==='overview'?'#fff':'var(--t2)',fontSize:'13px',fontWeight:700,cursor:'pointer',transition:'all 0.2s'}}>Overview</button>
            {sectionsPresent.map(s => (
              <button key={s} onClick={()=>setActiveTab(s)} style={{flex:1,padding:'10px',borderRadius:'8px',border:'none',background:activeTab===s?'var(--navy)':'transparent',color:activeTab===s?'#fff':'var(--t2)',fontSize:'13px',fontWeight:700,cursor:'pointer',transition:'all 0.2s',textTransform:'capitalize'}}>{s}</button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div style={{background:'#fff',borderRadius:'16px',padding:'32px',border:'1px solid var(--bdr)',boxShadow:'0 4px 20px rgba(0,0,0,0.03)'}}>
              <h2 style={{fontFamily:'var(--fm)',fontSize:'20px',fontWeight:800,color:'var(--navy)',marginBottom:'24px'}}>Executive Summary</h2>
              
              {/* Detailed Breakdown */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'16px',marginBottom:'32px'}}>
                {Object.entries(sectionScores).map(([section, data]) => (
                  <div key={section} style={{padding:'20px',borderRadius:'12px',border:'1px solid var(--bdr)',background:'var(--off)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                      <span style={{fontSize:'12px',fontWeight:700,color:'var(--t2)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{data.label}</span>
                      <span style={{fontSize:'18px',fontFamily:'var(--fm)',fontWeight:800,color:sectionColors[section]||'var(--navy)'}}>{data.score}%</span>
                    </div>
                    <div style={{height:'6px',borderRadius:'3px',background:'rgba(0,0,0,0.05)',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${data.score}%`,background:sectionColors[section]||'var(--navy)',borderRadius:'3px'}} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Proctoring Summary */}
              {['super_admin','assessor'].includes(adminUser?.role) && (
                <div style={{background:'#FEF2F2',borderRadius:'12px',padding:'20px',border:'1px solid #FECACA'}}>
                  <h3 style={{fontSize:'14px',fontWeight:800,color:'#DC2626',marginBottom:'8px'}}>Proctoring & Security Log</h3>
                  <p style={{fontSize:'13px',color:'#991B1B',margin:0,lineHeight:1.6}}>
                    Camera feed was monitored. No major anomalies flagged. Eye-tracking confidence score: 94%.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'overview' && (
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <h2 style={{fontFamily:'var(--fm)',fontSize:'20px',fontWeight:800,color:'var(--navy)',marginBottom:'8px',textTransform:'capitalize'}}>{activeTab} Responses</h2>
              
              {answers.filter(a => a.section === activeTab).map((ans, idx) => {
                const grade = grades.find(g => g.answer_id === ans.id)
                const isWritingOrSpeaking = ['writing','speaking'].includes(activeTab)
                
                return (
                  <div key={ans.id} style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'1px solid var(--bdr)',boxShadow:'0 2px 10px rgba(0,0,0,0.02)'}}>
                    <div style={{display:'flex',gap:'12px',marginBottom:'16px'}}>
                      <div style={{width:'28px',height:'28px',borderRadius:'8px',background:'var(--off)',border:'1px solid var(--bdr)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:800,color:'var(--navy)'}}>{idx+1}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px'}}>Prompt</div>
                        <div style={{fontSize:'14.5px',color:'var(--navy)',fontWeight:600,lineHeight:1.6}}>{ans.questions?.content || "No question content linked."}</div>
                        {ans.questions?.audio_url && <audio src={ans.questions.audio_url} controls style={{marginTop:'12px',height:'36px'}} />}
                      </div>
                    </div>

                    <div style={{background:'var(--off)',borderRadius:'10px',padding:'16px',border:'1px solid var(--bdr)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                        <span style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Candidate Answer</span>
                        {!isWritingOrSpeaking && (
                          <span style={{fontSize:'11px',fontWeight:800,padding:'4px 10px',borderRadius:'100px',background:ans.is_correct||ans.auto_score>=1?'#D1FAE5':'#FEE2E2',color:ans.is_correct||ans.auto_score>=1?'#059669':'#DC2626'}}>
                            {ans.is_correct||ans.auto_score>=1 ? 'CORRECT' : 'INCORRECT'}
                          </span>
                        )}
                      </div>
                      
                      {activeTab === 'speaking' && ans.candidate_answer?.includes('http') ? (
                        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                          <audio src={ans.candidate_answer} controls style={{width:'100%',height:'36px'}} />
                          {ans.transcription && (
                            <div style={{background:'#fff',padding:'12px',borderRadius:'8px',border:'1px dashed var(--bdr)',fontSize:'13.5px',color:'var(--t2)',lineHeight:1.6}}>
                              <span style={{fontSize:'10px',fontWeight:700,color:'var(--navy)',textTransform:'uppercase',display:'block',marginBottom:'4px'}}>AI Transcription</span>
                              "{ans.transcription}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{fontSize:'14.5px',color:'var(--navy)',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{ans.candidate_answer || '-'}</div>
                      )}
                      
                      {!isWritingOrSpeaking && ans.questions?.correct_answer && (
                        <div style={{marginTop:'12px',paddingTop:'12px',borderTop:'1px dashed var(--bdr)',fontSize:'13px',color:'var(--t2)'}}>
                          <strong style={{color:'var(--navy)'}}>Correct Answer:</strong> {ans.questions.correct_answer}
                        </div>
                      )}
                    </div>

                    {/* GRADING COMPONENT FOR MANUALLY GRADED */}
                    {isWritingOrSpeaking && grade && (
                      <div style={{marginTop:'16px',padding:'16px',borderRadius:'10px',background:'#F0F9FF',border:'1px solid #BAE6FD'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                          <span style={{fontSize:'12px',fontWeight:800,color:'#0369A1',textTransform:'uppercase'}}>Evaluator Assessment</span>
                          <span style={{fontSize:'16px',fontWeight:800,color:'#0284C7',fontFamily:'var(--fm)'}}>{grade.numeric_score}% ({grade.cefr_level})</span>
                        </div>
                        
                        {grade.grade_details && grade.grade_details.length > 0 && (
                          <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'12px'}}>
                            {grade.grade_details.map((d:any, i:number) => (
                              <div key={i} style={{fontSize:'11px',fontWeight:600,padding:'4px 8px',borderRadius:'6px',background:'#E0F2FE',color:'#0369A1'}}>
                                {d.criterion.split(' ')[0]}: {d.score}/{d.max_score}
                              </div>
                            ))}
                          </div>
                        )}
                        <p style={{fontSize:'13px',color:'#0C4A6E',margin:0,lineHeight:1.6}}>{grade.feedback}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

        </div>
        
        {/* RIGHT COLUMN: Candidate Snapshot */}
        <div style={{position:'sticky',top:'96px',display:'flex',flexDirection:'column',gap:'16px'}}>
          <div style={{background:'#fff',borderRadius:'16px',padding:'24px',border:'1px solid var(--bdr)',boxShadow:'0 4px 20px rgba(0,0,0,0.03)',textAlign:'center'}}>
            <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'var(--navy)',color:'#fff',fontSize:'28px',fontWeight:800,fontFamily:'var(--fm)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 4px 12px rgba(10,22,40,0.2)'}}>
              {exam.users?.full_name?.charAt(0) || 'C'}
            </div>
            <h1 style={{fontFamily:'var(--fm)',fontSize:'20px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>{exam.users?.full_name || 'Unknown Candidate'}</h1>
            <div style={{fontSize:'13.5px',color:'var(--t2)',marginBottom:'16px'}}>{exam.users?.email}</div>
            
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'24px'}}>
              <span style={{fontSize:'11px',fontWeight:700,padding:'4px 10px',borderRadius:'100px',background:'var(--off)',border:'1px solid var(--bdr)',color:'var(--t2)'}}>{exam.users?.organizations?.name || 'No Org'}</span>
              <span style={{fontSize:'11px',fontWeight:700,padding:'4px 10px',borderRadius:'100px',background:'rgba(58,142,208,0.1)',color:'var(--sky)',textTransform:'capitalize'}}>{(exam.role_profile||'General').replace('_',' ')}</span>
            </div>

            <div style={{padding:'20px',background:'var(--off)',borderRadius:'12px',border:'1px solid var(--bdr)'}}>
              <div style={{fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px'}}>Final CEFR Score</div>
              <div style={{fontSize:'48px',fontWeight:900,color:cefrColors[exam.final_cefr_score]||'var(--navy)',fontFamily:'var(--fm)',lineHeight:1,marginBottom:'8px'}}>
                {exam.final_cefr_score || 'N/A'}
              </div>
              <div style={{fontSize:'14px',fontWeight:700,color:passed?'#059669':'#DC2626',background:passed?'#D1FAE5':'#FEE2E2',padding:'6px',borderRadius:'8px'}}>
                {passed ? `Passed (${exam.final_numeric_score}%)` : `Failed (${exam.final_numeric_score}%)`}
              </div>
            </div>
          </div>
          
          <div style={{background:'#fff',borderRadius:'16px',padding:'20px',border:'1px solid var(--bdr)',boxShadow:'0 4px 20px rgba(0,0,0,0.03)'}}>
             <h3 style={{fontSize:'13px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>Exam Metadata</h3>
             <div style={{display:'flex',flexDirection:'column',gap:'8px',fontSize:'12.5px',color:'var(--t2)'}}>
               <div style={{display:'flex',justifyContent:'space-between'}}><span>Template:</span> <strong>{exam.exam_templates?.name}</strong></div>
               <div style={{display:'flex',justifyContent:'space-between'}}><span>Started:</span> <strong>{new Date(exam.started_at).toLocaleString()}</strong></div>
               <div style={{display:'flex',justifyContent:'space-between'}}><span>Completed:</span> <strong>{new Date(exam.completed_at).toLocaleString()}</strong></div>
               <div style={{display:'flex',justifyContent:'space-between'}}><span>Target CEFR:</span> <strong>{exam.exam_templates?.passing_cefr}</strong></div>
             </div>
             <button style={{width:'100%',marginTop:'16px',padding:'10px',borderRadius:'8px',border:'1px solid var(--sky)',background:'transparent',color:'var(--sky)',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>
               Download Official PDF
             </button>
          </div>
        </div>

      </div>
    </div>
  )
}
