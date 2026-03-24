'use client';

import { FormEvent, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type IngestResult = {
  document_id: string;
  status: string;
  message: string;
  question_count: number;
};

type QuestionHit = {
  id: string;
  text_preview: string;
  metadata: {
    question_number?: string;
  };
};

type AnswerMode = 'notes' | 'gemini';

export default function QuestionPaperPage() {
  const [questionPaperUrl, setQuestionPaperUrl] = useState('');
  const [notesUrl, setNotesUrl] = useState('');

  const [qpaperResult, setQpaperResult] = useState<IngestResult | null>(null);
  const [notesResult, setNotesResult] = useState<IngestResult | null>(null);

  const [loadingQpaper, setLoadingQpaper] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionHit[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [answerMode, setAnswerMode] = useState<AnswerMode>('notes');
  const [answer, setAnswer] = useState('');

  const canUseNotes = Boolean(notesResult?.document_id);

  const workflowSteps = useMemo(
    () => [
      { id: 1, label: 'Ingest Question Paper PDF', done: Boolean(qpaperResult?.document_id) },
      { id: 2, label: 'Extract Questions', done: questions.length > 0 },
      { id: 3, label: 'Optional: Ingest Notes PDF', done: Boolean(notesResult?.document_id) },
      { id: 4, label: 'Answer Questions (Notes or Gemini)', done: Boolean(answer.trim()) },
    ],
    [qpaperResult, questions.length, notesResult, answer]
  );

  async function ingestQuestionPaper(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingQpaper(true);
    setError(null);
    setQpaperResult(null);
    setQuestions([]);
    setSelectedQuestion('');
    setAnswer('');

    try {
      const response = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: questionPaperUrl,
          doc_type: 'qpaper',
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.message ?? 'Failed to ingest question paper.');
        return;
      }

      setQpaperResult(data);
      await fetchQuestions(data.document_id);
    } catch {
      setError('Unable to ingest question paper right now.');
    } finally {
      setLoadingQpaper(false);
    }
  }

  async function ingestNotes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingNotes(true);
    setError(null);
    setNotesResult(null);
    setAnswer('');

    try {
      const response = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: notesUrl,
          doc_type: 'notes',
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.message ?? 'Failed to ingest notes.');
        return;
      }

      setNotesResult(data);
    } catch {
      setError('Unable to ingest notes right now.');
    } finally {
      setLoadingNotes(false);
    }
  }

  async function fetchQuestions(documentId: string) {
    setLoadingQuestions(true);

    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'question paper questions',
          doc_type: 'qpaper',
          document_id: documentId,
          top_k: 30,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.message ?? 'Failed to fetch extracted questions.');
        return;
      }

      const hits: QuestionHit[] = (data.matches ?? []) as QuestionHit[];
      setQuestions(hits);
      if (hits.length > 0) {
        setSelectedQuestion(hits[0].text_preview);
      }
    } catch {
      setError('Unable to fetch questions right now.');
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function answerSelectedQuestion() {
    if (!selectedQuestion.trim()) return;

    setLoadingAnswer(true);
    setError(null);
    setAnswer('');

    const requestBody: Record<string, unknown> = {
      query: selectedQuestion,
      doc_type: 'notes',
      style: 'detailed',
    };

    if (answerMode === 'notes' && notesResult?.document_id) {
      requestBody.document_id = notesResult.document_id;
    }

    if (answerMode === 'gemini') {
      requestBody.document_id = '__gemini_fallback_only__';
    }

    try {
      const response = await fetch('/api/rag/query-clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.message ?? 'Failed to generate answer.');
        return;
      }

      setAnswer(data.answer ?? 'No answer returned.');
    } catch {
      setError('Unable to generate answer right now.');
    } finally {
      setLoadingAnswer(false);
    }
  }

  return (
    <main className="min-h-screen bg-app-bg px-4 py-8 sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="border border-app-border bg-white">
          <CardHeader>
            <CardTitle className="text-xl">Question Paper Workflow</CardTitle>
            <p className="text-sm text-app-muted">Ingest qpaper, extract questions, then answer with notes or Gemini.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflowSteps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                  step.done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-app-border bg-neutral-50 text-app-muted'
                }`}
              >
                <span>{step.id}. {step.label}</span>
                <span className="text-xs font-semibold uppercase">{step.done ? 'Done' : 'Pending'}</span>
              </div>
            ))}

            <form onSubmit={ingestQuestionPaper} className="space-y-2 pt-2">
              <label className="text-sm font-medium text-app-text">Question Paper PDF URL</label>
              <Input
                placeholder="https://example.com/question-paper.pdf"
                value={questionPaperUrl}
                onChange={(event) => setQuestionPaperUrl(event.target.value)}
                required
              />
              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-neutral-800"
                disabled={loadingQpaper || !questionPaperUrl.trim()}
              >
                {loadingQpaper ? 'Ingesting Question Paper...' : 'Ingest Question Paper'}
              </Button>
            </form>

            <form onSubmit={ingestNotes} className="space-y-2">
              <label className="text-sm font-medium text-app-text">Notes PDF URL (optional)</label>
              <Input
                placeholder="https://example.com/notes.pdf"
                value={notesUrl}
                onChange={(event) => setNotesUrl(event.target.value)}
              />
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={loadingNotes || !notesUrl.trim()}
              >
                {loadingNotes ? 'Ingesting Notes...' : 'Ingest Notes'}
              </Button>
            </form>

            {qpaperResult && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Qpaper ready: {qpaperResult.question_count} questions parsed.
              </p>
            )}

            {notesResult && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Notes ready for RAG answers.
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-app-border bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Extracted Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingQuestions ? (
                <p className="text-sm text-app-muted">Extracting questions...</p>
              ) : questions.length === 0 ? (
                <p className="text-sm text-app-muted">No questions yet. Ingest a question paper first.</p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {questions.map((item) => {
                    const selected = selectedQuestion === item.text_preview;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedQuestion(item.text_preview);
                          setAnswer('');
                        }}
                        className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                          selected
                            ? 'border-black bg-black text-white'
                            : 'border-app-border bg-neutral-50 text-app-text hover:bg-neutral-100'
                        }`}
                      >
                        <div className="mb-1 text-xs font-semibold uppercase opacity-70">
                          {item.metadata?.question_number ? `Q${item.metadata.question_number}` : 'Question'}
                        </div>
                        <div>{item.text_preview}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-app-border bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Answer Selected Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-app-text">Selected question</label>
                <textarea
                  value={selectedQuestion}
                  onChange={(event) => setSelectedQuestion(event.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-app-border bg-neutral-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                  placeholder="Select or edit a question"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAnswerMode('notes')}
                  disabled={!canUseNotes}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    answerMode === 'notes'
                      ? 'border-black bg-black text-white'
                      : 'border-app-border bg-white text-app-text'
                  } ${!canUseNotes ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  Use Uploaded Notes
                </button>
                <button
                  type="button"
                  onClick={() => setAnswerMode('gemini')}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    answerMode === 'gemini'
                      ? 'border-black bg-black text-white'
                      : 'border-app-border bg-white text-app-text'
                  }`}
                >
                  Use Gemini
                </button>
              </div>

              <Button
                onClick={answerSelectedQuestion}
                className="bg-black text-white hover:bg-neutral-800"
                disabled={loadingAnswer || !selectedQuestion.trim() || (answerMode === 'notes' && !canUseNotes)}
              >
                {loadingAnswer ? 'Generating Answer...' : 'Generate Answer'}
              </Button>

              <div className="rounded-lg border border-app-border bg-neutral-50 p-3">
                {answer ? (
                  <p className="whitespace-pre-wrap text-sm text-app-text">{answer}</p>
                ) : (
                  <p className="text-sm text-app-muted">Answer will appear here.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
