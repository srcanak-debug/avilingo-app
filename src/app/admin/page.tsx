'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const navItems = [
  { id:'dashboard', label:'Dashboard' },
  { id:'users', label:'Users' },
  { id:'organizations', label:'Organizations' },
  { id:'questions', label:'Question Bank' },
  { id:'exams', label:'Exams' },
  { id:'templates', label:'Exam Templates' },
  { id:'evaluator', label:'Grading Queue' },
  { id:'reports', label:'Reports' },
  { id:'invoices', label:'Invoices' },
  { id:'emails', label:'Email Templates' },
  { id:'audit', label:'Audit Logs' },
]

const ROLE_PROFILES: Record<string, string[]> = {
  'general':      ['grammar','reading','listening','writing','speaking'],
  'flight_deck':  ['grammar','reading','listening','writing','speaking'],
  'cabin_crew':   ['grammar','listening','reading','speaking','writing'],
  'atc':          ['grammar','listening','reading','speaking','writing'],
  'maintenance':  ['grammar','reading','writing','listening','speaking'],
  'ground_staff': ['grammar','reading','listening','writing','speaking'],
}

const sectionColors: Record<string,string> = {
  grammar:'#3A8ED0', reading:'#0A8870', writing:'#B8881A', speaking:'#B83040', listening:'#7C3AED'
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
  const [newQ, setNewQ] = useState({ section:'grammar', type:'multiple_choice', content:'', correct_answer:'', cefr_level:'B1', difficulty:'medium', competency_tag:'', aircraft_context:'', audio_url:'' })
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

  useEffect(() => { checkAuth(); loadStats() }, [])
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

  async function loadQuestions() {
    setQLoading(true)
    let query = supabase.from('questions').select('*').order('created_at',{ascending:false})
    if (qFilter !== 'all') query = query.eq('section', qFilter)
    const { data } = await query
    setQuestions(data || [])
    setQLoading(false)
  }

  async function saveQuestion() {
    if (!newQ.content) return
    setSaving(true)
    if (editQ) await supabase.from('questions').update(newQ).eq('id', editQ.id)
    else await supabase.from('questions').insert(newQ)
    setSaving(false)
    setShowAddQ(false); setEditQ(null)
    setNewQ({ section:'grammar', type:'multiple_choice', content:'', correct_answer:'', cefr_level:'B1', difficulty:'medium', competency_tag:'', aircraft_context:'', audio_url:'' })
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

  // ── BULK UPLOAD ──
  function parseText(text: string) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const parsed: any[] = []
    let current: any = null
    for (const line of lines) {
      if (/^\d+[\.\)]\s/.test(line)) {
        if (current) parsed.push(current)
        current = { section: bulkSection, type: 'multiple_choice', content: line.replace(/^\d+[\.\)]\s/,''), correct_answer:'', cefr_level: bulkCefr, difficulty: bulkDifficulty, competency_tag:'', aircraft_context:'', audio_url:'', active: true }
      } else if (current && /^[A-D][\.\)]\s/.test(line)) {
        current.content += '\n' + line
      } else if (current && /^(Answer|Correct|Key|ANSWER)[\s:]/i.test(line)) {
        current.correct_answer = line.replace(/^(Answer|Correct|Key|ANSWER)[\s:]*/i,'').trim()
      } else if (current) {
        current.content += ' ' + line
      }
    }
    if (current) parsed.push(current)
    return parsed
  }

  async function handleFileUpload(file: File) {
    setBulkFile(file)
    setBulkStatus('Reading file...')
    setBulkLoading(true)

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'txt') {
      const text = await file.text()
      const parsed = parseText(text)
      setBulkParsed(parsed)
      setBulkStatus(`Found ${parsed.length} questions. Review and confirm.`)
      setBulkLoading(false)
      return
    }

    if (ext === 'csv') {
      const text = await file.text()
      const lines = text.split('\n').filter(Boolean)
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g,''))
      const parsed = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/"/g,''))
        const obj: any = { section: bulkSection, type:'multiple_choice', cefr_level: bulkCefr, difficulty: bulkDifficulty, active: true, audio_url:'', competency_tag:'', aircraft_context:'' }
        headers.forEach((h,i) => { if (vals[i]) obj[h] = vals[i] })
        return obj
      }).filter(q => q.content)
      setBulkParsed(parsed)
      setBulkStatus(`Found ${parsed.length} questions from CSV. Review and confirm.`)
      setBulkLoading(false)
      return
    }

    if (ext === 'pdf' || ext === 'docx' || ext === 'doc' || ext === 'xlsx' || ext === 'xls') {
      setBulkStatus(`${ext?.toUpperCase()} detected. Please use the text paste method below, or export your file as CSV or TXT for automatic parsing.`)
      setBulkLoading(false)
      return
    }

    setBulkStatus('Unsupported file type. Please use TXT, CSV, or paste text directly.')
    setBulkLoading(false)
  }

  async function confirmBulkUpload() {
    if (!bulkParsed.length) return
    setBulkLoading(true)
    setBulkStatus('Uploading questions...')
    const { error } = await supabase.from('questions').insert(bulkParsed)
    if (error) { setBulkStatus('Error: ' + error.message); setBulkLoading(false); return }
    setBulkStatus(`✅ Successfully added ${bulkParsed.length} questions!`)
    setBulkParsed([])
    setBulkFile(null)
    setBulkText('')
    setBulkLoading(false)
    loadQuestions(); loadStats()
    setTimeout(() => { setShowBulk(false); setBulkStatus('') }, 2000)
  }

  function parseBulkText() {
    const parsed = parseText(bulkText)
    setBulkParsed(parsed)
    setBulkStatus(parsed.length > 0 ? `Found ${parsed.length} questions. Review and confirm.` : 'No questions detected. Check formatting.')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div style={{minHeight:'100vh',background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'#fff'}}>Loading...</div></div>

  const sections = ['grammar','reading','writing','speaking','listening']
  const cefrLevels = ['A1','A2','B1','B2','C1']

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
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',padding:'8px 12px',marginBottom:'4px'}}>{adminName}</div>
          <button onClick={handleSignOut} style={{display:'block',width:'100%',textAlign:'left',padding:'9px 12px',borderRadius:'7px',border:'none',cursor:'pointer',fontSize:'13px',background:'transparent',color:'rgba(255,255,255,0.4)'}}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,background:'var(--off)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{background:'#fff',padding:'14px 28px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <h1 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',textTransform:'capitalize'}}>{activeSection}</h1>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'12px',padding:'3px 10px',borderRadius:'100px',background:'#EAF3DE',color:'#27500A',fontWeight:600}}>System Online</span>
            <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'var(--sky3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'var(--sky)'}}>{adminName.charAt(0)}</div>
          </div>
        </div>

        <div style={{padding:'28px',flex:1,overflowY:'auto'}}>

          {/* DASHBOARD */}
          {activeSection === 'dashboard' && (
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'28px'}}>
                {[{label:'Total Users',value:stats.users,color:'#5AAEDF'},{label:'Total Exams',value:stats.exams,color:'#12B898'},{label:'Questions',value:stats.questions,color:'#DEAC50'},{label:'Organizations',value:stats.orgs,color:'#E06070'}].map(m => (
                  <div key={m.label} style={{background:'#fff',borderRadius:'12px',padding:'20px',border:'1px solid var(--bdr)'}}>
                    <div style={{fontSize:'12px',color:'var(--t3)',marginBottom:'6px'}}>{m.label}</div>
                    <div style={{fontSize:'28px',fontWeight:700,color:m.color,fontFamily:'var(--fm)'}}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Section Order per Role */}
              <div style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'1px solid var(--bdr)',marginBottom:'20px'}}>
                <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',marginBottom:'6px'}}>Section Order by Role Profile</h3>
                <p style={{fontSize:'12.5px',color:'var(--t3)',marginBottom:'16px'}}>Optimized section sequencing based on ICAO Doc 9835 and aviation assessment best practices.</p>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {Object.entries(ROLE_PROFILES).map(([role, order]) => (
                    <div key={role} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 14px',borderRadius:'8px',border:'1px solid var(--bdr)',background:'var(--off)'}}>
                      <span style={{fontSize:'12px',fontWeight:700,color:'var(--navy)',width:'120px',textTransform:'capitalize',flexShrink:0}}>{role.replace('_',' ')}</span>
                      <div style={{display:'flex',gap:'6px',alignItems:'center',flex:1}}>
                        {order.map((s,i) => (
                          <div key={s} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                            <span style={{fontSize:'11.5px',fontWeight:700,padding:'3px 10px',borderRadius:'100px',background:sectionColors[s]+'20',color:sectionColors[s],textTransform:'capitalize'}}>{i+1}. {s}</span>
                            {i < order.length-1 && <span style={{color:'var(--t3)',fontSize:'12px'}}>→</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'1px solid var(--bdr)'}}>
                <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',marginBottom:'16px'}}>Quick Actions</h3>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                  {[{label:'Add Question',section:'questions'},{label:'Bulk Upload',section:'questions'},{label:'Create Template',section:'templates'},{label:'Invite User',section:'users'},{label:'Grading Queue',section:'evaluator'},{label:'Reports',section:'reports'}].map(a => (
                    <button key={a.label} onClick={() => { setActiveSection(a.section); if(a.label==='Bulk Upload') setShowBulk(true) }} style={{padding:'9px 16px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'13px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>{a.label} →</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* QUESTION BANK */}
          {activeSection === 'questions' && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'10px'}}>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  {['all',...sections].map(s => (
                    <button key={s} onClick={() => setQFilter(s)} style={{padding:'7px 14px',borderRadius:'8px',border:'1.5px solid',borderColor:qFilter===s?(sectionColors[s]||'var(--navy)'):'var(--bdr)',background:qFilter===s?(sectionColors[s]||'var(--navy)'):'#fff',color:qFilter===s?'#fff':'var(--t2)',fontSize:'12.5px',fontWeight:600,cursor:'pointer',textTransform:'capitalize',fontFamily:'var(--fb)'}}>
                      {s === 'all' ? `All (${stats.questions})` : s}
                    </button>
                  ))}
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button onClick={() => { setShowBulk(true); setShowAddQ(false) }} style={{padding:'10px 18px',borderRadius:'8px',border:'1.5px solid var(--sky)',background:'var(--sky3)',color:'var(--sky)',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                    ⬆ Bulk Upload
                  </button>
                  <button onClick={() => { setShowAddQ(true); setEditQ(null); setShowBulk(false) }} style={{padding:'10px 20px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                    + Add Question
                  </button>
                </div>
              </div>

              {/* BULK UPLOAD PANEL */}
              {showBulk && (
                <div style={{background:'#fff',borderRadius:'14px',padding:'28px',border:'2px solid var(--sky)',marginBottom:'20px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
                    <div>
                      <h3 style={{fontFamily:'var(--fm)',fontSize:'17px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>Bulk Question Upload</h3>
                      <p style={{fontSize:'13px',color:'var(--t3)'}}>Upload TXT, CSV files or paste text directly. Word, Excel and PDF: export as TXT or CSV first.</p>
                    </div>
                    <button onClick={() => { setShowBulk(false); setBulkParsed([]); setBulkStatus('') }} style={{padding:'6px 14px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'12.5px',color:'var(--t2)',fontFamily:'var(--fb)'}}>Close</button>
                  </div>

                  {/* Default settings for bulk */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'20px',padding:'16px',background:'var(--off)',borderRadius:'10px'}}>
                    <div>
                      <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Default Section</label>
                      <select value={bulkSection} onChange={e => setBulkSection(e.target.value)} style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)'}}>
                        {sections.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Default CEFR Level</label>
                      <select value={bulkCefr} onChange={e => setBulkCefr(e.target.value)} style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)'}}>
                        {cefrLevels.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Default Difficulty</label>
                      <select value={bulkDifficulty} onChange={e => setBulkDifficulty(e.target.value)} style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)'}}>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* File drop zone */}
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault() }}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) handleFileUpload(f) }}
                    style={{border:'2px dashed var(--bdr)',borderRadius:'12px',padding:'32px',textAlign:'center',cursor:'pointer',marginBottom:'16px',background:'var(--off)',transition:'border-color 0.2s'}}
                  >
                    <div style={{fontSize:'32px',marginBottom:'10px'}}>📂</div>
                    <div style={{fontSize:'14px',fontWeight:600,color:'var(--navy)',marginBottom:'4px'}}>Drop file here or click to browse</div>
                    <div style={{fontSize:'12.5px',color:'var(--t3)'}}>Supported: TXT, CSV · For Word/Excel/PDF → export as CSV or TXT</div>
                    <input ref={fileRef} type="file" accept=".txt,.csv,.pdf,.doc,.docx,.xlsx,.xls" style={{display:'none'}} onChange={e => { const f = e.target.files?.[0]; if(f) handleFileUpload(f) }} />
                  </div>

                  {/* Format guide */}
                  <div style={{background:'#F0F9FF',borderRadius:'10px',padding:'14px 16px',marginBottom:'16px',border:'1px solid #BAE6FD'}}>
                    <div style={{fontSize:'12.5px',fontWeight:700,color:'#0C4A6E',marginBottom:'8px'}}>📋 Expected TXT Format:</div>
                    <pre style={{fontSize:'11.5px',color:'#0C4A6E',fontFamily:'monospace',lineHeight:1.6,margin:0}}>{`1. The captain declared an emergency due to ___
A. engine fire
B. fuel shortage  
C. hydraulic failure
D. bird strike
Answer: C

2. ATC instructed the pilot to...`}</pre>
                  </div>

                  {/* CSV format guide */}
                  <div style={{background:'#F0FDF4',borderRadius:'10px',padding:'14px 16px',marginBottom:'16px',border:'1px solid #BBF7D0'}}>
                    <div style={{fontSize:'12.5px',fontWeight:700,color:'#14532D',marginBottom:'8px'}}>📊 Expected CSV Format:</div>
                    <pre style={{fontSize:'11.5px',color:'#14532D',fontFamily:'monospace',lineHeight:1.6,margin:0}}>{`content,correct_answer,cefr_level,difficulty,section
"What does MAYDAY mean?","Distress call",B2,medium,listening
"Complete: The aircraft ___","landed",B1,easy,grammar`}</pre>
                  </div>

                  {/* Text paste */}
                  <div style={{marginBottom:'16px'}}>
                    <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'6px'}}>Or paste question text directly:</label>
                    <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder="Paste your questions here in the format shown above..." rows={8} style={{padding:'12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'monospace',resize:'vertical'}} />
                    <button onClick={parseBulkText} style={{marginTop:'8px',padding:'9px 20px',borderRadius:'8px',border:'1.5px solid var(--sky)',background:'var(--sky3)',color:'var(--sky)',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Parse Questions</button>
                  </div>

                  {/* Status */}
                  {bulkStatus && (
                    <div style={{padding:'12px 16px',borderRadius:'8px',background:bulkStatus.includes('✅')?'#EAF3DE':bulkStatus.includes('Error')?'#FEE2E2':'var(--sky3)',color:bulkStatus.includes('✅')?'#27500A':bulkStatus.includes('Error')?'#991B1B':'#0C447C',fontSize:'13.5px',fontWeight:500,marginBottom:'16px'}}>
                      {bulkStatus}
                    </div>
                  )}

                  {/* Preview */}
                  {bulkParsed.length > 0 && (
                    <div>
                      <h4 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>Preview — {bulkParsed.length} questions detected:</h4>
                      <div style={{maxHeight:'300px',overflowY:'auto',border:'1px solid var(--bdr)',borderRadius:'10px',marginBottom:'16px'}}>
                        {bulkParsed.map((q,i) => (
                          <div key={i} style={{padding:'12px 16px',borderBottom:'1px solid var(--bdr)',background:i%2===0?'#fff':'#FAFBFC'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                              <span style={{fontSize:'11px',fontWeight:700,padding:'2px 7px',borderRadius:'100px',background:sectionColors[q.section]+'20',color:sectionColors[q.section],textTransform:'capitalize'}}>{q.section}</span>
                              <span style={{fontSize:'11px',color:'var(--t3)'}}>{q.cefr_level} · {q.difficulty}</span>
                            </div>
                            <div style={{fontSize:'13px',color:'var(--t1)',marginBottom:'2px'}}>{q.content.substring(0,120)}{q.content.length>120?'...':''}</div>
                            {q.correct_answer && <div style={{fontSize:'12px',color:'#27500A'}}>✓ Answer: {q.correct_answer}</div>}
                          </div>
                        ))}
                      </div>
                      <div style={{display:'flex',gap:'10px'}}>
                        <button onClick={confirmBulkUpload} disabled={bulkLoading} style={{padding:'11px 28px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                          {bulkLoading ? 'Uploading...' : `✓ Upload All ${bulkParsed.length} Questions`}
                        </button>
                        <button onClick={() => { setBulkParsed([]); setBulkStatus('') }} style={{padding:'11px 20px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',color:'var(--t2)',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Clear</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Add/Edit Form */}
              {showAddQ && (
                <div style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'2px solid var(--sky)',marginBottom:'20px'}}>
                  <h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'20px'}}>{editQ?'Edit Question':'Add New Question'}</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'14px'}}>
                    {[
                      {label:'Section *',key:'section',type:'select',opts:sections.map(s=>({v:s,l:s.charAt(0).toUpperCase()+s.slice(1)}))},
                      {label:'Type *',key:'type',type:'select',opts:[{v:'multiple_choice',l:'Multiple Choice'},{v:'fill_blank',l:'Fill in the Blank'},{v:'drag_drop',l:'Drag & Drop'},{v:'audio_response',l:'Audio Response'},{v:'written_response',l:'Written Response'},{v:'listening',l:'Listening Comprehension'}]},
                      {label:'CEFR Level *',key:'cefr_level',type:'select',opts:cefrLevels.map(l=>({v:l,l}))},
                      {label:'Difficulty',key:'difficulty',type:'select',opts:[{v:'easy',l:'Easy'},{v:'medium',l:'Medium'},{v:'hard',l:'Hard'}]},
                      {label:'Competency Tag',key:'competency_tag',type:'text',placeholder:'e.g. phraseology, emergency'},
                      {label:'Aircraft Context',key:'aircraft_context',type:'text',placeholder:'e.g. A320, B737, general'},
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>{f.label}</label>
                        {f.type==='select'
                          ? <select value={(newQ as any)[f.key]} onChange={e => setNewQ({...newQ,[f.key]:e.target.value})} style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)'}}>
                              {f.opts?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                            </select>
                          : <input value={(newQ as any)[f.key]} onChange={e => setNewQ({...newQ,[f.key]:e.target.value})} placeholder={f.placeholder} style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%'}} />
                        }
                      </div>
                    ))}
                  </div>
                  <div style={{marginBottom:'12px'}}>
                    <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Question Content *</label>
                    <textarea value={newQ.content} onChange={e => setNewQ({...newQ,content:e.target.value})} placeholder="Enter the full question text..." rows={4} style={{padding:'10px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)',resize:'vertical'}} />
                  </div>
                  <div style={{marginBottom:'16px'}}>
                    <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Correct Answer</label>
                    <input value={newQ.correct_answer} onChange={e => setNewQ({...newQ,correct_answer:e.target.value})} placeholder="For MC: A, B, C or D. For others: model answer." style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%'}} />
                  </div>
                  {(newQ.section==='listening'||newQ.section==='speaking') && (
                    <div style={{marginBottom:'16px'}}>
                      <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Audio URL</label>
                      <input value={newQ.audio_url} onChange={e => setNewQ({...newQ,audio_url:e.target.value})} placeholder="https://..." style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%'}} />
                    </div>
                  )}
                  <div style={{display:'flex',gap:'10px'}}>
                    <button onClick={saveQuestion} disabled={saving} style={{padding:'10px 24px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{saving?'Saving...':editQ?'Update Question':'Save Question'}</button>
                    <button onClick={() => {setShowAddQ(false);setEditQ(null)}} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',color:'var(--t2)',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Questions Table */}
              {qLoading ? (
                <div style={{textAlign:'center',padding:'40px',color:'var(--t3)'}}>Loading questions...</div>
              ) : questions.length === 0 ? (
                <div style={{background:'#fff',borderRadius:'14px',padding:'60px',border:'1px solid var(--bdr)',textAlign:'center'}}>
                  <div style={{fontSize:'36px',marginBottom:'12px'}}>📝</div>
                  <h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'8px'}}>No questions yet</h3>
                  <p style={{fontSize:'13.5px',color:'var(--t3)',marginBottom:'20px'}}>Add questions one by one or use bulk upload.</p>
                  <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
                    <button onClick={() => setShowAddQ(true)} style={{padding:'10px 20px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>+ Add Question</button>
                    <button onClick={() => setShowBulk(true)} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid var(--sky)',background:'var(--sky3)',color:'var(--sky)',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>⬆ Bulk Upload</button>
                  </div>
                </div>
              ) : (
                <div style={{background:'#fff',borderRadius:'14px',border:'1px solid var(--bdr)',overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr style={{borderBottom:'1px solid var(--bdr)',background:'var(--off)'}}>
                        {['Section','Question','Type','CEFR','Difficulty','Status','Actions'].map(h => (
                          <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q,i) => (
                        <tr key={q.id} style={{borderBottom:'1px solid var(--bdr)',background:i%2===0?'#fff':'#FAFBFC'}}>
                          <td style={{padding:'12px 16px'}}>
                            <span style={{fontSize:'11.5px',fontWeight:700,padding:'3px 9px',borderRadius:'100px',background:(sectionColors[q.section]||'#888')+'20',color:sectionColors[q.section]||'#888',textTransform:'capitalize'}}>{q.section}</span>
                          </td>
                          <td style={{padding:'12px 16px',maxWidth:'260px'}}>
                            <div style={{fontSize:'13px',color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.content}</div>
                            {q.competency_tag && <div style={{fontSize:'11px',color:'var(--t3)',marginTop:'2px'}}>{q.competency_tag}</div>}
                          </td>
                          <td style={{padding:'12px 16px',fontSize:'12px',color:'var(--t2)',textTransform:'capitalize'}}>{q.type?.replace(/_/g,' ')}</td>
                          <td style={{padding:'12px 16px'}}>
                            <span style={{fontSize:'12px',fontWeight:700,padding:'2px 8px',borderRadius:'6px',background:'var(--sky3)',color:'var(--sky)'}}>{q.cefr_level}</span>
                          </td>
                          <td style={{padding:'12px 16px'}}>
                            <span style={{fontSize:'12px',fontWeight:600,padding:'2px 8px',borderRadius:'6px',textTransform:'capitalize',background:q.difficulty==='easy'?'#EAF3DE':q.difficulty==='hard'?'#FCEBEB':'#FAEEDA',color:q.difficulty==='easy'?'#27500A':q.difficulty==='hard'?'#791F1F':'#633806'}}>{q.difficulty}</span>
                          </td>
                          <td style={{padding:'12px 16px'}}>
                            <button onClick={() => toggleActive(q.id,q.active)} style={{fontSize:'11.5px',fontWeight:700,padding:'3px 9px',borderRadius:'100px',border:'none',cursor:'pointer',background:q.active?'#EAF3DE':'#F1EFE8',color:q.active?'#27500A':'#5F5E5A'}}>{q.active?'Active':'Inactive'}</button>
                          </td>
                          <td style={{padding:'12px 16px'}}>
                            <div style={{display:'flex',gap:'6px'}}>
                              <button onClick={() => startEdit(q)} style={{padding:'5px 12px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>Edit</button>
                              <button onClick={() => deleteQuestion(q.id)} style={{padding:'5px 12px',borderRadius:'6px',border:'1.5px solid #FECACA',background:'#FEF2F2',cursor:'pointer',fontSize:'12px',fontWeight:600,color:'#DC2626',fontFamily:'var(--fb)'}}>Delete</button>
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
              <p style={{fontSize:'14px',color:'var(--t3)'}}>This section is being built. Coming in the next phase.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
