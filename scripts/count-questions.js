#!/usr/bin/env node
/**
 * count-questions.js
 * Supabase'deki mevcut soru sayısını role ve bölüme göre gösterir
 * Çalıştırma: node scripts/count-questions.js
 */

const SUPABASE_URL = 'https://zpqnidyhfrejkxuxlbeg.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwcW5pZHloZnJlamt4dXhsYmVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU5MzUwNCwiZXhwIjoyMDg5MTY5NTA0fQ.GsD6G9B6JiXjFX1dRkrMYPbvRRzp90E5LgFiNgKWiww'

async function query(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    }
  })
  return res.json()
}

async function main() {
  console.log('\n📊 Avilingo — Soru Havuzu Durumu\n' + '='.repeat(55))

  const questions = await query('questions',
    'select=id,section,role_tag,type,audio_url&active=eq.true&is_latest=eq.true&limit=5000'
  )

  if (!Array.isArray(questions)) {
    console.error('❌ Supabase bağlantı hatası:', questions)
    return
  }

  console.log(`\nToplam aktif soru: ${questions.length}\n`)

  // Role bazlı dağılım
  const byRole = {}
  const byRoleSection = {}
  const byRoleType = {}

  for (const q of questions) {
    const role = q.role_tag || 'unknown'
    const section = q.section || 'unknown'
    const type = q.type || 'unknown'

    byRole[role] = (byRole[role] || 0) + 1

    const key = `${role}::${section}`
    byRoleSection[key] = (byRoleSection[key] || 0) + 1

    const tkey = `${role}::${type}`
    byRoleType[tkey] = (byRoleType[tkey] || 0) + 1
  }

  const roles = ['general', 'flight_deck', 'cabin_crew', 'atc', 'maintenance', 'ground_staff']
  const sections = ['grammar', 'reading', 'listening', 'writing', 'speaking']

  console.log('ROLE BAZLI DAĞILIM')
  console.log('-'.repeat(55))
  console.log('Rol'.padEnd(18) + 'Toplam'.padStart(8) + '  Hedef'.padStart(8) + '  Durum')
  console.log('-'.repeat(55))

  for (const role of roles) {
    const count = byRole[role] || 0
    const status = count >= 500 ? '✅' : count >= 300 ? '⚠️ ' : '❌'
    console.log(role.padEnd(18) + String(count).padStart(8) + '  500'.padStart(8) + `  ${status}`)
  }

  console.log('\n\nROL × BÖLÜM DAĞILIMI')
  console.log('-'.repeat(70))
  process.stdout.write('Rol'.padEnd(18))
  for (const s of sections) process.stdout.write(s.substring(0,7).padStart(10))
  console.log('  TOPLAM')
  console.log('-'.repeat(70))

  for (const role of roles) {
    process.stdout.write(role.padEnd(18))
    let total = 0
    for (const section of sections) {
      const cnt = byRoleSection[`${role}::${section}`] || 0
      total += cnt
      process.stdout.write(String(cnt).padStart(10))
    }
    console.log(`  ${total}`)
  }

  // Listening with audio
  const withAudio = questions.filter(q => q.section === 'listening' && q.audio_url)
  const withoutAudio = questions.filter(q => q.section === 'listening' && !q.audio_url)
  console.log('\n\nLISTENING SORULARININ SES DURUMU')
  console.log('-'.repeat(40))
  console.log(`Ses var  : ${withAudio.length}`)
  console.log(`Ses yok  : ${withoutAudio.length}`)

  console.log('\n\nSORU TİPİ DAĞILIMI (tüm roller)')
  console.log('-'.repeat(40))
  const types = {}
  for (const q of questions) types[q.type] = (types[q.type] || 0) + 1
  for (const [t, c] of Object.entries(types).sort((a,b) => b[1]-a[1]))
    console.log(`${t.padEnd(20)} ${c}`)

  console.log('\n')
}

main().catch(console.error)
