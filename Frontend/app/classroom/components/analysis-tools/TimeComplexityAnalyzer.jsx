'use client';

import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, AlertCircle, CheckCircle, XCircle, BarChart3, Zap, Target } from 'lucide-react';

const TimeComplexityAnalyzer = ({ code, language }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Time complexity patterns for different languages
  const complexityPatterns = {
    python: {
      'O(1)': [/^\s*return/, /^\s*print/, /=\s*[^[]+$/, /^\s*[a-zA-Z_]\w*\s*=\s*[^[]/],
      'O(n)': [/for\s+\w+\s+in\s+range\(n\)/, /for\s+\w+\s+in\s+\w+/, /while\s+\w+\s*<\s*n/],
      'O(n²)': [/for.*for.*range/, /for.*in.*for.*in/, /while.*while/],
      'O(log n)': [/\/\/\s*2/, /\/=\s*2/, /binary.*search/, /divide.*conquer/],
      'O(n log n)': [/sort\(/, /sorted\(/, /merge.*sort/, /quick.*sort/]
    },
    cpp: {
      'O(1)': [/return\s+/, /cout\s*<</, /=\s*[^[]+;/, /^\s*[a-zA-Z_]\w*\s*=\s*[^[]/],
      'O(n)': [/for\s*\(\s*int\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*n/, /for\s*\(\s*\w+\s*:\s*\w+\)/, /while\s*\(\s*\w+\s*<\s*n\)/],
      'O(n²)': [/for.*for.*int/, /for.*{.*for/, /while.*while/],
      'O(log n)': [/\/\s*2/, /\/=\s*2/, /binary_search/, /lower_bound/],
      'O(n log n)': [/sort\(/, /stable_sort/, /merge/, /quick_sort/]
    },
    java: {
      'O(1)': [/return\s+/, /System\.out\.print/, /=\s*[^[]+;/, /^\s*[a-zA-Z_]\w*\s*=\s*[^[]/],
      'O(n)': [/for\s*\(\s*int\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*n/, /for\s*\(\s*\w+\s*:\s*\w+\)/, /while\s*\(\s*\w+\s*<\s*n\)/],
      'O(n²)': [/for.*for.*int/, /for.*{.*for/, /while.*while/],
      'O(log n)': [/\/\s*2/, /\/=\s*2/, /Collections\.binarySearch/, /Arrays\.binarySearch/],
      'O(n log n)': [/Collections\.sort/, /Arrays\.sort/, /merge/, /quickSort/]
    }
  };

  const analyzeTimeComplexity = () => {
    if (!code || !language) return null;

    setLoading(true);
    
    // Simulate analysis delay for realistic UX
    setTimeout(() => {
      const patterns = complexityPatterns[language] || complexityPatterns.cpp;
      let detectedComplexity = 'O(1)'; // Default
      let confidence = 0;
      let details = [];
      
      const lines = code.split('\n');
      let nestedLoops = 0;
      let hasSort = false;
      let hasSearch = false;
      
      // Analyze each line
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Count nested loops
        if (trimmedLine.includes('for') || trimmedLine.includes('while')) {
          nestedLoops++;
        }
        
        // Check for sorting operations
        if (trimmedLine.includes('sort') || trimmedLine.includes('Sort')) {
          hasSort = true;
          details.push({
            line: index + 1,
            code: trimmedLine,
            complexity: 'O(n log n)',
            reason: 'Sorting operation detected'
          });
        }
        
        // Check for binary search patterns
        if (trimmedLine.includes('binary') || trimmedLine.includes('/= 2') || trimmedLine.includes('/ 2')) {
          hasSearch = true;
          details.push({
            line: index + 1,
            code: trimmedLine,
            complexity: 'O(log n)',
            reason: 'Binary search pattern detected'
          });
        }
        
        // Check patterns for each complexity
        Object.entries(patterns).forEach(([complexity, regexArray]) => {
          regexArray.forEach(regex => {
            if (regex.test(trimmedLine)) {
              details.push({
                line: index + 1,
                code: trimmedLine,
                complexity: complexity,
                reason: `Pattern matched: ${regex.source.substring(0, 30)}...`
              });
            }
          });
        });
      });
      
      // Determine overall complexity
      if (hasSort) {
        detectedComplexity = 'O(n log n)';
        confidence = 85;
      } else if (nestedLoops >= 2) {
        detectedComplexity = 'O(n²)';
        confidence = 80;
      } else if (hasSearch) {
        detectedComplexity = 'O(log n)';
        confidence = 75;
      } else if (nestedLoops === 1) {
        detectedComplexity = 'O(n)';
        confidence = 70;
      } else {
        detectedComplexity = 'O(1)';
        confidence = 60;
      }
      
      // Calculate space complexity (simplified)
      let spaceComplexity = 'O(1)';
      if (code.includes('[]') || code.includes('Array') || code.includes('vector') || code.includes('list')) {
        spaceComplexity = 'O(n)';
      }
      
      setAnalysis({
        timeComplexity: detectedComplexity,
        spaceComplexity: spaceComplexity,
        confidence: confidence,
        details: details,
        suggestions: generateSuggestions(detectedComplexity, details),
        performance: getPerformanceRating(detectedComplexity)
      });
      
      setLoading(false);
    }, 1500);
  };

  const generateSuggestions = (complexity, details) => {
    const suggestions = [];
    
    if (complexity === 'O(n²)') {
      suggestions.push({
        type: 'optimization',
        message: 'Consider using hash tables or maps to reduce nested loops',
        icon: <Target className="w-4 h-4" />
      });
      suggestions.push({
        type: 'warning',
        message: 'Quadratic time complexity may not scale well for large inputs',
        icon: <AlertCircle className="w-4 h-4" />
      });
    } else if (complexity === 'O(n log n)') {
      suggestions.push({
        type: 'info',
        message: 'Good complexity for sorting algorithms. Consider if sorting is necessary',
        icon: <CheckCircle className="w-4 h-4" />
      });
    } else if (complexity === 'O(1)') {
      suggestions.push({
        type: 'success',
        message: 'Excellent! Constant time complexity is optimal',
        icon: <CheckCircle className="w-4 h-4" />
      });
    }
    
    return suggestions;
  };

  const getPerformanceRating = (complexity) => {
    const ratings = {
      'O(1)': { score: 100, grade: 'A+', color: 'text-green-500' },
      'O(log n)': { score: 90, grade: 'A', color: 'text-green-400' },
      'O(n)': { score: 80, grade: 'B+', color: 'text-blue-500' },
      'O(n log n)': { score: 70, grade: 'B', color: 'text-yellow-500' },
      'O(n²)': { score: 50, grade: 'C', color: 'text-orange-500' },
      'O(2^n)': { score: 20, grade: 'D', color: 'text-red-500' }
    };
    
    return ratings[complexity] || ratings['O(n)'];
  };

  useEffect(() => {
    if (code) {
      const timer = setTimeout(() => {
        analyzeTimeComplexity();
      }, 2000); // Auto-analyze after 2 seconds of no changes
      
      return () => clearTimeout(timer);
    }
  }, [code, language]);

  return (
    <div className="bg-gray-900 text-gray-100 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Time Complexity Analyzer</h3>
            <p className="text-sm text-gray-400">Analyze algorithm efficiency</p>
          </div>
        </div>
        
        <button
          onClick={analyzeTimeComplexity}
          disabled={loading || !code}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 
                     text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="text-gray-400">Analyzing code complexity...</span>
          </div>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          {/* Main Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Time Complexity */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Time Complexity</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{analysis.timeComplexity}</div>
              <div className="text-sm text-gray-500">Confidence: {analysis.confidence}%</div>
            </div>

            {/* Space Complexity */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Space Complexity</span>
              </div>
              <div className="text-2xl font-bold text-green-400">{analysis.spaceComplexity}</div>
              <div className="text-sm text-gray-500">Memory usage</div>
            </div>

            {/* Performance Score */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">Performance</span>
              </div>
              <div className={`text-2xl font-bold ${analysis.performance.color}`}>
                {analysis.performance.grade}
              </div>
              <div className="text-sm text-gray-500">{analysis.performance.score}/100</div>
            </div>
          </div>

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Optimization Suggestions</h4>
              <div className="space-y-2">
                {analysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                    <div className={`mt-0.5 ${
                      suggestion.type === 'success' ? 'text-green-400' :
                      suggestion.type === 'warning' ? 'text-yellow-400' :
                      suggestion.type === 'optimization' ? 'text-purple-400' : 'text-blue-400'
                    }`}>
                      {suggestion.icon}
                    </div>
                    <span className="text-sm text-gray-300">{suggestion.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code Analysis Details */}
          {analysis.details.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Code Analysis Details</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {analysis.details.slice(0, 10).map((detail, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 bg-gray-700 rounded text-sm">
                    <span className="text-gray-500 min-w-[3rem]">L{detail.line}:</span>
                    <span className="text-purple-400 min-w-[4rem]">{detail.complexity}</span>
                    <span className="text-gray-300 flex-1 font-mono text-xs">{detail.code}</span>
                  </div>
                ))}
                {analysis.details.length > 10 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {analysis.details.length - 10} more lines
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Write some code to analyze its time complexity</p>
        </div>
      )}
    </div>
  );
};

export default TimeComplexityAnalyzer;
