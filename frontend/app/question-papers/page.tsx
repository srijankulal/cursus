'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

type UploadedDocument = {
  document_id: string;
  document_name?: string;
  doc_type?: 'notes' | 'qpaper';
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

  const [uploadedQpapers, setUploadedQpapers] = useState<UploadedDocument[]>([]);
  const [selectedQpaperId, setSelectedQpaperId] = useState('');
  const [selectedNotesId, setSelectedNotesId] = useState('');
  const [loadingQpaperList, setLoadingQpaperList] = useState(false);
  const [qpaperListError, setQpaperListError] = useState<string | null>(null);

  const canUseNotes = Boolean(notesResult?.document_id || selectedNotesId);
  const hasActiveQpaper = Boolean(qpaperResult?.document_id || selectedQpaperId);

  const workflowSteps = useMemo(
    () => [
      { id: 1, label: 'Ingest or Select Question Paper', done: hasActiveQpaper },
      { id: 2, label: 'Extract Questions', done: questions.length > 0 },
      { id: 3, label: 'Optional: Ingest or Select Notes PDF', done: Boolean(notesResult?.document_id || selectedNotesId) },
      { id: 4, label: 'Answer Questions (Notes or Gemini)', done: Boolean(answer.trim()) },
    ],
    [hasActiveQpaper, questions.length, notesResult, selectedNotesId, answer]
  );

  const qpaperOptions = useMemo(
    () => uploadedQpapers.filter((item) => item.doc_type === 'qpaper'),
    [uploadedQpapers]
  );

  const notesOptions = useMemo(
    () => uploadedQpapers.filter((item) => item.doc_type === 'notes'),
    [uploadedQpapers]
  );

  useEffect(() => {
    void loadQpaperList();
  }, []);

  function questionNumberSortValue(raw?: string) {
    const normalized = (raw ?? '').trim().toLowerCase().replace(/^q\s*/, '');
    const numberMatch = normalized.match(/^(\d+)/);
    const number = numberMatch ? Number.parseInt(numberMatch[1], 10) : Number.POSITIVE_INFINITY;
    const suffix = numberMatch ? normalized.slice(numberMatch[1].length).trim() : normalized;
    return { number, suffix };
  }

  function sortQuestions(hits: QuestionHit[]) {
    return [...hits].sort((left, right) => {
      const leftSort = questionNumberSortValue(left.metadata?.question_number);
      const rightSort = questionNumberSortValue(right.metadata?.question_number);

      if (leftSort.number !== rightSort.number) {
        return leftSort.number - rightSort.number;
      }

      if (leftSort.suffix !== rightSort.suffix) {
        return leftSort.suffix.localeCompare(rightSort.suffix);
      }

      return left.text_preview.localeCompare(right.text_preview);
    });
  }

  async function loadQpaperList(preferredQpaperId?: string, preferredNotesId?: string) {
    setLoadingQpaperList(true);
    setQpaperListError(null);

    try {
      const response = await fetch('/api/rag/ingest', { method: 'GET', cache: 'no-store' });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setQpaperListError(data.message ?? 'Failed to load uploaded question papers.');
        return;
      }

      const incomingDocs: UploadedDocument[] = Array.isArray(data.documents) ? data.documents : [];
      const qpapers = incomingDocs.filter((item) => item.doc_type === 'qpaper');
      const notes = incomingDocs.filter((item) => item.doc_type === 'notes');
      setUploadedQpapers(incomingDocs);

      if (preferredQpaperId) {
        setSelectedQpaperId(preferredQpaperId);
      } else if (!selectedQpaperId && qpapers.length > 0) {
        setSelectedQpaperId(qpapers[0].document_id);
      }

      if (preferredNotesId) {
        setSelectedNotesId(preferredNotesId);
      } else if (!selectedNotesId && notes.length > 0) {
        setSelectedNotesId(notes[0].document_id);
      }
    } catch {
      setQpaperListError('Unable to load uploaded question papers right now.');
    } finally {
      setLoadingQpaperList(false);
    }
  }

  async function handleSelectQpaper(documentId: string) {
    setSelectedQpaperId(documentId);
    setQpaperResult(null);
    setError(null);
    setAnswer('');
    setSelectedQuestion('');
    await fetchQuestions(documentId);
  }

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
      setSelectedQpaperId(data.document_id);
      await loadQpaperList(data.document_id, selectedNotesId || undefined);
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
      setSelectedNotesId(data.document_id);
      await loadQpaperList(selectedQpaperId || undefined, data.document_id);
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
      const sortedHits = sortQuestions(hits);
      setQuestions(sortedHits);
      if (sortedHits.length > 0) {
        setSelectedQuestion(sortedHits[0].text_preview);
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

    if (answerMode === 'notes') {
      const activeNotesDocumentId = notesResult?.document_id || selectedNotesId;
      if (activeNotesDocumentId) {
        requestBody.document_id = activeNotesDocumentId;
      }
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
      <div className="mx-auto mb-4 flex w-full max-w-7xl justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href="/student">Go to Student</Link>
        </Button>
      </div>
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

            <div className="space-y-1">
              <label className="text-sm font-medium text-app-text">Uploaded Question Papers</label>
              <Select
                value={selectedQpaperId}
                onValueChange={(value) => {
                  void handleSelectQpaper(value);
                }}
                disabled={loadingQpaperList || qpaperOptions.length === 0}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue
                    placeholder={
                      loadingQpaperList
                        ? 'Loading uploaded question papers...'
                        : qpaperOptions.length === 0
                          ? 'No uploaded question papers found yet'
                          : 'Select uploaded question paper'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {qpaperOptions.map((item) => (
                    <SelectItem key={item.document_id} value={item.document_id}>
                      {(item.document_name || item.document_id).slice(0, 56)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {qpaperListError && <p className="text-xs text-red-600">{qpaperListError}</p>}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                void loadQpaperList(selectedQpaperId || undefined, selectedNotesId || undefined);
              }}
              disabled={loadingQpaperList}
            >
              {loadingQpaperList ? 'Refreshing...' : 'Refresh Uploaded Documents'}
            </Button>

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
              <div className="space-y-1">
                <label className="text-sm font-medium text-app-text">Uploaded Notes</label>
                <Select
                  value={selectedNotesId}
                  onValueChange={(value) => {
                    setSelectedNotesId(value);
                    setNotesResult(null);
                    setAnswer('');
                  }}
                  disabled={loadingQpaperList || notesOptions.length === 0}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue
                      placeholder={
                        loadingQpaperList
                          ? 'Loading uploaded notes...'
                          : notesOptions.length === 0
                            ? 'No uploaded notes found yet'
                            : 'Select uploaded notes'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {notesOptions.map((item) => (
                      <SelectItem key={item.document_id} value={item.document_id}>
                        {(item.document_name || item.document_id).slice(0, 56)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

            {selectedNotesId && !notesResult && (
              <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                Using existing uploaded notes.
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
                  <div className="text-sm text-app-text">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
                        li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        code: ({ children }) => (
                          <code className="rounded bg-white px-1 py-0.5 text-[0.9em]">{children}</code>
                        ),
                        pre: ({ children }) => (
                          <pre className="mb-2 overflow-x-auto rounded bg-white p-2 text-[0.9em] last:mb-0">
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {answer}
                    </ReactMarkdown>
                  </div>
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
