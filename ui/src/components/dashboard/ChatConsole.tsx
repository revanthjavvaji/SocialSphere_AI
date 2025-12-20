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

interface ChatConsoleProps {
  chatInput: string;
  setChatInput: (value: string) => void;
}

export const ChatConsole: React.FC<ChatConsoleProps> = ({ chatInput, setChatInput }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI Marketing Agent — I manage social media, draft emails, create posters, and prepare weekly content plans. How can I help ${user?.businessName || 'your business'} today?`,
      timestamp: new Date(),
    }
  ]);
  // Local input state removed in favor of prop
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!chatInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
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

      let content = data.response;

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: content,
        timestamp: new Date(),
        drafts: undefined
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
    setChatInput(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border/50">
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
              <div className={`max-w-[80%] min-w-0 ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`p-3 rounded-2xl break-words overflow-hidden ${message.role === 'assistant'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'gradient-bg text-primary-foreground'
                  }`}>
                  {message.role === 'assistant' ? (
                    <div className="text-sm prose dark:prose-invert max-w-none break-words">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
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
          {/* Input Area */}
          <div className="flex gap-2 items-end">
            <textarea
              placeholder="Ask me anything about marketing... (Shift+Enter for new line)"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-h-[44px] max-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-sans"
              style={{ height: 'auto' }}
            />
            <Button onClick={handleSend} variant="gradient" size="icon" className="h-[44px] w-[44px]">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
