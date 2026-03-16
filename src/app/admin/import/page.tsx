'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function ImportPage() {
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const sectionColors: Record<string,string> = {
    grammar:'#3A8ED0', reading:'#0A8870', writing:'#B8881A',
    speaking:'#B83040', listening:'#7C3AED'
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i+1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(current); current = ''
      } else { current += ch }
    }
    result.push(current)
    return result
  }

  function parseCSV(text: string) {
    const lines = text.split('\n')
    const headers = parseCSVLine(lines[0])
    const rows: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      const vals = parseCSVLine(line)
      const obj: any = {}
      headers.forEach((h, idx) => { obj[h.trim().toLowerCase()] = vals[idx]?.trim() || '' })
      rows.push(obj)
    }
    return rows
  }

  function mapRow(row: any) {
    const section = ['grammar','reading','writing','speaking','listening'].includes(row.section?.toLowerCase())
      ? row.section.toLowerCase() : 'grammar'
    const cefr = ['A1','A2','B1','B2','C1','C2'].includes(row.cefr_level?.toUpperCase())
      ? row.cefr_level.toUpperCase() : 'B1'
    const difficulty = ['easy','medium','hard'].includes(row.difficulty?.toLowerCase())
      ? row.difficulty.toLowerCase() : 'medium'
    return {
      content: row.content || '',
      correct_answer: row.correct_answer || '',
      cefr_level: cefr,
      difficulty,
      section,
      competency_tag: (row.competency_tags || '').split('|')[0].trim().replace(/\s+/g,'_').toLowerCase().substring(0,50),
      aircraft_context: row.aircraft_context || '',
      audio_url: row.audio_url || '',
      active: true,
      type: section === 'speaking' ? 'audio_response' : section === 'writing' ? 'written_response' : section === 'listening' ? 'listening' : 'multiple_choice'
    }
  }

  const [file, setFile] = useState<File|null>(null)

  async function handleFile(f: File) {
    setStatus('Reading file...'); setErrors([]); setPreview([])
    const text = await f.text()
    const rows = parseCSV(text)
    const mapped = rows.filter(r => r.content).map(mapRow)
    setTotal(mapped.length)
    setPreview(mapped.slice(0,5))
    setStatus(`✅ Ready to import ${mapped.length.toLocaleString()} questions. Preview below.`)
  }

  async function runImport() {
    if (!file) return
    setRunning(true); setErrors([]); setDone(0); setProgress(0)
    const text = await file.text()
    const rows = parseCSV(text)
    const mapped = rows.filter(r => r.content).map(mapRow)
    setTotal(mapped.length)
    const BATCH = 100
    const errs: string[] = []
    for (let i = 0; i < mapped.length; i += BATCH) {
      const batch = mapped.slice(i, i + BATCH)
      const { error } = await supabase.from('questions').insert(batch)
      if (error) errs.push(`Batch ${Math.floor(i/BATCH)+1}: ${error.message}`)
      const completed = Math.min(i + BATCH, mapped.length)
      setDone(completed)
      setProgress(Math.round((completed / mapped.length) * 100))
      setStatus(`Importing... ${completed.toLocaleString()} / ${mapped.length.toLocaleString()}`)
    }
    setErrors(errs)
    setRunning(false)
    setStatus(errs.length === 0 ? `🎉 Successfully imported all ${mapped.length.toLocaleString()} questions!` : `⚠️ Imported with ${errs.length} errors.`)
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--off)',fontFamily:'var(--fb)',padding:'40px'}}>
      <div style={{maxWidth:'860px',margin:'0 auto'}}>
        <div style={{marginBottom:'28px'}}>
          <a href="/admin" style={{fontSize:'13px',color:'var(--sky)',textDecoration:'none'}}>← Back to Admin</a>
          <h1 style={{fontFamily:'var(--fm)',fontSize:'26px',fontWeight:900,color:'var(--navy)',marginTop:'10px',marginBottom:'4px'}}>Bulk Question Import</h1>
          <p style={{fontSize:'13.5px',color:'var(--t3)'}}>Upload your questions-enhanced-with-tags.csv — all {'{7,500+}'} questions imported automatically.</p>
        </div>

        <div style={{background:'#fff',borderRadius:'12px',padding:'18px',border:'1px solid var(--bdr)',marginBottom:'18px'}}>
          <h3 style={{fontFamily:'var(--fm)',fontSize:'13px',fontWeight:800,color:'var(--navy)',marginBottom:'10px'}}>Column mapping</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
            {[['content','question text'],['correct_answer','answer key'],['cefr_level','A1–C1'],['difficulty','easy/medium/hard'],['section','grammar/reading/writing/speaking/listening'],['competency_tags','first tag used'],['target_departments','stored for assignment'],['target_roles','stored for assignment']].map(([col,desc]) => (
              <div key={col} style={{fontSize:'12px',padding:'5px 10px',background:'var(--off)',borderRadius:'5px',display:'flex',gap:'6px'}}>
                <code style={{color:'var(--sky)',fontWeight:700}}>{col}</code>
                <span style={{color:'var(--t3)'}}>→ {desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'2px solid var(--sky)'}}>
          <div onClick={() => fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){setFile(f);handleFile(f)}}} style={{border:'2px dashed var(--bdr)',borderRadius:'10px',padding:'32px',textAlign:'center',cursor:'pointer',background:'var(--off)',marginBottom:'14px'}}>
            <div style={{fontSize:'32px',marginBottom:'8px'}}>📊</div>
            <div style={{fontSize:'14px',fontWeight:600,color:'var(--navy)',marginBottom:'3px'}}>Drop CSV file here or click to browse</div>
            <div style={{fontSize:'12px',color:'var(--t3)'}}>questions-enhanced-with-tags.csv</div>
            <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f){setFile(f);handleFile(f)}}} />
          </div>

          {status && <div style={{padding:'11px 14px',borderRadius:'8px',marginBottom:'12px',fontSize:'13.5px',fontWeight:500,background:status.includes('🎉')?'#EAF3DE':status.includes('⚠️')?'#FAEEDA':status.includes('✅')?'var(--sky3)':'var(--off)',color:status.includes('🎉')?'#27500A':status.includes('⚠️')?'#633806':status.includes('✅')?'#0C447C':'var(--t2)'}}>{status}</div>}

          {running && (
            <div style={{marginBottom:'14px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'12.5px',color:'var(--t2)',marginBottom:'5px'}}>
                <span>Importing in batches of 100...</span><span>{done.toLocaleString()} / {total.toLocaleString()} ({progress}%)</span>
              </div>
              <div style={{height:'8px',background:'var(--off)',borderRadius:'4px',overflow:'hidden',border:'1px solid var(--bdr)'}}>
                <div style={{height:'100%',background:'var(--sky)',borderRadius:'4px',width:`${progress}%`,transition:'width 0.3s'}}></div>
              </div>
            </div>
          )}

          {preview.length > 0 && (
            <div style={{marginBottom:'14px'}}>
              <div style={{fontSize:'12.5px',fontWeight:700,color:'var(--navy)',marginBottom:'8px'}}>Preview — first 5 questions:</div>
              <div style={{border:'1px solid var(--bdr)',borderRadius:'8px',overflow:'hidden'}}>
                {preview.map((q,i) => (
                  <div key={i} style={{padding:'9px 13px',borderBottom:i<4?'1px solid var(--bdr)':'none',background:i%2===0?'#fff':'#FAFBFC'}}>
                    <div style={{display:'flex',gap:'5px',marginBottom:'2px',flexWrap:'wrap'}}>
                      <span style={{fontSize:'10.5px',fontWeight:700,padding:'1px 6px',borderRadius:'100px',background:(sectionColors[q.section]||'#888')+'20',color:sectionColors[q.section]||'#888',textTransform:'capitalize'}}>{q.section}</span>
                      <span style={{fontSize:'10.5px',padding:'1px 6px',borderRadius:'100px',background:'var(--sky3)',color:'var(--sky)',fontWeight:600}}>{q.cefr_level}</span>
                      <span style={{fontSize:'10.5px',padding:'1px 6px',borderRadius:'100px',background:'#F1EFE8',color:'#5F5E5A',fontWeight:600,textTransform:'capitalize'}}>{q.difficulty}</span>
                    </div>
                    <div style={{fontSize:'12.5px',color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.content}</div>
                    {q.correct_answer && <div style={{fontSize:'11px',color:'#27500A'}}>✓ {q.correct_answer.substring(0,80)}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {file && total > 0 && !running && !status.includes('🎉') && (
            <button onClick={runImport} style={{padding:'12px 32px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
              ✓ Import All {total.toLocaleString()} Questions
            </button>
          )}

          {status.includes('🎉') && (
            <a href="/admin" style={{padding:'12px 24px',borderRadius:'8px',border:'none',background:'var(--navy)',color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)',textDecoration:'none',display:'inline-block'}}>
              → Go to Question Bank
            </a>
          )}

          {errors.length > 0 && (
            <div style={{marginTop:'12px',padding:'12px',background:'#FEE2E2',borderRadius:'8px'}}>
              {errors.map((e,i) => <div key={i} style={{fontSize:'12px',color:'#991B1B'}}>{e}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
