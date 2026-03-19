'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DLAWelcomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else setUser(user)
    })
  }, [])

  async function handleStart() {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/dla/start', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start')
      router.push(`/dla/${data.examId}`)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  const sections = [
    { num: 1, icon: '💬', title: 'Genel Sorular', desc: '5 soru — Her birinde 75 saniye cevap süresi', color: '#3B82F6', bg: '#EFF6FF' },
    { num: 2, icon: '🖼️', title: 'Görsel Anlatım', desc: '2 görsel — Her birinde 75 saniye açıklama süresi', color: '#8B5CF6', bg: '#F5F3FF' },
    { num: 3, icon: '📋', title: 'Senaryo', desc: '2 senaryo — "Ne yapardınız?" 75 saniye cevap', color: '#F59E0B', bg: '#FFFBEB' },
    { num: 4, icon: '📖', title: 'Metin Yeniden Anlatma', desc: '2 metin — 15s okuma → 75s yeniden anlatma', color: '#10B981', bg: '#ECFDF5' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A1628 0%, #0C2340 50%, #0E2B4E 100%)', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '20px', fontWeight: 900, color: '#fff' }}>
          Avil<span style={{ color: '#5AAEDF' }}>ingo</span>
          <span style={{ marginLeft: '10px', fontSize: '12px', background: 'rgba(90,174,223,0.15)', color: '#5AAEDF', padding: '2px 10px', borderRadius: '100px', fontWeight: 600, letterSpacing: '0.5px' }}>DLA</span>
        </div>
        <button onClick={() => router.push('/exam')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
          ← Geri
        </button>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px' }}>
        
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #5AAEDF, #3A8ED0)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '32px', boxShadow: '0 8px 32px rgba(90,174,223,0.3)' }}>
            ✈️
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', fontFamily: "'Montserrat', sans-serif", marginBottom: '10px', lineHeight: 1.2 }}>
            THY DLA Sınavı Simülasyonu
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto' }}>
            Türk Hava Yolları DLA sınavını birebir simüle eden hazırlık sistemi. 
            Gerçek sınav formatında pratik yapın ve kendinizi değerlendirin.
          </p>
        </div>

        {/* Sınav Özeti */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { icon: '📝', label: 'Toplam Soru', value: '11' },
            { icon: '⏱️', label: 'Tahmini Süre', value: '~20 dk' },
            { icon: '🎯', label: 'Geçme Notu', value: '50 / 100' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#5AAEDF', fontFamily: "'Montserrat', sans-serif" }}>{value}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Bölümler */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '14px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Sınav Bölümleri
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sections.map(s => (
              <div key={s.num} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                    Bölüm {s.num}: {s.title}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.45)' }}>{s.desc}</div>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: s.color, background: s.bg + '22', padding: '4px 10px', borderRadius: '100px', border: `1px solid ${s.color}44`, flexShrink: 0 }}>
                  75s
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Değerlendirme Kriterleri */}
        <div style={{ background: 'rgba(90,174,223,0.08)', border: '1px solid rgba(90,174,223,0.2)', borderRadius: '14px', padding: '20px', marginBottom: '32px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#5AAEDF', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🎯 Değerlendirme Kriterleri
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Telaffuz', desc: 'Kelimelerin doğru söylenişi' },
              { label: 'Anlama & Cevap', desc: 'Soruya uygun yanıt verme' },
              { label: 'Dil Bilgisi', desc: 'Gramer ve yapı doğruluğu' },
              { label: 'Kelime Bilgisi', desc: 'Zengin ve uygun kelime kullanımı' },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ color: '#5AAEDF', flexShrink: 0, marginTop: '1px' }}>✓</span>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{c.label}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '6px' }}>{c.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Uyarı */}
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', padding: '14px 18px', marginBottom: '28px', fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
          ⚠️ <strong style={{ color: '#F59E0B' }}>Dikkat:</strong> Sınav başladıktan sonra sayaç otomatik başlar. Her soruya 75 saniye içinde cevap vermeniz beklenir. Sessiz bir ortamda olmaya özen gösterin.
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#FCA5A5', fontSize: '13px', marginBottom: '20px' }}>
            ❌ {error}
          </div>
        )}

        {/* Başlat */}
        <button
          onClick={handleStart}
          disabled={loading || !user}
          style={{
            width: '100%', padding: '18px', borderRadius: '14px', border: 'none',
            background: loading ? 'rgba(58,142,208,0.5)' : 'linear-gradient(135deg, #3A8ED0, #5AAEDF)',
            color: '#fff', fontSize: '17px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'Montserrat', sans-serif",
            boxShadow: loading ? 'none' : '0 8px 32px rgba(58,142,208,0.4)',
            transition: 'all 0.2s', letterSpacing: '0.3px',
          }}
        >
          {loading ? '⏳ Sınav Hazırlanıyor...' : '▶ DLA Sınavını Başlat'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '16px' }}>
          Bu simülasyon eğitim amaçlıdır. Resmi THY sistemi değildir.
        </p>
      </div>
    </div>
  )
}
