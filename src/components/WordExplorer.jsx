'use client';

import React, { useState, useEffect } from 'react';
import { getDual } from '@/lib/translations';
import { SURAH_NAMES } from '@/lib/arabic-utils';

export default function WordExplorer() {
  const [sura, setSura] = useState(1);
  const [aya, setAya] = useState(1);
  const [ayahData, setAyahData] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [interlinear, setInterlinear] = useState(true);

  useEffect(() => {
    fetchAyah();
  }, [sura, aya]);

  const fetchAyah = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quran/${sura}/${aya}`);
      const data = await res.json();
      setAyahData(data.words);
      setSelectedWord(Object.keys(data.words)[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextAya = () => setAya(prev => prev + 1);
  const prevAya = () => setAya(prev => Math.max(1, prev - 1));
  const nextSura = () => {
    setSura(prev => Math.min(114, prev + 1));
    setAya(1);
  };
  const prevSura = () => {
    setSura(prev => Math.max(1, prev - 1));
    setAya(1);
  };

  return (
    <div className="word-explorer card">
      <div className="header-flex">
        <h2 className="gradient-text">{getDual('explorer.title')}</h2>
        <div className="view-toggle">
          <button
            className={interlinear ? 'active' : ''}
            onClick={() => setInterlinear(true)}
          >Interlinear</button>
          <button
            className={!interlinear ? 'active' : ''}
            onClick={() => setInterlinear(false)}
          >Standard</button>
        </div>
      </div>

      <div className="controls">
        <div className="control-item">
          <label className="input-label">{getDual('explorer.surah')}:</label>
          <div className="input-group">
            <button onClick={prevSura} className="nav-arrow" disabled={sura <= 1}>❮</button>
            <div className="input-with-label">
              <input type="number" min="1" max="114" value={sura} onChange={(e) => setSura(Number(e.target.value))} />
              <span className="surah-name quranic-text">{SURAH_NAMES[sura]}</span>
            </div>
            <button onClick={nextSura} className="nav-arrow" disabled={sura >= 114}>❯</button>
          </div>
        </div>

        <div className="control-item">
          <label className="input-label">{getDual('explorer.ayah')}:</label>
          <div className="input-group">
            <button onClick={prevAya} className="nav-arrow" disabled={aya <= 1}>❮</button>
            <input type="number" min="1" max="286" value={aya} onChange={(e) => setAya(Number(e.target.value))} className="ayah-input" />
            <button onClick={nextAya} className="nav-arrow">❯</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader">{getDual('explorer.loading')}</div>
      ) : (
        <div className="display-area">
          <div className={`ayah-display quranic-text ${interlinear ? 'interlinear' : ''}`}>
            {ayahData && Object.entries(ayahData).map(([id, word]) => (
              <div
                key={id}
                className={`word-container ${selectedWord === id ? 'selected' : ''}`}
                onClick={() => setSelectedWord(id)}
              >
                <span className="word-arabic">
                  {word.segments.map(s => s.form).join('')}
                </span>
                {interlinear && (
                  <span className="word-translation">{word.meaning}</span>
                )}
              </div>
            ))}
          </div>

          <div className="morphology-panel">
            {selectedWord && ayahData?.[selectedWord] ? (
              <div className="word-details">
                <h3>{getDual('explorer.analysis')}</h3>

                {ayahData[selectedWord].meaning && (
                  <div className="meaning-box animate-fade-in">
                    <span className="meaning-label">{getDual('explorer.meaning')}</span>
                    <div className="meaning-content">
                      <div className="meaning-item">
                        <span className="lang-tag">EN</span>
                        <span className="meaning-text">{ayahData[selectedWord].meaning}</span>
                      </div>
                      {ayahData[selectedWord].meaningAr && (
                        <div className="meaning-item rtl">
                          <span className="lang-tag">AR</span>
                          <span className="meaning-text quranic-text">{ayahData[selectedWord].meaningAr}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {ayahData[selectedWord].explanation && (
                  <div className="explanation-text animate-fade-in">
                    {ayahData[selectedWord].explanation}
                  </div>
                )}

                <div className="word-essence-container animate-fade-in">
                  <div className="essence-card-premium">
                    <div className="essence-icon">✨</div>
                    <div className="essence-content">
                      <h4 className="essence-title">الجوهر المعجمي / Lexical Essence</h4>
                      <p className="lexicon-text rtl">{ayahData[selectedWord].lexiconAr}</p>
                    </div>
                  </div>

                  <div className="essence-details-grid">
                    <div className="detail-mini-card">
                      <span className="detail-label">الدلالة / Meaning</span>
                      <span className="detail-value">{ayahData[selectedWord].meaning}</span>
                    </div>
                    {ayahData[selectedWord].segments.some(s => s.features['الجذر']) && (
                      <div className="detail-mini-card">
                        <span className="detail-label">الجذر / Root</span>
                        <span className="detail-value quranic-text">
                          {ayahData[selectedWord].segments.find(s => s.features['الجذر'])?.features['الجذر']}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-selection">
                <p>Select a word to see detailed morphological analysis</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .green {
          color: var(--primary);
          font-weight: 700;
        }
        .header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .view-toggle {
            display: flex;
            background: var(--slate-light);
            padding: 0.3rem;
            border-radius: 8px;
        }
        .view-toggle button {
            border: none;
            background: transparent;
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--slate-dark);
            transition: all 0.2s;
        }
        .view-toggle button.active {
            background: var(--primary);
            color: white;
            box-shadow: 0 4px 12px rgba(6, 95, 70, 0.2);
        }
        .word-explorer {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          background: var(--bg-surface);
          padding: 1.5rem;
          border: 1px solid var(--border);
        }
        @media (max-width: 768px) {
          .word-explorer {
            padding: 1rem;
          }
        }
        .controls {
          display: flex;
          align-items: center;
          gap: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--border);
          justify-content: center;
        }
        @media (max-width: 768px) {
          .controls {
            flex-direction: column;
            gap: 1.5rem;
            padding-bottom: 1.5rem;
          }
           .header-flex {
            flex-direction: column;
            gap: 1.5rem;
            text-align: center;
          }
        }
        .control-item .input-label {
          font-weight: 800;
          color: var(--text-primary);
          font-size: 1rem;
          min-width: 80px;
        }
        .input-group {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          background: var(--bg-surface);
          padding: 0.4rem;
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .nav-arrow {
          background: var(--bg-main);
          border: 1px solid var(--border);
          color: var(--primary);
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          font-weight: bold;
        }
        .nav-arrow:hover:not(:disabled) {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          transform: scale(1.1);
        }
        .nav-arrow:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .ayah-input {
          border: none !important;
          background: transparent !important;
          width: 60px !important;
          text-align: center;
          font-size: 1.2rem !important;
          font-weight: 800 !important;
          color: var(--primary) !important;
          outline: none;
        }
        .input-with-label {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0 0.5rem;
          border-radius: 12px;
        }
        .input-with-label input {
          border: none;
          outline: none;
          width: 45px;
          font-weight: 800;
          color: var(--primary);
          font-size: 1.2rem;
          background: transparent;
          text-align: center;
        }
        .surah-name {
          color: var(--primary);
          font-size: 1.6rem;
          font-weight: 700;
          line-height: 1;
          margin-bottom: -4px;
          min-width: 100px;
        }
        input:focus {
          border-color: var(--primary-light);
        }
        .display-area {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 1.2rem;
          align-items: start;
        }
        .ayah-display {
          background: var(--bg-surface);
          padding: 2.5rem;
          border-radius: 20px;
          border: 1px solid var(--border);
          line-height: 2.5;
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          direction: rtl;
          justify-content: center;
          align-content: flex-start;
        }
        .ayah-display.interlinear {
          gap: 2.5rem 1.5rem;
          line-height: 1.2;
        }
        .word-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        .word-container:hover {
          background: var(--slate-light);
        }
        .word-container.selected {
          border-color: var(--primary-light);
          background: rgba(6, 95, 70, 0.05);
        }
        .word-arabic {
          font-size: 2.2rem;
          color: var(--text-primary);
          transition: color 0.2s;
        }
        @media (max-width: 768px) {
          .word-arabic {
            font-size: 1.6rem;
          }
          .ayah-display {
            padding: 1.5rem;
            gap: 1rem;
          }
        }
        .word-container.selected .word-arabic {
          color: var(--primary);
        }
        .word-translation {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 0.4rem;
          font-family: var(--font-inter);
          text-align: center;
          max-width: 100px;
          line-height: 1.2;
        }
        .morphology-panel {
          background: var(--slate-light);
          padding: 1.8rem;
          border-radius: 24px;
          color: var(--slate-dark);
          height: fit-content;
          min-height: 520px;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          transition: all 0.3s ease;
        }
        .empty-selection {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: var(--slate-dark);
          opacity: 0.4;
          font-size: 0.95rem;
          padding: 2rem;
          gap: 1rem;
        }
        .empty-selection p {
          margin: 0;
        }
        .word-details h3 {
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
          color: var(--slate-dark);
          border-bottom: 2px solid var(--primary-light);
          padding-bottom: 0.5rem;
          display: inline-block;
        }
        .meaning-box {
          background: var(--bg-surface);
          padding: 1.2rem;
          border-radius: 16px;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(6, 95, 70, 0.1);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
        }
        .meaning-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.4rem;
          opacity: 0.8;
        }
        .meaning-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .meaning-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .meaning-item.rtl {
          direction: rtl;
        }
        .lang-tag {
          font-size: 0.6rem;
          font-weight: 900;
          background: var(--slate-light);
          color: var(--primary);
          padding: 0.3rem 0.5rem;
          border-radius: 6px;
          min-width: 32px;
          text-align: center;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
        }
        .meaning-text {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .meaning-item.rtl .meaning-text {
          font-size: 1.9rem;
          font-weight: 700;
          color: var(--primary);
        }
        .explanation-text {
          display: none; /* Hide technical explanation in favor of Essence */
        }
        .word-essence-container {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          margin-top: 1rem;
        }
        .essence-card-premium {
          background: var(--bg-surface);
          border: 2px solid #065f46;
          border-radius: 24px;
          padding: 2.5rem;
          margin: 1.5rem 0;
          text-align: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(6, 95, 70, 0.1);
          transition: all 0.3s;
        }
        .essence-card-premium::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 4px;
          height: 100%;
          background: var(--primary);
        }
        @media (max-width: 768px) {
          .essence-card-premium {
            padding: 1.2rem;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .essence-icon {
            margin-bottom: 0.5rem;
          }
          .lexicon-text {
            font-size: 1rem;
            text-align: center;
          }
        }
        .essence-icon {
          font-size: 1.8rem;
          background: rgba(6, 95, 70, 0.1);
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          flex-shrink: 0;
        }
        .essence-title {
          margin: 0 0 0.8rem 0;
          font-size: 0.95rem;
          color: var(--primary);
          font-weight: 800;
          letter-spacing: 0.02em;
        }
        .lexicon-text {
          font-size: 1.1rem;
          line-height: 1.7;
          color: var(--text-primary);
          margin: 0;
          font-weight: 500;
          white-space: pre-line;
        }
        .essence-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 480px) {
          .essence-details-grid {
            grid-template-columns: 1fr;
          }
          .essence-card-premium {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .lexicon-text {
            font-size: 1rem;
          }
        }
        .detail-mini-card {
          background: var(--bg-surface);
          padding: 1rem;
          border-radius: 15px;
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          transition: transform 0.2s;
        }
        .detail-mini-card:hover {
          transform: translateY(-2px);
          border-color: var(--primary-light);
        }
        .detail-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        .detail-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--primary);
        }
        .detail-value.quranic-text {
          font-size: 1.6rem;
          line-height: 1;
        }

        .tafsir-box {
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .tafsir-label {
          font-size: 0.85rem;
          color: var(--primary);
          margin-bottom: 1.5rem;
          text-align: center;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding-bottom: 0.8rem;
          border-bottom: 2px solid var(--slate-light);
          width: 100%;
        }
        .tafsir-text {
          font-size: 1.15rem;
          color: var(--slate-dark);
          line-height: 2;
          text-align: justify;
          direction: rtl;
        }
        .rtl {
          direction: rtl;
        }
        @media (max-width: 1400px) {
          .display-area {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 1000px) {
          .display-area {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div >
  );
}
