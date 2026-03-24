import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

// ─── Gemini client setup ──────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
  model: 'gemini-3-flash-preview',
});

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_DURATION_MONTHS = 3;
const MAX_DURATION_MONTHS = 4;
const WEEKS_PER_MONTH = 4;
const REVISION_WEEKS = 4;
const PROMPT_TOPICS_LIMIT = 180;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

// ─── In-memory cache ──────────────────────────────────────────────────────────

const planCache = new Map<string, { plan: StudyPlanWeek[]; cachedAt: number }>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeTopic(rawTopic: unknown) {
  if (typeof rawTopic === 'string') {
    return { topic: rawTopic, isHighYield: false };
  }
  if (rawTopic && typeof rawTopic === 'object') {
    const t = rawTopic as {
      name?: string;
      title?: string;
      topic?: string;
      isHighYield?: boolean;
    };
    return {
      topic: t.name || t.title || t.topic || 'Untitled Topic',
      isHighYield: Boolean(t.isHighYield),
    };
  }
  return { topic: 'Untitled Topic', isHighYield: false };
}

function extractPlannedTopics(semesterDocuments: SyllabusDocument[]) {
  const plannedTopics: PlannedTopic[] = [];

  for (const doc of semesterDocuments) {
    const subjectName =
      (typeof doc.subject_name === 'string' && doc.subject_name.trim()) ||
      (typeof doc.name === 'string' && doc.name.trim()) ||
      (typeof doc.title === 'string' && doc.title.trim()) ||
      'Unnamed Subject';

    if (!Array.isArray(doc.units)) continue;

    for (const unitRaw of doc.units) {
      if (!unitRaw || typeof unitRaw !== 'object') continue;
      const unitObj = unitRaw as {
        unit_number?: number;
        name?: string;
        title?: string;
        topics?: unknown[];
      };
      const unitName =
        unitObj.name ||
        unitObj.title ||
        (Number.isFinite(unitObj.unit_number)
          ? `Unit ${unitObj.unit_number}`
          : 'Unnamed Unit');

      const topicsRaw = Array.isArray(unitObj.topics) ? unitObj.topics : [];
      for (const topicRaw of topicsRaw) {
        const normalized = normalizeTopic(topicRaw);
        plannedTopics.push({
          subject: subjectName,
          unit: unitName,
          topic: normalized.topic,
          isHighYield: normalized.isHighYield,
        });
      }
    }
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

// ─── Deterministic fallback plan ──────────────────────────────────────────────

function buildDeterministicPlan(
  sortedTopics: PlannedTopic[],
  durationMonths: number
): StudyPlanWeek[] {
  const totalWeeks = durationMonths * WEEKS_PER_MONTH;
  const coreWeeks = Math.max(1, totalWeeks - REVISION_WEEKS);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const topicsPerCoreWeek = Math.max(
    1,
    Math.ceil(sortedTopics.length / coreWeeks)
  );
  const highYieldTopics = sortedTopics.filter((t) => t.isHighYield);
  const plan: StudyPlanWeek[] = [];

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex++) {
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + weekIndex * 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    let weekTopics: PlannedTopic[] = [];
    let focus = 'Core syllabus coverage';

    if (weekIndex < coreWeeks) {
      const start = weekIndex * topicsPerCoreWeek;
      weekTopics = sortedTopics.slice(start, start + topicsPerCoreWeek);
      if (weekTopics.some((t) => t.isHighYield)) {
        focus = 'Core topics + high-yield emphasis';
      }
    } else {
      const revisionWeeksCount = Math.max(1, totalWeeks - coreWeeks);
      const windowSize = Math.max(
        1,
        Math.ceil(highYieldTopics.length / revisionWeeksCount)
      );
      const revisionIndex = weekIndex - coreWeeks;
      weekTopics = highYieldTopics.slice(
        revisionIndex * windowSize,
        revisionIndex * windowSize + windowSize
      );
      focus = 'Revision + practice questions';
    }

    plan.push({
      month: Math.floor(weekIndex / WEEKS_PER_MONTH) + 1,
      week: weekIndex + 1,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      focus,
      topics: weekTopics,
    });
  }

  return plan;
}

// ─── Normalize Gemini output ──────────────────────────────────────────────────

function normalizeGeminiPlan(
  geminiPlan: GeminiPlannerResponse['plan'],
  topicsFallback: PlannedTopic[],
  durationMonths: number
): StudyPlanWeek[] | null {
  const totalWeeks = durationMonths * WEEKS_PER_MONTH;
  if (!Array.isArray(geminiPlan) || geminiPlan.length === 0) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const normalized: StudyPlanWeek[] = geminiPlan
    .slice(0, totalWeeks)
    .map((weekData, index) => {
      const startDate = new Date(now);
      startDate.setDate(now.getDate() + index * 7);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      const monthNumber = Math.floor(index / WEEKS_PER_MONTH) + 1;
      const weekNumber = index + 1;

      const topics = Array.isArray(weekData.topics)
        ? weekData.topics
            .map((t) => ({
              subject: cleanText(t.subject) || 'General',
              unit: cleanText(t.unit) || 'Unit',
              topic: cleanText(t.topic) || 'Topic',
              isHighYield: Boolean(t.isHighYield),
            }))
            .filter((t) => t.topic !== 'Topic')
        : [];

      return {
        month:
          Number.isInteger(weekData.month) &&
          weekData.month! >= 1 &&
          weekData.month! <= durationMonths
            ? weekData.month!
            : monthNumber,
        week:
          Number.isInteger(weekData.week) &&
          weekData.week! >= 1 &&
          weekData.week! <= totalWeeks
            ? weekData.week!
            : weekNumber,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        focus: cleanText(weekData.focus) || 'Syllabus coverage and revision',
        topics,
      };
    });

  // Pad any missing weeks
  while (normalized.length < totalWeeks) {
    const weekIndex = normalized.length;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + weekIndex * 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    normalized.push({
      month: Math.floor(weekIndex / WEEKS_PER_MONTH) + 1,
      week: weekIndex + 1,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      focus: 'Revision + practice questions',
      topics: [],
    });
  }

  const topicCount = normalized.reduce(
    (sum, week) => sum + week.topics.length,
    0
  );
  if (topicCount === 0) return buildDeterministicPlan(topicsFallback, durationMonths);

  return normalized;
}

// ─── Gemini call via SDK ──────────────────────────────────────────────────────

async function callGeminiForPlanner(
  semester: number,
  plannedTopics: PlannedTopic[],
  durationMonths: number
): Promise<GeminiPlannerResponse | null> {
  const topicsForPrompt = plannedTopics
    .slice(0, PROMPT_TOPICS_LIMIT)
    .map(({ subject, unit, topic }) => ({ subject, unit, topic }));

  const totalWeeks = durationMonths * WEEKS_PER_MONTH;
  const revisionWeeks = Math.min(REVISION_WEEKS, totalWeeks);

  const prompt = `You are an academic study planner. Return ONLY strict JSON with no markdown and no extra keys.

Create a ${durationMonths}-month study plan for BCA semester ${semester}.

Rules:
- Plan must be exactly ${totalWeeks} weeks (${WEEKS_PER_MONTH} weeks per month).
- Cover all listed topics with a balanced weekly load.
- Last ${revisionWeeks} weeks must focus on revision and test practice.
- Output a JSON object with this exact shape:
{
  "plan": [
    {
      "month": 1,
      "week": 1,
      "focus": "...",
      "topics": [
        { "subject": "...", "unit": "...", "topic": "...", "isHighYield": false }
      ]
    }
  ]
}
- month must be 1..${durationMonths}, week must be 1..${totalWeeks}.
- Keep topic text exactly as provided. Do not paraphrase or shorten topic names.

Total topics available: ${plannedTopics.length}.
Topics sent to model: ${topicsForPrompt.length}.

Syllabus topics:
${JSON.stringify(topicsForPrompt)}`;

  // SDK call — same pattern as the reference implementation
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text) return null;
  return parseGeminiPlannerJson(text);
}

