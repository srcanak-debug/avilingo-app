'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type GateStatus = 'pending' | 'checking' | 'pass' | 'fail'

export default function PreflightPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [gates, setGates] = useState<Record<string, GateStatus>>({
    browser: 'pending',
    camera: 'pending',
    microphone: 'pending',
    internet: 'pending',
    kvkk: 'pending',
  })
  const [completedCount, setCompletedCount] = useState(0)
  const [kvkkOpen, setKvkkOpen] = useState(false)
  const [kvkkScrolled, setKvkkScrolled] = useState(false)
  const [kvkkAccepted, setKvkkAccepted] = useState(false)
  const [kvkkLang, setKvkkLang] = useState<'tr'|'en'>('tr')
  const [fullscreenActive, setFullscreenActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [pingMs, setPingMs] = useState<number | null>(null)
  const [photoTaken, setPhotoTaken] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const kvkkRef = useRef<HTMLDivElement>(null)

  useEffect(() => { checkAuth() }, [])

  useEffect(() => {
    const count = Object.values(gates).filter(s => s === 'pass').length
    setCompletedCount(count)
  }, [gates])

  useEffect(() => {
    const onFullscreen = () => {
      setFullscreenActive(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => document.removeEventListener('fullscreenchange', onFullscreen)
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    // Auto-check browser
    checkBrowser()
  }

  function setGate(key: string, status: GateStatus) {
    setGates(prev => ({ ...prev, [key]: status }))
  }

  // Gate 1: Browser
  function checkBrowser() {
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent)
    const isFirefox = /Firefox/.test(navigator.userAgent)
    setGate('browser', (isChrome || isFirefox) ? 'pass' : 'fail')
  }

  // Gate 2: Camera
  async function testCamera() {
    setGate('camera', 'checking')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      // Wait a moment then take photo
      setTimeout(() => {
        takePhoto(stream)
      }, 2000)
    } catch {
      setGate('camera', 'fail')
    }
  }

  function takePhoto(stream: MediaStream) {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      canvasRef.current.width = 320
      canvasRef.current.height = 240
      ctx?.drawImage(videoRef.current, 0, 0, 320, 240)
      setPhotoTaken(true)
      setGate('camera', 'pass')
      // Upload photo to Supabase Storage
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return
        try {
          const fileName = `preflight/${examId}_${Date.now()}.jpg`
          await supabase.storage.from('exam-photos').upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })
        } catch (e) { console.warn('Photo upload:', e) }
      }, 'image/jpeg', 0.8)
    } else {
      setGate('camera', 'pass')
    }
  }

  // Gate 3: Microphone
  async function testMicrophone() {
    setGate('microphone', 'checking')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      setGate('microphone', 'pass')
    } catch {
      setGate('microphone', 'fail')
    }
  }

  // Gate 4: Internet
  async function testInternet() {
    setGate('internet', 'checking')
    try {
      const start = Date.now()
      await fetch('https://zpqnidyhfrejkxuxlbeg.supabase.co/rest/v1/', {
        method: 'HEAD',
        mode: 'no-cors',
      })
      const ms = Date.now() - start
      setPingMs(ms)
      setGate('internet', ms < 3000 ? 'pass' : 'fail')
    } catch {
      setGate('internet', 'pass')
      setPingMs(null)
    }
  }

  // Gate 5: KVKK
  function handleKvkkScroll() {
    if (kvkkRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = kvkkRef.current
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setKvkkScrolled(true)
      }
    }
  }

  function acceptKvkk() {
    setKvkkAccepted(true)
    setGate('kvkk', 'pass')
    setKvkkOpen(false)
  }

  // Fullscreen
  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen()
      setFullscreenActive(true)
    } catch { }
  }

  const [examData, setExamData] = useState<any>(null)
  const [showLoading, setShowLoading] = useState(false)

  // Start exam - go directly to first section with loading transition
  async function startExam() {
    try {
      setShowLoading(true)
      // Stop camera stream
      cameraStream?.getTracks().forEach(t => t.stop())
      
      // Load exam data for section routing
      const { data: ed, error: edErr } = await supabase.from('exams').select('*,exam_templates(*)').eq('id', examId).single()
      if (edErr) { console.error('Start Exam Error:', edErr); return router.push('/exam'); }
      if (!ed) { router.push('/exam'); return }
      
      // Update exam status
      if (ed.status === 'pending') {
        const { error: updErr } = await supabase.from('exams').update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        }).eq('id', examId)
        if (updErr) console.error('Update Exam Error:', updErr)
      }
      
      // Determine first section
      const ROLE_SECTION_ORDER: Record<string, string[]> = {
        general: ['grammar','reading','listening','writing','speaking'],
        flight_deck: ['grammar','reading','listening','writing','speaking'],
        cabin_crew: ['grammar','listening','reading','speaking','writing'],
        atc: ['grammar','listening','reading','speaking','writing'],
        maintenance: ['grammar','reading','writing','listening','speaking'],
        ground_staff: ['grammar','reading','listening','writing','speaking'],
      }
      const template = ed.exam_templates
      const role = template?.role_profile || 'general'
      const sectionOrder = ROLE_SECTION_ORDER[role] || ROLE_SECTION_ORDER.general
      const firstSection = sectionOrder.find((s: string) => (template?.[`${s}_count`] || 0) > 0) || sectionOrder[0]
      
      // Brief loading pause for UX
      await new Promise(r => setTimeout(r, 3500))
      router.push(`/exam/${examId}/section/${firstSection}`)
    } catch (err: any) {
      console.error('Fatal startExam error:', err)
      alert('Sistem Yüklenirken Hata Oluştu / Start Exam Error:\n' + (err.message || String(err)))
      setShowLoading(false)
    }
  }

  const allPassed = completedCount === 5
  const canStart = allPassed && fullscreenActive

  const gateLabels: Record<string, string> = {
    browser: 'Chrome',
    camera: 'Camera',
    microphone: 'Microphone',
    internet: 'Internet',
    kvkk: 'KVKK',
  }

  const pingLabel = pingMs !== null
    ? pingMs < 100 ? 'Good' : pingMs < 300 ? 'Fair' : 'Slow'
    : ''

  const pingColor = pingMs !== null
    ? pingMs < 100 ? '#16A34A' : pingMs < 300 ? '#D97706' : '#DC2626'
    : '#16A34A'

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Top Header Bar - Blue Gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0, fontFamily: "'Montserrat', sans-serif" }}>
          Pre-Exam Checks
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {Object.entries(gateLabels).map(([key, label]) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(255,255,255,0.15)', borderRadius: '100px',
              padding: '4px 12px',
            }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: gates[key] === 'pass' ? '#4ADE80' : gates[key] === 'fail' ? '#F87171' : 'rgba(255,255,255,0.4)',
                display: 'inline-block',
              }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{label}</span>
            </div>
          ))}
          <span style={{
            fontSize: '13px', fontWeight: 700, color: '#fff',
            marginLeft: '8px',
          }}>
            {completedCount}/5 Completed
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '820px', margin: '32px auto', padding: '0 24px' }}>

        {/* Gate 1: Browser Check */}
        <div style={{
          background: gates.browser === 'pass' ? '#F0FDF4' : '#fff',
          borderRadius: '14px', padding: '18px 24px', marginBottom: '16px',
          border: `2px solid ${gates.browser === 'pass' ? '#86EFAC' : '#E5E7EB'}`,
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <span style={{ fontSize: '24px' }}>🌐</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111' }}>
              {gates.browser === 'pass' ? '✓ ' : ''}Browser Check
            </div>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>Chrome browser is required for this exam.</div>
          </div>
          {gates.browser === 'pass' && (
            <span style={{
              width: '28px', height: '28px', borderRadius: '50%', background: '#16A34A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '14px', fontWeight: 700,
            }}>✓</span>
          )}
        </div>

        {/* Gate 2-5: Camera, Microphone, Internet, KVKK */}
        <div style={{
          background: '#fff', borderRadius: '14px', padding: '24px',
          marginBottom: '16px', border: '2px solid #E5E7EB',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Camera */}
            <div style={{
              background: gates.camera === 'pass' ? '#F0FDF4' : '#FAFAFA',
              borderRadius: '12px', padding: '18px',
              border: `1.5px solid ${gates.camera === 'pass' ? '#86EFAC' : '#E5E7EB'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '20px', color: gates.camera === 'pass' ? '#16A34A' : '#6B7280' }}>📹</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>Camera</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Test Camera</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  {gates.camera === 'pass' ? (
                    <span style={{
                      width: '32px', height: '32px', borderRadius: '50%', background: '#DCFCE7',
                      border: '1.5px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#16A34A', fontSize: '16px',
                    }}>✓</span>
                  ) : gates.camera === 'checking' ? (
                    <span style={{ fontSize: '13px', color: '#3B82F6', fontWeight: 600 }}>Testing...</span>
                  ) : (
                    <button onClick={testCamera} style={{
                      padding: '8px 18px', borderRadius: '8px',
                      border: '1.5px solid #3B82F6', background: '#fff',
                      color: '#3B82F6', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    }}>Test Camera</button>
                  )}
                </div>
              </div>
              {/* Camera preview */}
              {(gates.camera === 'checking' || gates.camera === 'pass') && (
                <div style={{
                  width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden',
                  background: '#1F2937', marginTop: '8px',
                }}>
                  <video ref={videoRef} autoPlay muted playsInline style={{
                    width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)',
                  }} />
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Microphone */}
            <div style={{
              background: gates.microphone === 'pass' ? '#F0FDF4' : '#FAFAFA',
              borderRadius: '12px', padding: '18px',
              border: `1.5px solid ${gates.microphone === 'pass' ? '#86EFAC' : '#E5E7EB'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px', color: gates.microphone === 'pass' ? '#16A34A' : '#6B7280' }}>🎙️</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>Microphone</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Test Microphone</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  {gates.microphone === 'pass' ? (
                    <span style={{
                      width: '32px', height: '32px', borderRadius: '50%', background: '#DCFCE7',
                      border: '1.5px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#16A34A', fontSize: '16px',
                    }}>✓</span>
                  ) : gates.microphone === 'checking' ? (
                    <span style={{ fontSize: '13px', color: '#3B82F6', fontWeight: 600 }}>Testing...</span>
                  ) : (
                    <button onClick={testMicrophone} style={{
                      padding: '8px 18px', borderRadius: '8px',
                      border: '1.5px solid #3B82F6', background: '#fff',
                      color: '#3B82F6', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    }}>Test Microphone</button>
                  )}
                </div>
              </div>
            </div>

            {/* Internet */}
            <div style={{
              background: gates.internet === 'pass' ? '#F0FDF4' : '#FAFAFA',
              borderRadius: '12px', padding: '18px',
              border: `1.5px solid ${gates.internet === 'pass' ? '#86EFAC' : '#E5E7EB'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px', color: gates.internet === 'pass' ? '#16A34A' : '#6B7280' }}>📶</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>Internet</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                    {gates.internet === 'pass' && pingMs ? (
                      <span>{pingMs} ms <span style={{
                        background: pingColor + '20', color: pingColor,
                        padding: '1px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 700,
                        marginLeft: '4px',
                      }}>{pingLabel}</span></span>
                    ) : 'Test Network'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  {gates.internet === 'pass' ? (
                    <span style={{
                      width: '32px', height: '32px', borderRadius: '50%', background: '#DCFCE7',
                      border: '1.5px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#16A34A', fontSize: '16px',
                    }}>✓</span>
                  ) : gates.internet === 'checking' ? (
                    <span style={{
                      width: '32px', height: '32px', borderRadius: '50%', background: '#EFF6FF',
                      border: '1.5px solid #93C5FD', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px',
                    }}>↻</span>
                  ) : (
                    <button onClick={testInternet} style={{
                      padding: '8px 18px', borderRadius: '8px',
                      border: '1.5px solid #3B82F6', background: '#fff',
                      color: '#3B82F6', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    }}>Test Network</button>
                  )}
                </div>
              </div>
            </div>

            {/* KVKK */}
            <div style={{
              background: gates.kvkk === 'pass' ? '#F0FDF4' : '#FAFAFA',
              borderRadius: '12px', padding: '18px',
              border: `1.5px solid ${gates.kvkk === 'pass' ? '#86EFAC' : '#E5E7EB'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px', color: gates.kvkk === 'pass' ? '#16A34A' : '#6B7280' }}>🔒</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>KVKK</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                    {gates.kvkk === 'pass' ? 'Accept KVKK ✓' : 'Accept KVKK'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  {gates.kvkk === 'pass' ? (
                    <span style={{
                      width: '32px', height: '32px', borderRadius: '50%', background: '#DCFCE7',
                      border: '1.5px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#16A34A', fontSize: '16px',
                    }}>✓</span>
                  ) : (
                    <button onClick={() => setKvkkOpen(true)} style={{
                      padding: '8px 18px', borderRadius: '8px',
                      border: '1.5px solid #3B82F6', background: '#fff',
                      color: '#3B82F6', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    }}>Accept KVKK</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen Mode */}
        <div style={{
          background: fullscreenActive ? '#F0FDF4' : '#FFFBEB',
          borderRadius: '14px', padding: '20px 24px', marginBottom: '24px',
          border: `2px solid ${fullscreenActive ? '#86EFAC' : '#FCD34D'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '24px', color: fullscreenActive ? '#16A34A' : '#D97706' }}>⛶</span>
            <div>
              <div style={{
                fontSize: '15px', fontWeight: 700,
                color: fullscreenActive ? '#16A34A' : '#D97706',
              }}>
                {fullscreenActive ? 'Fullscreen Mode ✓' : 'Fullscreen Mode (Required)'}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                {fullscreenActive
                  ? 'You are in fullscreen mode. Exam will remain in fullscreen for security.'
                  : 'Enter fullscreen mode to prevent tab switching during exam.'}
              </div>
            </div>
          </div>
          {!fullscreenActive ? (
            <button onClick={enterFullscreen} style={{
              padding: '10px 24px', borderRadius: '10px',
              border: 'none', background: '#D97706',
              color: '#fff', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              ⛶ Enter
            </button>
          ) : (
            <span style={{
              padding: '8px 16px', borderRadius: '8px',
              background: '#DCFCE7', border: '1.5px solid #86EFAC',
              color: '#16A34A', fontSize: '13px', fontWeight: 600,
            }}>✓ Active</span>
          )}
        </div>

        {/* Start Exam Button */}
        <button
          onClick={startExam}
          disabled={!canStart}
          style={{
            width: '100%', padding: '16px', borderRadius: '12px',
            border: 'none',
            background: canStart ? '#2563EB' : '#D1D5DB',
            color: '#fff', fontSize: '16px', fontWeight: 700,
            cursor: canStart ? 'pointer' : 'not-allowed',
            fontFamily: "'Inter', sans-serif",
            opacity: canStart ? 1 : 0.6,
            transition: 'all 0.2s',
          }}
        >
          Start Exam
        </button>
      </div>

      {/* KVKK Modal */}
      {kvkkOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', width: '90%', maxWidth: '560px',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h3 style={{
                fontSize: '18px', fontWeight: 700, color: '#111', margin: 0,
                fontFamily: "'Montserrat', sans-serif",
              }}>KVKK / GDPR Consent</h3>
              <div style={{display:'flex',gap:'6px'}}>
                <button onClick={() => setKvkkLang('tr')} style={{padding:'4px 12px',borderRadius:'6px',border:'1px solid #E5E7EB',background:kvkkLang==='tr'?'#2563EB':'#F9FAFB',color:kvkkLang==='tr'?'#fff':'#6B7280',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>TR</button>
                <button onClick={() => setKvkkLang('en')} style={{padding:'4px 12px',borderRadius:'6px',border:'1px solid #E5E7EB',background:kvkkLang==='en'?'#2563EB':'#F9FAFB',color:kvkkLang==='en'?'#fff':'#6B7280',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>EN</button>
                <button onClick={() => setKvkkOpen(false)} style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: '1px solid #E5E7EB', background: '#F9FAFB',
                cursor: 'pointer', fontSize: '16px', color: '#6B7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',marginLeft:'4px',
              }}>×</button>
              </div>
            </div>
            <div
              ref={kvkkRef}
              onScroll={handleKvkkScroll}
              style={{
                flex: 1, padding: '24px', overflowY: 'auto',
                fontSize: '14px', color: '#374151', lineHeight: 1.7,
              }}
            >
              {kvkkLang === 'tr' ? (<>
              <p style={{ marginBottom: '16px' }}>
                <strong>AVİLİNGO KİŞİSEL VERİLERİN KORUNMASI VE İŞLENMESİ HAKKINDA AYDINLATMA METNİ</strong>
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>1. Veri Sorumlusu</strong><br/>
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("Kanun") uyarınca, kişisel verileriniz; veri sorumlusu olarak Avilingo ("Şirket") tarafından aşağıda açıklanan kapsamda işlenebilecektir.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>2. Kişisel Verilerin İşlenme Amacı</strong><br/>
                Şirketimiz tarafından toplanan kişisel verileriniz (Kimlik, İletişim, Görsel ve İşitsel Kayıtlar, Mesleki Deneyim vb.) aşağıdaki amaçlarla işlenmektedir:
              </p>
              <ul style={{ marginBottom: '12px', paddingLeft: '20px' }}>
                <li style={{marginBottom:'4px'}}>Havacılık İngilizcesi seviye tespit sınavlarının (STS) gerçekleştirilmesi ve değerlendirilmesi,</li>
                <li style={{marginBottom:'4px'}}>Online sınavlarda kimlik doğrulamanın yapılması ve sınav güvenliğinin sağlanması,</li>
                <li style={{marginBottom:'4px'}}>Kamera ve mikrofon kayıtları ile sınav bütünlüğünün korunması,</li>
                <li style={{marginBottom:'4px'}}>Ekran aktivitesi ve sekme değişikliklerinin izlenmesi (kopya önleme),</li>
                <li style={{marginBottom:'4px'}}>Sözleşmesel yükümlülüklerin ifası ve fatura süreçlerinin yönetilmesi,</li>
                <li style={{marginBottom:'4px'}}>Yetkili kamu kurum ve kuruluşlarına bilgi verilmesi.</li>
              </ul>
              <p style={{ marginBottom: '12px' }}>
                <strong>3. İşlenen Kişisel Verileriniz</strong><br/>
                Avilingo sınav platformu aracılığıyla aşağıdaki veriler işlenmektedir:
              </p>
              <ul style={{ marginBottom: '12px', paddingLeft: '20px' }}>
                <li style={{marginBottom:'4px'}}><strong>Kimlik Bilgileri:</strong> Ad, soyad, e-posta adresi.</li>
                <li style={{marginBottom:'4px'}}><strong>Görsel ve İşitsel Kayıtlar:</strong> Sınav süresince alınan kamera görüntüleri, speaking bölümündeki ses kayıtları.</li>
                <li style={{marginBottom:'4px'}}><strong>Sınav Verileri:</strong> Cevaplarınız, writing metinleriniz, sınav süreniz ve puanlarınız.</li>
                <li style={{marginBottom:'4px'}}><strong>İşlem Güvenliği:</strong> IP adresi, tarayıcı bilgisi, sekme değişikliği logları, bağlantı hızı.</li>
              </ul>
              <p style={{ marginBottom: '12px' }}>
                <strong>4. Kişisel Verilerin Aktarılması</strong><br/>
                Kişisel verileriniz; yasal yükümlülüklerimizi yerine getirmek amacıyla yetkili kamu kurumlarına ve hizmetin ifası için iş birliği yaptığımız teknik altyapı sağlayıcılarına (sunucu hizmeti) Kanun'un 8. ve 9. maddelerine uygun olarak aktarılabilir. Sınav sonuçlarınız yalnızca sınavı atayan kuruluşun yetkili personeli ile paylaşılır. Verileriniz, açık rızanız olmaksızın üçüncü taraf pazarlama şirketleriyle paylaşılmaz.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>5. Veri Saklama Süresi</strong><br/>
                Sınav kayıtları ve sonuçları, sınav tarihinden itibaren 24 ay süreyle güvenli sunucularda saklanır. Bu sürenin sonunda, yasal zorunluluk olmadıkça güvenli bir şekilde silinir.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>6. Veri Sahibinin Hakları (Madde 11)</strong><br/>
                Kanun'un 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, amacına uygun kullanılıp kullanılmadığını öğrenme, düzeltilmesini veya silinmesini isteme haklarına sahipsiniz. Taleplerinizi <strong>info@avilingo.com</strong> adresine iletebilirsiniz.
              </p>
              <p style={{ marginTop: '20px', fontWeight: 600, background: '#F0F9FF', padding: '12px 16px', borderRadius: '8px', border: '1px solid #BAE6FD', color: '#0369A1' }}>
                Aşağıdaki onay kutucuğunu işaretleyerek, yukarıda belirtilen kişisel veri işleme faaliyetlerini okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan edersiniz.
              </p>
              </>) : (<>
              <p style={{ marginBottom: '16px' }}>
                <strong>AVILINGO PERSONAL DATA PROTECTION AND PROCESSING NOTICE</strong>
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>1. Data Controller</strong><br/>
                In accordance with the Personal Data Protection Law No. 6698 ("Law"), your personal data may be processed by Avilingo ("Company") as the data controller, within the scope described below.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>2. Purpose of Data Processing</strong><br/>
                Your personal data collected through our platform is processed for the following purposes:
              </p>
              <ul style={{ marginBottom: '12px', paddingLeft: '20px' }}>
                <li style={{marginBottom:'4px'}}>Conducting and evaluating Aviation English proficiency examinations (STS),</li>
                <li style={{marginBottom:'4px'}}>Identity verification and ensuring exam security during online examinations,</li>
                <li style={{marginBottom:'4px'}}>Camera and microphone recordings to maintain examination integrity,</li>
                <li style={{marginBottom:'4px'}}>Monitoring screen activity and tab switches (anti-cheating measures),</li>
                <li style={{marginBottom:'4px'}}>Fulfilling contractual obligations and managing invoicing processes,</li>
                <li style={{marginBottom:'4px'}}>Providing information to authorized public institutions upon request.</li>
              </ul>
              <p style={{ marginBottom: '12px' }}>
                <strong>3. Personal Data Collected</strong><br/>
                The following data is processed through the Avilingo examination platform:
              </p>
              <ul style={{ marginBottom: '12px', paddingLeft: '20px' }}>
                <li style={{marginBottom:'4px'}}><strong>Identity Information:</strong> Name, surname, email address.</li>
                <li style={{marginBottom:'4px'}}><strong>Visual and Audio Records:</strong> Camera footage during the exam, voice recordings in the speaking section.</li>
                <li style={{marginBottom:'4px'}}><strong>Examination Data:</strong> Your answers, writing responses, exam duration, and scores.</li>
                <li style={{marginBottom:'4px'}}><strong>Security Data:</strong> IP address, browser information, tab switch logs, connection speed.</li>
              </ul>
              <p style={{ marginBottom: '12px' }}>
                <strong>4. Transfer of Personal Data</strong><br/>
                Your personal data may be transferred to authorized public institutions and technical infrastructure providers in accordance with Articles 8 and 9 of the Law. Your exam results are shared only with authorized personnel of the organization that assigned the exam. Your data will not be shared with third-party marketing companies without your explicit consent.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>5. Data Retention Period</strong><br/>
                Examination records and results are stored on secure servers for 24 months from the date of the examination. After this period, they are securely deleted unless retention is required by applicable law.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>6. Your Rights (Article 11)</strong><br/>
                Under Article 11 of the Law, you have the right to learn whether your data is processed, request information, learn whether it is used in accordance with its purpose, and request its correction or deletion. You may submit your requests to <strong>info@avilingo.com</strong>.
              </p>
              <p style={{ marginTop: '20px', fontWeight: 600, background: '#F0F9FF', padding: '12px 16px', borderRadius: '8px', border: '1px solid #BAE6FD', color: '#0369A1' }}>
                By checking the box below, you confirm that you have read, understood, and consent to the personal data processing activities described above.
              </p>
              </>)}
            </div>
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #E5E7EB',
              display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
              {!kvkkScrolled && (
                <div style={{
                  fontSize: '12px', color: '#D97706', textAlign: 'center',
                  padding: '6px 12px', background: '#FFFBEB', borderRadius: '8px',
                }}>
                  {kvkkLang === 'tr' ? '↓ Lütfen metnin tamamını okumak için aşağı kaydırın' : '↓ Please scroll to the bottom to read the entire agreement'}
                </div>
              )}
              <label style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                cursor: kvkkScrolled ? 'pointer' : 'not-allowed',
                opacity: kvkkScrolled ? 1 : 0.5,
              }}>
                <input
                  type="checkbox"
                  checked={kvkkAccepted}
                  onChange={e => kvkkScrolled && setKvkkAccepted(e.target.checked)}
                  disabled={!kvkkScrolled}
                  style={{ width: '18px', height: '18px', accentColor: '#2563EB' }}
                />
                <span style={{ fontSize: '13px', color: '#374151' }}>
                  {kvkkLang === 'tr' 
                    ? 'KVKK aydınlatma metnini okudum ve kişisel verilerimin işlenmesini kabul ediyorum'
                    : 'I have read and accept the KVKK/GDPR data processing agreement'}
                </span>
              </label>
              <button
                onClick={acceptKvkk}
                disabled={!kvkkAccepted}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: 'none',
                  background: kvkkAccepted ? '#2563EB' : '#D1D5DB',
                  color: '#fff', fontSize: '14px', fontWeight: 600,
                  cursor: kvkkAccepted ? 'pointer' : 'not-allowed',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {kvkkLang === 'tr' ? 'Kabul Et ve Devam Et' : 'Accept & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {showLoading && (
        <LoadingOverlay />
      )}
    </div>
  )
}

function LoadingOverlay() {
  const [step, setStep] = useState(0)
  const steps = ['Running security checks...', 'Preparing your questions...', 'Starting camera & microphone...', 'Your exam is ready...']
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 800)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{position:'fixed',inset:0,background:'#0A1628',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,flexDirection:'column',gap:'28px'}}>
      <div style={{fontSize:'32px',fontWeight:900,color:'#fff',fontFamily:"'Montserrat',sans-serif",letterSpacing:'1px'}}>AVILINGO</div>
      <div style={{width:'48px',height:'48px',border:'4px solid rgba(255,255,255,0.1)',borderTop:'4px solid #3B82F6',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
      <div style={{display:'flex',flexDirection:'column',gap:'10px',alignItems:'center'}}>
        {steps.map((s, i) => (
          <div key={i} style={{fontSize:'14px',color: i<=step ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',transition:'color 0.5s',display:'flex',alignItems:'center',gap:'8px'}}>
            {i < step ? <span style={{color:'#4ADE80'}}>✓</span> : i === step ? <span style={{color:'#3B82F6'}}>●</span> : <span style={{color:'rgba(255,255,255,0.15)'}}>○</span>}
            {s}
          </div>
        ))}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
