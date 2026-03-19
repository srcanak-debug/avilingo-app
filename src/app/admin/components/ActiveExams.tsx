'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import ExamWizard from './ExamWizard'

interface ActiveExamsProps {
  adminId: string
}

export default function ActiveExams({ adminId }: ActiveExamsProps) {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardEditId, setWizardEditId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  
  const loadExams = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('exams')
      .select('*, organizations(name, logo_url), users!exams_candidate_id_fkey(full_name, email), exam_templates(name)')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      if (filter === 'active') query = query.eq('status', 'scheduled')
      else if (filter === 'passive') query = query.eq('status', 'cancelled')
      else query = query.eq('status', filter)
    }

    const { data, error } = await query
    if (error) console.error('Error loading exams:', error.message)
    else setExams(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    loadExams()

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exams' },
        () => loadExams()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filter, loadExams])

  async function updateStatus(id: string, updates: any) {
    const { error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', id)
    
    if (error) alert(error.message)
    else loadExams()
  }

  async function deleteExam(id: string) {
    if (!confirm('Are you sure you want to delete this exam permanently?')) return
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id)
    
    if (error) alert(error.message)
    else loadExams()
  }

  const filteredExams = exams.filter(e => {
    const search = searchTerm.toLowerCase()
    return (
      (e.users?.full_name?.toLowerCase() || '').includes(search) ||
      (e.organizations?.name?.toLowerCase() || '').includes(search) ||
      (e.exam_templates?.name?.toLowerCase() || '').includes(search) ||
      (e.id?.toLowerCase() || '').includes(search)
    )
  })

  // Mock Distribution helper (in a real app, these would come from DB)
  const getDistribution = (exam: any) => ({
    grammar: exam.grammar_count || 15,
    reading: exam.reading_count || 5,
    writing: exam.writing_count || 2,
    speaking: exam.speaking_count || 3,
    listening: exam.listening_count || 6
  })

  return (
    <div style={{ padding: '0 4px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'center' }}>
        <button 
          onClick={() => { setWizardEditId(null); setIsWizardOpen(true); }}
          style={{
            padding: '12px 24px',
            background: 'var(--sky)',
            color: '#fff',
            border: 'none',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(10,132,255,0.2)',
            transition: 'all 0.2s'
          }}
        >
          <span style={{ fontSize: '18px' }}>+</span> Yeni Sınav Oluştur
        </button>
        <button 
          onClick={() => loadExams()}
          style={{
            padding: '12px 20px',
            background: '#fff',
            color: 'var(--navy)',
            border: '1.5px solid var(--bdr)',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <span style={{ fontSize: '16px' }}>🔄</span> Yenile
        </button>

        {/* Search & Filter Bar (Desktop Layout) */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Sınav veya aday ara..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                padding: '12px 16px 12px 40px',
                borderRadius: '100px',
                border: '1.5px solid var(--bdr)',
                fontSize: '13px',
                width: '300px',
                outline: 'none',
                fontFamily: 'var(--fm)'
              }}
            />
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          </div>
        </div>
      </div>

      {loading && exams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--t3)' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⌛</div>
          <div>Yükleniyor...</div>
        </div>
      ) : filteredExams.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: '32px', padding: '100px', border: '1px dashed var(--bdr)', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>📋</div>
          <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--navy)', marginBottom: '12px' }}>Henüz kayıtlı sınav yok</h3>
          <p style={{ color: 'var(--t3)', fontSize: '14px' }}>Yeni bir sınav oluşturarak başlayın veya filtreleri değiştirin.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(550px, 1fr))', gap: '32px' }}>
          {filteredExams.map(exam => {
            const dist = getDistribution(exam)
            const isPassive = exam.status === 'cancelled'
            const isLocked = exam.is_locked
            const isPublic = exam.is_public

            return (
              <div key={exam.id} style={{
                background: '#fff',
                borderRadius: '32px',
                padding: '24px',
                border: '1px solid var(--bdr)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.02)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                {/* 1. Badges Row */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge color="#10B981" label={isPassive ? 'Pasif' : 'Aktif'} ghost={isPassive} />
                  {isLocked && <Badge color="#F59E0B" label="🔒 Kilitli" />}
                  <Badge color="#3B82F6" label="Bağımsız" ghost />
                  <Badge color="#0EA5E9" label={`Alan: ${exam.field_area || exam.exam_templates?.role_profile || 'Genel'}`} ghost />
                  <Badge color={isPublic ? '#10B981' : '#64748B'} label={isPublic ? '🌐 Public' : '🔐 Private'} />
                  <Badge color="#3B82F6" label={`🌐 ${exam.language || 'English'}`} ghost />
                  <div style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 800, color: 'var(--t3)', background: '#f1f5f9', padding: '4px 12px', borderRadius: '100px' }}>
                    {exam.exam_templates?.passing_cefr || 'A1'} - C1
                  </div>
                </div>

                {/* 2. Title & ID */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--navy)', margin: 0, letterSpacing: '-0.5px' }}>
                      {exam.exam_templates?.name || 'Yeni Sınav Programı'}
                    </h3>
                    <span style={{ color: 'var(--sky)', cursor: 'pointer', fontSize: '18px' }}>ℹ️</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ID: {exam.id} <span style={{ cursor: 'pointer', opacity: 0.6 }}>📋</span>
                  </div>
                </div>

                {/* 3. Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <MetaItem icon="⌛" label="Başlangıç" value={new Date(exam.scheduled_for || exam.created_at).toLocaleString('tr-TR')} />
                  <MetaItem icon="⌛" label="Bitiş" value={exam.end_date ? new Date(exam.end_date).toLocaleString('tr-TR') : 'Belirtilmedi'} />
                  <MetaItem icon="👥" label="Katılım" value="1 aday" />
                  <MetaItem icon="🕙" label="Süre" value={`${exam.duration_mins || 60} dakika`} />
                </div>

                {/* 4. Distribution */}
                <div style={{ borderTop: '1px solid var(--bdr)', paddingTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--navy)', marginBottom: '8px' }}>Soru Dağılımı</div>
                  <div style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.6 }}>
                    Grammar: {dist.grammar} • Reading: {dist.reading} • Writing: {dist.writing} • Speaking: {dist.speaking} • Listening: {dist.listening}
                  </div>
                </div>

                {/* 5. Main Actions (Primary) */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <ActionButton icon="👥" label="Adaylar" flex={1} />
                  <ActionButton icon="📊" label="Sonuçlar" flex={1} color="#10B981" filled />
                </div>

                {/* 6. Detail Actions (Grid) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <ActionButton icon="⚖️" label="Ağırlıklar" border />
                  <ActionButton icon="📹" label="Proctoring" border />
                  <ActionButton icon="⚠️" label="Baraj Bölümleri" border />
                  <ActionButton icon="✅" label="Role-Fit" border color="#10B981" />
                </div>

                {/* 7. Edit Row */}
                <ActionButton icon="🖊️" label="Tarih veya Dili Düzenle" border />

                {/* 8. Control Actions (Grid) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <ActionButton sm icon="👨‍🏫" label="Eğitmen Ata" border />
                  <ActionButton sm icon="🔴" label={isPassive ? "Aktif Yap" : "Pasif Yap"} border onClick={() => updateStatus(exam.id, { status: isPassive ? 'scheduled' : 'cancelled' })} />
                  <ActionButton sm icon={isPublic ? "🛡️" : "🌐"} label={isPublic ? "Private" : "Public"} border onClick={() => updateStatus(exam.id, { is_public: !isPublic })} />
                  <ActionButton sm icon={isLocked ? "🔓" : "🔒"} label={isLocked ? "Kilidi Aç" : "Kilitle"} border onClick={() => updateStatus(exam.id, { is_locked: !isLocked })} />
                  <ActionButton sm icon="⚙️" label="Ayarlar" border onClick={() => { setWizardEditId(exam.template_id); setIsWizardOpen(true); }} />
                  <ActionButton sm icon="🗑️" label="Sınavı Sil" border color="#EF4444" onClick={() => deleteExam(exam.id)} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Exam Creation / Edit Wizard Overlay */}
      {isWizardOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 9999, overflowY: 'auto' }}>
          <ExamWizard 
            onClose={() => { setIsWizardOpen(false); setWizardEditId(null); loadExams(); }} 
            editId={wizardEditId}
          />
        </div>
      )}
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: any) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--bdr)', fontSize: '14px', outline: 'none' }} />
    </div>
  )
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--bdr)', fontSize: '14px', outline: 'none', background: '#fff' }}>
        <option value="">Seçiniz...</option>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// --- Helper Components ---

