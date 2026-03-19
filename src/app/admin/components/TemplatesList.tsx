'use client'

interface TemplatesListProps {
  templates: any[]
  tLoading: boolean
  sections: string[]
  sectionColors: Record<string, string>
  cefrLevels: string[]
  setShowTemplateForm: (v: boolean) => void
  duplicateTemplate: (t: any) => void
  startSingleDeleteTemplate: (t: any) => void
}

export default function TemplatesList({ 
  templates, tLoading, sections, sectionColors, cefrLevels, 
  setShowTemplateForm, duplicateTemplate, startSingleDeleteTemplate 
}: TemplatesListProps) {
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px'}}>
        <div>
          <h2 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',margin:0,marginBottom:'2px'}}>Exam Templates</h2>
          <p style={{fontSize:'12px',color:'var(--t3)',margin:0}}>Configure section order, counts, weights and timers.</p>
        </div>
        <a href="/admin/exam-wizard" style={{padding:'9px 16px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)',textDecoration:'none',display:'inline-block'}}>+ New Exam (Wizard)</a>
      </div>

      {tLoading ? (
        <div style={{textAlign:'center',padding:'32px',color:'var(--t3)'}}>Loading...</div>
      ) : templates.length === 0 ? (
        <div style={{background:'#fff',borderRadius:'12px',padding:'40px',border:'1px solid var(--bdr)',textAlign:'center'}}>
          <div style={{fontSize:'28px',marginBottom:'8px'}}>📋</div>
          <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',marginBottom:'5px'}}>No templates yet</h3>
          <button onClick={()=>setShowTemplateForm(true)} style={{padding:'9px 18px',borderRadius:'7px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>+ New Template</button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
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
                  <a href={`/admin/exam-wizard?edit=${t.id}`} style={{padding:'4px 10px',borderRadius:'5px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',fontSize:'11px',fontWeight:600,color:'var(--navy)',fontFamily:'var(--fb)',textDecoration:'none'}}>Edit</a>
                  <button onClick={()=>startSingleDeleteTemplate(t)} style={{padding:'4px 10px',borderRadius:'5px',border:'1.5px solid #FECACA',background:'#FEF2F2',cursor:'pointer',fontSize:'11px',fontWeight:600,color:'#DC2626',fontFamily:'var(--fb)'}}>Delete</button>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px'}}>
                {sections.filter(s=>(t[`${s}_count`]||0)>0).map(s=>(
                  <div key={s} style={{padding:'8px',borderRadius:'7px',background:sectionColors[s]+'10',border:'1px solid '+sectionColors[s]+'25',textAlign:'center'}}>
                    <div style={{fontSize:'10px',fontWeight:700,color:sectionColors[s],textTransform:'capitalize',marginBottom:'2px'}}>{s}</div>
                    <div style={{fontSize:'16px',fontWeight:700,color:'var(--navy)',fontFamily:'var(--fm)'}}>{t[`${s}_count`]}</div>
                    <div style={{fontSize:'10.5px',fontWeight:700,color:sectionColors[s]}}>{t[`weight_${s}`]}%</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
