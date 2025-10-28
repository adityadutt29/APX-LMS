"use client";

import React from 'react';
import Editor from '@monaco-editor/react';

// Lightweight wrapper around @monaco-editor/react with sensible options for C/C++/Java/Python
export default function MonacoEditor({ value, language = 'cpp', onChange, theme = 'dark', editorRef }) {
  const monacoLangMap = {
    cpp: 'cpp',
    c: 'c',
    java: 'java',
    python: 'python',
    py: 'python',
    javascript: 'javascript',
    js: 'javascript'
  };

  const lang = monacoLangMap[language] || language || 'cpp';

  const options = {
    selectOnLineNumbers: true,
    automaticLayout: true,
    minimap: { enabled: false },
    folding: true,
    tabSize: 4,
    insertSpaces: true,
    autoIndent: 'full',
    formatOnType: true,
    formatOnPaste: true,
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    renderWhitespace: 'boundary',
    bracketPairColorization: { enabled: true }
  };

  const handleMount = (editor, monaco) => {
    if (editorRef) {
      // store both editor and monaco to allow calling actions and formatting
      editorRef.current = { editor, monaco };
    }

    // Ensure the editor has expected options applied at runtime
    try {
      editor.updateOptions({
        autoIndent: 'full',
        formatOnType: true,
        formatOnPaste: true,
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        tabSize: 4,
        insertSpaces: true
      });

      // register language id if missing (harmless if already registered)
      try {
        monaco.languages.register({ id: lang });
      } catch (e) {
        // ignore
      }
    } catch (err) {
      // swallow any editor update issues
      // console.warn('Monaco mount/update options failed', err);
    }
  };

  return (
    <Editor
      height="520px"
      defaultLanguage={lang}
      language={lang}
      value={value}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      onChange={onChange}
      options={options}
      onMount={handleMount}
    />
  );
}
