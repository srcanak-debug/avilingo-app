'use client'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import QuestionBank from '../components/QuestionBank'
import { useAdmin } from '../AdminContext'

export default function QuestionsPage() {
  const { adminId } = useAdmin()
  
  // Constants
  const sections = ['grammar','reading','writing','speaking','listening','dla']
  const cefrLevels = ['A1','A2','B1','B2','C1','C2']
  const sectionColors: Record<string,string> = {
    grammar:'#3A8ED0', reading:'#0A8870', writing:'#B8881A', speaking:'#B83040', listening:'#7C3AED', dla:'#10B981'
  }

  const inp = (extra:any={}) => ({
    padding:'10px 14px', borderRadius:'10px', border:'1.5px solid var(--bdr)', 
    fontSize:'13.5px', fontWeight:600, color:'var(--navy)', outline:'none',
    background:'#fff', transition:'all 0.2s', fontFamily:'var(--fb)',
    ...extra
  })

  // State
  const [questions, setQuestions] = useState<any[]>([])
  const [qLoading, setQLoading] = useState(false)
  const [qLoadedOnce, setQLoadedOnce] = useState(false)
  const [qTotal, setQTotal] = useState(0)
  const [qPage, setQPage] = useState(0)
  const [qPageSize, setQPageSize] = useState(25)
  const [selectedQIds, setSelectedQIds] = useState<string[]>([])
  const [showDelConfirm, setShowDelConfirm] = useState(false)
  const [delItems, setDelItems] = useState<any[]>([])
  const [delInput, setDelInput] = useState('')

  // Filters
  const [qSearch, setQSearch] = useState('')
  const [qSection, setQSection] = useState('all')
  const [qCefr, setQCefr] = useState('all')
  const [qDifficulty, setQDifficulty] = useState('all')
  const [qStatus, setQStatus] = useState('active')
  const [qTag, setQTag] = useState('')
  const [qSort, setQSort] = useState('newest')
  const [qRole, setQRole] = useState('all')
  const [filtersPending, setFiltersPending] = useState(false)

  // Form
  const [showForm, setShowForm] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [editQ, setEditQ] = useState<any>(null)
  const [detailQ, setDetailQ] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [qStep, setQStep] = useState(1)
  const [formQ, setFormQ] = useState({
    section:'grammar', type:'multiple_choice', content:'', 
    correct_answer:'', cefr_level:'B1', difficulty:'medium',
    competency_tag:'', aircraft_context:'', audio_url:'', image_url:'', active:true, role_tag:'general',
    dla_section: 'general', reading_text: '', answer_time_sec: 75
  })
  const [options, setOptions] = useState([
    {text:'',is_correct:false},{text:'',is_correct:false},
    {text:'',is_correct:false},{text:'',is_correct:false}
  ])
  const [rubrics, setRubrics] = useState<any[]>([])
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [selectedSubRoles, setSelectedSubRoles] = useState<string[]>([])
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([])

  // Taxonomy
  const [departments, setDepartments] = useState<any[]>([])
  const [subRoles, setSubRoles] = useState<any[]>([])
  const [useCases, setUseCases] = useState<any[]>([])

  // Bulk upload
  const [bulkText, setBulkText] = useState('')
  const [bulkParsed, setBulkParsed] = useState<any[]>([])
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkSection, setBulkSection] = useState('grammar')
  const [bulkCefr, setBulkCefr] = useState('B1')
  const [bulkDifficulty, setBulkDifficulty] = useState('medium')
  const fileRef = useRef<HTMLInputElement>(null)

  // AI staging
  const [showAI, setShowAI] = useState(false)
  const [aiQueue, setAiQueue] = useState<any[]>([])
  const [aiProcessing, setAiProcessing] = useState(false)
  const [aiProgress, setAiProgress] = useState(0)
  const aiFileRef = useRef<HTMLInputElement>(null)

  const filteredSubRoles = useMemo(() => {
    if (!selectedDepts.length) return []
    return subRoles.filter(s => selectedDepts.includes(s.department_id))
  }, [subRoles, selectedDepts])

  // Functions
  const runQuery = useCallback(async (page = qPage, overrides: any = {}) => {
    setQLoading(true)
    setQLoadedOnce(true)
    const section = overrides.section ?? qSection
    const cefr = overrides.cefr ?? qCefr
    const difficulty = overrides.difficulty ?? qDifficulty
    const status = overrides.status ?? qStatus
    const search = overrides.search ?? qSearch
    const tag = overrides.tag ?? qTag
    const sort = overrides.sort ?? qSort
    const role = overrides.role ?? qRole
    const pageSize = overrides.pageSize ?? qPageSize

    let query = supabase
      .from('questions')
      .select('*,question_analytics(difficulty_index,total_attempts,last_used_at),question_assignments(id,departments(name),sub_roles(name))', {count:'exact'})
      .eq('is_latest', true)
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (section === 'dla') {
      query = query.eq('is_dla', true)
    } else if (section !== 'all') {
      query = query.eq('section', section).eq('is_dla', false)
    } else {
      // If 'all', we show everything? Or maybe exclude DLA from 'all' to keep it clean?
      // Usually 'all' means all regular questions.
      // Let's keep 'all' as is for now.
    }
    if (cefr !== 'all') query = query.eq('cefr_level', cefr)
    if (difficulty !== 'all') query = query.eq('difficulty', difficulty)
    if (status === 'active') query = query.eq('active', true)
    if (status === 'inactive') query = query.eq('active', false)
    if (search) query = query.ilike('content', `%${search}%`)
    if (tag) query = query.ilike('competency_tag', `%${tag}%`)
    if (role !== 'all') query = query.eq('role_tag', role)

    if (sort === 'newest') query = query.order('created_at', {ascending:false})
    else if (sort === 'oldest') query = query.order('created_at', {ascending:true})
    else if (sort === 'usage') query = query.order('usage_count', {ascending:false})
    else if (sort === 'cefr') query = query.order('cefr_level', {ascending:true})

    const { data, count, error } = await query
    if (error) {
      console.error('Error fetching questions:', error)
    }
    setQuestions(data||[])
    setQTotal(count||0)
    setQLoading(false)
    setFiltersPending(false)
  }, [qPage, qSection, qCefr, qDifficulty, qStatus, qSearch, qTag, qSort, qRole, qPageSize])

  useEffect(() => { 
    runQuery()
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
    loadTaxonomy()
  }, [runQuery])

  const applyFilters = () => { setSelectedQIds([]); setQPage(0); runQuery(0) }
  const toggleSelect = (id: string) => setSelectedQIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  const toggleSelectAll = () => (selectedQIds.length === questions.length) ? setSelectedQIds([]) : setSelectedQIds(questions.map(q=>q.id))
  
  const startBulkDelete = () => {
    setDelItems(questions.filter(q=>selectedQIds.includes(q.id)))
    setDelInput(''); setShowDelConfirm(true)
  }
  
  const finalDelete = async () => {
    if (delItems.length > 5 && delInput !== 'DELETE') return
    setQLoading(true)
    const ids = delItems.map(i=>i.id) 
    const { data: used } = await supabase.from('exam_answers').select('question_id').in('question_id', ids)
    const usedIds = new Set(used?.map(u=>u.question_id) || [])
    const toSoftDelete = ids.filter(id => usedIds.has(id))
    const toHardDelete = ids.filter(id => !usedIds.has(id))
    if (toSoftDelete.length) await supabase.from('questions').update({ active:false }).in('id', toSoftDelete)
    if (toHardDelete.length) await supabase.from('questions').delete().in('id', toHardDelete)
    
    setShowDelConfirm(false); setDelItems([]); setDelInput(''); setQLoading(false); runQuery(qPage)
  }

  const resetForm = () => {
    setEditQ(null); setQStep(1); 
    setFormQ({ section:'grammar', type:'multiple_choice', content:'', correct_answer:'', cefr_level:'B1', difficulty:'medium', competency_tag:'', aircraft_context:'', audio_url:'', image_url:'', active:true, role_tag:'general', dla_section: 'general', reading_text: '', answer_time_sec: 75 });
    setOptions([{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false}]);
    setSelectedDepts([]); setSelectedSubRoles([]); setSelectedUseCases([]);
  }

  const saveQuestion = async () => {
    if (!formQ.content.trim()) return
    setSaving(true)
    const payload = { ...formQ, created_by: adminId, updated_by: adminId, is_dla: formQ.section === 'dla' }
    let qId = editQ?.id

    if (editQ) {
      const { count } = await supabase.from('exam_answers').select('id',{count:'exact',head:true}).eq('question_id', editQ.id)
      if ((count||0) > 0) {
        await supabase.from('questions').update({ is_latest: false }).eq('id', editQ.id)
        const { data: newQ } = await supabase.from('questions').insert({
          ...payload, version_number: (editQ.version_number||1)+1,
          parent_question_id: editQ.parent_question_id || editQ.id, is_latest: true
        }).select().single()
        qId = newQ?.id
      } else {
        await supabase.from('questions').update({...payload, updated_by: adminId}).eq('id', editQ.id)
        await supabase.from('question_options').delete().eq('question_id', editQ.id)
      }
    } else {
      const { data: newQ } = await supabase.from('questions').insert({...payload, version_number:1, is_latest:true}).select().single()
      qId = newQ?.id
      if (qId) await supabase.from('question_analytics').insert({ question_id:qId, total_attempts:0, correct_count:0 })
    }

    if (qId) {
      const validOptions = options.filter(o=>o.text.trim())
      if (validOptions.length) await supabase.from('question_options').insert(validOptions.map((o,i)=>({question_id:qId,option_text:o.text,is_correct:o.is_correct,sort_order:i})))
      if (!editQ) {
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
    }

    setSaving(false); resetForm(); setShowForm(false); runQuery(qPage)
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('questions').update({ active: !current }).eq('id', id)
    runQuery(qPage)
  }

  const bulkToggleActive = async (targetStatus: boolean) => {
    if (!selectedQIds.length) return
    setQLoading(true)
    const { error } = await supabase.from('questions').update({ active: targetStatus }).in('id', selectedQIds)
    if (error) alert('Error updating questions: ' + error.message)
    runQuery(qPage)
    setQLoading(false)
  }

  const startEdit = (q: any) => {
    setEditQ(q); setQStep(1); setShowForm(true)
    setFormQ({ 
      section:q.section, type:q.type, content:q.content, correct_answer:q.correct_answer||'', 
      cefr_level:q.cefr_level||'B1', difficulty:q.difficulty||'medium', competency_tag:q.competency_tag||'', 
      aircraft_context:q.aircraft_context||'', audio_url:q.audio_url||'', image_url:q.image_url||'', 
      active:q.active, role_tag:q.role_tag||'general',
      dla_section: q.dla_section || 'general', reading_text: q.reading_text || '', answer_time_sec: q.answer_time_sec || 75
    })
  }

  const exportQuestions = async () => {
    let query = supabase.from('questions').select('*').eq('is_latest',true).order('section').order('cefr_level')
    if (qSection !== 'all') query = query.eq('section', qSection)
    if (qCefr !== 'all') query = query.eq('cefr_level', qCefr)
    if (qDifficulty !== 'all') query = query.eq('difficulty', qDifficulty)
    if (qSearch) query = query.ilike('content', `%${qSearch}%`)
    const { data } = await query
    if (!data?.length) return
    const headers = ['section','cefr_level','difficulty','type','content','correct_answer','active']
    const csv = [headers.join(','), ...data.map((q:any) => headers.map(h=>String(q[h]??'')).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    const a = document.createElement('a'); a.href=url; a.download=`questions-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  const parseText = (text: string) => {
    const lines = text.split('\n').map(l=>l.trim()).filter(Boolean)
    const parsed: any[] = []; let current: any = null
    for (const line of lines) {
      if (/^\d+[\.\)]\s/.test(line)) {
        if (current) parsed.push(current)
        current = { section:bulkSection, type:'multiple_choice', content:line.replace(/^\d+[\.\)]\s/,''), correct_answer:'', cefr_level:bulkCefr, difficulty:bulkDifficulty, active:true }
      } else if (current && /^[A-D][\.\)]\s/.test(line)) current.content += '\n'+line
      else if (current && /^(Answer|Correct|Key|ANSWER)[\s:]/i.test(line)) current.correct_answer = line.replace(/^(Answer|Correct|Key|ANSWER)[\s:]*/i,'').trim()
      else if (current) current.content += ' '+line
    }
    if (current) parsed.push(current); return parsed
  }

  const handleFileUpload = async (file: File) => {
    setBulkLoading(true)
    const text = await file.text()
    const parsed = parseText(text)
    setBulkParsed(parsed); setBulkStatus(`Found ${parsed.length} questions.`)
    setBulkLoading(false)
  }

  const confirmBulkUpload = async () => {
    if (!bulkParsed.length) return
    setBulkLoading(true); setBulkStatus('Uploading...')
    await supabase.from('questions').insert(bulkParsed)
    setBulkStatus('✅ Imported successfully!')
    setBulkParsed([]); setBulkLoading(false); runQuery(0); 
    setTimeout(()=>setShowBulk(false), 2000)
  }

  const startSingleDelete = (q: any) => { setDelItems([q]); setDelInput(''); setShowDelConfirm(true); }

  return (
    <div style={{ position: 'relative' }}>
      <QuestionBank 
        questions={questions} qLoading={qLoading} qLoadedOnce={qLoadedOnce} qTotal={qTotal}
        qPage={qPage} qPageSize={qPageSize} selectedQIds={selectedQIds}
        qSearch={qSearch} qSection={qSection} qCefr={qCefr} qDifficulty={qDifficulty} qStatus={qStatus} qTag={qTag} qSort={qSort} qRole={qRole}
        filtersPending={filtersPending} showAI={showAI} showBulk={showBulk}
        aiQueue={aiQueue} aiProcessing={aiProcessing} aiProgress={aiProgress}
        bulkText={bulkText} bulkParsed={bulkParsed} bulkStatus={bulkStatus} bulkLoading={bulkLoading} bulkSection={bulkSection} bulkCefr={bulkCefr} bulkDifficulty={bulkDifficulty}
        setQSearch={setQSearch} setQSection={setQSection} setQCefr={setQCefr} setQDifficulty={setQDifficulty} setQStatus={setQStatus} setQTag={setQTag} setQSort={setQSort} setQRole={setQRole}
        setQPage={setQPage} setQPageSize={setQPageSize} setFiltersPending={setFiltersPending} setShowAI={setShowAI} setShowBulk={setShowBulk}
        setShowForm={setShowForm} setSelectedQIds={setSelectedQIds} setAiQueue={setAiQueue} setAiProgress={setAiProgress}
        setBulkText={setBulkText} setBulkParsed={setBulkParsed} setBulkStatus={setBulkStatus} setBulkLoading={setBulkLoading} setBulkSection={setBulkSection} setBulkCefr={setBulkCefr} setBulkDifficulty={setBulkDifficulty}
        applyFilters={applyFilters} runQuery={runQuery} 
        toggleSelect={toggleSelect} toggleSelectAll={toggleSelectAll} toggleActive={toggleActive}
        startSingleDelete={startSingleDelete} startBulkDelete={startBulkDelete} startEdit={startEdit} resetForm={resetForm}
        exportQuestions={exportQuestions} loadAIFile={async (f: File) => {}} runAITagging={async () => {}} approveAll={async () => {}}
        handleFileUpload={handleFileUpload} parseText={parseText} confirmBulkUpload={confirmBulkUpload}
        setDetailQ={setDetailQ} bulkToggleActive={bulkToggleActive}
      />

      {/* MODALS & DRAWER */}
      {showDelConfirm && (
        <div style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(12,31,63,0.4)',backdropFilter:'blur(4px)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:'32px',borderRadius:'20px',width:'440px',boxShadow:'0 20px 50px rgba(0,0,0,0.2)'}}>
            <h3 style={{margin:'0 0 10px 0',fontSize:'20px',fontWeight:800,color:'var(--navy)'}}>{delItems.length === 1 ? 'Delete Question?' : `Delete ${delItems.length} Items?`}</h3>
            <p style={{fontSize:'14px',color:'var(--t3)',marginBottom:'24px'}}>This action cannot be undone. Are you sure?</p>
            {delItems.length > 5 && (
              <div style={{marginBottom:'20px',padding:'12px',background:'#FFFBEB',borderRadius:'8px',border:'1.5px solid #FEF3C7'}}>
                <label style={{fontSize:'12px',fontWeight:700,color:'#92400E',display:'block',marginBottom:'6px'}}>Type "DELETE" to confirm</label>
                <input value={delInput} onChange={e=>setDelInput(e.target.value.toUpperCase())} placeholder="DELETE" style={inp({width:'100%'})} />
              </div>
            )}
            <div style={{display:'flex',gap:'12px'}}>
              <button onClick={()=>setShowDelConfirm(false)} style={{flex:1,padding:'12px',borderRadius:'10px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>Cancel</button>
              <button onClick={finalDelete} disabled={delItems.length > 5 && delInput !== 'DELETE'} style={{flex:1,padding:'12px',borderRadius:'10px',border:'none',background:'#DC2626',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity: (delItems.length > 5 && delInput !== 'DELETE') ? 0.5 : 1}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {(showForm || detailQ) && (
        <>
          <div onClick={() => { setShowForm(false); setDetailQ(null); resetForm(); }} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(12,31,63,0.4)',backdropFilter:'blur(4px)',zIndex:1100}} />
          <div style={{position:'fixed',top:0,right:0,width:'640px',height:'100%',background:'#fff',zIndex:1101,boxShadow:'-10px 0 50px rgba(0,0,0,0.15)',display:'flex',flexDirection:'column',animation:'drawerSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'}}>
            <div style={{padding:'24px',borderBottom:'1px solid var(--bdr)',background:'var(--off)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <h3 style={{fontSize:'16px',fontWeight:800,color:'var(--navy)',margin:0}}>{showForm ? (editQ ? `Edit Question V${editQ.version_number}` : 'New Question') : 'Question Details'}</h3>
                {detailQ && <div style={{fontSize:'11px',color:'var(--t3)',marginTop:'4px'}}>ID: {detailQ.id.slice(0,8)}</div>}
              </div>
              <button onClick={() => { setShowForm(false); setDetailQ(null); resetForm(); }} style={{background:'none',border:'none',fontSize:'24px',cursor:'pointer',color:'var(--t3)'}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'24px'}}>
              {showForm ? (
                <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                  <div style={{display:'flex',gap:'4px',marginBottom:'12px'}}>
                    {[1,2,3].map(s=>(<div key={s} style={{flex:1,height:'4px',borderRadius:'2px',background:qStep>=s?'var(--navy)':'var(--bdr)'}} />))}
                  </div>

                  {qStep === 1 ? (
                    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                        <div>
                          <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Section</label>
                          <select value={formQ.section} onChange={e=>setFormQ({...formQ,section:e.target.value})} style={inp({width:'100%'})}>{sections.map(s=><option key={s} value={s}>{s.toUpperCase()}</option>)}</select>
                        </div>
                        <div>
                          <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Type</label>
                          <select value={formQ.type} onChange={e=>setFormQ({...formQ,type:e.target.value})} style={inp({width:'100%'})}>
                            {[['multiple_choice','Multiple Choice'],['fill_blank','Fill in Blank'],['audio_response','Audio Response'],['written_response','Written Response'],['dla_simulation','DLA Simulation']].map(o=><option key={o[0]} value={o[0]}>{o[1]}</option>)}
                          </select>
                        </div>
                      </div>
                      
                      {formQ.section === 'dla' && (
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                          <div>
                            <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>DLA Section</label>
                            <select value={formQ.dla_section} onChange={e=>setFormQ({...formQ,dla_section:e.target.value})} style={inp({width:'100%'})}>
                              {[['general','General'],['picture','Picture'],['scenario','Scenario'],['retell','Retell']].map(o=><option key={o[0]} value={o[0]}>{o[1]}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Answer Time (sec)</label>
                            <input type="number" value={formQ.answer_time_sec} onChange={e=>setFormQ({...formQ,answer_time_sec:+e.target.value})} style={inp({width:'100%'})} />
                          </div>
                        </div>
                      )}

                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                        <div>
                          <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>CEFR</label>
                          <select value={formQ.cefr_level} onChange={e=>setFormQ({...formQ,cefr_level:e.target.value})} style={inp({width:'100%'})}>{cefrLevels.map(l=><option key={l} value={l}>{l}</option>)}</select>
                        </div>
                        <div>
                          <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Role Tag</label>
                          <select value={formQ.role_tag} onChange={e=>setFormQ({...formQ,role_tag:e.target.value})} style={inp({width:'100%'})}>
                            {['general','flight_deck','cabin_crew','atc','maintenance'].map(r=><option key={r} value={r}>{r.toUpperCase()}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : qStep === 2 ? (
                    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                      <div>
                        <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Question Text *</label>
                        <textarea value={formQ.content} onChange={e=>setFormQ({...formQ,content:e.target.value})} placeholder="..." rows={5} style={inp({width:'100%',resize:'vertical'})} />
                      </div>
                      {formQ.type === 'multiple_choice' && (
                        <div style={{background:'var(--off)',padding:'16px',borderRadius:'12px',border:'1px solid var(--bdr)'}}>
                          <div style={{fontSize:'11px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>OPTIONS</div>
                          {options.map((opt,i)=>(
                            <div key={i} style={{display:'flex',gap:'8px',marginBottom:'8px',alignItems:'center'}}>
                              <input value={opt.text} onChange={e=>{const o=[...options];o[i]={...o[i],text:e.target.value};setOptions(o)}} style={inp({flex:1})} />
                              <input type="checkbox" checked={opt.is_correct} onChange={e=>{const o=[...options];o.forEach((x,idx)=>x.is_correct=idx===i?e.target.checked:false);setOptions([...o])}} />
                            </div>
                          ))}
                        </div>
                      )}
                      <div>
                        <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Asset URL (Image/Audio)</label>
                        <input value={formQ.audio_url || formQ.image_url} onChange={e=>setFormQ({...formQ,audio_url:e.target.value})} placeholder="https://..." style={inp({width:'100%'})} />
                      </div>
                      {formQ.dla_section === 'retell' && (
                        <div>
                          <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Reading Text (for Retell)</label>
                          <textarea value={formQ.reading_text} onChange={e=>setFormQ({...formQ,reading_text:e.target.value})} placeholder="..." rows={4} style={inp({width:'100%'})} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                      <div style={{fontSize:'13px',fontWeight:600,color:'var(--t2)'}}>Assign this question to departments or sub-roles in Step 3... (Logic implemented in monolith)</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                  <div style={{display:'flex',gap:'8px'}}>
                    <span style={{padding:'4px 10px',borderRadius:'6px',background:sectionColors[detailQ.section]+'15',color:sectionColors[detailQ.section],fontSize:'11px',fontWeight:800}}>{detailQ.section.toUpperCase()}</span>
                    <span style={{padding:'4px 10px',borderRadius:'6px',background:'var(--sky3)',color:'var(--sky)',fontSize:'11px',fontWeight:800}}>{detailQ.cefr_level}</span>
                  </div>
                  <div style={{fontSize:'16px',color:'var(--navy)',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{detailQ.content}</div>
                  {detailQ.audio_url && <img src={detailQ.audio_url} style={{maxWidth:'100%',borderRadius:'12px'}} />}
                </div>
              )}
            </div>
            <div style={{padding:'24px',borderTop:'1px solid var(--bdr)',background:'#fafafa',display:'flex',justifyContent:'flex-end',gap:'10px'}}>
              <button onClick={()=>{setShowForm(false);setDetailQ(null);resetForm();}} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>Close</button>
              {showForm && qStep > 1 && <button onClick={()=>setQStep(qStep-1)} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid var(--navy)',background:'#fff',color:'var(--navy)',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Back</button>}
              {showForm && qStep < 3 && <button onClick={()=>setQStep(qStep+1)} style={{padding:'10px 30px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Next</button>}
              {showForm && qStep === 3 && <button onClick={saveQuestion} disabled={saving} style={{padding:'10px 30px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer',opacity:saving?0.5:1}}>{saving?'Saving...':'Save Question'}</button>}
              {detailQ && !showForm && <button onClick={()=>{startEdit(detailQ);setDetailQ(null)}} style={{padding:'10px 30px',borderRadius:'8px',border:'none',background:'var(--sky)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Edit</button>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
