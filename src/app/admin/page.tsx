'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const navItems = [
  { id:'dashboard', label:'Dashboard' },
  { id:'questions', label:'Question Bank' },
  { id:'users', label:'Users' },
  { id:'organizations', label:'Organizations' },
  { id:'templates', label:'Exam Templates' },
  { id:'evaluator', label:'Grading Queue' },
  { id:'reports', label:'Reports' },
  { id:'invoices', label:'Invoices' },
  { id:'audit', label:'Audit Logs' },
]

const sectionColors: Record<string,string> = {
  grammar:'#3A8ED0', reading:'#0A8870', writing:'#B8881A', speaking:'#B83040', listening:'#7C3AED'
}

const COMPETENCY_TAGS: Record<string,string[]> = {
  grammar:   ['structural_accuracy','tense_usage','conditional_forms','passive_voice','phraseology_grammar','technical_writing'],
  reading:   ['sop_comprehension','notam_interpretation','weather_report_reading','technical_manual','safety_card_reading','atc_clearance_reading'],
  listening: ['atc_phraseology','cockpit_communication','cabin_announcement','emergency_broadcast','ground_ops_radio','passenger_instruction'],
  writing:   ['incident_report','maintenance_log','passenger_complaint','operational_message','technical_description','safety_report'],
  speaking:  ['roleplay_emergency','roleplay_passenger','roleplay_atc','oral_briefing','crew_coordination','ground_communication'],
}

