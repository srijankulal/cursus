'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { syllabus } from '@/data/syllabus';
import { askAIChat } from '@/lib/gemini';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Msg { role: 'user' | 'model'; content: string; }

export const AskAI = () => {
  const [topicId, setTopicId] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sem = syllabus[0];
  const allTopics = sem.subjects.flatMap(s =>
    s.units.flatMap(u => u.topics.map(t => ({ ...t, subject: s.name, unit: u.name })))
  );
  const currentTopic = allTopics.find(t => t.id === topicId);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !topicId) return;
    const userMsg: Msg = { role: 'user', content: input };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);
    try {
      const resp = await askAIChat(
        currentTopic!.name, currentTopic!.subject, currentTopic!.unit,
        messages, input
      );
      setMessages([...nextHistory, { role: 'model', content: resp }]);
    } catch {
      setMessages([...nextHistory, { role: 'model', content: 'Error contacting Gemini. Check your API key.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Topic select */}
      <div className="mb-4">
        <Select value={topicId} onValueChange={id => { setTopicId(id); setMessages([]); }}>
          <SelectTrigger className="w-full h-10 border-app-border bg-white rounded-xl text-sm font-medium shadow-none">
            <SelectValue placeholder="Select a topic…" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-app-border shadow-md max-h-72">
            {sem.subjects.map(s => (
              <SelectGroup key={s.id}>
                <SelectLabel className="text-[10px] font-semibold text-app-muted uppercase tracking-wider px-3 pt-2">{s.name}</SelectLabel>
                {s.units.flatMap(u => u.topics).map(t => (
                  <SelectItem key={t.id} value={t.id} className="text-sm font-medium">{t.name}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chat window */}
      <div className="flex-1 border border-app-border rounded-xl bg-white overflow-hidden flex flex-col shadow-none">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-app-muted">
              <Sparkles size={28} />
              <p className="text-sm font-medium">
                {topicId ? `Ask anything about ${currentTopic?.name}…` : 'Select a topic above to start.'}
              </p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3 items-start', m.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {m.role === 'model' && (
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-app-border flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-app-muted" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] px-4 py-3 rounded-xl text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'bg-black text-white rounded-tr-sm'
                      : 'bg-neutral-50 border border-app-border text-app-text rounded-tl-sm'
                  )}
                >
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-app-border flex items-center justify-center shrink-0">
                    <User size={14} className="text-app-muted" />
                  </div>
                )}
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-app-border flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-app-muted" />
                </div>
                <div className="bg-neutral-50 border border-app-border px-4 py-3 rounded-xl rounded-tl-sm flex gap-1.5">
                  {[0, 1, 2].map(k => (
                    <span key={k} className="w-1.5 h-1.5 bg-app-muted rounded-full animate-bounce" style={{ animationDelay: `${k * 0.15}s` }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <form onSubmit={send} className="border-t border-app-border p-4 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={!topicId || loading}
            placeholder={topicId ? `Ask about ${currentTopic?.name}…` : 'Select a topic first…'}
            className="flex-1 bg-neutral-50 border border-app-border rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-neutral-300 placeholder:text-app-muted disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || loading}
            size="icon"
            className="bg-black text-white hover:bg-neutral-800 rounded-lg w-10 h-10 shrink-0"
          >
            <Send size={15} />
          </Button>
        </form>
      </div>
    </div>
  );
};
