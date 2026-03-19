'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import OrganizationList from '../components/OrganizationList'

export default function OrganizationsPage() {
  const [orgList, setOrgList] = useState<any[]>([])
  const [oLoading, setOLoading] = useState(false)
  const [oPage, setOPage] = useState(0)
  const [oTotal, setOTotal] = useState(0)
  const [oSearch, setOSearch] = useState('')

  // Modal/Form State
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [orgStep, setOrgStep] = useState(1)
  const [detailOrg, setDetailOrg] = useState<any>(null)
  const [editOrg, setEditOrg] = useState<any>(null)
  const [formOrg, setFormOrg] = useState({
    name:'', domain:'', logo_url:'', contact_person:'', contact_email:'', contract_end_date:''
  })
  const [saving, setSaving] = useState(false)

  // Del Confirm State
  const [showDelConfirm, setShowDelConfirm] = useState(false)
  const [delItems, setDelItems] = useState<any[]>([])
  const [delInput, setDelInput] = useState('')

  const inp = (extra:any={}) => ({
    padding:'10px 14px', borderRadius:'10px', border:'1.5px solid var(--bdr)', 
    fontSize:'13.5px', fontWeight:600, color:'var(--navy)', outline:'none',
    background:'#fff', transition:'all 0.2s', fontFamily:'var(--fb)',
    ...extra
  })

  useEffect(() => {
    loadOrgs()
  }, [oPage])

  async function loadOrgs(page = oPage, search = oSearch) {
    setOLoading(true)
    let query = supabase.from('organizations').select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(page * 20, (page + 1) * 20 - 1)
    
    if (search) query = query.ilike('name', `%${search}%`)
    
    const { data, count, error } = await query
    if (error) console.error("LoadOrgs Error:", error.message)
    setOrgList(data || [])
    setOTotal(count || 0)
    setOLoading(false)
  }

  const resetForm = () => {
    setEditOrg(null); 
    setFormOrg({ name:'', domain:'', logo_url:'', contact_person:'', contact_email:'', contract_end_date:'' });
  }

  const saveOrg = async () => {
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
      setShowOrgForm(false); setEditOrg(null); loadOrgs(); resetForm();
    }
    setSaving(false)
  }

  const startEditOrg = (o: any) => {
    setEditOrg(o)
    setFormOrg({ name: o.name, domain: o.domain||'', logo_url: o.logo_url||'', contact_person: o.contact_person||'', contact_email: o.contact_email||'', contract_end_date: o.contract_end_date||'' })
    setShowOrgForm(true); setOrgStep(1); setDetailOrg(null)
  }

  const startSingleDeleteOrg = (o: any) => {
    setDelItems([{ ...o, _id:o.id, _type:'org', _display:o.name }])
    setDelInput(''); setShowDelConfirm(true)
  }

  const finalDelete = async () => {
    if (delItems.length > 5 && delInput !== 'DELETE') return
    const ids = delItems.map(i=>i._id || i.id) 
    await supabase.from('organizations').delete().in('id', ids)
    setShowDelConfirm(false); setDelItems([]); setDelInput(''); loadOrgs()
  }

  return (
    <div style={{ position: 'relative' }}>
      <OrganizationList 
        orgList={orgList} oLoading={oLoading} oSearch={oSearch} oTotal={oTotal} oPage={oPage}
        setOSearch={setOSearch} setOPage={setOPage}
        loadOrgs={() => loadOrgs(0)}
        setEditOrg={setEditOrg} setFormOrg={setFormOrg} setShowOrgForm={setShowOrgForm} setDetailOrg={setDetailOrg}
        setOrgStep={setOrgStep} startEditOrg={startEditOrg} startSingleDeleteOrg={startSingleDeleteOrg}
      />

      {/* MODALS */}
      {showDelConfirm && (
        <div style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(12,31,63,0.4)',backdropFilter:'blur(4px)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:'32px',borderRadius:'20px',width:'440px',boxShadow:'0 20px 50px rgba(0,0,0,0.2)'}}>
            <h3 style={{margin:'0 0 10px 0',fontSize:'20px',fontWeight:800,color:'var(--navy)'}}>Delete Organization?</h3>
            <p style={{fontSize:'14px',color:'var(--t3)',marginBottom:'24px'}}>Are you sure you want to remove "{delItems[0]?._display}"?</p>
            <div style={{display:'flex',gap:'12px'}}>
              <button onClick={()=>setShowDelConfirm(false)} style={{flex:1,padding:'12px',borderRadius:'10px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>Cancel</button>
              <button onClick={finalDelete} style={{flex:1,padding:'12px',borderRadius:'10px',border:'none',background:'#DC2626',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {(showOrgForm || detailOrg) && (
        <>
          <div onClick={() => { setShowOrgForm(false); setDetailOrg(null); resetForm(); }} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(12,31,63,0.4)',backdropFilter:'blur(4px)',zIndex:1100}} />
          <div style={{position:'fixed',top:0,right:0,width:'640px',height:'100%',background:'#fff',zIndex:1101,boxShadow:'-10px 0 50px rgba(0,0,0,0.15)',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'24px',borderBottom:'1px solid var(--bdr)',background:'var(--off)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{fontSize:'16px',fontWeight:800,color:'var(--navy)',margin:0}}>{showOrgForm ? (editOrg ? 'Edit Organization' : 'New Organization') : 'Organization Profile'}</h3>
              <button onClick={() => { setShowOrgForm(false); setDetailOrg(null); resetForm(); }} style={{background:'none',border:'none',fontSize:'24px',cursor:'pointer',color:'var(--t3)'}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'24px'}}>
              {showOrgForm ? (
                <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                  <div style={{display:'flex',gap:'4px',marginBottom:'12px'}}>
                    {[1,2].map(s=>(<div key={s} style={{flex:1,height:'4px',borderRadius:'2px',background:orgStep>=s?'var(--navy)':'var(--bdr)'}} />))}
                  </div>
                  {orgStep === 1 ? (
                    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                      <div>
                        <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Company Name *</label>
                        <input value={formOrg.name} onChange={e=>setFormOrg({...formOrg,name:e.target.value})} style={inp({width:'100%'})} />
                      </div>
                      <div>
                        <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Domain</label>
                        <input value={formOrg.domain} onChange={e=>setFormOrg({...formOrg,domain:e.target.value})} placeholder="globalair.com" style={inp({width:'100%'})} />
                      </div>
                    </div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                      <div>
                        <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Contact Person</label>
                        <input value={formOrg.contact_person} onChange={e=>setFormOrg({...formOrg,contact_person:e.target.value})} style={inp({width:'100%'})} />
                      </div>
                      <div>
                        <label style={{fontSize:'11px',fontWeight:700,color:'var(--t2)',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Contract End Date</label>
                        <input type="date" value={formOrg.contract_end_date} onChange={e=>setFormOrg({...formOrg,contract_end_date:e.target.value})} style={inp({width:'100%'})} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                    <div style={{width:'64px',height:'64px',borderRadius:'12px',background:'var(--off)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',border:'1px solid var(--bdr)'}}>🏢</div>
                    <div>
                      <h4 style={{margin:0,fontSize:'18px',fontWeight:800,color:'var(--navy)'}}>{detailOrg.name}</h4>
                      <div style={{fontSize:'12px',color:'var(--t3)'}}>{detailOrg.domain || 'No domain registered'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div style={{padding:'24px',borderTop:'1px solid var(--bdr)',background:'#fafafa',display:'flex',justifyContent:'flex-end',gap:'10px'}}>
              <button onClick={()=>{setShowOrgForm(false);setDetailOrg(null);resetForm();}} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>Close</button>
              {showOrgForm && orgStep === 1 && <button onClick={()=>setOrgStep(2)} style={{padding:'10px 30px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Next</button>}
              {showOrgForm && orgStep === 2 && <button onClick={()=>setOrgStep(1)} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid var(--navy)',background:'#fff',color:'var(--navy)',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Back</button>}
              {showOrgForm && orgStep === 2 && <button onClick={saveOrg} disabled={saving} style={{padding:'10px 30px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer',opacity:saving?0.5:1}}>{saving?'Saving...':'Save Changes'}</button>}
              {detailOrg && !showOrgForm && (
                <div style={{display:'flex',gap:'10px'}}>
                  <button onClick={()=>{startEditOrg(detailOrg)}} style={{padding:'10px 30px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Edit</button>
                  <button onClick={()=>startSingleDeleteOrg(detailOrg)} style={{padding:'10px 20px',borderRadius:'8px',border:'1.5px solid #FECACA',background:'#FEF2F2',color:'#DC2626',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Delete</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
