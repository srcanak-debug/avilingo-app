'use client'

interface UsersListProps {
  userList: any[]
  uLoading: boolean
  uSearch: string
  setUSearch: (v: string) => void
  loadUsers: (page: number, search: string) => void
  setEditUser: (u: any) => void
  setFormUser: (f: any) => void
  setShowUserForm: (v: boolean) => void
  setDetailUser: (u: any) => void
}

export default function UsersList({ userList, uLoading, uSearch, setUSearch, loadUsers, setEditUser, setFormUser, setShowUserForm, setDetailUser }: UsersListProps) {
  const inp = (extra:any={}) => ({
    padding:'10px 14px', borderRadius:'10px', border:'1.5px solid var(--bdr)', 
    fontSize:'13.5px', fontWeight:600, color:'var(--navy)', outline:'none',
    background:'#fff', transition:'all 0.2s', fontFamily:'var(--fb)',
    ...extra
  })

  return (
    <div style={{animation:'drawerSlideIn 0.4s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'24px'}}>
        <div>
          <h2 style={{fontFamily:'var(--fm)',fontSize:'22px',fontWeight:900,color:'var(--navy)',margin:'0 0 4px 0'}}>Candidates & Users</h2>
          <p style={{fontSize:'13px',color:'var(--t3)',margin:0}}>Manage exam candidates, assessors, and staff.</p>
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <div style={{position:'relative'}}>
            <input value={uSearch} onChange={e=>{setUSearch(e.target.value); loadUsers(0, e.target.value)}} placeholder="Search users..." style={{...inp({padding:'9px 12px 9px 34px',width:'220px',fontSize:'13px'})}} />
            <span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'14px',color:'var(--t3)'}}>🔍</span>
          </div>
          <button onClick={()=>{setEditUser(null);setFormUser({full_name:'',email:'',role:'candidate',org_id:'',phone:'',country:''});setShowUserForm(true)}} style={{padding:'10px 20px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)'}}>+ New User</button>
        </div>
      </div>

      {uLoading && userList.length === 0 ? <div style={{padding:'40px',textAlign:'center',color:'var(--t3)'}}>Loading users...</div> : (
        <div style={{background:'#fff',borderRadius:'16px',border:'1px solid var(--bdr)',overflow:'hidden',boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
            <thead>
              <tr style={{background:'var(--off)',borderBottom:'1px solid var(--bdr)'}}>
                <th style={{padding:'14px 20px',textAlign:'left',fontWeight:800,color:'var(--t2)',textTransform:'uppercase',fontSize:'10px'}}>Name & Role</th>
                <th style={{padding:'14px 20px',textAlign:'left',fontWeight:800,color:'var(--t2)',textTransform:'uppercase',fontSize:'10px'}}>Organization</th>
                <th style={{padding:'14px 20px',textAlign:'left',fontWeight:800,color:'var(--t2)',textTransform:'uppercase',fontSize:'10px'}}>Contact</th>
                <th style={{padding:'14px 20px',textAlign:'right',fontWeight:800,color:'var(--t2)',textTransform:'uppercase',fontSize:'10px'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userList.map(u => (
                <tr key={u.id} style={{borderBottom:'1px solid var(--voff)'}}>
                  <td style={{padding:'14px 20px'}}>
                    <div style={{fontWeight:800,color:'var(--navy)',fontSize:'14px'}}>{u.full_name}</div>
                    <div style={{fontSize:'10.5px',fontWeight:700,color:u.role==='super_admin'?'#7c3aed':u.role==='evaluator'?'#0891b2':'#64748b',textTransform:'capitalize'}}>{u.role.replace('_',' ')}</div>
                  </td>
                  <td style={{padding:'14px 20px'}}>
                    <div style={{fontWeight:600,color:'var(--t2)'}}>{u.organizations?.name || '---'}</div>
                  </td>
                  <td style={{padding:'14px 20px'}}>
                    <div style={{color:'var(--t2)'}}>{u.email}</div>
                    <div style={{fontSize:'11px',color:'var(--t3)'}}>{u.phone || u.country || ''}</div>
                  </td>
                  <td style={{padding:'14px 20px',textAlign:'right'}}>
                    <button onClick={()=>{setDetailUser(u);setShowUserForm(false)}} style={{padding:'6px 12px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'11px',fontWeight:700,color:'var(--navy)',cursor:'pointer'}}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {userList.length === 0 && <div style={{padding:'60px',textAlign:'center',color:'var(--t3)',fontSize:'14px'}}>No users matched your request.</div>}
        </div>
      )}
    </div>
  )
}
