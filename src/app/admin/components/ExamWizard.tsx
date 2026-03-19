'use client'
import { Suspense, useEffect, useState, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── CONSTANTS ───
const SECTIONS = ['grammar','reading','writing','speaking','listening'] as const
type Section = typeof SECTIONS[number]

const sectionColors: Record<string,string> = {
  grammar:'#3A8ED0', reading:'#0A8870', writing:'#B8881A', speaking:'#B83040', listening:'#7C3AED'
}
const sectionIcons: Record<string,string> = {
  grammar:'Aa', reading:'📖', writing:'✍', speaking:'🎙', listening:'🎧'
}
const CEFR_LEVELS = ['A1','A2','B1','B2','C1','C2']
const ROLE_PROFILES: Record<string,{label:string, order:Section[], description:string}> = {
  'general':      { label:'General', order:['grammar','reading','listening','writing','speaking'], description:'Standard aviation English proficiency assessment' },
  'flight_deck':  { label:'Flight Deck', order:['grammar','reading','listening','writing','speaking'], description:'Pilots, co-pilots, flight engineers' },
  'cabin_crew':   { label:'Cabin Crew', order:['grammar','listening','reading','speaking','writing'], description:'Flight attendants, cabin managers, pursers' },
  'atc':          { label:'ATC', order:['grammar','listening','reading','speaking','writing'], description:'Air traffic controllers' },
  'maintenance':  { label:'Maintenance', order:['grammar','reading','writing','listening','speaking'], description:'Aircraft maintenance engineers' },
  'ground_staff': { label:'Ground Staff', order:['grammar','reading','listening','writing','speaking'], description:'Ground operations, ramp agents' },
}

const DEFAULT_PREP: Record<Section, {seconds:number, bullets:string[]}> = {
  grammar:   { seconds: 45, bullets: ['The grammar section includes multiple-choice questions.','Read each question carefully and select the best answer.','There are no penalties for wrong answers.','Your movements, screen activity, and eye activity are monitored.'] },
  reading:   { seconds: 45, bullets: ['The reading section includes texts followed by multiple-choice questions.','Each question has only one correct answer. Read the texts carefully.','There are no penalties for incorrect answers.','Your movements, screen activity, and eye activity are being monitored.'] },
  writing:   { seconds: 45, bullets: ['Write at least 40 words for each question. Do not copy or paste from any source.','If time runs out, the system will automatically save your response.','Your movements, eye activity, and screen are being monitored.'] },
  speaking:  { seconds: 45, bullets: ['You must speak for at least 30 seconds to meet the minimum requirement.','Do not use written texts, memorized speeches, ChatGPT, or any other AI tools.','When you are ready, press the record button to start.'] },
  listening: { seconds: 45, bullets: ['Each audio will be played once only.','There are no penalties for wrong answers, so try to answer every question.','When you are ready, press the Play button to begin listening.'] },
}

const STEPS = [
  { id:'basics',     label:'Basics',       icon:'📋', short:'Name & profile' },
  { id:'sections',   label:'Sections',     icon:'🧩', short:'Question counts' },
  { id:'weights',    label:'Weights',      icon:'⚖️', short:'Score distribution' },
  { id:'timing',     label:'Time & Rules', icon:'⏱', short:'Timers & attempts' },
  { id:'cefr',       label:'CEFR',         icon:'📊', short:'Passing criteria' },
  { id:'prep',       label:'Prep Screens', icon:'📝', short:'Section intros' },
  { id:'proctoring', label:'Proctoring',   icon:'🛡', short:'Security settings' },
  { id:'candidates', label:'Candidates',   icon:'👥', short:'Assign & invite' },
  { id:'review',     label:'Review',       icon:'✅', short:'Summary & save' },
]

// ─── TYPES ───
interface WizardData {
  name: string
  role_profile: string
  org_id: string | null
  description: string
  grammar_count: number
  reading_count: number
  writing_count: number
  speaking_count: number
  listening_count: number
  weight_grammar: number
  weight_reading: number
  weight_writing: number
  weight_speaking: number
  weight_listening: number
  time_limit_mins: number
  writing_timer_mins: number
  speaking_attempts: number
  listening_single_play: boolean
  passing_cefr: string
  attempts_allowed: number
  proctoring_enabled: boolean
  proctoring_webcam: boolean
  proctoring_screen: boolean
  proctoring_eye_track: boolean
  max_violations: number
  prep_grammar: { seconds: number, bullets: string[] }
  prep_reading: { seconds: number, bullets: string[] }
  prep_writing: { seconds: number, bullets: string[] }
  prep_speaking: { seconds: number, bullets: string[] }
  prep_listening: { seconds: number, bullets: string[] }
  selected_candidates: string[]
  invite_message: string
  // New Fields
  exam_type: 'corporate' | 'independent'
  registration_fields: { name: boolean, email: boolean, phone: boolean }
  bulk_candidates: string // Raw CSV text
}

const initialData: WizardData = {
  name: '', role_profile: 'general', org_id: null, description: '',
  grammar_count: 15, reading_count: 5, writing_count: 3, speaking_count: 4, listening_count: 8,
  weight_grammar: 10, weight_reading: 20, weight_writing: 20, weight_speaking: 40, weight_listening: 10,
  time_limit_mins: 90, writing_timer_mins: 3.5, speaking_attempts: 3, listening_single_play: true,
  passing_cefr: 'B2', attempts_allowed: 1,
  proctoring_enabled: true, proctoring_webcam: true, proctoring_screen: true, proctoring_eye_track: true, max_violations: 3,
  prep_grammar: DEFAULT_PREP.grammar, prep_reading: DEFAULT_PREP.reading,
  prep_writing: DEFAULT_PREP.writing, prep_speaking: DEFAULT_PREP.speaking, prep_listening: DEFAULT_PREP.listening,
  selected_candidates: [], invite_message: 'You have been invited to take an Aviation English Proficiency exam via Avilingo. Please click the link below to begin your assessment.',
  exam_type: 'corporate',
  registration_fields: { name: true, email: true, phone: true },
  bulk_candidates: ''
}

// ─── SHARED STYLE HELPERS ───
const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background:'#fff', borderRadius:'14px', padding:'24px', border:'1px solid var(--bdr)',
  boxShadow:'0 1px 4px rgba(12,31,63,0.04)', ...extra
})
const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding:'10px 14px', borderRadius:'9px', border:'1.5px solid var(--bdr)', fontSize:'13.5px',
  fontFamily:'var(--fb)', outline:'none', transition:'border-color 0.2s', width:'100%', background:'#fff', ...extra
})
const label: React.CSSProperties = { fontSize:'12px', fontWeight:600, color:'var(--t2)', display:'block', marginBottom:'5px' }
const pill = (active: boolean, color: string): React.CSSProperties => ({
  padding:'6px 14px', borderRadius:'100px', border:`1.5px solid ${active ? color : 'var(--bdr)'}`,
  background: active ? color+'15' : '#fff', color: active ? color : 'var(--t3)',
  fontSize:'12.5px', fontWeight:600, cursor:'pointer', fontFamily:'var(--fb)', transition:'all 0.15s',
})

