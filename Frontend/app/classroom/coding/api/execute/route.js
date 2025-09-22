// File: app/api/execute/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { language, code, input } = await request.json();
    
    // In a real application, you would run the code in a secure sandbox
    // This is a simplified example that simulates code execution
    
    let output = '';
    let error = '';
    
    // Simulate code execution with a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock execution results
    switch (language) {
      case 'python':
        if (code.includes('print(')) {
          // Simple simulation for Python code that doubles input
          try {
            const inputNum = parseInt(input.trim());
            if (!isNaN(inputNum)) {
              output = `${inputNum * 2}`;
            } else {
              output = "Please provide a valid number as input";
            }
          } catch (e) {
            error = "Error processing input";
          }
        } else {
          error = "SyntaxError: Invalid Python code. Make sure to use print() function.";
        }
        break;
        
      case 'javascript':
        if (code.includes('console.log(')) {
          try {
            const inputNum = parseInt(input.trim());
            if (!isNaN(inputNum)) {
              output = `${inputNum * 2}`;
            } else {
              output = "Please provide a valid number as input";
            }
          } catch (e) {
            error = "Error processing input";
          }
        } else {
          error = "SyntaxError: Invalid JavaScript code. Make sure to use console.log() function.";
        }
        break;
        
      case 'ruby':
        if (code.includes('puts ')) {
          try {
            const inputNum = parseInt(input.trim());
            if (!isNaN(inputNum)) {
              output = `${inputNum * 2}`;
            } else {
              output = "Please provide a valid number as input";
            }
          } catch (e) {
            error = "Error processing input";
          }
        } else {
          error = "SyntaxError: Invalid Ruby code. Make sure to use puts function.";
        }
        break;
        
      default:
        error = `Unsupported language: ${language}`;
    }
    
    return NextResponse.json({ output, error });
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Server error processing your request' }, { status: 500 });
  }
}