"use client"
import { useState, useEffect } from "react"
import { Brain, CheckCircle2, XCircle, Trophy, Loader2, Upload, FileText, History, Eye } from "lucide-react"
import axios from "axios"
import * as pdfjs from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url'

export default function Practice() {
  const [view, setView] = useState("upload") // "upload", "quiz", "history"
  const [pdfFile, setPdfFile] = useState(null)
  const [extractedText, setExtractedText] = useState("")
  const [quizType, setQuizType] = useState("") // "mcq" or "qa"
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [showScore, setShowScore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [userAnswers, setUserAnswers] = useState([])
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [previousTests, setPreviousTests] = useState([])
  const [selectedTest, setSelectedTest] = useState(null)

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    loadPreviousTests();
  }, []);

  const loadPreviousTests = async () => {
    try {
      const token = localStorage.getItem('token');
  const response = await axios.get('http://localhost:5001/api/practice/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setPreviousTests(response.data.data);
    } catch (err) {
      console.error("Error loading previous tests:", err);
      // Fallback to localStorage
      const userId = localStorage.getItem('userId') || 'user';
      const tests = JSON.parse(localStorage.getItem(`userTests_${userId}`) || '[]');
      setPreviousTests(tests);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError("");
    } else {
      setError("Please upload a PDF file");
    }
  };

  const extractTextFromPDF = async () => {
    if (!pdfFile) return;
    
    setLoading(true);
    setError("");
    
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        fullText += `\n--- Page ${i} ---\n${pageText}\n`;
      }

      setExtractedText(fullText.trim());
    } catch (err) {
      console.error('PDF extraction error:', err);
      setError("Failed to extract text from PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async (type) => {
    setQuizType(type);
    setLoading(true);
    setError("");
    
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
      setLoading(false);
    }
  };


  
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
    }
  };
  
  const storeTestResult = () => {
    const userId = localStorage.getItem('userId') || 'user';
    const testResult = {
      id: Date.now(),
      fileName: pdfFile?.name || 'Unknown File',
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
    setPdfFile(null);
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

  return (
    <div className="min-h-screen bg-[#FFF9F0] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <div className="flex space-x-4 bg-white rounded-xl p-2 shadow-sm">
            <button
              onClick={() => setView("upload")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                view === "upload" 
                  ? "bg-purple-500 text-white shadow-md" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Upload className="w-5 h-5 inline mr-2" />
              Upload PDF
            </button>
            <button
              onClick={() => {setView("history"); loadPreviousTests();}}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                view === "history" 
                  ? "bg-purple-500 text-white shadow-md" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <History className="w-5 h-5 inline mr-2" />
              Previous Tests ({previousTests.length})
            </button>
          </div>
        </div>

        {/* Upload PDF Section */}
        {view === "upload" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="text-center mb-8">
              <FileText className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">PDF Practice Generator</h1>
              <p className="text-gray-600">Upload a PDF to generate personalized quizzes and practice questions</p>
            </div>

            {!extractedText ? (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-purple-200 rounded-xl p-8 text-center hover:border-purple-300 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer flex flex-col items-center space-y-4"
                  >
                    <Upload className="w-12 h-12 text-purple-400" />
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        {pdfFile ? pdfFile.name : "Choose PDF file"}
                      </p>
                      <p className="text-sm text-gray-500">Click to select or drag and drop</p>
                    </div>
                  </label>
                </div>
                
                {pdfFile && (
                  <button
                    onClick={extractTextFromPDF}
                    disabled={loading}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                        Extracting Text...
                      </>
                    ) : (
                      "Extract Text from PDF"
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Extracted Text Preview</h3>
                  <p className="text-gray-600 text-sm line-clamp-4">{extractedText}</p>
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Choose Quiz Type</h3>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => generateQuiz("mcq")}
                      disabled={loading}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-4 px-8 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> : null}
                      Generate MCQs (10 Questions)
                    </button>
                    <button
                      onClick={() => generateQuiz("qa")}
                      disabled={loading}
                      className="bg-green-500 hover:bg-green-600 text-white py-4 px-8 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> : null}
                      Generate Q&A (5 Questions)
                    </button>
                  </div>
                </div>
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
                {previousTests.map((test) => (
                  <div key={test.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-2">{test.fileName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {test.quizType === 'mcq' ? 'Multiple Choice' : 'Question & Answer'}
                          </span>
                          <span>Score: {test.score}/{test.maxScore} ({test.percentage}%)</span>
                          <span>{test.date}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => viewPreviousTest(test)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
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
                <div key={index} className="border border-gray-200 rounded-xl p-4">
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
                      key={index}
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
              <p className="text-lg text-gray-600 mb-6">File: {pdfFile?.name}</p>
              
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

      </div>
    </div>
  )
}
