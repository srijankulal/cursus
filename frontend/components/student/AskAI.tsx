'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { syllabus } from '@/data/syllabus';
import { askAIChat } from '@/lib/claude';
import { Send, MessageSquare, Brain, User, Bot, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const AskAI = () => {
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allTopics = syllabus.flatMap(sem => sem.subjects.flatMap(s => s.units.flatMap(u => ({
    ...u.topics.map(t => ({ ...t, subject: s.name, unit: u.name }))
  }))).flat()) as any[];

  const currentTopic = allTopics.find(t => t.id === selectedTopicId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedTopicId) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await askAIChat(
        currentTopic.name,
        currentTopic.subject,
        currentTopic.unit,
        messages,
        input
      );
      setMessages(prev => [...prev, { role: 'assistant', content: resp }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please check your connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto space-y-8 pb-10">
      <Card className="rounded-[2.5rem] border-base-border shadow-md bg-white p-8">
        <CardContent className="p-0 flex items-center space-x-10">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-base-muted">Focus Topic</label>
            <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
              <SelectTrigger className="w-full h-14 px-6 bg-base-surface border-base-border rounded-2xl font-bold text-base shadow-sm hover:bg-white transition-all">
                <SelectValue placeholder="Select a topic to discuss..." />
              </SelectTrigger>
              <SelectContent className="rounded-3xl border-base-border shadow-2xl p-3 max-h-80">
                {syllabus[0].subjects.map(subject => (
                  <SelectGroup key={subject.id} className="mb-4">
                    <SelectLabel className="text-[10px] uppercase font-black text-accent-blue-dark tracking-widest mb-2 ml-2">
                      {subject.name}
                    </SelectLabel>
                    {subject.units.flatMap(u => u.topics).map(topic => (
                      <SelectItem key={topic.id} value={topic.id} className="rounded-2xl font-bold py-3 px-4 transition-colors">
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-16 h-16 bg-black text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-black/10 transform hover:scale-110 active:scale-95 transition-all">
            <Brain size={32} />
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 bg-white border border-base-border rounded-[3rem] shadow-xl overflow-hidden flex flex-col relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
              <div className="w-20 h-20 bg-base-surface rounded-full flex items-center justify-center text-base-text border-2 border-dashed border-base-border">
                <Sparkles size={40} className="text-accent-blue-mid" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold tracking-tight">Ask anything about {currentTopic?.name || 'BCA syllabus'}</h3>
                <p className="text-base font-medium text-base-muted max-w-sm mx-auto">Master complex concepts with real-time AI guidance from Claude Sonnet.</p>
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div 
                   key={i}
                   initial={{ opacity: 0, y: 30, scale: 0.98 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-start space-x-5`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-12 h-12 bg-black text-white rounded-[1.25rem] flex-shrink-0 flex items-center justify-center shadow-lg transform translate-y-2">
                      <Bot size={24} />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-8 rounded-[2rem] shadow-sm border leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-accent-blue/40 border-accent-blue-mid/30 text-accent-blue-dark rounded-tr-none font-bold text-sm' 
                      : 'bg-base-surface border-base-border rounded-tl-none text-base-text font-medium text-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                  {m.role === 'user' && (
                    <div className="w-12 h-12 bg-base-surface border border-base-border rounded-[1.25rem] flex-shrink-0 flex items-center justify-center transform translate-y-2">
                      <MessageSquare size={24} className="text-base-muted" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-center space-x-5">
                  <div className="w-12 h-12 bg-black text-white rounded-[1.25rem] flex-shrink-0 flex items-center justify-center animate-pulse">
                     <Bot size={24} />
                  </div>
                  <div className="bg-base-surface border border-base-border p-5 rounded-[2rem] rounded-tl-none px-8">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-base-muted rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-base-muted rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-base-muted rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        <form onSubmit={handleSend} className="p-8 bg-base-surface border-t border-base-border overflow-hidden">
          <div className="relative group max-w-4xl mx-auto">
            <Input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedTopicId ? `Ask Claude about ${currentTopic?.name}...` : 'Select a topic first...'}
              disabled={!selectedTopicId || loading}
              className="w-full h-16 pl-8 pr-20 bg-white border border-base-border rounded-[1.75rem] focus-visible:ring-accent-blue-mid shadow-lg shadow-black/5 text-base font-bold transition-all disabled:opacity-50"
            />
            <Button 
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-black text-white rounded-[1.25rem] shadow-xl hover:bg-accent-blue-mid active:scale-95 transition-all disabled:opacity-30 p-0"
            >
              <Send size={20} />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
