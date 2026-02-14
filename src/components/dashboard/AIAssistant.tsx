import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

interface AIAssistantProps {
  chatMessagesUsed: number;
  chatLimit: number;
  onMessageSent: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const SUGGESTIONS = [
  "How can I improve my AI visibility?",
  "Generate SEO titles for a SaaS landing page",
  "What's the best way to get cited by ChatGPT?",
  "Create FAQ schema for my product page",
];

export function AIAssistant({ chatMessagesUsed, chatLimit, onMessageSent }: AIAssistantProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isUnlimited = chatLimit === -1;
  const limitReached = !isUnlimited && chatMessagesUsed >= chatLimit;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || limitReached) return;

    const userMsg: Msg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Request failed' }));
        if (err.limit_reached) {
          toast.error('Chat limit reached. Please upgrade your plan.');
        } else if (resp.status === 429) {
          toast.error('Rate limit exceeded. Please wait a moment.');
        } else {
          toast.error(err.error || 'Something went wrong');
        }
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch { /* ignore */ }
        }
      }

      onMessageSent();
    } catch (e) {
      console.error('Chat error:', e);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-yellow-400" />
          <span className="text-white font-semibold text-sm">AI Assistant</span>
        </div>
        <Badge variant="outline" className="border-yellow-400/30 text-yellow-400 text-xs">
          {isUnlimited ? '∞' : `${chatMessagesUsed}/${chatLimit}`} messages
        </Badge>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-yellow-400/20 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">AI SEO Assistant</h3>
              <p className="text-gray-400 text-sm max-w-md">
                Ask me anything about AI visibility, SEO optimization, or let me help generate content for your website.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs text-gray-300 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 hover:border-yellow-400/50 hover:text-yellow-400 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-yellow-400/20 flex items-center justify-center shrink-0 mt-1">
                <Bot className="h-4 w-4 text-yellow-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-1">
                <User className="h-4 w-4 text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-yellow-400/20 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="bg-gray-800 rounded-lg px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
            </div>
          </div>
        )}
      </div>

      {/* Limit reached banner */}
      {limitReached && (
        <div className="px-4 py-2 bg-red-900/30 border-t border-red-700/50 text-center">
          <p className="text-red-400 text-xs">
            Monthly chat limit reached.{' '}
            <Link to="/pricing" className="text-yellow-400 underline hover:text-yellow-300">
              Upgrade your plan
            </Link>
          </p>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-700 bg-gray-800">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={limitReached ? 'Upgrade to continue chatting...' : 'Ask anything about AI visibility...'}
            disabled={limitReached || isLoading}
            rows={1}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-400/50 resize-none disabled:opacity-50"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading || limitReached}
            size="sm"
            className="bg-yellow-400 hover:bg-yellow-500 text-black shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
