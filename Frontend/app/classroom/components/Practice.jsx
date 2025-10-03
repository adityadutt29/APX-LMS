"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Trophy, Loader2, FileText, History, Eye, Clock, Package2, Brain, BookOpen, FileQuestion } from "lucide-react"
import axios from "axios"
import PracticeUploaderModal from './PracticeUploaderModal'
import MindMapInteractive from '../mindmaps/MindMapInteractive'

export default function Practice() {
  const [view, setView] = useState("upload") // "upload", "quiz", "history", "reader"

  // Helper to render LaTeX inline formulas (simple regex replacements for common patterns)
  const renderLatex = (text) => {
    if (!text) return ''
    return text
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\sum/g, '∑')
      .replace(/\\int/g, '∫')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\pi/g, 'π')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .replace(/\\cdot/g, '·')
      .replace(/\\le/g, '≤')
      .replace(/\\ge/g, '≥')
      .replace(/\\ne/g, '≠')
      .replace(/\\approx/g, '≈')
  }

  const [extractedText, setExtractedText] = useState("")
  const [pdfFileName, setPdfFileName] = useState('')
  const [quizType, setQuizType] = useState("") // "mcq" or "qa"
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [showScore, setShowScore] = useState(false)
  const [loadingMcq, setLoadingMcq] = useState(false)
  const [loadingQa, setLoadingQa] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false) // generic loading for Q&A evaluation
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [userAnswers, setUserAnswers] = useState([])
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [previousTests, setPreviousTests] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyHasMore, setHistoryHasMore] = useState(false)
  const [selectedTest, setSelectedTest] = useState(null)
  // Aggregated study packs (grouped by fileName)
  const [studyPacks, setStudyPacks] = useState([])
  // Reader view states
  const [readerFontSize, setReaderFontSize] = useState(16)
  const increaseReaderFont = () => setReaderFontSize(f => Math.min(f + 2, 28))
  const decreaseReaderFont = () => setReaderFontSize(f => Math.max(f - 2, 12))
  const [readerSummary, setReaderSummary] = useState(null)
  const [showFullText, setShowFullText] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [summarySavedId, setSummarySavedId] = useState(null)
  const summaryCacheRef = useRef({}) // key: fileName|sessionId -> summary object
  const [flippedCards, setFlippedCards] = useState({}) // track which cards are flipped
  // Notes state
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [generatedNotes, setGeneratedNotes] = useState(null)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [notesSavedId, setNotesSavedId] = useState(null)
  const notesCacheRef = useRef({}) // key: fileName|sessionId -> notes object

  // Compute study packs whenever previousTests change; include stored AI summary if available
  useEffect(() => {
    if (!previousTests || previousTests.length === 0) {
      setStudyPacks([])
      return
    }
    // Group by fileName and prefer most-recent summary when available
    const map = new Map()
    previousTests.forEach(t => {
      const key = t.fileName || 'Unknown File'
      const accessed = new Date(t.updatedAt || t.createdAt || t.timestamp || Date.now())
      if (!map.has(key)) {
        map.set(key, {
          fileName: key,
          // Keep the longest extracted text (heuristic) for reloading
          extractedText: t.extractedText || '',
          lastAccessed: accessed,
          quizCount: 0,
          bestPercentage: typeof t.percentage === 'number' ? t.percentage : 0,
          attempts: 0,
          flashcardCount: t.flashcardCount || 0,
          mindmapGenerated: !!t.mindmapGenerated,
          // Prefer an AI-generated summary object if present on any practice result
          summary: t.summary || null
        })
      }
      const pack = map.get(key)
      // Prefer longer extracted text
      if ((t.extractedText || '').length > (pack.extractedText || '').length) {
        pack.extractedText = t.extractedText
      }
      // Prefer the most recent summary object
      if (t.summary) {
        const existingDate = pack.summary && pack.summary.generatedAt ? new Date(pack.summary.generatedAt) : null
        if (!existingDate || accessed > existingDate) {
          pack.summary = t.summary
        }
      }
      if (accessed > pack.lastAccessed) pack.lastAccessed = accessed
      pack.attempts += 1
      if (typeof t.percentage === 'number') {
        pack.quizCount += 1
        if (t.percentage > pack.bestPercentage) pack.bestPercentage = t.percentage
      }
      // accumulate flashcards (approx best) & mindmap flags
      if (t.flashcardCount && t.flashcardCount > pack.flashcardCount) pack.flashcardCount = t.flashcardCount
      if (t.mindmapGenerated) pack.mindmapGenerated = true
    })
    const packs = Array.from(map.values()).sort((a,b) => b.lastAccessed - a.lastAccessed)
    setStudyPacks(packs)
  }, [previousTests])

  // Rename a study pack across PracticeResult and Flashcards for current user
  const renamePack = async (pack) => {
    try {
      const newName = window.prompt('Rename study pack', pack.fileName)
      if (!newName || newName.trim() === '' || newName === pack.fileName) return
      const token = localStorage.getItem('token')
      const res = await axios.patch(`http://localhost:5001/api/practice/packs/${encodeURIComponent(pack.fileName)}/rename`, { newName: newName.trim() }, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      if (res.data && res.data.success) {
        showToast(`Renamed pack to "${newName.trim()}"`, 'success')
        // Refresh history and packs
        await loadPreviousTests()
      } else {
        showToast('Rename failed', 'error')
      }
    } catch (e) {
      console.error('Rename failed', e?.response?.data || e.message)
      showToast('Rename failed', 'error')
    }
  }

  // New states for flashcards
  const [generatedFlashcards, setGeneratedFlashcards] = useState([])
  const [loadingFlashcards, setLoadingFlashcards] = useState(false)
  const [flashcardStorageError, setFlashcardStorageError] = useState("")

  // New states for mind map
  const [generatedMindmap, setGeneratedMindmap] = useState(null)
  const [loadingMindmap, setLoadingMindmap] = useState(false)
  const [mindmapStorageError, setMindmapStorageError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      await loadPreviousTests();
    };
    fetchData();
  }, []);

  const loadPreviousTests = async (opts = {}) => {
    try {
      const token = localStorage.getItem('token');
  const page = opts.page || 1
  const limit = opts.limit || 12
      const response = await axios.get(`http://localhost:5001/api/practice/history?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = response.data || {}
      if (page === 1) setPreviousTests(data.data || [])
      else setPreviousTests(prev => [...prev, ...(data.data || [])])
      setHistoryPage(data.page || page)
      setHistoryHasMore(((data.page || page) * (data.limit || limit)) < (data.totalCount || 0))
    } catch (err) {
      console.error("Error loading previous tests:", err);
      // Fallback to localStorage
      const userId = localStorage.getItem('userId') || 'user';
      const tests = JSON.parse(localStorage.getItem(`userTests_${userId}`) || '[]');
      setPreviousTests(tests);
    }
  };

  // PDF extraction is handled in the PracticeUploaderModal -> PdfUploader component.

  const generateQuiz = async (type) => {
    setQuizType(type);
    setError("");
    if (!extractedText || extractedText.trim().length < 10) {
      setError("No extracted text found. Please upload a PDF, paste text, or add a YouTube link first.");
      return;
    }
    if (type === 'mcq') setLoadingMcq(true);
    if (type === 'qa') setLoadingQa(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5001/api/practice/generate-quiz', {
        text: extractedText,
        type: type,
        questionCount: type === 'mcq' ? 10 : 5
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setQuestions(response.data.questions);
      setView("quiz");
    } catch (err) {
      console.error("Error generating quiz:", err);
      setError("Failed to generate quiz. Please check your Cerebras API key (CEREBRAS_API_KEY) and try again.");
    } finally {
      setLoadingMcq(false);
      setLoadingQa(false);
    }
  };

  // New helper: accept payload from modal (text + youtube + fileName)
  const handleModalSubmit = async ({ text: modalText, youtube, fileName }) => {
    let newText = '';
    if (modalText) {
      newText = modalText;
    }
    if (youtube) {
      newText = (modalText ? modalText : '') + `\nYouTube: ${youtube}`;
    }
    setExtractedText(newText);
    if (fileName) setPdfFileName(fileName);
    // Persist an initial practice session immediately so it doesn't vanish when generating maps
    try {
      await initSession(newText, fileName);
    } catch (e) {
      console.warn('Failed to init session (non-fatal):', e);
    }
    // Automatically generate flashcards and mindmap
    await generateFlashcards();
    await generateMindmap();
    setView('upload');
  }

  // Save a lightweight practice session immediately (does not depend on state updates)
  // Session management: maintain sessionId so we can finalize later
  const [sessionId, setSessionId] = useState(null)

  const initSession = async (textParam, fileNameParam) => {
    const token = localStorage.getItem('token')
    const res = await axios.post('http://localhost:5001/api/practice/sessions/init', {
      fileName: fileNameParam || fileName || 'Unknown File',
      extractedText: textParam
    }, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    const sid = res.data?.data?.sessionId
    if (sid) setSessionId(sid)
    // refresh history to reflect reused or new stub
    await loadPreviousTests()
  }

  const finalizeSession = async () => {
    if (!sessionId) return
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`http://localhost:5001/api/practice/sessions/${sessionId}/finalize`, {
        quizType,
        questions,
        userAnswers,
        score
      }, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      await loadPreviousTests()
    } catch (e) {
      console.warn('Failed to finalize session:', e?.response?.data || e.message)
    }
  }

  const handleDeleteResult = async (test) => {
    try {
      const token = localStorage.getItem('token')
      const id = test._id || test.id || test.sessionId
      if (!id) return
      await axios.delete(`http://localhost:5001/api/practice/results/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      showToast('Deleted attempt', 'success')
      // Update local storage fallback
      const userId = localStorage.getItem('userId') || 'user'
      const existingTests = JSON.parse(localStorage.getItem(`userTests_${userId}`) || '[]').filter(t => (t._id||t.id||t.sessionId) !== id)
      localStorage.setItem(`userTests_${userId}`, JSON.stringify(existingTests))
      await loadPreviousTests()
    } catch (e) {
      showToast('Delete failed', 'error')
      console.error('Failed to delete result:', e?.response?.data || e.message)
    }
  }

  const handleDeletePack = async (pack) => {
    if (!confirm(`Delete all attempts for "${pack.fileName}"? This cannot be undone.`)) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://localhost:5001/api/practice/packs/${encodeURIComponent(pack.fileName)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      showToast('Deleted study pack', 'success')
      // Update local storage fallback by removing all with fileName
      const userId = localStorage.getItem('userId') || 'user'
      const existingTests = JSON.parse(localStorage.getItem(`userTests_${userId}`) || '[]').filter(t => (t.fileName||'Unknown File') !== pack.fileName)
      localStorage.setItem(`userTests_${userId}`, JSON.stringify(existingTests))
      await loadPreviousTests()
    } catch (e) {
      showToast('Delete failed', 'error')
      console.error('Failed to delete pack:', e?.response?.data || e.message)
    }
  }

  // Simple toast implementation
  const [toasts, setToasts] = useState([])
  const showToast = (msg, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }

  // Open a study pack / previous test in reader mode
  const openReaderFromItem = (item) => {
    if (!item) return
    setExtractedText(item.extractedText || '')
    setPdfFileName(item.fileName || 'Unknown File')
    setReaderSummary(null)
    setShowFullText(false)
    // auto fetch summary
    // Try to provide identifiers so backend can persist the summary
    const cacheKey = (item.sessionId || '') + '|' + (item.fileName || '')
    if (summaryCacheRef.current[cacheKey]) {
      setReaderSummary(summaryCacheRef.current[cacheKey].summary)
      setSummarySavedId(summaryCacheRef.current[cacheKey].savedTo || null)
    } else {
      const payload = { text: item.extractedText || '', sessionId: item.sessionId, resultId: item._id, fileName: item.fileName }
      fetchSummary(payload, cacheKey)
    }
    setQuestions([])
    setQuizType('')
    setCurrentQuestion(0)
    setScore(0)
    setShowScore(false)
    setSelectedAnswer(null)
    setAnswerSubmitted(false)
    setUserAnswers([])
    setCurrentAnswer('')
    setView('reader')
  }

  const startQuizFromReader = async (type) => {
    await generateQuiz(type)
  }

  const fetchSummary = async (payload, cacheKey) => {
    const text = typeof payload === 'string' ? payload : payload?.text
    if (!text || text.length < 20) return
    try {
      setLoadingSummary(true)
      const token = localStorage.getItem('token')
      const body = typeof payload === 'string' ? { text } : payload
      const res = await axios.post('http://localhost:5001/api/practice/generate-summary', body, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      let summary = res.data?.summary || null
      if (summary && typeof summary === 'string') {
        try { summary = JSON.parse(summary) } catch(e) { /* leave as string fallback */ }
      }
      setReaderSummary(summary)
      setSummarySavedId(res.data?.savedTo || null)
      if (cacheKey) summaryCacheRef.current[cacheKey] = { summary, savedTo: res.data?.savedTo }
    } catch (e) {
      console.warn('Failed to generate summary', e?.response?.data || e.message)
      setReaderSummary({ bullets: [], insight: 'Failed to load summary.' })
    } finally {
      setLoadingSummary(false)
    }
  }

  const generateNotes = async (regenerate = false) => {
    if (!extractedText || extractedText.length < 20) return
    const cacheKey = (sessionId || '') + '|' + (pdfFileName || '')
    if (!regenerate && notesCacheRef.current[cacheKey]) {
      setGeneratedNotes(notesCacheRef.current[cacheKey].notes)
      setNotesSavedId(notesCacheRef.current[cacheKey].savedTo || null)
      setShowNotesModal(true)
      return
    }
    try {
      setLoadingNotes(true)
      const token = localStorage.getItem('token')
      const res = await axios.post('http://localhost:5001/api/practice/generate-notes', {
        text: extractedText,
        sessionId,
        fileName: pdfFileName
      }, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      let notes = res.data?.notes || null
      if (notes && typeof notes === 'string') {
        try { notes = JSON.parse(notes) } catch(e) { /* leave as string */ }
      }
      setGeneratedNotes(notes)
      setNotesSavedId(res.data?.savedTo || null)
      if (cacheKey) notesCacheRef.current[cacheKey] = { notes, savedTo: res.data?.savedTo }
      setShowNotesModal(true)
    } catch (e) {
      console.error('Failed to generate notes', e?.response?.data || e.message)
      showToast('Failed to generate notes', 'error')
    } finally {
      setLoadingNotes(false)
    }
  }

  const downloadNotesPDF = () => {
    if (!generatedNotes) return

    // Helper to render LaTeX inline formulas to HTML using KaTeX (client-side fallback)
    const renderLatex = (text) => {
      if (!text) return ''
      // Replace common LaTeX patterns with readable Unicode or simple HTML
      return text
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
        .replace(/\\sum/g, '∑')
        .replace(/\\int/g, '∫')
        .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
        .replace(/\\pi/g, 'π')
        .replace(/\\times/g, '×')
        .replace(/\\div/g, '÷')
        .replace(/\^2/g, '²')
        .replace(/\^3/g, '³')
        .replace(/\\cdot/g, '·')
        .replace(/\\le/g, '≤')
        .replace(/\\ge/g, '≥')
        .replace(/\\ne/g, '≠')
        .replace(/\\approx/g, '≈')
    }

    // Create HTML content for PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${generatedNotes.title || 'Study Notes'}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
        <style>
          body { font-family: 'Georgia', serif; line-height: 1.8; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
          h1 { color: #1a202c; border-bottom: 3px solid #4299e1; padding-bottom: 10px; margin-bottom: 30px; }
          h2 { color: #2d3748; margin-top: 40px; margin-bottom: 20px; border-left: 4px solid #4299e1; padding-left: 15px; }
          h3 { color: #4a5568; margin-top: 25px; }
          p { margin-bottom: 15px; text-align: justify; }
          .intro, .conclusion { background: #f7fafc; padding: 20px; border-left: 4px solid #4299e1; margin: 20px 0; }
          ul { margin: 15px 0; padding-left: 30px; }
          li { margin-bottom: 8px; }
          .key-points { background: #e6fffa; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .examples { background: #fef5e7; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .references { background: #f0f4f8; padding: 15px; border-radius: 8px; margin-top: 30px; }
          .chapter { page-break-inside: avoid; margin-bottom: 40px; }
        </style>
      </head>
      <body>
        <h1>${renderLatex(generatedNotes.title || 'Study Notes')}</h1>
        ${generatedNotes.introduction ? `<div class="intro"><h3>Introduction</h3><p>${renderLatex(generatedNotes.introduction).replace(/\n\n/g, '</p><p>')}</p></div>` : ''}
        ${(generatedNotes.chapters || []).map(ch => `
          <div class="chapter">
            <h2>Chapter ${ch.number}: ${renderLatex(ch.title)}</h2>
            <p>${renderLatex(ch.content || '').replace(/\n\n/g, '</p><p>')}</p>
            ${ch.keyPoints && ch.keyPoints.length ? `
              <div class="key-points">
                <h3>Key Points</h3>
                <ul>${ch.keyPoints.map(kp => `<li>${renderLatex(kp)}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${ch.examples && ch.examples.length ? `
              <div class="examples">
                <h3>Examples</h3>
                <ul>${ch.examples.map(ex => `<li>${renderLatex(ex)}</li>`).join('')}</ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
        ${generatedNotes.conclusion ? `<div class="conclusion"><h3>Conclusion</h3><p>${renderLatex(generatedNotes.conclusion).replace(/\n\n/g, '</p><p>')}</p></div>` : ''}
        ${generatedNotes.references && generatedNotes.references.length ? `
          <div class="references">
            <h3>Key References</h3>
            <ul>${generatedNotes.references.map(ref => `<li>${renderLatex(ref)}</li>`).join('')}</ul>
          </div>
        ` : ''}
        <script>
          // Auto-render any remaining LaTeX delimiters (fallback for formulas wrapped in $ or $$)
          if (window.renderMathInElement) {
            window.addEventListener('load', () => {
              renderMathInElement(document.body, {
                delimiters: [
                  {left: '$$', right: '$$', display: true},
                  {left: '$', right: '$', display: false}
                ]
              });
            });
          }
        </script>
      </body>
      </html>
    `

    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    // Small delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  // Generate flashcards from the currently loaded extracted text
  const generateFlashcards = async () => {
    if (!extractedText || extractedText.length < 10) return
    setLoadingFlashcards(true)
    setFlashcardStorageError("")
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('http://localhost:5001/api/practice/generate-flashcards', {
        text: extractedText
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.status === 200) {
        const data = response.data
        setGeneratedFlashcards(data.flashcards || [])
        // Store generated flashcards in database
        try {
          await storeFlashcards(data.flashcards || [])
          console.log('Flashcards stored successfully')
        } catch (storeError) {
          console.error('Failed to store flashcards:', storeError)
          setFlashcardStorageError("Flashcards generated but failed to save to database.")
        }
        // Update session progress if we haven't done quiz yet
        if (sessionId) {
          try {
            await axios.patch(`http://localhost:5001/api/practice/sessions/${sessionId}/progress`, {
              flashcardCount: (data.flashcards || []).length
            }, {
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            })
          } catch (e) { console.warn('Failed to update flashcard progress', e?.response?.data || e.message) }
        }
      }
    } catch (error) {
      console.error('Error generating flashcards:', error)
      setFlashcardStorageError("Failed to generate flashcards.")
    } finally {
      setLoadingFlashcards(false)
    }
  }

  // Handle MCQ answer selection
  const submitMCQAnswer = (selectedOption) => {
    setSelectedAnswer(selectedOption);
    setAnswerSubmitted(true);

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = {
      question: questions[currentQuestion].question,
      userAnswer: selectedOption,
      correctAnswer: questions[currentQuestion].correctAnswer,
      isCorrect: selectedOption === questions[currentQuestion].correctAnswer
    };
    setUserAnswers(newAnswers);

    if (selectedOption === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const submitQAAnswer = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
  const response = await axios.post('http://localhost:5001/api/practice/evaluate-answer', {
        question: questions[currentQuestion].question,
        answer: currentAnswer,
        context: extractedText // Send context for better evaluation
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const evaluation = response.data.evaluation;
      
      const newAnswers = [...userAnswers];
      newAnswers[currentQuestion] = {
        question: questions[currentQuestion].question,
        userAnswer: currentAnswer,
        score: evaluation.score,
        maxMarks: evaluation.maxMarks,
        feedback: evaluation.feedback
      };
      setUserAnswers(newAnswers);
      setScore(score + evaluation.score);
      
    } catch (err) {
      console.error("Error evaluating answer:", err);
  setError("Failed to evaluate answer. Please check your Cerebras API key (CEREBRAS_API_KEY) and try again.");
    }
    
    setAnswerSubmitted(true);
    setLoading(false);
  };
  
  const nextQuestion = () => {
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setCurrentAnswer("");
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowScore(true);
      storeTestResult();
      finalizeSession();
      // Automatically generate flashcards from quiz
      generateFlashcardsFromQuiz();
    }
  };
  
  const storeTestResult = () => {
    const userId = localStorage.getItem('userId') || 'user';
    const testResult = {
      id: Date.now(),
      fileName: pdfFileName || 'Unknown File',
      quizType,
      extractedText,
      questions,
      score,
      totalQuestions: questions.length,
      maxScore: quizType === 'mcq' ? questions.length : questions.length * 10,
      percentage: Math.round((score / (quizType === 'mcq' ? questions.length : questions.length * 10)) * 100),
      userAnswers,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString()
    };
  
    const existingTests = JSON.parse(localStorage.getItem(`userTests_${userId}`) || '[]');
    existingTests.push(testResult);
    localStorage.setItem(`userTests_${userId}`, JSON.stringify(existingTests));
    
    // Store in backend (implement API call)
    storeInDatabase(testResult);
  };

  const storeInDatabase = async (testResult) => {
    try {
      const token = localStorage.getItem('token');
      
      // Debug logging
      console.log('Frontend - testResult:', testResult);
      console.log('Frontend - extractedText type:', typeof extractedText);
      console.log('Frontend - questions type:', typeof questions);
      console.log('Frontend - questions value:', questions);
      
      const payload = {
        ...testResult
      };
      
      console.log('Frontend - sending payload:', payload);
      
  await axios.post('http://localhost:5001/api/practice/results', payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Frontend - successfully stored result');
    } catch (err) {
      console.error("Error storing test result:", err);
      if (err.response) {
        console.error("Error response:", err.response.data);
      }
    }
  };
  
  const resetPractice = () => {
    setView("upload");
    setPdfFileName('');
    setExtractedText("");
    setQuizType("");
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setUserAnswers([]);
    setCurrentAnswer("");
    setSelectedTest(null);
  };

  const viewPreviousTest = (test) => {
    setSelectedTest(test);
    setView("history");
  };

  // ref to scroll to the extracted text preview when loading a previous test
  const previewRef = useRef(null)

  const generateFlashcardsFromQuiz = async () => {
    if (!questions || questions.length === 0) return
    setLoadingFlashcards(true)
    setFlashcardStorageError("")
    // Compile quiz questions and answers into text
    let quizText = "Quiz Content:\n"
    questions.forEach((q, index) => {
      quizText += `Question ${index + 1}: ${q.question}\n`
      if (q.options) {
        q.options.forEach((opt, i) => {
          quizText += `${String.fromCharCode(65 + i)}. ${opt}\n`
        })
        quizText += `Correct Answer: ${q.correctAnswer}\n\n`
      } else {
        // For Q&A, use user answers or placeholder
        const userAns = userAnswers[index]?.userAnswer || "Not answered"
        quizText += `Answer: ${userAns}\n\n`
      }
    })
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('http://localhost:5001/api/practice/generate-flashcards', {
        text: quizText
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.status === 200) {
        const data = response.data
        setGeneratedFlashcards(data.flashcards || [])
        // Store generated flashcards in database
        try {
          await storeFlashcards(data.flashcards || [])
          console.log('Quiz flashcards stored successfully')
        } catch (storeError) {
          console.error('Failed to store quiz flashcards:', storeError)
          setFlashcardStorageError("Flashcards generated but failed to save to database.")
        }
      }
    } catch (error) {
      console.error('Error generating flashcards from quiz:', error)
      setFlashcardStorageError("Failed to generate flashcards from quiz.")
    } finally {
      setLoadingFlashcards(false)
    }
  }

  // New function: generate mind map from extracted text
  const generateMindmap = async () => {
    if (!extractedText || extractedText.length < 10) return
    setLoadingMindmap(true)
    setMindmapStorageError("")
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('http://localhost:5001/api/practice/generate-mindmap', {
        text: extractedText
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.status === 200) {
        const data = response.data
        setGeneratedMindmap(data.mindmap || {})
        // Store generated mind map in database
        try {
          await storeMindmap(data.mindmap || {})
          console.log('Mind map stored successfully')
        } catch (storeError) {
          console.error('Failed to store mind map:', storeError)
          setMindmapStorageError("Mind map generated but failed to save to database.")
        }
        if (sessionId) {
          try {
            await axios.patch(`http://localhost:5001/api/practice/sessions/${sessionId}/progress`, {
              mindmapGenerated: true
            }, {
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            })
          } catch (e) { console.warn('Failed to update mindmap progress', e?.response?.data || e.message) }
        }
      }
    } catch (error) {
      console.error('Error generating mind map:', error)
      setMindmapStorageError("Failed to generate mind map.")
    } finally {
      setLoadingMindmap(false)
    }
  }

  const storeMindmap = async (mindmap) => {
    const token = localStorage.getItem('token')
    try {
      await axios.post('http://localhost:5001/api/mindmaps', {
        title: mindmap.title || 'Untitled Mind Map',
        // Prefer explicit content; if not available, save a JSON snapshot
        content: mindmap.content || JSON.stringify({ title: mindmap.title, nodes: mindmap.nodes, connections: mindmap.connections }),
        nodes: mindmap.nodes || [],
        connections: mindmap.connections || []
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      console.error('Error storing mind map:', error)
      setMindmapStorageError("Failed to save mind map to database.")
    }
  }

  // Store generated flashcards in bulk and associate them with a pack (fileName/sessionId)
  const storeFlashcards = async (cards) => {
    if (!cards || !Array.isArray(cards) || cards.length === 0) return
    const token = localStorage.getItem('token')
    try {
      const payload = {
        cards: cards.map(c => ({ front: (c.front||c.question||'').toString(), back: (c.back||c.answer||'').toString() })),
        packName: pdfFileName || null,
        sessionId: sessionId || null
      }
      const res = await axios.post('http://localhost:5001/api/flashcards/bulk', payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (res.status === 201) {
        showToast(`${res.data.count || cards.length} flashcards saved to pack`, 'success')
        try { await loadPreviousTests() } catch (e) { /* non-fatal */ }
        return true
      } else {
        console.error('Bulk save unexpected response', res)
        showToast('Failed to save flashcards', 'error')
        throw new Error('Bulk save failed')
      }
    } catch (e) {
      console.error('Bulk save error', e)
      showToast('Failed to save flashcards', 'error')
      throw e
    }
  }

  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#FFF9F0] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header (hidden in reader to use custom header) */}
        {view !== 'reader' && (
          <div className="mb-8">
            <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
              <div>
                <h1 className="text-xl font-semibold">Practice Center</h1>
                <p className="text-sm text-gray-500">Generate quizzes and flashcards from your documents</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/classroom/mindmaps"
                  className="px-4 py-2 rounded-md text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  Mind Maps
                </a>
                <PracticeUploaderModal onSubmit={handleModalSubmit} />
              </div>
            </div>
          </div>
        )}

        {/* Reader View */}
        {view === 'reader' && (
          <div className="mb-8 space-y-6">
            <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('upload')} className="text-sm text-gray-600 hover:text-gray-800">← Back</button>
                <div>
                  <h1 className="text-xl font-semibold truncate max-w-xs" title={pdfFileName}>{pdfFileName || 'Study Pack'}</h1>
                  <p className="text-sm text-gray-500">Focused reading & study tools</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={decreaseReaderFont} className="px-2 py-1 text-sm border rounded hover:bg-gray-50">A-</button>
                <button onClick={increaseReaderFont} className="px-2 py-1 text-sm border rounded hover:bg-gray-50">A+</button>
                <PracticeUploaderModal onSubmit={handleModalSubmit} />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6 items-start">
              <div className="md:col-span-2 bg-white rounded-2xl shadow p-6 border border-gray-200 h-[70vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">{showFullText ? 'Full Document' : 'AI Summary'}</h2>
                  {extractedText && <button onClick={()=> setShowFullText(s=>!s)} className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition">{showFullText ? 'View Summary' : 'View Full Text'}</button>}
                </div>
                <div className="overflow-y-auto pr-2 custom-scrollbar space-y-4" style={{fontSize: readerFontSize}}>
                  {!showFullText && (
                    <div>
                      {loadingSummary && <p className="text-gray-500 text-sm">Generating summary...</p>}
                      {!loadingSummary && readerSummary && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">{summarySavedId ? 'Saved' : 'Not saved'}</p>
                            <button onClick={()=> {
                              const key = (sessionId||'') + '|' + (pdfFileName||'')
                              fetchSummary({ text: extractedText, sessionId, fileName: pdfFileName }, key)
                            }} disabled={loadingSummary} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Regenerate</button>
                          </div>
                          {/* Overview if present */}
                          {readerSummary.overview && (
                            <p className="text-gray-700 mb-3">{readerSummary.overview}</p>
                          )}

                          {/* Key points (new schema) or bullets (legacy) */}
                          <ul className="list-disc pl-5 space-y-1 text-gray-700">
                            {(readerSummary.keyPoints || readerSummary.bullets || []).map((b,i)=>(<li key={i} className="leading-snug">{b}</li>))}
                          </ul>

                          {/* Sections (optional detailed breakdown) */}
                          {Array.isArray(readerSummary.sections) && readerSummary.sections.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {readerSummary.sections.map((s, idx) => (
                                <div key={idx} className="p-2 bg-gray-50 rounded">
                                  <p className="text-xs font-semibold text-gray-800">{s.title}</p>
                                  <p className="text-sm text-gray-600">{s.summary}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {readerSummary.insight && <p className="text-sm font-medium text-purple-700 bg-purple-50 border border-purple-100 rounded-lg p-3">Key Insight: {readerSummary.insight}</p>}

                          {(!(readerSummary.keyPoints || readerSummary.bullets || (readerSummary.sections && readerSummary.sections.length))) && <p className="text-sm text-gray-500">No structured summary available.</p>}
                        </div>
                      )}
                      {!loadingSummary && !readerSummary && <p className="text-sm text-gray-400">No summary yet.</p>}
                    </div>
                  )}
                  {showFullText && (
                    <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{extractedText || 'No content loaded.'}</p>
                  )}
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-800 mb-3">Study Tools</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Quiz</p>
                      <div className="flex gap-2">
                        <button onClick={() => startQuizFromReader('mcq')} className="flex-1 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm">MCQ</button>
                        <button onClick={() => startQuizFromReader('qa')} className="flex-1 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm">Q&A</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Flashcards</p>
                      <button onClick={generateFlashcards} disabled={loadingFlashcards} className="w-full px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm disabled:opacity-50">{loadingFlashcards ? 'Generating...' : 'Generate / Refresh'}</button>
                      {generatedFlashcards.length > 0 && <p className="text-xs text-emerald-600 mt-2">{generatedFlashcards.length} flashcards ready</p>}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Mind Map</p>
                      <button onClick={generateMindmap} disabled={loadingMindmap} className="w-full px-3 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm disabled:opacity-50">{loadingMindmap ? 'Generating...' : generatedMindmap ? 'Regenerate' : 'Generate'}</button>
                      {generatedMindmap && <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-2 text-xs text-purple-700">Mind map generated • <a href="/classroom/mindmaps" className="underline">View</a></div>}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Actions</p>
                      <div className="flex flex-wrap gap-2">
                        <a href="/classroom/flashcards" className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs hover:bg-emerald-100">Flashcards</a>
                        <a href="/classroom/mindmaps" className="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-xs hover:bg-purple-100">Mind Maps</a>
                        <button onClick={() => generateNotes()} disabled={loadingNotes} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 disabled:opacity-50">{loadingNotes ? 'Loading...' : 'Notes'}</button>
                      </div>
                    </div>
                  </div>
                </div>
                {generatedFlashcards.length > 0 && (
                  <div className="bg-white rounded-2xl shadow border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800">Flashcards ({generatedFlashcards.length})</h3>
                      <a href="/classroom/flashcards" className="text-xs text-emerald-600 hover:text-emerald-700 underline">View All</a>
                    </div>
                    <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                      {generatedFlashcards.slice(0,6).map((card,i)=>{
                        const front = card.question || card.front || '';
                        const back = card.answer || card.back || '';
                        const isFlipped = flippedCards[`flashcard-${i}`] || false;
                        return (
                          <div
                            key={i}
                            onClick={() => setFlippedCards(prev => ({ ...prev, [`flashcard-${i}`]: !prev[`flashcard-${i}`] }))}
                            className="group relative bg-gradient-to-br from-white via-emerald-50/30 to-blue-50/30 rounded-xl p-4 shadow-md border border-emerald-100/50 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-102"
                            style={{
                              backgroundImage: `linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)`,
                              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)'
                            }}
                          >
                            {/* Card number badge */}
                            <div className="absolute -top-2 -left-2">
                              <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                                #{i + 1}
                              </div>
                            </div>

                            {/* Flip indicator */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="text-[10px] text-emerald-600 bg-white/80 px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                                Click to flip
                              </div>
                            </div>

                            {/* Question side */}
                            {!isFlipped && (
                              <div className="mt-2">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"></div>
                                  <p className="text-emerald-700 text-[10px] font-semibold uppercase tracking-wide">Question</p>
                                </div>
                                <p className="text-gray-800 text-xs leading-relaxed font-medium line-clamp-3">
                                  {front}
                                </p>
                              </div>
                            )}

                            {/* Answer side */}
                            {isFlipped && (
                              <div className="mt-2">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                                  <p className="text-blue-700 text-[10px] font-semibold uppercase tracking-wide">Answer</p>
                                </div>
                                <p className="text-gray-700 text-xs leading-relaxed line-clamp-3">
                                  {back}
                                </p>
                              </div>
                            )}

                            {/* Hover effect overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-blue-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                          </div>
                        );
                      })}
                    </div>
                    {generatedFlashcards.length > 6 && (
                      <p className="text-[10px] text-gray-500 mt-3 text-center">
                        + {generatedFlashcards.length - 6} more flashcards • <a href="/classroom/flashcards" className="text-emerald-600 hover:underline">View all</a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload PDF Section */}
        {view === "upload" && (
          <div className="mx-6 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-t-2xl border-b border-gray-100">
              <div className="flex items-center justify-center gap-3 mb-2">
                <FileText className="w-8 h-8 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">PDF Practice Generator</h1>
              </div>
              <p className="text-sm text-gray-600">Upload a PDF to generate personalized quizzes and practice questions</p>
            </div>

            {!extractedText ? (
              <div className="p-8">
                <div className="text-center py-8">
                  <p className="text-base text-gray-700 mb-2">Click <strong className="text-purple-600">Upload New Content</strong> to upload a PDF, paste text, or add a YouTube link.</p>
                  <p className="text-sm text-gray-500">After you submit content, choose a quiz type to generate questions.</p>
                </div>
              </div>
            ) : (
              <div className="mx-6 space-y-8 p-8">
                <div ref={previewRef} className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Extracted Text Preview</h3>
                  <p className="text-gray-600 text-sm line-clamp-4">{extractedText}</p>
                </div>
                
                {/* Generated Flashcards Section */}
                {generatedFlashcards.length > 0 && (
                  <div className="rounded-2xl overflow-hidden border border-emerald-200 shadow-sm">
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-5 border-b border-emerald-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Generated Flashcards</h3>
                        <span className="px-3 py-1 rounded-full bg-white/90 text-emerald-700 text-sm font-semibold shadow-sm">{generatedFlashcards.length} cards</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {flashcardStorageError || "Saved and ready to study in the Flashcards section"}
                      </p>
                    </div>
                    <div className="p-5 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generatedFlashcards.slice(0, 6).map((card, index) => (
                          <div key={index} className="group rounded-xl p-4 bg-gradient-to-br from-emerald-50/50 to-blue-50/50 border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all">
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-emerald-700 mb-1.5 uppercase tracking-wide">Question</p>
                              <p className="text-sm text-gray-800 leading-relaxed">{card.question || card.front}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-blue-700 mb-1.5 uppercase tracking-wide">Answer</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{card.answer || card.back}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {generatedFlashcards.length > 6 && (
                        <div className="mt-4 text-center">
                          <a href="/classroom/flashcards" className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                            View all {generatedFlashcards.length} flashcards →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 justify-center mt-6">
                  <button
                    onClick={() => generateMindmap()}
                    disabled={loadingMindmap}
                    className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                  >
                    {loadingMindmap ? 'Generating...' : 'Generate Mind Map'}
                  </button>
                  <button
                    onClick={async () => { await generateMindmap(); router.push('/classroom/mindmaps') }}
                    disabled={loadingMindmap}
                    className="bg-purple-200 hover:bg-purple-300 text-purple-800 py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                  >
                    {loadingMindmap ? 'Generating...' : 'Generate & View'}
                  </button>
                </div>

                {/* Generated Mindmap Section */}
                {generatedMindmap && generatedMindmap.nodes && generatedMindmap.nodes.length > 0 && (
                  <div className="rounded-2xl overflow-hidden border border-purple-200 shadow-sm">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-5 border-b border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900">Generated Mind Map</h3>
                        <span className="px-3 py-1 rounded-full bg-white/90 text-purple-700 text-sm font-semibold shadow-sm">{generatedMindmap.title || 'Mind Map'}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {mindmapStorageError || "Saved and ready to explore in the Mind Maps section"}
                      </p>
                    </div>
                    <div className="p-5 bg-white">
                      <div className="bg-gradient-to-br from-purple-50/30 to-blue-50/30 rounded-xl p-4 border border-purple-100">
                        <MindMapInteractive
                          nodes={generatedMindmap.nodes || []}
                          connections={generatedMindmap.connections || []}
                          style={{ width: '100%', height: '400px' }}
                        />
                      </div>
                      <div className="mt-4 text-center">
                        <a href="/classroom/mindmaps" className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
                          <Brain className="w-4 h-4" />
                          Open Mind Maps Library
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Choose Quiz Type</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => generateQuiz("mcq")}
                      disabled={loadingMcq || loadingQa}
                      className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {loadingMcq ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileQuestion className="w-5 h-5" />}
                        <span>MCQs (10 Questions)</span>
                      </div>
                    </button>
                    <button
                      onClick={() => generateQuiz("qa")}
                      disabled={loadingMcq || loadingQa}
                      className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {loadingQa ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        <span>Q&A (5 Questions)</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recently Accessed & Study Packs (display when we have history) */}
            {previousTests.length > 0 && (
              <div className="mx-6 mt-12 space-y-12">
                {/* Recently Accessed */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-gray-700" />
                    <h2 className="text-xl font-semibold text-gray-800">Recently Accessed</h2>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {previousTests.slice(0,3).map((t,i) => (
                      <div 
                        key={t.sessionId || t._id || t.id || i} 
                        onClick={() => openReaderFromItem(t)}
                        className="group relative rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer"
                      >
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-100">
                          <div className="flex justify-between items-start mb-1">
                            <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wide bg-white/90 text-purple-700 px-2.5 py-1 rounded-full shadow-sm">
                              {t.quizType?.toUpperCase()||'PACK'}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">{(t.date)|| new Date(t.createdAt||t.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 mb-2 text-base line-clamp-1" title={t.fileName}>{t.fileName}</h3>
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-4 h-[2.5em]">{(t.extractedText||'No content available').slice(0,140)}</p>
                          <div className="flex items-center gap-3 mb-3">
                            {typeof t.score === 'number' && t.maxScore ? (
                              <span className="text-xs font-medium text-gray-700">Score: <span className="text-blue-600">{t.score}/{t.maxScore}</span></span>
                            ) : (
                              <span className="text-xs text-gray-500">{t.status==='incomplete'?'Incomplete':'Ready'}</span>
                            )}
                            {typeof t.percentage === 'number' && !isNaN(t.percentage) && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                                <Trophy className="w-3 h-3" />{t.percentage}%
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteResult(t); }}
                            className="w-full text-xs text-red-500 hover:text-red-700 font-medium py-1.5 border-t border-gray-100 transition-colors"
                          >Delete Attempt</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Study Packs */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Package2 className="w-5 h-5 text-gray-700" />
                    <h2 className="text-xl font-semibold text-gray-800">All Study Packs</h2>
                  </div>
                  {studyPacks.length === 0 ? (
                    <p className="text-sm text-gray-500">No study packs yet. Generate a quiz to create your first pack.</p>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {studyPacks.map((pack, idx) => (
                        <div 
                          key={pack.fileName+idx} 
                          onClick={() => openReaderFromItem(pack)}
                          className="group relative rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-xl hover:border-purple-200 transition-all duration-300 cursor-pointer"
                        >
                          {/* Header with gradient background */}
                          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-5 border-b border-gray-100">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-bold text-gray-900 text-base leading-tight flex-1 pr-2" title={pack.fileName}>
                                {pack.fileName}
                              </h3>
                              <button 
                                onClick={(e) => { e.stopPropagation(); renamePack(pack); }} 
                                className="flex-shrink-0 p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-500 hover:text-purple-600 transition-colors shadow-sm"
                                title="Rename pack"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2.5 py-1 rounded-full bg-white/90 text-gray-600 font-medium shadow-sm">
                                {pack.attempts} {pack.attempts===1?'attempt':'attempts'}
                              </span>
                              <span className="text-gray-500">
                                • {pack.lastAccessed.toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Content area */}
                          <div className="p-5">
                            {/* AI Summary or excerpt */}
                            <p className="text-sm text-gray-600 leading-relaxed mb-4 h-[3.6em] line-clamp-3">
                              {(pack.summary && (pack.summary.overview || (pack.summary.keyPoints && pack.summary.keyPoints.join(' ')))) 
                                ? (pack.summary.overview || pack.summary.keyPoints.join(' ')).slice(0,180)
                                : (pack.extractedText||'No description available.').slice(0,180)}
                            </p>

                            {/* Stats badges */}
                            <div className="flex flex-wrap gap-2 mb-5">
                              {pack.quizCount>0 && (
                                <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-100">
                                  <Trophy className="w-3 h-3" />
                                  Best {pack.bestPercentage}%
                                </span>
                              )}
                              {pack.flashcardCount>0 && (
                                <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                                  <FileText className="w-3 h-3" />
                                  {pack.flashcardCount} Cards
                                </span>
                              )}
                              {pack.mindmapGenerated && (
                                <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-medium border border-purple-100">
                                  <Brain className="w-3 h-3" />
                                  Mind Map
                                </span>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); openReaderFromItem(pack); generateNotes(); }} 
                                className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 py-2.5 text-sm font-medium transition-colors border border-gray-200"
                              >
                                <BookOpen className="w-4 h-4"/> Notes
                              </button>
                              <a 
                                href="/classroom/flashcards" 
                                onClick={(e)=> e.stopPropagation()} 
                                className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 py-2.5 text-sm font-medium transition-colors border border-emerald-200"
                              >
                                <FileText className="w-4 h-4"/> Flashcards
                              </a>
                            </div>

                            {/* Footer actions */}
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                              <button 
                                onClick={(e) => { e.stopPropagation(); viewPreviousTest(previousTests.find(pt=> (pt.fileName||'Unknown File')===pack.fileName && pt.percentage===pack.bestPercentage) || previousTests.find(pt=> (pt.fileName||'Unknown File')===pack.fileName))}} 
                                className="text-xs text-gray-500 hover:text-purple-600 font-medium transition-colors"
                              >
                                View Details →
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeletePack(pack); }} 
                                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Load more history */}
            {historyHasMore && (
              <div className="mx-6 mt-6 text-center">
                <button onClick={async () => { await loadPreviousTests({ page: historyPage + 1 }); }} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200">Load more</button>
              </div>
            )}
          </div>
        )}

        {/* Previous Tests Section */}
        {view === "history" && !selectedTest && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Previous Tests</h2>
            {previousTests.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No previous tests found</p>
                <button
                  onClick={() => setView("upload")}
                  className="mt-4 bg-purple-500 hover:bg-purple-600 text-white py-2 px-6 rounded-lg font-medium transition-all"
                >
                  Create Your First Test
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {previousTests.map((test, i) => {
                  const status = test.status || (test.percentage ? 'completed' : 'incomplete');
                  const badges = [];
                  if (status === 'completed') badges.push({ label: 'Completed', color: 'bg-green-100 text-green-700' });
                  if (status === 'incomplete') badges.push({ label: 'Incomplete', color: 'bg-yellow-100 text-yellow-700' });
                  if (status === 'archived') badges.push({ label: 'Archived', color: 'bg-gray-200 text-gray-700' });
                  if (test.flashcardCount > 0) badges.push({ label: `${test.flashcardCount} Flashcards`, color: 'bg-emerald-100 text-emerald-700' });
                  if (test.mindmapGenerated) badges.push({ label: 'Mind Map', color: 'bg-purple-100 text-purple-700' });
                  const canResume = status === 'incomplete' && (!test.questions || test.questions.length === 0);
                  return (
                    <div key={test.sessionId || test.id || test._id || i} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 mb-1 truncate" title={test.fileName}>{test.fileName}</h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {badges.map((b, idx) => (
                              <span key={idx} className={`px-2 py-0.5 rounded text-xs font-medium ${b.color}`}>{b.label}</span>
                            ))}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            {typeof test.score === 'number' && typeof test.maxScore === 'number' && test.maxScore > 0 && (
                              <span>Score: {test.score}/{test.maxScore} ({test.percentage}%)</span>
                            )}
                            {test.date && <span>{test.date}</span>}
                            {test.status === 'archived' && test.archivedAt && <span>Archived</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => viewPreviousTest(test)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                          >
                            <Eye className="w-4 h-4 inline mr-1" /> View
                          </button>
                          {canResume && (
                            <button
                              onClick={() => {
                                setExtractedText(test.extractedText || '');
                                setPdfFileName(test.fileName || '');
                                setQuizType('');
                                setQuestions([]);
                                setScore(0);
                                setShowScore(false);
                                setSelectedAnswer(null);
                                setAnswerSubmitted(false);
                                setUserAnswers([]);
                                setCurrentAnswer('');
                                setView('upload');
                              }}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                            >Resume</button>
                          )}
                        </div>
                      </div>
                      {(test.flashcardCount > 0 || test.mindmapGenerated) && (
                        <div className="mt-3 border-t pt-3 flex flex-wrap gap-3 text-xs">
                          {test.flashcardCount > 0 && (
                            <a href="/classroom/flashcards" className="text-emerald-700 hover:underline">View Flashcards</a>
                          )}
                          {test.mindmapGenerated && (
                            <a href="/classroom/mindmaps" className="text-purple-700 hover:underline">View Mind Maps</a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Test Details View */}
        {view === "history" && selectedTest && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Test Results: {selectedTest.fileName}</h2>
              <button
                onClick={() => setSelectedTest(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Tests
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{selectedTest.score}</p>
                  <p className="text-sm text-gray-600">Total Score</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{selectedTest.percentage}%</p>
                  <p className="text-sm text-gray-600">Percentage</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{selectedTest.totalQuestions}</p>
                  <p className="text-sm text-gray-600">Questions</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Question-wise Analysis</h3>
              {selectedTest.userAnswers.map((answer, index) => (
                <div key={answer.question ? `${index}-${answer.question.slice(0,40)}` : index} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-medium text-gray-800 mb-2">Q{index + 1}: {answer.question}</p>
                  <p className="text-gray-600 mb-2">Your Answer: {answer.userAnswer}</p>
                  {answer.isCorrect !== undefined ? (
                    <div className={`text-sm ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {answer.isCorrect ? '✓ Correct' : `✗ Incorrect. Correct answer: ${answer.correctAnswer}`}
                    </div>
                  ) : (
                    <div className="text-sm">
                      <p className="text-blue-600">Score: {answer.score}/{answer.maxMarks}</p>
                      <p className="text-gray-600 italic">{answer.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Quiz Section */}
        {view === "quiz" && questions.length > 0 && !showScore && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-purple-600 font-medium">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span className="text-gray-600">
                  Score: {quizType === 'mcq' ? score : `${score}/${questions.length * 10}`}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                {questions[currentQuestion].question}
              </h3>
              
              {quizType === 'mcq' ? (
                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option, index) => (
                    <button
                      key={option ? `${index}-${option.slice(0,40)}` : index}
                      onClick={() => !answerSubmitted && submitMCQAnswer(option)}
                      disabled={answerSubmitted}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        answerSubmitted ? 
                          option === questions[currentQuestion].correctAnswer ? 
                            'bg-green-50 border-green-500 text-green-700' :
                            option === selectedAnswer ? 
                              'bg-red-50 border-red-500 text-red-700' :
                              'bg-gray-50 border-gray-200 text-gray-500' :
                          selectedAnswer === option ?
                            'bg-purple-50 border-purple-500 text-purple-700' :
                            'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      } ${answerSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                      {option}
                      {answerSubmitted && option === questions[currentQuestion].correctAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto inline" />
                      )}
                      {answerSubmitted && option === selectedAnswer && option !== questions[currentQuestion].correctAnswer && (
                        <XCircle className="w-5 h-5 text-red-500 ml-auto inline" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    disabled={answerSubmitted}
                    className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none disabled:bg-gray-50"
                    placeholder="Write your answer here..."
                  />
                  {!answerSubmitted && (
                    <button
                      onClick={submitQAAnswer}
                      disabled={!currentAnswer.trim() || loading}
                      className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-6 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                          Evaluating...
                        </>
                      ) : (
                        "Submit Answer"
                      )}
                    </button>
                  )}
                  {answerSubmitted && userAnswers[currentQuestion] && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="font-medium text-blue-800 mb-2">
                        Score: {userAnswers[currentQuestion].score}/{userAnswers[currentQuestion].maxMarks}
                      </p>
                      <p className="text-blue-700">{userAnswers[currentQuestion].feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {answerSubmitted && (
              <div className="mt-6">
                <button
                  onClick={nextQuestion}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                >
                  {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {showScore && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 text-center">
            <div className="mb-8">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
              <p className="text-lg text-gray-600 mb-6">File: {pdfFileName || 'N/A'}</p>
              
              <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-8">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-2xl font-bold text-blue-600">{score}</p>
                  <p className="text-sm text-gray-600">Your Score</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-2xl font-bold text-green-600">
                    {quizType === 'mcq' ? questions.length : questions.length * 10}
                  </p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round((score / (quizType === 'mcq' ? questions.length : questions.length * 10)) * 100)}%
                  </p>
                  <p className="text-sm text-gray-600">Percentage</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetPractice}
                className="py-3 px-6 rounded-xl bg-gray-500 hover:bg-gray-600 text-white font-medium transition-all duration-300"
              >
                New Test
              </button>
              <button
                onClick={() => {setView("history"); loadPreviousTests();}}
                className="py-3 px-6 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-all duration-300"
              >
                View All Tests
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Notes Modal */}
        {showNotesModal && generatedNotes && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowNotesModal(false)}>
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">{generatedNotes.title || 'Study Notes'}</h2>
                  <p className="text-sm text-white/80 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {notesSavedId ? 'Saved to database' : 'Not saved'}
                    {generatedNotes.generatedAt && ` • ${new Date(generatedNotes.generatedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadNotesPDF} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition backdrop-blur-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button onClick={() => generateNotes(true)} disabled={loadingNotes} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition backdrop-blur-sm disabled:opacity-50">
                    {loadingNotes ? 'Regenerating...' : 'Regenerate'}
                  </button>
                  <button onClick={() => setShowNotesModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none">
                {/* Introduction */}
                {generatedNotes.introduction && (
                  <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Introduction
                    </h3>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {renderLatex(generatedNotes.introduction)}
                    </div>
                  </div>
                )}

                {/* Chapters */}
                {generatedNotes.chapters && generatedNotes.chapters.map((chapter, idx) => (
                  <div key={idx} className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-purple-300 flex items-center gap-3">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                        {chapter.number}
                      </span>
                      {renderLatex(chapter.title)}
                    </h2>
                    
                    <div className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
                      {renderLatex(chapter.content)}
                    </div>

                    {/* Key Points */}
                    {chapter.keyPoints && chapter.keyPoints.length > 0 && (
                      <div className="mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg">
                        <h3 className="text-sm font-semibold text-emerald-900 mb-2 uppercase tracking-wide flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          Key Points
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {chapter.keyPoints.map((point, i) => (
                            <li key={i}>{renderLatex(point)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Examples */}
                    {chapter.examples && chapter.examples.length > 0 && (
                      <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                        <h3 className="text-sm font-semibold text-amber-900 mb-2 uppercase tracking-wide flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                          Examples
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {chapter.examples.map((example, i) => (
                            <li key={i}>{renderLatex(example)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}

                {/* Conclusion */}
                {generatedNotes.conclusion && (
                  <div className="mt-8 p-6 bg-purple-50 border-l-4 border-purple-500 rounded-r-lg">
                    <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Conclusion
                    </h3>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {renderLatex(generatedNotes.conclusion)}
                    </div>
                  </div>
                )}

                {/* References */}
                {generatedNotes.references && generatedNotes.references.length > 0 && (
                  <div className="mt-8 p-6 bg-gray-50 border-l-4 border-gray-400 rounded-r-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      Key References
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {generatedNotes.references.map((ref, i) => (
                        <li key={i}>{renderLatex(ref)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toasts */}
        <div className="fixed right-6 bottom-6 z-50 space-y-2">
          {toasts.map(t => (
            <div key={t.id} className={`px-4 py-2 rounded-lg text-sm shadow-lg ${t.type==='success'? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : t.type==='error' ? 'bg-red-50 text-red-800 border border-red-100' : 'bg-gray-50 text-gray-800 border border-gray-100'}`}>
              {t.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}