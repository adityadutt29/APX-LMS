'use client';

import { useState, useEffect, useRef } from 'react';
import { Code2, PlayCircle, Terminal, Box, Sun, Moon, Save, Check, X, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MonacoEditor from '../../components/MonacoEditor';

// Language types and templates
const LANGUAGES = {
  python: {
    icon: '🐍',
    extension: 'py',
    template: `n = int(input())
print(n * 2)`
  },
  java: {
    icon: '☕',
    extension: 'java',
    template: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        System.out.println(n * 2);
    }
}`
  },
  cpp: {
    icon: '⚡',
    extension: 'cpp',
    template: `#include <iostream>

int main() {
    int n;
    std::cin >> n;
    std::cout << n * 2 << std::endl;
    return 0;
}`
  }
};

// Theme configurations
const THEMES = {
  dark: {
    background: "bg-[#1e1e1e]",
    foreground: "text-[#d4d4d4]",
    editor: "bg-[#1e1e1e] text-[#d4d4d4]",
    accent: "bg-[#007acc]",
    card: "bg-[#252526]",
    border: "border-[#333333]",
    muted: "bg-[#333333] text-[#cccccc]",
    success: "text-green-400",
    error: "text-red-400"
  },
  light: {
    background: "bg-[#ffffff]",
    foreground: "text-[#000000]",
    editor: "bg-white text-[#000000]",
    accent: "bg-[#007acc]",
    card: "bg-[#f3f3f3]",
    border: "border-[#e0e0e0]",
    muted: "bg-[#f3f3f3] text-[#616161]",
    success: "text-green-600",
    error: "text-red-600"
  }
};

export default function WebCompiler() {
  const router = useRouter();
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(LANGUAGES.cpp.template);
  
  // Use backend compile endpoint on local server (no external API calls from browser)
  // This forwards requests to OneCompiler via the backend proxy which requires RAPIDAPI_KEY
  const COMPILER_URL = process.env.NEXT_PUBLIC_COMPILER_URL || 'http://localhost:5001/api/compiler/run';
  const [input, setInput] = useState('5');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Always use dark theme for playground
  const theme = 'dark';
  const [isSaved, setIsSaved] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState('Saved');
  const [lastAutoSave, setLastAutoSave] = useState(Date.now());
  const [testCases, setTestCases] = useState([
    { input: '5', expectedOutput: '10' },
    { input: '0', expectedOutput: '0' },
    { input: '-3', expectedOutput: '-6' }
  ]);
  const [testResults, setTestResults] = useState([]);
  const editorRef = useRef(null);

  // Initialize code from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Try to load saved code from localStorage
      const savedCode = localStorage.getItem(`code_${language}`);
      if (savedCode) {
        setCode(savedCode);
      }
    }
  }, []);

  // Load template when language changes
  useEffect(() => {
    const savedCode = localStorage.getItem(`code_${language}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(LANGUAGES[language].template);
    }
  }, [language]);

  // Autosave effect
  useEffect(() => {
    if (!isSaved) {
      // Set status to saving
      setAutoSaveStatus('Saving...');
      
      const saveTimeout = setTimeout(() => {
        // Save code to localStorage
        localStorage.setItem(`code_${language}`, code);
        setIsSaved(true);
        setAutoSaveStatus('Saved');
        setLastAutoSave(Date.now());
      }, 1000); // Autosave after 1 second of inactivity
      
      return () => clearTimeout(saveTimeout);
    }
  }, [code, language, isSaved]);

  // Switch language and reset test results
  const handleLanguageChange = (newLanguage) => {
    // Always save current code before switching
    localStorage.setItem(`code_${language}`, code);
    
    setLanguage(newLanguage);
    setOutput('');
    setError('');
    setTestResults([]);
    setIsSaved(true);
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
    setIsSaved(false);
  };

  const saveCode = () => {
    localStorage.setItem(`code_${language}`, code);
    setIsSaved(true);
    setAutoSaveStatus('Saved');
    setLastAutoSave(Date.now());
    
    // Also download the file
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${LANGUAGES[language].extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Simple formatter helpers -------------------------------------------------
  const formatCLike = (src) => {
    if (!src) return src;
    // Normalize newlines
    let s = String(src).replace(/\r\n/g, '\n');
    // Ensure braces are on their own lines so indentation is simpler
    s = s.replace(/\s*{\s*/g, ' {\n').replace(/\s*}\s*/g, '\n}\n');
    const lines = s.split('\n');
    let indent = 0;
    const out = [];
    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (line === '') {
        out.push('');
        continue;
      }
      // decrease indent before lines starting with a closing brace
      if (line.startsWith('}')) {
        indent = Math.max(0, indent - 1);
      }
      out.push('    '.repeat(indent) + line);
      // increase indent after lines that end with an opening brace
      if (line.endsWith('{')) {
        indent += 1;
      }
      // also handle single-line brackets like ") {" or "){"
      // handled by trimming and previous logic
    }
    return out.join('\n');
  };

  const formatPython = (src) => {
    if (!src) return src;
    const s = String(src).replace(/\r\n/g, '\n');
    const lines = s.split('\n');
    let indent = 0;
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const trimmed = raw.trim();
      if (trimmed === '') {
        out.push('');
        continue;
      }
      // decrease indent if the line starts with keyword that dedents (simple heuristics)
      const dedentStarters = ['return', 'pass', 'break', 'continue', 'raise'];
      // apply current indent
      out.push('    '.repeat(indent) + trimmed);
      // if line ends with colon, increase indent for next line
      if (trimmed.endsWith(':')) {
        indent += 1;
      }
      // very naive: if next line is less indented, reduce indent (can't detect easily here)
    }
    return out.join('\n');
  };

  const formatCode = () => {
    try {
      // If Monaco editor is mounted, try to run its formatting action
      const editor = editorRef?.current;
      if (editor && editor.getAction) {
        try {
          const action = editor.getAction('editor.action.formatDocument');
          if (action) action.run();
          setAutoSaveStatus('Formatted');
          setTimeout(() => setAutoSaveStatus('Saved'), 800);
          setIsSaved(false);
          return;
        } catch (e) {
          // fall back to simple formatters below
          console.warn('Monaco format failed, falling back to basic formatter', e);
        }
      }

      let formatted = code;
      if (language === 'python') {
        formatted = formatPython(code);
      } else {
        // treat cpp/java/js/c as C-like
        formatted = formatCLike(code);
      }
      setCode(formatted);
      setIsSaved(false);
      setAutoSaveStatus('Formatted');
      setTimeout(() => setAutoSaveStatus('Saved'), 800);
    } catch (e) {
      console.error('Format error', e);
    }
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '' }]);
  };

  const updateTestCase = (index, field, value) => {
    const updatedTestCases = [...testCases];
    updatedTestCases[index][field] = value;
    setTestCases(updatedTestCases);
  };

  const removeTestCase = (index) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const runCode = async () => {
    setLoading(true);
    setError('');
    setOutput('');
    setTestResults([]);

    try {
      const response = await fetch(COMPILER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language,
          code,
          // always include the custom input as a top-level field so the server proxy
          // can prefer it when provided. Keep testCases for batch testing as well.
          input,
          testCases: testCases && testCases.length > 0 ? testCases : []
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else if (data.results && data.results.length > 0) {
        setTestResults(data.results);
        
        // Set the first result output to display in the output panel
        const firstResult = data.results[0];
        if (firstResult.error) {
          setError(firstResult.error);
        } else {
          setOutput(firstResult.actualOutput || '');
        }
      } else {
        setError('No output received from the compiler');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to run code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const t = THEMES[theme];

  return (
    <div className={`min-h-screen ${t.background} ${t.foreground} transition-colors duration-300 p-4`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className={`flex flex-col sm:flex-row items-center justify-between p-4 ${t.card} rounded-lg shadow ${t.border} border`}>
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            {/* Back Button */}
            <button 
              onClick={() => router.push('/dashboard')}
              className={`p-2 rounded-md ${t.muted} hover:bg-opacity-80 transition-colors flex items-center gap-2`}
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            
            <div className={`${t.accent} p-2 rounded-md`}>
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm opacity-70">Code, compile and run in your browser</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <select 
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className={`p-2 rounded ${t.card} ${t.border} border ${t.foreground}`}
            >
              {Object.keys(LANGUAGES).map(lang => (
                <option key={lang} value={lang}>
                  {LANGUAGES[lang].icon} {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Editor Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Box size={16} />
                <h2 className="font-semibold">Code Editor</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={formatCode}
                  className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${t.card} ${t.border} border`}
                  title="Format (basic)"
                >
                  Format
                </button>
                <button 
                  onClick={saveCode}
                  className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                    !isSaved ? 'text-yellow-500' : ''
                  } ${t.card} ${t.border} border`}
                >
                  <Save size={14} />
                  {!isSaved ? 'Save*' : 'Download'}
                </button>
              </div>
            </div>
            
            <div className={`${t.card} rounded-lg overflow-hidden border ${t.border}`}>
              <div className={`${t.muted} p-2 flex items-center justify-between border-b ${t.border}`}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm">
                    {LANGUAGES[language].icon} code.{LANGUAGES[language].extension}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-80">
                    {isSaved ? (
                      <span className="flex items-center gap-1">
                        <Check size={12} className={t.success} /> 
                        {autoSaveStatus} {lastAutoSave && isSaved ? `(${formatTimeAgo(lastAutoSave)})` : ''}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="animate-pulse">⚫</span> 
                        {autoSaveStatus}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              
              <div className="w-full h-96">
                <MonacoEditor
                  value={code}
                  language={language}
                  onChange={(val) => {
                    setCode(val || '');
                    setIsSaved(false);
                  }}
                  theme={theme}
                  editorRef={editorRef}
                />
              </div>
            </div>

          </div>

          {/* Output Section */}
          <div className="space-y-6">
            {/* Input Panel */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Terminal size={16} />
                <h2 className="font-semibold">Custom Input</h2>
              </div>
              
              <div className={`${t.card} rounded-lg overflow-hidden border ${t.border}`}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className={`w-full h-32 p-4 font-mono ${t.editor} focus:outline-none`}
                  placeholder="Enter custom input values here..."
                />
              </div>
            </div>
            
            {/* Output Panel */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Terminal size={16} />
                <h2 className="font-semibold">Output</h2>
              </div>
              
              <div className={`${t.card} rounded-lg overflow-hidden border ${t.border}`}>
                <div className={`${t.muted} p-2 flex items-center justify-between`}>
                  <span className="text-sm">{error ? '❌ Error' : '✨ Result'}</span>
                  {loading && <span className="text-xs animate-pulse">Running...</span>}
                </div>
                
                <textarea
                  value={error || output}
                  readOnly
                  className={`w-full h-64 p-4 font-mono ${t.editor} focus:outline-none ${
                    error ? t.error : ''
                  }`}
                  placeholder="Output will appear here..."
                />
              </div>
            </div>
            
            {/* Run Button */}
            <button
              onClick={runCode}
              disabled={loading}
              className={`w-full py-3 rounded-lg flex items-center justify-center ${
                loading ? t.muted : t.accent
              } text-white font-medium transition-colors`}
            >
              <PlayCircle className="mr-2" size={20} />
              {loading ? 'Running...' : 'Run Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}