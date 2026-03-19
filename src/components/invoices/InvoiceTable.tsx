import { useState } from 'react';
import { Invoice } from '@/types/invoice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { format } from 'date-fns';
import { Search, MoreHorizontal, Eye, Edit, Trash2, Download, Plus, Sparkles } from 'lucide-react';
import { CreateInvoiceDialog } from './CreateInvoiceDialog';
import { AIExtractorDialog } from './AIExtractorDialog';
import { useAuditData } from '@/contexts/AuditDataContext';
import { formatCurrencyINR } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';

export function InvoiceTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiData, setAiData] = useState<Partial<Invoice> | undefined>(undefined);
  const { invoices, addInvoice, deleteInvoice } = useAuditData();
  const { toast } = useToast();

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusStyles = {
    paid: 'status-paid',
    pending: 'status-pending',
    overdue: 'status-overdue',
  };

  const handleAddInvoice = (newInvoice: Invoice) => {
    void addInvoice(newInvoice);
    setAiData(undefined); // Clear AI data after use
  };

  const handleAIDataExtracted = (data: Partial<Invoice>) => {
    setAiData(data);
    setIsCreateOpen(true);
  };

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      await deleteInvoice(invoiceId);
      toast({
        title: 'Bill deleted',
        description: `${invoiceNumber} has been removed.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to delete bill.';
      toast({ title: 'Delete failed', description: message, variant: 'destructive' });
    }
  };

  const showComingSoon = () => {
    toast({ title: 'Coming soon', description: 'This action is not implemented yet.' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Audit Engagement Bills</h1>
          <p className="text-muted-foreground">Manage billing records and client engagement collections</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setIsAIOpen(true)}
            variant="outline"
            className="gap-2 border-primary/50 text-primary hover:bg-primary/5"
          >
            <Sparkles className="h-4 w-4" />
            Scan with AI
          </Button>
          <Button onClick={() => { setAiData(undefined); setIsCreateOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            New Bill
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search engagement bills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>GST/Tax</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-secondary/50">
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.clientName}</TableCell>
                <TableCell>{formatCurrencyINR(invoice.amount)}</TableCell>
                <TableCell>{formatCurrencyINR(invoice.taxAmount)}</TableCell>
                <TableCell className="font-semibold">{formatCurrencyINR(invoice.totalAmount)}</TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", statusStyles[invoice.status])}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{format(invoice.dueDate, 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem className="cursor-pointer" onClick={showComingSoon}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={showComingSoon}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={showComingSoon}>
                        <Download className="mr-2 h-4 w-4" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive"
                        onClick={() => {
                          void handleDeleteInvoice(invoice.id, invoice.invoiceNumber);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateInvoiceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleAddInvoice}
        initialData={aiData}
      />

      <AIExtractorDialog
        open={isAIOpen}
        onOpenChange={setIsAIOpen}
        onDataExtracted={handleAIDataExtracted}
      />
    </div>
  );
}