const ROLE_PROFILES: Record<string,string[]> = {
  'general':      ['grammar','reading','listening','writing','speaking'],
  'flight_deck':  ['grammar','reading','listening','writing','speaking'],
  'cabin_crew':   ['grammar','listening','reading','speaking','writing'],
  'atc':          ['grammar','listening','reading','speaking','writing'],
  'maintenance':  ['grammar','reading','writing','listening','speaking'],
  'ground_staff': ['grammar','reading','listening','writing','speaking'],
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({ users:0, exams:0, questions:0, orgs:0 })
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('')
  const [adminId, setAdminId] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')

  // Question bank state
  const [questions, setQuestions] = useState<any[]>([])
  const [qLoading, setQLoading] = useState(false)
  const [qFilter, setQFilter] = useState('all')
  const [qSearch, setQSearch] = useState('')
  const [qCefr, setQCefr] = useState('all')
  const [qDifficulty, setQDifficulty] = useState('all')
  const [qPage, setQPage] = useState(0)
  const [qTotal, setQTotal] = useState(0)
  const PAGE_SIZE = 25

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editQ, setEditQ] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [formQ, setFormQ] = useState({
    section:'grammar', type:'multiple_choice', content:'',
    correct_answer:'', cefr_level:'B1', difficulty:'medium',
    competency_tag:'', aircraft_context:'', audio_url:'', active:true
  })
  const [options, setOptions] = useState([
    {text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false}
  ])
  const [rubrics, setRubrics] = useState<any[]>([])
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [selectedSubRoles, setSelectedSubRoles] = useState<string[]>([])
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([])

  // Detail modal
  const [detailQ, setDetailQ] = useState<any>(null)

  // Taxonomy
  const [departments, setDepartments] = useState<any[]>([])
  const [subRoles, setSubRoles] = useState<any[]>([])
  const [useCases, setUseCases] = useState<any[]>([])

  // AI staging
  const [showAI, setShowAI] = useState(false)
  const [aiQueue, setAiQueue] = useState<any[]>([])
  const [aiProcessing, setAiProcessing] = useState(false)
  const [aiProgress, setAiProgress] = useState(0)
  const [aiFile, setAiFile] = useState<File|null>(null)
  const aiFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { checkAuth(); loadStats(); loadTaxonomy() }, [])
  useEffect(() => { if (activeSection === 'questions') { setQPage(0); loadQuestions(0) } }, [activeSection, qFilter, qSearch, qCefr, qDifficulty])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('role,full_name').eq('id', user.id).single()
    if (data?.role !== 'super_admin') { router.push('/login'); return }
    setAdminName(data.full_name || 'Admin')
    setAdminId(user.id)
    setLoading(false)
  }

  async function loadStats() {
    const [u,e,q,o] = await Promise.all([
      supabase.from('users').select('id',{count:'exact',head:true}),
      supabase.from('exams').select('id',{count:'exact',head:true}),
      supabase.from('questions').select('id',{count:'exact',head:true}).eq('is_latest',true),
      supabase.from('organizations').select('id',{count:'exact',head:true}),
    ])
    setStats({ users:u.count||0, exams:e.count||0, questions:q.count||0, orgs:o.count||0 })
  }

  async function loadTaxonomy() {
    const [d,s,u] = await Promise.all([
      supabase.from('departments').select('*').order('sort_order'),
      supabase.from('sub_roles').select('*,departments(name,code)').order('sort_order'),
      supabase.from('use_cases').select('*').order('name'),
    ])
    setDepartments(d.data||[])
    setSubRoles(s.data||[])
    setUseCases(u.data||[])
  }

  async function loadQuestions(page = qPage) {
    setQLoading(true)
    let query = supabase.from('questions')
      .select('*,question_analytics(difficulty_index,total_attempts,correct_count,last_used_at),question_assignments(id,departments(name),sub_roles(name),use_cases(name))', {count:'exact'})
      .eq('is_latest', true)
      .order('created_at', {ascending:false})
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (qFilter !== 'all') query = query.eq('section', qFilter)
    if (qCefr !== 'all') query = query.eq('cefr_level', qCefr)
    if (qDifficulty !== 'all') query = query.eq('difficulty', qDifficulty)
    if (qSearch) query = query.ilike('content', `%${qSearch}%`)

    const { data, count } = await query
    setQuestions(data||[])
    setQTotal(count||0)
    setQLoading(false)
  }

  async function saveQuestion() {
    if (!formQ.content.trim()) return
    setSaving(true)
    const payload = { ...formQ, created_by: adminId, updated_by: adminId }

    if (editQ) {
      // Check if question was used in any exam
      const { count } = await supabase.from('exam_answers')
        .select('id', {count:'exact', head:true}).eq('question_id', editQ.id)

      if ((count||0) > 0) {
        // Create V2 — immutability for used questions
        await supabase.from('questions').update({ is_latest: false }).eq('id', editQ.id)
        const { data: newQ } = await supabase.from('questions').insert({
          ...payload, version_number: (editQ.version_number||1) + 1,
          parent_question_id: editQ.parent_question_id || editQ.id, is_latest: true
        }).select().single()
        if (newQ) await saveOptionsAndRubrics(newQ.id)
      } else {
        await supabase.from('questions').update({...payload, updated_by: adminId}).eq('id', editQ.id)
        await supabase.from('question_options').delete().eq('question_id', editQ.id)
        await saveOptionsAndRubrics(editQ.id)
      }
    } else {
      const { data: newQ } = await supabase.from('questions').insert({...payload, version_number:1, is_latest:true}).select().single()
      if (newQ) {
        await saveOptionsAndRubrics(newQ.id)
        await saveAssignments(newQ.id)
        await supabase.from('question_analytics').insert({ question_id: newQ.id, total_attempts:0, correct_count:0 })
      }
    }

    setSaving(false)
    resetForm()
    loadQuestions(qPage)
    loadStats()
  }

  async function saveOptionsAndRubrics(qId: string) {
    const validOptions = options.filter(o => o.text.trim())
    if (validOptions.length > 0) {
      await supabase.from('question_options').insert(
        validOptions.map((o,i) => ({question_id:qId, option_text:o.text, is_correct:o.is_correct, sort_order:i}))
      )
    }
    const validRubrics = rubrics.filter(r => r.criterion.trim())
    if (validRubrics.length > 0) {
      await supabase.from('question_rubrics').insert(
        validRubrics.map((r,i) => ({question_id:qId, criterion:r.criterion, description:r.description||'', max_score:r.max_score||10, sort_order:i}))
      )
    }
  }

  async function saveAssignments(qId: string) {
    if (!selectedDepts.length && !selectedSubRoles.length) return
    const assignments: any[] = []
    if (selectedSubRoles.length) {
      selectedSubRoles.forEach(sId => {
        if (selectedUseCases.length) selectedUseCases.forEach(uId => assignments.push({question_id:qId,sub_role_id:sId,use_case_id:uId,min_cefr:formQ.cefr_level}))
        else assignments.push({question_id:qId,sub_role_id:sId,min_cefr:formQ.cefr_level})
      })
    } else {
      selectedDepts.forEach(dId => {
        if (selectedUseCases.length) selectedUseCases.forEach(uId => assignments.push({question_id:qId,department_id:dId,use_case_id:uId,min_cefr:formQ.cefr_level}))
        else assignments.push({question_id:qId,department_id:dId,min_cefr:formQ.cefr_level})
      })
    }
    if (assignments.length) await supabase.from('question_assignments').insert(assignments)
  }

  async function deleteQuestion(id: string) {
    if (!confirm('Delete this question? This cannot be undone.')) return
    const { count } = await supabase.from('exam_answers').select('id',{count:'exact',head:true}).eq('question_id', id)
    if ((count||0) > 0) {
      await supabase.from('questions').update({ active: false, is_latest: false }).eq('id', id)
    } else {
      await supabase.from('questions').delete().eq('id', id)
    }
    loadQuestions(qPage); loadStats()
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('questions').update({ active: !current }).eq('id', id)
    loadQuestions(qPage)
  }

  function startEdit(q: any) {
    setEditQ(q)
    setFormQ({ section:q.section, type:q.type, content:q.content, correct_answer:q.correct_answer||'', cefr_level:q.cefr_level||'B1', difficulty:q.difficulty||'medium', competency_tag:q.competency_tag||'', aircraft_context:q.aircraft_context||'', audio_url:q.audio_url||'', active:q.active })
    setOptions([{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false}])
    setRubrics([])
    setShowForm(true)
    setDetailQ(null)
  }

  function resetForm() {
    setShowForm(false); setEditQ(null)
    setFormQ({ section:'grammar', type:'multiple_choice', content:'', correct_answer:'', cefr_level:'B1', difficulty:'medium', competency_tag:'', aircraft_context:'', audio_url:'', active:true })
    setOptions([{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false}])
    setRubrics([])
    setSelectedDepts([]); setSelectedSubRoles([]); setSelectedUseCases([])
  }

  function toggleArr(arr: string[], setArr: (v:string[])=>void, val: string) {
    setArr(arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val])
  }

  // AI Tagging
  function parseCSVLine(line: string): string[] {
    const result: string[] = []; let current = ''; let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { if (inQuotes && line[i+1]==='"') { current+='"'; i++ } else inQuotes=!inQuotes }
      else if (ch===',' && !inQuotes) { result.push(current); current='' }
      else current+=ch
    }
    result.push(current); return result
  }

  async function loadAIFile(file: File) {
    setAiFile(file); setAiProgress(0)
    const text = await file.text()
    const lines = text.split('\n')
    const headers = parseCSVLine(lines[0]).map(h=>h.trim().toLowerCase())
    const rows = lines.slice(1).filter(l=>l.trim()).map(line => {
      const vals = parseCSVLine(line)
      const obj: any = {}
      headers.forEach((h,i) => { obj[h] = vals[i]?.trim().replace(/^"|"$/g,'') || '' })
      return obj
    }).filter(r => r.content)
    setAiQueue(rows.map(r => ({ ...r, ai_section: r.section||'', ai_cefr: r.cefr_level||'', ai_difficulty: r.difficulty||'medium', ai_tag: r.competency_tags?.split('|')[0]||'', reviewed: false, approved: false })))
  }

  async function runAITagging() {
    setAiProcessing(true)
    const sections = ['grammar','reading','writing','speaking','listening']
    const cefrs = ['A1','A2','B1','B2','C1']
    const updated = [...aiQueue]

    for (let i = 0; i < updated.length; i++) {
      const q = updated[i]
      if (!q.ai_section || !sections.includes(q.ai_section)) {
        const text = q.content.toLowerCase()
        if (text.includes('listen') || text.includes('audio') || text.includes('heard') || text.includes('announcement')) q.ai_section = 'listening'
        else if (text.includes('write') || text.includes('report') || text.includes('email') || text.includes('letter') || text.includes('task:')) q.ai_section = 'writing'
        else if (text.includes('speak') || text.includes('describe') || text.includes('discuss') || text.includes('roleplay') || text.includes('say')) q.ai_section = 'speaking'
        else if (text.includes('read') || text.includes('passage') || text.includes('text') || text.includes('paragraph') || text.includes('article')) q.ai_section = 'reading'
        else q.ai_section = 'grammar'
      }
      if (!q.ai_cefr || !cefrs.includes(q.ai_cefr)) {
        const text = q.content.toLowerCase()
        if (text.includes('analyse') || text.includes('critically') || text.includes('evaluate') || text.includes('justify')) q.ai_cefr = 'C1'
        else if (text.includes('explain') || text.includes('compare') || text.includes('discuss') || text.includes('describe in detail')) q.ai_cefr = 'B2'
        else if (text.includes('describe') || text.includes('what would you') || text.includes('how do you')) q.ai_cefr = 'B1'
        else if (text.includes('simple') || text.includes('basic') || text.length < 80) q.ai_cefr = 'A2'
        else q.ai_cefr = 'B1'
      }
      updated[i] = q
      if (i % 50 === 0) {
        setAiQueue([...updated])
        setAiProgress(Math.round((i / updated.length) * 100))
        await new Promise(r => setTimeout(r, 10))
      }
    }
    setAiQueue(updated)
    setAiProgress(100)
    setAiProcessing(false)
  }

  async function approveAll() {
    const toApprove = aiQueue.filter(q => !q.approved)
    const BATCH = 100
    for (let i = 0; i < toApprove.length; i += BATCH) {
      const batch = toApprove.slice(i, i+BATCH).map(q => ({
        content: q.content, correct_answer: q.correct_answer||'', cefr_level: q.ai_cefr||'B1',
        difficulty: q.ai_difficulty||'medium', section: q.ai_section||'grammar',
        competency_tag: q.ai_tag||'', aircraft_context: q.aircraft_context||'',
        audio_url: q.audio_url||'', active: true, type: 'multiple_choice',
        version_number: 1, is_latest: true, created_by: adminId
      }))
      await supabase.from('questions').insert(batch)
      setAiProgress(Math.round(((i+BATCH)/toApprove.length)*100))
    }
    setShowAI(false); setAiQueue([]); setAiFile(null)
    loadQuestions(0); loadStats()
  }

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/login') }

  async function exportQuestions() {
    let query = supabase.from('questions').select('*').eq('is_latest', true).order('section').order('cefr_level')
    if (qFilter !== 'all') query = query.eq('section', qFilter)
    if (qCefr !== 'all') query = query.eq('cefr_level', qCefr)
    if (qDifficulty !== 'all') query = query.eq('difficulty', qDifficulty)
    if (qSearch) query = query.ilike('content', '%' + qSearch + '%')
    const { data } = await query
    if (!data?.length) return
    const headers = ['section','cefr_level','difficulty','type','content','correct_answer','competency_tag','aircraft_context','active']
    const escape = (v: any) => { const s = String(v ?? '').replace(/"/g, '""'); return s.includes(',') || s.includes('\n') ? '"' + s + '"' : s }
    const csv = [headers.join(','), ...data.map((q: any) => headers.map(h => escape(q[h])).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'avilingo-questions-' + qFilter + '-' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }


  if (loading) return <div style={{minHeight:'100vh',background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'#fff'}}>Loading...</div></div>

  const sections = ['grammar','reading','writing','speaking','listening']
  const cefrLevels = ['A1','A2','B1','B2','C1']
  const filteredSubRoles = selectedDepts.length ? subRoles.filter(s=>selectedDepts.includes(s.department_id)) : subRoles
  const totalPages = Math.ceil(qTotal / PAGE_SIZE)

  const inp = (extra={}) => ({padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)',...extra})
  const lbl = {fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'} as any

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'var(--fb)'}}>
      {/* Sidebar */}
      <div style={{width:'220px',background:'var(--navy)',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'20px 16px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:900,color:'#fff'}}>Avil<span style={{color:'#5AAEDF'}}>ingo</span></div>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginTop:'3px'}}>Admin Panel</div>
        </div>
        <nav style={{padding:'12px 8px',flex:1}}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} style={{display:'block',width:'100%',textAlign:'left',padding:'9px 12px',marginBottom:'2px',borderRadius:'7px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:500,background:activeSection===item.id?'rgba(58,142,208,0.2)':'transparent',color:activeSection===item.id?'#5AAEDF':'rgba(255,255,255,0.55)'}}>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{padding:'12px 8px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',padding:'8px 12px'}}>{adminName}</div>
          <button onClick={handleSignOut} style={{display:'block',width:'100%',textAlign:'left',padding:'9px 12px',borderRadius:'7px',border:'none',cursor:'pointer',fontSize:'13px',background:'transparent',color:'rgba(255,255,255,0.4)'}}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,background:'var(--off)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{background:'#fff',padding:'14px 28px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <h1 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',textTransform:'capitalize'}}>{activeSection==='questions'?'Question Bank':activeSection}</h1>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'12px',padding:'3px 10px',borderRadius:'100px',background:'#EAF3DE',color:'#27500A',fontWeight:600}}>System Online</span>
            <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'var(--sky3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'var(--sky)'}}>{adminName.charAt(0)}</div>
          </div>
        </div>

        <div style={{padding:'24px 28px',flex:1,overflowY:'auto'}}>

          {/* DASHBOARD */}
          {activeSection === 'dashboard' && (
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'22px'}}>
                {[{label:'Total Users',value:stats.users,color:'#5AAEDF'},{label:'Active Questions',value:stats.questions,color:'#DEAC50'},{label:'Total Exams',value:stats.exams,color:'#12B898'},{label:'Organizations',value:stats.orgs,color:'#E06070'}].map(m => (
                  <div key={m.label} style={{background:'#fff',borderRadius:'12px',padding:'18px',border:'1px solid var(--bdr)'}}>
                    <div style={{fontSize:'12px',color:'var(--t3)',marginBottom:'5px'}}>{m.label}</div>
                    <div style={{fontSize:'26px',fontWeight:700,color:m.color,fontFamily:'var(--fm)'}}>{m.value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'#fff',borderRadius:'14px',padding:'22px',border:'1px solid var(--bdr)',marginBottom:'18px'}}>
                <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>Section Order by Role Profile</h3>
                <p style={{fontSize:'12px',color:'var(--t3)',marginBottom:'12px'}}>ICAO Doc 9835 optimized sequencing</p>
                <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
                  {Object.entries(ROLE_PROFILES).map(([role,order]) => (
                    <div key={role} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',borderRadius:'8px',border:'1px solid var(--bdr)',background:'var(--off)'}}>
                      <span style={{fontSize:'12px',fontWeight:700,color:'var(--navy)',width:'110px',textTransform:'capitalize',flexShrink:0}}>{role.replace('_',' ')}</span>
                      <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                        {order.map((s,i) => (
                          <div key={s} style={{display:'flex',alignItems:'center',gap:'3px'}}>
                            <span style={{fontSize:'11px',fontWeight:700,padding:'2px 7px',borderRadius:'100px',background:sectionColors[s]+'20',color:sectionColors[s],textTransform:'capitalize'}}>{i+1}. {s}</span>
                            {i<order.length-1&&<span style={{color:'var(--t3)',fontSize:'10px'}}>→</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{background:'#fff',borderRadius:'14px',padding:'22px',border:'1px solid var(--bdr)'}}>
                <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>Quick Actions</h3>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  {[{label:'Question Bank',s:'questions'},{label:'AI Import',s:'questions',ai:true},{label:'Bulk Import',href:'/admin/import'},{label:'Exam Templates',s:'templates'},{label:'Users',s:'users'},{label:'Reports',s:'reports'}].map(a => (
                    a.href
                      ? <a key={a.label} href={a.href} style={{padding:'8px 14px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'13px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)',textDecoration:'none',display:'inline-block'}}>{a.label} →</a>
                      : <button key={a.label} onClick={() => { setActiveSection(a.s ?? 'dashboard'); if(a.ai) setTimeout(()=>setShowAI(true),100) }} style={{padding:'8px 14px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'13px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>{a.label} →</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* QUESTION BANK V2 */}
          {activeSection === 'questions' && (
            <div>
              {/* Toolbar */}
              <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap',alignItems:'center'}}>
                <input value={qSearch} onChange={e=>{setQSearch(e.target.value);setQPage(0)}} placeholder="Search questions..." style={{...inp({width:'220px',flex:'none'})}} />
                <select value={qFilter} onChange={e=>{setQFilter(e.target.value);setQPage(0)}} style={{...inp({width:'130px',flex:'none'})}}>
                  <option value="all">All sections</option>
                  {sections.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
                <select value={qCefr} onChange={e=>{setQCefr(e.target.value);setQPage(0)}} style={{...inp({width:'110px',flex:'none'})}}>
                  <option value="all">All CEFR</option>
                  {cefrLevels.map(l=><option key={l} value={l}>{l}</option>)}
                </select>
                <select value={qDifficulty} onChange={e=>{setQDifficulty(e.target.value);setQPage(0)}} style={{...inp({width:'120px',flex:'none'})}}>
                  <option value="all">All difficulty</option>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
                <div style={{flex:1}}/>
                <button onClick={exportQuestions} style={{padding:'9px 14px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'12.5px',fontWeight:600,color:'var(--navy)',cursor:'pointer',fontFamily:'var(--fb)'}}>⬇ Export CSV</button><a href="/admin/import" style={{padding:'9px 14px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'12.5px',fontWeight:600,color:'var(--navy)',textDecoration:'none'}}>📊 CSV Import</a>
                <button onClick={()=>{setShowAI(!showAI);setShowForm(false)}} style={{padding:'9px 14px',borderRadius:'8px',border:'1.5px solid #7C3AED',background:'#F5F3FF',color:'#5B21B6',fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>🤖 AI Import</button>
                <button onClick={()=>{resetForm();setShowForm(true);setShowAI(false)}} style={{padding:'9px 16px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>+ Add Question</button>
              </div>

              <div style={{fontSize:'12px',color:'var(--t3)',marginBottom:'12px'}}>{qTotal.toLocaleString()} questions {qSearch||qFilter!=='all'||qCefr!=='all'||qDifficulty!=='all'?'(filtered)':''}</div>

              {/* AI STAGING */}
              {showAI && (
                <div style={{background:'#fff',borderRadius:'14px',padding:'22px',border:'2px solid #7C3AED',marginBottom:'18px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
                    <div>
                      <h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'3px'}}>🤖 AI-Assisted Import & Tagging</h3>
                      <p style={{fontSize:'12.5px',color:'var(--t3)'}}>Upload untagged CSV → AI classifies section, CEFR level → review in staging → approve to database</p>
                    </div>
                    <button onClick={()=>{setShowAI(false);setAiQueue([])}} style={{padding:'5px 12px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'12px',color:'var(--t2)',fontFamily:'var(--fb)'}}>Close</button>
                  </div>

                  {!aiQueue.length ? (
                    <div onClick={()=>aiFileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){setAiFile(f);loadAIFile(f)}}} style={{border:'2px dashed #C4B5FD',borderRadius:'10px',padding:'28px',textAlign:'center',cursor:'pointer',background:'#FAFAFF'}}>
                      <div style={{fontSize:'28px',marginBottom:'8px'}}>🤖</div>
                      <div style={{fontSize:'14px',fontWeight:600,color:'#5B21B6',marginBottom:'3px'}}>Drop CSV for AI classification</div>
                      <div style={{fontSize:'12px',color:'#7C3AED'}}>Works with untagged or partially tagged CSVs</div>
                      <input ref={aiFileRef} type="file" accept=".csv" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f){setAiFile(f);loadAIFile(f)}}} />
                    </div>
                  ) : (
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px',flexWrap:'wrap'}}>
                        <span style={{fontSize:'13px',fontWeight:600,color:'var(--navy)'}}>{aiQueue.length} questions loaded</span>
                        {!aiProcessing && aiProgress === 0 && (
                          <button onClick={runAITagging} style={{padding:'8px 20px',borderRadius:'7px',border:'none',background:'#7C3AED',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>🤖 Run AI Classification</button>
                        )}
                        {aiProgress === 100 && (
                          <button onClick={approveAll} style={{padding:'8px 20px',borderRadius:'7px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>✓ Approve All & Import</button>
                        )}
                        <button onClick={()=>{setAiQueue([]);setAiProgress(0)}} style={{padding:'8px 14px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',color:'var(--t2)',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Clear</button>
                      </div>

                      {aiProcessing && (
                        <div style={{marginBottom:'12px'}}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'var(--t2)',marginBottom:'4px'}}><span>Classifying questions...</span><span>{aiProgress}%</span></div>
                          <div style={{height:'6px',background:'#E9D5FF',borderRadius:'3px',overflow:'hidden'}}>
                            <div style={{height:'100%',background:'#7C3AED',borderRadius:'3px',width:`${aiProgress}%`,transition:'width 0.2s'}}></div>
                          </div>
                        </div>
                      )}

                      <div style={{maxHeight:'320px',overflowY:'auto',border:'1px solid var(--bdr)',borderRadius:'8px'}}>
                        <table style={{width:'100%',borderCollapse:'collapse'}}>
                          <thead>
                            <tr style={{background:'var(--off)',borderBottom:'1px solid var(--bdr)'}}>
                              {['Question','AI Section','AI CEFR','Difficulty','Tag'].map(h=>(
                                <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase'}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {aiQueue.slice(0,50).map((q,i)=>(
                              <tr key={i} style={{borderBottom:'1px solid var(--bdr)',background:i%2===0?'#fff':'#FAFBFC'}}>
                                <td style={{padding:'8px 12px',maxWidth:'220px'}}>
                                  <div style={{fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--t1)'}}>{q.content}</div>
                                </td>
                                <td style={{padding:'8px 12px'}}>
                                  <select value={q.ai_section||'grammar'} onChange={e=>{const u=[...aiQueue];u[i]={...u[i],ai_section:e.target.value};setAiQueue(u)}} style={{padding:'4px 8px',borderRadius:'6px',border:'1.5px solid var(--bdr)',fontSize:'12px',fontFamily:'var(--fb)',background:sectionColors[q.ai_section||'grammar']+'15',color:sectionColors[q.ai_section||'grammar'],fontWeight:600}}>
                                    {sections.map(s=><option key={s} value={s}>{s}</option>)}
                                  </select>
                                </td>
                                <td style={{padding:'8px 12px'}}>
                                  <select value={q.ai_cefr||'B1'} onChange={e=>{const u=[...aiQueue];u[i]={...u[i],ai_cefr:e.target.value};setAiQueue(u)}} style={{padding:'4px 8px',borderRadius:'6px',border:'1.5px solid var(--bdr)',fontSize:'12px',fontFamily:'var(--fb)'}}>
                                    {cefrLevels.map(l=><option key={l} value={l}>{l}</option>)}
                                  </select>
                                </td>
                                <td style={{padding:'8px 12px'}}>
                                  <select value={q.ai_difficulty||'medium'} onChange={e=>{const u=[...aiQueue];u[i]={...u[i],ai_difficulty:e.target.value};setAiQueue(u)}} style={{padding:'4px 8px',borderRadius:'6px',border:'1.5px solid var(--bdr)',fontSize:'12px',fontFamily:'var(--fb)'}}>
                                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                                  </select>
                                </td>
                                <td style={{padding:'8px 12px'}}>
                                  <input value={q.ai_tag||''} onChange={e=>{const u=[...aiQueue];u[i]={...u[i],ai_tag:e.target.value};setAiQueue(u)}} style={{padding:'4px 8px',borderRadius:'6px',border:'1.5px solid var(--bdr)',fontSize:'11px',width:'130px',fontFamily:'var(--fb)'}} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {aiQueue.length > 50 && <div style={{padding:'10px 14px',fontSize:'12px',color:'var(--t3)',textAlign:'center'}}>Showing first 50 of {aiQueue.length} — all will be imported on approve</div>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ADD/EDIT FORM V2 */}
              {showForm && (
                <div style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'2px solid var(--sky)',marginBottom:'18px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'18px'}}>
                    <h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',margin:0}}>
                      {editQ ? `Edit Question ${editQ.version_number > 1 ? `(V${editQ.version_number})` : ''}` : 'Add New Question'}
                    </h3>
                    <button onClick={resetForm} style={{padding:'5px 12px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'12px',color:'var(--t2)',fontFamily:'var(--fb)'}}>Cancel</button>
                  </div>

                  {editQ && <div style={{padding:'8px 12px',background:'#FAEEDA',borderRadius:'7px',fontSize:'12.5px',color:'#633806',marginBottom:'14px'}}>⚠️ If this question was used in past exams, editing will create a new version (V{(editQ.version_number||1)+1}) to preserve historical data.</div>}

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'14px'}}>
                    <div><label style={lbl}>Section *</label>
                      <select value={formQ.section} onChange={e=>setFormQ({...formQ,section:e.target.value,competency_tag:''})} style={inp()}>
                        {sections.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                      </select></div>
                    <div><label style={lbl}>Question Type *</label>
                      <select value={formQ.type} onChange={e=>setFormQ({...formQ,type:e.target.value})} style={inp()}>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="fill_blank">Fill in the Blank</option>
                        <option value="drag_drop">Drag & Drop</option>
                        <option value="audio_response">Audio Response (Speaking)</option>
                        <option value="written_response">Written Response</option>
                        <option value="listening">Listening Comprehension</option>
                        <option value="picture_description">Picture Description</option>
                      </select></div>
                    <div><label style={lbl}>CEFR Level *</label>
                      <select value={formQ.cefr_level} onChange={e=>setFormQ({...formQ,cefr_level:e.target.value})} style={inp()}>
                        {cefrLevels.map(l=><option key={l} value={l}>{l}</option>)}
                      </select></div>
                    <div><label style={lbl}>Difficulty</label>
                      <select value={formQ.difficulty} onChange={e=>setFormQ({...formQ,difficulty:e.target.value})} style={inp()}>
                        <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                      </select></div>
                    <div><label style={lbl}>Competency Tag</label>
                      <select value={formQ.competency_tag} onChange={e=>setFormQ({...formQ,competency_tag:e.target.value})} style={inp()}>
                        <option value="">-- Select --</option>
                        {(COMPETENCY_TAGS[formQ.section]||[]).map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                      </select></div>
                    <div><label style={lbl}>Aircraft Context</label>
                      <input value={formQ.aircraft_context} onChange={e=>setFormQ({...formQ,aircraft_context:e.target.value})} placeholder="A320, B737, general..." style={inp()} /></div>
                  </div>

                  <div style={{marginBottom:'12px'}}>
                    <label style={lbl}>Question Content *</label>
                    <textarea value={formQ.content} onChange={e=>setFormQ({...formQ,content:e.target.value})} placeholder="Enter full question text..." rows={4} style={{...inp(),resize:'vertical'}} />
                  </div>

                  {/* Multiple Choice Options */}
                  {(formQ.type==='multiple_choice'||formQ.type==='fill_blank') && (
                    <div style={{marginBottom:'14px',background:'var(--off)',borderRadius:'10px',padding:'14px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                        <label style={{...lbl,margin:0}}>Answer Options</label>
                        <button onClick={()=>setOptions([...options,{text:'',is_correct:false}])} style={{padding:'4px 12px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>+ Add Option</button>
                      </div>
                      {options.map((opt,i) => (
                        <div key={i} style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'6px'}}>
                          <span style={{fontSize:'13px',fontWeight:700,color:'var(--t3)',width:'18px'}}>{String.fromCharCode(65+i)}.</span>
                          <input value={opt.text} onChange={e=>{const o=[...options];o[i]={...o[i],text:e.target.value};setOptions(o)}} placeholder={`Option ${String.fromCharCode(65+i)}`} style={{...inp(),flex:1}} />
                          <label style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'12px',cursor:'pointer',flexShrink:0}}>
                            <input type="checkbox" checked={opt.is_correct} onChange={e=>{const o=[...options];o[i]={...o[i],is_correct:e.target.checked};setOptions(o)}} />
                            Correct
                          </label>
                          {options.length > 2 && <button onClick={()=>setOptions(options.filter((_,idx)=>idx!==i))} style={{padding:'4px 8px',borderRadius:'5px',border:'1.5px solid #FECACA',background:'#FEF2F2',cursor:'pointer',fontSize:'11px',color:'#DC2626',fontFamily:'var(--fb)'}}>✕</button>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Audio/Image URL */}
                  {(formQ.section==='listening'||formQ.type==='audio_response'||formQ.type==='picture_description') && (
                    <div style={{marginBottom:'12px'}}>
                      <label style={lbl}>{formQ.type==='picture_description'?'Image URL':'Audio URL'}</label>
                      <input value={formQ.audio_url} onChange={e=>setFormQ({...formQ,audio_url:e.target.value})} placeholder="https://..." style={inp()} />
                    </div>
                  )}

                  {/* Rubrics for Writing/Speaking */}
                  {(formQ.section==='writing'||formQ.section==='speaking') && (
                    <div style={{marginBottom:'14px',background:'#F0FDF4',borderRadius:'10px',padding:'14px',border:'1px solid #BBF7D0'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                        <label style={{fontSize:'12px',fontWeight:700,color:'#14532D',margin:0}}>Grading Rubrics</label>
                        <button onClick={()=>setRubrics([...rubrics,{criterion:'',description:'',max_score:10}])} style={{padding:'4px 12px',borderRadius:'6px',border:'1.5px solid #BBF7D0',background:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:600,color:'#14532D',fontFamily:'var(--fb)'}}>+ Add Criterion</button>
                      </div>
                      {rubrics.length === 0 && <div style={{fontSize:'12px',color:'#4ADE80'}}>No rubrics yet. Add criteria like "Grammar Accuracy", "Vocabulary Range", "Task Completion".</div>}
                      {rubrics.map((r,i) => (
                        <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 2fr auto auto',gap:'8px',marginBottom:'6px',alignItems:'center'}}>
                          <input value={r.criterion} onChange={e=>{const rr=[...rubrics];rr[i]={...rr[i],criterion:e.target.value};setRubrics(rr)}} placeholder="Criterion name" style={{...inp()}} />
                          <input value={r.description} onChange={e=>{const rr=[...rubrics];rr[i]={...rr[i],description:e.target.value};setRubrics(rr)}} placeholder="Description..." style={{...inp()}} />
                          <input type="number" value={r.max_score} onChange={e=>{const rr=[...rubrics];rr[i]={...rr[i],max_score:+e.target.value};setRubrics(rr)}} style={{...inp({width:'60px'})}} min={1} max={100} />
                          <button onClick={()=>setRubrics(rubrics.filter((_,idx)=>idx!==i))} style={{padding:'6px 10px',borderRadius:'5px',border:'1.5px solid #FECACA',background:'#FEF2F2',cursor:'pointer',fontSize:'11px',color:'#DC2626',fontFamily:'var(--fb)'}}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Department Assignment */}
                  {!editQ && (
                    <div style={{background:'var(--off)',borderRadius:'10px',padding:'14px',marginBottom:'14px'}}>
                      <h4 style={{fontFamily:'var(--fm)',fontSize:'13px',fontWeight:800,color:'var(--navy)',marginBottom:'10px'}}>Department & Role Assignment</h4>
                      <div style={{marginBottom:'10px'}}>
                        <label style={{...lbl,marginBottom:'6px'}}>Departments</label>
                        <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                          {departments.map(d=>(
                            <button key={d.id} onClick={()=>toggleArr(selectedDepts,setSelectedDepts,d.id)} style={{padding:'4px 11px',borderRadius:'100px',border:'1.5px solid',borderColor:selectedDepts.includes(d.id)?'var(--navy)':'var(--bdr)',background:selectedDepts.includes(d.id)?'var(--navy)':'#fff',color:selectedDepts.includes(d.id)?'#fff':'var(--t2)',fontSize:'11.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{d.name}</button>
                          ))}
                        </div>
                      </div>
                      {selectedDepts.length > 0 && (
                        <div style={{marginBottom:'10px'}}>
                          <label style={{...lbl,marginBottom:'6px'}}>Sub-roles</label>
                          <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                            {filteredSubRoles.map(s=>(
                              <button key={s.id} onClick={()=>toggleArr(selectedSubRoles,setSelectedSubRoles,s.id)} style={{padding:'4px 11px',borderRadius:'100px',border:'1.5px solid',borderColor:selectedSubRoles.includes(s.id)?'var(--sky)':'var(--bdr)',background:selectedSubRoles.includes(s.id)?'var(--sky3)':'#fff',color:selectedSubRoles.includes(s.id)?'var(--sky)':'var(--t2)',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{s.name}</button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <label style={{...lbl,marginBottom:'6px'}}>Use Cases</label>
                        <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                          {useCases.map(u=>(
                            <button key={u.id} onClick={()=>toggleArr(selectedUseCases,setSelectedUseCases,u.id)} style={{padding:'4px 11px',borderRadius:'100px',border:'1.5px solid',borderColor:selectedUseCases.includes(u.id)?'var(--teal)':'var(--bdr)',background:selectedUseCases.includes(u.id)?'#E6F7F4':'#fff',color:selectedUseCases.includes(u.id)?'var(--teal)':'var(--t2)',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{u.name}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <button onClick={saveQuestion} disabled={saving} style={{padding:'10px 28px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                    {saving ? 'Saving...' : editQ ? 'Update Question' : 'Save Question'}
                  </button>
                </div>
              )}

              {/* QUESTION DETAIL MODAL */}
              {detailQ && (
                <div style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'2px solid var(--bdr)',marginBottom:'18px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'16px'}}>
                    <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                      <span style={{fontSize:'12px',fontWeight:700,padding:'3px 9px',borderRadius:'100px',background:(sectionColors[detailQ.section]||'#888')+'20',color:sectionColors[detailQ.section]||'#888',textTransform:'capitalize'}}>{detailQ.section}</span>
                      <span style={{fontSize:'12px',fontWeight:700,padding:'2px 7px',borderRadius:'6px',background:'var(--sky3)',color:'var(--sky)'}}>{detailQ.cefr_level}</span>
                      <span style={{fontSize:'12px',fontWeight:600,padding:'2px 7px',borderRadius:'6px',textTransform:'capitalize',background:detailQ.difficulty==='easy'?'#EAF3DE':detailQ.difficulty==='hard'?'#FCEBEB':'#FAEEDA',color:detailQ.difficulty==='easy'?'#27500A':detailQ.difficulty==='hard'?'#791F1F':'#633806'}}>{detailQ.difficulty}</span>
                      {detailQ.version_number > 1 && <span style={{fontSize:'11px',fontWeight:700,padding:'2px 7px',borderRadius:'6px',background:'#E0E7FF',color:'#3730A3'}}>V{detailQ.version_number}</span>}
                    </div>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button onClick={()=>{startEdit(detailQ);setDetailQ(null)}} style={{padding:'5px 12px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>Edit</button>
                      <button onClick={()=>setDetailQ(null)} style={{padding:'5px 12px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'12px',color:'var(--t2)',fontFamily:'var(--fb)'}}>Close</button>
                    </div>
                  </div>
                  <p style={{fontSize:'14px',color:'var(--t1)',lineHeight:1.6,marginBottom:'14px',whiteSpace:'pre-wrap'}}>{detailQ.content}</p>
                  {detailQ.correct_answer && <div style={{fontSize:'13px',color:'#27500A',padding:'8px 12px',background:'#EAF3DE',borderRadius:'7px',marginBottom:'12px'}}>✓ Answer: {detailQ.correct_answer}</div>}
                  {detailQ.question_analytics?.[0] && (
                    <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                      <div style={{fontSize:'12px',color:'var(--t3)'}}>Used <strong style={{color:'var(--t1)'}}>{detailQ.question_analytics[0].total_attempts}</strong> times</div>
                      {detailQ.question_analytics[0].difficulty_index !== null && (
                        <div style={{fontSize:'12px',color:'var(--t3)'}}>Difficulty index: <strong style={{color: detailQ.question_analytics[0].difficulty_index < 30 ? '#DC2626' : detailQ.question_analytics[0].difficulty_index > 80 ? '#16A34A' : 'var(--t1)'}}>{detailQ.question_analytics[0].difficulty_index}% correct</strong></div>
                      )}
                      {detailQ.question_analytics[0].last_used_at && (
                        <div style={{fontSize:'12px',color:'var(--t3)'}}>Last used: <strong style={{color:'var(--t1)'}}>{new Date(detailQ.question_analytics[0].last_used_at).toLocaleDateString()}</strong></div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* QUESTIONS TABLE */}
              {qLoading ? (
                <div style={{textAlign:'center',padding:'40px',color:'var(--t3)'}}>Loading questions...</div>
              ) : questions.length === 0 ? (
                <div style={{background:'#fff',borderRadius:'14px',padding:'50px',border:'1px solid var(--bdr)',textAlign:'center'}}>
                  <div style={{fontSize:'32px',marginBottom:'10px'}}>📝</div>
                  <h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'6px'}}>No questions found</h3>
                  <p style={{fontSize:'13px',color:'var(--t3)'}}>Try adjusting your filters or add new questions.</p>
                </div>
              ) : (
                <>
                  <div style={{background:'#fff',borderRadius:'14px',border:'1px solid var(--bdr)',overflow:'hidden',marginBottom:'14px'}}>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead>
                        <tr style={{borderBottom:'1px solid var(--bdr)',background:'var(--off)'}}>
                          {['Section','Question','CEFR','Difficulty','Analytics','Assignments','Status','Actions'].map(h=>(
                            <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.4px'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {questions.map((q,i)=>(
                          <tr key={q.id} style={{borderBottom:'1px solid var(--bdr)',background:i%2===0?'#fff':'#FAFBFC'}}>
                            <td style={{padding:'10px 14px'}}>
                              <span style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'100px',background:(sectionColors[q.section]||'#888')+'20',color:sectionColors[q.section]||'#888',textTransform:'capitalize'}}>{q.section}</span>
                            </td>
                            <td style={{padding:'10px 14px',maxWidth:'220px'}}>
                              <div style={{fontSize:'12.5px',color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'pointer'}} onClick={()=>setDetailQ(q)}>{q.content}</div>
                              <div style={{display:'flex',gap:'4px',marginTop:'2px',flexWrap:'wrap'}}>
                                {q.competency_tag && <span style={{fontSize:'10.5px',color:'var(--t3)'}}>{q.competency_tag.replace(/_/g,' ')}</span>}
                                {q.version_number > 1 && <span style={{fontSize:'10px',fontWeight:700,padding:'1px 5px',borderRadius:'4px',background:'#E0E7FF',color:'#3730A3'}}>V{q.version_number}</span>}
                              </div>
                            </td>
                            <td style={{padding:'10px 14px'}}>
                              <span style={{fontSize:'12px',fontWeight:700,padding:'2px 7px',borderRadius:'6px',background:'var(--sky3)',color:'var(--sky)'}}>{q.cefr_level}</span>
                            </td>
                            <td style={{padding:'10px 14px'}}>
                              <span style={{fontSize:'11.5px',fontWeight:600,padding:'2px 7px',borderRadius:'6px',textTransform:'capitalize',background:q.difficulty==='easy'?'#EAF3DE':q.difficulty==='hard'?'#FCEBEB':'#FAEEDA',color:q.difficulty==='easy'?'#27500A':q.difficulty==='hard'?'#791F1F':'#633806'}}>{q.difficulty}</span>
                            </td>
                            <td style={{padding:'10px 14px'}}>
                              {q.question_analytics?.[0] ? (
                                <div style={{fontSize:'11px',color:'var(--t3)'}}>
                                  <div>Used: <strong style={{color:'var(--t1)'}}>{q.question_analytics[0].total_attempts}</strong></div>
                                  {q.question_analytics[0].difficulty_index !== null && (
                                    <div style={{color: q.question_analytics[0].difficulty_index < 30 ? '#DC2626' : q.question_analytics[0].difficulty_index > 80 ? '#16A34A' : 'var(--t3)'}}>
                                      {q.question_analytics[0].difficulty_index}% correct
                                    </div>
                                  )}
                                </div>
                              ) : <span style={{fontSize:'11px',color:'var(--t3)'}}>—</span>}
                            </td>
                            <td style={{padding:'10px 14px'}}>
                              {q.question_assignments?.length > 0 ? (
                                <div style={{display:'flex',gap:'3px',flexWrap:'wrap'}}>
                                  {q.question_assignments.slice(0,2).map((a:any,ai:number)=>(
                                    <span key={ai} style={{fontSize:'10px',padding:'1px 5px',borderRadius:'4px',background:'#E6EAF4',color:'#2A4070',fontWeight:600}}>{a.sub_roles?.name||a.departments?.name||'—'}</span>
                                  ))}
                                  {q.question_assignments.length>2&&<span style={{fontSize:'10px',color:'var(--t3)'}}>+{q.question_assignments.length-2}</span>}
                                </div>
                              ) : <span style={{fontSize:'11px',color:'var(--t3)'}}>All</span>}
                            </td>
                            <td style={{padding:'10px 14px'}}>
                              <button onClick={()=>toggleActive(q.id,q.active)} style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'100px',border:'none',cursor:'pointer',background:q.active?'#EAF3DE':'#F1EFE8',color:q.active?'#27500A':'#5F5E5A'}}>{q.active?'Active':'Inactive'}</button>
                            </td>
                            <td style={{padding:'10px 14px'}}>
                              <div style={{display:'flex',gap:'4px'}}>
                                <button onClick={()=>{setDetailQ(q);setShowForm(false)}} style={{padding:'4px 9px',borderRadius:'5px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11px',fontWeight:600,color:'var(--t2)',fontFamily:'var(--fb)'}}>View</button>
                                <button onClick={()=>startEdit(q)} style={{padding:'4px 9px',borderRadius:'5px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>Edit</button>
                                <button onClick={()=>deleteQuestion(q.id)} style={{padding:'4px 9px',borderRadius:'5px',border:'1.5px solid #FECACA',background:'#FEF2F2',cursor:'pointer',fontSize:'11px',fontWeight:600,color:'#DC2626',fontFamily:'var(--fb)'}}>Del</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:'12.5px',color:'var(--t3)'}}>Showing {qPage*PAGE_SIZE+1}–{Math.min((qPage+1)*PAGE_SIZE,qTotal)} of {qTotal.toLocaleString()}</span>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button onClick={()=>{const p=Math.max(0,qPage-1);setQPage(p);loadQuestions(p)}} disabled={qPage===0} style={{padding:'6px 14px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:qPage===0?'default':'pointer',fontSize:'12.5px',fontWeight:600,color:qPage===0?'var(--t3)':'var(--navy)',fontFamily:'var(--fb)'}}>← Prev</button>
                      <span style={{padding:'6px 12px',fontSize:'12.5px',color:'var(--t2)'}}>{qPage+1} / {totalPages}</span>
                      <button onClick={()=>{const p=Math.min(totalPages-1,qPage+1);setQPage(p);loadQuestions(p)}} disabled={qPage>=totalPages-1} style={{padding:'6px 14px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:qPage>=totalPages-1?'default':'pointer',fontSize:'12.5px',fontWeight:600,color:qPage>=totalPages-1?'var(--t3)':'var(--navy)',fontFamily:'var(--fb)'}}>Next →</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection !== 'dashboard' && activeSection !== 'questions' && (
            <div style={{background:'#fff',borderRadius:'14px',padding:'40px',border:'1px solid var(--bdr)',textAlign:'center'}}>
              <div style={{fontSize:'36px',marginBottom:'14px'}}>🚧</div>
              <h3 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',marginBottom:'6px',textTransform:'capitalize'}}>{activeSection} Panel</h3>
              <p style={{fontSize:'14px',color:'var(--t3)'}}>Coming in the next phase.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
