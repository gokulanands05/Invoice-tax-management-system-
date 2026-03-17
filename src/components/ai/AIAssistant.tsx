import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Sparkles, TrendingUp, AlertTriangle, FileText, Lightbulb, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatWithAssistant } from '@/lib/geminiService';
import { useAuditData } from '@/contexts/AuditDataContext';
import { formatCurrencyINR } from '@/lib/formatters';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const quickActions = [
  { icon: TrendingUp, label: 'Revenue Summary', prompt: 'Give me an auditor summary of realised revenue for this month in INR.' },
  { icon: AlertTriangle, label: 'Compliance Due', prompt: 'Which compliance records are pending and when are they due?' },
  { icon: FileText, label: 'Open Bills', prompt: 'Show me overdue or pending engagement bills that need audit follow-up.' },
  { icon: Lightbulb, label: 'Risk Tips', prompt: 'Give me auditor recommendations to improve internal controls and reduce compliance risk.' },
];

const unrelatedResponse = 'Unrelated question. I can only help with auditing, compliance, financial statements, fraud detection, risk reviews, internal controls, and auditor workflow questions.';
const auditorKeywords = [
  'audit',
  'auditor',
  'financial',
  'statement',
  'ledger',
  'compliance',
  'gst',
  'tds',
  'invoice',
  'bill',
  'revenue',
  'expense',
  'fraud',
  'risk',
  'control',
  'client',
  'tax',
  'balance sheet',
  'cash flow',
  'payable',
  'receivable',
  'pending',
  'amount',
  'profit',
  'loss',
  'expense',
  'income',
  'gst return',
  'filing',
  'compliance record',
  'liability',
  'billing',
  'engagement',
  'due',
  'balance',
];

const greetingKeywords = [
  'hi',
  'hello',
  'hey',
  'good morning',
  'good afternoon',
  'good evening',
];

export function AIAssistant() {
  const { metrics, invoices, complianceRecords, clients } = useAuditData();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello. I'm your AuditEase Auditor AI assistant. I can help with audit reviews, compliance deadlines, fraud indicators, financial records, and client risk questions.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isAuditorQuestion = (text: string) => {
    const normalized = text.toLowerCase();
    return auditorKeywords.some((keyword) => normalized.includes(keyword));
  };

  const isGreeting = (text: string) => {
    const normalized = text.toLowerCase().trim();
    return greetingKeywords.some((keyword) => normalized === keyword);
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (!isAuditorQuestion(text) && !isGreeting(text)) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: unrelatedResponse,
          timestamp: new Date(),
        },
      ]);
      return;
    }

    setIsTyping(true);

    try {
      const systemContext = `You are an expert Auditor Assistant for "AuditEase", an Auditor Management System.
      Auditors are professionals who examine financial records, operational processes, and compliance standards to ensure accuracy and legality. They verify financial statements, detect fraud, assess risks, and recommend improvements.
      
      You have access to the following user data:
      - Dashboard Metrics: ${JSON.stringify(metrics)}
      - Clients: ${JSON.stringify(clients.slice(0, 5))}
      - Recent Engagement Bills: ${JSON.stringify(invoices.slice(0, 5))}
      - Pending Compliance Records: ${JSON.stringify(complianceRecords.filter(t => t.status === 'pending'))}
      
      Provide helpful, professional advice based ONLY on auditing, finance, taxation, financial record examination, fraud detection, compliance, risk assessment, billing review, and Indian statutory context. Keep all currency references in INR. Use plain, concise language.
      You may respond to simple greetings briefly, then guide the user back to auditor, finance, tax, compliance, amount, due-date, billing, or financial-record topics.
      
      IMPORTANT: Answer all relevant auditor, finance, tax, amount, billing, compliance, and financial-record questions helpfully. If the user asks an irrelevant question outside those areas, reply EXACTLY with: "${unrelatedResponse}"`;

      type GroqHistoryMessage = { role: 'user' | 'model'; parts: { text: string }[] };
      const history: GroqHistoryMessage[] = [];
      const chatMessages = messages.filter(m => m.role !== 'system');

      const firstUserIdx = chatMessages.findIndex(m => m.role === 'user');

      if (firstUserIdx !== -1) {
        for (let i = firstUserIdx; i < chatMessages.length; i++) {
          const m = chatMessages[i];
          const role: GroqHistoryMessage['role'] = m.role === 'user' ? 'user' : 'model';
          history.push({
            role,
            parts: [{ text: m.content }]
          });
        }
      }

      const response = await chatWithAssistant(history, text, systemContext);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || "I'm sorry, I couldn't process that request.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Chat service error. Please check the Groq API key and try again.';
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            Auditor AI
          </h1>
          <p className="text-muted-foreground">Ask only auditor, compliance, fraud, and financial-record questions</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Online
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Chat Area */}
        <div className="lg:col-span-3 glass-card flex flex-col h-[600px]">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' && "flex-row-reverse"
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={cn(
                      message.role === 'assistant'
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    )}>
                      {message.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === 'assistant'
                        ? "bg-secondary text-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <p className={cn(
                      "text-xs mt-2",
                      message.role === 'assistant' ? "text-muted-foreground" : "text-primary-foreground/70"
                    )}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-secondary rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t space-y-3">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about audits, compliance, fraud checks, or financial records..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button type="submit" disabled={!input.trim() || isTyping}>
                {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-4">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleSend(action.prompt)}
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="font-semibold mb-3">AI Insights</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm font-medium text-warning">Compliance Alert</p>
                <p className="text-xs text-muted-foreground mt-1">{complianceRecords.filter((item) => item.status === 'pending').length} pending compliance records need review</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm font-medium text-success">Realised Revenue</p>
                <p className="text-xs text-muted-foreground mt-1">{formatCurrencyINR(metrics.totalRevenue)} collected so far</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive">Open Follow-up</p>
                <p className="text-xs text-muted-foreground mt-1">{invoices.filter((invoice) => invoice.status !== 'paid').length} bills need auditor attention</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
