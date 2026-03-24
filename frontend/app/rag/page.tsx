'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  usedGeminiFallback?: boolean | null;
};

type IngestResponse = {
  document_id: string;
  status: string;
  message: string;
  chunk_count: number;
  vector_count: number;
  document_name?: string;
  doc_type?: 'notes' | 'qpaper';
  subject?: string | null;
  updated_at?: string;
  created_at?: string;
};

type QueryStyle = 'brief' | 'detailed' | 'bullets';

export default function RagWorkflowPage() {
  const [pdfUrl, setPdfUrl] = useState('');
  const [subject, setSubject] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<IngestResponse | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [style, setStyle] = useState<QueryStyle>('brief');

  const [documents, setDocuments] = useState<IngestResponse[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');

  const activeDocumentId = ingestResult?.document_id || selectedDocumentId;

  const isReady = Boolean(activeDocumentId);

  const notesDocuments = useMemo(
    () => documents.filter((item) => !item.doc_type || item.doc_type === 'notes'),
    [documents]
  );

  async function loadDocuments(preferredDocumentId?: string) {
    setIsLoadingDocuments(true);
    setDocumentsError(null);

    try {
      const response = await fetch('/api/rag/ingest', { method: 'GET', cache: 'no-store' });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setDocumentsError(data.message ?? 'Failed to load uploaded documents.');
        return;
      }

      const incomingDocs: IngestResponse[] = Array.isArray(data.documents) ? data.documents : [];
      const filteredNotes = incomingDocs.filter((item) => !item.doc_type || item.doc_type === 'notes');
      setDocuments(filteredNotes);

      if (preferredDocumentId) {
        setSelectedDocumentId(preferredDocumentId);
      } else if (!activeDocumentId && filteredNotes.length > 0) {
        setSelectedDocumentId(filteredNotes[0].document_id);
      }
    } catch {
      setDocumentsError('Unable to load uploaded documents right now.');
    } finally {
      setIsLoadingDocuments(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const workflowSteps = useMemo(
    () => [
      { id: 1, label: 'Paste Notes PDF Link', done: Boolean(pdfUrl.trim()) },
      { id: 2, label: 'Ingest Notes', done: Boolean(ingestResult) },
      { id: 3, label: 'Pick Existing Or New Document', done: isReady },
      { id: 4, label: 'Ask Questions', done: chat.length > 0 },
    ],
    [pdfUrl, ingestResult, isReady, chat.length]
  );

  async function handleIngest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsIngesting(true);
    setIngestError(null);
    setIngestResult(null);
    setChat([]);

    try {
      const response = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: pdfUrl,
          doc_type: 'notes',
          subject: subject || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setIngestError(data.message ?? 'Ingestion failed.');
        return;
      }

      setIngestResult(data);
      setSelectedDocumentId(data.document_id);
      await loadDocuments(data.document_id);
    } catch {
      setIngestError('Unable to ingest right now. Please try again.');
    } finally {
      setIsIngesting(false);
    }
  }

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || !activeDocumentId) return;

    const userMessage = question.trim();
    setQuestion('');
    setChat((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsAsking(true);

    try {
      const response = await fetch('/api/rag/query-clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          doc_type: 'notes',
          document_id: activeDocumentId,
          style,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setChat((prev) => [
          ...prev,
          { role: 'assistant', content: data.message ?? 'Could not fetch answer.' },
        ]);
        return;
      }

      setChat((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer ?? 'No answer.',
          usedGeminiFallback: data.used_gemini_fallback ?? null,
        },
      ]);
    } catch {
      setChat((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong while querying notes.' },
      ]);
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div className="flex h-screen bg-app-bg text-app-text overflow-hidden">
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1 m-3 sm:m-6 bg-app-surface rounded-[1.25rem] border border-app-border shadow-premium overflow-hidden flex flex-col">
          <header className="px-4 sm:px-8 py-4 sm:py-6 border-b border-app-border shrink-0 flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900">RAG Workspace</h1>
              <p className="hidden sm:block text-[13px] text-app-muted mt-0.5 line-clamp-1">
                Reuse uploaded notes, ingest new PDFs, and query with response style controls.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/student">Go to Student</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadDocuments(activeDocumentId || undefined)}
                disabled={isLoadingDocuments}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingDocuments ? 'animate-spin' : ''}`} />
                Refresh Docs
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/20">
            <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[360px_1fr]">
              <Card className="border border-app-border bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Document Setup</CardTitle>
                  <p className="text-sm text-app-muted">Choose an uploaded document or ingest a new one.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workflowSteps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        step.done
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-app-border bg-neutral-50 text-app-muted'
                      }`}
                    >
                      <span>
                        {step.id}. {step.label}
                      </span>
                      <span className="text-xs font-semibold uppercase">{step.done ? 'Done' : 'Pending'}</span>
                    </div>
                  ))}

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-app-text">Uploaded Documents</label>
                    <Select
                      value={selectedDocumentId}
                      onValueChange={(value) => {
                        setSelectedDocumentId(value);
                        setIngestResult(null);
                      }}
                      disabled={isLoadingDocuments || notesDocuments.length === 0}
                    >
                      <SelectTrigger className="w-full h-10">
                        <SelectValue
                          placeholder={
                            isLoadingDocuments
                              ? 'Loading uploaded documents...'
                              : notesDocuments.length === 0
                                ? 'No uploaded notes found yet'
                                : 'Select uploaded document'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {notesDocuments.map((item) => (
                          <SelectItem key={item.document_id} value={item.document_id}>
                            {(item.document_name || item.document_id).slice(0, 56)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {documentsError && <p className="text-xs text-red-600">{documentsError}</p>}
                  </div>

                  {selectedDocumentId && !ingestResult && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                      <p className="font-medium">Using existing uploaded document.</p>
                      <p>Document ID: {selectedDocumentId}</p>
                    </div>
                  )}

                  <form onSubmit={handleIngest} className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-app-text">Notes PDF URL</label>
                      <Input
                        placeholder="https://example.com/notes.pdf"
                        value={pdfUrl}
                        onChange={(event) => setPdfUrl(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-app-text">Subject (optional)</label>
                      <Input
                        placeholder="Data Structures"
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isIngesting || !pdfUrl.trim()}
                      className="w-full bg-black text-white hover:bg-neutral-800"
                    >
                      {isIngesting ? 'Ingesting...' : 'Ingest Notes'}
                    </Button>
                  </form>

                  {ingestError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {ingestError}
                    </p>
                  )}

                  {ingestResult && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      <p className="font-medium">Ready to chat.</p>
                      <p>Document ID: {ingestResult.document_id}</p>
                      <p>
                        Chunks: {ingestResult.chunk_count} • Vectors: {ingestResult.vector_count}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-app-border bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Chat With Notes</CardTitle>
                  <p className="text-sm text-app-muted">Choose answer style and ask questions against the selected document.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-app-border bg-neutral-50 px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Active Document</p>
                      <p className="text-sm font-medium text-app-text truncate max-w-65">
                        {activeDocumentId || 'No document selected'}
                      </p>
                    </div>
                    <div className="min-w-37.5">
                      <Select value={style} onValueChange={(value) => setStyle(value as QueryStyle)}>
                        <SelectTrigger className="w-full h-9 bg-white">
                          <SelectValue placeholder="Answer style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="brief">Brief</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                          <SelectItem value="bullets">Bullets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="h-115 overflow-y-auto rounded-lg border border-app-border bg-neutral-50 p-4">
                    {chat.length === 0 ? (
                      <p className="text-sm text-app-muted">No messages yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {chat.map((message, index) => (
                          <div key={`${message.role}-${index}`} className="space-y-1">
                            <div
                              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                                message.role === 'user'
                                  ? 'ml-auto bg-black text-white'
                                  : 'bg-white text-app-text border border-app-border'
                              }`}
                            >
                              {message.role === 'assistant' ? (
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
                                    ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
                                    li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                    code: ({ children }) => (
                                      <code className="rounded bg-neutral-100 px-1 py-0.5 text-[0.9em]">{children}</code>
                                    ),
                                    pre: ({ children }) => (
                                      <pre className="mb-2 overflow-x-auto rounded bg-neutral-100 p-2 text-[0.9em] last:mb-0">
                                        {children}
                                      </pre>
                                    ),
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              ) : (
                                message.content
                              )}
                            </div>
                            {message.role === 'assistant' && typeof message.usedGeminiFallback === 'boolean' && (
                              <div className="max-w-[85%]">
                                <Badge
                                  variant="outline"
                                  className={
                                    message.usedGeminiFallback
                                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  }
                                >
                                  {message.usedGeminiFallback ? 'Gemini fallback used' : 'Indexed notes answer'}
                                </Badge>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleAsk} className="flex gap-2">
                    <Input
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      placeholder={isReady ? 'Ask a question about your notes...' : 'Select or ingest notes first...'}
                      disabled={!isReady || isAsking}
                      required
                    />
                    <Button
                      type="submit"
                      disabled={!isReady || isAsking || !question.trim()}
                      className="bg-black text-white hover:bg-neutral-800"
                    >
                      {isAsking ? 'Asking...' : 'Ask'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
