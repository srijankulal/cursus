import { NextResponse } from 'next/server';

import { getDb } from '@/lib/mongodb';

type PlannedTopic = {
  subject: string;
  unit: string;
  topic: string;
  isHighYield: boolean;
};

type StudyPlanWeek = {
  month: number;
  week: number;
  startDate: string;
  endDate: string;
  focus: string;
  topics: PlannedTopic[];
};

type SyllabusUnit = {
  unit_number?: number;
  title?: string;
  name?: string;
  topics?: unknown[];
};

type SyllabusDocument = {
  subject_name?: string;
  name?: string;
  title?: string;
  semester?: string | number;
  units?: SyllabusUnit[];
};

type GeminiPlannerResponse = {
  plan?: Array<{
    month?: number;
    week?: number;
    focus?: string;
    topics?: Array<{
      subject?: string;
      unit?: string;
      topic?: string;
      isHighYield?: boolean;
    }>;
  }>;
};

const WEEKS_IN_FOUR_MONTHS = 16;
const CORE_WEEKS = 12;
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.Gemini_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  '';
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
const GEMINI_TIMEOUT_MS = 20000;
const PROMPT_TOPICS_LIMIT = 180;

function normalizeTopic(rawTopic: unknown) {
  if (typeof rawTopic === 'string') {
    return { topic: rawTopic, isHighYield: false };
  }

  if (rawTopic && typeof rawTopic === 'object') {
    const topicObj = rawTopic as { name?: string; title?: string; topic?: string; isHighYield?: boolean };
    return {
      topic: topicObj.name || topicObj.title || topicObj.topic || 'Untitled Topic',
      isHighYield: Boolean(topicObj.isHighYield),
    };
  }

  return {
    topic: 'Untitled Topic',
    isHighYield: false,
  };
}

function extractPlannedTopics(semesterDocuments: SyllabusDocument[]) {
  const plannedTopics: PlannedTopic[] = [];

  const pushFromUnits = (subjectName: string, unitsRaw: unknown) => {
    if (!Array.isArray(unitsRaw)) return;

    for (const unitRaw of unitsRaw) {
      if (!unitRaw || typeof unitRaw !== 'object') continue;
      const unitObj = unitRaw as { unit_number?: number; name?: string; title?: string; topics?: unknown[] };
      const unitName =
        unitObj.name ||
        unitObj.title ||
        (Number.isFinite(unitObj.unit_number) ? `Unit ${unitObj.unit_number}` : 'Unnamed Unit');
      const topicsRaw = Array.isArray(unitObj.topics) ? unitObj.topics : [];

      for (const topicRaw of topicsRaw) {
        const normalizedTopic = normalizeTopic(topicRaw);
        plannedTopics.push({
          subject: subjectName,
          unit: unitName,
          topic: normalizedTopic.topic,
          isHighYield: normalizedTopic.isHighYield,
        });
      }
    }
  };

  for (const semesterDoc of semesterDocuments) {
    const subjectName =
      (typeof semesterDoc.subject_name === 'string' && semesterDoc.subject_name.trim()) ||
      (typeof semesterDoc.name === 'string' && semesterDoc.name.trim()) ||
      (typeof semesterDoc.title === 'string' && semesterDoc.title.trim()) ||
      'Unnamed Subject';
    pushFromUnits(subjectName, semesterDoc.units);
  }

  return plannedTopics;
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function stripJsonFence(text: string) {
  return text.replace(/```json|```/gi, '').trim();
}

function parseGeminiPlannerJson(text: string): GeminiPlannerResponse | null {
  const cleaned = stripJsonFence(text);

  try {
    return JSON.parse(cleaned) as GeminiPlannerResponse;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as GeminiPlannerResponse;
    } catch {
      return null;
    }
  }
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function buildDeterministicFourMonthPlan(sortedTopics: PlannedTopic[]): StudyPlanWeek[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const plan: StudyPlanWeek[] = [];
  const topicsPerCoreWeek = Math.max(1, Math.ceil(sortedTopics.length / CORE_WEEKS));
  const highYieldTopics = sortedTopics.filter((topic) => topic.isHighYield);

  for (let weekIndex = 0; weekIndex < WEEKS_IN_FOUR_MONTHS; weekIndex++) {
    const weekNumber = weekIndex + 1;
    const monthNumber = Math.floor(weekIndex / 4) + 1;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + weekIndex * 7);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    let weekTopics: PlannedTopic[] = [];
    let focus = 'Core syllabus coverage';

    if (weekIndex < CORE_WEEKS) {
      const start = weekIndex * topicsPerCoreWeek;
      const end = start + topicsPerCoreWeek;
      weekTopics = sortedTopics.slice(start, end);

      if (weekTopics.some((topic) => topic.isHighYield)) {
        focus = 'Core topics + high-yield emphasis';
      }
    } else {
      const revisionWindowSize = Math.max(1, Math.ceil(highYieldTopics.length / (WEEKS_IN_FOUR_MONTHS - CORE_WEEKS)));
      const revisionIndex = weekIndex - CORE_WEEKS;
      const revisionStart = revisionIndex * revisionWindowSize;
      weekTopics = highYieldTopics.slice(revisionStart, revisionStart + revisionWindowSize);
      focus = 'Revision + practice questions';
    }

    plan.push({
      month: monthNumber,
      week: weekNumber,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      focus,
      topics: weekTopics,
    });
  }

  return plan;
}

