'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const COLORS: Record<string, string> = {
  A1: '#EF4444', A2: '#F97316', B1: '#EAB308', B2: '#22C55E', C1: '#3B82F6', C2: '#7C3AED'
}

function CEFRBar({ level, count, max }: { level: string; count: number; max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
      <span style={{ width: '28px', fontWeight: 800, fontSize: '12px', color: COLORS[level], textAlign: 'center' }}>{level}</span>
      <div style={{ flex: 1, height: '20px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${max > 0 ? (count / max) * 100 : 0}%`,
          background: COLORS[level],
          borderRadius: '10px',
          transition: 'width 0.6s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px'
        }}>
          {count > 0 && <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>{count}</span>}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'var(--fm)', color: color || 'var(--navy)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

export default function HRAnalyticsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<any[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const adminId = localStorage.getItem('adminId')
    const adminRole = localStorage.getItem('adminRole')
    if (!adminId || !['super_admin', 'hr_manager'].includes(adminRole || '')) {
      router.push('/login')
      return
    }
    loadData()
  }, [])

  async function loadData() {
    const [{ data: examsData }, { data: orgsData }] = await Promise.all([
      supabase
        .from('exams')
        .select('*, candidates:users!exams_candidate_id_fkey(full_name, email, org_id, organizations(name)), exam_templates(name, passing_cefr)')
        .not('final_cefr_score', 'is', null),
      supabase.from('organizations').select('id, name')
    ])
    setExams(examsData || [])
    setOrgs(orgsData || [])
    setLoading(false)
  }

  const filtered = useMemo(() =>
    selectedOrg === 'all' ? exams : exams.filter(e => e.candidates?.org_id === selectedOrg),
    [exams, selectedOrg]
  )

  const cefrDist = useMemo(() => {
    const dist: Record<string, number> = {}
    CEFR_ORDER.forEach(l => { dist[l] = 0 })
    filtered.forEach(e => { if (e.final_cefr_score) dist[e.final_cefr_score] = (dist[e.final_cefr_score] || 0) + 1 })
    return dist
  }, [filtered])

  const maxCEFR = Math.max(...Object.values(cefrDist))

  const passRate = useMemo(() => {
    const passed = filtered.filter(e => {
      const passing = e.exam_templates?.passing_cefr || 'B2'
      return CEFR_ORDER.indexOf(e.final_cefr_score) >= CEFR_ORDER.indexOf(passing)
    }).length
    return filtered.length > 0 ? Math.round((passed / filtered.length) * 100) : 0
  }, [filtered])

  const avgScore = useMemo(() => {
    const scores = filtered.filter(e => e.final_numeric_score != null).map(e => e.final_numeric_score)
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  }, [filtered])

  const mostCommonCEFR = useMemo(() => {
    let max = 0, level = '—'
    Object.entries(cefrDist).forEach(([l, c]) => { if (c > max) { max = c; level = l } })
    return level
  }, [cefrDist])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--fb)' }}>Loading analytics...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: 'var(--fb)' }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--fm)', fontSize: '22px', fontWeight: 900, color: '#fff' }}>HR Analytics</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Exam Performance Overview</div>
        </div>
        <button onClick={() => router.back()} style={{ padding: '8px 20px', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
      </div>

      <div style={{ padding: '32px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Org Filter */}
        <div style={{ marginBottom: '28px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>Filter by Organization:</span>
          <button onClick={() => setSelectedOrg('all')} style={{ padding: '6px 16px', borderRadius: '20px', border: '1.5px solid', borderColor: selectedOrg === 'all' ? 'var(--navy)' : '#E5E7EB', background: selectedOrg === 'all' ? 'var(--navy)' : '#fff', color: selectedOrg === 'all' ? '#fff' : '#374151', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>All Organizations</button>
          {orgs.map(o => (
            <button key={o.id} onClick={() => setSelectedOrg(o.id)} style={{ padding: '6px 16px', borderRadius: '20px', border: '1.5px solid', borderColor: selectedOrg === o.id ? 'var(--navy)' : '#E5E7EB', background: selectedOrg === o.id ? 'var(--navy)' : '#fff', color: selectedOrg === o.id ? '#fff' : '#374151', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{o.name}</button>
          ))}
        </div>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard label="Total Exams" value={filtered.length} sub="Scored exams" />
          <StatCard label="Pass Rate" value={`${passRate}%`} sub="Met CEFR target" color={passRate >= 70 ? '#16A34A' : '#DC2626'} />
          <StatCard label="Average Score" value={`${avgScore}%`} sub="Numeric average" />
          <StatCard label="Most Common Level" value={mostCommonCEFR} sub="CEFR cluster" color={COLORS[mostCommonCEFR]} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* CEFR Distribution */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontFamily: 'var(--fm)', fontSize: '16px', fontWeight: 800, color: 'var(--navy)', marginBottom: '24px' }}>CEFR Distribution</h2>
            {CEFR_ORDER.map(l => <CEFRBar key={l} level={l} count={cefrDist[l] || 0} max={maxCEFR} />)}
          </div>

          {/* Candidate Table */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <h2 style={{ fontFamily: 'var(--fm)', fontSize: '16px', fontWeight: 800, color: 'var(--navy)', marginBottom: '20px' }}>Recent Results</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', fontSize: '11px' }}>Candidate</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', fontSize: '11px' }}>Score</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', fontSize: '11px' }}>CEFR</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 12).map((e, i) => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#FAFAFA' : '#fff' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{e.candidates?.full_name || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{e.candidates?.email}</div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 800, color: 'var(--navy)' }}>{e.final_numeric_score ?? '—'}%</td>
                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', background: COLORS[e.final_cefr_score] || '#6B7280', color: '#fff', fontSize: '12px', fontWeight: 800 }}>
                          {e.final_cefr_score || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>No data available for this filter</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
