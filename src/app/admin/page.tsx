'use client'
import { useEffect, useState } from 'react'
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

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({ users: 0, exams: 0, questions: 0, orgs: 0 })
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [questions, setQuestions] = useState<any[]>([])
  const [qLoading, setQLoading] = useState(false)
  const [showAddQ, setShowAddQ] = useState(false)
  const [qFilter, setQFilter] = useState('all')
  const [newQ, setNewQ] = useState({
    section: 'grammar', type: 'multiple_choice', content: '',
    correct_answer: '', cefr_level: 'B1', difficulty: 'medium',
    competency_tag: '', aircraft_context: '', audio_url: ''
  })
  const [saving, setSaving] = useState(false)
  const [editQ, setEditQ] = useState<any>(null)

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
    const [u, e, q, o] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('exams').select('id', { count: 'exact', head: true }),
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
    ])
    setStats({ users: u.count||0, exams: e.count||0, questions: q.count||0, orgs: o.count||0 })
  }

  async function loadQuestions() {
    setQLoading(true)
    let query = supabase.from('questions').select('*').order('created_at', { ascending: false })
    if (qFilter !== 'all') query = query.eq('section', qFilter)
    const { data } = await query
    setQuestions(data || [])
    setQLoading(false)
  }

  async function saveQuestion() {
    if (!newQ.content) return
    setSaving(true)
    if (editQ) {
      await supabase.from('questions').update(newQ).eq('id', editQ.id)
    } else {
      await supabase.from('questions').insert(newQ)
    }
    setSaving(false)
    setShowAddQ(false)
    setEditQ(null)
    setNewQ({ section:'grammar', type:'multiple_choice', content:'', correct_answer:'', cefr_level:'B1', difficulty:'medium', competency_tag:'', aircraft_context:'', audio_url:'' })
    loadQuestions()
    loadStats()
  }

  async function deleteQuestion(id: string) {
    if (!confirm('Delete this question?')) return
    await supabase.from('questions').delete().eq('id', id)
    loadQuestions()
    loadStats()
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('questions').update({ active: !current }).eq('id', id)
    loadQuestions()
  }

  function startEdit(q: any) {
    setEditQ(q)
    setNewQ({ section: q.section, type: q.type, content: q.content, correct_answer: q.correct_answer||'', cefr_level: q.cefr_level||'B1', difficulty: q.difficulty||'medium', competency_tag: q.competency_tag||'', aircraft_context: q.aircraft_context||'', audio_url: q.audio_url||'' })
    setShowAddQ(true)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div style={{minHeight:'100vh',background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'#fff'}}>Loading...</div></div>

  const sectionColors: any = { grammar:'#3A8ED0', reading:'#0A8870', writing:'#B8881A', speaking:'#B83040', listening:'#7C3AED' }
  const cefrLevels = ['A1','A2','B1','B2','C1']
  const sections = ['grammar','reading','writing','speaking','listening']

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
              <div style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'1px solid var(--bdr)',marginBottom:'20px'}}>
                <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',marginBottom:'16px'}}>Quick Actions</h3>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                  {[{label:'Add Question',section:'questions'},{label:'Create Template',section:'templates'},{label:'Invite User',section:'users'},{label:'Add Organization',section:'organizations'},{label:'Grading Queue',section:'evaluator'},{label:'Reports',section:'reports'}].map(a => (
                    <button key={a.label} onClick={() => setActiveSection(a.section)} style={{padding:'9px 16px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'13px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>{a.label} →</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* QUESTION BANK */}
          {activeSection === 'questions' && (
            <div>
              {/* Header */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  {['all',...sections].map(s => (
                    <button key={s} onClick={() => setQFilter(s)} style={{padding:'7px 14px',borderRadius:'8px',border:'1.5px solid',borderColor:qFilter===s?sectionColors[s]||'var(--navy)':'var(--bdr)',background:qFilter===s?(sectionColors[s]||'var(--navy)'):'#fff',color:qFilter===s?'#fff':'var(--t2)',fontSize:'12.5px',fontWeight:600,cursor:'pointer',textTransform:'capitalize',fontFamily:'var(--fb)'}}>
                      {s === 'all' ? `All (${stats.questions})` : s}
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowAddQ(true); setEditQ(null) }} style={{padding:'10px 20px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                  + Add Question
                </button>
              </div>

              {/* Add/Edit Form */}
              {showAddQ && (
                <div style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'2px solid var(--sky)',marginBottom:'20px'}}>
                  <h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'20px'}}>{editQ ? 'Edit Question' : 'Add New Question'}</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'14px'}}>
                    <div>
                      <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Section *</label>
                      <select value={newQ.section} onChange={e => setNewQ({...newQ, section:e.target.value})} style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)'}}>
                        {sections.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Type *</label>
                      <select value={newQ.type} onChange={e => setNewQ({...newQ, type:e.target.value})} style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)'}}>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="fill_blank">Fill in the Blank</option>
                        <option value="drag_drop">Drag & Drop</option>
                        <option value="audio_response">Audio Response</option>
                        <option value="written_response">Written Response</option>
                        <option value="listening">Listening Comprehension</option>
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>CEFR Level *</label>
                      <select value={newQ.cefr_level} onChange={e => setNewQ({...newQ, cefr_level:e.target.value})} style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)'}}>
                        {cefrLevels.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Difficulty</label>
                      <select value={newQ.difficulty} onChange={e => setNewQ({...newQ, difficulty:e.target.value})} style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)'}}>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Competency Tag</label>
                      <input value={newQ.competency_tag} onChange={e => setNewQ({...newQ, competency_tag:e.target.value})} placeholder="e.g. phraseology, emergency" style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%'}} />
                    </div>
                    <div>
                      <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Aircraft Context</label>
                      <input value={newQ.aircraft_context} onChange={e => setNewQ({...newQ, aircraft_context:e.target.value})} placeholder="e.g. A320, B737, general" style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%'}} />
                    </div>
                  </div>
                  <div style={{marginBottom:'12px'}}>
                    <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Question Content *</label>
                    <textarea value={newQ.content} onChange={e => setNewQ({...newQ, content:e.target.value})} placeholder="Enter the full question text here..." rows={4} style={{padding:'10px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)',resize:'vertical'}} />
                  </div>
                  <div style={{marginBottom:'16px'}}>
                    <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Correct Answer / Answer Key</label>
                    <input value={newQ.correct_answer} onChange={e => setNewQ({...newQ, correct_answer:e.target.value})} placeholder="For MC: A, B, C or D. For others: model answer." style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%'}} />
                  </div>
                  {(newQ.section === 'listening' || newQ.section === 'speaking') && (
                    <div style={{marginBottom:'16px'}}>
                      <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Audio URL</label>
                      <input value={newQ.audio_url} onChange={e => setNewQ({...newQ, audio_url:e.target.value})} placeholder="https://..." style={{padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%'}} />
                    </div>
                  )}
                  <div style={{display:'flex',gap:'10px'}}>
                    <button onClick={saveQuestion} disabled={saving} style={{padding:'10px 24px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                      {saving ? 'Saving...' : editQ ? 'Update Question' : 'Save Question'}
                    </button>
                    <button onClick={() => { setShowAddQ(false); setEditQ(null) }} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',color:'var(--t2)',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Cancel</button>
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
                  <p style={{fontSize:'13.5px',color:'var(--t3)',marginBottom:'20px'}}>Start building your question bank by adding the first question.</p>
                  <button onClick={() => setShowAddQ(true)} style={{padding:'10px 24px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>+ Add First Question</button>
                </div>
              ) : (
                <div style={{background:'#fff',borderRadius:'14px',border:'1px solid var(--bdr)',overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr style={{borderBottom:'1px solid var(--bdr)',background:'var(--off)'}}>
                        <th style={{padding:'12px 16px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Section</th>
                        <th style={{padding:'12px 16px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Question</th>
                        <th style={{padding:'12px 16px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Type</th>
                        <th style={{padding:'12px 16px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.5px'}}>CEFR</th>
                        <th style={{padding:'12px 16px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Difficulty</th>
                        <th style={{padding:'12px 16px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Status</th>
                        <th style={{padding:'12px 16px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q, i) => (
                        <tr key={q.id} style={{borderBottom:'1px solid var(--bdr)',background:i%2===0?'#fff':'#FAFBFC'}}>
                          <td style={{padding:'12px 16px'}}>
                            <span style={{fontSize:'11.5px',fontWeight:700,padding:'3px 9px',borderRadius:'100px',background:(sectionColors[q.section]||'#888')+'20',color:sectionColors[q.section]||'#888',textTransform:'capitalize'}}>{q.section}</span>
                          </td>
                          <td style={{padding:'12px 16px',maxWidth:'280px'}}>
                            <div style={{fontSize:'13px',color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.content}</div>
                            {q.competency_tag && <div style={{fontSize:'11px',color:'var(--t3)',marginTop:'2px'}}>{q.competency_tag}</div>}
                          </td>
                          <td style={{padding:'12px 16px',fontSize:'12.5px',color:'var(--t2)',textTransform:'capitalize'}}>{q.type?.replace('_',' ')}</td>
                          <td style={{padding:'12px 16px'}}>
                            <span style={{fontSize:'12px',fontWeight:700,padding:'2px 8px',borderRadius:'6px',background:'var(--sky3)',color:'var(--sky)'}}>{q.cefr_level}</span>
                          </td>
                          <td style={{padding:'12px 16px'}}>
                            <span style={{fontSize:'12px',fontWeight:600,padding:'2px 8px',borderRadius:'6px',textTransform:'capitalize',background:q.difficulty==='easy'?'#EAF3DE':q.difficulty==='hard'?'#FCEBEB':'#FAEEDA',color:q.difficulty==='easy'?'#27500A':q.difficulty==='hard'?'#791F1F':'#633806'}}>{q.difficulty}</span>
                          </td>
                          <td style={{padding:'12px 16px'}}>
                            <button onClick={() => toggleActive(q.id, q.active)} style={{fontSize:'11.5px',fontWeight:700,padding:'3px 9px',borderRadius:'100px',border:'none',cursor:'pointer',background:q.active?'#EAF3DE':'#F1EFE8',color:q.active?'#27500A':'#5F5E5A'}}>{q.active?'Active':'Inactive'}</button>
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

          {/* OTHER SECTIONS */}
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
