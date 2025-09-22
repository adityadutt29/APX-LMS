'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const MermaidFlowchart = ({ nodes, edges }) => {
  const [error, setError] = useState(null);
  const [mermaid, setMermaid] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const elementRef = useRef(null);
  const renderTimeoutRef = useRef(null);

  useEffect(() => {
    // Dynamically import mermaid to avoid SSR issues
    import('mermaid').then((mermaidModule) => {
      const mermaidInstance = mermaidModule.default;
      
      // Initialize mermaid with more permissive configuration
      mermaidInstance.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: false,
          htmlLabels: false,
          curve: 'linear',
          padding: 10,
          nodeSpacing: 30,
          rankSpacing: 30
        },
        themeVariables: {
          primaryColor: '#8B5CF6',
          primaryTextColor: '#ffffff',
          primaryBorderColor: '#7C3AED',
          lineColor: '#00BCD4'
        }
      });
      
      setMermaid(mermaidInstance);
      setIsLoading(false);
    }).catch((err) => {
      console.error('Failed to load Mermaid:', err);
      setError('Failed to load Mermaid library');
      setIsLoading(false);
    });
  }, []);

  const renderChart = useCallback(async () => {
    if (!mermaid || !nodes || nodes.length === 0 || isLoading) {
      console.log('Skipping render:', { mermaid: !!mermaid, nodes: nodes?.length, isLoading });
      return;
    }

    try {
      setError(null);
      console.log('Starting render with nodes:', nodes, 'edges:', edges);
      
      // Generate simpler mermaid syntax
      let syntax = 'graph TD\n';
      
      // Validate and add nodes with proper formatting
      const validNodes = nodes.filter(node => node && node.id && node.data);
      if (validNodes.length === 0) {
        throw new Error('No valid nodes found');
      }

      // Create a mapping of original IDs to clean IDs
      const idMapping = {};
      
      validNodes.forEach((node, index) => {
        const label = (node.data?.label || 'Step').replace(/['"]/g, '').replace(/\n/g, ' ').trim();
        // Use simple sequential IDs
        const cleanNodeId = `N${index + 1}`;
        idMapping[node.id] = cleanNodeId;
        
        // Use simple rectangle notation for all nodes
        syntax += `    ${cleanNodeId}["${label}"]\n`;
      });

      // Add edges using mapped IDs
      const validEdges = edges?.filter(edge => edge && edge.source && edge.target) || [];
      validEdges.forEach((edge) => {
        const sourceId = idMapping[edge.source];
        const targetId = idMapping[edge.target];
        
        if (sourceId && targetId) {
          syntax += `    ${sourceId} --> ${targetId}\n`;
        }
      });

      console.log('Generated Mermaid syntax:', syntax);

      if (!elementRef.current) {
        console.error('Element ref is null');
        return;
      }

      // Clear previous content
      elementRef.current.innerHTML = '';
      
      // Create a unique ID for this render
      const chartId = `chart${Date.now()}`;
      
      try {
        // Render the chart with simpler approach
        const { svg } = await mermaid.render(chartId, syntax);
        
        if (!svg) {
          throw new Error('No SVG generated');
        }

        elementRef.current.innerHTML = svg;
        
        // Add some custom styling to the SVG
        const svgElement = elementRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.maxWidth = '100%';
          svgElement.style.height = 'auto';
          svgElement.style.background = '#ffffff';
          svgElement.style.display = 'block';
          svgElement.style.margin = '0 auto';
        }

        console.log('Mermaid chart rendered successfully');
        
      } catch (renderError) {
        console.error('Mermaid render error:', renderError);
        
        // Try with even simpler syntax
        const simpleSyntax = `graph TD\n    A[Start] --> B[Process] --> C[End]`;
        try {
          const { svg } = await mermaid.render(`simple${Date.now()}`, simpleSyntax);
          elementRef.current.innerHTML = svg;
          console.log('Fallback simple chart rendered');
        } catch (fallbackError) {
          throw new Error(`Both renders failed: ${renderError.message}`);
        }
      }
      
    } catch (err) {
      console.error('Mermaid rendering error:', err);
      setError(`Error rendering flowchart: ${err.message}`);
      
      // Enhanced fallback with visual flowchart
      if (elementRef.current) {
        const fallbackSvg = `
          <svg width="400" height="${nodes.length * 80 + 100}" viewBox="0 0 400 ${nodes.length * 80 + 100}" xmlns="http://www.w3.org/2000/svg">
            <style>
              .node-rect { fill: #8B5CF6; stroke: #7C3AED; stroke-width: 2; }
              .node-text { fill: white; font-family: Arial; font-size: 12px; text-anchor: middle; }
              .edge-line { stroke: #00BCD4; stroke-width: 2; marker-end: url(#arrowhead); }
            </style>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#00BCD4" />
              </marker>
            </defs>
            ${nodes.map((node, i) => {
              const y = 50 + i * 80;
              const label = (node.data?.label || 'Step').substring(0, 20);
              return `
                <rect x="150" y="${y - 20}" width="100" height="40" class="node-rect" rx="5"/>
                <text x="200" y="${y + 5}" class="node-text">${label}</text>
                ${i < nodes.length - 1 ? `<line x1="200" y1="${y + 20}" x2="200" y2="${y + 60}" class="edge-line"/>` : ''}
              `;
            }).join('')}
          </svg>
        `;
        
        elementRef.current.innerHTML = `
          <div class="p-4 text-center">
            <div class="mb-4">
              ${fallbackSvg}
            </div>
            <p class="text-sm text-gray-600 mb-2">Fallback flowchart (Mermaid rendering failed)</p>
            <details class="text-left max-w-md mx-auto">
              <summary class="cursor-pointer text-blue-600 hover:text-blue-800 text-sm">View Debug Info</summary>
              <div class="mt-2 text-xs">
                <div class="bg-red-50 p-2 rounded mb-2">
                  <strong>Error:</strong> ${err.message}
                </div>
                <div class="bg-gray-100 p-2 rounded">
                  <strong>Nodes:</strong> ${nodes.length}<br>
                  <strong>Edges:</strong> ${edges?.length || 0}
                </div>
              </div>
            </details>
          </div>
        `;
      }
    }
  }, [mermaid, nodes, edges, isLoading]);

  useEffect(() => {
    // Clear any existing timeout
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    // Only render if we have valid data
    if (nodes && nodes.length > 0) {
      // Add a small delay to ensure DOM is ready and prevent rapid re-renders
      renderTimeoutRef.current = setTimeout(renderChart, 200);
    }

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [renderChart, nodes]);

  const retryRender = useCallback(() => {
    setError(null);
    console.log('Retrying render...');
    renderChart();
  }, [renderChart]);

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="font-medium">Loading Mermaid Renderer...</p>
          <p className="text-sm">Setting up flowchart visualization</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center text-red-700 max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <p className="font-semibold text-lg mb-2">Mermaid Rendering Error</p>
          <p className="text-sm mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={retryRender}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Rendering
            </button>
            <p className="text-xs text-red-600">
              Try switching to "Code" view to see the raw Mermaid syntax
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!nodes || nodes.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="font-medium">No Flowchart Data</p>
          <p className="text-sm">Add some code to generate a flowchart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-96 bg-white rounded-lg overflow-auto">
      <div 
        ref={elementRef} 
        className="flex items-center justify-center min-h-full p-4 mermaid-container"
        style={{ minHeight: '384px' }}
      />
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 bg-gray-100 text-xs text-gray-600 border-t">
          Nodes: {nodes?.length || 0} | Edges: {edges?.length || 0} | Mermaid: {mermaid ? '✓' : '✗'} | Loading: {isLoading ? '✓' : '✗'}
          {error && <span className="text-red-600 ml-2">Error: {error}</span>}
        </div>
      )}
    </div>
  );
};

export default MermaidFlowchart;