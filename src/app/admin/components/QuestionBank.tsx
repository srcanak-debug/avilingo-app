'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface QuestionBankProps {
  questions: any[]
  qLoading: boolean
  qLoadedOnce: boolean
  qTotal: number
  qPage: number
  qPageSize: number
  selectedQIds: string[]
  qSearch: string
  qSection: string
  qCefr: string
  qDifficulty: string
  qStatus: string
  qTag: string
  qSort: string
  qRole: string
  filtersPending: boolean
  showAI: boolean
  showBulk: boolean
  aiQueue: any[]
  aiProcessing: boolean
  aiProgress: number
  bulkText: string
  bulkParsed: any[]
  bulkStatus: string
  bulkLoading: boolean
  bulkSection: string
  bulkCefr: string
  bulkDifficulty: string
  setQSearch: (v: string) => void
  setQSection: (v: string) => void
  setQCefr: (v: string) => void
  setQDifficulty: (v: string) => void
  setQStatus: (v: string) => void
  setQTag: (v: string) => void
  setQSort: (v: string) => void
  setQRole: (v: string) => void
  setQPage: (v: number) => void
  setQPageSize: (v: number) => void
  setFiltersPending: (v: boolean) => void
  setShowAI: (v: boolean) => void
  setShowBulk: (v: boolean) => void
  setShowForm: (v: boolean) => void
  setSelectedQIds: (v: string[]) => void
  setAiQueue: (v: any[]) => void
  setAiProgress: (v: number) => void
  setBulkText: (v: string) => void
  setBulkParsed: (v: any[]) => void
  setBulkStatus: (v: string) => void
  setBulkLoading: (v: boolean) => void
  setBulkSection: (v: string) => void
  setBulkCefr: (v: string) => void
  setBulkDifficulty: (v: string) => void
  applyFilters: () => void
  runQuery: (p: number, extra?: any) => void
  toggleSelect: (id: string) => void
  toggleSelectAll: () => void
  toggleActive: (id: string, current: boolean) => void
  startSingleDelete: (q: any) => void
  startBulkDelete: () => void
  startEdit: (q: any) => void
  resetForm: () => void
  exportQuestions: () => void
  loadAIFile: (f: File) => void
  runAITagging: () => void
  approveAll: () => void
  handleFileUpload: (f: File) => void
  parseText: (t: string) => any[]
  confirmBulkUpload: () => void
  setDetailQ: (q: any) => void
  bulkToggleActive: (active: boolean) => Promise<void>
}

