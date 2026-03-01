'use client';

import React, { useState } from 'react';
import { CONCEPTS } from '@/lib/concepts-data';

export default function ConceptClusters() {
  const [selectedConcept, setSelectedConcept] = useState(null);

  return (
    <div className="concept-clusters-container">
      <div className="concept-grid">
        {CONCEPTS.map((concept) => (
          <div
            key={concept.id}
            className={`concept-card-wrapper ${selectedConcept?.id === concept.id ? 'active' : ''}`}
            onClick={() => setSelectedConcept(concept)}
          >
            <div className="concept-card-premium">
              <div className="concept-icon-large">{concept.icon}</div>
              <div className="concept-names">
                <h3 className="name-en">{concept.nameEn}</h3>
                <h4 className="name-ar quranic-text">{concept.nameAr}</h4>
              </div>
              <div className="card-decoration"></div>
            </div>
          </div>
        ))}
      </div>

      {selectedConcept && (
        <div className="concept-detail-overlay animate-fade-in" onClick={() => setSelectedConcept(null)}>
          <div className="concept-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedConcept(null)}>×</button>

            <div className="detail-header">
              <div className="detail-icon">{selectedConcept.icon}</div>
              <div className="detail-titles">
                <h2 className="gradient-text">{selectedConcept.nameEn} ({selectedConcept.nameAr})</h2>
                <p className="concept-desc">{selectedConcept.descriptionEn}</p>
                <p className="concept-desc-ar quranic-text">{selectedConcept.descriptionAr}</p>
              </div>
            </div>

            <div className="detail-content-grid">
              <div className="detail-section verses-section">
                <h4>📖 آيات محورية / Key Verses</h4>
                <div className="verses-list">
                  {selectedConcept.keyVerses.map((v, i) => (
                    <div key={i} className="verse-item">
                      <p className="verse-text quranic-text">{v.text}</p>
                      <span className="verse-loc">{v.key}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section-stacked">
                <div className="detail-section similar-words-section">
                  <h4>✨ كلمات مشابهة / Similar Words</h4>
                  <div className="similar-words-container">
                    {selectedConcept.similarWords.map((word, i) => (
                      <div key={i} className="similar-word-tag">
                        <span className="sw-ar quranic-text">{word.ar}</span>
                        <span className="sw-en">{word.en}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="detail-section opposite-section">
                  <h4>🔄 المفهوم المقابل / Opposite Concept</h4>
                  <div className="opposite-card">
                    <span className="opposite-value-ar quranic-text">{selectedConcept.oppositeAr}</span>
                    <span className="opposite-value-en">{selectedConcept.oppositeEn}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .concept-clusters-container {
          padding: 0.2rem 0;
          min-height: 400px;
        }
        .concept-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 0.6rem;
          perspective: 1000px;
        }
        .concept-card-wrapper {
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .concept-card-wrapper:hover {
          transform: translateY(-4px) scale(1.02);
          z-index: 10;
        }
        .concept-card-premium {
          background: white;
          border-radius: 12px;
          padding: 1rem 0.5rem;
          text-align: center;
          border: 1px solid var(--border);
          box-shadow: 0 2px 8px rgba(0,0,0,0.01);
          position: relative;
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }
        .concept-icon-large {
          font-size: 1.4rem;
          filter: drop-shadow(0 1px 3px rgba(0,0,0,0.1));
        }
        .concept-names .name-en {
          font-size: 0.8rem;
          color: var(--text-primary);
          margin-bottom: 0.05rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .concept-names .name-ar {
          font-size: 1rem;
          color: var(--primary);
          font-weight: 700;
        }
        .card-decoration {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 25px;
          height: 25px;
          background: var(--primary-light);
          opacity: 0.02;
          border-radius: 50%;
        }
        @media (max-width: 600px) {
          .concept-grid {
            grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
            gap: 0.4rem;
          }
          .concept-card-premium {
            padding: 0.8rem 0.3rem;
          }
          .name-en {
            font-size: 0.7rem !important;
          }
          .name-ar {
            font-size: 0.9rem !important;
          }
        }

        /* Detail Modal */
        .concept-detail-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(10px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .concept-detail-modal {
          background: white;
          width: 100%;
          max-width: 900px;
          max-height: 85vh;
          border-radius: 28px;
          position: relative;
          overflow-y: auto;
          padding: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
        }
        @media (max-width: 600px) {
          .concept-detail-modal {
            padding: 1.5rem;
            border-radius: 20px;
            max-height: 95vh;
          }
          .detail-titles h2 {
            font-size: 1.5rem !important;
          }
          .detail-icon {
            width: 70px;
            height: 70px;
            font-size: 2.5rem;
          }
        }
        .close-btn {
          position: absolute;
          top: 1.2rem;
          right: 1.5rem;
          background: #f1f5f9;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 1.2rem;
          cursor: pointer;
          color: var(--text-primary);
          transition: all 0.2s;
        }
        .close-btn:hover {
          background: #e2e8f0;
          transform: scale(1.1);
        }

        .detail-header {
          display: flex;
          gap: 2rem;
          align-items: center;
          margin-bottom: 2.5rem;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 1.5rem;
        }
        .detail-icon {
          font-size: 4rem;
          background: #f8fafc;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          flex-shrink: 0;
        }
        .detail-titles h2 {
          font-size: 2.2rem;
          margin-bottom: 0.8rem;
        }
        .concept-desc {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 0.4rem;
        }
        .concept-desc-ar {
          font-size: 1.3rem;
          color: var(--primary);
          direction: rtl;
        }

        .detail-content-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 2rem;
        }
        .detail-section-stacked {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .res-ctx {
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .detail-section h4 {
          font-size: 0.95rem;
          color: var(--text-primary);
          margin-bottom: 1rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .similar-words-container {
          display: flex;
          flex-wrap: wrap;
        }
        .similar-word-tag {
          background: rgba(6, 95, 70, 0.05);
          border: 1px solid rgba(6, 95, 70, 0.1);
          padding: 0.6rem 1rem;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
          min-width: 80px;
          transition: all 0.2s;
        }
        .similar-word-tag:hover {
          background: rgba(6, 95, 70, 0.08);
          transform: translateY(-2px);
        }
        .sw-ar {
          color: var(--primary);
          font-weight: 700;
          font-size: 1.1rem;
        }
        .sw-en {
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .verses-list {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .verse-item {
          background: #fcfcfc;
          border: 1px solid #f1f5f9;
          padding: 1.2rem;
          border-radius: 14px;
          border-right: 4px solid var(--primary-light);
        }
        .verse-text {
          font-size: 1.25rem;
          color: var(--primary);
          line-height: 1.7;
          margin-bottom: 0.4rem;
          direction: rtl;
        }
        .verse-loc {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          opacity: 0.5;
        }
        .opposite-card {
          background: #fff5f5;
          padding: 1.2rem;
          border-radius: 14px;
          border: 1px solid #fed7d7;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .opposite-value-ar {
          font-size: 1.4rem;
          color: #c53030;
          font-weight: 800;
        }
        .opposite-value-en {
          font-size: 0.9rem;
          color: #e53e3e;
          opacity: 0.7;
          font-weight: 600;
          text-transform: uppercase;
        }

        @media (max-width: 850px) {
          .detail-content-grid {
            grid-template-columns: 1fr;
          }
          .detail-header {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
