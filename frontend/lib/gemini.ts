/* ─── Gemini AI Integration ──────────────────────────────────── */

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
}

async function callGemini(systemInstruction: string, userPrompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return '[Mock] Gemini API key not set. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local';
  }
  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
  };
  const res = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response received.';
}

async function callGeminiChat(
  systemInstruction: string,
  history: GeminiMessage[],
  newMessage: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return '[Mock] Gemini API key not set. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local';
  }
  const contents = [
    ...history.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: newMessage }] },
  ];
  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
  };
  const res = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response received.';
}

/* ─── Public API ─────────────────────────────────────────────── */

export async function generateStudyPlan(
  remainingTopics: string[],
  examDate: Date,
  pace: string
): Promise<any[]> {
  const system = `You are a study planner for a BCA student.
Return ONLY a valid JSON array (no markdown, no code fences) where each element has:
{ "date": "YYYY-MM-DD", "topics": ["topic1", "topic2"], "time": 60 }
Distribute all remaining topics evenly across the days until ${examDate.toDateString()}.
Pace: ${pace}.`;

  const user = `Remaining topics: ${remainingTopics.join(', ')}.`;

  try {
    const text = await callGemini(system, user);
    const json = text.replace(/```json|```/g, '').trim();
    return JSON.parse(json);
  } catch {
    return generateMockStudyPlan(remainingTopics, examDate);
  }
}

export async function askAIChat(
  topic: string,
  subject: string,
  unit: string,
  history: GeminiMessage[],
  newMessage: string
): Promise<string> {
  const system = `You are an AI tutor for a BCA student.
Context — Topic: ${topic} | Subject: ${subject} | Unit: ${unit}
Explain clearly and concisely at BCA level. Use examples where helpful.`;

  try {
    return await callGeminiChat(system, history, newMessage);
  } catch {
    return 'Something went wrong. Please check your network and API key.';
  }
}

function generateMockStudyPlan(topics: string[], examDate: Date): any[] {
  const today = new Date();
  const diffDays = Math.max(
    1,
    Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
  );
  const days = Math.min(diffDays, 7);
  const chunkSize = Math.ceil(topics.length / days);

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return {
      date: date.toISOString().split('T')[0],
      topics: topics.slice(i * chunkSize, (i + 1) * chunkSize),
      time: 60,
    };
  }).filter(d => d.topics.length > 0);
}
