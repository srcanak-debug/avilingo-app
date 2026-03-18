'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const sectionColors: Record<string, string> = {
  grammar: '#3A8ED0', reading: '#0A8870', writing: '#B8881A',
  speaking: '#B83040', listening: '#7C3AED',
}
const sectionLabels: Record<string, string> = {
  grammar: 'Grammar', reading: 'Reading', writing: 'Writing',
  speaking: 'Speaking', listening: 'Listening',
}
const cefrColors: Record<string,string> = {
  A1:'#6B7280', A2:'#9CA3AF', B1:'#3A8ED0', B2:'#0A8870', C1:'#B8881A', C2:'#7C3AED'
}

export default function CandidateResultPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [exam, setExam] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadResult() }, [])

  async function loadResult() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [
      { data: examData },
      { data: answerData },
      { data: gradeData }
    ] = await Promise.all([
      supabase.from('exams').select('*,exam_templates(*)').eq('id', examId).single(),
      supabase.from('exam_answers').select('*').eq('exam_id', examId),
      supabase.from('grades').select('*').eq('exam_id', examId)
    ])

    if (!examData || examData.candidate_id !== user.id) { router.push('/exam'); return }
    if (examData.status !== 'certified') { router.push(`/exam/${examId}/complete`); return }

    setExam(examData)
    setAnswers(answerData || [])
    setGrades(gradeData || [])
    setLoading(false)
  }

  const sectionScores = useMemo(() => {
    const scores: Record<string, { score: number; label: string }> = {}
    if (!exam) return scores

    // Auto-scored sections
    for (const section of ['grammar', 'reading', 'listening']) {
      if ((exam.exam_templates?.[`${section}_count`] || 0) === 0) continue
      const secAnswers = answers.filter(a => a.section === section)
      if (secAnswers.length === 0) continue
      const correct = secAnswers.filter(a => (a.auto_score || 0) >= 1).length
      scores[section] = { score: Math.round((correct / secAnswers.length) * 100), label: sectionLabels[section] }
    }

    // Human-graded sections
    for (const section of ['writing', 'speaking']) {
      if ((exam.exam_templates?.[`${section}_count`] || 0) === 0) continue
      const secGrades = grades.filter(g => g.section === section)
      if (secGrades.length === 0) continue
      const avg = secGrades.reduce((sum, g) => sum + (g.numeric_score || 0), 0) / secGrades.length
      scores[section] = { score: Math.round(avg), label: sectionLabels[section] }
    }
    return scores
  }, [exam, answers, grades])

  const feedbackList = useMemo(() => {
    return grades.filter(g => g.feedback && g.feedback.trim() !== '').map(g => ({
      section: g.section,
      text: g.feedback,
      date: g.graded_at
    }))
  }, [grades])

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#F3F4F6',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#6B7280',fontFamily:"'Inter',sans-serif"}}>Loading your results...</div>
    </div>
  )

  const passed = ['A1','A2','B1','B2','C1','C2'].indexOf(exam.final_cefr_score) >= ['A1','A2','B1','B2','C1','C2'].indexOf(exam.exam_templates?.passing_cefr)

  return (
    <div style={{minHeight:'100vh',background:'#F3F4F6',fontFamily:"'Inter',sans-serif",display:'flex',flexDirection:'column'}}>
      {/* Header */}
      <div style={{padding:'14px 28px',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#0A1628'}}>
        <span style={{fontSize:'16px',fontWeight:700,color:'#fff'}}>{exam.exam_templates?.name || 'Assessment Results'}</span>
        <button onClick={()=>router.push('/exam')} style={{padding:'6px 14px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.2)',background:'transparent',color:'#fff',fontSize:'13px',cursor:'pointer'}}>
          ← Dashboard
        </button>
      </div>

      <div style={{flex:1,padding:'40px 24px',maxWidth:'800px',margin:'0 auto',width:'100%'}}>
        
        {/* Main Score Card */}
        <div style={{background:'#fff',borderRadius:'20px',padding:'40px',textAlign:'center',boxShadow:'0 10px 40px rgba(0,0,0,0.05)',marginBottom:'24px'}}>
          <div style={{fontSize:'14px',fontWeight:600,color:'#6B7280',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'12px'}}>
            Final CEFR Level
          </div>
          <div style={{fontSize:'84px',fontWeight:900,color:cefrColors[exam.final_cefr_score]||'#111',lineHeight:1,fontFamily:"'Montserrat',sans-serif",marginBottom:'16px'}}>
            {exam.final_cefr_score}
          </div>
          <div style={{background:passed?'#F0FDF4':'#FEF2F2',border:`1px solid ${passed?'#BBF7D0':'#FECACA'}`,borderRadius:'12px',padding:'14px 24px',display:'inline-block',marginBottom:'32px'}}>
            <div style={{fontSize:'16px',fontWeight:700,color:passed?'#15803D':'#B91C1C'}}>
              {passed ? `✓ You meet the required level (${exam.exam_templates?.passing_cefr})` : `✗ Below the required level (${exam.exam_templates?.passing_cefr})`}
            </div>
            <div style={{fontSize:'13px',color:passed?'#16A34A':'#EF4444',marginTop:'4px'}}>Overall Score: {exam.final_numeric_score}%</div>
          </div>

          <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
            <button onClick={()=>router.push(`/exam/${exam.id}/certificate`)} style={{padding:'14px 28px',borderRadius:'12px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'15px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}>
              <span>🎓</span> View Official Certificate
            </button>
          </div>
        </div>

        {/* Section Scores */}
        <div style={{background:'#fff',borderRadius:'20px',padding:'32px',boxShadow:'0 10px 40px rgba(0,0,0,0.05)',marginBottom:'24px'}}>
          <h2 style={{fontSize:'18px',fontWeight:800,color:'#111',marginBottom:'24px',fontFamily:"'Montserrat',sans-serif"}}>Section Breakdown</h2>
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {Object.entries(sectionScores).map(([section, data]) => (
              <div key={section} style={{display:'flex',alignItems:'center',gap:'16px'}}>
                <div style={{width:'80px',fontSize:'14px',fontWeight:600,color:'#374151'}}>{data.label}</div>
                <div style={{flex:1,height:'14px',background:'#F3F4F6',borderRadius:'100px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${data.score}%`,background:sectionColors[section]||'#3A8ED0',borderRadius:'100px',transition:'width 1s ease-out'}} />
                </div>
                <div style={{width:'40px',textAlign:'right',fontSize:'15px',fontWeight:700,color:sectionColors[section]||'#3A8ED0'}}>{data.score}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluator Feedback */}
        {feedbackList.length > 0 && (
          <div style={{background:'#fff',borderRadius:'20px',padding:'32px',boxShadow:'0 10px 40px rgba(0,0,0,0.05)'}}>
            <h2 style={{fontSize:'18px',fontWeight:800,color:'#111',marginBottom:'24px',fontFamily:"'Montserrat',sans-serif"}}>Evaluator Feedback</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
              {feedbackList.map((f, i) => (
                <div key={i} style={{background:'#F9FAFB',borderRadius:'12px',padding:'20px',borderLeft:`4px solid ${sectionColors[f.section]||'#3A8ED0'}`}}>
                  <div style={{fontSize:'12px',fontWeight:700,color:sectionColors[f.section]||'#3A8ED0',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px'}}>
                    {f.section} Feedback
                  </div>
                  <div style={{fontSize:'14px',color:'#4B5563',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{f.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
