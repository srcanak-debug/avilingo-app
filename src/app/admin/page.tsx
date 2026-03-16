'use client'
import { useEffect, useState, useRef } from 'react'
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

const ROLE_PROFILES: Record<string, string[]> = {
  'general':      ['grammar','reading','listening','writing','speaking'],
  'flight_deck':  ['grammar','reading','listening','writing','speaking'],
  'cabin_crew':   ['grammar','listening','reading','speaking','writing'],
  'atc':          ['grammar','listening','reading','speaking','writing'],
  'maintenance':  ['grammar','reading','writing','listening','speaking'],
  'ground_staff': ['grammar','reading','listening','writing','speaking'],
}

const COMPETENCY_TAGS: Record<string,string[]> = {
  grammar:   ['structural_accuracy','tense_usage','conditional_forms','passive_voice','phraseology_grammar','technical_writing'],
  reading:   ['sop_comprehension','notam_interpretation','weather_report_reading','technical_manual','safety_card_reading','atc_clearance_reading'],
  listening: ['atc_phraseology','cockpit_communication','cabin_announcement','emergency_broadcast','ground_ops_radio','passenger_instruction'],
  writing:   ['incident_report','maintenance_log','passenger_complaint','operational_message','technical_description','safety_report'],
  speaking:  ['roleplay_emergency','roleplay_passenger','roleplay_atc','oral_briefing','crew_coordination','ground_communication'],
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({ users:0, exams:0, questions:0, orgs:0 })
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [questions, setQuestions] = useState<any[]>([])
  const [qLoading, setQLoading] = useState(false)
  const [showAddQ, setShowAddQ] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [qFilter, setQFilter] = useState('all')
  const [departments, setDepartments] = useState<any[]>([])
  const [subRoles, setSubRoles] = useState<any[]>([])
  const [useCases, setUseCases] = useState<any[]>([])
  const [newQ, setNewQ] = useState({
    section:'grammar', type:'multiple_choice', content:'',
    correct_answer:'', cefr_level:'B1', difficulty:'medium',
    competency_tag:'', aircraft_context:'', audio_url:''
  })
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [selectedSubRoles, setSelectedSubRoles] = useState<string[]>([])
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [editQ, setEditQ] = useState<any>(null)
  const [bulkText, setBulkText] = useState('')
  const [bulkFile, setBulkFile] = useState<File|null>(null)
  const [bulkParsed, setBulkParsed] = useState<any[]>([])
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkSection, setBulkSection] = useState('grammar')
  const [bulkCefr, setBulkCefr] = useState('B1')
  const [bulkDifficulty, setBulkDifficulty] = useState('medium')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { checkAuth(); loadStats(); loadTaxonomy() }, [])
  useEffect(() => { if (activeSection === 'questions') loadQuestions() }, [activeSection, qFilter])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('role, full_name').eq('id', user.id).single()
    if (data?.role !== 'super_admin') { router.push('/login'); return }
    setAdminName(data.full_name || 'Admin')
    setLoading(false)
  }

  async function loadStats() {
    const [u,e,q,o] = await Promise.all([
      supabase.from('users').select('id',{count:'exact',head:true}),
      supabase.from('exams').select('id',{count:'exact',head:true}),
      supabase.from('questions').select('id',{count:'exact',head:true}),
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

  async function loadQuestions() {
    setQLoading(true)
    let query = supabase.from('questions').select('*, question_assignments(id, departments(name,code), sub_roles(name,code), use_cases(name,code), min_cefr)').order('created_at',{ascending:false})
    if (qFilter !== 'all') query = query.eq('section', qFilter)
    const { data } = await query
    setQuestions(data||[])
    setQLoading(false)
  }

  async function saveQuestion() {
    if (!newQ.content) return
    setSaving(true)
    let qId = editQ?.id
    if (editQ) {
      await supabase.from('questions').update(newQ).eq('id', editQ.id)
      await supabase.from('question_assignments').delete().eq('question_id', editQ.id)
    } else {
      const { data } = await supabase.from('questions').insert(newQ).select().single()
      qId = data?.id
    }
    if (qId && (selectedDepts.length || selectedSubRoles.length)) {
      const assignments: any[] = []
      if (selectedDepts.length && !selectedSubRoles.length) {
        selectedDepts.forEach(dId => {
          selectedUseCases.forEach(uId => assignments.push({ question_id:qId, department_id:dId, use_case_id:uId, min_cefr:newQ.cefr_level }))
          if (!selectedUseCases.length) assignments.push({ question_id:qId, department_id:dId, min_cefr:newQ.cefr_level })
        })
      } else {
        selectedSubRoles.forEach(sId => {
          selectedUseCases.forEach(uId => assignments.push({ question_id:qId, sub_role_id:sId, use_case_id:uId, min_cefr:newQ.cefr_level }))
          if (!selectedUseCases.length) assignments.push({ question_id:qId, sub_role_id:sId, min_cefr:newQ.cefr_level })
        })
      }
      if (assignments.length) await supabase.from('question_assignments').insert(assignments)
    }
    setSaving(false)
    setShowAddQ(false); setEditQ(null)
    setNewQ({ section:'grammar', type:'multiple_choice', content:'', correct_answer:'', cefr_level:'B1', difficulty:'medium', competency_tag:'', aircraft_context:'', audio_url:'' })
    setSelectedDepts([]); setSelectedSubRoles([]); setSelectedUseCases([])
    loadQuestions(); loadStats()
  }

  async function deleteQuestion(id: string) {
    if (!confirm('Delete this question?')) return
    await supabase.from('questions').delete().eq('id', id)
    loadQuestions(); loadStats()
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('questions').update({ active: !current }).eq('id', id)
    loadQuestions()
  }

  function startEdit(q: any) {
    setEditQ(q)
    setNewQ({ section:q.section, type:q.type, content:q.content, correct_answer:q.correct_answer||'', cefr_level:q.cefr_level||'B1', difficulty:q.difficulty||'medium', competency_tag:q.competency_tag||'', aircraft_context:q.aircraft_context||'', audio_url:q.audio_url||'' })
    setShowAddQ(true)
  }

  function toggleArr(arr: string[], setArr: (v:string[])=>void, val: string) {
    setArr(arr.includes(val) ? arr.filter(x=>x!==val) : [...arr,val])
  }

  function parseText(text: string) {
    const lines = text.split('\n').map(l=>l.trim()).filter(Boolean)
    const parsed: any[] = []
    let current: any = null
    for (const line of lines) {
      if (/^\d+[\.\)]\s/.test(line)) {
        if (current) parsed.push(current)
        current = { section:bulkSection, type:'multiple_choice', content:line.replace(/^\d+[\.\)]\s/,''), correct_answer:'', cefr_level:bulkCefr, difficulty:bulkDifficulty, competency_tag:'', aircraft_context:'', audio_url:'', active:true }
      } else if (current && /^[A-D][\.\)]\s/.test(line)) {
        current.content += '\n'+line
      } else if (current && /^(Answer|Correct|Key|ANSWER)[\s:]/i.test(line)) {
        current.correct_answer = line.replace(/^(Answer|Correct|Key|ANSWER)[\s:]*/i,'').trim()
      } else if (current) {
        current.content += ' '+line
      }
    }
    if (current) parsed.push(current)
    return parsed
  }

  async function handleFileUpload(file: File) {
    setBulkFile(file); setBulkStatus('Reading file...'); setBulkLoading(true)
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'txt') {
      const text = await file.text()
      const parsed = parseText(text)
      setBulkParsed(parsed)
      setBulkStatus(`Found ${parsed.length} questions. Review and confirm.`)
    } else if (ext === 'csv') {
      const text = await file.text()
      const lines = text.split('\n').filter(Boolean)
      const headers = lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/"/g,''))
      const parsed = lines.slice(1).map(line => {
        const vals = line.split(',').map(v=>v.trim().replace(/"/g,''))
        const obj: any = { section:bulkSection, type:'multiple_choice', cefr_level:bulkCefr, difficulty:bulkDifficulty, active:true, audio_url:'', competency_tag:'', aircraft_context:'' }
        headers.forEach((h,i) => { if(vals[i]) obj[h]=vals[i] })
        return obj
      }).filter(q=>q.content)
      setBulkParsed(parsed)
      setBulkStatus(`Found ${parsed.length} questions from CSV.`)
    } else {
      setBulkStatus(`${ext?.toUpperCase()} detected. Export as CSV or TXT for automatic parsing.`)
    }
    setBulkLoading(false)
  }

  async function confirmBulkUpload() {
    if (!bulkParsed.length) return
    setBulkLoading(true); setBulkStatus('Uploading questions...')
    const { error } = await supabase.from('questions').insert(bulkParsed)
    if (error) { setBulkStatus('Error: '+error.message); setBulkLoading(false); return }
    setBulkStatus(`✅ Successfully added ${bulkParsed.length} questions!`)
    setBulkParsed([]); setBulkFile(null); setBulkText(''); setBulkLoading(false)
    loadQuestions(); loadStats()
    setTimeout(() => { setShowBulk(false); setBulkStatus('') }, 2000)
  }

  function parseBulkText() {
    const parsed = parseText(bulkText)
    setBulkParsed(parsed)
    setBulkStatus(parsed.length > 0 ? `Found ${parsed.length} questions.` : 'No questions detected.')
  }

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/login') }

  if (loading) return <div style={{minHeight:'100vh',background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'#fff'}}>Loading...</div></div>

  const sections = ['grammar','reading','writing','speaking','listening']
  const cefrLevels = ['A1','A2','B1','B2','C1']
  const filteredSubRoles = selectedDepts.length
    ? subRoles.filter(s => selectedDepts.includes(s.department_id))
    : subRoles

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'var(--fb)'}}>
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

      <div style={{flex:1,background:'var(--off)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{background:'#fff',padding:'14px 28px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <h1 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',textTransform:'capitalize'}}>{activeSection==='questions'?'Question Bank':activeSection}</h1>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'12px',padding:'3px 10px',borderRadius:'100px',background:'#EAF3DE',color:'#27500A',fontWeight:600}}>System Online</span>
            <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'var(--sky3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'var(--sky)'}}>{adminName.charAt(0)}</div>
          </div>
        </div>

        <div style={{padding:'28px',flex:1,overflowY:'auto'}}>

          {/* DASHBOARD */}
          {activeSection === 'dashboard' && (
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'24px'}}>
                {[{label:'Total Users',value:stats.users,color:'#5AAEDF'},{label:'Total Exams',value:stats.exams,color:'#12B898'},{label:'Questions',value:stats.questions,color:'#DEAC50'},{label:'Organizations',value:stats.orgs,color:'#E06070'}].map(m => (
                  <div key={m.label} style={{background:'#fff',borderRadius:'12px',padding:'20px',border:'1px solid var(--bdr)'}}>
                    <div style={{fontSize:'12px',color:'var(--t3)',marginBottom:'6px'}}>{m.label}</div>
                    <div style={{fontSize:'28px',fontWeight:700,color:m.color,fontFamily:'var(--fm)'}}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'1px solid var(--bdr)',marginBottom:'20px'}}>
                <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>Section Order by Role Profile</h3>
                <p style={{fontSize:'12px',color:'var(--t3)',marginBottom:'14px'}}>ICAO Doc 9835 optimized sequencing</p>
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {Object.entries(ROLE_PROFILES).map(([role,order]) => (
                    <div key={role} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',borderRadius:'8px',border:'1px solid var(--bdr)',background:'var(--off)'}}>
                      <span style={{fontSize:'12px',fontWeight:700,color:'var(--navy)',width:'120px',textTransform:'capitalize',flexShrink:0}}>{role.replace('_',' ')}</span>
                      <div style={{display:'flex',gap:'4px',alignItems:'center',flexWrap:'wrap'}}>
                        {order.map((s,i) => (
                          <div key={s} style={{display:'flex',alignItems:'center',gap:'3px'}}>
                            <span style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'100px',background:sectionColors[s]+'20',color:sectionColors[s],textTransform:'capitalize'}}>{i+1}. {s}</span>
                            {i<order.length-1 && <span style={{color:'var(--t3)',fontSize:'11px'}}>→</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'1px solid var(--bdr)'}}>
                <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',marginBottom:'14px'}}>Quick Actions</h3>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                  {[{label:'Add Question',s:'questions'},{label:'Bulk Upload',s:'questions',bulk:true},{label:'Create Template',s:'templates'},{label:'Invite User',s:'users'},{label:'Grading Queue',s:'evaluator'}].map(a => (
                    <button key={a.label} onClick={() => { setActiveSection(a.s); if(a.bulk) setShowBulk(true) }} style={{padding:'9px 16px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'13px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>{a.label} →</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* QUESTION BANK */}
          {activeSection === 'questions' && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'10px'}}>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                  {['all',...sections].map(s => (
                    <button key={s} onClick={() => setQFilter(s)} style={{padding:'7px 13px',borderRadius:'8px',border:'1.5px solid',borderColor:qFilter===s?(sectionColors[s]||'var(--navy)'):'var(--bdr)',background:qFilter===s?(sectionColors[s]||'var(--navy)'):'#fff',color:qFilter===s?'#fff':'var(--t2)',fontSize:'12px',fontWeight:600,cursor:'pointer',textTransform:'capitalize',fontFamily:'var(--fb)'}}>
                      {s==='all'?`All (${stats.questions})`:s}
                    </button>
                  ))}
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button onClick={() => { setShowBulk(true); setShowAddQ(false) }} style={{padding:'10px 16px',borderRadius:'8px',border:'1.5px solid var(--sky)',background:'var(--sky3)',color:'var(--sky)',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>⬆ Bulk Upload</button>
                  <button onClick={() => { setShowAddQ(true); setEditQ(null); setShowBulk(false) }} style={{padding:'10px 18px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>+ Add Question</button>
                </div>
              </div>

              {/* BULK UPLOAD */}
              {showBulk && (
                <div style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'2px solid var(--sky)',marginBottom:'20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'16px'}}>
                    <div>
                      <h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'3px'}}>Bulk Question Upload</h3>
                      <p style={{fontSize:'12.5px',color:'var(--t3)'}}>Upload TXT, CSV or paste text. Word/Excel/PDF → export as CSV or TXT first.</p>
                    </div>
                    <button onClick={() => { setShowBulk(false); setBulkParsed([]); setBulkStatus('') }} style={{padding:'6px 14px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'12px',color:'var(--t2)',fontFamily:'var(--fb)'}}>Close</button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'16px',padding:'14px',background:'var(--off)',borderRadius:'10px'}}>
                    <div><label style={{fontSize:'11.5px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'4px'}}>Default Section</label>
                      <select value={bulkSection} onChange={e=>setBulkSection(e.target.value)} style={{padding:'8px 10px',borderRadius:'7px',border:'1.5px solid var(--bdr)',fontSize:'12.5px',width:'100%',fontFamily:'var(--fb)'}}>
                        {sections.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                      </select></div>
                    <div><label style={{fontSize:'11.5px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'4px'}}>Default CEFR</label>
                      <select value={bulkCefr} onChange={e=>setBulkCefr(e.target.value)} style={{padding:'8px 10px',borderRadius:'7px',border:'1.5px solid var(--bdr)',fontSize:'12.5px',width:'100%',fontFamily:'var(--fb)'}}>
                        {cefrLevels.map(l=><option key={l} value={l}>{l}</option>)}
                      </select></div>
                    <div><label style={{fontSize:'11.5px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'4px'}}>Default Difficulty</label>
                      <select value={bulkDifficulty} onChange={e=>setBulkDifficulty(e.target.value)} style={{padding:'8px 10px',borderRadius:'7px',border:'1.5px solid var(--bdr)',fontSize:'12.5px',width:'100%',fontFamily:'var(--fb)'}}>
                        <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                      </select></div>
                  </div>
                  <div onClick={() => fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleFileUpload(f)}} style={{border:'2px dashed var(--bdr)',borderRadius:'10px',padding:'28px',textAlign:'center',cursor:'pointer',marginBottom:'14px',background:'var(--off)'}}>
                    <div style={{fontSize:'28px',marginBottom:'8px'}}>📂</div>
                    <div style={{fontSize:'13.5px',fontWeight:600,color:'var(--navy)',marginBottom:'3px'}}>Drop file here or click to browse</div>
                    <div style={{fontSize:'12px',color:'var(--t3)'}}>TXT, CSV supported · Word/Excel/PDF → export as CSV or TXT</div>
                    <input ref={fileRef} type="file" accept=".txt,.csv,.pdf,.doc,.docx,.xlsx,.xls" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)handleFileUpload(f)}} />
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
                    <div style={{background:'#F0F9FF',borderRadius:'8px',padding:'12px',border:'1px solid #BAE6FD'}}>
                      <div style={{fontSize:'12px',fontWeight:700,color:'#0C4A6E',marginBottom:'6px'}}>TXT Format:</div>
                      <pre style={{fontSize:'11px',color:'#0C4A6E',fontFamily:'monospace',lineHeight:1.5,margin:0}}>{`1. The captain declared emergency due to ___
A. engine fire  B. fuel shortage
C. hydraulic failure  D. bird strike
Answer: C`}</pre>
                    </div>
                    <div style={{background:'#F0FDF4',borderRadius:'8px',padding:'12px',border:'1px solid #BBF7D0'}}>
                      <div style={{fontSize:'12px',fontWeight:700,color:'#14532D',marginBottom:'6px'}}>CSV Format:</div>
                      <pre style={{fontSize:'11px',color:'#14532D',fontFamily:'monospace',lineHeight:1.5,margin:0}}>{`content,correct_answer,cefr_level,section
"What does MAYDAY mean?","Distress",B2,listening
"The aircraft ___","landed",B1,grammar`}</pre>
                    </div>
                  </div>
                  <div style={{marginBottom:'14px'}}>
                    <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Or paste text directly:</label>
                    <textarea value={bulkText} onChange={e=>setBulkText(e.target.value)} placeholder="Paste questions here..." rows={6} style={{padding:'10px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'monospace',resize:'vertical'}} />
                    <button onClick={parseBulkText} style={{marginTop:'6px',padding:'8px 18px',borderRadius:'7px',border:'1.5px solid var(--sky)',background:'var(--sky3)',color:'var(--sky)',fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Parse</button>
                  </div>
                  {bulkStatus && <div style={{padding:'10px 14px',borderRadius:'8px',background:bulkStatus.includes('✅')?'#EAF3DE':bulkStatus.includes('Error')?'#FEE2E2':'var(--sky3)',color:bulkStatus.includes('✅')?'#27500A':bulkStatus.includes('Error')?'#991B1B':'#0C447C',fontSize:'13px',fontWeight:500,marginBottom:'12px'}}>{bulkStatus}</div>}
                  {bulkParsed.length > 0 && (
                    <div>
                      <h4 style={{fontFamily:'var(--fm)',fontSize:'13px',fontWeight:800,color:'var(--navy)',marginBottom:'10px'}}>Preview — {bulkParsed.length} questions:</h4>
                      <div style={{maxHeight:'240px',overflowY:'auto',border:'1px solid var(--bdr)',borderRadius:'8px',marginBottom:'14px'}}>
                        {bulkParsed.map((q,i) => (
                          <div key={i} style={{padding:'10px 14px',borderBottom:'1px solid var(--bdr)',background:i%2===0?'#fff':'#FAFBFC'}}>
                            <div style={{display:'flex',gap:'6px',marginBottom:'3px'}}>
                              <span style={{fontSize:'11px',fontWeight:700,padding:'2px 7px',borderRadius:'100px',background:sectionColors[q.section]+'20',color:sectionColors[q.section],textTransform:'capitalize'}}>{q.section}</span>
                              <span style={{fontSize:'11px',color:'var(--t3)'}}>{q.cefr_level} · {q.difficulty}</span>
                            </div>
                            <div style={{fontSize:'12.5px',color:'var(--t1)'}}>{q.content.substring(0,100)}{q.content.length>100?'...':''}</div>
                            {q.correct_answer && <div style={{fontSize:'11.5px',color:'#27500A'}}>✓ {q.correct_answer}</div>}
                          </div>
                        ))}
                      </div>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button onClick={confirmBulkUpload} disabled={bulkLoading} style={{padding:'10px 24px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{bulkLoading?'Uploading...':`✓ Upload ${bulkParsed.length} Questions`}</button>
                        <button onClick={() => {setBulkParsed([]);setBulkStatus('')}} style={{padding:'10px 18px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',color:'var(--t2)',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Clear</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ADD/EDIT FORM */}
              {showAddQ && (
                <div style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'2px solid var(--sky)',marginBottom:'20px'}}>
                  <h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'20px'}}>{editQ?'Edit Question':'Add New Question'}</h3>

                  {/* Basic fields */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'14px'}}>
                    {[
                      {label:'Section *',key:'section',opts:sections.map(s=>({v:s,l:s.charAt(0).toUpperCase()+s.slice(1)}))},
                      {label:'Type *',key:'type',opts:[{v:'multiple_choice',l:'Multiple Choice'},{v:'fill_blank',l:'Fill in the Blank'},{v:'drag_drop',l:'Drag & Drop'},{v:'audio_response',l:'Audio Response'},{v:'written_response',l:'Written Response'},{v:'listening',l:'Listening Comprehension'}]},
                      {label:'CEFR Level *',key:'cefr_level',opts:cefrLevels.map(l=>({v:l,l}))},
                      {label:'Difficulty',key:'difficulty',opts:[{v:'easy',l:'Easy'},{v:'medium',l:'Medium'},{v:'hard',l:'Hard'}]},
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>{f.label}</label>
                        <select value={(newQ as any)[f.key]} onChange={e=>setNewQ({...newQ,[f.key]:e.target.value})} style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)'}}>
                          {f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      </div>
                    ))}
                    <div>
                      <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Competency Tag</label>
                      <select value={newQ.competency_tag} onChange={e=>setNewQ({...newQ,competency_tag:e.target.value})} style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)'}}>
                        <option value="">-- Select tag --</option>
                        {(COMPETENCY_TAGS[newQ.section]||[]).map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Aircraft Context</label>
                      <input value={newQ.aircraft_context} onChange={e=>setNewQ({...newQ,aircraft_context:e.target.value})} placeholder="e.g. A320, B737, general" style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%'}} />
                    </div>
                  </div>

                  <div style={{marginBottom:'12px'}}>
                    <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Question Content *</label>
                    <textarea value={newQ.content} onChange={e=>setNewQ({...newQ,content:e.target.value})} placeholder="Enter full question text..." rows={4} style={{padding:'10px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)',resize:'vertical'}} />
                  </div>
                  <div style={{marginBottom:'14px'}}>
                    <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Correct Answer</label>
                    <input value={newQ.correct_answer} onChange={e=>setNewQ({...newQ,correct_answer:e.target.value})} placeholder="A, B, C or D for MC. Model answer for others." style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%'}} />
                  </div>
                  {(newQ.section==='listening'||newQ.section==='speaking') && (
                    <div style={{marginBottom:'14px'}}>
                      <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Audio URL</label>
                      <input value={newQ.audio_url} onChange={e=>setNewQ({...newQ,audio_url:e.target.value})} placeholder="https://..." style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%'}} />
                    </div>
                  )}

                  {/* DEPARTMENT ASSIGNMENT */}
                  <div style={{background:'var(--off)',borderRadius:'10px',padding:'16px',marginBottom:'14px'}}>
                    <h4 style={{fontFamily:'var(--fm)',fontSize:'13px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>Department & Role Assignment <span style={{fontSize:'11px',fontWeight:400,color:'var(--t3)'}}>(select all that apply)</span></h4>
                    <div style={{marginBottom:'12px'}}>
                      <label style={{fontSize:'11.5px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'6px'}}>Departments</label>
                      <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                        {departments.map(d => (
                          <button key={d.id} onClick={() => toggleArr(selectedDepts,setSelectedDepts,d.id)} style={{padding:'5px 12px',borderRadius:'100px',border:'1.5px solid',borderColor:selectedDepts.includes(d.id)?'var(--navy)':'var(--bdr)',background:selectedDepts.includes(d.id)?'var(--navy)':'#fff',color:selectedDepts.includes(d.id)?'#fff':'var(--t2)',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                            {d.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    {selectedDepts.length > 0 && (
                      <div style={{marginBottom:'12px'}}>
                        <label style={{fontSize:'11.5px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'6px'}}>Sub-roles <span style={{fontWeight:400,color:'var(--t3)'}}>(optional — leave blank for all sub-roles)</span></label>
                        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                          {filteredSubRoles.map(s => (
                            <button key={s.id} onClick={() => toggleArr(selectedSubRoles,setSelectedSubRoles,s.id)} style={{padding:'5px 12px',borderRadius:'100px',border:'1.5px solid',borderColor:selectedSubRoles.includes(s.id)?'var(--sky)':'var(--bdr)',background:selectedSubRoles.includes(s.id)?'var(--sky3)':'#fff',color:selectedSubRoles.includes(s.id)?'var(--sky)':'var(--t2)',fontSize:'11.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                              {s.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <label style={{fontSize:'11.5px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'6px'}}>Use Cases <span style={{fontWeight:400,color:'var(--t3)'}}>(when should this question appear?)</span></label>
                      <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                        {useCases.map(u => (
                          <button key={u.id} onClick={() => toggleArr(selectedUseCases,setSelectedUseCases,u.id)} style={{padding:'5px 12px',borderRadius:'100px',border:'1.5px solid',borderColor:selectedUseCases.includes(u.id)?'var(--teal)':'var(--bdr)',background:selectedUseCases.includes(u.id)?'var(--teal3)':'#fff',color:selectedUseCases.includes(u.id)?'var(--teal)':'var(--t2)',fontSize:'11.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                            {u.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{display:'flex',gap:'10px'}}>
                    <button onClick={saveQuestion} disabled={saving} style={{padding:'10px 24px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{saving?'Saving...':editQ?'Update':'Save Question'}</button>
                    <button onClick={() => {setShowAddQ(false);setEditQ(null);setSelectedDepts([]);setSelectedSubRoles([]);setSelectedUseCases([])}} style={{padding:'10px 18px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',color:'var(--t2)',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Cancel</button>
                  </div>
                </div>
              )}

              {/* QUESTIONS TABLE */}
              {qLoading ? (
                <div style={{textAlign:'center',padding:'40px',color:'var(--t3)'}}>Loading questions...</div>
              ) : questions.length === 0 ? (
                <div style={{background:'#fff',borderRadius:'14px',padding:'60px',border:'1px solid var(--bdr)',textAlign:'center'}}>
                  <div style={{fontSize:'36px',marginBottom:'12px'}}>📝</div>
                  <h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'8px'}}>No questions yet</h3>
                  <div style={{display:'flex',gap:'10px',justifyContent:'center',marginTop:'16px'}}>
                    <button onClick={() => setShowAddQ(true)} style={{padding:'10px 20px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>+ Add Question</button>
                    <button onClick={() => setShowBulk(true)} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid var(--sky)',background:'var(--sky3)',color:'var(--sky)',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>⬆ Bulk Upload</button>
                  </div>
                </div>
              ) : (
                <div style={{background:'#fff',borderRadius:'14px',border:'1px solid var(--bdr)',overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr style={{borderBottom:'1px solid var(--bdr)',background:'var(--off)'}}>
                        {['Section','Question','CEFR','Difficulty','Assignments','Status','Actions'].map(h => (
                          <th key={h} style={{padding:'11px 14px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q,i) => (
                        <tr key={q.id} style={{borderBottom:'1px solid var(--bdr)',background:i%2===0?'#fff':'#FAFBFC'}}>
                          <td style={{padding:'11px 14px'}}>
                            <span style={{fontSize:'11px',fontWeight:700,padding:'3px 8px',borderRadius:'100px',background:(sectionColors[q.section]||'#888')+'20',color:sectionColors[q.section]||'#888',textTransform:'capitalize'}}>{q.section}</span>
                          </td>
                          <td style={{padding:'11px 14px',maxWidth:'240px'}}>
                            <div style={{fontSize:'13px',color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.content}</div>
                            {q.competency_tag && <div style={{fontSize:'11px',color:'var(--t3)',marginTop:'1px'}}>{q.competency_tag.replace(/_/g,' ')}</div>}
                          </td>
                          <td style={{padding:'11px 14px'}}>
                            <span style={{fontSize:'12px',fontWeight:700,padding:'2px 7px',borderRadius:'6px',background:'var(--sky3)',color:'var(--sky)'}}>{q.cefr_level}</span>
                          </td>
                          <td style={{padding:'11px 14px'}}>
                            <span style={{fontSize:'11.5px',fontWeight:600,padding:'2px 7px',borderRadius:'6px',textTransform:'capitalize',background:q.difficulty==='easy'?'#EAF3DE':q.difficulty==='hard'?'#FCEBEB':'#FAEEDA',color:q.difficulty==='easy'?'#27500A':q.difficulty==='hard'?'#791F1F':'#633806'}}>{q.difficulty}</span>
                          </td>
                          <td style={{padding:'11px 14px'}}>
                            {q.question_assignments?.length > 0 ? (
                              <div style={{display:'flex',gap:'3px',flexWrap:'wrap'}}>
                                {q.question_assignments.slice(0,3).map((a: any,ai: number) => (
                                  <span key={ai} style={{fontSize:'10.5px',padding:'1px 6px',borderRadius:'4px',background:'#E6EAF4',color:'#2A4070',fontWeight:600}}>
                                    {a.sub_roles?.name || a.departments?.name || '—'}
                                  </span>
                                ))}
                                {q.question_assignments.length > 3 && <span style={{fontSize:'10.5px',color:'var(--t3)'}}>+{q.question_assignments.length-3}</span>}
                              </div>
                            ) : <span style={{fontSize:'11px',color:'var(--t3)'}}>All roles</span>}
                          </td>
                          <td style={{padding:'11px 14px'}}>
                            <button onClick={() => toggleActive(q.id,q.active)} style={{fontSize:'11px',fontWeight:700,padding:'3px 8px',borderRadius:'100px',border:'none',cursor:'pointer',background:q.active?'#EAF3DE':'#F1EFE8',color:q.active?'#27500A':'#5F5E5A'}}>{q.active?'Active':'Inactive'}</button>
                          </td>
                          <td style={{padding:'11px 14px'}}>
                            <div style={{display:'flex',gap:'5px'}}>
                              <button onClick={() => startEdit(q)} style={{padding:'4px 10px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11.5px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>Edit</button>
                              <button onClick={() => deleteQuestion(q.id)} style={{padding:'4px 10px',borderRadius:'6px',border:'1.5px solid #FECACA',background:'#FEF2F2',cursor:'pointer',fontSize:'11.5px',fontWeight:600,color:'#DC2626',fontFamily:'var(--fb)'}}>Del</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection !== 'dashboard' && activeSection !== 'questions' && (
            <div style={{background:'#fff',borderRadius:'14px',padding:'40px',border:'1px solid var(--bdr)',textAlign:'center'}}>
              <div style={{fontSize:'40px',marginBottom:'16px'}}>🚧</div>
              <h3 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',marginBottom:'8px',textTransform:'capitalize'}}>{activeSection} Panel</h3>
              <p style={{fontSize:'14px',color:'var(--t3)'}}>Coming in the next phase.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
