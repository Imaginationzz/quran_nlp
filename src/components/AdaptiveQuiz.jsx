'use client';

import React, { useState, useEffect } from 'react';
import { getDual } from '@/lib/translations';

export default function AdaptiveQuiz() {
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuestion();
  }, []);

  const fetchQuestion = async () => {
    setLoading(true);
    setError(null);
    setSelected(null);
    setIsCorrect(null);
    try {
      const res = await fetch('/api/quiz');
      if (!res.ok) throw new Error('Failed to fetch challenge');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setQuestion(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong while loading the quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (opt) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === question?.correctExplanation;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 10);
  };

  return (
    <div className="quiz-module card">
      <div className="quiz-header">
        <div className="quiz-info">
          <h2 className="gradient-text">مختبر البصيرة / Context Master</h2>
          <p className="subtitle">Explaining the Essence and Context of the Revelation</p>
        </div>
        <div className="quiz-actions">
          <button className="refresh-btn" onClick={fetchQuestion} title="New Ayah">
            <span className="icon">🔄</span>
            <span className="text">تغيير الآية / Refresh</span>
          </button>
          <div className="score-badge">
            <span className="label">SCORE</span>
            <span className="value">{score}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
          <p>Preparing your next challenge...</p>
        </div>
      ) : error ? (
        <div className="error-panel animate-fade-in">
          <div className="error-icon">⚠️</div>
          <div className="error-message">
            <h3>Challenge Unavailable</h3>
            <p>{error}</p>
          </div>
          <button className="retry-btn" onClick={fetchQuestion}>
            Try Again
          </button>
        </div>
      ) : question && question.options ? (
        <div className="question-area animate-fade-in">
          <div className="ayah-presenter">
            <div className="quote-icon">"</div>
            <div className="ayah-text quranic-text">{question.ayah}</div>
            <div className="location-badge">{question.location}</div>
          </div>

          <div className="question-prompt">
            ما هو التفسير أو السياق الصحيح لهذه الآية؟
            <span className="sub-prompt">Identify the correct explanation for this verse.</span>
          </div>

          <div className="options-stack">
            {question.options.map((opt, i) => (
              <button
                key={i}
                className={`option-card ${selected === opt ? (isCorrect ? 'correct' : 'wrong') : ''} ${selected && opt === question.correctExplanation ? 'correct' : ''}`}
                onClick={() => handleSelect(opt)}
                disabled={!!selected}
              >
                <div className="option-index">{String.fromCharCode(65 + i)}</div>
                <div className="option-text rtl">{opt}</div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="feedback-panel animate-fade-in">
              <div className={`status-indicator ${isCorrect ? 'positive' : 'negative'}`}>
                {isCorrect ? (
                  <>
                    <span className="icon">✨</span>
                    <div className="message">
                      <strong>أحسنت!</strong>
                      <p>إجابة دقيقة وبصيرة نيرة.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="icon">📖</span>
                    <div className="message">
                      <strong>تأمل جيداً...</strong>
                      <p>التفسير الصحيح موضح باللون الأخضر.</p>
                    </div>
                  </>
                )}
              </div>
              <button className="next-btn" onClick={fetchQuestion}>
                الآية التالية / Next Verse
                <span className="arrow">→</span>
              </button>
            </div>
          )}
        </div>
      ) : null}

      <style jsx>{`
        .quiz-module {
          max-width: 900px;
          margin: 0 auto;
          background: var(--bg-surface);
          padding: 3rem;
          border-radius: 24px;
        }
        @media (max-width: 768px) {
          .quiz-module {
            padding: 1.5rem;
            border-radius: 16px;
          }
        }
        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 3.5rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 2rem;
        }
        @media (max-width: 600px) {
          .quiz-header {
            flex-direction: column;
            gap: 1.5rem;
            align-items: center;
            text-align: center;
            margin-bottom: 2rem;
          }
        }
        .subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-top: 0.5rem;
        }
        .score-badge {
          background: linear-gradient(135deg, var(--primary), var(--primary-light));
          color: white;
          padding: 0.8rem 1.5rem;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 4px 15px rgba(6, 95, 70, 0.2);
        }
        .score-badge .label {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          opacity: 0.9;
        }
        .score-badge .value {
          font-size: 1.5rem;
          font-weight: 900;
        }
        .quiz-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .refresh-btn {
          background: var(--bg-main);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 0.6rem 1.2rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          transition: all 0.2s;
        }
        .refresh-btn:hover {
          background: #f1f5f9;
          border-color: var(--primary-light);
          color: var(--primary);
        }
        .refresh-btn .icon {
          font-size: 1rem;
        }
        .ayah-presenter {
          background: #fdfcf9;
          padding: 3rem;
          border-radius: 24px;
          border: 1px solid #f3f0e8;
          position: relative;
          margin-bottom: 3rem;
          text-align: center;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);
        }
        @media (max-width: 768px) {
          .ayah-presenter {
            padding: 2rem 1.5rem;
            margin-bottom: 2rem;
          }
        }
        .quote-icon {
          position: absolute;
          top: -10px;
          left: 20px;
          font-size: 5rem;
          color: var(--primary);
          opacity: 0.1;
          font-family: serif;
          line-height: 1;
        }
        .ayah-text {
          font-size: 2.2rem;
          color: var(--primary);
          line-height: 1.8;
          margin-bottom: 1.5rem;
          direction: rtl;
        }
        @media (max-width: 768px) {
          .ayah-text {
            font-size: 1.5rem;
            line-height: 1.6;
          }
        }
        .location-badge {
          display: inline-block;
          background: var(--bg-main);
          padding: 0.4rem 1.2rem;
          border-radius: 30px;
          border: 1px solid var(--border);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .question-prompt {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .sub-prompt {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .options-stack {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .option-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem 2rem;
          background: var(--bg-main);
          border: 2px solid var(--border);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: right;
        }
        .option-card:hover:not(:disabled) {
          border-color: var(--primary-light);
          transform: translateX(-5px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .option-index {
          width: 32px;
          height: 32px;
          background: var(--slate-light);
          color: var(--primary);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .option-text {
          font-size: 1.1rem;
          color: var(--text-primary);
          line-height: 1.6;
          flex-grow: 1;
          font-weight: 600;
        }
        .option-card.correct {
          background: rgba(6, 95, 70, 0.05);
          border-color: var(--primary);
        }
        .option-card.correct .option-index {
          background: var(--primary);
          color: white;
        }
        .option-card.wrong {
          background: rgba(239, 68, 68, 0.05);
          border-color: #ef4444;
        }
        .option-card.wrong .option-index {
          background: #ef4444;
          color: white;
        }
        .feedback-panel {
          margin-top: 3rem;
          padding: 2rem;
          background: #f8fafc;
          border-radius: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-grow: 1;
        }
        .status-indicator .icon {
          font-size: 2.5rem;
        }
        .status-indicator.positive { color: var(--primary); }
        .status-indicator.negative { color: #b91c1c; }
        .message strong {
          display: block;
          font-size: 1.2rem;
          margin-bottom: 0.3rem;
        }
        .message p {
          margin: 0;
          font-size: 0.95rem;
          opacity: 0.8;
        }
        .next-btn {
          background: var(--secondary);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 800;
          font-size: 1.1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .next-btn:hover {
          transform: scale(1.02);
          filter: brightness(1.1);
        }
        .loader-container {
          padding: 5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          color: var(--text-secondary);
        }
        .error-panel {
          padding: 4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          text-align: center;
          background: #fff5f5;
          border-radius: 20px;
          border: 1px solid #fed7d7;
        }
        .error-icon {
          font-size: 3.5rem;
        }
        .error-message h3 {
          margin: 0;
          color: #c53030;
          font-size: 1.5rem;
        }
        .error-message p {
          color: #9b2c2c;
          margin-top: 0.5rem;
          font-size: 1rem;
        }
        .retry-btn {
          background: #c53030;
          color: white;
          border: none;
          padding: 0.8rem 2rem;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .retry-btn:hover {
          transform: scale(1.05);
        }
        @media (max-width: 768px) {
          .feedback-panel {
            flex-direction: column;
            text-align: center;
          }
          .status-indicator {
            flex-direction: column;
          }
          .option-card {
            padding: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}