function normalizeGeminiPlan(
  geminiPlan: GeminiPlannerResponse['plan'],
  topicsFallback: PlannedTopic[]
): StudyPlanWeek[] | null {
  if (!Array.isArray(geminiPlan) || geminiPlan.length === 0) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const normalized: StudyPlanWeek[] = geminiPlan.slice(0, WEEKS_IN_FOUR_MONTHS).map((weekData, index) => {
    const weekNumber = index + 1;
    const monthNumber = Math.floor(index / 4) + 1;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + index * 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const topics = Array.isArray(weekData.topics)
      ? weekData.topics
          .map((topic) => ({
            subject: cleanText(topic.subject) || 'General',
            unit: cleanText(topic.unit) || 'Unit',
            topic: cleanText(topic.topic) || 'Topic',
            isHighYield: Boolean(topic.isHighYield),
          }))
          .filter((topic) => topic.topic !== 'Topic')
      : [];

    return {
      month: Number.isInteger(weekData.month) && weekData.month! >= 1 && weekData.month! <= 4 ? weekData.month! : monthNumber,
      week: Number.isInteger(weekData.week) && weekData.week! >= 1 && weekData.week! <= WEEKS_IN_FOUR_MONTHS ? weekData.week! : weekNumber,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      focus: cleanText(weekData.focus) || 'Syllabus coverage and revision',
      topics,
    };
  });

  while (normalized.length < WEEKS_IN_FOUR_MONTHS) {
    const weekIndex = normalized.length;
    const weekNumber = weekIndex + 1;
    const monthNumber = Math.floor(weekIndex / 4) + 1;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + weekIndex * 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    normalized.push({
      month: monthNumber,
      week: weekNumber,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      focus: 'Revision + practice questions',
      topics: [],
    });
  }

  const topicCount = normalized.reduce((sum, week) => sum + week.topics.length, 0);
  if (topicCount === 0) return buildDeterministicFourMonthPlan(topicsFallback);

  return normalized;
}

