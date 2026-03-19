'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import TemplatesList from '../components/TemplatesList'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [tLoading, setTLoading] = useState(false)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editTemplate, setEditTemplate] = useState<any>(null)
  
  const sections = ['grammar', 'reading', 'writing', 'speaking', 'listening', 'dla']
  const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const sectionColors: Record<string, string> = {
    grammar: '#3b82f6', reading: '#10b981', writing: '#f59e0b', speaking: '#ef4444', listening: '#8b5cf6', dla: '#10b981'
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setTLoading(true)
    const { data } = await supabase.from('exam_templates').select('*,organizations(name)').order('created_at', { ascending: false })
    setTemplates(data || [])
    setTLoading(false)
  }

  const duplicateTemplate = async (t: any) => {
    const { id, created_at, organizations, ...rest } = t
    const { error } = await supabase.from('exam_templates').insert([{ ...rest, name: t.name + ' (Copy)' }])
    if (error) alert(error.message)
    else loadTemplates()
  }

  const startSingleDeleteTemplate = async (t: any) => {
    if (!confirm(`Are you sure you want to delete "${t.name}"?`)) return
    const { error } = await supabase.from('exam_templates').delete().eq('id', t.id)
    if (error) alert(error.message)
    else loadTemplates()
  }

  return (
    <div style={{ position: 'relative' }}>
      <TemplatesList 
        templates={templates}
        tLoading={tLoading}
        sections={sections}
        sectionColors={sectionColors}
        cefrLevels={cefrLevels}
        setShowTemplateForm={setShowTemplateForm}
        duplicateTemplate={duplicateTemplate}
        startSingleDeleteTemplate={startSingleDeleteTemplate}
      />
    </div>
  )
}
