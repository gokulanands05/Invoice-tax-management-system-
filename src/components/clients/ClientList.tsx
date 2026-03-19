import { useState } from 'react';
import { Client } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Eye, Edit, Trash2, Plus, Mail, Phone, FileText } from 'lucide-react';
import { CreateClientDialog } from './CreateClientDialog';
import { useAuditData } from '@/contexts/AuditDataContext';
import { formatCurrencyINR } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function ClientList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editData, setEditData] = useState({ name: '', company: '', email: '', phone: '', address: '', gstin: '' });
  const { clients, addClient, updateClient, deleteClient } = useAuditData();
  const { toast } = useToast();
  const { user } = useAuth();

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClient = (newClient: Client) => {
    void addClient(newClient);
  };

  const handleDeleteClient = async (clientId: string, company: string) => {
    try {
      await deleteClient(clientId);
      toast({
        title: 'Client removed',
        description: `${company} was deleted successfully.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to delete client.';
      toast({ title: 'Delete failed', description: message, variant: 'destructive' });
    }
  };

  const openViewClient = (client: Client) => {
    setSelectedClient(client);
    setIsViewOpen(true);
  };

  const openEditClient = (client: Client) => {
    setSelectedClient(client);
    setEditData({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      address: client.address,
      gstin: client.gstin,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedClient) return;

    const name = editData.name.trim();
    const company = editData.company.trim();
    const email = editData.email.trim().toLowerCase();
    const phone = editData.phone.trim();
    const address = editData.address.trim();
    const gstin = editData.gstin.trim().toUpperCase();

    if (!name || !company || !email) {
      toast({ title: 'Invalid input', description: 'Name, company and email are required.', variant: 'destructive' });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast({ title: 'Invalid input', description: 'Enter a valid email address.', variant: 'destructive' });
      return;
    }

    if (phone && !/^[0-9+\-()\s]{7,20}$/.test(phone)) {
      toast({ title: 'Invalid input', description: 'Phone number format looks invalid.', variant: 'destructive' });
      return;
    }

    if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
      toast({ title: 'Invalid input', description: 'GSTIN format looks invalid.', variant: 'destructive' });
      return;
    }

    try {
      await updateClient({
        ...selectedClient,
        name,
        company,
        email,
        phone,
        address,
        gstin,
      });

      setIsEditOpen(false);
      toast({ title: 'Client updated', description: `${company} has been updated successfully.` });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to update client.';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Clients</h1>
          <p className="text-muted-foreground">Manage organisations under audit review</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Client Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.length === 0 ? (
          <div className="glass-card p-6 md:col-span-2 lg:col-span-3">
            <p className="font-medium">No clients found for this account.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              To appear in app, client rows must use your current auth user id as owner_id.
            </p>
            <p className="mt-2 text-xs text-muted-foreground break-all">Current account id: {user?.id || 'Unavailable'}</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div key={client.id} className="glass-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.company}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => openViewClient(client)}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => openEditClient(client)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive"
                      onClick={() => {
                        void handleDeleteClient(client.id, client.company);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {client.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {client.phone}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Billed</p>
                  <p className="font-semibold">{formatCurrencyINR(client.totalBilled)}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className={client.pendingAmount > 0 ? "font-semibold text-warning" : "font-semibold text-success"}>
                    {formatCurrencyINR(client.pendingAmount)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{client.invoiceCount}</Badge>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <CreateClientDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        onSubmit={handleAddClient}
      />

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Name:</span> {selectedClient.name}</p>
              <p><span className="font-medium">Company:</span> {selectedClient.company}</p>
              <p><span className="font-medium">Email:</span> {selectedClient.email}</p>
              <p><span className="font-medium">Phone:</span> {selectedClient.phone || 'N/A'}</p>
              <p><span className="font-medium">GSTIN:</span> {selectedClient.gstin || 'N/A'}</p>
              <p><span className="font-medium">Address:</span> {selectedClient.address || 'N/A'}</p>
              <p><span className="font-medium">Outstanding:</span> {formatCurrencyINR(selectedClient.pendingAmount)}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editData.name} onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={editData.company} onChange={(e) => setEditData((prev) => ({ ...prev, company: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editData.email} onChange={(e) => setEditData((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={editData.phone} onChange={(e) => setEditData((prev) => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea rows={2} value={editData.address} onChange={(e) => setEditData((prev) => ({ ...prev, address: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>GSTIN</Label>
              <Input value={editData.gstin} onChange={(e) => setEditData((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={() => { void handleSaveEdit(); }}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
