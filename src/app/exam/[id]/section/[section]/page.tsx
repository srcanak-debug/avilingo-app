'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* ═══ ORIGINAL BRAND COLORS ═══ */
const BRAND = {
  navy: '#0A1628', navy2: '#1E3A5F', gold: '#C9A84C', white: '#FFFFFF',
  off: '#F3F4F6', border: '#E5E7EB', text1: '#111827', text2: '#374151',
  success: '#16A34A', danger: '#DC2626', warning: '#D97706'
}

export default function ExamSectionPage() {
  const router = useRouter(); const params = useParams();
  const examId = params?.id; const section = params?.section as string;

  const [questions, setQuestions] = useState<any[]>([]);
  const [ci, setCi] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5400);
  const [strikes, setStrikes] = useState(0);
  const [showStrike, setShowStrike] = useState(false);
  
  const vidRef = useRef<HTMLVideoElement>(null);
  const audRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    async function load() {
      if (!examId || !section) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data: es } = await supabase.from('exam_question_sets')
        .select('*, questions(*, question_options(*))')
        .eq('exam_id', examId).eq('section', section).order('question_order');

      if (es) setQuestions(es.map((x: any) => x.questions).filter(Boolean));
      setReady(true);
      initCam();
    }
    load();
  }, [examId, section]);

  async function initCam() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      if (vidRef.current) vidRef.current.srcObject = s;
    } catch (e) { console.warn("Cam error", e); }
  }

  /* ═══ KESİN ÇÖZÜM: ŞIKLARI AYIRAN AKILLI MANTIK ═══ */
  const getQuestionData = (q: any) => {
    if (!q) return { qText: '', qOpts: [] };
    
    // Eğer tablo doluysa direkt onu kullan (En garantisi)
    if (q.question_options && q.question_options.length > 0) {
      return { 
        qText: q.content, 
        qOpts: q.question_options.sort((a:any, b:any) => a.sort_order - b.sort_order).map((o:any) => o.option_text) 
      };
    }

    // Tablo boşsa, metin içindeki \nA) formatını "KAPIŞ" yöntemiyle parçala
    let raw = q.content.replace(/\\n/g, '\n');
    const qText = raw.split(/[A-D][).]/)[0].replace(/\[AUDIO\].*?\?/gi, '').trim();
    const qOpts = raw.match(/[A-D][).]\s*(.+?)(?=\n[A-D][).]|[\n\r]*$)/gs)?.map(o => o.replace(/^[A-D][).]\s*/, '').trim()) || [];
    
    return { qText, qOpts };
  };

  const cq = questions[ci];
  if (!ready || !cq) return <div style={{padding:'50px', textAlign:'center'}}>Avilingo Assessment Loading...</div>

  const { qText, qOpts } = getQuestionData(cq);

  return (
    <div style={{ minHeight:'100vh', background:BRAND.off, display:'flex', flexDirection:'column', fontFamily:'sans-serif' }}>
      {/* ORIGINAL TOP BAR */}
      <div style={{ background:BRAND.navy, padding:'15px 30px', display:'flex', justifyContent:'space-between', alignItems:'center', color:'#fff', boxShadow:'0 2px 10px rgba(0,0,0,0.2)' }}>
        <b style={{fontSize:'22px', letterSpacing:'1.5px', fontWeight:900}}>AVILINGO</b>
        <div style={{display:'flex', alignItems:'center', gap:'25px'}}>
          <div style={{fontSize:'14px', fontWeight:600, color:BRAND.gold}}>TIME LEFT: {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</div>
          <b style={{color:'#fff'}}>QUESTION {ci+1} / {questions.length}</b>
        </div>
      </div>

      {/* ORIGINAL PROCTORING WINDOW */}
      <div style={{position:'fixed', top:'85px', left:'25px', width:'160px', height:'120px', background:'#000', borderRadius:'14px', overflow:'hidden', border:`3px solid ${BRAND.gold}`, boxShadow:'0 8px 24px rgba(0,0,0,0.3)', zIndex:1000}}>
        <video ref={vidRef} autoPlay muted playsInline style={{width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)'}} />
        <div style={{position:'absolute', top:'8px', left:'10px', display:'flex', alignItems:'center', gap:'5px'}}>
           <div style={{width:'8px', height:'8px', background:BRAND.danger, borderRadius:'50%'}}></div>
           <span style={{fontSize:'10px', color:'#fff', fontWeight:700}}>LIVE PROCTOR</span>
        </div>
      </div>

      <div style={{ flex:1, display:'flex', justifyContent:'center', padding:'40px 20px' }}>
        <div style={{ width:'100%', maxWidth:'850px' }}>
          <div style={{ background:BRAND.white, borderRadius:'24px', padding:'45px', boxShadow:'0 15px 50px rgba(0,0,0,0.06)' }}>
            
            <div style={{ fontSize:'22px', lineHeight:1.7, color:BRAND.text1, marginBottom:'35px', fontWeight:500 }}>
              {section === 'listening' ? "🎧 Listen to the recording and choose the best answer." : qText}
            </div>

            {section === 'listening' && cq.audio_url && (
              <div style={{marginBottom:'35px', background:'#F8FAFC', padding:'25px', borderRadius:'16px', border:'1px solid #E2E8F0'}}>
                <audio ref={audRef} src={cq.audio_url} controls style={{width:'100%'}} />
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'16px' }}>
              {qOpts.map((opt, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setAnswers({...answers, [cq.id]: opt})}
                  style={{ 
                    padding:'22px 28px', borderRadius:'16px', border:`2px solid ${answers[cq.id] === opt ? BRAND.navy : '#EDF2F7'}`,
                    background: answers[cq.id] === opt ? '#F0F7FF' : BRAND.white, 
                    cursor:'pointer', textAlign:'left', fontSize:'18px', display:'flex', alignItems:'center', transition:'0.2s'
                  }}
                >
                  <span style={{width:'36px', height:'36px', borderRadius:'50%', background: answers[cq.id] === opt ? BRAND.navy : '#F1F5F9', color: answers[cq.id] === opt ? '#fff' : BRAND.text2, display:'flex', alignItems:'center', justifyContent:'center', marginRight:'20px', fontWeight:800, fontSize:'14px'}}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span style={{fontWeight:500, color:BRAND.text2}}>{opt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ORIGINAL NAVIGATION */}
          <div style={{ marginTop:'40px', display:'flex', justifyContent:'space-between' }}>
             <button disabled={ci===0} onClick={() => setCi(ci-1)} style={{ padding:'16px 35px', borderRadius:'14px', border:'1px solid #D1D5DB', background:'#fff', color:BRAND.text2, fontWeight:700, cursor:'pointer' }}>← PREVIOUS</button>
             <button onClick={() => { if(ci < questions.length - 1) setCi(ci+1); else alert("Section Complete"); }} style={{ padding:'16px 60px', borderRadius:'14px', border:'none', background:BRAND.navy, color:'#fff', fontWeight:700, cursor:'pointer', boxShadow:'0 10px 20px rgba(10,22,40,0.2)' }}>
                {ci === questions.length - 1 ? 'FINISH' : 'NEXT →'}
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}