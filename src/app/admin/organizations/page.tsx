'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import OrganizationList from '../components/OrganizationList'

export default function OrganizationsPage() {
  const [orgList, setOrgList] = useState<any[]>([])
  const [oLoading, setOLoading] = useState(true)
  const [oPage, setOPage] = useState(0)
  const [oTotal, setOTotal] = useState(0)
  const [oSearch, setOSearch] = useState('')

  useEffect(() => {
    loadOrgs()
  }, [oPage, oSearch])

  async function loadOrgs() {
    setOLoading(true);
    let query = supabase
      .from("organizations")
      .select("*", { count: "exact" })
      .order("name", { ascending: true })
      .range(oPage * 20, (oPage + 1) * 20 - 1);

    if (oSearch) query = query.ilike("name", `%${oSearch}%`);

    const { data, count, error } = await query;
    if (error) {
       console.error("LoadOrgs Error:", error.message);
       // alert("Organizasyon verileri alınırken bir sorun oluştu (RLS/Database Error).");
    }
    setOrgList(data || []);
    setOTotal(count || 0);
    setOLoading(false);
  }

  return (
    <OrganizationList 
      orgList={orgList}
      oLoading={oLoading}
      setEditOrg={() => {}}
      setFormOrg={() => {}}
      setShowOrgForm={() => {}}
      setDetailOrg={() => {}}
      setOrgStep={() => {}}
      startEditOrg={() => {}}
      startSingleDeleteOrg={() => {}}
    />
  )
}
