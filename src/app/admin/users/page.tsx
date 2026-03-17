'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ROLES = ['super_admin','hr_manager','instructor','evaluator','student','candidate']
const ROLE_COLORS: Record<string,string> = {
  super_admin:'#B83040', hr_manager:'#B8881A', instructor:'#0A8870',
  evaluator:'#7C3AED', student:'#3A8ED0', candidate:'#5F5E5A'
}
const ROLE_LABELS: Record<string,string> = {
  super_admin:'Super Admin', hr_manager:'HR Manager', instructor:'Instructor',
  evaluator:'Evaluator', student:'Student', candidate:'Candidate'
}

export default function UserManagement() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showInvite, setShowInvite] = useState(false)
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email:'', full_name:'', role:'candidate', org_id:'' })
  const [orgForm, setOrgForm] = useState({ name:'', contact_email:'', subscription_type:'pay-as-you-go', credit_balance:0 })
  const [stats, setStats] = useState<Record<string,number>>({})

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (data?.role !== 'super_admin') { router.push('/login'); return }
    loadUsers()
    loadOrgs()
  }

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('*,organizations(name)')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    const counts: Record<string,number> = {}
    data?.forEach(u => { counts[u.role] = (counts[u.role]||0) + 1 })
    setStats(counts)
    setLoading(false)
  }

  async function loadOrgs() {
    const { data } = await supabase.from('organizations').select('*').order('name')
    setOrgs(data || [])
  }

  async function inviteUser() {
    if (!inviteForm.email || !inviteForm.role) return
    setSaving(true)
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin
        ? ({ data: null, error: { message: 'Use Supabase dashboard to create auth user' } })
        : ({ data: null, error: null })

      // Insert into users table directly (auth user created separately)
      const { error } = await supabase.from('users').insert({
        email: inviteForm.email,
        full_name: inviteForm.full_name,
        role: inviteForm.role,
        org_id: inviteForm.org_id || null,
      })
      if (error) { alert('Error: ' + error.message); setSaving(false); return }
      setShowInvite(false)
      setInviteForm({ email:'', full_name:'', role:'candidate', org_id:'' })
      loadUsers()
    } catch (e: any) { alert('Error: ' + e.message) }
    setSaving(false)
  }

  async function updateUser(userId: string, updates: any) {
    setSaving(true)
    await supabase.from('users').update(updates).eq('id', userId)
    setSaving(false)
    setEditUser(null)
    loadUsers()
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return
    setSaving(true)
    // Delete dependent records first
    const { data: userExams } = await supabase.from('exams').select('id').eq('candidate_id', userId)
    if (userExams?.length) {
      const examIds = userExams.map(e => e.id)
      await supabase.from('exam_answers').delete().in('exam_id', examIds)
      await supabase.from('exam_question_sets').delete().in('exam_id', examIds)
      await supabase.from('grades').delete().in('exam_id', examIds)
      await supabase.from('violations').delete().in('exam_id', examIds)
      await supabase.from('proctoring_events').delete().in('exam_id', examIds)
      await supabase.from('certificates').delete().in('exam_id', examIds)
      await supabase.from('exams').delete().eq('candidate_id', userId)
    }
    const { error } = await supabase.from('users').delete().eq('id', userId)
    if (error) alert('Error deleting user: ' + error.message)
    setSaving(false)
    loadUsers()
  }

  async function saveOrg() {
    if (!orgForm.name) return
    setSaving(true)
    await supabase.from('organizations').insert(orgForm)
    setSaving(false)
    setShowOrgForm(false)
    setOrgForm({ name:'', contact_email:'', subscription_type:'pay-as-you-go', credit_balance:0 })
    loadOrgs()
  }

  async function assignExam(userId: string, templateId: string) {
    if (!templateId) return
    await supabase.from('exams').insert({
      candidate_id: userId,
      template_id: templateId,
      status: 'pending'
    })
    alert('Exam assigned successfully!')
  }

  const filtered = users.filter(u => {
    const matchSearch = !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const inp = (extra={}) => ({padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--bdr)',fontSize:'13px',width:'100%',fontFamily:'var(--fb)',...extra} as any)

  return (
    <div style={{minHeight:'100vh',background:'var(--off)',fontFamily:'var(--fb)'}}>
      {/* Header */}
      <div style={{background:'#fff',padding:'14px 28px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <a href="/admin" style={{fontSize:'13px',color:'var(--sky)',textDecoration:'none'}}>← Admin</a>
          <span style={{color:'var(--bdr)'}}>|</span>
          <h1 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',margin:0}}>User Management</h1>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={()=>setShowOrgForm(true)} style={{padding:'9px 16px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'13px',fontWeight:600,color:'var(--navy)',cursor:'pointer',fontFamily:'var(--fb)'}}>+ Add Organization</button>
          <button onClick={()=>setShowInvite(true)} style={{padding:'9px 18px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>+ Add User</button>
        </div>
      </div>

      <div style={{padding:'24px 28px'}}>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'10px',marginBottom:'22px'}}>
          {ROLES.map(r=>(
            <div key={r} style={{background:'#fff',borderRadius:'10px',padding:'14px',border:'1px solid var(--bdr)',textAlign:'center',cursor:'pointer',borderTop:'3px solid '+ROLE_COLORS[r]}} onClick={()=>setRoleFilter(r===roleFilter?'all':r)}>
              <div style={{fontSize:'11px',color:'var(--t3)',marginBottom:'4px',textTransform:'capitalize'}}>{ROLE_LABELS[r]}</div>
              <div style={{fontSize:'22px',fontWeight:700,color:ROLE_COLORS[r],fontFamily:'var(--fm)'}}>{stats[r]||0}</div>
            </div>
          ))}
        </div>

        {/* Add Organization Form */}
        {showOrgForm && (
          <div style={{background:'#fff',borderRadius:'14px',padding:'22px',border:'2px solid var(--sky)',marginBottom:'18px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'16px'}}>
              <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',margin:0}}>Add Organization</h3>
              <button onClick={()=>setShowOrgForm(false)} style={{padding:'4px 10px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'12px',color:'var(--t2)',fontFamily:'var(--fb)'}}>Cancel</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
              <div>
                <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Organization Name *</label>
                <input value={orgForm.name} onChange={e=>setOrgForm({...orgForm,name:e.target.value})} placeholder="e.g. Turkish Airlines" style={inp()} />
              </div>
              <div>
                <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Contact Email</label>
                <input value={orgForm.contact_email} onChange={e=>setOrgForm({...orgForm,contact_email:e.target.value})} placeholder="hr@airline.com" style={inp()} />
              </div>
              <div>
                <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Subscription Type</label>
                <select value={orgForm.subscription_type} onChange={e=>setOrgForm({...orgForm,subscription_type:e.target.value})} style={inp()}>
                  <option value="pay-as-you-go">Pay as you go</option>
                  <option value="credit_wallet">Credit Wallet</option>
                  <option value="unlimited">Unlimited</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Initial Credits</label>
                <input type="number" value={orgForm.credit_balance} onChange={e=>setOrgForm({...orgForm,credit_balance:+e.target.value})} min={0} style={inp()} />
              </div>
            </div>
            <button onClick={saveOrg} disabled={saving||!orgForm.name} style={{padding:'9px 24px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
              {saving?'Saving...':'Save Organization'}
            </button>
          </div>
        )}

        {/* Add User Form */}
        {showInvite && (
          <div style={{background:'#fff',borderRadius:'14px',padding:'22px',border:'2px solid var(--sky)',marginBottom:'18px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'16px'}}>
              <div>
                <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',margin:0,marginBottom:'3px'}}>Add User</h3>
                <p style={{fontSize:'12px',color:'var(--t3)',margin:0}}>Create user profile. Use Supabase Auth to set their password.</p>
              </div>
              <button onClick={()=>setShowInvite(false)} style={{padding:'4px 10px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'12px',color:'var(--t2)',fontFamily:'var(--fb)'}}>Cancel</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'14px'}}>
              <div>
                <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Full Name</label>
                <input value={inviteForm.full_name} onChange={e=>setInviteForm({...inviteForm,full_name:e.target.value})} placeholder="John Smith" style={inp()} />
              </div>
              <div>
                <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Email *</label>
                <input type="email" value={inviteForm.email} onChange={e=>setInviteForm({...inviteForm,email:e.target.value})} placeholder="user@airline.com" style={inp()} />
              </div>
              <div>
                <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Role *</label>
                <select value={inviteForm.role} onChange={e=>setInviteForm({...inviteForm,role:e.target.value})} style={inp()}>
                  {ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Organization</label>
                <select value={inviteForm.org_id} onChange={e=>setInviteForm({...inviteForm,org_id:e.target.value})} style={inp()}>
                  <option value="">— No organization —</option>
                  {orgs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{background:'#FEF9C3',borderRadius:'8px',padding:'10px 14px',marginBottom:'14px',fontSize:'12.5px',color:'#713F12'}}>
              ⚠️ After adding the user profile here, go to <strong>Supabase → Authentication → Users → Invite user</strong> to send them a login link, or create their password manually.
            </div>
            <button onClick={inviteUser} disabled={saving||!inviteForm.email} style={{padding:'9px 24px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
              {saving?'Saving...':'Add User'}
            </button>
          </div>
        )}

        {/* Edit User Modal */}
        {editUser && (
          <div style={{background:'#fff',borderRadius:'14px',padding:'22px',border:'2px solid var(--sky)',marginBottom:'18px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'16px'}}>
              <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',margin:0}}>Edit User — {editUser.email}</h3>
              <button onClick={()=>setEditUser(null)} style={{padding:'4px 10px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'12px',color:'var(--t2)',fontFamily:'var(--fb)'}}>Cancel</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'14px'}}>
              <div>
                <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Full Name</label>
                <input value={editUser.full_name||''} onChange={e=>setEditUser({...editUser,full_name:e.target.value})} style={inp()} />
              </div>
              <div>
                <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Role</label>
                <select value={editUser.role} onChange={e=>setEditUser({...editUser,role:e.target.value})} style={inp()}>
                  {ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:'12px',fontWeight:600,color:'var(--t2)',display:'block',marginBottom:'5px'}}>Organization</label>
                <select value={editUser.org_id||''} onChange={e=>setEditUser({...editUser,org_id:e.target.value||null})} style={inp()}>
                  <option value="">— None —</option>
                  {orgs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:'10px',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={()=>updateUser(editUser.id,{full_name:editUser.full_name,role:editUser.role,org_id:editUser.org_id})} disabled={saving} style={{padding:'9px 24px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                  {saving?'Saving...':'Update User'}
                </button>
                <button onClick={()=>setEditUser(null)} style={{padding:'9px 18px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',color:'var(--t2)',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Cancel</button>
              </div>
              {editUser.role !== 'super_admin' && (
                <button onClick={()=>{setEditUser(null);deleteUser(editUser.id,editUser.email)}} style={{padding:'9px 18px',borderRadius:'8px',border:'1.5px solid #FECACA',background:'#FEF2F2',color:'#DC2626',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Delete User</button>
              )}
            </div>
            <div style={{display:'none'}}>
              {editUser.role === 'candidate' && (
                <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                  <select id="templateSelect" style={{...inp({width:'220px'})}} defaultValue="">
                    <option value="">Assign exam template...</option>
                    {/* Templates loaded separately */}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{display:'flex',gap:'10px',marginBottom:'16px',alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email..." style={{...inp({width:'280px',flex:'none'})}} />
          <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{...inp({width:'160px',flex:'none'})}}>
            <option value="all">All roles</option>
            {ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <span style={{fontSize:'12.5px',color:'var(--t3)'}}>{filtered.length} users</span>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{textAlign:'center',padding:'40px',color:'var(--t3)'}}>Loading users...</div>
        ) : (
          <div style={{background:'#fff',borderRadius:'14px',border:'1px solid var(--bdr)',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'var(--off)',borderBottom:'1px solid var(--bdr)'}}>
                  {['User','Role','Organization','Joined','Actions'].map(h=>(
                    <th key={h} style={{padding:'11px 16px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.4px'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u,i)=>(
                  <tr key={u.id} style={{borderBottom:'1px solid var(--bdr)',background:i%2===0?'#fff':'#FAFBFC'}}>
                    <td style={{padding:'12px 16px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <div style={{width:'34px',height:'34px',borderRadius:'50%',background:ROLE_COLORS[u.role]+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:ROLE_COLORS[u.role],flexShrink:0}}>
                          {(u.full_name||u.email||'?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{fontSize:'13.5px',fontWeight:600,color:'var(--navy)'}}>{u.full_name||'—'}</div>
                          <div style={{fontSize:'12px',color:'var(--t3)'}}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding:'12px 16px'}}>
                      <span style={{fontSize:'11.5px',fontWeight:700,padding:'3px 9px',borderRadius:'100px',background:ROLE_COLORS[u.role]+'15',color:ROLE_COLORS[u.role],textTransform:'capitalize'}}>{ROLE_LABELS[u.role]||u.role}</span>
                    </td>
                    <td style={{padding:'12px 16px',fontSize:'13px',color:'var(--t2)'}}>{u.organizations?.name||'—'}</td>
                    <td style={{padding:'12px 16px',fontSize:'12px',color:'var(--t3)'}}>{u.created_at?new Date(u.created_at).toLocaleDateString('en-GB'):'—'}</td>
                    <td style={{padding:'12px 16px'}}>
                      <div style={{display:'flex',gap:'6px'}}>
                        <button onClick={()=>setEditUser({...u})} style={{padding:'4px 10px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11.5px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)'}}>Edit</button>
                        {u.role==='candidate'&&(
                          <a href={`/admin/users/${u.id}/assign-exam`} style={{padding:'4px 10px',borderRadius:'6px',border:'1.5px solid #BBF7D0',background:'#F0FDF4',fontSize:'11.5px',fontWeight:600,color:'#14532D',textDecoration:'none',display:'inline-block'}}>Assign Exam</a>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{padding:'40px',textAlign:'center',color:'var(--t3)',fontSize:'13.5px'}}>No users found matching your filters.</div>
            )}
          </div>
        )}

        {/* Organizations section */}
        <div style={{marginTop:'28px'}}>
          <h2 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'var(--navy)',marginBottom:'14px'}}>Organizations ({orgs.length})</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}>
            {orgs.map(o=>(
              <div key={o.id} style={{background:'#fff',borderRadius:'12px',padding:'16px',border:'1px solid var(--bdr)'}}>
                <div style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',marginBottom:'4px'}}>{o.name}</div>
                <div style={{fontSize:'12px',color:'var(--t3)',marginBottom:'8px'}}>{o.contact_email||'No email'}</div>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                  <span style={{fontSize:'11px',fontWeight:600,padding:'2px 8px',borderRadius:'100px',background:'#EAF3DE',color:'#27500A',textTransform:'capitalize'}}>{o.subscription_type?.replace(/_/g,' ')}</span>
                  <span style={{fontSize:'11px',fontWeight:600,padding:'2px 8px',borderRadius:'100px',background:'var(--sky3)',color:'var(--sky)'}}>{o.credit_balance} credits</span>
                  <span style={{fontSize:'11px',fontWeight:600,padding:'2px 8px',borderRadius:'100px',background:'#F1EFE8',color:'#5F5E5A'}}>{users.filter(u=>u.org_id===o.id).length} users</span>
                </div>
              </div>
            ))}
            {orgs.length===0&&<div style={{gridColumn:'1/-1',padding:'32px',textAlign:'center',background:'#fff',borderRadius:'12px',border:'1px solid var(--bdr)',color:'var(--t3)',fontSize:'13.5px'}}>No organizations yet. Add your first client above.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
