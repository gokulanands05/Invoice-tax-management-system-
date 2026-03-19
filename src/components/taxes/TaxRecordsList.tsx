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
import { useAuditData } from '@/contexts/AuditDataContext';
import { formatCurrencyINR } from '@/lib/formatters';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export function TaxRecordsList() {
  const { complianceRecords, updateComplianceStatus, addComplianceRecord } = useAuditData();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [type, setType] = useState('GST');
  const [period, setPeriod] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const taxes = complianceRecords;

  const handleAddComplianceRecord = async () => {
    const cleanPeriod = period.trim();
    const numericAmount = Number(amount);
    if (!cleanPeriod || !dueDate || Number.isNaN(numericAmount)) {
      toast({ title: 'Invalid input', description: 'Period, amount, and due date are required.', variant: 'destructive' });
      return;
    }

    if (numericAmount <= 0) {
      toast({ title: 'Invalid input', description: 'Amount must be greater than zero.', variant: 'destructive' });
      return;
    }

    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      toast({ title: 'Invalid input', description: 'Due date is invalid.', variant: 'destructive' });
      return;
    }

    try {
      await addComplianceRecord({
        id: Date.now().toString(),
        type,
        period: cleanPeriod,
        amount: numericAmount,
        status: 'pending',
        dueDate: parsedDueDate,
      });

      setIsAddOpen(false);
      setType('GST');
      setPeriod('');
      setAmount('');
      setDueDate('');
      toast({ title: 'Compliance record added', description: 'Record has been saved successfully.' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to save compliance record.';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    }
  };

  const statusStyles = {
    pending: 'status-pending',
    filed: 'bg-primary/10 text-primary border border-primary/20',
    paid: 'status-paid',
  };

  const handleMarkAsPaid = (taxId: string) => {
    void updateComplianceStatus(taxId, 'paid');
    toast({
      title: "Record Marked as Paid",
      description: "The compliance record has been updated.",
    });
  };

  const handleMarkAsFiled = (taxId: string) => {
    void updateComplianceStatus(taxId, 'filed');
    toast({
      title: "Record Marked as Filed",
      description: "The compliance record has been updated.",
    });
  };

  const pendingTaxes = taxes.filter(t => t.status === 'pending');
  const totalPending = pendingTaxes.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Compliance Records</h1>
          <p className="text-muted-foreground">Track statutory deadlines, filings, and audit follow-ups</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Compliance Record
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-6 border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Pending Exposure</p>
              <p className="text-2xl font-bold font-display">{formatCurrencyINR(totalPending)}</p>
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
              <TableHead>Category</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Filed/Paid Date</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No compliance records found for this account. Ensure owner_id matches your auth id: {user?.id || 'Unavailable'}
                </TableCell>
              </TableRow>
            ) : (
              taxes.map((tax) => {
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
                    <TableCell className="font-semibold">{formatCurrencyINR(tax.amount)}</TableCell>
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
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>Add Compliance Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="GST">GST</SelectItem>
                  <SelectItem value="Income Tax">Income Tax</SelectItem>
                  <SelectItem value="TDS">TDS</SelectItem>
                  <SelectItem value="Professional Tax">Professional Tax</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Input value={period} placeholder="Q1 2026" onChange={(e) => setPeriod(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" min="0" step="0.01" value={amount} placeholder="0.00" onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={() => { void handleAddComplianceRecord(); }}>Save Record</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
