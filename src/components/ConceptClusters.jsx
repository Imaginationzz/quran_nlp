'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { CONCEPTS } from '@/lib/concepts-data';
import { SURAH_NAMES, normalizeArabic } from '@/lib/arabic-utils';
import { useRouter, useSearchParams } from 'next/navigation';

const QUICK_TAGS = [
  { name: 'موسى', en: 'Moses', icon: '🌊' },
  { name: 'إبراهيم', en: 'Abraham', icon: '🕋' },
  { name: 'يوسف', en: 'Joseph', icon: '👑' },
  { name: 'عيسى', en: 'Jesus', icon: '🕊️' },
  { name: 'نوح', en: 'Noah', icon: '🚢' },
  { name: 'مريم', en: 'Mary', icon: '🌸' },
  { name: 'الصبر', en: 'Patience', icon: '🛡️' },
  { name: 'الرحمة', en: 'Mercy', icon: '💧' },
  { name: 'الجنة', en: 'Paradise', icon: '🌴' },
  { name: 'التقوى', en: 'Piety', icon: '✨' },
  { name: 'الصلاة', en: 'Prayer', icon: '🤲' },
];

function highlightArabicText(text, query) {
  if (!query || !text) return text;
  const qNorm = normalizeArabic(query.trim());
  if (!qNorm) return text;
  const qWithoutAl = (qNorm.startsWith('ال') && qNorm.length > 3) ? qNorm.slice(2) : null;

  const words = text.split(' ');
  return words.map((w, idx) => {
    const wNorm = normalizeArabic(w);
    const isMatch =
      wNorm.includes(qNorm) ||
      (qWithoutAl && wNorm.includes(qWithoutAl));

    if (isMatch) {
      return (
        <mark key={idx} className="quran-search-highlight">
          {w}{' '}
        </mark>
      );
    }
    return w + ' ';
  });
}

function ConceptClustersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Concept & Search States
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [activeWordSearch, setActiveWordSearch] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  
  // Verses state
  const [versesList, setVersesList] = useState([]);
  const [isFetchingVerses, setIsFetchingVerses] = useState(false);
  const [surahFilter, setSurahFilter] = useState('all');

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

  // Clear search and input fields on fresh page load / refresh
  useEffect(() => {
    setSearchInput('');
    setActiveWordSearch(null);
    setSelectedConcept(null);
    setVersesList([]);

    // Clean any lingering search param from URL on reload so it never pre-fills
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('search')) {
        params.delete('search');
        const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  }, []);

  // Fetch dynamic related verses whenever selected concept changes
  useEffect(() => {
    if (!selectedConcept) {
      if (!activeWordSearch) setVersesList([]);
      return;
    }

    setActiveWordSearch(null);
    setSurahFilter('all');
    setCurrentPage(1);
    setVersesList(selectedConcept.keyVerses || []);
    setIsFetchingVerses(true);
    setShowExportMenu(false);

    let isCancelled = false;

    const fetchDynamicVerses = async () => {
      try {
        const query = encodeURIComponent(selectedConcept.nameAr);
        const res = await fetch(`/api/search?q=${query}&type=semantic&limit=1000`);
        if (!res.ok) throw new Error('Search API failed');
        const data = await res.json();

        if (isCancelled) return;

        const dynamicList = (data.results || []).map((r) => ({
          key: r.location,
          text: r.fullVerse,
          word: r.word,
          lemma: r.lemma,
          root: r.root,
          context: r.context
        }));

        const merged = (selectedConcept.keyVerses || []).map(kv => ({ ...kv }));
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
      } finally {
        if (!isCancelled) {
          setIsFetchingVerses(false);
        }
      }
    };

    fetchDynamicVerses();

    return () => {
      isCancelled = true;
    };
  }, [selectedConcept]);

  // Execute word or topic search across all Quranic verses
  const executeWordSearch = async (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    setSelectedConcept(null);
    setActiveWordSearch(trimmed);
    setSearchInput(trimmed);
    setSurahFilter('all');
    setCurrentPage(1);
    setIsFetchingVerses(true);
    setShowExportMenu(false);
    setVersesList([]);

    try {
      const query = encodeURIComponent(trimmed);
      const res = await fetch(`/api/search?q=${query}&type=keyword&limit=1000`);
      if (!res.ok) throw new Error('Search API request failed');
      const data = await res.json();

      const resultsList = (data.results || []).map((r) => ({
        key: r.location,
        text: r.fullVerse,
        word: r.word,
        lemma: r.lemma,
        root: r.root,
        context: r.context
      }));

      setVersesList(resultsList);
    } catch (err) {
      console.error('Word search failed:', err);
    } finally {
      setIsFetchingVerses(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      executeWordSearch(searchInput);
    }
  };

  const clearAllSearch = () => {
    setSelectedConcept(null);
    setActiveWordSearch(null);
    setSearchInput('');
    setVersesList([]);
    setSurahFilter('all');
    setCurrentPage(1);
    const params = new URLSearchParams(window.location.search);
    params.delete('search');
    params.delete('concept');
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const selectConcept = (concept) => {
    setActiveWordSearch(null);
    setSearchInput('');
    setSelectedConcept(concept);
    const params = new URLSearchParams(window.location.search);
    if (concept) {
      params.set('concept', concept.id);
      params.delete('search');
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

  // Surah distribution & statistics calculation
  const { surahDistribution, surahCount } = useMemo(() => {
    const dist = {};
    versesList.forEach((v) => {
      const [suraNum] = v.key.split(':');
      dist[suraNum] = (dist[suraNum] || 0) + 1;
    });
    return {
      surahDistribution: dist,
      surahCount: Object.keys(dist).length
    };
  }, [versesList]);

  // Filtered verses according to selected Surah filter
  const filteredVerses = useMemo(() => {
    if (surahFilter === 'all') return versesList;
    return versesList.filter((v) => v.key.startsWith(`${surahFilter}:`));
  }, [versesList, surahFilter]);

  // Calculate paginated index parameters
  const totalPages = Math.ceil(filteredVerses.length / ITEMS_PER_PAGE);
  const paginatedVerses = useMemo(() => {
    return filteredVerses.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredVerses, currentPage]);

  // ── Export helpers ─────────────────────────────────────────────────────────
  const getExportTitle = () => {
    if (activeWordSearch) {
      return `البحث: ${activeWordSearch} / Search: ${activeWordSearch}`;
    }
    if (selectedConcept) {
      return `${selectedConcept.nameAr} / ${selectedConcept.nameEn}`;
    }
    return 'آيات القرآن الكريم / Quran Verses';
  };

  const handleExportMarkdown = () => {
    const title = getExportTitle();
    const lines = [
      `# ${title}`,
      activeWordSearch ? `> بحث عن الكلمة: **${activeWordSearch}**` : `> ${selectedConcept?.descriptionEn || ''}`,
      activeWordSearch ? `> عدد الآيات: **${filteredVerses.length}** في **${surahCount}** سورة` : `> ${selectedConcept?.descriptionAr || ''}`,
      ``,
      `---`,
      `## الآيات (${filteredVerses.length})`,
      ``
    ];
    filteredVerses.forEach((v, i) => {
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
    a.download = `${(activeWordSearch || selectedConcept?.id || 'quran-verses')}-verses.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportTxt = () => {
    const title = getExportTitle();
    const lines = [
      title,
      `عدد الآيات: ${filteredVerses.length}`,
      '─'.repeat(60),
      ''
    ];
    filteredVerses.forEach((v, i) => {
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
    a.download = `${(activeWordSearch || selectedConcept?.id || 'quran-verses')}-verses.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportPdf = () => {
    const title = getExportTitle();
    const rows = filteredVerses.map((v, i) => {
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
      <title>${title}</title>
      <style>body{font-family:sans-serif;padding:32px;max-width:900px;margin:auto}
      h1{font-size:22px;color:#1a3a1a} p{color:#444;font-size:14px}
      @media print{body{padding:0}}</style></head><body>
      <h1>${title}</h1>
      <p><strong>عدد الآيات:</strong> ${filteredVerses.length}</p>
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

  return (
    <div className="concept-explorer-root">
      {/* ── Top Dedicated Word & Topic Search Banner ───────────────────────── */}
      <div className="concept-search-banner card shadow-sm">
        <div className="banner-top-info">
          <div className="banner-badge">
            <span className="sparkle-icon">✨</span>
            <span>البحث القرآني والموضوعي / Quranic Word & Theme Finder</span>
          </div>
          <p className="banner-desc">
            اكتب أي كلمة، اسم نبي، أو مفهوم لاستخراج جميع الآيات المتعلقة فوراً في القرآن الكريم
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="search-form-control">
          <div className="search-input-wrapper">
            <span className="search-lead-icon">🔍</span>
            <input
              type="text"
              className="search-main-input quranic-text"
              placeholder="اكتب كلمة أو اسم نبي (مثال: موسى، إبراهيم، يوسف، الصبر، الرحمة...)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            {searchInput && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchInput('');
                  if (activeWordSearch) clearAllSearch();
                }}
                title="مسح"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="search-submit-action-btn"
            disabled={!searchInput.trim() || isFetchingVerses}
          >
            {isFetchingVerses ? (
              <span className="btn-spinner"></span>
            ) : (
              <span>بحث في الآيات ❯</span>
            )}
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="quick-suggestions-container">
          <span className="quick-suggestions-label">⚡ مقترحات سريعة / Quick Explore:</span>
          <div className="quick-pills-row">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag.name}
                type="button"
                className={`quick-pill-item ${activeWordSearch === tag.name ? 'active-pill' : ''}`}
                onClick={() => executeWordSearch(tag.name)}
              >
                <span className="pill-icon">{tag.icon}</span>
                <span className="pill-name-ar quranic-text">{tag.name}</span>
                {tag.en && <span className="pill-name-en">({tag.en})</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Layout (Left Details Panel + Right Sidebar) ──────────────── */}
      <div className="concept-explorer-layout shadow-sm">
        {/* Main Details Panel (Left Column) */}
        <div className="explorer-main">
          {activeWordSearch ? (
            /* ── Custom Word Search Results View ────────────────────────────── */
            <div className="explorer-details-view animate-fade-in-quick">
              <div className="concept-detail-header-card word-search-header-card">
                <div className="concept-detail-icon-display word-search-icon">
                  📜
                </div>
                <div className="concept-detail-title-block">
                  <div className="concept-titles">
                    <h2>
                      Verses related to / <span className="title-ar quranic-text font-bold">"{activeWordSearch}"</span>
                    </h2>
                    <button className="reset-view-btn" onClick={clearAllSearch}>
                      🔄 العودة للموضوعات / Back to Concepts
                    </button>
                  </div>
                  <p className="desc-en">
                    All verses mentioning or containing the word <strong>"{activeWordSearch}"</strong> across the Quran.
                  </p>
                  <p className="desc-ar quranic-text">
                    جميع الآيات التي وردت فيها كلمة «<strong>{activeWordSearch}</strong>» أو اشتقت منها في كتاب الله الحكيم.
                  </p>

                  {/* Search Stats Bar */}
                  <div className="search-stats-pills-row">
                    <span className="stat-pill highlight-stat">
                      📊 إجمالي الآيات التي تم العثور عليها: <strong>{versesList.length} آية</strong>
                    </span>
                    <span className="stat-pill">
                      📑 موزعة على: <strong>{surahCount} سورة</strong>
                    </span>
                    <span className="stat-pill">
                      🎯 بحث شامل في المتن والجذور
                    </span>
                  </div>
                </div>
              </div>

              {/* Verses section with Surah filter and Export */}
              <div className="verses-explorer-section">
                <div className="verses-section-header">
                  <div className="verses-section-title-wrap">
                    <h3 className="section-title">
                      📖 إجمالي الآيات المستخرجة: ({filteredVerses.length}) / Verses Found ({filteredVerses.length})
                    </h3>
                  </div>

                  <div className="verses-header-right">
                    {/* Surah Filter Dropdown */}
                    {surahCount > 1 && (
                      <div className="surah-filter-wrap">
                        <label className="surah-filter-label" htmlFor="surah-filter-select">
                          السورة:
                        </label>
                        <select
                          id="surah-filter-select"
                          className="surah-filter-select quranic-text"
                          value={surahFilter}
                          onChange={(e) => {
                            setSurahFilter(e.target.value);
                            setCurrentPage(1);
                          }}
                        >
                          <option value="all">جميع السور ({versesList.length} آية)</option>
                          {Object.entries(surahDistribution).map(([suraNum, count]) => (
                            <option key={suraNum} value={suraNum}>
                              سورة {SURAH_NAMES[parseInt(suraNum, 10)]} ({count} آية)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {isFetchingVerses && (
                      <span className="dynamic-badge-loading">
                        <span className="tiny-pulse-dot"></span> جاري البحث...
                      </span>
                    )}

                    {/* Export dropdown */}
                    {!isFetchingVerses && filteredVerses.length > 0 && (
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

                {/* Verses Cards */}
                {filteredVerses.length > 0 ? (
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
                            {highlightArabicText(v.text, activeWordSearch)}
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
                ) : (
                  <div className="no-verses-found-card">
                    <p>لا توجد آيات مطابقة للبحث أو الفلتر المحدد.</p>
                    <p className="no-verses-en">No verses match the selected criteria.</p>
                  </div>
                )}

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
            </div>
          ) : selectedConcept ? (
            /* ── Predefined Concept Details View ────────────────────────────── */
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

                  <div className="search-stats-pills-row">
                    <span className="stat-pill highlight-stat">
                      📊 إجمالي الآيات التي تم العثور عليها: <strong>{versesList.length} آية</strong>
                    </span>
                    <span className="stat-pill">
                      📑 موزعة على: <strong>{surahCount} سورة</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Verses list section */}
              <div className="verses-explorer-section">
                <div className="verses-section-header">
                  <h3 className="section-title">
                    📖 إجمالي الآيات المستخرجة: ({filteredVerses.length}) / Verses Found ({filteredVerses.length})
                  </h3>
                  <div className="verses-header-right">
                    {/* Surah Filter Dropdown */}
                    {surahCount > 1 && (
                      <div className="surah-filter-wrap">
                        <label className="surah-filter-label" htmlFor="concept-surah-filter">
                          السورة:
                        </label>
                        <select
                          id="concept-surah-filter"
                          className="surah-filter-select quranic-text"
                          value={surahFilter}
                          onChange={(e) => {
                            setSurahFilter(e.target.value);
                            setCurrentPage(1);
                          }}
                        >
                          <option value="all">جميع السور ({versesList.length} آية)</option>
                          {Object.entries(surahDistribution).map(([suraNum, count]) => (
                            <option key={suraNum} value={suraNum}>
                              سورة {SURAH_NAMES[parseInt(suraNum, 10)]} ({count} آية)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {isFetchingVerses && (
                      <span className="dynamic-badge-loading">
                        <span className="tiny-pulse-dot"></span> جاري البحث...
                      </span>
                    )}

                    {/* Export dropdown */}
                    {!isFetchingVerses && filteredVerses.length > 0 && (
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
            /* ── Empty State View ───────────────────────────────────────────── */
            <div className="explorer-empty-state">
              <div className="empty-state-pulsing-icon">🔗</div>
              <h2 className="empty-state-title">مستكشف موضوعات وكلمات آيات الذكر الحكيم</h2>
              <h3 className="empty-state-subtitle">Quranic Thematic & Keyword Explorer</h3>
              <p className="empty-state-instruction">
                اكتب أي كلمة (مثل: <strong>موسى</strong>، <strong>إبراهيم</strong>، <strong>الصبر</strong>) في شريط البحث أعلاه، أو اختر موضوعاً من القائمة الجانبية.
                <br />
                Search any word or prophet name above, or select a thematic concept from the sidebar to explore related verses.
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
          {/* Sidebar Header with Total Verses Found / Concepts Summary */}
          <div className="explorer-sidebar-header">
            <div className="sidebar-header-main-row">
              <span className="sidebar-header-icon">📑</span>
              <div className="sidebar-header-titles">
                <span className="sidebar-header-title-ar quranic-text">الموضوعات الكبرى</span>
                <span className="sidebar-header-title-en">Thematic Concepts</span>
              </div>
              <span className="sidebar-concepts-total-badge" title="إجمالي الموضوعات">{CONCEPTS.length}</span>
            </div>

            {/* Total Verses Found Counter */}
            <div className="sidebar-verses-count-card">
              <span className="count-label">إجمالي الآيات التي تم العثور عليها / Verses Found:</span>
              <div className="count-value-row">
                <span className="count-number">{versesList.length}</span>
                <span className="count-unit">آية قرآنية</span>
              </div>
            </div>
          </div>

          <div className="concept-list-scroll">
            {CONCEPTS.map((concept) => (
              <div
                key={concept.id}
                className={`concept-item-row ${selectedConcept?.id === concept.id && !activeWordSearch ? 'active' : ''}`}
                onClick={() => selectConcept(concept)}
              >
                <div className="concept-item-icon-box">{concept.icon}</div>
                <div className="concept-item-labels">
                  <div className="label-en">{concept.nameEn}</div>
                  <div className="label-ar quranic-text">{concept.nameAr}</div>
                </div>
                {concept.keyVerses?.length > 0 && (
                  <span className="concept-item-verses-pill" title={`${concept.keyVerses.length} آيات رئيسية`}>
                    {concept.keyVerses.length}+
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .concept-explorer-root {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
          text-align: left;
        }

        /* ── Top Dedicated Search Banner ─────────────────────────────────── */
        .concept-search-banner {
          background: linear-gradient(135deg, rgba(6, 95, 70, 0.04) 0%, rgba(16, 185, 129, 0.08) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 18px;
          padding: 1.5rem 1.8rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        :global(.dark) .concept-search-banner {
          background: linear-gradient(135deg, rgba(6, 95, 70, 0.15) 0%, rgba(15, 23, 42, 0.3) 100%);
          border-color: rgba(16, 185, 129, 0.25);
        }

        .banner-top-info {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .banner-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: 0.02em;
        }
        .sparkle-icon {
          font-size: 1rem;
        }
        .banner-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          direction: rtl;
          text-align: right;
          font-family: var(--font-arabic-modern);
        }

        .search-form-control {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          width: 100%;
        }
        .search-input-wrapper {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }
        .search-lead-icon {
          position: absolute;
          left: 1.1rem;
          font-size: 1.1rem;
          opacity: 0.6;
          pointer-events: none;
        }
        .search-main-input {
          width: 100%;
          padding: 0.85rem 2.8rem 0.85rem 2.8rem;
          border: 2px solid var(--border);
          border-radius: 14px;
          background: var(--bg-surface);
          color: var(--foreground);
          font-size: 1.15rem;
          outline: none;
          transition: all 0.2s ease;
          direction: rtl;
          text-align: right;
        }
        .search-main-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
        }
        .search-clear-btn {
          position: absolute;
          left: 1rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.9rem;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
          padding: 0.3rem;
        }
        .search-clear-btn:hover {
          opacity: 1;
          color: #ef4444;
        }
        .search-submit-action-btn {
          background: linear-gradient(135deg, var(--primary), #047857);
          color: #ffffff;
          border: none;
          border-radius: 14px;
          padding: 0.85rem 1.6rem;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(6, 95, 70, 0.2);
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 120px;
        }
        .search-submit-action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(6, 95, 70, 0.3);
        }
        .search-submit-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Quick suggestions */
        .quick-suggestions-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          border-top: 1px dashed rgba(16, 185, 129, 0.2);
          padding-top: 0.8rem;
        }
        .quick-suggestions-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .quick-pills-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
        .quick-pill-item {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 50px;
          padding: 0.35rem 0.8rem;
          font-size: 0.8rem;
          cursor: pointer;
          color: var(--text-primary);
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .quick-pill-item:hover {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
          transform: translateY(-1px);
        }
        .quick-pill-item.active-pill {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
          box-shadow: 0 2px 8px rgba(6, 95, 70, 0.25);
        }
        .pill-name-ar {
          font-weight: 700;
          font-size: 0.9rem;
        }
        .pill-name-en {
          font-size: 0.7rem;
          opacity: 0.8;
        }

        /* ── Layout Grid ─────────────────────────────────────────────────── */
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

        /* Sidebar styling */
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

        .explorer-sidebar-header {
          padding: 1.1rem 1.1rem 0.9rem 1.1rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background: rgba(16, 185, 129, 0.04);
        }
        .sidebar-header-main-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .sidebar-header-icon {
          font-size: 1.2rem;
        }
        .sidebar-header-titles {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .sidebar-header-title-ar {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--primary);
        }
        .sidebar-header-title-en {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .sidebar-concepts-total-badge {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: 50px;
          padding: 0.15rem 0.55rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
        }

        .sidebar-verses-count-card {
          background: var(--background);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 12px;
          padding: 0.6rem 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
        }
        .count-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-secondary);
          line-height: 1.3;
        }
        .count-value-row {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
        }
        .count-number {
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--primary);
          line-height: 1;
        }
        .count-unit {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          font-family: var(--font-arabic-modern);
        }

        .concept-list-scroll {
          overflow-y: auto;
          max-height: 600px;
          padding: 0.6rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .concept-item-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
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
          flex: 1;
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

        .concept-item-verses-pill {
          margin-left: auto;
          background: rgba(16, 185, 129, 0.08);
          color: var(--primary);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          border-radius: 20px;
          border: 1px solid rgba(16, 185, 129, 0.15);
        }
        .concept-item-row.active .concept-item-verses-pill {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.4);
        }

        /* Main Panel styling */
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
          max-width: 520px;
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
        .word-search-header-card {
          border-right: 4px solid var(--primary);
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
        .reset-view-btn {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.35rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .reset-view-btn:hover {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
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

        .search-stats-pills-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.8rem;
        }
        .stat-pill {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 6px;
          padding: 0.25rem 0.65rem;
          font-size: 0.75rem;
          color: var(--primary);
          font-weight: 600;
        }
        .stat-pill.highlight-stat {
          background: rgba(16, 185, 129, 0.15);
          border-color: var(--primary);
          font-weight: 700;
        }

        /* Verses section */
        .verses-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.6rem;
          margin-bottom: 1rem;
        }
        .section-title {
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0;
        }
        .verses-header-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .surah-filter-wrap {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .surah-filter-select {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.25rem 0.6rem;
          font-size: 0.85rem;
          color: var(--text-primary);
          outline: none;
          cursor: pointer;
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

        :global(.quran-search-highlight) {
          background: rgba(16, 185, 129, 0.18);
          color: var(--primary);
          font-weight: 800;
          border-radius: 4px;
          padding: 0 4px;
          border-bottom: 2px solid var(--primary);
        }

        .no-verses-found-card {
          padding: 3rem 1rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 1rem;
          font-family: var(--font-arabic-modern);
        }
        .no-verses-en {
          font-size: 0.85rem;
          margin-top: 0.3rem;
          opacity: 0.8;
          font-family: sans-serif;
        }

        /* Expandable Details Pane */
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
          .search-form-control {
            flex-direction: column;
          }
          .search-submit-action-btn {
            width: 100%;
          }
          .concept-explorer-layout {
            grid-template-columns: 1fr;
          }
          .explorer-sidebar {
            grid-column: auto;
            border-left: none;
            border-bottom: 1px solid var(--border);
            max-height: 320px;
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
          .explorer-main {
            grid-column: auto;
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
          جاري تحميل مستكشف الموضوعات والكلمات... / Loading Concept Explorer...
        </span>
      </div>
    }>
      <ConceptClustersContent />
    </Suspense>
  );
}
