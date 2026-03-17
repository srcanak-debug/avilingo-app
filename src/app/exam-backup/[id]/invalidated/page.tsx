'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InvalidatedPage() {
  const router = useRouter()
  useEffect(() => {
    if (document.exitFullscreen) document.exitFullscreen().catch(()=>{})
  }, [])
  return (
    <div style={{minHeight:'100vh',background:'#0C1F3F',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--fb)',padding:'20px'}}>
      <div style={{maxWidth:'480px',textAlign:'center'}}>
        <div style={{fontFamily:'var(--fm)',fontSize:'22px',fontWeight:900,color:'#fff',marginBottom:'32px'}}>Avil<span style={{color:'#5AAEDF'}}>ingo</span></div>
        <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'rgba(239,68,68,0.15)',border:'2px solid #EF4444',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'32px',margin:'0 auto 24px'}}>✗</div>
        <h2 style={{fontFamily:'var(--fm)',fontSize:'24px',fontWeight:800,color:'#fff',marginBottom:'10px'}}>Exam Invalidated</h2>
        <p style={{fontSize:'14px',color:'rgba(255,255,255,0.5)',lineHeight:1.6,marginBottom:'24px'}}>Your exam has been invalidated due to 3 focus violations. This incident has been logged and reported. Please contact your HR department for further instructions.</p>
        <button onClick={()=>router.push('/exam')} style={{padding:'12px 32px',borderRadius:'9px',border:'none',background:'rgba(255,255,255,0.1)',color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Return to Dashboard</button>
      </div>
    </div>
  )
}
