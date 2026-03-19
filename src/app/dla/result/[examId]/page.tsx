'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SECTION_LABELS: Record<string, string> = {
  general:  'Bölüm 1: Genel Sorular',
  picture:  'Bölüm 2: Görsel Anlatım',
  scenario: 'Bölüm 3: Senaryo',
  retell:   'Bölüm 4: Metin Yeniden Anlatma',
}
const SECTION_ICONS: Record<string, string> = {
  general: '💬', picture: '🖼️', scenario: '📋', retell: '📖'
}

type ResultData = {
  examId: string
  status: string
  rawScore: number
  resultLabel: string
  interpretation: { label: string; color: string; description: string }
  criteriaAverages: { pronunciation: number; comprehension: number; grammar: number; vocabulary: number }
  sectionAverages: Record<string, number | null>
  totalAnswers: number
  skipped: number
  retestAvailableAt: string | null
  completedAt: string | null
  answers: any[]
}

export default function DLAResultPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string

  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    async function loadResult() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      // Poll until scored (max 10s)
      let attempts = 0
      const poll = async () => {
        const res = await fetch(`/api/dla/result?examId=${examId}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Sonuç yüklenirken hata oluştu.')
          setLoading(false)
          return
        }
        if (data.status === 'scored' || attempts >= 5) {
          setResult(data)
          setLoading(false)
        } else {
          attempts++
          setTimeout(poll, 2000)
        }
      }
      poll()
    }
    loadResult()
  }, [examId])

  if (loading) return (
    <div style={fullScreenStyle}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 1.5s linear infinite' }}>⏳</div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px' }}>Yanıtlarınız değerlendiriliyor...</p>
      </div>
      <style>{`@keyframes spin{ from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )

  if (error || !result) return (
    <div style={fullScreenStyle}>
      <div style={{ textAlign: 'center', color: '#FCA5A5' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>❌</div>
        <p>{error || 'Sonuç bulunamadı.'}</p>
        <button onClick={() => router.push('/dla')} style={btnStyle}>← Ana Sayfa</button>
      </div>
    </div>
  )

  const { rawScore, interpretation, criteriaAverages, sectionAverages } = result
  const scoreColor = rawScore >= 70 ? '#16A34A' : rawScore >= 50 ? '#F59E0B' : '#DC2626'

  const criteria = [
    { key: 'pronunciation', label: 'Telaffuz', icon: '🗣️' },
    { key: 'comprehension', label: 'Anlama & Cevap', icon: '🧠' },
    { key: 'grammar', label: 'Dil Bilgisi', icon: '📝' },
    { key: 'vocabulary', label: 'Kelime Bilgisi', icon: '📚' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0A1628 0%, #0C2340 100%)', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', fontFamily: "'Montserrat',sans-serif" }}>
          Avil<span style={{ color: '#5AAEDF' }}>ingo</span>
          <span style={{ marginLeft: '8px', fontSize: '11px', color: '#5AAEDF', background: 'rgba(90,174,223,0.1)', padding: '2px 8px', borderRadius: '100px' }}>DLA Sonuç</span>
        </div>
        <button onClick={() => router.push('/exam')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
          Panele Dön
        </button>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Ana Skor Kartı */}
        <div style={{
          background: `linear-gradient(135deg, ${scoreColor}20, ${scoreColor}08)`,
          border: `1px solid ${scoreColor}40`,
          borderRadius: '20px', padding: '36px', textAlign: 'center', marginBottom: '24px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}80)` }} />
          
          <div style={{ fontSize: '72px', fontWeight: 900, color: scoreColor, fontFamily: "'Montserrat',sans-serif", lineHeight: 1, marginBottom: '8px' }}>
            {Math.round(rawScore)}
          </div>
          <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>/ 100 puan</div>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: scoreColor + '20', border: `1px solid ${scoreColor}40`, borderRadius: '100px', padding: '8px 20px', marginBottom: '16px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: scoreColor, fontFamily: "'Montserrat',sans-serif" }}>
              {interpretation.label}
            </span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
            {interpretation.description}
          </p>

          {result.retestAvailableAt && (
            <div style={{ marginTop: '16px', fontSize: '12.5px', color: 'rgba(255,255,255,0.35)' }}>
              📅 Yeniden sınav tarihi: <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{result.retestAvailableAt}</strong>
            </div>
          )}
        </div>

        {/* Bölüm Ortalamaları */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📂 Bölüm Sonuçları
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(sectionAverages).map(([sec, avg]) => {
              if (avg === null) return null
              const barWidth = Math.min(avg, 100)
              const barColor = avg >= 70 ? '#16A34A' : avg >= 50 ? '#F59E0B' : '#DC2626'
              return (
                <div key={sec}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {SECTION_ICONS[sec]} {SECTION_LABELS[sec] || sec}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: barColor }}>
                      {Math.round(avg)} / 100
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${barWidth}%`, background: barColor, borderRadius: '100px', transition: 'width 1s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 4 Kriter */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🎯 Değerlendirme Kriterleri
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {criteria.map(c => {
              const val = criteriaAverages[c.key as keyof typeof criteriaAverages] || 0
              const col = val >= 70 ? '#16A34A' : val >= 50 ? '#F59E0B' : '#DC2626'
              return (
                <div key={c.key} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{c.icon}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{c.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: col, fontFamily: "'Montserrat',sans-serif" }}>{Math.round(val)}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>/ 100</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* İstatistikler */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Toplam Cevap', value: result.totalAnswers },
            { label: 'Atlanan', value: result.skipped },
            { label: 'Cevaplanan', value: result.totalAnswers - result.skipped },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#5AAEDF', fontFamily: "'Montserrat',sans-serif" }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Cevap Detayları Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", marginBottom: '20px' }}
        >
          {showDetails ? '▲ Cevap Detaylarını Gizle' : '▼ Cevap Detaylarını Göster'}
        </button>

        {showDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {result.answers.map((a, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                    {SECTION_ICONS[a.section]} Soru {a.order} — {SECTION_LABELS[a.section]}
                  </span>
                  {a.score && (
                    <span style={{ fontSize: '13px', fontWeight: 700, color: a.score.total >= 7 ? '#16A34A' : a.score.total >= 5 ? '#F59E0B' : '#DC2626' }}>
                      {(a.score.total * 10).toFixed(0)} / 100
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px', lineHeight: 1.5 }}>
                  {a.question}
                </p>
                {a.response && (
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: '0 0 8px', paddingLeft: '12px', borderLeft: '2px solid rgba(90,174,223,0.4)', lineHeight: 1.5 }}>
                    {a.response}
                  </p>
                )}
                {a.score?.feedback && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                    💡 {a.score.feedback}
                  </div>
                )}
                {a.skipped && <div style={{ fontSize: '12px', color: '#F59E0B' }}>⚠️ Bu soru atlandı</div>}
              </div>
            ))}
          </div>
        )}

        {/* Aksiyonlar */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => router.push('/dla')} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '14px' }}>
            🔄 Yeni Sınav
          </button>
          <button onClick={() => router.push('/exam')} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #3A8ED0, #5AAEDF)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px', fontFamily: "'Montserrat',sans-serif" }}>
            Ana Panel →
          </button>
        </div>
      </div>
    </div>
  )
}

const fullScreenStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg, #0A1628 0%, #0C2340 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Inter', sans-serif",
}
const btnStyle: React.CSSProperties = {
  marginTop: '20px', padding: '10px 20px', borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
  color: '#fff', cursor: 'pointer', fontSize: '14px',
}
