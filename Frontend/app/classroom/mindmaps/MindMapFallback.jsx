"use client";
import React from 'react';

// Simple hierarchical renderer for mind map nodes.
// nodes: [{id,label,parentId}]
// connections: optional array (not visualized with lines here)
export default function MindMapFallback({ nodes = [], connections = [], style = {} }) {
  // Build tree
  const map = {};
  nodes.forEach(n => { map[n.id] = { ...n, children: [] } });
  let root = null;
  nodes.forEach(n => {
    const pid = n.parentId;
    if (!pid || pid === null) {
      root = map[n.id];
    } else if (map[pid]) {
      map[pid].children.push(map[n.id]);
    } else {
      // Orphan -> attach to root placeholder
      if (!root) {
        root = { id: 'root', label: 'Mind Map', children: [] };
      }
      root.children.push(map[n.id]);
    }
  });

  if (!root) {
    // fallback: create a root from first node
    if (nodes.length > 0) root = map[nodes[0].id];
    else root = { id: 'root', label: 'Empty Mind Map', children: [] };
  }

  const Node = ({ node, depth = 0 }) => (
    <div style={{ marginLeft: depth * 20, marginTop: 8 }}>
      <div style={{ display: 'inline-block', padding: '6px 10px', background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #eee' }}>
        <div style={{ fontWeight: 600, color: '#333' }}>{node.label}</div>
      </div>
      {node.children && node.children.length > 0 && (
        <div style={{ marginTop: 6 }}>
          {node.children.map(child => <Node key={child.id} node={child} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: 12, overflow: 'auto', ...style }}>
      <Node node={root} />
      {connections && connections.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>Cross-links: {connections.length}</div>
      )}
    </div>
  );
}
