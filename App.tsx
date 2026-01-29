
import React, { useState, useCallback, useRef } from 'react';
import { MindMapNode, MindMapLink } from './types';
import { fetchRelatedWords } from './services/geminiService';
import GraphView from './components/GraphView';

const App: React.FC = () => {
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [links, setLinks] = useState<MindMapLink[]>([]);
  const [initialWord, setInitialWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const expandedNodesRef = useRef<Set<string>>(new Set());

  const handleStartGame = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!initialWord.trim()) return;

    setIsLoading(true);
    expandedNodesRef.current.clear();
    const related = await fetchRelatedWords(initialWord);
    
    const rootNode: MindMapNode = {
      id: initialWord.toLowerCase(),
      label: initialWord,
      depth: 0
    };

    const newNodes: MindMapNode[] = [rootNode];
    const newLinks: MindMapLink[] = [];

    related.forEach((word) => {
      const newNode: MindMapNode = {
        id: word.toLowerCase() + '-' + Math.random().toString(36).substr(2, 4),
        label: word,
        depth: 1,
        parentId: rootNode.id
      };
      newNodes.push(newNode);
      newLinks.push({ source: rootNode.id, target: newNode.id });
    });

    setNodes(newNodes);
    setLinks(newLinks);
    setHistory([initialWord]);
    expandedNodesRef.current.add(rootNode.id);
    setIsLoading(false);
    setInitialWord('');
  };

  const expandNode = useCallback(async (clickedNode: MindMapNode) => {
    if (isLoading || expandedNodesRef.current.has(clickedNode.id)) return;

    setIsLoading(true);
    const related = await fetchRelatedWords(clickedNode.label);
    
    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      const newLinks: MindMapLink[] = [];

      related.forEach(word => {
        // Prevent obvious direct cycles if word is already a parent/sibling of the same label
        const nodeID = `${word.toLowerCase()}-${Math.random().toString(36).substr(2, 4)}`;
        const newNode: MindMapNode = {
          id: nodeID,
          label: word,
          depth: clickedNode.depth + 1,
          parentId: clickedNode.id,
          // Start near parent for smoother animation
          x: clickedNode.x! + (Math.random() - 0.5) * 50,
          y: clickedNode.y! + (Math.random() - 0.5) * 50
        };
        newNodes.push(newNode);
        newLinks.push({ source: clickedNode.id, target: newNode.id });
      });

      setLinks(prevLinks => [...prevLinks, ...newLinks]);
      return newNodes;
    });

    setHistory(prev => [...prev, clickedNode.label]);
    expandedNodesRef.current.add(clickedNode.id);
    setIsLoading(false);
  }, [isLoading]);

  const resetGame = () => {
    setNodes([]);
    setLinks([]);
    setHistory([]);
    expandedNodesRef.current.clear();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <i className="fa-solid fa-network-wired text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Mind Map Explorer</h1>
            <p className="text-xs text-slate-400">Discover context with Gemini AI</p>
          </div>
        </div>

        {nodes.length > 0 && (
          <button 
            onClick={resetGame}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <i className="fa-solid fa-rotate-right mr-2"></i>
            Reset Map
          </button>
        )}
      </header>

      <div className="flex-1 flex relative overflow-hidden">
        {/* Main Canvas Area */}
        <main className="flex-1 relative">
          <GraphView 
            nodes={nodes} 
            links={links} 
            onNodeClick={expandNode} 
            isLoading={isLoading} 
          />
        </main>

        {/* Floating Sidebar (Right) */}
        <aside className="absolute right-6 top-6 bottom-6 w-80 pointer-events-none flex flex-col gap-4">
          {/* Start New Card */}
          <div className="bg-slate-900/90 backdrop-blur-lg border border-slate-800 p-6 rounded-2xl shadow-2xl pointer-events-auto">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-seedling text-green-400"></i>
              {nodes.length === 0 ? "Start Your Journey" : "New Search"}
            </h2>
            <form onSubmit={handleStartGame} className="space-y-3">
              <div className="relative">
                <input 
                  type="text" 
                  value={initialWord}
                  onChange={(e) => setInitialWord(e.target.value)}
                  placeholder="e.g. Quantum Physics..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-100"
                />
              </div>
              <button 
                disabled={isLoading || !initialWord.trim()}
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2"
              >
                {isLoading && <i className="fa-solid fa-circle-notch animate-spin"></i>}
                Generate Map
              </button>
            </form>
          </div>

          {/* History / Path Card */}
          {history.length > 0 && (
            <div className="flex-1 bg-slate-900/90 backdrop-blur-lg border border-slate-800 p-6 rounded-2xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="fa-solid fa-shoe-prints"></i>
                Your Path
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <ul className="space-y-4">
                  {history.map((word, idx) => (
                    <li key={idx} className="relative pl-6">
                      {idx < history.length - 1 && (
                        <div className="absolute left-1 top-4 bottom-[-16px] w-0.5 bg-slate-700"></div>
                      )}
                      <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-400"></div>
                      <span className="text-sm font-medium text-slate-200">{word}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </aside>

        {/* Bottom Instructions Overlay */}
        {nodes.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur border border-slate-700/50 px-6 py-3 rounded-full shadow-lg z-20 pointer-events-none">
            <p className="text-sm text-slate-300 flex items-center gap-4">
              <span><span className="text-blue-400 font-bold">Click</span> a word to expand</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span><span className="text-blue-400 font-bold">Drag</span> to move nodes</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span><span className="text-blue-400 font-bold">Scroll</span> to zoom</span>
            </p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
};

export default App;
