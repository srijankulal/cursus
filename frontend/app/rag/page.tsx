'use client';

import { FormEvent, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type IngestResponse = {
  document_id: string;
  status: string;
  message: string;
  chunk_count: number;
  vector_count: number;
};

export default function RagWorkflowPage() {
  const [pdfUrl, setPdfUrl] = useState('');
  const [subject, setSubject] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<IngestResponse | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const isReady = Boolean(ingestResult?.document_id);

  const workflowSteps = useMemo(
    () => [
      { id: 1, label: 'Paste Notes PDF Link', done: Boolean(pdfUrl.trim()) },
      { id: 2, label: 'Ingest Notes', done: Boolean(ingestResult) },
      { id: 3, label: 'Ready To Chat', done: isReady },
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
    } catch {
      setIngestError('Unable to ingest right now. Please try again.');
    } finally {
      setIsIngesting(false);
    }
  }

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || !ingestResult?.document_id) return;

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
          document_id: ingestResult.document_id,
          style: 'brief',
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

      setChat((prev) => [...prev, { role: 'assistant', content: data.answer ?? 'No answer.' }]);
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
    <main className="min-h-screen bg-app-bg px-4 py-8 sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="border border-app-border bg-white">
          <CardHeader>
            <CardTitle className="text-xl">RAG Workflow</CardTitle>
            <p className="text-sm text-app-muted">Ingest notes PDF, then ask questions against that document.</p>
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
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{ingestError}</p>
            )}

            {ingestResult && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <p className="font-medium">Ready to chat.</p>
                <p>Document ID: {ingestResult.document_id}</p>
                <p>Chunks: {ingestResult.chunk_count} • Vectors: {ingestResult.vector_count}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-app-border bg-white">
          <CardHeader>
            <CardTitle className="text-xl">Chat With Notes</CardTitle>
            <p className="text-sm text-app-muted">Ask questions after ingestion completes.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[420px] overflow-y-auto rounded-lg border border-app-border bg-neutral-50 p-4">
              {chat.length === 0 ? (
                <p className="text-sm text-app-muted">No messages yet.</p>
              ) : (
                <div className="space-y-3">
                  {chat.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        message.role === 'user'
                          ? 'ml-auto bg-black text-white'
                          : 'bg-white text-app-text border border-app-border'
                      }`}
                    >
                      {message.content}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleAsk} className="flex gap-2">
              <Input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={isReady ? 'Ask a question about your notes...' : 'Ingest notes first...'}
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
    </main>
  );
}
