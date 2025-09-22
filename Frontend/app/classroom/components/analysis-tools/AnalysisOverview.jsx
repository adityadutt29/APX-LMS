'use client';

import React from 'react';
import { Zap, TrendingUp, GitBranch, Code2, Clock, BarChart3, Target, CheckCircle } from 'lucide-react';

const AnalysisOverview = ({ code }) => {
  if (!code) {
    return (
      <div className="bg-gray-900 text-gray-100 p-8 rounded-lg border border-gray-700">
        <div className="text-center">
          <div className="flex justify-center space-x-4 mb-6">
            <div className="bg-purple-600 p-4 rounded-full">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div className="bg-blue-600 p-4 rounded-full">
              <GitBranch className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Advanced Code Analysis
          </h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Write your code in the editor to unlock powerful analysis features including time complexity analysis and automatic flowchart generation.
          </p>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 hover:border-purple-500 transition-colors">
              <div className="bg-purple-600 p-3 rounded-lg w-fit mx-auto mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-purple-400">Time Complexity Analyzer</h4>
              <p className="text-gray-400 text-sm mb-4">
                Automatically analyze your algorithm's time and space complexity with detailed performance insights.
              </p>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Big O notation detection
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Performance scoring
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Optimization suggestions
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 hover:border-blue-500 transition-colors">
              <div className="bg-blue-600 p-3 rounded-lg w-fit mx-auto mb-4">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-blue-400">Flowchart Generator</h4>
              <p className="text-gray-400 text-sm mb-4">
                Generate Mermaid flowchart code from your algorithm's logic flow for easy diagram creation.
              </p>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Mermaid syntax generation
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Exportable diagram code
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Control structure detection
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg border border-purple-500/30">
            <div className="flex items-center justify-center gap-2 text-purple-300">
              <Zap className="w-5 h-5" />
              <span className="font-medium">Pro Tip:</span>
            </div>
            <p className="text-sm text-gray-300 mt-2">
              The analysis tools work with Python, C++, and Java. Try writing loops, conditionals, or sorting algorithms for the best results!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Quick preview when code is present
  const codeLines = code.split('\n').filter(line => line.trim().length > 0);
  const hasLoops = code.includes('for') || code.includes('while');
  const hasConditions = code.includes('if') || code.includes('else');
  const hasFunctions = code.includes('def ') || code.includes('function') || code.includes('void ');

  return (
    <div className="bg-gray-900 text-gray-100 p-6 rounded-lg border border-gray-700">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Code Analysis Ready
        </h3>
        <p className="text-gray-400">Your code is ready for advanced analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Lines of Code</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{codeLines.length}</div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Complexity</span>
          </div>
          <div className="text-sm text-green-400">
            {hasLoops && hasConditions ? 'Complex' : hasLoops || hasConditions ? 'Moderate' : 'Simple'}
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">Features</span>
          </div>
          <div className="text-sm text-purple-400">
            {[hasLoops && 'Loops', hasConditions && 'Conditions', hasFunctions && 'Functions']
              .filter(Boolean).join(', ') || 'Basic'}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/30">
        <div className="flex items-center gap-2 text-purple-300 mb-2">
          <Zap className="w-4 h-4" />
          <span className="font-medium">Analysis Available:</span>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded">Time Complexity</span>
          <span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded">Mermaid Code</span>
          <span className="bg-green-600/20 text-green-300 px-2 py-1 rounded">Performance Insights</span>
        </div>
      </div>
    </div>
  );
};

export default AnalysisOverview;
