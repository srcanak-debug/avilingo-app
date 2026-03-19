'use client'
import { supabase } from '@/lib/supabase'
import ActiveExams from '../components/ActiveExams'
import { useAdmin } from '../AdminContext'

export default function ActiveExamsPage() {
  const { adminId } = useAdmin()
  
  return <ActiveExams adminId={adminId || ''} />
}
