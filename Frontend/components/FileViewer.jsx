'use client'

import { useState, useEffect } from 'react'
import { X, Download, ExternalLink } from 'lucide-react'

export default function FileViewer({ file, onClose }) {
  const [loading, setLoading] = useState(true)
  const [fileBlob, setFileBlob] = useState(null)
  const [error, setError] = useState(null)

  const isPDF = file.mimetype === 'application/pdf' || file.url?.endsWith('.pdf')
  const isImage = file.mimetype?.startsWith('image/') || /\.(jpg|jpeg|png|gif)$/i.test(file.url)
  
  const fileUrl = file.url?.startsWith('http') 
    ? file.url 
  : `http://localhost:5001${file.url}`

  const downloadUrl = file.url?.startsWith('http') 
    ? `${file.url}/download` 
  : `http://localhost:5001${file.url}/download`

  // Fetch file with authentication headers
  useEffect(() => {
    const fetchFile = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const token = localStorage.getItem('token')
        const response = await fetch(fileUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.status}`)
        }

        const blob = await response.blob()
        setFileBlob(blob)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching file:', error)
        setError(error.message)
        setLoading(false)
      }
    }

    fetchFile()

    // Cleanup function to revoke blob URL
    return () => {
      if (fileBlob) {
        URL.revokeObjectURL(URL.createObjectURL(fileBlob))
      }
    }
  }, [fileUrl])

  const handleDownload = async () => {
    try {
      let blob = fileBlob
      
      // If we don't have the blob cached, fetch it
      if (!blob) {
        const token = localStorage.getItem('token')
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to download file')
        }

        blob = await response.blob()
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = file.originalName || file.filename || 'download'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Failed to download file')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {file.originalName || file.filename}
            </h2>
            <p className="text-sm text-gray-500">
              {file.size && `${(file.size / 1024 / 1024).toFixed(2)} MB`}
              {file.mimetype && ` • ${file.mimetype}`}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-900"
              title="Download file"
            >
              <Download className="w-5 h-5" />
            </button>
            
            {isPDF && fileBlob && (
              <a
                href={URL.createObjectURL(fileBlob)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-900"
                title="Open in new tab"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <span className="mt-2 text-gray-600">Loading file...</span>
              </div>
            </div>
          ) : error ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-red-600">⚠️</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Error Loading File
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Try Download Instead
                </button>
              </div>
            </div>
          ) : fileBlob && isPDF ? (
            <div className="w-full h-full">
              <iframe
                src={URL.createObjectURL(fileBlob)}
                className="w-full h-full border-0 rounded"
                title={file.originalName || file.filename}
              />
            </div>
          ) : fileBlob && isImage ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
              <img
                src={URL.createObjectURL(fileBlob)}
                alt={file.originalName || file.filename}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gray-600">📄</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Preview not available
                </h3>
                <p className="text-gray-600 mb-4">
                  This file type cannot be previewed in the browser. You can download it to view the content.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
