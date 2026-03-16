'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CEFR_COLORS: Record<string,string> = {
  A1:'#6B7280', A2:'#6B7280', B1:'#3A8ED0', B2:'#0A8870', C1:'#B8881A', C2:'#7C3AED'
}

const CEFR_DESCRIPTORS: Record<string,string> = {
  C2: 'Mastery — Can understand with ease virtually everything heard or read.',
  C1: 'Advanced — Can express themselves fluently, spontaneously and precisely.',
  B2: 'Upper Intermediate — Can interact with a degree of fluency with native speakers.',
  B1: 'Intermediate — Can deal with most situations likely to arise whilst travelling.',
  A2: 'Elementary — Can communicate in simple and routine tasks.',
  A1: 'Beginner — Can understand and use familiar everyday expressions.',
}

export default function CertificatePage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const [exam, setExam] = useState<any>(null)
  const [cert, setCert] = useState<any>(null)
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)

  const sectionColors: Record<string,string> = {
    grammar:'#3A8ED0', reading:'#0A8870', writing:'#B8881A', speaking:'#B83040', listening:'#7C3AED'
  }

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: examData } = await supabase
      .from('exams')
      .select('*,exam_templates(*),users(full_name,email,organizations(name))')
      .eq('id', examId)
      .single()

    if (!examData) { router.push('/exam'); return }
    setExam(examData)

    const { data: certData } = await supabase
      .from('certificates')
      .select('*')
      .eq('exam_id', examId)
      .single()
    setCert(certData)

    const { data: gradesData } = await supabase
      .from('grades')
      .select('*')
      .eq('exam_id', examId)
    setGrades(gradesData || [])

    setLoading(false)
  }

  async function runScoring() {
    setScoring(true)
    try {
      const res = await fetch('/api/score-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId })
      })
      const data = await res.json()
      if (data.success) await loadData()
      else alert('Scoring error: ' + data.error)
    } catch (e) {
      alert('Error running scoring engine')
    }
    setScoring(false)
  }

  async function downloadPDF() {
    if (!exam) return
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    const cefrColor = CEFR_COLORS[exam.final_cefr_score] || '#0C1F3F'
    const passed = isPassing(exam.final_cefr_score, exam.exam_templates?.passing_cefr)

    // Background
    doc.setFillColor(12, 31, 63)
    doc.rect(0, 0, 297, 210, 'F')

    // Border
    doc.setDrawColor(58, 142, 208)
    doc.setLineWidth(1)
    doc.rect(10, 10, 277, 190)
    doc.setDrawColor(184, 136, 26)
    doc.setLineWidth(0.3)
    doc.rect(12, 12, 273, 186)

    // Header
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text('AVILINGO', 148.5, 35, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(90, 174, 223)
    doc.text('AVIATION ENGLISH PROFICIENCY CERTIFICATE', 148.5, 44, { align: 'center' })

    doc.setTextColor(184, 136, 26)
    doc.setFontSize(8)
    doc.text('ICAO DOCUMENT 9835 COMPLIANT · EASA · FAA', 148.5, 51, { align: 'center' })

    // Divider
    doc.setDrawColor(184, 136, 26)
    doc.setLineWidth(0.5)
    doc.line(40, 55, 257, 55)

    // This certifies
    doc.setTextColor(180, 180, 180)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('THIS IS TO CERTIFY THAT', 148.5, 65, { align: 'center' })

    // Candidate name
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    const candidateName = exam.users?.full_name || exam.users?.email || 'Candidate'
    doc.text(candidateName, 148.5, 78, { align: 'center' })

    // Has achieved
    doc.setTextColor(180, 180, 180)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('has demonstrated aviation English language proficiency at the level of', 148.5, 88, { align: 'center' })

    // CEFR Level — big
    const r = parseInt(cefrColor.slice(1,3), 16)
    const g = parseInt(cefrColor.slice(3,5), 16)
    const b = parseInt(cefrColor.slice(5,7), 16)
    doc.setTextColor(r, g, b)
    doc.setFontSize(52)
    doc.setFont('helvetica', 'bold')
    doc.text(exam.final_cefr_score || '—', 148.5, 112, { align: 'center' })

    // CEFR descriptor
    doc.setTextColor(200, 200, 200)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text(CEFR_DESCRIPTORS[exam.final_cefr_score] || '', 148.5, 121, { align: 'center' })

    // Pass/Fail badge
    doc.setFillColor(passed ? 26 : 239, passed ? 209 : 68, passed ? 138 : 68)
    doc.roundedRect(118.5, 126, 60, 10, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(passed ? '✓ PASS' : '✗ BELOW REQUIRED LEVEL', 148.5, 132.5, { align: 'center' })

    // Section scores
    const template = exam.exam_templates
    const sections = ['grammar','reading','listening','writing','speaking'].filter(s => (template?.[`${s}_count`]||0) > 0)
    const startX = 148.5 - ((sections.length * 40) / 2)

    sections.forEach((s, i) => {
      const x = startX + (i * 42)
      doc.setFillColor(255, 255, 255)
      doc.setFillColor(20, 40, 70)
      doc.roundedRect(x - 18, 144, 36, 22, 2, 2, 'F')
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(s.toUpperCase(), x, 150, { align: 'center' })
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(String(template?.[`weight_${s}`] || 0) + '%', x, 161, { align: 'center' })
    })

    // Footer
    doc.setDrawColor(184, 136, 26)
    doc.setLineWidth(0.3)
    doc.line(40, 172, 257, 172)

    doc.setTextColor(150, 150, 150)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const issueDate = cert?.issued_at ? new Date(cert.issued_at).toLocaleDateString('en-GB', {day:'2-digit',month:'long',year:'numeric'}) : new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'long',year:'numeric'})
    doc.text(`Issued: ${issueDate}`, 50, 180)
    doc.text(`Template: ${template?.name || 'ICAO Assessment'}`, 50, 186)
    doc.text(`Certificate ID: ${cert?.id?.substring(0,8).toUpperCase() || 'PENDING'}`, 200, 180)
    doc.text('Avilingo Havacılık Eğitim Ltd. Şti. · Antalya, Turkey · avilingo.co', 148.5, 192, { align: 'center' })

    doc.save(`Avilingo-Certificate-${candidateName.replace(/\s+/g,'-')}-${exam.final_cefr_score}.pdf`)
  }

  function isPassing(achieved: string, required: string): boolean {
    const order = ['A1','A2','B1','B2','C1','C2']
    return order.indexOf(achieved) >= order.indexOf(required)
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0C1F3F',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#fff',fontFamily:'var(--fb)'}}>Loading certificate...</div>
    </div>
  )

  const passed = exam?.final_cefr_score && isPassing(exam.final_cefr_score, exam.exam_templates?.passing_cefr)
  const cefrColor = CEFR_COLORS[exam?.final_cefr_score] || '#3A8ED0'
  const template = exam?.exam_templates
  const sections = ['grammar','reading','listening','writing','speaking'].filter(s => (template?.[`${s}_count`]||0) > 0)

  return (
    <div style={{minHeight:'100vh',background:'#0C1F3F',fontFamily:'var(--fb)',padding:'32px 24px'}}>
      <div style={{maxWidth:'760px',margin:'0 auto'}}>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'28px'}}>
          <div style={{fontFamily:'var(--fm)',fontSize:'20px',fontWeight:900,color:'#fff'}}>Avil<span style={{color:'#5AAEDF'}}>ingo</span></div>
          <button onClick={()=>router.push('/exam')} style={{padding:'7px 16px',borderRadius:'7px',border:'1px solid rgba(255,255,255,0.15)',background:'transparent',color:'rgba(255,255,255,0.5)',fontSize:'13px',cursor:'pointer',fontFamily:'var(--fb)'}}>← Back</button>
        </div>

        {!exam?.final_cefr_score ? (
          <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'16px',padding:'40px',textAlign:'center',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{fontSize:'32px',marginBottom:'16px'}}>⏳</div>
            <h2 style={{fontFamily:'var(--fm)',fontSize:'20px',fontWeight:800,color:'#fff',marginBottom:'8px'}}>Awaiting Final Grading</h2>
            <p style={{fontSize:'14px',color:'rgba(255,255,255,0.4)',marginBottom:'24px'}}>Speaking and Writing sections are being reviewed by an evaluator. Your certificate will be generated once all sections are graded.</p>
            {exam?.status === 'completed' && (
              <button onClick={runScoring} disabled={scoring} style={{padding:'11px 28px',borderRadius:'9px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                {scoring ? 'Calculating...' : 'Calculate Score (Admin)'}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Certificate Preview */}
            <div style={{background:'linear-gradient(135deg, #0C1F3F 0%, #1A3560 100%)',borderRadius:'20px',padding:'40px',border:'2px solid #3A8ED0',marginBottom:'20px',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,border:'1px solid rgba(184,136,26,0.3)',borderRadius:'18px',margin:'8px',pointerEvents:'none'}} />

              <div style={{textAlign:'center',marginBottom:'28px'}}>
                <div style={{fontFamily:'var(--fm)',fontSize:'26px',fontWeight:900,color:'#fff',letterSpacing:'2px',marginBottom:'4px'}}>AVILINGO</div>
                <div style={{fontSize:'11px',fontWeight:700,color:'#5AAEDF',letterSpacing:'3px',marginBottom:'4px'}}>AVIATION ENGLISH PROFICIENCY CERTIFICATE</div>
                <div style={{fontSize:'9px',color:'#B8881A',letterSpacing:'1.5px'}}>ICAO DOCUMENT 9835 · EASA · FAA COMPLIANT</div>
              </div>

              <div style={{textAlign:'center',marginBottom:'24px'}}>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'8px',letterSpacing:'1px'}}>THIS IS TO CERTIFY THAT</div>
                <div style={{fontFamily:'var(--fm)',fontSize:'28px',fontWeight:800,color:'#fff',marginBottom:'6px'}}>{exam.users?.full_name || exam.users?.email}</div>
                <div style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',marginBottom:'20px'}}>has demonstrated aviation English language proficiency at the level of</div>
                <div style={{fontFamily:'var(--fm)',fontSize:'72px',fontWeight:900,color:cefrColor,lineHeight:1,marginBottom:'8px'}}>{exam.final_cefr_score}</div>
                <div style={{fontSize:'13px',color:'rgba(255,255,255,0.5)',fontStyle:'italic',marginBottom:'14px'}}>{CEFR_DESCRIPTORS[exam.final_cefr_score]}</div>
                <span style={{fontSize:'13px',fontWeight:700,padding:'6px 20px',borderRadius:'100px',background:passed?'rgba(26,209,138,0.15)':'rgba(239,68,68,0.15)',color:passed?'#1AD18A':'#EF4444',border:'1px solid',borderColor:passed?'rgba(26,209,138,0.3)':'rgba(239,68,68,0.3)'}}>
                  {passed ? '✓ PASS' : '✗ BELOW REQUIRED LEVEL'} · Required: {template?.passing_cefr}
                </span>
              </div>

              <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'24px',flexWrap:'wrap'}}>
                {sections.map(s => (
                  <div key={s} style={{background:'rgba(255,255,255,0.05)',borderRadius:'8px',padding:'10px 14px',textAlign:'center',border:'1px solid rgba(255,255,255,0.08)',minWidth:'80px'}}>
                    <div style={{fontSize:'10px',color:sectionColors[s],textTransform:'uppercase',fontWeight:700,marginBottom:'3px'}}>{s}</div>
                    <div style={{fontSize:'16px',fontWeight:700,color:'#fff',fontFamily:'var(--fm)'}}>{template?.[`weight_${s}`]}%</div>
                  </div>
                ))}
              </div>

              <div style={{borderTop:'1px solid rgba(184,136,26,0.2)',paddingTop:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>
                  <div>Issued: {cert?.issued_at ? new Date(cert.issued_at).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}) : '—'}</div>
                  <div>Certificate: {cert?.id?.substring(0,8).toUpperCase()}</div>
                </div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',textAlign:'right'}}>
                  <div>Avilingo Havacılık Eğitim Ltd. Şti.</div>
                  <div>Antalya, Turkey · avilingo.co</div>
                </div>
              </div>
            </div>

            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={downloadPDF} style={{flex:1,padding:'13px',borderRadius:'10px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                ⬇ Download PDF Certificate
              </button>
              <button onClick={()=>router.push('/exam')} style={{padding:'13px 20px',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.15)',background:'transparent',color:'rgba(255,255,255,0.6)',fontSize:'14px',cursor:'pointer',fontFamily:'var(--fb)'}}>
                Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