// ─── Retry wrapper for 429 / RESOURCE_EXHAUSTED (free tier) ──────────────────

async function callGeminiWithRetry(
  semester: number,
  plannedTopics: PlannedTopic[],
  durationMonths: number,
  retries = 2
): Promise<GeminiPlannerResponse | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await callGeminiForPlanner(semester, plannedTopics, durationMonths);
    } catch (error) {
      const is429 =
        error instanceof Error &&
        (error.message.includes('429') ||
          error.message.includes('RESOURCE_EXHAUSTED'));

      if (is429 && attempt < retries) {
        const waitMs = Math.pow(2, attempt) * 1500; // 1.5s → 3s
        console.warn(
          `[AI Planner] Rate limit hit. Retrying in ${waitMs}ms (attempt ${attempt + 1}/${retries})...`
        );
        await new Promise((res) => setTimeout(res, waitMs));
        continue;
      }

      throw error;
    }
  }
  return null;
}

// ─── DB fetch ─────────────────────────────────────────────────────────────────

async function fetchSemesterDocuments(semester: number) {
  const db = await getDb();
  const semesterAsString = String(semester);

  const docs = (await db
    .collection('syllabus')
    .find({
      $or: [
        { semester },
        { semester: semesterAsString },
        {
          semester: {
            $regex: `^\\s*${semesterAsString}\\s*$`,
            $options: 'i',
          },
        },
      ],
    })
    .toArray()) as unknown as SyllabusDocument[];

  return docs;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  const requestStartedAt = Date.now();

  try {
    const data = await req.json();
    const semester = Number(data.semester);
    const durationMonths = Number(data.durationMonths ?? MIN_DURATION_MONTHS);

    console.info('[AI Planner API] Request received', { semester, durationMonths });

    if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
      return NextResponse.json(
        { ok: false, message: 'Please provide a valid semester between 1 and 8.' },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(durationMonths) ||
      durationMonths < MIN_DURATION_MONTHS ||
      durationMonths > MAX_DURATION_MONTHS
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: `durationMonths must be between ${MIN_DURATION_MONTHS} and ${MAX_DURATION_MONTHS}.`,
        },
        { status: 400 }
      );
    }

    // ── Cache check ───────────────────────────────────────────────────────────
    const cacheKey = `sem-${semester}-dur-${durationMonths}`;
    const cached = planCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      console.info('[AI Planner API] Serving from cache', { cacheKey });
      return NextResponse.json({
        ok: true,
        semester,
        durationMonths,
        source: 'cache',
        plan: cached.plan,
      });
    }

    // ── Fetch syllabus ────────────────────────────────────────────────────────
    const semesterDocuments = await fetchSemesterDocuments(semester);
    console.info('[AI Planner API] Syllabus documents fetched', {
      semester,
      documentCount: semesterDocuments.length,
    });

    if (semesterDocuments.length === 0) {
      return NextResponse.json(
        { ok: false, message: `No syllabus entries found for semester ${semester}.` },
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
          message: `Syllabus found for semester ${semester}, but no topics could be extracted.`,
        },
        { status: 404 }
      );
    }

    const sortedTopics = [...plannedTopics].sort(
      (a, b) => Number(b.isHighYield) - Number(a.isHighYield)
    );

    // ── Generate plan ─────────────────────────────────────────────────────────
    let plan: StudyPlanWeek[];
    let source: 'gemini' | 'fallback' | 'cache' = 'gemini';

    try {
      const geminiJson = await callGeminiWithRetry(
        semester,
        sortedTopics,
        durationMonths
      );
      const normalizedPlan = normalizeGeminiPlan(
        geminiJson?.plan,
        sortedTopics,
        durationMonths
      );

      if (!normalizedPlan) {
        source = 'fallback';
        plan = buildDeterministicPlan(sortedTopics, durationMonths);
        console.warn('[AI Planner API] Gemini output invalid, using deterministic fallback', {
          semester,
        });
      } else {
        plan = normalizedPlan;
        console.info('[AI Planner API] Gemini plan accepted', {
          semester,
          weeks: plan.length,
        });
      }
    } catch (error) {
      console.error('[AI Planner API] Gemini failed, falling back:', error);
      source = 'fallback';
      plan = buildDeterministicPlan(sortedTopics, durationMonths);
    }

    // ── Store in cache ────────────────────────────────────────────────────────
    planCache.set(cacheKey, { plan, cachedAt: Date.now() });

    const highYieldTopicsCount = plan
      .flatMap((w) => w.topics)
      .filter((t) => t.isHighYield).length;

    console.info('[AI Planner API] Request completed', {
      semester,
      source,
      weeks: plan.length,
      durationMs: Date.now() - requestStartedAt,
    });

    return NextResponse.json({
      ok: true,
      semester,
      durationMonths,
      subjects: Array.from(new Set(sortedTopics.map((t) => t.subject))),
      totalTopics: sortedTopics.length,
      highYieldTopics: highYieldTopicsCount,
      source,
      plan,
    });
  } catch (error) {
    console.error('[AI Planner API] Unhandled error:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to generate AI planner.' },
      { status: 500 }
    );
  }
}