export default function ExamWizard({ onClose, editId: propEditId }: { onClose: () => void, editId?: string | null }) {
  const router = useRouter()
  // Remove useSearchParams
  const editId = propEditId

  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(initialData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [adminId, setAdminId] = useState('')

  // Lookup data
  const [orgs, setOrgs] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [candidateSearch, setCandidateSearch] = useState('')
  const [questionCounts, setQuestionCounts] = useState<Record<string,number>>({})

  useEffect(() => { init() }, [])

  async function init() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.warn('ExamWizard: No active session found.')
        setLoading(false)
        return
      }
      
      setAdminId(user.id)

      const { data: u, error: roleError } = await supabase
        .from('users')
        .select('role,full_name')
        .eq('id', user.id)
        .single()
      
      if (roleError) {
        console.error('ExamWizard: Error fetching user role:', roleError.message)
      } else if (!['super_admin', 'hr_manager', 'evaluator', 'instructor'].includes(u?.role || '')) {
        console.warn('ExamWizard: Unauthorized role access attempt:', u?.role)
      }
    } catch (err) {
      console.error('ExamWizard init error:', err)
    }

    // Load orgs
    const { data: orgData } = await supabase.from('organizations').select('id,name').order('name')
    setOrgs(orgData || [])

    // Load candidates
    const { data: candData } = await supabase
      .from('users')
      .select('id,full_name,email,role,organizations(name)')
      .in('role', ['candidate','student'])
      .order('full_name')
    setCandidates(candData || [])

    // Load question counts per section (role-specific + general)
    const counts: Record<string,number> = {}
    for (const sec of SECTIONS) {
      const { count: roleCount } = await supabase.from('questions').select('id',{count:'exact',head:true}).eq('section',sec).eq('active',true).eq('is_latest',true).eq('role_tag', data.role_profile || 'general')
      const { count: generalCount } = await supabase.from('questions').select('id',{count:'exact',head:true}).eq('section',sec).eq('active',true).eq('is_latest',true).eq('role_tag', 'general')
      counts[sec] = (roleCount || 0) + (generalCount || 0)
    }
    setQuestionCounts(counts)

    // If editing, load template
    if (editId) {
      const { data: t } = await supabase.from('exam_templates').select('*').eq('id', editId).single()
      if (t) {
        setData({
          ...initialData,
          name: t.name || '', role_profile: t.role_profile || 'general', org_id: t.org_id || null,
          description: t.description || '',
          grammar_count: t.grammar_count, reading_count: t.reading_count, writing_count: t.writing_count,
          speaking_count: t.speaking_count, listening_count: t.listening_count,
          weight_grammar: t.weight_grammar, weight_reading: t.weight_reading, weight_writing: t.weight_writing,
          weight_speaking: t.weight_speaking, weight_listening: t.weight_listening,
          time_limit_mins: t.time_limit_mins, writing_timer_mins: t.writing_timer_mins || 3.5,
          speaking_attempts: t.speaking_attempts || 3, listening_single_play: t.listening_single_play !== false,
          passing_cefr: t.passing_cefr || 'B2', attempts_allowed: t.attempts_allowed || 1,
          proctoring_enabled: t.proctoring_enabled !== false,
          proctoring_webcam: t.proctoring_webcam !== false,
          proctoring_screen: t.proctoring_screen !== false,
          proctoring_eye_track: t.proctoring_eye_track !== false,
          max_violations: t.max_violations || 3,
          prep_grammar: t.prep_grammar || DEFAULT_PREP.grammar,
          prep_reading: t.prep_reading || DEFAULT_PREP.reading,
          prep_writing: t.prep_writing || DEFAULT_PREP.writing,
          prep_speaking: t.prep_speaking || DEFAULT_PREP.speaking,
          prep_listening: t.prep_listening || DEFAULT_PREP.listening,
          selected_candidates: [], invite_message: initialData.invite_message,
        })
      }
    }
    setLoading(false)
  }

  // ─── DERIVED VALUES ───
  const totalQuestions = data.grammar_count + data.reading_count + data.writing_count + data.speaking_count + data.listening_count
  const totalWeight = data.weight_grammar + data.weight_reading + data.weight_writing + data.weight_speaking + data.weight_listening
  const weightValid = Math.abs(totalWeight - 100) < 0.1
  const sectionOrder = ROLE_PROFILES[data.role_profile]?.order || SECTIONS

  const filteredCandidates = useMemo(() => {
    if (!candidateSearch) return candidates
    const q = candidateSearch.toLowerCase()
    return candidates.filter(c =>
      c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
    )
  }, [candidates, candidateSearch])

  // ─── VALIDATION PER STEP ───
  function stepValid(s: number): boolean {
    switch(s) {
      case 0: return !!data.name.trim()
      case 1: return totalQuestions > 0
      case 2: return weightValid
      case 3: return data.time_limit_mins >= 10
      case 4: return !!data.passing_cefr
      case 5: return true
      case 6: return true
      case 7: return true
      case 8: return !!data.name.trim() && weightValid
      default: return true
    }
  }

  function allStepsValid(): boolean {
    return [0,1,2,3,4,5,6,7,8].every(i => stepValid(i))
  }

  // ─── SAVE ───
  async function handleSave() {
    if (!allStepsValid()) return
    setSaving(true)

    const payload: any = {
      name: data.name, role_profile: data.role_profile, org_id: data.org_id || null,
      description: data.description,
      grammar_count: data.grammar_count, reading_count: data.reading_count,
      writing_count: data.writing_count, speaking_count: data.speaking_count, listening_count: data.listening_count,
      weight_grammar: data.weight_grammar, weight_reading: data.weight_reading,
      weight_writing: data.weight_writing, weight_speaking: data.weight_speaking, weight_listening: data.weight_listening,
      time_limit_mins: data.time_limit_mins, writing_timer_mins: data.writing_timer_mins,
      speaking_attempts: data.speaking_attempts, listening_single_play: data.listening_single_play,
      passing_cefr: data.passing_cefr, attempts_allowed: data.attempts_allowed,
      proctoring_enabled: data.proctoring_enabled, proctoring_webcam: data.proctoring_webcam,
      proctoring_screen: data.proctoring_screen, proctoring_eye_track: data.proctoring_eye_track,
      max_violations: data.max_violations,
      prep_grammar: data.prep_grammar, prep_reading: data.prep_reading,
      prep_writing: data.prep_writing, prep_speaking: data.prep_speaking, prep_listening: data.prep_listening,
      // New fields
      exam_type: data.exam_type,
      registration_fields: data.registration_fields,
    }

    if (data.exam_type === 'independent' && !editId) {
      payload.public_token = Math.random().toString(36).substring(2, 10)
    }

    let templateId = editId
    if (editId) {
      const { error } = await supabase.from('exam_templates').update(payload).eq('id', editId)
      if (error) { alert('Hata: ' + error.message); setSaving(false); return }
    } else {
      const { data: newT, error } = await supabase.from('exam_templates').insert(payload).select().single()
      if (error) { alert('Hata: ' + error.message); setSaving(false); return }
      templateId = newT.id
    }

    // Create exams for selected candidates (Corporate only)
    if (data.exam_type === 'corporate' && data.selected_candidates.length > 0 && templateId) {
      const examInserts = data.selected_candidates.map(cid => ({
        candidate_id: cid,
        template_id: templateId,
        org_id: data.org_id,
        status: 'pending',
      }))
      const { data: createdExams, error: examErr } = await supabase.from('exams').insert(examInserts).select()
      
      if (examErr) {
        console.error('Sınav oluşturma hatası:', examErr.message)
      } else if (createdExams && createdExams.length > 0) {
        const invitePayload = createdExams.map(ex => {
          const c = candidates.find(cand => cand.id === ex.candidate_id)
          return {
            id: ex.id,
            candidate_email: c?.email,
            candidate_name: c?.full_name || ''
          }
        }).filter(p => p.candidate_email)

        if (invitePayload.length > 0) {
          try {
            await fetch('/api/invite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                exams: invitePayload,
                templateName: data.name,
                message: data.invite_message
              })
            })
          } catch (e) {
            console.error('Davet e-postaları gönderilemedi', e)
          }
        }
      }
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      admin_id: adminId, action: editId ? 'template_updated' : 'template_created',
      entity: 'exam_templates', entity_id: templateId,
      details: { name: data.name, type: data.exam_type, candidates_assigned: data.selected_candidates.length }
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => onClose(), 2500)
  }

  // ─── BULK UPLOAD ───
  function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''; let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
            if (inQuotes && line[i+1] === '"') { current += '"'; i++ }
            else inQuotes = !inQuotes
        } else if (ch === ',' && !inQuotes) { result.push(current); current = '' }
        else { current += ch }
    }
    result.push(current); return result
  }

  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const text = await f.text()
    const lines = text.split('\n')
    const headers = parseCSVLine(lines[0])
    const rows: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      const vals = parseCSVLine(line)
      const obj: any = {}
      headers.forEach((h, idx) => { obj[h.trim().toLowerCase()] = vals[idx]?.trim() || '' })
      rows.push(obj)
    }

    // Process rows: Find or Create users
    const newSelected = [...data.selected_candidates]
    const updatedCandidates = [...candidates]

    for (const row of rows) {
      const email = (row.email || row['e-posta'] || row['mail'])?.toLowerCase()
      const name = row.full_name || row['ad soyad'] || row['isim'] || row.name
      if (!email) continue

      let user = updatedCandidates.find(c => c.email.toLowerCase() === email)
      if (!user) {
        // Create user in DB
        const { data: newUser, error } = await supabase.from('users').insert({
          email, full_name: name, role: 'candidate'
        }).select().single()
        
        if (!error && newUser) {
          user = newUser
          updatedCandidates.push(newUser)
        }
      }

      if (user && !newSelected.includes(user.id)) {
        newSelected.push(user.id)
      }
    }

    setCandidates(updatedCandidates)
    setData(p => ({ ...p, selected_candidates: newSelected }))
    alert(`${rows.length} aday işlendi.`)
  }

  // ─── UPDATER ───
  function upd(partial: Partial<WizardData>) { setData(prev => ({...prev, ...partial})) }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'var(--off)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:'36px',height:'36px',border:'3px solid var(--bdr)',borderTop:'3px solid var(--sky)',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}} />
        <div style={{fontSize:'13px',color:'var(--t3)'}}>Loading wizard...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )

  if (saved) return (
    <div style={{minHeight:'100vh',background:'var(--off)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'48px',marginBottom:'12px'}}>✅</div>
        <h2 style={{fontFamily:'var(--fm)',fontSize:'20px',fontWeight:800,color:'var(--navy)',marginBottom:'6px'}}>
          {editId ? 'Template Updated!' : 'Exam Created!'}
        </h2>
        <p style={{fontSize:'14px',color:'var(--t3)'}}>Redirecting to admin panel...</p>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--off)',fontFamily:'var(--fb)'}}>
      {/* ── TOP BAR ── */}
      <div style={{background:'#fff',borderBottom:'1px solid var(--bdr)',padding:'12px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <button onClick={()=>router.push('/admin')} style={{padding:'6px 12px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'12.5px',fontWeight:600,color:'var(--t2)',fontFamily:'var(--fb)'}}>
            ← Back
          </button>
          <div>
            <div style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)'}}>
              {editId ? 'Edit Exam Template' : 'Create New Exam'}
            </div>
            <div style={{fontSize:'11.5px',color:'var(--t3)'}}>Step {step+1} of {STEPS.length} — {STEPS[step].label}</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          {data.name && <span style={{fontSize:'12px',color:'var(--t3)',padding:'4px 10px',background:'var(--off)',borderRadius:'6px'}}>{data.name}</span>}
          <span style={{fontSize:'11px',color:'var(--t3)'}}>{totalQuestions}q · {data.time_limit_mins}min</span>
        </div>
      </div>

      <div style={{display:'flex',maxWidth:'1200px',margin:'0 auto',padding:'24px 28px',gap:'24px'}}>
        {/* ── SIDEBAR STEPPER ── */}
        <div style={{width:'220px',flexShrink:0}}>
          <div style={{...card({padding:'16px',position:'sticky' as any,top:'80px'})}}>
            {STEPS.map((s,i) => {
              const isActive = i === step
              const isDone = i < step
              const isValid = stepValid(i)
              return (
                <button key={s.id} onClick={()=>setStep(i)}
                  style={{
                    display:'flex',alignItems:'center',gap:'10px',width:'100%',textAlign:'left',
                    padding:'10px 12px',marginBottom:'2px',borderRadius:'9px',border:'none',cursor:'pointer',
                    background: isActive ? 'var(--sky)' + '12' : 'transparent',
                    transition:'all 0.15s',
                  }}>
                  <div style={{
                    width:'28px',height:'28px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:'12px',fontWeight:700,flexShrink:0,
                    background: isDone ? '#EAF3DE' : isActive ? 'var(--sky3)' : 'var(--off)',
                    color: isDone ? '#27500A' : isActive ? 'var(--sky)' : 'var(--t3)',
                    border: `1.5px solid ${isDone ? '#97C459' : isActive ? 'var(--sky)' : 'var(--bdr)'}`,
                  }}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <div>
                    <div style={{fontSize:'12.5px',fontWeight:isActive?700:500,color:isActive?'var(--navy)':'var(--t2)',fontFamily:'var(--fb)'}}>
                      {s.label}
                    </div>
                    <div style={{fontSize:'10.5px',color:'var(--t3)'}}>{s.short}</div>
                  </div>
                  {!isValid && i < step && (
                    <div style={{marginLeft:'auto',width:'7px',height:'7px',borderRadius:'50%',background:'#E24B4A',flexShrink:0}} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{flex:1,minWidth:0}}>
          {/* STEP 0: BASICS */}
          {step === 0 && (
            <div style={card()}>
              <h2 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>Basic Information</h2>
              <p style={{fontSize:'13px',color:'var(--t3)',marginBottom:'20px'}}>Name your exam and select the target role profile.</p>

              <div style={{marginBottom:'16px'}}>
                <label style={label}>Template Name *</label>
                <input value={data.name} onChange={e=>upd({name:e.target.value})} placeholder="e.g. ICAO Cabin Crew Recruitment 2025" style={inp()} />
              </div>

              <div style={{marginBottom:'16px'}}>
                <label style={label}>Description</label>
                <textarea value={data.description} onChange={e=>upd({description:e.target.value})} placeholder="Brief description of this exam's purpose..." rows={3} style={{...inp(),resize:'vertical'}} />
              </div>

              <div style={{marginBottom:'16px'}}>
                <label style={label}>Organization (optional)</label>
                <select value={data.org_id||''} onChange={e=>upd({org_id:e.target.value||null})} style={inp()}>
                  <option value="">— Global (no org) —</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>

              <div>
                <label style={label}>Role Profile</label>
                <p style={{fontSize:'12px',color:'var(--t3)',marginBottom:'10px'}}>Determines section order per ICAO Doc 9835 recommendation.</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                  {Object.entries(ROLE_PROFILES).map(([key, prof]) => (
                    <button key={key} onClick={()=>upd({role_profile:key})}
                      style={{
                        textAlign:'left',padding:'14px 16px',borderRadius:'10px',cursor:'pointer',fontFamily:'var(--fb)',
                        border:`1.5px solid ${data.role_profile===key?'var(--sky)':'var(--bdr)'}`,
                        background: data.role_profile===key ? 'var(--sky3)' : '#fff',
                        transition:'all 0.15s',
                      }}>
                      <div style={{fontSize:'13.5px',fontWeight:700,color:data.role_profile===key?'var(--sky)':'var(--navy)',marginBottom:'3px'}}>
                        {prof.label}
                      </div>
                      <div style={{fontSize:'11.5px',color:'var(--t3)',marginBottom:'8px'}}>{prof.description}</div>
                      <div style={{display:'flex',gap:'3px',flexWrap:'wrap'}}>
                        {prof.order.map((s,i) => (
                          <span key={s} style={{fontSize:'10px',fontWeight:700,padding:'1px 6px',borderRadius:'100px',background:sectionColors[s]+'18',color:sectionColors[s]}}>
                            {i+1}. {s}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: SECTIONS */}
          {step === 1 && (
            <div style={card()}>
              <h2 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>Section Configuration</h2>
              <p style={{fontSize:'13px',color:'var(--t3)',marginBottom:'20px'}}>Set the number of questions for each section. The order follows the {ROLE_PROFILES[data.role_profile]?.label || 'General'} profile.</p>

              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {sectionOrder.map(sec => {
                  const countKey = `${sec}_count` as keyof WizardData
                  const count = data[countKey] as number
                  const available = questionCounts[sec] || 0
                  const overLimit = count > available
                  return (
                    <div key={sec} style={{
                      display:'flex',alignItems:'center',gap:'16px',padding:'16px 20px',borderRadius:'12px',
                      border:`1.5px solid ${sectionColors[sec]}25`,background:sectionColors[sec]+'06',
                    }}>
                      <div style={{width:'40px',height:'40px',borderRadius:'10px',background:sectionColors[sec]+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>
                        {sectionIcons[sec]}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'14px',fontWeight:700,color:'var(--navy)',textTransform:'capitalize',marginBottom:'2px'}}>{sec}</div>
                        <div style={{fontSize:'11.5px',color: overLimit ? '#E24B4A' : 'var(--t3)'}}>
                          {available} questions available{overLimit ? ` — exceeds pool!` : ''}
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <button onClick={()=>upd({[countKey]:Math.max(0,count-1)})} style={{width:'32px',height:'32px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'16px',fontWeight:700,color:'var(--t2)',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                        <input type="number" value={count} onChange={e=>upd({[countKey]:Math.max(0,+e.target.value)})} min={0} max={99}
                          style={{width:'60px',textAlign:'center',padding:'8px',borderRadius:'8px',border:`2px solid ${sectionColors[sec]}`,fontSize:'18px',fontWeight:700,color:sectionColors[sec],fontFamily:'var(--fm)',background:'#fff'}} />
                        <button onClick={()=>upd({[countKey]:count+1})} style={{width:'32px',height:'32px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'16px',fontWeight:700,color:'var(--t2)',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{marginTop:'16px',padding:'12px 16px',borderRadius:'10px',background:'var(--off)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'13px',fontWeight:600,color:'var(--t2)'}}>Total questions</span>
                <span style={{fontSize:'20px',fontWeight:800,color:'var(--navy)',fontFamily:'var(--fm)'}}>{totalQuestions}</span>
              </div>
            </div>
          )}

          {/* STEP 2: WEIGHTS */}
          {step === 2 && (
            <div style={card()}>
              <h2 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>Score Weights</h2>
              <p style={{fontSize:'13px',color:'var(--t3)',marginBottom:'6px'}}>Assign percentage weight to each section. Total must equal 100%.</p>
              <div style={{
                padding:'8px 14px',borderRadius:'8px',marginBottom:'20px',fontSize:'13px',fontWeight:700,
                background: weightValid ? '#EAF3DE' : '#FCEBEB',
                color: weightValid ? '#27500A' : '#791F1F',
              }}>
                Total: {totalWeight}% {weightValid ? '✓' : '— must be exactly 100%'}
              </div>

              {/* Visual bar */}
              <div style={{height:'8px',borderRadius:'4px',overflow:'hidden',display:'flex',marginBottom:'20px',background:'var(--off)'}}>
                {sectionOrder.map(sec => {
                  const w = data[`weight_${sec}` as keyof WizardData] as number
                  return w > 0 ? <div key={sec} style={{width:`${w}%`,background:sectionColors[sec],transition:'width 0.3s'}} /> : null
                })}
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                {sectionOrder.map(sec => {
                  const wKey = `weight_${sec}` as keyof WizardData
                  const w = data[wKey] as number
                  const count = data[`${sec}_count` as keyof WizardData] as number
                  if (count === 0) return null
                  return (
                    <div key={sec} style={{display:'flex',alignItems:'center',gap:'14px'}}>
                      <div style={{width:'100px',display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
                        <div style={{width:'10px',height:'10px',borderRadius:'3px',background:sectionColors[sec],flexShrink:0}} />
                        <span style={{fontSize:'13px',fontWeight:700,color:'var(--navy)',textTransform:'capitalize'}}>{sec}</span>
                      </div>
                      <input type="range" min={0} max={100} value={w} onChange={e=>upd({[wKey]:+e.target.value})}
                        style={{flex:1,accentColor:sectionColors[sec]}} />
                      <input type="number" value={w} onChange={e=>upd({[wKey]:Math.max(0,Math.min(100,+e.target.value))})}
                        min={0} max={100}
                        style={{width:'60px',textAlign:'center',padding:'6px',borderRadius:'7px',border:`2px solid ${sectionColors[sec]}`,fontSize:'16px',fontWeight:700,color:sectionColors[sec],fontFamily:'var(--fm)',background:'#fff'}} />
                      <span style={{fontSize:'12px',color:'var(--t3)',width:'14px'}}>%</span>
                    </div>
                  )
                })}
              </div>

              {/* Quick presets */}
              <div style={{marginTop:'20px',paddingTop:'16px',borderTop:'1px solid var(--bdr)'}}>
                <label style={{...label,marginBottom:'8px'}}>Quick Presets</label>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                  {[
                    { label:'ICAO Standard', g:10, r:20, w:20, s:40, l:10 },
                    { label:'Speaking Focus', g:5, r:15, w:15, s:55, l:10 },
                    { label:'Balanced', g:20, r:20, w:20, s:20, l:20 },
                    { label:'Written Focus', g:15, r:25, w:30, s:15, l:15 },
                  ].map(p => (
                    <button key={p.label} onClick={()=>upd({
                      weight_grammar:p.g, weight_reading:p.r, weight_writing:p.w, weight_speaking:p.s, weight_listening:p.l
                    })} style={{padding:'6px 14px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)',transition:'all 0.15s'}}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TIMING & RULES */}
          {step === 3 && (
            <div style={card()}>
              <h2 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>Time & Rules</h2>
              <p style={{fontSize:'13px',color:'var(--t3)',marginBottom:'20px'}}>Configure exam duration and section-specific rules.</p>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'20px'}}>
                <div>
                  <label style={label}>Total Exam Time (minutes)</label>
                  <input type="number" value={data.time_limit_mins} onChange={e=>upd({time_limit_mins:Math.max(10,+e.target.value)})} min={10} max={300} style={inp()} />
                  <div style={{fontSize:'11px',color:'var(--t3)',marginTop:'4px'}}>Recommended: {Math.round(totalQuestions * 2.5)}–{Math.round(totalQuestions * 4)} min for {totalQuestions} questions</div>
                </div>
                <div>
                  <label style={label}>Candidate Attempts Allowed</label>
                  <input type="number" value={data.attempts_allowed} onChange={e=>upd({attempts_allowed:Math.max(1,+e.target.value)})} min={1} max={10} style={inp()} />
                </div>
              </div>

              <div style={{background:'var(--off)',borderRadius:'12px',padding:'20px',marginBottom:'16px'}}>
                <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',marginBottom:'14px'}}>Section-Specific Rules</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <div style={{padding:'14px',borderRadius:'10px',background:'#fff',border:'1.5px solid '+sectionColors.writing+'25'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'10px'}}>
                      <span style={{fontSize:'12px',fontWeight:700,padding:'2px 8px',borderRadius:'100px',background:sectionColors.writing+'18',color:sectionColors.writing}}>Writing</span>
                    </div>
                    <label style={label}>Timer per question (minutes)</label>
                    <input type="number" value={data.writing_timer_mins} onChange={e=>upd({writing_timer_mins:Math.max(1,+e.target.value)})} min={1} max={30} step={0.5} style={inp()} />
                    <div style={{fontSize:'11px',color:'var(--t3)',marginTop:'4px'}}>Total writing time: {(data.writing_count * data.writing_timer_mins).toFixed(1)} min</div>
                  </div>
                  <div style={{padding:'14px',borderRadius:'10px',background:'#fff',border:'1.5px solid '+sectionColors.speaking+'25'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'10px'}}>
                      <span style={{fontSize:'12px',fontWeight:700,padding:'2px 8px',borderRadius:'100px',background:sectionColors.speaking+'18',color:sectionColors.speaking}}>Speaking</span>
                    </div>
                    <label style={label}>Max recording attempts</label>
                    <input type="number" value={data.speaking_attempts} onChange={e=>upd({speaking_attempts:Math.max(1,+e.target.value)})} min={1} max={5} style={inp()} />
                  </div>
                </div>
                <div style={{marginTop:'14px',padding:'14px',borderRadius:'10px',background:'#fff',border:'1.5px solid '+sectionColors.listening+'25'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <span style={{fontSize:'12px',fontWeight:700,padding:'2px 8px',borderRadius:'100px',background:sectionColors.listening+'18',color:sectionColors.listening}}>Listening</span>
                      <span style={{fontSize:'12.5px',fontWeight:600,color:'var(--t1)'}}>Single-play rule</span>
                    </div>
                    <label style={{position:'relative',width:'44px',height:'24px',cursor:'pointer'}}>
                      <input type="checkbox" checked={data.listening_single_play} onChange={e=>upd({listening_single_play:e.target.checked})}
                        style={{opacity:0,width:0,height:0}} />
                      <span style={{
                        position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:'12px',transition:'background 0.2s',
                        background:data.listening_single_play?'var(--sky)':'var(--bdr)',
                      }}>
                        <span style={{
                          position:'absolute',width:'18px',height:'18px',borderRadius:'50%',background:'#fff',top:'3px',
                          left:data.listening_single_play?'23px':'3px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.15)',
                        }} />
                      </span>
                    </label>
                  </div>
                  <div style={{fontSize:'11.5px',color:'var(--t3)',marginTop:'6px'}}>Audio clips can only be played once per question — standard ICAO practice.</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CEFR */}
          {step === 4 && (
            <div style={card()}>
              <h2 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>CEFR & Passing Criteria</h2>
              <p style={{fontSize:'13px',color:'var(--t3)',marginBottom:'20px'}}>Set the minimum CEFR level required to pass.</p>

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'20px'}}>
                {CEFR_LEVELS.map(level => {
                  const active = data.passing_cefr === level
                  const descs: Record<string,string> = {
                    A1:'Beginner', A2:'Elementary', B1:'Intermediate',
                    B2:'Upper Intermediate', C1:'Advanced', C2:'Mastery'
                  }
                  const levelColors: Record<string,string> = {
                    A1:'#7A8FA8', A2:'#7A8FA8', B1:'#3A8ED0', B2:'#0A8870', C1:'#B8881A', C2:'#7C3AED'
                  }
                  return (
                    <button key={level} onClick={()=>upd({passing_cefr:level})}
                      style={{
                        padding:'16px',borderRadius:'12px',cursor:'pointer',textAlign:'center',fontFamily:'var(--fb)',
                        border:`2px solid ${active ? levelColors[level] : 'var(--bdr)'}`,
                        background: active ? levelColors[level]+'12' : '#fff',
                        transition:'all 0.15s',
                      }}>
                      <div style={{fontSize:'24px',fontWeight:800,color:active?levelColors[level]:'var(--t3)',fontFamily:'var(--fm)',marginBottom:'2px'}}>{level}</div>
                      <div style={{fontSize:'11.5px',color:active?levelColors[level]:'var(--t3)',fontWeight:600}}>{descs[level]}</div>
                    </button>
                  )
                })}
              </div>

              <div style={{padding:'16px',borderRadius:'10px',background:'var(--off)',border:'1px solid var(--bdr)'}}>
                <div style={{fontSize:'13px',color:'var(--t2)',lineHeight:1.7}}>
                  Candidates scoring below <strong style={{color:'var(--navy)'}}>{data.passing_cefr}</strong> will be marked as
                  <span style={{fontWeight:700,color:'#E24B4A'}}> Not Passed</span>.
                  Those meeting or exceeding the threshold receive a
                  <span style={{fontWeight:700,color:'#0A8870'}}> Certified</span> result with their actual CEFR level.
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PREP SCREENS */}
          {step === 5 && (
            <div style={card()}>
              <h2 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>Section Preparation Screens</h2>
              <p style={{fontSize:'13px',color:'var(--t3)',marginBottom:'20px'}}>Customize the countdown and instructions candidates see before each section begins.</p>

              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                {sectionOrder.map(sec => {
                  const prepKey = `prep_${sec}` as keyof WizardData
                  const prep = data[prepKey] as { seconds: number, bullets: string[] }
                  const color = sectionColors[sec]
                  return (
                    <div key={sec} style={{borderRadius:'12px',border:`1.5px solid ${color}25`,overflow:'hidden'}}>
                      <div style={{padding:'12px 18px',background:color+'08',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <span style={{fontSize:'16px'}}>{sectionIcons[sec]}</span>
                          <span style={{fontSize:'13.5px',fontWeight:700,color:'var(--navy)',textTransform:'capitalize'}}>{sec}</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <span style={{fontSize:'12px',fontWeight:600,color:'var(--t2)'}}>Countdown</span>
                          <input type="number" min={0} max={120} value={prep.seconds}
                            onChange={e=>upd({[prepKey]:{...prep, seconds:+e.target.value}})}
                            style={{width:'64px',padding:'5px 8px',borderRadius:'7px',border:`2px solid ${color}`,fontSize:'14px',fontWeight:700,textAlign:'center',color,fontFamily:'var(--fm)',background:'#fff'}} />
                          <span style={{fontSize:'11px',color:'var(--t3)'}}>sec</span>
                        </div>
                      </div>
                      <div style={{padding:'14px 18px',background:'#fff'}}>
                        <label style={{...label,marginBottom:'6px'}}>Instructions (one per line)</label>
                        <textarea value={prep.bullets.join('\n')}
                          onChange={e=>upd({[prepKey]:{...prep, bullets:e.target.value.split('\n').filter(l=>l.trim())}})}
                          rows={Math.max(3, prep.bullets.length + 1)}
                          placeholder="Add instructions, one per line..."
                          style={{...inp(),resize:'vertical',fontSize:'13px',lineHeight:1.6}} />
                        <div style={{fontSize:'10.5px',color:'var(--t3)',marginTop:'3px'}}>
                          {prep.bullets.length} bullet{prep.bullets.length !== 1 ? 's' : ''} · {prep.seconds}s countdown
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 6: PROCTORING */}
          {step === 6 && (
            <div style={card()}>
              <h2 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>Proctoring & Security</h2>
              <p style={{fontSize:'13px',color:'var(--t3)',marginBottom:'20px'}}>Configure anti-cheating measures and monitoring options.</p>

              <div style={{marginBottom:'20px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderRadius:'12px',border:'1.5px solid var(--bdr)',background:data.proctoring_enabled?'#EAF3DE':'var(--off)'}}>
                  <div>
                    <div style={{fontSize:'14px',fontWeight:700,color:'var(--navy)'}}>Enable Proctoring</div>
                    <div style={{fontSize:'12px',color:'var(--t3)'}}>Monitor candidates during the exam</div>
                  </div>
                  <label style={{position:'relative',width:'48px',height:'26px',cursor:'pointer'}}>
                    <input type="checkbox" checked={data.proctoring_enabled} onChange={e=>upd({proctoring_enabled:e.target.checked})}
                      style={{opacity:0,width:0,height:0}} />
                    <span style={{
                      position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:'13px',transition:'background 0.2s',
                      background:data.proctoring_enabled?'#0A8870':'var(--bdr)',
                    }}>
                      <span style={{
                        position:'absolute',width:'20px',height:'20px',borderRadius:'50%',background:'#fff',top:'3px',
                        left:data.proctoring_enabled?'25px':'3px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.15)',
                      }} />
                    </span>
                  </label>
                </div>
              </div>

              {data.proctoring_enabled && (
                <>
                  <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
                    {[
                      { key:'proctoring_webcam', label:'Webcam Monitoring', desc:'Capture periodic snapshots via WebRTC', icon:'📹' },
                      { key:'proctoring_screen', label:'Screen Recording', desc:'Detect tab switches and screen sharing', icon:'🖥' },
                      { key:'proctoring_eye_track', label:'Eye Tracking', desc:'Monitor eye movement patterns for anomalies', icon:'👁' },
                    ].map(item => (
                      <div key={item.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderRadius:'10px',border:'1px solid var(--bdr)',background:'#fff'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                          <span style={{fontSize:'18px'}}>{item.icon}</span>
                          <div>
                            <div style={{fontSize:'13px',fontWeight:600,color:'var(--navy)'}}>{item.label}</div>
                            <div style={{fontSize:'11.5px',color:'var(--t3)'}}>{item.desc}</div>
                          </div>
                        </div>
                        <label style={{position:'relative',width:'44px',height:'24px',cursor:'pointer'}}>
                          <input type="checkbox" checked={data[item.key as keyof WizardData] as boolean}
                            onChange={e=>upd({[item.key]:e.target.checked})}
                            style={{opacity:0,width:0,height:0}} />
                          <span style={{
                            position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:'12px',transition:'background 0.2s',
                            background:(data[item.key as keyof WizardData] as boolean)?'var(--sky)':'var(--bdr)',
                          }}>
                            <span style={{
                              position:'absolute',width:'18px',height:'18px',borderRadius:'50%',background:'#fff',top:'3px',
                              left:(data[item.key as keyof WizardData] as boolean)?'23px':'3px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.15)',
                            }} />
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div style={{padding:'16px 20px',borderRadius:'10px',background:'var(--off)'}}>
                    <label style={label}>Maximum Violations Before Auto-Invalidation</label>
                    <div style={{display:'flex',alignItems:'center',gap:'12px',marginTop:'6px'}}>
                      <input type="range" min={1} max={10} value={data.max_violations} onChange={e=>upd({max_violations:+e.target.value})}
                        style={{flex:1,accentColor:'#E24B4A'}} />
                      <div style={{
                        width:'42px',height:'42px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',
                        background:'#FCEBEB',border:'2px solid #F09595',fontSize:'18px',fontWeight:800,color:'#791F1F',fontFamily:'var(--fm)',
                      }}>{data.max_violations}</div>
                    </div>
                    <div style={{fontSize:'11.5px',color:'var(--t3)',marginTop:'6px'}}>
                      After {data.max_violations} violations (tab switch, face not visible, etc.) the exam is automatically invalidated.
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 7: CANDIDATES / REGISTRATION */}
          {step === 7 && (
            <div style={card()}>
              {data.exam_type === 'corporate' ? (
                <>
                  <h2 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>Aday Atama (Şirket)</h2>
                  <p style={{fontSize:'13px',color:'var(--t3)',marginBottom:'20px'}}>Sınava katılacak adayları tek tek seçin veya toplu olarak yükleyin.</p>

                  <div style={{display:'flex',gap:'12px',marginBottom:'20px'}}>
                    <button onClick={() => setCandidateSearch('')} style={{...pill(true, 'var(--sky)'), flex:1}}>Bireysel Seçim</button>
                    <button style={{...pill(false, 'var(--sky)'), flex:1, opacity:0.6}} title="Yakında: CSV/Excel Yükleme">Toplu Yükleme (CSV)</button>
                  </div>

                  {data.selected_candidates.length > 0 && (
                    <div style={{padding:'10px 14px',borderRadius:'8px',background:'#EAF3DE',marginBottom:'14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{fontSize:'13px',fontWeight:600,color:'#27500A'}}>{data.selected_candidates.length} aday seçildi</span>
                      <button onClick={()=>upd({selected_candidates:[]})} style={{padding:'3px 10px',borderRadius:'5px',border:'1.5px solid #BBF7D0',background:'#fff',cursor:'pointer',fontSize:'11px',fontWeight:600,color:'#27500A',fontFamily:'var(--fb)'}}>Temizle</button>
                    </div>
                  )}

                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input value={candidateSearch} onChange={e=>setCandidateSearch(e.target.value)}
                      placeholder="İsim veya e-posta ile ara..."
                      style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none' }} />
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                  </div>
                  <button onClick={() => fileRef.current?.click()} style={{ padding: '0 20px', borderRadius: '12px', background: '#F0F9FF', border: '1.5px solid #BAE6FD', color: '#0EA5E9', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Toplu CSV
                  </button>
                  <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleBulkUpload} />
                </div>

                  <div style={{maxHeight:'340px',overflowY:'auto',border:'1px solid var(--bdr)',borderRadius:'10px'}}>
                    {filteredCandidates.length === 0 ? (
                      <div style={{padding:'32px',textAlign:'center',color:'var(--t3)',fontSize:'13px'}}>Aday bulunamadı.</div>
                    ) : (
                      filteredCandidates.map((c, i) => {
                        const selected = data.selected_candidates.includes(c.id)
                        return (
                          <div key={c.id} onClick={()=>{
                            upd({ selected_candidates: selected
                              ? data.selected_candidates.filter(id=>id!==c.id)
                              : [...data.selected_candidates, c.id]
                            })
                          }} style={{
                            display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',cursor:'pointer',
                            borderBottom: i < filteredCandidates.length - 1 ? '1px solid var(--bdr)' : 'none',
                            background: selected ? 'var(--sky3)' : i % 2 === 0 ? '#fff' : '#FAFBFC',
                            transition:'background 0.1s',
                          }}>
                            <div style={{
                              width:'22px',height:'22px',borderRadius:'6px',border:`2px solid ${selected?'var(--sky)':'var(--bdr)'}`,
                              background: selected ? 'var(--sky)' : '#fff',
                              display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                            }}>
                              {selected && <span style={{color:'#fff',fontSize:'12px',fontWeight:700}}>✓</span>}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:'13px',fontWeight:600,color:'var(--navy)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.full_name || 'İsimsiz'}</div>
                              <div style={{fontSize:'11.5px',color:'var(--t3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.email}</div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h2 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>Kayıt Ayarları (Bağımsız)</h2>
                  <p style={{fontSize:'13px',color:'var(--t3)',marginBottom:'24px'}}>Adayların kayıt olurken doldurması gereken alanları seçin.</p>

                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    {[
                      { key:'name', label:'İsim Soyisim', required: true },
                      { key:'email', label:'E-posta Adresi', required: true },
                      { key:'phone', label:'Telefon Numarası', required: false }
                    ].map(field => (
                      <div key={field.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',borderRadius:'12px',border:'1.5px solid var(--bdr)'}}>
                        <div>
                          <div style={{fontSize:'14px',fontWeight:700,color:'var(--navy)'}}>{field.label}</div>
                          <div style={{fontSize:'11.5px',color:'var(--t3)'}}>{field.required ? 'Zorunlu Alan' : 'Opsiyonel Alan'}</div>
                        </div>
                        <label style={{position:'relative',width:'44px',height:'24px',cursor:field.required ? 'not-allowed' : 'pointer', opacity: field.required ? 0.6 : 1}}>
                          <input type="checkbox" checked={data.registration_fields[field.key as keyof typeof data.registration_fields]} 
                            disabled={field.required}
                            onChange={e=>upd({registration_fields: {...data.registration_fields, [field.key]: e.target.checked}})}
                            style={{opacity:0,width:0,height:0}} />
                          <span style={{
                            position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:'12px',transition:'background 0.2s',
                            background:data.registration_fields[field.key as keyof typeof data.registration_fields]?'var(--sky)':'var(--bdr)',
                          }}>
                            <span style={{
                              position:'absolute',width:'18px',height:'18px',borderRadius:'50%',background:'#fff',top:'3px',
                              left:data.registration_fields[field.key as keyof typeof data.registration_fields]?'23px':'3px',transition:'left 0.2s'
                            }} />
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div style={{marginTop:'32px',padding:'20px',borderRadius:'16px',background:'var(--sky3)',border:'1.5px dashed var(--sky)'}}>
                    <div style={{fontSize:'13px',fontWeight:800,color:'var(--sky)',marginBottom:'8px'}}>Kayıt Linki Hakkında</div>
                    <div style={{fontSize:'12px',color:'var(--t2)',lineHeight:1.6}}>
                      Sınavı oluşturduktan sonra size özel bir <strong>Bağımsız Kayıt Linki</strong> verilecek. Bu linki sosyal medyada veya web sitenizde paylaşarak adayların kendi kendine kayıt olmasını sağlayabilirsiniz.
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 8: REVIEW */}
          {step === 8 && (
            <div style={card()}>
              <h2 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>Review & Save</h2>
              <p style={{fontSize:'13px',color:'var(--t3)',marginBottom:'20px'}}>Verify all settings before creating the exam.</p>

              {/* Summary Cards */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
                <div style={{padding:'16px',borderRadius:'10px',background:'var(--off)',border:'1px solid var(--bdr)'}}>
                  <div style={{fontSize:'11px',fontWeight:600,color:'var(--t3)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Template</div>
                  <div style={{fontSize:'15px',fontWeight:700,color:'var(--navy)',marginBottom:'3px'}}>{data.name || '—'}</div>
                  <div style={{fontSize:'12px',color:'var(--t3)'}}>
                    {ROLE_PROFILES[data.role_profile]?.label} profile
                    {data.org_id ? ` · ${orgs.find(o=>o.id===data.org_id)?.name}` : ' · Global'}
                  </div>
                </div>
                <div style={{padding:'16px',borderRadius:'10px',background:'var(--off)',border:'1px solid var(--bdr)'}}>
                  <div style={{fontSize:'11px',fontWeight:600,color:'var(--t3)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Exam Setup</div>
                  <div style={{fontSize:'15px',fontWeight:700,color:'var(--navy)',marginBottom:'3px'}}>{totalQuestions} questions · {data.time_limit_mins} min</div>
                  <div style={{fontSize:'12px',color:'var(--t3)'}}>
                    Pass: {data.passing_cefr} · Attempts: {data.attempts_allowed} · {data.proctoring_enabled ? 'Proctored' : 'No proctoring'}
                  </div>
                </div>
              </div>

              {/* Section breakdown */}
              <div style={{marginBottom:'16px'}}>
                <div style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',marginBottom:'8px'}}>Section Breakdown</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px'}}>
                  {sectionOrder.map(sec => {
                    const count = data[`${sec}_count` as keyof WizardData] as number
                    const weight = data[`weight_${sec}` as keyof WizardData] as number
                    if (count === 0) return <div key={sec} />
                    return (
                      <div key={sec} style={{padding:'12px',borderRadius:'10px',background:sectionColors[sec]+'08',border:`1px solid ${sectionColors[sec]}20`,textAlign:'center'}}>
                        <div style={{fontSize:'10.5px',fontWeight:700,color:sectionColors[sec],textTransform:'capitalize',marginBottom:'4px'}}>{sec}</div>
                        <div style={{fontSize:'20px',fontWeight:800,color:'var(--navy)',fontFamily:'var(--fm)'}}>{count}</div>
                        <div style={{fontSize:'11px',fontWeight:700,color:sectionColors[sec]}}>{weight}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Rules summary */}
              <div style={{marginBottom:'16px',padding:'14px 18px',borderRadius:'10px',background:'var(--off)',border:'1px solid var(--bdr)'}}>
                <div style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',marginBottom:'8px'}}>Rules</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                  {[
                    { label:'Writing timer', value:`${data.writing_timer_mins} min/q` },
                    { label:'Speaking attempts', value:`${data.speaking_attempts}x max` },
                    { label:'Listening', value:data.listening_single_play ? 'Single play' : 'Replay allowed' },
                    { label:'Webcam', value:data.proctoring_webcam ? 'On' : 'Off' },
                    { label:'Screen', value:data.proctoring_screen ? 'On' : 'Off' },
                    { label:'Max violations', value:`${data.max_violations} strikes` },
                  ].map(r => (
                    <div key={r.label} style={{display:'flex',justifyContent:'space-between',fontSize:'12px'}}>
                      <span style={{color:'var(--t3)'}}>{r.label}</span>
                      <span style={{fontWeight:600,color:'var(--navy)'}}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Candidates */}
              <div style={{marginBottom:'20px',padding:'14px 18px',borderRadius:'10px',background:'var(--off)',border:'1px solid var(--bdr)'}}>
                <div style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',marginBottom:'4px'}}>Candidates</div>
                <div style={{fontSize:'14px',fontWeight:700,color:'var(--navy)'}}>
                  {data.selected_candidates.length > 0
                    ? `${data.selected_candidates.length} candidate${data.selected_candidates.length > 1 ? 's' : ''} will be assigned`
                    : 'No candidates selected — you can assign later'}
                </div>
              </div>

              {/* Validation warnings */}
              {!allStepsValid() && (
                <div style={{padding:'12px 16px',borderRadius:'8px',background:'#FCEBEB',border:'1px solid #F09595',marginBottom:'16px'}}>
                  <div style={{fontSize:'13px',fontWeight:600,color:'#791F1F',marginBottom:'4px'}}>Please fix the following:</div>
                  {!stepValid(0) && <div style={{fontSize:'12px',color:'#791F1F'}}>• Step 1: Template name is required</div>}
                  {!stepValid(1) && <div style={{fontSize:'12px',color:'#791F1F'}}>• Step 2: At least one question needed</div>}
                  {!stepValid(2) && <div style={{fontSize:'12px',color:'#791F1F'}}>• Step 3: Weights must total 100% (currently {totalWeight}%)</div>}
                  {!stepValid(3) && <div style={{fontSize:'12px',color:'#791F1F'}}>• Step 4: Minimum 10 minutes exam time</div>}
                </div>
              )}

              <button onClick={handleSave} disabled={saving || !allStepsValid()}
                style={{
                  width:'100%',padding:'14px',borderRadius:'10px',border:'none',fontSize:'15px',fontWeight:700,
                  cursor: (saving || !allStepsValid()) ? 'not-allowed' : 'pointer',
                  background: allStepsValid() ? 'var(--navy)' : '#C7D2E0',
                  color:'#fff',fontFamily:'var(--fb)',transition:'background 0.2s',
                }}>
                {saving ? 'Saving...' : editId ? 'Update Template' : `Create Exam${data.selected_candidates.length > 0 ? ` & Assign ${data.selected_candidates.length} Candidates` : ''}`}
              </button>
            </div>
          )}

          {/* ── NAVIGATION BUTTONS ── */}
          <div style={{display:'flex',justifyContent:'space-between',marginTop:'16px',paddingBottom:'40px'}}>
            <button onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0}
              style={{
                padding:'10px 20px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',
                cursor:step===0?'not-allowed':'pointer',fontSize:'13px',fontWeight:600,
                color:step===0?'var(--t3)':'var(--navy)',fontFamily:'var(--fb)',transition:'all 0.15s',
              }}>
              ← Previous
            </button>
            <div style={{display:'flex',gap:'6px'}}>
              {/* Step dots */}
              {STEPS.map((_,i) => (
                <button key={i} onClick={()=>setStep(i)}
                  style={{
                    width: i===step ? '24px' : '8px', height:'8px', borderRadius:'4px', border:'none', cursor:'pointer',
                    background: i===step ? 'var(--sky)' : i < step ? '#97C459' : 'var(--bdr)',
                    transition:'all 0.2s',
                  }} />
              ))}
            </div>
            {step < STEPS.length - 1 ? (
              <button onClick={()=>setStep(Math.min(STEPS.length-1,step+1))}
                style={{
                  padding:'10px 20px',borderRadius:'8px',border:'none',background:'var(--navy)',
                  cursor:'pointer',fontSize:'13px',fontWeight:600,color:'#fff',fontFamily:'var(--fb)',transition:'all 0.15s',
                }}>
                Next →
              </button>
            ) : (
              <div style={{width:'100px'}} /> // spacer
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

