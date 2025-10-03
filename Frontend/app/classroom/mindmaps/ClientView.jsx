"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { Loader2, RefreshCcw, Trash2, Eye, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import MindMapInteractive from './MindMapInteractive';

export default function MindmapsClient() {
  const [mindmaps, setMindmaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const router = useRouter();

  const loadMindmaps = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5001/api/mindmaps', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMindmaps(res.data.data || []);
    } catch (e) {
      console.error('Failed to load mind maps', e);
      setError('Failed to load mind maps.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMindmaps();
  }, []);

  const deleteMindmap = async (id) => {
    if (!confirm('Delete this mind map?')) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/mindmaps/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMindmaps((m) => m.filter((mm) => mm._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch (e) {
      console.error('Failed to delete mind map', e);
      alert('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const normalizeMindmap = (mm) => {
    if (mm.nodes?.length) return mm;
    try {
      const parsed = JSON.parse(mm.content || '{}');
      if (parsed.nodes) return { ...mm, ...parsed };
    } catch {};
    return { ...mm, nodes: [{ id: 'root', label: mm.title || 'Mind Map', parentId: null }], connections: [] };
  };

  return (
    <div className="min-h-screen bg-[#FFF9F0] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mind Maps</h1>
            <p className="text-gray-500">All AI generated mind maps from your practice sessions</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/classroom')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">Dashboard</button>
            <button onClick={() => router.push('/classroom/components')} className="hidden px-4 py-2 bg-gray-100 rounded-lg text-sm">Components</button>
            <button onClick={loadMindmaps} disabled={loading} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <RefreshCcw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {error && <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        {!selected && (
          <>
            {loading && mindmaps.length === 0 && (
              <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading mind maps...
              </div>
            )}
            {!loading && mindmaps.length === 0 && (
              <div className="text-center py-20 bg-white border border-dashed border-purple-300 rounded-2xl">
                <p className="text-lg font-medium text-gray-700 mb-2">No mind maps yet</p>
                <p className="text-sm text-gray-500 mb-4">Generate one from the Practice Center after uploading content.</p>
                <button onClick={() => router.push('/classroom')} className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm">Go to Practice Center</button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mindmaps.map(mmRaw => {
                const mm = normalizeMindmap(mmRaw)
                const nodeCount = mm.nodes?.length || 0
                const root = mm.nodes?.find(n => !n.parentId) || mm.nodes?.[0]
                return (
                  <div key={mm._id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer group" onClick={() => setSelected(mm)}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800 text-base line-clamp-1" title={mm.title}>{mm.title || 'Untitled Mind Map'}</h3>
                      <button onClick={(e) => { e.stopPropagation(); deleteMindmap(mm._id) }} disabled={deletingId === mm._id} className="text-red-500/70 hover:text-red-600 disabled:opacity-40">
                        {deletingId === mm._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{new Date(mm.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4" title={root?.label}>{root?.label}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md">{nodeCount} nodes</span>
                      <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition text-purple-600"><Eye className="w-4 h-4" /> View</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {selected && (
          <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"><ChevronLeft className="w-4 h-4" /> Back</button>
              <div className="flex gap-2">
                <button onClick={() => deleteMindmap(selected._id)} className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-1"><Trash2 className="w-4 h-4" /> Delete</button>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{selected.title || 'Mind Map'}</h2>
            <p className="text-xs text-gray-500 mb-4">Created {new Date(selected.createdAt).toLocaleString()}</p>
            <div className="h-[520px] w-full border border-purple-200 rounded-xl overflow-hidden bg-purple-50 relative">
              <MindMapInteractive
                nodes={(selected.nodes || []).map(n => ({ ...n }))}
                connections={selected.connections || []}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <p className="mt-4 text-xs text-gray-500">Total nodes: {selected.nodes?.length || 0}</p>
          </div>
        )}
      </div>
    </div>
  );
}
