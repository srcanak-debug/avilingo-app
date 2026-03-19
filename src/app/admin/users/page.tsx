'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import UsersList from '../components/UsersList'

export default function UsersPage() {
  const [userList, setUserList] = useState<any[]>([])
  const [uLoading, setULoading] = useState(true)
  const [uPage, setUPage] = useState(0)
  const [uTotal, setUTotal] = useState(0)
  const [uSearch, setUSearch] = useState('')

  useEffect(() => {
    loadUsers()
  }, [uPage, uSearch])

  async function loadUsers() {
    setULoading(true);
    let query = supabase
      .from("users")
      .select("*, organizations(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(uPage * 20, (uPage + 1) * 20 - 1);

    if (uSearch) query = query.ilike("full_name", `%${uSearch}%`);

    const { data, count, error } = await query;
    if (error) {
       console.error("LoadUsers Error:", error.message);
    }
    setUserList(data || []);
    setUTotal(count || 0);
    setULoading(false);
  }

  return (
    <UsersList 
      userList={userList}
      uLoading={uLoading}
      uSearch={uSearch}
      setUSearch={setUSearch}
      loadUsers={loadUsers}
      setEditUser={() => {}}
      setFormUser={() => {}}
      setShowUserForm={() => {}}
      setDetailUser={() => {}}
    />
  )
}
