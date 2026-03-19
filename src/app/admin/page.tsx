'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import dynamic from 'next/dynamic'

// Lazy-loaded components for Phase 9-11 performance
const DashboardGrid = dynamic(() => import('./components/DashboardGrid'))
const QuestionBank = dynamic(() => import('./components/QuestionBank'))
const UsersList = dynamic(() => import('./components/UsersList'))
const OrganizationList = dynamic(() => import('./components/OrganizationList'))
const TemplatesList = dynamic(() => import('./components/TemplatesList'))
const ActiveExams = dynamic(() => import('./components/ActiveExams'))

// TMS Components
const QualificationTracker = dynamic(() => import('./components/tms/QualificationTracker'))
const ResourceManager = dynamic(() => import('./components/tms/ResourceManager'))

// LMS Components
const CourseLibrary = dynamic(() => import('./components/lms/CourseLibrary'))
const LessonPlayer = dynamic(() => import('./components/lms/LessonPlayer'))
const CategoryManager = dynamic(() => import('./components/lms/CategoryManager'))

// EBT Components
const EbtMatrix = dynamic(() => import('./components/ebt/EbtMatrix'))
const AssessmentForms = dynamic(() => import('./components/ebt/AssessmentForms'))

// CompBT Components
const AdaptiveLearning = dynamic(() => import('./components/compbt/AdaptiveLearning'))

// Audit Components
const AuditSystem = dynamic(() => import('./components/audit/AuditSystem'))

// AI Components
const ContentTransformer = dynamic(() => import('./components/ai/ContentTransformer'))
const QuestionGenerator = dynamic(() => import('./components/ai/QuestionGenerator'))

// Virtual & VR Components
const LiveClassroom = dynamic(() => import('./components/virtual/LiveClassroom'))
const Virtual360 = dynamic(() => import('./components/virtual/Virtual360'))

interface NavItem {
  id: string
  label: string
  icon: string
  disabled?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'e-Test (Sınav)',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'questions', label: 'Question Bank', icon: '📚' },
      { id: 'active_exams', label: 'Active Exams', icon: '📝' },
      { id: 'reports', label: 'Reports', icon: '📈' },
    ]
  },
  {
    label: 'Virtual & VR (Eğitim)',
    items: [
      { id: 'live_class', label: 'Live Classroom', icon: '📹' },
      { id: 'vr_360', label: '360° Walkthrough', icon: '🥽' },
    ]
  },
  {
    label: 'AI Content Engine (Zeka)',
    items: [
      { id: 'ai_transform', label: 'Manual Transformer', icon: '🤖' },
      { id: 'ai_gen', label: 'Question Gen', icon: '✍️' },
    ]
  },
  {
    label: 'TMS & EBT (Planlama)',
    items: [
      { id: 'tms_quals', label: 'Qualifications', icon: '📜' },
      { id: 'tms_resources', label: 'Resource Mgmt', icon: '🏢' },
      { id: 'ebt_matrix', label: 'EBT Matrix', icon: '🎯' },
      { id: 'ebt_forms', label: 'Assessment Forms', icon: '✍️' },
    ]
  },
  {
    label: 'LMS & CompBT (Eğitim)',
    items: [
      { id: 'lms_categories', label: 'Course Categories', icon: '🗂️' },
      { id: 'lms_library', label: 'Course Library', icon: '📚' },
      { id: 'lms_player', label: 'Lesson Player', icon: '🎥' },
      { id: 'compbt_adaptive', label: 'Adaptive Learning', icon: '🧠' },
      { id: 'evaluator', label: 'Grading Queue', icon: '✍️' },
    ]
  },
  {
    label: 'Sistem & Güvenlik',
    items: [
      { id: 'organizations', label: 'Organizations', icon: '🏢' },
      { id: 'users', label: 'Users & Candidates', icon: '👥' },
      { id: 'audit', label: 'Audit Logs', icon: '📜' },
      { id: 'hr_analytics', label: 'HR Analytics', icon: '📊' },
    ]
  }
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

