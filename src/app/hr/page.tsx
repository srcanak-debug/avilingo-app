'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const statusColor: Record<string,string> = {
  pending:'#FAEEDA', in_progress:'#E6F1FB', completed:'#EAF3DE',
  invalidated:'#FCEBEB', grading:'#F5F3FF', certified:'#D1FAE5'
}
const statusText: Record<string,string> = {
  pending:'Pending', in_progress:'In Progress', completed:'Submitted',
  invalidated:'Invalidated', grading:'Grading', certified:'Certified'
}
const cefrColors: Record<string,string> = {
  A1:'#6B7280', A2:'#6B7280', B1:'#3A8ED0', B2:'#0A8870', C1:'#B8881A', C2:'#7C3AED'
}

export default function HRPortal() {
  const router = useRouter()
  const [hr, setHr] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [credits, setCredits] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'candidates'|'results'|'credits'|'reports'>('candidates')
  const [search, setSearch] = useState('')
  const [showAddCandidate, setShowAddCandidate] = useState(false)
  const [showPurchaseCredits, setShowPurchaseCredits] = useState(false)
  const [newCandidate, setNewCandidate] = useState({ email:'', full_name:'', template_id:'' })
  const [creditAmount, setCreditAmount] = useState(10)
  const [saving, setSaving] = useState(false)
  const [assigningExam, setAssigningExam] = useState<string|null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    let { data: userData } = await supabase
      .from('users')
      .select('*,organizations(*)')
      .eq('id', user.id)
      .single()
    if (!userData || !['hr_manager','super_admin'].includes(userData.role)) { router.push('/login'); return }
    
    // Auto-fix missing org_id for admins
    if (!userData.org_id) {
      const { data: orgsq } = await supabase.from('organizations').select('*').limit(1)
      if (orgsq && orgsq.length > 0) {
        await supabase.from('users').update({ org_id: orgsq[0].id }).eq('id', userData.id)
        userData.org_id = orgsq[0].id
        userData.organizations = orgsq[0]
      } else {
        const { data: newOrg } = await supabase.from('organizations').insert({ name: 'Avilingo HQ (Test)', credit_balance: 100 }).select().single()
        if (newOrg) {
          await supabase.from('users').update({ org_id: newOrg.id }).eq('id', userData.id)
          userData.org_id = newOrg.id
          userData.organizations = newOrg
        }
      }
    }

    setHr(userData)
    setOrg(userData.organizations)
    await loadData(userData.org_id)
    setLoading(false)
  }

  async function loadData(orgId: string) {
    const [{ data: candidateData }, { data: examData }, { data: creditData }, { data: templateData }] = await Promise.all([
      supabase.from('users').select('*').eq('org_id', orgId).eq('role', 'candidate').order('created_at', { ascending: false }),
      supabase.from('exams').select('*,exam_templates(name,passing_cefr),users:candidate_id(full_name,email),proctoring_events(id,event_type)').eq('org_id', orgId).order('created_at', { ascending: false }),
      supabase.from('credits').select('*').eq('org_id', orgId).order('created_at', { ascending: false }),
      supabase.from('exam_templates').select('*').order('name'),
    ])
    setCandidates(candidateData || [])
    setExams(examData || [])
    setCredits(creditData || [])
    setTemplates(templateData || [])
  }

  async function addCandidate() {
    if (!newCandidate.email || !newCandidate.full_name) return
    if (!org?.id) { alert('Sistemsel Hata: Kurum ID bulunamadı.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/create-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newCandidate.email, full_name: newCandidate.full_name, org_id: org.id })
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Giriş verisi oluşturulamadı.')
      const newId = resData.id

      if (newCandidate.template_id) {
        const { error: exErr } = await supabase.from('exams').insert({
          candidate_id: newId,
          template_id: newCandidate.template_id,
          org_id: org.id,
          status: 'pending'
        })
        if (exErr) throw exErr

        if ((org.credit_balance||0) > 0) {
          await supabase.from('organizations').update({ credit_balance: org.credit_balance - 1 }).eq('id', org.id)
          setOrg((o: any) => ({ ...o, credit_balance: o.credit_balance - 1 }))
        }
      }
      setShowAddCandidate(false)
      setNewCandidate({ email:'', full_name:'', template_id:'' })
      loadData(org.id)
    } catch (err: any) {
      alert('İşlem başarısız (Supabase Hatası): ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function assignExamToCandidate(candidateId: string) {
    if (!selectedTemplate) return
    setSaving(true)
    try {
      const { error } = await supabase.from('exams').insert({
        candidate_id: candidateId,
        template_id: selectedTemplate,
        org_id: org.id,
        status: 'pending'
      })
      if (error) throw error

      if ((org.credit_balance||0) > 0) {
        await supabase.from('organizations').update({ credit_balance: org.credit_balance - 1 }).eq('id', org.id)
        setOrg((o: any) => ({ ...o, credit_balance: o.credit_balance - 1 }))
      }
      setAssigningExam(null)
      setSelectedTemplate('')
      loadData(org.id)
    } catch (err: any) {
      alert('Sınav atama başarısız: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function purchaseCredits() {
    if (!org?.id) { alert('Sistemsel Hata: Kurum ID bulunamadı.'); return }
    setSaving(true)
    try {
      const { error: cErr } = await supabase.from('credits').insert({ org_id: org.id, amount: creditAmount, used: 0, expires_at: new Date(Date.now() + 365*24*60*60*1000).toISOString() })
      if (cErr) throw cErr

      const { error: oErr } = await supabase.from('organizations').update({ credit_balance: (org.credit_balance||0) + creditAmount }).eq('id', org.id)
      if (oErr) throw oErr

      const { data: invoice, error: iErr } = await supabase.from('invoices').insert({
        org_id: org.id,
        amount: creditAmount * 25,
        vat_amount: creditAmount * 25 * 0.20,
        status: 'draft',
        due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString()
      }).select().single()
      if (iErr) throw iErr

      setOrg((o: any) => ({ ...o, credit_balance: (o.credit_balance||0) + creditAmount }))
      setShowPurchaseCredits(false)
      loadData(org.id)
      alert(`✅ ${creditAmount} credits added! Invoice #${invoice?.id?.substring(0,8).toUpperCase()} created for €${(creditAmount*25*1.20).toFixed(2)} (inc. 20% KDV)`)
    } catch (err: any) {
      alert('Kredi satın alma başarısız: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function downloadRoleFitReport(examId: string) {
    const exam = exams.find(e => e.id === examId)
    if (!exam) return
    
    // Fetch detailed data for the report
    const [{ data: answers }, { data: grades }] = await Promise.all([
      supabase.from('exam_answers').select('*').eq('exam_id', examId),
      supabase.from('grades').select('*').eq('exam_id', examId)
    ])

    const sectionScores: Record<string, { grade: number, level: string, comment: string }> = {}
    const sections = ['grammar', 'reading', 'listening', 'writing', 'speaking']
    
    const mapToCEFR = (pct: number) => {
      if (pct >= 91) return 'C2'
      if (pct >= 76) return 'C1'
      if (pct >= 61) return 'B2'
      if (pct >= 41) return 'B1'
      if (pct >= 21) return 'A2'
      return 'A1'
    }

    const ROLE_DESCRIPTORS: Record<string, Record<string, string>> = {
      flight_deck: {
        C2: "Exhibits full mastery of aviation English. Can manage complex cockpit communications and non-routine emergencies with absolute precision and linguistic ease.",
        C1: "Highly proficient in flight deck operations. Can handle diverse weather challenges and coordination with ATC spontaneously and fluently.",
        B2: "Effective communicator in standard flight operations. Can maintain safety-critical dialogue and understand most technical advisories.",
        B1: "Capable of basic cockpit communication. May struggle with nuance in high-workload or non-standard emergency scenarios.",
        A2: "Limited to pre-formatted radiotelephony. Lacks the fluency required for safe international flight deck operations in complex environments.",
        A1: "Insufficient for flight deck duties. Only basic recognition of aviation terminology."
      },
      cabin_crew: {
        C2: "Consummate professional. Handles passenger needs, safety briefings, and emergency coordination with exceptional clarity and empathy.",
        C1: "Strong communicator. Can resolve passenger conflicts and provide detailed medical or safety assistance fluently.",
        B2: "Solid communication skills. Manages routine cabin duties and safety announcements effectively. Good passenger interaction.",
        B1: "Basic interaction for service. May have difficulty explaining complex safety procedures or handling agitated passengers.",
        A2: "Limited to simple service requests. Unable to provide detailed safety instructions or manage diverse passenger needs.",
        A1: "Minimal communication. Not suitable for safety-critical cabin duties."
      },
      maintenance: {
        C2: "Complete technical and professional mastery. Can document complex repairs and discuss engineering nuances with absolute precision.",
        C1: "Very strong technical English. Fluently interprets complex manuals and coordinates seamlessly with engineering teams.",
        B2: "Competent for standard maintenance tasks. Can follow technical manuals and document repairs clearly.",
        B1: "Basic technical understanding. May require assistance with complex troubleshooting manuals or detailed reporting.",
        A2: "Limited to simple maintenance tasks and labels. High risk of misinterpreting complex technical documentation.",
        A1: "Insufficient. Cannot safely interpret maintenance manuals or safety warnings."
      },
      atc: {
        C2: "Exceptional command of aeronautical radiotelephony. Can manage high-density traffic and complex emergencies with flawless clarity.",
        C1: "Highly effective controller. Maintains calm and precise communication even during peak traffic and non-routine events.",
        B2: "Reliable controller for standard traffic flow. Communication is clear and follows ICAO standards effectively.",
        B1: "Meets basic requirements but may lack the speed and precision needed for high-complexity sectors or emergencies.",
        A2: "Unsafe for control duties. Communication is too slow and prone to misinterpretation.",
        A1: "No functional control capability."
      },
      ground_staff: {
        C2: "Expert in ground operations. Seamlessly coordinates boarding, fueling, and ramp services with diverse international teams.",
        C1: "Very effective communication. Manages passenger boarding and ground handling logistics with high efficiency.",
        B2: "Competent for aviation ground duties. Can handle most passenger inquiries and ramp communications effectively.",
        B1: "Basic service communication. May struggle with complex logistics or handling large groups of non-native speakers.",
        A2: "Limited to simple tasks. Strains to handle passenger questions or complex ground coordination.",
        A1: "Insufficient for professional ground staff duties."
      },
      general: {
        C2: "Mastery of the language. Can understand with ease virtually everything heard or read in an aviation context.",
        C1: "Advanced proficiency. Can express ideas fluently and spontaneously without much searching for expressions.",
        B2: "Upper-intermediate. Can interact with a degree of fluency that makes regular interaction quite possible.",
        B1: "Intermediate. Can deal with most situations likely to arise while traveling or working in aviation.",
        A2: "Elementary. Can communicate in simple and routine tasks requiring a direct exchange of information.",
        A1: "Beginner. Can understand and use familiar everyday expressions and phrases."
      }
    }

    const roleKey = exam.exam_templates?.role_profile || 'general'
    const DESCRIPTORS = ROLE_DESCRIPTORS[roleKey] || ROLE_DESCRIPTORS.general

    for (const s of sections) {
      let grade = 0
      if (['grammar', 'reading', 'listening'].includes(s)) {
        const sa = answers?.filter(a => a.section === s) || []
        if (sa.length > 0) {
          const correct = sa.filter(a => (a.auto_score || 0) >= 1).length
          grade = Math.round((correct / sa.length) * 100)
        }
      } else {
        const sg = grades?.filter(g => g.section === s) || []
        if (sg.length > 0) {
          grade = Math.round(sg.reduce((sum, g) => sum + (g.numeric_score || 0), 0) / sg.length)
        }
      }
      const lvl = mapToCEFR(grade)
      sectionScores[s] = { grade, level: lvl, comment: DESCRIPTORS[lvl] }
    }

    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit:'mm', format:'a4' })
    const margin = 15
    const pageWidth = 210

    // ─── 0. HEADER LOGO & INFO ───
    doc.setFillColor(12, 31, 63) // Dark Blue branding color
    // Drawing a stylized 'A' plane logo placeholder
    doc.setDrawColor(12, 31, 63); doc.setLineWidth(1.5)
    doc.line(15, 15, 23, 15); doc.line(15, 15, 19, 23); doc.line(23, 15, 19, 23)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(12, 31, 63)
    doc.text('AVILINGO', 27, 19)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(130, 130, 130)
    doc.text('LANGUAGE ASSESSMENT & TRAINING SOLUTIONS', 27, 23)

    // ─── 1. CANDIDATE PROFILE TABLE ───
    const tableTop = 32
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2)
    doc.rect(margin, tableTop, 115, 30) // Info block
    doc.rect(margin + 115, tableTop, 65, 30) // Large logo box
    
    doc.line(margin, tableTop + 10, margin + 115, tableTop + 10)
    doc.line(margin, tableTop + 20, margin + 115, tableTop + 20)
    doc.line(margin + 25, tableTop, margin + 25, tableTop + 30)

    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(50, 50, 50)
    doc.text('NAME', margin + 3, tableTop + 6.5)
    doc.text('ASSESSOR', margin + 3, tableTop + 16.5)
    doc.text('COMPANY', margin + 3, tableTop + 26.5)

    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(20, 20, 20)
    doc.text(exam.users?.full_name || exam.users?.email || '—', margin + 28, tableTop + 6.5)
    doc.text('Avilingo Platform', margin + 28, tableTop + 16.5)
    doc.text(org?.name || 'N/A', margin + 28, tableTop + 26.5)

    // Right big logo placeholder
    doc.setTextColor(230, 230, 230); doc.setFontSize(40); doc.setFont('helvetica', 'bold')
    doc.text('A', margin + 140, tableTop + 22)

    // ─── 2. LANGUAGE SUMMARY SECTION ───
    const summaryTop = 72
    doc.setDrawColor(200, 200, 200)
    doc.rect(margin, summaryTop, pageWidth - (margin * 2), 35)
    doc.line(margin + 30, summaryTop, margin + 30, summaryTop + 35)
    doc.line(margin + 140, summaryTop, margin + 140, summaryTop + 35)

    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(50, 50, 50)
    doc.text('Language', margin + 5, summaryTop + 15)
    doc.text('English', margin + 7, summaryTop + 20)

    doc.setFontSize(8); doc.setTextColor(100, 100, 100)
    doc.text('COMMENT', margin + 35, summaryTop + 7)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(40, 40, 40)
    const overallDesc = DESCRIPTORS[exam.final_cefr_score || 'B1']
    const splitComment = doc.splitTextToSize(overallDesc, 100)
    doc.text(splitComment, margin + 35, summaryTop + 13)

    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 100, 100)
    doc.text('OVERALL', margin + 153, summaryTop + 10)
    doc.setFontSize(16); doc.setTextColor(12, 31, 63)
    doc.text(`${exam.final_numeric_score}%`, margin + 160, summaryTop + 18, { align: 'center' })
    
    doc.setFontSize(8); doc.setTextColor(100, 100, 100)
    doc.text('CEFR', margin + 158, summaryTop + 26)
    doc.setFontSize(16); doc.setTextColor(12, 31, 63)
    doc.text(exam.final_cefr_score || '—', margin + 160, summaryTop + 32, { align: 'center' })

    // ─── 3. MODULE BREAKDOWN TABLE ───
    const breakdownTop = 115
    const rowH = 12
    doc.setFillColor(248, 248, 248)
    doc.rect(margin, breakdownTop, pageWidth - (margin * 2), rowH, 'F')
    doc.rect(margin, breakdownTop, pageWidth - (margin * 2), rowH * 6)
    
    // Header
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(80, 80, 80)
    doc.text('MODULE', margin + 5, breakdownTop + 8)
    doc.text('GRADE', margin + 35, breakdownTop + 8)
    doc.text('COMMENT', margin + 65, breakdownTop + 8)
    doc.text('LEVEL', margin + 165, breakdownTop + 8)

    // Data Rows
    sections.forEach((s, idx) => {
      const y = breakdownTop + rowH + (idx * rowH)
      doc.line(margin, y, pageWidth - margin, y) // horizontal line
      
      const data = sectionScores[s]
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(20, 20, 20)
      doc.text(s.toUpperCase(), margin + 5, y + 7.5)
      
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
      doc.text(`${data.grade}%`, margin + 38, y + 7.5)
      
      doc.setFontSize(7.5); doc.setTextColor(80, 80, 80)
      const modComment = doc.splitTextToSize(data.comment, 95)
      doc.text(modComment, margin + 65, y + 5)
      
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(12, 31, 63)
      doc.text(data.level, margin + 168, y + 7.5)
    })

    // Vertical lines for breakdown table
    doc.line(margin + 30, breakdownTop, margin + 30, breakdownTop + (rowH * 6))
    doc.line(margin + 60, breakdownTop, margin + 60, breakdownTop + (rowH * 6))
    doc.line(margin + 160, breakdownTop, margin + 160, breakdownTop + (rowH * 6))

    // ─── FOOTER ───
    doc.setFontSize(7); doc.setTextColor(180, 180, 180)
    doc.text('This report is generated by Avilingo Aviation English Assessment Platform · avilingo.co', 105, 285, { align:'center' })
    doc.text(`Certificate issued under ICAO Doc 9835 standards · ${org?.name} · Confidential`, 105, 290, { align:'center' })

    const fileName = `Avilingo-Report-${(exam.users?.full_name || 'Candidate').replace(/\s+/g, '-')}.pdf`
    doc.save(fileName)
  }

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/login') }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0C1F3F',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#fff',fontFamily:'var(--fb)'}}>Loading HR Portal...</div>
    </div>
  )

  const filtered = candidates.filter(c => !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))
  const totalCredits = credits.reduce((s,c) => s+(c.amount||0), 0)
  const usedCredits = credits.reduce((s,c) => s+(c.used||0), 0)
  const certifiedCount = exams.filter(e => e.status==='certified').length
  const passRate = exams.filter(e=>e.final_cefr_score).length > 0
    ? Math.round((exams.filter(e => {
        const order = ['A1','A2','B1','B2','C1','C2']
        return order.indexOf(e.final_cefr_score) >= order.indexOf(e.exam_templates?.passing_cefr)
      }).length / exams.filter(e=>e.final_cefr_score).length) * 100)
    : 0

  const inp = (extra={}) => ({padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)',...extra} as any)

  return (
    <div style={{minHeight:'100vh',background:'#0C1F3F',fontFamily:'var(--fb)'}}>
      {/* Header */}
      <div style={{background:'rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.08)',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:900,color:'#fff',marginBottom:'1px'}}>Avil<span style={{color:'#5AAEDF'}}>ingo</span> <span style={{fontWeight:400,fontSize:'14px',color:'rgba(255,255,255,0.4)'}}>HR Portal</span></div>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)'}}>{org?.name}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>Credit Balance</div>
            <div style={{fontSize:'18px',fontWeight:700,color:org?.credit_balance>5?'#1AD18A':'#EF4444',fontFamily:'var(--fm)'}}>{org?.credit_balance||0}</div>
          </div>
          <button onClick={()=>setShowPurchaseCredits(true)} style={{padding:'8px 16px',borderRadius:'8px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>+ Buy Credits</button>
          <button onClick={handleSignOut} style={{padding:'7px 14px',borderRadius:'7px',border:'1px solid rgba(255,255,255,0.15)',background:'transparent',color:'rgba(255,255,255,0.4)',fontSize:'12px',cursor:'pointer',fontFamily:'var(--fb)'}}>Sign out</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{padding:'20px 28px 0'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'}}>
          {[
            {label:'Total Candidates',value:candidates.length,color:'#5AAEDF'},
            {label:'Exams Assigned',value:exams.length,color:'#DEAC50'},
            {label:'Certified',value:certifiedCount,color:'#1AD18A'},
            {label:'Pass Rate',value:`${passRate}%`,color:passRate>=70?'#1AD18A':'#EF4444'},
          ].map(s=>(
            <div key={s.label} style={{background:'rgba(255,255,255,0.06)',borderRadius:'12px',padding:'16px',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.5px'}}>{s.label}</div>
              <div style={{fontSize:'24px',fontWeight:700,color:s.color,fontFamily:'var(--fm)'}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:'2px',background:'rgba(255,255,255,0.05)',padding:'3px',borderRadius:'10px',marginBottom:'20px',width:'fit-content'}}>
          {(['candidates','results','credits','reports'] as const).map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} style={{padding:'8px 18px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:500,textTransform:'capitalize',background:activeTab===tab?'rgba(255,255,255,0.1)':'transparent',color:activeTab===tab?'#fff':'rgba(255,255,255,0.4)',fontFamily:'var(--fb)'}}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'0 28px 28px'}}>

        {/* Purchase Credits Modal */}
        {showPurchaseCredits && (
          <div style={{background:'rgba(255,255,255,0.07)',borderRadius:'14px',padding:'22px',border:'2px solid #3A8ED0',marginBottom:'18px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'16px'}}>
              <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'#fff',margin:0}}>Purchase Credits</h3>
              <button onClick={()=>setShowPurchaseCredits(false)} style={{padding:'4px 10px',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.15)',background:'transparent',cursor:'pointer',fontSize:'12px',color:'rgba(255,255,255,0.5)',fontFamily:'var(--fb)'}}>Cancel</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'10px',marginBottom:'16px'}}>
              {[10,25,50,100].map(n=>(
                <button key={n} onClick={()=>setCreditAmount(n)} style={{padding:'14px',borderRadius:'10px',border:'2px solid',borderColor:creditAmount===n?'#3A8ED0':'rgba(255,255,255,0.1)',background:creditAmount===n?'rgba(58,142,208,0.2)':'rgba(255,255,255,0.04)',cursor:'pointer',textAlign:'center',fontFamily:'var(--fb)'}}>
                  <div style={{fontSize:'22px',fontWeight:700,color:'#fff',fontFamily:'var(--fm)'}}>{n}</div>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginTop:'2px'}}>credits</div>
                  <div style={{fontSize:'12px',fontWeight:600,color:'#5AAEDF',marginTop:'4px'}}>€{(n*25*1.20).toFixed(0)} inc. VAT</div>
                </button>
              ))}
            </div>
            <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'8px',padding:'12px 16px',marginBottom:'14px',fontSize:'13px',color:'rgba(255,255,255,0.6)'}}>
              <strong style={{color:'#fff'}}>{creditAmount} credits</strong> × €25 = €{(creditAmount*25).toFixed(2)} + 20% KDV = <strong style={{color:'#1AD18A'}}>€{(creditAmount*25*1.20).toFixed(2)}</strong>
              <div style={{fontSize:'11.5px',color:'rgba(255,255,255,0.35)',marginTop:'4px'}}>1 credit = 1 candidate exam. Invoice will be generated automatically.</div>
            </div>
            <button onClick={purchaseCredits} disabled={saving} style={{padding:'11px 28px',borderRadius:'9px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
              {saving?'Processing...':'Confirm Purchase — €'+(creditAmount*25*1.20).toFixed(2)}
            </button>
          </div>
        )}

        {/* CANDIDATES TAB */}
        {activeTab==='candidates' && (
          <div>
            <div style={{display:'flex',gap:'10px',marginBottom:'14px',alignItems:'center'}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search candidates..." style={{padding:'9px 14px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.06)',color:'#fff',fontSize:'13px',fontFamily:'var(--fb)',width:'260px'}} />
              <span style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>{filtered.length} candidates</span>
              <div style={{flex:1}}/>
              <button onClick={()=>setShowAddCandidate(!showAddCandidate)} style={{padding:'9px 18px',borderRadius:'8px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>+ Add Candidate</button>
            </div>

            {showAddCandidate && (
              <div style={{background:'rgba(255,255,255,0.06)',borderRadius:'12px',padding:'18px',border:'1px solid rgba(255,255,255,0.1)',marginBottom:'14px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                  <div>
                    <label style={{fontSize:'11.5px',fontWeight:600,color:'rgba(255,255,255,0.4)',display:'block',marginBottom:'5px'}}>Full Name *</label>
                    <input value={newCandidate.full_name} onChange={e=>setNewCandidate({...newCandidate,full_name:e.target.value})} placeholder="John Smith" style={{padding:'9px 12px',borderRadius:'7px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.08)',color:'#fff',fontSize:'13px',fontFamily:'var(--fb)',width:'100%'}} />
                  </div>
                  <div>
                    <label style={{fontSize:'11.5px',fontWeight:600,color:'rgba(255,255,255,0.4)',display:'block',marginBottom:'5px'}}>Email *</label>
                    <input type="email" value={newCandidate.email} onChange={e=>setNewCandidate({...newCandidate,email:e.target.value})} placeholder="pilot@airline.com" style={{padding:'9px 12px',borderRadius:'7px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.08)',color:'#fff',fontSize:'13px',fontFamily:'var(--fb)',width:'100%'}} />
                  </div>
                  <div>
                    <label style={{fontSize:'11.5px',fontWeight:600,color:'rgba(255,255,255,0.4)',display:'block',marginBottom:'5px'}}>Assign Exam (uses 1 credit)</label>
                    <select value={newCandidate.template_id} onChange={e=>setNewCandidate({...newCandidate,template_id:e.target.value})} style={{padding:'9px 12px',borderRadius:'7px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.08)',color:'#fff',fontSize:'13px',fontFamily:'var(--fb)',width:'100%'}}>
                      <option value="">— No exam yet —</option>
                      {templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={addCandidate} disabled={saving||!newCandidate.email||!newCandidate.full_name} style={{padding:'8px 20px',borderRadius:'7px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                  {saving?'Adding...':'Add Candidate'}
                </button>
              </div>
            )}

            {filtered.length === 0 ? (
              <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'12px',padding:'40px',textAlign:'center',border:'1px solid rgba(255,255,255,0.06)'}}>
                <div style={{fontSize:'28px',marginBottom:'10px'}}>👥</div>
                <div style={{fontSize:'14px',color:'rgba(255,255,255,0.4)'}}>No candidates yet. Add your first candidate above.</div>
              </div>
            ) : (
              <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.06)',overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.03)'}}>
                      {['Candidate','Exams','Latest Result','Security','Actions'].map(h=>(
                        <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.4px'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c,i)=>{
                      const candidateExams = exams.filter(e=>e.candidate_id===c.id)
                      const latest = candidateExams[0]
                      return (
                        <tr key={c.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)'}}>
                          <td style={{padding:'12px 16px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                              <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'rgba(58,142,208,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#5AAEDF',flexShrink:0}}>
                                {(c.full_name||c.email||'?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{fontSize:'13.5px',fontWeight:600,color:'#fff'}}>{c.full_name||'—'}</div>
                                <div style={{fontSize:'11.5px',color:'rgba(255,255,255,0.35)'}}>{c.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{padding:'12px 16px',fontSize:'13px',color:'rgba(255,255,255,0.5)'}}>{candidateExams.length}</td>
                          <td style={{padding:'12px 16px'}}>
                            {latest ? (
                              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                {latest.final_cefr_score && <span style={{fontSize:'16px',fontWeight:800,color:cefrColors[latest.final_cefr_score]||'#fff',fontFamily:'var(--fm)'}}>{latest.final_cefr_score}</span>}
                                <span style={{fontSize:'11px',fontWeight:600,padding:'2px 8px',borderRadius:'100px',background:statusColor[latest.status]||'#F1EFE8',color:'#333'}}>{statusText[latest.status]||latest.status}</span>
                              </div>
                            ) : <span style={{fontSize:'12px',color:'rgba(255,255,255,0.25)'}}>No exams</span>}
                          </td>
                          <td style={{padding:'12px 16px',fontSize:'13px'}}>
                            {latest?.proctoring_events?.length > 0 ? (
                              <span style={{fontSize:'11px',fontWeight:700,color:'#EF4444',background:'rgba(239, 68, 68, 0.15)',padding:'3px 8px',borderRadius:'6px'}}>⚠️ {latest.proctoring_events.length} Flags</span>
                            ) : latest ? (
                              <span style={{fontSize:'11px',color:'rgba(255,255,255,0.2)'}}>✓ Secure</span>
                            ) : null}
                          </td>
                          <td style={{padding:'12px 16px'}}>
                            <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                              {assigningExam===c.id ? (
                                <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                                  <select value={selectedTemplate} onChange={e=>setSelectedTemplate(e.target.value)} style={{padding:'5px 8px',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.1)',color:'#fff',fontSize:'12px',fontFamily:'var(--fb)'}}>
                                    <option value="">Choose template...</option>
                                    {templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                                  <button onClick={()=>assignExamToCandidate(c.id)} disabled={!selectedTemplate||saving} style={{padding:'5px 10px',borderRadius:'6px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Assign</button>
                                  <button onClick={()=>setAssigningExam(null)} style={{padding:'5px 10px',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.15)',background:'transparent',color:'rgba(255,255,255,0.4)',fontSize:'12px',cursor:'pointer',fontFamily:'var(--fb)'}}>Cancel</button>
                                </div>
                              ) : (
                                <button onClick={()=>{setAssigningExam(c.id);setSelectedTemplate('')}} style={{padding:'5px 12px',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.7)',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Assign Exam</button>
                              )}
                              {latest?.status==='certified' && (
                                <button onClick={()=>downloadRoleFitReport(latest.id)} style={{padding:'5px 12px',borderRadius:'6px',border:'1px solid rgba(26,209,138,0.3)',background:'rgba(26,209,138,0.1)',color:'#1AD18A',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>⬇ Report</button>
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
        )}

        {/* RESULTS TAB */}
        {activeTab==='results' && (
          <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.06)',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.03)'}}>
                  {['Candidate','Assessment','Score','Status','Date','Security','Actions'].map(h=>(
                    <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.4px'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exams.map((e,i)=>(
                  <tr key={e.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)'}}>
                    <td style={{padding:'11px 16px',fontSize:'13px',color:'#fff'}}>{e.users?.full_name||e.users?.email||'—'}</td>
                    <td style={{padding:'11px 16px',fontSize:'12.5px',color:'rgba(255,255,255,0.5)'}}>{e.exam_templates?.name}</td>
                    <td style={{padding:'11px 16px'}}>
                      {e.final_cefr_score
                        ? <span style={{fontSize:'16px',fontWeight:800,color:cefrColors[e.final_cefr_score]||'#fff',fontFamily:'var(--fm)'}}>{e.final_cefr_score}</span>
                        : <span style={{fontSize:'12px',color:'rgba(255,255,255,0.25)'}}>—</span>}
                    </td>
                    <td style={{padding:'11px 16px'}}>
                      <span style={{fontSize:'11px',fontWeight:600,padding:'2px 8px',borderRadius:'100px',background:statusColor[e.status]||'#F1EFE8',color:'#333'}}>{statusText[e.status]||e.status}</span>
                    </td>
                    <td style={{padding:'11px 16px',fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>{new Date(e.created_at).toLocaleDateString('en-GB')}</td>
                    <td style={{padding:'11px 16px'}}>
                      {e.proctoring_events?.length > 0 ? (
                        <span style={{fontSize:'10px',fontWeight:700,padding:'2px 6px',borderRadius:'4px',background:'rgba(239, 68, 68, 0.15)',color:'#EF4444',display:'inline-flex',alignItems:'center',gap:'4px'}}>
                          <span>⚠️</span> {e.proctoring_events.length}
                        </span>
                      ) : (
                        <span style={{fontSize:'11px',color:'rgba(255,255,255,0.2)'}}>✓ Secure</span>
                      )}
                    </td>
                    <td style={{padding:'11px 16px'}}>
                      <div style={{display:'flex',gap:'6px'}}>
                        {e.status==='certified'&&<button onClick={()=>downloadRoleFitReport(e.id)} style={{padding:'4px 10px',borderRadius:'6px',border:'1px solid rgba(26,209,138,0.3)',background:'rgba(26,209,138,0.1)',color:'#1AD18A',fontSize:'11.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>⬇ Report</button>}
                        {e.status==='certified'&&<a href={`/exam/${e.id}/certificate`} style={{padding:'4px 10px',borderRadius:'6px',border:'1px solid rgba(58,142,208,0.3)',background:'rgba(58,142,208,0.1)',color:'#5AAEDF',fontSize:'11.5px',fontWeight:600,textDecoration:'none'}}>Certificate</a>}
                      </div>
                    </td>
                  </tr>
                ))}
                {exams.length===0&&<tr><td colSpan={6} style={{padding:'40px',textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:'13.5px'}}>No exams yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* CREDITS TAB */}
        {activeTab==='credits' && (
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'14px',marginBottom:'20px'}}>
              {[
                {label:'Current Balance',value:org?.credit_balance||0,color:'#1AD18A'},
                {label:'Total Purchased',value:totalCredits,color:'#5AAEDF'},
                {label:'Total Used',value:usedCredits,color:'#DEAC50'},
              ].map(s=>(
                <div key={s.label} style={{background:'rgba(255,255,255,0.06)',borderRadius:'12px',padding:'18px',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.5px'}}>{s.label}</div>
                  <div style={{fontSize:'28px',fontWeight:700,color:s.color,fontFamily:'var(--fm)'}}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.06)',overflow:'hidden'}}>
              <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)',fontSize:'12px',fontWeight:700,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Credit History</div>
              {credits.length===0 ? (
                <div style={{padding:'32px',textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:'13.5px'}}>No credit purchases yet.</div>
              ) : credits.map((c,i)=>(
                <div key={c.id} style={{padding:'12px 18px',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'space-between',background:i%2===0?'transparent':'rgba(255,255,255,0.02)'}}>
                  <div>
                    <div style={{fontSize:'13.5px',fontWeight:600,color:'#fff'}}>{c.amount} credits purchased</div>
                    <div style={{fontSize:'11.5px',color:'rgba(255,255,255,0.35)'}}>Expires: {c.expires_at?new Date(c.expires_at).toLocaleDateString('en-GB'):'—'}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'13px',fontWeight:700,color:'#1AD18A'}}>€{(c.amount*25*1.20).toFixed(2)}</div>
                    <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>Used: {c.used||0}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab==='reports' && (
          <div>
            <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'12px',padding:'22px',border:'1px solid rgba(255,255,255,0.06)',marginBottom:'14px'}}>
              <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'#fff',marginBottom:'6px'}}>Role-Fit Reports</h3>
              <p style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',marginBottom:'16px'}}>Download detailed assessment reports for certified candidates. Each report includes CEFR score, pass/fail recommendation, and section breakdown.</p>
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {exams.filter(e=>e.status==='certified').map(e=>(
                  <div key={e.id} style={{background:'rgba(255,255,255,0.04)',borderRadius:'10px',padding:'14px 16px',border:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontSize:'13.5px',fontWeight:600,color:'#fff',marginBottom:'2px'}}>{e.users?.full_name||e.users?.email}</div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>{e.exam_templates?.name} · {new Date(e.completed_at||e.created_at).toLocaleDateString('en-GB')}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <span style={{fontSize:'20px',fontWeight:800,color:cefrColors[e.final_cefr_score]||'#fff',fontFamily:'var(--fm)'}}>{e.final_cefr_score}</span>
                      <button onClick={()=>downloadRoleFitReport(e.id)} style={{padding:'8px 16px',borderRadius:'8px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>⬇ Download PDF</button>
                    </div>
                  </div>
                ))}
                {exams.filter(e=>e.status==='certified').length===0&&(
                  <div style={{padding:'32px',textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:'13.5px'}}>No certified exams yet. Reports will appear here once candidates complete their assessments.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
