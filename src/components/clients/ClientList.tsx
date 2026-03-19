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

export function ClientList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { clients, addClient, deleteClient } = useAuditData();
  const { toast } = useToast();

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

  const showComingSoon = () => {
    toast({
      title: 'Coming soon',
      description: 'This action is not implemented yet.',
    });
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
        {filteredClients.map((client) => (
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
                  <DropdownMenuItem className="cursor-pointer" onClick={showComingSoon}>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={showComingSoon}>
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
        ))}
      </div>

      <CreateClientDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        onSubmit={handleAddClient}
      />
    </div>
  );
}
