'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { CONCEPTS } from '@/lib/concepts-data';
import { SURAH_NAMES } from '@/lib/arabic-utils';
import { useRouter, useSearchParams } from 'next/navigation';

function ConceptClustersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Verses state (combining static key verses and dynamic search results)
  const [versesList, setVersesList] = useState([]);
  const [isFetchingDynamic, setIsFetchingDynamic] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  
  // State for lazy-loaded verse translations and tafsirs (individual items)
  const [verseDetails, setVerseDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [errorDetails, setErrorDetails] = useState({});
  const [expandedVerses, setExpandedVerses] = useState({});
  
  // Clipboard feedback state
  const [copiedKey, setCopiedKey] = useState(null);

  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Sync selected concept with URL parameter '?concept=id'
  useEffect(() => {
    const conceptId = searchParams.get('concept');
    if (conceptId) {
      const found = CONCEPTS.find((c) => c.id === conceptId);
      if (found) {
        setSelectedConcept(found);
      }
    }
  }, [searchParams]);

  // Fetch dynamic related verses whenever selected concept changes
  useEffect(() => {
    if (!selectedConcept) {
      setVersesList([]);
      return;
    }

    // 1. Immediately load static key verses to guarantee instant visual feedback
    setVersesList(selectedConcept.keyVerses);
    setCurrentPage(1);
    setIsFetchingDynamic(true);
    setShowExportMenu(false);

    let isCancelled = false;

    // 2. Fetch full search results matching this concept in the background
    const fetchDynamicVerses = async () => {
      try {
        const query = encodeURIComponent(selectedConcept.nameAr);
        const res = await fetch(`/api/search?q=${query}&type=semantic`);
        if (!res.ok) throw new Error('Search API failed');
        const data = await res.json();

        if (isCancelled) return;

        // Map results into standard verse list format
        const dynamicList = (data.results || []).map((r) => ({
          key: r.location,
          text: r.fullVerse
        }));

        // Merge with static key verses to prevent duplicates, keep key verses first, and update to full verse texts
        const merged = selectedConcept.keyVerses.map(kv => ({ ...kv }));
        dynamicList.forEach((item) => {
          const existing = merged.find((m) => m.key === item.key);
          if (existing) {
            existing.text = item.text;
          } else {
            merged.push(item);
          }
        });

        setVersesList(merged);
      } catch (err) {
        console.error('Failed to load semantic concept verses:', err);
        // Fall back gracefully to the static key verses already set
      } finally {
        if (!isCancelled) {
          setIsFetchingDynamic(false);
        }
      }
    };

    fetchDynamicVerses();

    return () => {
      isCancelled = true;
    };
  }, [selectedConcept]);

  const selectConcept = (concept) => {
    setSelectedConcept(concept);
    const params = new URLSearchParams(window.location.search);
    if (concept) {
      params.set('concept', concept.id);
    } else {
      params.delete('concept');
    }
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── Export helpers ─────────────────────────────────────────────────────────
  const buildExportHeader = () => {
    if (!selectedConcept) return '';
    return [
      `المفهوم: ${selectedConcept.nameAr} / ${selectedConcept.nameEn}`,
      `الوصف: ${selectedConcept.descriptionAr}`,
      `Description: ${selectedConcept.descriptionEn}`,
      `المقابل: ${selectedConcept.oppositeAr} (${selectedConcept.oppositeEn})`,
      `عدد الآيات: ${versesList.length}`,
      '─'.repeat(60)
    ].join('\n');
  };

  const handleExportMarkdown = () => {
    if (!selectedConcept) return;
    const lines = [
      `# ${selectedConcept.nameEn} / ${selectedConcept.nameAr}`,
      `> ${selectedConcept.descriptionEn}`,
      `> ${selectedConcept.descriptionAr}`,
      ``,
      `**المقابل / Opposite:** ${selectedConcept.oppositeAr} (${selectedConcept.oppositeEn})`,
      ``,
      `---`,
      `## الآيات المتعلقة / Related Verses (${versesList.length})`,
      ``
    ];
    versesList.forEach((v, i) => {
      const [suraNum, ayaNum] = v.key.split(':');
      const surahName = SURAH_NAMES[parseInt(suraNum, 10)] || `سورة ${suraNum}`;
      lines.push(`### ${i + 1}. سورة ${surahName}، آية ${ayaNum} (${v.key})`);
      lines.push(``);
      lines.push(`> ${v.text}`);
      lines.push(``);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedConcept.id}-verses.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportTxt = () => {
    if (!selectedConcept) return;
    const lines = [buildExportHeader(), ''];
    versesList.forEach((v, i) => {
      const [suraNum, ayaNum] = v.key.split(':');
      const surahName = SURAH_NAMES[parseInt(suraNum, 10)] || `سورة ${suraNum}`;
      lines.push(`[${i + 1}] سورة ${surahName}، آية ${ayaNum} (${v.key})`);
      lines.push(v.text);
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedConcept.id}-verses.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportPdf = () => {
    if (!selectedConcept) return;
    const rows = versesList.map((v, i) => {
      const [suraNum, ayaNum] = v.key.split(':');
      const surahName = SURAH_NAMES[parseInt(suraNum, 10)] || `سورة ${suraNum}`;
      return `
        <div style="margin-bottom:18px;padding:14px;border:1px solid #ddd;border-radius:8px;">
          <div style="font-size:12px;color:#555;margin-bottom:6px;direction:rtl;">
            ${i + 1}. سورة ${surahName}، آية ${ayaNum} — <span style="color:#888">${v.key}</span>
          </div>
          <div style="font-size:20px;line-height:1.8;direction:rtl;text-align:right;font-family:serif;color:#1a3a1a;">${v.text}</div>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
      <title>${selectedConcept.nameAr} - ${selectedConcept.nameEn}</title>
      <style>body{font-family:sans-serif;padding:32px;max-width:900px;margin:auto}
      h1{font-size:22px;color:#1a3a1a} p{color:#444;font-size:14px}
      @media print{body{padding:0}}</style></head><body>
      <h1>${selectedConcept.nameAr} / ${selectedConcept.nameEn}</h1>
      <p>${selectedConcept.descriptionAr}</p>
      <p>${selectedConcept.descriptionEn}</p>
      <p><strong>عدد الآيات:</strong> ${versesList.length}</p>
      <hr/>${rows}</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
    setShowExportMenu(false);
  };

  const handleGoToTafsir = (key) => {
    const [sura, aya] = key.split(':');
    const params = new URLSearchParams(window.location.search);
    params.set('sura', sura);
    params.set('aya', aya);
    router.push(`/?${params.toString()}`, { scroll: false });

    // Wait a brief moment for Next.js routing, then scroll
    setTimeout(() => {
      const el = document.getElementById('tafsir');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const toggleVerseDetails = async (key) => {
    setExpandedVerses((prev) => ({ ...prev, [key]: !prev[key] }));

    if (verseDetails[key] || loadingDetails[key]) {
      return;
    }

    const [sura, aya] = key.split(':');
    setLoadingDetails((prev) => ({ ...prev, [key]: true }));
    setErrorDetails((prev) => ({ ...prev, [key]: null }));

    try {
      // Fetch English translation (Saheeh International / 20) and Tafsir (16)
      const [transRes, tafsirRes] = await Promise.all([
        fetch(`https://api.quran.com/api/v4/verses/by_key/${sura}:${aya}?translations=20`),
        fetch(`https://api.quran.com/api/v4/tafsirs/16/by_ayah/${sura}:${aya}`)
      ]);

      if (!transRes.ok || !tafsirRes.ok) {
        throw new Error('Failed to fetch details');
      }

      const transData = await transRes.json();
      const tafsirData = await tafsirRes.json();

      const translation = transData.verse?.translations?.[0]?.text?.replace(/<[^>]*>/g, '') || 'Translation not found.';
      const tafsir = tafsirData.tafsir?.text?.replace(/<[^>]*>/g, '') || 'Tafsir not found.';

      setVerseDetails((prev) => ({
        ...prev,
        [key]: { translation, tafsir }
      }));
    } catch (err) {
      console.error('Error loading verse details:', err);
      setErrorDetails((prev) => ({
        ...prev,
        [key]: 'فشل تحميل التفسير والترجمة. يرجى التحقق من اتصال الإنترنت.'
      }));
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Filter sidebar concepts based on search query
  const filteredConcepts = CONCEPTS.filter((c) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      c.nameEn.toLowerCase().includes(query) ||
      c.nameAr.includes(query) ||
      c.descriptionEn.toLowerCase().includes(query) ||
      c.descriptionAr.includes(query)
    );
  });

  // Calculate paginated index parameters
  const totalPages = Math.ceil(versesList.length / ITEMS_PER_PAGE);
  const paginatedVerses = versesList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="concept-explorer-layout shadow-sm">
      {/* Main Details Panel (Left Column) */}
      <div className="explorer-main">
        {selectedConcept ? (
          <div className="explorer-details-view animate-fade-in-quick">
            {/* Header section */}
            <div className="concept-detail-header-card">
              <div className="concept-detail-icon-display">{selectedConcept.icon}</div>
              <div className="concept-detail-title-block">
                <div className="concept-titles">
                  <h2>
                    {selectedConcept.nameEn} / <span className="title-ar quranic-text">{selectedConcept.nameAr}</span>
                  </h2>
                  {selectedConcept.oppositeAr && (
                    <div className="antonym-badge">
                      🔄 المقابل: <span className="quranic-text">{selectedConcept.oppositeAr}</span> ({selectedConcept.oppositeEn})
                    </div>
                  )}
                </div>
                <p className="desc-en">{selectedConcept.descriptionEn}</p>
                <p className="desc-ar quranic-text">{selectedConcept.descriptionAr}</p>
              </div>
            </div>

            {/* Verses list section */}
            <div className="verses-explorer-section">
              <div className="verses-section-header">
                <h3 className="section-title">
                  📖 الآيات المتعلقة بالمفهوم / Related Verses ({versesList.length})
                </h3>
                <div className="verses-header-right">
                  {isFetchingDynamic && (
                    <span className="dynamic-badge-loading">
                      <span className="tiny-pulse-dot"></span> جاري البحث...
                    </span>
                  )}
                  {/* Export dropdown */}
                  {!isFetchingDynamic && versesList.length > 0 && (
                    <div className="export-dropdown-wrap">
                      <button
                        className="export-trigger-btn"
                        onClick={() => setShowExportMenu((v) => !v)}
                        title="تصدير الآيات"
                      >
                        ⬇ تصدير
                      </button>
                      {showExportMenu && (
                        <>
                          <div className="export-overlay" onClick={() => setShowExportMenu(false)} />
                          <div className="export-menu">
                            <button className="export-menu-item" onClick={handleExportMarkdown}>
                              <span className="export-icon">📝</span> Markdown (.md)
                            </button>
                            <button className="export-menu-item" onClick={handleExportTxt}>
                              <span className="export-icon">📄</span> Plain Text (.txt)
                            </button>
                            <button className="export-menu-item" onClick={handleExportPdf}>
                              <span className="export-icon">🖨</span> Print / PDF
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="verse-cards-container">
                {paginatedVerses.map((v) => {
                  const isExpanded = !!expandedVerses[v.key];
                  const hasDetails = !!verseDetails[v.key];
                  const isLoading = !!loadingDetails[v.key];
                  const error = errorDetails[v.key];
                  const details = verseDetails[v.key];
                  const [suraNum] = v.key.split(':');
                  const surahName = SURAH_NAMES[parseInt(suraNum, 10)] || '';

                  return (
                    <div key={v.key} className="concept-verse-card">
                      <div className="verse-card-top-bar">
                        <div className="verse-reference">
                          <span>سورة {surahName}، آية {v.key.split(':')[1]}</span>
                          <span className="verse-key-badge">{v.key}</span>
                        </div>
                        <div className="verse-card-actions">
                          <button
                            className="verse-action-btn"
                            title="نسخ الآية"
                            onClick={() => handleCopy(v.text, v.key)}
                          >
                            {copiedKey === v.key ? '✅ تم النسخ' : '📋 نسخ'}
                          </button>
                          <button
                            className={`verse-action-btn ${isExpanded ? 'active-btn' : ''}`}
                            onClick={() => toggleVerseDetails(v.key)}
                          >
                            📖 {isExpanded ? 'إخفاء التفسير' : 'عرض التفسير والترجمة'}
                          </button>
                          <button
                            className="verse-action-btn explore-btn"
                            title="تدبر في المحلل اللغوي والتفسير"
                            onClick={() => handleGoToTafsir(v.key)}
                          >
                            🔗 تدبر
                          </button>
                        </div>
                      </div>

                      <div className="verse-arabic-text quranic-text">
                        {v.text}
                      </div>

                      {/* Expandable Details Pane */}
                      {isExpanded && (
                        <div className="verse-expandable-pane animate-slide-down">
                          {isLoading && (
                            <div className="pane-loader">
                              <div className="mini-spinner"></div>
                              <span>جاري تحميل التفسير والترجمة... / Loading...</span>
                            </div>
                          )}

                          {error && <div className="pane-error">{error}</div>}

                          {hasDetails && (
                            <div className="pane-details-content">
                              <div className="details-translation">
                                <span className="label-translation">English Translation (Saheeh International):</span>
                                <p className="text-translation">{details.translation}</p>
                              </div>
                              <div className="details-tafsir">
                                <span className="label-tafsir">التفسير الميسر / جلالين:</span>
                                <p className="text-tafsir quranic-text">{details.tafsir}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-controls">
                  <button
                    className="pagination-btn pagination-arrow"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  >
                    السابق / Prev
                  </button>
                  
                  <div className="pagination-pages-list">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        className={`pagination-btn pagination-number-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    className="pagination-btn pagination-arrow"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  >
                    التالي / Next
                  </button>
                </div>
              )}
            </div>

            {/* Linguistic / Lexical section */}
            {selectedConcept.similarWords && selectedConcept.similarWords.length > 0 && (
              <div className="concept-lexical-section">
                <h3 className="section-title">✨ السياق اللغوي والكلمات المشابهة / Similar Words</h3>
                <div className="similar-words-flex">
                  {selectedConcept.similarWords.map((word, idx) => (
                    <div key={idx} className="similar-word-badge">
                      <span className="sw-arabic quranic-text">{word.ar}</span>
                      <span className="sw-english">{word.en}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty state view */
          <div className="explorer-empty-state">
            <div className="empty-state-pulsing-icon">🔗</div>
            <h2 className="empty-state-title">مستكشف موضوعات آيات الذكر الحكيم</h2>
            <h3 className="empty-state-subtitle">Thematic Concept Explorer</h3>
            <p className="empty-state-instruction">
              اختر موضوعاً من القائمة الجانبية لاستكشاف الآيات المتعلقة والسياق اللغوي والتفسير.
              <br />
              Select a concept from the list to explore related verses, linguistics, and translations.
            </p>

            <div className="suggested-concepts-box">
              <span className="suggested-title">موضوعات مقترحة / Suggested Concepts:</span>
              <div className="suggested-badges-grid">
                {CONCEPTS.filter((c) =>
                  ['paradise', 'jihad', 'hypocrisy', 'spending', 'sadaqah', 'piety', 'repentance', 'hereafter', 'prayer', 'marriage', 'economy', 'politics', 'knowledge', 'heavens', 'miracles', 'stories', 'qisas'].includes(c.id)
                ).map((c) => (
                  <button
                    key={c.id}
                    className="suggested-concept-badge"
                    onClick={() => selectConcept(c)}
                  >
                    <span>{c.icon}</span> {c.nameAr} / {c.nameEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Panel (Right Column) */}
      <div className="explorer-sidebar">
        <div className="concept-search-wrapper">
          <span className="search-icon-inside">🔍</span>
          <input
            type="text"
            className="concept-search-input"
            placeholder="Search concepts... / ابحث عن موضوع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>

        <div className="concept-list-scroll">
          {filteredConcepts.length > 0 ? (
            filteredConcepts.map((concept) => (
              <div
                key={concept.id}
                className={`concept-item-row ${selectedConcept?.id === concept.id ? 'active' : ''}`}
                onClick={() => selectConcept(concept)}
              >
                <div className="concept-item-icon-box">{concept.icon}</div>
                <div className="concept-item-labels">
                  <div className="label-en">{concept.nameEn}</div>
                  <div className="label-ar quranic-text">{concept.nameAr}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-concepts-found">
              <p>No concepts match your search.</p>
              <p className="no-concepts-ar">لا توجد موضوعات مطابقة للبحث.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .concept-explorer-layout {
          display: grid;
          grid-template-columns: 1fr 290px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          min-height: 600px;
          overflow: visible;
          text-align: left;
        }

        /* Sidebar styling (swapped to right) */
        .explorer-sidebar {
          grid-column: 2;
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--border);
          border-right: none;
          background: rgba(255, 255, 255, 0.4);
        }
        :global(.dark) .explorer-sidebar {
          background: rgba(15, 23, 42, 0.2);
        }

        .concept-search-wrapper {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          position: relative;
        }
        .search-icon-inside {
          position: absolute;
          left: 1.6rem;
          opacity: 0.6;
          font-size: 0.95rem;
          pointer-events: none;
        }
        .concept-search-input {
          width: 100%;
          padding: 0.65rem 0.65rem 0.65rem 2.5rem;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--background);
          color: var(--foreground);
          font-size: 0.85rem;
          outline: none;
          transition: all 0.2s;
        }
        .concept-search-input:focus {
          border-color: var(--primary-light);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        .clear-search-btn {
          position: absolute;
          right: 1.6rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.8rem;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .clear-search-btn:hover {
          opacity: 1;
        }

        .concept-list-scroll {
          overflow-y: auto;
          max-height: 600px;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .concept-item-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.65rem 0.8rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
        }
        .concept-item-row:hover {
          background: rgba(6, 95, 70, 0.05);
          transform: translateX(-3px);
        }
        .concept-item-row.active {
          background: linear-gradient(135deg, var(--primary), #047857);
          color: white !important;
          box-shadow: 0 4px 12px rgba(6, 95, 70, 0.15);
        }

        .concept-item-icon-box {
          font-size: 1.15rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.04);
        }
        .concept-item-row.active .concept-item-icon-box {
          background: rgba(255, 255, 255, 0.2);
        }

        .concept-item-labels {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .concept-item-labels .label-en {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .concept-item-row.active .label-en {
          color: white;
        }
        .concept-item-labels .label-ar {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--primary);
        }
        .concept-item-row.active .label-ar {
          color: var(--accent-light);
        }

        .no-concepts-found {
          padding: 2rem 1rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }
        .no-concepts-ar {
          font-family: var(--font-arabic-modern);
          margin-top: 0.3rem;
        }

        /* Main Panel styling (swapped to left) */
        .explorer-main {
          grid-column: 1;
          flex: 1;
          background: var(--bg-surface);
        }

        /* Empty State */
        .explorer-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          min-height: 500px;
          text-align: center;
        }
        .empty-state-pulsing-icon {
          font-size: 3.5rem;
          margin-bottom: 1rem;
          animation: pulse 2.5s infinite ease-in-out;
        }
        .empty-state-title {
          font-size: 1.5rem;
          font-family: var(--font-arabic-classic);
          color: var(--primary);
          margin-bottom: 0.3rem;
        }
        .empty-state-subtitle {
          font-size: 1.1rem;
          color: var(--text-secondary);
          font-weight: 700;
          margin-bottom: 1rem;
        }
        .empty-state-instruction {
          font-size: 0.85rem;
          color: var(--text-secondary);
          max-width: 480px;
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }
        .suggested-concepts-box {
          width: 100%;
          max-width: 600px;
          border-top: 1px dashed var(--border);
          padding-top: 1.5rem;
        }
        .suggested-title {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 0.8rem;
          display: block;
        }
        .suggested-badges-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem;
        }
        .suggested-concept-badge {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: 50px;
          padding: 0.45rem 0.9rem;
          font-size: 0.8rem;
          cursor: pointer;
          color: var(--text-primary);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .suggested-concept-badge:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          transform: translateY(-2px);
        }

        /* Detail View */
        .explorer-details-view {
          padding: 1.8rem;
          display: flex;
          flex-direction: column;
          gap: 1.8rem;
        }
        .concept-detail-header-card {
          display: flex;
          gap: 1.25rem;
          background: var(--background);
          border: 1px solid var(--border);
          padding: 1.25rem;
          border-radius: 16px;
        }
        .concept-detail-icon-display {
          font-size: 2.5rem;
          width: 70px;
          height: 70px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        .concept-detail-title-block {
          flex: 1;
          text-align: left;
        }
        .concept-titles {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.4rem;
        }
        .concept-titles h2 {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--primary);
        }
        .concept-titles .title-ar {
          font-size: 1.45rem;
        }
        .antonym-badge {
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.1);
          border-radius: 6px;
          padding: 0.25rem 0.6rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #ef4444;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }
        .concept-detail-title-block .desc-en {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 0.25rem;
        }
        .concept-detail-title-block .desc-ar {
          font-size: 1.1rem;
          color: var(--primary);
          direction: rtl;
          text-align: right;
          margin-top: 0.3rem;
        }

        /* Verses section */
        .verses-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }
        .section-title {
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }
        .dynamic-badge-loading {
          font-size: 0.75rem;
          color: var(--primary-light);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .tiny-pulse-dot {
          width: 6px;
          height: 6px;
          background: var(--primary-light);
          border-radius: 50%;
          display: inline-block;
          animation: tinyPulse 1.5s infinite ease-in-out;
        }
        @keyframes tinyPulse {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 1; }
        }

        .verses-header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Export dropdown */
        .export-dropdown-wrap {
          position: relative;
        }
        .export-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.7rem;
          font-size: 0.75rem;
          font-weight: 700;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--primary);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .export-trigger-btn:hover {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }
        .export-overlay {
          position: fixed;
          inset: 0;
          z-index: 99;
        }
        .export-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          z-index: 100;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          overflow: hidden;
          min-width: 170px;
          animation: exportMenuIn 0.15s ease-out;
        }
        @keyframes exportMenuIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .export-menu-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.55rem 0.85rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          text-align: left;
        }
        .export-menu-item:hover {
          background: var(--primary);
          color: #fff;
        }
        .export-menu-item + .export-menu-item {
          border-top: 1px solid var(--border);
        }
        .export-icon {
          font-size: 1rem;
        }

        .verse-cards-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .concept-verse-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-right: 4px solid var(--primary-light);
          border-radius: 12px;
          padding: 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          transition: all 0.2s;
        }
        .concept-verse-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          border-color: var(--primary-light);
        }
        .verse-card-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          border-bottom: 1px solid rgba(0, 0, 0, 0.02);
          padding-bottom: 0.4rem;
        }
        .verse-reference {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .verse-key-badge {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 0.1rem 0.4rem;
          font-size: 0.7rem;
        }
        .verse-card-actions {
          display: flex;
          gap: 0.35rem;
        }
        .verse-action-btn {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }
        .verse-action-btn:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .verse-action-btn.active-btn {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .verse-action-btn.explore-btn {
          background: rgba(16, 185, 129, 0.06);
          border-color: rgba(16, 185, 129, 0.15);
          color: var(--primary-light);
        }
        .verse-action-btn.explore-btn:hover {
          background: var(--primary-light);
          color: white;
        }

        .verse-arabic-text {
          font-size: 1.35rem;
          color: var(--primary);
          line-height: 2;
          text-align: right;
          direction: rtl;
        }

        /* Expandable Pane */
        .verse-expandable-pane {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.85rem 1rem;
          margin-top: 0.4rem;
          text-align: left;
        }
        .pane-loader {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .mini-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .pane-error {
          font-size: 0.8rem;
          color: #ef4444;
          font-family: var(--font-arabic-modern);
        }
        .pane-details-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border-top: 1px dashed var(--border);
          padding-top: 0.75rem;
          margin-top: 0.5rem;
        }
        .details-translation {
          border-left: 2px solid var(--accent-light);
          padding-left: 0.6rem;
        }
        .label-translation,
        .label-tafsir {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 0.02em;
          display: block;
          margin-bottom: 0.2rem;
        }
        .text-translation {
          font-size: 0.85rem;
          color: var(--text-primary);
          line-height: 1.4;
          font-style: italic;
        }
        .text-tafsir {
          font-size: 1.05rem;
          color: var(--text-secondary);
          line-height: 1.6;
          text-align: right;
          direction: rtl;
          margin-top: 0.2rem;
        }

        /* Pagination controls */
        .pagination-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border);
          margin-top: 1.5rem;
          gap: 1rem;
        }
        .pagination-btn {
          background: var(--background);
          border: 1px solid var(--border);
          padding: 0.4rem 0.85rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          color: var(--text-primary);
          transition: all 0.2s;
        }
        .pagination-btn:hover:not(:disabled) {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pagination-pages-list {
          display: flex;
          gap: 0.3rem;
          align-items: center;
        }
        .pagination-number-btn {
          min-width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border-radius: 6px;
        }
        .pagination-number-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 2px 6px rgba(6, 95, 70, 0.2);
        }

        /* Lexical Section */
        .concept-lexical-section {
          background: rgba(6, 95, 70, 0.02);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.2rem;
        }
        .similar-words-flex {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .similar-word-badge {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.1rem;
          min-width: 75px;
          transition: all 0.2s;
        }
        .similar-word-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.02);
          border-color: var(--primary-light);
        }
        .similar-word-badge .sw-arabic {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--primary);
        }
        .similar-word-badge .sw-english {
          font-size: 0.68rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        /* Animations */
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.2));
          }
          100% {
            transform: scale(1);
            opacity: 0.9;
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-fade-in-quick {
          animation: fadeInQuick 0.3s ease-out forwards;
        }
        @keyframes fadeInQuick {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-down {
          animation: slideDown 0.25s ease-out forwards;
          overflow: hidden;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 600px;
          }
        }

        /* Responsive styling */
        @media (max-width: 900px) {
          .concept-explorer-layout {
            grid-template-columns: 1fr;
            max-height: none;
          }
          .explorer-sidebar {
            grid-column: auto;
            border-left: none;
            border-bottom: 1px solid var(--border);
            max-height: 300px;
          }
          .concept-list-scroll {
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 0.6rem;
            white-space: nowrap;
          }
          .concept-item-row {
            flex-shrink: 0;
            padding: 0.5rem 0.8rem;
          }
          .concept-item-row:hover {
            transform: translateY(-2px);
          }
          .explorer-main {
            grid-column: auto;
            min-height: 400px;
            max-height: 550px;
          }
          .concept-titles {
            flex-direction: column;
            align-items: flex-start;
          }
          .antonym-badge {
            margin-top: 0.3rem;
          }
        }
      `}</style>
    </div>
  );
}

export default function ConceptClusters() {
  return (
    <Suspense fallback={
      <div className="concept-explorer-layout shadow-sm" style={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
        <div className="mini-spinner"></div>
        <span style={{ marginLeft: '0.75rem', fontFamily: 'var(--font-arabic-modern)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          جاري تحميل مستكشف الموضوعات... / Loading Concept Explorer...
        </span>
      </div>
    }>
      <ConceptClustersContent />
    </Suspense>
  );
}
