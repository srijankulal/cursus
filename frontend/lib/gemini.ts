/* ─── Gemini AI Integration ──────────────────────────────────── */

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface StudyPlanItem {
  day: number;
  date: string;
  topic: string;
  subject: string;
  estimatedTime: string;
}

interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
}

async function callGemini(systemInstruction: string, userPrompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('No API Key');
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
     throw new Error('No API Key');
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
  remainingTopics: { id: string; name: string; subject: string }[],
  pace: string
): Promise<StudyPlanItem[]> {
  const system = `You are a study master for a BCA student. 
Return ONLY a valid JSON array of objects. No markdown, no fences.
Each object must be: { "day": number, "date": "Relative string like 'Day 1'", "topic": "string", "subject": "string", "estimatedTime": "approx time in mins" }
Remaining topics: ${JSON.stringify(remainingTopics.slice(0, 30))}.
Intensity: ${pace}.`;

  try {
    const text = await callGemini(system, "Generate a plan for all topics.");
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Gemini Plan Error:", e);
    // Return mock for UI demo
    return remainingTopics.slice(0, 10).map((t, i) => ({
      day: i + 1,
      date: `Day ${i + 1}`,
      topic: t.name,
      subject: t.subject,
      estimatedTime: pace === 'intensive' ? '45 mins' : '90 mins'
    }));
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
Explain clearly and concisely at BCA level. Use examples where helpful. Keep it within 300 words.`;

  try {
    return await callGeminiChat(system, history, newMessage);
  } catch (e) {
    console.error("Gemini Chat Error:", e);
    return 'I currently have a high volume of requests. Please verify your API key or try again later.';
  }
}
