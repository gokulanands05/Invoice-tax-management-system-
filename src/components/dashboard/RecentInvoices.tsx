import { mockInvoices } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function RecentInvoices() {
  const recentInvoices = mockInvoices.slice(0, 5);

  const statusStyles = {
    paid: 'status-paid',
    pending: 'status-pending',
    overdue: 'status-overdue',
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold font-display">Recent Invoices</h3>
          <p className="text-sm text-muted-foreground">Latest invoice activity</p>
        </div>
        <Link to="/invoices">
          <Button variant="ghost" size="sm" className="text-primary">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <div className="space-y-4">
        {recentInvoices.map((invoice) => (
          <div 
            key={invoice.id}
            className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="space-y-1">
              <p className="font-medium">{invoice.invoiceNumber}</p>
              <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="font-semibold">${invoice.totalAmount.toLocaleString()}</p>
              <Badge className={cn("text-xs", statusStyles[invoice.status])}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
