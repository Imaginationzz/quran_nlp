'use client';

import React from 'react';
import WordExplorer from '@/components/WordExplorer';
import ConceptClusters from '@/components/ConceptClusters';
import VerseSimilarity from '@/components/VerseSimilarity';
import AdaptiveQuiz from '@/components/AdaptiveQuiz';
import SearchBar from '@/components/SearchBar';
import { translations, getDual } from '@/lib/translations';

export default function Home() {
    const t = translations;

    return (
        <main className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ textAlign: 'center', marginBottom: '2.5rem', padding: '2.5rem 0' }}>
                <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.8rem' }}>
                    {getDual('title')}
                </h1>
                <p style={{ fontSize: '1rem', color: 'var(--foreground)', opacity: 0.9, maxWidth: '800px', margin: '0 auto' }}>
                    {getDual('subtitle')}
                </p>
            </header>

            <section id="services" style={{ marginBottom: '4rem' }}>
                <div className="services-grid nav-portal">
                    <a href="#search" className="service-card shadow-sm">
                        <div className="icon">🛰️</div>
                        <h3>{getDual('search.title')}</h3>
                        <p>{getDual('search.desc')}</p>
                    </a>
                    <a href="#explorer" className="service-card shadow-sm">
                        <div className="icon">🧬</div>
                        <h3>{getDual('explorer.title')}</h3>
                        <p>{getDual('explorer.desc')}</p>
                    </a>
                    <a href="#similarity" className="service-card shadow-sm">
                        <div className="icon">🪞</div>
                        <h3>{getDual('similarity.title')}</h3>
                        <p>{getDual('similarity.desc')}</p>
                    </a>
                    <a href="#quiz" className="service-card shadow-sm">
                        <div className="icon">💡</div>
                        <h3>{getDual('quiz.title')}</h3>
                        <p>{getDual('quiz.desc')}</p>
                    </a>
                    <a href="#concept-clusters" className="service-card shadow-sm">
                        <div className="icon">🔗</div>
                        <h3>{getDual('concepts.title')}</h3>
                        <p>{getDual('concepts.desc')}</p>
                    </a>
                </div>
            </section>

            <div className="divider"></div>

            <section id="search" style={{ marginBottom: '3.5rem' }}>
                <SearchBar />
            </section>

            <section id="explorer" style={{ marginBottom: '3.5rem' }}>
                <WordExplorer />
            </section>

            <section id="similarity" style={{ marginBottom: '3.5rem' }}>
                <VerseSimilarity />
            </section>

            <section id="quiz" style={{ marginBottom: '3.5rem' }}>
                <AdaptiveQuiz />
            </section>

            <section id="concept-clusters" style={{ marginBottom: '3.5rem' }}>
                <div className="card" style={{ textAlign: 'center', minHeight: '500px' }}>
                    <div>
                        <h2 className="gradient-text" style={{ marginBottom: '1rem' }}>{getDual('concepts.title')}</h2>
                        <p style={{ marginBottom: '2rem' }}>{getDual('concepts.desc')}</p>
                        <ConceptClusters />
                    </div>
                </div>
            </section>

            <footer style={{ marginTop: '6rem', padding: '4rem', borderTop: '1px solid var(--border)', textAlign: 'center', opacity: 0.8 }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.2rem' }}>
                        Yazid Rahmouni | يزيد رحموني
                    </p>
                    <p style={{ fontSize: '0.85rem', opacity: 0.6, fontWeight: 600 }}>Author & Creator / مؤلف ومطوّر المنصة</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <p style={{ margin: 0, opacity: 0.7 }}>
                        &copy; {new Date().getFullYear()} Al-Bayan Portal. Dedicated to the deep exploration of the Divine Word.
                    </p>
                    <p style={{ margin: 0, opacity: 0.7, direction: 'rtl' }}>
                        © {new Date().getFullYear()} بوابة البيان. مكرس للتدبر العميق في جواهر آيات الذكر الحكيم.
                    </p>
                </div>
            </footer>
        </main>
    );
}
