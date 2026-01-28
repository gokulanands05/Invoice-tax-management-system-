import { useState } from 'react';
import { mockTaxRecords } from '@/data/mockData';
import { TaxRecord } from '@/types/invoice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { MoreHorizontal, CheckCircle, FileText, AlertTriangle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TaxRecordsList() {
  const [taxes, setTaxes] = useState<TaxRecord[]>(mockTaxRecords);
  const { toast } = useToast();

  const statusStyles = {
    pending: 'status-pending',
    filed: 'bg-primary/10 text-primary border border-primary/20',
    paid: 'status-paid',
  };

  const handleMarkAsPaid = (taxId: string) => {
    setTaxes(taxes.map(tax => 
      tax.id === taxId 
        ? { ...tax, status: 'paid' as const, paidDate: new Date() }
        : tax
    ));
    toast({
      title: "Tax Marked as Paid",
      description: "The tax record has been updated.",
    });
  };

  const handleMarkAsFiled = (taxId: string) => {
    setTaxes(taxes.map(tax => 
      tax.id === taxId 
        ? { ...tax, status: 'filed' as const, filedDate: new Date() }
        : tax
    ));
    toast({
      title: "Tax Marked as Filed",
      description: "The tax record has been updated.",
    });
  };

  const pendingTaxes = taxes.filter(t => t.status === 'pending');
  const totalPending = pendingTaxes.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Tax Records</h1>
          <p className="text-muted-foreground">Track and manage your tax obligations</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tax Record
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-6 border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Pending Taxes</p>
              <p className="text-2xl font-bold font-display">${totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Filed This Quarter</p>
              <p className="text-2xl font-bold font-display">{taxes.filter(t => t.status === 'filed').length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-success">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Paid This Year</p>
              <p className="text-2xl font-bold font-display">{taxes.filter(t => t.status === 'paid').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tax Type</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Filed/Paid Date</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxes.map((tax) => {
              const daysUntilDue = differenceInDays(tax.dueDate, new Date());
              const isUrgent = tax.status === 'pending' && daysUntilDue <= 7;
              
              return (
                <TableRow key={tax.id} className={cn("hover:bg-secondary/50", isUrgent && "bg-warning/5")}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {isUrgent && <AlertTriangle className="h-4 w-4 text-warning" />}
                      {tax.type}
                    </div>
                  </TableCell>
                  <TableCell>{tax.period}</TableCell>
                  <TableCell className="font-semibold">${tax.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={cn(isUrgent && "text-warning font-medium")}>
                      {format(tax.dueDate, 'MMM d, yyyy')}
                    </span>
                    {isUrgent && <span className="block text-xs text-warning">{daysUntilDue} days left</span>}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", statusStyles[tax.status])}>
                      {tax.status.charAt(0).toUpperCase() + tax.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tax.paidDate ? format(tax.paidDate, 'MMM d, yyyy') : 
                     tax.filedDate ? format(tax.filedDate, 'MMM d, yyyy') : '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        {tax.status === 'pending' && (
                          <>
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => handleMarkAsFiled(tax.id)}
                            >
                              <FileText className="mr-2 h-4 w-4" /> Mark as Filed
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => handleMarkAsPaid(tax.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                            </DropdownMenuItem>
                          </>
                        )}
                        {tax.status === 'filed' && (
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => handleMarkAsPaid(tax.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
