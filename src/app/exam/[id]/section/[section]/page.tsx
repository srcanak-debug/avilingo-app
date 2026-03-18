'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ExamSectionPage() {
  const router = useRouter(); 
  const params = useParams();
  const [questions, setQuestions] = useState<any[]>([]);
  const [ci, setCi] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      
      const { data: es } = await supabase.from('exam_question_sets')
        .select('*, questions(*, question_options(*))')
        .eq('exam_id', params?.id)
        .eq('section', params?.section)
        .order('question_order');

      if (es) setQuestions(es.map((x: any) => x.questions).filter(Boolean));
      setReady(true);
    }
    load();
  }, [params]);

  const cq = questions[ci];
  if (!ready || !cq) return <div style={{padding:'50px', textAlign:'center', fontWeight:'bold'}}>Soru Yükleniyor... (Eğer soru yoksa veritabanı boş demektir)</div>

  return (
    <div style={{ minHeight:'100vh', background:'#F3F4F6', display:'flex', flexDirection:'column', fontFamily:'sans-serif' }}>
      <div style={{ background:'#0A1628', padding:'20px', color:'#fff', display:'flex', justifyContent:'space-between' }}>
        <b style={{fontSize:'20px'}}>AVILINGO</b>
        <span>Soru {ci+1} / {questions.length}</span>
      </div>

      <div style={{ flex:1, display:'flex', justifyContent:'center', padding:'30px' }}>
        <div style={{ width:'100%', maxWidth:'800px' }}>
          <div style={{ background:'#fff', borderRadius:'20px', padding:'40px', boxShadow:'0 10px 25px rgba(0,0,0,0.1)' }}>
            
            <div style={{ fontSize:'22px', marginBottom:'30px', color:'#1F2937', fontWeight:'500' }}>
              {params?.section === 'listening' ? "🎧 Dinlediğiniz soruya göre en doğru şıkkı seçiniz." : cq.content}
            </div>

            {params?.section === 'listening' && cq.audio_url && (
              <audio src={cq.audio_url} controls style={{width:'100%', marginBottom:'30px'}} />
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'15px' }}>
              {cq.question_options?.length > 0 ? cq.question_options.map((opt: any, idx: number) => (
                <button 
                  key={opt.id} 
                  onClick={() => setAnswers({...answers, [cq.id]: opt.option_text})}
                  style={{ 
                    padding:'20px', borderRadius:'12px', border:`2px solid ${answers[cq.id] === opt.option_text ? '#3B82F6' : '#E5E7EB'}`,
                    background: answers[cq.id] === opt.option_text ? '#EFF6FF' : '#fff', cursor:'pointer', textAlign:'left', fontSize:'18px'
                  }}
                >
                  <b style={{marginRight:'10px'}}>{String.fromCharCode(65 + idx)})</b> {opt.option_text}
                </button>
              )) : <div style={{color:'red'}}>Bu soru için şık bulunamadı!</div>}
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'30px' }}>
            <button disabled={ci===0} onClick={() => setCi(ci-1)} style={{padding:'10px 25px', cursor:'pointer', borderRadius:'8px'}}>Geri</button>
            <button onClick={() => ci < questions.length - 1 ? setCi(ci+1) : alert('Bölüm bitti')} style={{padding:'12px 45px', background:'#0A1628', color:'#fff', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>İleri</button>
          </div>
        </div>
      </div>
    </div>
  )
}