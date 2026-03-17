'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ACTION_COLORS: Record<string,string> = {
  CREATE: '#0A8870', UPDATE: '#3A8ED0', DELETE: '#EF4444',
  LOGIN: '#7C3AED', LOGOUT: '#6B7280', EXPORT: '#B8881A',
  GRADE: '#B83040', ASSIGN: '#0A8870', INVALIDATE: '#EF4444',
  SCORE: '#7C3AED', CERTIFICATE: '#B8881A'
}

export default function AuditLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => { checkAuth() }, [])
  useEffect(() => { loadLogs() }, [page, actionFilter, entityFilter, search] )

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (data?.role !== 'super_admin') { router.push('/login'); return }
    setLoading(false)
  }

  async function loadLogs() {
    let query = supabase
      .from('audit_logs')
      .select('*,users:admin_id(full_name,email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (actionFilter !== 'all') query = query.eq('action', actionFilter)
    if (entityFilter !== 'all') query = query.eq('entity', entityFilter)
    if (search) query = query.or(`action.ilike.%${search}%,entity.ilike.%${search}%`)

    const { data, count } = await query
    setLogs(data || [])
    setTotal(count || 0)
  }

  async function logAction(action: string, entity: string, entityId: string, details: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('audit_logs').insert({
      admin_id: user.id,
      action,
      entity,
      entity_id: entityId,
      details,
      ip_address: 'client'
    })
  }

  async function exportLogs() {
    const { data } = await supabase
      .from('audit_logs')
      .select('*,users:admin_id(full_name,email)')
      .order('created_at', { ascending: false })
      .limit(10000)

    if (!data?.length) return
    const headers = ['timestamp','admin','action','entity','entity_id','ip_address','details']
    const rows = data.map(l => [
      new Date(l.created_at).toISOString(),
      l.users?.email || l.admin_id,
      l.action,
      l.entity || '',
      l.entity_id || '',
      l.ip_address || '',
      JSON.stringify(l.details || {})
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => String(v).includes(',') ? `"${v}"` : v).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `avilingo-audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const actions = ['CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','GRADE','ASSIGN','INVALIDATE','SCORE','CERTIFICATE']
  const entities = ['users','questions','exams','grades','certificates','exam_templates','organizations','credits']
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (loading) return (
    <div style={{minHeight:'100vh',background:'var(--off)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--fb)',color:'var(--t3)'}}>Loading audit logs...</div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--off)',fontFamily:'var(--fb)'}}>
      <div style={{background:'#fff',padding:'14px 28px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <a href="/admin" style={{fontSize:'13px',color:'var(--sky)',textDecoration:'none'}}>← Admin</a>
          <span style={{color:'var(--bdr)'}}>|</span>
          <h1 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',margin:0}}>Audit Logs</h1>
          <span style={{fontSize:'12px',padding:'2px 8px',borderRadius:'100px',background:'#EAF3DE',color:'#27500A',fontWeight:600}}>Immutable</span>
        </div>
        <button onClick={exportLogs} style={{padding:'7px 16px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'12.5px',fontWeight:600,color:'var(--navy)',cursor:'pointer',fontFamily:'var(--fb)'}}>⬇ Export CSV</button>
      </div>

      <div style={{padding:'24px 28px'}}>

        {/* Filters */}
        <div style={{display:'flex',gap:'10px',marginBottom:'18px',flexWrap:'wrap',alignItems:'center'}}>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} placeholder="Search action or entity..." style={{padding:'8px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'240px',fontFamily:'var(--fb)'}} />
          <select value={actionFilter} onChange={e=>{setActionFilter(e.target.value);setPage(0)}} style={{padding:'8px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',fontFamily:'var(--fb)'}}>
            <option value="all">All actions</option>
            {actions.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          <select value={entityFilter} onChange={e=>{setEntityFilter(e.target.value);setPage(0)}} style={{padding:'8px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',fontFamily:'var(--fb)'}}>
            <option value="all">All entities</option>
            {entities.map(e=><option key={e} value={e}>{e}</option>)}
          </select>
          <span style={{fontSize:'12.5px',color:'var(--t3)'}}>{total.toLocaleString()} entries</span>
        </div>

        {/* Log table */}
        <div style={{background:'#fff',borderRadius:'14px',border:'1px solid var(--bdr)',overflow:'hidden',marginBottom:'14px'}}>
          {logs.length === 0 ? (
            <div style={{padding:'60px',textAlign:'center'}}>
              <div style={{fontSize:'32px',marginBottom:'12px'}}>📋</div>
              <h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'6px'}}>No audit logs yet</h3>
              <p style={{fontSize:'13.5px',color:'var(--t3)'}}>Admin actions will be logged here automatically as you use the platform.</p>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'var(--off)',borderBottom:'1px solid var(--bdr)'}}>
                  {['Timestamp','Admin','Action','Entity','Entity ID','Details'].map(h=>(
                    <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.4px'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log,i)=>(
                  <tr key={log.id} style={{borderBottom:'1px solid var(--bdr)',background:i%2===0?'#fff':'#FAFBFC'}}>
                    <td style={{padding:'10px 16px',fontSize:'12px',color:'var(--t3)',whiteSpace:'nowrap'}}>
                      <div>{new Date(log.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</div>
                      <div style={{fontSize:'11px'}}>{new Date(log.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
                    </td>
                    <td style={{padding:'10px 16px'}}>
                      <div style={{fontSize:'12.5px',fontWeight:600,color:'var(--navy)'}}>{log.users?.full_name||'System'}</div>
                      <div style={{fontSize:'11.5px',color:'var(--t3)'}}>{log.users?.email||log.admin_id?.substring(0,8)}</div>
                    </td>
                    <td style={{padding:'10px 16px'}}>
                      <span style={{fontSize:'11.5px',fontWeight:700,padding:'3px 9px',borderRadius:'100px',background:(ACTION_COLORS[log.action]||'#6B7280')+'15',color:ACTION_COLORS[log.action]||'#6B7280',border:'1px solid'+(ACTION_COLORS[log.action]||'#6B7280')+'30'}}>{log.action}</span>
                    </td>
                    <td style={{padding:'10px 16px',fontSize:'12.5px',color:'var(--t2)',textTransform:'capitalize'}}>{log.entity||'—'}</td>
                    <td style={{padding:'10px 16px',fontSize:'11.5px',color:'var(--t3)',fontFamily:'monospace'}}>{log.entity_id?.substring(0,8)||'—'}</td>
                    <td style={{padding:'10px 16px',fontSize:'12px',color:'var(--t2)',maxWidth:'200px'}}>
                      {log.details ? (
                        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>
                          {typeof log.details === 'object' ? Object.entries(log.details).map(([k,v])=>`${k}: ${v}`).join(', ') : String(log.details)}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:'12.5px',color:'var(--t3)'}}>Showing {page*PAGE_SIZE+1}–{Math.min((page+1)*PAGE_SIZE,total)} of {total.toLocaleString()}</span>
            <div style={{display:'flex',gap:'6px'}}>
              <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:'6px 14px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:page===0?'default':'pointer',fontSize:'12.5px',fontWeight:600,color:page===0?'var(--t3)':'var(--navy)',fontFamily:'var(--fb)'}}>← Prev</button>
              <span style={{padding:'6px 12px',fontSize:'12.5px',color:'var(--t2)'}}>{page+1} / {totalPages}</span>
              <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{padding:'6px 14px',borderRadius:'7px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:page>=totalPages-1?'default':'pointer',fontSize:'12.5px',fontWeight:600,color:page>=totalPages-1?'var(--t3)':'var(--navy)',fontFamily:'var(--fb)'}}>Next →</button>
            </div>
          </div>
        )}

        {/* Info box */}
        <div style={{background:'#EFF6FF',borderRadius:'10px',padding:'14px 18px',marginTop:'16px',border:'1px solid #BFDBFE'}}>
          <div style={{fontSize:'12.5px',fontWeight:700,color:'#1E40AF',marginBottom:'4px'}}>About Audit Logs</div>
          <div style={{fontSize:'12px',color:'#3B82F6',lineHeight:1.6}}>
            Audit logs are immutable records of all admin actions. They satisfy EASA, FAA and ICAO compliance requirements for training record integrity. Each log entry captures the admin ID, action type, affected entity, timestamp and details. Logs cannot be edited or deleted.
          </div>
        </div>
      </div>
    </div>
  )
}
