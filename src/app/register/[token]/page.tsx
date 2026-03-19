'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function PublicRegisterPage() {
  const { token } = useParams()
  const router = useRouter()
  
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    async function loadTemplate() {
      if (!token) return
      const { data, error } = await supabase
        .from('exam_templates')
        .select('*')
        .eq('public_token', token)
        .single()
      
      if (error || !data) {
        setError('Sınav bulunamadı veya link geçersiz.')
      } else {
        setTemplate(data)
      }
      setLoading(false)
    }
    loadTemplate()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // 1. Create or get candidate user (simplified for now: just based on email)
      // In a real app, we might want to check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email.toLowerCase())
        .single()
      
      let candidateId = existingUser?.id

      if (!candidateId) {
        // Create a new candidate user entry
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: formData.email.toLowerCase(),
            full_name: formData.full_name,
            phone_number: formData.phone,
            role: 'candidate',
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (userError) throw userError
        candidateId = newUser.id
      }

      // 2. Create the exam record
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          candidate_id: candidateId,
          template_id: template.id,
          org_id: template.org_id,
          status: 'scheduled',
          is_public: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (examError) throw examError

      // 3. Trigger "Registration Received" notification
      await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exams: [{
            id: exam.id,
            candidate_email: formData.email,
            candidate_name: formData.full_name
          }],
          templateName: template.name,
          type: 'REGISTRATION_RECEIVED' // New type for the API to handle
        })
      })

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div style={centerStyle}>Yükleniyor...</div>
  
  if (success) return (
    <div style={centerStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
        <h1 style={titleStyle}>Kaydınız Başarıyla Alındı!</h1>
        <p style={textStyle}>
          <strong>{template?.name}</strong> için başvurunuz onaylandı.
          Giriş detayları e-posta adresinize (<strong>{formData.email}</strong>) gönderildi.
        </p>
        
        <div style={{ marginTop: '32px' }}>
          <button 
            onClick={() => router.push(`/exam/${token}/preflight`)}
            style={{
              padding: '16px 32px',
              borderRadius: '16px',
              border: 'none',
              background: '#0EA5E9',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 10px 25px rgba(14,165,233,0.3)'
            }}
          >
            Sınavı Hemen Başlat →
          </button>
        </div>

        <div style={{ marginTop: '24px', fontSize: '13px', color: '#64748B' }}>
          Lütfen gelen kutunuzu (ve gereksiz kutusunu) kontrol edin.
        </div>
      </div>
    </div>
  )

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0C1F3F', marginBottom: '8px' }}>Avil<span style={{ color: '#0EA5E9' }}>ingo</span></h1>
          <div style={{ padding: '8px 16px', borderRadius: '100px', background: '#F0F9FF', color: '#0EA5E9', fontSize: '13px', fontWeight: 800, display: 'inline-block' }}>
            Sınav Kayıt Formu
          </div>
        </div>

        {error ? (
          <div style={{ padding: '16px', borderRadius: '12px', background: '#FEF2F2', color: '#991B1B', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
             ⚠️ {error}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0C1F3F', marginBottom: '8px' }}>{template?.name}</h2>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>{template?.description || 'Bu sınava katılmak için lütfen aşağıdaki formu eksiksiz doldurun.'}</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={fieldGroup}>
                <label style={labelStyle}>İsim Soyisim</label>
                <input 
                  required 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})} 
                  placeholder="John Doe" 
                  style={inputStyle} 
                />
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>E-posta Adresi</label>
                <input 
                  required 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="john@example.com" 
                  style={inputStyle} 
                />
              </div>

              {template?.registration_fields?.phone && (
                <div style={fieldGroup}>
                  <label style={labelStyle}>Telefon Numarası</label>
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="+90 5xx xxx xxxx" 
                    style={inputStyle} 
                  />
                </div>
              )}

              <button 
                type="submit" 
                disabled={submitting}
                style={{
                  marginTop: '12px',
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  background: '#0C1F3F',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 800,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 10px 25px rgba(12,31,63,0.15)'
                }}
              >
                {submitting ? 'Kaydediliyor...' : 'Kaydı Tamamla ve Sınavı Başlat'}
              </button>
            </form>
          </>
        )}
      </div>
      
      <div style={{ marginTop: '32px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
        © {new Date().getFullYear()} Avilingo Aviation English. Tüm hakları saklıdır.
      </div>
    </div>
  )
}

// Styles
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  fontFamily: 'var(--fb, Inter, system-ui, sans-serif)'
}

const centerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(12px)',
  borderRadius: '32px',
  padding: '48px',
  width: '100%',
  maxWidth: '520px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  textAlign: 'center' as any
}

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 900,
  color: '#0C1F3F',
  marginBottom: '16px',
  letterSpacing: '-0.02em',
  fontFamily: 'var(--fm, inherit)'
}

const textStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#475569',
  lineHeight: 1.6
}

const fieldGroup: React.CSSProperties = {
  textAlign: 'left'
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 800,
  color: '#64748B',
  textTransform: 'uppercase',
  marginBottom: '8px',
  letterSpacing: '0.05em'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px 20px',
  borderRadius: '16px',
  border: '1.5px solid #E2E8F0',
  fontSize: '15px',
  outline: 'none',
  transition: 'all 0.2s',
  background: '#fff',
  fontFamily: 'inherit'
}
