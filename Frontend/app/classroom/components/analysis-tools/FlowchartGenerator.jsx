'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GitBranch, Download, Zap, FileText, Settings, AlertCircle } from 'lucide-react';
import { ReactFlow, Background, Controls, MiniMap, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const FlowchartGeneratorInner = ({ code, language }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rfNodes, setRfNodes] = useState([]);
  const [rfEdges, setRfEdges] = useState([]);
  const cacheLoadedRef = useRef(false);

  // Load cached data
  useEffect(() => {
    if (cacheLoadedRef.current) return;
    try {
      const cached = localStorage.getItem('flowchartData');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.nodes && parsed.edges) {
          setRfNodes(parsed.nodes);
          setRfEdges(parsed.edges);
        }
      }
    } catch (e) {
      console.warn('Failed to load cached flowchart:', e);
    } finally {
      cacheLoadedRef.current = true;
    }
  }, []);

  // Generate flowchart using AI
  const generateFlowchartWithAI = async (code, language) => {
    if (!code) return null;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/code-analysis/generate-flowchart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate flowchart');
      }
      return data.flowchartData;
    } catch (error) {
      console.error('Error generating flowchart:', error);
      throw error;
    }
  };

  // Normalize flow data
  const normalizeFlowData = (flowData) => {
    if (!flowData) return { nodes: [], edges: [] };
    const nodes = Array.isArray(flowData.nodes) ? flowData.nodes.slice() : [];
    const edges = Array.isArray(flowData.edges) ? flowData.edges.slice() : [];

    nodes.forEach((n, idx) => {
      if (!n.id) n.id = `n_${idx}`;
      const type = (n.type || '').toString().toLowerCase();
      
      // Custom node styling based on type
      const getNodeStyle = (type) => {
        const baseStyle = {
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          border: '2px solid',
          minWidth: '150px',
          textAlign: 'center'
        };
        
        switch(type) {
          case 'start':
          case 'end':
            return { ...baseStyle, background: '#8B5CF6', color: 'white', borderColor: '#7C3AED', borderRadius: '50px' };
          case 'decision':
            return { ...baseStyle, background: '#FBBF24', color: '#78350F', borderColor: '#F59E0B' };
          case 'input':
          case 'output':
            return { ...baseStyle, background: '#3B82F6', color: 'white', borderColor: '#2563EB' };
          default:
            return { ...baseStyle, background: '#10B981', color: 'white', borderColor: '#059669' };
        }
      };

      n.data = { label: n.content || n.label || n.data?.label || 'Step' };
      n.style = getNodeStyle(type);
      n.type = 'default';

      if (!n.position || typeof n.position.x !== 'number') {
        n.position = { x: 250, y: idx * 140 };
      }
    });

    const nodeIdSet = new Set(nodes.map(n => n.id));
    const normalizedEdges = [];
    
    edges.forEach((e, idx) => {
      const source = e.source || e.from;
      const target = e.target || e.to;
      if (!source || !target || !nodeIdSet.has(source) || !nodeIdSet.has(target)) return;
      
      normalizedEdges.push({
        id: e.id || `e${idx}-${source}-${target}`,
        source,
        target,
        label: e.label || '',
        animated: e.animated || false,
        style: { stroke: '#00BCD4', strokeWidth: 2 }
      });
    });

    return { nodes, edges: normalizedEdges };
  };

  const generateFlowchart = async () => {
    if (!code) return;
    setLoading(true);
    setError(null);

    try {
      const flowData = await generateFlowchartWithAI(code, language);
      if (flowData && flowData.nodes && flowData.edges) {
        const normalized = normalizeFlowData(flowData);
        setRfNodes(normalized.nodes);
        setRfEdges(normalized.edges);
        localStorage.setItem('flowchartData', JSON.stringify(normalized));
      } else {
        throw new Error('Invalid flowchart data');
      }
    } catch (error) {
      console.error('Error generating flowchart:', error);
      setError(error.message || 'Failed to generate flowchart');
      
      // Fallback flowchart
      const defaultNodes = [
        { id: '1', data: { label: 'Start' }, position: { x: 250, y: 0 }, style: { background: '#8B5CF6', color: 'white', padding: '12px 20px', borderRadius: '50px' } },
        { id: '2', data: { label: 'Process Code' }, position: { x: 250, y: 100 }, style: { background: '#10B981', color: 'white', padding: '12px 20px', borderRadius: '8px' } },
        { id: '3', data: { label: 'End' }, position: { x: 250, y: 200 }, style: { background: '#8B5CF6', color: 'white', padding: '12px 20px', borderRadius: '50px' } },
      ];
      const defaultEdges = [
        { id: 'e1-2', source: '1', target: '2', style: { stroke: '#00BCD4', strokeWidth: 2 } },
        { id: 'e2-3', source: '2', target: '3', style: { stroke: '#00BCD4', strokeWidth: 2 } },
      ];
      setRfNodes(defaultNodes);
      setRfEdges(defaultEdges);
    } finally {
      setLoading(false);
    }
  };

  const downloadFlowchart = () => {
    const data = JSON.stringify({ nodes: rfNodes, edges: rfEdges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowchart.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (code) {
      const timer = setTimeout(() => generateFlowchart(), 2500);
      return () => clearTimeout(timer);
    }
  }, [code, language]);

  return (
    <div className="bg-gray-900 text-gray-100 p-6 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Flowchart Generator</h3>
            <p className="text-sm text-gray-400">Visualize code logic flow</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {rfNodes.length > 0 && (
            <button onClick={downloadFlowchart} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
          <button onClick={generateFlowchart} disabled={loading || !code} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-400">Analyzing code structure...</p>
          </div>
        </div>
      )}

      {/* Flowchart Display */}
      {!loading && rfNodes.length > 0 && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Total Nodes</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{rfNodes.length}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Connections</span>
              </div>
              <div className="text-2xl font-bold text-green-400">{rfEdges.length}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">Complexity</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {rfNodes.filter(n => n.type === 'decision').length > 2 ? 'High' : 
                 rfNodes.filter(n => n.type === 'decision').length > 0 ? 'Medium' : 'Low'}
              </div>
            </div>
          </div>

          {/* ReactFlow Canvas */}
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden" style={{ height: '500px' }}>
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodesChange={(changes) => {
                setRfNodes(nds => {
                  const updated = [...nds];
                  changes.forEach(change => {
                    if (change.type === 'position' && change.position) {
                      const node = updated.find(n => n.id === change.id);
                      if (node) node.position = change.position;
                    }
                  });
                  return updated;
                });
              }}
              onEdgesChange={(changes) => {
                setRfEdges(eds => eds.filter(e => !changes.find(c => c.type === 'remove' && c.id === e.id)));
              }}
              fitView
              minZoom={0.5}
              maxZoom={1.5}
            >
              <Background color="#aaa" gap={16} />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <h4 className="text-red-400 font-semibold">Error</h4>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && rfNodes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h4 className="text-lg font-medium mb-2 text-gray-300">No Flowchart Generated</h4>
          <p className="text-sm mb-6">Write some code to generate a flowchart</p>
          <button onClick={generateFlowchart} disabled={!code} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto">
            <GitBranch className="w-4 h-4" />
            Generate Flowchart
          </button>
        </div>
      )}
    </div>
  );
};

const FlowchartGenerator = (props) => {
  return (
    <ReactFlowProvider>
      <FlowchartGeneratorInner {...props} />
    </ReactFlowProvider>
  );
};

export default FlowchartGenerator;