'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download, AlertCircle, Loader } from 'lucide-react';

export default function FileViewer({ file, onClose }) {
  // Summary of changes:
  // - Fetch protected backend file with Authorization header (token from localStorage)
  // - Create object URL from Blob for preview (iframe/img)
  // - Use AbortController to cancel fetches and revoke object URLs on cleanup
  // - Download uses same auth-fetch when necessary

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const blobUrlRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    // cleanup previous fetch/blob
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setFileUrl('');
    setError('');
    setLoading(true);

    if (!file) {
      setLoading(false);
      return;
    }

    const loadFile = async () => {
      try {
        setError('');
        const API_BASE = 'http://localhost:5001';

        // Build absolute URL from incoming file info
        let rawUrl = null;
        // --- ENHANCED: Support GridFS links, handle missing file, and fallback ---
        if (file?.url) {
          rawUrl = /^https?:\/\//i.test(file.url)
            ? file.url
            : `${API_BASE}${file.url.startsWith('/') ? '' : '/'}${file.url}`;
        } else if (file?.link) {
          rawUrl = /^https?:\/\//i.test(file.link)
            ? file.link
            : `${API_BASE}${file.link.startsWith('/') ? '' : '/'}${file.link}`;
        } else if (file?.filename) {
          rawUrl = `${API_BASE}/api/files/${encodeURIComponent(file.filename)}`;
        } else if (typeof file === 'string' && file) {
          rawUrl = /^https?:\/\//i.test(file)
            ? file
            : `${API_BASE}${file.startsWith('/') ? '' : '/'}${file}`;
        } else {
          setError('No file selected or file format is missing required properties.');
          setLoading(false);
          return;
        }

        // If URL belongs to backend, fetch with Authorization to get Blob; else use URL directly
        const apiOrigin = new URL(API_BASE).origin;
        let rawOrigin = null;
        try { rawOrigin = new URL(rawUrl).origin } catch { rawOrigin = null }

        if (rawOrigin && rawOrigin === apiOrigin) {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('No token, authorization denied');

          const controller = new AbortController();
          abortRef.current = controller;

          const resp = await fetch(rawUrl, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          });

          if (!resp.ok) {
            const txt = await resp.text().catch(() => '');
            if (resp.status === 404) {
              setError('File not found (404). The file may have been deleted or the link is incorrect.');
            } else if (txt.startsWith('<!DOCTYPE html>')) {
              setError('Server returned an HTML error page. Check your backend route and file id.');
            } else {
              setError(resp.status === 401 ? 'Unauthorized (please login)' : (txt || `Failed to fetch file: ${resp.status}`));
            }
            setLoading(false);
            return;
          }

          const blob = await resp.blob();
          const objUrl = URL.createObjectURL(blob);
          blobUrlRef.current = objUrl;
          setFileUrl(objUrl);
        } else {
          setFileUrl(rawUrl);
        }

        setLoading(false);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load file');
        setLoading(false);
      }
    };

    loadFile();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [file]);

  const handleDownload = async () => {
    try {
      // If we already have a blob URL (from preview), use it
      if (blobUrlRef.current) {
        const a = document.createElement('a');
        a.href = blobUrlRef.current;
        a.download = file?.originalName || file?.filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      if (!file) return;
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
      let rawUrl = file.url ? ( /^https?:\/\//i.test(file.url) ? file.url : `${API_BASE}${file.url.startsWith('/') ? '' : '/'}${file.url}` )
                 : file.filename ? `${API_BASE}/api/files/${encodeURIComponent(file.filename)}`
                 : typeof file === 'string' ? ( /^https?:\/\//i.test(file) ? file : `${API_BASE}${file.startsWith('/') ? '' : '/'}${file}` )
                 : null;
      if (!rawUrl) return;

      const apiOrigin = new URL(API_BASE).origin;
      let rawOrigin = null;
      try { rawOrigin = new URL(rawUrl).origin } catch { rawOrigin = null }

      if (rawOrigin && rawOrigin === apiOrigin) {
        const token = localStorage.getItem('token');
        if (!token) { setError('No token, authorization denied'); return; }

        const resp = await fetch(rawUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) {
          const txt = await resp.text().catch(() => '');
          throw new Error(resp.status === 401 ? 'Unauthorized (please login)' : (txt || `Download failed: ${resp.status}`));
        }
        const blob = await resp.blob();
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = file?.originalName || file?.filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
      } else {
        const a = document.createElement('a');
        a.href = rawUrl;
        a.download = file?.originalName || file?.filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download error:', err);
      setError(err.message || 'Download failed');
    }
  };

  const getFileType = () => {
    // --- CHANGED: Support GridFS filename fallback ---
    const name =
      file?.originalName ||
      file?.filename ||
      file?.name ||
      (file?.link && file?.link.split('/').pop()) ||
      '';
    const ext = name.split('.').pop()?.toLowerCase();
    return ext;
  };

  const fileType = getFileType();
  const isPDF = fileType === 'pdf' || file?.mimetype === 'application/pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileType);
  const isText = ['txt', 'md'].includes(fileType);

  // Use larger modal for PDF
  const containerClass = isPDF
    ? 'bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col'
    : 'bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={containerClass}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-900">
              {file?.originalName || file?.filename || 'File'}
            </h3>
            {file?.size && (
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)}MB
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={loading || error}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-blue-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-gray-600">Loading file...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <p className="text-red-600 font-medium text-center">{error}</p>
              <p className="text-sm text-gray-600 text-center max-w-md">
                The file could not be displayed. Please try downloading it instead.
              </p>
            </div>
          )}

          {!loading && !error && (
            <>
              {isPDF && (
                <iframe
                  src={fileUrl}
                  className="w-full h-[85vh] lg:h-[88vh] rounded-b-xl"
                  title="PDF Viewer"
                  onError={() => setError('Failed to load PDF. Please download to view.')}
                />
              )}

              {isImage && (
                <div className="flex items-center justify-center h-full bg-gray-100 p-4">
                  <img
                    src={fileUrl}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                    onError={() => setError('Failed to load image')}
                  />
                </div>
              )}

              {isText && (
                <iframe
                  src={fileUrl}
                  className="w-full h-full"
                  title="Text Viewer"
                  onError={() => setError('Failed to load text file. Please download to view.')}
                />
              )}

              {!isPDF && !isImage && !isText && (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                  <AlertCircle className="w-12 h-12 text-yellow-600" />
                  <p className="text-gray-600 font-medium">Preview not available</p>
                  <p className="text-sm text-gray-500 text-center">
                    This file type cannot be previewed. Please download to view.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
