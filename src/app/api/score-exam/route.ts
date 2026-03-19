import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function mapToCEFR(percentage: number): string {
  if (percentage >= 91) return 'C2'
  if (percentage >= 76) return 'C1'
  if (percentage >= 61) return 'B2'
  if (percentage >= 41) return 'B1'
  if (percentage >= 21) return 'A2'
  return 'A1'
}

function isPassing(achieved: string, required: string): boolean {
  const order = ['A1','A2','B1','B2','C1','C2']
  return order.indexOf(achieved) >= order.indexOf(required)
}

const CEFR_DESCRIPTORS: Record<string,string> = {
  C2: 'Mastery — Can understand with ease virtually everything heard or read.',
  C1: 'Advanced — Can express themselves fluently, spontaneously and precisely.',
  B2: 'Upper Intermediate — Can interact with a degree of fluency with native speakers.',
  B1: 'Intermediate — Can deal with most situations likely to arise whilst travelling.',
  A2: 'Elementary — Can communicate in simple and routine tasks.',
  A1: 'Beginner — Can understand and use familiar everyday expressions.',
}

export async function POST(req: NextRequest) {
  try {
    const { examId } = await req.json()
    if (!examId) return NextResponse.json({ error: 'examId required' }, { status: 400 })

    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*,exam_templates(*)')
      .eq('id', examId)
      .single()

    if (examError || !exam) return NextResponse.json({ error: 'Exam not found: ' + examError?.message }, { status: 404 })

    const { data: candidateData } = await supabase
      .from('users')
      .select('full_name,email,org_id')
      .eq('id', exam.candidate_id)
      .single()

    const template = exam.exam_templates
    const weights: Record<string,number> = {
      grammar:   (template.weight_grammar   || 0) / 100,
      reading:   (template.weight_reading   || 0) / 100,
      writing:   (template.weight_writing   || 0) / 100,
      speaking:  (template.weight_speaking  || 0) / 100,
      listening: (template.weight_listening || 0) / 100,
    }

    const { data: grades } = await supabase
      .from('grades')
      .select('*')
      .eq('exam_id', examId)

    const { data: answers } = await supabase
      .from('exam_answers')
      .select('*')
      .eq('exam_id', examId)

    const sectionScores: Record<string,number> = {}

    for (const section of ['grammar', 'reading', 'listening']) {
      const sectionAnswers = answers?.filter(a => a.section === section) || []
      if (sectionAnswers.length === 0) continue
      const correct = sectionAnswers.filter(a => (a.auto_score || 0) >= 1).length
      sectionScores[section] = (correct / sectionAnswers.length) * 100
    }

    for (const section of ['writing', 'speaking']) {
      const sectionGrades = grades?.filter(g => g.section === section) || []
      if (sectionGrades.length === 0) continue
      const avg = sectionGrades.reduce((sum, g) => sum + (g.numeric_score || 0), 0) / sectionGrades.length
      sectionScores[section] = avg
    }

    let finalScore = 0
    let totalWeight = 0
    let sectionsPending = 0

    const templateSections = [
      { key: 'grammar', count: template.grammar_count },
      { key: 'reading', count: template.reading_count },
      { key: 'listening', count: template.listening_count },
      { key: 'writing', count: template.writing_count },
      { key: 'speaking', count: template.speaking_count }
    ]

    for (const ts of templateSections) {
      if ((ts.count || 0) > 0) {
        const score = sectionScores[ts.key]
        const weight = (template[`weight_${ts.key}`] || 0) / 100
        
        if (score !== undefined) {
          finalScore += score * weight
          totalWeight += weight
        } else {
          sectionsPending++
        }
      }
    }

    // Normalized score based on sections actually graded so far
    const normalizedScore = totalWeight > 0 ? (finalScore / totalWeight) : 0
    const cefrLevel = mapToCEFR(normalizedScore)
    const passed = isPassing(cefrLevel, template.passing_cefr || 'B2')

    // Only certify if all active sections are graded
    const newStatus = sectionsPending === 0 ? 'certified' : 'grading'

    await supabase.from('exams').update({
      final_numeric_score: Math.round(normalizedScore * 10) / 10,
      final_cefr_score: cefrLevel,
      status: newStatus
    }).eq('id', examId)

    await supabase.from('certificates').upsert({
      exam_id: examId,
      cefr_overall: cefrLevel,
      issued_at: new Date().toISOString()
    }, { onConflict: 'exam_id' })

    // Send automated email to candidate ONLY when certified
    if (resend && candidateData?.email && newStatus === 'certified') {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.avilingo.co'
        const resultLink = `${appUrl}/exam/${examId}/result`
        await resend.emails.send({
          from: 'Avilingo <no-reply@avilingo.co>',
          to: candidateData.email,
          subject: 'Your Avilingo Evaluation Results are Ready!',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
              <h2 style="color: #0A1628;">Evaluation Completed</h2>
              <p>Hello ${candidateData.full_name || 'Candidate'},</p>
              <p>Your recent aviation English assessment has been graded by our human evaluators.</p>
              <p>Your official CEFR score and detailed feedback are now available.</p>
              <div style="margin: 30px 0;">
                <a href="${resultLink}" style="background-color: #3A8ED0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Results</a>
              </div>
              <p>Best regards,<br>The Avilingo Team</p>
            </div>
          `
        })
      } catch (err) {
        console.error('Failed to send result email:', err)
      }
    }

    return NextResponse.json({
      success: true,
      examId,
      finalScore: Math.round(finalScore * 10) / 10,
      cefrLevel,
      passed,
      sectionScores,
      descriptor: CEFR_DESCRIPTORS[cefrLevel],
      candidateName: candidateData?.full_name || candidateData?.email,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
