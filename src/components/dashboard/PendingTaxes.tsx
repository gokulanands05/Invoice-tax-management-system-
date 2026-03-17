import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuditData } from '@/contexts/AuditDataContext';
import { formatCurrencyINR } from '@/lib/formatters';

export function PendingTaxes() {
  const { complianceRecords } = useAuditData();
  const pendingTaxes = complianceRecords.filter((tax) => tax.status === 'pending');

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold font-display">Pending Compliance Actions</h3>
          <p className="text-sm text-muted-foreground">Upcoming statutory and audit deadlines</p>
        </div>
        <Link to="/taxes">
          <Button variant="ghost" size="sm" className="text-primary">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <div className="space-y-4">
        {pendingTaxes.map((tax) => {
          const daysUntilDue = differenceInDays(tax.dueDate, new Date());
          const isUrgent = daysUntilDue <= 7;
          
          return (
            <div 
              key={tax.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg transition-colors",
                isUrgent 
                  ? "bg-warning/10 border border-warning/20" 
                  : "bg-secondary/50 hover:bg-secondary"
              )}
            >
              <div className="flex items-center gap-3">
                {isUrgent && (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                )}
                <div className="space-y-1">
                  <p className="font-medium">{tax.type}</p>
                  <p className="text-sm text-muted-foreground">{tax.period}</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="font-semibold">{formatCurrencyINR(tax.amount)}</p>
                <p className={cn(
                  "text-xs",
                  isUrgent ? "text-warning font-medium" : "text-muted-foreground"
                )}>
                  Due {format(tax.dueDate, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
