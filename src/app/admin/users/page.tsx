'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import UsersList from '../components/UsersList'

export default function UsersPage() {
  const [userList, setUserList] = useState<any[]>([])
  const [uLoading, setULoading] = useState(false)
  const [uTotal, setUTotal] = useState(0)
  const [uPage, setUPage] = useState(0)
  const [uSearch, setUSearch] = useState('')
  const [orgList, setOrgList] = useState<any[]>([])

  // Modal/Form State
  const [showUserForm, setShowUserForm] = useState(false)
  const [detailUser, setDetailUser] = useState<any>(null)
  const [editUser, setEditUser] = useState<any>(null)
  const [formUser, setFormUser] = useState({
    full_name:'', email:'', role:'candidate', org_id:'', phone:'', country:''
  })
  const [saving, setSaving] = useState(false)

  // Del Confirm State
  const [showDelConfirm, setShowDelConfirm] = useState(false)
  const [delItems, setDelItems] = useState<any[]>([])
  const [delInput, setDelInput] = useState('')

  useEffect(() => {
    loadUsers()
    loadOrgs()
  }, [uPage])

  async function loadUsers(page = uPage, search = uSearch) {
    setULoading(true)
    let query = supabase.from('users').select('*, organizations(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * 20, (page + 1) * 20 - 1)
    
    if (search) query = query.ilike('full_name', `%${search}%`)
    
    const { data, count, error } = await query
    if (error) console.error("LoadUsers Error:", error.message)
    setUserList(data || [])
    setUTotal(count || 0)
    setULoading(false)
  }

  async function loadOrgs() {
    const { data } = await supabase.from('organizations').select('id, name').order('name')
    setOrgList(data || [])
  }

  const resetForm = () => {
    setEditUser(null); 
    setFormUser({ full_name:'', email:'', role:'candidate', org_id:'', phone:'', country:'' });
  }

  const saveUser = async () => {
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
      setShowUserForm(false); setEditUser(null); loadUsers(); resetForm();
    }
    setSaving(false)
  }

  const startEditUser = (u: any) => {
    setEditUser(u)
    setFormUser({ full_name: u.full_name, email: u.email, role: u.role, org_id: u.org_id||'', phone: u.phone||'', country: u.country||'' })
    setShowUserForm(true); setDetailUser(null)
  }

  const startSingleDeleteUser = (u: any) => {
    setDelItems([{ ...u, _id:u.id, _type:'user', _display:u.full_name }])
    setDelInput(''); setShowDelConfirm(true)
  }

  const finalDelete = async () => {
    if (delItems.length > 5 && delInput !== 'DELETE') return
    const ids = delItems.map(i=>i._id || i.id) 
    await supabase.from('users').delete().in('id', ids)
    setShowDelConfirm(false); setDelItems([]); setDelInput(''); loadUsers()
  }

  const inp = (extra:any={}) => ({
    padding:'10px 14px', borderRadius:'10px', border:'1.5px solid var(--bdr)', 
    fontSize:'13.5px', fontWeight:600, color:'var(--navy)', outline:'none',
    background:'#fff', transition:'all 0.2s', fontFamily:'var(--fb)',
    ...extra
  })

  return (
    <div style={{ position: 'relative' }}>
      <UsersList 
        userList={userList} uLoading={uLoading} uSearch={uSearch} uTotal={uTotal} uPage={uPage}
        setUSearch={setUSearch} setUPage={setUPage}
        loadUsers={() => loadUsers(0)}
        setEditUser={setEditUser} setFormUser={setFormUser} setShowUserForm={setShowUserForm} setDetailUser={setDetailUser}
      />

      {/* MODALS */}
      {showDelConfirm && (
        <div style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(12,31,63,0.4)',backdropFilter:'blur(4px)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:'32px',borderRadius:'20px',width:'440px',boxShadow:'0 20px 50px rgba(0,0,0,0.2)'}}>
            <h3 style={{margin:'0 0 10px 0',fontSize:'20px',fontWeight:800,color:'var(--navy)'}}>Delete User?</h3>
            <p style={{fontSize:'14px',color:'var(--t3)',marginBottom:'24px'}}>Are you sure you want to remove "{delItems[0]?._display}"?</p>
            <div style={{display:'flex',gap:'12px'}}>
              <button onClick={()=>setShowDelConfirm(false)} style={{flex:1,padding:'12px',borderRadius:'10px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>Cancel</button>
              <button onClick={finalDelete} style={{flex:1,padding:'12px',borderRadius:'10px',border:'none',background:'#DC2626',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {(showUserForm || detailUser) && (
        <>
          <div onClick={() => { setShowUserForm(false); setDetailUser(null); resetForm(); }} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(12,31,63,0.4)',backdropFilter:'blur(4px)',zIndex:1100}} />
          <div style={{position:'fixed',top:0,right:0,width:'640px',height:'100%',background:'#fff',zIndex:1101,boxShadow:'-10px 0 50px rgba(0,0,0,0.15)',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'24px',borderBottom:'1px solid var(--bdr)',background:'var(--off)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{fontSize:'16px',fontWeight:800,color:'var(--navy)',margin:0}}>{showUserForm ? (editUser ? 'Edit User' : 'New User') : 'User Details'}</h3>
              <button onClick={() => { setShowUserForm(false); setDetailUser(null); resetForm(); }} style={{background:'none',border:'none',fontSize:'24px',cursor:'pointer',color:'var(--t3)'}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'24px'}}>
              {showUserForm ? (
                <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                  <div>
                    <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Full Name *</label>
                    <input value={formUser.full_name} onChange={e=>setFormUser({...formUser,full_name:e.target.value})} style={inp({width:'100%'})} />
                  </div>
                  <div>
                    <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Email *</label>
                    <input value={formUser.email} onChange={e=>setFormUser({...formUser,email:e.target.value})} style={inp({width:'100%'})} />
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                    <div>
                      <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Role</label>
                      <select value={formUser.role} onChange={e=>setFormUser({...formUser,role:e.target.value})} style={inp({width:'100%'})}>
                        {['candidate','evaluator','instructor','hr_manager','super_admin'].map(r=><option key={r} value={r}>{r.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Organization</label>
                      <select value={formUser.org_id} onChange={e=>setFormUser({...formUser,org_id:e.target.value})} style={inp({width:'100%'})}>
                        <option value="">None</option>
                        {orgList.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
                   <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                    <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'var(--navy)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',fontWeight:800}}>{detailUser.full_name?.charAt(0)}</div>
                    <div>
                      <h4 style={{margin:0,fontSize:'18px',fontWeight:800,color:'var(--navy)'}}>{detailUser.full_name}</h4>
                      <div style={{fontSize:'12px',color:'var(--t3)'}}>{detailUser.email}</div>
                    </div>
                  </div>
                  <div style={{padding:'12px',borderRadius:'10px',background:'var(--off)',border:'1px solid var(--bdr)'}}>
                    <div style={{fontSize:'10px',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',marginBottom:'4px'}}>Role</div>
                    <div style={{fontSize:'13px',fontWeight:700,color:'var(--navy)'}}>{detailUser.role?.toUpperCase()}</div>
                  </div>
                </div>
              )}
            </div>
            <div style={{padding:'24px',borderTop:'1px solid var(--bdr)',background:'#fafafa',display:'flex',justifyContent:'flex-end',gap:'10px'}}>
              <button onClick={()=>{setShowUserForm(false);setDetailUser(null);resetForm();}} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>Close</button>
              {showUserForm && <button onClick={saveUser} disabled={saving} style={{padding:'10px 30px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer',opacity:saving?0.5:1}}>{saving?'Saving...':'Save Changes'}</button>}
              {detailUser && !showUserForm && (
                <div style={{display:'flex',gap:'10px'}}>
                  <button onClick={()=>{startEditUser(detailUser)}} style={{padding:'10px 30px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Edit</button>
                  <button onClick={()=>startSingleDeleteUser(detailUser)} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid #FECACA',background:'#FEF2F2',color:'#DC2626',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Delete</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
