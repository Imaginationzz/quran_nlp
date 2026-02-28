'use client';

import React, { useState, useEffect } from 'react';
import { getDual } from '@/lib/translations';
import { SURAH_NAMES } from '@/lib/arabic-utils';
import { getMaqasid } from '@/lib/maqasid-data';

export default function VerseSimilarity() {
  const [sura, setSura] = useState(1);
  const [essence, setEssence] = useState({ essence: "", objectives: [] });

  const fetchSurahInfo = (suraNum) => {
    // Get Essence from local database
    const localData = getMaqasid(suraNum);
    setEssence(localData);
  };

  useEffect(() => {
    fetchSurahInfo(sura);
  }, [sura]);

  return (
    <div className="surah-essence card">
      <h2 className="gradient-text">مقاصد السورة / Surah Essence</h2>

      <div className="selection-area">
        <label htmlFor="surah-select">اختر السورة:</label>
        <select
          id="surah-select"
          value={sura}
          onChange={(e) => setSura(Number(e.target.value))}
          className="surah-dropdown"
        >
          {SURAH_NAMES.map((name, idx) => idx > 0 && (
            <option key={idx} value={idx}>{idx}. {name}</option>
          ))}
        </select>
      </div>

      <div className="essence-container animate-fade-in">
        <div className="essence-card">
          <div className="essence-header">
            <span className="icon">💎</span>
            <h3>الجوهر والمقصد العام</h3>
          </div>
          <p className="essence-text">{essence.essence}</p>

          <div className="maqasid-sections">
            <div className="maqasid-section">
              <h4>🎯 الأهداف والمقاصد:</h4>
              <ul>
                {essence.objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>

            {essence.themes && (
              <div className="maqasid-section">
                <h4>🌿 المحاور والموضوعات:</h4>
                <ul>
                  {essence.themes.map((theme, i) => (
                    <li key={i}>{theme}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .surah-essence {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }
        .selection-area {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.5rem;
          background: var(--bg-surface);
          padding: 1.2rem;
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .selection-area label {
          font-weight: 700;
          color: var(--text-secondary);
        }
        .surah-dropdown {
          padding: 0.8rem 1.5rem;
          border-radius: 10px;
          border: 2px solid var(--primary);
          background: var(--bg-main);
          color: var(--text-primary);
          font-weight: 700;
          font-size: 1.1rem;
          min-width: 250px;
          direction: rtl;
        }
        .essence-container {
          display: flex;
          justify-content: center;
        }
        .essence-card {
          background: var(--bg-surface);
          border-radius: 20px;
          padding: 2.5rem;
          border: 1px solid var(--border);
          box-shadow: 0 4px 25px rgba(0,0,0,0.04);
          text-align: right;
          direction: rtl;
          width: 100%;
        }
        .essence-header {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1rem;
        }
        .essence-header h3 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--primary);
          font-weight: 800;
        }
        .icon {
          font-size: 1.8rem;
        }
        .essence-text {
          font-size: 1.35rem;
          line-height: 1.7;
          color: var(--text-primary);
          font-weight: 600;
          margin-bottom: 2.5rem;
        }
        .maqasid-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        .maqasid-section h4 {
          font-size: 1.2rem;
          color: var(--accent);
          margin-bottom: 1rem;
          border-right: 4px solid var(--primary);
          padding-right: 0.8rem;
        }
        .maqasid-section ul {
          list-style: none;
          padding: 0;
        }
        .maqasid-section li {
          position: relative;
          padding-right: 1.5rem;
          margin-bottom: 1rem;
          line-height: 1.6;
          color: var(--text-secondary);
          font-size: 1.1rem;
        }
        .maqasid-section li::before {
          content: "•";
          position: absolute;
          right: 0;
          color: var(--primary);
          font-weight: bold;
        }
        @media (max-width: 700px) {
          .maqasid-sections {
            grid-template-columns: 1fr;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}
