'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SURAH_NAMES } from '@/lib/arabic-utils';

export default function SemanticMap() {
    const svgRef = useRef(null);
    const [data, setData] = useState([]);
    const [sura, setSura] = useState(0);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter(item =>
        item.root.includes(searchTerm) ||
        item.samples.some(s => `${s.sura}:${s.aya}`.includes(searchTerm))
    );

    useEffect(() => {
        setLoading(true);
        const url = sura > 0 ? `/api/roots?sura=${sura}` : '/api/roots';
        fetch(url)
            .then(res => res.json())
            .then(json => {
                setData(json);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [sura]);

    useEffect(() => {
        if (viewMode !== 'graph' || filteredData.length === 0 || !svgRef.current) {
            if (svgRef.current) d3.select(svgRef.current).selectAll("*").remove();
            return;
        }

        const width = 800;
        const height = 400;
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const simulation = d3.forceSimulation(filteredData)
            .force("charge", d3.forceManyBody().strength(-100))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius((d) => Math.sqrt(d.count) * 2 + 10))
            .force("x", d3.forceX(width / 2).strength(0.1))
            .force("y", d3.forceY(height / 2).strength(0.1));

        const drag = (simulation) => {
            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        };

        const nodes = svg.append("g")
            .selectAll("g")
            .data(filteredData)
            .enter()
            .append("g")
            .call(drag(simulation));

        nodes.append("circle")
            .attr("r", d => Math.sqrt(d.count) * 2 + 8)
            .attr("fill", () => d3.interpolateGnBu(0.5 + Math.random() * 0.5))
            .attr("opacity", 0.9)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("cursor", "grab");

        nodes.append("text")
            .text(d => d.root)
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .attr("fill", "#000")
            .attr("font-weight", "700")
            .attr("font-size", d => Math.min(Math.sqrt(d.count) + 12, 24))
            .style("pointer-events", "none");

        simulation.on("tick", () => {
            nodes.attr("transform", (d) => `translate(${d.x},${d.y})`);
        });

        return () => simulation.stop();
    }, [filteredData, viewMode]);

    return (
        <div className="semantic-map-container card">
            <div className="map-header">
                <div>
                    <h3 className="gradient-text">Vocabulary Distribution</h3>
                    <p className="subtitle">Visualizing the most recurring roots</p>
                </div>
                <div className="controls-group">
                    <div className="view-toggle">
                        <button
                            className={viewMode === 'grid' ? 'active' : ''}
                            onClick={() => setViewMode('grid')}
                        >Grid View</button>
                        <button
                            className={viewMode === 'graph' ? 'active' : ''}
                            onClick={() => setViewMode('graph')}
                        >Graph View</button>
                    </div>
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search roots or sura:aya..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="sura-selector">
                        <select
                            value={sura}
                            onChange={(e) => setSura(parseInt(e.target.value))}
                            className="custom-select"
                        >
                            <option value={0}>All Quran (القرآن كامل)</option>
                            {SURAH_NAMES.map((name, i) => i > 0 && (
                                <option key={i} value={i}>{i}. {name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className={`map-canvas-wrapper ${loading ? 'loading' : ''}`}>
                {loading && (
                    <div className="map-loading-overlay">
                        <div className="loader small"></div>
                    </div>
                )}

                {viewMode === 'graph' ? (
                    <svg ref={svgRef} width="100%" height="400" viewBox="0 0 800 400"></svg>
                ) : (
                    <div className="root-grid rtl">
                        {filteredData.map((item, idx) => (
                            <div key={idx} className={`root-card ${idx < 5 ? 'top-ranked' : ''}`} onClick={() => console.log('Selected Root:', item.root)}>
                                <div className="root-rank">#{idx + 1}</div>
                                <div className="root-top">
                                    <span className="root-arabic quranic-text">{item.root}</span>
                                    <span className="root-count">{item.count}</span>
                                </div>
                                <div className="root-samples">
                                    {item.samples.map((s, si) => (
                                        <span key={si} className="sample-tag">{s.sura}:{s.aya}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
        .semantic-map-container {
          background: white;
          padding: 2rem;
          margin-top: 1rem;
        }
        .map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }
        .controls-group {
            display: flex;
            align-items: center;
            gap: 1.5rem;
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
            background: white;
            color: var(--primary);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .search-box {
            position: relative;
        }
        .search-input {
            padding: 0.6rem 1rem;
            border-radius: 10px;
            border: 2px solid var(--border);
            outline: none;
            font-size: 0.95rem;
            color: var(--slate-dark);
            background: white;
            min-width: 200px;
            transition: border-color 0.2s;
        }
        .search-input:focus {
            border-color: var(--primary-light);
        }
        .custom-select {
          padding: 0.6rem 1rem;
          border-radius: 10px;
          border: 2px solid var(--border);
          outline: none;
          cursor: pointer;
          font-size: 0.95rem;
          color: var(--slate-dark);
          background: white;
          min-width: 180px;
        }
        .map-canvas-wrapper {
          position: relative;
          background: #fdfcf9;
          border-radius: 15px;
          border: 1px solid var(--border);
          overflow: hidden;
          min-height: 400px;
        }
        .map-loading-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.6);
          z-index: 10;
        }
        .root-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
            gap: 1.5rem;
            padding: 1.5rem;
            max-height: 500px;
            overflow-y: auto;
            direction: rtl;
        }
        .root-card {
            background: white;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.5rem 1rem 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
            transition: all 0.2s;
            position: relative;
            text-align: right;
            border-bottom: 3px solid transparent;
        }
        .root-card:hover {
            border-bottom-color: var(--primary-light);
            transform: translateY(-3px);
            box-shadow: 0 6px 15px rgba(0,0,0,0.06);
        }
        .root-rank {
            position: absolute;
            top: -10px;
            right: -10px;
            background: var(--primary);
            color: white;
            padding: 0.2rem 0.6rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 800;
            box-shadow: 0 4px 8px rgba(6, 95, 70, 0.2);
            z-index: 10;
        }
        .root-arabic {
            font-size: 1.6rem;
            color: var(--primary);
            font-weight: 700;
        }
        .root-count {
            font-size: 0.75rem;
            font-weight: 800;
            color: var(--accent);
            background: var(--slate-light);
            padding: 0.1rem 0.3rem;
            border-radius: 4px;
        }
        .root-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .root-samples {
            display: flex;
            flex-wrap: wrap;
            gap: 0.3rem;
        }
        .sample-tag {
            font-size: 0.65rem;
            color: var(--slate-dark);
            opacity: 0.6;
        }
        .sample-tag {
            font-size: 0.65rem;
            color: var(--slate-dark);
            opacity: 0.6;
        }
      `}</style>
        </div>
    );
}
