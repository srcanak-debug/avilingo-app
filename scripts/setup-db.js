#!/usr/bin/env node
/**
 * setup-db.js — Reads seed SQL files and inserts questions into Supabase
 * Usage: node scripts/setup-db.js
 */
const fs = require('fs')
const path = require('path')

const URL  = 'https://zpqnidyhfrejkxuxlbeg.supabase.co'
const KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwcW5pZHloZnJlamt4dXhsYmVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU5MzUwNCwiZXhwIjoyMDg5MTY5NTA0fQ.GsD6G9B6JiXjFX1dRkrMYPbvRRzp90E5LgFiNgKWiww'

const headers = {
  'apikey': KEY,
  'Authorization': `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
}

async function supabaseInsert(rows) {
  const res = await fetch(`${URL}/rest/v1/questions`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  })
  if (!res.ok && res.status !== 409) {
    const err = await res.text()
    throw new Error(`Insert failed ${res.status}: ${err}`)
  }
}

function parseSqlFile(file) {
  const sql = fs.readFileSync(file, 'utf8')
  const rows = []

  // Extract column list
  const colMatch = sql.match(/INSERT INTO questions\s*\(([^)]+)\)/)
  if (!colMatch) return rows
  const cols = colMatch[1].split(',').map(c => c.trim())

  // Extract the VALUES block(s) — everything after VALUES until semicolon
  const valuesMatch = sql.match(/VALUES\s*([\s\S]+?);/g)
  if (!valuesMatch) return rows

  for (const block of valuesMatch) {
    const content = block.replace(/^VALUES\s*/, '')
    // Split into individual tuple strings by walking chars
    const tuples = []
    let depth = 0, start = -1, i = 0, inStr = false
    while (i < content.length) {
      const ch = content[i]
      if (ch === "'" && !inStr) { inStr = true }
      else if (ch === "'" && inStr && content[i+1] === "'") { i++ } // escaped ''
      else if (ch === "'" && inStr) { inStr = false }
      else if (!inStr && ch === '(') { depth++; if (depth === 1) start = i }
      else if (!inStr && ch === ')') {
        depth--
        if (depth === 0 && start >= 0) { tuples.push(content.slice(start+1, i)); start = -1 }
      }
      i++
    }

    for (const tuple of tuples) {
      // Parse comma-separated values with proper string handling
      const vals = []
      let cur = '', ins = false, j = 0
      while (j < tuple.length) {
        const c = tuple[j]
        if (c === "'" && !ins) { ins = true; j++; continue }
        if (c === "'" && ins && tuple[j+1] === "'") { cur += "'"; j += 2; continue }
        if (c === "'" && ins) { ins = false; j++; continue }
        if (c === ',' && !ins) { vals.push(cur); cur = ''; j++; continue }
        cur += c; j++
      }
      vals.push(cur)
      if (vals.length !== cols.length) continue

      const row = {}
      cols.forEach((col, idx) => {
        const v = vals[idx].trim()
        if (v === 'true') row[col] = true
        else if (v === 'false') row[col] = false
        else if (v === 'null' || v === 'NULL') row[col] = null
        else if (/^\d+$/.test(v)) row[col] = parseInt(v)
        else row[col] = v
      })
      rows.push(row)
    }
  }
  return rows
}

async function main() {
  const root = path.join(__dirname, '..')
  const seeds = [
    'seed-v3-general.sql',
    'seed-v3-flight-deck.sql',
    'seed-v3-cabin-crew.sql',
    'seed-v3-atc.sql',
    'seed-v3-maintenance.sql',
    'seed-v3-ground-staff.sql',
  ]

  console.log('\n🚀 Avilingo — Auto Seed v3\n' + '='.repeat(45))

  // Count existing
  const countRes = await fetch(`${URL}/rest/v1/questions?select=id&active=eq.true&is_latest=eq.true`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Prefer': 'count=exact' }
  })
  const countHeader = countRes.headers.get('content-range')
  console.log(`📊 Mevcut soru sayısı: ${countHeader?.split('/')[1] || '?'}`)
  console.log()

  let total = 0
  for (const seed of seeds) {
    const file = path.join(root, seed)
    if (!fs.existsSync(file)) { console.log(`⚠️  ${seed} bulunamadı`); continue }

    process.stdout.write(`📂 ${seed} ... `)
    const rows = parseSqlFile(file)
    if (!rows.length) { console.log('0 soru (parse edilemedi)'); continue }

    // Insert in batches of 50
    let inserted = 0
    for (let i = 0; i < rows.length; i += 50) {
      await supabaseInsert(rows.slice(i, i + 50))
      inserted += Math.min(50, rows.length - i)
    }
    console.log(`✅ ${inserted} soru eklendi`)
    total += inserted
  }

  console.log(`\n✅ Toplam eklenen: ${total} soru`)

  // Final count
  const finalRes = await fetch(`${URL}/rest/v1/questions?select=role_tag&active=eq.true&is_latest=eq.true&limit=5000`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  })
  const all = await finalRes.json()
  const byRole = {}
  for (const q of all) byRole[q.role_tag] = (byRole[q.role_tag] || 0) + 1
  console.log('\n📊 Güncel Rol Dağılımı:')
  for (const [role, cnt] of Object.entries(byRole).sort())
    console.log(`   ${role.padEnd(18)} ${cnt} ${cnt >= 500 ? '✅' : '❌'}`)
  console.log()
}

main().catch(console.error)
