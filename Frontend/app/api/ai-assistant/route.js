import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message } = await req.json();
    // Call backend AI assistant endpoint
    const backendRes = await fetch('http://localhost:5001/ai-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const data = await backendRes.json();
    // Defensive: if backend returns HTML, error out
    if (!data || typeof data.response !== 'string') {
      return NextResponse.json({ error: 'Invalid backend response' }, { status: 502 });
    }
    return NextResponse.json({ response: data.response });
  } catch (error) {
    return NextResponse.json({ error: 'AI assistant error' }, { status: 500 });
  }
}