const DEFAULT_PREP = {
  grammar:   { seconds: 45, bullets: ['The grammar section includes multiple-choice questions.','Read each question carefully and select the best answer.','There are no penalties for wrong answers.','Your movements, screen activity, and eye activity are monitored.'] },
  reading:   { seconds: 45, bullets: ['The reading section includes texts followed by multiple-choice questions.','Each question has only one correct answer. Read the texts carefully.','There are no penalties for incorrect answers.','Your movements, screen activity, and eye activity are being monitored.'] },
  writing:   { seconds: 45, bullets: ['Write at least 40 words for each question. Do not copy or paste from any source.','If time runs out, the system will automatically save your response.','Your movements, eye activity, and screen are being monitored.'] },
  speaking:  { seconds: 45, bullets: ['You must speak for at least 30 seconds to meet the minimum requirement.','Do not use written texts, memorized speeches, ChatGPT, or any other AI tools.','When you are ready, press the record button to start.'] },
  listening: { seconds: 45, bullets: ['Each audio will be played once only.','There are no penalties for wrong answers, so try to answer every question.','When you are ready, press the Play button to begin listening.'] },
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({ users: 0, questions: 0, exams: 0, orgs: 0 })
  const [urgentTasks, setUrgentTasks] = useState<any[]>([])
  const [liveMonitor, setLiveMonitor] = useState<any>({ activeExams: 0, candidatesOnline: 0 })
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminId, setAdminId] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [showProfile, setShowProfile] = useState(false)

  // Constants for V3
  const sections = ['grammar','reading','writing','speaking','listening']
  const cefrLevels = ['A1','A2','B1','B2','C1','C2']
  const inp = (extra:any={}) => ({
    padding:'10px 14px', borderRadius:'10px', border:'1.5px solid var(--bdr)', 
    fontSize:'13.5px', fontWeight:600, color:'var(--navy)', outline:'none',
    background:'#fff', transition:'all 0.2s', fontFamily:'var(--fb)',
    ...extra
  })

  // Question bank
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
    competency_tag:'', aircraft_context:'', audio_url:'', image_url:'', active:true, role_tag:'general'
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

  // Users (Candidates) state
  const [userList, setUserList] = useState<any[]>([])
  const [uLoading, setULoading] = useState(false)
  const [uTotal, setUTotal] = useState(0)
  const [uPage, setUPage] = useState(0)
  const [uSearch, setUSearch] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [detailUser, setDetailUser] = useState<any>(null)
  const [editUser, setEditUser] = useState<any>(null)
  const [formUser, setFormUser] = useState({
    full_name:'', email:'', role:'candidate', org_id:'', phone:'', country:''
  })

  // Organizations (Companies) state
  const [orgList, setOrgList] = useState<any[]>([])
  const [oLoading, setOLoading] = useState(false)
  const [oTotal, setOTotal] = useState(0)
  const [oPage, setOPage] = useState(0)
  const [oSearch, setOSearch] = useState('')
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [orgStep, setOrgStep] = useState(1)
  const [detailOrg, setDetailOrg] = useState<any>(null)
  const [editOrg, setEditOrg] = useState<any>(null)
  const [formOrg, setFormOrg] = useState({
    name:'', domain:'', logo_url:'', contact_person:'', contact_email:'', contract_end_date:''
  })

  useEffect(() => { checkAuth(); loadStats(); loadTaxonomy() }, [])
  useEffect(() => { 
    if (activeSection === 'templates') loadTemplates() 
    if (activeSection === 'users') loadUsers()
    if (activeSection === 'organizations') loadOrgs()
  }, [activeSection])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const user = session.user
    
    // Use API route (service role) to bypass recursive RLS policy
    const res = await fetch('/api/get-role', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId: user.id })
    })
    const { role, full_name } = await res.json()

    if (!role || role !== 'super_admin') { router.push('/login'); return }
    
    setAdminId(user.id)
    setAdminName(full_name || 'Super Admin')
    setAdminEmail(user.email || 'admin@domain.com')
    setLoading(false)
  }

  async function loadStats() {
    const [u,e,q,o] = await Promise.all([
      supabase.from('users').select('id',{count:'exact',head:true}),
      supabase.from('exams').select('id',{count:'exact',head:true}),
      supabase.from('questions').select('id',{count:'exact',head:true}).eq('is_latest',true),
      supabase.from('organizations').select('id',{count:'exact',head:true}),
    ])
    setStats({ users: u.count || 0, questions: q.count || 0, exams: e.count || 0, orgs: o.count || 0 })

    // V3: Urgent Tasks (Action Center)
    const now = new Date().toISOString()
    const { data: expiredOrgs } = await supabase.from('organizations').select('id, name, contract_end_date').lt('contract_end_date', now).limit(5)
    // For pending evaluations, we check exam_answers for status=pending
    const { data: pendingGrading } = await supabase.from('exam_answers').select('id, exams!inner(candidate_id, role_profile)').eq('exams.status', 'grading').limit(5)
    
    const tasks: any[] = []
    if (expiredOrgs) {
      tasks.push(...expiredOrgs.map(org => ({ 
        type: 'contract', 
        label: `Contract Expired: ${org.name}`, 
        sub: `Ended on ${new Date(org.contract_end_date).toLocaleDateString()}`,
        id: org.id 
      })))
    }
    if (pendingGrading) {
      tasks.push(...pendingGrading.map((g: any) => ({ 
        type: 'grading', 
        label: `Evaluate: Candidate ${g.exams?.candidate_id?.slice(0,8)}`, 
        sub: `Role: ${g.exams?.role_profile?.replace('_',' ') || 'General'}`,
        id: g.id 
      })))
    }
    setUrgentTasks(tasks)

    // V3: Live Monitor
    const { count: activeExams } = await supabase.from('exams').select('id', { count: 'exact', head: true }).eq('status', 'in_progress')
    setLiveMonitor({ activeExams: activeExams || 0, candidatesOnline: Math.max(0, (activeExams || 0) + 2) /* Simulated online count */ })
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

  async function loadUsers(page = uPage, search = uSearch) {
    setULoading(true)
    let query = supabase.from('users').select('*, organizations(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * 20, (page + 1) * 20 - 1)
    
    if (search) query = query.ilike('full_name', `%${search}%`)
    
    const { data, count } = await query
    setUserList(data || [])
    setUTotal(count || 0)
    setULoading(false)
  }

  async function loadOrgs(page = oPage, search = oSearch) {
    setOLoading(true)
    let query = supabase.from('organizations').select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(page * 20, (page + 1) * 20 - 1)
    
    if (search) query = query.ilike('name', `%${search}%`)
    
    const { data, count } = await query
    setOrgList(data || [])
    setOTotal(count || 0)
    setOLoading(false)
  }

  // ── QUESTION QUERY ENGINE ──
  async function runQuery(page = qPage, overrides: any = {}) {
    console.log('DEBUG: runQuery triggered', { page, overrides })
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

    if (section !== 'all') query = query.eq('section', section)
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
      console.error('❌ Supabase Soru Çekme Hatası:', error)
      alert('Soru bankası yüklenirken bir hata oluştu: ' + error.message)
    }

    setQuestions(data||[])
    setQTotal(count||0)
    setQLoading(false)
    setFiltersPending(false)
  }

  function applyFilters() { 
    setSelectedQIds([])
    setQPage(0)
    runQuery(0) 
  }

  function toggleSelect(id: string) {
    setSelectedQIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  function toggleSelectAll() {
    if (selectedQIds.length === questions.length) setSelectedQIds([])
    else setSelectedQIds(questions.map(q=>q.id))
  }

  function startBulkDelete() {
    const items = questions.filter(q=>selectedQIds.includes(q.id))
    setDelItems(items)
    setDelInput('')
    setShowDelConfirm(true)
  }

  function startSingleDeleteTemplate(t: any) {
    setDelItems([{ ...t, _id:t.id, _type:'template', _display:t.name }])
    setDelInput('')
    setShowDelConfirm(true)
  }

  function startSingleDeleteUser(u: any) {
    setDelItems([{ ...u, _id:u.id, _type:'user', _display:u.full_name }])
    setDelInput('')
    setShowDelConfirm(true)
  }

  function startSingleDeleteOrg(o: any) {
    setDelItems([{ ...o, _id:o.id, _type:'org', _display:o.name }])
    setDelInput('')
    setShowDelConfirm(true)
  }

  async function finalDelete() {
    if (delItems.length > 5 && delInput !== 'DELETE') return
    setQLoading(true)
    const ids = delItems.map(i=>i._id || i.id) 
    const type = delItems[0]?._type || 'question'

    if (type === 'question') {
      const { data: used } = await supabase.from('exam_answers').select('question_id').in('question_id', ids)
      const usedIds = new Set(used?.map(u=>u.question_id) || [])
      const toSoftDelete = ids.filter(id => usedIds.has(id))
      const toHardDelete = ids.filter(id => !usedIds.has(id))
      if (toSoftDelete.length) await supabase.from('questions').update({ active:false }).in('id', toSoftDelete)
      if (toHardDelete.length) await supabase.from('questions').delete().in('id', toHardDelete)
      runQuery(qPage)
    } else if (type === 'user') {
      await supabase.from('users').delete().in('id', ids)
      loadUsers()
    } else if (type === 'org') {
      await supabase.from('organizations').delete().in('id', ids)
      loadOrgs()
    } else if (type === 'template') {
      await supabase.from('exam_templates').delete().in('id', ids)
      loadTemplates()
    }

    setShowDelConfirm(false)
    setDelItems([])
    setDelInput('')
    setQLoading(false)
    loadStats()
  }

  async function saveUser() {
    if (!formUser.full_name || !formUser.email) return
    setSaving(true)
    let res
    if (editUser) {
      res = await supabase.from('users').update(formUser).eq('id', editUser.id)
    } else {
      res = await supabase.from('users').insert([formUser])
    }
    if (res.error) alert(res.error.message)
    else {
      setShowUserForm(false)
      setEditUser(null)
      loadUsers()
      loadStats()
    }
    setSaving(false)
  }

  async function saveOrg() {
    if (!formOrg.name) return
    setSaving(true)
    let res
    if (editOrg) {
      res = await supabase.from('organizations').update(formOrg).eq('id', editOrg.id)
    } else {
      res = await supabase.from('organizations').insert([formOrg])
    }
    if (res.error) alert(res.error.message)
    else {
      setShowOrgForm(false)
      setEditOrg(null)
      loadOrgs()
      loadStats()
    }
    setSaving(false)
  }

  function startEditUser(u: any) {
    setEditUser(u)
    setFormUser({ full_name: u.full_name, email: u.email, role: u.role, org_id: u.org_id, phone: u.phone||'', country: u.country||'' })
    setShowUserForm(true)
    setDetailUser(null)
  }

  function startEditOrg(o: any) {
    setEditOrg(o)
    setFormOrg({ name: o.name, domain: o.domain||'', logo_url: o.logo_url||'', contact_person: o.contact_person||'', contact_email: o.contact_email||'', contract_end_date: o.contract_end_date||'' })
    setShowOrgForm(true)
    setDetailOrg(null)
  }

  function resetForm() {
    setEditQ(null); setQStep(1); setFormQ({ section:'grammar', type:'multiple_choice', content:'', correct_answer:'', cefr_level:'B1', difficulty:'medium', competency_tag:'', aircraft_context:'', audio_url:'', image_url:'', active:true, role_tag:'general' });         setOptions([{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false}]); setSelectedDepts([]); setSelectedSubRoles([]); setSelectedUseCases([]);
    setEditTemplate(null); setNewTemplate({ name:'', role_profile:'general', grammar_count:15, reading_count:5, writing_count:3, speaking_count:4, listening_count:8, weight_grammar:10, weight_reading:20, weight_writing:20, weight_speaking:40, weight_listening:10, time_limit_mins:90, writing_timer_mins:3.5, speaking_attempts:3, listening_single_play:true, passing_cefr:'B2', proctoring_enabled:true, attempts_allowed:1, org_id:null });
    setEditUser(null); setFormUser({ full_name:'', email:'', role:'candidate', org_id:'', phone:'', country:'' });
    setEditOrg(null); setFormOrg({ name:'', domain:'', logo_url:'', contact_person:'', contact_email:'', contract_end_date:'' });
  }

  function startSingleDelete(q: any) {
    setDelItems([q])
    setDelInput('')
    setShowDelConfirm(true)
  }

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


  async function toggleActive(id: string, current: boolean) {
    await supabase.from('questions').update({ active: !current }).eq('id', id)
    runQuery(qPage)
  }

  function startEdit(q: any) {
    setEditQ(q)
    setFormQ({ section:q.section, type:q.type, content:q.content, correct_answer:q.correct_answer||'', cefr_level:q.cefr_level||'B1', difficulty:q.difficulty||'medium', competency_tag:q.competency_tag||'', aircraft_context:q.aircraft_context||'', audio_url:q.audio_url||'', image_url:q.image_url||'', active:q.active, role_tag:q.role_tag||'general' })
    setOptions([{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false},{text:'',is_correct:false}])
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
    const payload = { name:newTemplate.name, role_profile:newTemplate.role_profile, grammar_count:newTemplate.grammar_count, reading_count:newTemplate.reading_count, writing_count:newTemplate.writing_count, speaking_count:newTemplate.speaking_count, listening_count:newTemplate.listening_count, weight_grammar:newTemplate.weight_grammar, weight_reading:newTemplate.weight_reading, weight_writing:newTemplate.weight_writing, weight_speaking:newTemplate.weight_speaking, weight_listening:newTemplate.weight_listening, time_limit_mins:newTemplate.time_limit_mins, writing_timer_mins:newTemplate.writing_timer_mins, speaking_attempts:newTemplate.speaking_attempts, listening_single_play:newTemplate.listening_single_play, passing_cefr:newTemplate.passing_cefr, proctoring_enabled:newTemplate.proctoring_enabled, attempts_allowed:newTemplate.attempts_allowed, prep_grammar:(newTemplate as any).prep_grammar, prep_reading:(newTemplate as any).prep_reading, prep_writing:(newTemplate as any).prep_writing, prep_speaking:(newTemplate as any).prep_speaking, prep_listening:(newTemplate as any).prep_listening }
    if (editTemplate) { const {error}=await supabase.from('exam_templates').update(payload).eq('id',editTemplate.id); if(error){alert('Error: '+error.message);setSavingTemplate(false);return} }
    else { const {error}=await supabase.from('exam_templates').insert(payload); if(error){alert('Error: '+error.message);setSavingTemplate(false);return} }
    setSavingTemplate(false); setShowTemplateForm(false); setEditTemplate(null)
    setNewTemplate({name:'',role_profile:'general',grammar_count:15,reading_count:5,writing_count:3,speaking_count:4,listening_count:8,weight_grammar:10,weight_reading:20,weight_writing:20,weight_speaking:40,weight_listening:10,time_limit_mins:90,writing_timer_mins:3.5,speaking_attempts:3,listening_single_play:true,passing_cefr:'B2',proctoring_enabled:true,attempts_allowed:1,org_id:null,prep_grammar:DEFAULT_PREP.grammar,prep_reading:DEFAULT_PREP.reading,prep_writing:DEFAULT_PREP.writing,prep_speaking:DEFAULT_PREP.speaking,prep_listening:DEFAULT_PREP.listening} as any)
    loadTemplates()
  }

  async function deleteTemplate(id: string) { if(!confirm('Delete?'))return; await supabase.from('exam_templates').delete().eq('id',id); loadTemplates() }
  async function duplicateTemplate(t: any) { const {name,...rest}=t; await supabase.from('exam_templates').insert({...rest,name:name+' (Copy)'}); loadTemplates() }

  function startEditTemplate(t: any) { setEditTemplate(t); setNewTemplate({name:t.name,role_profile:t.role_profile,grammar_count:t.grammar_count,reading_count:t.reading_count,writing_count:t.writing_count,speaking_count:t.speaking_count,listening_count:t.listening_count,weight_grammar:t.weight_grammar,weight_reading:t.weight_reading,weight_writing:t.weight_writing,weight_speaking:t.weight_speaking,weight_listening:t.weight_listening,time_limit_mins:t.time_limit_mins,writing_timer_mins:t.writing_timer_mins||3.5,speaking_attempts:t.speaking_attempts||3,listening_single_play:t.listening_single_play!==false,passing_cefr:t.passing_cefr,proctoring_enabled:t.proctoring_enabled!==false,attempts_allowed:t.attempts_allowed||1,org_id:t.org_id||null,prep_grammar:t.prep_grammar||DEFAULT_PREP.grammar,prep_reading:t.prep_reading||DEFAULT_PREP.reading,prep_writing:t.prep_writing||DEFAULT_PREP.writing,prep_speaking:t.prep_speaking||DEFAULT_PREP.speaking,prep_listening:t.prep_listening||DEFAULT_PREP.listening} as any); setShowTemplateForm(true) }

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/login') }

  if (loading) return <div style={{minHeight:'100vh',background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'#fff'}}>Loading...</div></div>

  const totalPages = Math.ceil(qTotal / qPageSize)
  const filteredSubRoles = selectedDepts.length ? subRoles.filter(s=>selectedDepts.includes(s.department_id)) : subRoles

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',fontFamily:'var(--fb)',background:'var(--off)'}}>

      {/* ── STICKY HEADER ── */}
      <header style={{height:'64px',background:'#fff',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',position:'sticky',top:0,zIndex:1000,backdropFilter:'blur(10px)',backgroundColor:'rgba(255,255,255,0.92)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'32px'}}>
          <div style={{fontFamily:'var(--fm)',fontSize:'20px',fontWeight:900,color:'var(--navy)',letterSpacing:'-0.5px'}}>Avil<span style={{color:'var(--sky)'}}>ingo</span> <span style={{fontSize:'11px',fontWeight:700,color:'var(--t3)',marginLeft:'4px',opacity:0.6}}>ADMIN</span></div>
          <div style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'13px',fontWeight:700,color:'var(--navy)',opacity:0.75}}>
            <span style={{fontSize:'14px'}}>📍</span> {activeSection==='questions'?'Question Bank':activeSection.charAt(0).toUpperCase()+activeSection.slice(1)}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'4px 10px',borderRadius:'20px',background:'#ECFDF5',border:'1px solid #A7F3D0'}}>
            <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'#10B981',display:'inline-block',boxShadow:'0 0 0 2px rgba(16,185,129,0.3)',animation:'pulse 2s infinite'}}></span>
            <span style={{fontSize:'11px',fontWeight:700,color:'#059669'}}>Live</span>
          </div>
          <div style={{position:'relative'}}>
            <button onClick={()=>setShowProfile(p=>!p)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'5px 10px 5px 5px',borderRadius:'24px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',transition:'all 0.2s'}}>
              <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'linear-gradient(135deg,var(--sky) 0%,var(--navy) 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:800,color:'#fff'}}>{adminName.charAt(0)}</div>
              <div style={{textAlign:'left'}}>
                <div style={{fontSize:'12px',fontWeight:800,color:'var(--navy)',lineHeight:1.2}}>{adminName}</div>
                <div style={{fontSize:'10px',fontWeight:600,color:'var(--t3)'}}>Super Admin</div>
              </div>
            </button>
            {showProfile && (
              <>
                <div onClick={()=>setShowProfile(false)} style={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:1001}} />
                <div style={{position:'absolute',top:'calc(100% + 10px)',right:0,width:'210px',background:'#fff',borderRadius:'12px',boxShadow:'0 10px 25px -5px rgba(0,0,0,0.15)',border:'1px solid var(--bdr)',padding:'8px',zIndex:1002}}>
                  <div style={{padding:'8px 12px',borderBottom:'1px solid var(--bdr)',marginBottom:'6px'}}>
                    <div style={{fontSize:'12px',fontWeight:800,color:'var(--navy)'}}>{adminName}</div>
                    <div style={{fontSize:'11px',color:'var(--t3)',wordBreak:'break-all'}}>{adminEmail}</div>
                  </div>
                  <button onClick={()=>{}} style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',padding:'10px',borderRadius:'8px',border:'none',background:'transparent',fontSize:'12.5px',fontWeight:600,color:'var(--t2)',cursor:'pointer',textAlign:'left',fontFamily:'var(--fb)'}}>👤 Profile Settings</button>
                  <button onClick={handleSignOut} style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',padding:'10px',borderRadius:'8px',border:'none',background:'transparent',fontSize:'12.5px',fontWeight:600,color:'#ef4444',cursor:'pointer',textAlign:'left',fontFamily:'var(--fb)'}}>🔓 Sign Out</button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {/* Sidebar */}
        <div style={{width:'210px',background:'var(--navy)',display:'flex',flexDirection:'column',flexShrink:0,borderRight:'1px solid rgba(255,255,255,0.05)'}}>
          <nav style={{padding:'20px 8px',flex:1,overflowY:'auto'}}>
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} style={{marginBottom:'20px'}}>
                <div style={{fontSize:'10px',fontWeight:800,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'1px',padding:'0 14px 8px 14px'}}>{group.label}</div>
                {group.items.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => {
                      if (item.disabled) return
                      if (item.id === 'hr_analytics') return router.push('/hr/analytics')
                      setActiveSection(item.id)
                    }}
                    disabled={item.disabled}
                    style={{
                      display:'flex',alignItems:'center',gap:'10px',width:'100%',textAlign:'left',
                      padding:'10px 14px',marginBottom:'2px',borderRadius:'8px',border:'none',
                      cursor:item.disabled ? 'not-allowed' : 'pointer',fontSize:'13px',fontWeight:600,
                      background:activeSection===item.id?'rgba(255,255,255,0.08)':'transparent',
                      color:activeSection===item.id?'#fff':(item.disabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)'),
                      transition:'all 0.2s',fontFamily:'var(--fb)',opacity:item.disabled ? 0.6 : 1
                    }}
                  >
                    <span style={{fontSize:'16px',opacity:activeSection===item.id?1:0.6}}>{item.icon}</span>
                    {item.label}
                    {item.disabled && <span style={{fontSize:'8px',background:'rgba(255,255,255,0.1)',padding:'2px 4px',borderRadius:'4px',marginLeft:'auto'}}>SOON</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div style={{padding:'16px',borderTop:'1px solid rgba(255,255,255,0.05)',textAlign:'center'}}>
            <div style={{fontSize:'10px',fontWeight:800,color:'rgba(255,255,255,0.2)',letterSpacing:'1px',textTransform:'uppercase'}}>v3.1.0</div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{flex:1,background:'var(--off)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'20px 24px',flex:1,overflowY:'auto'}}>

          {/* ── DYNAMIC SECTIONS ── */}
          {activeSection === 'dashboard' && (
            <DashboardGrid 
              liveMonitor={liveMonitor} 
              stats={stats} 
              urgentTasks={urgentTasks} 
              setActiveSection={setActiveSection} 
              setShowAI={setShowAI}
              ROLE_PROFILES={ROLE_PROFILES}
              sectionColors={sectionColors}
            />
          )}

          {activeSection === 'tms_quals' && <QualificationTracker />}
          {activeSection === 'tms_resources' && <ResourceManager />}

          {activeSection === 'lms_library' && <CourseLibrary />}
          {activeSection === 'lms_player' && <LessonPlayer />}
          {activeSection === 'lms_categories' && <CategoryManager />}

          {activeSection === 'compbt_adaptive' && <AdaptiveLearning />}
          {activeSection === 'audit' && <AuditSystem />}
          
          {activeSection === 'ai_transform' && <ContentTransformer />}
          {activeSection === 'ai_gen' && <QuestionGenerator />}

          {activeSection === 'live_class' && <LiveClassroom />}
          {activeSection === 'vr_360' && <Virtual360 />}

          {activeSection === 'questions' && (
            <QuestionBank 
              questions={questions} qLoading={qLoading} qLoadedOnce={qLoadedOnce} qTotal={qTotal}
              qPage={qPage} qPageSize={qPageSize} selectedQIds={selectedQIds}
              qSearch={qSearch} qSection={qSection} qCefr={qCefr} qDifficulty={qDifficulty} qStatus={qStatus}
              qTag={qTag} qSort={qSort} qRole={qRole} filtersPending={filtersPending}
              showAI={showAI} showBulk={showBulk} aiQueue={aiQueue} aiProcessing={aiProcessing} aiProgress={aiProgress}
              bulkText={bulkText} bulkParsed={bulkParsed} bulkStatus={bulkStatus} bulkLoading={bulkLoading}
              bulkSection={bulkSection} bulkCefr={bulkCefr} bulkDifficulty={bulkDifficulty}
              setQSearch={setQSearch} setQSection={setQSection} setQCefr={setQCefr} setQDifficulty={setQDifficulty}
              setQStatus={setQStatus} setQTag={setQTag} setQSort={setQSort} setQRole={setQRole}
              setQPage={setQPage} setQPageSize={setQPageSize} setFiltersPending={setFiltersPending}
              setShowAI={setShowAI} setShowBulk={setShowBulk} setShowForm={setShowForm}
              setSelectedQIds={setSelectedQIds} setAiQueue={setAiQueue} setAiProgress={setAiProgress}
              setBulkText={setBulkText} setBulkParsed={setBulkParsed} setBulkStatus={setBulkStatus}
              setBulkLoading={setBulkLoading} setBulkSection={setBulkSection} setBulkCefr={setBulkCefr}
              setBulkDifficulty={setBulkDifficulty} applyFilters={applyFilters} runQuery={runQuery}
              toggleSelect={toggleSelect} toggleSelectAll={toggleSelectAll} toggleActive={toggleActive}
              startSingleDelete={startSingleDelete} startBulkDelete={startBulkDelete} startEdit={startEdit}
              resetForm={resetForm} exportQuestions={exportQuestions} loadAIFile={loadAIFile}
              runAITagging={runAITagging} approveAll={approveAll} handleFileUpload={handleFileUpload}
              parseText={parseText} confirmBulkUpload={confirmBulkUpload} setDetailQ={setDetailQ}
            />
          )}

          {activeSection === 'templates' && (
            <TemplatesList 
              templates={templates} tLoading={tLoading} sections={sections}
              sectionColors={sectionColors} cefrLevels={cefrLevels}
              setShowTemplateForm={setShowTemplateForm} duplicateTemplate={duplicateTemplate}
              startSingleDeleteTemplate={startSingleDeleteTemplate}
            />
          )}
          {activeSection === 'active_exams' && <ActiveExams adminId={adminId} />}

          {activeSection === 'users' && (
            <UsersList 
              userList={userList} uLoading={uLoading} uSearch={uSearch}
              setUSearch={setUSearch} loadUsers={loadUsers} setEditUser={setEditUser}
              setFormUser={setFormUser} setShowUserForm={setShowUserForm} setDetailUser={setDetailUser}
            />
          )}

          {activeSection === 'organizations' && (
            <OrganizationList 
              orgList={orgList} oLoading={oLoading} setEditOrg={setEditOrg}
              setFormOrg={setFormOrg} setShowOrgForm={setShowOrgForm} setDetailOrg={setDetailOrg}
              setOrgStep={setOrgStep} startEditOrg={startEditOrg} startSingleDeleteOrg={startSingleDeleteOrg}
            />
          )}
          {activeSection==='evaluator'&&<div style={{textAlign:'center',padding:'40px'}}><h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>Grading Queue</h3><a href="/evaluator" style={{padding:'11px 26px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,fontFamily:'var(--fb)',textDecoration:'none',display:'inline-block'}}>Open Grading Queue →</a></div>}
          {activeSection==='reports'&&<div style={{textAlign:'center',padding:'40px'}}><h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>Reports & Analytics</h3><a href="/admin/reports" style={{padding:'11px 26px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,fontFamily:'var(--fb)',textDecoration:'none',display:'inline-block'}}>Open Reports →</a></div>}
          {activeSection==='invoices'&&<div style={{textAlign:'center',padding:'40px'}}><h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>Invoices</h3><p style={{fontSize:'13.5px',color:'var(--t3)',marginBottom:'18px'}}>Invoice management coming soon.</p><a href="/admin/reports" style={{padding:'11px 26px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,fontFamily:'var(--fb)',textDecoration:'none',display:'inline-block'}}>View Reports →</a></div>}
          {activeSection==='audit'&&<div style={{textAlign:'center',padding:'40px'}}><h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'12px'}}>Audit Logs</h3><a href="/admin/audit" style={{padding:'11px 26px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,fontFamily:'var(--fb)',textDecoration:'none',display:'inline-block'}}>Open Audit Logs →</a></div>}

        </div>
      </div>

      {showDelConfirm && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
          <div style={{background:'#fff',borderRadius:'16px',width:'440px',padding:'24px',boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)'}}>
            <div style={{fontSize:'32px',marginBottom:'16px'}}>⚠️</div>
            <h3 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',marginBottom:'8px'}}>
              {delItems.length === 1 
                ? `Delete ${((delItems[0] as any)._type || 'question').charAt(0).toUpperCase() + ((delItems[0] as any)._type || 'question').slice(1)}?` 
                : `Delete ${delItems.length} Items?`}
            </h3>
            <p style={{fontSize:'14px',color:'var(--t3)',lineHeight:1.5,marginBottom:'20px'}}>
              {delItems.length === 1 
                ? `Are you sure you want to remove "${(delItems[0] as any)._display || 'this item'}"? This action cannot be undone.`
                : `You are about to delete ${delItems.length} items. This action is permanent and may affect related data.`}
            </p>
            
            {delItems.length > 5 && (
              <div style={{marginBottom:'20px',padding:'12px',background:'#FFFBEB',borderRadius:'8px',border:'1.5px solid #FEF3C7'}}>
                <label style={{fontSize:'12px',fontWeight:700,color:'#92400E',display:'block',marginBottom:'6px'}}>Type "DELETE" to confirm bulk action</label>
                <input value={delInput} onChange={e=>setDelInput(e.target.value.toUpperCase())} placeholder="DELETE" style={{width:'100%',padding:'9px 12px',borderRadius:'6px',border:'1.5px solid #FCD34D',fontSize:'13px',fontWeight:700,fontFamily:'var(--fb)',outline:'none'}} />
              </div>
            )}

            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setShowDelConfirm(false)} style={{flex:1,padding:'10px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'13.5px',fontWeight:600,color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fb)'}}>Cancel</button>
              <button onClick={finalDelete} disabled={delItems.length > 5 && delInput !== 'DELETE'} style={{flex:1,padding:'10px',borderRadius:'8px',border:'none',background:'#DC2626',color:'#fff',fontSize:'13.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)',opacity:(delItems.length > 5 && delInput !== 'DELETE') ? 0.5 : 1}}>
                {delItems.length === 1 ? 'Delete' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Sidebar Drawer (Questions / Templates) */}
      {(showForm || detailQ || showTemplateForm || showUserForm || detailUser || showOrgForm || detailOrg) && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => { setShowForm(false); setDetailQ(null); setShowTemplateForm(false); setEditTemplate(null); setShowUserForm(false); setDetailUser(null); setShowOrgForm(false); setDetailOrg(null); resetForm(); }}
            style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(12,31,63,0.4)',backdropFilter:'blur(4px)',zIndex:1100}} 
          />
          
          {/* Drawer Panel */}
          <div style={{
            position:'fixed',top:0,right:0,width:'640px',height:'100%',background:'#fff',zIndex:1101,
            boxShadow:'-10px 0 50px rgba(0,0,0,0.15)',display:'flex',flexDirection:'column',
            animation: 'drawerSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily:'var(--fb)'
          }}>
            {/* Drawer Header */}
            <div style={{padding:'24px',borderBottom:'1px solid var(--bdr)',background:'var(--off)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',margin:0}}>
                  {showTemplateForm ? (editTemplate ? 'Edit Exam Template' : 'New Exam Template') : 
                   showUserForm ? (editUser ? 'Edit User Profile' : 'New User Registration') :
                   showOrgForm ? (editOrg ? 'Edit Organization' : 'Add New Organization') :
                   detailUser ? 'User Details' :
                   detailOrg ? 'Organization Profile' :
                   showForm ? (editQ ? `Edit Question V${editQ.version_number}` : 'New Question') : 'Spotlight Details'}
                </h3>
                {detailQ && <div style={{fontSize:'11px',color:'var(--t3)',marginTop:'4px'}}>ID: {detailQ.id.slice(0,8)}</div>}
                {detailUser && <div style={{fontSize:'11px',color:'var(--t3)',marginTop:'4px'}}>Registered: {new Date(detailUser.created_at).toLocaleDateString()}</div>}
              </div>
              <button onClick={() => { setShowForm(false); setDetailQ(null); setShowTemplateForm(false); setEditTemplate(null); setShowUserForm(false); setDetailUser(null); setShowOrgForm(false); setDetailOrg(null); resetForm(); }} style={{background:'none',border:'none',fontSize:'24px',cursor:'pointer',color:'var(--t3)',display:'flex',alignItems:'center',justifyContent:'center',width:'32px',height:'32px',borderRadius:'50%'}}>✕</button>
            </div>

            {/* Drawer Content */}
            <div style={{flex:1,overflowY:'auto',padding:'24px'}}>
              {showTemplateForm ? (
                /* ── TEMPLATE FORM ── */
                <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                  <div>
                    <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Template Name *</label>
                    <input value={newTemplate.name} onChange={e=>setNewTemplate({...newTemplate,name:e.target.value})} placeholder="e.g. ICAO Cabin Crew Recruitment" style={inp({width:'100%'})} />
                  </div>
                  
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                    <div>
                      <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Role Profile</label>
                      <select value={newTemplate.role_profile} onChange={e=>setNewTemplate({...newTemplate,role_profile:e.target.value})} style={inp({width:'100%'})}>
                        {['general','flight_deck','cabin_crew','atc','maintenance','ground_staff'].map(r=><option key={r} value={r}>{r.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Passing CEFR</label>
                      <select value={newTemplate.passing_cefr} onChange={e=>setNewTemplate({...newTemplate,passing_cefr:e.target.value})} style={inp({width:'100%'})}>{cefrLevels.map(l=><option key={l} value={l}>{l}</option>)}</select>
                    </div>
                  </div>

                  <div style={{background:'var(--off)',borderRadius:'12px',padding:'16px',border:'1.5px solid var(--bdr)'}}>
                    <div style={{fontSize:'11px',fontWeight:700,color:'var(--navy)',textTransform:'uppercase',marginBottom:'12px'}}>Section Counts & Weights</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px',marginBottom:'12px'}}>
                      {sections.map(s=>(
                        <div key={s} style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                          <div style={{fontSize:'9px',fontWeight:800,textAlign:'center',color:sectionColors[s],textTransform:'uppercase'}}>{s.slice(0,4)}</div>
                          <input type="number" value={(newTemplate as any)[`${s}_count`]} onChange={e=>setNewTemplate({...newTemplate,[`${s}_count`]:+e.target.value})} style={{...inp({padding:'6px',textAlign:'center',fontSize:'13px',fontWeight:700})}} />
                          <input type="number" value={(newTemplate as any)[`weight_${s}`]} onChange={e=>setNewTemplate({...newTemplate,[`weight_${s}`]:+e.target.value})} style={{...inp({padding:'6px',textAlign:'center',fontSize:'11px',fontWeight:600,color:sectionColors[s]})}} />
                        </div>
                      ))}
                    </div>
                    <div style={{textAlign:'right',fontSize:'11px',fontWeight:700,color:Math.abs((newTemplate.weight_grammar+newTemplate.weight_reading+newTemplate.weight_writing+newTemplate.weight_speaking+newTemplate.weight_listening)-100)<0.1?'#22c55e':'#ef4444'}}>
                      Total Weight: {newTemplate.weight_grammar+newTemplate.weight_reading+newTemplate.weight_writing+newTemplate.weight_speaking+newTemplate.weight_listening}% {Math.abs((newTemplate.weight_grammar+newTemplate.weight_reading+newTemplate.weight_writing+newTemplate.weight_listening)-100)<0.1?'✓':'(must = 100%)'}
                    </div>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
                    <div><label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Dur. (min)</label><input type="number" value={newTemplate.time_limit_mins} onChange={e=>setNewTemplate({...newTemplate,time_limit_mins:+e.target.value})} style={inp({width:'100%'})} /></div>
                    <div><label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Writing min/q</label><input type="number" value={newTemplate.writing_timer_mins} onChange={e=>setNewTemplate({...newTemplate,writing_timer_mins:+e.target.value})} step={0.5} style={inp({width:'100%'})} /></div>
                    <div><label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Spk Attempts</label><input type="number" value={newTemplate.speaking_attempts} onChange={e=>setNewTemplate({...newTemplate,speaking_attempts:+e.target.value})} style={inp({width:'100%'})} /></div>
                  </div>

                  <div style={{display:'flex',gap:'18px'}}>
                    <label style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12.5px',cursor:'pointer',fontWeight:600,color:'var(--t2)'}}><input type="checkbox" checked={newTemplate.listening_single_play} onChange={e=>setNewTemplate({...newTemplate,listening_single_play:e.target.checked})} /> Single-play audio</label>
                    <label style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12.5px',cursor:'pointer',fontWeight:600,color:'var(--t2)'}}><input type="checkbox" checked={newTemplate.proctoring_enabled} onChange={e=>setNewTemplate({...newTemplate,proctoring_enabled:e.target.checked})} /> WebRTC Proctoring</label>
                  </div>

                  <div style={{borderTop:'1px solid var(--bdr)',paddingTop:'20px',paddingBottom:'40px'}}>
                    <div style={{fontSize:'11px',fontWeight:700,color:'var(--navy)',textTransform:'uppercase',marginBottom:'12px'}}>Prep Screen Instructions</div>
                    {sections.map(sec => {
                      const prepKey = ('prep_' + sec) as any
                      const prep = (newTemplate as any)[prepKey] || { seconds: 45, bullets: [] }
                      return (
                        <div key={sec} style={{marginBottom:'12px',background:'var(--off)',padding:'12px',borderRadius:'10px',border:'1px solid var(--bdr)'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                            <span style={{fontSize:'11px',fontWeight:800,color:sectionColors[sec],textTransform:'uppercase'}}>{sec}</span>
                            <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                              <span style={{fontSize:'11px',fontWeight:600,color:'var(--t3)'}}>Sec:</span>
                              <input type="number" value={prep.seconds} onChange={e => setNewTemplate({...newTemplate, [prepKey]: {...prep, seconds: +e.target.value}} as any)} style={{width:'50px',textAlign:'center',padding:'3px',fontSize:'12px',fontWeight:700,borderRadius:'4px',border:'1px solid var(--bdr)'}} />
                            </div>
                          </div>
                          <textarea 
                            value={prep.bullets.join('\n')}
                            onChange={e => setNewTemplate({...newTemplate, [prepKey]: {...prep, bullets: e.target.value.split('\n').filter((l: string) => l.trim())}} as any)}
                            placeholder="Instruction bullets (one per line)..."
                            rows={3} 
                            style={{width:'100%',padding:'8px',borderRadius:'6px',border:'1px solid var(--bdr)',fontSize:'12.5px',resize:'vertical',outline:'none',fontFamily:'var(--fb)'}} 
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : showUserForm ? (
                /* ── USER FORM ── */
                <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                  <div>
                    <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Full Name *</label>
                    <input value={formUser.full_name} onChange={e=>setFormUser({...formUser,full_name:e.target.value})} placeholder="e.g. John Doe" style={inp({width:'100%'})} />
                  </div>
                  <div>
                    <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Email Address *</label>
                    <input value={formUser.email} onChange={e=>setFormUser({...formUser,email:e.target.value})} placeholder="john@example.com" style={inp({width:'100%'})} />
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                    <div>
                      <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Role</label>
                      <select value={formUser.role} onChange={e=>setFormUser({...formUser,role:e.target.value})} style={inp({width:'100%'})}>
                        {['candidate','evaluator','super_admin'].map(r=><option key={r} value={r}>{r.replace('_',' ').toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Organization</label>
                      <select value={formUser.org_id} onChange={e=>setFormUser({...formUser,org_id:e.target.value})} style={inp({width:'100%'})}>
                        <option value="">No Organization</option>
                        {orgList.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                    <div><label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Phone</label><input value={formUser.phone} onChange={e=>setFormUser({...formUser,phone:e.target.value})} placeholder="+1..." style={inp({width:'100%'})} /></div>
                    <div><label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Country</label><input value={formUser.country} onChange={e=>setFormUser({...formUser,country:e.target.value})} placeholder="e.g. United Kingdom" style={inp({width:'100%'})} /></div>
                  </div>
                </div>
              ) : showOrgForm ? (
                /* ── ORGANIZATION FORM (WIZARD) ── */
                <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                  <div style={{display:'flex',gap:'4px',marginBottom:'12px'}}>
                    {[1,2].map(s=>(
                      <div key={s} style={{flex:1,height:'4px',borderRadius:'2px',background:orgStep>=s?'var(--navy)':'var(--bdr)'}} />
                    ))}
                  </div>
                  
                  {orgStep === 1 ? (
                    <div style={{display:'flex',flexDirection:'column',gap:'20px',animation:'drawerSlideIn 0.3s ease-out'}}>
                      <div style={{fontSize:'12px',fontWeight:800,color:'var(--navy)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Step 1: Business Profile</div>
                      <div>
                        <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Company Name *</label>
                        <input value={formOrg.name} onChange={e=>setFormOrg({...formOrg,name:e.target.value})} placeholder="e.g. Global Airways" style={inp({width:'100%'})} />
                      </div>
                      <div>
                        <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Domain</label>
                        <input value={formOrg.domain} onChange={e=>setFormOrg({...formOrg,domain:e.target.value})} placeholder="globalair.com" style={inp({width:'100%'})} />
                      </div>
                      <div>
                        <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Logo URL</label>
                        <input value={formOrg.logo_url} onChange={e=>setFormOrg({...formOrg,logo_url:e.target.value})} placeholder="https://..." style={inp({width:'100%'})} />
                      </div>
                    </div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:'20px',animation:'drawerSlideIn 0.3s ease-out'}}>
                      <div style={{fontSize:'12px',fontWeight:800,color:'var(--navy)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Step 2: Contact & Contract</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                        <div><label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Contact Person</label><input value={formOrg.contact_person} onChange={e=>setFormOrg({...formOrg,contact_person:e.target.value})} placeholder="Jane Smith" style={inp({width:'100%'})} /></div>
                        <div><label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Contact Email</label><input value={formOrg.contact_email} onChange={e=>setFormOrg({...formOrg,contact_email:e.target.value})} placeholder="jane@globalair.com" style={inp({width:'100%'})} /></div>
                      </div>
                      <div>
                        <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Contract End Date</label>
                        <input type="date" value={formOrg.contract_end_date} onChange={e=>setFormOrg({...formOrg,contract_end_date:e.target.value})} style={inp({width:'100%'})} />
                      </div>
                    </div>
                  )}
                </div>
              ) : detailUser ? (
                /* ── USER DETAILS ── */
                <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                    <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'var(--navy)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',fontWeight:800}}>{detailUser.full_name?.charAt(0)}</div>
                    <div>
                      <h4 style={{margin:0,fontSize:'18px',fontWeight:800,color:'var(--navy)'}}>{detailUser.full_name}</h4>
                      <div style={{fontSize:'12px',color:'var(--t3)'}}>{detailUser.email}</div>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                    <div style={{padding:'12px',borderRadius:'10px',background:'var(--off)',border:'1px solid var(--bdr)'}}>
                      <div style={{fontSize:'10px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',marginBottom:'4px'}}>Role</div>
                      <div style={{fontSize:'13px',fontWeight:700,color:'var(--navy)'}}>{detailUser.role?.toUpperCase()}</div>
                    </div>
                    <div style={{padding:'12px',borderRadius:'10px',background:'var(--off)',border:'1px solid var(--bdr)'}}>
                      <div style={{fontSize:'10px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',marginBottom:'4px'}}>Organization</div>
                      <div style={{fontSize:'13px',fontWeight:700,color:'var(--navy)'}}>{orgList.find(o=>o.id===detailUser.org_id)?.name || 'Individual'}</div>
                    </div>
                  </div>
                </div>
              ) : detailOrg ? (
                /* ── ORGANIZATION DETAILS ── */
                <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                    <div style={{width:'64px',height:'64px',borderRadius:'12px',background:'var(--off)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',border:'1px solid var(--bdr)'}}>
                      {detailOrg.logo_url ? <img src={detailOrg.logo_url} style={{maxWidth:'100%',borderRadius:'8px'}} /> : '🏢'}
                    </div>
                    <div>
                      <h4 style={{margin:0,fontSize:'18px',fontWeight:800,color:'var(--navy)'}}>{detailOrg.name}</h4>
                      <div style={{fontSize:'12px',color:'var(--t3)'}}>{detailOrg.domain || 'No domain registered'}</div>
                    </div>
                  </div>
                  <div style={{padding:'16px',borderRadius:'12px',background:new Date(detailOrg.contract_end_date) < new Date() ? '#fef2f2' : '#f0fdf4',border:'1px solid',borderColor:new Date(detailOrg.contract_end_date) < new Date() ? '#fecaca' : '#bbf7d0'}}>
                    <div style={{fontSize:'11px',fontWeight:700,color:new Date(detailOrg.contract_end_date) < new Date() ? '#991b1b' : '#166534',textTransform:'uppercase',marginBottom:'4px'}}>Contract Status</div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'14px',fontWeight:700,color:new Date(detailOrg.contract_end_date) < new Date() ? '#dc2626' : '#16a34a'}}>{new Date(detailOrg.contract_end_date) < new Date() ? 'EXPIRED' : 'ACTIVE'}</span>
                      <span style={{fontSize:'13px',color:'var(--t2)'}}>{detailOrg.contract_end_date ? `Ends: ${new Date(detailOrg.contract_end_date).toLocaleDateString()}` : 'No date set'}</span>
                    </div>
                  </div>
                </div>
              ) : showForm ? (
                /* ── QUESTION FORM (WIZARD) ── */
                <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                  <div style={{display:'flex',gap:'4px',marginBottom:'12px'}}>
                    {[1,2,3].map(s=>(
                      <div key={s} style={{flex:1,height:'4px',borderRadius:'2px',background:qStep>=s?'var(--navy)':'var(--bdr)'}} />
                    ))}
                  </div>

                  {qStep === 1 ? (
                    <div style={{display:'flex',flexDirection:'column',gap:'20px',animation:'drawerSlideIn 0.3s ease-out'}}>
                      <div style={{fontSize:'12px',fontWeight:800,color:'var(--navy)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Step 1: Configuration</div>
                      {editQ && <div style={{padding:'12px',background:'#fff7ed',borderRadius:'8px',fontSize:'12.5px',color:'#9a3412',border:'1px solid #ffedd5'}}>⚠️ <strong>Auto-Version:</strong> saving will create <strong>V{(editQ.version_number||1)+1}</strong>.</div>}
                      
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                        <div>
                          <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Section</label>
                          <select value={formQ.section} onChange={e=>setFormQ({...formQ,section:e.target.value})} style={inp({width:'100%'})}>{sections.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select>
                        </div>
                        <div>
                          <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Type</label>
                          <select value={formQ.type} onChange={e=>setFormQ({...formQ,type:e.target.value})} style={inp({width:'100%'})}>{[['multiple_choice','Multiple Choice'],['fill_blank','Fill in Blank'],['audio_response','Audio Response'],['written_response','Written Response'],['listening','Listening'],['picture_description','Picture Description']].map(o=><option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>
                        </div>
                      </div>

                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                        <div>
                          <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>CEFR</label>
                          <select value={formQ.cefr_level} onChange={e=>setFormQ({...formQ,cefr_level:e.target.value})} style={inp({width:'100%'})}>{cefrLevels.map(l=><option key={l} value={l}>{l}</option>)}</select>
                        </div>
                        <div>
                          <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Difficulty</label>
                          <select value={formQ.difficulty} onChange={e=>setFormQ({...formQ,difficulty:e.target.value})} style={inp({width:'100%'})}>{[['easy','Easy'],['medium','Medium'],['hard','Hard']].map(o=><option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>
                        </div>
                      </div>

                      <div>
                        <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Target Role Tag</label>
                        <select value={formQ.role_tag} onChange={e=>setFormQ({...formQ,role_tag:e.target.value})} style={inp({width:'100%'})}>
                          {['general','flight_deck','cabin_crew','atc','maintenance','ground_staff'].map(r=><option key={r} value={r}>{r.replace('_',' ').toUpperCase()}</option>)}
                        </select>
                      </div>
                    </div>
                  ) : qStep === 2 ? (
                    <div style={{display:'flex',flexDirection:'column',gap:'20px',animation:'drawerSlideIn 0.3s ease-out'}}>
                      <div>
                        <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Question Text *</label>
                        <textarea value={formQ.content} onChange={e=>setFormQ({...formQ,content:e.target.value})} placeholder="..." rows={5} style={{...inp({width:'100%',resize:'vertical',fontSize:'14px'})}} />
                      </div>

                      {(formQ.type==='multiple_choice'||formQ.type==='fill_blank')&&(
                        <div style={{background:'var(--off)',borderRadius:'12px',padding:'16px',border:'1.5px solid var(--bdr)'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                            <label style={{fontSize:'11px',fontWeight:700,color:'var(--navy)',textTransform:'uppercase'}}>Options</label>
                            <button onClick={()=>setOptions([...options,{text:'',is_correct:false}])} style={{fontSize:'11px',fontWeight:700,color:'var(--sky)',background:'none',border:'none',cursor:'pointer'}}>+ ADD OPTION</button>
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                            {options.map((opt,i)=>(
                              <div key={i} style={{display:'flex',gap:'8px',alignItems:'center'}}>
                                <span style={{fontSize:'12px',fontWeight:800,color:'var(--t3)',width:'20px'}}>{String.fromCharCode(65+i)}</span>
                                <input value={opt.text} onChange={e=>{const o=[...options];o[i]={...o[i],text:e.target.value};setOptions(o)}} style={{...inp({flex:1,fontSize:'13px'})}} />
                                <input type="checkbox" checked={opt.is_correct} onChange={e=>{const o=[...options];o.forEach((x,idx)=>x.is_correct=idx===i?e.target.checked:false);setOptions([...o])}} />
                                <button onClick={()=>setOptions(options.filter((_,idx)=>idx!==i))} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:'14px'}}>✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Asset (Image/Audio URL)</label>
                        <div style={{display:'flex',gap:'8px'}}>
                          <input value={formQ.audio_url || formQ.image_url} onChange={e=>setFormQ({...formQ,audio_url:e.target.value})} placeholder="https://..." style={inp({flex:1})} />
                          <label style={{padding:'8px 12px',borderRadius:'8px',border:'1.5px solid var(--sky)',background:'var(--sky3)',color:'var(--sky)',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>
                            UPLOAD
                            <input type="file" style={{display:'none'}} onChange={async (e)=>{
                              const file = e.target.files?.[0]; if(!file) return;
                              const ext = file.name.split('.').pop();
                              const fileName = `${formQ.section}/${Date.now()}.${ext}`;
                              const { data, error } = await supabase.storage.from('question-assets').upload(fileName, file, { upsert: true });
                              if(error) return alert(error.message);
                              const { data: urlData } = supabase.storage.from('question-assets').getPublicUrl(fileName);
                              setFormQ({...formQ, audio_url: urlData.publicUrl, image_url: urlData.publicUrl});
                            }} />
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : ( // qStep === 3
                    <div style={{display:'flex',flexDirection:'column',gap:'20px',animation:'drawerSlideIn 0.3s ease-out'}}>
                      <div style={{fontSize:'12px',fontWeight:800,color:'var(--navy)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Step 3: Assignments</div>
                      <div style={{background:'var(--off)',borderRadius:'12px',padding:'16px',border:'1.5px solid var(--bdr)',marginBottom:'40px'}}>
                        <div style={{fontSize:'11px',fontWeight:700,color:'var(--navy)',textTransform:'uppercase',marginBottom:'12px'}}>Target Taxonomy</div>
                        <div style={{marginBottom:'12px'}}>
                          <div style={{fontSize:'10px',fontWeight:700,color:'var(--t3)',marginBottom:'6px',textTransform:'uppercase'}}>Departments</div>
                          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                            {departments.map(d=>(
                              <button key={d.id} onClick={()=>toggleArr(selectedDepts,setSelectedDepts,d.id)} style={{padding:'4px 10px',borderRadius:'100px',border:'1.5px solid',borderColor:selectedDepts.includes(d.id)?'var(--navy)':'var(--bdr)',background:selectedDepts.includes(d.id)?'var(--navy)':'#fff',color:selectedDepts.includes(d.id)?'#fff':'var(--t2)',fontSize:'11px',fontWeight:600,cursor:'pointer'}}>{d.name}</button>
                            ))}
                          </div>
                        </div>
                        {selectedDepts.length > 0 && (
                          <div style={{marginBottom:'12px'}}>
                            <div style={{fontSize:'10px',fontWeight:700,color:'var(--t3)',marginBottom:'6px',textTransform:'uppercase'}}>Sub-Roles</div>
                            <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                              {filteredSubRoles.map(s=>(
                                <button key={s.id} onClick={()=>toggleArr(selectedSubRoles,setSelectedSubRoles,s.id)} style={{padding:'4px 10px',borderRadius:'100px',border:'1.5px solid',borderColor:selectedSubRoles.includes(s.id)?'var(--sky)':'var(--bdr)',background:selectedSubRoles.includes(s.id)?'var(--sky3)':'#fff',color:selectedSubRoles.includes(s.id)?'var(--sky)':'var(--t2)',fontSize:'11px',fontWeight:600,cursor:'pointer'}}>{s.name}</button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <div style={{fontSize:'10px',fontWeight:700,color:'var(--t3)',marginBottom:'6px',textTransform:'uppercase'}}>Use Cases</div>
                          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                            {useCases.map(u=>(
                              <button key={u.id} onClick={()=>toggleArr(selectedUseCases,setSelectedUseCases,u.id)} style={{padding:'4px 10px',borderRadius:'100px',border:'1.5px solid',borderColor:selectedUseCases.includes(u.id)?'var(--teal)':'var(--bdr)',background:selectedUseCases.includes(u.id)?'#E6F7F4':'#fff',color:selectedUseCases.includes(u.id)?'var(--teal)':'var(--t2)',fontSize:'11px',fontWeight:600,cursor:'pointer'}}>{u.name}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : detailQ ? (
                /* ── QUESTION VIEW ── */
                <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    <span style={{padding:'4px 10px',borderRadius:'6px',background:sectionColors[detailQ.section]+'15',color:sectionColors[detailQ.section],fontSize:'11px',fontWeight:800,textTransform:'uppercase'}}>{detailQ.section}</span>
                    <span style={{padding:'4px 10px',borderRadius:'6px',background:'var(--sky3)',color:'var(--sky)',fontSize:'11px',fontWeight:800}}>{detailQ.cefr_level}</span>
                    <span style={{padding:'4px 10px',borderRadius:'6px',background:'#f1f5f9',color:'#475569',fontSize:'11px',fontWeight:800,textTransform:'uppercase'}}>{detailQ.difficulty}</span>
                    <span style={{padding:'4px 10px',borderRadius:'6px',background:'#f5f3ff',color:'#7c3aed',fontSize:'11px',fontWeight:800,textTransform:'uppercase'}}>{detailQ.role_tag || 'General'}</span>
                  </div>
                  <div>
                    <div style={{fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',marginBottom:'8px'}}>Question Content</div>
                    <div style={{fontSize:'16px',color:'var(--navy)',lineHeight:1.6,whiteSpace:'pre-wrap',fontWeight:500}}>{detailQ.content}</div>
                  </div>
                  {detailQ.correct_answer && (
                    <div style={{padding:'16px',background:'#f0fdf4',borderRadius:'12px',border:'1px solid #bbf7d0'}}>
                      <div style={{fontSize:'11.5px',fontWeight:700,color:'#166534',textTransform:'uppercase',marginBottom:'4px'}}>Correct Answer</div>
                      <div style={{fontSize:'14px',color:'#166534',fontWeight:600}}>✓ {detailQ.correct_answer}</div>
                    </div>
                  )}
                  {detailQ.audio_url && (
                    <div style={{padding:'16px',background:'var(--off)',borderRadius:'12px',border:'1px solid var(--bdr)'}}>
                      <div style={{fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',marginBottom:'12px'}}>Asset / Resource</div>
                      {detailQ.section === 'listening' ? <audio src={detailQ.audio_url} controls style={{width:'100%'}} /> : <img src={detailQ.audio_url} style={{maxWidth:'100%',borderRadius:'8px'}} />}
                    </div>
                  )}
                </div>
              ) : null}
            </div>{/* end drawer content scroll area */}

            {/* Drawer Footer */}

            <div style={{padding:'20px 24px',borderTop:'1px solid var(--bdr)',background:'#fafafa',display:'flex',justifyContent:'flex-end',gap:'10px'}}>
              <button onClick={()=>{setShowForm(false);setDetailQ(null);setShowTemplateForm(false);setEditTemplate(null);setShowUserForm(false);setDetailUser(null);setShowOrgForm(false);setDetailOrg(null);setOrgStep(1);setQStep(1);resetForm();}} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'13px',fontWeight:600,color:'var(--t2)',cursor:'pointer'}}>Close</button>
              
              {showOrgForm && orgStep === 1 && <button onClick={()=>setOrgStep(2)} style={{padding:'10px 30px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Next Step →</button>}
              {showOrgForm && orgStep === 2 && <button onClick={()=>setOrgStep(1)} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid var(--navy)',background:'#fff',color:'var(--navy)',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>← Back</button>}

              {showForm && qStep < 3 && <button onClick={()=>setQStep(qStep+1)} style={{padding:'10px 30px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Next Step →</button>}
              {showForm && qStep > 1 && <button onClick={()=>setQStep(qStep-1)} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid var(--navy)',background:'#fff',color:'var(--navy)',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>← Back</button>}

              {(showTemplateForm || showUserForm || (showOrgForm && orgStep === 2) || (showForm && qStep === 3)) && <button onClick={showTemplateForm?saveTemplate:showUserForm?saveUser:showOrgForm?saveOrg:saveQuestion} style={{padding:'10px 30px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Save Changes</button>}
              
              {detailQ && !showForm && <button onClick={()=>{startEdit(detailQ);setQStep(1);setDetailQ(null)}} style={{padding:'10px 30px',borderRadius:'8px',border:'none',background:'var(--sky)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Edit This Question</button>}
              {detailUser && !showUserForm && (
                <div style={{display:'flex',gap:'10px'}}>
                  <button onClick={()=>{startEditUser(detailUser);setShowUserForm(true);setDetailUser(null)}} style={{flex:1,padding:'10px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Edit User</button>
                  <button onClick={()=>startSingleDeleteUser(detailUser)} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid #FECACA',background:'#FEF2F2',color:'#DC2626',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Delete</button>
                </div>
              )}
              {detailOrg && !showOrgForm && (
                <div style={{display:'flex',gap:'10px'}}>
                  <button onClick={()=>{startEditOrg(detailOrg);setOrgStep(1);setDetailOrg(null)}} style={{flex:1,padding:'10px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Edit Organization</button>
                  <button onClick={()=>startSingleDeleteOrg(detailOrg)} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid #FECACA',background:'#FEF2F2',color:'#DC2626',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Delete</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
        </div>
      </div>
  )

}
