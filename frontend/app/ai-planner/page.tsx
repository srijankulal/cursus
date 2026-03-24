'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

type PlannerResponse = {
  ok: boolean;
  semester: number;
  durationMonths: number;
  subjects: string[];
  totalTopics: number;
  highYieldTopics: number;
  source?: 'gemini' | 'fallback';
  plan: StudyPlanWeek[];
  message?: string;
};

const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AiPlannerPage() {
  const [semester, setSemester] = useState('3');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PlannerResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadingSeconds, setLoadingSeconds] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setLoadingSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setLoadingSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isLoading]);

  const tableRows = useMemo(() => {
    if (!data?.plan) return [];

    return data.plan.flatMap((week) => {
      if (week.topics.length === 0) {
        return [
          {
            key: `${week.week}-revision`,
            month: week.month,
            week: week.week,
            dateRange: `${week.startDate} to ${week.endDate}`,
            focus: week.focus,
            subject: 'Revision',
            unit: 'Practice',
            topic: 'Mock tests and revision',
            isHighYield: false,
          },
        ];
      }

      return week.topics.map((topic, index) => ({
        key: `${week.week}-${topic.topic}-${index}`,
        month: week.month,
        week: week.week,
        dateRange: `${week.startDate} to ${week.endDate}`,
        focus: week.focus,
        subject: topic.subject,
        unit: topic.unit,
        topic: topic.topic,
        isHighYield: topic.isHighYield,
      }));
    });
  }, [data]);

  async function generatePlan() {
    const startedAt = Date.now();
    console.info('[AI Planner] Generation started', { semester });

    setIsLoading(true);
    setError(null);
    setData(null);
    setStatusMessage(`Generating 4-month plan for semester ${semester}...`);

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 45000);
      const response = await fetch(`/api/ai-planner?semester=${semester}`, {
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      const payload = (await response.json()) as PlannerResponse;

      if (!response.ok || !payload.ok) {
        console.error('[AI Planner] Generation failed', {
          semester,
          status: response.status,
          message: payload.message,
        });
        setError(payload.message ?? 'Could not generate plan.');
        setStatusMessage('Plan generation failed. Please review the error and try again.');
        return;
      }

      setData(payload);
      console.info('[AI Planner] Generation succeeded', {
        semester: payload.semester,
        totalTopics: payload.totalTopics,
        weeks: payload.plan.length,
        source: payload.source,
        durationMs: Date.now() - startedAt,
      });
      setStatusMessage(
        `Plan generated successfully for semester ${payload.semester}. ${payload.plan.length} weeks scheduled.`
      );
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === 'AbortError') {
        console.error('[AI Planner] Generation timed out', {
          semester,
          durationMs: Date.now() - startedAt,
        });
        setError('Generation timed out after 45 seconds. Please try again.');
        setStatusMessage('Generation timed out. Please retry.');
        return;
      }

      console.error('[AI Planner] Generation request failed', {
        semester,
        durationMs: Date.now() - startedAt,
      });
      setError('Could not generate plan right now. Please try again.');
      setStatusMessage('Request failed before completion. Please try again.');
    } finally {
      setIsLoading(false);
      console.info('[AI Planner] Generation finished', {
        semester,
        durationMs: Date.now() - startedAt,
      });
    }
  }

  return (
    <main className="min-h-screen bg-app-bg px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Card className="border border-app-border bg-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">AI Planner</CardTitle>
            <CardDescription>
              Generate a 4-month study plan from MongoDB syllabus data by semester.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <p className="text-sm font-medium text-app-text">Semester</p>
              <select
                value={semester}
                onChange={(event) => setSemester(event.target.value)}
                className="h-8 w-44 rounded-lg border border-input bg-transparent px-2.5 text-sm text-app-text outline-none transition-colors focus-visible:border-ring"
                aria-label="Select semester"
              >
                {semesterOptions.map((value) => (
                  <option key={value} value={String(value)}>
                    Semester {value}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={generatePlan}
              disabled={isLoading}
              className="bg-black text-white hover:bg-neutral-800"
            >
              {isLoading ? 'Generating Plan...' : 'Generate 4-Month Plan'}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="pt-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {isLoading && (
          <Card className="border border-app-border bg-white">
            <CardContent className="flex items-center gap-3 pt-4 text-sm text-app-text">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-app-border border-t-black" />
              <span>
                Generating your 4-month plan... <span className="text-app-muted">({loadingSeconds}s)</span>
              </span>
            </CardContent>
          </Card>
        )}

        {statusMessage && !error && (
          <Card className="border border-app-border bg-white">
            <CardContent className="pt-4 text-sm text-app-text">{statusMessage}</CardContent>
          </Card>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="border border-app-border bg-white">
                <CardHeader>
                  <CardDescription>Total Subjects</CardDescription>
                  <CardTitle>{data.subjects.length}</CardTitle>
                </CardHeader>
              </Card>

              <Card className="border border-app-border bg-white">
                <CardHeader>
                  <CardDescription>Total Topics</CardDescription>
                  <CardTitle>{data.totalTopics}</CardTitle>
                </CardHeader>
              </Card>

              <Card className="border border-app-border bg-white">
                <CardHeader>
                  <CardDescription>High-Yield Topics</CardDescription>
                  <CardTitle>{data.highYieldTopics}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="border border-app-border bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Subjects Included</CardTitle>
                <CardDescription>
                  Plan source: {data.source === 'fallback' ? 'Deterministic fallback' : 'Gemini'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="rounded-full border border-app-border bg-neutral-50 px-3 py-1 text-xs font-medium text-app-text"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-app-border bg-white">
              <CardHeader>
                <CardTitle>4-Month Study Plan Table</CardTitle>
                <CardDescription>Generated from semester syllabus topics</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Week</TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Focus</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell>{row.month}</TableCell>
                        <TableCell>{row.week}</TableCell>
                        <TableCell>{row.dateRange}</TableCell>
                        <TableCell className="max-w-60 whitespace-normal">{row.focus}</TableCell>
                        <TableCell>{row.subject}</TableCell>
                        <TableCell>{row.unit}</TableCell>
                        <TableCell className="max-w-70 whitespace-normal">{row.topic}</TableCell>
                        <TableCell>{row.isHighYield ? 'High' : 'Normal'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
