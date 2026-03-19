import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// DLA sınavı yapısı:
// Bölüm 1 (general)  : 5 soru × 75s
// Bölüm 2 (picture)  : 2 soru × 75s
// Bölüm 3 (scenario) : 2 soru × 75s
// Bölüm 4 (retell)   : 2 soru × (15s okuma + 75s cevap)
// TOPLAM: 11 soru, ~20 dakika

const DLA_STRUCTURE = [
  { section: 'general',  count: 5 },
  { section: 'picture',  count: 2 },
  { section: 'scenario', count: 2 },
  { section: 'retell',   count: 2 },
]

export async function POST(req: NextRequest) {
  try {
    // Auth kontrolü
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Kullanıcı bilgisi
    const { data: userData } = await supabase
      .from('users')
      .select('id, org_id, role')
      .eq('id', user.id)
      .single()

    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Aktif DLA sınavı var mı kontrol et
    const { data: existingExam } = await supabase
      .from('dla_exams')
      .select('id, status')
      .eq('candidate_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingExam) {
      // Devam eden sınav varsa onu döndür
      const { data: questions } = await supabase
        .from('dla_exam_questions')
        .select('*, questions(*)')
        .eq('dla_exam_id', existingExam.id)
        .order('question_order', { ascending: true })

      return NextResponse.json({
        examId: existingExam.id,
        status: existingExam.status,
        questions: questions?.map(formatQuestion) || [],
        resumed: true,
      })
    }

    // Yeni DLA sınavı oluştur
    const { data: newExam, error: examError } = await supabase
      .from('dla_exams')
      .insert({
        candidate_id: user.id,
        org_id: userData.org_id,
        status: 'pending',
        total_questions: 11,
        current_question: 0,
      })
      .select()
      .single()

    if (examError || !newExam) {
      return NextResponse.json({ error: 'Failed to create exam: ' + examError?.message }, { status: 500 })
    }

    // Her bölüm için soruları rastgele çek
    const selectedQuestions: any[] = []
    let orderIndex = 1

    for (const { section, count } of DLA_STRUCTURE) {
      const { data: pool, error: poolError } = await supabase
        .from('questions')
        .select('id, content, dla_section, answer_time_sec, read_time_sec, image_url, reading_text, type')
        .eq('is_dla', true)
        .eq('active', true)
        .eq('dla_section', section)

      if (poolError || !pool || pool.length === 0) {
        console.warn(`No questions found for section: ${section}`)
        continue
      }

      // Rastgele seçim (Fisher-Yates)
      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, Math.min(count, shuffled.length))

      for (const q of selected) {
        selectedQuestions.push({
          dla_exam_id: newExam.id,
          question_id: q.id,
          question_order: orderIndex++,
          dla_section: section,
        })
      }
    }

    // Soruları dla_exam_questions tablosuna kaydet
    const { error: insertError } = await supabase
      .from('dla_exam_questions')
      .insert(selectedQuestions)

    if (insertError) {
      // Rollback: exam'ı sil
      await supabase.from('dla_exams').delete().eq('id', newExam.id)
      return NextResponse.json({ error: 'Failed to assign questions: ' + insertError.message }, { status: 500 })
    }

    // Sınavı aktifleştir
    await supabase
      .from('dla_exams')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', newExam.id)

    // Tam soru listesini döndür
    const { data: examQuestions } = await supabase
      .from('dla_exam_questions')
      .select('*, questions(*)')
      .eq('dla_exam_id', newExam.id)
      .order('question_order', { ascending: true })

    return NextResponse.json({
      examId: newExam.id,
      status: 'in_progress',
      questions: examQuestions?.map(formatQuestion) || [],
      totalQuestions: selectedQuestions.length,
      resumed: false,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function formatQuestion(eq: any) {
  const q = eq.questions
  return {
    questionId: eq.question_id,
    order: eq.question_order,
    section: eq.dla_section,
    content: q?.content || '',
    imageUrl: q?.image_url || null,
    readingText: q?.reading_text || null,
    answerTimeSec: q?.answer_time_sec || 75,
    readTimeSec: q?.read_time_sec || null,
    type: q?.type || 'dla_general_question',
  }
}
