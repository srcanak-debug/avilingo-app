'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type GateStatus = 'pending' | 'checking' | 'pass' | 'fail'

export default function PreflightPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [gates, setGates] = useState<Record<string,GateStatus>>({
    browser: 'pending', camera: 'pending', microphone: 'pending',
    ping: 'pending', kvkk: 'pending'
  })
  const [kvkkChecked, setKvkkChecked] = useState(false)
  const [checking, setChecking] = useState(false)
  const [allPassed, setAllPassed] = useState(false)

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
  }

  function setGate(key: string, status: GateStatus) {
    setGates(prev => ({ ...prev, [key]: status }))
  }

  async function runChecks() {
    setChecking(true)

    // Gate 1: Browser check
    setGate('browser', 'checking')
    await delay(500)
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
    setGate('browser', isChrome ? 'pass' : 'fail')

    // Gate 2: Camera
    setGate('camera', 'checking')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(t => t.stop())
      setGate('camera', 'pass')
    } catch { setGate('camera', 'fail') }

    // Gate 3: Microphone
    setGate('microphone', 'checking')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      setGate('microphone', 'pass')
    } catch { setGate('microphone', 'fail') }

    // Gate 4: Ping test
    setGate('ping', 'checking')
    try {
      const start = Date.now()
      await fetch('https://zpqnidyhfrejkxuxlbeg.supabase.co/rest/v1/', { method: 'HEAD', mode: 'no-cors' })
      const ping = Date.now() - start
      setGate('ping', ping < 3000 ? 'pass' : 'fail')
    } catch { setGate('ping', 'pass') }

    // Gate 5: KVKK
    setGate('kvkk', kvkkChecked ? 'pass' : 'fail')

    setChecking(false)
  }

  useEffect(() => {
    const allPass = Object.values(gates).every(s => s === 'pass')
    setAllPassed(allPass)
  }, [gates])

  function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

  async function proceed() {
    await supabase.from('exams').update({ status: 'in_progress', started_at: new Date().toISOString() }).eq('id', examId)
    router.push(`/exam/${examId}/start`)
  }

  const gateConfig = [
    { key: 'browser', label: 'Chrome Browser', desc: 'This exam requires Google Chrome' },
    { key: 'camera', label: 'Camera Access', desc: 'Required for identity verification' },
    { key: 'microphone', label: 'Microphone Access', desc: 'Required for speaking section' },
    { key: 'ping', label: 'Connection Speed', desc: 'Stable internet connection required' },
    { key: 'kvkk', label: 'KVKK / GDPR Consent', desc: 'Data processing agreement' },
  ]

  return (
    <div style={{minHeight:'100vh',background:'#0C1F3F',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--fb)',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'520px'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{fontFamily:'var(--fm)',fontSize:'22px',fontWeight:900,color:'#fff',marginBottom:'6px'}}>Avil<span style={{color:'#5AAEDF'}}>ingo</span> e-Test</div>
          <h2 style={{fontFamily:'var(--fm)',fontSize:'20px',fontWeight:800,color:'#fff',marginBottom:'4px'}}>Pre-flight Check</h2>
          <p style={{fontSize:'13.5px',color:'rgba(255,255,255,0.4)'}}>5 gates must pass before your exam begins</p>
        </div>

        <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.08)',marginBottom:'20px'}}>
          {gateConfig.map((gate, i) => (
            <div key={gate.key} style={{display:'flex',alignItems:'center',gap:'14px',padding:'12px 0',borderBottom:i<4?'1px solid rgba(255,255,255,0.06)':'none'}}>
              <div style={{width:'32px',height:'32px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',background:
                gates[gate.key]==='pass'?'rgba(26,209,138,0.15)':
                gates[gate.key]==='fail'?'rgba(239,68,68,0.15)':
                gates[gate.key]==='checking'?'rgba(58,142,208,0.15)':
                'rgba(255,255,255,0.05)',
                border:'1px solid',
                borderColor:
                gates[gate.key]==='pass'?'rgba(26,209,138,0.4)':
                gates[gate.key]==='fail'?'rgba(239,68,68,0.4)':
                gates[gate.key]==='checking'?'rgba(58,142,208,0.4)':
                'rgba(255,255,255,0.1)'
              }}>
                {gates[gate.key]==='pass'?'✓':gates[gate.key]==='fail'?'✗':gates[gate.key]==='checking'?'…':(i+1)}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:'13.5px',fontWeight:600,color:'#fff',marginBottom:'1px'}}>{gate.label}</div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)'}}>{gate.desc}</div>
              </div>
              <div style={{fontSize:'12px',fontWeight:600,color:
                gates[gate.key]==='pass'?'#1AD18A':
                gates[gate.key]==='fail'?'#EF4444':
                gates[gate.key]==='checking'?'#5AAEDF':
                'rgba(255,255,255,0.2)'}}>
                {gates[gate.key]==='pass'?'PASS':gates[gate.key]==='fail'?'FAIL':gates[gate.key]==='checking'?'CHECKING...':'—'}
              </div>
            </div>
          ))}
        </div>

        <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'10px',padding:'14px 16px',marginBottom:'16px',border:'1px solid rgba(255,255,255,0.07)'}}>
          <label style={{display:'flex',alignItems:'flex-start',gap:'10px',cursor:'pointer'}}>
            <input type="checkbox" checked={kvkkChecked} onChange={e=>setKvkkChecked(e.target.checked)} style={{marginTop:'2px',accentColor:'#3A8ED0',width:'16px',height:'16px',flexShrink:0}} />
            <span style={{fontSize:'12.5px',color:'rgba(255,255,255,0.6)',lineHeight:1.5}}>
              I consent to the processing of my personal data and exam recording in accordance with KVKK / GDPR. My camera feed may be captured for identity verification purposes.
            </span>
          </label>
        </div>

        {!allPassed ? (
          <button onClick={runChecks} disabled={checking || !kvkkChecked} style={{width:'100%',padding:'13px',borderRadius:'10px',border:'none',background:kvkkChecked?'#3A8ED0':'rgba(255,255,255,0.1)',color:'#fff',fontSize:'15px',fontWeight:600,cursor:kvkkChecked?'pointer':'not-allowed',fontFamily:'var(--fb)'}}>
            {checking ? 'Running checks...' : 'Run Pre-flight Check'}
          </button>
        ) : (
          <button onClick={proceed} style={{width:'100%',padding:'13px',borderRadius:'10px',border:'none',background:'#1AD18A',color:'#fff',fontSize:'15px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
            All Systems Go — Begin Exam →
          </button>
        )}

        {Object.values(gates).some(s => s === 'fail') && (
          <div style={{marginTop:'12px',padding:'10px 14px',background:'rgba(239,68,68,0.1)',borderRadius:'8px',border:'1px solid rgba(239,68,68,0.2)'}}>
            <div style={{fontSize:'12.5px',color:'#FCA5A5'}}>One or more checks failed. Please resolve the issues above and run the check again. Use Chrome browser and allow camera/microphone access.</div>
          </div>
        )}
      </div>
    </div>
  )
}
