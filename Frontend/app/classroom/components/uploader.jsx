'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileIcon, Copy } from "lucide-react"
import * as pdfjs from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function PDFTextExtractorComponent() {
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker
  }, [])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setExtractedText('')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setExtractedText('')
    }
  }

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item) => item.str).join(' ')
      fullText += `\n--- Page ${i} ---\n${pageText}\n`
    }

    return fullText.trim()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return

    setProcessing(true)
    setExtractedText('')

    try {
      const pdfText = await extractTextFromPDF(file)
      setExtractedText(pdfText)
    } catch (error) {
      console.error('Processing failed:', error)
      setExtractedText('Failed to extract text from the document. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText)
      .then(() => {
        console.log('Text copied to clipboard')
      })
      .catch((err) => {
        console.error('Failed to copy: ', err)
      })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Uploader</h1>
      <Card>
        <CardHeader>
          <CardTitle>Extract text from PDF documents</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                id="pdf-document"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Label htmlFor="pdf-document" className="cursor-pointer text-lg">
                {file ? file.name : 'Click or drag to upload PDF document'}
              </Label>
            </div>
            {file && (
              <Alert>
                <FileIcon className="mr-2 h-4 w-4" />
                <AlertDescription>{file.name}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={processing || !file}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin mr-2" /> Extracting Text...
                </>
              ) : (
                'Extract Text'
              )}
            </Button>

            {extractedText && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">Extracted Text:</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-4 w-4" /> Copy
                  </Button>
                </div>
                <Textarea
                  value={extractedText}
                  readOnly
                  className="h-64 font-mono text-sm"
                />
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}