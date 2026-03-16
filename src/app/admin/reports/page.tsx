'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const cefrColors: Record<string,string> = {
  A1:'#6B7280', A2:'#9CA3AF', B1:'#3A8ED0', B2:'#0A8870', C1:'#B8881A', C2:'#7C3AED'
}
const sectionColors: Record<string,string> = {
  grammar:'#3A8ED0', reading:'#0A8870', writing:'#B8881A', speaking:'#B83040', listening:'#7C3AED'
}

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview'|'exams'|'questions'|'organizations'>('overview')
  const [stats, setStats] = useState<any>({})
  const [exams, setExams] = useState<any[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [topQuestions, setTopQuestions] = useState<any[]>([])
  const [cefrDist, setCefrDist] = useState<Record<string,number>>({})
  const [sectionDist, setSectionDist] = useState<Record<string,number>>({})
  const [dateFilter, setDateFilter] = useState('30')

  useEffect(() => { checkAuth() }, [])
  useEffect(() => { if (!loading) loadReportData() }, [dateFilter])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (data?.role !== 'super_admin') { router.push('/login'); return }
    await loadReportData()
    setLoading(false)
  }

  async function loadReportData() {
    const since = new Date(Date.now() - parseInt(dateFilter) * 24*60*60*1000).toISOString()

    const [
      { count: totalUsers },
      { count: totalExams },
      { count: totalQuestions },
      { count: totalOrgs },
      { count: pendingGrades },
      { data: examData },
      { data: orgData },
      { data: questionData },
    ] = await Promise.all([
      supabase.from('users').select('id',{count:'exact',head:true}),
      supabase.from('exams').select('id',{count:'exact',head:true}),
      supabase.from('questions').select('id',{count:'exact',head:true}).eq('is_latest',true),
      supabase.from('organizations').select('id',{count:'exact',head:true}),
      supabase.from('exam_answers').select('id',{count:'exact',head:true}).in('section',['writing','speaking']).gte('created_at',since),
      supabase.from('exams').select('*,exam_templates(name,passing_cefr,role_profile),users:candidate_id(full_name,email,organizations(name))').gte('created_at',since).order('created_at',{ascending:false}).limit(50),
      supabase.from('organizations').select('*').order('name'),
      supabase.from('questions').select('id,section,cefr_level,usage_count,question_analytics(difficulty_index,total_attempts)').eq('is_latest',true).order('usage_count',{ascending:false}).limit(10),
    ])

    setStats({ totalUsers, totalExams, totalQuestions, totalOrgs, pendingGrades })
    setExams(examData || [])
    setOrgs(orgData || [])
    setTopQuestions(questionData || [])

    // CEFR distribution
    const cefr: Record<string,number> = {}
    examData?.filter(e=>e.final_cefr_score).forEach(e => { cefr[e.final_cefr_score] = (cefr[e.final_cefr_score]||0)+1 })
    setCefrDist(cefr)

    // Section distribution from questions
    const sec: Record<string,number> = {}
    ;['grammar','reading','writing','speaking','listening'].forEach(async s => {
      const { count } = await supabase.from('questions').select('id',{count:'exact',head:true}).eq('section',s).eq('is_latest',true)
      sec[s] = count||0
      setSectionDist({...sec})
    })
  }

  async function exportExamsCSV() {
    const { data } = await supabase.from('exams').select('*,exam_templates(name,passing_cefr),users:candidate_id(full_name,email,organizations(name))').order('created_at',{ascending:false})
    if (!data?.length) return
    const headers = ['candidate_name','candidate_email','organization','template','status','cefr_score','numeric_score','started_at','completed_at']
    const rows = data.map(e => [
      e.users?.full_name||'', e.users?.email||'', e.users?.organizations?.name||'',
      e.exam_templates?.name||'', e.status, e.final_cefr_score||'', e.final_numeric_score||'',
      e.started_at||'', e.completed_at||''
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v=>String(v).includes(',')?`"${v}"`:v).join(','))].join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href=url; a.download=`avilingo-exam-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  async function exportQuestionBankCSV() {
    const { data } = await supabase.from('questions').select('*').eq('is_latest',true).order('section')
    if (!data?.length) return
    const headers = ['section','cefr_level','difficulty','type','content','correct_answer','competency_tag','aircraft_context','active']
    const csv = [headers.join(','), ...data.map(q => headers.map(h => { const v=String((q as any)[h]??'').replace(/"/g,'""'); return v.includes(',')||v.includes('\n')?`"${v}"`:v }).join(','))].join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href=url; a.download=`avilingo-question-bank-${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'var(--off)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--fb)',color:'var(--t3)'}}>Loading reports...</div>
  )

  const certified = exams.filter(e=>e.status==='certified')
  const passRate = certified.length > 0 ? Math.round((certified.filter(e => {
    const order = ['A1','A2','B1','B2','C1','C2']
    return order.indexOf(e.final_cefr_score) >= order.indexOf(e.exam_templates?.passing_cefr)
  }).length / certified.length) * 100) : 0
  const avgScore = certified.length > 0 ? Math.round(certified.reduce((s,e)=>s+(e.final_numeric_score||0),0)/certified.length) : 0
  const cefrMax = Math.max(...Object.values(cefrDist), 1)
  const sectionMax = Math.max(...Object.values(sectionDist), 1)

  const statusColor: Record<string,string> = { pending:'#FAEEDA', in_progress:'#E6F1FB', completed:'#EAF3DE', invalidated:'#FCEBEB', grading:'#F5F3FF', certified:'#D1FAE5' }
  const statusText: Record<string,string> = { pending:'Pending', in_progress:'In Progress', completed:'Submitted', invalidated:'Invalidated', grading:'Grading', certified:'Certified' }

  return (
    <div style={{minHeight:'100vh',background:'var(--off)',fontFamily:'var(--fb)'}}>
      <div style={{background:'#fff',padding:'14px 28px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <a href="/admin" style={{fontSize:'13px',color:'var(--sky)',textDecoration:'none'}}>← Admin</a>
          <span style={{color:'var(--bdr)'}}>|</span>
          <h1 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',margin:0}}>Reports & Analytics</h1>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <select value={dateFilter} onChange={e=>setDateFilter(e.target.value)} style={{padding:'7px 12px',borderRadius:'7px',border:'1.5px solid var(--bdr)',fontSize:'12.5px',fontFamily:'var(--fb)',color:'var(--t2)'}}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
          </select>
          <button onClick={exportExamsCSV} style={{padding:'7px 14px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'12.5px',fontWeight:600,color:'var(--navy)',cursor:'pointer',fontFamily:'var(--fb)'}}>⬇ Export Exams</button>
          <button onClick={exportQuestionBankCSV} style={{padding:'7px 14px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'12.5px',fontWeight:600,color:'var(--navy)',cursor:'pointer',fontFamily:'var(--fb)'}}>⬇ Export Questions</button>
        </div>
      </div>

      <div style={{padding:'24px 28px'}}>
        {/* Top metrics */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'12px',marginBottom:'22px'}}>
          {[
            {label:'Total Users',value:stats.totalUsers||0,color:'#5AAEDF'},
            {label:'Total Exams',value:stats.totalExams||0,color:'#DEAC50'},
            {label:'Questions',value:(stats.totalQuestions||0).toLocaleString(),color:'#0A8870'},
            {label:'Organizations',value:stats.totalOrgs||0,color:'#7C3AED'},
            {label:'Pass Rate',value:`${passRate}%`,color:passRate>=70?'#1AD18A':'#EF4444'},
            {label:'Avg Score',value:`${avgScore}%`,color:'#3A8ED0'},
          ].map(m=>(
            <div key={m.label} style={{background:'#fff',borderRadius:'12px',padding:'16px',border:'1px solid var(--bdr)'}}>
              <div style={{fontSize:'11px',color:'var(--t3)',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.4px'}}>{m.label}</div>
              <div style={{fontSize:'22px',fontWeight:700,color:m.color,fontFamily:'var(--fm)'}}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:'2px',background:'#fff',padding:'3px',borderRadius:'10px',marginBottom:'20px',width:'fit-content',border:'1px solid var(--bdr)'}}>
          {(['overview','exams','questions','organizations'] as const).map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} style={{padding:'7px 18px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:500,textTransform:'capitalize',background:activeTab===tab?'var(--navy)':'transparent',color:activeTab===tab?'#fff':'var(--t3)',fontFamily:'var(--fb)'}}>
              {tab}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab==='overview' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'18px'}}>

            {/* CEFR Distribution */}
            <div style={{background:'#fff',borderRadius:'14px',padding:'20px',border:'1px solid var(--bdr)'}}>
              <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',marginBottom:'16px'}}>CEFR Score Distribution</h3>
              {Object.keys(cefrDist).length === 0 ? (
                <div style={{textAlign:'center',padding:'20px',color:'var(--t3)',fontSize:'13px'}}>No certified exams yet</div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {['A1','A2','B1','B2','C1','C2'].map(level => {
                    const count = cefrDist[level]||0
                    const pct = Math.round((count/Math.max(Object.values(cefrDist).reduce((a,b)=>a+b,0),1))*100)
                    return (
                      <div key={level} style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <span style={{fontSize:'12px',fontWeight:700,color:cefrColors[level],width:'28px'}}>{level}</span>
                        <div style={{flex:1,height:'20px',background:'var(--off)',borderRadius:'4px',overflow:'hidden'}}>
                          <div style={{height:'100%',background:cefrColors[level],width:`${Math.max(pct,count>0?3:0)}%`,borderRadius:'4px',transition:'width 0.5s'}}/>
                        </div>
                        <span style={{fontSize:'12px',color:'var(--t3)',width:'40px',textAlign:'right'}}>{count} ({pct}%)</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Question Bank Distribution */}
            <div style={{background:'#fff',borderRadius:'14px',padding:'20px',border:'1px solid var(--bdr)'}}>
              <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',marginBottom:'16px'}}>Question Bank by Section</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {['grammar','reading','writing','speaking','listening'].map(s => {
                  const count = sectionDist[s]||0
                  const pct = Math.round((count/Math.max(Object.values(sectionDist).reduce((a,b)=>a+b,0),1))*100)
                  return (
                    <div key={s} style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <span style={{fontSize:'12px',fontWeight:700,color:sectionColors[s],width:'64px',textTransform:'capitalize'}}>{s}</span>
                      <div style={{flex:1,height:'20px',background:'var(--off)',borderRadius:'4px',overflow:'hidden'}}>
                        <div style={{height:'100%',background:sectionColors[s],width:`${Math.max(pct,count>0?1:0)}%`,borderRadius:'4px',transition:'width 0.5s'}}/>
                      </div>
                      <span style={{fontSize:'12px',color:'var(--t3)',width:'60px',textAlign:'right'}}>{count.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Exam Status Breakdown */}
            <div style={{background:'#fff',borderRadius:'14px',padding:'20px',border:'1px solid var(--bdr)'}}>
              <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',marginBottom:'16px'}}>Exam Status Breakdown</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'}}>
                {['pending','in_progress','completed','grading','certified','invalidated'].map(s=>{
                  const count = exams.filter(e=>e.status===s).length
                  return (
                    <div key={s} style={{padding:'12px',borderRadius:'8px',background:statusColor[s]||'#F1EFE8',textAlign:'center'}}>
                      <div style={{fontSize:'20px',fontWeight:700,color:'var(--navy)',fontFamily:'var(--fm)'}}>{count}</div>
                      <div style={{fontSize:'11px',color:'var(--t2)',textTransform:'capitalize',marginTop:'2px'}}>{statusText[s]||s}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pending Grades */}
            <div style={{background:'#fff',borderRadius:'14px',padding:'20px',border:'1px solid var(--bdr)'}}>
              <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',marginBottom:'16px'}}>System Health</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {[
                  {label:'Pending human grades',value:stats.pendingGrades||0,color:stats.pendingGrades>10?'#EF4444':'#1AD18A',action:'/evaluator'},
                  {label:'Active question bank',value:(stats.totalQuestions||0).toLocaleString(),color:'#1AD18A',action:'/admin'},
                  {label:'Organizations active',value:stats.totalOrgs||0,color:'#3A8ED0',action:'/admin/users'},
                  {label:'Total platform users',value:stats.totalUsers||0,color:'#7C3AED',action:'/admin/users'},
                ].map(item=>(
                  <div key={item.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:'8px',background:'var(--off)',border:'1px solid var(--bdr)'}}>
                    <span style={{fontSize:'13px',color:'var(--t2)'}}>{item.label}</span>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <span style={{fontSize:'16px',fontWeight:700,color:item.color,fontFamily:'var(--fm)'}}>{item.value}</span>
                      <a href={item.action} style={{fontSize:'11.5px',color:'var(--sky)',textDecoration:'none',fontWeight:600}}>View →</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EXAMS TAB */}
        {activeTab==='exams' && (
          <div style={{background:'#fff',borderRadius:'14px',border:'1px solid var(--bdr)',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'var(--off)',borderBottom:'1px solid var(--bdr)'}}>
                  {['Candidate','Organization','Template','Score','Status','Date','Actions'].map(h=>(
                    <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.4px'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exams.map((e,i)=>(
                  <tr key={e.id} style={{borderBottom:'1px solid var(--bdr)',background:i%2===0?'#fff':'#FAFBFC'}}>
                    <td style={{padding:'11px 16px'}}>
                      <div style={{fontSize:'13.5px',fontWeight:600,color:'var(--navy)'}}>{e.users?.full_name||'—'}</div>
                      <div style={{fontSize:'11.5px',color:'var(--t3)'}}>{e.users?.email}</div>
                    </td>
                    <td style={{padding:'11px 16px',fontSize:'12.5px',color:'var(--t2)'}}>{e.users?.organizations?.name||'—'}</td>
                    <td style={{padding:'11px 16px',fontSize:'12.5px',color:'var(--t2)'}}>{e.exam_templates?.name||'—'}</td>
                    <td style={{padding:'11px 16px'}}>
                      {e.final_cefr_score
                        ? <span style={{fontSize:'16px',fontWeight:800,color:cefrColors[e.final_cefr_score],fontFamily:'var(--fm)'}}>{e.final_cefr_score}</span>
                        : <span style={{fontSize:'12px',color:'var(--t3)'}}>—</span>}
                    </td>
                    <td style={{padding:'11px 16px'}}>
                      <span style={{fontSize:'11px',fontWeight:600,padding:'2px 8px',borderRadius:'100px',background:statusColor[e.status]||'#F1EFE8',color:'#333'}}>{statusText[e.status]||e.status}</span>
                    </td>
                    <td style={{padding:'11px 16px',fontSize:'12px',color:'var(--t3)'}}>{new Date(e.created_at).toLocaleDateString('en-GB')}</td>
                    <td style={{padding:'11px 16px'}}>
                      {e.status==='certified'&&(
                        <a href={`/exam/${e.id}/certificate`} style={{fontSize:'11.5px',fontWeight:600,padding:'4px 10px',borderRadius:'6px',border:'1.5px solid #BBF7D0',background:'#F0FDF4',color:'#14532D',textDecoration:'none'}}>Certificate</a>
                      )}
                    </td>
                  </tr>
                ))}
                {exams.length===0&&<tr><td colSpan={7} style={{padding:'40px',textAlign:'center',color:'var(--t3)',fontSize:'13.5px'}}>No exams in this period.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* QUESTIONS TAB */}
        {activeTab==='questions' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'18px'}}>
            <div style={{background:'#fff',borderRadius:'14px',padding:'20px',border:'1px solid var(--bdr)'}}>
              <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',marginBottom:'16px'}}>Most Used Questions</h3>
              {topQuestions.map((q,i)=>(
                <div key={q.id} style={{display:'flex',gap:'12px',padding:'10px 0',borderBottom:i<topQuestions.length-1?'1px solid var(--bdr)':'none',alignItems:'flex-start'}}>
                  <span style={{fontSize:'12px',fontWeight:700,color:'var(--t3)',width:'20px',flexShrink:0,paddingTop:'2px'}}>#{i+1}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'12.5px',color:'var(--t1)',marginBottom:'3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.content?.substring(0,80)}...</div>
                    <div style={{display:'flex',gap:'6px'}}>
                      <span style={{fontSize:'10.5px',fontWeight:700,padding:'1px 6px',borderRadius:'100px',background:sectionColors[q.section]+'20',color:sectionColors[q.section],textTransform:'capitalize'}}>{q.section}</span>
                      <span style={{fontSize:'10.5px',color:'var(--t3)'}}>Used {q.usage_count||0}x</span>
                      {q.question_analytics?.[0]?.difficulty_index!=null&&(
                        <span style={{fontSize:'10.5px',color:q.question_analytics[0].difficulty_index<30?'#DC2626':q.question_analytics[0].difficulty_index>80?'#16A34A':'var(--t3)'}}>{q.question_analytics[0].difficulty_index}% correct</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {topQuestions.length===0&&<div style={{textAlign:'center',padding:'20px',color:'var(--t3)',fontSize:'13px'}}>No usage data yet</div>}
            </div>
            <div style={{background:'#fff',borderRadius:'14px',padding:'20px',border:'1px solid var(--bdr)'}}>
              <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',marginBottom:'16px'}}>Question Bank Summary</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {['grammar','reading','writing','speaking','listening'].map(s=>(
                  <div key={s} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderRadius:'8px',background:sectionColors[s]+'10',border:'1px solid '+sectionColors[s]+'20'}}>
                    <span style={{fontSize:'13px',fontWeight:700,color:sectionColors[s],textTransform:'capitalize'}}>{s}</span>
                    <span style={{fontSize:'16px',fontWeight:700,color:'var(--navy)',fontFamily:'var(--fm)'}}>{(sectionDist[s]||0).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderRadius:'8px',background:'var(--navy)',marginTop:'4px'}}>
                  <span style={{fontSize:'13px',fontWeight:700,color:'#fff'}}>Total</span>
                  <span style={{fontSize:'16px',fontWeight:700,color:'#5AAEDF',fontFamily:'var(--fm)'}}>{Object.values(sectionDist).reduce((a,b)=>a+b,0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ORGANIZATIONS TAB */}
        {activeTab==='organizations' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'14px'}}>
            {orgs.map(o=>{
              const orgExams = exams.filter(e=>e.users?.organizations?.name===o.name)
              const orgCertified = orgExams.filter(e=>e.status==='certified')
              const orgPassRate = orgCertified.length>0 ? Math.round((orgCertified.filter(e=>{
                const order=['A1','A2','B1','B2','C1','C2']
                return order.indexOf(e.final_cefr_score)>=order.indexOf(e.exam_templates?.passing_cefr)
              }).length/orgCertified.length)*100) : 0
              return (
                <div key={o.id} style={{background:'#fff',borderRadius:'14px',padding:'20px',border:'1px solid var(--bdr)'}}>
                  <div style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>{o.name}</div>
                  <div style={{fontSize:'12px',color:'var(--t3)',marginBottom:'14px'}}>{o.contact_email||'No email'}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px'}}>
                    {[
                      {label:'Exams',value:orgExams.length},
                      {label:'Certified',value:orgCertified.length},
                      {label:'Pass Rate',value:`${orgPassRate}%`},
                      {label:'Credits',value:o.credit_balance||0},
                    ].map(s=>(
                      <div key={s.label} style={{background:'var(--off)',borderRadius:'7px',padding:'8px',textAlign:'center'}}>
                        <div style={{fontSize:'10px',color:'var(--t3)',marginBottom:'2px',textTransform:'uppercase'}}>{s.label}</div>
                        <div style={{fontSize:'16px',fontWeight:700,color:'var(--navy)',fontFamily:'var(--fm)'}}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <span style={{fontSize:'11px',fontWeight:600,padding:'3px 9px',borderRadius:'100px',background:'#EAF3DE',color:'#27500A',textTransform:'capitalize'}}>{o.subscription_type?.replace(/_/g,' ')}</span>
                </div>
              )
            })}
            {orgs.length===0&&<div style={{gridColumn:'1/-1',padding:'40px',textAlign:'center',background:'#fff',borderRadius:'14px',border:'1px solid var(--bdr)',color:'var(--t3)',fontSize:'13.5px'}}>No organizations yet.</div>}
          </div>
        )}
      </div>
    </div>
  )
}
