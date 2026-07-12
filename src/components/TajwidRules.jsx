'use client';

import React, { useState, useEffect } from 'react';
import { getDual } from '@/lib/translations';
import { SURAH_NAMES } from '@/lib/arabic-utils';

// ── TAJWID RULES SCHEMA ──────────────────────────────────────────────────────
const TAJWID_RULES = [
  {
    id: 'noon_sakinah',
    nameAr: 'أحكام النون الساكنة والتنوين',
    nameEn: 'Noon Sakinah & Tanween',
    descAr: 'أربعة أحكام تصدر عند التقاء النون الساكنة أو التنوين بأحد الحروف الهجائية.',
    descEn: 'Four rules governing the pronunciation of Noon Sakinah or Tanween when followed by Arabic letters.',
    subRules: [
      {
        id: 'izhar',
        nameAr: 'الإظهار الحلقي',
        nameEn: 'Izhar (Clear Pronunciation)',
        letters: ['ء', 'هـ', 'ع', 'ح', 'غ', 'خ'],
        descAr: 'نطق النون الساكنة أو التنوين واضحة بدون غنة زائدة عند ملاقاتها حروف الحلق.',
        descEn: 'Pronouncing the Noon sound clearly from its throat articulation point without extra nasalization.',
        color: '#e74c3c' // Red
      },
      {
        id: 'idgham',
        nameAr: 'الإدغام بغنة / بغير غنة',
        nameEn: 'Idgham (Assimilation)',
        letters: ['ي', 'ر', 'م', 'ل', 'و', 'ن'],
        descAr: 'دمج النون الساكنة بالحرف التالي لكي يصيرا حرفاً واحداً مشدداً. بغنة (يَمْوُن) أو بغير غنة (ل، ر).',
        descEn: 'Merging the Noon sound into the next letter. With Ghunnah (ي، ن، م، و) or without Ghunnah (ل، ر).',
        color: '#2ecc71' // Green
      },
      {
        id: 'iqlab',
        nameAr: 'الإقلاب',
        nameEn: 'Iqlab (Conversion)',
        letters: ['ب'],
        descAr: 'قلب النون الساكنة أو التنوين ميماً مخفاة بغنة عند ملاقاتها لحرف الباء.',
        descEn: 'Converting the Noon sound into a soft Mim sound with Ghunnah when followed by the letter Ba.',
        color: '#e67e22' // Orange
      },
      {
        id: 'ikhfa',
        nameAr: 'الإخفاء الحقيقي',
        nameEn: 'Ikhfa (Concealment)',
        letters: ['ص', 'ذ', 'ث', 'ج', 'د', 'س', 'ش', 'ق', 'س', 'ك', 'ض', 'ت', 'ظ', 'ز', 'ف'],
        descAr: 'نطق النون الساكنة بحالة متوسطة بين الإظهار والإدغام عارية عن التشديد مع بقاء الغنة.',
        descEn: 'Hiding/concealing the Noon sound with nasalization when followed by any of the remaining 15 letters.',
        color: '#9b59b6' // Purple
      }
    ]
  },
  {
    id: 'meem_sakinah',
    nameAr: 'أحكام الميم الساكنة',
    nameEn: 'Meem Sakinah Rules',
    descAr: 'ثلاثة أحكام تطبق عند التقاء الميم الساكنة بحروف الهجاء.',
    descEn: 'Three rules applied when a non-vowelled Meem is followed by other letters.',
    subRules: [
      {
        id: 'meem_ikhfa',
        nameAr: 'الإخفاء الشفوي',
        nameEn: 'Ikhfa Shafawi',
        letters: ['ب'],
        descAr: 'إخفاء الميم الساكنة مع الغنة عند ملاقاتها لحرف الباء.',
        descEn: 'Concealing the Meem sound with nasalization at the lips when followed by Ba.',
        color: '#e67e22'
      },
      {
        id: 'meem_idgham',
        nameAr: 'إدغام مثلين صغير',
        nameEn: 'Idgham Mithlayn',
        letters: ['م'],
        descAr: 'إدغام الميم الساكنة في الميم المتحركة بعدها لتصبح ميمًا واحدة مشددة بغنة.',
        descEn: 'Merging the silent Meem into a vowelled Meem with Ghunnah.',
        color: '#2ecc71'
      },
      {
        id: 'meem_izhar',
        nameAr: 'الإظهار الشفوي',
        nameEn: 'Izhar Shafawi',
        letters: ['جميع الحروف ما عدا ب، م'],
        descAr: 'نطق الميم الساكنة واضحة ومظهرة بدون غنة عند بقية الحروف وخاصة عند الفاء والواو.',
        descEn: 'Pronouncing the Meem sound clearly without extra nasalization at all other letters.',
        color: '#e74c3c'
      }
    ]
  },
  {
    id: 'qalqalah',
    nameAr: 'أحكام القلقلة',
    nameEn: 'Qalqalah (Echoing / Vibration)',
    descAr: 'اضطراب الصوت واهتزازه عند نطق الحرف الساكن ليسمع له نبرة قوية.',
    descEn: 'An echoing or vibrating sound emitted upon pronouncing the consonants when vowelless (Sakin).',
    subRules: [
      {
        id: 'qalqalah_s',
        nameAr: 'القلقلة الصغرى',
        nameEn: 'Minor Qalqalah',
        letters: ['ق', 'ط', 'ب', 'ج', 'د'],
        descAr: 'عندما يكون حرف القلقلة ساكنًا في وسط الكلمة أو وسط الكلام.',
        descEn: 'When the Qalqalah letter is in the middle of a word or sentence.',
        color: '#3498db' // Blue
      },
      {
        id: 'qalqalah_k',
        nameAr: 'القلقلة الكبرى',
        nameEn: 'Major Qalqalah',
        letters: ['ق', 'ط', 'ب', 'ج', 'د'],
        descAr: 'عندما يقع حرف القلقلة في آخر الكلمة موقوفًا عليه.',
        descEn: 'When stopping on a Qalqalah letter at the end of a word or verse.',
        color: '#2980b9' // Dark Blue
      }
    ]
  },
  {
    id: 'madd_rules',
    nameAr: 'أحكام المدود الكبرى',
    nameEn: 'Major Madd (Prolongation)',
    descAr: 'إطالة الصوت بحرف من حروف المد الثلاثة (الألف، الواو، الياء).',
    descEn: 'Prolongation of the sound of the three Madd letters (Alif, Waw, Ya) under specific conditions.',
    subRules: [
      {
        id: 'madd_wajib',
        nameAr: 'المد الواجب المتصل',
        nameEn: 'Madd Muttasil (Connected)',
        letters: ['ا + ء', 'و + ء', 'ي + ء'],
        descAr: 'أن يقع المد والهمزة في كلمة واحدة (يمد 4 أو 5 حركات).',
        descEn: 'When the Madd letter and Hamzah are in the same word (prolonged 4-5 beats).',
        color: '#e74c3c'
      },
      {
        id: 'madd_jaiz',
        nameAr: 'المد الجائز المنفصل',
        nameEn: 'Madd Munfasil (Disconnected)',
        letters: ['ا / ء', 'و / ء', 'ي / ء'],
        descAr: 'أن يقع حرف المد في آخر الكلمة والهمزة في أول الكلمة التي تليها (يمد 4 أو 5 حركات).',
        descEn: 'When the Madd letter is at the end of a word and Hamzah is at the start of the next (4-5 beats).',
        color: '#f1c40f' // Yellow
      }
    ]
  }
];

