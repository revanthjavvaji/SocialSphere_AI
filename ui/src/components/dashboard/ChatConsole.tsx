import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Bot,
  User,
  ChevronDown,
  Calendar,
  Sparkles,
  Instagram,
  Linkedin,
  Mail
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  drafts?: {
    instagram?: string;
    linkedin?: string;
    gmail?: string;
  };
}

const suggestedPrompts = [
  "Plan my content for next 7 days",
  "Create a festival offer poster",
  "Draft a product launch email",
  "Generate engaging Instagram captions",
  "Write a LinkedIn thought leadership post",
];

const tones = ['Professional', 'Casual', 'Friendly', 'Technical'];

export const ChatConsole: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI Marketing Agent — I manage social media, draft emails, create posters, and prepare weekly content plans. How can I help ${user?.businessName || 'your business'} today?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [platforms, setPlatforms] = useState({
    gmail: true,
    linkedin: true,
    instagram: true,
  });
  const [tone, setTone] = useState('Professional');
  const [draftOnly, setDraftOnly] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response form Agent');
      }

      const data = await response.json();

      // The backend returns { "response": "string" }
      // We'll see if the response string contains JSON-like content for drafts
      let content = data.response;
      let drafts: Message['drafts'] = {};

      // Simple heuristic: check if response looks like it contains draft sections
      // This is a basic integration. For full draft parsing, the Agent prompt needs to be structured.
      // For now, we put the whole response in content.

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: content,
        timestamp: new Date(),
        drafts: undefined // Parsing specific drafts from markdown/json string is complex, skipping for initial integration
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Agent Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "❌ I encountered an error communicating with the agent server.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h2 className="font-display font-semibold text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          Chat with Your Marketing Agent
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${message.role === 'assistant' ? 'gradient-bg' : 'bg-secondary'
              }`}>
              {message.role === 'assistant' ? (
                <Bot className="w-4 h-4 text-primary-foreground" />
              ) : (
                <User className="w-4 h-4 text-secondary-foreground" />
              )}
            </div>
            <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
              <div className={`p-3 rounded-2xl ${message.role === 'assistant'
                ? 'bg-secondary text-secondary-foreground'
                : 'gradient-bg text-primary-foreground'
                }`}>
                {message.role === 'assistant' ? (
                  <div className="text-sm prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>

              {/* Draft Previews */}
              {message.drafts && (
                <div className="mt-3 space-y-2">
                  {message.drafts.instagram && (
                    <div className="p-3 rounded-xl bg-card border border-border/50 text-left">
                      <div className="flex items-center gap-2 mb-2 text-pink-500">
                        <Instagram className="w-4 h-4" />
                        <span className="text-xs font-medium">Instagram Draft</span>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{message.drafts.instagram}</p>
                    </div>
                  )}
                  {message.drafts.linkedin && (
                    <div className="p-3 rounded-xl bg-card border border-border/50 text-left">
                      <div className="flex items-center gap-2 mb-2 text-blue-600">
                        <Linkedin className="w-4 h-4" />
                        <span className="text-xs font-medium">LinkedIn Draft</span>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{message.drafts.linkedin}</p>
                    </div>
                  )}
                  {message.drafts.gmail && (
                    <div className="p-3 rounded-xl bg-card border border-border/50 text-left">
                      <div className="flex items-center gap-2 mb-2 text-red-500">
                        <Mail className="w-4 h-4" />
                        <span className="text-xs font-medium">Email Draft</span>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{message.drafts.gmail}</p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="p-3 rounded-2xl bg-secondary">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="px-4 py-2 border-t border-border/50">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handlePromptClick(prompt)}
              className="shrink-0 px-3 py-1.5 text-xs rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-border/50 space-y-4">
        {/* Platform & Tone Selection */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="gmail"
                checked={platforms.gmail}
                onCheckedChange={(checked) => setPlatforms(prev => ({ ...prev, gmail: !!checked }))}
              />
              <Label htmlFor="gmail" className="text-xs cursor-pointer">Gmail</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="linkedin"
                checked={platforms.linkedin}
                onCheckedChange={(checked) => setPlatforms(prev => ({ ...prev, linkedin: !!checked }))}
              />
              <Label htmlFor="linkedin" className="text-xs cursor-pointer">LinkedIn</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="instagram"
                checked={platforms.instagram}
                onCheckedChange={(checked) => setPlatforms(prev => ({ ...prev, instagram: !!checked }))}
              />
              <Label htmlFor="instagram" className="text-xs cursor-pointer">Instagram</Label>
            </div>
          </div>

          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Tone" />
            </SelectTrigger>
            <SelectContent>
              {tones.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch
              id="draft-only"
              checked={draftOnly}
              onCheckedChange={setDraftOnly}
            />
            <Label htmlFor="draft-only" className="text-xs cursor-pointer">Draft Only</Label>
          </div>

          <Input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="w-auto h-8 text-xs"
          />
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything about marketing..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} variant="gradient" size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
