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
    const { exams, templateName, message, type = 'EXAM_INVITE' } = await req.json()

    if (!exams || !exams.length) {
      return NextResponse.json({ success: false, error: 'No exams provided' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY is missing. Emails will not be actually sent.')
      console.log(`Simulating [${type}] emails to:`, exams.map((e: any) => e.candidate_email))
      return NextResponse.json({ success: true, simulated: true })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://avilingo.com'

    const emailPromises = exams.map(async (exam: any) => {
      let subject = ''
      let html = ''
      let magicLink = ''

      // Helper to generate magic link if needed
      const getLink = async () => {
        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: exam.candidate_email,
          options: { redirectTo: `${appUrl}/exam/${exam.id}/preflight` }
        })
        return linkData?.properties?.action_link || `${appUrl}/exam/${exam.id}/preflight`
      }

      switch (type) {
        case 'REGISTRATION_RECEIVED':
          magicLink = await getLink()
          subject = `Avilingo: ${templateName} Sınav Kaydınız Alındı`
          html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
              <div style="background: #0C1F3F; padding: 30px; text-align: center;">
                <h1 style="color: #fff; margin:0;">Avilingo</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2>Sayın ${exam.candidate_name},</h2>
                <p><strong>${templateName}</strong> için kaydınız başarıyla alınmıştır.</p>
                <p>Aşağıdaki butona tıklayarak sınavınıza hemen başlayabilirsiniz:</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${magicLink}" style="background: #0EA5E9; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Sınava Şimdi Başla</a>
                </div>
                <p style="margin-top: 30px; font-size: 13px; color: #666;">Bu bağlantı size özeldir, lütfen başkalarıyla paylaşmayın.</p>
              </div>
            </div>
          `
          break;

        case 'EXAM_INVITE':
        default:
          magicLink = await getLink()
          subject = `Avilingo Exam Invitation: ${templateName}`
          html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
              <div style="background: #0C1F3F; padding: 30px; text-align: center;">
                <h1 style="color: #fff; margin:0;">Avilingo</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2>Hello ${exam.candidate_name},</h2>
                <p>You have been invited to take the <strong>${templateName}</strong> exam.</p>
                ${message ? `<div style="background: #f4f4f4; padding: 15px; border-left: 4px solid #0EA5E9; margin: 20px 0;">${message}</div>` : ''}
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${magicLink}" style="background: #0EA5E9; color: #fff; padding: 15px 30px; text-decoration: none; borderRadius: 8px; font-weight: bold; display: inline-block;">Start Exam Now</a>
                </div>
              </div>
            </div>
          `
          break;

        case 'EXAM_COMPLETED':
          subject = `Avilingo: ${templateName} Sınavınız Tamamlandı`
          html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
              <div style="background: #0C1F3F; padding: 30px; text-align: center;">
                <h1 style="color: #fff; margin:0;">Avilingo</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2>Tebrikler ${exam.candidate_name}!</h2>
                <p><strong>${templateName}</strong> sınavını başarıyla tamamladınız.</p>
                <p>Sonuçlarınız değerlendirildikten sonra tarafınıza bilgilendirme yapılacaktır.</p>
              </div>
            </div>
          `
          break;

        case 'RESULTS_READY':
          subject = `Avilingo: ${templateName} Sınav Sonucunuz Hazır`
          html = `
             <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
              <div style="background: #0C1F3F; padding: 30px; text-align: center;">
                <h1 style="color: #fff; margin:0;">Avilingo</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2>Sonuçlarınız Hazır, ${exam.candidate_name}!</h2>
                <p><strong>${templateName}</strong> sınavına ait detaylı raporunuzu görüntülemek için sisteme giriş yapabilirsiniz.</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${appUrl}/dashboard" style="background: #10B981; color: #fff; padding: 15px 30px; text-decoration: none; borderRadius: 8px; font-weight: bold; display: inline-block;">Sonuçları Görüntüle</a>
                </div>
              </div>
            </div>
          `
          break;
      }

      return resend.emails.send({
        from: 'Avilingo Exams <exams@avilingo.com>',
        to: exam.candidate_email,
        subject,
        html
      })
    })

    const results = await Promise.allSettled(emailPromises)
    const failures = results.filter(r => r.status === 'rejected')

    return NextResponse.json({ success: true, sent: results.length - failures.length, failures: failures.length })

  } catch (error: any) {
    console.error('Error sending notifications:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
