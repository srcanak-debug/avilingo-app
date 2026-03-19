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
    loadAIFile, runAITagging, approveAll, handleFileUpload, parseText, confirmBulkUpload, setDetailQ
  } = props

  const sections = ['grammar','reading','writing','speaking','listening']
  const cefrLevels = ['A1','A2','B1','B2','C1','C2']
  const sectionColors: Record<string,string> = {
    grammar:'#3A8ED0', reading:'#0A8870', writing:'#B8881A', speaking:'#B83040', listening:'#7C3AED'
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
        {/* Toolbar */}
        <div style={{display:'flex',gap:'6px',marginBottom:'12px',flexWrap:'wrap',alignItems:'center'}}>
          <a href="/admin/import" style={{padding:'8px 13px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'12px',fontWeight:600,color:'var(--navy)',textDecoration:'none'}}>📊 CSV Import</a>
          <button onClick={()=>{setShowAI(!showAI);setShowBulk(false);setShowForm(false)}} style={{padding:'8px 13px',borderRadius:'7px',border:'1.5px solid #7C3AED',background:'#F5F3FF',color:'#5B21B6',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>🤖 AI Import</button>
          <button onClick={()=>{setShowBulk(!showBulk);setShowAI(false);setShowForm(false)}} style={{padding:'8px 13px',borderRadius:'7px',border:'1.5px solid var(--sky)',background:'var(--sky3)',color:'var(--sky)',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>⬆ Bulk Upload</button>
          <button onClick={exportQuestions} style={{padding:'8px 13px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'12px',fontWeight:600,color:'var(--navy)',cursor:'pointer',fontFamily:'var(--fb)'}}>⬇ Export</button>
          {selectedQIds.length > 0 && (
            <button onClick={startBulkDelete} style={{padding:'8px 16px',borderRadius:'7px',border:'none',background:'#DC2626',color:'#fff',fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>🗑 Delete {selectedQIds.length}</button>
          )}
          <div style={{flex:1}}/>
          <button onClick={()=>{resetForm();setShowForm(true);setShowBulk(false);setShowAI(false)}} style={{padding:'8px 16px',borderRadius:'7px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>+ Add Question</button>
        </div>

        <div style={{fontSize:'12px',color:'var(--t3)',marginBottom:'10px'}}>
          {qTotal.toLocaleString()} questions {filtersPending?'(filters pending — click Apply)':''}
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

        {/* TABLE */}
        {qLoading ? (
          <div style={{textAlign:'center',padding:'32px',color:'var(--t3)'}}>Loading...</div>
        ) : !qLoadedOnce ? (
          <div style={{background:'#fff',borderRadius:'12px',padding:'60px',border:'1px solid var(--bdr)',textAlign:'center'}}>
            <div style={{fontSize:'32px',marginBottom:'12px'}}>🔍</div>
            <h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'6px'}}>Question Bank</h3>
            <p style={{fontSize:'13.5px',color:'var(--t3)',marginBottom:'20px'}}>Large dataset. Please click "Apply Filters" to load questions.</p>
            <button onClick={applyFilters} style={{padding:'10px 24px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13.5px',fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)'}}>Load Questions</button>
          </div>
        ) : questions.length===0 ? (
          <div style={{background:'#fff',borderRadius:'12px',padding:'40px',border:'1px solid var(--bdr)',textAlign:'center'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>📝</div>
            <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',marginBottom:'5px'}}>No questions found</h3>
            <p style={{fontSize:'13px',color:'var(--t3)'}}>Adjust your filters or add new questions.</p>
          </div>
        ) : (
          <>
            <div style={{background:'#fff',borderRadius:'12px',border:'1px solid var(--bdr)',overflow:'hidden',marginBottom:'10px'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{borderBottom:'1px solid var(--bdr)',background:'var(--off)'}}>
                    {['','Section','Question','CEFR','Diff','Analytics','Assignments','Status','Actions'].map((h,idx)=>(
                      <th key={idx} style={{padding:'9px 12px',textAlign:'left',fontSize:'10.5px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.4px'}}>
                        {idx===0 ? <input type="checkbox" checked={selectedQIds.length === questions.length && questions.length > 0} onChange={toggleSelectAll} style={{cursor:'pointer'}} /> : h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q,i)=>(
                    <tr key={q.id} style={{borderBottom:'1px solid var(--bdr)',background:selectedQIds.includes(q.id)?'rgba(58,142,208,0.05)':(i%2===0?'#fff':'#FAFBFC')}}>
                      <td style={{padding:'9px 12px',width:'30px'}}><input type="checkbox" checked={selectedQIds.includes(q.id)} onChange={()=>toggleSelect(q.id)} style={{cursor:'pointer'}} /></td>
                      <td style={{padding:'9px 12px'}}><span style={{fontSize:'10.5px',fontWeight:700,padding:'2px 7px',borderRadius:'100px',background:(sectionColors[q.section]||'#888')+'20',color:sectionColors[q.section]||'#888',textTransform:'capitalize'}}>{q.section}</span></td>
                      <td style={{padding:'9px 12px',maxWidth:'210px'}}>
                        <div style={{fontSize:'12.5px',color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'pointer'}} onClick={()=>setDetailQ(q)}>{q.content}</div>
                        <div style={{display:'flex',gap:'4px',marginTop:'2px'}}>
                          {q.role_tag&&q.role_tag!=='general'&&<span style={{fontSize:'9.5px',fontWeight:700,padding:'1px 5px',borderRadius:'3px',background:'#F5F3FF',color:'#7C3AED'}}>{q.role_tag.replace(/_/g,' ')}</span>}
                          {q.competency_tag&&<span style={{fontSize:'10px',color:'var(--t3)'}}>{q.competency_tag.replace(/_/g,' ')}</span>}
                          {q.version_number>1&&<span style={{fontSize:'9.5px',fontWeight:700,padding:'1px 4px',borderRadius:'3px',background:'#E0E7FF',color:'#3730A3'}}>V{q.version_number}</span>}
                        </div>
                      </td>
                      <td style={{padding:'9px 12px'}}><span style={{fontSize:'11.5px',fontWeight:700,padding:'1px 6px',borderRadius:'5px',background:'var(--sky3)',color:'var(--sky)'}}>{q.cefr_level}</span></td>
                      <td style={{padding:'9px 12px'}}><span style={{fontSize:'11px',fontWeight:600,padding:'1px 6px',borderRadius:'5px',textTransform:'capitalize',background:q.difficulty==='easy'?'#EAF3DE':q.difficulty==='hard'?'#FCEBEB':'#FAEEDA',color:q.difficulty==='easy'?'#27500A':q.difficulty==='hard'?'#791F1F':'#633806'}}>{q.difficulty}</span></td>
                      <td style={{padding:'9px 12px'}}>
                        {q.question_analytics?.[0]?(
                          <div style={{fontSize:'10.5px',color:'var(--t3)'}}>
                            <div>{q.question_analytics[0].total_attempts}x used</div>
                            {q.question_analytics[0].difficulty_index!=null&&<div style={{color:q.question_analytics[0].difficulty_index<30?'#DC2626':q.question_analytics[0].difficulty_index>80?'#16A34A':'var(--t3)'}}>{q.question_analytics[0].difficulty_index}%✓</div>}
                          </div>
                        ):<span style={{fontSize:'10.5px',color:'var(--t3)'}}>—</span>}
                      </td>
                      <td style={{padding:'9px 12px'}}>
                        {q.question_assignments?.length>0?(
                          <div style={{display:'flex',gap:'2px',flexWrap:'wrap'}}>
                            {q.question_assignments.slice(0,2).map((a:any,ai:number)=><span key={ai} style={{fontSize:'9.5px',padding:'1px 4px',borderRadius:'3px',background:'#E6EAF4',color:'#2A4070',fontWeight:600}}>{a.sub_roles?.name||a.departments?.name||'—'}</span>)}
                            {q.question_assignments.length>2&&<span style={{fontSize:'10px',color:'var(--t3)'}}>+{q.question_assignments.length-2}</span>}
                          </div>
                        ):<span style={{fontSize:'10.5px',color:'var(--t3)'}}>All</span>}
                      </td>
                      <td style={{padding:'9px 12px'}}><button onClick={()=>toggleActive(q.id,q.active)} style={{fontSize:'10.5px',fontWeight:700,padding:'2px 7px',borderRadius:'100px',border:'none',cursor:'pointer',background:q.active?'#EAF3DE':'#F1EFE8',color:q.active?'#27500A':'#5F5E5A'}}>{q.active?'Active':'Off'}</button></td>
                      <td style={{padding:'9px 12px'}}>
                        <div style={{display:'flex',gap:'4px'}}>
                          <button onClick={()=>{setDetailQ(q);setShowForm(false)}} style={{padding:'3px 8px',borderRadius:'5px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'10.5px',fontWeight:600,color:'var(--t2)',fontFamily:'var(--fb)'}}>View</button>
                          <button onClick={()=>startEdit(q)} style={{padding:'3px 8px',borderRadius:'5px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'10.5px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>Edit</button>
                          <button onClick={()=>startSingleDelete(q)} style={{padding:'3px 8px',borderRadius:'5px',border:'1.5px solid #FECACA',background:'#FEF2F2',cursor:'pointer',fontSize:'10.5px',fontWeight:600,color:'#DC2626',fontFamily:'var(--fb)'}}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <span style={{fontSize:'12px',color:'var(--t3)'}}>Show:</span>
                {[25,50,100].map(n=><button key={n} onClick={()=>{setQPageSize(n);setQPage(0);runQuery(0,{pageSize:n})}} style={{padding:'4px 10px',borderRadius:'5px',border:'1.5px solid',borderColor:qPageSize===n?'var(--navy)':'var(--bdr)',background:qPageSize===n?'var(--navy)':'#fff',color:qPageSize===n?'#fff':'var(--t2)',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{n}</button>)}
                <span style={{fontSize:'12px',color:'var(--t3)',marginLeft:'6px'}}>{(qPage*qPageSize+1).toLocaleString()}–{Math.min((qPage+1)*qPageSize,qTotal).toLocaleString()} of {qTotal.toLocaleString()}</span>
              </div>
              <div style={{display:'flex',gap:'5px'}}>
                <button onClick={()=>{const p=Math.max(0,qPage-1);setQPage(p);runQuery(p)}} disabled={qPage===0} style={{padding:'5px 12px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:qPage===0?'default':'pointer',fontSize:'12px',fontWeight:600,color:qPage===0?'var(--t3)':'var(--navy)',fontFamily:'var(--fb)'}}>← Prev</button>
                <span style={{padding:'5px 10px',fontSize:'12px',color:'var(--t2)'}}>{qPage+1}/{totalPages}</span>
                <button onClick={()=>{const p=Math.min(totalPages-1,qPage+1);setQPage(p);runQuery(p)}} disabled={qPage>=totalPages-1} style={{padding:'5px 12px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:qPage>=totalPages-1?'default':'pointer',fontSize:'12px',fontWeight:600,color:qPage>=totalPages-1?'var(--t3)':'var(--navy)',fontFamily:'var(--fb)'}}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right: Filter Panel */}
      <div style={{background:'#fff',borderRadius:'12px',padding:'16px',border:'1px solid var(--bdr)',position:'sticky',top:'20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
          <h3 style={{fontFamily:'var(--fm)',fontSize:'13.5px',fontWeight:800,color:'var(--navy)',margin:0}}>🔍 Filter & Sort</h3>
          <button onClick={()=>{setQSection('all');setQCefr('all');setQDifficulty('all');setQStatus('active');setQSearch('');setQTag('');setQSort('newest');setQRole('all');setQPage(0);runQuery(0,{section:'all',cefr:'all',difficulty:'all',status:'active',search:'',tag:'',sort:'newest',role:'all'})}} style={{padding:'3px 8px',borderRadius:'5px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11px',color:'var(--t3)',fontFamily:'var(--fb)'}}>Reset</button>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div>
            <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'5px'}}>🔍 Search Text</label>
            <input value={qSearch} onChange={e=>{setQSearch(e.target.value);setFiltersPending(true)}} onKeyDown={e=>e.key==='Enter'&&applyFilters()} placeholder="Search in question text..." style={{...inp({width:'100%',fontSize:'12px'})}} />
          </div>

          <div>
            <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'5px'}}>🧩 Section</label>
            <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
              {['all',...sections].map(s=>(
                <button key={s} onClick={()=>{setQSection(s);setFiltersPending(true)}} style={{padding:'5px 10px',borderRadius:'6px',border:'1.5px solid',borderColor:qSection===s?(sectionColors[s]||'var(--navy)'):'var(--bdr)',background:qSection===s?(sectionColors[s]||'var(--navy)')+'15':'#fff',color:qSection===s?(sectionColors[s]||'var(--navy)'):'var(--t2)',fontSize:'12px',fontWeight:600,cursor:'pointer',textTransform:'capitalize',fontFamily:'var(--fb)',textAlign:'left'}}>
                  {s==='all'?'All Sections':s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'5px'}}>📊 CEFR Level</label>
            <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
              {['all',...cefrLevels].map(l=>(
                <button key={l} onClick={()=>{setQCefr(l);setFiltersPending(true)}} style={{padding:'4px 8px',borderRadius:'5px',border:'1.5px solid',borderColor:qCefr===l?'var(--sky)':'var(--bdr)',background:qCefr===l?'var(--sky3)':'#fff',color:qCefr===l?'var(--sky)':'var(--t2)',fontSize:'11.5px',fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)'}}>
                  {l==='all'?'All':l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'5px'}}>🎯 Difficulty</label>
            <div style={{display:'flex',gap:'4px'}}>
              {[['all','All'],['easy','Easy'],['medium','Med'],['hard','Hard']].map(([v,l])=>(
                <button key={v} onClick={()=>{setQDifficulty(v);setFiltersPending(true)}} style={{flex:1,padding:'5px',borderRadius:'5px',border:'1.5px solid',borderColor:qDifficulty===v?'var(--navy)':'var(--bdr)',background:qDifficulty===v?'var(--navy)':'#fff',color:qDifficulty===v?'#fff':'var(--t2)',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{l}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'5px'}}>🟢 Status</label>
            <div style={{display:'flex',gap:'4px'}}>
              {[['all','All'],['active','Active'],['inactive','Inactive']].map(([v,l])=>(
                <button key={v} onClick={()=>{setQStatus(v);setFiltersPending(true)}} style={{flex:1,padding:'5px',borderRadius:'5px',border:'1.5px solid',borderColor:qStatus===v?'var(--teal)':'var(--bdr)',background:qStatus===v?'#E6F7F4':'#fff',color:qStatus===v?'var(--teal)':'var(--t2)',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{l}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'5px'}}>🎭 Role Tag</label>
            <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
              {[['all','All Roles'],['general','General'],['flight_deck','Flight Deck'],['cabin_crew','Cabin Crew'],['atc','ATC'],['maintenance','Maintenance'],['ground_staff','Ground Staff']].map(([v,l])=>(
                <button key={v} onClick={()=>{setQRole(v);setFiltersPending(true)}} style={{padding:'5px 10px',borderRadius:'6px',border:'1.5px solid',borderColor:qRole===v?'#7C3AED':'var(--bdr)',background:qRole===v?'#F5F3FF':'#fff',color:qRole===v?'#7C3AED':'var(--t2)',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)',textAlign:'left'}}>{l}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'5px'}}>🏷️ Competency Tag</label>
            <input value={qTag} onChange={e=>{setQTag(e.target.value);setFiltersPending(true)}} placeholder="e.g. phraseology" style={{...inp({width:'100%',fontSize:'12px'})}} />
          </div>

          <div>
            <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'5px'}}>↕️ Sort By</label>
            <select value={qSort} onChange={e=>{setQSort(e.target.value);setFiltersPending(true)}} style={{...inp({width:'100%',fontSize:'12px'})}}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="usage">Most Used</option>
              <option value="cefr">CEFR Level</option>
            </select>
          </div>

          <button onClick={applyFilters} style={{padding:'10px',borderRadius:'8px',border:'none',background:filtersPending?'var(--navy)':'#C7D2FE',color:filtersPending?'#fff':'#3730A3',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)',transition:'background 0.2s'}}>
            {filtersPending?'▶ Apply Filters':'✓ Applied'}
          </button>
        </div>
      </div>
    </div>
  )
}
