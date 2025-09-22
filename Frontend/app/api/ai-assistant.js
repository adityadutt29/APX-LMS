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
    return NextResponse.json({ response: data.response });
  } catch (error) {
    return NextResponse.json({ error: 'AI assistant error' }, { status: 500 });
  }
}
