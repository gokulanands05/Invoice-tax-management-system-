import { useMemo, useState } from 'react';
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
  DropdownMenuSeparator,
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
import { Textarea } from '@/components/ui/textarea';
import { detectInvoiceIssues } from '@/lib/fraudChecks';

export function InvoiceTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'all' | Invoice['reviewStatus']>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | Invoice['verificationStatus']>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<Invoice['status']>('pending');
  const [editReviewStatus, setEditReviewStatus] = useState<Invoice['reviewStatus']>('pending');
  const [editVerificationStatus, setEditVerificationStatus] = useState<Invoice['verificationStatus']>('not_verified');
  const [editGstin, setEditGstin] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [aiData, setAiData] = useState<Partial<Invoice> | undefined>(undefined);
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useAuditData();
  const { toast } = useToast();
  const { user } = useAuth();

  const { issueMap, summary } = useMemo(() => detectInvoiceIssues(invoices), [invoices]);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesReview = reviewFilter === 'all' || invoice.reviewStatus === reviewFilter;
    const matchesVerification = verificationFilter === 'all' || invoice.verificationStatus === verificationFilter;

    return matchesSearch && matchesReview && matchesVerification;
  });

  const statusStyles = {
    paid: 'status-paid',
    pending: 'status-pending',
    overdue: 'status-overdue',
  };

  const reviewStyles = {
    accepted: 'bg-success/10 text-success border border-success/20',
    rejected: 'bg-destructive/10 text-destructive border border-destructive/20',
    pending: 'bg-warning/10 text-warning border border-warning/20',
  };

  const verificationStyles = {
    verified: 'bg-success/10 text-success border border-success/20',
    not_verified: 'bg-warning/10 text-warning border border-warning/20',
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
    setEditReviewStatus(invoice.reviewStatus);
    setEditVerificationStatus(invoice.verificationStatus);
    setEditGstin(invoice.gstin);
    setEditRemarks(invoice.remarks || '');
    setIsEditOpen(true);
  };

  const appendAuditHistory = (invoice: Invoice, action: string, remarks?: string) => {
    const checkedBy = user?.email || user?.id || 'unknown';
    return [
      {
        id: crypto.randomUUID(),
        action,
        checkedBy,
        checkedAt: new Date(),
        remarks,
      },
      ...invoice.auditHistory,
    ];
  };

  const handleQuickAuditAction = async (
    invoice: Invoice,
    updates: Partial<Pick<Invoice, 'reviewStatus' | 'verificationStatus'>>,
    action: string,
  ) => {
    try {
      await updateInvoice({
        ...invoice,
        ...updates,
        auditHistory: appendAuditHistory(invoice, action, invoice.remarks),
      });
      toast({ title: 'Audit updated', description: `${invoice.invoiceNumber} marked as ${action.toLowerCase()}.` });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to update audit status.';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    }
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

    const cleanGstin = editGstin.trim().toUpperCase();
    if (!cleanGstin) {
      toast({ title: 'Invalid input', description: 'GSTIN is required.', variant: 'destructive' });
      return;
    }

    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(cleanGstin)) {
      toast({ title: 'Invalid input', description: 'GSTIN format is invalid.', variant: 'destructive' });
      return;
    }

    try {
      await updateInvoice({
        ...selectedInvoice,
        gstin: cleanGstin,
        status: editStatus,
        dueDate: parsed,
        reviewStatus: editReviewStatus,
        verificationStatus: editVerificationStatus,
        remarks: editRemarks.trim(),
        auditHistory: appendAuditHistory(selectedInvoice, 'Invoice audit updated', editRemarks.trim()),
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoice number or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={reviewFilter} onValueChange={(value: 'all' | Invoice['reviewStatus']) => setReviewFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Review Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Review Status</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verificationFilter} onValueChange={(value: 'all' | Invoice['verificationStatus']) => setVerificationFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Audit Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Audit Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="not_verified">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge className="bg-success/10 text-success border border-success/20">Verified: Green</Badge>
            <Badge className="bg-destructive/10 text-destructive border border-destructive/20">Rejected: Red</Badge>
            <Badge className="bg-warning/10 text-warning border border-warning/20">Pending: Yellow</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary">Flagged: {summary.totalFlaggedInvoices}</Badge>
            <Badge className="bg-destructive/10 text-destructive border border-destructive/20">Duplicates: {summary.duplicateCount}</Badge>
            <Badge className="bg-warning/10 text-warning border border-warning/20">Tax Mismatch: {summary.taxMismatchCount}</Badge>
            <Badge className="bg-primary/10 text-primary border border-primary/20">Missing Fields: {summary.missingFieldsCount}</Badge>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>GST/Tax</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Audit</TableHead>
              <TableHead>Risk Flags</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="py-8 text-center text-sm text-muted-foreground">
                  No bills found for this account. Ensure owner_id matches your auth id: {user?.id || 'Unavailable'}
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-secondary/50">
                  {(() => {
                    const issues = issueMap.get(invoice.id) || [];
                    return (
                      <>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell>{invoice.gstin || 'N/A'}</TableCell>
                  <TableCell>{formatCurrencyINR(invoice.amount)}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <p>Total: {formatCurrencyINR(invoice.taxAmount)}</p>
                      <p className="text-muted-foreground">CGST {formatCurrencyINR(invoice.cgst)} | SGST {formatCurrencyINR(invoice.sgst)} | IGST {formatCurrencyINR(invoice.igst)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrencyINR(invoice.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", statusStyles[invoice.status])}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", reviewStyles[invoice.reviewStatus])}>
                      {invoice.reviewStatus === 'accepted' ? 'Accepted' : invoice.reviewStatus === 'rejected' ? 'Rejected' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", verificationStyles[invoice.verificationStatus])}>
                      {invoice.verificationStatus === 'verified' ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {issues.length === 0 ? (
                      <Badge className="bg-success/10 text-success border border-success/20">No Issues</Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {issues.map((issue) => (
                          <Badge
                            key={`${invoice.id}-${issue.code}`}
                            className={cn(
                              'text-[10px]',
                              issue.code === 'duplicate_invoice' && 'bg-destructive/10 text-destructive border border-destructive/20',
                              issue.code === 'tax_mismatch' && 'bg-warning/10 text-warning border border-warning/20',
                              issue.code === 'missing_fields' && 'bg-primary/10 text-primary border border-primary/20',
                            )}
                          >
                            {issue.label}
                          </Badge>
                        ))}
                      </div>
                    )}
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" onClick={() => { void handleQuickAuditAction(invoice, { reviewStatus: 'accepted' }, 'Accepted'); }}>
                          Accept Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => { void handleQuickAuditAction(invoice, { reviewStatus: 'rejected' }, 'Rejected'); }}>
                          Reject Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => { void handleQuickAuditAction(invoice, { reviewStatus: 'pending' }, 'Pending'); }}>
                          Mark Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => { void handleQuickAuditAction(invoice, { verificationStatus: 'verified' }, 'Verified'); }}>
                          Mark Verified
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => { void handleQuickAuditAction(invoice, { verificationStatus: 'not_verified' }, 'Not Verified'); }}>
                          Mark Not Verified
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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
                      </>
                    );
                  })()}
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
              {(() => {
                const issues = issueMap.get(selectedInvoice.id) || [];
                if (issues.length === 0) return null;
                return (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <p className="font-medium text-destructive">Fraud / Error Alerts</p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                      {issues.map((issue) => (
                        <li key={issue.code}>{issue.description}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
              <p><span className="font-medium">Bill #:</span> {selectedInvoice.invoiceNumber}</p>
              <p><span className="font-medium">Client:</span> {selectedInvoice.clientName}</p>
              <p><span className="font-medium">GSTIN:</span> {selectedInvoice.gstin || 'N/A'}</p>
              <p><span className="font-medium">Status:</span> {selectedInvoice.status}</p>
              <p><span className="font-medium">Review:</span> {selectedInvoice.reviewStatus}</p>
              <p><span className="font-medium">Audit:</span> {selectedInvoice.verificationStatus}</p>
              <p><span className="font-medium">Remarks:</span> {selectedInvoice.remarks || 'No remarks'}</p>
              <p><span className="font-medium">Due Date:</span> {format(selectedInvoice.dueDate, 'MMM d, yyyy')}</p>
              <p><span className="font-medium">Tax Amount:</span> {formatCurrencyINR(selectedInvoice.taxAmount)}</p>
              <p><span className="font-medium">CGST:</span> {formatCurrencyINR(selectedInvoice.cgst)}</p>
              <p><span className="font-medium">SGST:</span> {formatCurrencyINR(selectedInvoice.sgst)}</p>
              <p><span className="font-medium">IGST:</span> {formatCurrencyINR(selectedInvoice.igst)}</p>
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
              <div className="pt-2">
                <p className="font-medium mb-2">Audit History</p>
                {selectedInvoice.auditHistory.length === 0 ? (
                  <p className="text-muted-foreground">No audit actions recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedInvoice.auditHistory.map((entry) => (
                      <div key={entry.id} className="rounded-md border px-3 py-2">
                        <p className="font-medium">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">{entry.checkedBy} · {format(entry.checkedAt, 'MMM d, yyyy HH:mm')}</p>
                        {entry.remarks && <p className="text-sm mt-1">{entry.remarks}</p>}
                      </div>
                    ))}
                  </div>
                )}
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
              <Label>Review Decision</Label>
              <Select value={editReviewStatus} onValueChange={(value: Invoice['reviewStatus']) => setEditReviewStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Verification</Label>
              <Select value={editVerificationStatus} onValueChange={(value: Invoice['verificationStatus']) => setEditVerificationStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="not_verified">Not Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>GSTIN</Label>
              <Input value={editGstin} onChange={(e) => setEditGstin(e.target.value.toUpperCase())} placeholder="33ABCDE1234F1Z5" />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                rows={3}
                placeholder="Add auditor remarks"
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
              />
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
