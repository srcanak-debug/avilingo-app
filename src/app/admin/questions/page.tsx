'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import QuestionBank from '../components/QuestionBank'

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [qLoading, setQLoading] = useState(true)
  const [qPage, setQPage] = useState(0)
  const [qTotal, setQTotal] = useState(0)
  const [qSearch, setQSearch] = useState('')
  const [qSection, setQSection] = useState('')
  const [qCefr, setQCefr] = useState('')
  const [qDifficulty, setQDifficulty] = useState('')
  const [qStatus, setQStatus] = useState('')
  const [qTag, setQTag] = useState('')
  const [qSort, setQSort] = useState('created_at_desc')
  const [qRole, setQRole] = useState('')
  const [qPageSize, setQPageSize] = useState(25)
  const [selectedQIds, setSelectedQIds] = useState<string[]>([])
  const [qLoadedOnce, setQLoadedOnce] = useState(false)
  const [filtersPending, setFiltersPending] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  
  const [bulkText, setBulkText] = useState('')
  const [bulkParsed, setBulkParsed] = useState<any[]>([])
  const [bulkStatus, setBulkStatus] = useState('idle')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkSection, setBulkSection] = useState('')
  const [bulkCefr, setBulkCefr] = useState('')
  const [bulkDifficulty, setBulkDifficulty] = useState('')
  const [aiProgress, setAiProgress] = useState(0)

  const runQuery = useCallback(async (page = qPage, overrides: any = {}) => {
    setQLoading(true)
    let query = supabase.from('questions').select('*', { count: 'exact' })
    if (qSection) query = query.eq('section', qSection)
    if (qCefr) query = query.eq('cefr', qCefr)
    if (qSearch) query = query.ilike('question_text', `%${qSearch}%`)
    
    query = query.range(page * qPageSize, (page + 1) * qPageSize - 1)
    
    const { data, count, error } = await query
    setQuestions(data || [])
    setQTotal(count || 0)
    setQLoading(false)
    setQLoadedOnce(true)
  }, [qPage, qSection, qCefr, qSearch, qPageSize])

  useEffect(() => { runQuery() }, [runQuery])

  return (
    <QuestionBank 
      questions={questions}
      qLoading={qLoading}
      qLoadedOnce={qLoadedOnce}
      qTotal={qTotal}
      qPage={qPage}
      qPageSize={qPageSize}
      selectedQIds={selectedQIds}
      qSearch={qSearch}
      qSection={qSection}
      qCefr={qCefr}
      qDifficulty={qDifficulty}
      qStatus={qStatus}
      qTag={qTag}
      qSort={qSort}
      qRole={qRole}
      filtersPending={filtersPending}
      showAI={showAI}
      showBulk={showBulk}
      aiQueue={[]}
      aiProcessing={false}
      aiProgress={aiProgress}
      bulkText={bulkText}
      bulkParsed={bulkParsed}
      bulkStatus={bulkStatus}
      bulkLoading={bulkLoading}
      bulkSection={bulkSection}
      bulkCefr={bulkCefr}
      bulkDifficulty={bulkDifficulty}
      setQSearch={setQSearch}
      setQSection={setQSection}
      setQCefr={setQCefr}
      setQDifficulty={setQDifficulty}
      setQStatus={setQStatus}
      setQTag={setQTag}
      setQSort={setQSort}
      setQRole={setQRole}
      setQPage={setQPage}
      setQPageSize={setQPageSize}
      setFiltersPending={setFiltersPending}
      setShowAI={setShowAI}
      setShowBulk={setShowBulk}
      setShowForm={() => {}}
      setSelectedQIds={setSelectedQIds}
      setAiQueue={() => {}}
      setAiProgress={setAiProgress}
      setBulkText={setBulkText}
      setBulkParsed={setBulkParsed}
      setBulkStatus={setBulkStatus}
      setBulkLoading={setBulkLoading}
      setBulkSection={setBulkSection}
      setBulkCefr={setBulkCefr}
      setBulkDifficulty={setBulkDifficulty}
      applyFilters={() => runQuery(0)}
      runQuery={runQuery}
      toggleSelect={() => {}}
      toggleSelectAll={() => {}}
      toggleActive={() => {}}
      startSingleDelete={() => {}}
      startBulkDelete={() => {}}
      startEdit={() => {}}
      resetForm={() => {}}
      exportQuestions={() => {}}
      loadAIFile={() => {}}
      runAITagging={() => {}}
      approveAll={() => {}}
      handleFileUpload={() => {}}
      parseText={() => []}
      confirmBulkUpload={() => {}}
      setDetailQ={() => {}}
      bulkToggleActive={async () => {}}
    />
  )
}
