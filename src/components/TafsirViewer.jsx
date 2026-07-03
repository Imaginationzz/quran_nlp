'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getDual } from '@/lib/translations';

const SURAH_NAMES = [
    "", "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازات", "عبس", "التكوير", "الإنفطار", "المطففين", "الإنشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"
];

const SURAH_AYAH_COUNTS = [
  0,
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
  123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
  34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
  60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
  28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 26, 36, 25, 22, 17, 19, 26, 30, 22,
  15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
  6, 3, 5, 6
];

function TafsirViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sura = Number(searchParams.get('sura')) || 1;
  const aya = Number(searchParams.get('aya')) || 1;

  const [tafsirText, setTafsirText] = useState('');
  const [verseText, setVerseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchTafsir = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/quran/${sura}/${aya}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        if (active) {
          setTafsirText(data.tafsir || '');
          
          if (data.words) {
            // Reconstruct the full verse from its words
            const verse = Object.values(data.words)
              .map(word => word.segments.map(s => s.form).join(''))
              .join(' ');
            setVerseText(verse);
          }
        }
      } catch (err) {
        console.error('Failed to load Tafsir:', err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTafsir();
    return () => {
      active = false;
    };
  }, [sura, aya]);

  const updateUrl = (newSura, newAya) => {
    const params = new URLSearchParams(window.location.search);
    params.set('sura', newSura);
    params.set('aya', newAya);
    params.delete('word');
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const handlePrev = () => {
    if (aya > 1) {
      updateUrl(sura, aya - 1);
    } else if (sura > 1) {
      const prevSura = sura - 1;
      updateUrl(prevSura, SURAH_AYAH_COUNTS[prevSura]);
    }
  };

  const handleNext = () => {
    const maxAya = SURAH_AYAH_COUNTS[sura];
    if (aya < maxAya) {
      updateUrl(sura, aya + 1);
    } else if (sura < 114) {
      updateUrl(sura + 1, 1);
    }
  };

  const handleSurahChange = (e) => {
    updateUrl(Number(e.target.value), 1);
  };

  return (
    <div className="tafsir-container card animate-fade-in" id="tafsir">
      <h2 className="gradient-text">{getDual('tafsir.title')}</h2>
      <p className="tafsir-desc">{getDual('tafsir.desc')}</p>

      <div className="tafsir-controls">
        <button 
          onClick={handleNext} 
          className="nav-btn" 
          disabled={sura >= 114 && aya >= SURAH_AYAH_COUNTS[sura]}
        >
          ❮ Next / التالي
        </button>

        <div className="select-wrapper">
          <select 
            value={sura} 
            onChange={handleSurahChange} 
            className="tafsir-select quranic-text"
          >
            {SURAH_NAMES.map((name, idx) => idx > 0 && (
              <option key={idx} value={idx}>
                {idx}. {name}
              </option>
            ))}
          </select>
          <span className="dropdown-arrow">▼</span>
        </div>

        <button 
          onClick={handlePrev} 
          className="nav-btn" 
          disabled={sura <= 1 && aya <= 1}
        >
          Previous / السابق ❯
        </button>
      </div>
      
      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {getDual('tafsir.loading')}
          </span>
        </div>
      ) : error ? (
        <div className="error-message">
          ⚠️ {getDual('tafsir.error')}
        </div>
      ) : (
        <div className="tafsir-content">
          {verseText && (
            <div className="verse-display-box">
              <span className="verse-label">{getDual('tafsir.verseText')} ({sura}:{aya})</span>
              <p className="verse-arabic quranic-text">{verseText}</p>
            </div>
          )}
          
          {tafsirText ? (
            <div className="tafsir-box-inner">
              <span className="tafsir-label-inner">{getDual('tafsir.source')}</span>
              <div 
                className="tafsir-text"
                dangerouslySetInnerHTML={{ __html: tafsirText }}
              />
            </div>
          ) : (
            <div className="empty-tafsir">
              <p>{getDual('tafsir.selectPrompt')}</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .tafsir-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
          transition: all 0.3s ease;
        }
        .tafsir-container:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.04);
        }
        .tafsir-desc {
          font-size: 1rem;
          color: var(--text-secondary);
          margin-top: -0.8rem;
          opacity: 0.85;
          font-weight: 500;
        }
        .tafsir-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.5rem;
          background: var(--slate-light);
          padding: 0.6rem 1rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          margin-bottom: 0.5rem;
        }
        .nav-btn {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          color: var(--primary);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.8rem;
          transition: all 0.2s;
          white-space: nowrap;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          -webkit-tap-highlight-color: transparent;
        }
        .nav-btn:hover:not(:disabled) {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          transform: translateY(-1px);
        }
        .nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .select-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .tafsir-select {
          border: none;
          outline: none;
          background: transparent;
          background-color: transparent;
          color: var(--primary);
          font-family: var(--font-arabic-modern), sans-serif;
          font-weight: 800;
          font-size: 1.1rem;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          padding: 0 1.2rem 0 0.5rem;
          margin: 0;
          text-align: center;
          text-align-last: center;
          border-radius: 0;
          box-shadow: none;
          -webkit-tap-highlight-color: transparent;
        }
        .tafsir-select option {
          background: var(--bg-surface);
          color: var(--text-primary);
          font-family: var(--font-arabic-modern), sans-serif;
          font-weight: 600;
        }
        .dropdown-arrow {
          font-size: 0.65rem;
          color: var(--primary);
          position: absolute;
          right: 0.2rem;
          pointer-events: none;
          margin-top: 2px;
        }
        .loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 3rem;
        }
        .tafsir-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .verse-display-box {
          background: var(--slate-light);
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid var(--border);
          direction: rtl;
          text-align: right;
        }
        .verse-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 0.8rem;
        }
        .verse-arabic {
          font-size: 1.75rem;
          line-height: 1.8;
          color: var(--primary);
          margin: 0;
          font-weight: 700;
        }
        .tafsir-box-inner {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          padding: 2.5rem;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01);
        }
        .tafsir-label-inner {
          font-size: 0.85rem;
          color: var(--primary);
          text-align: center;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding-bottom: 0.8rem;
          border-bottom: 2px solid var(--slate-light);
          width: 100%;
        }
        .tafsir-text {
          font-size: 1.1rem;
          color: var(--slate-dark);
          line-height: 2;
          text-align: justify;
          direction: rtl;
        }
        .tafsir-text :global(p) {
          margin-bottom: 1.5rem;
        }
        .tafsir-text :global(strong) {
          color: var(--primary);
          font-weight: 700;
        }
        .tafsir-text :global(span) {
          color: var(--accent);
          font-weight: 600;
        }
        .empty-tafsir {
          text-align: center;
          color: var(--text-secondary);
          opacity: 0.6;
          padding: 3rem;
          font-weight: 600;
        }
        .error-message {
          color: #ef4444;
          text-align: center;
          font-weight: 700;
          padding: 2rem;
          background: #fef2f2;
          border-radius: 12px;
          border: 1px solid #fee2e2;
        }
        @media (max-width: 768px) {
          .tafsir-container {
            padding: 1.5rem;
          }
          .verse-display-box {
            padding: 1.2rem;
          }
          .verse-arabic {
            font-size: 1.4rem;
            line-height: 1.6;
          }
          .tafsir-box-inner {
            padding: 1.5rem;
          }
          .tafsir-text {
            font-size: 1.0rem;
            line-height: 1.8;
          }
        }
        @media (max-width: 600px) {
          .tafsir-controls {
            flex-direction: column;
            gap: 0.8rem;
          }
          .nav-btn {
            width: 100%;
            padding: 0.8rem;
            text-align: center;
          }
          .select-wrapper {
            width: 100%;
            padding: 0.5rem 0;
            text-align: center;
            justify-content: center;
          }
          .tafsir-select {
            width: auto;
          }
        }
      `}</style>
    </div>
  );
}

export default function TafsirViewer() {
  return (
    <Suspense fallback={
      <div className="loader-container card">
        <div className="loader"></div>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Loading Tafseer...
        </span>
      </div>
    }>
      <TafsirViewerContent />
    </Suspense>
  );
}