export default function QuestionBank(props: QuestionBankProps) {
  const {
    questions, qLoading, qLoadedOnce, qTotal, qPage, qPageSize, selectedQIds,
    qSearch, qSection, qCefr, qDifficulty, qStatus, qTag, qSort, qRole, filtersPending,
    showAI, showBulk, aiQueue, aiProcessing, aiProgress, bulkText, bulkParsed, bulkStatus,
    bulkLoading, bulkSection, bulkCefr, bulkDifficulty,
    setQSearch, setQSection, setQCefr, setQDifficulty, setQStatus, setQTag, setQSort, setQRole,
    setQPage, setQPageSize, setFiltersPending, setShowAI, setShowBulk, setShowForm,
    setSelectedQIds, setAiQueue, setAiProgress, setBulkText, setBulkParsed, setBulkStatus,
    setBulkLoading, setBulkSection, setBulkCefr, setBulkDifficulty,
    applyFilters, runQuery, toggleSelect, toggleSelectAll, toggleActive,
    startSingleDelete, startBulkDelete, startEdit, resetForm, exportQuestions,
    loadAIFile,    runAITagging, approveAll, handleFileUpload, parseText, confirmBulkUpload, setDetailQ,
    bulkToggleActive
  } = props

  const sections = ['grammar','reading','writing','speaking','listening','dla']
  const cefrLevels = ['A1','A2','B1','B2','C1','C2']
  const sectionColors: Record<string,string> = {
    grammar:'#3A8ED0', reading:'#0A8870', writing:'#B8881A', speaking:'#B83040', listening:'#7C3AED', dla:'#10B981'
  }
  const totalPages = Math.ceil(qTotal / qPageSize)
  const aiFileRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const inp = (extra:any={}) => ({
    padding:'10px 14px', borderRadius:'10px', border:'1.5px solid var(--bdr)', 
    fontSize:'13.5px', fontWeight:600, color:'var(--navy)', outline:'none',
    background:'#fff', transition:'all 0.2s', fontFamily:'var(--fb)',
    ...extra
  })

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:'16px',alignItems:'start'}}>
      {/* Left: Table */}
      <div>
        {/* Modern Header / Toolbar */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px',background:'rgba(255,255,255,0.4)',backdropFilter:'blur(10px)',padding:'16px',borderRadius:'16px',border:'1px solid rgba(255,255,255,0.5)',boxShadow:'0 8px 32px rgba(31,38,135,0.07)'}}>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={()=>{setShowAI(!showAI);setShowBulk(false);setShowForm(false)}} style={{padding:'10px 18px',borderRadius:'10px',border:'1px solid #7C3AED',background:showAI?'#7C3AED':'#F5F3FF',color:showAI?'#fff':'#5B21B6',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)',transition:'all 0.3s',display:'flex',alignItems:'center',gap:'6px'}}>
              <span>🤖</span> AI Import
            </button>
            <button onClick={()=>{setShowBulk(!showBulk);setShowAI(false);setShowForm(false)}} style={{padding:'10px 18px',borderRadius:'10px',border:'1px solid var(--sky)',background:showBulk?'var(--sky)':'var(--sky3)',color:showBulk?'#fff':'var(--sky)',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)',transition:'all 0.3s',display:'flex',alignItems:'center',gap:'6px'}}>
              <span>⬆</span> Bulk
            </button>
            <button onClick={exportQuestions} style={{padding:'10px 18px',borderRadius:'10px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'13px',fontWeight:700,color:'var(--navy)',cursor:'pointer',fontFamily:'var(--fb)',display:'flex',alignItems:'center',gap:'6px'}}>
              <span>⬇</span> Export
            </button>
          </div>
          <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
            {selectedQIds.length > 0 && (
              <button onClick={startBulkDelete} style={{padding:'10px 18px',borderRadius:'10px',border:'none',background:'#DC2626',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)',boxShadow:'0 4px 12px rgba(220,38,38,0.2)'}}>
                🗑 Delete {selectedQIds.length}
              </button>
            )}
            <button onClick={()=>{resetForm();setShowForm(true);setShowBulk(false);setShowAI(false)}} style={{padding:'12px 24px',borderRadius:'12px',border:'none',background:'linear-gradient(135deg, var(--navy) 0%, #1e3a8a 100%)',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)',boxShadow:'0 8px 20px rgba(15,23,42,0.15)',transition:'transform 0.2s'}} onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e=>e.currentTarget.style.transform='translateY(0)'}>
              + Add Question
            </button>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedQIds.length > 0 && (
          <div style={{
            background:'#fff', borderRadius:'12px', padding:'12px 20px', marginBottom:'20px', 
            border:'1.5px solid var(--sky)', display:'flex', alignItems:'center', justifyContent:'space-between',
            animation:'drawerSlideIn 0.3s ease-out', boxShadow:'0 10px 25px rgba(56,189,248,0.1)'
          }}>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <span style={{fontSize:'13px',fontWeight:700,color:'var(--navy)'}}>{selectedQIds.length} Questions Selected</span>
              <div style={{width:'1px',height:'20px',background:'var(--bdr)'}} />
              <button onClick={()=>bulkToggleActive(true)} style={{padding:'6px 14px',borderRadius:'8px',border:'1px solid #16A34A',background:'#F0FDF4',color:'#16A34A',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>Activate</button>
              <button onClick={()=>bulkToggleActive(false)} style={{padding:'6px 14px',borderRadius:'8px',border:'1px solid #64748B',background:'#F8FAFC',color:'#64748B',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>Passive</button>
            </div>
            <button onClick={()=>setSelectedQIds([])} style={{background:'none',border:'none',color:'var(--t3)',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>Deselect All</button>
          </div>
        )}

        <div style={{fontSize:'13px',color:'var(--t3)',marginBottom:'16px',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 4px'}}>
          <span>Showing <b>{qTotal.toLocaleString()}</b> professional questions</span>
          {filtersPending && <span style={{color:'var(--sky)',fontWeight:700,animation:'pulse 1.5s infinite'}}>● Filters Pending</span>}
        </div>

        {/* AI STAGING */}
        {showAI && (
          <div style={{background:'#fff',borderRadius:'12px',padding:'20px',border:'2px solid #7C3AED',marginBottom:'14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'14px'}}>
              <div><h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',margin:0,marginBottom:'2px'}}>🤖 AI-Assisted Import</h3><p style={{fontSize:'12px',color:'var(--t3)',margin:0}}>Upload CSV → AI classifies → review → approve</p></div>
              <button onClick={()=>{setShowAI(false);setAiQueue([])}} style={{padding:'4px 10px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11.5px',color:'var(--t2)',fontFamily:'var(--fb)'}}>Close</button>
            </div>
            {!aiQueue.length ? (
              <div onClick={()=>aiFileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){loadAIFile(f)}}} style={{border:'2px dashed #C4B5FD',borderRadius:'8px',padding:'24px',textAlign:'center',cursor:'pointer',background:'#FAFAFF'}}>
                <div style={{fontSize:'11.5px',color:'#7C3AED',fontWeight:600}}>Drop CSV for AI classification</div>
                <input ref={aiFileRef} type="file" accept=".csv" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)loadAIFile(f)}} />
              </div>
            ) : (
              <div>
                <div style={{display:'flex',gap:'8px',marginBottom:'10px',flexWrap:'wrap'}}>
                  <span style={{fontSize:'12.5px',fontWeight:600,color:'var(--navy)'}}>{aiQueue.length} questions loaded</span>
                  {!aiProcessing&&aiProgress===0&&<button onClick={runAITagging} style={{padding:'6px 16px',borderRadius:'6px',border:'none',background:'#7C3AED',color:'#fff',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>🤖 Run AI</button>}
                  {aiProgress===100&&<button onClick={approveAll} style={{padding:'6px 16px',borderRadius:'6px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>✓ Approve All</button>}
                  <button onClick={()=>{setAiQueue([]);setAiProgress(0)}} style={{padding:'6px 12px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',color:'var(--t2)',fontSize:'11.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Clear</button>
                </div>
                {aiProcessing&&<div style={{marginBottom:'10px'}}><div style={{height:'5px',background:'#E9D5FF',borderRadius:'3px',overflow:'hidden'}}><div style={{height:'100%',background:'#7C3AED',width:`${aiProgress}%`,transition:'width 0.2s'}}/></div></div>}
                <div style={{maxHeight:'260px',overflowY:'auto',border:'1px solid var(--bdr)',borderRadius:'8px'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr style={{background:'var(--off)',borderBottom:'1px solid var(--bdr)'}}>{['Question','Section','CEFR','Difficulty'].map(h=><th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:'10.5px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {aiQueue.slice(0,50).map((q,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid var(--bdr)',background:i%2===0?'#fff':'#FAFBFC'}}>
                          <td style={{padding:'7px 10px',maxWidth:'200px',fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--t1)'}}>{q.content}</td>
                          <td style={{padding:'7px 10px'}}><select value={q.ai_section||'grammar'} onChange={e=>{const u=[...aiQueue];u[i]={...u[i],ai_section:e.target.value};setAiQueue(u)}} style={{padding:'3px 6px',borderRadius:'5px',border:'1px solid var(--bdr)',fontSize:'11.5px',fontFamily:'var(--fb)'}}>{sections.map(s=><option key={s} value={s}>{s}</option>)}</select></td>
                          <td style={{padding:'7px 10px'}}><select value={q.ai_cefr||'B1'} onChange={e=>{const u=[...aiQueue];u[i]={...u[i],ai_cefr:e.target.value};setAiQueue(u)}} style={{padding:'3px 6px',borderRadius:'5px',border:'1px solid var(--bdr)',fontSize:'11.5px',fontFamily:'var(--fb)'}}>{cefrLevels.map(l=><option key={l} value={l}>{l}</option>)}</select></td>
                          <td style={{padding:'7px 10px'}}><select value={q.ai_difficulty||'medium'} onChange={e=>{const u=[...aiQueue];u[i]={...u[i],ai_difficulty:e.target.value};setAiQueue(u)}} style={{padding:'3px 6px',borderRadius:'5px',border:'1px solid var(--bdr)',fontSize:'11.5px',fontFamily:'var(--fb)'}}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {aiQueue.length>50&&<div style={{padding:'8px',fontSize:'11.5px',color:'var(--t3)',textAlign:'center'}}>Showing 50 of {aiQueue.length} — all imported on approve</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BULK UPLOAD */}
        {showBulk && (
          <div style={{background:'#fff',borderRadius:'12px',padding:'20px',border:'2px solid var(--sky)',marginBottom:'14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'14px'}}>
              <div><h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',margin:0,marginBottom:'2px'}}>Bulk Upload</h3><p style={{fontSize:'12px',color:'var(--t3)',margin:0}}>TXT, CSV or paste text directly</p></div>
              <button onClick={()=>{setShowBulk(false);setBulkParsed([]);setBulkStatus('')}} style={{padding:'4px 10px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11.5px',color:'var(--t2)',fontFamily:'var(--fb)'}}>Close</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'12px',padding:'12px',background:'var(--off)',borderRadius:'8px'}}>
              <div><label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'3px'}}>Default Section</label><select value={bulkSection} onChange={e=>setBulkSection(e.target.value)} style={inp({width:'100%'})}>{sections.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
              <div><label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'3px'}}>Default CEFR</label><select value={bulkCefr} onChange={e=>setBulkCefr(e.target.value)} style={inp({width:'100%'})}>{cefrLevels.map(l=><option key={l} value={l}>{l}</option>)}</select></div>
              <div><label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'3px'}}>Default Difficulty</label><select value={bulkDifficulty} onChange={e=>setBulkDifficulty(e.target.value)} style={inp({width:'100%'})}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
            </div>
            <div onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleFileUpload(f)}} style={{border:'2px dashed var(--bdr)',borderRadius:'8px',padding:'20px',textAlign:'center',cursor:'pointer',marginBottom:'10px',background:'var(--off)'}}>
              <div style={{fontSize:'12.5px',fontWeight:600,color:'var(--navy)'}}>Drop TXT or CSV file here</div>
              <input ref={fileRef} type="file" accept=".txt,.csv" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)handleFileUpload(f)}} />
            </div>
            <textarea value={bulkText} onChange={e=>setBulkText(e.target.value)} placeholder="Or paste questions here..." rows={5} style={{...inp({width:'100%',resize:'vertical',marginBottom:'8px'}),fontFamily:'monospace'}} />
            <button onClick={()=>{const p=parseText(bulkText);setBulkParsed(p);setBulkStatus(p.length>0?`Found ${p.length} questions.`:'No questions detected.')}} style={{padding:'7px 16px',borderRadius:'6px',border:'1.5px solid var(--sky)',background:'var(--sky3)',color:'var(--sky)',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)',marginBottom:'10px'}}>Parse</button>
            {bulkStatus&&<div style={{padding:'8px 12px',borderRadius:'7px',background:bulkStatus.includes('✅')?'#EAF3DE':bulkStatus.includes('⚠️')?'#FAEEDA':'var(--sky3)',color:bulkStatus.includes('✅')?'#27500A':bulkStatus.includes('⚠️')?'#633806':'#0C447C',fontSize:'12.5px',fontWeight:500,marginBottom:'10px'}}>{bulkStatus}</div>}
            {bulkParsed.length>0&&(
              <div>
                <div style={{maxHeight:'200px',overflowY:'auto',border:'1px solid var(--bdr)',borderRadius:'7px',marginBottom:'10px'}}>
                  {bulkParsed.map((q,i)=>(
                    <div key={i} style={{padding:'8px 12px',borderBottom:'1px solid var(--bdr)',background:i%2===0?'#fff':'#FAFBFC',fontSize:'12px'}}>
                      <div style={{display:'flex',gap:'5px',marginBottom:'2px'}}>
                        <span style={{fontSize:'10.5px',fontWeight:700,padding:'1px 5px',borderRadius:'100px',background:sectionColors[q.section]+'20',color:sectionColors[q.section]}}>{q.section}</span>
                        <span style={{fontSize:'10.5px',color:'var(--t3)'}}>{q.cefr_level}</span>
                      </div>
                      <div style={{color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.content}</div>
                    </div>
                  ))}
                </div>
                <button onClick={confirmBulkUpload} disabled={bulkLoading} style={{padding:'9px 22px',borderRadius:'7px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{bulkLoading?'Uploading...':`✓ Upload ${bulkParsed.length} Questions`}</button>
              </div>
            )}
          </div>
        )}

        {/* CARDS LISTING (Evolving from Table) */}
        {qLoading ? (
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {[1,2,3].map(i => <div key={i} style={{height:'100px',borderRadius:'16px',background:'#fff',border:'1px solid var(--bdr)',animation:'pulse 1.5s infinite'}} />)}
          </div>
        ) : !qLoadedOnce ? (
          <div style={{background:'#fff',borderRadius:'24px',padding:'80px 40px',border:'1px solid var(--bdr)',textAlign:'center',boxShadow:'0 10px 40px rgba(0,0,0,0.03)'}}>
             <div style={{fontSize:'48px',marginBottom:'20px'}}>💎</div>
             <h2 style={{fontFamily:'var(--fm)',fontSize:'20px',fontWeight:800,color:'var(--navy)',marginBottom:'10px'}}>Question Repository</h2>
             <p style={{fontSize:'15px',color:'var(--t3)',marginBottom:'28px',maxWidth:'400px',margin:'0 auto 28px'}}>Access our high-performance technical dataset with over 20,000 aviation questions.</p>
             <button onClick={applyFilters} style={{padding:'14px 32px',borderRadius:'14px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'15px',fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)',boxShadow:'0 10px 25px rgba(15,23,42,0.2)'}}>Begin Exploration</button>
          </div>
        ) : questions.length===0 ? (
          <div style={{background:'#fff',borderRadius:'12px',padding:'40px',border:'1px solid var(--bdr)',textAlign:'center'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>📝</div>
            <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',marginBottom:'5px'}}>No questions found</h3>
            <p style={{fontSize:'13px',color:'var(--t3)'}}>Adjust your filters or add new questions.</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {questions.map((q,i)=>(
              <div key={q.id} style={{
                background:selectedQIds.includes(q.id)?'#F0F9FF':'#fff',
                borderRadius:'16px',
                padding:'18px',
                border:'1.5px solid',
                borderColor:selectedQIds.includes(q.id)?'#7DD3FC':'var(--bdr)',
                boxShadow:selectedQIds.includes(q.id)?'0 8px 24px rgba(125,211,252,0.1)':'0 2px 4px rgba(0,0,0,0.01)',
                transition:'all 0.2s',
                position:'relative',
                display:'flex',
                gap:'16px',
                alignItems:'center'
              }}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',minWidth:'55px'}}>
                  <input type="checkbox" checked={selectedQIds.includes(q.id)} onChange={()=>toggleSelect(q.id)} style={{width:'18px',height:'18px',cursor:'pointer',accentColor:'var(--navy)'}} />
                  <div style={{width:'40px',height:'40px',borderRadius:'10px',background:(sectionColors[q.section]||'#888')+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>
                    {q.section==='grammar'?'🔤':q.section==='reading'?'📖':q.section==='listening'?'🎧':q.section==='speaking'?'🗣':q.section==='writing'?'✍️':q.section==='dla'?'✈️':'❓'}
                  </div>
                </div>

                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:'6px',marginBottom:'4px',alignItems:'center'}}>
                    <span style={{fontSize:'10px',fontWeight:800,padding:'2px 8px',borderRadius:'100px',background:(sectionColors[q.section]||'#888')+'15',color:sectionColors[q.section]||'#888',textTransform:'uppercase',letterSpacing:'0.5px'}}>{q.section}</span>
                    <span style={{fontSize:'10px',fontWeight:800,padding:'2px 8px',borderRadius:'6px',background:'var(--sky3)',color:'var(--sky)'}}>{q.cefr_level}</span>
                    <span style={{fontSize:'10px',fontWeight:800,padding:'2px 8px',borderRadius:'6px',textTransform:'uppercase',background:q.difficulty==='easy'?'#EAF3DE':q.difficulty==='hard'?'#FCEBEB':'#FAEEDA',color:q.difficulty==='easy'?'#27500A':q.difficulty==='hard'?'#791F1F':'#633806'}}>{q.difficulty}</span>
                    {q.role_tag && q.role_tag !== 'general' && <span style={{fontSize:'10px',fontWeight:800,padding:'2px 8px',borderRadius:'6px',background:'#F5F3FF',color:'#7C3AED',textTransform:'uppercase'}}>{q.role_tag.replace(/_/g,' ')}</span>}
                  </div>
                  <div style={{fontSize:'13.5px',fontWeight:600,color:'var(--navy)',lineHeight:'1.5',cursor:'pointer'}} onClick={()=>setDetailQ(q)}>
                    {q.content}
                  </div>
                  <div style={{display:'flex',gap:'12px',marginTop:'8px',alignItems:'center'}}>
                    {q.question_analytics?.[0] && (
                      <div style={{fontSize:'11px',color:'var(--t3)',display:'flex',alignItems:'center',gap:'4px'}}>
                        <span style={{color:q.question_analytics[0].difficulty_index<30?'#DC2626':q.question_analytics[0].difficulty_index>80?'#16A34A':'var(--sky)',fontWeight:700}}>
                          {q.question_analytics[0].difficulty_index}% Success Rate
                        </span>
                        <span>•</span>
                        <span>{q.question_analytics[0].total_attempts} attempts</span>
                      </div>
                    )}
                    {q.version_number > 1 && <span style={{fontSize:'10px',fontWeight:700,color:'#3730A3',background:'#E0E7FF',padding:'1px 5px',borderRadius:'4px'}}>V{q.version_number}</span>}
                  </div>
                </div>

                <div style={{display:'flex',gap:'8px',paddingLeft:'12px',borderLeft:'1px solid var(--bdr)'}}>
                  <button onClick={()=>toggleActive(q.id,q.active)} style={{width:'36px',height:'36px',borderRadius:'10px',border:'none',background:q.active?'#EAF3DE':'#F1F5F9',color:q.active?'#16A34A':'#64748B',cursor:'pointer',fontSize:'16px'}} title={q.active?'Active':'Inactive'}>{q.active?'●':'○'}</button>
                  <button onClick={()=>startEdit(q)} style={{padding:'8px 12px',borderRadius:'10px',border:'1px solid var(--bdr)',background:'#fff',color:'var(--navy)',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)'}}>Edit</button>
                  <button onClick={()=>startSingleDelete(q)} style={{padding:'8px 12px',borderRadius:'10px',border:'1px solid #FECACA',background:'#FEF2F2',color:'#DC2626',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)'}}>Del</button>
                </div>
              </div>
            ))}
            
            {/* Modern Pagination */}
            <div style={{marginTop:'20px',background:'#fff',padding:'16px',borderRadius:'16px',border:'1px solid var(--bdr)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
               <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                 <span style={{fontSize:'13px',color:'var(--t3)'}}>Rows per page:</span>
                 <select value={qPageSize} onChange={e=>{setQPageSize(Number(e.target.value));setQPage(0);runQuery(0,{pageSize:Number(e.target.value)})}} style={inp({padding:'4px 10px',background:'var(--off)'})}>
                   {[25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
                 </select>
               </div>
               <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                 <button onClick={()=>{const p=Math.max(0,qPage-1);setQPage(p);runQuery(p)}} disabled={qPage===0} style={{width:'38px',height:'38px',borderRadius:'10px',border:'1.5px solid var(--bdr)',background:'#fff',color:qPage===0?'var(--t3)':'var(--navy)',cursor:qPage===0?'default':'pointer',fontSize:'16px'}}>←</button>
                 <span style={{fontSize:'14px',fontWeight:700,color:'var(--navy)',minWidth:'60px',textAlign:'center'}}>{qPage+1} / {totalPages}</span>
                 <button onClick={()=>{const p=Math.min(totalPages-1,qPage+1);setQPage(p);runQuery(p)}} disabled={qPage>=totalPages-1} style={{width:'38px',height:'38px',borderRadius:'10px',border:'1.5px solid var(--bdr)',background:'#fff',color:qPage>=totalPages-1?'var(--t3)':'var(--navy)',cursor:qPage>=totalPages-1?'default':'pointer',fontSize:'16px'}}>→</button>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Premium Filter Panel (Glassmorphism) */}
      <div style={{
        background:'rgba(255,255,255,0.7)',
        backdropFilter:'blur(20px)',
        borderRadius:'24px',
        padding:'24px',
        border:'1px solid rgba(255,255,255,0.5)',
        position:'sticky',
        top:'20px',
        boxShadow:'0 12px 40px rgba(0,0,0,0.06)',
        display:'flex',
        flexDirection:'column',
        gap:'24px'
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',margin:0}}>Smart Filters</h3>
          <button onClick={()=>{setQSection('all');setQCefr('all');setQDifficulty('all');setQStatus('active');setQSearch('');setQTag('');setQSort('newest');setQRole('all');setQPage(0);runQuery(0,{section:'all',cefr:'all',difficulty:'all',status:'active',search:'',tag:'',sort:'newest',role:'all'})}} style={{background:'none',border:'none',color:'var(--sky)',fontSize:'12px',fontWeight:700,cursor:'pointer',padding:'4px 8px'}}>Reset All</button>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
          <div>
            <label style={{fontSize:'11px',fontWeight:800,color:'var(--t2)',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:'8px'}}>Search Repository</label>
            <div style={{position:'relative'}}>
              <input value={qSearch} onChange={e=>{setQSearch(e.target.value);setFiltersPending(true)}} onKeyDown={e=>e.key==='Enter'&&applyFilters()} placeholder="Keywords..." style={{...inp({width:'100%',paddingLeft:'38px',fontSize:'13px',background:'rgba(255,255,255,0.8)',borderRadius:'12px'})}} />
              <span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'16px'}}>🔍</span>
            </div>
          </div>

          <div>
             <label style={{fontSize:'11px',fontWeight:800,color:'var(--t2)',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:'8px'}}>Content Section</label>
             <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
               {['all',...sections].map(s=>(
                 <button key={s} onClick={()=>{setQSection(s);setFiltersPending(true)}} style={{
                   padding:'12px 16px',
                   borderRadius:'12px',
                   border:'1.5px solid',
                   borderColor:qSection===s?(sectionColors[s]||'var(--navy)'):'transparent',
                   background:qSection===s?(sectionColors[s]||'var(--navy)')+'15':'rgba(255,255,255,0.4)',
                   color:qSection===s?(sectionColors[s]||'var(--navy)'):'var(--t2)',
                   fontSize:'13px',
                   fontWeight:700,
                   cursor:'pointer',
                   textTransform:'capitalize',
                   fontFamily:'var(--fb)',
                   textAlign:'left',
                   transition:'all 0.2s',
                   display:'flex',
                   justifyContent:'space-between',
                   alignItems:'center'
                 }}>
                   {s==='all'?'All Content':s}
                   {qSection===s && <span>●</span>}
                 </button>
               ))}
             </div>
          </div>

          <div>
            <label style={{fontSize:'11px',fontWeight:800,color:'var(--t2)',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:'8px'}}>Performance Level (CEFR)</label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
              {['all',...cefrLevels].map(l=>(
                <button key={l} onClick={()=>{setQCefr(l);setFiltersPending(true)}} style={{
                   padding:'10px 0',
                   borderRadius:'10px',
                   border:'1.5px solid',
                   borderColor:qCefr===l?'var(--sky)':'rgba(255,255,255,0.2)',
                   background:qCefr===l?'var(--sky3)':'rgba(255,255,255,0.5)',
                   color:qCefr===l?'var(--sky)':'var(--t2)',
                   fontSize:'12px',
                   fontWeight:800,
                   cursor:'pointer',
                   fontFamily:'var(--fb)',
                   transition:'all 0.2s'
                }}>{l==='all'?'All':l}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{fontSize:'11px',fontWeight:800,color:'var(--t2)',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:'8px'}}>Professional Role</label>
            <select value={qRole} onChange={e=>{setQRole(e.target.value);setFiltersPending(true)}} style={{...inp({width:'100%',borderRadius:'12px',background:'rgba(255,255,255,0.6)'})}}>
              {[['all','All Roles'],['general','General'],['flight_deck','Flight-Deck'],['cabin_crew','Cabin-Crew'],['atc','Air Traffic'],['maintenance','Maintenance']].map(([v,l])=>(
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <button onClick={applyFilters} style={{
            marginTop:'8px',
            padding:'16px',
            borderRadius:'16px',
            border:'none',
            background:filtersPending?'var(--navy)':'#F1F5F9',
            color:filtersPending?'#fff':'#94A3B8',
            fontSize:'15px',
            fontWeight:800,
            cursor:'pointer',
            fontFamily:'var(--fb)',
            boxShadow:filtersPending?'0 10px 25px rgba(15,23,42,0.2)':'none',
            transition:'all 0.3s',
            transform:filtersPending?'scale(1.02)':'scale(1)'
          }}>
            {filtersPending?'Apply Changes':'Filters Active'}
          </button>
        </div>
      </div>
    </div>
  )
}
