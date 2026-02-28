'use client';

import React, { useState } from 'react';
import { getDual } from '@/lib/translations';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('keyword');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-bar-container card">
      <h2 className="gradient-text">{getDual('search.title')}</h2>
      <form onSubmit={handleSearch} className="search-form">
        <select value={type} onChange={e => setType(e.target.value)} className="search-select">
          <option value="keyword">{getDual('search.modes.keyword')}</option>
          <option value="root">{getDual('search.modes.root')}</option>
          <option value="semantic">{getDual('search.modes.semantic')}</option>
        </select>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`${getDual('search.placeholder')} ${getDual('search.modes.' + type)}...`}
          className="search-input"
        />
        <button type="submit" className="btn-primary">{getDual('search.button')}</button>
      </form>

      {loading ? (
        <div className="loader">{getDual('search.loading')}</div>
      ) : results.length > 0 && (
        <div className="results-list animate-fade-in">
          {results.map((res, i) => (
            <div key={i} className="result-item">
              <div className="res-main">
                <div className="res-verse-container">
                  <span className="res-word quranic-text">{res.fullVerse || res.word}</span>
                  {res.fullVerse && (
                    <div className="res-target-word">
                      <span className="tag-label">MATCHING WORD</span>
                      <span className="quranic-text">{res.word}</span>
                    </div>
                  )}
                </div>
                <span className="res-loc">{res.location}</span>
              </div>
              <div className="res-details">
                <div className="res-semantic">
                  {res.pos && (
                    <span className="pos-badge">{res.pos}</span>
                  )}
                  {res.lemma && (
                    <span className="semantic-tag lemma">
                      <span className="tag-label">LEMMA</span>
                      <span className="tag-value quranic-text">{res.lemma}</span>
                    </span>
                  )}
                  {res.root && (
                    <span className="semantic-tag root">
                      <span className="tag-label">ROOT</span>
                      <span className="tag-value quranic-text">{res.root}</span>
                    </span>
                  )}
                </div>
                <span className="res-ctx">{res.context}</span>
              </div>

              {(res.summaryAr || res.translationEn) && (
                <div className="res-meanings animate-slide-up">
                  {res.summaryAr && (
                    <div className="meaning-block arabic">
                      <span className="meaning-label">ملخص الآية</span>
                      <p className="meaning-text quranic-text">{res.summaryAr}</p>
                    </div>
                  )}
                  {res.translationEn && (
                    <div className="meaning-block english">
                      <span className="meaning-label">Translation</span>
                      <p className="meaning-text">{res.translationEn}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .search-bar-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .search-form {
          display: flex;
          gap: 1rem;
          background: var(--slate-light);
          padding: 0.5rem;
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .search-select {
          background: none;
          border: none;
          padding: 0 1rem;
          font-weight: 600;
          color: var(--primary);
          outline: none;
          cursor: pointer;
          min-width: 150px;
        }
        .search-input {
          flex: 1;
          background: none;
          border: none;
          padding: 0.8rem;
          font-size: 1rem;
          outline: none;
        }
        .btn-primary {
          white-space: nowrap;
        }
        .results-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 500px;
          overflow-y: auto;
          text-align: left;
          padding: 0.5rem;
        }
        .result-item {
          display: flex;
          flex-direction: column;
          padding: 1.2rem;
          background: white;
          border-radius: 16px;
          border: 1px solid var(--border);
          gap: 1rem;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .result-item:hover {
          border-color: var(--primary-light);
          background: #fdfdfd;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .res-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--slate-light);
          padding-bottom: 1rem;
          gap: 1.5rem;
        }
        .res-verse-container {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          flex: 1;
        }
        .res-target-word {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: #fffbeb;
          border: 1px solid #fde68a;
          padding: 0.3rem 0.8rem;
          border-radius: 8px;
          align-self: flex-start;
        }
        .res-target-word .quranic-text {
          font-size: 1.4rem;
          color: #b45309;
        }
        .res-target-word .tag-label {
          color: #b45309;
          opacity: 0.8;
        }
        .res-word {
          font-size: 2.2rem;
          color: var(--primary);
          line-height: 1.4;
          direction: rtl;
        }
        .res-loc {
          font-weight: 800;
          color: var(--accent);
          font-size: 0.9rem;
          background: var(--slate-light);
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
        }
        .res-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .res-semantic {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }
        .pos-badge {
          background: var(--primary);
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .semantic-tag {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8fafc;
          padding: 0.2rem 0.6rem;
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        .tag-label {
          font-size: 0.6rem;
          font-weight: 800;
          color: var(--primary);
          opacity: 0.6;
          letter-spacing: 0.05em;
        }
        .tag-value {
          font-size: 1.6rem;
          color: var(--slate-dark);
          line-height: 1;
        }
        .res-ctx {
          font-size: 0.9rem;
          color: var(--slate-dark);
          opacity: 0.6;
          font-weight: 500;
        }
        .res-meanings {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .meaning-block {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .meaning-block.arabic {
          direction: rtl;
          border-right: 3px solid var(--primary-light);
          padding-right: 0.8rem;
        }
        .meaning-block.english {
          border-left: 3px solid var(--accent-light);
          padding-left: 0.8rem;
        }
        .meaning-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.7;
        }
        .meaning-text {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--slate-dark);
          margin: 0;
        }
        .meaning-text.quranic-text {
          font-size: 1.25rem;
          color: var(--primary);
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
