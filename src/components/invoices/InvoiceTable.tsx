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
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function InvoiceTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<Invoice['status']>('pending');
  const [aiData, setAiData] = useState<Partial<Invoice> | undefined>(undefined);
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useAuditData();
  const { toast } = useToast();
  const { user } = useAuth();

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

  const openViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewOpen(true);
  };

  const openEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditDueDate(invoice.dueDate.toISOString().slice(0, 10));
    setEditStatus(invoice.status);
    setIsEditOpen(true);
  };

  const downloadInvoice = (invoice: Invoice) => {
    const payload = JSON.stringify(invoice, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceNumber}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveInvoiceEdit = async () => {
    if (!selectedInvoice) return;
    if (!editDueDate) {
      toast({ title: 'Invalid input', description: 'Due date is required.', variant: 'destructive' });
      return;
    }

    const parsed = new Date(editDueDate);
    if (Number.isNaN(parsed.getTime())) {
      toast({ title: 'Invalid input', description: 'Due date is invalid.', variant: 'destructive' });
      return;
    }

    try {
      await updateInvoice({
        ...selectedInvoice,
        status: editStatus,
        dueDate: parsed,
      });
      setIsEditOpen(false);
      toast({ title: 'Bill updated', description: `${selectedInvoice.invoiceNumber} updated successfully.` });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to update bill.';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    }
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
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No bills found for this account. Ensure owner_id matches your auth id: {user?.id || 'Unavailable'}
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
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
                        <DropdownMenuItem className="cursor-pointer" onClick={() => openViewInvoice(invoice)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => openEditInvoice(invoice)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => downloadInvoice(invoice)}>
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
              ))
            )}
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

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Bill #:</span> {selectedInvoice.invoiceNumber}</p>
              <p><span className="font-medium">Client:</span> {selectedInvoice.clientName}</p>
              <p><span className="font-medium">Status:</span> {selectedInvoice.status}</p>
              <p><span className="font-medium">Due Date:</span> {format(selectedInvoice.dueDate, 'MMM d, yyyy')}</p>
              <p><span className="font-medium">Total:</span> {formatCurrencyINR(selectedInvoice.totalAmount)}</p>
              <div className="pt-2">
                <p className="font-medium mb-2">Line Items</p>
                <div className="space-y-2">
                  {selectedInvoice.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span>{item.description}</span>
                      <span>{item.quantity} x {formatCurrencyINR(item.rate)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>Edit Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={(value: Invoice['status']) => setEditStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={() => { void handleSaveInvoiceEdit(); }}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