const PRACTICE_QUESTIONS = [
  {
    text: 'مِنْ خَوْفٍ',
    options: ['الإظهار الحلقي', 'الإخفاء الحقيقي', 'الإقلاب', 'الإدغام بغنة'],
    correctIdx: 0,
    explanation: 'النون الساكنة جاء بعدها حرف الخاء وهو من حروف الإظهار الحلقي الستة.'
  },
  {
    text: 'مَن يَقُولُ',
    options: ['الإظهار الشفوي', 'الإدغام بغنة', 'الإخفاء الحقيقي', 'القلقلة الكبرى'],
    correctIdx: 1,
    explanation: 'النون الساكنة التقت بالياء في بداية الكلمة الثانية، وهو إدغام بغنة.'
  },
  {
    text: 'مِن بَعْدِ',
    options: ['الإظهار الحلقي', 'الإخفاء الشفوي', 'الإقلاب', 'القلقلة الصغرى'],
    correctIdx: 2,
    explanation: 'النون الساكنة التقت بحرف الباء فقُلبت ميماً مخفاة بغنة.'
  },
  {
    text: 'يَقْطَعُونَ',
    options: ['القلقلة الصغرى', 'القلقلة الكبرى', 'المد الجائز المنفصل', 'الإقلاب'],
    correctIdx: 0,
    explanation: 'حرف القاف ساكن في وسط الكلمة وهو من حروف قطب جد (قلقلة صغرى).'
  },
  {
    text: 'السَّمَاءُ',
    options: ['المد الجائز المنفصل', 'المد الواجب المتصل', 'الإظهار الحلقي', 'الإخفاء الحقيقي'],
    correctIdx: 1,
    explanation: 'الألف المدية والهمزة اجتمعتا في كلمة واحدة (مد متصل).'
  },
  {
    text: 'تَرْمِيهِم بِحِجَارَةٍ',
    options: ['الإخفاء الشفوي', 'الإظهار الشفوي', 'الإدغام بغنة', 'القلقلة الكبرى'],
    correctIdx: 0,
    explanation: 'الميم الساكنة التقت بالباء في الكلمة الثانية (إخفاء شفوي).'
  }
];

