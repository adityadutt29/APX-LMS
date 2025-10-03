"use client"
import React, { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FileText, File, Link2 } from 'lucide-react'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import PdfUploader from './PdfUploader'

export default function PracticeUploaderModal({ onSubmit }) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('pdf')
  const [text, setText] = useState('')
  const [youtube, setYoutube] = useState('')
  const [pdfText, setPdfText] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfFiles, setPdfFiles] = useState([])
  const [processing, setProcessing] = useState(false)

  // handleExtract may be called multiple times (once per file) by PdfUploader
  const handleExtract = (extracted, file, err) => {
    if (!file) return
    // store text per-file
    setPdfFiles(prev => {
      const copy = prev.filter(p => p.file?.name !== file.name)
      copy.push({ file, text: extracted || '' })
      return copy
    })
    // also set the single-file states for backward compatibility
    setPdfText(extracted || '')
    setPdfFile(file || null)
    if (err) console.error('Extract error', err)
  }

  const submitAll = () => {
    if (activeTab === 'pdf') {
      // If multiple files were extracted, combine them into a single study pack
      if (pdfFiles && pdfFiles.length > 0) {
        // Join texts with a clear separator that backend/frontend can parse if needed
        const combinedText = pdfFiles.map(p => `--- File: ${p.file?.name || 'unknown'} ---\n\n${p.text || ''}`).join('\n\n')
        const combinedFileName = pdfFiles.map(p => p.file?.name || 'unknown').join(', ')
        const payload = { text: combinedText, youtube: '', fileName: combinedFileName }
        onSubmit && onSubmit(payload)
      } else {
        const payload = { text: pdfText || '', youtube: '', fileName: pdfFile?.name || '' }
        onSubmit && onSubmit(payload)
      }
    } else if (activeTab === 'text') {
      const payload = { text: text?.trim() || '', youtube: '', fileName: '' }
      onSubmit && onSubmit(payload)
    } else if (activeTab === 'youtube') {
      const payload = { text: '', youtube: youtube?.trim() || '', fileName: '' }
      onSubmit && onSubmit(payload)
    }
    setOpen(false)
    setText('')
    setYoutube('')
    setPdfText('')
    setPdfFile(null)
    setPdfFiles([])
    setActiveTab('pdf')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Upload New Content</Button>
      </DialogTrigger>
  <DialogContent className="bg-black text-white p-6 rounded-xl max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-1">Upload New Content</DialogTitle>
          <DialogDescription className="text-base text-gray-300 mb-4">Choose your content type and upload to create smart study materials.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
    <TabsList className="w-full flex justify-center mb-6 bg-black rounded-lg border border-gray-800">
            <TabsTrigger value="text" className="flex items-center gap-2 px-6 py-2 text-base font-medium data-[state=active]:bg-black data-[state=active]:text-white data-[state=inactive]:text-gray-400 rounded-lg border border-gray-800">
              <FileText className="w-5 h-5" /> Text
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-2 px-6 py-2 text-base font-medium data-[state=active]:bg-black data-[state=active]:text-white data-[state=inactive]:text-gray-400 rounded-lg border border-gray-800">
              <File className="w-5 h-5" /> File
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-2 px-6 py-2 text-base font-medium data-[state=active]:bg-black data-[state=active]:text-white data-[state=inactive]:text-gray-400 rounded-lg border border-gray-800">
              <Link2 className="w-5 h-5" /> Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <div className="mb-6">
              <label className="block text-base font-semibold mb-2">Content *</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full p-3 border border-gray-800 bg-black rounded-md h-32 text-white placeholder-gray-400" placeholder="Paste your text content here..." />
              <div className="text-xs text-gray-400 mt-1">Enter the text you want to convert into study materials</div>
            </div>
          </TabsContent>

          <TabsContent value="pdf">
            <div className="mb-6">
              <label className="block text-base font-semibold mb-2">PDF File *</label>
              <PdfUploader onExtract={handleExtract} onProcessing={(p) => setProcessing(p)} darkMode={true} multiple={true} />
              <div className="text-xs text-gray-400 mt-1">Select a PDF file to upload</div>
            </div>
          </TabsContent>

          <TabsContent value="youtube">
            <div className="mb-6">
              <label className="block text-base font-semibold mb-2">YouTube URL *</label>
              <input value={youtube} onChange={(e) => setYoutube(e.target.value)} className="w-full p-3 border border-gray-800 bg-black rounded-md text-white placeholder-gray-400" placeholder="https://www.youtube.com/watch?v=..." />
              <div className="text-xs text-gray-400 mt-1">Enter a valid YouTube video URL</div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-2 flex gap-4 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} className="bg-black text-white border border-gray-800 px-6 py-2 rounded-md">Cancel</Button>
          <Button onClick={submitAll} disabled={processing || (activeTab === 'pdf' && !pdfText && !pdfFile)} className="bg-white text-black font-semibold px-6 py-2 rounded-md">
            {processing ? 'Extracting...' : 'Create Study Pack'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
      