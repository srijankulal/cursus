'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Wand2, RefreshCw, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
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
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F4F0',
        color: '#1A1916',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800&family=DM+Serif+Display:ital@0;1&display=swap');

        .qp-wordmark { font-family: 'DM Serif Display', serif; }

        .qp-card {
          background: #FDFCF9;
          border: 1.5px solid #E8E6E0;
          border-radius: 20px;
        }

        .qp-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .qp-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: #6B6860;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 12px;
          padding: 8px 14px;
          border: 1.5px solid #E8E6E0;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
        }
        .qp-btn-ghost:hover { border-color: #C8C6BF; color: #1A1916; background: #FDFCF9; }

        .qp-btn-dark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 12px;
          height: 40px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: #1A1916;
          color: #F5F4F0;
          transition: background 0.2s ease;
          cursor: pointer;
        }
        .qp-btn-dark:hover:not(:disabled) { background: #2E2D29; }
        .qp-btn-dark:disabled { background: #9E9B94; cursor: not-allowed; }

        .qp-input {
          width: 100%;
          border: 1.5px solid #E8E6E0;
          border-radius: 10px;
          height: 40px;
          padding: 0 12px;
          font-size: 13px;
          background: #F5F4F0;
          color: #1A1916;
        }
        .qp-input:focus { outline: none; border-color: #C8D8F0; box-shadow: 0 0 0 2px rgba(90,122,181,0.16); }

        .qp-scrollarea::-webkit-scrollbar { width: 4px; }
        .qp-scrollarea::-webkit-scrollbar-track { background: transparent; }
        .qp-scrollarea::-webkit-scrollbar-thumb { background: #E8E6E0; border-radius: 99px; }
        .qp-scrollarea::-webkit-scrollbar-thumb:hover { background: #C8C6BF; }

        .dot-grid-qp {
          background-image: radial-gradient(circle, #D0CEC8 1px, transparent 1px);
          background-size: 28px 28px;
        }
      `}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          height: 64,
          backgroundColor: 'rgba(245,244,240,0.88)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E8E6E0',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: '#1A1916',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#F5F4F0', fontSize: 13, fontWeight: 800, fontFamily: 'DM Serif Display, serif' }}>
              C
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 className="qp-wordmark" style={{ fontSize: 20, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Question Paper Lab
            </h1>
            <p style={{ fontSize: 11, color: '#9E9B94', fontWeight: 500, marginTop: 2 }}>
              Ingest papers, extract questions, generate guided answers
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button asChild variant="outline" className="qp-btn-ghost">
            <Link href="/student">Back to student</Link>
          </Button>
          <button
            className="qp-btn-ghost"
            onClick={() => {
              void loadQpaperList(selectedQpaperId || undefined, selectedNotesId || undefined);
            }}
            disabled={loadingQpaperList}
          >
            <RefreshCw size={14} className={loadingQpaperList ? 'animate-spin' : ''} />
            Refresh Docs
          </button>
        </div>
      </header>

      <main style={{ position: 'relative', padding: 24 }}>
        <div
          className="dot-grid-qp"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 220,
            opacity: 0.3,
            pointerEvents: 'none',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          }}
        />

        <div
          style={{
            maxWidth: 1220,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 390px) minmax(0, 1fr)',
            gap: 20,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="qp-card"
            style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <span className="qp-tag" style={{ backgroundColor: '#E4ECFB', color: '#5A7AB5' }}>
                <FileText size={12} />
                Workflow
              </span>
              <p style={{ fontSize: 13, color: '#7A7872', marginTop: 10 }}>
                Select or ingest a paper, extract questions, then answer from notes or Gemini.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {workflowSteps.map((step) => (
                <div
                  key={step.id}
                  style={{
                    borderRadius: 12,
                    border: `1.5px solid ${step.done ? '#B8DEC9' : '#E8E6E0'}`,
                    backgroundColor: step.done ? '#E2F5EA' : '#F5F4F0',
                    color: step.done ? '#4A9068' : '#7A7872',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <span>{step.id}. {step.label}</span>
                  <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {step.done ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E9B94' }}>
                Uploaded Question Papers
              </label>
              <Select
                value={selectedQpaperId}
                onValueChange={(value) => {
                  void handleSelectQpaper(value);
                }}
                disabled={loadingQpaperList || qpaperOptions.length === 0}
              >
                <SelectTrigger style={{ height: 40, border: '1.5px solid #E8E6E0', borderRadius: 10, background: '#F5F4F0' }}>
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
              {qpaperListError && <p style={{ color: '#C06060', fontSize: 12 }}>{qpaperListError}</p>}
            </div>

            <form onSubmit={ingestQuestionPaper} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 2 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E9B94' }}>
                Question Paper PDF URL
              </label>
              <Input
                className="qp-input"
                placeholder="https://example.com/question-paper.pdf"
                value={questionPaperUrl}
                onChange={(event) => setQuestionPaperUrl(event.target.value)}
                required
              />
              <button
                type="submit"
                className="qp-btn-dark"
                disabled={loadingQpaper || !questionPaperUrl.trim()}
              >
                {loadingQpaper ? 'Ingesting...' : 'Ingest Question Paper'}
              </button>
            </form>

            <div style={{ borderTop: '1px solid #E8E6E0', marginTop: 2, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E9B94' }}>
                Uploaded Notes
              </label>
              <Select
                value={selectedNotesId}
                onValueChange={(value) => {
                  setSelectedNotesId(value);
                  setNotesResult(null);
                  setAnswer('');
                }}
                disabled={loadingQpaperList || notesOptions.length === 0}
              >
                <SelectTrigger style={{ height: 40, border: '1.5px solid #E8E6E0', borderRadius: 10, background: '#F5F4F0' }}>
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

              <form onSubmit={ingestNotes} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E9B94' }}>
                  Notes PDF URL (optional)
                </label>
                <Input
                  className="qp-input"
                  placeholder="https://example.com/notes.pdf"
                  value={notesUrl}
                  onChange={(event) => setNotesUrl(event.target.value)}
                />
                <button
                  type="submit"
                  className="qp-btn-ghost"
                  style={{ justifyContent: 'center', height: 40 }}
                  disabled={loadingNotes || !notesUrl.trim()}
                >
                  {loadingNotes ? 'Ingesting Notes...' : 'Ingest Notes'}
                </button>
              </form>
            </div>

            {qpaperResult && (
              <p
                style={{
                  borderRadius: 12,
                  border: '1.5px solid #B8DEC9',
                  backgroundColor: '#E2F5EA',
                  color: '#4A9068',
                  padding: '10px 12px',
                  fontSize: 12,
                }}
              >
                Qpaper ready: {qpaperResult.question_count} questions parsed.
              </p>
            )}

            {notesResult && (
              <p
                style={{
                  borderRadius: 12,
                  border: '1.5px solid #B8DEC9',
                  backgroundColor: '#E2F5EA',
                  color: '#4A9068',
                  padding: '10px 12px',
                  fontSize: 12,
                }}
              >
                Notes ready for answer generation.
              </p>
            )}

            {selectedNotesId && !notesResult && (
              <p
                style={{
                  borderRadius: 12,
                  border: '1.5px solid #C8D8F0',
                  backgroundColor: '#E4ECFB',
                  color: '#5A7AB5',
                  padding: '10px 12px',
                  fontSize: 12,
                }}
              >
                Using existing uploaded notes.
              </p>
            )}

            {error && (
              <p
                style={{
                  borderRadius: 12,
                  border: '1.5px solid #F0C0C0',
                  backgroundColor: '#FDE8E8',
                  color: '#C06060',
                  padding: '10px 12px',
                  fontSize: 12,
                }}
              >
                {error}
              </p>
            )}
          </motion.section>

          <div style={{ display: 'grid', gap: 20, minWidth: 0 }}>
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="qp-card"
              style={{ padding: 20 }}
            >
              <div style={{ marginBottom: 12 }}>
                <span className="qp-tag" style={{ backgroundColor: '#E2F5EA', color: '#4A9068' }}>
                  <Wand2 size={12} />
                  Extracted Questions
                </span>
              </div>

              {loadingQuestions ? (
                <p style={{ fontSize: 13, color: '#7A7872' }}>Extracting questions...</p>
              ) : questions.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9E9B94' }}>No questions yet. Ingest or select a question paper first.</p>
              ) : (
                <div className="qp-scrollarea" style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 2, display: 'grid', gap: 8 }}>
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
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          borderRadius: 12,
                          border: selected ? '1.5px solid #1A1916' : '1.5px solid #E8E6E0',
                          backgroundColor: selected ? '#1A1916' : '#F5F4F0',
                          color: selected ? '#F5F4F0' : '#1A1916',
                          padding: '10px 12px',
                          transition: 'all 0.18s ease',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.75, marginBottom: 4 }}>
                          {item.metadata?.question_number ? `Q${item.metadata.question_number}` : 'Question'}
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.55 }}>{item.text_preview}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="qp-card"
              style={{ padding: 20 }}
            >
              <div style={{ marginBottom: 12 }}>
                <span className="qp-tag" style={{ backgroundColor: '#FDE8E8', color: '#C06060' }}>
                  <Brain size={12} />
                  Answer Selected Question
                </span>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E9B94' }}>
                  Selected Question
                </label>
                <textarea
                  value={selectedQuestion}
                  onChange={(event) => setSelectedQuestion(event.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    border: '1.5px solid #E8E6E0',
                    backgroundColor: '#F5F4F0',
                    color: '#1A1916',
                    padding: '10px 12px',
                    fontSize: 13,
                    lineHeight: 1.55,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                  placeholder="Select or edit a question"
                />
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setAnswerMode('notes')}
                  disabled={!canUseNotes}
                  className="qp-btn-ghost"
                  style={{
                    borderColor: answerMode === 'notes' ? '#1A1916' : '#E8E6E0',
                    backgroundColor: answerMode === 'notes' ? '#1A1916' : 'transparent',
                    color: answerMode === 'notes' ? '#F5F4F0' : '#1A1916',
                    opacity: canUseNotes ? 1 : 0.55,
                  }}
                >
                  Use Uploaded Notes
                </button>
                <button
                  type="button"
                  onClick={() => setAnswerMode('gemini')}
                  className="qp-btn-ghost"
                  style={{
                    borderColor: answerMode === 'gemini' ? '#1A1916' : '#E8E6E0',
                    backgroundColor: answerMode === 'gemini' ? '#1A1916' : 'transparent',
                    color: answerMode === 'gemini' ? '#F5F4F0' : '#1A1916',
                  }}
                >
                  Use Gemini
                </button>
              </div>

              <button
                onClick={answerSelectedQuestion}
                className="qp-btn-dark"
                style={{ marginTop: 12, minWidth: 180, padding: '0 18px' }}
                disabled={loadingAnswer || !selectedQuestion.trim() || (answerMode === 'notes' && !canUseNotes)}
              >
                {loadingAnswer ? 'Generating...' : 'Generate Answer'}
              </button>

              <div
                className="qp-scrollarea"
                style={{
                  marginTop: 12,
                  borderRadius: 14,
                  border: '1.5px solid #E8E6E0',
                  backgroundColor: '#F5F4F0',
                  padding: '12px 14px',
                  minHeight: 180,
                  maxHeight: 360,
                  overflowY: 'auto',
                }}
              >
                {answer ? (
                  <div style={{ fontSize: 13, color: '#1A1916', lineHeight: 1.65 }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p style={{ marginBottom: 8 }}>{children}</p>,
                        ul: ({ children }) => <ul style={{ marginBottom: 8, paddingLeft: 20, listStyle: 'disc' }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ marginBottom: 8, paddingLeft: 20, listStyle: 'decimal' }}>{children}</ol>,
                        li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                        strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                        code: ({ children }) => (
                          <code style={{ borderRadius: 6, background: '#FDFCF9', padding: '2px 6px', fontSize: '0.9em' }}>{children}</code>
                        ),
                        pre: ({ children }) => (
                          <pre style={{ marginBottom: 8, overflowX: 'auto', borderRadius: 8, background: '#FDFCF9', padding: 10, fontSize: '0.9em' }}>
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {answer}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: '#9E9B94' }}>Answer will appear here.</p>
                )}
              </div>
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  );
}
