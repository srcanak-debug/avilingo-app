'use client'

interface OrganizationListProps {
  orgList: any[]
  oLoading: boolean
  setEditOrg: (o: any) => void
  setFormOrg: (f: any) => void
  setShowOrgForm: (v: boolean) => void
  setDetailOrg: (o: any) => void
  setOrgStep: (s: number) => void
  startEditOrg: (o: any) => void
  startSingleDeleteOrg: (o: any) => void
}

export default function OrganizationList({ 
  orgList, oLoading, setEditOrg, setFormOrg, setShowOrgForm, setDetailOrg, setOrgStep, startEditOrg, startSingleDeleteOrg 
}: OrganizationListProps) {
  return (
    <div style={{animation:'drawerSlideIn 0.4s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'24px'}}>
        <div>
          <h2 style={{fontFamily:'var(--fm)',fontSize:'22px',fontWeight:900,color:'var(--navy)',margin:'0 0 4px 0'}}>Organizations & Partners</h2>
          <p style={{fontSize:'13px',color:'var(--t3)',margin:0}}>B2B Airline and Corporate clients.</p>
        </div>
        <button onClick={()=>{setEditOrg(null);setFormOrg({name:'',domain:'',logo_url:'',contact_person:'',contact_email:'',contract_end_date:''});setShowOrgForm(true)}} style={{padding:'10px 20px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)'}}>+ Add Company</button>
      </div>

      {oLoading && orgList.length === 0 ? <div style={{padding:'40px',textAlign:'center',color:'var(--t3)'}}>Loading organizations...</div> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:'20px'}}>
          {orgList.map(o => (
            <div key={o.id} onClick={()=>{setDetailOrg(o);setShowOrgForm(false)}} style={{background:'#fff',borderRadius:'16px',padding:'20px',border:'1px solid var(--bdr)',cursor:'pointer',transition:'all 0.2s', position:'relative'}} >
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
                <div style={{width:'48px',height:'48px',borderRadius:'10px',background:'var(--off)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',border:'1px solid var(--bdr)'}}>
                  {o.logo_url ? <img alt={o.name} src={o.logo_url} style={{maxWidth:'100%',maxHeight:'100%',borderRadius:'8px'}} /> : '🏢'}
                </div>
                <div>
                  <div style={{fontWeight:800,color:'var(--navy)',fontSize:'15px'}}>{o.name}</div>
                  <div style={{fontSize:'11.5px',color:'var(--t3)'}}>{o.domain || 'no domain'}</div>
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'var(--t2)',fontWeight:600}}>
                <span>Contract Ends:</span>
                <span style={{color:new Date(o.contract_end_date) < new Date() ? '#ef4444' : 'var(--navy)'}}>{o.contract_end_date ? new Date(o.contract_end_date).toLocaleDateString() : '---'}</span>
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'12px',borderTop:'1px solid var(--bdr)',paddingTop:'12px'}}>
                <button onClick={(e)=>{e.stopPropagation();startEditOrg(o);setOrgStep(1)}} style={{flex:1,padding:'6px',borderRadius:'6px',border:'1.5px solid var(--bdr)',background:'#fff',fontSize:'11px',fontWeight:700,color:'var(--navy)',cursor:'pointer',fontFamily:'var(--fb)'}}>Edit</button>
                <button onClick={(e)=>{e.stopPropagation();startSingleDeleteOrg(o)}} style={{padding:'6px 12px',borderRadius:'6px',border:'1.5px solid #FECACA',background:'#FEF2F2',fontSize:'11px',fontWeight:700,color:'#DC2626',cursor:'pointer',fontFamily:'var(--fb)'}}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {orgList.length === 0 && !oLoading && <div style={{padding:'60px',textAlign:'center',color:'var(--t3)',fontSize:'14px'}}>No organizations found.</div>}
    </div>
  )
}
