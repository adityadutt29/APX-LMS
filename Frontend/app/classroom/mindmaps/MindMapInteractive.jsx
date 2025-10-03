"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

/*
  MindMapInteractive
  Props:
    - nodes: [{id,label,parentId}]
    - connections: [{source,target,label}] (optional cross links)

  Features:
    - Hierarchical expansion / collapse (click node)
    - Pan / zoom, minimap, controls
    - Auto layout recalculated on expand/collapse

  Layout approach:
    - We keep a visible set of node ids
    - On expand, add children; on collapse, remove subtree
    - Simple layered layout (depth * Y_SPACING, index * X_SPACING)
*/

const X_SPACING = 220;
const Y_SPACING = 120;

function buildChildrenIndex(rawNodes) {
  const byParent = {};
  rawNodes.forEach(n => {
    const pid = n.parentId || null;
    if (!byParent[pid]) byParent[pid] = [];
    byParent[pid].push(n);
  });
  return byParent;
}

function collectDescendants(id, childrenIndex) {
  const stack = [id];
  const out = new Set();
  while (stack.length) {
    const current = stack.pop();
    const kids = childrenIndex[current] || [];
    for (const k of kids) {
      out.add(k.id);
      stack.push(k.id);
    }
  }
  return out;
}

export default function MindMapInteractive({ nodes = [], connections = [], style = {} }) {
  const [root, setRoot] = useState(null);
  const [expanded, setExpanded] = useState(new Set()); // nodes that are expanded (children visible)
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const childrenIndex = useMemo(() => buildChildrenIndex(nodes), [nodes]);

  useEffect(() => {
    // Determine root (first with parentId null)
    const r = nodes.find(n => !n.parentId) || nodes[0];
    setRoot(r || null);
    if (r) {
      setExpanded(new Set([r.id]));
    }
  }, [nodes]);

  // Visible nodes: start with root; for each expanded node add its direct children
  const visibleNodeIds = useMemo(() => {
    if (!root) return new Set();
    const vis = new Set([root.id]);
    const queue = [root.id];
    while (queue.length) {
      const id = queue.shift();
      if (expanded.has(id)) {
        const kids = childrenIndex[id] || [];
        for (const k of kids) {
          if (!vis.has(k.id)) vis.add(k.id);
          // do not automatically traverse grandchildren unless their own id is expanded
          if (expanded.has(k.id)) queue.push(k.id);
        }
      }
    }
    return vis;
  }, [root, expanded, childrenIndex]);

  // Build layered structure by depth
  const depthIndex = useMemo(() => {
    const depthMap = {}; // id -> depth
    if (!root) return { depthMap, layers: [] };
    depthMap[root.id] = 0;
    const layers = [[root.id]];
    const queue = [root.id];
    while (queue.length) {
      const id = queue.shift();
      const d = depthMap[id];
      if (expanded.has(id)) {
        const kids = (childrenIndex[id] || []).map(k => k.id).filter(kid => visibleNodeIds.has(kid));
        if (kids.length) {
          kids.forEach(k => {
            depthMap[k] = d + 1;
            queue.push(k);
          });
          if (!layers[d + 1]) layers[d + 1] = [];
          layers[d + 1].push(...kids);
        }
      }
    }
    return { depthMap, layers: layers.filter(Boolean) };
  }, [root, expanded, childrenIndex, visibleNodeIds]);

  const reactFlowNodes = useMemo(() => {
    const { depthMap, layers } = depthIndex;
    const rfNodes = [];
    layers.forEach((layer, depth) => {
      // center them around x=0
      const total = layer.length;
      layer.forEach((id, index) => {
        const raw = nodes.find(n => n.id === id) || { id, label: id };
        const xOffset = (index - (total - 1) / 2) * X_SPACING;
        const position = { x: xOffset, y: depth * Y_SPACING };
        const hasChildren = (childrenIndex[id] || []).length > 0;
        const isExpanded = expanded.has(id);
        rfNodes.push({
          id: raw.id,
          position,
          data: {
            label: (
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 12,
                  background: isExpanded ? '#ede9fe' : (selectedNodeId === raw.id ? '#f1f5f9' : '#ffffff'),
                  border: selectedNodeId === raw.id ? '2px solid #6366f1' : '1px solid #d9d6ff',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#3b3663',
                  cursor: hasChildren ? 'pointer' : 'default',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(raw.id);
                  if (hasChildren) toggleNode(raw.id);
                }}
                title={raw.data?.description || raw.label}
              >
                {raw.label}{hasChildren && (
                  <span style={{ marginLeft: 6, fontWeight: 400, fontSize: 11, opacity: 0.7 }}>
                    {isExpanded ? '−' : '+'}
                  </span>
                )}
              </div>
            )
          },
          draggable: false,
          selectable: true,
          style: { width: 'auto', height: 'auto' }
        });
      });
    });
    return rfNodes;
  }, [nodes, depthIndex, expanded, childrenIndex, selectedNodeId]);

  const reactFlowEdges = useMemo(() => {
    const edges = [];
    // parent-child edges for visible nodes
    reactFlowNodes.forEach(n => {
      const raw = nodes.find(r => r.id === n.id);
      if (raw && raw.parentId && expanded.has(raw.parentId) && reactFlowNodes.find(x => x.id === raw.parentId)) {
        edges.push({ id: `${raw.parentId}-${raw.id}`, source: raw.parentId, target: raw.id, animated: false, type: 'smoothstep' });
      }
    });
    // cross connections (optional) only if both ends visible
    connections.forEach(c => {
      if (reactFlowNodes.find(n => n.id === c.source) && reactFlowNodes.find(n => n.id === c.target)) {
        edges.push({ id: `c-${c.source}-${c.target}-${edges.length}`, source: c.source, target: c.target, animated: true, style: { stroke: '#a855f7' } });
      }
    });
    return edges;
  }, [reactFlowNodes, nodes, expanded, connections]);

  const [rfNodesState, , onNodesChange] = useNodesState(reactFlowNodes);
  const [rfEdgesState, , onEdgesChange] = useEdgesState(reactFlowEdges);

  // Keep state in sync when derived nodes/edges change
  useEffect(() => { /* update nodes */ }, [reactFlowNodes]);
  useEffect(() => { /* update edges */ }, [reactFlowEdges]);

  const toggleNode = useCallback((id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        // collapse -> remove descendants of id (except id itself)
        const descendants = collectDescendants(id, childrenIndex);
        descendants.forEach(d => next.delete(d));
        next.delete(id); // also collapse this node's children visibility
      } else {
        next.add(id);
      }
      return next;
    });
  }, [childrenIndex]);

  if (!root) {
    return <div style={{ padding: 16, fontSize: 14, color: '#555' }}>No mind map data.</div>;
  }

  const selected = nodes.find(n => n.id === selectedNodeId);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', ...style }}>
      <div style={{ flex: '1 1 auto', position: 'relative' }}>
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          proOptions={{ hideAttribution: true }}
          minZoom={0.25}
          onPaneClick={() => setSelectedNodeId(null)}
        >
          <Background gap={24} color="#eee" />
          <MiniMap zoomable pannable />
          <Controls />
        </ReactFlow>
        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.9)', padding: '6px 10px', borderRadius: 8, fontSize: 11, border: '1px solid #e5e5ef' }}>
          Click a node to select & expand/collapse. Drag canvas to pan. Scroll to zoom.
        </div>
      </div>
      {/* Side panel */}
      <div style={{ width: 260, borderLeft: '1px solid #e5e7eb', background: '#fafafa', padding: '12px 14px', fontSize: 13, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Node Details</div>
        {selected ? (
          <div style={{ lineHeight: 1.4 }}>
            <div style={{ fontWeight: 600, color: '#4338ca', marginBottom: 4 }}>{selected.label}</div>
            <div style={{ fontSize: 12, color: '#374151', whiteSpace: 'pre-wrap' }}>
              {selected.data?.description || 'No description.'}
            </div>
            { (childrenIndex[selected.id] || []).length > 0 && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#6b7280' }}>
                {(childrenIndex[selected.id] || []).length} child node(s)
              </div>
            )}
            {selected.parentId && (
              <button
                onClick={() => setSelectedNodeId(selected.parentId)}
                style={{ marginTop: 10, background: '#ede9fe', border: '1px solid #d9d6ff', padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
              >
                ↑ Go to Parent
              </button>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#6b7280' }}>Select a node to view its description.</div>
        )}
      </div>
    </div>
  );
}