async function callGeminiForPlanner(semester: number, plannedTopics: PlannedTopic[]) {
  if (!GEMINI_API_KEY) {
    return null;
  }

  const topicsForPrompt = plannedTopics.slice(0, PROMPT_TOPICS_LIMIT).map((topic) => ({
    subject: topic.subject,
    unit: topic.unit,
    topic: topic.topic,
  }));

  const systemInstruction =
    'You are an academic study planner. Return ONLY strict JSON with no markdown and no extra keys.';

  const userPrompt = `Create a 4-month study plan for semester ${semester}.\n\nRules:\n- Plan must be exactly 16 weeks (4 weeks per month).\n- Cover the listed topics with balanced weekly load.\n- Last 4 weeks should have more revision and test practice.\n- Output JSON object with this shape exactly:\n{\n  "plan": [\n    {\n      "month": 1,\n      "week": 1,\n      "focus": "...",\n      "topics": [\n        { "subject": "...", "unit": "...", "topic": "...", "isHighYield": false }\n      ]\n    }\n  ]\n}\n- month must be 1..4 and week must be 1..16.\n- Keep topic text exactly as provided.\n\nTotal topics available: ${plannedTopics.length}.\nTopics provided to model (trimmed if needed): ${topicsForPrompt.length}.\n\nSyllabus topics:\n${JSON.stringify(topicsForPrompt)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 3000,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Gemini API timed out after ${GEMINI_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Gemini API failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  return parseGeminiPlannerJson(text);
}

async function fetchSemesterDocuments(semester: number) {
  const db = await getDb();
  const semesterAsString = String(semester);

  const filter = {
    $or: [
      { semester },
      { semester: semesterAsString },
      { semester: { $regex: `^\\s*${semesterAsString}\\s*$`, $options: 'i' } },
    ],
  };

  const docs = (await db.collection('syllabus').find(filter).toArray()) as unknown as SyllabusDocument[];
  return docs;
}

export async function GET(request: Request) {
  const requestStartedAt = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const semesterParam = searchParams.get('semester');
    const semester = Number(semesterParam);

    console.info('[AI Planner API] Request received', { semesterParam, semester });

    if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
      return NextResponse.json(
        { ok: false, message: 'Please provide a valid semester between 1 and 8.' },
        { status: 400 }
      );
    }

    const semesterDocuments = await fetchSemesterDocuments(semester);
    console.info('[AI Planner API] Syllabus documents fetched', {
      semester,
      documentCount: semesterDocuments.length,
    });

    if (semesterDocuments.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: `No syllabus entries found in MongoDB for semester ${semester}.`,
        },
        { status: 404 }
      );
    }

    const plannedTopics = extractPlannedTopics(semesterDocuments);
    console.info('[AI Planner API] Topics extracted', {
      semester,
      topicCount: plannedTopics.length,
    });

    if (plannedTopics.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: `Syllabus found for semester ${semester}, but no topics were available to plan.`,
        },
        { status: 404 }
      );
    }

    const sortedTopics = [...plannedTopics].sort((left, right) => Number(right.isHighYield) - Number(left.isHighYield));

    let plan: StudyPlanWeek[];
    let source: 'gemini' | 'fallback' = 'gemini';
    try {
      const geminiJson = await callGeminiForPlanner(semester, sortedTopics);
      const normalizedPlan = normalizeGeminiPlan(geminiJson?.plan, sortedTopics);
      if (!normalizedPlan) {
        source = 'fallback';
        plan = buildDeterministicFourMonthPlan(sortedTopics);
        console.warn('[AI Planner API] Gemini output invalid, using fallback', { semester });
      } else {
        plan = normalizedPlan;
        console.info('[AI Planner API] Gemini plan accepted', {
          semester,
          weeks: plan.length,
        });
      }
    } catch (error) {
      console.error('Gemini planner failed. Falling back to deterministic plan:', error);
      source = 'fallback';
      plan = buildDeterministicFourMonthPlan(sortedTopics);
    }

    const highYieldTopicsCount = plan
      .flatMap((week) => week.topics)
      .filter((topic) => topic.isHighYield).length;

    console.info('[AI Planner API] Request completed', {
      semester,
      source,
      weeks: plan.length,
      durationMs: Date.now() - requestStartedAt,
    });

    return NextResponse.json({
      ok: true,
      semester,
      durationMonths: 4,
      subjects: Array.from(new Set(sortedTopics.map((topic) => topic.subject))),
      totalTopics: sortedTopics.length,
      highYieldTopics: highYieldTopicsCount,
      source,
      plan,
    });
  } catch (error) {
    console.error('AI planner generation failed:', error);
    console.error('[AI Planner API] Request failed', {
      durationMs: Date.now() - requestStartedAt,
    });
    return NextResponse.json(
      { ok: false, message: 'Failed to generate AI planner.' },
      { status: 500 }
    );
  }
}
