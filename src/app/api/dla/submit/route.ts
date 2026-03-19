import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { examId, questionId, questionOrder, section, responseText, timespentSec, skipped } = body

    if (!examId || !questionOrder) {
      return NextResponse.json({ error: 'examId ve questionOrder zorunlu' }, { status: 400 })
    }

    // Sınavın bu kullanıcıya ait olduğunu doğrula
    const { data: exam } = await supabase
      .from('dla_exams')
      .select('id, status, current_question, total_questions')
      .eq('id', examId)
      .eq('candidate_id', user.id)
      .single()

    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    if (exam.status === 'completed') return NextResponse.json({ error: 'Exam already completed' }, { status: 400 })

    // Cevabı kaydet (upsert — tekrar gönderilirse güncelle)
    const { error: answerError } = await supabase
      .from('dla_answers')
      .upsert({
        dla_exam_id: examId,
        question_id: questionId,
        dla_section: section,
        question_order: questionOrder,
        response_text: responseText || null,
        audio_url: null, // Ses kaydı ayrıca Supabase Storage'a yüklenecek
        time_spent_sec: timespentSec || null,
        skipped: skipped || false,
      }, { onConflict: 'dla_exam_id,question_order' })

    if (answerError) {
      return NextResponse.json({ error: 'Failed to save answer: ' + answerError.message }, { status: 500 })
    }

    // current_question ilerlet
    const nextQuestion = Math.max(exam.current_question, questionOrder)
    const isLastQuestion = questionOrder >= exam.total_questions

    if (isLastQuestion) {
      // Sınavı tamamla
      await supabase
        .from('dla_exams')
        .update({
          status: 'completed',
          current_question: exam.total_questions,
          completed_at: new Date().toISOString(),
        })
        .eq('id', examId)

      // Otomatik puanlama (basit simülasyon — gelecekte AI ile değiştirilecek)
      await autoScore(examId)

      return NextResponse.json({
        success: true,
        isComplete: true,
        examId,
        message: 'Sınav tamamlandı! Sonuçlarınız hazırlanıyor.',
      })
    } else {
      await supabase
        .from('dla_exams')
        .update({ current_question: nextQuestion })
        .eq('id', examId)

      return NextResponse.json({
        success: true,
        isComplete: false,
        currentQuestion: nextQuestion,
        totalQuestions: exam.total_questions,
      })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Basit otomatik puanlama (Demo amaçlı — gerçek sistemde speech-to-text + AI kullanılacak)
async function autoScore(examId: string) {
  const { data: answers } = await supabase
    .from('dla_answers')
    .select('*')
    .eq('dla_exam_id', examId)

  if (!answers || answers.length === 0) return

  const scores: any[] = []

  for (const answer of answers) {
    // Demo scoring: skipped = 0, answered = random 5-9
    if (answer.skipped) {
      scores.push({
        dla_answer_id: answer.id,
        dla_exam_id: examId,
        pronunciation:  0,
        comprehension:  0,
        grammar:        0,
        vocabulary:     0,
        total_score:    0,
        ai_feedback:    'No response recorded.',
        scored_by:      'ai',
      })
    } else {
      const p = +(5 + Math.random() * 4).toFixed(1)
      const c = +(5 + Math.random() * 4).toFixed(1)
      const g = +(5 + Math.random() * 4).toFixed(1)
      const v = +(5 + Math.random() * 4).toFixed(1)
      scores.push({
        dla_answer_id: answer.id,
        dla_exam_id: examId,
        pronunciation:  p,
        comprehension:  c,
        grammar:        g,
        vocabulary:     v,
        total_score:    +((p + c + g + v) / 4).toFixed(1),
        ai_feedback:    generateFeedback(p, c, g, v),
        scored_by:      'ai',
      })
    }
  }

  await supabase.from('dla_scores').insert(scores)

  // Genel ortalama hesapla
  const validScores = scores.filter(s => !s.skipped)
  if (validScores.length === 0) return

  const avg = (key: string) =>
    +(validScores.reduce((sum, s) => sum + (s[key] || 0), 0) / validScores.length).toFixed(1)

  const pronAvg  = avg('pronunciation')
  const compAvg  = avg('comprehension')
  const gramAvg  = avg('grammar')
  const vocabAvg = avg('vocabulary')
  const totalAvg = +((pronAvg + compAvg + gramAvg + vocabAvg) / 4).toFixed(1)
  const rawScore = +(totalAvg * 10).toFixed(1) // 0-100 arası

  const resultLabel = rawScore >= 70 ? 'Geçti' : rawScore >= 50 ? 'Sınırda' : 'Kaldı'
  let retryDate: string | null = null
  if (rawScore >= 90) retryDate = new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString()
  else if (rawScore >= 70) retryDate = new Date(Date.now() + 2 * 365 * 24 * 3600 * 1000).toISOString()

  await supabase
    .from('dla_exams')
    .update({
      status:             'scored',
      raw_score:          rawScore,
      pronunciation_avg:  pronAvg,
      comprehension_avg:  compAvg,
      grammar_avg:        gramAvg,
      vocabulary_avg:     vocabAvg,
      result_label:       resultLabel,
      retry_available_at: retryDate,
    })
    .eq('id', examId)
}

function generateFeedback(p: number, c: number, g: number, v: number): string {
  const feedbacks: string[] = []
  if (p < 6) feedbacks.push('Work on pronunciation clarity.')
  if (c < 6) feedbacks.push('Focus on understanding and answering the question directly.')
  if (g < 6) feedbacks.push('Review grammar structures used in your response.')
  if (v < 6) feedbacks.push('Expand your vocabulary with more specific terms.')
  if (feedbacks.length === 0) return 'Good response — clear, relevant, and well-structured.'
  return feedbacks.join(' ')
}
