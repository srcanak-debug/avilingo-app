"use client";

import { useState, useRef } from 'react';

export default function SecureExamQuestion({ question, options }: any) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioStatus, setAudioStatus] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const handlePlayAudio = () => {
    if (audioRef.current && audioStatus === 'idle') {
      audioRef.current.play();
      setAudioStatus('playing');
    }
  };

  const handleAudioEnded = () => {
    setAudioStatus('finished');
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
      
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-800 leading-relaxed">
          {question.content}
        </h3>
      </div>

      {question.audio_url && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg flex flex-col items-center">
          <audio
            ref={audioRef}
            src={question.audio_url}
            onEnded={handleAudioEnded}
            onContextMenu={(e) => e.preventDefault()}
            controlsList="nodownload noplaybackrate"
            className="hidden"
          />
          
          <button
            onClick={handlePlayAudio}
            disabled={audioStatus !== 'idle'}
            className={`px-8 py-3 rounded-full font-semibold text-white transition-all ${
              audioStatus === 'idle' 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-md' 
                : audioStatus === 'playing'
                ? 'bg-orange-500 cursor-not-allowed'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {audioStatus === 'idle' && '🔊 Sesi Başlat (Sadece 1 Hak)'}
            {audioStatus === 'playing' && '🎧 Dinleniyor...'}
            {audioStatus === 'finished' && '✅ Dinleme Tamamlandı'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {options.map((option: any) => (
          <button
            key={option.id}
            onClick={() => setSelectedOptionId(option.id)}
            className={`w-full text-left p-4 rounded-lg border transition-all ${
              selectedOptionId === option.id
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {option.option_text}
          </button>
        ))}
      </div>
    </div>
  );
}
