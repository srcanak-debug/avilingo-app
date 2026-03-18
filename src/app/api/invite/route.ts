import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key')

// Admin Supabase client is required to generate magic links
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { exams, templateName, message } = await req.json()

    if (!exams || !exams.length) {
      return NextResponse.json({ success: false, error: 'No exams provided' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY is missing. Emails will not be actually sent.')
      console.log('Simulating sending emails to:', exams.map((e: any) => e.candidate_email))
      return NextResponse.json({ success: true, simulated: true })
    }

    const { data: { user } } = await supabaseAdmin.auth.getUser()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://avilingo.com'

    // Process all invitations in parallel
    const emailPromises = exams.map(async (exam: any) => {
      // Generate a magic link for the candidate that redirects to the exam preflight page
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: exam.candidate_email,
        options: {
          redirectTo: `${appUrl}/exam/${exam.id}/preflight`
        }
      })

      const magicLink = linkData?.properties?.action_link || `${appUrl}/exam/${exam.id}/preflight`

      return resend.emails.send({
        from: 'Avilingo Exams <exams@avilingo.com>', // Replace with verified domain
        to: exam.candidate_email,
        subject: `You have been invited to take the ${templateName} Exam`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #0C1F3F; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">Avil<span style="color: #5AAEDF;">ingo</span></h1>
            </div>
            <div style="padding: 32px 24px; background-color: #ffffff;">
              <h2 style="color: #0C1F3F; margin-top: 0;">Hello ${exam.candidate_name || 'Candidate'},</h2>
              <p style="color: #4B5563; line-height: 1.6; font-size: 15px;">
                You have been assigned to complete the <strong>${templateName}</strong> assessment.
              </p>
              
              ${message ? `
                <div style="background-color: #f3f4f6; padding: 16px; border-left: 4px solid #3A8ED0; border-radius: 4px; margin: 24px 0; color: #374151; font-style: italic;">
                  "${message.replace(/\n/g, '<br/>')}"
                </div>
              ` : ''}

              <p style="color: #4B5563; line-height: 1.6; font-size: 15px; margin-bottom: 32px;">
                Please ensure you are in a quiet environment with a working microphone and camera before starting the exam.
              </p>

              <div style="text-align: center;">
                <a href="${magicLink}" style="display: inline-block; background-color: #3A8ED0; color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px;">
                  Start Exam Now
                </a>
              </div>
              
              <p style="color: #9CA3AF; font-size: 13px; text-align: center; margin-top: 32px;">
                Or copy this link to your browser:<br/>
                <a href="${magicLink}" style="color: #3A8ED0; word-break: break-all;">${magicLink}</a>
              </p>
            </div>
            <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #eaeaea; color: #9CA3AF; font-size: 12px;">
              © ${new Date().getFullYear()} Avilingo Aviation English. All rights reserved.
            </div>
          </div>
        `
      })
    })

    const results = await Promise.allSettled(emailPromises)
    const failures = results.filter(r => r.status === 'rejected')

    if (failures.length > 0) {
      console.error('Some emails failed to send:', failures)
    }

    return NextResponse.json({ success: true, sent: results.length - failures.length, failures: failures.length })

  } catch (error: any) {
    console.error('Error sending invitations:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
