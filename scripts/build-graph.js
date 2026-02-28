const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../data/processed/quran-data.json');
const OUTPUT_FILE = path.join(__dirname, '../data/processed/knowledge-graph.json');

function buildGraph() {
    console.log('Generating Knowledge Graph...');
    const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

    // Nodes: { id, type, label, metadata }
    // Edges: { source, target, type, weight }
    const nodes = [];
    const edges = [];
    const nodeSet = new Set();

    function addNode(id, type, label, metadata = {}) {
        if (!nodeSet.has(id)) {
            nodes.push({ id, type, label, metadata });
            nodeSet.add(id);
        }
    }

    function addEdge(source, target, type, weight = 1) {
        edges.push({ source, target, type, weight });
    }

    // 1. Process Roots
    Object.keys(data.roots).forEach(root => {
        addNode(`root:${root}`, 'root', root);
    });

    // 2. Process Verses and Connections
    Object.entries(data.quran).forEach(([suraId, ayas]) => {
        Object.entries(ayas).forEach(([ayaId, words]) => {
            const verseId = `verse:${suraId}:${ayaId}`;
            addNode(verseId, 'verse', `${suraId}:${ayaId}`);

            Object.entries(words).forEach(([wordIdx, wordData]) => {
                const root = wordData.segments.find(s => s.features.ROOT)?.features.ROOT;
                if (root) {
                    addEdge(verseId, `root:${root}`, 'contains_root');
                }
            });
        });
    });

    // 3. (Future) Add Themes and connect to Verses

    const graph = { nodes, edges };
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(graph, null, 2));
    console.log(`Knowledge Graph generated with ${nodes.length} nodes and ${edges.length} edges.`);
}

buildGraph();