export default function TajwidRules() {
  const [selectedRule, setSelectedRule] = useState(TAJWID_RULES[0]);
  const [selectedSubRule, setSelectedSubRule] = useState(TAJWID_RULES[0].subRules[0]);

  // Quran Reader state
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [surahVerses, setSurahVerses] = useState({});
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [readerPage, setReaderPage] = useState(1);
  const VERSES_PER_PAGE = 8;

  // Practice state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);

  // Load selected Surah data on change
  useEffect(() => {
    const fetchSurah = async () => {
      setLoadingSurah(true);
      try {
        const res = await fetch(`/api/quran/${selectedSurah}`);
        const data = await res.json();
        setSurahVerses(data.verses || {});
        setReaderPage(1); // Reset page on Surah switch
      } catch (err) {
        console.error('Failed to load Surah:', err);
      } finally {
        setLoadingSurah(false);
      }
    };
    fetchSurah();
  }, [selectedSurah]);

  // Sync sub-rule if rule changes
  useEffect(() => {
    setSelectedSubRule(selectedRule.subRules[0]);
  }, [selectedRule]);

  const handleAnswer = (optionIdx) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIdx);
    setShowExplanation(true);
    if (optionIdx === PRACTICE_QUESTIONS[currentQIndex].correctIdx) {
      setScore(prev => prev + 10);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    setCurrentQIndex(prev => (prev + 1) % PRACTICE_QUESTIONS.length);
  };

  // Dynamic Rule Highlighting in Quran Text
  const getHighlightedText = (text, ruleId) => {
    if (!text) return text;
    let html = text;

    // Helper function for regex wrapping
    const highlight = (regex, color, className) => {
      return html.replace(regex, `<span class="${className}" style="color:${color}; font-weight:bold; border-bottom:2px solid ${color}; padding:0 1px;">$&</span>`);
    };

    if (ruleId === 'izhar') {
      // Noon Sakinah (نْ) or Tanween followed by Izhar letters: ء, هـ, ع, ح, غ, خ
      const regex = /(?:[نْ]|\u064B|\u064C|\u064D)\s*[\u0621\u0623\u0625\u0624\u0626\u0647\u0639\u062d\u063a\u062e]/g;
      return highlight(regex, '#e74c3c', 'tajwid-izhar');
    }
    if (ruleId === 'idgham') {
      // Noon Sakinah or Tanween followed by Idgham letters: ي, ر, م, ل, و, ن
      const regex = /(?:[نْ]|\u064B|\u064C|\u064D)\s*[\u064a\u0631\u0645\u0644\u0648\u0646]/g;
      return highlight(regex, '#2ecc71', 'tajwid-idgham');
    }
    if (ruleId === 'iqlab') {
      // Noon Sakinah or Tanween followed by Ba (ب)
      const regex = /(?:[نْ]|\u064B|\u064C|\u064D)\s*[\u0628]/g;
      return highlight(regex, '#e67e22', 'tajwid-iqlab');
    }
    if (ruleId === 'ikhfa') {
      // Noon Sakinah or Tanween followed by Ikhfa letters
      const regex = /(?:[نْ]|\u064B|\u064C|\u064D)\s*[\u0635\u0630\u062b\u062c\u062f\u0633\u0634\u0642\u0643\u0636\u062a\u0638\u0632\u0641]/g;
      return highlight(regex, '#9b59b6', 'tajwid-ikhfa');
    }
    if (ruleId === 'qalqalah_s' || ruleId === 'qalqalah_k') {
      // Qalqalah letters: ق, ط, ب, ج, د (normally Sakin / has Sukoon \u0652)
      const regex = /[\u0642\u0637\u0628\u062c\u062f]\u0652/g;
      return highlight(regex, '#3498db', 'tajwid-qalqalah');
    }
    if (ruleId === 'madd_wajib' || ruleId === 'madd_jaiz') {
      // Madd symbols (~ \u0651 or waves) followed by Hamzah
      const regex = /[\u0627\u0648\u064a]\u0670?\s*[\u0621\u0623\u0625]/g;
      return highlight(regex, '#e74c3c', 'tajwid-madd');
    }

    return html;
  };

  const activeQuestion = PRACTICE_QUESTIONS[currentQIndex];

  // Paginated verses list
  const verseEntries = Object.entries(surahVerses);
  const totalPages = Math.ceil(verseEntries.length / VERSES_PER_PAGE);
  const paginatedVerses = verseEntries.slice(
    (readerPage - 1) * VERSES_PER_PAGE,
    readerPage * VERSES_PER_PAGE
  );

  return (
    <div className="card shadow-sm" style={{ padding: '2rem', minHeight: '600px' }}>
      <h2 className="gradient-text" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        {getDual('tajwid.title')}
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '2rem', opacity: 0.8 }}>
        {getDual('tajwid.desc')}
      </p>

      {/* Main Split Grid layout: Left = Tajwid rules, Right = Actual Quran Reader page-by-page */}
      <div className="tajwid-grid" style={{ display: 'grid', gridTemplateColumns: '4.5fr 5.5fr', gap: '2rem', marginTop: '1.5rem' }}>
        
        {/* Left Column: Tajwid rules selector & Practice Game (stacked) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Rules Category Selector */}
          <div className="tajwid-guide-panel" style={{ background: 'var(--bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.4rem', color: 'var(--primary)' }}>
              🕌 {getDual('tajwid.rulesTitle')}
            </h3>

            {/* Main Tabs */}
            <div className="rules-tabs" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {TAJWID_RULES.map(rule => (
                <button
                  key={rule.id}
                  onClick={() => setSelectedRule(rule)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.8rem',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    background: selectedRule.id === rule.id ? 'var(--primary)' : 'var(--bg-card)',
                    color: selectedRule.id === rule.id ? '#fff' : 'var(--text-primary)'
                  }}
                >
                  {rule.nameAr}
                </button>
              ))}
            </div>

            <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1rem', direction: 'rtl', textAlign: 'right' }}>
              {selectedRule.descAr}
            </p>

            {/* Sub-rules list */}
            <div className="sub-rules-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {selectedRule.subRules.map(sub => (
                <div
                  key={sub.nameAr}
                  onClick={() => setSelectedSubRule(sub)}
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: selectedSubRule.nameAr === sub.nameAr ? 'rgba(var(--primary-rgb), 0.08)' : 'var(--bg-card)',
                    borderColor: selectedSubRule.nameAr === sub.nameAr ? 'var(--primary)' : 'var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>{sub.nameAr}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{sub.nameEn}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {sub.letters.map((lettr, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '0.1rem 0.4rem',
                          fontSize: '0.75rem',
                          borderRadius: '4px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          color: 'var(--primary)',
                          fontFamily: 'serif',
                          fontWeight: 'bold'
                        }}
                      >
                        {lettr}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tajwid Practice Challenge Game */}
          <div style={{ background: 'var(--bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', margin: 0 }}>
                💡 {getDual('tajwid.testTitle')}
              </h3>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, background: 'var(--primary)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                SCORE: {score}
              </span>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>ما هي قاعدة التجويد في الكلمة التالية؟</p>
              <div className="quranic-text" style={{ fontSize: '2.2rem', color: 'var(--primary)', margin: '1rem 0', fontFamily: 'serif' }}>
                {activeQuestion.text}
              </div>

              {/* Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '1.2rem' }}>
                {activeQuestion.options.map((opt, idx) => {
                  let btnBg = 'var(--bg-card)';
                  let btnColor = 'var(--text-primary)';
                  let btnBorder = 'var(--border)';

                  if (selectedOption !== null) {
                    if (idx === activeQuestion.correctIdx) {
                      btnBg = 'rgba(76, 175, 80, 0.2)';
                      btnBorder = '#4caf50';
                      btnColor = '#4caf50';
                    } else if (idx === selectedOption) {
                      btnBg = 'rgba(244, 67, 54, 0.2)';
                      btnBorder = '#f44336';
                      btnColor = '#f44336';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedOption !== null}
                      style={{
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: btnBorder,
                        background: btnBg,
                        color: btnColor,
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: selectedOption === null ? 'pointer' : 'default',
                        transition: 'all 0.15s'
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {showExplanation && (
                <div style={{ marginTop: '1.2rem', padding: '0.8rem', borderRadius: '6px', background: 'var(--bg-card)', borderLeft: '3px solid var(--primary)', textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: selectedOption === activeQuestion.correctIdx ? '#4caf50' : '#f44336', marginBottom: '0.3rem' }}>
                    {selectedOption === activeQuestion.correctIdx ? '✨ صحيح! ما شاء الله.' : 'الحكم الصحيح هو: ' + activeQuestion.options[activeQuestion.correctIdx]}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                    {activeQuestion.explanation}
                  </p>
                  <button
                    onClick={handleNextQuestion}
                    style={{
                      marginTop: '0.8rem',
                      padding: '0.4rem 1rem',
                      borderRadius: '4px',
                      background: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    السؤال التالي / Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Actual Quran Reader page-by-page */}
        <div style={{ background: 'var(--bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          
          {/* Reader Top Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.8rem', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', margin: 0 }}>
              📖 مصحف التلاوة / Quran Reader
            </h3>
            
            {/* Surah Dropdown selector */}
            <select
              value={selectedSurah}
              onChange={(e) => setSelectedSurah(Number(e.target.value))}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              {SURAH_NAMES.map((name, idx) => {
                if (idx === 0) return null;
                return (
                  <option key={idx} value={idx}>
                    {idx}. {name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Active Highlight Info Indicator */}
          <div style={{ fontSize: '0.75rem', background: 'var(--bg-card)', padding: '0.6rem 1rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRight: `3px solid ${selectedSubRule.color || 'var(--primary)'}` }}>
            <span>Active rule highlight: <strong>{selectedSubRule.nameAr}</strong></span>
            <span style={{ height: '10px', width: '10px', borderRadius: '50%', background: selectedSubRule.color || 'var(--primary)' }}></span>
          </div>

          {/* Reconstructed Mushaf page */}
          <div style={{ flexGrow: 1, minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {loadingSurah ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', opacity: 0.7 }}>
                <div className="mini-spinner" style={{ margin: 'auto', marginBottom: '1rem' }}></div>
                <span>جاري تحميل السورة... / Loading...</span>
              </div>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                {/* Bismillah Header (show for all surahs except At-Tawbah 9, and only on page 1) */}
                {selectedSurah !== 9 && readerPage === 1 && (
                  <div className="quranic-text" style={{ fontSize: '1.6rem', color: 'var(--primary)', marginBottom: '1.5rem', opacity: 0.85 }}>
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                )}

                {/* Verses Text Block */}
                <div style={{ direction: 'rtl', lineHeight: '2.5', fontSize: '1.7rem', color: 'var(--text-primary)', textAlign: 'center' }}>
                  {paginatedVerses.map(([ayaNum, text]) => {
                    const highlighted = getHighlightedText(text, selectedSubRule.id);
                    return (
                      <span key={ayaNum} style={{ margin: '0 0.4rem', wordBreak: 'keep-all', display: 'inline' }}>
                        <span dangerouslySetInnerHTML={{ __html: highlighted }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold', margin: '0 0.3rem', whiteSpace: 'nowrap', userSelect: 'none' }}>
                          ﴿{ayaNum}﴾
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setReaderPage(p => Math.min(totalPages, p + 1))}
                disabled={readerPage === totalPages}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  cursor: readerPage === totalPages ? 'default' : 'pointer',
                  opacity: readerPage === totalPages ? 0.4 : 1
                }}
              >
                ◀ الصفحة التالية / Next
              </button>
              
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', opacity: 0.8 }}>
                صفحة {readerPage} من {totalPages}
              </span>

              <button
                onClick={() => setReaderPage(p => Math.max(1, p - 1))}
                disabled={readerPage === 1}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  cursor: readerPage === 1 ? 'default' : 'pointer',
                  opacity: readerPage === 1 ? 0.4 : 1
                }}
              >
                الصفحة السابقة / Prev ▶
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
