'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="loader-container">
      <div className="spinner"></div>
      <div className="loader-text">
        <h2 className="gradient-text">Al-Bayan is Preparing... / البيان يتجلى...</h2>
        <p>Loading deep linguistic data and NLP models.</p>
        <p className="subtext">Initial load may take a few seconds as we parse 46MB of morphological data.</p>
      </div>

      <style jsx>{`
        .loader-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--background);
          z-index: 9999;
          gap: 2rem;
        }
        .loader-text {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .subtext {
          font-size: 0.85rem;
          opacity: 0.6;
          max-width: 400px;
          margin-top: 1rem;
        }
        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid var(--slate-light);
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
