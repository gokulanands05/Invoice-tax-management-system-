import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Sparkles, TrendingUp, AlertTriangle, FileText, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockDashboardMetrics, mockInvoices, mockTaxRecords } from '@/data/mockData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your invoEase AI assistant. I can help you with:\n\n• Analyzing your financial data\n• Tracking pending invoices and taxes\n• Providing business insights\n• Answering questions about your accounts\n\nHow can I assist you today?`,
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

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('revenue') || lowerMessage.includes('earning')) {
      return `📊 **Revenue Summary**\n\nYour total revenue stands at **$${mockDashboardMetrics.totalRevenue.toLocaleString()}** with a growth of **${mockDashboardMetrics.revenueGrowth}%** compared to last month.\n\n• Pending invoices: $${mockDashboardMetrics.pendingInvoices.toLocaleString()}\n• Invoices this month: ${mockDashboardMetrics.invoicesThisMonth}\n\nWould you like me to break this down further by client or time period?`;
    }
    
    if (lowerMessage.includes('tax') || lowerMessage.includes('pending')) {
      const pendingTaxes = mockTaxRecords.filter(t => t.status === 'pending');
      const taxList = pendingTaxes.map(t => `• **${t.type}** (${t.period}): $${t.amount.toLocaleString()} - Due ${t.dueDate.toLocaleDateString()}`).join('\n');
      return `⚠️ **Pending Taxes**\n\nYou have ${pendingTaxes.length} pending tax obligations totaling **$${mockDashboardMetrics.pendingTaxes.toLocaleString()}**:\n\n${taxList}\n\n💡 **Tip:** The GST for Q4 2024 is due soon. Consider setting aside funds now to avoid last-minute stress.`;
    }
    
    if (lowerMessage.includes('overdue') || lowerMessage.includes('late')) {
      const overdueInvoices = mockInvoices.filter(i => i.status === 'overdue');
      if (overdueInvoices.length === 0) {
        return `✅ Great news! You have no overdue invoices at the moment. Keep up the good work!`;
      }
      const invoiceList = overdueInvoices.map(i => `• **${i.invoiceNumber}** - ${i.clientName}: $${i.totalAmount.toLocaleString()}`).join('\n');
      return `🚨 **Overdue Invoices**\n\nYou have ${overdueInvoices.length} overdue invoice(s):\n\n${invoiceList}\n\n💡 **Recommendation:** Consider sending payment reminders to these clients. Would you like me to draft a follow-up message?`;
    }
    
    if (lowerMessage.includes('tip') || lowerMessage.includes('advice') || lowerMessage.includes('improve') || lowerMessage.includes('cash flow')) {
      return `💡 **Cash Flow Improvement Tips**\n\n1. **Invoice Promptly**: Send invoices immediately after delivering services\n\n2. **Offer Early Payment Discounts**: 2% discount for payment within 10 days can improve collection rates\n\n3. **Follow Up on Overdue Accounts**: You have $${mockDashboardMetrics.pendingInvoices.toLocaleString()} in pending invoices - timely follow-ups can reduce this\n\n4. **Review Pricing**: Your average invoice is around $${Math.round(mockDashboardMetrics.totalRevenue / mockDashboardMetrics.totalClients).toLocaleString()} per client\n\n5. **Tax Planning**: Set aside ${Math.round((mockDashboardMetrics.pendingTaxes / mockDashboardMetrics.totalRevenue) * 100)}% of revenue for taxes\n\nWould you like more specific advice on any of these areas?`;
    }
    
    if (lowerMessage.includes('client') || lowerMessage.includes('customer')) {
      return `👥 **Client Overview**\n\nYou currently have **${mockDashboardMetrics.totalClients} active clients** with a total billing of $${mockDashboardMetrics.totalRevenue.toLocaleString()}.\n\n📈 **Key Insights:**\n• Average revenue per client: $${Math.round(mockDashboardMetrics.totalRevenue / mockDashboardMetrics.totalClients).toLocaleString()}\n• Pending payments: $${mockDashboardMetrics.pendingInvoices.toLocaleString()}\n\nWould you like me to identify your top-performing clients or those with outstanding balances?`;
    }

    return `I'd be happy to help you with that! Based on your current data:\n\n• Total Revenue: $${mockDashboardMetrics.totalRevenue.toLocaleString()}\n• Active Clients: ${mockDashboardMetrics.totalClients}\n• Pending Invoices: $${mockDashboardMetrics.pendingInvoices.toLocaleString()}\n• Pending Taxes: $${mockDashboardMetrics.pendingTaxes.toLocaleString()}\n\nIs there something specific you'd like me to analyze or explain further?`;
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
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateResponse(text);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
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
          <div className="p-4 border-t">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your finances..."
                className="flex-1"
              />
              <Button type="submit" disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
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
