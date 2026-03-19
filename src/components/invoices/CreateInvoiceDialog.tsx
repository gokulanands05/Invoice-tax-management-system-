import { useState, useEffect } from 'react';
import { Invoice, InvoiceItem } from '@/types/invoice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuditData } from '@/contexts/AuditDataContext';
import { formatCurrencyINR } from '@/lib/formatters';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (invoice: Invoice) => void;
  initialData?: Partial<Invoice>;
}

export function CreateInvoiceDialog({ open, onOpenChange, onSubmit, initialData }: CreateInvoiceDialogProps) {
  const { toast } = useToast();
  const { clients } = useAuditData();
  const [selectedClient, setSelectedClient] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<Partial<InvoiceItem>[]>([
    { description: '', quantity: 1, rate: 0 }
  ]);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData && open) {
      if (initialData.clientName) {
        const client = clients.find(c =>
          c.company.toLowerCase().includes(initialData.clientName!.toLowerCase()) ||
          initialData.clientName!.toLowerCase().includes(c.company.toLowerCase())
        );
        if (client) setSelectedClient(client.id);
      }

      if (initialData.dueDate) {
        setDueDate(new Date(initialData.dueDate).toISOString().split('T')[0]);
      }

      if (initialData.items && initialData.items.length > 0) {
        setItems(initialData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate
        })));
      }
    }
  }, [clients, initialData, open]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.rate || 0);
    }, 0);
    const tax = subtotal * 0.15; // 15% tax
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleSubmit = () => {
    const client = clients.find(c => c.id === selectedClient);
    if (!client || !dueDate) {
      toast({
        title: "Invalid input",
        description: "Please select a client and due date.",
        variant: "destructive"
      });
      return;
    }

    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      toast({
        title: "Invalid input",
        description: "Due date is invalid.",
        variant: "destructive"
      });
      return;
    }

    const hasInvalidItem = items.some((item) => {
      const description = String(item.description || '').trim();
      const quantity = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      return !description || quantity <= 0 || rate < 0;
    });

    if (hasInvalidItem) {
      toast({
        title: "Invalid input",
        description: "Each bill item needs description, quantity > 0 and rate >= 0.",
        variant: "destructive"
      });
      return;
    }

    const { subtotal, tax, total } = calculateTotal();

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      clientId: client.id,
      clientName: client.company,
      amount: subtotal,
      taxAmount: tax,
      totalAmount: total,
      status: 'pending',
      dueDate: parsedDueDate,
      createdAt: new Date(),
      items: items.map((item, index) => ({
        id: String(index + 1),
        description: item.description || '',
        quantity: item.quantity || 0,
        rate: item.rate || 0,
        amount: (item.quantity || 0) * (item.rate || 0),
      })),
    };

    onSubmit(newInvoice);
    onOpenChange(false);

    // Reset form
    setSelectedClient('');
    setDueDate('');
    setItems([{ description: '', quantity: 1, rate: 0 }]);

    toast({
      title: "Invoice Created",
      description: `Bill ${newInvoice.invoiceNumber} has been created successfully.`,
    });
  };

  const { subtotal, tax, total } = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Create Engagement Bill</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Bill Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                    className="w-28"
                  />
                  <span className="w-24 text-right font-medium">
                    {formatCurrencyINR((item.quantity || 0) * (item.rate || 0))}
                  </span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrencyINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST / Tax (15%)</span>
              <span>{formatCurrencyINR(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="gradient-text">{formatCurrencyINR(total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Create Bill
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
