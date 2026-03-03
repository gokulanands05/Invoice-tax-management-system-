import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Sparkles, TrendingUp, AlertTriangle, FileText, Lightbulb, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockDashboardMetrics, mockInvoices, mockTaxRecords } from '@/data/mockData';

import { chatWithAssistant } from '@/lib/geminiService';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const quickActions = [
  { icon: TrendingUp, label: 'Revenue Summary', prompt: 'Give me a summary of my revenue for this month' },
  { icon: AlertTriangle, label: 'Pending Taxes', prompt: 'What taxes are pending and when are they due?' },
  { icon: FileText, label: 'Overdue Invoices', prompt: 'Show me all overdue invoices' },
  { icon: Lightbulb, label: 'Business Tips', prompt: 'Give me tips to improve my cash flow' },
];

export function AIAssistant() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || '');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your invoEase AI assistant powered by Groq. I've analyzed your current financial data. How can I assist you today?`,
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

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || !apiKey) return;

    // Save API key if changed
    localStorage.setItem('groq_api_key', apiKey);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const systemContext = `You are an expert financial assistant for "invoEase", an invoice and tax management system. 
      You have access to the following user data:
      - Dashboard Metrics: ${JSON.stringify(mockDashboardMetrics)}
      - Recent Invoices: ${JSON.stringify(mockInvoices.slice(0, 5))}
      - Pending Tax Records: ${JSON.stringify(mockTaxRecords.filter(t => t.status === 'pending'))}
      
      Provide helpful, professional financial advice. Use markdown for formatting (bold, lists, etc). 
      Be concise but insightful. If the user asks about revenue, refer to the metrics. 
      If they ask about taxes, look at the tax records.`;

      // Convert message history to Gemini format
      // Gemini requires the history to start with a 'user' message
      const history = [];
      const chatMessages = messages.filter(m => m.role !== 'system');

      // Find the first user message index
      const firstUserIdx = chatMessages.findIndex(m => m.role === 'user');

      if (firstUserIdx !== -1) {
        // Only include history starting from the first user message
        for (let i = firstUserIdx; i < chatMessages.length; i++) {
          const m = chatMessages[i];
          history.push({
            role: m.role === 'user' ? 'user' : 'model' as any,
            parts: [{ text: m.content }]
          });
        }
      }

      const response = await chatWithAssistant(apiKey, history, text, systemContext);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || "I'm sorry, I couldn't process that request.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Error:** ${error.message || "Failed to connect to Groq. Please check your API key."}`,
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
            AI Assistant
          </h1>
          <p className="text-muted-foreground">Get intelligent insights about your finances</p>
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
            {!apiKey && (
              <div className="flex gap-2 items-center p-2 bg-destructive/10 rounded-lg border border-destructive/20 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-[10px] text-destructive font-medium uppercase">Enter Groq API Key below to start chatting</p>
              </div>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={apiKey ? "Ask me anything about your finances..." : "Please enter Groq API key first..."}
                className="flex-1"
                disabled={!apiKey || isTyping}
              />
              <Button type="submit" disabled={!input.trim() || isTyping || !apiKey}>
                {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>

            <div className="flex items-center gap-2">
              <Label htmlFor="assistant-api-key" className="text-[10px] uppercase text-muted-foreground whitespace-nowrap">Groq API Key:</Label>
              <Input
                id="assistant-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_..."
                className="h-7 text-xs font-mono"
              />
            </div>
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
                <p className="text-sm font-medium text-warning">Tax Deadline Alert</p>
                <p className="text-xs text-muted-foreground mt-1">GST Q4 2024 is due in 3 days</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm font-medium text-success">Revenue Growing</p>
                <p className="text-xs text-muted-foreground mt-1">24.5% increase from last month</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive">Overdue Invoice</p>
                <p className="text-xs text-muted-foreground mt-1">1 invoice needs attention</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
