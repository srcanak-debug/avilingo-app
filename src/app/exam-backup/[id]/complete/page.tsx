'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ExamCompletePage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    if (document.exitFullscreen) document.exitFullscreen().catch(()=>{})
  }, [])

  return (
    <div style={{minHeight:'100vh',background:'#0C1F3F',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--fb)',padding:'20px'}}>
      <div style={{maxWidth:'480px',textAlign:'center'}}>
        <div style={{fontFamily:'var(--fm)',fontSize:'22px',fontWeight:900,color:'#fff',marginBottom:'32px'}}>Avil<span style={{color:'#5AAEDF'}}>ingo</span></div>
        <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'rgba(26,209,138,0.15)',border:'2px solid #1AD18A',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'32px',margin:'0 auto 24px'}}>✓</div>
        <h2 style={{fontFamily:'var(--fm)',fontSize:'24px',fontWeight:800,color:'#fff',marginBottom:'10px'}}>Exam Submitted</h2>
        <p style={{fontSize:'14px',color:'rgba(255,255,255,0.5)',lineHeight:1.6,marginBottom:'8px'}}>Your responses have been recorded successfully.</p>
        <p style={{fontSize:'14px',color:'rgba(255,255,255,0.5)',lineHeight:1.6,marginBottom:'32px'}}>Auto-graded sections are already scored. Speaking and Writing sections will be reviewed by an evaluator. Your results will be available once all sections are graded.</p>
        <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'12px',padding:'16px',marginBottom:'24px',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.4)'}}>Expected results time</div>
          <div style={{fontSize:'16px',fontWeight:600,color:'#fff',marginTop:'4px'}}>24–48 hours</div>
        </div>
        <button onClick={()=>router.push('/exam')} style={{padding:'12px 32px',borderRadius:'9px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>Return to Dashboard</button>
      </div>
    </div>
  )
}
