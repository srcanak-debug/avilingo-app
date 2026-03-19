'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ExamWizard from './ExamWizard'

interface ActiveExamsProps {
  adminId: string
}

export default function ActiveExams({ adminId }: ActiveExamsProps) {
  const router = useRouter()
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardEditId, setWizardEditId] = useState<string | null>(null)
  
  // Pagination state
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  // Edit State
  const [editExam, setEditExam] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [candidateDetails, setCandidateDetails] = useState<any>(null)

  const loadExams = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('exams')
      .select('*, organizations(name, logo_url), users!exams_candidate_id_fkey(id, full_name, email, phone, country), exam_templates(name, passing_cefr, role_profile)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (filter !== 'all') {
      if (filter === 'active') query = query.eq('status', 'scheduled')
      else if (filter === 'passive') query = query.eq('status', 'cancelled')
      else query = query.eq('status', filter)
    }

    const { data, error, count } = await query
    if (error) console.error('Error loading exams:', error.message)
    else {
      setExams(data || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [filter, page, pageSize])

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

  // Helper for Section counts
  const getDistribution = (exam: any) => ({
    grammar: exam.grammar_count || exam.exam_templates?.grammar_count || 15,
    reading: exam.reading_count || exam.exam_templates?.reading_count || 5,
    writing: exam.writing_count || exam.exam_templates?.writing_count || 2,
    speaking: exam.speaking_count || exam.exam_templates?.speaking_count || 3,
    listening: exam.listening_count || exam.exam_templates?.listening_count || 6
  })

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div style={{ padding: '0 4px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'center' }}>
        <button 
          onClick={() => { setWizardEditId(null); setIsWizardOpen(true); }}
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg, var(--sky) 0%, #0076FF 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px rgba(10,132,255,0.25)',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
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

        {/* Search & Filter Bar */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            value={filter} 
            onChange={e => { setFilter(e.target.value); setPage(0); }}
            style={{
              padding: '12px 16px',
              borderRadius: '100px',
              border: '1.5px solid var(--bdr)',
              fontSize: '13px',
              fontWeight: 700,
              background: '#fff',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">Sınav Durumu: Hepsi</option>
            <option value="scheduled">Bekleyen (Scheduled)</option>
            <option value="in_progress">Devam Eden</option>
            <option value="completed">Tamamlanan</option>
            <option value="cancelled">İptal / Pasif</option>
          </select>

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
                fontFamily: 'var(--fm)',
                background: '#fff'
              }}
            />
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          </div>
        </div>
      </div>

      {loading && exams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--t3)' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--bdr)', borderTopColor: 'var(--sky)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <div>Yükleniyor...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filteredExams.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: '32px', padding: '100px', border: '1px dashed var(--bdr)', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>📋</div>
          <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--navy)', marginBottom: '12px' }}>Arama sonucunda sınav bulunamadı</h3>
          <p style={{ color: 'var(--t3)', fontSize: '14px' }}>Farklı bir arama terimi deneyin veya yeni bir sınav oluşturun.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '24px' }}>
            {filteredExams.map(exam => {
              const dist = getDistribution(exam)
              const isPassive = exam.status === 'cancelled'
              const isLocked = exam.is_locked
              const isPublic = exam.is_public

              return (
                <div key={exam.id} style={{
                  background: '#fff',
                  borderRadius: '28px',
                  padding: '28px',
                  border: '1px solid var(--bdr)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.02)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  transition: 'transform 0.2s',
                }}>
                  {/* 1. Badges Row */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge color={exam.status === 'completed' ? '#10B981' : exam.status === 'in_progress' ? '#3B82F6' : isPassive ? '#64748B' : '#F59E0B'} label={statusLabel(exam.status)} ghost={isPassive} />
                    {isLocked && <Badge color="#F59E0B" label="🔒 Kilitli" />}
                    <Badge color="#3B82F6" label={exam.exam_templates?.role_profile?.replace('_', ' ') || 'Genel'} ghost />
                    <Badge color={isPublic ? '#10B981' : '#64748B'} label={isPublic ? '🌐 Public' : '🔐 Private'} />
                    <Badge color="#3B82F6" label={`🌐 ${exam.language || 'English'}`} ghost />
                    <div style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 800, color: 'var(--t3)', background: '#f1f5f9', padding: '4px 12px', borderRadius: '100px' }}>
                      {exam.exam_templates?.passing_cefr || 'B2'}
                    </div>
                  </div>

                  {/* 2. Title & ID */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--navy)', margin: 0, letterSpacing: '-0.5px' }}>
                        {exam.exam_templates?.name || 'Sınav Programı'}
                      </h3>
                      <button 
                        onClick={() => { setWizardEditId(exam.template_id); setIsWizardOpen(true); }}
                        style={{ background: 'none', border: 'none', color: 'var(--sky)', cursor: 'pointer', fontSize: '18px', padding: '4px' }} title="Template Ayarları"
                      >⚙️</button>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Aday: <span style={{ fontWeight: 800, color: 'var(--navy)' }}>{exam.users?.full_name || '—'}</span> 
                      {exam.organizations?.name && <span>• Kurum: <span style={{ fontWeight: 700 }}>{exam.organizations.name}</span></span>}
                    </div>
                  </div>

                  {/* 3. Metadata Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', background: 'var(--off)', padding: '16px', borderRadius: '20px' }}>
                    <MetaItem icon="⌛" label="Başlangıç" value={new Date(exam.scheduled_for || exam.created_at).toLocaleString('tr-TR')} />
                    <MetaItem icon="🕙" label="Süre" value={`${exam.duration_mins || 60} dakika`} />
                    <MetaItem icon="📧" label="E-Posta" value={exam.users?.email || '—'} />
                    <MetaItem icon="🆔" label="ID" value={exam.id.slice(0, 8)} />
                  </div>

                  {/* 4. Distribution */}
                  <div style={{ borderTop: '0px solid var(--bdr)', paddingTop: '0px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--t3)', marginBottom: '8px', textTransform: 'uppercase' }}>Soru Dağılımı</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <SectionTag label="GR" count={dist.grammar} color="#3B82F6" />
                      <SectionTag label="RD" count={dist.reading} color="#10B981" />
                      <SectionTag label="WR" count={dist.writing} color="#F59E0B" />
                      <SectionTag label="SP" count={dist.speaking} color="#EF4444" />
                      <SectionTag label="LS" count={dist.listening} color="#7C3AED" />
                    </div>
                  </div>

                  {/* 5. Main Actions (Primary) */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <ActionButton icon="👥" label="Aday Detayı" flex={1} border 
                      onClick={() => setCandidateDetails(exam.users)}
                    />
                    <ActionButton icon="📊" label="Sınav Sonucu" flex={1} color="#10B981" filled 
                      onClick={() => router.push(`/admin/review/${exam.id}`)}
                    />
                  </div>

                  {/* 7. Edit Row */}
                  <ActionButton icon="🖊️" label="Tarih veya Dili Düzenle" border 
                    onClick={() => { setEditExam(exam); setShowEditModal(true); }}
                  />

                  {/* 8. Control Actions (Grid) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <ActionButton sm icon="🔴" label={isPassive ? "Aktif" : "Pasif"} border onClick={() => updateStatus(exam.id, { status: isPassive ? 'scheduled' : 'cancelled' })} />
                    <ActionButton sm icon={isLocked ? "🔓" : "🔒"} label={isLocked ? "Aç" : "Kilit"} border onClick={() => updateStatus(exam.id, { is_locked: !isLocked })} />
                    <ActionButton sm icon="🗑️" label="Sil" border color="#EF4444" onClick={() => deleteExam(exam.id)} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ padding: '8px 16px', borderRadius: '12px', border: '1.5px solid var(--bdr)', background: '#fff', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.5 : 1 }}
              >Previous</button>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)' }}>{page + 1} / {totalPages}</div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{ padding: '8px 16px', borderRadius: '12px', border: '1.5px solid var(--bdr)', background: '#fff', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.5 : 1 }}
              >Next</button>
            </div>
          )}
        </>
      )}

      {/* Candidate Details Modal */}
      {candidateDetails && (
        <Modal title="Aday Bilgileri" onClose={() => setCandidateDetails(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <DetailItem label="Tam Ad" value={candidateDetails.full_name} />
            <DetailItem label="E-Posta" value={candidateDetails.email} />
            <DetailItem label="Telefon" value={candidateDetails.phone || '—'} />
            <DetailItem label="Ülke" value={candidateDetails.country || '—'} />
            <button 
              onClick={() => router.push(`/admin/users?search=${candidateDetails.email}`)}
              style={{ padding: '12px', borderRadius: '12px', background: 'var(--sky)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', marginTop: '12px' }}
            >Kullanıcı Yönetiminde Göster</button>
          </div>
        </Modal>
      )}

      {/* Edit Date/Language Modal */}
      {showEditModal && editExam && (
        <Modal title="Sınav Detaylarını Düzenle" onClose={() => { setShowEditModal(false); setEditExam(null); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--t3)', marginBottom: '8px' }}>Sınav Tarihi/Saati</label>
              <input 
                type="datetime-local" 
                defaultValue={editExam.scheduled_for ? new Date(editExam.scheduled_for).toISOString().slice(0, 16) : ''}
                id="edit_scheduled_for"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid var(--bdr)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--t3)', marginBottom: '8px' }}>Sınav Dili</label>
              <select 
                id="edit_language"
                defaultValue={editExam.language || 'English'}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid var(--bdr)', outline: 'none', background: '#fff' }}
              >
                <option value="English">English</option>
                <option value="Turkish">Turkish</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button 
                onClick={() => { setShowEditModal(false); setEditExam(null); }}
                style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1.5px solid var(--bdr)', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >İptal</button>
              <button 
                onClick={async () => {
                  const s = (document.getElementById('edit_scheduled_for') as HTMLInputElement).value
                  const l = (document.getElementById('edit_language') as HTMLSelectElement).value
                  await updateStatus(editExam.id, { scheduled_for: s, language: l })
                  setShowEditModal(false)
                }}
                style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--sky)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >Kaydet</button>
            </div>
          </div>
        </Modal>
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

// --- Helper Components & Functions ---

function statusLabel(status: string) {
  const map: Record<string, string> = {
    'scheduled': 'Bekliyor',
    'in_progress': 'İşlemde',
    'completed': 'Tamamlandı',
    'cancelled': 'İptal',
    'grading': 'Değerlendirme',
    'certified': 'Sertifikalı'
  }
  return map[status] || status
}

function Badge({ color, label, ghost = false }: { color: string, label: string, ghost?: boolean }) {
  return (
    <div style={{
      padding: '4px 12px',
      borderRadius: '100px',
      fontSize: '10px',
      fontWeight: 900,
      background: ghost ? '#fff' : color,
      color: ghost ? color : '#fff',
      border: ghost ? `1.5px solid ${color}` : 'none',
      textTransform: 'uppercase',
      letterSpacing: '0.6px'
    }}>
      {label}
    </div>
  )
}

function SectionTag({ label, count, color }: { label: string, count: number, color: string }) {
  if (count === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: color + '12', color: color, padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 900 }}>
      {label} <span style={{ opacity: 0.6 }}>{count}</span>
    </div>
  )
}

function MetaItem({ icon, label, value }: { icon: string, label: string, value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '10px', color: 'var(--t3)', fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
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
        width: flex ? 'auto' : '100%',
        boxShadow: filled ? `0 4px 12px ${color}40` : 'none'
      }}
      onMouseOver={e => { if(filled) e.currentTarget.style.opacity = '0.9'; else e.currentTarget.style.background = 'var(--off)' }}
      onMouseOut={e => { if(filled) e.currentTarget.style.opacity = '1'; else e.currentTarget.style.background = '#fff' }}
    >
      <span style={{ fontSize: sm ? '14px' : '16px' }}>{icon}</span>
      {label}
    </button>
  )
}

function Modal({ title, children, onClose }: any) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(12,31,63,0.4)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--navy)', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', opacity: 0.5 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)' }}>{value}</div>
    </div>
  )
}
