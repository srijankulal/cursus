'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, BookOpen, MessageSquare, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

        .rag-wordmark { font-family: 'DM Serif Display', serif; }

        .rag-card {
          background: #FDFCF9;
          border: 1.5px solid #E8E6E0;
          border-radius: 20px;
        }

        .rag-tag {
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

        .rag-btn-ghost {
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
        .rag-btn-ghost:hover { border-color: #C8C6BF; color: #1A1916; background: #FDFCF9; }

        .rag-btn-dark {
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
        .rag-btn-dark:hover:not(:disabled) { background: #2E2D29; }
        .rag-btn-dark:disabled { background: #9E9B94; cursor: not-allowed; }

        .rag-input {
          width: 100%;
          border: 1.5px solid #E8E6E0;
          border-radius: 10px;
          height: 40px;
          padding: 0 12px;
          font-size: 13px;
          background: #F5F4F0;
          color: #1A1916;
        }
        .rag-input:focus { outline: none; border-color: #C8D8F0; box-shadow: 0 0 0 2px rgba(90,122,181,0.16); }

        .rag-scrollarea::-webkit-scrollbar { width: 4px; }
        .rag-scrollarea::-webkit-scrollbar-track { background: transparent; }
        .rag-scrollarea::-webkit-scrollbar-thumb { background: #E8E6E0; border-radius: 99px; }
        .rag-scrollarea::-webkit-scrollbar-thumb:hover { background: #C8C6BF; }

        .dot-grid-rag {
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
            <h1 className="rag-wordmark" style={{ fontSize: 20, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1 }}>
              RAG Workspace
            </h1>
            <p style={{ fontSize: 11, color: '#9E9B94', fontWeight: 500, marginTop: 2 }}>Ingest notes, query context, and review answers</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button asChild variant="outline" className="rag-btn-ghost">
            <Link href="/student">Back to student</Link>
          </Button>
          <button
            className="rag-btn-ghost"
            onClick={() => void loadDocuments(activeDocumentId || undefined)}
            disabled={isLoadingDocuments}
          >
            <RefreshCw size={14} className={isLoadingDocuments ? 'animate-spin' : ''} />
            Refresh Docs
          </button>
        </div>
      </header>

      <main style={{ position: 'relative', padding: '24px' }}>
        <div
          className="dot-grid-rag"
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
            maxWidth: 1180,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 380px) minmax(0, 1fr)',
            gap: 20,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rag-card"
            style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <span className="rag-tag" style={{ backgroundColor: '#E4ECFB', color: '#5A7AB5' }}>
                <BookOpen size={12} />
                Document Setup
              </span>
              <p style={{ fontSize: 13, color: '#7A7872', marginTop: 10 }}>
                Select an uploaded notes document or ingest a fresh one.
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
                Uploaded Documents
              </label>
              <Select
                value={selectedDocumentId}
                onValueChange={(value) => {
                  setSelectedDocumentId(value);
                  setIngestResult(null);
                }}
                disabled={isLoadingDocuments || notesDocuments.length === 0}
              >
                <SelectTrigger style={{ height: 40, border: '1.5px solid #E8E6E0', borderRadius: 10, background: '#F5F4F0' }}>
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
              {documentsError && <p style={{ color: '#C06060', fontSize: 12 }}>{documentsError}</p>}
            </div>

            {selectedDocumentId && !ingestResult && (
              <div
                style={{
                  borderRadius: 12,
                  border: '1.5px solid #C8D8F0',
                  backgroundColor: '#E4ECFB',
                  color: '#5A7AB5',
                  padding: '10px 12px',
                  fontSize: 12,
                }}
              >
                <p style={{ fontWeight: 700, marginBottom: 4 }}>Using existing uploaded document</p>
                <p style={{ wordBreak: 'break-all' }}>{selectedDocumentId}</p>
              </div>
            )}

            <form onSubmit={handleIngest} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E9B94' }}>
                  Notes PDF URL
                </label>
                <Input
                  className="rag-input"
                  placeholder="https://example.com/notes.pdf"
                  value={pdfUrl}
                  onChange={(event) => setPdfUrl(event.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E9B94' }}>
                  Subject (optional)
                </label>
                <Input
                  className="rag-input"
                  placeholder="Data Structures"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
              </div>

              <button type="submit" disabled={isIngesting || !pdfUrl.trim()} className="rag-btn-dark">
                {isIngesting ? 'Ingesting...' : 'Ingest Notes'}
              </button>
            </form>

            {ingestError && (
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
                {ingestError}
              </p>
            )}

            {ingestResult && (
              <div
                style={{
                  borderRadius: 12,
                  border: '1.5px solid #B8DEC9',
                  backgroundColor: '#E2F5EA',
                  color: '#4A9068',
                  padding: '10px 12px',
                  fontSize: 12,
                }}
              >
                <p style={{ fontWeight: 700 }}>Ready to chat</p>
                <p>Document ID: {ingestResult.document_id}</p>
                <p>Chunks: {ingestResult.chunk_count} • Vectors: {ingestResult.vector_count}</p>
              </div>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="rag-card"
            style={{ padding: 20, display: 'flex', flexDirection: 'column', minHeight: 640 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <div>
                <span className="rag-tag" style={{ backgroundColor: '#E2F5EA', color: '#4A9068' }}>
                  <MessageSquare size={12} />
                  Chat With Notes
                </span>
                <p style={{ fontSize: 13, color: '#7A7872', marginTop: 10 }}>
                  Ask your selected document and choose how detailed the answer should be.
                </p>
              </div>

              <div style={{ minWidth: 150 }}>
                <Select value={style} onValueChange={(value) => setStyle(value as QueryStyle)}>
                  <SelectTrigger style={{ height: 36, border: '1.5px solid #E8E6E0', borderRadius: 10, background: '#F5F4F0' }}>
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

            <div
              style={{
                borderRadius: 14,
                border: '1.5px solid #E8E6E0',
                backgroundColor: '#F5F4F0',
                padding: '10px 12px',
                marginBottom: 12,
              }}
            >
              <p style={{ fontSize: 10, color: '#9E9B94', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Active Document
              </p>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#1A1916', marginTop: 4, wordBreak: 'break-all' }}>
                {activeDocumentId || 'No document selected'}
              </p>
            </div>

            <div
              className="rag-scrollarea"
              style={{
                flex: 1,
                borderRadius: 16,
                border: '1.5px solid #E8E6E0',
                backgroundColor: '#F5F4F0',
                padding: 12,
                overflowY: 'auto',
                minHeight: 320,
                maxHeight: 460,
              }}
            >
              {chat.length === 0 ? (
                <div style={{ height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', color: '#9E9B94' }}>
                  <div>
                    <Sparkles size={20} style={{ margin: '0 auto 8px', opacity: 0.8 }} />
                    <p style={{ fontSize: 13 }}>No messages yet</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {chat.map((message, index) => (
                    <div key={`${message.role}-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: message.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
                      <div
                        style={{
                          maxWidth: '88%',
                          borderRadius: 12,
                          padding: '10px 12px',
                          fontSize: 13,
                          lineHeight: 1.6,
                          border: message.role === 'user' ? 'none' : '1.5px solid #E8E6E0',
                          backgroundColor: message.role === 'user' ? '#1A1916' : '#FDFCF9',
                          color: message.role === 'user' ? '#F5F4F0' : '#1A1916',
                        }}
                      >
                        {message.role === 'assistant' ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p style={{ marginBottom: 8 }}>{children}</p>,
                              ul: ({ children }) => <ul style={{ marginBottom: 8, paddingLeft: 20, listStyle: 'disc' }}>{children}</ul>,
                              ol: ({ children }) => <ol style={{ marginBottom: 8, paddingLeft: 20, listStyle: 'decimal' }}>{children}</ol>,
                              li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                              strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                              code: ({ children }) => (
                                <code style={{ borderRadius: 6, background: '#F5F4F0', padding: '2px 6px', fontSize: '0.9em' }}>{children}</code>
                              ),
                              pre: ({ children }) => (
                                <pre style={{ marginBottom: 8, overflowX: 'auto', borderRadius: 8, background: '#F5F4F0', padding: 10, fontSize: '0.9em' }}>
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
                        <Badge
                          variant="outline"
                          className={
                            message.usedGeminiFallback
                              ? 'border-[#F0C0C0] bg-[#FDE8E8] text-[#C06060]'
                              : 'border-[#B8DEC9] bg-[#E2F5EA] text-[#4A9068]'
                          }
                        >
                          {message.usedGeminiFallback ? 'Gemini fallback used' : 'Indexed notes answer'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleAsk} style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <Input
                className="rag-input"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={isReady ? 'Ask a question about your notes...' : 'Select or ingest notes first...'}
                disabled={!isReady || isAsking}
                required
              />
              <button
                type="submit"
                className="rag-btn-dark"
                style={{ minWidth: 94, padding: '0 16px' }}
                disabled={!isReady || isAsking || !question.trim()}
              >
                {isAsking ? 'Asking...' : 'Ask'}
              </button>
            </form>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
