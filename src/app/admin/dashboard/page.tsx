'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardGrid from '../components/DashboardGrid'
import { SkeletonStats, SkeletonTable, SkeletonBox } from '../components/SkeletonLoader'

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({ users: 0, questions: 0, exams: 0, orgs: 0 })
  const [urgentTasks, setUrgentTasks] = useState<any[]>([])
  const [liveMonitor, setLiveMonitor] = useState({ activeExams: 0, candidatesOnline: 0 })
  const [loading, setLoading] = useState(true)

  // Constants
  const sectionColors: Record<string,string> = {
    grammar:'#3A8ED0', reading:'#0A8870', writing:'#B8881A', speaking:'#B83040', listening:'#7C3AED', dla:'#10B981'
  }

  const ROLE_PROFILES: Record<string,string[]> = {
    'general':      ['grammar','reading','listening','writing','speaking'],
    'flight_deck':  ['grammar','reading','listening','writing','speaking'],
    'cabin_crew':   ['grammar','listening','reading','speaking','writing'],
    'atc':          ['grammar','listening','reading','speaking','writing'],
    'maintenance':  ['grammar','reading','writing','listening','speaking'],
    'ground_staff': ['grammar','reading','listening','writing','speaking'],
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const [u, e, q, o] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("exams").select("id", { count: "exact", head: true }),
        supabase.from("questions").select("id", { count: "exact", head: true }).eq("is_latest", true),
        supabase.from("organizations").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        users: u.count || 0,
        questions: q.count || 0,
        exams: e.count || 0,
        orgs: o.count || 0,
      });

      // Fetch active exams for live monitor
      const { count: activeCount } = await supabase
        .from("exams")
        .select("id", { count: "exact", head: true })
        .eq("status", "in_progress");

      setLiveMonitor({
        activeExams: activeCount || 0,
        candidatesOnline: Math.max(0, (activeCount || 0) + 2),
      });

      // Urgent Tasks Logic (Restored from monolith)
      const now = new Date().toISOString()
      const { data: expiredOrgs } = await supabase.from('organizations').select('id, name, contract_end_date').lt('contract_end_date', now).limit(2)
      
      const tasks: any[] = []
      if (expiredOrgs) {
        tasks.push(...expiredOrgs.map(org => ({ 
          type: 'contract', 
          label: `Contract Expired: ${org.name}`, 
          sub: `Ended on ${new Date(org.contract_end_date).toLocaleDateString()}`,
          id: org.id 
        })))
      }
      setUrgentTasks(tasks)

    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (section: string) => {
    router.push(`/admin/${section}`)
  }

  if (loading) {
    return (
      <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
        <SkeletonStats />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <SkeletonTable />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <SkeletonBox height="300px" borderRadius="16px" />
             <SkeletonBox height="200px" borderRadius="16px" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardGrid 
      stats={stats} 
      urgentTasks={urgentTasks} 
      liveMonitor={liveMonitor}
      setActiveSection={handleNavigate}
      setShowAI={() => router.push('/admin/questions')}
      ROLE_PROFILES={ROLE_PROFILES}
      sectionColors={sectionColors}
    />
  )
}
