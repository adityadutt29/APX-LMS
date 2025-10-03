"use client"
import React, { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, FileIcon, Copy } from 'lucide-react'

export default function PdfUploader({ onExtract, initialFile = null, onProcessing = null, multiple = false }) {
  const [file, setFile] = useState(initialFile)
  const [files, setFiles] = useState(initialFile && Array.isArray(initialFile) ? initialFile : [])
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker
  }, [])

  const handleFileChange = (e) => {
    if (!e.target.files) return
    if (multiple) {
      const list = Array.from(e.target.files)
      setFiles(list)
    } else if (e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleDragOver = (e) => e.preventDefault()
  const handleDrop = (e) => {
    e.preventDefault()
    if (!e.dataTransfer.files) return
    if (multiple) {
      const list = Array.from(e.dataTransfer.files)
      setFiles(list)
    } else if (e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const extractTextFromPDF = async (inputFile) => {
    const target = inputFile || file
    if (!target) return ''
    setProcessing(true)
    onProcessing && onProcessing(true)
    try {
      console.debug('[PdfUploader] Starting extraction for file:', target.name)
      const arrayBuffer = await target.arrayBuffer()

      // Temporarily filter specific pdf.worker warnings that are noisy but non-fatal
      const origWarn = console.warn
      console.warn = function(...args) {
        try {
          const joined = args.map(a => String(a)).join(' ')
          if (joined.includes('Badly formatted number') && joined.includes('minus')) {
            // drop this noisy warning
            return
          }
        } catch (e) {
          // ignore
        }
        origWarn.apply(console, args)
      }

      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
      // restore right away after pdf loaded
      console.warn = origWarn

      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map((item) => item.str).join(' ')
          fullText += `\n--- Page ${i} ---\n${pageText}\n`
          console.debug(`[PdfUploader] Extracted page ${i}/${pdf.numPages}`)
        } catch (pageErr) {
          console.error(`[PdfUploader] Failed to extract page ${i}:`, pageErr)
          fullText += `\n--- Page ${i} ---\n[Error extracting this page]\n`
        }
      }
      const result = fullText.trim()

      // Sanitize extracted text: replace Unicode minus and similar characters
      const sanitizeText = (input) => {
        if (!input) return ''
        return input
          .replace(/\u2212/g, '-') // minus sign
          .replace(/\u2013/g, '-') // en dash
          .replace(/\u2014/g, '-') // em dash
          .replace(/\u00A0/g, ' ') // non-breaking space
          .replace(/\u202F/g, ' ') // narrow no-break space
          .replace(/\u200B/g, '') // zero-width space
          .replace(/\u2060/g, '') // word joiner
          .replace(/\u00AD/g, '') // soft hyphen
          .replace(/\s+/g, ' ') // collapse whitespace
          .trim()
      }

      const sanitized = sanitizeText(result)
  console.debug('[PdfUploader] Extraction complete. chars:', sanitized.length)
  console.debug('[PdfUploader] Extracted text:', sanitized)
      onExtract && onExtract(sanitized, target)
      return sanitized
    } catch (err) {
      console.error('PDF extraction error:', err)
      onExtract && onExtract('', target, err)
      return ''
    } finally {
      setProcessing(false)
      onProcessing && onProcessing(false)
    }
  }

  // Auto-extract whenever a new file is selected to avoid requiring two uploads
  useEffect(() => {
    const run = async () => {
      if (multiple) {
        if (files && files.length > 0) {
          for (const f of files) {
            try {
              await extractTextFromPDF(f)
            } catch (err) {
              console.error('Auto extract failed for', f.name, err)
            }
          }
        } else {
          onExtract && onExtract('', null)
        }
      } else {
        if (file) {
          // trigger extraction in the background
          extractTextFromPDF(file).catch((err) => console.error('Auto extract failed', err))
        } else {
          // if file cleared, notify parent of cleared text
          onExtract && onExtract('', null)
        }
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, files, multiple])

  return (
    <div>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          id="pdf-document-uploader"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          multiple={multiple}
        />
        <Label htmlFor="pdf-document-uploader" className="cursor-pointer text-lg">
          {multiple ? (files && files.length ? `${files.length} file(s) selected` : 'Click or drag to upload PDF documents') : (file ? file.name : 'Click or drag to upload PDF document')}
        </Label>
      </div>

        <div className="mt-4 flex gap-2">
        <Button onClick={async () => {
          if (multiple) {
            if (!files || files.length === 0) return
            for (const f of files) await extractTextFromPDF(f)
          } else {
            await extractTextFromPDF()
          }
        }} disabled={((!multiple && !file) || (multiple && (!files || files.length===0))) || processing} className="flex-1">
          {processing ? <><Loader2 className="animate-spin mr-2" /> Extracting...</> : 'Re-extract Text'}
        </Button>
        <Button variant="outline" onClick={() => { setFile(null); setFiles([]); onExtract && onExtract('', null) }}>
          Clear
        </Button>
      </div>
    </div>
  )
}
