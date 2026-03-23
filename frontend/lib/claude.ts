const API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
const API_URL = 'https://api.anthropic.com/v1/messages';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const generateStudyPlan = async (
  remainingTopics: string[],
  examDate: Date,
  pace: string
): Promise<any[]> => {
  if (!API_KEY) {
    console.warn('Anthropic API key is missing. Returning mock plan.');
    return generateMockStudyPlan(remainingTopics, examDate);
  }

  const systemPrompt = `You are a study planner for a BCA student. 
Return a JSON array of days, each with a date string, a list of topics to cover, and estimated total time in minutes.
Ensure the plan covers all remaining topics before the exam date: ${examDate.toDateString()}. 
Format: [{"date": "YYYY-MM-DD", "topics": ["topic1", "topic2"], "time": 60}]. 
Only return the JSON array, no other text.`;

  const userPrompt = `Remaining topics: ${remainingTopics.join(', ')}. Pace: ${pace}. Generate a study plan.`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'dangerously-allow-browser': 'true', // Required for client-side calls
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const data = await response.json();
    const content = data.content?.[0]?.text;
    return JSON.parse(content);
  } catch (error) {
    console.error('Claude API Error:', error);
    return generateMockStudyPlan(remainingTopics, examDate);
  }
};

export const askAIChat = async (
  topic: string,
  subject: string,
  unit: string,
  history: ClaudeMessage[],
  newMessage: string
): Promise<string> => {
  if (!API_KEY) {
    console.warn('Anthropic API key is missing. Returning mock response.');
    return "I'm Claude, but I'm currently missing an API key. This is a mock response.";
  }

  const systemPrompt = `You are an AI assistant for a BCA student. 
The current context is: 
Topic: ${topic}
Subject: ${subject}
Unit: ${unit}
Explain the topic clearly and answer student doubts for a BCA level understanding.`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'dangerously-allow-browser': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...history.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: newMessage }
        ],
      }),
    });

    const data = await response.json();
    return data.content?.[0]?.text || "No response received";
  } catch (error) {
    console.error('Claude API Error:', error);
    return "Something went wrong. Please check your console.";
  }
};

const generateMockStudyPlan = (topics: string[], examDate: Date) => {
  const plan = [];
  const today = new Date();
  const dayCount = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  
  for (let i = 0; i < Math.min(dayCount, 7); i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    plan.push({
      date: date.toISOString().split('T')[0],
      topics: [topics[i % topics.length] || 'Relaxation'],
      time: 60
    });
  }
  return plan;
};
