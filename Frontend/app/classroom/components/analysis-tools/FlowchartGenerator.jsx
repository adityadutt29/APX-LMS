'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GitBranch, Download, Zap, FileText, Settings, AlertCircle } from 'lucide-react';

const FlowchartGenerator = ({ code, language }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  // Add ref to track if cached data has been loaded
  const cacheLoadedRef = useRef(false);

  // Load cached data on component mount
  useEffect(() => {
    if (cacheLoadedRef.current) return;
    
    try {
      const cached = localStorage.getItem('flowchartData');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.nodes && parsed.edges) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          console.log('Loaded cached flowchart data:', parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load cached flowchart data:', e);
    } finally {
      cacheLoadedRef.current = true;
    }
  }, []);

  // Generate flowchart using AI (Cerebras)
  const generateFlowchartWithAI = async (code, language) => {
    if (!code) return null;

    try {
  const response = await fetch('http://localhost:5001/api/code-analysis/generate-flowchart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  // Generate Mermaid syntax
  const generateMermaidSyntax = (nodes, edges) => {
    if (!nodes || nodes.length === 0) return '';

    let mermaid = 'graph TD\n';
    
    // Add nodes
    nodes.forEach(node => {
      let shape = '';
      const label = node.data.label;
      switch (node.type) {
        case 'startEnd':
          shape = `((${label}))`;
          break;
        case 'decision':
          shape = `{${label}}`;
          break;
        case 'inputOutput':
          shape = `[/${label}/]`;
          break;
        case 'process':
        default:
          shape = `[${label}]`;
      }
      mermaid += `    ${node.id}${shape}\n`;
    });

    // Add connections
    edges.forEach(edge => {
      const connection = edge.label ? 
        `${edge.source} -->|${edge.label}| ${edge.target}` :
        `${edge.source} --> ${edge.target}`;
      mermaid += `    ${connection}\n`;
    });

    return mermaid;
  };

  // Generate visual flowchart
  const generateVisualFlowchart = (flowData) => {
    if (!flowData) return null;

    // Calculate dynamic height based on number of nodes
    const nodeHeight = 100;
    const svgHeight = Math.max(600, flowData.nodes.length * nodeHeight + 200);

    return (
      <div className="space-y-4 p-6">
        <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-lg">
          <svg
            width="100%"
            height={svgHeight}
            viewBox={`0 0 800 ${svgHeight}`}
            className="rounded-lg"
          >
            {/* Background */}
            <rect width="800" height={svgHeight} fill="#ffffff" />
            
            {/* Render nodes */}
            {flowData.nodes.map((node, index) => {
              const x = 400;
              const y = 80 + index * nodeHeight;
              const nextY = 80 + (index + 1) * nodeHeight;
              
              return (
                <g key={node.id}>
                  {/* Node shape based on type */}
                  {node.type === 'start' || node.type === 'end' ? (
                    // Oval shape for start/end
                    <>
                      <ellipse
                        cx={x}
                        cy={y}
                        rx="100"
                        ry="35"
                        fill="#8B5CF6"
                        stroke="#8B5CF6"
                        strokeWidth="2"
                      />
                      <text
                        x={x}
                        y={y + 6}
                        textAnchor="middle"
                        fill="white"
                        fontSize="16"
                        fontWeight="600"
                        fontFamily="Arial, sans-serif"
                      >
                        {node.type === 'start' ? 'Start' : 'Stop'}
                      </text>
                    </>
                  ) : node.type === 'decision' ? (
                    // Diamond shape for decisions
                    <>
                      <polygon
                        points={`${x-80},${y} ${x},${y-40} ${x+80},${y} ${x},${y+40}`}
                        fill="#8B5CF6"
                        stroke="#8B5CF6"
                        strokeWidth="2"
                      />
                      <text
                        x={x}
                        y={y-10}
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="600"
                        fontFamily="Arial, sans-serif"
                      >
                        {node.content.length > 20 ? node.content.substring(0, 18) + '...' : node.content}
                      </text>
                      <text
                        x={x}
                        y={y+8}
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="600"
                        fontFamily="Arial, sans-serif"
                      >
                        ?
                      </text>
                      
                      {/* True/False labels for decision nodes */}
                      {index < flowData.nodes.length - 1 && (
                        <>
                          <text
                            x={x + 90}
                            y={y + nodeHeight/2 - 10}
                            fill="#10B981"
                            fontSize="14"
                            fontWeight="600"
                            fontFamily="Arial, sans-serif"
                          >
                            True
                          </text>
                          <text
                            x={x - 90}
                            y={y + nodeHeight/2 - 10}
                            fill="#EF4444"
                            fontSize="14"
                            fontWeight="600"
                            fontFamily="Arial, sans-serif"
                          >
                            False
                          </text>
                        </>
                      )}
                    </>
                  ) : node.type === 'input' || node.type === 'output' ? (
                    // Parallelogram for input/output
                    <>
                      <polygon
                        points={`${x-80},${y-25} ${x+60},${y-25} ${x+80},${y+25} ${x-60},${y+25}`}
                        fill="#8B5CF6"
                        stroke="#8B5CF6"
                        strokeWidth="2"
                      />
                      <text
                        x={x}
                        y={y + 6}
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="600"
                        fontFamily="Arial, sans-serif"
                      >
                        {node.content.length > 25 ? node.content.substring(0, 23) + '...' : node.content}
                      </text>
                    </>
                  ) : (
                    // Rectangle for process
                    <>
                      <rect
                        x={x-90}
                        y={y-25}
                        width="180"
                        height="50"
                        fill="#8B5CF6"
                        stroke="#8B5CF6"
                        strokeWidth="2"
                        rx="8"
                      />
                      <text
                        x={x}
                        y={y + 6}
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="600"
                        fontFamily="Arial, sans-serif"
                      >
                        {node.content.length > 25 ? node.content.substring(0, 23) + '...' : node.content}
                      </text>
                    </>
                  )}
                  
                  {/* Connection arrows */}
                  {index < flowData.nodes.length - 1 && (
                    <>
                      <line
                        x1={x}
                        y1={node.type === 'decision' ? y + 40 : y + (node.type === 'start' || node.type === 'end' ? 35 : 25)}
                        x2={x}
                        y2={nextY - (flowData.nodes[index + 1].type === 'decision' ? 40 : 
                                   (flowData.nodes[index + 1].type === 'start' || flowData.nodes[index + 1].type === 'end' ? 35 : 25))}
                        stroke="#00BCD4"
                        strokeWidth="3"
                        markerEnd="url(#arrowhead)"
                      />
                    </>
                  )}
                </g>
              );
            })}
            
            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="12"
                markerHeight="10"
                refX="11"
                refY="5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon
                  points="0 0, 12 5, 0 10"
                  fill="#00BCD4"
                  stroke="#00BCD4"
                />
              </marker>
            </defs>
          </svg>
        </div>
      </div>
    );
  };

  // Normalize AI flow data to ensure React Flow compatibility
  const normalizeFlowData = (flowData) => {
    if (!flowData) return null;

    const nodes = Array.isArray(flowData.nodes) ? flowData.nodes.slice() : [];
    const edges = Array.isArray(flowData.edges) ? flowData.edges.slice() : [];

    // Ensure each node has an id, type, data and position
    nodes.forEach((n, idx) => {
      if (!n.id) n.id = `n_${idx}`;
      // map common type names from AI to our React Flow node types
      const type = (n.type || '').toString().toLowerCase();
      if (['start', 'end', 'startend', 'start_end', 'input'].includes(type)) n.type = 'input';
      else if (['output', 'io', 'inputoutput', 'input_output'].includes(type)) n.type = 'output';
      else n.type = 'default';

      if (!n.data) n.data = { label: (n.label || n.data?.label || n.content || 'Step') };
      else n.data.label = n.data.label || n.label || n.content || 'Step';

      // assign a sensible position if missing
      if (!n.position || typeof n.position.x !== 'number' || typeof n.position.y !== 'number') {
        n.position = { x: 250 + (idx % 2 === 0 ? -100 : 100), y: idx * 140 };
      }
    });

    const nodeIdSet = new Set(nodes.map(n => n.id));

    // Normalize and filter edges
    const normalizedEdges = [];
    edges.forEach((e, idx) => {
      const source = e.source || e.from || e.src || null;
      const target = e.target || e.to || e.dst || null;

      if (!source || !target) return; // skip invalid
      if (!nodeIdSet.has(source) || !nodeIdSet.has(target)) return; // skip if nodes missing

      const edge = {
        id: e.id || `e${idx}-${source}-${target}`,
        source,
        target,
      };

      // optional props
      if (e.label) edge.label = e.label;
      if (typeof e.animated === 'boolean') edge.animated = e.animated;

      normalizedEdges.push(edge);
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
        setNodes(normalized.nodes);
        setEdges(normalized.edges);
        
        // Store in localStorage for later use/debugging
        try {
          localStorage.setItem('flowchartData', JSON.stringify(normalized));
          console.log('Flowchart data cached:', normalized);
        } catch (e) {
          console.warn('Failed to cache flowchart data:', e);
        }
      } else {
        throw new Error('Invalid flowchart data received');
      }
    } catch (error) {
      console.error('Error generating flowchart:', error);
      setError(error.message || 'Failed to generate flowchart');
      // Fallback to a default flowchart
      const defaultNodes = [
        { id: '1', type: 'input', data: { label: 'Start' }, position: { x: 250, y: 0 } },
        { id: '2', type: 'default', data: { label: 'Process Code' }, position: { x: 250, y: 100 } },
        { id: '3', type: 'output', data: { label: 'End' }, position: { x: 250, y: 200 } },
      ];
      const defaultEdges = [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
      ];
      setNodes(defaultNodes);
      setEdges(defaultEdges);
    } finally {
      setLoading(false);
    }
  };

  const downloadFlowchart = () => {
    if (!nodes || nodes.length === 0) return;

    const mermaidSyntax = generateMermaidSyntax(nodes, edges);
    const blob = new Blob([mermaidSyntax], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowchart.mmd';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (code) {
      const timer = setTimeout(() => {
        generateFlowchart();
      }, 2500); // Auto-generate after 2.5 seconds of no changes
      
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
          {nodes.length > 0 && (
            <button
              onClick={downloadFlowchart}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg 
                         transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
          
          <button
            onClick={generateFlowchart}
            disabled={loading || !code}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                       text-white rounded-lg transition-colors flex items-center gap-2"
          >
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
            <div className="text-center">
              <p className="text-gray-400">Analyzing code structure...</p>
              <p className="text-sm text-gray-500">Generating flowchart diagram</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && nodes.length > 0 && (
        <div className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Total Nodes</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{nodes.length}</div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Connections</span>
              </div>
              <div className="text-2xl font-bold text-green-400">{edges.length}</div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">Complexity</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {nodes.filter(n => n.type === 'decision').length > 2 ? 'High' : 
                 nodes.filter(n => n.type === 'decision').length > 0 ? 'Medium' : 'Low'}
              </div>
            </div>
          </div>

          {/* Flowchart Display */}
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-lg">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
              <span className="text-sm font-medium text-gray-700">
                Mermaid Diagram Code
              </span>
            </div>
            <div className="p-0">
              <pre className="bg-gray-900 p-4 rounded border border-gray-600 overflow-auto text-sm font-mono text-gray-300">
                {(() => {
                  if (!nodes || nodes.length === 0) return '';
                  let mermaid = 'graph TD\n';
                  nodes.forEach(node => {
                    mermaid += `    ${node.id}[${node.data.label}]\n`;
                  });
                  edges.forEach(edge => {
                    const connection = edge.label ? 
                      `${edge.source} -->|${edge.label}| ${edge.target}` :
                      `${edge.source} --> ${edge.target}`;
                    mermaid += `    ${connection}\n`;
                  });
                  return mermaid;
                })()}
              </pre>
            </div>
          </div>

          {/* Node Legend */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
            <h4 className="text-lg font-semibold text-gray-300 mb-4">Flowchart Legend</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">●</span>
                </div>
                <span className="text-gray-300 font-medium">Start/Stop (Oval)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 bg-purple-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">□</span>
                </div>
                <span className="text-gray-300 font-medium">Process (Rectangle)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 bg-purple-600 transform rotate-45 flex items-center justify-center">
                  <span className="text-white text-xs font-bold transform -rotate-45">◆</span>
                </div>
                <span className="text-gray-300 font-medium">Decision (Diamond)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 bg-purple-600 transform skew-x-12 flex items-center justify-center">
                  <span className="text-white text-xs font-bold transform -skew-x-12">▱</span>
                </div>
                <span className="text-gray-300 font-medium">Input/Output (Parallelogram)</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-cyan-400"></div>
                  <div className="w-0 h-0 border-l-2 border-l-cyan-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                </div>
                <span className="text-gray-300 font-medium">Flow Direction (Arrows)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-red-400 font-semibold">Error Generating Flowchart</h4>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={generateFlowchart}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && nodes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h4 className="text-lg font-medium mb-2 text-gray-300">No Flowchart Generated</h4>
          <p className="text-sm mb-6">Write some code with control structures (if, for, while) to generate a flowchart</p>
          
          {/* Sample Code Examples */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 max-w-2xl mx-auto mb-6">
            <h5 className="text-sm font-semibold text-gray-300 mb-4">Try this sample code:</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-left">
                <p className="text-xs text-purple-400 font-semibold mb-2">Python Example:</p>
                <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded border font-mono">
{`a = int(input())
b = int(input())
c = int(input())
if a > b:
    if a > c:
        print(a)
    else:
        print(c)
else:
    if b > c:
        print(b)
    else:
        print(c)`}
                </pre>
              </div>
              
              <div className="text-left">
                <p className="text-xs text-purple-400 font-semibold mb-2">C++ Example:</p>
                <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded border font-mono">
{`int a, b, c;
cin >> a >> b >> c;
if (a > b) {
    if (a > c) {
        cout << a;
    } else {
        cout << c;
    }
} else {
    if (b > c) {
        cout << b;
    } else {
        cout << c;
    }
}`}
                </pre>
              </div>
              
              <div className="text-left">
                <p className="text-xs text-purple-400 font-semibold mb-2">Java Example:</p>
                <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded border font-mono">
{`Scanner sc = new Scanner(System.in);
int a = sc.nextInt();
int b = sc.nextInt();
int c = sc.nextInt();
if (a > b) {
    if (a > c) {
        System.out.println(a);
    } else {
        System.out.println(c);
    }
} else {
    if (b > c) {
        System.out.println(b);
    } else {
        System.out.println(c);
    }
}`}
                </pre>
              </div>
            </div>
          </div>
          
          <button
            onClick={generateFlowchart}
            disabled={!code}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                       text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <GitBranch className="w-4 h-4" />
            Generate Flowchart
          </button>
        </div>
      )}
    </div>
  );
};

export default FlowchartGenerator;