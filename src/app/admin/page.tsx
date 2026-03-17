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

  // Question bank
  const [questions, setQuestions] = useState<any[]>([])
  const [qLoading, setQLoading] = useState(false)
  const [qTotal, setQTotal] = useState(0)
  const [qPage, setQPage] = useState(0)
  const [qPageSize, setQPageSize] = useState(25)

  // Filters
  const [qSearch, setQSearch] = useState('')
  const [qSection, setQSection] = useState('all')
  const [qCefr, setQCefr] = useState('all')
  const [qDifficulty, setQDifficulty] = useState('all')
  const [qStatus, setQStatus] = useState('active')
  const [qTag, setQTag] = useState('')
  const [qSort, setQSort] = useState('newest')
  const [filtersPending, setFiltersPending] = useState(false)

  // Form
  const [showForm, setShowForm] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [editQ, setEditQ] = useState<any>(null)
  const [detailQ, setDetailQ] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [formQ, setFormQ] = useState({
    section:'grammar', type:'multiple_choice', content:'',
    correct_answer:'', cefr_level:'B1', difficulty:'medium',
    competency_tag:'', aircraft_context:'', audio_url:'', active:true
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

  // Template state
  const [templates, setTemplates] = useState<any[]>([])
  const [tLoading, setTLoading] = useState(false)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editTemplate, setEditTemplate] = useState<any>(null)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name:'', role_profile:'general', grammar_count:15, reading_count:5,
    writing_count:3, speaking_count:4, listening_count:8,
    weight_grammar:10, weight_reading:20, weight_writing:20,
    weight_speaking:40, weight_listening:10, time_limit_mins:90,
    writing_timer_mins:3.5, speaking_attempts:3, listening_single_play:true,
    passing_cefr:'B2', proctoring_enabled:true, attempts_allowed:1, org_id:null
  })

  useEffect(() => { checkAuth(); loadStats(); loadTaxonomy() }, [])
  useEffect(() => { if (activeSection === 'questions') { setQPage(0); runQuery(0) } }, [activeSection])
  useEffect(() => { if (activeSection === 'templates') loadTemplates() }, [activeSection])

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

  // ── QUESTION QUERY ENGINE ──
  async function runQuery(page = qPage, overrides: any = {}) {
    setQLoading(true)
    const section = overrides.section ?? qSection
    const cefr = overrides.cefr ?? qCefr
    const difficulty = overrides.difficulty ?? qDifficulty
    const status = overrides.status ?? qStatus
    const search = overrides.search ?? qSearch
    const tag = overrides.tag ?? qTag
    const sort = overrides.sort ?? qSort
    const pageSize = overrides.pageSize ?? qPageSize

    let query = supabase
      .from('questions')
      .select('*,question_analytics(difficulty_index,total_attempts,last_used_at),question_assignments(id,departments(name),sub_roles(name))', {count:'exact'})
      .eq('is_latest', true)
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (section !== 'all') query = query.eq('section', section)
    if (cefr !== 'all') query = query.eq('cefr_level', cefr)
    if (difficulty !== 'all') query = query.eq('difficulty', difficulty)
    if (status === 'active') query = query.eq('active', true)
    if (status === 'inactive') query = query.eq('active', false)
    if (search) query = query.ilike('content', `%${search}%`)
    if (tag) query = query.ilike('competency_tag', `%${tag}%`)

    if (sort === 'newest') query = query.order('created_at', {ascending:false})
    else if (sort === 'oldest') query = query.order('created_at', {ascending:true})
    else if (sort === 'usage') query = query.order('usage_count', {ascending:false})
    else if (sort === 'cefr') query = query.order('cefr_level', {ascending:true})

    const { data, count } = await query
    setQuestions(data||[])
    setQTotal(count||0)
    setQLoading(false)
    setFiltersPending(false)
  }

  function applyFilters() { setQPage(0); runQuery(0) }

  async function saveQuestion() {
    if (!formQ.content.trim()) return
    setSaving(true)
    const payload = { ...formQ, created_by: adminId, updated_by: adminId }
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

    if (qId) await saveOptionsAndRubrics(qId)
    if (qId && !editQ) await saveAssignments(qId)

    setSaving(false)
    resetForm()
    runQuery(qPage)
    loadStats()
  }

  async function saveOptionsAndRubrics(qId: string) {
    const validOptions = options.filter(o=>o.text.trim())
    if (validOptions.length) await supabase.from('question_options').insert(validOptions.map((o,i)=>({question_id:qId,option_text:o.text,is_correct:o.is_correct,sort_order:i})))
    const validRubrics = rubrics.filter(r=>r.criterion.trim())
    if (validRubrics.length) await supabase.from('question_rubrics').insert(validRubrics.map((r,i)=>({question_id:qId,criterion:r.criterion,description:r.description||'',max_score:r.max_score||10,sort_order:i})))
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
    if (!confirm('Delete this question?')) return
    const { count } = await supabase.from('exam_answers').select('id',{count:'exact',head:true}).eq('question_id', id)
    if ((count||0) > 0) await supabase.from('questions').update({ active:false, is_latest:false }).eq('id', id)
    else await supabase.from('questions').delete().eq('id', id)
    runQuery(qPage); loadStats()
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('questions').update({ active: !current }).eq('id', id)
    runQuery(qPage)
  }

  function startEdit(q: any) {
    setEditQ(q)
    setFormQ({ section:q.section, type:q.type, content:q.content, correct_answer:q.correct_answer||'', cefr_level:q.cefr_level||'B1', difficulty:q.difficulty||'medium', competency_tag:q.competency_tag||'', aircraft_context:q.aircraft_context||'', audio_url:q.audio_url||'', active:q.active })
    setOptions([{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false}])
    setRubrics([]); setShowForm(true); setDetailQ(null)
  }

  function resetForm() {
    setShowForm(false); setEditQ(null)
    setFormQ({ section:'grammar', type:'multiple_choice', content:'', correct_answer:'', cefr_level:'B1', difficulty:'medium', competency_tag:'', aircraft_context:'', audio_url:'', active:true })
    setOptions([{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false}])
    setRubrics([]); setSelectedDepts([]); setSelectedSubRoles([]); setSelectedUseCases([])
  }

  function toggleArr(arr: string[], setArr: (v:string[])=>void, val: string) {
    setArr(arr.includes(val) ? arr.filter(x=>x!==val) : [...arr,val])
  }

  // Export
  async function exportQuestions() {
    let query = supabase.from('questions').select('*').eq('is_latest',true).order('section').order('cefr_level')
    if (qSection !== 'all') query = query.eq('section', qSection)
    if (qCefr !== 'all') query = query.eq('cefr_level', qCefr)
    if (qDifficulty !== 'all') query = query.eq('difficulty', qDifficulty)
    if (qStatus === 'active') query = query.eq('active', true)
    if (qSearch) query = query.ilike('content', `%${qSearch}%`)
    const { data } = await query
    if (!data?.length) return
    const headers = ['section','cefr_level','difficulty','type','content','correct_answer','competency_tag','aircraft_context','active']
    const escape = (v: any) => { const s=String(v??'').replace(/"/g,'""'); return s.includes(',')||s.includes('\n')?`"${s}"`:s }
    const csv = [headers.join(','), ...data.map((q:any) => headers.map(h=>escape(q[h])).join(','))].join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href=url; a.download=`questions-${qSection}-${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // Bulk upload helpers
  function parseCSVLine(line: string): string[] {
    const result: string[] = []; let current=''; let inQuotes=false
    for (let i=0;i<line.length;i++) {
      const ch=line[i]
      if (ch==='"'){if(inQuotes&&line[i+1]==='"'){current+='"';i++}else inQuotes=!inQuotes}
      else if(ch===','&&!inQuotes){result.push(current);current=''}
      else current+=ch
    }
    result.push(current); return result
  }

  function parseText(text: string) {
    const lines = text.split('\n').map(l=>l.trim()).filter(Boolean)
    const parsed: any[] = []; let current: any = null
    for (const line of lines) {
      if (/^\d+[\.\)]\s/.test(line)) {
        if (current) parsed.push(current)
        current = { section:bulkSection, type:'multiple_choice', content:line.replace(/^\d+[\.\)]\s/,''), correct_answer:'', cefr_level:bulkCefr, difficulty:bulkDifficulty, competency_tag:'', aircraft_context:'', audio_url:'', active:true }
      } else if (current && /^[A-D][\.\)]\s/.test(line)) {
        current.content += '\n'+line
      } else if (current && /^(Answer|Correct|Key|ANSWER)[\s:]/i.test(line)) {
        current.correct_answer = line.replace(/^(Answer|Correct|Key|ANSWER)[\s:]*/i,'').trim()
      } else if (current) current.content += ' '+line
    }
    if (current) parsed.push(current)
    return parsed
  }

  async function handleFileUpload(file: File) {
    setBulkLoading(true)
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'txt') {
      const parsed = parseText(await file.text())
      setBulkParsed(parsed); setBulkStatus(`Found ${parsed.length} questions.`)
    } else if (ext === 'csv') {
      const text = await file.text()
      const lines = text.split('\n').filter(Boolean)
      const headers = parseCSVLine(lines[0]).map(h=>h.trim().toLowerCase().replace(/"/g,''))
      const parsed = lines.slice(1).map(line => {
        const vals = parseCSVLine(line).map(v=>v.trim().replace(/"/g,''))
        const obj: any = { section:bulkSection, type:'multiple_choice', cefr_level:bulkCefr, difficulty:bulkDifficulty, active:true, audio_url:'', competency_tag:'', aircraft_context:'' }
        headers.forEach((h,i) => { if(vals[i]) obj[h]=vals[i] })
        return obj
      }).filter(q=>q.content)
      setBulkParsed(parsed); setBulkStatus(`Found ${parsed.length} questions from CSV.`)
    } else {
      setBulkStatus(`${ext?.toUpperCase()}: Export as CSV or TXT first.`)
    }
    setBulkLoading(false)
  }

  async function confirmBulkUpload() {
    if (!bulkParsed.length) return
    setBulkLoading(true); setBulkStatus('Uploading...')
    const BATCH=100; const errs: string[]=[]
    for (let i=0;i<bulkParsed.length;i+=BATCH) {
      const { error } = await supabase.from('questions').insert(bulkParsed.slice(i,i+BATCH))
      if (error) errs.push(`Batch ${Math.floor(i/BATCH)+1}: ${error.message}`)
    }
    setBulkStatus(errs.length===0?`✅ Imported ${bulkParsed.length} questions!`:`⚠️ ${errs.length} errors.`)
    setBulkParsed([]); setBulkLoading(false)
    runQuery(0); loadStats()
    if (errs.length===0) setTimeout(()=>{setShowBulk(false);setBulkStatus('')},2000)
  }

  // AI tagging
  async function loadAIFile(file: File) {
    setAiProgress(0)
    const text = await file.text()
    const lines = text.split('\n')
    const headers = parseCSVLine(lines[0]).map(h=>h.trim().toLowerCase())
    const rows = lines.slice(1).filter(l=>l.trim()).map(line => {
      const vals = parseCSVLine(line)
      const obj: any = {}
      headers.forEach((h,i) => { obj[h] = vals[i]?.trim().replace(/^"|"$/g,'') || '' })
      return obj
    }).filter(r=>r.content)
    setAiQueue(rows.map(r=>({...r,ai_section:r.section||'',ai_cefr:r.cefr_level||'',ai_difficulty:r.difficulty||'medium',ai_tag:r.competency_tags?.split('|')[0]||'',reviewed:false})))
  }

  async function runAITagging() {
    setAiProcessing(true)
    const sections = ['grammar','reading','writing','speaking','listening']
    const cefrs = ['A1','A2','B1','B2','C1']
    const updated = [...aiQueue]
    for (let i=0;i<updated.length;i++) {
      const q=updated[i]
      if (!q.ai_section||!sections.includes(q.ai_section)) {
        const text=q.content.toLowerCase()
        if(text.includes('listen')||text.includes('audio')||text.includes('heard')||text.includes('announcement'))q.ai_section='listening'
        else if(text.includes('write')||text.includes('report')||text.includes('email')||text.includes('letter')||text.includes('task:'))q.ai_section='writing'
        else if(text.includes('speak')||text.includes('describe')||text.includes('discuss')||text.includes('roleplay'))q.ai_section='speaking'
        else if(text.includes('read')||text.includes('passage')||text.includes('text')||text.includes('paragraph'))q.ai_section='reading'
        else q.ai_section='grammar'
      }
      if (!q.ai_cefr||!cefrs.includes(q.ai_cefr)) {
        const text=q.content.toLowerCase()
        if(text.includes('analyse')||text.includes('critically')||text.includes('evaluate'))q.ai_cefr='C1'
        else if(text.includes('explain')||text.includes('compare')||text.includes('discuss'))q.ai_cefr='B2'
        else if(text.includes('describe')||text.includes('what would you'))q.ai_cefr='B1'
        else if(text.length<80)q.ai_cefr='A2'
        else q.ai_cefr='B1'
      }
      updated[i]=q
      if(i%50===0){setAiQueue([...updated]);setAiProgress(Math.round((i/updated.length)*100));await new Promise(r=>setTimeout(r,10))}
    }
    setAiQueue(updated); setAiProgress(100); setAiProcessing(false)
  }

  async function approveAll() {
    const BATCH=100
    for (let i=0;i<aiQueue.length;i+=BATCH) {
      const batch=aiQueue.slice(i,i+BATCH).map(q=>({content:q.content,correct_answer:q.correct_answer||'',cefr_level:q.ai_cefr||'B1',difficulty:q.ai_difficulty||'medium',section:q.ai_section||'grammar',competency_tag:q.ai_tag||'',aircraft_context:q.aircraft_context||'',audio_url:q.audio_url||'',active:true,type:'multiple_choice',version_number:1,is_latest:true,created_by:adminId}))
      await supabase.from('questions').insert(batch)
      setAiProgress(Math.round(((i+BATCH)/aiQueue.length)*100))
    }
    setShowAI(false); setAiQueue([]); setAiProgress(0)
    runQuery(0); loadStats()
  }

  // Templates
  async function loadTemplates() {
    setTLoading(true)
    const { data } = await supabase.from('exam_templates').select('*,organizations(name)').order('created_at',{ascending:false})
    setTemplates(data||[]); setTLoading(false)
  }

  async function saveTemplate() {
    if (!newTemplate.name.trim()) return
    setSavingTemplate(true)
    const total = newTemplate.weight_grammar+newTemplate.weight_reading+newTemplate.weight_writing+newTemplate.weight_speaking+newTemplate.weight_listening
    if (Math.abs(total-100)>0.1) { alert('Weights must add up to 100%. Current: '+total+'%'); setSavingTemplate(false); return }
    const payload = { name:newTemplate.name, role_profile:newTemplate.role_profile, grammar_count:newTemplate.grammar_count, reading_count:newTemplate.reading_count, writing_count:newTemplate.writing_count, speaking_count:newTemplate.speaking_count, listening_count:newTemplate.listening_count, weight_grammar:newTemplate.weight_grammar, weight_reading:newTemplate.weight_reading, weight_writing:newTemplate.weight_writing, weight_speaking:newTemplate.weight_speaking, weight_listening:newTemplate.weight_listening, time_limit_mins:newTemplate.time_limit_mins, writing_timer_mins:newTemplate.writing_timer_mins, speaking_attempts:newTemplate.speaking_attempts, listening_single_play:newTemplate.listening_single_play, passing_cefr:newTemplate.passing_cefr, proctoring_enabled:newTemplate.proctoring_enabled, attempts_allowed:newTemplate.attempts_allowed }
    if (editTemplate) { const {error}=await supabase.from('exam_templates').update(payload).eq('id',editTemplate.id); if(error){alert('Error: '+error.message);setSavingTemplate(false);return} }
    else { const {error}=await supabase.from('exam_templates').insert(payload); if(error){alert('Error: '+error.message);setSavingTemplate(false);return} }
    setSavingTemplate(false); setShowTemplateForm(false); setEditTemplate(null)
    setNewTemplate({name:'',role_profile:'general',grammar_count:15,reading_count:5,writing_count:3,speaking_count:4,listening_count:8,weight_grammar:10,weight_reading:20,weight_writing:20,weight_speaking:40,weight_listening:10,time_limit_mins:90,writing_timer_mins:3.5,speaking_attempts:3,listening_single_play:true,passing_cefr:'B2',proctoring_enabled:true,attempts_allowed:1,org_id:null})
    loadTemplates()
  }

  async function deleteTemplate(id: string) { if(!confirm('Delete?'))return; await supabase.from('exam_templates').delete().eq('id',id); loadTemplates() }
  async function duplicateTemplate(t: any) { const {name,...rest}=t; await supabase.from('exam_templates').insert({...rest,name:name+' (Copy)'}); loadTemplates() }
  function startEditTemplate(t: any) { setEditTemplate(t); setNewTemplate({name:t.name,role_profile:t.role_profile,grammar_count:t.grammar_count,reading_count:t.reading_count,writing_count:t.writing_count,speaking_count:t.speaking_count,listening_count:t.listening_count,weight_grammar:t.weight_grammar,weight_reading:t.weight_reading,weight_writing:t.weight_writing,weight_speaking:t.weight_speaking,weight_listening:t.weight_listening,time_limit_mins:t.time_limit_mins,writing_timer_mins:t.writing_timer_mins||3.5,speaking_attempts:t.speaking_attempts||3,listening_single_play:t.listening_single_play!==false,passing_cefr:t.passing_cefr,proctoring_enabled:t.proctoring_enabled!==false,attempts_allowed:t.attempts_allowed||1,org_id:t.org_id||null}); setShowTemplateForm(true) }

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/login') }

  if (loading) return <div style={{minHeight:'100vh',background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'#fff'}}>Loading...</div></div>

  const sections = ['grammar','reading','writing','speaking','listening']
  const cefrLevels = ['A1','A2','B1','B2','C1']
  const totalPages = Math.ceil(qTotal / qPageSize)
  const filteredSubRoles = selectedDepts.length ? subRoles.filter(s=>selectedDepts.includes(s.department_id)) : subRoles
  const inp = (extra={}) => ({padding:'8px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',fontFamily:'var(--fb)',...extra} as any)

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'var(--fb)'}}>
      {/* Sidebar */}
      <div style={{width:'210px',background:'var(--navy)',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'18px 16px 14px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:900,color:'#fff'}}>Avil<span style={{color:'#5AAEDF'}}>ingo</span></div>
          <div style={{fontSize:'10.5px',color:'rgba(255,255,255,0.3)',marginTop:'2px'}}>Admin Panel</div>
        </div>
        <nav style={{padding:'10px 8px',flex:1}}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setActiveSection(item.id)} style={{display:'block',width:'100%',textAlign:'left',padding:'8px 12px',marginBottom:'1px',borderRadius:'7px',border:'none',cursor:'pointer',fontSize:'12.5px',fontWeight:500,background:activeSection===item.id?'rgba(58,142,208,0.2)':'transparent',color:activeSection===item.id?'#5AAEDF':'rgba(255,255,255,0.5)'}}>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{padding:'10px 8px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontSize:'11.5px',color:'rgba(255,255,255,0.35)',padding:'6px 12px'}}>{adminName}</div>
          <button onClick={handleSignOut} style={{display:'block',width:'100%',textAlign:'left',padding:'8px 12px',borderRadius:'7px',border:'none',cursor:'pointer',fontSize:'12.5px',background:'transparent',color:'rgba(255,255,255,0.35)'}}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,background:'var(--off)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{background:'#fff',padding:'12px 24px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <h1 style={{fontFamily:'var(--fm)',fontSize:'17px',fontWeight:800,color:'var(--navy)',textTransform:'capitalize',margin:0}}>{activeSection==='questions'?'Question Bank':activeSection}</h1>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{fontSize:'11.5px',padding:'2px 8px',borderRadius:'100px',background:'#EAF3DE',color:'#27500A',fontWeight:600}}>Online</span>
            <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'var(--sky3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,color:'var(--sky)'}}>{adminName.charAt(0)}</div>
          </div>
        </div>

        <div style={{padding:'20px 24px',flex:1,overflowY:'auto'}}>

          {/* ── DASHBOARD ── */}
          {activeSection==='dashboard' && (
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'}}>
                {[{label:'Users',value:stats.users,color:'#5AAEDF'},{label:'Questions',value:stats.questions.toLocaleString(),color:'#DEAC50'},{label:'Exams',value:stats.exams,color:'#12B898'},{label:'Organizations',value:stats.orgs,color:'#E06070'}].map(m=>(
                  <div key={m.label} style={{background:'#fff',borderRadius:'12px',padding:'16px',border:'1px solid var(--bdr)'}}>
                    <div style={{fontSize:'11px',color:'var(--t3)',marginBottom:'4px'}}>{m.label}</div>
                    <div style={{fontSize:'24px',fontWeight:700,color:m.color,fontFamily:'var(--fm)'}}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'#fff',borderRadius:'12px',padding:'20px',border:'1px solid var(--bdr)',marginBottom:'16px'}}>
                <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>Section Order by Role Profile</h3>
                <p style={{fontSize:'11.5px',color:'var(--t3)',marginBottom:'12px'}}>ICAO Doc 9835 optimized sequencing</p>
                <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
                  {Object.entries(ROLE_PROFILES).map(([role,order])=>(
                    <div key={role} style={{display:'flex',alignItems:'center',gap:'10px',padding:'7px 12px',borderRadius:'7px',border:'1px solid var(--bdr)',background:'var(--off)'}}>
                      <span style={{fontSize:'11.5px',fontWeight:700,color:'var(--navy)',width:'100px',textTransform:'capitalize',flexShrink:0}}>{role.replace('_',' ')}</span>
                      <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                        {order.map((s,i)=>(
                          <div key={s} style={{display:'flex',alignItems:'center',gap:'3px'}}>
                            <span style={{fontSize:'10.5px',fontWeight:700,padding:'2px 7px',borderRadius:'100px',background:sectionColors[s]+'20',color:sectionColors[s],textTransform:'capitalize'}}>{i+1}. {s}</span>
                            {i<order.length-1&&<span style={{color:'var(--t3)',fontSize:'10px'}}>→</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{background:'#fff',borderRadius:'12px',padding:'20px',border:'1px solid var(--bdr)'}}>
                <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>Quick Actions</h3>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  {[{label:'Question Bank',s:'questions'},{label:'AI Import',s:'questions',ai:true},{label:'Bulk Import',href:'/admin/import'},{label:'Exam Templates',s:'templates'},{label:'Users',href:'/admin/users'},{label:'Reports',href:'/admin/reports'}].map(a=>(
                    a.href
                      ? <a key={a.label} href={a.href} style={{padding:'7px 13px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'12.5px',fontWeight:600,color:'var(--navy)',textDecoration:'none',display:'inline-block'}}>{a.label} →</a>
                      : <button key={a.label} onClick={()=>{setActiveSection(a.s??'questions');if(a.ai)setTimeout(()=>setShowAI(true),100)}} style={{padding:'7px 13px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'12.5px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>{a.label} →</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── QUESTION BANK V2 ── */}
          {activeSection==='questions' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:'16px',alignItems:'start'}}>

              {/* Left: Table */}
              <div>
                {/* Toolbar */}
                <div style={{display:'flex',gap:'6px',marginBottom:'12px',flexWrap:'wrap',alignItems:'center'}}>
                  <a href="/admin/import" style={{padding:'8px 13px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'12px',fontWeight:600,color:'var(--navy)',textDecoration:'none'}}>📊 CSV Import</a>
                  <button onClick={()=>{setShowAI(!showAI);setShowBulk(false);setShowForm(false)}} style={{padding:'8px 13px',borderRadius:'7px',border:'1.5px solid #7C3AED',background:'#F5F3FF',color:'#5B21B6',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>🤖 AI Import</button>
                  <button onClick={()=>{setShowBulk(!showBulk);setShowAI(false);setShowForm(false)}} style={{padding:'8px 13px',borderRadius:'7px',border:'1.5px solid var(--sky)',background:'var(--sky3)',color:'var(--sky)',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>⬆ Bulk Upload</button>
                  <button onClick={exportQuestions} style={{padding:'8px 13px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'12px',fontWeight:600,color:'var(--navy)',cursor:'pointer',fontFamily:'var(--fb)'}}>⬇ Export</button>
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

                {/* ADD/EDIT FORM */}
                {showForm && (
                  <div style={{background:'#fff',borderRadius:'12px',padding:'20px',border:'2px solid var(--sky)',marginBottom:'14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'14px'}}>
                      <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',margin:0}}>{editQ?`Edit Q${editQ.version_number>1?' (V'+editQ.version_number+')':''}` :'Add Question'}</h3>
                      <button onClick={resetForm} style={{padding:'4px 10px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11.5px',color:'var(--t2)',fontFamily:'var(--fb)'}}>Cancel</button>
                    </div>
                    {editQ&&<div style={{padding:'7px 10px',background:'#FAEEDA',borderRadius:'6px',fontSize:'12px',color:'#633806',marginBottom:'12px'}}>⚠️ If used in past exams, editing creates V{(editQ.version_number||1)+1}.</div>}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                      {[{label:'Section',key:'section',opts:sections.map(s=>({v:s,l:s.charAt(0).toUpperCase()+s.slice(1)}))},{label:'Type',key:'type',opts:[{v:'multiple_choice',l:'Multiple Choice'},{v:'fill_blank',l:'Fill in Blank'},{v:'audio_response',l:'Audio Response'},{v:'written_response',l:'Written Response'},{v:'listening',l:'Listening'},{v:'picture_description',l:'Picture'}]},{label:'CEFR',key:'cefr_level',opts:cefrLevels.map(l=>({v:l,l}))},{label:'Difficulty',key:'difficulty',opts:[{v:'easy',l:'Easy'},{v:'medium',l:'Medium'},{v:'hard',l:'Hard'}]},{label:'Competency Tag',key:'competency_tag',isSelect:true},{label:'Aircraft Context',key:'aircraft_context',isInput:true,placeholder:'A320, B737...'}].map((f:any)=>(
                        <div key={f.key}>
                          <label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'3px'}}>{f.label}</label>
                          {f.isInput
                            ? <input value={(formQ as any)[f.key]} onChange={e=>setFormQ({...formQ,[f.key]:e.target.value})} placeholder={f.placeholder} style={inp({width:'100%'})} />
                            : f.isSelect
                              ? <select value={formQ.competency_tag} onChange={e=>setFormQ({...formQ,competency_tag:e.target.value})} style={inp({width:'100%'})}><option value="">-- Tag --</option>{(COMPETENCY_TAGS[formQ.section]||[]).map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}</select>
                              : <select value={(formQ as any)[f.key]} onChange={e=>setFormQ({...formQ,[f.key]:e.target.value})} style={inp({width:'100%'})}>{f.opts.map((o:any)=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
                          }
                        </div>
                      ))}
                    </div>
                    <div style={{marginBottom:'10px'}}>
                      <label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'3px'}}>Question Content *</label>
                      <textarea value={formQ.content} onChange={e=>setFormQ({...formQ,content:e.target.value})} placeholder="Enter question text..." rows={4} style={{...inp({width:'100%',resize:'vertical'})}} />
                    </div>
                    <div style={{marginBottom:'10px'}}>
                      <label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'3px'}}>Correct Answer</label>
                      <input value={formQ.correct_answer} onChange={e=>setFormQ({...formQ,correct_answer:e.target.value})} placeholder="A, B, C or D for MCQ. Model answer for others." style={inp({width:'100%'})} />
                    </div>
                    {(formQ.type==='multiple_choice'||formQ.type==='fill_blank')&&(
                      <div style={{marginBottom:'10px',background:'var(--off)',borderRadius:'8px',padding:'12px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                          <label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)'}}>Answer Options</label>
                          <button onClick={()=>setOptions([...options,{text:'',is_correct:false}])} style={{padding:'3px 10px',borderRadius:'5px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>+ Add</button>
                        </div>
                        {options.map((opt,i)=>(
                          <div key={i} style={{display:'flex',gap:'6px',alignItems:'center',marginBottom:'5px'}}>
                            <span style={{fontSize:'12px',fontWeight:700,color:'var(--t3)',width:'16px'}}>{String.fromCharCode(65+i)}.</span>
                            <input value={opt.text} onChange={e=>{const o=[...options];o[i]={...o[i],text:e.target.value};setOptions(o)}} placeholder={`Option ${String.fromCharCode(65+i)}`} style={{...inp({flex:1})}} />
                            <label style={{display:'flex',alignItems:'center',gap:'3px',fontSize:'11.5px',cursor:'pointer',flexShrink:0}}>
                              <input type="checkbox" checked={opt.is_correct} onChange={e=>{const o=[...options];o[i]={...o[i],is_correct:e.target.checked};setOptions(o)}} /> Correct
                            </label>
                            {options.length>2&&<button onClick={()=>setOptions(options.filter((_,idx)=>idx!==i))} style={{padding:'3px 7px',borderRadius:'4px',border:'1.5px solid #FECACA',background:'#FEF2F2',cursor:'pointer',fontSize:'10.5px',color:'#DC2626',fontFamily:'var(--fb)'}}>✕</button>}
                          </div>
                        ))}
                      </div>
                    )}
                    {(formQ.section==='writing'||formQ.section==='speaking')&&(
                      <div style={{marginBottom:'10px',background:'#F0FDF4',borderRadius:'8px',padding:'12px',border:'1px solid #BBF7D0'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                          <label style={{fontSize:'11px',fontWeight:700,color:'#14532D'}}>Grading Rubrics</label>
                          <button onClick={()=>setRubrics([...rubrics,{criterion:'',description:'',max_score:10}])} style={{padding:'3px 10px',borderRadius:'5px',border:'1.5px solid #BBF7D0',background:'#fff',cursor:'pointer',fontSize:'11px',fontWeight:600,color:'#14532D',fontFamily:'var(--fb)'}}>+ Add</button>
                        </div>
                        {rubrics.length===0&&<div style={{fontSize:'11.5px',color:'#4ADE80'}}>Add criteria like "Grammar", "Vocabulary", "Task Completion".</div>}
                        {rubrics.map((r,i)=>(
                          <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 2fr auto auto',gap:'6px',marginBottom:'5px',alignItems:'center'}}>
                            <input value={r.criterion} onChange={e=>{const rr=[...rubrics];rr[i]={...rr[i],criterion:e.target.value};setRubrics(rr)}} placeholder="Criterion" style={inp({})} />
                            <input value={r.description} onChange={e=>{const rr=[...rubrics];rr[i]={...rr[i],description:e.target.value};setRubrics(rr)}} placeholder="Description" style={inp({})} />
                            <input type="number" value={r.max_score} onChange={e=>{const rr=[...rubrics];rr[i]={...rr[i],max_score:+e.target.value};setRubrics(rr)}} style={{...inp({width:'50px'})}} min={1} max={100} />
                            <button onClick={()=>setRubrics(rubrics.filter((_,idx)=>idx!==i))} style={{padding:'5px 8px',borderRadius:'4px',border:'1.5px solid #FECACA',background:'#FEF2F2',cursor:'pointer',fontSize:'10.5px',color:'#DC2626',fontFamily:'var(--fb)'}}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {(formQ.section==='listening'||formQ.type==='audio_response'||formQ.type==='picture_description')&&(
                      <div style={{marginBottom:'10px'}}>
                        <label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'3px'}}>{formQ.type==='picture_description'?'Image URL':'Audio URL'}</label>
                        <input value={formQ.audio_url} onChange={e=>setFormQ({...formQ,audio_url:e.target.value})} placeholder="https://..." style={inp({width:'100%'})} />
                      </div>
                    )}
                    {!editQ&&(
                      <div style={{background:'var(--off)',borderRadius:'8px',padding:'12px',marginBottom:'12px'}}>
                        <h4 style={{fontFamily:'var(--fm)',fontSize:'12.5px',fontWeight:800,color:'var(--navy)',marginBottom:'10px'}}>Department & Role Assignment</h4>
                        <div style={{marginBottom:'8px'}}>
                          <label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Departments</label>
                          <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                            {departments.map(d=><button key={d.id} onClick={()=>toggleArr(selectedDepts,setSelectedDepts,d.id)} style={{padding:'3px 10px',borderRadius:'100px',border:'1.5px solid',borderColor:selectedDepts.includes(d.id)?'var(--navy)':'var(--bdr)',background:selectedDepts.includes(d.id)?'var(--navy)':'#fff',color:selectedDepts.includes(d.id)?'#fff':'var(--t2)',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{d.name}</button>)}
                          </div>
                        </div>
                        {selectedDepts.length>0&&(
                          <div style={{marginBottom:'8px'}}>
                            <label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Sub-roles</label>
                            <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                              {filteredSubRoles.map(s=><button key={s.id} onClick={()=>toggleArr(selectedSubRoles,setSelectedSubRoles,s.id)} style={{padding:'3px 10px',borderRadius:'100px',border:'1.5px solid',borderColor:selectedSubRoles.includes(s.id)?'var(--sky)':'var(--bdr)',background:selectedSubRoles.includes(s.id)?'var(--sky3)':'#fff',color:selectedSubRoles.includes(s.id)?'var(--sky)':'var(--t2)',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{s.name}</button>)}
                            </div>
                          </div>
                        )}
                        <div>
                          <label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Use Cases</label>
                          <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                            {useCases.map(u=><button key={u.id} onClick={()=>toggleArr(selectedUseCases,setSelectedUseCases,u.id)} style={{padding:'3px 10px',borderRadius:'100px',border:'1.5px solid',borderColor:selectedUseCases.includes(u.id)?'var(--teal)':'var(--bdr)',background:selectedUseCases.includes(u.id)?'#E6F7F4':'#fff',color:selectedUseCases.includes(u.id)?'var(--teal)':'var(--t2)',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{u.name}</button>)}
                          </div>
                        </div>
                      </div>
                    )}
                    <button onClick={saveQuestion} disabled={saving} style={{padding:'9px 22px',borderRadius:'7px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{saving?'Saving...':editQ?'Update':'Save Question'}</button>
                  </div>
                )}

                {/* DETAIL VIEW */}
                {detailQ&&(
                  <div style={{background:'#fff',borderRadius:'12px',padding:'20px',border:'2px solid var(--bdr)',marginBottom:'14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
                      <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                        <span style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'100px',background:(sectionColors[detailQ.section]||'#888')+'20',color:sectionColors[detailQ.section],textTransform:'capitalize'}}>{detailQ.section}</span>
                        <span style={{fontSize:'11px',fontWeight:700,padding:'2px 7px',borderRadius:'6px',background:'var(--sky3)',color:'var(--sky)'}}>{detailQ.cefr_level}</span>
                        <span style={{fontSize:'11px',fontWeight:600,padding:'2px 7px',borderRadius:'6px',textTransform:'capitalize',background:detailQ.difficulty==='easy'?'#EAF3DE':detailQ.difficulty==='hard'?'#FCEBEB':'#FAEEDA',color:detailQ.difficulty==='easy'?'#27500A':detailQ.difficulty==='hard'?'#791F1F':'#633806'}}>{detailQ.difficulty}</span>
                        {detailQ.version_number>1&&<span style={{fontSize:'10.5px',fontWeight:700,padding:'2px 6px',borderRadius:'5px',background:'#E0E7FF',color:'#3730A3'}}>V{detailQ.version_number}</span>}
                      </div>
                      <div style={{display:'flex',gap:'5px'}}>
                        <button onClick={()=>{startEdit(detailQ);setDetailQ(null)}} style={{padding:'4px 10px',borderRadius:'5px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11.5px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>Edit</button>
                        <button onClick={()=>setDetailQ(null)} style={{padding:'4px 10px',borderRadius:'5px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11.5px',color:'var(--t2)',fontFamily:'var(--fb)'}}>Close</button>
                      </div>
                    </div>
                    <p style={{fontSize:'14px',color:'var(--t1)',lineHeight:1.65,whiteSpace:'pre-wrap',marginBottom:'12px'}}>{detailQ.content}</p>
                    {detailQ.correct_answer&&<div style={{fontSize:'12.5px',color:'#27500A',padding:'7px 10px',background:'#EAF3DE',borderRadius:'6px',marginBottom:'10px'}}>✓ {detailQ.correct_answer}</div>}
                    {detailQ.question_analytics?.[0]&&(
                      <div style={{display:'flex',gap:'12px',fontSize:'12px',color:'var(--t3)'}}>
                        <span>Used <strong style={{color:'var(--t1)'}}>{detailQ.question_analytics[0].total_attempts}</strong>x</span>
                        {detailQ.question_analytics[0].difficulty_index!=null&&<span style={{color:detailQ.question_analytics[0].difficulty_index<30?'#DC2626':detailQ.question_analytics[0].difficulty_index>80?'#16A34A':'var(--t3)'}}>{detailQ.question_analytics[0].difficulty_index}% correct</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* TABLE */}
                {qLoading ? (
                  <div style={{textAlign:'center',padding:'32px',color:'var(--t3)'}}>Loading...</div>
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
                            {['Section','Question','CEFR','Diff','Analytics','Assignments','Status','Actions'].map(h=>(
                              <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:'10.5px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.4px'}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {questions.map((q,i)=>(
                            <tr key={q.id} style={{borderBottom:'1px solid var(--bdr)',background:i%2===0?'#fff':'#FAFBFC'}}>
                              <td style={{padding:'9px 12px'}}><span style={{fontSize:'10.5px',fontWeight:700,padding:'2px 7px',borderRadius:'100px',background:(sectionColors[q.section]||'#888')+'20',color:sectionColors[q.section]||'#888',textTransform:'capitalize'}}>{q.section}</span></td>
                              <td style={{padding:'9px 12px',maxWidth:'210px'}}>
                                <div style={{fontSize:'12.5px',color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'pointer'}} onClick={()=>setDetailQ(q)}>{q.content}</div>
                                <div style={{display:'flex',gap:'4px',marginTop:'2px'}}>
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
                                  <button onClick={()=>deleteQuestion(q.id)} style={{padding:'3px 8px',borderRadius:'5px',border:'1.5px solid #FECACA',background:'#FEF2F2',cursor:'pointer',fontSize:'10.5px',fontWeight:600,color:'#DC2626',fontFamily:'var(--fb)'}}>Del</button>
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
                  <button onClick={()=>{setQSection('all');setQCefr('all');setQDifficulty('all');setQStatus('active');setQSearch('');setQTag('');setQSort('newest');setQPage(0);runQuery(0,{section:'all',cefr:'all',difficulty:'all',status:'active',search:'',tag:'',sort:'newest'})}} style={{padding:'3px 8px',borderRadius:'5px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11px',color:'var(--t3)',fontFamily:'var(--fb)'}}>Reset</button>
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
          )}

          {/* ── EXAM TEMPLATES ── */}
          {activeSection==='templates' && (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px'}}>
                <div><h2 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',margin:0,marginBottom:'2px'}}>Exam Templates</h2><p style={{fontSize:'12px',color:'var(--t3)',margin:0}}>Configure section order, counts, weights and timers.</p></div>
                <button onClick={()=>{setShowTemplateForm(true);setEditTemplate(null);setNewTemplate({name:'',role_profile:'general',grammar_count:15,reading_count:5,writing_count:3,speaking_count:4,listening_count:8,weight_grammar:10,weight_reading:20,weight_writing:20,weight_speaking:40,weight_listening:10,time_limit_mins:90,writing_timer_mins:3.5,speaking_attempts:3,listening_single_play:true,passing_cefr:'B2',proctoring_enabled:true,attempts_allowed:1,org_id:null})}} style={{padding:'9px 16px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>+ New Template</button>
              </div>
              {showTemplateForm&&(
                <div style={{background:'#fff',borderRadius:'12px',padding:'22px',border:'2px solid var(--sky)',marginBottom:'18px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'16px'}}>
                    <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',margin:0}}>{editTemplate?'Edit Template':'New Template'}</h3>
                    <button onClick={()=>{setShowTemplateForm(false);setEditTemplate(null)}} style={{padding:'4px 10px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11.5px',color:'var(--t2)',fontFamily:'var(--fb)'}}>Cancel</button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'14px'}}>
                    <div style={{gridColumn:'1/-1'}}>
                      <label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'4px'}}>Template Name *</label>
                      <input value={newTemplate.name} onChange={e=>setNewTemplate({...newTemplate,name:e.target.value})} placeholder="e.g. ICAO Cabin Crew Recruitment" style={inp({width:'100%'})} />
                    </div>
                    <div>
                      <label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'4px'}}>Role Profile</label>
                      <select value={newTemplate.role_profile} onChange={e=>setNewTemplate({...newTemplate,role_profile:e.target.value})} style={inp({width:'100%'})}>
                        {['general','flight_deck','cabin_crew','atc','maintenance','ground_staff'].map(r=><option key={r} value={r}>{r.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'4px'}}>Passing CEFR</label>
                      <select value={newTemplate.passing_cefr} onChange={e=>setNewTemplate({...newTemplate,passing_cefr:e.target.value})} style={inp({width:'100%'})}>{cefrLevels.map(l=><option key={l} value={l}>{l}</option>)}</select>
                    </div>
                    <div>
                      <label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'4px'}}>Total Time (min)</label>
                      <input type="number" value={newTemplate.time_limit_mins} onChange={e=>setNewTemplate({...newTemplate,time_limit_mins:+e.target.value})} style={inp({width:'100%'})} min={30} max={240} />
                    </div>
                  </div>
                  <div style={{background:'var(--off)',borderRadius:'8px',padding:'14px',marginBottom:'14px'}}>
                    <h4 style={{fontFamily:'var(--fm)',fontSize:'12.5px',fontWeight:800,color:'var(--navy)',marginBottom:'10px'}}>Section Configuration</h4>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px',marginBottom:'4px'}}>
                      {sections.map(s=><div key={s} style={{textAlign:'center',fontSize:'10.5px',fontWeight:700,color:sectionColors[s],textTransform:'capitalize',padding:'3px',borderRadius:'5px',background:sectionColors[s]+'12'}}>{s}</div>)}
                    </div>
                    <div style={{marginBottom:'8px'}}>
                      <div style={{fontSize:'10.5px',fontWeight:600,color:'var(--t2)',marginBottom:'5px'}}>Question Count</div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px'}}>
                        {sections.map(s=><input key={s} type="number" value={(newTemplate as any)[`${s}_count`]} onChange={e=>setNewTemplate({...newTemplate,[`${s}_count`]:+e.target.value})} min={0} max={50} style={{padding:'6px',borderRadius:'6px',border:'2px solid'+sectionColors[s],fontSize:'14px',fontWeight:700,textAlign:'center',color:sectionColors[s],fontFamily:'var(--fb)',background:'#fff'}} />)}
                      </div>
                    </div>
                    <div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'5px'}}>
                        <div style={{fontSize:'10.5px',fontWeight:600,color:'var(--t2)'}}>Weight (%)</div>
                        <div style={{fontSize:'10.5px',color:Math.abs((newTemplate.weight_grammar+newTemplate.weight_reading+newTemplate.weight_writing+newTemplate.weight_speaking+newTemplate.weight_listening)-100)<0.1?'#27500A':'#DC2626',fontWeight:700}}>
                          Total: {newTemplate.weight_grammar+newTemplate.weight_reading+newTemplate.weight_writing+newTemplate.weight_speaking+newTemplate.weight_listening}% {Math.abs((newTemplate.weight_grammar+newTemplate.weight_reading+newTemplate.weight_writing+newTemplate.weight_speaking+newTemplate.weight_listening)-100)<0.1?'✓':'(must = 100%)'}
                        </div>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px'}}>
                        {sections.map(s=><input key={s} type="number" value={(newTemplate as any)[`weight_${s}`]} onChange={e=>setNewTemplate({...newTemplate,[`weight_${s}`]:+e.target.value})} min={0} max={100} style={{padding:'6px',borderRadius:'6px',border:'2px solid'+sectionColors[s],fontSize:'14px',fontWeight:700,textAlign:'center',color:sectionColors[s],fontFamily:'var(--fb)',background:'#fff'}} />)}
                      </div>
                    </div>
                  </div>
                  <div style={{background:'var(--off)',borderRadius:'8px',padding:'14px',marginBottom:'14px'}}>
                    <h4 style={{fontFamily:'var(--fm)',fontSize:'12.5px',fontWeight:800,color:'var(--navy)',marginBottom:'10px'}}>Section Rules</h4>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
                      <div><label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'3px'}}>Writing Timer (min/q)</label><input type="number" value={newTemplate.writing_timer_mins} onChange={e=>setNewTemplate({...newTemplate,writing_timer_mins:+e.target.value})} step={0.5} min={1} max={15} style={inp({width:'100%'})} /></div>
                      <div><label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'3px'}}>Speaking Max Attempts</label><input type="number" value={newTemplate.speaking_attempts} onChange={e=>setNewTemplate({...newTemplate,speaking_attempts:+e.target.value})} min={1} max={5} style={inp({width:'100%'})} /></div>
                      <div><label style={{fontSize:'11px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'3px'}}>Candidate Attempts</label><input type="number" value={newTemplate.attempts_allowed} onChange={e=>setNewTemplate({...newTemplate,attempts_allowed:+e.target.value})} min={1} max={10} style={inp({width:'100%'})} /></div>
                    </div>
                    <div style={{display:'flex',gap:'18px',marginTop:'10px'}}>
                      <label style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12.5px',cursor:'pointer'}}>
                        <input type="checkbox" checked={newTemplate.listening_single_play} onChange={e=>setNewTemplate({...newTemplate,listening_single_play:e.target.checked})} />
                        Listening single-play rule
                      </label>
                      <label style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12.5px',cursor:'pointer'}}>
                        <input type="checkbox" checked={newTemplate.proctoring_enabled} onChange={e=>setNewTemplate({...newTemplate,proctoring_enabled:e.target.checked})} />
                        Enable WebRTC proctoring
                      </label>
                    </div>
                  </div>
                  <button onClick={saveTemplate} disabled={savingTemplate} style={{padding:'9px 22px',borderRadius:'7px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>{savingTemplate?'Saving...':editTemplate?'Update Template':'Save Template'}</button>
                </div>
              )}
              {tLoading?<div style={{textAlign:'center',padding:'32px',color:'var(--t3)'}}>Loading...</div>
              :templates.length===0?<div style={{background:'#fff',borderRadius:'12px',padding:'40px',border:'1px solid var(--bdr)',textAlign:'center'}}><div style={{fontSize:'28px',marginBottom:'8px'}}>📋</div><h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',marginBottom:'5px'}}>No templates yet</h3><button onClick={()=>setShowTemplateForm(true)} style={{padding:'9px 18px',borderRadius:'7px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>+ New Template</button></div>
              :<div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {templates.map(t=>(
                  <div key={t.id} style={{background:'#fff',borderRadius:'12px',padding:'18px',border:'1px solid var(--bdr)'}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'12px'}}>
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'3px'}}>
                          <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',margin:0}}>{t.name}</h3>
                          <span style={{fontSize:'10.5px',fontWeight:700,padding:'2px 7px',borderRadius:'100px',background:'#E6EAF4',color:'#2A4070',textTransform:'capitalize'}}>{t.role_profile?.replace('_',' ')}</span>
                          <span style={{fontSize:'10.5px',fontWeight:700,padding:'2px 7px',borderRadius:'100px',background:'var(--sky3)',color:'var(--sky)'}}>Pass: {t.passing_cefr}</span>
                        </div>
                        <div style={{fontSize:'11.5px',color:'var(--t3)'}}>{t.time_limit_mins}min · {t.grammar_count+t.reading_count+t.writing_count+t.speaking_count+t.listening_count}q · {t.proctoring_enabled?'Proctored':'No proctoring'}</div>
                      </div>
                      <div style={{display:'flex',gap:'5px'}}>
                        <button onClick={()=>duplicateTemplate(t)} style={{padding:'4px 10px',borderRadius:'5px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11px',fontWeight:600,color:'var(--t2)',fontFamily:'var(--fb)'}}>Copy</button>
                        <button onClick={()=>startEditTemplate(t)} style={{padding:'4px 10px',borderRadius:'5px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>Edit</button>
                        <button onClick={()=>deleteTemplate(t.id)} style={{padding:'4px 10px',borderRadius:'5px',border:'1.5px solid #FECACA',background:'#FEF2F2',cursor:'pointer',fontSize:'11px',fontWeight:600,color:'#DC2626',fontFamily:'var(--fb)'}}>Delete</button>
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px'}}>
                      {sections.filter(s=>(t[`${s}_count`]||0)>0).map(s=>(
                        <div key={s} style={{padding:'8px',borderRadius:'7px',background:sectionColors[s]+'10',border:'1px solid'+sectionColors[s]+'25',textAlign:'center'}}>
                          <div style={{fontSize:'10px',fontWeight:700,color:sectionColors[s],textTransform:'capitalize',marginBottom:'2px'}}>{s}</div>
                          <div style={{fontSize:'16px',fontWeight:700,color:'var(--navy)',fontFamily:'var(--fm)'}}>{t[`${s}_count`]}</div>
                          <div style={{fontSize:'10.5px',fontWeight:700,color:sectionColors[s]}}>{t[`weight_${s}`]}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>}
            </div>
          )}

          {/* Routing for other sections */}
          {activeSection==='users'&&<div style={{textAlign:'center',padding:'40px'}}><h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>User Management</h3><a href="/admin/users" style={{padding:'11px 26px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,fontFamily:'var(--fb)',textDecoration:'none',display:'inline-block'}}>Open User Management →</a></div>}
          {activeSection==='organizations'&&<div style={{textAlign:'center',padding:'40px'}}><h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>Organizations</h3><a href="/admin/users" style={{padding:'11px 26px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,fontFamily:'var(--fb)',textDecoration:'none',display:'inline-block'}}>Manage in User Management →</a></div>}
          {activeSection==='evaluator'&&<div style={{textAlign:'center',padding:'40px'}}><h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>Grading Queue</h3><a href="/evaluator" style={{padding:'11px 26px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,fontFamily:'var(--fb)',textDecoration:'none',display:'inline-block'}}>Open Grading Queue →</a></div>}
          {activeSection==='reports'&&<div style={{textAlign:'center',padding:'40px'}}><h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>Reports & Analytics</h3><a href="/admin/reports" style={{padding:'11px 26px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,fontFamily:'var(--fb)',textDecoration:'none',display:'inline-block'}}>Open Reports →</a></div>}
          {activeSection==='invoices'&&<div style={{textAlign:'center',padding:'40px'}}><h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>Invoices</h3><p style={{fontSize:'13.5px',color:'var(--t3)',marginBottom:'18px'}}>Invoice management coming soon.</p><a href="/admin/reports" style={{padding:'11px 26px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,fontFamily:'var(--fb)',textDecoration:'none',display:'inline-block'}}>View Reports →</a></div>}
          {activeSection==='audit'&&<div style={{textAlign:'center',padding:'40px'}}><h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>Audit Logs</h3><a href="/admin/audit" style={{padding:'11px 26px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,fontFamily:'var(--fb)',textDecoration:'none',display:'inline-block'}}>Open Audit Logs →</a></div>}

        </div>
      </div>
    </div>
  )
}
