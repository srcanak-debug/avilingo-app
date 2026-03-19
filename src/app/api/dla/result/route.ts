import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const examId = searchParams.get('examId')
    if (!examId) return NextResponse.json({ error: 'examId required' }, { status: 400 })

    // Sınav bilgisi
    const { data: exam, error: examError } = await supabase
      .from('dla_exams')
      .select('*')
      .eq('id', examId)
      .eq('candidate_id', user.id)
      .single()

    if (examError || !exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

    // Cevaplar + sorular
    const { data: answers } = await supabase
      .from('dla_answers')
      .select('*, questions(content, dla_section, type)')
      .eq('dla_exam_id', examId)
      .order('question_order', { ascending: true })

    // Puanlar
    const { data: scores } = await supabase
      .from('dla_scores')
      .select('*')
      .eq('dla_exam_id', examId)

    // Bölüm bazlı ortalamalar
    const sectionMap: Record<string, number[]> = {
      general: [], picture: [], scenario: [], retell: []
    }

    for (const score of scores || []) {
      const answer = answers?.find(a => a.id === score.dla_answer_id)
      if (answer) {
        const sec = answer.dla_section
        if (sectionMap[sec]) {
          sectionMap[sec].push(score.total_score || 0)
        }
      }
    }

    const sectionAverages = Object.entries(sectionMap).reduce((acc, [sec, arr]) => {
      acc[sec] = arr.length > 0 ? +(arr.reduce((s, v) => s + v, 0) / arr.length * 10).toFixed(1) : null
      return acc
    }, {} as Record<string, number | null>)

    const sectionLabels: Record<string, string> = {
      general:  'Bölüm 1: Genel Sorular',
      picture:  'Bölüm 2: Görsel Anlatım',
      scenario: 'Bölüm 3: Senaryo',
      retell:   'Bölüm 4: Metin Yeniden Anlatma',
    }

    // Sonuç yorumu
    const rawScore = exam.raw_score || 0
    const interpretation = rawScore >= 70
      ? { label: 'Geçti ✓', color: '#16A34A', description: 'Tebrikler! DLA sınavından başarıyla geçtiniz.' }
      : rawScore >= 50
      ? { label: 'Sınırda', color: '#F59E0B', description: 'Puanınız geçme sınırına yakın. Pratik yaparak geliştirebilirsiniz.' }
      : { label: 'Kaldı ✗', color: '#DC2626', description: 'Geçme puanına ulaşamadınız. Daha fazla pratik önerilir.' }

    const retestDate = exam.retry_available_at
      ? new Date(exam.retry_available_at).toLocaleDateString('tr-TR', {
          year: 'numeric', month: 'long', day: 'numeric'
        })
      : null

    return NextResponse.json({
      examId,
      status: exam.status,
      rawScore,
      resultLabel: exam.result_label,
      interpretation,
      criteriaAverages: {
        pronunciation: +(exam.pronunciation_avg * 10 || 0).toFixed(1),
        comprehension: +(exam.comprehension_avg * 10 || 0).toFixed(1),
        grammar:       +(exam.grammar_avg * 10 || 0).toFixed(1),
        vocabulary:    +(exam.vocabulary_avg * 10 || 0).toFixed(1),
      },
      sectionAverages,
      sectionLabels,
      totalAnswers: answers?.length || 0,
      skipped: answers?.filter(a => a.skipped).length || 0,
      retestAvailableAt: retestDate,
      completedAt: exam.completed_at,
      answers: answers?.map(a => {
        const sc = scores?.find(s => s.dla_answer_id === a.id)
        return {
          order: a.question_order,
          section: a.dla_section,
          question: a.questions?.content,
          response: a.response_text,
          skipped: a.skipped,
          score: sc ? {
            pronunciation: sc.pronunciation,
            comprehension: sc.comprehension,
            grammar: sc.grammar,
            vocabulary: sc.vocabulary,
            total: sc.total_score,
            feedback: sc.ai_feedback,
          } : null,
        }
      }) || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