function Badge({ color, label, ghost = false }: { color: string, label: string, ghost?: boolean }) {
  return (
    <div style={{
      padding: '4px 12px',
      borderRadius: '100px',
      fontSize: '11px',
      fontWeight: 800,
      background: ghost ? '#fff' : color,
      color: ghost ? color : '#fff',
      border: ghost ? `1.5px solid ${color}` : 'none',
      textTransform: 'uppercase',
      letterSpacing: '0.4px'
    }}>
      {label}
    </div>
  )
}

function MetaItem({ icon, label, value }: { icon: string, label: string, value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 700 }}>{label}: {value}</div>
      </div>
    </div>
  )
}

function ActionButton({ icon, label, flex, color, filled, border, sm, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: flex || 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: sm ? '8px 12px' : '14px 20px',
        borderRadius: '14px',
        border: border ? `1.5px solid ${color || 'var(--bdr)'}` : 'none',
        background: filled ? (color || 'var(--navy)') : '#fff',
        color: filled ? '#fff' : (color || 'var(--navy)'),
        fontSize: sm ? '12px' : '13px',
        fontWeight: 800,
        cursor: 'pointer',
        transition: 'all 0.2s',
        width: flex ? 'auto' : '100%'
      }}
    >
      <span style={{ fontSize: sm ? '14px' : '16px' }}>{icon}</span>
      {label}
    </button>
  )
}
