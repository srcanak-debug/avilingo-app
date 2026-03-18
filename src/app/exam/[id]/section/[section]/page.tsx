'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ExamSectionPage() {
  const router = useRouter(); const params = useParams();
  const [questions, setQuestions] = useState<any[]>([]); const [ci, setCi] = useState(0);
  const [answers, setAnswers] = useState<any>({}); const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      // KRİTİK: Şıkları (options) direkt tablodan çekiyoruz
      const { data: es } = await supabase.from('exam_question_sets')
        .select('*, questions(*, question_options(*))')
        .eq('exam_id', params?.id).eq('section', params?.section).order('question_order');
      if (es) setQuestions(es.map((x: any) => x.questions).filter(Boolean));
      setReady(true);
    }
    load();
  }, [params]);

  const cq = questions[ci];
  if (!ready || !cq) return <div style={{padding:'50px', textAlign:'center'}}>Sistem Yükleniyor...</div>

  return (
    <div style={{ minHeight:'100vh', background:'#F3F4F6', display:'flex', flexDirection:'column', fontFamily:'sans-serif' }}>
      <div style={{ background:'#0A1628', padding:'20px', color:'#fff', display:'flex', justifyContent:'space-between' }}>
        <b>AVILINGO</b>
        <span>Soru {ci+1} / {questions.length}</span>
      </div>
      <div style={{ flex:1, display:'flex', justifyContent:'center', padding:'30px' }}>
        <div style={{ width:'100%', maxWidth:'800px' }}>
          <div style={{ background:'#fff', borderRadius:'20px', padding:'40px', boxShadow:'0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize:'22px', marginBottom:'30px' }}>
              {params?.section === 'listening' ? "🎧 Listen and choose the correct option." : cq.content}
            </div>
            {params?.section === 'listening' && cq.audio_url && <audio src={cq.audio_url} controls style={{width:'100%', marginBottom:'30px'}} />}
            <div style={{ display:'grid', gap:'15px' }}>
              {cq.question_options?.map((opt: any, idx: number) => (
                <button key={opt.id} onClick={() => setAnswers({...answers, [cq.id]: opt.option_text})}
                  style={{ padding:'20px', borderRadius:'12px', border:`2px solid ${answers[cq.id] === opt.option_text ? '#3B82F6' : '#E5E7EB'}`, background: answers[cq.id] === opt.option_text ? '#EFF6FF' : '#fff', cursor:'pointer', textAlign:'left', fontSize:'18px' }}>
                  <b>{String.fromCharCode(65 + idx)})</b> {opt.option_text}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'30px' }}>
            <button disabled={ci===0} onClick={() => setCi(ci-1)} style={{padding:'10px 20px', cursor:'pointer'}}>Geri</button>
            <button onClick={() => ci < questions.length - 1 ? setCi(ci+1) : alert('Bitti')} style={{padding:'12px 45px', background:'#0A1628', color:'#fff', borderRadius:'10px', cursor:'pointer'}}>İleri</button>
          </div>
        </div>
      </div>
    </div>
  )
}